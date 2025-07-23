# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class DeviceStatus(str, Enum):
    """Device status enumeration."""
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    ERROR = "error"


class DeviceType(str, Enum):
    """Device type enumeration."""
    ENERGY_METER = "energy_meter"
    SOLAR_PANEL = "solar_panel"
    WIND_TURBINE = "wind_turbine"
    BATTERY = "battery"
    INVERTER = "inverter"
    SENSOR = "sensor"
    CONTROLLER = "controller"


class DeviceBase(BaseModel):
    """Base device model."""
    name: str = Field(..., min_length=1, max_length=100)
    device_type: DeviceType
    location: Optional[str] = None
    description: Optional[str] = None


class DeviceCreate(DeviceBase):
    """Device creation model."""
    device_id: str = Field(..., description="Unique device identifier")
    configuration: Optional[Dict[str, Any]] = None


class DeviceUpdate(BaseModel):
    """Device update model."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = None
    description: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    status: Optional[DeviceStatus] = None


class Device(DeviceBase):
    """Complete device model."""
    id: str
    device_id: str
    user_id: str
    status: DeviceStatus = DeviceStatus.OFFLINE
    configuration: Dict[str, Any] = {}
    firmware_version: Optional[str] = None
    last_seen: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SensorDataType(str, Enum):
    """Sensor data type enumeration."""
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    PRESSURE = "pressure"
    VOLTAGE = "voltage"
    CURRENT = "current"
    POWER = "power"
    ENERGY = "energy"
    FREQUENCY = "frequency"
    CUSTOM = "custom"


class SensorData(BaseModel):
    """Sensor data model."""
    sensor_type: SensorDataType
    value: float
    unit: str
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class SensorDataResponse(SensorData):
    """Sensor data response model."""
    id: str
    device_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class DeviceAlert(BaseModel):
    """Device alert model."""
    id: str
    device_id: str
    alert_type: str  # warning, error, critical
    message: str
    severity: int = Field(..., ge=1, le=5)
    is_active: bool = True
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class DeviceCommand(BaseModel):
    """Device command model."""
    command: str
    parameters: Optional[Dict[str, Any]] = None
    timeout: int = Field(default=30, ge=1, le=300)


class DeviceCommandResponse(BaseModel):
    """Device command response model."""
    command_id: str
    status: str  # pending, executed, failed, timeout
    response: Optional[Dict[str, Any]] = None
    executed_at: Optional[datetime] = None
    error_message: Optional[str] = None