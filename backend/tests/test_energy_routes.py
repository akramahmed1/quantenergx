"""Tests for energy routes with Redis caching."""
import pytest
from datetime import date, datetime
from fastapi.testclient import TestClient


class TestEnergyRoutes:
    """Test cases for energy routes."""

    def test_get_energy_prices_default(self, client: TestClient):
        """Test getting energy prices with default parameters."""
        response = client.get("/api/v1/energy/prices")
        assert response.status_code == 200

        data = response.json()
        assert "prices" in data
        assert "total" in data
        assert isinstance(data["prices"], list)
        assert data["total"] >= 0

    def test_get_energy_prices_with_params(self, client: TestClient):
        """Test getting energy prices with specific parameters."""
        response = client.get(
            "/api/v1/energy/prices",
            params={
                "market": "electricity",
                "region": "US_WEST",
                "date_from": "2024-01-01",
                "date_to": "2024-01-01",
            },
        )
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 1

        price_data = data["prices"][0]
        assert price_data["market"] == "ELECTRICITY"
        assert price_data["region"] == "US_WEST"
        assert price_data["currency"] == "USD"
        assert "price_per_mwh" in price_data
        assert "timestamp" in price_data

    def test_get_current_energy_price(self, client: TestClient):
        """Test getting current energy price."""
        response = client.get("/api/v1/energy/prices/current/electricity")
        assert response.status_code == 200

        data = response.json()
        assert data["market"] == "ELECTRICITY"
        assert "price_per_mwh" in data
        assert "timestamp" in data
        assert data["source"] == "REAL_TIME_FEED"

    def test_get_current_energy_price_with_region(self, client: TestClient):
        """Test getting current energy price with specific region."""
        response = client.get("/api/v1/energy/prices/current/natural_gas", params={"region": "EU"})
        assert response.status_code == 200

        data = response.json()
        assert data["market"] == "NATURAL_GAS"
        assert data["region"] == "EU"

    def test_clear_energy_cache(self, client: TestClient):
        """Test clearing energy price cache."""
        response = client.delete("/api/v1/energy/prices/cache/electricity")
        assert response.status_code == 200

        data = response.json()
        assert "message" in data
        assert "keys_deleted" in data

    @pytest.mark.parametrize("market", ["electricity", "natural_gas", "crude_oil"])
    def test_current_price_different_markets(self, client: TestClient, market: str):
        """Test current prices for different energy markets."""
        response = client.get(f"/api/v1/energy/prices/current/{market}")
        assert response.status_code == 200

        data = response.json()
        assert data["market"] == market.upper()
        assert isinstance(data["price_per_mwh"], (int, float))
        assert data["price_per_mwh"] > 0

    @pytest.mark.parametrize("region", ["US_WEST", "US_EAST", "EU", "ASIA"])
    def test_current_price_different_regions(self, client: TestClient, region: str):
        """Test current prices for different regions."""
        response = client.get(
            "/api/v1/energy/prices/current/electricity", params={"region": region}
        )
        assert response.status_code == 200

        data = response.json()
        assert data["region"] == region

    def test_energy_price_response_model(self, client: TestClient):
        """Test that energy price response follows the expected model."""
        response = client.get("/api/v1/energy/prices/current/electricity")
        assert response.status_code == 200

        data = response.json()

        # Check all required fields are present
        required_fields = [
            "market",
            "date",
            "price_per_mwh",
            "currency",
            "region",
            "source",
            "timestamp",
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"

        # Check data types
        assert isinstance(data["price_per_mwh"], (int, float))
        assert isinstance(data["currency"], str)
        assert data["currency"] == "USD"

    def test_date_range_validation(self, client: TestClient):
        """Test date range handling."""
        # Test with same start and end date
        response = client.get(
            "/api/v1/energy/prices", params={"date_from": "2024-01-01", "date_to": "2024-01-01"}
        )
        assert response.status_code == 200
        assert response.json()["total"] == 1

        # Test with date range
        response = client.get(
            "/api/v1/energy/prices", params={"date_from": "2024-01-01", "date_to": "2024-01-03"}
        )
        assert response.status_code == 200
        assert response.json()["total"] == 3
