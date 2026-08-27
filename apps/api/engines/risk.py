from ..models import CryptoAsset

def calculate_asset_risk(asset: CryptoAsset) -> tuple:
    components = {}
    score = 0
    
    algo_score = 0
    if asset.severity == 'CRITICAL': algo_score = 25
    elif asset.severity == 'HIGH': algo_score = 20
    elif asset.severity == 'MEDIUM': algo_score = 12
    elif asset.severity == 'LOW': algo_score = 5
    components['algorithm_security'] = algo_score
    score += algo_score
    
    quantum_score = 0
    if asset.quantum_status == 'VULNERABLE': quantum_score = 25
    elif asset.quantum_status == 'PARTIAL': quantum_score = 10
    elif asset.quantum_status == 'UNKNOWN': quantum_score = 15
    components['quantum_vulnerability'] = quantum_score
    score += quantum_score
    
    key_score = 0
    if asset.key_size and asset.key_size > 0:
        if asset.key_size < 1024: key_score = 10
        elif asset.key_size < 2048: key_score = 7
        elif asset.key_size < 4096: key_score = 3
    components['key_strength'] = key_score
    score += key_score
    
    conf_score = 0
    if asset.confidence == 'HIGH': conf_score = 10
    elif asset.confidence == 'MEDIUM': conf_score = 6
    elif asset.confidence == 'LOW': conf_score = 2
    components['detection_confidence'] = conf_score
    score += conf_score
    
    biz_score = 0
    if asset.business_criticality == 'CRITICAL': biz_score = 10
    elif asset.business_criticality == 'HIGH': biz_score = 7
    elif asset.business_criticality == 'MEDIUM': biz_score = 4
    components['business_criticality'] = biz_score
    score += biz_score
    
    data_score = 0
    if asset.data_sensitivity == 'HIGHLY_SENSITIVE': data_score = 10
    elif asset.data_sensitivity == 'SENSITIVE': data_score = 8
    elif asset.data_sensitivity == 'CONFIDENTIAL': data_score = 5
    components['data_sensitivity'] = data_score
    score += data_score
    
    life_score = 0
    if asset.data_lifetime == '10+ years': life_score = 10
    elif asset.data_lifetime == '5-10 years': life_score = 7
    elif asset.data_lifetime == '3-5 years': life_score = 5
    components['data_lifetime'] = life_score
    score += life_score
    
    score = min(score, 100)
    level = 'LOW' if score <= 20 else 'MODERATE' if score <= 40 else 'HIGH' if score <= 60 else 'CRITICAL' if score <= 80 else 'URGENT'
    
    return score, level, components

def calculate_overall_risk(assets: list) -> tuple:
    if not assets:
        return 0.0, 'LOW'
    scores = sorted([a.risk_score for a in assets if a.risk_score is not None], reverse=True)
    if not scores:
        return 0.0, 'LOW'
    top_count = max(1, len(scores) // 5)
    top_avg = sum(scores[:top_count]) / top_count
    rest_avg = sum(scores[top_count:]) / max(1, len(scores) - top_count) if len(scores) > top_count else 0
    overall = top_avg * 0.6 + rest_avg * 0.4
    level = 'LOW' if overall <= 20 else 'MODERATE' if overall <= 40 else 'HIGH' if overall <= 60 else 'CRITICAL' if overall <= 80 else 'URGENT'
    return round(overall, 1), level
