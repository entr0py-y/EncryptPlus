import json
from typing import Dict, Any, List
from .models import CryptoAsset

def infer_algorithm_details(f: dict) -> tuple[str, str, str, str]:
    """
    Infers (algorithm, asset_type, primitive, quantum_status) from raw CryptoScan finding.
    Preserves all reported data while restoring algorithm / asset classifications.
    """
    raw_algo = f.get("algorithm")
    pid = (f.get("id") or "").strip()
    match_str = (f.get("match") or "").strip()
    ftype = (f.get("type") or "").strip()
    cat = (f.get("category") or "").strip()
    primitive = f.get("primitive")
    quantum_status = f.get("quantumRisk") or "UNKNOWN"
    asset_type = f.get("findingType") or "ALGORITHM"

    # Normalize category to asset_type
    if cat == "Certificate":
        asset_type = "CERTIFICATE"
    elif cat == "Library Import":
        asset_type = "LIBRARY"
    elif cat == "Secret Detection":
        asset_type = "SECRET"
    elif cat in ["TLS/SSL", "Deprecated Protocol"]:
        asset_type = "PROTOCOL"
    elif cat in ["Asymmetric Encryption", "Symmetric Encryption", "Hash Function", "Broken Hash", "Key Derivation", "Message Authentication Code", "Deprecated Algorithm", "Weak Cipher"]:
        asset_type = "ALGORITHM"

    # Pattern specific resolution
    if "CERT-SIGALG" in pid or "Signature Algorithm" in ftype:
        asset_type = "ALGORITHM"
        primitive = primitive or "signature"
        quantum_status = "VULNERABLE"
        m = match_str.upper()
        if "SHA256WITHRSA" in m or ("SHA-256" in m and "RSA" in m) or "SHA256" in m and "RSA" in m:
            raw_algo = "SHA-256 with RSA"
        elif "SHA1WITHRSA" in m or ("SHA-1" in m and "RSA" in m) or "SHA1" in m and "RSA" in m:
            raw_algo = "SHA-1 with RSA"
        elif "SHA512WITHRSA" in m or ("SHA-512" in m and "RSA" in m) or "SHA512" in m and "RSA" in m:
            raw_algo = "SHA-512 with RSA"
        elif "SHA384WITHRSA" in m or ("SHA-384" in m and "RSA" in m) or "SHA384" in m and "RSA" in m:
            raw_algo = "SHA-384 with RSA"
        elif "MD5WITHRSA" in m or ("MD5" in m and "RSA" in m):
            raw_algo = "MD5 with RSA"
        elif "ECDSA" in m:
            raw_algo = "ECDSA Signature"
        elif "ED25519" in m:
            raw_algo = "Ed25519 Signature"
        elif "RSA" in m:
            raw_algo = "RSA Signature"
        else:
            raw_algo = "X.509 Signature Algorithm"

    elif pid.startswith("KEY-001"):
        asset_type = "KEY"
        primitive = primitive or "pke"
        quantum_status = "VULNERABLE"
        raw_algo = "RSA Private Key" if "RSA" in match_str.upper() else "Private Key Header"

    elif pid.startswith("KEY-002"):
        asset_type = "KEY"
        primitive = primitive or "signature"
        quantum_status = "VULNERABLE"
        raw_algo = "EC Private Key"

    elif pid.startswith("KEY-003"):
        asset_type = "KEY"
        primitive = primitive or "signature"
        quantum_status = "VULNERABLE"
        raw_algo = "DSA Private Key"

    elif pid.startswith("KEY-004"):
        asset_type = "KEY"
        quantum_status = "VULNERABLE"
        raw_algo = "OpenSSH Key Material"

    elif pid.startswith("KEY-006"):
        asset_type = "KEY"
        quantum_status = "VULNERABLE"
        raw_algo = "PKCS#8 Private Key"

    elif pid.startswith("SECRET-"):
        asset_type = "SECRET"
        raw_algo = raw_algo or ftype or "Hardcoded Secret / Key Material"

    elif pid.startswith("PBKDF-") or "Key Derivation" in cat:
        asset_type = "ALGORITHM"
        primitive = primitive or "kdf"
        quantum_status = "PARTIAL"
        raw_algo = raw_algo or "PBKDF2"

    elif pid.startswith("TLS-001"):
        asset_type = "PROTOCOL"
        quantum_status = "VULNERABLE"
        raw_algo = "TLS 1.0/1.1"

    elif pid.startswith("TLS-002"):
        asset_type = "PROTOCOL"
        quantum_status = "PARTIAL"
        if "1.3" in match_str:
            raw_algo = "TLS 1.3"
        elif "1.2" in match_str:
            raw_algo = "TLS 1.2"
        else:
            raw_algo = "TLS Protocol Configuration"

    elif pid.startswith("CIPHER-"):
        asset_type = "PROTOCOL"
        raw_algo = "Cipher Suite Configuration"

    elif pid.startswith("LIB-JAVA") or "Java Crypto Import" in ftype:
        asset_type = "LIBRARY"
        raw_algo = "Java Cryptography Architecture (JCA/JCE)"

    elif pid.startswith("LIB-OPENSSL") or "OpenSSL" in ftype:
        asset_type = "LIBRARY"
        raw_algo = "OpenSSL Native Binding"

    elif pid.startswith("LIB-PY") or "Python Crypto" in ftype:
        asset_type = "LIBRARY"
        raw_algo = "Python Cryptography Library"

    elif pid.startswith("CERT-EXPIRY"):
        asset_type = "CERTIFICATE"
        raw_algo = "X.509 Certificate Expiration Check"

    elif pid.startswith("CERT-MTLS"):
        asset_type = "PROTOCOL"
        raw_algo = "Mutual TLS (mTLS)"

    elif pid.startswith("CERT-SUBJECT"):
        asset_type = "CERTIFICATE"
        raw_algo = "X.509 Subject/Issuer DN"

    elif pid.startswith("CERT-PARSE"):
        asset_type = "CERTIFICATE"
        raw_algo = "X.509 Certificate Parser"

    elif pid.startswith("CERT-PINNING"):
        asset_type = "CERTIFICATE"
        raw_algo = "X.509 Certificate Pinning"

    elif pid.startswith("CERT-CHAIN"):
        asset_type = "CERTIFICATE"
        raw_algo = "X.509 Certificate Chain Validation"

    elif pid.startswith("CERT-SAN"):
        asset_type = "CERTIFICATE"
        raw_algo = "X.509 Subject Alternative Name (SAN)"

    elif pid.startswith("CERT-KEYUSAGE"):
        asset_type = "CERTIFICATE"
        raw_algo = "X.509 Key Usage Extension"

    elif pid.startswith("CERT-PKCS12"):
        asset_type = "CERTIFICATE"
        raw_algo = "PKCS#12 Keystore Container"

    elif pid.startswith("CERT-SELFSIGNED"):
        asset_type = "CERTIFICATE"
        raw_algo = "Self-Signed X.509 Certificate"

    elif pid.startswith("CERT-001"):
        asset_type = "CERTIFICATE"
        raw_algo = "X.509 Certificate Header"

    elif pid.startswith("CERT-REVOCATION"):
        asset_type = "CERTIFICATE"
        raw_algo = "CRL / OCSP Revocation Check"

    # Default fallback
    if not raw_algo or not raw_algo.strip():
        raw_algo = "Algorithm could not be determined from available evidence"

    return raw_algo, asset_type, primitive or "general", quantum_status

