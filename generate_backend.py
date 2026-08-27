import os

API_DIR = "/Users/erenyeager/Desktop/EncryptPlus/apps/api"
ENGINES_DIR = os.path.join(API_DIR, "engines")

files = {}

files["database.py"] = """
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ecdat.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
"""

files["models.py"] = """
import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    scans = relationship("Scan", back_populates="project")

class Scan(Base):
    __tablename__ = "scans"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    repository_url = Column(String)
    branch = Column(String)
    status = Column(String, default="QUEUED")
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    files_scanned = Column(Integer, default=0)
    lines_scanned = Column(Integer, default=0)
    scan_duration_ms = Column(Integer, default=0)
    
    overall_risk_score = Column(Float, nullable=True)
    overall_risk_level = Column(String, nullable=True)
    pqc_readiness_score = Column(Float, nullable=True)
    pqc_readiness_level = Column(String, nullable=True)
    migration_readiness_score = Column(Float, nullable=True)
    migration_readiness_level = Column(String, nullable=True)
    
    total_findings = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    
    quantum_vulnerable_count = Column(Integer, default=0)
    quantum_safe_count = Column(Integer, default=0)
    quantum_partial_count = Column(Integer, default=0)
    
    pqc_count = Column(Integer, default=0)
    hybrid_count = Column(Integer, default=0)
    
    raw_scan_output = Column(Text, nullable=True)
    
    project = relationship("Project", back_populates="scans")
    assets = relationship("CryptoAsset", back_populates="scan", cascade="all, delete-orphan")
    compliance_results = relationship("ComplianceResult", back_populates="scan", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="scan", cascade="all, delete-orphan")

class CryptoAsset(Base):
    __tablename__ = "crypto_assets"
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"))
    asset_type = Column(String)
    algorithm = Column(String, nullable=True)
    algorithm_variant = Column(String, nullable=True)
    category = Column(String, nullable=True)
    primitive = Column(String, nullable=True)
    key_size = Column(Integer, nullable=True)
    mode = Column(String, nullable=True)
    parameter_set = Column(String, nullable=True)
    language = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    line_start = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)
    column = Column(Integer, nullable=True)
    match_text = Column(String, nullable=True)
    context = Column(Text, nullable=True)
    source_context_json = Column(Text, nullable=True)
    component = Column(String, nullable=True)
    dependency_name = Column(String, nullable=True)
    dependency_version = Column(String, nullable=True)
    finding_type = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    evidence = Column(Text, nullable=True)
    confidence = Column(String, nullable=True)
    purpose = Column(String, nullable=True)
    
    quantum_status = Column(String, nullable=True)
    migration_status = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    classical_bits = Column(Integer, nullable=True)
    quantum_security_level = Column(Integer, nullable=True)
    
    data_sensitivity = Column(String, default="UNKNOWN")
    data_lifetime = Column(String, default="UNKNOWN")
    migration_time = Column(String, default="UNKNOWN")
    business_criticality = Column(String, default="UNKNOWN")
    internet_exposure = Column(Boolean, default=False)
    
    risk_score = Column(Float, nullable=True)
    risk_level = Column(String, nullable=True)
    mosca_risk = Column(String, nullable=True)
    
    description = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    impact = Column(String, nullable=True)
    effort = Column(String, nullable=True)
    references_json = Column(Text, nullable=True)
    tags_json = Column(Text, nullable=True)
    oid = Column(String, nullable=True)
    cryptoscan_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    scan = relationship("Scan", back_populates="assets")

class ComplianceResult(Base):
    __tablename__ = "compliance_results"
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"))
    asset_id = Column(Integer, ForeignKey("crypto_assets.id"), nullable=True)
    framework = Column(String)
    requirement_id = Column(String)
    requirement_name = Column(String)
    status = Column(String)
    evidence = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    
    scan = relationship("Scan", back_populates="compliance_results")

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"))
    asset_id = Column(Integer, ForeignKey("crypto_assets.id"), nullable=True)
    priority = Column(String)
    title = Column(String)
    description = Column(Text)
    current_algorithm = Column(String, nullable=True)
    recommended_algorithm = Column(String, nullable=True)
    recommended_hybrid = Column(String, nullable=True)
    affected_files_json = Column(Text, nullable=True)
    affected_components_json = Column(Text, nullable=True)
    migration_complexity = Column(String, nullable=True)
    expected_impact = Column(String, nullable=True)
    finding_count = Column(Integer, default=0)
    status = Column(String, default="OPEN")
    
    scan = relationship("Scan", back_populates="recommendations")

class ScanComparison(Base):
    __tablename__ = "scan_comparisons"
    id = Column(Integer, primary_key=True, index=True)
    current_scan_id = Column(Integer, ForeignKey("scans.id"))
    previous_scan_id = Column(Integer, ForeignKey("scans.id"))
    risk_change = Column(Float, nullable=True)
    pqc_readiness_change = Column(Float, nullable=True)
    new_findings_count = Column(Integer, default=0)
    resolved_findings_count = Column(Integer, default=0)
    comparison_data_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
"""

