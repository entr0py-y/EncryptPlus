import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from .database import get_db
from . import models, schemas
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    normalize_email,
    is_valid_email,
    validate_password_policy,
    check_login_rate_limit,
    record_failed_login,
    clear_login_attempts,
    get_current_user,
    get_optional_current_user,
    AUTH_COOKIE_NAME,
    SECURE_COOKIE,
    SAMESITE_COOKIE,
    SESSION_EXPIRY_HOURS,
)

logger = logging.getLogger("ecdat.auth_routes")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(req: schemas.UserSignupRequest, response: Response, db: Session = Depends(get_db)):
    """
    Registers a new user account with Argon2id hashed password and strict email normalization.
    Returns the created user and sets an HttpOnly session cookie.
    """
    name = (req.name or "").strip()
    if not name or len(name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name must be at least 2 characters long."
        )

    # 1. Validate and normalize email
    normalized_email = normalize_email(req.email)
    if not is_valid_email(normalized_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )

    # 2. Check for duplicate account
    existing = db.query(models.User).filter(models.User.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # 3. Validate password match
    if req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    # 4. Enforce password complexity policy
    valid_pwd, pwd_error = validate_password_policy(req.password)
    if not valid_pwd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pwd_error
        )

    # 5. Hash password with Argon2id
    hashed = hash_password(req.password)
    user_id = f"usr_{uuid.uuid4().hex[:12]}"

    user = models.User(
        id=user_id,
        name=name,
        email=normalized_email,
        password_hash=hashed,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 6. Generate signed JWT session token
    token = create_access_token(user_id=user.id, email=user.email)

    # 7. Set secure HttpOnly cookie
    max_age_seconds = SESSION_EXPIRY_HOURS * 3600
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=max_age_seconds,
        expires=max_age_seconds,
        httponly=True,
        secure=SECURE_COOKIE,
        samesite=SAMESITE_COOKIE,
        path="/"
    )

    logger.info(f"New user registered: '{user.email}' (ID: {user.id})")
    return schemas.AuthResponse(
        user=schemas.UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            created_at=user.created_at
        ),
        token=token,
        status="success",
        message="Account created successfully."
    )

@router.post("/login", response_model=schemas.AuthResponse)
def login(req: schemas.UserLoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Authenticates a user using normalized email and Argon2id hash verification.
    Enforces brute-force rate limiting and sets an HttpOnly session cookie on success.
    """
    client_ip = request.client.host if request.client else "unknown_ip"
    normalized_email = normalize_email(req.email)

    # Check rate limit per IP and email
    if not check_login_rate_limit(client_ip) or not check_login_rate_limit(normalized_email):
        logger.warning(f"Rate limit exceeded for login from IP '{client_ip}', email '{normalized_email}'")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please wait 5 minutes before trying again."
        )

    # Find user
    user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if not user or not user.is_active or not verify_password(req.password, user.password_hash):
        record_failed_login(client_ip)
        record_failed_login(normalized_email)
        logger.warning(f"Failed login attempt for '{normalized_email}' from IP '{client_ip}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Clear rate limiter on success
    clear_login_attempts(client_ip)
    clear_login_attempts(normalized_email)

    # Generate token
    token = create_access_token(user_id=user.id, email=user.email)

    # Set HttpOnly session cookie
    max_age_seconds = SESSION_EXPIRY_HOURS * 3600
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=max_age_seconds,
        expires=max_age_seconds,
        httponly=True,
        secure=SECURE_COOKIE,
        samesite=SAMESITE_COOKIE,
        path="/"
    )

    logger.info(f"User logged in: '{user.email}' (ID: {user.id})")
    return schemas.AuthResponse(
        user=schemas.UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            created_at=user.created_at
        ),
        token=token,
        status="success",
        message="Login successful."
    )

@router.post("/logout")
def logout(response: Response):
    """
    Terminates the user session by clearing the HttpOnly authentication cookie.
    """
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=SECURE_COOKIE,
        samesite=SAMESITE_COOKIE
    )
    return {"status": "ok", "message": "Logged out successfully."}

@router.get("/me")
def get_current_user_profile(current_user = Depends(get_optional_current_user)):
    """
    Returns the authenticated user's profile.
    Returns 204 No Content for unauthenticated requests, preventing 401 errors in the console.
    """
    if not current_user:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return schemas.UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        created_at=current_user.created_at
    )
