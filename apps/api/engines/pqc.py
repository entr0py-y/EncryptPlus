from ..crypto_knowledge import PQC_RECOMMENDATIONS
from ..models import CryptoAsset, Recommendation

def generate_pqc_recommendations(scan_id: int, assets: list) -> list:
    recs = []
    seen_algos = set()
    
    for a in assets:
        if a.quantum_status in ["VULNERABLE", "PARTIAL"]:
            algo = (a.algorithm or "").strip()
            if not algo or algo in seen_algos:
                continue
                
            rec_algo = None
            for k, v in PQC_RECOMMENDATIONS.items():
                if k.upper() in algo.upper():
                    rec_algo = v
                    break
            
            if not rec_algo:
                if "RSA" in algo.upper():
                    rec_algo = "ML-KEM-768 (Key Exchange) / ML-DSA-65 (Signatures)"
                elif "ECDSA" in algo.upper() or "EC" in algo.upper():
                    rec_algo = "ML-DSA-44 or ML-DSA-65"
                elif "AES-128" in algo.upper():
                    rec_algo = "AES-256 (Quantum Margin)"

            if rec_algo:
                seen_algos.add(algo)
                r = Recommendation(
                    scan_id=scan_id,
                    asset_id=a.id,
                    priority="P1" if a.quantum_status == "VULNERABLE" else "P2",
                    title=f"Migrate {algo} to Post-Quantum Standard ({rec_algo})",
                    description=f"Cryptographic mechanism {algo} is susceptible to quantum cryptanalysis (Shor's/Grover's algorithm).",
                    current_algorithm=algo,
                    recommended_algorithm=rec_algo,
                    finding_count=sum(1 for x in assets if (x.algorithm or "").strip() == algo)
                )
                recs.append(r)
    return recs

def calculate_pqc_readiness(assets: list) -> tuple:
    if not assets:
        return 100.0, "PQC_READY"
        
    safe_count = sum(1 for a in assets if a.quantum_status == "SAFE")
    hybrid_count = sum(1 for a in assets if a.quantum_status == "HYBRID" or "HYBRID" in (a.migration_status or "").upper())
    partial_count = sum(1 for a in assets if a.quantum_status == "PARTIAL")
    vulnerable_count = sum(1 for a in assets if a.quantum_status == "VULNERABLE")
    
    total_crypto = safe_count + hybrid_count + partial_count + vulnerable_count
    
    if total_crypto == 0:
        return 100.0, "PQC_READY"
        
    # Standard QRAMM / CryptoScan readiness formula:
    numerator = (safe_count * 1.0) + (hybrid_count * 0.8) + (partial_count * 0.3)
    score = (numerator / total_crypto) * 100.0
    score = min(100.0, max(0.0, score))
    
    if score >= 80: level = "PQC_READY"
    elif score >= 60: level = "ADVANCED"
    elif score >= 35: level = "DEVELOPING"
    elif score >= 15: level = "EARLY"
    else: level = "NOT_READY"
    
    return round(score, 1), level
