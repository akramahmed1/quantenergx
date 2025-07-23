# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

import pytest
from app.services.auth_service import AuthService


@pytest.fixture
def auth_service():
    """Create auth service instance for testing."""
    return AuthService()


class TestAuthService:
    """Test authentication service."""
    
    @pytest.mark.asyncio
    async def test_authenticate_user_success(self, auth_service):
        """Test successful user authentication."""
        user = await auth_service.authenticate_user("demo@quantenergx.com", "demo123")
        assert user is not None
        assert user["email"] == "demo@quantenergx.com"
        assert user["id"] == "user-123"
    
    @pytest.mark.asyncio
    async def test_authenticate_user_failure(self, auth_service):
        """Test failed user authentication."""
        user = await auth_service.authenticate_user("invalid@example.com", "wrongpassword")
        assert user is None
    
    @pytest.mark.asyncio
    async def test_get_user_by_email(self, auth_service):
        """Test getting user by email."""
        user = await auth_service.get_user_by_email("demo@quantenergx.com")
        assert user is not None
        assert user["email"] == "demo@quantenergx.com"
    
    @pytest.mark.asyncio
    async def test_get_user_by_id(self, auth_service):
        """Test getting user by ID."""
        user = await auth_service.get_user_by_id("user-123")
        assert user is not None
        assert user["id"] == "user-123"
    
    @pytest.mark.asyncio
    async def test_create_user(self, auth_service):
        """Test creating new user."""
        user_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "role": "user"
        }
        user = await auth_service.create_user(user_data, "hashed_password")
        assert user["email"] == user_data["email"]
        assert user["name"] == user_data["name"]
        assert "id" in user