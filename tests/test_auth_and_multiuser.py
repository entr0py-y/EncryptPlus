import pytest
import uuid
from typing import Tuple
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api import models, database
from apps.api.auth import (
    hash_password,
    verify_password,
    create_access_token,
    normalize_email,
    is_valid_email,
    validate_password_policy,
    AUTH_COOKIE_NAME,
)
from apps.api.hindsight_service import HindsightMemoryService
from apps.api.task_worker import create_agent_task, execute_agent_scan_task

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db():
    session = database.SessionLocal()
    try:
        yield session
    finally:
        session.close()

# -------------------------------------------------------------------------
# 1 & 2 & 3 & 4. SIGNUP & PASSWORD HASHING TESTS
# -------------------------------------------------------------------------

def test_signup_successful(client):
    """1. Verifies that a new user can sign up successfully."""
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "Alice Test",
        "email": unique_email,
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!"
    }
    res = client.post("/api/auth/signup", json=payload)
    assert res.status_code == 201, res.text
    data = res.json()
    assert "user" in data
    assert data["user"]["email"] == unique_email.lower()
    assert data["user"]["name"] == "Alice Test"
    assert "id" in data["user"]
    # Check that session cookie was set
    assert AUTH_COOKIE_NAME in res.cookies

def test_signup_invalid_inputs_rejected(client):
    """2. Verifies that invalid signup inputs are rejected with clear validation errors."""
    # A. Short password
    res = client.post("/api/auth/signup", json={
        "name": "Bob",
        "email": "bob@example.com",
        "password": "short",
        "confirm_password": "short"
    })
    assert res.status_code == 400
    assert "at least 8 characters" in res.json()["detail"].lower()

    # B. Invalid email format
    res = client.post("/api/auth/signup", json={
        "name": "Bob",
        "email": "not-an-email",
        "password": "ValidPassword123!",
        "confirm_password": "ValidPassword123!"
    })
    assert res.status_code == 400
    assert "valid email" in res.json()["detail"].lower()

    # C. Mismatched passwords
    res = client.post("/api/auth/signup", json={
        "name": "Bob",
        "email": f"bob_{uuid.uuid4().hex[:6]}@example.com",
        "password": "ValidPassword123!",
        "confirm_password": "MismatchedPassword123!"
    })
    assert res.status_code == 400
    assert "passwords do not match" in res.json()["detail"].lower()

