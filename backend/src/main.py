"""Main FastAPI application for QuantEnergx backend."""
import logging
import sys
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog
import uvicorn

from config import settings
from database import db_client
from utils.redis_client import redis_client
from utils.error_handlers import (
    quantenergx_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler,
    QuantEnergxException,
)
from routes import api_router


# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.JSONRenderer()
        if not settings.debug
        else structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=False,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting QuantEnergx Backend", version="2.0.0", environment=settings.environment)

    try:
        # Initialize database connection
        await db_client.connect()

        # Initialize Redis connection
        await redis_client.connect()

        logger.info("All services initialized successfully")

        yield

    except Exception as e:
        logger.error("Failed to initialize services", error=str(e))
        raise

    finally:
        # Shutdown
        logger.info("Shutting down QuantEnergx Backend")

        try:
            await redis_client.disconnect()
            await db_client.disconnect()
            logger.info("All services shut down successfully")
        except Exception as e:
            logger.error("Error during shutdown", error=str(e))


# Create FastAPI application
app = FastAPI(
    title="QuantEnergx Backend API",
    description="Advanced Energy Trading Platform Backend",
    version="2.0.0",
    docs_url="/api/v1/docs" if settings.debug else None,
    redoc_url="/api/v1/redoc" if settings.debug else None,
    openapi_url="/api/v1/openapi.json" if settings.debug else None,
    lifespan=lifespan,
)

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Trusted Host Middleware (security)
if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware, allowed_hosts=["*.quantenergx.com", "quantenergx.com", "localhost"]
    )


# Remove the old rate limiting setup that was moved earlier


# Security headers middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Add security headers."""
    response = await call_next(request)

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    if not settings.debug:
        response.headers[
            "Strict-Transport-Security"
        ] = "max-age=31536000; includeSubDomains; preload"

    return response


# Logging middleware
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Request/response logging middleware."""
    import time

    start_time = time.time()

    # Log request
    logger.info(
        "Request received",
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    response = await call_next(request)

    process_time = time.time() - start_time

    # Log response
    logger.info(
        "Request completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        process_time_ms=round(process_time * 1000, 2),
    )

    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handlers
app.add_exception_handler(QuantEnergxException, quantenergx_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)


# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check() -> Dict[str, Any]:
    """System health check endpoint."""
    # Check database
    db_healthy = await db_client.health_check()

    # Check Redis
    redis_healthy = False
    try:
        await redis_client.client.ping()
        redis_healthy = True
    except Exception:
        pass

    health_status = {
        "status": "healthy" if db_healthy and redis_healthy else "unhealthy",
        "timestamp": "2024-12-19T21:30:00Z",  # This would be dynamic in real implementation
        "version": "2.0.0",
        "environment": settings.environment,
        "services": {
            "database": "online" if db_healthy else "offline",
            "redis": "online" if redis_healthy else "offline",
            "api": "online",
        },
    }

    return health_status


# Include API routes
app.include_router(api_router, prefix="/api/v1")


# Root endpoint
@app.get("/", tags=["System"])
async def root():
    """Root endpoint."""
    return {
        "message": "QuantEnergx Backend API",
        "version": "2.0.0",
        "docs": "/api/v1/docs" if settings.debug else "Not available in production",
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug,
        access_log=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
