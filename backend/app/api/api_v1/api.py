"""
QuantEnerGx API v1 Router

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved

Energy Industry Compliance: NERC CIP, IEC 61850, FERC compliant
SaaS Security: SOC 2, GDPR/CCPA compliant
"""

from fastapi import APIRouter

from .endpoints import (
    auth, market_data, analytics, security, 
    localization, extensibility, telemetry
)

api_router = APIRouter()

# Authentication routes
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Market data routes  
api_router.include_router(market_data.router, prefix="/market", tags=["market_data"])

# Analytics routes
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# Security routes
api_router.include_router(security.router, prefix="/security", tags=["security"])

# Localization routes
api_router.include_router(localization.router, prefix="/localization", tags=["localization"])

# Extensibility routes
api_router.include_router(extensibility.router, prefix="/extensibility", tags=["extensibility"])

# Telemetry routes
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["telemetry"])