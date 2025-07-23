"""
QuantEnerGx Market Data Models

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..core.database import Base


class MarketData(Base):
    """Raw market data from external sources"""
    
    __tablename__ = "market_data"
    
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)  # CAISO, PJM, ERCOT, etc.
    market = Column(String, nullable=False)
    data_type = Column(String, nullable=False)  # price, demand, supply
    raw_data = Column(JSON, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    ingested_at = Column(DateTime, default=func.now())
    ingested_by = Column(Integer, ForeignKey("users.id"))


class EnergyPrice(Base):
    """Processed energy price data"""
    
    __tablename__ = "energy_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    market = Column(String, nullable=False, index=True)
    commodity = Column(String, nullable=False)  # electricity, natural_gas
    price_type = Column(String, nullable=False)  # spot, futures, lmp
    price = Column(Float, nullable=False)
    unit = Column(String, default="$/MWh")
    timestamp = Column(DateTime, nullable=False, index=True)
    location_id = Column(String, nullable=True)
    
    # Analytics fields
    risk_score = Column(Float, nullable=True)
    volatility = Column(Float, nullable=True)
    created_at = Column(DateTime, default=func.now())