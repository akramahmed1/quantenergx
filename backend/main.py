# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.core.security import setup_security_headers
from app.routers import (
    auth,
    trading,
    market_data,
    iot,
    analytics,
    security,
    localization,
    extensibility
)

# Create FastAPI application instance
app = FastAPI(
    title="QuantEnergX API",
    description="Industry-grade SaaS energy trading platform",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Setup security headers
setup_security_headers(app)

# Include routers
app.include_router(auth.router, prefix="/v1/auth", tags=["authentication"])
app.include_router(trading.router, prefix="/v1/trading", tags=["trading"])
app.include_router(market_data.router, prefix="/v1/market", tags=["market-data"])
app.include_router(iot.router, prefix="/v1/iot", tags=["iot"])
app.include_router(analytics.router, prefix="/v1/analytics", tags=["analytics"])
app.include_router(security.router, prefix="/v1/security", tags=["security"])
app.include_router(localization.router, prefix="/v1/localization", tags=["localization"])
app.include_router(extensibility.router, prefix="/v1/extensions", tags=["extensibility"])

@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {"message": "QuantEnergX API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "timestamp": "2025-01-01T00:00:00Z"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development"
    )