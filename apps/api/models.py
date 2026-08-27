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
