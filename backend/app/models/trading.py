# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum


class OrderSide(str, Enum):
    """Order side enumeration."""
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, Enum):
    """Order status enumeration."""
    PENDING = "pending"
    PARTIAL = "partial"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class OrderType(str, Enum):
    """Order type enumeration."""
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class TradeOrderBase(BaseModel):
    """Base trade order model."""
    symbol: str = Field(..., description="Trading symbol (e.g., ENERGY_USD)")
    quantity: Decimal = Field(..., gt=0, description="Order quantity")
    side: OrderSide = Field(..., description="Order side (buy/sell)")
    order_type: OrderType = Field(default=OrderType.MARKET, description="Order type")


class TradeOrderCreate(TradeOrderBase):
    """Trade order creation model."""
    price: Optional[Decimal] = Field(None, gt=0, description="Order price (required for limit orders)")
    stop_price: Optional[Decimal] = Field(None, gt=0, description="Stop price (for stop orders)")
    time_in_force: str = Field(default="GTC", description="Time in force (GTC, IOC, FOK)")


class TradeOrderUpdate(BaseModel):
    """Trade order update model."""
    quantity: Optional[Decimal] = Field(None, gt=0)
    price: Optional[Decimal] = Field(None, gt=0)
    stop_price: Optional[Decimal] = Field(None, gt=0)


class TradeOrder(TradeOrderBase):
    """Complete trade order model."""
    id: str
    user_id: str
    price: Optional[Decimal] = None
    stop_price: Optional[Decimal] = None
    filled_quantity: Decimal = Field(default=0)
    average_price: Optional[Decimal] = None
    status: OrderStatus
    time_in_force: str = "GTC"
    created_at: datetime
    updated_at: datetime
    filled_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class Position(BaseModel):
    """Trading position model."""
    id: str
    user_id: str
    symbol: str
    quantity: Decimal
    average_price: Decimal
    market_value: Decimal
    unrealized_pnl: Decimal
    realized_pnl: Decimal = Field(default=0)
    created_at: datetime
    updated_at: datetime


class PositionResponse(BaseModel):
    """Position response model with additional calculations."""
    id: str
    symbol: str
    quantity: Decimal
    average_price: Decimal
    current_price: Decimal
    market_value: Decimal
    unrealized_pnl: Decimal
    unrealized_pnl_percent: Decimal
    day_change: Decimal
    day_change_percent: Decimal
    
    class Config:
        from_attributes = True


class Trade(BaseModel):
    """Individual trade execution model."""
    id: str
    order_id: str
    user_id: str
    symbol: str
    quantity: Decimal
    price: Decimal
    side: OrderSide
    commission: Decimal = Field(default=0)
    executed_at: datetime
    
    class Config:
        from_attributes = True


class PortfolioSummary(BaseModel):
    """Portfolio summary model."""
    total_value: Decimal
    cash_balance: Decimal
    positions_value: Decimal
    day_change: Decimal
    day_change_percent: Decimal
    total_pnl: Decimal
    total_pnl_percent: Decimal
    buying_power: Decimal