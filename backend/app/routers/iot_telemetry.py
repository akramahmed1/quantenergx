#!/usr/bin/env python3
"""
QuantEnergX MVP - IoT Telemetry & Device Management Router
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform

This module implements comprehensive IoT device management, telemetry data
processing, edge computing integration, and real-time monitoring capabilities
for energy infrastructure and smart grid operations.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from pydantic import BaseModel, Field, validator
from decimal import Decimal
import asyncio
import json
import logging
import uuid

from app.core.security import (
    get_current_user,
    require_permission,
    audit_logger
)
from app.core.config import get_settings

logger = logging.getLogger("quantenergx.iot")
settings = get_settings()

router = APIRouter()


# IoT Device Models
class DeviceType:
    """IoT device type definitions for energy infrastructure."""
    SMART_METER = "smart_meter"
    SOLAR_PANEL = "solar_panel"
    WIND_TURBINE = "wind_turbine"
    BATTERY_STORAGE = "battery_storage"
    TRANSFORMER = "transformer"
    GRID_SENSOR = "grid_sensor"
    WEATHER_STATION = "weather_station"
    LOAD_CONTROLLER = "load_controller"


class DeviceRegistration(BaseModel):
    """IoT device registration model."""
    device_name: str = Field(..., min_length=3, max_length=100)
    device_type: str = Field(..., regex="^(smart_meter|solar_panel|wind_turbine|battery_storage|transformer|grid_sensor|weather_station|load_controller)$")
    manufacturer: str = Field(..., max_length=50)
    model: str = Field(..., max_length=50)
    firmware_version: str = Field(..., max_length=20)
    location: Dict[str, Union[str, float]] = Field(...)
    capacity_mw: Optional[Decimal] = Field(None, ge=0)
    installation_date: datetime
    
    @validator("location")
    def validate_location(cls, v):
        """Validate location contains required fields."""
        required_fields = ["latitude", "longitude", "address"]
        if not all(field in v for field in required_fields):
            raise ValueError("Location must contain latitude, longitude, and address")
        return v


class TelemetryData(BaseModel):
    """IoT telemetry data model."""
    device_id: str
    timestamp: datetime
    measurements: Dict[str, Union[float, int, str, bool]]
    data_quality: float = Field(default=1.0, ge=0.0, le=1.0)
    alert_level: str = Field(default="normal", regex="^(normal|warning|critical)$")


class DeviceCommand(BaseModel):
    """Device command model for remote control."""
    command_type: str = Field(..., regex="^(start|stop|reset|configure|update)$")
    parameters: Dict[str, Any] = Field(default_factory=dict)
    execution_time: Optional[datetime] = None
    priority: str = Field(default="normal", regex="^(low|normal|high|urgent)$")


class DeviceAlert(BaseModel):
    """Device alert model."""
    alert_type: str = Field(..., regex="^(maintenance|performance|security|connectivity)$")
    severity: str = Field(..., regex="^(info|warning|error|critical)$")
    message: str
    recommended_action: Optional[str] = None


# Device Registry & Management
class DeviceRegistry:
    """Central device registry for IoT device management."""
    
    def __init__(self):
        self.devices: Dict[str, Dict[str, Any]] = {}
        self.device_telemetry: Dict[str, List[Dict[str, Any]]] = {}
        self.device_alerts: Dict[str, List[DeviceAlert]] = {}
    
    def register_device(self, device_data: DeviceRegistration, user_id: str) -> str:
        """
        Register new IoT device in the system.
        
        Args:
            device_data: Device registration information
            user_id: User registering the device
            
        Returns:
            Generated device ID
        """
        device_id = f"DEV_{uuid.uuid4().hex[:12].upper()}"
        
        device_record = {
            "device_id": device_id,
            "device_name": device_data.device_name,
            "device_type": device_data.device_type,
            "manufacturer": device_data.manufacturer,
            "model": device_data.model,
            "firmware_version": device_data.firmware_version,
            "location": device_data.location,
            "capacity_mw": float(device_data.capacity_mw) if device_data.capacity_mw else None,
            "installation_date": device_data.installation_date,
            "registered_by": user_id,
            "registration_time": datetime.utcnow(),
            "status": "registered",
            "last_seen": None,
            "health_score": 1.0
        }
        
        self.devices[device_id] = device_record
        self.device_telemetry[device_id] = []
        self.device_alerts[device_id] = []
        
        return device_id
    
    def ingest_telemetry(self, device_id: str, telemetry: TelemetryData) -> bool:
        """
        Ingest telemetry data from IoT device.
        
        Args:
            device_id: Device identifier
            telemetry: Telemetry data
            
        Returns:
            Success status
        """
        if device_id not in self.devices:
            return False
        
        # Update device last seen
        self.devices[device_id]["last_seen"] = telemetry.timestamp
        self.devices[device_id]["status"] = "active"
        
        # Store telemetry data
        telemetry_record = {
            "timestamp": telemetry.timestamp,
            "measurements": telemetry.measurements,
            "data_quality": telemetry.data_quality,
            "alert_level": telemetry.alert_level
        }
        
        self.device_telemetry[device_id].append(telemetry_record)
        
        # Keep only last 1000 records per device
        if len(self.device_telemetry[device_id]) > 1000:
            self.device_telemetry[device_id] = self.device_telemetry[device_id][-1000:]
        
        # Analyze for anomalies and alerts
        self._analyze_telemetry_anomalies(device_id, telemetry)
        
        return True
    
    def _analyze_telemetry_anomalies(self, device_id: str, telemetry: TelemetryData):
        """Analyze telemetry data for anomalies and generate alerts."""
        device = self.devices[device_id]
        measurements = telemetry.measurements
        
        # Generate alerts based on device type and measurements
        alerts = []
        
        if device["device_type"] == DeviceType.SMART_METER:
            if measurements.get("power_kw", 0) > 1000:  # High power consumption
                alerts.append(DeviceAlert(
                    alert_type="performance",
                    severity="warning",
                    message=f"High power consumption detected: {measurements.get('power_kw')}kW",
                    recommended_action="Check for load anomalies"
                ))
        
        elif device["device_type"] == DeviceType.SOLAR_PANEL:
            if measurements.get("efficiency_percent", 100) < 70:  # Low efficiency
                alerts.append(DeviceAlert(
                    alert_type="maintenance",
                    severity="warning",
                    message=f"Solar panel efficiency below threshold: {measurements.get('efficiency_percent')}%",
                    recommended_action="Schedule maintenance inspection"
                ))
        
        elif device["device_type"] == DeviceType.BATTERY_STORAGE:
            if measurements.get("state_of_charge_percent", 100) < 10:  # Low battery
                alerts.append(DeviceAlert(
                    alert_type="performance",
                    severity="critical",
                    message=f"Battery storage critically low: {measurements.get('state_of_charge_percent')}%",
                    recommended_action="Initiate charging cycle"
                ))
        
        # Add temperature alerts for all device types
        temperature = measurements.get("temperature_celsius")
        if temperature is not None:
            if temperature > 80:  # Overheating
                alerts.append(DeviceAlert(
                    alert_type="performance",
                    severity="error",
                    message=f"Device overheating: {temperature}°C",
                    recommended_action="Check cooling system and reduce load"
                ))
        
        # Store alerts
        for alert in alerts:
            self.device_alerts[device_id].append(alert)
            
            # Keep only last 100 alerts per device
            if len(self.device_alerts[device_id]) > 100:
                self.device_alerts[device_id] = self.device_alerts[device_id][-100:]


# Global device registry instance
device_registry = DeviceRegistry()


# Analytics Engine for IoT Data
class IoTAnalyticsEngine:
    """Advanced analytics engine for IoT telemetry data."""
    
    @staticmethod
    def calculate_device_performance(
        device_id: str,
        time_window_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Calculate device performance metrics.
        
        Args:
            device_id: Device identifier
            time_window_hours: Analysis time window
            
        Returns:
            Performance metrics and insights
        """
        if device_id not in device_registry.device_telemetry:
            return {"error": "Device not found"}
        
        telemetry_data = device_registry.device_telemetry[device_id]
        device_info = device_registry.devices[device_id]
        
        # Filter data within time window
        cutoff_time = datetime.utcnow() - timedelta(hours=time_window_hours)
        recent_data = [
            record for record in telemetry_data
            if record["timestamp"] >= cutoff_time
        ]
        
        if not recent_data:
            return {"error": "No recent data available"}
        
        # Calculate performance metrics
        data_points = len(recent_data)
        avg_data_quality = sum(record["data_quality"] for record in recent_data) / data_points
        
        # Device-specific performance calculations
        performance_metrics = {
            "data_points": data_points,
            "average_data_quality": round(avg_data_quality, 3),
            "uptime_percent": min(100.0, (data_points / (time_window_hours * 12)) * 100),  # Assuming 12 readings per hour
            "device_type": device_info["device_type"]
        }
        
        # Type-specific metrics
        if device_info["device_type"] == DeviceType.SOLAR_PANEL:
            efficiencies = [
                record["measurements"].get("efficiency_percent", 0)
                for record in recent_data
                if "efficiency_percent" in record["measurements"]
            ]
            if efficiencies:
                performance_metrics["average_efficiency"] = round(sum(efficiencies) / len(efficiencies), 2)
                performance_metrics["max_efficiency"] = max(efficiencies)
                performance_metrics["min_efficiency"] = min(efficiencies)
        
        elif device_info["device_type"] == DeviceType.WIND_TURBINE:
            power_outputs = [
                record["measurements"].get("power_kw", 0)
                for record in recent_data
                if "power_kw" in record["measurements"]
            ]
            if power_outputs:
                performance_metrics["average_power_kw"] = round(sum(power_outputs) / len(power_outputs), 2)
                performance_metrics["max_power_kw"] = max(power_outputs)
                performance_metrics["capacity_factor"] = round(
                    (sum(power_outputs) / len(power_outputs)) / float(device_info["capacity_mw"] or 1) / 1000 * 100, 2
                )
        
        elif device_info["device_type"] == DeviceType.BATTERY_STORAGE:
            soc_values = [
                record["measurements"].get("state_of_charge_percent", 0)
                for record in recent_data
                if "state_of_charge_percent" in record["measurements"]
            ]
            if soc_values:
                performance_metrics["average_soc"] = round(sum(soc_values) / len(soc_values), 2)
                performance_metrics["charge_cycles"] = len([
                    i for i in range(1, len(soc_values))
                    if soc_values[i] > soc_values[i-1] + 10  # Detect charge events
                ])
        
        return performance_metrics
    
    @staticmethod
    def predict_maintenance_needs(device_id: str) -> Dict[str, Any]:
        """
        Predict device maintenance needs using ML models.
        
        Args:
            device_id: Device identifier
            
        Returns:
            Maintenance predictions and recommendations
        """
        if device_id not in device_registry.devices:
            return {"error": "Device not found"}
        
        device = device_registry.devices[device_id]
        telemetry_data = device_registry.device_telemetry[device_id]
        
        # Simple predictive maintenance model (in production would use ML)
        installation_age_days = (datetime.utcnow() - device["installation_date"]).days
        recent_alerts = len([
            alert for alert in device_registry.device_alerts.get(device_id, [])
            if alert.alert_type == "maintenance"
        ])
        
        # Calculate maintenance score
        age_factor = min(installation_age_days / 365, 5) / 5  # Normalize to 0-1 over 5 years
        alert_factor = min(recent_alerts / 10, 1)  # Normalize alerts
        
        maintenance_score = (age_factor * 0.4 + alert_factor * 0.6)
        
        # Determine maintenance priority
        if maintenance_score > 0.8:
            priority = "urgent"
            recommendation = "Schedule immediate maintenance inspection"
        elif maintenance_score > 0.6:
            priority = "high"
            recommendation = "Schedule maintenance within 2 weeks"
        elif maintenance_score > 0.4:
            priority = "medium"
            recommendation = "Schedule maintenance within 6 weeks"
        else:
            priority = "low"
            recommendation = "Continue normal operation monitoring"
        
        return {
            "device_id": device_id,
            "maintenance_score": round(maintenance_score, 3),
            "priority": priority,
            "recommendation": recommendation,
            "installation_age_days": installation_age_days,
            "recent_alerts": recent_alerts,
            "predicted_failure_days": max(30, int((1 - maintenance_score) * 365))
        }


