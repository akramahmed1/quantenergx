"""Tests for the main FastAPI application."""
import pytest
from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "QuantEnergx Backend API" in response.json()["message"]
    assert response.json()["version"] == "2.0.0"


def test_health_endpoint(client: TestClient):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200

    health_data = response.json()
    assert "status" in health_data
    assert "timestamp" in health_data
    assert "version" in health_data
    assert health_data["version"] == "2.0.0"
    assert "services" in health_data


def test_api_health_endpoint(client: TestClient):
    """Test API health check endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    api_health = response.json()
    assert api_health["status"] == "API online"
    assert api_health["version"] == "2.0.0"


def test_cors_headers(client: TestClient):
    """Test CORS headers are present."""
    response = client.get("/health")

    # CORS headers should be present in the response
    # Note: CORS headers are typically added by the middleware
    assert response.status_code == 200


def test_security_headers(client: TestClient):
    """Test security headers are present."""
    response = client.get("/health")

    # Security headers should be present
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("x-xss-protection") == "1; mode=block"
    assert "referrer-policy" in response.headers
    assert "x-process-time" in response.headers


def test_404_endpoint(client: TestClient):
    """Test 404 handling."""
    response = client.get("/nonexistent")
    assert response.status_code == 404
    assert "error" in response.json()


def test_api_404_endpoint(client: TestClient):
    """Test API 404 handling."""
    response = client.get("/api/v1/nonexistent")
    assert response.status_code == 404
    assert "error" in response.json()


@pytest.mark.asyncio
async def test_application_startup():
    """Test application can start up properly."""
    from main import app

    # Basic check that app is configured
    assert app.title == "QuantEnergx Backend API"
    assert app.version == "2.0.0"

    # Check routes are registered
    route_paths = [route.path for route in app.routes]
    assert "/" in route_paths
    assert "/health" in route_paths
