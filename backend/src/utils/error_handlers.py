"""Error handlers and exceptions for QuantEnergx backend."""
import logging
from typing import Any, Dict, Optional
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import structlog

logger = structlog.get_logger(__name__)


class QuantEnergxException(Exception):
    """Base exception for QuantEnergx application."""
    
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class DatabaseException(QuantEnergxException):
    """Database operation exception."""
    
    def __init__(self, message: str = "Database operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)


class CacheException(QuantEnergxException):
    """Cache operation exception."""
    
    def __init__(self, message: str = "Cache operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)


class ValidationException(QuantEnergxException):
    """Data validation exception."""
    
    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=422, details=details)


class AuthenticationException(QuantEnergxException):
    """Authentication exception."""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, details=details)


class AuthorizationException(QuantEnergxException):
    """Authorization exception."""
    
    def __init__(self, message: str = "Access denied", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, details=details)


class ExternalAPIException(QuantEnergxException):
    """External API call exception."""
    
    def __init__(self, message: str = "External API error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=502, details=details)


class RateLimitException(QuantEnergxException):
    """Rate limiting exception."""
    
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=429, details=details)


def create_error_response(
    request: Request,
    status_code: int,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    log_level: str = "error"
) -> JSONResponse:
    """Create standardized error response."""
    
    error_data = {
        "error": message,
        "status_code": status_code,
        "path": str(request.url.path),
        "method": request.method,
    }
    
    if details:
        error_data["details"] = details
    
    # Log the error
    log_data = {
        "status_code": status_code,
        "path": request.url.path,
        "method": request.method,
        "user_agent": request.headers.get("user-agent"),
        "ip": request.client.host if request.client else None,
    }
    
    if details:
        log_data["details"] = details
    
    if log_level == "error":
        logger.error(f"HTTP {status_code}: {message}", **log_data)
    elif log_level == "warning":
        logger.warning(f"HTTP {status_code}: {message}", **log_data)
    else:
        logger.info(f"HTTP {status_code}: {message}", **log_data)
    
    return JSONResponse(
        status_code=status_code,
        content=error_data
    )


async def quantenergx_exception_handler(request: Request, exc: QuantEnergxException) -> JSONResponse:
    """Handle custom QuantEnergx exceptions."""
    return create_error_response(
        request=request,
        status_code=exc.status_code,
        message=exc.message,
        details=exc.details,
        log_level="warning" if exc.status_code < 500 else "error"
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors."""
    details = {
        "validation_errors": [
            {
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            }
            for error in exc.errors()
        ]
    }
    
    return create_error_response(
        request=request,
        status_code=422,
        message="Validation error",
        details=details,
        log_level="warning"
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle HTTP exceptions."""
    return create_error_response(
        request=request,
        status_code=exc.status_code,
        message=exc.detail,
        log_level="warning" if exc.status_code < 500 else "error"
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.exception("Unhandled exception occurred", 
                    path=request.url.path, 
                    method=request.method,
                    exception_type=type(exc).__name__)
    
    # Don't expose internal error details in production
    from config import settings
    message = str(exc) if settings.debug else "Internal server error"
    
    return create_error_response(
        request=request,
        status_code=500,
        message=message,
        log_level="error"
    )