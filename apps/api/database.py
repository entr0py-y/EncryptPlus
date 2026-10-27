import os
import re
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger("ecdat.database")

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(_BASE_DIR, ".env"))

_DB_PATH = os.path.join(_BASE_DIR, "ecdat.db")
_raw_database_url = os.getenv("DATABASE_URL", f"sqlite:///{_DB_PATH}").strip()

def build_database_url(url: str) -> str:
    """Normalizes and configures database connection string for cloud providers."""
    if not url:
        return f"sqlite:///{_DB_PATH}"

    # Normalize postgres:// to postgresql:// (Render / Supabase / Neon compatibility)
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    # Normalize relative sqlite path
    if url.startswith("sqlite:///./"):
        url = f"sqlite:///{os.path.join(_BASE_DIR, url[12:])}"

    # If pointing to docker-compose container host '@db:' but running without docker network
    if ("@db:" in url or "@db/" in url) and not os.path.exists("/.dockerenv") and not os.getenv("RENDER"):
        return f"sqlite:///{_DB_PATH}"

    # If Render External PostgreSQL URL, ensure sslmode=require
    if "postgres.render.com" in url and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"

    return url

DATABASE_URL = build_database_url(_raw_database_url)

def create_resilient_engine(primary_url: str):
    """Creates a database engine with connection validation and safe fallback to SQLite."""
    import time
    from sqlalchemy import text

    is_sqlite = "sqlite" in primary_url

    engine_kwargs = {}
    if is_sqlite:
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    else:
        engine_kwargs["pool_pre_ping"] = True
        engine_kwargs["pool_recycle"] = 300
        engine_kwargs["connect_args"] = {"connect_timeout": 10}

    # If primary is PostgreSQL, test connection with retries
    if not is_sqlite:
        for attempt in range(1, 4):
            try:
                eng = create_engine(primary_url, **engine_kwargs)
                with eng.connect() as conn:
                    conn.execute(text("SELECT 1"))
                sanitized = re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", primary_url)
                logger.info(f"Connected to PostgreSQL database: {sanitized}")
                return eng, primary_url
            except Exception as exc:
                logger.warning(
                    f"PostgreSQL connection attempt {attempt}/3 failed ({exc}). Retrying in 2s..."
                )
                time.sleep(2)

        # If PostgreSQL failed after 3 attempts, fall back to SQLite to prevent container crash
        logger.error(
            "CRITICAL: Failed to connect to PostgreSQL after 3 attempts. Falling back to local SQLite to prevent service crash."
        )
        fallback_url = f"sqlite:///{_DB_PATH}"
        eng = create_engine(fallback_url, connect_args={"check_same_thread": False})
        return eng, fallback_url

    eng = create_engine(primary_url, **engine_kwargs)
    return eng, primary_url

engine, ACTIVE_DATABASE_URL = create_resilient_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
