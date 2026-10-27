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
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_DB_PATH}").strip()

# Normalize postgres:// to postgresql:// (Render / Supabase / Neon compatibility)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# If pointing to docker-compose container host '@db:' but running directly on host machine
if ("@db:" in DATABASE_URL or "@db/" in DATABASE_URL) and not os.path.exists("/.dockerenv") and not os.getenv("RENDER"):
    DATABASE_URL = f"sqlite:///{_DB_PATH}"

# Normalize relative sqlite path
if DATABASE_URL.startswith("sqlite:///./"):
    DATABASE_URL = f"sqlite:///{os.path.join(_BASE_DIR, DATABASE_URL[12:])}"

# Cloud production pooling options
engine_kwargs = {}
if "sqlite" in DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(DATABASE_URL, **engine_kwargs)

sanitized_url = re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", DATABASE_URL)
logger.info(f"Database initialized with engine: {sanitized_url}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
