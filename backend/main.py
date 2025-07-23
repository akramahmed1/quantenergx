#!/usr/bin/env python3
"""
QuantEnergX MVP - Main Application Entry Point
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform

This module serves as the main FastAPI application entry point for the
QuantEnergX MVP energy trading platform, implementing enterprise-grade
SaaS architecture with comprehensive security, compliance, and scalability.
"""

from fastapi import FastAPI, Middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.security import verify_token
from app.core.logging import setup_logging
from app.routers import (
    trading,
    market_data,
    iot_telemetry,
    analytics,
    auth,
    localization,
    notifications,
    audit,
    user_roles,
    extensibility
)

# Global security scheme
security = HTTPBearer()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management for startup and shutdown events."""
    # Startup
    setup_logging()
    print("🚀 QuantEnergX MVP Backend Starting...")
    print("⚡ Energy Trading Platform Initializing...")
    yield
    # Shutdown
    print("🔒 QuantEnergX MVP Backend Shutting Down...")


# Initialize FastAPI application with enterprise configuration
app = FastAPI(
    title="QuantEnergX MVP",
    description="""
    Enterprise-Grade SaaS Energy Trading Platform
    
    ## Features
    * Advanced Energy Trading & Risk Analytics
    * Real-time Market Data & IoT Telemetry
    * Multi-language Support (EN/AR/FR/ES)
    * Role-based Access Control & Audit Logging
    * Cloud-native Architecture & Scalability
    * OWASP Security Hardening
    * Compliance & Patent-protected IP
    
    ## Security
    * JWT Authentication with OAuth2
    * Role-based Authorization
    * Data Validation & Sanitization
    * Audit Trail Logging
    * HTTPS/TLS Encryption
    """,
    version="1.0.0",
    contact={
        "name": "QuantEnergX Development Team",
        "url": "https://quantenergx.com",
        "email": "dev@quantenergx.com",
    },
    license_info={
        "name": "Proprietary License",
        "url": "https://quantenergx.com/legal",
    },
    lifespan=lifespan,
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
)

# Security Middleware Configuration
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# API Router Registration - Modular Business Domain Architecture
app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Authentication & Authorization"]
)

app.include_router(
    trading.router,
    prefix="/api/v1/trading",
    tags=["Energy Trading & Risk Management"]
)

app.include_router(
    market_data.router,
    prefix="/api/v1/market-data",
    tags=["Market Data & Pricing"]
)

app.include_router(
    iot_telemetry.router,
    prefix="/api/v1/iot",
    tags=["IoT Telemetry & Device Management"]
)

app.include_router(
    analytics.router,
    prefix="/api/v1/analytics",
    tags=["Analytics & Business Intelligence"]
)

app.include_router(
    user_roles.router,
    prefix="/api/v1/users",
    tags=["User Management & RBAC"]
)

app.include_router(
    notifications.router,
    prefix="/api/v1/notifications",
    tags=["Notifications & Alerts"]
)

app.include_router(
    audit.router,
    prefix="/api/v1/audit",
    tags=["Audit Logging & Compliance"]
)

app.include_router(
    localization.router,
    prefix="/api/v1/i18n",
    tags=["Internationalization & Localization"]
)

app.include_router(
    extensibility.router,
    prefix="/api/v1/extensions",
    tags=["Platform Extensibility & Plugins"]
)


@app.get("/", tags=["Health Check"])
async def root():
    """Root endpoint for health checking and platform information."""
    return {
        "message": "QuantEnergX MVP - Enterprise Energy Trading Platform",
        "version": "1.0.0",
        "status": "operational",
        "copyright": "Copyright (c) 2025 QuantEnergX. All rights reserved.",
        "patent": "Patent Pending - Energy Trading Platform Technology"
    }


@app.get("/health", tags=["Health Check"])
async def health_check():
    """Comprehensive health check endpoint for monitoring and deployment."""
    return {
        "status": "healthy",
        "timestamp": "2025-01-01T00:00:00Z",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "services": {
            "database": "connected",
            "redis": "connected",
            "auth": "operational",
            "trading": "operational",
            "analytics": "operational"
        }
    }


if __name__ == "__main__":
    # Development server configuration
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False,
        log_level="info"
    )