files["schemas.py"] = """
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class ScanCreate(BaseModel):
    project_id: Optional[int] = None
    repository_url: Optional[str] = None
    branch: Optional[str] = None
    target_path: Optional[str] = None

class AssetUpdate(BaseModel):
    data_sensitivity: Optional[str] = None
    data_lifetime: Optional[str] = None
    business_criticality: Optional[str] = None
    internet_exposure: Optional[bool] = None
    migration_time: Optional[str] = None
"""

files["crypto_knowledge.py"] = """
# Static crypto knowledge base
QUANTUM_STATUS = {
    "RSA": "VULNERABLE",
    "ElGamal": "VULNERABLE",
    "DSA": "VULNERABLE",
    "ECDSA": "VULNERABLE",
    "Ed25519": "VULNERABLE",
    "DH": "VULNERABLE",
    "ECDH": "VULNERABLE",
    "AES-128": "PARTIAL",
    "AES-192": "SAFE",
    "AES-256": "SAFE",
    "SHA-1": "VULNERABLE",
    "MD5": "VULNERABLE",
    "SHA-256": "PARTIAL",
    "SHA-384": "SAFE",
    "SHA-512": "SAFE",
    "SHA3-256": "PARTIAL",
    "SHA3-384": "SAFE",
    "SHA3-512": "SAFE",
    "ML-KEM": "SAFE",
    "ML-DSA": "SAFE",
    "SLH-DSA": "SAFE",
}

PQC_RECOMMENDATIONS = {
    "RSA": "ML-KEM-768 or ML-KEM-1024 / ML-DSA-65",
    "DSA": "ML-DSA-65",
    "ECDSA": "ML-DSA-44 or ML-DSA-65",
    "Ed25519": "ML-DSA-44",
    "DH": "ML-KEM-768",
    "ECDH": "ML-KEM-768",
    "AES-128": "AES-256",
    "MD5": "SHA-256 or SHA-3",
    "SHA-1": "SHA-256 or SHA-3",
}
"""

files["scanner.py"] = """
import subprocess
import json
import os
import shutil
import uuid

CRYPTOSCAN_BIN = os.getenv('CRYPTOSCAN_BIN', '/Users/erenyeager/Desktop/EncryptPlus/cryptoscan/cryptoscan')

def execute_cryptoscan(target_path: str, output_file: str) -> dict:
    if not os.path.exists(CRYPTOSCAN_BIN):
        raise RuntimeError(f"CryptoScan binary not found at {CRYPTOSCAN_BIN}")
        
    cmd = [
        CRYPTOSCAN_BIN, 'scan', target_path,
        '--format', 'json',
        '--output', output_file,
        '--verbose',
        '--pretty'
    ]
    
    try:
        subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    except subprocess.TimeoutExpired:
        raise RuntimeError("CryptoScan timeout")
        
    if not os.path.exists(output_file):
        raise RuntimeError("CryptoScan failed to produce output file")
        
    with open(output_file, 'r') as f:
        return json.load(f)

def clone_repository(repo_url: str, target_dir: str, branch: str = None):
    cmd = ['git', 'clone', '--depth', '1']
    if branch:
        cmd.extend(['--branch', branch])
    cmd.extend([repo_url, target_dir])
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=120)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Failed to clone repository: {e.stderr.decode()}")
"""

