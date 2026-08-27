def calculate_category_scores(assets: list) -> dict:
    if not assets:
        return {
            "Algorithm": 100,
            "Key": 100,
            "Config": 100,
            "Misuse": 100,
            "Vulnerability": 100,
            "Dependency": 100,
            "Protocol": 100,
            "Certificate": 100,
            "Compliance": 100,
            "PQC Readiness": 100
        }

    algo_penalties = 0
    key_penalties = 0
    config_penalties = 0
    misuse_penalties = 0
    vuln_penalties = 0
    dep_penalties = 0
    proto_penalties = 0
    cert_penalties = 0
    comp_penalties = 0
    
    safe_or_hybrid = 0
    vulnerable_pqc = 0

    for a in assets:
        sev = (a.severity or "INFO").upper()
        q_stat = (a.quantum_status or "UNKNOWN").upper()
        algo = (a.algorithm or "").upper()
        cat = (a.category or "").upper()
        atype = (a.asset_type or "").upper()

        # Vulnerability score
        if sev == "CRITICAL":
            vuln_penalties += 15
        elif sev == "HIGH":
            vuln_penalties += 8
        elif sev == "MEDIUM":
            vuln_penalties += 3

        # Algorithm score
        if any(broken in algo for broken in ["MD5", "SHA-1", "SHA1", "DES", "3DES", "RC4"]):
            algo_penalties += 15
        elif a.key_size and a.key_size < 2048 and "RSA" in algo:
            algo_penalties += 10
        elif sev in ["HIGH", "CRITICAL"] and atype == "ALGORITHM":
            algo_penalties += 5

        # Key score
        if atype in ["KEY", "SECRET"] or "SECRET" in cat:
            key_penalties += 20 if sev in ["HIGH", "CRITICAL"] else 10

        # Protocol score
        if atype == "PROTOCOL" or "TLS" in cat or "PROTOCOL" in cat:
            if "TLS 1.0" in algo or "TLS 1.1" in algo or "SSL" in algo:
                proto_penalties += 25
            elif sev in ["HIGH", "CRITICAL"]:
                proto_penalties += 10

        # Certificate score
        if atype == "CERTIFICATE" or "CERTIFICATE" in cat:
            if "WEAK" in (a.finding_type or "").upper() or "MD5" in algo or "SHA-1" in algo:
                cert_penalties += 20
            elif "SELFSIGNED" in (a.cryptoscan_id or ""):
                cert_penalties += 10
            elif sev in ["HIGH", "CRITICAL"]:
                cert_penalties += 5

        # Misuse & Config score
        if "PBKDF" in algo or "WEAK PBKDF" in (a.finding_type or "").upper():
            misuse_penalties += 8
        if atype == "CONFIG" or "CONFIG" in cat:
            config_penalties += 15 if sev in ["HIGH", "CRITICAL"] else 5

        # Dependency score
        if atype == "LIBRARY" or "LIBRARY" in cat:
            if sev in ["HIGH", "CRITICAL"]:
                dep_penalties += 10

        # Compliance score
        if sev in ["CRITICAL", "HIGH"] or any(broken in algo for broken in ["MD5", "SHA-1", "DES", "RC4", "TLS 1.0", "TLS 1.1"]):
            comp_penalties += 10

        # PQC calculation
        if q_stat in ["SAFE", "HYBRID"]:
            safe_or_hybrid += 1
        elif q_stat == "VULNERABLE":
            vulnerable_pqc += 1

    total_crypto = safe_or_hybrid + vulnerable_pqc
    if total_crypto > 0:
        pqc_score = round((safe_or_hybrid / total_crypto) * 100, 1)
    else:
        pqc_score = 50.0

    return {
        "Algorithm": max(0, 100 - algo_penalties),
        "Key": max(0, 100 - key_penalties),
        "Config": max(0, 100 - config_penalties),
        "Misuse": max(0, 100 - misuse_penalties),
        "Vulnerability": max(0, 100 - vuln_penalties),
        "Dependency": max(0, 100 - dep_penalties),
        "Protocol": max(0, 100 - proto_penalties),
        "Certificate": max(0, 100 - cert_penalties),
        "Compliance": max(0, 100 - comp_penalties),
        "PQC Readiness": pqc_score
    }
