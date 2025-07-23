# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.core.security import get_current_user, check_permissions
from app.models.trading import (
    TradeOrder,
    TradeOrderCreate,
    TradeOrderUpdate,
    Position,
    PositionResponse
)
from app.services.trading_service import TradingService

router = APIRouter()
trading_service = TradingService()


@router.get("/positions", response_model=List[PositionResponse])
async def get_user_positions(
    current_user: dict = Depends(get_current_user),
    symbol: Optional[str] = Query(None, description="Filter by symbol")
):
    """Get user's trading positions."""
    positions = await trading_service.get_user_positions(
        user_id=current_user["id"],
        symbol=symbol
    )
    return [PositionResponse(**pos) for pos in positions]


@router.post("/orders", response_model=TradeOrder)
async def create_trade_order(
    order_data: TradeOrderCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new trade order."""
    # Validate user has sufficient balance/permissions
    can_trade = await trading_service.validate_trading_permissions(
        user_id=current_user["id"],
        order_data=order_data
    )
    
    if not can_trade:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions or balance for this trade"
        )
    
    order = await trading_service.create_order(
        user_id=current_user["id"],
        order_data=order_data
    )
    return TradeOrder(**order)


@router.get("/orders/{order_id}", response_model=TradeOrder)
async def get_trade_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific trade order details."""
    order = await trading_service.get_order_by_id(order_id, current_user["id"])
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return TradeOrder(**order)


@router.get("/orders", response_model=List[TradeOrder])
async def get_user_orders(
    current_user: dict = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, description="Filter by order status"),
    limit: int = Query(50, le=100, description="Number of orders to return")
):
    """Get user's trade orders with optional filtering."""
    orders = await trading_service.get_user_orders(
        user_id=current_user["id"],
        status_filter=status_filter,
        limit=limit
    )
    return [TradeOrder(**order) for order in orders]


@router.put("/orders/{order_id}", response_model=TradeOrder)
async def update_trade_order(
    order_id: str,
    order_update: TradeOrderUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing trade order."""
    # Check if order exists and belongs to user
    existing_order = await trading_service.get_order_by_id(order_id, current_user["id"])
    if not existing_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if order can be modified
    if existing_order["status"] not in ["pending", "partial"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be modified in its current status"
        )
    
    updated_order = await trading_service.update_order(order_id, order_update)
    return TradeOrder(**updated_order)


@router.delete("/orders/{order_id}")
async def cancel_trade_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a trade order."""
    # Check if order exists and belongs to user
    existing_order = await trading_service.get_order_by_id(order_id, current_user["id"])
    if not existing_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if order can be cancelled
    if existing_order["status"] not in ["pending", "partial"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be cancelled in its current status"
        )
    
    await trading_service.cancel_order(order_id)
    return {"message": "Order cancelled successfully"}


@router.get("/history")
async def get_trading_history(
    current_user: dict = Depends(get_current_user),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    limit: int = Query(100, le=1000, description="Number of records to return")
):
    """Get user's trading history."""
    history = await trading_service.get_trading_history(
        user_id=current_user["id"],
        start_date=start_date,
        end_date=end_date,
        symbol=symbol,
        limit=limit
    )
    return {"trades": history, "total": len(history)}


@router.get("/portfolio-summary")
async def get_portfolio_summary(current_user: dict = Depends(get_current_user)):
    """Get user's portfolio summary including P&L, positions value, etc."""
    summary = await trading_service.get_portfolio_summary(current_user["id"])
    return summary