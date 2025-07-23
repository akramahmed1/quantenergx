"""
QuantEnerGx Device Models

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..core.database import Base


class Device(Base):
    """Energy device registration"""
    
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, nullable=False, index=True)
    device_type = Column(String, nullable=False)  # solar, wind, battery, meter
    manufacturer = Column(String, nullable=True)
    model = Column(String, nullable=True)
    location = Column(String, nullable=True)
    capacity_kw = Column(Float, nullable=True)
    
    # Security
    api_key_hash = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime, nullable=True)
    registered_at = Column(DateTime, default=func.now())
    
    # Metadata
    metadata = Column(JSON, default=dict)


class DeviceTelemetry(Base):
    """Device telemetry data"""
    
    __tablename__ = "device_telemetry"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    metric_name = Column(String, nullable=False, index=True)
    metric_value = Column(Float, nullable=False)
    unit = Column(String, nullable=True)
    quality_code = Column(String, default="GOOD")
    metadata = Column(JSON, default=dict)
    ingested_at = Column(DateTime, default=func.now())


class TelemetryStream(Base):
    """Active telemetry streams"""
    
    __tablename__ = "telemetry_streams"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    stream_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())