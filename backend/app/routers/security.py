# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.core.security import get_current_user, check_permissions
from app.services.security_service import SecurityService

router = APIRouter()
security_service = SecurityService()


@router.get("/logs")
async def get_audit_logs(
    current_user: dict = Depends(get_current_user),
    start_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(None, description="End date (YYYY-MM-DD)"),
    event_type: str = Query(None, description="Filter by event type"),
    limit: int = Query(100, le=1000, description="Number of logs to return")
):
    """Get audit logs (requires admin permissions)."""
    # Check if user has admin permissions
    if not check_permissions("admin")(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    logs = await security_service.get_audit_logs(
        start_date=start_date,
        end_date=end_date,
        event_type=event_type,
        limit=limit
    )
    return {"logs": logs, "total": len(logs)}


@router.get("/user-logs")
async def get_user_audit_logs(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(50, le=200, description="Number of logs to return")
):
    """Get audit logs for the current user."""
    logs = await security_service.get_user_audit_logs(
        user_id=current_user["id"],
        limit=limit
    )
    return {"logs": logs}


@router.post("/alerts")
async def create_security_alert(
    alert_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a security alert."""
    alert = await security_service.create_security_alert(
        user_id=current_user["id"],
        alert_data=alert_data
    )
    return {"alert_id": alert["id"], "message": "Security alert created"}


@router.get("/alerts")
async def get_security_alerts(
    current_user: dict = Depends(get_current_user),
    severity: str = Query(None, description="Filter by severity"),
    status: str = Query("active", description="Filter by status"),
    limit: int = Query(50, le=200, description="Number of alerts to return")
):
    """Get security alerts for the user."""
    alerts = await security_service.get_user_security_alerts(
        user_id=current_user["id"],
        severity=severity,
        status=status,
        limit=limit
    )
    return {"alerts": alerts}


@router.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_security_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Acknowledge a security alert."""
    success = await security_service.acknowledge_alert(
        alert_id=alert_id,
        user_id=current_user["id"]
    )
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"message": "Alert acknowledged"}


@router.get("/permissions")
async def get_user_permissions(
    current_user: dict = Depends(get_current_user)
):
    """Get current user's permissions."""
    permissions = await security_service.get_user_permissions(current_user["id"])
    return {"permissions": permissions}


@router.put("/permissions")
async def update_user_permissions(
    user_id: str,
    permissions: List[str],
    current_user: dict = Depends(get_current_user)
):
    """Update user permissions (admin only)."""
    if not check_permissions("admin")(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    success = await security_service.update_user_permissions(user_id, permissions)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Permissions updated successfully"}


@router.post("/sessions/revoke")
async def revoke_user_sessions(
    user_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Revoke user sessions. If no user_id provided, revokes current user's sessions."""
    target_user_id = user_id or current_user["id"]
    
    # If revoking another user's sessions, require admin permissions
    if user_id and user_id != current_user["id"]:
        if not check_permissions("admin")(current_user):
            raise HTTPException(status_code=403, detail="Admin access required")
    
    await security_service.revoke_user_sessions(target_user_id)
    return {"message": "Sessions revoked successfully"}


@router.get("/login-attempts")
async def get_failed_login_attempts(
    current_user: dict = Depends(get_current_user),
    hours: int = Query(24, description="Number of hours to look back")
):
    """Get failed login attempts for the current user."""
    attempts = await security_service.get_failed_login_attempts(
        user_id=current_user["id"],
        hours=hours
    )
    return {"failed_attempts": attempts}


@router.post("/password-policy/validate")
async def validate_password_policy(
    password: str,
    current_user: dict = Depends(get_current_user)
):
    """Validate a password against the security policy."""
    validation_result = await security_service.validate_password_policy(password)
    return {
        "valid": validation_result["valid"],
        "requirements": validation_result["requirements"],
        "score": validation_result["score"]
    }


@router.get("/security-score")
async def get_user_security_score(
    current_user: dict = Depends(get_current_user)
):
    """Get user's security score based on various factors."""
    score = await security_service.calculate_user_security_score(current_user["id"])
    return {
        "security_score": score["score"],
        "max_score": score["max_score"],
        "recommendations": score["recommendations"]
    }