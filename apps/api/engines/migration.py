from ..models import Recommendation

def generate_migration_plan(scan_id: int, assets: list, pqc_recs: list) -> list:
    plan = list(pqc_recs)
    return plan
