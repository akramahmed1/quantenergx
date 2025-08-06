"""Redis client utilities for QuantEnergx backend."""
import json
import logging
from typing import Any, Optional, Union
import redis.asyncio as redis
from redis.exceptions import RedisError
from config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """Async Redis client wrapper with connection pooling."""

    def __init__(self):
        """Initialize Redis client."""
        self.pool = None
        self.client = None

    async def connect(self):
        """Establish Redis connection with connection pool."""
        try:
            self.pool = redis.ConnectionPool(
                host=settings.redis_host,
                port=settings.redis_port,
                password=settings.redis_password,
                db=settings.redis_db,
                max_connections=settings.redis_max_connections,
                retry_on_timeout=True,
                decode_responses=True,
            )
            self.client = redis.Redis(connection_pool=self.pool)

            # Test the connection
            await self.client.ping()
            logger.info(
                f"Redis connected successfully to {settings.redis_host}:{settings.redis_port}"
            )

        except RedisError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def disconnect(self):
        """Close Redis connection."""
        if self.client:
            await self.client.aclose()
            logger.info("Redis connection closed")

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set a key-value pair with optional TTL."""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)

            if ttl:
                result = await self.client.setex(key, ttl, value)
            else:
                result = await self.client.set(key, value)

            return bool(result)

        except RedisError as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False

    async def get(self, key: str, json_decode: bool = True) -> Optional[Any]:
        """Get value by key with optional JSON decoding."""
        try:
            value = await self.client.get(key)
            if value is None:
                return None

            if json_decode:
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    return value

            return value

        except RedisError as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None

    async def delete(self, *keys: str) -> int:
        """Delete one or more keys."""
        try:
            return await self.client.delete(*keys)
        except RedisError as e:
            logger.error(f"Redis DELETE error for keys {keys}: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        try:
            return bool(await self.client.exists(key))
        except RedisError as e:
            logger.error(f"Redis EXISTS error for key {key}: {e}")
            return False

    async def expire(self, key: str, ttl: int) -> bool:
        """Set TTL for existing key."""
        try:
            return bool(await self.client.expire(key, ttl))
        except RedisError as e:
            logger.error(f"Redis EXPIRE error for key {key}: {e}")
            return False

    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment key by amount."""
        try:
            return await self.client.incrby(key, amount)
        except RedisError as e:
            logger.error(f"Redis INCR error for key {key}: {e}")
            return None

    async def get_ttl(self, key: str) -> Optional[int]:
        """Get TTL for key."""
        try:
            ttl = await self.client.ttl(key)
            return ttl if ttl >= 0 else None
        except RedisError as e:
            logger.error(f"Redis TTL error for key {key}: {e}")
            return None

    async def flushdb(self):
        """Flush current database (use with caution)."""
        try:
            await self.client.flushdb()
            logger.warning("Redis database flushed")
        except RedisError as e:
            logger.error(f"Redis FLUSHDB error: {e}")


# Cache key generators
def get_energy_price_key(market: str, date: str) -> str:
    """Generate cache key for energy price data."""
    return f"energy_price:{market}:{date}"


def get_market_data_key(symbol: str, timeframe: str) -> str:
    """Generate cache key for market data."""
    return f"market_data:{symbol}:{timeframe}"


def get_user_session_key(user_id: str, session_id: str) -> str:
    """Generate cache key for user session."""
    return f"user_session:{user_id}:{session_id}"


def get_rate_limit_key(identifier: str, endpoint: str) -> str:
    """Generate cache key for rate limiting."""
    return f"rate_limit:{identifier}:{endpoint}"


# Global Redis client instance
redis_client = RedisClient()
