#!/usr/bin/env python3
"""
QuantEnergX MVP - Market Data & Pricing Router
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform

This module implements comprehensive market data feeds, real-time pricing,
historical data analysis, and advanced pricing models for energy commodities
trading on the QuantEnergX MVP platform.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field, validator
from decimal import Decimal
import asyncio
import json
import logging

from app.core.security import (
    get_current_user,
    require_permission,
    audit_logger
)
from app.core.config import get_settings

logger = logging.getLogger("quantenergx.market_data")
settings = get_settings()

router = APIRouter()


# Market Data Models
class MarketDataPoint(BaseModel):
    """Real-time market data point."""
    symbol: str = Field(..., regex="^[A-Z]{2,10}$")
    timestamp: datetime
    price: Decimal = Field(..., gt=0)
    volume: int = Field(..., ge=0)
    bid: Optional[Decimal] = None
    ask: Optional[Decimal] = None
    high: Optional[Decimal] = None
    low: Optional[Decimal] = None
    open: Optional[Decimal] = None
    close: Optional[Decimal] = None


class PriceAlert(BaseModel):
    """Price alert configuration."""
    symbol: str = Field(..., regex="^[A-Z]{2,10}$")
    condition: str = Field(..., regex="^(above|below|change_percent)$")
    threshold: Decimal
    is_active: bool = True


class MarketAnalysis(BaseModel):
    """Market analysis results."""
    symbol: str
    trend: str = Field(..., regex="^(bullish|bearish|neutral)$")
    support_levels: List[Decimal]
    resistance_levels: List[Decimal]
    volatility: float
    momentum_score: float
    recommendation: str = Field(..., regex="^(buy|sell|hold)$")


# Pricing Models Engine
class AdvancedPricingEngine:
    """Sophisticated pricing models for energy commodities."""
    
    @staticmethod
    def calculate_forward_curve(
        symbol: str,
        spot_price: Decimal,
        time_to_maturity: List[int]
    ) -> Dict[int, Decimal]:
        """
        Calculate forward curve for energy commodities.
        
        Args:
            symbol: Energy commodity symbol
            spot_price: Current spot price
            time_to_maturity: List of days to maturity
            
        Returns:
            Forward prices for each maturity
        """
        forward_curve = {}
        
        # Convenience yield model for energy commodities
        convenience_yield = 0.05  # 5% annual convenience yield
        risk_free_rate = 0.03     # 3% risk-free rate
        storage_cost = 0.02       # 2% annual storage cost
        
        for days in time_to_maturity:
            years = days / 365.25
            
            # Forward price calculation with convenience yield
            net_cost = risk_free_rate + storage_cost - convenience_yield
            forward_price = spot_price * Decimal(str((1 + net_cost) ** years))
            
            # Add seasonality adjustment for energy commodities
            seasonal_factor = 1 + 0.1 * (0.5 - abs(0.5 - (days % 365) / 365))
            forward_price *= Decimal(str(seasonal_factor))
            
            forward_curve[days] = round(forward_price, 4)
        
        return forward_curve
    
    @staticmethod
    def calculate_volatility_surface(
        symbol: str,
        historical_prices: List[Decimal],
        time_horizons: List[int]
    ) -> Dict[int, float]:
        """
        Calculate implied volatility surface.
        
        Args:
            symbol: Energy commodity symbol
            historical_prices: Historical price data
            time_horizons: Time horizons for volatility calculation
            
        Returns:
            Volatility values for each time horizon
        """
        volatility_surface = {}
        
        if len(historical_prices) < 2:
            # Default volatility structure
            base_vol = 0.25
            for horizon in time_horizons:
                # Term structure: short-term higher volatility
                term_adjustment = max(0.8, 1 - (horizon / 365) * 0.2)
                volatility_surface[horizon] = base_vol * term_adjustment
            return volatility_surface
        
        # Calculate historical volatility
        returns = []
        for i in range(1, len(historical_prices)):
            return_val = float(historical_prices[i] / historical_prices[i-1] - 1)
            returns.append(return_val)
        
        # Annualized volatility
        import statistics
        daily_vol = statistics.stdev(returns) if len(returns) > 1 else 0.01
        annual_vol = daily_vol * (252 ** 0.5)  # 252 trading days
        
        # Term structure adjustment
        for horizon in time_horizons:
            term_factor = max(0.7, 1 - (horizon / 365) * 0.3)
            volatility_surface[horizon] = annual_vol * term_factor
        
        return volatility_surface
    
    @staticmethod
    def calculate_option_prices(
        underlying_price: Decimal,
        strike_prices: List[Decimal],
        time_to_expiry: int,
        volatility: float,
        option_type: str = "call"
    ) -> Dict[str, Decimal]:
        """
        Calculate option prices using Black-Scholes model.
        
        Args:
            underlying_price: Current underlying price
            strike_prices: List of strike prices
            time_to_expiry: Days to expiry
            volatility: Implied volatility
            option_type: "call" or "put"
            
        Returns:
            Option prices for each strike
        """
        import math
        from scipy.stats import norm
        
        option_prices = {}
        
        # Risk-free rate assumption
        risk_free_rate = 0.03
        time_years = time_to_expiry / 365.25
        
        for strike in strike_prices:
            try:
                # Black-Scholes calculation
                S = float(underlying_price)
                K = float(strike)
                T = time_years
                r = risk_free_rate
                sigma = volatility
                
                d1 = (math.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*math.sqrt(T))
                d2 = d1 - sigma*math.sqrt(T)
                
                if option_type == "call":
                    price = S*norm.cdf(d1) - K*math.exp(-r*T)*norm.cdf(d2)
                else:  # put
                    price = K*math.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)
                
                option_prices[f"{option_type}_{K}"] = Decimal(str(max(0, round(price, 4))))
                
            except Exception as e:
                logger.warning(f"Option pricing error for strike {strike}: {e}")
                option_prices[f"{option_type}_{K}"] = Decimal("0")
        
        return option_prices


# WebSocket connection manager for real-time data
class MarketDataManager:
    """Real-time market data connection manager."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # Remove from all subscriptions
        for symbol in list(self.subscriptions.keys()):
            if websocket in self.subscriptions[symbol]:
                self.subscriptions[symbol].remove(websocket)
                if not self.subscriptions[symbol]:
                    del self.subscriptions[symbol]
    
    def subscribe(self, websocket: WebSocket, symbol: str):
        """Subscribe to symbol updates."""
        if symbol not in self.subscriptions:
            self.subscriptions[symbol] = []
        if websocket not in self.subscriptions[symbol]:
            self.subscriptions[symbol].append(websocket)
    
    async def broadcast_price_update(self, symbol: str, data: dict):
        """Broadcast price update to subscribers."""
        if symbol in self.subscriptions:
            message = json.dumps({
                "type": "price_update",
                "symbol": symbol,
                "data": data,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            disconnected = []
            for websocket in self.subscriptions[symbol]:
                try:
                    await websocket.send_text(message)
                except Exception:
                    disconnected.append(websocket)
            
            # Clean up disconnected clients
            for websocket in disconnected:
                self.disconnect(websocket)


market_data_manager = MarketDataManager()


# Market Data Endpoints
@router.get("/quotes", dependencies=[Depends(require_permission("market_data:read"))])
async def get_market_quotes(
    symbols: str = Query(..., description="Comma-separated list of symbols"),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get real-time market quotes for energy commodities.
    
    Args:
        symbols: Comma-separated list of commodity symbols
        current_user: Current authenticated user
        
    Returns:
        Real-time market quotes and basic analytics
    """
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        
        # Mock real-time data - in production would connect to market data providers
        quotes = {}
        for symbol in symbol_list:
            base_price = hash(symbol) % 100 + 50  # Deterministic mock price
            volatility = (hash(symbol) % 30 + 10) / 100  # 10-40% volatility
            
            quotes[symbol] = {
                "symbol": symbol,
                "price": base_price + (hash(str(datetime.now())) % 10 - 5),
                "bid": base_price - 0.25,
                "ask": base_price + 0.25,
                "volume": hash(symbol) % 10000 + 1000,
                "change": (hash(symbol + "change") % 10 - 5) / 10,
                "change_percent": ((hash(symbol + "pct") % 10 - 5) / 100),
                "volatility": volatility,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Audit logging
        audit_logger.log_data_access(
            current_user["user_id"],
            "market_quotes",
            "read",
            len(symbol_list),
            {"symbols": symbol_list}
        )
        
        return {
            "quotes": quotes,
            "market_status": "open",
            "data_provider": "quantenergx-feed",
            "latency_ms": 15
        }
        
    except Exception as e:
        logger.error(f"Market quotes error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Market data retrieval failed"
        )


@router.get("/historical", dependencies=[Depends(require_permission("market_data:read"))])
async def get_historical_data(
    symbol: str = Query(..., regex="^[A-Z]{2,10}$"),
    period: str = Query(default="1d", regex="^(1d|5d|1m|3m|6m|1y|2y)$"),
    interval: str = Query(default="1h", regex="^(1m|5m|15m|1h|4h|1d)$"),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get historical market data for analysis and backtesting.
    
    Args:
        symbol: Energy commodity symbol
        period: Historical period (1d, 5d, 1m, 3m, 6m, 1y, 2y)
        interval: Data interval (1m, 5m, 15m, 1h, 4h, 1d)
        current_user: Current authenticated user
        
    Returns:
        Historical OHLCV data with technical indicators
    """
    try:
        # Parse period to determine data points
        period_days = {
            "1d": 1, "5d": 5, "1m": 30, "3m": 90, 
            "6m": 180, "1y": 365, "2y": 730
        }
        
        interval_minutes = {
            "1m": 1, "5m": 5, "15m": 15, "1h": 60, 
            "4h": 240, "1d": 1440
        }
        
        days = period_days.get(period, 30)
        minutes = interval_minutes.get(interval, 60)
        
        # Generate mock historical data
        data_points = []
        base_price = hash(symbol) % 100 + 50
        current_time = datetime.utcnow()
        
        # Calculate number of data points
        total_minutes = days * 24 * 60
        num_points = min(total_minutes // minutes, 1000)  # Limit to 1000 points
        
        for i in range(num_points):
            timestamp = current_time - timedelta(minutes=minutes * (num_points - i))
            
            # Simple random walk for price simulation
            price_change = (hash(str(timestamp) + symbol) % 200 - 100) / 1000
            price = base_price + price_change * i / 100
            
            # OHLCV data
            data_point = {
                "timestamp": timestamp.isoformat(),
                "open": round(price - 0.1, 2),
                "high": round(price + 0.3, 2),
                "low": round(price - 0.2, 2),
                "close": round(price, 2),
                "volume": hash(str(timestamp)) % 5000 + 1000
            }
            data_points.append(data_point)
        
        # Calculate technical indicators
        closes = [point["close"] for point in data_points]
        
        # Simple moving averages
        sma_20 = []
        sma_50 = []
        
        for i in range(len(closes)):
            if i >= 19:
                sma_20.append(sum(closes[i-19:i+1]) / 20)
            else:
                sma_20.append(closes[i])
            
            if i >= 49:
                sma_50.append(sum(closes[i-49:i+1]) / 50)
            else:
                sma_50.append(closes[i])
        
        # Add indicators to data points
        for i, point in enumerate(data_points):
            point["sma_20"] = round(sma_20[i], 2)
            point["sma_50"] = round(sma_50[i], 2)
        
        # Audit logging
        audit_logger.log_data_access(
            current_user["user_id"],
            "historical_data",
            "read",
            len(data_points),
            {"symbol": symbol, "period": period, "interval": interval}
        )
        
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "data_points": len(data_points),
            "data": data_points[-100:],  # Return last 100 points for API efficiency
            "technical_indicators": {
                "sma_20": sma_20[-1] if sma_20 else None,
                "sma_50": sma_50[-1] if sma_50 else None,
                "current_price": closes[-1] if closes else None
            }
        }
        
    except Exception as e:
        logger.error(f"Historical data error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Historical data retrieval failed"
        )


@router.get("/forward-curve", dependencies=[Depends(require_permission("market_data:read"))])
async def get_forward_curve(
    symbol: str = Query(..., regex="^[A-Z]{2,10}$"),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get forward curve pricing for energy commodities.
    
    Args:
        symbol: Energy commodity symbol
        current_user: Current authenticated user
        
    Returns:
        Forward curve with prices for different maturities
    """
    try:
        # Get current spot price
        spot_price = Decimal(str(hash(symbol) % 100 + 50))
        
        # Define maturity points (days)
        maturities = [30, 60, 90, 180, 365, 730, 1095]  # 1M to 3Y
        
        # Calculate forward curve
        forward_curve = AdvancedPricingEngine.calculate_forward_curve(
            symbol, spot_price, maturities
        )
        
        # Format for response
        curve_data = []
        for days, price in forward_curve.items():
            curve_data.append({
                "maturity_days": days,
                "maturity_date": (datetime.utcnow() + timedelta(days=days)).date().isoformat(),
                "forward_price": float(price),
                "premium_discount": float((price / spot_price - 1) * 100)
            })
        
        # Calculate curve characteristics
        contango = forward_curve[365] > spot_price
        max_premium = max(float(price / spot_price - 1) for price in forward_curve.values())
        
        return {
            "symbol": symbol,
            "spot_price": float(spot_price),
            "curve_data": curve_data,
            "curve_shape": "contango" if contango else "backwardation",
            "max_premium_percent": round(max_premium * 100, 2),
            "calculation_time": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Forward curve error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Forward curve calculation failed"
        )


@router.get("/volatility-surface", dependencies=[Depends(require_permission("market_data:read"))])
async def get_volatility_surface(
    symbol: str = Query(..., regex="^[A-Z]{2,10}$"),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get implied volatility surface for options pricing.
    
    Args:
        symbol: Energy commodity symbol
        current_user: Current authenticated user
        
    Returns:
        Volatility surface data for different strikes and expiries
    """
    try:
        # Mock historical prices for volatility calculation
        base_price = hash(symbol) % 100 + 50
        historical_prices = [
            Decimal(str(base_price + (hash(str(i) + symbol) % 10 - 5)))
            for i in range(30)  # 30 days of mock data
        ]
        
        # Time horizons for volatility surface
        time_horizons = [7, 14, 30, 60, 90, 180, 365]  # 1W to 1Y
        
        # Calculate volatility surface
        vol_surface = AdvancedPricingEngine.calculate_volatility_surface(
            symbol, historical_prices, time_horizons
        )
        
        # Format surface data
        surface_data = []
        for horizon, volatility in vol_surface.items():
            surface_data.append({
                "expiry_days": horizon,
                "expiry_date": (datetime.utcnow() + timedelta(days=horizon)).date().isoformat(),
                "implied_volatility": round(volatility, 4),
                "volatility_percent": round(volatility * 100, 2)
            })
        
        # Calculate vol characteristics
        term_structure = "ascending" if vol_surface[365] > vol_surface[7] else "descending"
        avg_volatility = sum(vol_surface.values()) / len(vol_surface)
        
        return {
            "symbol": symbol,
            "surface_data": surface_data,
            "term_structure": term_structure,
            "average_volatility": round(avg_volatility, 4),
            "volatility_regime": "high" if avg_volatility > 0.3 else "normal" if avg_volatility > 0.15 else "low",
            "calculation_time": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Volatility surface error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Volatility surface calculation failed"
        )


@router.websocket("/live-feed")
async def websocket_live_feed(websocket: WebSocket):
    """
    WebSocket endpoint for real-time market data feed.
    
    Args:
        websocket: WebSocket connection
    """
    await market_data_manager.connect(websocket)
    
    try:
        while True:
            # Receive subscription requests
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "subscribe":
                symbol = message.get("symbol", "").upper()
                if symbol:
                    market_data_manager.subscribe(websocket, symbol)
                    await websocket.send_text(json.dumps({
                        "type": "subscription_confirmed",
                        "symbol": symbol,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
            
            # Simulate real-time price updates (every 5 seconds)
            await asyncio.sleep(5)
            
            # Send mock price updates for subscribed symbols
            for symbol in market_data_manager.subscriptions:
                if websocket in market_data_manager.subscriptions[symbol]:
                    price_data = {
                        "price": hash(str(datetime.now()) + symbol) % 100 + 50,
                        "volume": hash(str(datetime.now())) % 1000 + 100,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    await market_data_manager.broadcast_price_update(symbol, price_data)
    
    except WebSocketDisconnect:
        market_data_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        market_data_manager.disconnect(websocket)