files["parser.py"] = """
import json
from typing import Dict, Any, List
from .models import CryptoAsset

def parse_cryptoscan_output(scan_id: int, raw_output: dict) -> List[CryptoAsset]:
    assets = []
    findings = raw_output.get("findings", [])
    
    severity_map = {
        0: "INFO",
        1: "LOW",
        2: "MEDIUM",
        3: "HIGH",
        4: "CRITICAL"
    }
    
    for f in findings:
        sev_int = f.get("severity", 0)
        sev_str = severity_map.get(sev_int, "INFO")
        
        asset = CryptoAsset(
            scan_id=scan_id,
            cryptoscan_id=f.get("id"),
            asset_type=f.get("findingType", "UNKNOWN"),
            algorithm=f.get("algorithm"),
            category=f.get("category"),
            primitive=f.get("primitive"),
            key_size=f.get("keySize"),
            language=f.get("language"),
            file_path=f.get("file"),
            line_start=f.get("line"),
            column=f.get("column"),
            match_text=f.get("match"),
            context=f.get("context"),
            source_context_json=json.dumps(f.get("sourceContext")) if f.get("sourceContext") else None,
            finding_type=f.get("type"),
            file_type=f.get("fileType"),
            confidence=f.get("confidence"),
            purpose=f.get("purpose"),
            quantum_status=f.get("quantumRisk", "UNKNOWN"),
            migration_status=f.get("migrationStatus", "UNKNOWN"),
            severity=sev_str,
            description=f.get("description"),
            remediation=f.get("remediation"),
            impact=f.get("impact"),
            effort=f.get("effort"),
            references_json=json.dumps(f.get("references")) if f.get("references") else None,
            tags_json=json.dumps(f.get("tags")) if f.get("tags") else None,
            oid=f.get("oid")
        )
        assets.append(asset)
        
    return assets
"""

files["engines/risk.py"] = """
from ..models import CryptoAsset

def calculate_asset_risk(asset: CryptoAsset) -> tuple:
    components = {}
    score = 0
    
    algo_score = 0
    if asset.severity == 'CRITICAL': algo_score = 25
    elif asset.severity == 'HIGH': algo_score = 20
    elif asset.severity == 'MEDIUM': algo_score = 12
    elif asset.severity == 'LOW': algo_score = 5
    components['algorithm_security'] = algo_score
    score += algo_score
    
    quantum_score = 0
    if asset.quantum_status == 'VULNERABLE': quantum_score = 25
    elif asset.quantum_status == 'PARTIAL': quantum_score = 10
    elif asset.quantum_status == 'UNKNOWN': quantum_score = 15
    components['quantum_vulnerability'] = quantum_score
    score += quantum_score
    
    key_score = 0
    if asset.key_size and asset.key_size > 0:
        if asset.key_size < 1024: key_score = 10
        elif asset.key_size < 2048: key_score = 7
        elif asset.key_size < 4096: key_score = 3
    components['key_strength'] = key_score
    score += key_score
    
    conf_score = 0
    if asset.confidence == 'HIGH': conf_score = 10
    elif asset.confidence == 'MEDIUM': conf_score = 6
    elif asset.confidence == 'LOW': conf_score = 2
    components['detection_confidence'] = conf_score
    score += conf_score
    
    biz_score = 0
    if asset.business_criticality == 'CRITICAL': biz_score = 10
    elif asset.business_criticality == 'HIGH': biz_score = 7
    elif asset.business_criticality == 'MEDIUM': biz_score = 4
    components['business_criticality'] = biz_score
    score += biz_score
    
    data_score = 0
    if asset.data_sensitivity == 'HIGHLY_SENSITIVE': data_score = 10
    elif asset.data_sensitivity == 'SENSITIVE': data_score = 8
    elif asset.data_sensitivity == 'CONFIDENTIAL': data_score = 5
    components['data_sensitivity'] = data_score
    score += data_score
    
    life_score = 0
    if asset.data_lifetime == '10+ years': life_score = 10
    elif asset.data_lifetime == '5-10 years': life_score = 7
    elif asset.data_lifetime == '3-5 years': life_score = 5
    components['data_lifetime'] = life_score
    score += life_score
    
    score = min(score, 100)
    level = 'LOW' if score <= 20 else 'MODERATE' if score <= 40 else 'HIGH' if score <= 60 else 'CRITICAL' if score <= 80 else 'URGENT'
    
    return score, level, components

def calculate_overall_risk(assets: list) -> tuple:
    if not assets:
        return 0.0, 'LOW'
    scores = sorted([a.risk_score for a in assets if a.risk_score is not None], reverse=True)
    if not scores:
        return 0.0, 'LOW'
    top_count = max(1, len(scores) // 5)
    top_avg = sum(scores[:top_count]) / top_count
    rest_avg = sum(scores[top_count:]) / max(1, len(scores) - top_count) if len(scores) > top_count else 0
    overall = top_avg * 0.6 + rest_avg * 0.4
    level = 'LOW' if overall <= 20 else 'MODERATE' if overall <= 40 else 'HIGH' if overall <= 60 else 'CRITICAL' if overall <= 80 else 'URGENT'
    return round(overall, 1), level
"""

