import os
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from . import models, database, report, task_worker
from .engines import scoring

# Narrowly scoped whitelist of allowed characters for repository targets
VALID_TARGET_PATTERN = re.compile(r"^[a-zA-Z0-9_\-\.\:\/@]+$")

def validate_target_string(target: str) -> str:
    """Validates target string to prevent command injection, traversal, or malformed input."""
    cleaned = (target or "").strip()
    if not cleaned:
        raise ValueError("Target repository URL or directory cannot be empty.")
    if not VALID_TARGET_PATTERN.match(cleaned):
        raise ValueError(f"Target '{cleaned}' contains invalid characters.")
    if ".." in cleaned:
        raise ValueError("Directory traversal characters ('..') are not permitted.")
    return cleaned

def tool_list_recent_scans(db: Session, limit: int = 5, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves the most recent verified scans from the database for the user."""
    safe_limit = max(1, min(limit, 20))
    q = db.query(models.Scan)
    if user_id:
        if user_id == "dev_user":
            q = q.filter((models.Scan.user_id == "dev_user") | (models.Scan.user_id.is_(None)))
        else:
            q = q.filter(models.Scan.user_id == user_id)
    scans = q.order_by(desc(models.Scan.id)).limit(safe_limit).all()
    results = []
    for s in scans:
        results.append({
            "scan_id": s.id,
            "repository_url": s.repository_url,
            "branch": s.branch,
            "status": s.status,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "overall_risk_score": s.overall_risk_score,
            "overall_risk_level": s.overall_risk_level,
            "pqc_readiness_score": s.pqc_readiness_score,
            "pqc_readiness_level": s.pqc_readiness_level,
            "total_findings": s.total_findings,
            "critical_count": s.critical_count,
            "quantum_vulnerable_count": s.quantum_vulnerable_count,
            "report_url": f"/scans/{s.id}"
        })
    return results

def tool_find_previous_scan(db: Session, query: str, limit: int = 5, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Searches for previous scans matching a repository name, URL, or scan ID."""
    clean_q = (query or "").strip()
    if not clean_q:
        return tool_list_recent_scans(db, limit, user_id=user_id)

    q = db.query(models.Scan)
    if user_id:
        if user_id == "dev_user":
            q = q.filter((models.Scan.user_id == "dev_user") | (models.Scan.user_id.is_(None)))
        else:
            q = q.filter(models.Scan.user_id == user_id)

    # Check if query is an integer scan ID
    if clean_q.isdigit():
        q = q.filter(models.Scan.id == int(clean_q))
    else:
        term = f"%{clean_q}%"
        q = q.filter(models.Scan.repository_url.ilike(term))

    scans = q.order_by(desc(models.Scan.id)).limit(max(1, min(limit, 10))).all()
    return [
        {
            "scan_id": s.id,
            "repository_url": s.repository_url,
            "branch": s.branch,
            "status": s.status,
            "overall_risk_score": s.overall_risk_score,
            "pqc_readiness_score": s.pqc_readiness_score,
            "total_findings": s.total_findings,
            "report_url": f"/scans/{s.id}"
        }
        for s in scans
    ]

def tool_get_scan_status(db: Session, scan_id: int, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves the current execution status of a specific scan."""
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan:
        return {"error": f"Scan #{scan_id} not found."}
    if user_id and scan.user_id and scan.user_id != user_id:
        return {"error": f"Scan #{scan_id} not found or access restricted."}
    return {
        "scan_id": scan.id,
        "repository_url": scan.repository_url,
        "status": scan.status,
        "error_message": scan.error_message,
        "started_at": scan.started_at.isoformat() if scan.started_at else None,
        "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
        "files_scanned": scan.files_scanned,
        "lines_scanned": scan.lines_scanned,
        "is_completed": scan.status == "COMPLETED",
        "is_failed": scan.status == "FAILED",
        "report_url": f"/scans/{scan.id}" if scan.status == "COMPLETED" else None
    }

def tool_get_scan_findings(db: Session, scan_id: int, severity: Optional[str] = None, limit: int = 10, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves verified code findings for a completed scan."""
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan:
        return {"error": f"Scan #{scan_id} not found."}
    if user_id and scan.user_id and scan.user_id != user_id:
        return {"error": f"Scan #{scan_id} not found or access restricted."}

    q = db.query(models.CryptoAsset).filter(models.CryptoAsset.scan_id == scan_id)
    if severity and severity.upper() != "ALL":
        q = q.filter(models.CryptoAsset.severity == severity.upper())

    findings = q.limit(max(1, min(limit, 50))).all()
    return {
        "scan_id": scan.id,
        "total_scan_findings": scan.total_findings,
        "returned_findings_count": len(findings),
        "findings": [
            {
                "id": a.id,
                "algorithm": a.algorithm,
                "category": a.category,
                "primitive": a.primitive,
                "severity": a.severity,
                "quantum_status": a.quantum_status,
                "file_path": a.file_path,
                "line": a.line_start,
                "match_text": a.match_text,
                "remediation": a.remediation
            }
            for a in findings
        ]
    }

def tool_summarize_pqc_readiness(db: Session, scan_id: int, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Summarizes quantum exposure and PQC migration readiness from verified scan data."""
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan:
        return {"error": f"Scan #{scan_id} not found."}
    if user_id and scan.user_id and scan.user_id != user_id:
        return {"error": f"Scan #{scan_id} not found or access restricted."}

    recs = db.query(models.Recommendation).filter(models.Recommendation.scan_id == scan_id).limit(5).all()

    return {
        "scan_id": scan.id,
        "repository_url": scan.repository_url,
        "pqc_readiness_score": scan.pqc_readiness_score,
        "pqc_readiness_level": scan.pqc_readiness_level,
        "overall_risk_score": scan.overall_risk_score,
        "quantum_breakdown": {
            "vulnerable_to_shors": scan.quantum_vulnerable_count,
            "partially_vulnerable_grover": scan.quantum_partial_count,
            "quantum_safe_pqc": scan.quantum_safe_count
        },
        "top_migration_recommendations": [
            {
                "priority": r.priority,
                "title": r.title,
                "current_algorithm": r.current_algorithm,
                "recommended_algorithm": r.recommended_algorithm
            }
            for r in recs
        ],
        "report_url": f"/scans/{scan.id}#quantum"
    }

def tool_get_scan_report(db: Session, scan_id: int, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Fetches the 18-section executive assessment report for a scan."""
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan:
        return {"error": f"Scan #{scan_id} not found."}
    if user_id and scan.user_id and scan.user_id != user_id:
        return {"error": f"Scan #{scan_id} not found or access restricted."}
    if scan.status != "COMPLETED":
        return {
            "error": f"Report unavailable because scan #{scan_id} is in status '{scan.status}'.",
            "status": scan.status
        }

    assets = db.query(models.CryptoAsset).filter(models.CryptoAsset.scan_id == scan_id).limit(500).all()
    comp = db.query(models.ComplianceResult).filter(models.ComplianceResult.scan_id == scan_id).all()
    recs = db.query(models.Recommendation).filter(models.Recommendation.scan_id == scan_id).all()
    scs = scoring.calculate_category_scores(assets)
    full_report = report.generate_report(scan, assets, comp, recs, scs)

    # Return key chapters for concise LLM context
    return {
        "scan_id": scan.id,
        "repository_url": scan.repository_url,
        "overall_risk_score": scan.overall_risk_score,
        "pqc_readiness_score": scan.pqc_readiness_score,
        "executive_summary": full_report["sections"][0]["content"],
        "posture_summary": full_report["sections"][1]["content"],
        "severity_breakdown": full_report["sections"][7]["content"],
        "quantum_profile": full_report["sections"][13]["content"],
        "remediation_plan": full_report["sections"][15]["content"],
        "report_url": f"/scans/{scan.id}/report"
    }

def tool_start_cryptographic_scan(
    db: Session,
    target_repo: str,
    branch: Optional[str] = None,
    prompt: Optional[str] = None,
    user_id: str = "dev_user"
) -> Dict[str, Any]:
    """
    Initiates a verified cryptographic scan through the durable task worker.
    Checks for active running scans on the same target to prevent duplicate work.
    """
    clean_target = validate_target_string(target_repo)
    task = task_worker.create_agent_task(
        db=db,
        prompt=prompt or f"Scan target '{clean_target}'",
        target_resource=clean_target,
        task_type="SCAN",
        branch=branch,
        user_id=user_id
    )

    # If the task was just queued, dispatch execution in background thread
    if task.status == "queued":
        import threading
        threading.Thread(target=task_worker.execute_agent_scan_task, args=(task.task_id,), daemon=True).start()

    return {
        "task_id": task.task_id,
        "target": clean_target,
        "status": task.status,
        "message": f"Scan task '{task.task_id}' is {task.status}.",
        "task_tracking_url": f"/api/agent/tasks/{task.task_id}"
    }

def tool_list_agent_tasks(db: Session, user_id: str = "dev_user", limit: int = 10) -> List[Dict[str, Any]]:
    """Lists recent agent tasks and their durability/recovery status."""
    tasks = (
        db.query(models.AgentTask)
        .filter(models.AgentTask.user_id == user_id)
        .order_by(desc(models.AgentTask.id))
        .limit(max(1, min(limit, 20)))
        .all()
    )
    return [
        {
            "task_id": t.task_id,
            "target": t.target_resource,
            "status": t.status,
            "verification_state": t.verification_state,
            "scan_id": t.scan_id,
            "result_summary": t.result_summary,
            "error_info": t.error_info,
            "retry_count": t.retry_count,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "report_url": f"/scans/{t.scan_id}" if t.scan_id else None
        }
        for t in tasks
    ]

def tool_recover_interrupted_task(db: Session, task_id: str) -> Dict[str, Any]:
    """Safely recovers an interrupted task."""
    return task_worker.recover_agent_task(task_id)

AGENT_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "list_recent_scans",
            "description": "Lists recent cryptographic scans completed or in progress in the application database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Maximum number of scans to return (1-20)."}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_previous_scan",
            "description": "Searches for previous scans matching a repository name, Git URL, or numeric scan ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search term: repo name, URL, or numeric ID."}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_scan_status",
            "description": "Checks the real-time status of a specific scan by its ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scan_id": {"type": "integer", "description": "The unique numeric ID of the scan."}
                },
                "required": ["scan_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_scan_findings",
            "description": "Fetches verified code-level findings (cryptographic algorithms, key lengths, severity) for a scan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scan_id": {"type": "integer", "description": "Numeric scan ID."},
                    "severity": {"type": "string", "enum": ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"], "description": "Filter by severity level."},
                    "limit": {"type": "integer", "description": "Max findings to return (1-50)."}
                },
                "required": ["scan_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "summarize_pqc_readiness",
            "description": "Returns quantum exposure breakdown (Shor's, Grover's) and Post-Quantum Cryptography (PQC) readiness score.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scan_id": {"type": "integer", "description": "Numeric scan ID."}
                },
                "required": ["scan_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_scan_report",
            "description": "Retrieves the verified 18-section executive assessment report summary for a completed scan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scan_id": {"type": "integer", "description": "Numeric scan ID."}
                },
                "required": ["scan_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "start_cryptographic_scan",
            "description": "Starts an approved cryptographic scan on a Git repository URL or local codebase path.",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_repo": {"type": "string", "description": "Git URL (https://github.com/...) or local directory (e.g. demo_repo)."},
                    "branch": {"type": "string", "description": "Optional branch name (e.g. main)."}
                },
                "required": ["target_repo"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_agent_tasks",
            "description": "Lists long-running agent tasks and their recovery states (completed, running, interrupted, failed).",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Max tasks to retrieve."}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recover_interrupted_task",
            "description": "Recovers and safely restarts an interrupted or abandoned task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "string", "description": "The stable task ID string to recover."}
                },
                "required": ["task_id"]
            }
        }
    }
]

