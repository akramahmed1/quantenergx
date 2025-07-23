#!/usr/bin/env python3
"""
QuantEnergX MVP - Security & Authentication Module
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform

This module implements enterprise-grade security features including JWT
authentication, OAuth2 integration, role-based access control (RBAC),
and comprehensive security hardening for energy trading operations.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import secrets
import hashlib
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Security Configurations
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Role-based Access Control (RBAC) Definitions
class UserRole:
    """Energy trading platform user roles with hierarchical permissions."""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    TRADER = "trader"
    ANALYST = "analyst"
    VIEWER = "viewer"
    DEVICE_OPERATOR = "device_operator"
    COMPLIANCE_OFFICER = "compliance_officer"

# Permission matrix for role-based access control
ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: ["*"],  # All permissions
    UserRole.ADMIN: [
        "user:read", "user:write", "user:delete",
        "trading:read", "trading:write", "trading:execute",
        "analytics:read", "analytics:write",
        "device:read", "device:write", "device:control",
        "audit:read", "system:configure"
    ],
    UserRole.TRADER: [
        "trading:read", "trading:write", "trading:execute",
        "market_data:read", "analytics:read", "user:read_own"
    ],
    UserRole.ANALYST: [
        "analytics:read", "analytics:write", "market_data:read",
        "trading:read", "user:read_own"
    ],
    UserRole.VIEWER: [
        "analytics:read", "market_data:read", "trading:read", "user:read_own"
    ],
    UserRole.DEVICE_OPERATOR: [
        "device:read", "device:write", "device:control",
        "iot:read", "iot:write", "user:read_own"
    ],
    UserRole.COMPLIANCE_OFFICER: [
        "audit:read", "audit:write", "compliance:read",
        "compliance:write", "user:read", "trading:read"
    ]
}


class SecurityManager:
    """Enterprise security manager for authentication and authorization."""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash using bcrypt."""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt with configured rounds."""
        return pwd_context.hash(password)
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Generate cryptographically secure random token."""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def create_access_token(
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create JWT access token with expiration and security claims.
        
        Args:
            data: Token payload data
            expires_delta: Custom expiration time
            
        Returns:
            Encoded JWT token string
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "iss": "quantenergx-mvp",
            "aud": "quantenergx-users"
        })
        
        try:
            encoded_jwt = jwt.encode(
                to_encode, 
                settings.JWT_SECRET_KEY, 
                algorithm=settings.JWT_ALGORITHM
            )
            return encoded_jwt
        except Exception as e:
            logger.error(f"JWT token creation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token creation failed"
            )
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """
        Verify and decode JWT token with comprehensive validation.
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                audience="quantenergx-users",
                issuer="quantenergx-mvp"
            )
            
            # Additional security validations
            if payload.get("exp", 0) < datetime.utcnow().timestamp():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token expired"
                )
                
            return payload
            
        except JWTError as e:
            logger.warning(f"JWT verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def check_permission(user_role: str, required_permission: str) -> bool:
        """
        Check if user role has required permission.
        
        Args:
            user_role: User's role
            required_permission: Required permission string
            
        Returns:
            True if permission granted, False otherwise
        """
        if user_role not in ROLE_PERMISSIONS:
            return False
            
        permissions = ROLE_PERMISSIONS[user_role]
        
        # Super admin has all permissions
        if "*" in permissions:
            return True
            
        return required_permission in permissions


# Dependency injection for authentication
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    FastAPI dependency to get current authenticated user.
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        Current user information from token
    """
    token = credentials.credentials
    payload = SecurityManager.verify_token(token)
    
    # Extract user information from token
    user_info = {
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role", UserRole.VIEWER),
        "permissions": ROLE_PERMISSIONS.get(payload.get("role", UserRole.VIEWER), [])
    }
    
    return user_info


def require_permission(permission: str):
    """
    Decorator factory for permission-based route protection.
    
    Args:
        permission: Required permission string
        
    Returns:
        FastAPI dependency function
    """
    def permission_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        if not SecurityManager.check_permission(current_user["role"], permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {permission}"
            )
        return current_user
    
    return permission_checker


def require_role(required_role: str):
    """
    Decorator factory for role-based route protection.
    
    Args:
        required_role: Required user role
        
    Returns:
        FastAPI dependency function
    """
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        if current_user["role"] != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient role. Required: {required_role}"
            )
        return current_user
    
    return role_checker


# OAuth2 Integration Stubs
class OAuth2Provider:
    """OAuth2 provider integration for enterprise SSO."""
    
    @staticmethod
    async def validate_oauth_token(provider: str, token: str) -> Dict[str, Any]:
        """
        Validate OAuth2 token with external provider.
        
        Args:
            provider: OAuth2 provider name (google, microsoft, etc.)
            token: OAuth2 access token
            
        Returns:
            User information from OAuth2 provider
        """
        # Implementation stub for OAuth2 integration
        # In production, this would integrate with actual OAuth2 providers
        logger.info(f"OAuth2 validation for provider: {provider}")
        
        return {
            "provider": provider,
            "external_id": "oauth_user_123",
            "email": "user@example.com",
            "name": "OAuth User",
            "verified": True
        }


# Security audit logging
def log_security_event(event_type: str, user_id: str, details: Dict[str, Any]):
    """
    Log security events for audit and compliance.
    
    Args:
        event_type: Type of security event
        user_id: User identifier
        details: Additional event details
    """
    audit_log = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "details": details,
        "severity": "info"
    }
    
    logger.info(f"Security Event: {audit_log}")
    
    # In production, this would integrate with security monitoring systems
    # like Splunk, ELK stack, or cloud security services