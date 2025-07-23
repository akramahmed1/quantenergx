"""
QuantEnerGx Market Data Tests

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime


class TestMarketData:
    """Test market data endpoints"""
    
    def test_get_current_prices_unauthorized(self, client: TestClient):
        """Test getting current prices without authentication"""
        response = client.get("/api/v1/market/prices/current")
        assert response.status_code == 401
    
    def test_get_current_prices_authorized(self, client: TestClient):
        """Test getting current prices with authentication"""
        # Register and login user
        user_data = {
            "email": "test@quantenergx.com",
            "password": "SecurePass123!",
            "full_name": "Test User"
        }
        client.post("/api/v1/auth/register", json=user_data)
        
        login_response = client.post("/api/v1/auth/login", data={
            "username": "test@quantenergx.com",
            "password": "SecurePass123!"
        })
        token = login_response.json()["access_token"]
        
        # Get current prices
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/market/prices/current", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_market_status(self, client: TestClient):
        """Test getting market status"""
        # Register and login user
        user_data = {
            "email": "test@quantenergx.com",
            "password": "SecurePass123!",
            "full_name": "Test User"
        }
        client.post("/api/v1/auth/register", json=user_data)
        
        login_response = client.post("/api/v1/auth/login", data={
            "username": "test@quantenergx.com",
            "password": "SecurePass123!"
        })
        token = login_response.json()["access_token"]
        
        # Get market status
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/market/markets/status", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data
        assert "markets" in data
        assert "overall_health" in data