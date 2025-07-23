# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal


class PriceData(BaseModel):
    """Market price data model."""
    symbol: str
    price: Decimal
    bid: Optional[Decimal] = None
    ask: Optional[Decimal] = None
    volume: Optional[Decimal] = None
    change: Optional[Decimal] = None
    change_percent: Optional[Decimal] = None
    timestamp: datetime


class HistoricalDataPoint(BaseModel):
    """Historical data point model."""
    timestamp: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Decimal
    
    class Config:
        from_attributes = True


class HistoricalData(BaseModel):
    """Historical data response model."""
    symbol: str
    period: str
    interval: str
    data: List[HistoricalDataPoint]


class MarketAlert(BaseModel):
    """Market price alert model."""
    symbol: str
    condition: str = Field(..., description="Alert condition (above, below, change)")
    target_price: Decimal = Field(..., gt=0)
    message: Optional[str] = None
    is_active: bool = True


class MarketAlertResponse(MarketAlert):
    """Market alert response model."""
    id: str
    user_id: str
    created_at: datetime
    triggered_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MarketFeed(BaseModel):
    """Market data feed model."""
    feed_id: str
    name: str
    description: str
    status: str  # active, inactive, maintenance
    symbols: List[str]
    last_update: datetime


class MarketStatus(BaseModel):
    """Market status model."""
    is_open: bool
    session: str  # pre_market, regular, after_hours, closed
    next_open: Optional[datetime] = None
    next_close: Optional[datetime] = None
    timezone: str = "UTC"


class TopMover(BaseModel):
    """Top price mover model."""
    symbol: str
    name: str
    price: Decimal
    change: Decimal
    change_percent: Decimal
    volume: Decimal


class MarketOverview(BaseModel):
    """Market overview model."""
    indices: Dict[str, PriceData]
    sectors: Dict[str, Dict[str, Any]]
    commodities: Dict[str, PriceData]
    currencies: Dict[str, PriceData]
    summary: Dict[str, Any]
    last_updated: datetime