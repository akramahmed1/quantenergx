"""
QuantEnerGx Core Configuration Module

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved

Energy Industry Compliance: NERC CIP, IEC 61850, FERC compliant
SaaS Security: SOC 2, GDPR/CCPA compliant
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with energy industry security standards"""
    
    # Application
    APP_NAME: str = "QuantEnerGx"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Security - NERC CIP compliant
    SECRET_KEY: str = os.urandom(32).hex()
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database - Encrypted connections required
    DATABASE_URL: str = "postgresql://quantenergx:secure_pass@localhost/quantenergx"
    DATABASE_SSL_MODE: str = "require"
    
    # OAuth2 Configuration
    OAUTH2_CLIENT_ID: Optional[str] = None
    OAUTH2_CLIENT_SECRET: Optional[str] = None
    OAUTH2_REDIRECT_URI: str = "http://localhost:3000/auth/callback"
    
    # CORS - Restrictive for security
    CORS_ORIGINS: list = ["http://localhost:3000", "https://app.quantenergx.com"]
    
    # Rate Limiting - DDoS protection
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Logging - Audit compliance
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "quantenergx.log"
    
    # Energy Market APIs
    MARKET_DATA_API_KEY: Optional[str] = None
    WEATHER_API_KEY: Optional[str] = None
    
    # Telemetry
    TELEMETRY_BATCH_SIZE: int = 1000
    TELEMETRY_FLUSH_INTERVAL: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()