def execute_agent_tool(tool_name: str, arguments: Dict[str, Any], db: Session, user_id: str = "dev_user") -> Dict[str, Any]:
    """Executes an approved tool with argument validation and real database access."""
    if tool_name == "list_recent_scans":
        return {"result": tool_list_recent_scans(db, limit=int(arguments.get("limit", 5)), user_id=user_id)}
    elif tool_name == "find_previous_scan":
        return {"result": tool_find_previous_scan(db, query=str(arguments.get("query", "")), limit=int(arguments.get("limit", 5)), user_id=user_id)}
    elif tool_name == "get_scan_status":
        return {"result": tool_get_scan_status(db, scan_id=int(arguments.get("scan_id", 0)), user_id=user_id)}
    elif tool_name == "get_scan_findings":
        return {"result": tool_get_scan_findings(db, scan_id=int(arguments.get("scan_id", 0)), severity=arguments.get("severity"), limit=int(arguments.get("limit", 10)), user_id=user_id)}
    elif tool_name == "summarize_pqc_readiness":
        return {"result": tool_summarize_pqc_readiness(db, scan_id=int(arguments.get("scan_id", 0)), user_id=user_id)}
    elif tool_name == "get_scan_report":
        return {"result": tool_get_scan_report(db, scan_id=int(arguments.get("scan_id", 0)), user_id=user_id)}
    elif tool_name == "start_cryptographic_scan":
        return {"result": tool_start_cryptographic_scan(db, target_repo=str(arguments.get("target_repo", "")), branch=arguments.get("branch"), user_id=user_id)}
    elif tool_name == "list_agent_tasks":
        return {"result": tool_list_agent_tasks(db, user_id=user_id, limit=int(arguments.get("limit", 10)))}
    elif tool_name == "recover_interrupted_task":
        return {"result": tool_recover_interrupted_task(db, task_id=str(arguments.get("task_id", "")))}
    else:
        return {"error": f"Tool '{tool_name}' is not recognized or not permitted."}