# IoT Endpoints
@router.post("/devices/register", dependencies=[Depends(require_permission("device:write"))])
async def register_device(
    device_data: DeviceRegistration,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Register new IoT device in the system.
    
    Args:
        device_data: Device registration information
        current_user: Current authenticated user
        
    Returns:
        Device registration confirmation with ID
    """
    try:
        device_id = device_registry.register_device(device_data, current_user["user_id"])
        
        # Audit logging
        audit_logger.log_user_action(
            current_user["user_id"],
            "device_registered",
            f"device:{device_id}",
            "success",
            {
                "device_name": device_data.device_name,
                "device_type": device_data.device_type,
                "location": device_data.location
            }
        )
        
        logger.info(f"Device registered: {device_id} by user {current_user['user_id']}")
        
        return {
            "device_id": device_id,
            "message": "Device registered successfully",
            "status": "registered",
            "registration_time": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Device registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Device registration failed"
        )


@router.get("/devices", dependencies=[Depends(require_permission("device:read"))])
async def get_devices(
    current_user: Dict[str, Any] = Depends(get_current_user),
    device_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(default=50, le=200)
) -> Dict[str, Any]:
    """
    Get list of registered IoT devices.
    
    Args:
        current_user: Current authenticated user
        device_type: Filter by device type
        status: Filter by device status
        limit: Maximum number of devices to return
        
    Returns:
        List of devices with basic information
    """
    try:
        devices = list(device_registry.devices.values())
        
        # Apply filters
        if device_type:
            devices = [d for d in devices if d["device_type"] == device_type]
        
        if status:
            devices = [d for d in devices if d["status"] == status]
        
        # Limit results
        devices = devices[:limit]
        
        # Add summary statistics
        summary = {
            "total_devices": len(device_registry.devices),
            "active_devices": len([d for d in device_registry.devices.values() if d["status"] == "active"]),
            "device_types": {}
        }
        
        for device in device_registry.devices.values():
            device_type_key = device["device_type"]
            summary["device_types"][device_type_key] = summary["device_types"].get(device_type_key, 0) + 1
        
        # Audit logging
        audit_logger.log_data_access(
            current_user["user_id"],
            "device_list",
            "read",
            len(devices),
            {"filters": {"device_type": device_type, "status": status}}
        )
        
        return {
            "devices": devices,
            "summary": summary,
            "filters_applied": {
                "device_type": device_type,
                "status": status,
                "limit": limit
            }
        }
        
    except Exception as e:
        logger.error(f"Device list error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Device list retrieval failed"
        )


@router.post("/telemetry/ingest", dependencies=[Depends(require_permission("iot:write"))])
async def ingest_telemetry(
    telemetry_batch: List[TelemetryData],
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Ingest telemetry data from IoT devices.
    
    Args:
        telemetry_batch: Batch of telemetry data
        background_tasks: FastAPI background tasks
        current_user: Current authenticated user
        
    Returns:
        Ingestion confirmation and processing status
    """
    try:
        ingestion_results = []
        
        for telemetry in telemetry_batch:
            success = device_registry.ingest_telemetry(telemetry.device_id, telemetry)
            
            ingestion_results.append({
                "device_id": telemetry.device_id,
                "timestamp": telemetry.timestamp.isoformat(),
                "status": "success" if success else "failed",
                "data_quality": telemetry.data_quality
            })
        
        # Background processing for analytics
        background_tasks.add_task(
            process_telemetry_analytics,
            [t.device_id for t in telemetry_batch]
        )
        
        successful_ingestions = len([r for r in ingestion_results if r["status"] == "success"])
        
        # Audit logging
        audit_logger.log_data_access(
            current_user["user_id"],
            "telemetry_data",
            "write",
            successful_ingestions,
            {"batch_size": len(telemetry_batch)}
        )
        
        logger.info(f"Telemetry batch processed: {successful_ingestions}/{len(telemetry_batch)} successful")
        
        return {
            "batch_size": len(telemetry_batch),
            "successful_ingestions": successful_ingestions,
            "failed_ingestions": len(telemetry_batch) - successful_ingestions,
            "ingestion_results": ingestion_results,
            "processing_time": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Telemetry ingestion error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Telemetry ingestion failed"
        )


@router.get("/devices/{device_id}/analytics", dependencies=[Depends(require_permission("iot:read"))])
async def get_device_analytics(
    device_id: str,
    time_window_hours: int = Query(default=24, ge=1, le=168),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get analytics for specific IoT device.
    
    Args:
        device_id: Device identifier
        time_window_hours: Analysis time window in hours
        current_user: Current authenticated user
        
    Returns:
        Device analytics and performance metrics
    """
    try:
        # Get performance metrics
        performance_metrics = IoTAnalyticsEngine.calculate_device_performance(
            device_id, time_window_hours
        )
        
        # Get maintenance predictions
        maintenance_prediction = IoTAnalyticsEngine.predict_maintenance_needs(device_id)
        
        # Get recent alerts
        recent_alerts = device_registry.device_alerts.get(device_id, [])[-10:]  # Last 10 alerts
        
        # Device information
        device_info = device_registry.devices.get(device_id, {})
        
        analytics_data = {
            "device_info": device_info,
            "performance_metrics": performance_metrics,
            "maintenance_prediction": maintenance_prediction,
            "recent_alerts": [alert.dict() for alert in recent_alerts],
            "analysis_window_hours": time_window_hours,
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
        
        # Audit logging
        audit_logger.log_data_access(
            current_user["user_id"],
            "device_analytics",
            "read",
            1,
            {"device_id": device_id, "time_window": time_window_hours}
        )
        
        return analytics_data
        
    except Exception as e:
        logger.error(f"Device analytics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Device analytics retrieval failed"
        )


@router.post("/devices/{device_id}/command", dependencies=[Depends(require_permission("device:control"))])
async def send_device_command(
    device_id: str,
    command: DeviceCommand,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Send command to IoT device.
    
    Args:
        device_id: Device identifier
        command: Command to send
        current_user: Current authenticated user
        
    Returns:
        Command execution confirmation
    """
    try:
        if device_id not in device_registry.devices:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        # Generate command ID
        command_id = f"CMD_{uuid.uuid4().hex[:8].upper()}"
        
        # In production, this would send actual commands to devices
        # For MVP, we simulate command processing
        command_record = {
            "command_id": command_id,
            "device_id": device_id,
            "command_type": command.command_type,
            "parameters": command.parameters,
            "sent_by": current_user["user_id"],
            "sent_time": datetime.utcnow(),
            "execution_time": command.execution_time or datetime.utcnow(),
            "priority": command.priority,
            "status": "sent"
        }
        
        # Audit logging
        audit_logger.log_user_action(
            current_user["user_id"],
            "device_command_sent",
            f"device:{device_id}",
            "success",
            {
                "command_id": command_id,
                "command_type": command.command_type,
                "priority": command.priority
            }
        )
        
        logger.info(f"Command sent to device {device_id}: {command.command_type}")
        
        return {
            "command_id": command_id,
            "device_id": device_id,
            "status": "sent",
            "message": f"Command {command.command_type} sent successfully",
            "execution_time": command_record["execution_time"].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Device command error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Device command failed"
        )


async def process_telemetry_analytics(device_ids: List[str]):
    """
    Background task to process telemetry analytics.
    
    Args:
        device_ids: List of device IDs to process
    """
    try:
        for device_id in device_ids:
            # Perform advanced analytics
            performance_metrics = IoTAnalyticsEngine.calculate_device_performance(device_id)
            maintenance_prediction = IoTAnalyticsEngine.predict_maintenance_needs(device_id)
            
            # Log analytics completion
            logger.info(f"Analytics processed for device {device_id}")
            
        logger.info(f"Batch analytics completed for {len(device_ids)} devices")
        
    except Exception as e:
        logger.error(f"Background analytics processing error: {str(e)}")