import os
import re
import time
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from collections import defaultdict

from fastapi import Request, HTTPException, Depends, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

from .database import get_db
from . import models

logger = logging.getLogger("ecdat.auth")

# Password hasher configuration (Argon2id)
_ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()
if not JWT_SECRET_KEY or JWT_SECRET_KEY == "change-this-to-a-secure-random-secret-in-production":
    # In development or if not configured, generate a stable runtime secret
    _runtime_secret_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".jwt_secret")
    if os.path.exists(_runtime_secret_file):
        with open(_runtime_secret_file, "r") as f:
            JWT_SECRET_KEY = f.read().strip()
    else:
        JWT_SECRET_KEY = secrets.token_hex(32)
        try:
            with open(_runtime_secret_file, "w") as f:
                f.write(JWT_SECRET_KEY)
        except Exception:
            pass

ALGORITHM = "HS256"
AUTH_COOKIE_NAME = "ecdat_session"
SESSION_EXPIRY_HOURS = int(os.getenv("AUTH_SESSION_EXPIRY_HOURS", "24"))
IS_PROD = (
    os.getenv("APP_ENV", "development").lower() == "production"
    or os.getenv("RENDER") is not None
    or os.getenv("SECURE_COOKIE", "").lower() in ("true", "1")
)
SECURE_COOKIE = IS_PROD
SAMESITE_COOKIE = "none" if SECURE_COOKIE else "lax"

# In-memory sliding window rate limiter for login attempts (max 10 attempts per 5 minutes per key)
_login_attempts: Dict[str, list] = defaultdict(list)
MAX_LOGIN_ATTEMPTS = 10
LOGIN_WINDOW_SECONDS = 300

def check_login_rate_limit(key: str) -> bool:
    """Checks whether the client IP or email has exceeded the failed login rate limit."""
    now = time.time()
    # Prune old attempts
    _login_attempts[key] = [t for t in _login_attempts[key] if now - t < LOGIN_WINDOW_SECONDS]
    return len(_login_attempts[key]) < MAX_LOGIN_ATTEMPTS

def record_failed_login(key: str):
    """Records a failed login attempt."""
    _login_attempts[key].append(time.time())

def clear_login_attempts(key: str):
    """Clears failed attempts on successful login."""
    _login_attempts.pop(key, None)

# Password hashing
def hash_password(password: str) -> str:
    """Hashes a password using Argon2id."""
    return _ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against an Argon2id hash."""
    if not plain_password or not hashed_password:
        return False
    try:
        return _ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False

# Token creation and verification
def create_access_token(user_id: str, email: str, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT access token."""
    delta = expires_delta or timedelta(hours=SESSION_EXPIRY_HOURS)
    expire = datetime.now(timezone.utc) + delta
    to_encode = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "nbf": datetime.now(timezone.utc)
    }
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Email normalization and validation
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def normalize_email(email: str) -> str:
    """Normalizes an email address (trims whitespace and converts to lowercase)."""
    return (email or "").strip().lower()

def is_valid_email(email: str) -> bool:
    """Validates email format."""
    normalized = normalize_email(email)
    if not normalized or len(normalized) > 254:
        return False
    return bool(EMAIL_REGEX.match(normalized))

def validate_password_policy(password: str) -> Tuple[bool, Optional[str]]:
    """
    Enforces password complexity:
    - Minimum 8 characters
    - At least one letter (a-z or A-Z)
    - At least one number or special character
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if len(password) > 128:
        return False, "Password must not exceed 128 characters."
    if not re.search(r"[a-zA-Z]", password):
        return False, "Password must contain at least one letter."
    if not re.search(r"[0-9!@#$%^&*(),.?\":{}|<>\-_]", password):
        return False, "Password must contain at least one number or special symbol."
    return True, None

# FastAPI Dependencies
def get_token_from_request(request: Request) -> Optional[str]:
    """Extracts JWT token from Authorization Bearer header or HttpOnly cookie."""
    # 1. Check Authorization: Bearer <token> (preferred for cross-origin deployment)
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if token:
            return token

    # 2. Check HttpOnly cookie
    token = request.cookies.get(AUTH_COOKIE_NAME)
    if token:
        return token

    return None

def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    """
    FastAPI dependency that enforces authentication.
    Returns the authenticated User model or raises HTTP 401 Unauthorized.
    """
    token = get_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload["sub"]
    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user

def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[models.User]:
    """Optional authentication dependency; returns User if valid session exists, else None."""
    token = get_token_from_request(request)
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    return db.query(models.User).filter(models.User.id == payload["sub"], models.User.is_active == True).first()

# Ownership Authorization Helpers
def get_user_scan(scan_id: int, current_user: Optional[models.User], db: Session) -> models.Scan:
    """
    Retrieves a scan and validates strict user ownership.
    Returns 404 if not found, 403 Forbidden if scan belongs to another user.
    Permits guest access to public/demo scans ('dev_user' or None).
    """
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")

    is_public = (scan.user_id is None or scan.user_id == "dev_user")
    if is_public:
        return scan

    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view this private scan.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Strict multi-user ownership check
    if scan.user_id and scan.user_id != current_user.id:
        logger.warning(
            f"Unauthorized scan access attempt: User '{current_user.id}' attempted to access scan #{scan_id} owned by '{scan.user_id}'"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to access this scan."
        )

    return scan
