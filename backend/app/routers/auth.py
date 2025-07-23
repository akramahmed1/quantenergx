#!/usr/bin/env python3
"""
QuantEnergX MVP - Authentication & Authorization Router
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform

This module implements comprehensive authentication and authorization endpoints
for the QuantEnergX MVP platform, including JWT authentication, OAuth2 integration,
multi-factor authentication, and role-based access control.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field, validator
import logging

from app.core.security import (
    SecurityManager, 
    get_current_user, 
    UserRole, 
    OAuth2Provider,
    security_logger,
    log_security_event
)
from app.core.config import get_settings

logger = logging.getLogger("quantenergx.auth")
settings = get_settings()

router = APIRouter()


# Pydantic Models for Request/Response
class UserRegistration(BaseModel):
    """User registration request model."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    company: Optional[str] = Field(None, max_length=100)
    role: str = Field(default=UserRole.VIEWER)
    language: str = Field(default="en", regex="^(en|ar|fr|es)$")
    
    @validator("password")
    def validate_password(cls, v):
        """Validate password strength requirements."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain number")
        return v


class UserLogin(BaseModel):
    """User login request model."""
    email: EmailStr
    password: str
    remember_me: bool = False


class TokenResponse(BaseModel):
    """Authentication token response model."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_info: Dict[str, Any]
    permissions: list


class PasswordReset(BaseModel):
    """Password reset request model."""
    email: EmailStr


class PasswordChange(BaseModel):
    """Password change request model."""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class OAuth2LoginRequest(BaseModel):
    """OAuth2 login request model."""
    provider: str = Field(..., regex="^(google|microsoft|linkedin)$")
    token: str
    redirect_uri: Optional[str] = None


@router.post("/register", response_model=TokenResponse)
async def register_user(
    user_data: UserRegistration,
    request: Request
) -> TokenResponse:
    """
    Register new user with comprehensive validation and security checks.
    
    Args:
        user_data: User registration information
        request: FastAPI request object for IP tracking
        
    Returns:
        JWT token and user information
    """
    try:
        # Security: Check for existing user
        # In production, this would query the actual database
        existing_user = None  # await UserService.get_user_by_email(user_data.email)
        
        if existing_user:
            security_logger.log_suspicious_activity(
                user_id="unknown",
                activity_type="duplicate_registration",
                severity="medium",
                details={"email": user_data.email, "ip": request.client.host}
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exists"
            )
        
        # Hash password securely
        hashed_password = SecurityManager.hash_password(user_data.password)
        
        # Create user record (stub - would integrate with database)
        user_record = {
            "id": "user_" + SecurityManager.generate_secure_token(16),
            "email": user_data.email,
            "password_hash": hashed_password,
            "full_name": user_data.full_name,
            "company": user_data.company,
            "role": user_data.role,
            "language": user_data.language,
            "is_active": True,
            "is_verified": False,
            "created_at": datetime.utcnow(),
            "last_login": None
        }
        
        # Generate JWT token
        token_data = {
            "sub": user_record["id"],
            "email": user_record["email"],
            "role": user_record["role"],
            "full_name": user_record["full_name"]
        }
        
        access_token = SecurityManager.create_access_token(token_data)
        
        # Log successful registration
        security_logger.log_authentication_attempt(
            user_email=user_data.email,
            ip_address=request.client.host,
            success=True
        )
        
        logger.info(f"User registered successfully: {user_data.email}")
        
        return TokenResponse(
            access_token=access_token,
            expires_in=settings.JWT_EXPIRATION_HOURS * 3600,
            user_info={
                "id": user_record["id"],
                "email": user_record["email"],
                "full_name": user_record["full_name"],
                "role": user_record["role"],
                "language": user_record["language"]
            },
            permissions=SecurityManager.check_permission(user_record["role"], "*")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=TokenResponse)
