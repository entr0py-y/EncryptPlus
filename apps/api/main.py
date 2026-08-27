import os
import json
import uuid
import datetime
from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from . import models, schemas, database, scanner, parser, report
from .engines import risk, quantum, mosca, pqc, compliance, migration, scoring

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ECDAT API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def scan_pipeline(scan_id: int, target: str, branch: str, db: Session):
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan:
        return
        
    work_dir = "/tmp/ecdat_work_" + str(uuid.uuid4())
    is_remote = False
    try:
        os.makedirs(work_dir, exist_ok=True)
        target = (target or "").strip()
        
        # Check if it looks like a remote git URL
        is_remote = (
            target.startswith("http://") or 
            target.startswith("https://") or 
            target.startswith("git@") or 
            target.startswith("github.com") or 
            target.startswith("gitlab.com") or 
            target.startswith("bitbucket.org")
        )
        
        if is_remote:
            if not (target.startswith("http://") or target.startswith("https://") or target.startswith("git@")):
                target = "https://" + target
                
            scan.repository_url = target
            scan.status = "CLONING"
            db.commit()
            
            try:
                scanner.clone_repository(target, work_dir, branch)
            except Exception as clone_err:
                scan.status = "FAILED"
                scan.error_message = f"Failed to clone git repository ({target}): {str(clone_err)}"
                db.commit()
                return
                
            scan_target = work_dir
        else:
            # Local path
            local_path = target
            if local_path and not os.path.isabs(local_path):
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                candidate = os.path.join(base_dir, local_path)
                if os.path.exists(candidate):
                    local_path = candidate
                    
            if not local_path or not os.path.exists(local_path):
                scan.status = "FAILED"
                scan.error_message = f"Path or URL not found / invalid: '{target}'"
                db.commit()
                return
            scan_target = local_path
            
        scan.status = "SCANNING"
        db.commit()
        
        out_file = os.path.join(work_dir, f"{scan_id}_out.json")
        try:
            raw_out = scanner.execute_cryptoscan(scan_target, out_file)
        except Exception as e:
            scan.status = "FAILED"
            scan.error_message = f"CryptoScan execution error: {str(e)}"
            db.commit()
            return
            
        scan.raw_scan_output = json.dumps(raw_out)
        scan.files_scanned = raw_out.get("filesScanned", 0)
        scan.lines_scanned = raw_out.get("linesScanned", 0)
        scan.scan_duration_ms = raw_out.get("scanDuration", 0) // 1_000_000  # nanoseconds to ms
        
        scan.status = "ANALYZING"
        db.commit()
        
        assets = parser.parse_cryptoscan_output(scan_id, raw_out)
        db.add_all(assets)
        db.flush()
        
        scan.status = "ASSESSING"
        db.commit()
        
        for a in assets:
            quantum.assess_quantum_risk(a)
            mosca.assess_mosca_risk(a)
            score, level, comps = risk.calculate_asset_risk(a)
            a.risk_score = score
            a.risk_level = level
            
        db.commit()
        
        ov_score, ov_level = risk.calculate_overall_risk(assets)
        scan.overall_risk_score = ov_score
        scan.overall_risk_level = ov_level
        
        p_score, p_level = pqc.calculate_pqc_readiness(assets)
        scan.pqc_readiness_score = p_score
        scan.pqc_readiness_level = p_level
        
        comp_results = compliance.evaluate_compliance(scan_id, assets)
        db.add_all(comp_results)
        
        pqc_recs = pqc.generate_pqc_recommendations(scan_id, assets)
        mig_plan = migration.generate_migration_plan(scan_id, assets, pqc_recs)
        db.add_all(mig_plan)
        
        scan.total_findings = len(assets)
        scan.critical_count = sum(1 for a in assets if a.severity == "CRITICAL")
        scan.high_count = sum(1 for a in assets if a.severity == "HIGH")
        scan.medium_count = sum(1 for a in assets if a.severity == "MEDIUM")
        scan.low_count = sum(1 for a in assets if a.severity == "LOW")
        scan.info_count = sum(1 for a in assets if a.severity == "INFO")
        
        scan.quantum_vulnerable_count = sum(1 for a in assets if a.quantum_status == "VULNERABLE")
        scan.quantum_safe_count = sum(1 for a in assets if a.quantum_status == "SAFE")
        scan.quantum_partial_count = sum(1 for a in assets if a.quantum_status == "PARTIAL")
        
        scan.status = "GENERATING_REPORT"
        db.commit()
        
        scan.status = "COMPLETED"
        scan.completed_at = datetime.datetime.utcnow()
        db.commit()
        
    except Exception as e:
        db.rollback()
        scan.status = "FAILED"
        scan.error_message = str(e)
        db.commit()
    finally:
        if is_remote and os.path.exists(work_dir):
            try:
                shutil.rmtree(work_dir, ignore_errors=True)
            except Exception:
                pass

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/projects", response_model=schemas.Project)
def create_project(proj: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_proj = models.Project(**proj.dict())
    db.add(db_proj)
    db.commit()
    db.refresh(db_proj)
    return db_proj

@app.get("/api/projects")
def list_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()

@app.get("/api/projects/{id}")
def get_project(id: int, db: Session = Depends(get_db)):
    p = db.query(models.Project).filter(models.Project.id == id).first()
    if not p: raise HTTPException(404)
    return p

@app.post("/api/scans")
def create_scan(scan_in: schemas.ScanCreate, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    target = (scan_in.repository_url or scan_in.target_path or scan_in.path or scan_in.url or "").strip()
    scan = models.Scan(project_id=scan_in.project_id, repository_url=target, branch=scan_in.branch, status="QUEUED")
    db.add(scan)
    db.commit()
    db.refresh(scan)
    bg_tasks.add_task(scan_pipeline, scan.id, target, scan_in.branch, database.SessionLocal())
    return {"scan_id": scan.id}

@app.get("/api/scans")
def list_scans(db: Session = Depends(get_db)):
    return db.query(models.Scan).all()

@app.get("/api/scans/{id}")
def get_scan(id: int, db: Session = Depends(get_db)):
    s = db.query(models.Scan).filter(models.Scan.id == id).first()
    if not s: raise HTTPException(404)
    return s

@app.get("/api/scans/{id}/status")
def get_scan_status(id: int, db: Session = Depends(get_db)):
    s = get_scan(id, db)
    return {"status": s.status, "error_message": s.error_message}

@app.get("/api/scans/{id}/summary")
def get_scan_summary(id: int, db: Session = Depends(get_db)):
    s = get_scan(id, db)
    return {
        "overall_risk_score": s.overall_risk_score,
        "overall_risk_level": s.overall_risk_level,
        "total_findings": s.total_findings,
        "critical_count": s.critical_count
    }

@app.get("/api/scans/{id}/assets")
def get_scan_assets(id: int, db: Session = Depends(get_db),
    severity: Optional[str] = None, quantum_status: Optional[str] = None, asset_type: Optional[str] = None):
    q = db.query(models.CryptoAsset).filter(models.CryptoAsset.scan_id == id)
    if severity: q = q.filter(models.CryptoAsset.severity == severity)
    if quantum_status: q = q.filter(models.CryptoAsset.quantum_status == quantum_status)
    if asset_type: q = q.filter(models.CryptoAsset.asset_type == asset_type)
    return q.all()

@app.get("/api/scans/{id}/assets/{asset_id}")
def get_asset(id: int, asset_id: int, db: Session = Depends(get_db)):
    a = db.query(models.CryptoAsset).filter(models.CryptoAsset.id == asset_id, models.CryptoAsset.scan_id == id).first()
    if not a: raise HTTPException(404)
    return a

@app.get("/api/scans/{id}/findings")
def get_findings(id: int, db: Session = Depends(get_db)):
    return get_scan_assets(id, db)

@app.get("/api/scans/{id}/inventory")
def get_inventory(id: int, db: Session = Depends(get_db)):
    return get_scan_assets(id, db)

@app.get("/api/scans/{id}/algorithms")
def get_algorithms(id: int, db: Session = Depends(get_db)):
    assets = get_scan_assets(id, db)
    algos = {}
    for a in assets:
        alg = a.algorithm or "UNKNOWN"
        algos[alg] = algos.get(alg, 0) + 1
    return algos

@app.get("/api/scans/{id}/risk")
def get_risk(id: int, db: Session = Depends(get_db)):
    s = get_scan(id, db)
    return {"score": s.overall_risk_score, "level": s.overall_risk_level}

@app.get("/api/scans/{id}/quantum")
def get_quantum(id: int, db: Session = Depends(get_db)):
    s = get_scan(id, db)
    return {
        "vulnerable": s.quantum_vulnerable_count,
        "safe": s.quantum_safe_count,
        "partial": s.quantum_partial_count
    }

@app.get("/api/scans/{id}/mosca")
def get_mosca(id: int, db: Session = Depends(get_db)):
    assets = get_scan_assets(id, db)
    res = {}
    for a in assets:
        r = a.mosca_risk or "UNKNOWN"
        res[r] = res.get(r, 0) + 1
    return res

@app.get("/api/scans/{id}/pqc")
def get_scan_pqc(id: int, db: Session = Depends(get_db)):
    s = get_scan(id, db)
    return {"score": s.pqc_readiness_score, "level": s.pqc_readiness_level}

@app.get("/api/scans/{id}/compliance")
def get_scan_compliance(id: int, db: Session = Depends(get_db)):
    return db.query(models.ComplianceResult).filter(models.ComplianceResult.scan_id == id).all()

@app.get("/api/scans/{id}/recommendations")
def get_recommendations(id: int, db: Session = Depends(get_db)):
    return db.query(models.Recommendation).filter(models.Recommendation.scan_id == id).all()

@app.get("/api/scans/{id}/migration")
def get_migration(id: int, db: Session = Depends(get_db)):
    return get_recommendations(id, db)

@app.get("/api/scans/{id}/report")
def get_report(id: int, db: Session = Depends(get_db)):
    s = get_scan(id, db)
    assets = get_scan_assets(id, db)
    comp = get_scan_compliance(id, db)
    recs = get_recommendations(id, db)
    scs = scoring.calculate_category_scores(assets)
    return report.generate_report(s, assets, comp, recs, scs)

@app.get("/api/scans/{id}/cbom")
def get_cbom(id: int, db: Session = Depends(get_db)):
    assets = get_scan_assets(id, db)
    return {"bomFormat": "CycloneDX", "components": [{"name": a.algorithm} for a in assets if a.algorithm]}

@app.get("/api/scans/{id}/scores")
def get_scores(id: int, db: Session = Depends(get_db)):
    assets = get_scan_assets(id, db)
    return scoring.calculate_category_scores(assets)

@app.get("/api/scans/{id}/evidence")
def get_evidence(id: int, db: Session = Depends(get_db)):
    assets = get_scan_assets(id, db)
    return [{"asset_id": a.id, "evidence": a.evidence, "context": a.context} for a in assets]

@app.patch("/api/assets/{id}")
def update_asset(id: int, update: schemas.AssetUpdate, db: Session = Depends(get_db)):
    a = db.query(models.CryptoAsset).filter(models.CryptoAsset.id == id).first()
    if not a: raise HTTPException(404)
    update_data = update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(a, key, value)
    
    # re-evaluate risk and mosca
    score, level, comps = risk.calculate_asset_risk(a)
    a.risk_score = score
    a.risk_level = level
    mosca.assess_mosca_risk(a)
    
    db.commit()
    return a

@app.get("/api/history/compare")
def compare_scans(current: int, previous: int, db: Session = Depends(get_db)):
    curr = get_scan(current, db)
    prev = get_scan(previous, db)
    return {
        "current_id": current,
        "previous_id": previous,
        "risk_change": (curr.overall_risk_score or 0) - (prev.overall_risk_score or 0),
        "new_findings": curr.total_findings - prev.total_findings
    }
