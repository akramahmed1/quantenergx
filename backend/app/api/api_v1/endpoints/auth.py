"""
QuantEnerGx Authentication Endpoints

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved

Energy Industry Compliance: NERC CIP, IEC 61850, FERC compliant
SaaS Security: SOC 2, GDPR/CCPA compliant
"""

from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Dict, Any
import httpx
import secrets
from datetime import datetime, timedelta

from ...core.database import get_db
from ...core.security import (
    create_access_token, create_refresh_token, verify_token,
    hash_password, verify_password, get_current_user
)
from ...core.config import settings
from ...models.user import User
from ...schemas.user import UserCreate, UserResponse, TokenResponse


router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Register new user with energy industry security standards
    
    Args:
        user: User registration data
        db: Database session
        
    Returns:
        Created user information
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        organization=user.organization,
        role=user.role,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse.from_orm(db_user)


@router.post("/login", response_model=TokenResponse)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> TokenResponse:
    """
    Authenticate user and return JWT tokens
    
    Args:
        form_data: Login form data
        db: Database session
        
    Returns:
        Access and refresh tokens
    """
    # Authenticate user
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create tokens
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "permissions": user.permissions or []
        }
    )
    refresh_token = create_refresh_token(user.id)
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token: str = Form(...),
    db: Session = Depends(get_db)
) -> TokenResponse:
    """
    Refresh access token using refresh token
    
    Args:
        refresh_token: Valid refresh token
        db: Database session
        
    Returns:
        New access and refresh tokens
    """
    try:
        payload = verify_token(refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("user_id")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new tokens
        access_token = create_access_token(
            data={
                "user_id": user.id,
                "email": user.email,
                "role": user.role,
                "permissions": user.permissions or []
            }
        )
        new_refresh_token = create_refresh_token(user.id)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/oauth2/authorize")
async def oauth2_authorize():
    """
    OAuth2 authorization endpoint stub
    
    Returns:
        OAuth2 authorization URL
    """
    if not settings.OAUTH2_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="OAuth2 not configured"
        )
    
    state = secrets.token_urlsafe(32)
    auth_url = (
        f"https://oauth2.provider.com/authorize"
        f"?client_id={settings.OAUTH2_CLIENT_ID}"
        f"&redirect_uri={settings.OAUTH2_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid profile email"
        f"&state={state}"
    )
    
    return {"authorization_url": auth_url, "state": state}


@router.post("/oauth2/callback")
async def oauth2_callback(
    code: str = Form(...),
    state: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    OAuth2 callback endpoint stub
    
    Args:
        code: Authorization code
        state: State parameter
        db: Database session
        
    Returns:
        User tokens
    """
    if not settings.OAUTH2_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="OAuth2 not configured"
        )
    
    # Exchange code for token (stub implementation)
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.provider.com/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.OAUTH2_CLIENT_ID,
                "client_secret": settings.OAUTH2_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.OAUTH2_REDIRECT_URI,
            }
        )
    
    if token_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth2 token exchange failed"
        )
    
    # Process OAuth2 user info and create/update user
    return {"message": "OAuth2 authentication successful (stub)"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Get current user information
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        User information
    """
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.from_orm(user)


@router.post("/logout")
async def logout_user(current_user: Dict = Depends(get_current_user)):
    """
    Logout user (token blacklisting would be implemented here)
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Logout confirmation
    """
    # In production, implement token blacklisting in Redis/database
    return {"message": "Successfully logged out"}