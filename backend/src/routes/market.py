"""Market data routes with Redis caching."""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from utils.redis_client import redis_client, get_market_data_key
from config import settings

market_router = APIRouter()


# Pydantic models for typed responses
class MarketDataResponse(BaseModel):
    """Market data response model."""

    symbol: str
    price: float
    volume: float
    timestamp: datetime
    change_percent: float
    high: float
    low: float


class MarketListResponse(BaseModel):
    """Market list response model."""

    markets: List[MarketDataResponse]
    total: int
    cached: bool = False


@market_router.get("/data", response_model=MarketListResponse)
async def get_market_data(
    symbols: Optional[str] = Query(None, description="Comma-separated symbols"),
    timeframe: str = Query("1h", description="Timeframe for data"),
) -> MarketListResponse:
    """Get market data with Redis caching."""

    # Default symbols if none provided
    symbol_list = symbols.split(",") if symbols else ["CRUDE_OIL", "NATURAL_GAS", "ELECTRICITY"]

    cache_key = get_market_data_key(",".join(symbol_list), timeframe)

    # Try to get from cache first
    cached_data = await redis_client.get(cache_key)
    if cached_data:
        return MarketListResponse(**cached_data, cached=True)

    # Simulate market data (in real implementation, this would fetch from external APIs)
    import random
    from datetime import datetime, timezone

    market_data = []
    for symbol in symbol_list:
        base_price = {"CRUDE_OIL": 80.0, "NATURAL_GAS": 3.5, "ELECTRICITY": 45.0}.get(symbol, 50.0)

        data = MarketDataResponse(
            symbol=symbol,
            price=round(base_price * (1 + random.uniform(-0.05, 0.05)), 2),
            volume=int(random.randint(10000, 100000)),
            timestamp=datetime.now(timezone.utc),
            change_percent=round(random.uniform(-5.0, 5.0), 2),
            high=round(base_price * 1.03, 2),
            low=round(base_price * 0.97, 2),
        )
        market_data.append(data)

    response_data = MarketListResponse(markets=market_data, total=len(market_data))

    # Cache the response
    await redis_client.set(
        cache_key, response_data.model_dump(mode="json"), ttl=settings.market_data_cache_ttl
    )

    return response_data


@market_router.get("/data/{symbol}", response_model=MarketDataResponse)
async def get_single_market_data(symbol: str) -> MarketDataResponse:
    """Get single market data point."""

    cache_key = get_market_data_key(symbol, "current")

    # Try cache first
    cached_data = await redis_client.get(cache_key)
    if cached_data:
        return MarketDataResponse(**cached_data)

    # Simulate single market data
    import random
    from datetime import datetime, timezone

    base_price = {"CRUDE_OIL": 80.0, "NATURAL_GAS": 3.5, "ELECTRICITY": 45.0}.get(
        symbol.upper(), 50.0
    )

    data = MarketDataResponse(
        symbol=symbol.upper(),
        price=round(base_price * (1 + random.uniform(-0.05, 0.05)), 2),
        volume=int(random.randint(10000, 100000)),
        timestamp=datetime.now(timezone.utc),
        change_percent=round(random.uniform(-5.0, 5.0), 2),
        high=round(base_price * 1.03, 2),
        low=round(base_price * 0.97, 2),
    )

    # Cache the single item
    await redis_client.set(
        cache_key, data.model_dump(mode="json"), ttl=settings.market_data_cache_ttl
    )

    return data
