import logging
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from .database import engine, SessionLocal
from . import models
from .auth import hash_password

logger = logging.getLogger("ecdat.migrations")

def run_migrations():
    """
    Applies safe, additive, non-destructive database migrations.
    Preserves all existing scans, assets, reports, and tasks without data loss.
    """
    try:
        logger.info("Checking database schema for required multi-user fields...")
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        # 1. Create all missing tables (e.g. users)
        models.Base.metadata.create_all(bind=engine)

        with engine.connect() as conn:
            # 2. Add user_id column to scans table if missing
            if "scans" in existing_tables:
                scan_cols = [c["name"] for c in inspector.get_columns("scans")]
                if "user_id" not in scan_cols:
                    logger.info("Applying additive migration: adding 'user_id' column to 'scans' table")
                    conn.execute(text("ALTER TABLE scans ADD COLUMN user_id VARCHAR"))
                    conn.commit()

            # 3. Add user_id column to projects table if missing
            if "projects" in existing_tables:
                project_cols = [c["name"] for c in inspector.get_columns("projects")]
                if "user_id" not in project_cols:
                    logger.info("Applying additive migration: adding 'user_id' column to 'projects' table")
                    conn.execute(text("ALTER TABLE projects ADD COLUMN user_id VARCHAR"))
                    conn.commit()

        # 4. Ensure default demo and developer accounts exist with valid credentials
        db: Session = SessionLocal()
        try:
            default_pwd_hash = hash_password("EncryptPlus2026!")

            # 4a. dev_user
            dev_user = db.query(models.User).filter(models.User.id == "dev_user").first()
            if not dev_user:
                dev_user = models.User(
                    id="dev_user",
                    email="developer@encryptplus.local",
                    name="Local Developer",
                    password_hash=default_pwd_hash,
                    is_active=True
                )
                db.add(dev_user)
                logger.info("Created default 'dev_user' (developer@encryptplus.local) account.")
            elif dev_user.password_hash.startswith("!legacy"):
                dev_user.password_hash = default_pwd_hash

            # 4b. demo@encryptplus.com
            demo_user = db.query(models.User).filter(models.User.email == "demo@encryptplus.com").first()
            if not demo_user:
                demo_user = models.User(
                    id="usr_demo_auditor",
                    email="demo@encryptplus.com",
                    name="Demo Auditor",
                    password_hash=default_pwd_hash,
                    is_active=True
                )
                db.add(demo_user)
                logger.info("Created default 'demo@encryptplus.com' account.")

            # 4c. admin@encryptplus.com
            admin_user = db.query(models.User).filter(models.User.email == "admin@encryptplus.com").first()
            if not admin_user:
                admin_user = models.User(
                    id="usr_admin_default",
                    email="admin@encryptplus.com",
                    name="Administrator",
                    password_hash=default_pwd_hash,
                    is_active=True
                )
                db.add(admin_user)
                logger.info("Created default 'admin@encryptplus.com' account.")

            # 4d. Pushkar Jha (pushkarjha880@gmail.com) - preserved with exact local password hash
            user_pushkar = db.query(models.User).filter(models.User.email == "pushkarjha880@gmail.com").first()
            if not user_pushkar:
                user_pushkar = models.User(
                    id="usr_7213be1d3966",
                    email="pushkarjha880@gmail.com",
                    name="Pushkar Jha",
                    password_hash="$argon2id$v=19$m=65536,t=3,p=4$+JqrAjy5taAch2aO3Z2p3Q$+Nv4e4+oscGDOO8LYsVE6ftRkk/+7V405ya2hkN8Z3Y",
                    is_active=True
                )
                db.add(user_pushkar)
                logger.info("Preserved 'pushkarjha880@gmail.com' account.")

            db.commit()

            # Ensure any pre-existing unowned scans are claimed by dev_user to preserve legacy data
            db.query(models.Scan).filter(models.Scan.user_id.is_(None)).update(
                {"user_id": "dev_user"}, synchronize_session=False
            )
            db.commit()

            # 5. Auto-seed essential historical scans (EncryptPlus, AuditMind, FinTech, demo_repo) if missing
            seed_scans_if_empty(db)
        except Exception as e:
            logger.warning(f"Note during legacy user migration: {e}")
            db.rollback()
        finally:
            db.close()

        logger.info("Database migration check completed successfully.")
    except Exception as exc:
        logger.error(f"Non-fatal error during database migration check: {exc}", exc_info=True)

def seed_scans_if_empty(db: Session):
    """Auto-seeds essential historical scans (EncryptPlus, AuditMind, FinTech, demo_repo) if database is missing them."""
    try:
        import os
        import gzip
        import json
        from datetime import datetime

        def parse_dt(v):
            if not v:
                return None
            try:
                return datetime.fromisoformat(str(v).replace("Z", "+00:00"))
            except Exception:
                return None

        pushkar_scan_count = db.query(models.Scan).filter(
            (models.Scan.user_id == "usr_7213be1d3966") | (models.Scan.user_id == "dev_user")
        ).count()
        if pushkar_scan_count >= 4:
            logger.info(f"Database already contains {pushkar_scan_count} scan(s); skipping seed.")
            return

        seed_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_scans.json.gz")
        if not os.path.exists(seed_file):
            logger.warning(f"Seed file not found at {seed_file}")
            return

        logger.info(f"Loading historical scans and assets from {seed_file}...")
        with gzip.open(seed_file, "rt", encoding="utf-8") as f:
            data = json.load(f)

        for s_data in data.get("scans", []):
            s_data["started_at"] = parse_dt(s_data.get("started_at"))
            s_data["completed_at"] = parse_dt(s_data.get("completed_at"))
            db.merge(models.Scan(**s_data))
        db.commit()

        for a_data in data.get("crypto_assets", []):
            a_data["created_at"] = parse_dt(a_data.get("created_at"))
            db.merge(models.CryptoAsset(**a_data))
        db.commit()

        for c_data in data.get("compliance_results", []):
            db.merge(models.ComplianceResult(**c_data))
        db.commit()

        for r_data in data.get("recommendations", []):
            db.merge(models.Recommendation(**r_data))
        db.commit()

        logger.info(f"Successfully auto-seeded {len(data.get('scans', []))} historical scans and assets into database.")
    except Exception as e:
        logger.warning(f"Note during scan seeding: {e}")
        db.rollback()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migrations()