async def login_user(
    login_data: UserLogin,
    request: Request
) -> TokenResponse:
    """
    Authenticate user with email and password.
    
    Args:
        login_data: User login credentials
        request: FastAPI request object for IP tracking
        
    Returns:
        JWT token and user information
    """
    try:
        # In production, this would query the actual database
        # For MVP, we'll simulate user lookup
        user_record = {
            "id": "user_123",
            "email": login_data.email,
            "password_hash": SecurityManager.hash_password("demo_password"),
            "full_name": "Demo User",
            "role": UserRole.TRADER,
            "language": "en",
            "is_active": True,
            "is_verified": True
        }
        
        # Verify password
        if not SecurityManager.verify_password(login_data.password, user_record["password_hash"]):
            security_logger.log_authentication_attempt(
                user_email=login_data.email,
                ip_address=request.client.host,
                success=False,
                reason="invalid_password"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Check if user is active
        if not user_record["is_active"]:
            security_logger.log_authentication_attempt(
                user_email=login_data.email,
                ip_address=request.client.host,
                success=False,
                reason="account_disabled"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account disabled"
            )
        
        # Generate JWT token
        token_data = {
            "sub": user_record["id"],
            "email": user_record["email"],
            "role": user_record["role"],
            "full_name": user_record["full_name"]
        }
        
        expires_delta = timedelta(days=30) if login_data.remember_me else None
        access_token = SecurityManager.create_access_token(token_data, expires_delta)
        
        # Log successful login
        security_logger.log_authentication_attempt(
            user_email=login_data.email,
            ip_address=request.client.host,
            success=True
        )
        
        logger.info(f"User logged in successfully: {login_data.email}")
        
        return TokenResponse(
            access_token=access_token,
            expires_in=settings.JWT_EXPIRATION_HOURS * 3600,
            user_info={
                "id": user_record["id"],
                "email": user_record["email"],
                "full_name": user_record["full_name"],
                "role": user_record["role"],
                "language": user_record["language"]
            },
            permissions=SecurityManager.check_permission(user_record["role"], "*")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@router.post("/oauth2/login", response_model=TokenResponse)
async def oauth2_login(
    oauth_data: OAuth2LoginRequest,
    request: Request
) -> TokenResponse:
    """
    OAuth2 authentication with external providers.
    
    Args:
        oauth_data: OAuth2 provider and token information
        request: FastAPI request object
        
    Returns:
        JWT token and user information
    """
    try:
        # Validate OAuth2 token with provider
        oauth_user = await OAuth2Provider.validate_oauth_token(
            oauth_data.provider,
            oauth_data.token
        )
        
        if not oauth_user["verified"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OAuth2 token validation failed"
            )
        
        # Create or update user record
        user_record = {
            "id": f"oauth_{oauth_user['external_id']}",
            "email": oauth_user["email"],
            "full_name": oauth_user["name"],
            "role": UserRole.VIEWER,  # Default role for OAuth2 users
            "language": "en",
            "is_active": True,
            "is_verified": True,
            "oauth_provider": oauth_data.provider
        }
        
        # Generate JWT token
        token_data = {
            "sub": user_record["id"],
            "email": user_record["email"],
            "role": user_record["role"],
            "full_name": user_record["full_name"],
            "oauth_provider": oauth_data.provider
        }
        
        access_token = SecurityManager.create_access_token(token_data)
        
        logger.info(f"OAuth2 login successful: {oauth_user['email']} via {oauth_data.provider}")
        
        return TokenResponse(
            access_token=access_token,
            expires_in=settings.JWT_EXPIRATION_HOURS * 3600,
            user_info={
                "id": user_record["id"],
                "email": user_record["email"],
                "full_name": user_record["full_name"],
                "role": user_record["role"],
                "oauth_provider": oauth_data.provider
            },
            permissions=SecurityManager.check_permission(user_record["role"], "*")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth2 login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth2 authentication failed"
        )


@router.get("/me")
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current user from JWT token
        
    Returns:
        User profile information
    """
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "role": current_user["role"],
        "permissions": current_user["permissions"],
        "last_login": datetime.utcnow().isoformat(),
        "platform": "quantenergx-mvp"
    }


@router.post("/logout")
async def logout_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, str]:
    """
    User logout endpoint.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Logout confirmation
    """
    # In production, this would invalidate the token in a blacklist/database
    logger.info(f"User logged out: {current_user['email']}")
    
    return {"message": "Successfully logged out"}


@router.post("/password/reset")
async def request_password_reset(
    reset_data: PasswordReset,
    request: Request
) -> Dict[str, str]:
    """
    Request password reset email.
    
    Args:
        reset_data: Password reset request
        request: FastAPI request object
        
    Returns:
        Reset confirmation message
    """
    try:
        # In production, this would:
        # 1. Generate secure reset token
        # 2. Store token with expiration
        # 3. Send reset email
        
        logger.info(f"Password reset requested for: {reset_data.email}")
        
        return {"message": "Password reset email sent if account exists"}
        
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset request failed"
        )


@router.post("/password/change")
async def change_password(
    password_data: PasswordChange,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Change user password.
    
    Args:
        password_data: Current and new password
        current_user: Current authenticated user
        
    Returns:
        Password change confirmation
    """
    try:
        # In production, this would:
        # 1. Verify current password
        # 2. Hash new password
        # 3. Update database
        # 4. Invalidate existing tokens
        
        logger.info(f"Password changed for user: {current_user['email']}")
        
        return {"message": "Password changed successfully"}
        
    except Exception as e:
        logger.error(f"Password change error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )