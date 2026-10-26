import pytest
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from apps.api import models
from apps.api.database import Base
from apps.api import task_worker

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()

def test_create_durable_task(test_db):
    task = task_worker.create_agent_task(
        db=test_db,
        prompt="Scan our repository",
        target_resource="demo_repo",
        task_type="SCAN",
        user_id="user_alice"
    )
    assert task.task_id.startswith("task_")
    assert task.user_id == "user_alice"
    assert task.status == "queued"
    assert task.verification_state == "unverified"
    assert task.target_resource == "demo_repo"

def test_prevent_duplicate_active_scans(test_db):
    task1 = task_worker.create_agent_task(
        db=test_db,
        prompt="First scan request",
        target_resource="demo_repo",
        user_id="user_alice"
    )
    task2 = task_worker.create_agent_task(
        db=test_db,
        prompt="Duplicate scan request while first is queued",
        target_resource="demo_repo",
        user_id="user_alice"
    )
    # Must return the existing active task rather than spawning duplicate
    assert task1.task_id == task2.task_id
    tasks_count = test_db.query(models.AgentTask).filter(models.AgentTask.target_resource == "demo_repo").count()
    assert tasks_count == 1

def test_verification_checks_database_state_strictly(test_db):
    task = task_worker.create_agent_task(
        db=test_db,
        prompt="Verify without scan",
        target_resource="demo_repo"
    )
    # Verification without an associated scan must fail
    verified = task_worker.verify_task_completion(task.task_id, db=test_db)
    assert verified is False
    assert task.verification_state == "failed_verification"
    assert task.status == "failed"

    # Now create an actual Scan that completed
    scan = models.Scan(
        repository_url="demo_repo",
        status="COMPLETED",
        total_findings=42,
        files_scanned=10,
        overall_risk_score=25.0,
        overall_risk_level="LOW",
        pqc_readiness_score=80.0,
        pqc_readiness_level="PQC_READY",
        completed_at=datetime.datetime.utcnow()
    )
    test_db.add(scan)
    test_db.commit()
    test_db.refresh(scan)

    task2 = task_worker.create_agent_task(
        db=test_db,
        prompt="Verify completed scan",
        target_resource="https://github.com/test/repo"
    )
    task2.scan_id = scan.id
    test_db.commit()

    verified2 = task_worker.verify_task_completion(task2.task_id, db=test_db)
    assert verified2 is True
    assert task2.verification_state == "verified"
    assert task2.status == "completed"
    assert "42 findings" in task2.result_summary

def test_recovery_of_interrupted_tasks(test_db):
    task = task_worker.create_agent_task(
        db=test_db,
        prompt="Interrupted job",
        target_resource="https://github.com/org/interrupted"
    )
    task.status = "interrupted"
    task.error_info = "Server restarted during analysis."
    test_db.commit()

    # Recovery must safely increment retry_count and requeue
    res = task_worker.recover_agent_task(task.task_id, db=test_db)
    assert res["status"] == "recovering"

    assert res["retry_count"] == 1

    test_db.refresh(task)
    assert task.status == "queued"
    assert task.retry_count == 1
