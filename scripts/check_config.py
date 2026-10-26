#!/usr/bin/env python3
"""
EncryptPlus Configuration Check Script
Validates environment variables, dependencies, database accessibility, and binary prerequisites.
Hindsight-only memory configuration check. Masks credentials and provides actionable guidance.
"""

import os
import sys
from urllib.parse import urlparse

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
except ImportError:
    pass


def mask_secret(secret: str) -> str:
    """Mask secret value showing only partial prefix/suffix."""
    if not secret:
        return "<not set>"
    if len(secret) <= 8:
        return "***"
    return f"{secret[:5]}...{secret[-4:]}"


def is_placeholder(val: str) -> bool:
    """Check if value is an unedited placeholder."""
    if not val:
        return True
    lower = val.lower().strip()
    placeholders = [
        "your-key-here",
        "your-api-key",
        "your-hindsight-api-key",
        "placeholder",
        "changeme",
        "todo",
        "<api_key>",
        "<your-key>",
        "none",
    ]
    return any(p in lower for p in placeholders)


def check_config():
    print("=" * 60)
    print("      EncryptPlus Configuration Check (Hindsight Memory)")
    print("=" * 60)

    all_passed = True
    missing_actions = []

    # 1. Check Python Dependencies
    print("\n--- Dependencies ---")
    required_deps = ["fastapi", "uvicorn", "sqlalchemy", "httpx", "pydantic", "dotenv"]
    missing_deps = []
    for dep in required_deps:
        try:
            __import__(dep)
        except ImportError:
            missing_deps.append(dep)

    # Check for hindsight_client
    try:
        import hindsight_client
        hindsight_sdk_status = "[PASS] Official hindsight-client SDK installed"
    except ImportError:
        hindsight_sdk_status = "[INFO] hindsight-client SDK not found (will use REST HTTP client)"

    if not missing_deps:
        print("[PASS] Core Python dependencies installed (fastapi, uvicorn, sqlalchemy, httpx, pydantic)")
        print(hindsight_sdk_status)
    else:
        print(f"[FAIL] Missing Python dependencies: {', '.join(missing_deps)}")
        all_passed = False
        missing_actions.append(f"Install missing Python packages: pip install {' '.join(missing_deps)}")

    # 2. Check Database Connectivity
    print("\n--- Database ---")
    try:
        from apps.api.database import engine, DATABASE_URL
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
            
            # Check for critical tables
            res = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('scans', 'agent_tasks');" 
                                    if "sqlite" in DATABASE_URL 
                                    else "SELECT table_name FROM information_schema.tables WHERE table_name IN ('scans', 'agent_tasks');"))
            tables = [r[0] for r in res.fetchall()]
            
            if "scans" in tables and "agent_tasks" in tables:
                print(f"[PASS] Database accessible with required tables (scans, agent_tasks)")
            elif "scans" in tables:
                print(f"[PASS] Database accessible (scans table found; agent_tasks will auto-create on startup)")
            else:
                print(f"[PASS] Database connection succeeded ({DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL})")
    except Exception as e:
        print(f"[FAIL] Database connection error: {str(e)}")
        all_passed = False
        missing_actions.append("Ensure ecdat.db exists in project root or verify DATABASE_URL in .env.")

    # 3. Check CryptoScan binary
    print("\n--- CryptoScan Engine ---")
    cryptoscan_path = os.path.join(PROJECT_ROOT, "cryptoscan", "cryptoscan")
    if os.path.isfile(cryptoscan_path) and os.access(cryptoscan_path, os.X_OK):
        print(f"[PASS] CryptoScan binary is present and executable at cryptoscan/cryptoscan")
    else:
        print(f"[WARN] CryptoScan binary missing at cryptoscan/cryptoscan (will attempt build via 'go build' if Go is installed)")

    # 4. Check Hindsight Memory Configuration
    print("\n--- Hindsight Persistent AI Memory ---")
    hindsight_enabled_raw = os.getenv("HINDSIGHT_ENABLED", "true").lower()
    hindsight_enabled = hindsight_enabled_raw in ("true", "1", "yes")

    if not hindsight_enabled:
        print("[INFO] HINDSIGHT_ENABLED=false: Hindsight memory disabled (local session fallback active)")
    else:
        hs_key = os.getenv("HINDSIGHT_API_KEY", "").strip()
        hs_base_url = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io").strip()
        hs_bank_id = os.getenv("HINDSIGHT_BANK_ID", "encryptplus-agent").strip()

        # Check Key
        if not hs_key or is_placeholder(hs_key):
            print("[FAIL] Hindsight API key not configured or contains placeholder")
            all_passed = False
            missing_actions.append(
                "HINDSIGHT_API_KEY is missing. Obtain a key from your Hindsight/Vectorize console (https://hindsight.vectorize.io) and add to .env"
            )
        else:
            print(f"[PASS] Hindsight API key configured ({mask_secret(hs_key)})")

        # Check Base URL
        parsed_hs_url = urlparse(hs_base_url)
        if parsed_hs_url.scheme in ("http", "https") and parsed_hs_url.netloc:
            print(f"[PASS] Hindsight endpoint configured ({hs_base_url})")
        else:
            print(f"[FAIL] HINDSIGHT_BASE_URL is invalid: '{hs_base_url}'")
            all_passed = False
            missing_actions.append("Set HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io in .env")

        # Check Bank ID
        if hs_bank_id:
            print(f"[PASS] Memory bank configured ({hs_bank_id})")
        else:
            print("[FAIL] HINDSIGHT_BANK_ID is empty")
            all_passed = False
            missing_actions.append("Set HINDSIGHT_BANK_ID=encryptplus-agent in .env")

    # 5. Overall Status Summary
    print("\n" + "=" * 60)
    if all_passed:
        print("Status: READY")
        print("All required configurations and services are fully set up!")
        print("=" * 60)
        return 0
    else:
        print("Status: ACTION REQUIRED")
        print("\nPlease address the following item(s) in your root .env file:")
        for idx, action in enumerate(missing_actions, 1):
            print(f"  {idx}. {action}")
        print("\nNote: EncryptPlus can still run in local fallback mode if you launch it now.")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(check_config())
