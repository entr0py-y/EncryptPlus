import pytest
from fastapi.testclient import TestClient
from apps.api.main import app

@pytest.fixture
def client():
    c = TestClient(app)
    from apps.api.auth import create_access_token, AUTH_COOKIE_NAME
    token = create_access_token("dev_user", "developer@encryptplus.local")
    c.cookies.set(AUTH_COOKIE_NAME, token)
    c.headers.update({"Authorization": f"Bearer {token}"})
    return c

def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

def test_existing_scans_endpoint(client):
    res = client.get("/api/scans")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_existing_scan_detail_and_report_endpoints(client):
    # Fetch list of existing scans
    scans_res = client.get("/api/scans")
    scans = scans_res.json()
    if not scans:
        pytest.skip("No existing scans in test database")

    scan_id = scans[0]["id"]

    # 1. Detail endpoint
    detail_res = client.get(f"/api/scans/{scan_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == scan_id

    # 2. CBOM export endpoint
    cbom_res = client.get(f"/api/scans/{scan_id}/cbom")
    assert cbom_res.status_code == 200
    assert cbom_res.json().get("bomFormat") == "CycloneDX"

    # 3. 18-Section Assessment Report
    report_res = client.get(f"/api/scans/{scan_id}/report")
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert "sections" in report_data
    assert len(report_data["sections"]) == 18

    # 4. Algorithms breakdown
    algo_res = client.get(f"/api/scans/{scan_id}/algorithms")
    assert algo_res.status_code == 200
    assert isinstance(algo_res.json(), dict)

def test_new_agent_chat_endpoint(client):
    """Verifies that the new agent chat endpoint responds with verified context and links."""
    res = client.post("/api/agent/chat", json={
        "message": "List recent scans",
        "user_id": "test_user_regression"
    })
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert data["user_id"] == "dev_user"
    assert data["status"] == "success"

def test_new_agent_tasks_endpoint(client):
    """Verifies that the new agent tasks endpoint returns durable task list."""
    res = client.get("/api/agent/tasks?user_id=test_user_regression")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
