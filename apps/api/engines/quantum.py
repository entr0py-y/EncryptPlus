from ..crypto_knowledge import QUANTUM_STATUS
from ..models import CryptoAsset

def assess_quantum_risk(asset: CryptoAsset):
    if not asset.algorithm:
        return
        
    algo = asset.algorithm.upper()
    
    # Check if this is a certificate operational check (not an algorithm primitive)
    if asset.asset_type == "CERTIFICATE" and "SIGNATURE" not in algo:
        asset.quantum_status = "UNKNOWN"
        return

    # Check asymmetric signatures & public key encryption (broken by Shor's)
    if any(a in algo for a in ["RSA", "ELGAMAL", "DSA", "ECDSA", "ED25519", "SECP256", "SECP384", "SECP521", "DH", "ECDH"]):
        asset.quantum_status = "VULNERABLE"
    elif any(a in algo for a in ["MD5", "SHA-1", "SHA1", "DES", "3DES", "RC4", "TLS 1.0", "TLS 1.1"]):
        asset.quantum_status = "VULNERABLE"
    elif any(a in algo for a in ["ML-KEM", "ML-DSA", "SLH-DSA", "FALCON", "SPHINCS", "LMS", "XMSS"]):
        asset.quantum_status = "SAFE"
    elif "X25519" in algo and "ML-KEM" in algo:
        asset.quantum_status = "SAFE"
    elif "AES-256" in algo or "AES256" in algo or "SHA-384" in algo or "SHA-512" in algo or "SHA3-384" in algo or "SHA3-512" in algo or "KMAC256" in algo:
        asset.quantum_status = "SAFE"
    elif any(a in algo for a in ["AES", "SHA-2", "SHA-256", "SHA256", "SHA3-256", "CHACHA20", "PBKDF2", "ARGON2", "BCRYPT", "HMAC-SHA2", "HMAC-SHA256", "TLS 1.2", "TLS 1.3"]):
        asset.quantum_status = "PARTIAL"
    else:
        # Fallback to map
        matched = False
        for k, v in QUANTUM_STATUS.items():
            if k.upper() in algo:
                asset.quantum_status = v
                matched = True
                break
        if not matched and asset.quantum_status == "UNKNOWN":
            asset.quantum_status = "UNKNOWN"
