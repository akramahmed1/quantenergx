"""API routes for QuantEnergx backend."""
from fastapi import APIRouter
from .market import market_router
from .energy import energy_router

# Main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(market_router, prefix="/market", tags=["Market"])
api_router.include_router(energy_router, prefix="/energy", tags=["Energy"])

# Health check specific to API
@api_router.get("/health", tags=["API"])
async def api_health():
    """API-specific health check."""
    return {"status": "API online", "version": "2.0.0"}