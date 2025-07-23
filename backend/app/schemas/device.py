"""
QuantEnerGx Device Schemas

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class DeviceBase(BaseModel):
    """Base device schema"""
    device_id: str
    device_type: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    location: Optional[str] = None
    capacity_kw: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = {}


class DeviceCreate(DeviceBase):
    """Device creation schema"""
    pass


class DeviceResponse(DeviceBase):
    """Device response schema"""
    id: int
    is_active: bool
    last_seen: Optional[datetime] = None
    registered_at: datetime
    owner_id: int
    api_key: Optional[str] = None  # Only included during registration
    
    class Config:
        from_attributes = True


class DeviceTelemetryBase(BaseModel):
    """Base telemetry schema"""
    metric_name: str
    metric_value: float
    unit: Optional[str] = None
    quality_code: Optional[str] = "GOOD"
    metadata: Optional[Dict[str, Any]] = {}
    timestamp: Optional[datetime] = None


class DeviceTelemetryCreate(DeviceTelemetryBase):
    """Telemetry creation schema"""
    pass


class DeviceTelemetryResponse(DeviceTelemetryBase):
    """Telemetry response schema"""
    id: int
    device_id: int
    timestamp: datetime
    ingested_at: datetime
    
    class Config:
        from_attributes = True


class TelemetryStreamResponse(BaseModel):
    """Telemetry stream response schema"""
    id: int
    device_id: int
    stream_name: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True