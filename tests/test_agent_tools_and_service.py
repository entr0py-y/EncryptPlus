import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from apps.api import models
from apps.api.database import Base
from apps.api.agent_tools import (
    validate_target_string,
    execute_agent_tool,
    tool_list_recent_scans,
    tool_find_previous_scan,
    tool_get_scan_status
)
from apps.api.agent_service import AgentWorkflowService

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()
    try:
        # Seed test scan
        scan = models.Scan(
            user_id="dev_user",
            repository_url="https://github.com/openssl/openssl.git",
            branch="master",
            status="COMPLETED",
            total_findings=128,
            files_scanned=50,
            lines_scanned=25000,
            overall_risk_score=35.5,
            overall_risk_level="MODERATE",
            pqc_readiness_score=45.0,
            pqc_readiness_level="DEVELOPING",
            critical_count=4,
            quantum_vulnerable_count=40
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        yield db
    finally:
        db.close()

def test_target_string_validation():
    """Verifies that malicious inputs, shell characters, and directory traversals are blocked."""
    assert validate_target_string("https://github.com/org/repo.git") == "https://github.com/org/repo.git"
    assert validate_target_string("demo_repo") == "demo_repo"

    with pytest.raises(ValueError, match="Directory traversal"):
        validate_target_string("../../etc/passwd")

    with pytest.raises(ValueError, match="invalid characters"):
        validate_target_string("https://github.com/repo; rm -rf /")

def test_tool_queries_real_database_data(test_db):
    """Verifies that tools return real database records and never fabricate IDs."""
    scans = tool_list_recent_scans(test_db, limit=5)
    assert len(scans) == 1
    assert scans[0]["repository_url"] == "https://github.com/openssl/openssl.git"
    assert scans[0]["overall_risk_score"] == 35.5
    assert scans[0]["total_findings"] == 128

    found = tool_find_previous_scan(test_db, query="openssl")
    assert len(found) == 1
    assert found[0]["scan_id"] == 1

    status = tool_get_scan_status(test_db, scan_id=1)
    assert status["is_completed"] is True
    assert status["files_scanned"] == 50

def test_agent_workflow_service(test_db):
    """Verifies that AgentWorkflowService executes memory-assisted chat with verified database facts."""
    service = AgentWorkflowService()

    response = service.process_chat(
        message="What was the result of our recent scans?",
        db=test_db,
        user_id="dev_user"
    )
    
    assert response["status"] == "success"
    assert "Verified Recent Cryptographic Audits" in response["content"]
    assert len(response["links"]) > 0
    assert response["verified_data"] is not None
