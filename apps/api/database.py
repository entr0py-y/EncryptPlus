import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(_BASE_DIR, ".env"))

_DB_PATH = os.path.join(_BASE_DIR, "ecdat.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_DB_PATH}")

# If pointing to container host '@db:' but running directly on host machine, use local SQLite
if "@db:" in DATABASE_URL or "@db/" in DATABASE_URL:
    if not os.path.exists("/.dockerenv"):
        DATABASE_URL = f"sqlite:///{_DB_PATH}"

# Normalize relative sqlite path
if DATABASE_URL.startswith("sqlite:///./"):
    DATABASE_URL = f"sqlite:///{os.path.join(_BASE_DIR, DATABASE_URL[12:])}"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
