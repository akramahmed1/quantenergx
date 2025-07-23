"""
QuantEnerGx Authentication Tests

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved
"""

import pytest
from fastapi.testclient import TestClient
from app.core.security import hash_password


class TestAuth:
    """Test authentication endpoints"""
    
    def test_register_user(self, client: TestClient):
        """Test user registration"""
        user_data = {
            "email": "test@quantenergx.com",
            "password": "SecurePass123!",
            "full_name": "Test User",
            "organization": "QuantEnerGx",
            "role": "analyst"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201
        
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]
        assert "id" in data
    
    def test_login_user(self, client: TestClient):
        """Test user login"""
        # First register a user
        user_data = {
            "email": "test@quantenergx.com",
            "password": "SecurePass123!",
            "full_name": "Test User"
        }
        client.post("/api/v1/auth/register", json=user_data)
        
        # Then login
        login_data = {
            "username": "test@quantenergx.com",
            "password": "SecurePass123!"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_get_current_user(self, client: TestClient):
        """Test getting current user info"""
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
        
        # Get user info
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@quantenergx.com"
        assert data["full_name"] == "Test User"
    
    def test_invalid_login(self, client: TestClient):
        """Test login with invalid credentials"""
        response = client.post("/api/v1/auth/login", data={
            "username": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401