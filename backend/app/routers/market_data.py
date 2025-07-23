# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from app.core.security import get_current_user
from app.models.market_data import PriceData, HistoricalData, MarketAlert
from app.services.market_data_service import MarketDataService

router = APIRouter()
market_service = MarketDataService()


@router.get("/prices")
async def get_current_prices(
    symbols: Optional[str] = Query(None, description="Comma-separated list of symbols"),
    current_user: dict = Depends(get_current_user)
):
    """Get current market prices for specified symbols."""
    symbol_list = symbols.split(",") if symbols else None
    prices = await market_service.get_current_prices(symbol_list)
    return {"prices": prices, "timestamp": datetime.utcnow()}


@router.get("/history/{symbol}")
async def get_historical_data(
    symbol: str,
    period: str = Query("1d", description="Time period (1d, 1w, 1m, 3m, 1y)"),
    interval: str = Query("1h", description="Data interval (1m, 5m, 1h, 1d)"),
    current_user: dict = Depends(get_current_user)
):
    """Get historical market data for a specific symbol."""
    if symbol not in await market_service.get_supported_symbols():
        raise HTTPException(status_code=404, detail="Symbol not supported")
    
    data = await market_service.get_historical_data(symbol, period, interval)
    return {
        "symbol": symbol,
        "period": period,
        "interval": interval,
        "data": data
    }


@router.get("/feeds")
async def get_live_data_feeds(
    current_user: dict = Depends(get_current_user)
):
    """Get available live data feeds and their status."""
    feeds = await market_service.get_live_feeds_status()
    return {"feeds": feeds}


@router.post("/alerts")
async def create_price_alert(
    alert_data: MarketAlert,
    current_user: dict = Depends(get_current_user)
):
    """Create a price alert for a specific symbol."""
    alert = await market_service.create_price_alert(
        user_id=current_user["id"],
        alert_data=alert_data
    )
    return {"message": "Alert created successfully", "alert_id": alert["id"]}


@router.get("/alerts")
async def get_user_alerts(
    current_user: dict = Depends(get_current_user),
    active_only: bool = Query(True, description="Show only active alerts")
):
    """Get user's price alerts."""
    alerts = await market_service.get_user_alerts(
        user_id=current_user["id"],
        active_only=active_only
    )
    return {"alerts": alerts}


@router.delete("/alerts/{alert_id}")
async def delete_price_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a price alert."""
    success = await market_service.delete_alert(alert_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"message": "Alert deleted successfully"}


@router.get("/symbols")
async def get_supported_symbols():
    """Get list of supported trading symbols."""
    symbols = await market_service.get_supported_symbols()
    return {"symbols": symbols}


@router.get("/market-status")
async def get_market_status():
    """Get current market status (open/closed, trading hours, etc.)."""
    status = await market_service.get_market_status()
    return status


@router.get("/top-movers")
async def get_top_movers(
    limit: int = Query(10, le=50, description="Number of symbols to return"),
    current_user: dict = Depends(get_current_user)
):
    """Get top price movers (gainers and losers)."""
    movers = await market_service.get_top_movers(limit)
    return {
        "gainers": movers["gainers"],
        "losers": movers["losers"],
        "timestamp": datetime.utcnow()
    }


@router.get("/market-overview")
async def get_market_overview(
    current_user: dict = Depends(get_current_user)
):
    """Get general market overview with key indices and statistics."""
    overview = await market_service.get_market_overview()
    return overview