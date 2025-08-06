"""Configuration settings for QuantEnergx Backend."""
import os
from typing import Optional
from pydantic import Field, field_validator, ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings using pydantic BaseSettings."""
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    # Environment
    environment: str = Field(default="development", alias="NODE_ENV")
    debug: bool = False
    
    # Server configuration
    port: int = Field(default=3001, alias="PORT")
    grpc_port: int = Field(default=50051, alias="GRPC_PORT")
    
    # Frontend configuration
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")
    
    # Database configuration
    database_url: str = Field(alias="DATABASE_URL")
    db_host: str = Field(default="localhost", alias="DB_HOST")
    db_port: int = Field(default=5432, alias="DB_PORT")
    db_name: str = Field(default="quantenergx", alias="DB_NAME")
    db_user: str = Field(alias="DB_USER")
    db_password: str = Field(alias="DB_PASSWORD")
    db_min_connections: int = 5
    db_max_connections: int = 20
    
    # Redis configuration
    redis_host: str = Field(default="localhost", alias="REDIS_HOST")
    redis_port: int = Field(default=6379, alias="REDIS_PORT")
    redis_password: Optional[str] = Field(default=None, alias="REDIS_PASSWORD")
    redis_db: int = 0
    redis_max_connections: int = 20
    
    # Security configuration
    jwt_secret: str = Field(alias="JWT_SECRET")
    jwt_expires_in: str = Field(default="24h", alias="JWT_EXPIRES_IN")
    jwt_refresh_secret: str = Field(alias="JWT_REFRESH_SECRET")
    jwt_refresh_expires_in: str = Field(default="7d", alias="JWT_REFRESH_EXPIRES_IN")
    api_encryption_key: str = Field(alias="API_ENCRYPTION_KEY")
    
    # Rate limiting
    rate_limit_per_minute: int = 60
    auth_rate_limit_per_minute: int = 5
    
    # File upload
    max_file_size: int = 52428800  # 50MB
    upload_path: str = "uploads/"
    
    # External APIs
    bloomberg_api_url: Optional[str] = None
    bloomberg_api_key: Optional[str] = None
    refinitiv_api_url: Optional[str] = None
    refinitiv_api_key: Optional[str] = None
    ice_api_url: Optional[str] = None
    ice_api_key: Optional[str] = None
    nymex_api_url: Optional[str] = None
    nymex_api_key: Optional[str] = None
    
    # Caching
    energy_price_cache_ttl: int = 300  # 5 minutes
    market_data_cache_ttl: int = 60    # 1 minute
    
    @field_validator('database_url', mode='before')
    @classmethod
    def assemble_db_connection(cls, v, info):
        """Assemble database URL from components if not provided."""
        if isinstance(v, str) and v:
            return v
        
        # Fallback to constructing from individual components
        values = info.data if info else {}
        host = values.get('db_host', 'localhost')
        port = values.get('db_port', 5432)
        name = values.get('db_name', 'quantenergx')
        user = values.get('db_user', '')
        password = values.get('db_password', '')
        
        return f"postgresql://{user}:{password}@{host}:{port}/{name}"
    
    @field_validator('debug', mode='before')
    @classmethod
    def set_debug_mode(cls, v, info):
        """Set debug mode based on environment."""
        values = info.data if info else {}
        environment = values.get('environment', 'development')
        return environment.lower() in ('development', 'dev', 'local')


# Global settings instance
settings = Settings()