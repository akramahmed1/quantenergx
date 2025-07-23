#!/usr/bin/env python3
"""
QuantEnergX MVP - Logging Configuration Module
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform

This module provides comprehensive logging configuration for the QuantEnergX
MVP platform with structured logging, audit trails, and enterprise monitoring
integration capabilities.
"""

import logging
import logging.config
import sys
from datetime import datetime
from typing import Dict, Any
import json
import os

from app.core.config import get_settings

settings = get_settings()


class QuantEnergXFormatter(logging.Formatter):
    """Custom formatter for QuantEnergX platform with structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record with structured JSON output."""
        
        # Base log structure
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "platform": "quantenergx-mvp",
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT
        }
        
        # Add exception information if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if hasattr(record, "ip_address"):
            log_entry["ip_address"] = record.ip_address
        if hasattr(record, "endpoint"):
            log_entry["endpoint"] = record.endpoint
        if hasattr(record, "duration"):
            log_entry["duration_ms"] = record.duration
        
        return json.dumps(log_entry, ensure_ascii=False)


def setup_logging():
    """
    Configure comprehensive logging for the QuantEnergX platform.
    
    Sets up structured logging with appropriate handlers for different
    environments and integrates with monitoring systems.
    """
    
    # Determine log level from settings
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Logging configuration dictionary
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "quantenergx": {
                "()": QuantEnergXFormatter,
            },
            "simple": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
                "formatter": "quantenergx" if settings.ENVIRONMENT == "production" else "simple",
                "level": log_level
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": "logs/quantenergx.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "formatter": "quantenergx",
                "level": log_level
            },
            "security": {
                "class": "logging.handlers.RotatingFileHandler", 
                "filename": "logs/security.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 10,
                "formatter": "quantenergx",
                "level": logging.WARNING
            },
            "audit": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": "logs/audit.log", 
                "maxBytes": 10485760,  # 10MB
                "backupCount": 20,
                "formatter": "quantenergx",
                "level": logging.INFO
            }
        },
        "loggers": {
            "": {  # Root logger
                "handlers": ["console"],
                "level": log_level,
                "propagate": False
            },
            "quantenergx": {
                "handlers": ["console", "file"],
                "level": log_level,
                "propagate": False
            },
            "security": {
                "handlers": ["console", "security"],
                "level": logging.WARNING,
                "propagate": False
            },
            "audit": {
                "handlers": ["console", "audit"],
                "level": logging.INFO,
                "propagate": False
            },
            "trading": {
                "handlers": ["console", "file"],
                "level": logging.INFO,
                "propagate": False
            },
            "analytics": {
                "handlers": ["console", "file"],
                "level": logging.INFO,
                "propagate": False
            },
            "iot": {
                "handlers": ["console", "file"],
                "level": logging.INFO,
                "propagate": False
            },
            "uvicorn": {
                "handlers": ["console"],
                "level": logging.INFO,
                "propagate": False
            },
            "fastapi": {
                "handlers": ["console"],
                "level": logging.INFO,
                "propagate": False
            }
        }
    }
    
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)
    
    # Apply logging configuration
    logging.config.dictConfig(logging_config)
    
    # Log startup message
    logger = logging.getLogger("quantenergx")
    logger.info(
        "QuantEnergX MVP logging system initialized",
        extra={
            "environment": settings.ENVIRONMENT,
            "log_level": settings.LOG_LEVEL
        }
    )


class AuditLogger:
    """Specialized audit logger for compliance and regulatory requirements."""
    
    def __init__(self):
        self.logger = logging.getLogger("audit")
    
    def log_user_action(
        self,
        user_id: str,
        action: str,
        resource: str,
        result: str,
        details: Dict[str, Any] = None
    ):
        """
        Log user actions for audit trail.
        
        Args:
            user_id: User identifier
            action: Action performed
            resource: Resource affected
            result: Action result (success/failure)
            details: Additional action details
        """
        audit_entry = {
            "audit_type": "user_action",
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "result": result,
            "details": details or {}
        }
        
        self.logger.info(
            f"User Action: {action} on {resource} - {result}",
            extra=audit_entry
        )
    
    def log_system_event(
        self,
        event_type: str,
        component: str,
        severity: str,
        message: str,
        details: Dict[str, Any] = None
    ):
        """
        Log system events for monitoring and compliance.
        
        Args:
            event_type: Type of system event
            component: System component
            severity: Event severity level
            message: Event message
            details: Additional event details
        """
        audit_entry = {
            "audit_type": "system_event",
            "event_type": event_type,
            "component": component,
            "severity": severity,
            "details": details or {}
        }
        
        log_level = getattr(logging, severity.upper(), logging.INFO)
        self.logger.log(
            log_level,
            f"System Event: {event_type} in {component} - {message}",
            extra=audit_entry
        )
    
    def log_data_access(
        self,
        user_id: str,
        data_type: str,
        operation: str,
        record_count: int,
        filters: Dict[str, Any] = None
    ):
        """
        Log data access for privacy and compliance monitoring.
        
        Args:
            user_id: User identifier
            data_type: Type of data accessed
            operation: Database operation (read/write/delete)
            record_count: Number of records affected
            filters: Query filters applied
        """
        audit_entry = {
            "audit_type": "data_access",
            "user_id": user_id,
            "data_type": data_type,
            "operation": operation,
            "record_count": record_count,
            "filters": filters or {}
        }
        
        self.logger.info(
            f"Data Access: {operation} {record_count} {data_type} records",
            extra=audit_entry
        )


class SecurityLogger:
    """Specialized security logger for threat detection and monitoring."""
    
    def __init__(self):
        self.logger = logging.getLogger("security")
    
    def log_authentication_attempt(
        self,
        user_email: str,
        ip_address: str,
        success: bool,
        reason: str = None
    ):
        """
        Log authentication attempts for security monitoring.
        
        Args:
            user_email: User email address
            ip_address: Client IP address
            success: Whether authentication succeeded
            reason: Failure reason if applicable
        """
        security_entry = {
            "security_event": "authentication",
            "user_email": user_email,
            "ip_address": ip_address,
            "success": success,
            "reason": reason
        }
        
        level = logging.INFO if success else logging.WARNING
        self.logger.log(
            level,
            f"Authentication {'succeeded' if success else 'failed'} for {user_email}",
            extra=security_entry
        )
    
    def log_suspicious_activity(
        self,
        user_id: str,
        activity_type: str,
        severity: str,
        details: Dict[str, Any]
    ):
        """
        Log suspicious activities for security analysis.
        
        Args:
            user_id: User identifier
            activity_type: Type of suspicious activity
            severity: Severity level (low/medium/high/critical)
            details: Activity details
        """
        security_entry = {
            "security_event": "suspicious_activity",
            "user_id": user_id,
            "activity_type": activity_type,
            "severity": severity,
            "details": details
        }
        
        level = logging.ERROR if severity in ["high", "critical"] else logging.WARNING
        self.logger.log(
            level,
            f"Suspicious Activity: {activity_type} - {severity} severity",
            extra=security_entry
        )


# Global logger instances
audit_logger = AuditLogger()
security_logger = SecurityLogger()