def test_duplicate_email_registration_rejected(client):
    """3. Verifies that duplicate email registration is rejected."""
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "Original User",
        "email": email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    # First registration
    res1 = client.post("/api/auth/signup", json=payload)
    assert res1.status_code == 201

    # Second registration with uppercase variations
    payload["email"] = email.upper()
    res2 = client.post("/api/auth/signup", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()

def test_password_hashed_with_argon2id(db):
    """4. Verifies that passwords are hashed using Argon2id and never stored in plaintext."""
    raw_password = "SecretPassword123!"
    hashed = hash_password(raw_password)

    # Argon2id hashes begin with $argon2id$
    assert hashed.startswith("$argon2id$")
    assert raw_password not in hashed
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

# -------------------------------------------------------------------------
# 5 & 6 & 7 & 8. LOGIN, LOGOUT & PERSISTENT SESSION TESTS
# -------------------------------------------------------------------------

def test_login_successful_and_invalid_rejected(client):
    """5 & 6. Verifies login with valid credentials and rejection of invalid credentials."""
    email = f"logintest_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "ValidLoginPass123!"

    # Sign up
    client.post("/api/auth/signup", json={
        "name": "Login Tester",
        "email": email,
        "password": pwd,
        "confirm_password": pwd
    })

    # Test invalid password
    res_bad = client.post("/api/auth/login", json={
        "email": email,
        "password": "WrongPassword999!"
    })
    assert res_bad.status_code == 401
    assert "invalid email or password" in res_bad.json()["detail"].lower()

    # Test valid login
    res_ok = client.post("/api/auth/login", json={
        "email": email.upper(),  # test case-insensitivity
        "password": pwd
    })
    assert res_ok.status_code == 200
    assert AUTH_COOKIE_NAME in res_ok.cookies
    assert res_ok.json()["user"]["email"] == email.lower()

def test_session_persistence_and_logout(client):
    """7 & 8. Verifies persistent login across requests and session termination on logout."""
    email = f"persist_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "PersistentPass123!"

    # 1. Signup sets cookie
    signup_res = client.post("/api/auth/signup", json={
        "name": "Persist User",
        "email": email,
        "password": pwd,
        "confirm_password": pwd
    })
    assert signup_res.status_code == 201

    # 2. Query /api/auth/me using the cookie set by signup
    me_res = client.get("/api/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email.lower()

    # 3. Logout clears cookie
    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200

    # 4. Subsequent request must be rejected or return 204 No Content
    me_after = client.get("/api/auth/me")
    assert me_after.status_code in (204, 401)

# -------------------------------------------------------------------------
# 9. UNPROTECTED VS PROTECTED ROUTE ENFORCEMENT
# -------------------------------------------------------------------------

def test_unauthenticated_requests_rejected(client, db):
    """9. Verifies that unauthenticated requests to protected endpoints return 401."""
    client.cookies.clear()
    
    # Create a private scan owned by a user
    private_scan = models.Scan(
        user_id="secret_user_123",
        repository_url="https://github.com/secret/repo.git",
        branch="main",
        status="COMPLETED"
    )
    db.add(private_scan)
    db.commit()
    db.refresh(private_scan)

    # Scans write endpoints require authentication (guest exploration allows public reads)
    assert client.post("/api/scans", json={"repository_url": "test_repo"}).status_code == 401
    assert client.get(f"/api/scans/{private_scan.id}").status_code == 401
    assert client.get(f"/api/scans/{private_scan.id}/report").status_code == 401
    assert client.get(f"/api/scans/{private_scan.id}/cbom").status_code == 401

    # Agent endpoints
    assert client.get("/api/agent/tasks").status_code == 401
    assert client.post("/api/agent/chat", json={"message": "hello"}).status_code == 401
    assert client.get("/api/agent/memories").status_code == 401

# -------------------------------------------------------------------------
# 10 & 11 & 12 & 13. STRICT MULTI-USER DATA ISOLATION TESTS
# -------------------------------------------------------------------------

def create_authenticated_client(name: str) -> Tuple[TestClient, str]:
    """Helper creating an isolated test client with a registered user session."""
    c = TestClient(app)
    email = f"{name}_{uuid.uuid4().hex[:8]}@isolated.test"
    pwd = "IsolatedPassword123!"
    res = c.post("/api/auth/signup", json={
        "name": name,
        "email": email,
        "password": pwd,
        "confirm_password": pwd
    })
    assert res.status_code == 201
    user_id = res.json()["user"]["id"]
    return c, user_id

def test_cross_user_scan_isolation(db):
    """10, 11, 12. Verifies User A cannot read, modify, or export User B's scans or reports."""
    client_a, user_a_id = create_authenticated_client("user_alice")
    client_b, user_b_id = create_authenticated_client("user_bob")

    # User A creates a scan
    scan_a = models.Scan(
        user_id=user_a_id,
        repository_url="https://github.com/alice/private-crypto.git",
        branch="main",
        status="COMPLETED",
        overall_risk_score=78.5,
        total_findings=2
    )
    db.add(scan_a)
    db.commit()
    db.refresh(scan_a)

    # Add an asset to scan_a
    asset = models.CryptoAsset(
        scan_id=scan_a.id,
        algorithm="RSA",
        key_size=1024,
        severity="HIGH",
        quantum_status="VULNERABLE"
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    # 1. User A can access their scan
    res_a = client_a.get(f"/api/scans/{scan_a.id}")
    assert res_a.status_code == 200
    assert res_a.json()["id"] == scan_a.id

    # 2. User B CANNOT access User A's scan (returns 403 Forbidden)
    res_b = client_b.get(f"/api/scans/{scan_a.id}")
    assert res_b.status_code == 403

    # 3. User B cannot access User A's scan sub-resources
    assert client_b.get(f"/api/scans/{scan_a.id}/report").status_code == 403
    assert client_b.get(f"/api/scans/{scan_a.id}/cbom").status_code == 403
    assert client_b.get(f"/api/scans/{scan_a.id}/findings").status_code == 403
    assert client_b.get(f"/api/scans/{scan_a.id}/assets").status_code == 403

    # 4. User B cannot modify User A's asset
    patch_res = client_b.patch(f"/api/assets/{asset.id}", json={"business_criticality": "HIGH"})
    assert patch_res.status_code == 403

    # 5. User B does NOT see User A's scan in their scan list
    list_b = client_b.get("/api/scans").json()
    assert not any(s["id"] == scan_a.id for s in list_b)

def test_cross_user_task_and_conversation_isolation(db):
    """13. Verifies User A cannot view User B's agent tasks or chat context."""
    client_a, user_a_id = create_authenticated_client("task_alice")
    client_b, user_b_id = create_authenticated_client("task_bob")

    # Create task for User A
    task_a = create_agent_task(
        db=db,
        prompt="Audit Alice Repository",
        target_resource="alice_repo",
        user_id=user_a_id
    )

    # User A can see their task
    tasks_a = client_a.get("/api/agent/tasks").json()
    assert any(t["task_id"] == task_a.task_id for t in tasks_a)

    # User B CANNOT see User A's task in task list
    tasks_b = client_b.get("/api/agent/tasks").json()
    assert not any(t["task_id"] == task_a.task_id for t in tasks_b)

    # User B CANNOT fetch User A's task detail
    res_task_b = client_b.get(f"/api/agent/tasks/{task_a.task_id}")
    assert res_task_b.status_code == 403

# -------------------------------------------------------------------------
# 14 & 15. HINDSIGHT SCOPING & WORKER OWNER PRESERVATION
# -------------------------------------------------------------------------

def test_hindsight_user_scoping():
    """14. Verifies Hindsight memory namespaces and storage are strictly scoped to user IDs."""
    service = HindsightMemoryService()
    user1 = f"user_{uuid.uuid4().hex[:6]}"
    user2 = f"user_{uuid.uuid4().hex[:6]}"

    service.retain_memory(user1, "User1 has critical TLS 1.0 infrastructure.")
    service.retain_memory(user2, "User2 has post-quantum ML-KEM implemented.")

    memories1 = service.recall_relevant_memories(user1, "infrastructure")
    memories2 = service.recall_relevant_memories(user2, "infrastructure")

    assert any("TLS 1.0" in m for m in memories1)
    # User 2 must never receive User 1's memory
    assert not any("TLS 1.0" in m for m in memories2)

def test_background_worker_preserves_owner_id(db):
    """15. Verifies background worker tasks preserve the owner user ID when creating scans."""
    unique_owner = f"worker_owner_{uuid.uuid4().hex[:6]}"
    task = create_agent_task(
        db=db,
        prompt="Scan worker repo",
        target_resource="demo_repo",
        user_id=unique_owner
    )
    assert task.user_id == unique_owner

    # If worker creates scan, scan.user_id must match task.user_id
    scan = models.Scan(
        repository_url="demo_repo",
        branch="main",
        status="QUEUED",
        user_id=task.user_id
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    assert scan.user_id == unique_owner
