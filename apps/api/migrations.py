import logging
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from .database import engine, SessionLocal
from . import models

logger = logging.getLogger("ecdat.migrations")

def run_migrations():
    """
    Applies safe, additive, non-destructive database migrations.
    Preserves all existing scans, assets, reports, and tasks without data loss.
    """
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

    # 4. Ensure default dev_user exists for legacy tasks/scans
    db: Session = SessionLocal()
    try:
        dev_user = db.query(models.User).filter(models.User.id == "dev_user").first()
        if not dev_user:
            # Create a placeholder legacy user for existing pre-auth scans/tasks
            dev_user = models.User(
                id="dev_user",
                email="developer@encryptplus.local",
                name="Local Developer",
                password_hash="!legacy_disabled_password",
                is_active=True
            )
            db.add(dev_user)
            db.commit()
            logger.info("Created legacy 'dev_user' account to preserve existing pre-auth scans and tasks.")

        # Ensure any pre-existing unowned scans are claimed by dev_user to preserve legacy data
        db.query(models.Scan).filter(models.Scan.user_id.is_(None)).update(
            {"user_id": "dev_user"}, synchronize_session=False
        )
        db.commit()
    except Exception as e:
        logger.warning(f"Note during legacy user migration: {e}")
        db.rollback()
    finally:
        db.close()

    logger.info("Database migration check completed successfully.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migrations()
