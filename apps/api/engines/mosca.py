from ..models import CryptoAsset

def assess_mosca_risk(asset: CryptoAsset, crqc_timeline: int = 10) -> str:
    lifetime_map = {
        "UNKNOWN": 0,
        "< 1 year": 1,
        "1-3 years": 2,
        "3-5 years": 4,
        "5-10 years": 7,
        "10+ years": 15
    }
    
    migration_map = {
        "UNKNOWN": 0,
        "TRIVIAL": 0,
        "LOW": 1,
        "MEDIUM": 3,
        "HIGH": 5,
        "VERY_HIGH": 7
    }
    
    x = lifetime_map.get(asset.data_lifetime, 0)
    y = migration_map.get(asset.migration_time, 0)
    
    z = crqc_timeline
    
    if x + y >= z:
        asset.mosca_risk = "CRITICAL"
        return "CRITICAL"
    elif x + y >= z - 2:
        asset.mosca_risk = "HIGH"
        return "HIGH"
    elif x + y >= z - 5:
        asset.mosca_risk = "MODERATE"
        return "MODERATE"
    else:
        asset.mosca_risk = "LOW"
        return "LOW"
