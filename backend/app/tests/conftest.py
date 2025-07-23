# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

"""
Test configuration and fixtures for QuantEnergX backend tests.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def test_client():
    """Create test client for API testing."""
    from app.main import app
    return TestClient(app)


@pytest.fixture
def mock_user():
    """Mock user data for testing."""
    return {
        "id": "test-user-123",
        "email": "test@quantenergx.com",
        "name": "Test User",
        "role": "user"
    }


@pytest.fixture
def auth_headers(test_client, mock_user):
    """Get authentication headers for testing protected endpoints."""
    # In a real implementation, you would create a test JWT token
    # For now, return empty headers since we're testing the structure
    return {"Authorization": "Bearer test-token"}