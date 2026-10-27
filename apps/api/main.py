import os
import json
import uuid
import datetime
from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from . import models, schemas, database, scanner, parser, report
from .engines import risk, quantum, mosca, pqc, compliance, migration, scoring
from .auth import get_current_user, get_user_scan, get_optional_current_user
from .auth_routes import router as auth_router
from .migrations import run_migrations

# Run safe additive database migrations at startup
try:
    run_migrations()
except Exception as e:
    import logging
    logging.getLogger("ecdat.main").error(f"Startup migration warning: {e}", exc_info=True)

app = FastAPI(title="ECDAT API")

# Configure CORS with credentials support
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Authentication Router (/api/auth/signup, /api/auth/login, etc.)
app.include_router(auth_router)

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
        
        # Check if it looks like a remote git URL or owner/repo GitHub shorthand
        is_shorthand_github = False
        if not os.path.exists(target):
            import re
            if re.match(r"^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$", target):
                is_shorthand_github = True

        is_remote = (
            target.startswith("http://") or 
            target.startswith("https://") or 
            target.startswith("git@") or 
            target.startswith("github.com") or 
            target.startswith("gitlab.com") or 
            target.startswith("bitbucket.org") or
            is_shorthand_github
        )
        
        if is_remote:
            if is_shorthand_github:
                target = f"https://github.com/{target}.git"
            elif not (target.startswith("http://") or target.startswith("https://") or target.startswith("git@")):
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
        scan.files_scanned = raw_out.get("summary", {}).get("filesScanned", raw_out.get("filesScanned", 0))
        scan.lines_scanned = raw_out.get("summary", {}).get("linesScanned", raw_out.get("linesScanned", 0))
        scan.scan_duration_ms = raw_out.get("summary", {}).get("scanDurationMs", raw_out.get("scanDurationMs", 0))
        
        scan.status = "ANALYZING"
        db.commit()
        
        assets = parser.parse_cryptoscan_output(scan.id, raw_out)
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
        
        # Overall Risk Score
        ov_score, ov_level = risk.calculate_overall_risk(assets)
        scan.overall_risk_score = ov_score
        scan.overall_risk_level = ov_level
        
        # PQC Readiness Score
        p_score, p_level = pqc.calculate_pqc_readiness(assets)
        scan.pqc_readiness_score = p_score
        scan.pqc_readiness_level = p_level
        scan.migration_readiness_score = p_score
        scan.migration_readiness_level = p_level
        
        # Compliance Evaluation
        comp_results = compliance.evaluate_compliance(scan.id, assets)
        db.add_all(comp_results)
        
        # Recommendations & Migration Plan
        pqc_recs = pqc.generate_pqc_recommendations(scan.id, assets)
        mig_plan = migration.generate_migration_plan(scan.id, assets, pqc_recs)
        db.add_all(mig_plan)
        
        # Summary counts
        scan.total_findings = len(assets)
        scan.critical_count = sum(1 for a in assets if a.severity == "CRITICAL")
        scan.high_count = sum(1 for a in assets if a.severity == "HIGH")
        scan.medium_count = sum(1 for a in assets if a.severity == "MEDIUM")
        scan.low_count = sum(1 for a in assets if a.severity == "LOW")
        scan.info_count = sum(1 for a in assets if a.severity == "INFO")
        
        scan.quantum_vulnerable_count = sum(1 for a in assets if a.quantum_status == "VULNERABLE")
        scan.quantum_safe_count = sum(1 for a in assets if a.quantum_status == "SAFE")
        scan.quantum_partial_count = sum(1 for a in assets if a.quantum_status == "PARTIAL")
        
        scan.pqc_count = sum(1 for a in assets if a.quantum_status == "SAFE")
        scan.hybrid_count = sum(1 for a in assets if "HYBRID" in (a.algorithm or "").upper() or "HYBRID" in (a.migration_status or "").upper())
        
        scan.status = "COMPLETED"
        scan.completed_at = datetime.datetime.utcnow()
        db.commit()
        
    except Exception as e:
        scan.status = "FAILED"
        scan.error_message = str(e)
        db.commit()
    finally:
        if is_remote and os.path.exists(work_dir):
            import shutil
            shutil.rmtree(work_dir, ignore_errors=True)
        db.close()

