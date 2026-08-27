def generate_report(scan, assets, compliance, recommendations, scores):
    critical_count = sum(1 for a in assets if (a.severity or "").upper() == "CRITICAL")
    high_count = sum(1 for a in assets if (a.severity or "").upper() == "HIGH")
    medium_count = sum(1 for a in assets if (a.severity or "").upper() == "MEDIUM")
    low_count = sum(1 for a in assets if (a.severity or "").upper() == "LOW")
    info_count = sum(1 for a in assets if (a.severity or "").upper() == "INFO")
    
    q_vuln_count = sum(1 for a in assets if (a.quantum_status or "").upper() == "VULNERABLE")
    q_safe_count = sum(1 for a in assets if (a.quantum_status or "").upper() == "SAFE")
    q_partial_count = sum(1 for a in assets if (a.quantum_status or "").upper() == "PARTIAL")
    
    unique_algos = sorted(list(set((a.algorithm or "Undetermined") for a in assets)))
    
    sections = [
        {
            "id": 1,
            "title": "1. Executive Summary",
            "content": f"Enterprise Cryptographic Discovery & Analysis Tool (ECDAT) completed deep cryptographic inspection for target '{scan.repository_url or 'Local'}' across {scan.files_scanned or 0} files ({scan.lines_scanned or 0} lines scanned). The analysis identified {len(assets)} total cryptographic artefacts, yielding an Overall Risk Score of {scan.overall_risk_score or 'N/A'}/100 ({scan.overall_risk_level or 'MODERATE'} Risk) and a Post-Quantum Cryptography (PQC) Readiness Score of {scan.pqc_readiness_score or 'N/A'}% ({scan.pqc_readiness_level or 'DEVELOPING'}). Immediate remediation is required for {critical_count} critical-severity and {high_count} high-severity findings."
        },
        {
            "id": 2,
            "title": "2. Overall Risk Score & Posture",
            "content": f"Risk Score: {scan.overall_risk_score or 'N/A'}/100 ({scan.overall_risk_level or 'MODERATE'}). The deterministic risk model evaluates algorithm strength (classical security), quantum vulnerability, key lengths, configuration safety, and detection confidence. Higher scores indicate elevated enterprise exposure."
        },
        {
            "id": 3,
            "title": "3. Cryptographic Inventory Summary",
            "content": f"Catalogued {len(assets)} cryptographic assets comprising {len(unique_algos)} distinct primitives and mechanisms across the codebase. Assets include asymmetric keys, hash functions, symmetric ciphers, key derivation mechanisms, and PKI trust anchors."
        },
        {
            "id": 4,
            "title": "4. Algorithm Assessment & Health",
            "content": f"Discovered algorithms: {', '.join(unique_algos[:15])}{'...' if len(unique_algos) > 15 else ''}. Evaluation identifies legacy and deprecated algorithms requiring immediate deprecation alongside standard modern primitives."
        },
        {
            "id": 5,
            "title": "5. Key Security & Key Material Assessment",
            "content": f"Identified {sum(1 for a in assets if a.asset_type in ['KEY', 'SECRET'])} key material records and private key headers. Audited key bit lengths and storage methods against NIST SP 800-57 recommendations."
        },
        {
            "id": 6,
            "title": "6. Configuration Assessment",
            "content": f"Analyzed TLS cipher suites, SSL protocol minimum versions, and cipher modes. Hardcoded credentials, insecure modes (e.g. ECB), and weak parameter sets were evaluated."
        },
        {
            "id": 7,
            "title": "7. Cryptographic Misuse & Deprecated Primitives",
            "content": f"Flagged deprecated primitives (MD5, SHA-1, DES, RC4) and improper usages such as low PBKDF iteration counts or hardcoded salt values."
        },
        {
            "id": 8,
            "title": "8. Vulnerability Findings & Severity Breakdown",
            "content": f"Severity Distribution:\n• CRITICAL: {critical_count}\n• HIGH: {high_count}\n• MEDIUM: {medium_count}\n• LOW: {low_count}\n• INFO: {info_count}"
        },
        {
            "id": 9,
            "title": "9. Risk & Impact Assessment",
            "content": "Assesses business exposure, threat vectors (e.g. Harvest Now, Decrypt Later - HNDL), and data exposure potential across all identified cryptographic assets."
        },
        {
            "id": 10,
            "title": "10. Dependency & Library Security",
            "content": f"Catalogued {sum(1 for a in assets if a.asset_type == 'LIBRARY')} cryptographic package imports and library dependencies (e.g., JCA/JCE, OpenSSL, Python Cryptography)."
        },
        {
            "id": 11,
            "title": "11. Protocol & TLS Assessment",
            "content": f"Evaluated {sum(1 for a in assets if a.asset_type == 'PROTOCOL')} transport security configurations. Audited minimum TLS versions, mTLS settings, and negotiated cipher suites."
        },
        {
            "id": 12,
            "title": "12. X.509 Certificate Assessment",
            "content": f"Audited {sum(1 for a in assets if a.asset_type == 'CERTIFICATE')} certificate lifecycle references, including expiration monitoring, chain validation, and signature algorithms."
        },
        {
            "id": 13,
            "title": "13. Compliance Assessment (NIST SP 800-131A & CNSA 2.0)",
            "content": f"Evaluated {len(compliance)} compliance controls across NIST SP 800-131A Rev 2, FIPS 140-3, and NSA CNSA 2.0 standards."
        },
        {
            "id": 14,
            "title": "14. Post-Quantum Cryptography Readiness",
            "content": f"Quantum Risk Profile:\n• Quantum-Vulnerable (Shor's Algorithm): {q_vuln_count}\n• Quantum-Partial (Grover's Algorithm): {q_partial_count}\n• Quantum-Safe (PQC / Lattice): {q_safe_count}\n• PQC Readiness Score: {scan.pqc_readiness_score or '0.0'}% ({scan.pqc_readiness_level or 'NOT_READY'})"
        },
        {
            "id": 15,
            "title": "15. Prioritized Recommendations",
            "content": f"Generated {len(recommendations)} actionable recommendations prioritized from P0 (Immediate Critical) to P3 (Routine Maintenance)."
        },
        {
            "id": 16,
            "title": "16. Step-by-Step Remediation Plan",
            "content": "1. Replace classically broken algorithms (MD5, SHA-1, DES) with SHA-256 / AES-256.\n2. Upgrade vulnerable asymmetric key exchange (RSA, ECDH) to hybrid ML-KEM-768.\n3. Transition digital signatures (RSA, ECDSA) to ML-DSA-65 / composite signatures.\n4. Eliminate hardcoded key material and enforce minimum TLS 1.3 protocol versions."
        },
        {
            "id": 17,
            "title": "17. Code-Level Evidence & Audit Trail",
            "content": f"All {len(assets)} findings are mapped directly to source file locations, line numbers, character columns, and matched code tokens with full deterministic audit trails."
        },
        {
            "id": 18,
            "title": "18. Security Scores by Category & Historical Comparison",
            "content": f"Categorical Security Health Breakdown (0-100):\n" + "\n".join([f"• {k}: {v}/100" for k, v in scores.items()])
        }
    ]
    
    return {
        "scan_id": scan.id,
        "repository_url": scan.repository_url,
        "status": scan.status,
        "overall_risk_score": scan.overall_risk_score,
        "pqc_readiness_score": scan.pqc_readiness_score,
        "sections": sections
    }