files["engines/quantum.py"] = """
from ..crypto_knowledge import QUANTUM_STATUS
from ..models import CryptoAsset

def assess_quantum_risk(asset: CryptoAsset):
    if not asset.algorithm:
        return
        
    algo = asset.algorithm.upper()
    if any(a in algo for a in ["RSA", "ELGAMAL"]):
        asset.quantum_status = "VULNERABLE"
    elif any(a in algo for a in ["DSA", "ECDSA", "ED25519"]):
        asset.quantum_status = "VULNERABLE"
    elif any(a in algo for a in ["DH", "ECDH"]):
        asset.quantum_status = "VULNERABLE"
    elif "AES" in algo:
        if "128" in algo:
            asset.quantum_status = "PARTIAL"
        elif "256" in algo:
            asset.quantum_status = "SAFE"
    elif "SHA-256" in algo or "SHA3-256" in algo:
        asset.quantum_status = "PARTIAL"
    elif "SHA-384" in algo or "SHA-512" in algo or "SHA3-384" in algo or "SHA3-512" in algo:
        asset.quantum_status = "SAFE"
    elif "MD5" in algo or "SHA-1" in algo:
        asset.quantum_status = "VULNERABLE"
    elif any(a in algo for a in ["ML-KEM", "ML-DSA", "SLH-DSA"]):
        asset.quantum_status = "SAFE"
    elif "X25519" in algo and "ML-KEM" in algo:
        asset.quantum_status = "SAFE"
    else:
        # Fallback to map
        for k, v in QUANTUM_STATUS.items():
            if k.upper() in algo:
                asset.quantum_status = v
                break
"""

files["engines/mosca.py"] = """
from ..models import CryptoAsset

def assess_mosca_risk(asset: CryptoAsset, crqc_timeline: int = 10) -> str:
    lifetime_map = {
        "UNKNOWN": 0,
        "< 1 year": 1,
        "1-3 years": 2,
        "3-5 years": 4,
        "5-10 years": 7,
        "10+ years": 15
    }
    
    migration_map = {
        "UNKNOWN": 0,
        "TRIVIAL": 0,
        "LOW": 1,
        "MEDIUM": 3,
        "HIGH": 5,
        "VERY_HIGH": 7
    }
    
    x = lifetime_map.get(asset.data_lifetime, 0)
    y = migration_map.get(asset.migration_time, 0)
    
    z = crqc_timeline
    
    if x + y >= z:
        asset.mosca_risk = "CRITICAL"
        return "CRITICAL"
    elif x + y >= z - 2:
        asset.mosca_risk = "HIGH"
        return "HIGH"
    elif x + y >= z - 5:
        asset.mosca_risk = "MODERATE"
        return "MODERATE"
    else:
        asset.mosca_risk = "LOW"
        return "LOW"
"""

files["engines/pqc.py"] = """
from ..crypto_knowledge import PQC_RECOMMENDATIONS
from ..models import CryptoAsset, Recommendation

def generate_pqc_recommendations(scan_id: int, assets: list) -> list:
    recs = []
    
    for a in assets:
        if a.quantum_status in ["VULNERABLE", "PARTIAL"]:
            algo = a.algorithm if a.algorithm else ""
            rec_algo = None
            for k, v in PQC_RECOMMENDATIONS.items():
                if k.upper() in algo.upper():
                    rec_algo = v
                    break
            
            if rec_algo:
                r = Recommendation(
                    scan_id=scan_id,
                    asset_id=a.id,
                    priority="P1" if a.quantum_status == "VULNERABLE" else "P2",
                    title=f"Migrate {algo} to PQC Safe Algorithm",
                    description=f"Algorithm {algo} is vulnerable to quantum attacks.",
                    current_algorithm=algo,
                    recommended_algorithm=rec_algo,
                    finding_count=1
                )
                recs.append(r)
    return recs

def calculate_pqc_readiness(assets: list) -> tuple:
    if not assets:
        return 100.0, "PQC_READY"
        
    safe_count = sum(1 for a in assets if a.quantum_status == "SAFE")
    total = len(assets)
    
    score = (safe_count / total) * 100
    
    if score >= 90: level = "PQC_READY"
    elif score >= 70: level = "ADVANCED"
    elif score >= 40: level = "DEVELOPING"
    elif score >= 10: level = "EARLY"
    else: level = "NOT_READY"
    
    return round(score, 1), level
"""

