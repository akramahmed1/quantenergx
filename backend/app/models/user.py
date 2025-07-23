"""
QuantEnerGx User Models

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved

Energy Industry Compliance: NERC CIP, IEC 61850, FERC compliant
SaaS Security: SOC 2, GDPR/CCPA compliant
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from datetime import datetime

from ..core.database import Base


class User(Base):
    """User model with energy industry role-based access"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    organization = Column(String, nullable=True)
    role = Column(String, default="user")  # user, analyst, operator, admin
    permissions = Column(JSON, default=list)
    
    # Security fields
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    last_login = Column(DateTime, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Energy industry specific
    energy_certifications = Column(JSON, default=list)
    clearance_level = Column(String, default="public")  # public, restricted, confidential
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"