def parse_cryptoscan_output(scan_id: int, raw_output: dict) -> List[CryptoAsset]:
    assets = []
    findings = raw_output.get("findings", [])
    
    severity_map = {
        0: "INFO",
        1: "LOW",
        2: "MEDIUM",
        3: "HIGH",
        4: "CRITICAL"
    }
    
    for f in findings:
        sev_int = f.get("severity", 0)
        sev_str = severity_map.get(sev_int, "INFO")
        
        algo, asset_type, primitive, quantum_status = infer_algorithm_details(f)
        
        asset = CryptoAsset(
            scan_id=scan_id,
            cryptoscan_id=f.get("id"),
            asset_type=asset_type,
            algorithm=algo,
            category=f.get("category"),
            primitive=primitive,
            key_size=f.get("keySize"),
            language=f.get("language"),
            file_path=f.get("file"),
            line_start=f.get("line"),
            column=f.get("column"),
            match_text=f.get("match"),
            context=f.get("context"),
            source_context_json=json.dumps(f.get("sourceContext")) if f.get("sourceContext") else None,
            finding_type=f.get("type"),
            file_type=f.get("fileType"),
            confidence=f.get("confidence") or "MEDIUM",
            purpose=f.get("purpose") or "general",
            quantum_status=quantum_status,
            migration_status=f.get("migrationStatus") or "UNKNOWN",
            severity=sev_str,
            data_sensitivity="UNKNOWN_SENSITIVITY",
            data_lifetime="UNKNOWN_LIFETIME",
            migration_time="UNKNOWN_MIGRATION_TIME",
            business_criticality="UNKNOWN_CRITICALITY",
            description=f.get("description"),
            remediation=f.get("remediation"),
            impact=f.get("impact"),
            effort=f.get("effort"),
            references_json=json.dumps(f.get("references")) if f.get("references") else None,
            tags_json=json.dumps(f.get("tags")) if f.get("tags") else None,
            oid=f.get("oid")
        )
        assets.append(asset)
        
    return assets
