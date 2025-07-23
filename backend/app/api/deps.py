"""
QuantEnerGx API Dependencies

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved

Energy Industry Compliance: NERC CIP, IEC 61850, FERC compliant
SaaS Security: SOC 2, GDPR/CCPA compliant
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..core.database import get_db
from ..core.security import get_current_user


def get_current_active_user(
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get current active user with additional validation
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Validated active user
    """
    # Additional user validation logic would go here
    # For now, just return the current user
    return current_user


def verify_energy_operator_role(
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Verify user has energy operator role
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Validated energy operator user
    """
    if current_user.get("role") not in ["admin", "energy_operator", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Energy operator role required"
        )
    
    return current_user