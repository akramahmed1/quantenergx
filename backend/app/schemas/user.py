"""
QuantEnerGx User Schemas

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: str
    organization: Optional[str] = None
    role: str = "user"


class UserCreate(UserBase):
    """User creation schema"""
    password: str


class UserResponse(UserBase):
    """User response schema"""
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    permissions: List[str] = []
    energy_certifications: List[str] = []
    clearance_level: str = "public"
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int