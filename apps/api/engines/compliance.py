from ..models import CryptoAsset, ComplianceResult

def evaluate_compliance(scan_id: int, assets: list) -> list:
    results = []
    for a in assets:
        algo = (a.algorithm or "").upper()
        if not algo:
            continue
            
        status = "COMPLIANT"
        if "MD5" in algo or "SHA-1" in algo:
            status = "NON_COMPLIANT"
        elif "RSA" in algo and a.key_size and a.key_size < 2048:
            status = "NON_COMPLIANT"
            
        res = ComplianceResult(
            scan_id=scan_id,
            asset_id=a.id,
            framework="NIST SP 800-131A Rev 2",
            requirement_id="Crypto_Strength",
            requirement_name="Minimum Security Strength",
            status=status,
            explanation=f"Evaluated {algo} with key size {a.key_size}"
        )
        results.append(res)
    return results
