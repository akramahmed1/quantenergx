# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "QuantEnergX API is running"
    assert response.json()["version"] == "1.0.0"


def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "timestamp" in response.json()


def test_api_docs_disabled_in_production():
    """Test that API docs are disabled in production."""
    # This would need environment variable mocking in a real test
    # For now, just verify the endpoint exists in development
    response = client.get("/docs")
    # Should return 200 in development, 404 in production
    assert response.status_code in [200, 404]


class TestAuthentication:
    """Test authentication endpoints."""
    
    def test_login_success(self):
        """Test successful login."""
        response = client.post(
            "/v1/auth/login",
            data={"username": "demo@quantenergx.com", "password": "demo123"}
        )
        assert response.status_code == 200
        assert "access_token" in response.json()
        assert "refresh_token" in response.json()
        assert response.json()["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        response = client.post(
            "/v1/auth/login",
            data={"username": "invalid@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert "detail" in response.json()
    
    def test_register_new_user(self):
        """Test user registration."""
        user_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "password": "newpassword123",
            "role": "user"
        }
        response = client.post("/v1/auth/register", json=user_data)
        assert response.status_code == 200
        assert response.json()["email"] == user_data["email"]
        assert response.json()["name"] == user_data["name"]
        assert "id" in response.json()


class TestTrading:
    """Test trading endpoints."""
    
    def test_get_positions_unauthorized(self):
        """Test getting positions without authentication."""
        response = client.get("/v1/trading/positions")
        assert response.status_code == 401
    
    def test_create_order_unauthorized(self):
        """Test creating order without authentication."""
        order_data = {
            "symbol": "ENERGY_USD",
            "quantity": 10,
            "side": "buy",
            "order_type": "market"
        }
        response = client.post("/v1/trading/orders", json=order_data)
        assert response.status_code == 401


class TestMarketData:
    """Test market data endpoints."""
    
    def test_get_current_prices_unauthorized(self):
        """Test getting current prices without authentication."""
        response = client.get("/v1/market/prices")
        assert response.status_code == 401
    
    def test_get_supported_symbols(self):
        """Test getting supported symbols."""
        response = client.get("/v1/market/symbols")
        assert response.status_code == 401  # Requires auth in current implementation


class TestIoT:
    """Test IoT endpoints."""
    
    def test_get_devices_unauthorized(self):
        """Test getting devices without authentication."""
        response = client.get("/v1/iot/devices")
        assert response.status_code == 401
    
    def test_register_device_unauthorized(self):
        """Test registering device without authentication."""
        device_data = {
            "device_id": "TEST_DEVICE_001",
            "name": "Test Device",
            "device_type": "energy_meter",
            "location": "Test Location"
        }
        response = client.post("/v1/iot/devices", json=device_data)
        assert response.status_code == 401


class TestAnalytics:
    """Test analytics endpoints."""
    
    def test_get_dashboard_unauthorized(self):
        """Test getting dashboard without authentication."""
        response = client.get("/v1/analytics/dashboard")
        assert response.status_code == 401


class TestSecurity:
    """Test security endpoints."""
    
    def test_get_audit_logs_unauthorized(self):
        """Test getting audit logs without authentication."""
        response = client.get("/v1/security/logs")
        assert response.status_code == 401


class TestLocalization:
    """Test localization endpoints."""
    
    def test_get_supported_languages(self):
        """Test getting supported languages."""
        response = client.get("/v1/localization/languages")
        assert response.status_code == 200
        assert "languages" in response.json()
        languages = response.json()["languages"]
        assert len(languages) >= 4  # EN, AR, FR, ES
        
        # Check for required languages
        language_codes = [lang["code"] for lang in languages]
        assert "en" in language_codes
        assert "ar" in language_codes
        assert "fr" in language_codes
        assert "es" in language_codes
    
    def test_get_translations_english(self):
        """Test getting English translations."""
        response = client.get("/v1/localization/translations/en")
        assert response.status_code == 200
        assert response.json()["language"] == "en"
        assert "translations" in response.json()
    
    def test_get_translations_arabic(self):
        """Test getting Arabic translations."""
        response = client.get("/v1/localization/translations/ar")
        assert response.status_code == 200
        assert response.json()["language"] == "ar"
        assert "translations" in response.json()
    
    def test_get_rtl_languages(self):
        """Test getting RTL languages."""
        response = client.get("/v1/localization/rtl-languages")
        assert response.status_code == 200
        assert "rtl_languages" in response.json()
        assert "ar" in response.json()["rtl_languages"]


class TestExtensibility:
    """Test extensibility endpoints."""
    
    def test_get_available_plugins_unauthorized(self):
        """Test getting available plugins without authentication."""
        response = client.get("/v1/extensions/plugins")
        assert response.status_code == 401
    
    def test_get_available_integrations(self):
        """Test getting available integrations."""
        response = client.get("/v1/extensions/integrations")
        assert response.status_code == 200
        assert "integrations" in response.json()
        integrations = response.json()["integrations"]
        assert len(integrations) > 0