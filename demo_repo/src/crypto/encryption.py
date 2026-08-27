"""
Encryption Module - Multiple algorithm usage patterns
"""
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.asymmetric import ec, dh
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
import os

# AES-256-GCM encryption (quantum-safe symmetric)
def encrypt_aes_gcm(key: bytes, plaintext: bytes) -> tuple:
    """Encrypt using AES-256-GCM (quantum-resistant symmetric cipher)."""
    nonce = os.urandom(12)
    cipher = Cipher(algorithms.AES(key), modes.GCM(nonce))
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext) + encryptor.finalize()
    return nonce, ciphertext, encryptor.tag

# AES-128-CBC encryption (quantum-partial, needs key size increase)
def encrypt_aes_cbc(key: bytes, plaintext: bytes) -> tuple:
    """Encrypt using AES-128-CBC (vulnerable to Grover's - increase to 256-bit)."""
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext) + encryptor.finalize()
    return iv, ciphertext

# ECDSA P-256 signing (quantum-vulnerable)
def generate_ecdsa_key():
    """Generate ECDSA P-256 key pair (quantum-vulnerable via Shor's)."""
    private_key = ec.generate_private_key(ec.SECP256R1())
    return private_key

# ECDH key exchange (quantum-vulnerable)
def perform_ecdh(private_key, peer_public_key):
    """Perform ECDH key exchange (quantum-vulnerable)."""
    shared_key = private_key.exchange(ec.ECDH(), peer_public_key)
    derived_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"handshake data",
    ).derive(shared_key)
    return derived_key

# DH Parameters (quantum-vulnerable, legacy)
def generate_dh_parameters():
    """Generate DH parameters (quantum-vulnerable via Shor's)."""
    parameters = dh.generate_parameters(generator=2, key_size=2048)
    return parameters

# PBKDF2 key derivation
def derive_key_pbkdf2(password: bytes, salt: bytes) -> bytes:
    """Derive key using PBKDF2-HMAC-SHA256."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    return kdf.derive(password)

# Hardcoded encryption key - CRITICAL SECURITY ISSUE
ENCRYPTION_KEY = b"0123456789abcdef0123456789abcdef"

def encrypt_with_hardcoded_key(data: bytes) -> tuple:
    """INSECURE: Uses hardcoded key."""
    return encrypt_aes_gcm(ENCRYPTION_KEY, data)
