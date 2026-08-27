"""
JWT Authentication Module
Uses RSA-2048 for token signing - NEEDS QUANTUM MIGRATION
"""
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
import hashlib
import hmac
import base64
import json

# RSA-2048 Key Generation for JWT Signing
# This is quantum-vulnerable and must be migrated to ML-DSA
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)

public_key = private_key.public_key()

def sign_token(payload: dict) -> bytes:
    """Sign a JWT token using RSA-2048 (quantum-vulnerable)."""
    token_data = json.dumps(payload).encode()
    signature = private_key.sign(
        token_data,
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    return base64.b64encode(signature)

def verify_token(payload: dict, signature: bytes) -> bool:
    """Verify JWT token signature."""
    token_data = json.dumps(payload).encode()
    try:
        public_key.verify(
            base64.b64decode(signature),
            token_data,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False

# Hardcoded HMAC secret - SECURITY ISSUE
HMAC_SECRET = b"super_secret_key_do_not_share_12345"

def create_hmac(message: bytes) -> str:
    """Create HMAC-SHA256 for message integrity."""
    return hmac.new(HMAC_SECRET, message, hashlib.sha256).hexdigest()

# Legacy MD5 hash - DEPRECATED, classically broken
def hash_password_legacy(password: str) -> str:
    """DEPRECATED: Uses MD5. Migrate to Argon2id."""
    return hashlib.md5(password.encode()).hexdigest()

# SHA-1 usage - DEPRECATED
def hash_data_sha1(data: bytes) -> str:
    """DEPRECATED: Uses SHA-1. Migrate to SHA-256."""
    return hashlib.sha1(data).hexdigest()

# Proper SHA-256 usage
def hash_data_secure(data: bytes) -> str:
    """Secure hashing using SHA-256."""
    return hashlib.sha256(data).hexdigest()
