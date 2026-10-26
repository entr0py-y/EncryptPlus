"""
EncryptPlus Agent Workflow Service
Integrates Hindsight Persistent Memory with Authoritative Database Scans and Analysis.
Operates deterministically without requiring an external LLM (e.g. NVIDIA NIM removed).
All cryptographic findings, PQC scores, risk calculations, and task states are strictly
verified against the application database (ecdat.db).
"""

import re
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from .agent_tools import (
    execute_agent_tool,
    tool_list_recent_scans,
    tool_get_scan_status,
    tool_get_scan_findings,
    tool_summarize_pqc_readiness,
    tool_get_scan_report,
    tool_list_agent_tasks,
    tool_recover_interrupted_task
)
from .hindsight_service import hindsight_service

logger = logging.getLogger("ecdat.agent_service")


class AgentWorkflowService:
    """
    Dedicated EncryptPlus Memory-Assisted AI Agent.
    Combines Hindsight long-term memory with deterministic cryptographic analysis.
    """

    def process_chat(
        self,
        message: str,
        db: Session,
        user_id: str = "dev_user",
        session_id: str = "default_session"
    ) -> Dict[str, Any]:
        """
        Executes the complete memory-assisted agent workflow:
        1. Recalls relevant long-term memories from Hindsight.
        2. Detects user intent and dispatches to approved backend tools.
        3. Queries authoritative SQLite database (ecdat.db).
        4. Synthesizes a verified Markdown response with clickable links.
        5. Retains the interaction summary in Hindsight.
        """
        prompt = (message or "").strip()
        user_id = user_id or "dev_user"

        # Step 1: Recall relevant memories from Hindsight
        recalled = hindsight_service.recall_relevant_memories(user_id=user_id, query=prompt, limit=3)

        # Step 2: Determine tool execution and query authoritative database
        tool_result = self._dispatch_intent_to_tools(prompt, db, user_id)

        # Step 3: Format the response distinguishing memory from verified facts
        response_content = self._format_response(prompt, tool_result, recalled)

        # Step 4: Retain interaction summary in Hindsight
        summary_to_store = f"User: '{prompt}'. Response: '{response_content[:120]}...'"
        hindsight_service.store_interaction_memory(user_id=user_id, content=summary_to_store)

        if tool_result.get("task_id") and tool_result.get("verified_data"):
            hindsight_service.store_task_summary(
                user_id=user_id,
                task_id=tool_result["task_id"],
                scan_id=tool_result.get("scan_id"),
                summary=f"Task {tool_result['task_id']} executed with status '{tool_result.get('status')}'"
            )

        return {
            "content": response_content,
            "user_id": user_id,
            "session_id": session_id,
            "task_id": tool_result.get("task_id"),
            "scan_id": tool_result.get("scan_id"),
            "recalled_memories": recalled,
            "verified_data": tool_result.get("verified_data"),
            "links": tool_result.get("links", []),
            "status": tool_result.get("status", "success")
        }

    def _dispatch_intent_to_tools(self, prompt: str, db: Session, user_id: str) -> Dict[str, Any]:
        """
        Parses intent and parameters safely without arbitrary code execution.
        Dispatches strictly to approved backend functions.
        """
        lower = prompt.lower()
        extracted_scan_id = None

        # Look for explicit scan IDs (e.g., #23, scan 23, scan #1, 23)
        scan_id_match = re.search(r'(?:scan\s*#?|#)(\d+)', lower)
        if scan_id_match:
            try:
                extracted_scan_id = int(scan_id_match.group(1))
            except ValueError:
                pass

        # 1. Post-Quantum Cryptography / Risk Breakdown
        if any(w in lower for w in ["quantum", "pqc", "shor", "grover", "readiness", "kyber", "dilithium"]):
            scan_id = extracted_scan_id or 23
            data = tool_summarize_pqc_readiness(db, scan_id=scan_id, user_id=user_id)
            if data.get("status") == "error" or "error" in data:
                # Fall back to latest scan
                scans = tool_list_recent_scans(db, limit=1, user_id=user_id)
                scans_list = scans if isinstance(scans, list) else scans.get("result", [])
                if scans_list:
                    scan_id = scans_list[0]["scan_id"]
                    data = tool_summarize_pqc_readiness(db, scan_id=scan_id, user_id=user_id)

            return {
                "type": "pqc_summary",
                "scan_id": scan_id,
                "verified_data": data,
                "links": [{"title": f"View Quantum Horizon for Scan #{scan_id}", "url": f"/scans/{scan_id}#quantum"}],
                "status": "success"
            }

        # 2. Detailed Findings & Cryptographic Inventory
        if any(w in lower for w in ["finding", "inventory", "vulnerab", "rsa", "md5", "sha", "des", "weakness"]):
            scan_id = extracted_scan_id or 23
            data = tool_get_scan_findings(db, scan_id=scan_id, limit=5, user_id=user_id)
            return {
                "type": "findings",
                "scan_id": scan_id,
                "verified_data": data,
                "links": [{"title": f"View Findings Table for Scan #{scan_id}", "url": f"/scans/{scan_id}/findings"}],
                "status": "success"
            }

        # 3. 18-Section Assessment Report
        if any(w in lower for w in ["report", "executive", "technical report", "assessment report", "pdf", "cbom"]):
            scan_id = extracted_scan_id or 23
            data = tool_get_scan_report(db, scan_id=scan_id, user_id=user_id)
            return {
                "type": "report",
                "scan_id": scan_id,
                "verified_data": data,
                "links": [
                    {"title": f"Full 18-Section Audit Report (Scan #{scan_id})", "url": f"/scans/{scan_id}/report"},
                    {"title": f"Download CycloneDX CBOM", "url": f"/api/scans/{scan_id}/cbom"}
                ],
                "status": "success"
            }

        # 4. Background Tasks & Crash Recovery
        if any(w in lower for w in ["task", "background", "queue", "worker", "recover", "interrupted"]):
            task_id_match = re.search(r'(task_[a-zA-Z0-9]+)', prompt)
            if "recover" in lower and task_id_match:
                rec_res = tool_recover_interrupted_task(db, task_id=task_id_match.group(1))
                return {
                    "type": "task_recovery",
                    "task_id": task_id_match.group(1),
                    "verified_data": rec_res,
                    "links": [{"title": "View All Audits", "url": "/scans"}],
                    "status": "success"
                }

            tasks_data = tool_list_agent_tasks(db, user_id=user_id, limit=5)
            return {
                "type": "task_list",
                "verified_data": tasks_data,
                "links": [{"title": "View All Audits", "url": "/scans"}],
                "status": "success"
            }

        # 5. Default / Scan List / Overview
        scans_raw = tool_list_recent_scans(db, limit=5, user_id=user_id)
        scans_list = scans_raw if isinstance(scans_raw, list) else scans_raw.get("result", [])
        links = []
        for s in scans_list:
            sid = s.get("scan_id")
            if sid:
                links.append({"title": f"Scan #{sid} Assessment", "url": f"/scans/{sid}"})

        return {
            "type": "scan_list",
            "verified_data": {"result": scans_list},
            "links": links,
            "status": "success"
        }

    def _format_response(self, prompt: str, tool_result: Dict[str, Any], recalled_memories: List[str]) -> str:
        """
        Formats a clear, verified Markdown report.
        Clearly separates remembered context (Hindsight) from verified facts (SQLite).
        """
        res_type = tool_result.get("type")
        raw_vdata = tool_result.get("verified_data", {})
        if isinstance(raw_vdata, list):
            vdata = raw_vdata
        elif isinstance(raw_vdata, dict):
            vdata = raw_vdata.get("result", raw_vdata)
        else:
            vdata = {}
        parts = []

        # PQC Summary
        if res_type == "pqc_summary":
            scan_id = tool_result.get("scan_id")
            score = vdata.get("pqc_readiness_score", "N/A")
            level = vdata.get("pqc_readiness_level", "UNKNOWN")
            overall = vdata.get("overall_risk_score", "N/A")
            repo = vdata.get("repository_url", f"Scan #{scan_id}")
            q_breakdown = vdata.get("quantum_breakdown", {})

            parts.append(f"### ⚛️ Post-Quantum Cryptography Readiness Summary (Scan #{scan_id})\n")
            parts.append(f"• **Repository:** `{repo}`\n")
            parts.append(f"• **PQC Readiness Score:** **{score}%** ({level})\n")
            parts.append(f"• **Overall Classical Risk:** **{overall}/100**\n")
            parts.append("\n**Quantum Exposure Breakdown:**\n")
            parts.append(f"• Shor's Algorithm Vulnerable (Asymmetric): `{q_breakdown.get('vulnerable_to_shors', 0)}`\n")
            parts.append(f"• Grover's Algorithm Partial (Symmetric/Hash): `{q_breakdown.get('partially_vulnerable_grover', 0)}`\n")
            parts.append(f"• Quantum-Safe (PQC Standards): `{q_breakdown.get('quantum_safe_pqc', 0)}`\n")

            recs = vdata.get("top_migration_recommendations", [])
            if recs:
                parts.append("\n**Priority Migration Targets:**\n")
                for r in recs[:3]:
                    parts.append(f"- **{r.get('current_algorithm')}** ➔ `{r.get('recommended_algorithm')}` ({r.get('priority')})\n")

        # Findings Summary
        elif res_type == "findings":
            scan_id = tool_result.get("scan_id")
            total = tool_result.get("verified_data", {}).get("total_count", 0)
            items = vdata if isinstance(vdata, list) else []

            parts.append(f"### 🔍 Cryptographic Findings Summary (Scan #{scan_id})\n")
            parts.append(f"Found **{total}** total cryptographic assets. Showing top findings:\n\n")
            parts.append("| Algorithm | Category | Risk | Quantum Threat | File Location |\n")
            parts.append("| :--- | :--- | :--- | :--- | :--- |\n")
            for item in items:
                algo = item.get("algorithm", "Unknown")
                cat = item.get("category", "General")
                risk = item.get("risk_level", "LOW")
                q_vuln = "⚠️ Shor" if item.get("is_quantum_vulnerable") else "✅ Safe"
                loc = f"`{item.get('file_path', 'unknown')}:{item.get('line_number', 0)}`"
                parts.append(f"| **{algo}** | {cat} | `{risk}` | {q_vuln} | {loc} |\n")

        # Assessment Report
        elif res_type == "report":
            scan_id = tool_result.get("scan_id")
            sections = vdata.get("sections_available", [])
            parts.append(f"### 📑 18-Section Technical Audit Report (Scan #{scan_id})\n")
            parts.append(f"• **Executive Summary & CBOM** available for repository `{vdata.get('repository_url', 'demo')}`.\n")
            parts.append(f"• **Total Assets Evaluated:** `{vdata.get('total_assets', 'N/A')}`\n")
            parts.append(f"• **Sections Compiled:** {len(sections)} sections (Executive Summary, Mosca Horizon, Algorithm Inventory, CBOM).\n")

        # Task List & Recovery
        elif res_type == "task_list":
            tasks = vdata if isinstance(vdata, list) else []
            parts.append("### ⏱️ Durable Background Tasks\n\n")
            if not tasks:
                parts.append("No active background tasks found. All cryptographic audits are completed and verified.\n")
            else:
                parts.append("| Task ID | Type | Status | Verification | Target |\n")
                parts.append("| :--- | :--- | :--- | :--- | :--- |\n")
                for t in tasks:
                    parts.append(f"| `{t.get('task_id')}` | {t.get('task_type')} | `{t.get('status')}` | `{t.get('verification_state')}` | `{t.get('target_resource')}` |\n")

        elif res_type == "task_recovery":
            task_id = tool_result.get("task_id")
            parts.append(f"### 🔄 Task Recovery Queued\n\n")
            parts.append(f"Task `{task_id}` has been validated against `ecdat.db` and safely re-queued for execution.\n")

        # Recent Scans (Default)
        else:
            scans = vdata if isinstance(vdata, list) else []
            parts.append("### 📋 Verified Recent Cryptographic Audits\n\n")
            parts.append("| Scan ID | Repository | Status | Risk Score | PQC Readiness | Findings |\n")
            parts.append("| :--- | :--- | :--- | :--- | :--- | :--- |\n")
            for s in scans:
                sid = s.get("scan_id")
                repo = s.get("repository_url", "")
                status = s.get("status", "UNKNOWN")
                risk = s.get("overall_risk_score", "—")
                pqc = f"{s.get('pqc_readiness_score', 0):.1f}%" if s.get("pqc_readiness_score") is not None else "—"
                findings = s.get("total_findings", 0)
                parts.append(f"| **#{sid}** | `{repo}` | `{status}` | {risk} | {pqc} | {findings} |\n")

            parts.append("\n*Ask me about any specific scan, request a PQC migration breakdown, or ask me to scan a new repository.*")

        return "".join(parts)


# Global singleton
agent_service = AgentWorkflowService()
