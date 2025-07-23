# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.core.security import get_current_user
from app.models.iot import Device, DeviceCreate, DeviceUpdate, SensorData
from app.services.iot_service import IoTService

router = APIRouter()
iot_service = IoTService()


@router.get("/devices", response_model=List[Device])
async def get_user_devices(
    current_user: dict = Depends(get_current_user),
    device_type: Optional[str] = Query(None, description="Filter by device type"),
    status: Optional[str] = Query(None, description="Filter by device status")
):
    """Get user's registered IoT devices."""
    devices = await iot_service.get_user_devices(
        user_id=current_user["id"],
        device_type=device_type,
        status=status
    )
    return [Device(**device) for device in devices]


@router.post("/devices", response_model=Device)
async def register_device(
    device_data: DeviceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Register a new IoT device."""
    # Check if device ID already exists
    existing_device = await iot_service.get_device_by_id(device_data.device_id)
    if existing_device:
        raise HTTPException(
            status_code=400,
            detail="Device with this ID already exists"
        )
    
    device = await iot_service.register_device(
        user_id=current_user["id"],
        device_data=device_data
    )
    return Device(**device)


@router.get("/devices/{device_id}", response_model=Device)
async def get_device_details(
    device_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific device details."""
    device = await iot_service.get_device_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check if user owns this device
    if device["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Device(**device)


@router.put("/devices/{device_id}", response_model=Device)
async def update_device(
    device_id: str,
    device_update: DeviceUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update device configuration."""
    device = await iot_service.get_device_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check if user owns this device
    if device["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    updated_device = await iot_service.update_device(device_id, device_update)
    return Device(**updated_device)


@router.delete("/devices/{device_id}")
async def delete_device(
    device_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete/unregister a device."""
    device = await iot_service.get_device_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check if user owns this device
    if device["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await iot_service.delete_device(device_id)
    return {"message": "Device deleted successfully"}


@router.get("/devices/{device_id}/data")
async def get_device_sensor_data(
    device_id: str,
    current_user: dict = Depends(get_current_user),
    start_time: Optional[str] = Query(None, description="Start time (ISO format)"),
    end_time: Optional[str] = Query(None, description="End time (ISO format)"),
    sensor_type: Optional[str] = Query(None, description="Filter by sensor type"),
    limit: int = Query(100, le=1000, description="Number of records to return")
):
    """Get sensor data from a specific device."""
    device = await iot_service.get_device_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check if user owns this device
    if device["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    data = await iot_service.get_sensor_data(
        device_id=device_id,
        start_time=start_time,
        end_time=end_time,
        sensor_type=sensor_type,
        limit=limit
    )
    
    return {
        "device_id": device_id,
        "data_points": data,
        "count": len(data)
    }


@router.post("/devices/{device_id}/data")
async def ingest_sensor_data(
    device_id: str,
    sensor_data: List[SensorData],
    current_user: dict = Depends(get_current_user)
):
    """Ingest sensor data from a device (typically called by the device itself)."""
    device = await iot_service.get_device_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # In a real implementation, you might use API keys instead of user tokens for devices
    # Check if user owns this device
    if device["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await iot_service.ingest_sensor_data(device_id, sensor_data)
    return {"message": f"Ingested {len(sensor_data)} data points successfully"}


@router.get("/devices/{device_id}/alerts")
async def get_device_alerts(
    device_id: str,
    current_user: dict = Depends(get_current_user),
    active_only: bool = Query(True, description="Show only active alerts")
):
    """Get alerts for a specific device."""
    device = await iot_service.get_device_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check if user owns this device
    if device["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    alerts = await iot_service.get_device_alerts(device_id, active_only)
    return {"alerts": alerts}


@router.post("/devices/{device_id}/commands")
async def send_device_command(
    device_id: str,
    command: dict,
    current_user: dict = Depends(get_current_user)
):
    """Send a command to a device."""
    device = await iot_service.get_device_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check if user owns this device
    if device["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await iot_service.send_device_command(device_id, command)
    return {"message": "Command sent successfully", "result": result}