import pytest
from apps.api.hindsight_service import HindsightMemoryService

def test_user_memory_isolation():
    """Verifies that User A's memories cannot be retrieved or accessed by User B."""
    service = HindsightMemoryService()
    
    # Store memories for User Alice
    service.retain_memory("user_alice", "Alice requested an audit of payment-gateway for CNSA 2.0 compliance.")
    service.retain_memory("user_alice", "Alice decided to prioritize RSA-2048 migration to ML-KEM-768.")

    # Store memories for User Bob
    service.retain_memory("user_bob", "Bob works on the public-api repository and prefers minimal reports.")

    # Alice queries memory
    alice_memories = service.recall_relevant_memories("user_alice", "payment-gateway", limit=5)
    assert any("payment-gateway" in m for m in alice_memories)
    assert not any("public-api" in m for m in alice_memories)

    # Bob queries memory
    bob_memories = service.recall_relevant_memories("user_bob", "payment-gateway", limit=5)
    # Bob must NOT receive Alice's payment-gateway memories
    assert not any("payment-gateway" in m for m in bob_memories)

def test_hindsight_graceful_outage_fallback(monkeypatch):
    """Verifies that when external Hindsight credentials are not set, service operates gracefully."""
    monkeypatch.setenv("HINDSIGHT_API_KEY", "")
    service = HindsightMemoryService()
    assert service.is_configured is False

    # Should retain locally without throwing an exception
    retained = service.retain_memory("dev_user", "Testing local fallback memory.")
    assert retained is True

    # Should recall locally without throwing an exception
    recalled = service.recall_relevant_memories("dev_user", "local fallback")
    assert len(recalled) > 0
    assert "Testing local fallback memory." in recalled[0]

def test_memory_sanitizes_cryptographic_secrets():
    """Verifies that private keys or certificates are never stored in plain text in memory."""
    service = HindsightMemoryService()
    secret_payload = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END RSA PRIVATE KEY-----"
    
    service.retain_memory("dev_user", f"Here is the key: {secret_payload}")
    recalled = service.recall_relevant_memories("dev_user", "RSA PRIVATE KEY")
    
    for m in recalled:
        assert "-----BEGIN RSA PRIVATE KEY-----" not in m
        assert "sanitized from memory payload" in m
