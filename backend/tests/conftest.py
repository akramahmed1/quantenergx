"""Pytest configuration and fixtures for QuantEnergx backend tests."""
import asyncio
import os
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Set up test environment variables before importing the app
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("JWT_SECRET", "test-secret-key-32-characters-long")
os.environ.setdefault("JWT_REFRESH_SECRET", "test-refresh-secret-32-characters")
os.environ.setdefault("API_ENCRYPTION_KEY", "test-encryption-key-32-chars-long")

from main import app
from database import db_client
from utils.redis_client import redis_client
from config import settings


# Test configuration
pytest_plugins = ["pytest_asyncio"]


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_app():
    """Create FastAPI test application."""
    return app


@pytest.fixture
def client() -> TestClient:
    """Create synchronous test client."""
    return TestClient(app)


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create asynchronous test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def redis_client_fixture():
    """Redis client fixture for testing."""
    # Use a different Redis DB for testing
    test_redis = redis_client
    test_redis.client = test_redis.client if test_redis.client else await test_redis.connect()

    # Use test database
    await test_redis.client.select(15)  # Use DB 15 for tests

    yield test_redis

    # Clean up test database
    await test_redis.client.flushdb()
    await test_redis.client.select(0)  # Back to default DB


@pytest_asyncio.fixture
async def db_client_fixture():
    """Database client fixture for testing."""
    # In a real implementation, this would use a test database
    # For now, we'll mock database operations in tests
    yield db_client


# Test data factories
class TestDataFactory:
    """Factory for creating test data."""

    @staticmethod
    def create_market_data(**kwargs):
        """Create test market data."""
        from datetime import datetime, timezone

        defaults = {
            "symbol": "TEST_SYMBOL",
            "price": 50.0,
            "volume": 10000,
            "timestamp": datetime.now(timezone.utc),
            "change_percent": 2.5,
            "high": 52.0,
            "low": 48.0,
        }
        defaults.update(kwargs)
        return defaults

    @staticmethod
    def create_energy_price(**kwargs):
        """Create test energy price data."""
        from datetime import date, datetime, timezone

        defaults = {
            "market": "ELECTRICITY",
            "date": date.today(),
            "price_per_mwh": 45.0,
            "currency": "USD",
            "region": "US_WEST",
            "source": "TEST_PROVIDER",
            "timestamp": datetime.now(timezone.utc),
        }
        defaults.update(kwargs)
        return defaults

    @staticmethod
    def create_user(**kwargs):
        """Create test user data."""
        defaults = {
            "id": "test-user-123",
            "email": "test@example.com",
            "username": "testuser",
            "is_active": True,
            "is_verified": True,
        }
        defaults.update(kwargs)
        return defaults


@pytest.fixture
def test_data_factory():
    """Test data factory fixture."""
    return TestDataFactory


# Mock external API responses and Redis for testing
@pytest.fixture(autouse=True)
def mock_redis_and_external_apis(monkeypatch):
    """Mock Redis client and external API calls for testing."""

    # Mock Redis client
    class MockRedisClient:
        def __init__(self):
            self.data = {}

        async def get(self, key: str, json_decode: bool = True):
            """Mock get method."""
            value = self.data.get(key)
            if value is None:
                return None

            if json_decode and isinstance(value, str):
                try:
                    import json

                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    return value
            return value

        async def set(self, key: str, value, ttl: int = None):
            """Mock set method."""
            if isinstance(value, (dict, list)):
                import json

                value = json.dumps(value, default=str)
            self.data[key] = value
            return True

        async def delete(self, *keys):
            """Mock delete method."""
            count = 0
            for key in keys:
                if key in self.data:
                    del self.data[key]
                    count += 1
            return count

        async def exists(self, key: str):
            """Mock exists method."""
            return key in self.data

        async def get_ttl(self, key: str):
            """Mock TTL method."""
            return 300 if key in self.data else None

    # Replace the global redis client with mock
    from utils.redis_client import redis_client

    mock_redis = MockRedisClient()
    monkeypatch.setattr(redis_client, "client", mock_redis)

    # Mock Redis methods directly on the client
    monkeypatch.setattr(redis_client, "get", mock_redis.get)
    monkeypatch.setattr(redis_client, "set", mock_redis.set)
    monkeypatch.setattr(redis_client, "delete", mock_redis.delete)
    monkeypatch.setattr(redis_client, "exists", mock_redis.exists)
    monkeypatch.setattr(redis_client, "get_ttl", mock_redis.get_ttl)


# Database setup and teardown
@pytest_asyncio.fixture(autouse=True)
async def setup_test_database():
    """Set up test database before each test."""
    # In a real implementation, this would:
    # 1. Create test database schema
    # 2. Run migrations
    # 3. Seed test data
    pass


@pytest_asyncio.fixture(autouse=True)
async def cleanup_test_database():
    """Clean up test database after each test."""
    # In a real implementation, this would:
    # 1. Truncate test tables
    # 2. Reset sequences
    # 3. Clear test data
    pass


# Performance testing fixtures
@pytest.fixture
def performance_threshold():
    """Performance threshold configuration."""
    return {
        "api_response_time_ms": 500,
        "cache_hit_ratio": 0.8,
        "database_query_time_ms": 100,
    }


# Parametrized fixtures for different test scenarios
@pytest.fixture(params=["electricity", "natural_gas", "crude_oil"])
def energy_market(request):
    """Parametrized fixture for different energy markets."""
    return request.param


@pytest.fixture(params=["US_WEST", "US_EAST", "EU", "ASIA"])
def market_region(request):
    """Parametrized fixture for different market regions."""
    return request.param


# Configuration override for testing
@pytest.fixture(autouse=True)
def override_settings_for_tests(monkeypatch):
    """Override settings for testing environment."""
    # Override cache TTL for faster tests
    monkeypatch.setattr(settings, "energy_price_cache_ttl", 1)
    monkeypatch.setattr(settings, "market_data_cache_ttl", 1)

    # Override rate limiting for tests
    monkeypatch.setattr(settings, "rate_limit_per_minute", 1000)
    monkeypatch.setattr(settings, "auth_rate_limit_per_minute", 100)

    # Set debug mode for detailed error messages
    monkeypatch.setattr(settings, "debug", True)