# Public Health Check Endpoints (no authentication required)
@app.get("/health")
def health_root():
    return {"status": "ok"}

@app.get("/api/health")
def health_api():
    return {"status": "ok"}

# Projects Endpoints (User-Scoped)
@app.post("/api/projects", response_model=schemas.Project)
def create_project(proj: schemas.ProjectCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_proj = models.Project(**proj.dict(), user_id=current_user.id)
    db.add(db_proj)
    db.commit()
    db.refresh(db_proj)
    return db_proj

@app.get("/api/projects")
def list_projects(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Project).filter(models.Project.user_id == current_user.id).all()

@app.get("/api/projects/{id}")
def get_project(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(models.Project).filter(models.Project.id == id, models.Project.user_id == current_user.id).first()
    if not p: raise HTTPException(404)
    return p

# Scans Endpoints (Strict Multi-User Isolation)
@app.post("/api/scans")
def create_scan(scan_in: schemas.ScanCreate, bg_tasks: BackgroundTasks, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = (scan_in.repository_url or scan_in.target_path or scan_in.path or scan_in.url or "").strip()
    scan = models.Scan(
        user_id=current_user.id,
        project_id=scan_in.project_id,
        repository_url=target,
        branch=scan_in.branch,
        status="QUEUED"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    bg_tasks.add_task(scan_pipeline, scan.id, target, scan_in.branch, database.SessionLocal())
    return {"scan_id": scan.id}

@app.get("/api/scans")
def list_scans(current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    """Returns the authenticated user's private scans, or public demo scans for guests."""
    if current_user:
        return (
            db.query(models.Scan)
            .filter((models.Scan.user_id == current_user.id) | (models.Scan.user_id == "dev_user") | (models.Scan.user_id == None))
            .order_by(models.Scan.id.desc())
            .all()
        )
    return (
        db.query(models.Scan)
        .filter((models.Scan.user_id == "dev_user") | (models.Scan.user_id == None))
        .order_by(models.Scan.id.desc())
        .all()
    )

@app.get("/api/scans/{id}")
def get_scan(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    return get_user_scan(id, current_user, db)

@app.get("/api/scans/{id}/status")
def get_scan_status(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    s = get_user_scan(id, current_user, db)
    return {"status": s.status, "error_message": s.error_message}

@app.get("/api/scans/{id}/summary")
def get_scan_summary(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    s = get_user_scan(id, current_user, db)
    return {
        "overall_risk_score": s.overall_risk_score,
        "overall_risk_level": s.overall_risk_level,
        "total_findings": s.total_findings,
        "critical_count": s.critical_count
    }

@app.get("/api/scans/{id}/assets")
def get_scan_assets(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db),
    severity: Optional[str] = None, quantum_status: Optional[str] = None, asset_type: Optional[str] = None,
    search: Optional[str] = None, limit: Optional[int] = None, offset: int = 0):
    get_user_scan(id, current_user, db)
    q = db.query(models.CryptoAsset).filter(models.CryptoAsset.scan_id == id)
    if severity and severity != "ALL": q = q.filter(models.CryptoAsset.severity == severity)
    if quantum_status and quantum_status != "ALL": q = q.filter(models.CryptoAsset.quantum_status == quantum_status)
    if asset_type and asset_type != "ALL": q = q.filter(models.CryptoAsset.asset_type == asset_type)
    if search:
        s_term = f"%{search}%"
        q = q.filter(
            (models.CryptoAsset.algorithm.ilike(s_term)) |
            (models.CryptoAsset.file_path.ilike(s_term)) |
            (models.CryptoAsset.category.ilike(s_term))
        )
    if limit is not None:
        q = q.limit(limit).offset(offset)
    return q.all()

@app.get("/api/scans/{id}/assets/{asset_id}")
def get_asset(id: int, asset_id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    get_user_scan(id, current_user, db)
    a = db.query(models.CryptoAsset).filter(models.CryptoAsset.id == asset_id, models.CryptoAsset.scan_id == id).first()
    if not a: raise HTTPException(404)
    return a

@app.get("/api/scans/{id}/findings")
def get_findings(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db),
    severity: Optional[str] = None, search: Optional[str] = None, limit: Optional[int] = 100, offset: int = 0):
    return get_scan_assets(id, current_user, db, severity=severity, search=search, limit=limit, offset=offset)

@app.get("/api/scans/{id}/inventory")
def get_inventory(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db),
    asset_type: Optional[str] = None, quantum_status: Optional[str] = None, search: Optional[str] = None, limit: Optional[int] = 100, offset: int = 0):
    return get_scan_assets(id, current_user, db, asset_type=asset_type, quantum_status=quantum_status, search=search, limit=limit, offset=offset)

@app.get("/api/scans/{id}/algorithms")
def get_algorithms(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    get_user_scan(id, current_user, db)
    results = db.query(
        models.CryptoAsset.algorithm,
        func.count(models.CryptoAsset.id)
    ).filter(models.CryptoAsset.scan_id == id).group_by(models.CryptoAsset.algorithm).all()
    return {algo or "UNKNOWN": count for algo, count in results}

@app.get("/api/scans/{id}/risk")
def get_risk(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    s = get_user_scan(id, current_user, db)
    return {"score": s.overall_risk_score, "level": s.overall_risk_level}

@app.get("/api/scans/{id}/quantum")
def get_quantum(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    s = get_user_scan(id, current_user, db)
    return {
        "vulnerable": s.quantum_vulnerable_count,
        "safe": s.quantum_safe_count,
        "partial": s.quantum_partial_count
    }

@app.get("/api/scans/{id}/mosca")
def get_mosca(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    get_user_scan(id, current_user, db)
    results = db.query(
        models.CryptoAsset.mosca_risk,
        func.count(models.CryptoAsset.id)
    ).filter(models.CryptoAsset.scan_id == id).group_by(models.CryptoAsset.mosca_risk).all()
    return {r or "UNKNOWN": count for r, count in results}

@app.get("/api/scans/{id}/pqc")
def get_scan_pqc(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    s = get_user_scan(id, current_user, db)
    return {"score": s.pqc_readiness_score, "level": s.pqc_readiness_level}

@app.get("/api/scans/{id}/compliance")
def get_scan_compliance(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    get_user_scan(id, current_user, db)
    return db.query(models.ComplianceResult).filter(models.ComplianceResult.scan_id == id).all()

@app.get("/api/scans/{id}/recommendations")
def get_recommendations(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    get_user_scan(id, current_user, db)
    return db.query(models.Recommendation).filter(models.Recommendation.scan_id == id).all()

@app.get("/api/scans/{id}/migration")
def get_migration(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    return get_recommendations(id, current_user, db)

@app.get("/api/scans/{id}/report")
def get_report(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    s = get_user_scan(id, current_user, db)
    assets = db.query(models.CryptoAsset).filter(models.CryptoAsset.scan_id == id).limit(500).all()
    comp = db.query(models.ComplianceResult).filter(models.ComplianceResult.scan_id == id).all()
    recs = db.query(models.Recommendation).filter(models.Recommendation.scan_id == id).all()
    scs = scoring.calculate_category_scores(assets)
    return report.generate_report(s, assets, comp, recs, scs)

@app.get("/api/scans/{id}/cbom")
def get_cbom(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    get_user_scan(id, current_user, db)
    results = db.query(
        models.CryptoAsset.algorithm,
        func.count(models.CryptoAsset.id)
    ).filter(models.CryptoAsset.scan_id == id).group_by(models.CryptoAsset.algorithm).all()
    return {"bomFormat": "CycloneDX", "components": [{"name": algo, "count": count} for algo, count in results if algo]}

@app.get("/api/scans/{id}/scores")
def get_scores(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    get_user_scan(id, current_user, db)
    assets = db.query(
        models.CryptoAsset.id,
        models.CryptoAsset.severity,
        models.CryptoAsset.quantum_status,
        models.CryptoAsset.algorithm,
        models.CryptoAsset.category,
        models.CryptoAsset.asset_type,
        models.CryptoAsset.key_size,
        models.CryptoAsset.finding_type,
        models.CryptoAsset.cryptoscan_id
    ).filter(models.CryptoAsset.scan_id == id).limit(2000).all()
    return scoring.calculate_category_scores(assets)

@app.get("/api/scans/{id}/evidence")
def get_evidence(id: int, current_user: Optional[models.User] = Depends(get_optional_current_user), db: Session = Depends(get_db), limit: int = 50):
    get_user_scan(id, current_user, db)
    assets = db.query(models.CryptoAsset).filter(models.CryptoAsset.scan_id == id).limit(limit).all()
    return [{"asset_id": a.id, "evidence": a.evidence, "context": a.context} for a in assets]

@app.patch("/api/assets/{id}")
def update_asset(id: int, update: schemas.AssetUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(models.CryptoAsset).filter(models.CryptoAsset.id == id).first()
    if not a: raise HTTPException(404)
    # Strict ownership check on parent scan
    get_user_scan(a.scan_id, current_user, db)

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
def compare_scans(current: int, previous: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    curr = get_user_scan(current, current_user, db)
    prev = get_user_scan(previous, current_user, db)
    return {
        "current_id": current,
        "previous_id": previous,
        "risk_change": (curr.overall_risk_score or 0) - (prev.overall_risk_score or 0),
        "new_findings": curr.total_findings - prev.total_findings
    }

# =========================================================================
# AI AGENT & DURABLE TASK CONTINUITY ROUTES (USER-SCOPED)
# =========================================================================
from .agent_service import agent_service
from .hindsight_service import hindsight_service
from . import task_worker
from .agent_tools import tool_list_agent_tasks

@app.on_event("startup")
def on_startup():
    task_worker.startup_recover_interrupted_tasks()

@app.post("/api/agent/chat", response_model=schemas.AgentChatResponse)
def agent_chat(req: schemas.AgentChatRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Derives user identity exclusively from verified session authentication.
    Prevents cross-user memory leakage and scan inspection.
    """
    user_id = current_user.id
    result = agent_service.process_chat(
        message=req.message,
        db=db,
        user_id=user_id,
        session_id=req.session_id or f"session_{user_id}"
    )

    return schemas.AgentChatResponse(
        response=result.get("content", ""),
        user_id=user_id,
        session_id=result.get("session_id", f"session_{user_id}"),
        task_id=result.get("task_id"),
        scan_id=result.get("scan_id"),
        recalled_memories=result.get("recalled_memories", []),
        verified_data=result.get("verified_data"),
        links=result.get("links", []),
        status=result.get("status", "success")
    )

@app.get("/api/agent/tasks")
def list_agent_tasks(limit: int = 10, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns only tasks owned by the authenticated user."""
    return tool_list_agent_tasks(db, user_id=current_user.id, limit=limit)

@app.get("/api/agent/tasks/{task_id}")
def get_agent_task(task_id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(models.AgentTask).filter(models.AgentTask.task_id == task_id).first()
    if not t:
        raise HTTPException(404, "Task not found")
    if t.user_id and t.user_id != current_user.id:
        raise HTTPException(403, "Forbidden: Task belongs to another user")
    return t

@app.post("/api/agent/tasks/{task_id}/recover")
def recover_agent_task(task_id: str, bg_tasks: BackgroundTasks, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(models.AgentTask).filter(models.AgentTask.task_id == task_id).first()
    if not t:
        raise HTTPException(404, "Task not found")
    if t.user_id and t.user_id != current_user.id:
        raise HTTPException(403, "Forbidden: Task belongs to another user")
    return task_worker.recover_agent_task(task_id, bg_tasks=bg_tasks)

@app.get("/api/agent/memories")
def get_user_memories(current_user: models.User = Depends(get_current_user)):
    """Retrieves memories strictly scoped to the authenticated user's ID."""
    return {
        "user_id": current_user.id,
        "memories": hindsight_service.retrieve_conversation_context(user_id=current_user.id)
    }
