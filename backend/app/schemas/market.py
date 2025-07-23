"""
QuantEnerGx Market Schemas

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class MarketDataBase(BaseModel):
    """Base market data schema"""
    source: str
    market: str
    data_type: str
    raw_data: Dict[str, Any]
    timestamp: Optional[datetime] = None


class MarketDataCreate(MarketDataBase):
    """Market data creation schema"""
    pass


class MarketDataResponse(MarketDataBase):
    """Market data response schema"""
    id: int
    ingested_at: datetime
    ingested_by: int
    
    class Config:
        from_attributes = True


class EnergyPriceResponse(BaseModel):
    """Energy price response schema"""
    id: int
    market: str
    commodity: str
    price_type: str
    price: float
    unit: str
    timestamp: datetime
    location_id: Optional[str] = None
    risk_score: Optional[float] = None
    volatility: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True