files["engines/compliance.py"] = """
from ..models import CryptoAsset, ComplianceResult

def evaluate_compliance(scan_id: int, assets: list) -> list:
    results = []
    for a in assets:
        algo = (a.algorithm or "").upper()
        if not algo:
            continue
            
        status = "COMPLIANT"
        if "MD5" in algo or "SHA-1" in algo:
            status = "NON_COMPLIANT"
        elif "RSA" in algo and a.key_size and a.key_size < 2048:
            status = "NON_COMPLIANT"
            
        res = ComplianceResult(
            scan_id=scan_id,
            asset_id=a.id,
            framework="NIST SP 800-131A Rev 2",
            requirement_id="Crypto_Strength",
            requirement_name="Minimum Security Strength",
            status=status,
            explanation=f"Evaluated {algo} with key size {a.key_size}"
        )
        results.append(res)
    return results
"""

files["engines/migration.py"] = """
from ..models import Recommendation

def generate_migration_plan(scan_id: int, assets: list, pqc_recs: list) -> list:
    plan = list(pqc_recs)
    return plan
"""

files["engines/scoring.py"] = """
def calculate_category_scores(assets: list) -> dict:
    scores = {
        "Algorithm": 100,
        "Key": 100,
        "Config": 100,
        "Misuse": 100,
        "Vulnerability": 100,
        "Dependency": 100,
        "Protocol": 100,
        "Certificate": 100,
        "Compliance": 100,
        "PQC Readiness": 100
    }
    # basic mock based on real counts, since real data might vary
    if not assets:
        return scores
        
    # lower scores based on issues
    for a in assets:
        if a.severity in ["HIGH", "CRITICAL"]:
            scores["Algorithm"] = max(0, scores["Algorithm"] - 5)
        if a.quantum_status == "VULNERABLE":
            scores["PQC Readiness"] = max(0, scores["PQC Readiness"] - 10)
            
    return scores
"""

files["report.py"] = """
def generate_report(scan, assets, compliance, recommendations, scores):
    return {
        "scan_id": scan.id,
        "project": scan.project_id,
        "status": scan.status,
        "overall_risk_score": scan.overall_risk_score,
        "pqc_readiness_score": scan.pqc_readiness_score,
        "sections": {
            "executive_summary": "Auto-generated executive summary...",
            "findings_overview": f"Found {scan.total_findings} total findings.",
            "category_scores": scores
        }
    }
"""

files["main.py"] = """
import os
import json
import uuid
import datetime
from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from . import models, schemas, database, scanner, parser, report
from .engines import risk, quantum, mosca, pqc, compliance, migration, scoring

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ECDAT API")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def scan_pipeline(scan_id: int, repo_url: str, target_path: str, branch: str, db: Session):
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan:
        return
        
    try:
        work_dir = "/tmp/ecdat_work_" + str(uuid.uuid4())
        scan_target = target_path
        
        if repo_url:
            scan.status = "CLONING"
            db.commit()
            scanner.clone_repository(repo_url, work_dir, branch)
            scan_target = work_dir
            
        scan.status = "SCANNING"
        db.commit()
        
        out_file = os.path.join(work_dir if repo_url else "/tmp", f"{scan_id}_out.json")
        try:
            raw_out = scanner.execute_cryptoscan(scan_target, out_file)
        except Exception as e:
            scan.status = "FAILED"
            scan.error_message = str(e)
            db.commit()
            return
            
        scan.raw_scan_output = json.dumps(raw_out)
        scan.files_scanned = raw_out.get("summary", {}).get("filesScanned", 0)
        
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
    scan = models.Scan(project_id=scan_in.project_id, repository_url=scan_in.repository_url, branch=scan_in.branch, status="QUEUED")
    db.add(scan)
    db.commit()
    db.refresh(scan)
    bg_tasks.add_task(scan_pipeline, scan.id, scan_in.repository_url, scan_in.target_path, scan_in.branch, database.SessionLocal())
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
"""

files["__init__.py"] = ""
files["engines/__init__.py"] = ""

import sys
for name, content in files.items():
    path = os.path.join(API_DIR, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\n")
print("Files generated successfully.")
