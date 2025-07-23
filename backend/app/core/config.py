#!/usr/bin/env python3
"""
QuantEnergX MVP - Core Configuration Module
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform

This module provides centralized configuration management for the QuantEnergX
MVP platform, implementing enterprise security standards and environment-based
configuration with proper secret management and validation.
"""

from functools import lru_cache
from typing import List, Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    """
    Enterprise configuration settings with environment-based overrides
    and security-first design patterns for SaaS energy trading platform.
    """
    
    # Application Configuration
    APP_NAME: str = "QuantEnergX MVP"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", regex="^(development|staging|production)$")
    DEBUG: bool = Field(default=False)
    
    # Security Configuration  
    SECRET_KEY: str = Field(..., min_length=32)
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    BCRYPT_ROUNDS: int = 12
    
    # Database Configuration
    DATABASE_URL: str = Field(
        default="postgresql://quantenergx:secure_password@localhost:5432/quantenergx_mvp"
    )
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 30
    
    # Redis Configuration
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    REDIS_PASSWORD: Optional[str] = None
    REDIS_SSL: bool = False
    
    # CORS & Security Headers
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:3000", "https://quantenergx.com"])
    ALLOWED_HOSTS: List[str] = Field(default=["localhost", "127.0.0.1", "quantenergx.com"])
    
    # External API Configuration
    MARKET_DATA_API_KEY: Optional[str] = None
    MARKET_DATA_BASE_URL: str = "https://api.marketdata.com/v1"
    
    # IoT & Telemetry Configuration
    IOT_BROKER_URL: str = "mqtt://localhost:1883"
    IOT_USERNAME: Optional[str] = None
    IOT_PASSWORD: Optional[str] = None
    
    # Email & Notifications
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@quantenergx.com"
    
    # Cloud & Storage Configuration
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "quantenergx-storage"
    
    # Analytics & Monitoring
    ANALYTICS_ENABLED: bool = True
    METRICS_ENDPOINT: Optional[str] = None
    LOG_LEVEL: str = "INFO"
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds
    
    # Localization
    DEFAULT_LANGUAGE: str = "en"
    SUPPORTED_LANGUAGES: List[str] = Field(default=["en", "ar", "fr", "es"])
    
    # Trading Configuration
    MAX_POSITION_SIZE: float = 1000000.0  # USD
    RISK_LIMIT_PERCENTAGE: float = 0.05  # 5%
    MARGIN_REQUIREMENT: float = 0.1  # 10%
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        """Validate environment configuration."""
        if v not in ["development", "staging", "production"]:
            raise ValueError("Environment must be development, staging, or production")
        return v
    
    @validator("SECRET_KEY", "JWT_SECRET_KEY")
    def validate_secret_keys(cls, v):
        """Ensure secret keys meet security requirements."""
        if len(v) < 32:
            raise ValueError("Secret keys must be at least 32 characters")
        return v
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from environment variable."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_allowed_hosts(cls, v):
        """Parse allowed hosts from environment variable."""
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings instance.
    
    Uses LRU cache to ensure settings are loaded once and reused
    throughout the application lifecycle for optimal performance.
    """
    return Settings()


# Environment-specific configuration profiles
DEVELOPMENT_OVERRIDES = {
    "DEBUG": True,
    "LOG_LEVEL": "DEBUG",
    "CORS_ORIGINS": ["http://localhost:3000", "http://127.0.0.1:3000"],
}

PRODUCTION_OVERRIDES = {
    "DEBUG": False,
    "LOG_LEVEL": "WARNING",
    "ANALYTICS_ENABLED": True,
}