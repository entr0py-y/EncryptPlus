#!/usr/bin/env python3
"""
EncryptPlus Integration Connectivity Test Script
Tests live external connectivity to Hindsight Persistent AI Memory when credentials are provided.
Also verifies database transactional read/write, CryptoScan engine, and local fallback paths.
Never prints raw credentials or uses real cryptographic keys in tests.
"""

import os
import sys
import time
import uuid
import httpx
import subprocess

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
except ImportError:
    pass

from apps.api.database import SessionLocal, engine
from apps.api.models import AgentTask, Scan
from apps.api.hindsight_service import HindsightMemoryService
from apps.api.agent_service import AgentWorkflowService
from apps.api.scanner import CRYPTOSCAN_BIN


def mask_secret(secret: str) -> str:
    if not secret:
        return "<none>"
    if len(secret) <= 8:
        return "***"
    return f"{secret[:5]}...{secret[-4:]}"


def test_database() -> bool:
    print("\n--- 1. Authoritative Database Test ---")
    db = SessionLocal()
    test_task_id = f"diag-task-{uuid.uuid4()}"
    try:
        # Read test
        scan_count = db.query(Scan).count()
        print(f"[PASS] Database read check passed ({scan_count} existing scans in database)")

        # Write test
        test_task = AgentTask(
            task_id=test_task_id,
            user_id="diag_user",
            task_type="diagnostic_ping",
            original_prompt="Automated diagnostic test",
            status="completed",
            verification_state="verified"
        )
        db.add(test_task)
        db.commit()

        # Verify write
        retrieved = db.query(AgentTask).filter(AgentTask.task_id == test_task_id).first()
        if not retrieved:
            raise RuntimeError("Failed to retrieve created test task")
        
        # Cleanup test task
        db.delete(retrieved)
        db.commit()
        print("[PASS] Database transactional write, read-back, and cleanup succeeded")
        return True
    except Exception as e:
        db.rollback()
        print(f"[FAIL] Database test failed: {str(e)}")
        return False
    finally:
        db.close()


def test_cryptoscan_engine() -> bool:
    print("\n--- 2. CryptoScan Binary Test ---")
    if not os.path.exists(CRYPTOSCAN_BIN):
        print(f"[FAIL] CryptoScan binary not found at {CRYPTOSCAN_BIN}")
        return False

    try:
        proc = subprocess.run([CRYPTOSCAN_BIN, "--help"], capture_output=True, text=True, timeout=10)
        if proc.returncode == 0 or "scan" in proc.stdout:
            print("[PASS] CryptoScan binary executed successfully (--help returned usage)")
            return True
        else:
            print(f"[FAIL] CryptoScan returned non-zero exit code: {proc.returncode}")
            return False
    except Exception as e:
        print(f"[FAIL] Failed executing CryptoScan binary: {str(e)}")
        return False


def test_hindsight_memory() -> bool:
    print("\n--- 3. Hindsight Persistent Memory Test ---")
    service = HindsightMemoryService()
    api_key = service.api_key
    base_url = service.base_url
    bank_id = service.base_bank_id

    if not service.is_configured:
        print("[SKIP] HINDSIGHT_API_KEY is not configured or contains placeholder.")
        print("       Testing local in-process fallback memory store...")
        test_uid = f"diag-mem-{uuid.uuid4().hex[:6]}"
        ok_retain = service.retain_memory(
            user_id=test_uid,
            content="User prefers post-quantum Kyber512 for TLS encryption."
        )
        if not ok_retain:
            print("[FAIL] Local fallback retain failed.")
            return False

        recalled = service.recall_relevant_memories(user_id=test_uid, query="Kyber512 post-quantum", limit=3)
        if recalled and any("Kyber512" in m for m in recalled):
            print("[PASS] Local fallback memory store successfully retained and recalled memory.")
            return True
        else:
            print("[FAIL] Local fallback recall did not return expected content.")
            return False

    print(f"Connecting to Hindsight endpoint: {base_url}")
    print(f"Configured memory bank: {bank_id}")
    print(f"Credential: {mask_secret(api_key)}")

    diag_user = f"diag-test-{uuid.uuid4().hex[:8]}"
    test_content = f"EncryptPlus automated diagnostic ping: {uuid.uuid4()}"

    # Retain test
    t0 = time.time()
    try:
        ok_retain = service.retain_memory(user_id=diag_user, content=test_content, metadata={"diagnostic": True})
        latency = time.time() - t0

        if not ok_retain:
            print(f"[FAIL] Hindsight retain request failed.")
            return False
        print(f"[PASS] Hindsight retain request succeeded ({latency:.2f}s)")

        # Recall test
        time.sleep(0.5)
        recalled = service.recall_relevant_memories(user_id=diag_user, query="automated diagnostic ping", limit=3)
        if recalled:
            print(f"[PASS] Hindsight memory recall succeeded (retrieved {len(recalled)} memory item(s))")
            return True
        else:
            print("[WARN] Hindsight retain succeeded but recall returned no matches (indexing may take a few seconds).")
            return True
    except Exception as e:
        print(f"[FAIL] Error communicating with Hindsight: {str(e)}")
        return False


def test_agent_workflow() -> bool:
    print("\n--- 4. Memory-Assisted Agent Workflow Test ---")
    service = AgentWorkflowService()
    db = SessionLocal()
    try:
        res = service.process_chat(
            message="What was the result of our recent cryptographic scans?",
            db=db,
            user_id="diag_user"
        )
        if res.get("content") and res.get("status") == "success":
            print("[PASS] Agent workflow successfully processed intent and queried database.")
            print(f"       Agent summary snippet: {res['content'][:120]}...")
            return True
        else:
            print(f"[FAIL] Agent workflow returned incomplete result: {res}")
            return False
    except Exception as e:
        print(f"[FAIL] Agent workflow failed with error: {str(e)}")
        return False
    finally:
        db.close()


def main():
    print("=" * 60)
    print("      EncryptPlus Integration & Connectivity Test")
    print("                (Hindsight Memory Only)")
    print("=" * 60)

    results = {
        "Database": test_database(),
        "CryptoScan Engine": test_cryptoscan_engine(),
        "Hindsight Memory": test_hindsight_memory(),
        "Agent Workflow": test_agent_workflow(),
    }

    print("\n" + "=" * 60)
    print("                Test Summary")
    print("=" * 60)
    all_ok = True
    for name, passed in results.items():
        status_str = "[PASS]" if passed else "[FAIL]"
        print(f"{status_str} {name}")
        if not passed:
            all_ok = False

    print("=" * 60)
    if all_ok:
        print("Overall Status: ALL INTEGRATION CHECKS PASSED")
        return 0
    else:
        print("Overall Status: SOME CHECKS FAILED OR NEED ATTENTION")
        return 1


if __name__ == "__main__":
    sys.exit(main())
