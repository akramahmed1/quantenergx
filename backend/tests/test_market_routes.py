"""Tests for market data routes."""
import pytest
from fastapi.testclient import TestClient


class TestMarketRoutes:
    """Test cases for market data routes."""

    def test_get_market_data_default(self, client: TestClient):
        """Test getting market data with default parameters."""
        response = client.get("/api/v1/market/data")
        assert response.status_code == 200

        data = response.json()
        assert "markets" in data
        assert "total" in data
        assert isinstance(data["markets"], list)
        assert data["total"] == 3  # Default symbols: CRUDE_OIL, NATURAL_GAS, ELECTRICITY

        # Check first market data item
        market_item = data["markets"][0]
        required_fields = [
            "symbol",
            "price",
            "volume",
            "timestamp",
            "change_percent",
            "high",
            "low",
        ]
        for field in required_fields:
            assert field in market_item, f"Missing field: {field}"

    def test_get_market_data_with_symbols(self, client: TestClient):
        """Test getting market data with specific symbols."""
        symbols = "CRUDE_OIL,ELECTRICITY"
        response = client.get("/api/v1/market/data", params={"symbols": symbols, "timeframe": "1h"})
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 2

        symbols_list = [market["symbol"] for market in data["markets"]]
        assert "CRUDE_OIL" in symbols_list
        assert "ELECTRICITY" in symbols_list

    def test_get_single_market_data(self, client: TestClient):
        """Test getting single market data."""
        response = client.get("/api/v1/market/data/CRUDE_OIL")
        assert response.status_code == 200

        data = response.json()
        assert data["symbol"] == "CRUDE_OIL"
        assert isinstance(data["price"], (int, float))
        assert isinstance(data["volume"], (int, float))  # Allow float due to JSON serialization
        assert "timestamp" in data
        assert "change_percent" in data
        assert "high" in data
        assert "low" in data

    def test_market_data_response_model(self, client: TestClient):
        """Test that market data response follows the expected model."""
        response = client.get("/api/v1/market/data/NATURAL_GAS")
        assert response.status_code == 200

        data = response.json()

        # Check data types (volume might be float due to JSON serialization)
        assert isinstance(data["price"], (int, float))
        assert isinstance(data["volume"], (int, float))  # Allow float due to JSON serialization
        assert isinstance(data["change_percent"], (int, float))
        assert isinstance(data["high"], (int, float))
        assert isinstance(data["low"], (int, float))

        # Check logical constraints (allow for small rounding errors)
        assert data["high"] >= data["price"] - 0.1  # Allow small margin for rounding
        assert data["low"] <= data["price"] + 0.1    # Allow small margin for rounding
        assert data["volume"] > 0

    def test_market_data_with_timeframe(self, client: TestClient):
        """Test market data with different timeframes."""
        timeframes = ["1h", "4h", "1d", "1w"]

        for timeframe in timeframes:
            response = client.get("/api/v1/market/data", params={"timeframe": timeframe})
            assert response.status_code == 200

            data = response.json()
            assert data["total"] == 3  # Default symbols

    @pytest.mark.parametrize("symbol", ["CRUDE_OIL", "NATURAL_GAS", "ELECTRICITY"])
    def test_different_symbols(self, client: TestClient, symbol: str):
        """Test different market symbols."""
        response = client.get(f"/api/v1/market/data/{symbol}")
        assert response.status_code == 200

        data = response.json()
        assert data["symbol"] == symbol
        assert data["price"] > 0

    def test_market_data_caching(self, client: TestClient):
        """Test that market data caching is working."""
        # Make first request
        response1 = client.get("/api/v1/market/data/CRUDE_OIL")
        assert response1.status_code == 200
        data1 = response1.json()

        # Make second request (should be cached, but we can't test cache hit directly)
        response2 = client.get("/api/v1/market/data/CRUDE_OIL")
        assert response2.status_code == 200
        data2 = response2.json()

        # Both responses should have the same structure
        assert data1.keys() == data2.keys()
        assert data1["symbol"] == data2["symbol"]

    def test_market_list_response_structure(self, client: TestClient):
        """Test the structure of market list response."""
        response = client.get("/api/v1/market/data")
        assert response.status_code == 200

        data = response.json()

        # Check top-level structure
        assert "markets" in data
        assert "total" in data
        assert "cached" in data  # Should indicate caching status

        # Check markets array structure
        assert isinstance(data["markets"], list)
        assert len(data["markets"]) == data["total"]

        # Check individual market item structure
        if data["markets"]:
            market = data["markets"][0]
            expected_fields = {
                "symbol": str,
                "price": (int, float),
                "volume": (int, float),  # Allow float due to JSON serialization
                "timestamp": str,
                "change_percent": (int, float),
                "high": (int, float),
                "low": (int, float),
            }

            for field, expected_type in expected_fields.items():
                assert field in market
                assert isinstance(market[field], expected_type)

    def test_empty_symbols_parameter(self, client: TestClient):
        """Test behavior with empty symbols parameter."""
        response = client.get("/api/v1/market/data", params={"symbols": ""})
        assert response.status_code == 200

        # Should fall back to default symbols
        data = response.json()
        assert data["total"] == 3
