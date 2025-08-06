"""Energy price routes with Redis caching for high-frequency data."""
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from utils.redis_client import redis_client, get_energy_price_key
from config import settings

energy_router = APIRouter()


# Pydantic models for typed responses
class EnergyPriceResponse(BaseModel):
    """Energy price response model."""

    market: str
    date: date
    price_per_mwh: float
    currency: str = "USD"
    region: str
    source: str
    timestamp: datetime


class EnergyPriceListResponse(BaseModel):
    """Energy price list response model."""

    prices: List[EnergyPriceResponse]
    total: int
    cached: bool = False
    cache_ttl_seconds: Optional[int] = None


@energy_router.get("/prices", response_model=EnergyPriceListResponse)
async def get_energy_prices(
    market: str = Query("electricity", description="Energy market type"),
    region: Optional[str] = Query("US_WEST", description="Market region"),
    date_from: Optional[date] = Query(None, description="Start date"),
    date_to: Optional[date] = Query(None, description="End date"),
) -> EnergyPriceListResponse:
    """Get energy prices with Redis caching for high-frequency data."""

    # Use today if no dates provided
    if not date_from:
        date_from = date.today()
    if not date_to:
        date_to = date.today()

    cache_key = get_energy_price_key(f"{market}_{region}", f"{date_from}_{date_to}")

    # Try to get from cache first (high-frequency endpoint)
    cached_data = await redis_client.get(cache_key)
    if cached_data:
        # Get remaining TTL for cache info
        ttl = await redis_client.get_ttl(cache_key)
        response = EnergyPriceListResponse(**cached_data, cached=True, cache_ttl_seconds=ttl)
        return response

    # Simulate energy price data (in real implementation, fetch from market data providers)
    import random
    from datetime import datetime, timezone, timedelta

    energy_prices = []
    current_date = date_from

    while current_date <= date_to:
        base_price = {
            "electricity": 45.0,
            "natural_gas": 3.5,
            "crude_oil": 80.0,
            "renewable": 35.0,
        }.get(market.lower(), 40.0)

        # Add some regional variation
        regional_multiplier = {"US_WEST": 1.1, "US_EAST": 1.0, "EU": 1.3, "ASIA": 0.9}.get(
            region, 1.0
        )

        price_data = EnergyPriceResponse(
            market=market.upper(),
            date=current_date,
            price_per_mwh=round(
                base_price * regional_multiplier * (1 + random.uniform(-0.1, 0.1)), 2
            ),
            region=region,
            source="MARKET_DATA_PROVIDER",
            timestamp=datetime.now(timezone.utc),
        )
        energy_prices.append(price_data)
        current_date += timedelta(days=1)

    response_data = EnergyPriceListResponse(prices=energy_prices, total=len(energy_prices))

    # Cache with high-frequency TTL (shorter cache time for price data)
    await redis_client.set(
        cache_key, response_data.model_dump(mode="json"), ttl=settings.energy_price_cache_ttl
    )

    return response_data


@energy_router.get("/prices/current/{market}", response_model=EnergyPriceResponse)
async def get_current_energy_price(
    market: str, region: str = Query("US_WEST", description="Market region")
) -> EnergyPriceResponse:
    """Get current energy price for a specific market (high-frequency endpoint)."""

    cache_key = get_energy_price_key(f"{market}_{region}", "current")

    # Try cache first with very short TTL for current prices
    cached_data = await redis_client.get(cache_key)
    if cached_data:
        return EnergyPriceResponse(**cached_data)

    # Simulate current price data
    import random
    from datetime import datetime, timezone

    base_price = {
        "electricity": 45.0,
        "natural_gas": 3.5,
        "crude_oil": 80.0,
        "renewable": 35.0,
    }.get(market.lower(), 40.0)

    regional_multiplier = {"US_WEST": 1.1, "US_EAST": 1.0, "EU": 1.3, "ASIA": 0.9}.get(region, 1.0)

    current_price = EnergyPriceResponse(
        market=market.upper(),
        date=date.today(),
        price_per_mwh=round(
            base_price * regional_multiplier * (1 + random.uniform(-0.05, 0.05)), 2
        ),
        region=region,
        source="REAL_TIME_FEED",
        timestamp=datetime.now(timezone.utc),
    )

    # Cache with very short TTL for current prices (30 seconds)
    await redis_client.set(cache_key, current_price.model_dump(mode="json"), ttl=30)

    return current_price


@energy_router.delete("/prices/cache/{market}")
async def clear_energy_price_cache(market: str, region: str = Query("US_WEST")):
    """Clear energy price cache for a specific market."""

    # This would typically require admin permissions
    cache_pattern = f"energy_price:{market}_{region}:*"

    # For simplicity, just clear current cache
    current_key = get_energy_price_key(f"{market}_{region}", "current")
    deleted = await redis_client.delete(current_key)

    return {"message": f"Cache cleared for {market} in {region}", "keys_deleted": deleted}
