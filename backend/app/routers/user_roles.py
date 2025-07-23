#!/usr/bin/env python3
"""
QuantEnergX MVP - User Roles & Management Router
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field, EmailStr
import logging

from app.core.security import get_current_user, require_permission, UserRole, audit_logger
from app.core.config import get_settings

logger = logging.getLogger("quantenergx.users")
settings = get_settings()
router = APIRouter()

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    role: Optional[str] = None
    is_active: Optional[bool] = None
    permissions: Optional[List[str]] = None

class RoleCreate(BaseModel):
    role_name: str = Field(..., max_length=50)
    description: str = Field(..., max_length=200)
    permissions: List[str] = Field(..., min_items=1)

@router.get("/", dependencies=[Depends(require_permission("user:read"))])
async def get_users(
    current_user: Dict[str, Any] = Depends(get_current_user),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    limit: int = Query(default=50, le=200)
) -> Dict[str, Any]:
    """Get list of users with filtering options."""
    # Mock users data
    users = [
        {
            "id": f"user_{i}",
            "email": f"user{i}@quantenergx.com",
            "full_name": f"User {i}",
            "role": [UserRole.TRADER, UserRole.ANALYST, UserRole.VIEWER][i % 3],
            "is_active": i % 10 != 0,  # 90% active users
            "created_at": datetime.utcnow().isoformat(),
            "last_login": (datetime.utcnow() - timedelta(days=i)).isoformat() if i % 5 != 0 else None
        }
        for i in range(1, min(limit + 1, 51))
    ]
    
    # Apply filters
    if role:
        users = [u for u in users if u["role"] == role]
    if is_active is not None:
        users = [u for u in users if u["is_active"] == is_active]
    
    audit_logger.log_data_access(
        current_user["user_id"],
        "user_list",
        "read",
        len(users),
        {"filters": {"role": role, "is_active": is_active}}
    )
    
    return {"users": users, "total_count": len(users)}

@router.put("/{user_id}", dependencies=[Depends(require_permission("user:write"))])
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Update user information and permissions."""
    # Mock user update
    updated_user = {
        "id": user_id,
        "full_name": user_update.full_name or "Updated User",
        "role": user_update.role or UserRole.VIEWER,
        "is_active": user_update.is_active if user_update.is_active is not None else True,
        "updated_at": datetime.utcnow().isoformat(),
        "updated_by": current_user["user_id"]
    }
    
    audit_logger.log_user_action(
        current_user["user_id"],
        "user_updated",
        f"user:{user_id}",
        "success",
        {"updates": user_update.dict(exclude_none=True)}
    )
    
    return {"user": updated_user, "message": "User updated successfully"}

@router.get("/roles", dependencies=[Depends(require_permission("user:read"))])
async def get_roles(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get available user roles and their permissions."""
    from app.core.security import ROLE_PERMISSIONS
    
    roles = [
        {
            "role_name": role,
            "permissions": permissions,
            "description": f"Role with {len(permissions)} permissions"
        }
        for role, permissions in ROLE_PERMISSIONS.items()
    ]
    
    return {"roles": roles, "total_roles": len(roles)}