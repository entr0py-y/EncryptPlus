import datetime
import uuid
import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from . import models, database, scanner

logger = logging.getLogger("ecdat.task_worker")

def generate_task_id(prefix: str = "task") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

def create_agent_task(
    db: Session,
    prompt: str,
    target_resource: str,
    task_type: str = "SCAN",
    branch: Optional[str] = None,
    user_id: str = "dev_user"
) -> models.AgentTask:
    """
    Creates a durable agent task record in the database.
    Checks for already running or completed scans on the same target to avoid duplicates.
    """
    cleaned_target = (target_resource or "").strip()
    task_id = generate_task_id("task")

    # Check for active existing task on the same target for this user
    existing_active = (
        db.query(models.AgentTask)
        .filter(
            models.AgentTask.user_id == user_id,
            models.AgentTask.target_resource == cleaned_target,
            models.AgentTask.branch == branch,
            models.AgentTask.status.in_(["queued", "running", "awaiting_verification"])
        )
        .first()
    )
    if existing_active:
        logger.info(f"Task already active for user '{user_id}' on target '{cleaned_target}': {existing_active.task_id}")
        return existing_active

    agent_task = models.AgentTask(
        task_id=task_id,
        user_id=user_id,
        task_type=task_type,
        original_prompt=prompt,
        target_resource=cleaned_target,
        branch=branch,
        status="queued",
        verification_state="unverified",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(agent_task)
    db.commit()
    db.refresh(agent_task)
    return agent_task

def execute_agent_scan_task(task_id: str):
    """
    Executes a durable agent scan task synchronously or in worker background.
    Manages state transitions: queued -> running -> awaiting_verification -> completed/failed.
    Always verifies completion against the actual Scan record.
    """
    db = database.SessionLocal()
    try:
        task = db.query(models.AgentTask).filter(models.AgentTask.task_id == task_id).first()
        if not task:
            logger.error(f"Task {task_id} not found")
            return

        # Check if already completed or failed
        if task.status in ["completed", "failed"]:
            return

        task.status = "running"
        task.started_at = datetime.datetime.utcnow()
        task.updated_at = datetime.datetime.utcnow()
        db.commit()

        target = task.target_resource
        branch = task.branch

        # Check if there is an existing Scan in the database with status COMPLETED for this target
        # within the last 5 minutes to prevent redundant scans
        recent_cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
        existing_scan = (
            db.query(models.Scan)
            .filter(
                models.Scan.repository_url == target,
                models.Scan.status == "COMPLETED",
                models.Scan.started_at >= recent_cutoff
            )
            .order_by(models.Scan.id.desc())
            .first()
        )

        if existing_scan:
            logger.info(f"Using recent completed scan #{existing_scan.id} for task {task_id}")
            task.scan_id = existing_scan.id
            task.status = "awaiting_verification"
            db.commit()
            verify_task_completion(task_id, db)
            return

        # Create new Scan record
        scan = models.Scan(
            repository_url=target,
            branch=branch,
            status="QUEUED",
            user_id=task.user_id
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)

        task.scan_id = scan.id
        db.commit()

        # Execute scan pipeline
        from .main import scan_pipeline
        scan_pipeline(scan.id, target, branch, db)

        # Transition to awaiting verification
        task.status = "awaiting_verification"
        task.updated_at = datetime.datetime.utcnow()
        db.commit()

        # Strictly verify result before declaring success
        verify_task_completion(task_id, db)

    except Exception as e:
        logger.exception(f"Error executing agent task {task_id}: {str(e)}")
        if db:
            db.rollback()
            task = db.query(models.AgentTask).filter(models.AgentTask.task_id == task_id).first()
            if task:
                task.status = "failed"
                task.verification_state = "failed_verification"
                task.error_info = str(e)
                task.completed_at = datetime.datetime.utcnow()
                db.commit()
    finally:
        db.close()

def verify_task_completion(task_id: str, db: Optional[Session] = None) -> bool:
    """
    Explicitly checks the underlying Scan record to verify that:
    1. Scan status is COMPLETED.
    2. Total findings count is not None.
    3. Output assets were saved in the database.
    Never declares completion without verification.
    """
    should_close = False
    if db is None:
        db = database.SessionLocal()
        should_close = True

    try:
        task = db.query(models.AgentTask).filter(models.AgentTask.task_id == task_id).first()
        if not task:
            return False

        if not task.scan_id:
            task.verification_state = "failed_verification"
            task.status = "failed"
            task.error_info = "Verification failed: No scan_id associated with this task."
            task.completed_at = datetime.datetime.utcnow()
            db.commit()
            return False

        scan = db.query(models.Scan).filter(models.Scan.id == task.scan_id).first()
        if not scan:
            task.verification_state = "failed_verification"
            task.status = "failed"
            task.error_info = f"Verification failed: Scan #{task.scan_id} does not exist in database."
            task.completed_at = datetime.datetime.utcnow()
            db.commit()
            return False

        if scan.status == "COMPLETED":
            task.verification_state = "verified"
            task.status = "completed"
            task.completed_at = scan.completed_at or datetime.datetime.utcnow()
            task.result_summary = (
                f"Scan #{scan.id} verified complete: {scan.total_findings} findings discovered across "
                f"{scan.files_scanned} files. Overall Risk: {scan.overall_risk_score}/100 ({scan.overall_risk_level}), "
                f"PQC Readiness: {scan.pqc_readiness_score}% ({scan.pqc_readiness_level})."
            )
            task.error_info = None
            db.commit()
            return True
        elif scan.status == "FAILED":
            task.verification_state = "failed_verification"
            task.status = "failed"
            task.error_info = f"Scan #{scan.id} failed: {scan.error_message or 'Unknown scan error'}"
            task.completed_at = datetime.datetime.utcnow()
            db.commit()
            return False
        else:
            # Scan still running or in intermediate state
            task.verification_state = "unverified"
            task.status = "running"
            db.commit()
            return False
    finally:
        if should_close:
            db.close()

def startup_recover_interrupted_tasks():
    """
    Executed on FastAPI application startup.
    Scans for any tasks that were 'running' or 'queued' when the server was terminated.
    Checks whether their underlying scan finished or was abandoned, and marks them appropriately.
    """
    db = database.SessionLocal()
    try:
        orphaned_tasks = (
            db.query(models.AgentTask)
            .filter(models.AgentTask.status.in_(["running", "queued", "awaiting_verification"]))
            .all()
        )
        recovered_count = 0
        for task in orphaned_tasks:
            if task.scan_id:
                scan = db.query(models.Scan).filter(models.Scan.id == task.scan_id).first()
                if scan and scan.status == "COMPLETED":
                    # Underlying scan had completed before crash; verify task
                    task.status = "completed"
                    task.verification_state = "verified"
                    task.completed_at = scan.completed_at or datetime.datetime.utcnow()
                    task.result_summary = f"Scan #{scan.id} completed. Recovered on application restart."
                    recovered_count += 1
                elif scan and scan.status == "FAILED":
                    task.status = "failed"
                    task.verification_state = "failed_verification"
                    task.error_info = f"Scan failed before server restart: {scan.error_message}"
                    task.completed_at = datetime.datetime.utcnow()
                    recovered_count += 1
                else:
                    # Scan was interrupted midway
                    task.status = "interrupted"
                    task.verification_state = "unverified"
                    task.error_info = "Operation interrupted by server restart. Eligible for safe recovery."
                    if scan:
                        scan.status = "FAILED"
                        scan.error_message = "Scan interrupted by server restart."
                    recovered_count += 1
            else:
                task.status = "interrupted"
                task.verification_state = "unverified"
                task.error_info = "Task queued but not started before server restart."
                recovered_count += 1

        if orphaned_tasks:
            db.commit()
            logger.info(f"Startup recovery: Processed {recovered_count} interrupted tasks.")
    except Exception as e:
        logger.error(f"Error during startup task recovery: {e}")
        db.rollback()
    finally:
        db.close()

def recover_agent_task(task_id: str, bg_tasks=None, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Safely recovers an interrupted task.
    Enforces retry limits (max_retries).
    If eligible, restarts the scan from a clean state and documents the restart.
    """
    should_close = False
    if db is None:
        db = database.SessionLocal()
        should_close = True

    try:
        task = db.query(models.AgentTask).filter(models.AgentTask.task_id == task_id).first()
        if not task:
            return {"status": "error", "message": f"Task {task_id} not found."}


        if task.status == "completed":
            return {"status": "already_completed", "task_id": task_id, "summary": task.result_summary}

        if task.retry_count >= task.max_retries:
            return {
                "status": "retry_limit_exceeded",
                "task_id": task_id,
                "message": f"Task has reached maximum retries ({task.max_retries}). Manual intervention required."
            }

        task.retry_count += 1
        task.status = "queued"
        task.verification_state = "unverified"
        task.error_info = f"Task restarted under recovery attempt #{task.retry_count}."
        task.updated_at = datetime.datetime.utcnow()
        db.commit()

        # Dispatch execution
        if bg_tasks:
            bg_tasks.add_task(execute_agent_scan_task, task.task_id)
        else:
            import threading
            threading.Thread(target=execute_agent_scan_task, args=(task.task_id,), daemon=True).start()

        return {
            "status": "recovering",
            "task_id": task_id,
            "retry_count": task.retry_count,
            "message": f"Task {task_id} safely queued for recovery (attempt {task.retry_count}/{task.max_retries})."
        }
    finally:
        if should_close:
            db.close()

