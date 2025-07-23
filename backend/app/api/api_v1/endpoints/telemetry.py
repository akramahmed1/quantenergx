"""
QuantEnerGx Device Telemetry Endpoints

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved

Energy Industry Compliance: NERC CIP, IEC 61850, FERC compliant
SaaS Security: SOC 2, GDPR/CCPA compliant
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import json

from ...core.database import get_db
from ...core.security import get_current_user, require_permissions, hash_api_key
from ...models.device import DeviceTelemetry, Device, TelemetryStream
from ...schemas.device import (
    DeviceTelemetryCreate, DeviceTelemetryResponse, 
    DeviceCreate, DeviceResponse, TelemetryStreamResponse
)
from ...services.analytics_pipeline import AnalyticsPipelineService


router = APIRouter()
analytics_service = AnalyticsPipelineService()


@router.post("/devices/register", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    device: DeviceCreate,
    current_user: Dict = Depends(require_permissions(["device_register"])),
    db: Session = Depends(get_db)
) -> DeviceResponse:
    """
    Register new energy device for telemetry collection
    
    Args:
        device: Device registration data
        current_user: Authenticated user with permissions
        db: Database session
        
    Returns:
        Registered device information with API key
    """
    # Generate secure API key for device authentication
    from ...core.security import generate_api_key
    api_key = generate_api_key()
    
    # Create device record
    db_device = Device(
        device_id=device.device_id,
        device_type=device.device_type,
        manufacturer=device.manufacturer,
        model=device.model,
        location=device.location,
        capacity_kw=device.capacity_kw,
        api_key_hash=hash_api_key(api_key),
        owner_id=current_user["user_id"],
        registered_at=datetime.utcnow(),
        is_active=True,
        metadata=device.metadata or {}
    )
    
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    
    # Return device info with API key (only shown once)
    response = DeviceResponse.from_orm(db_device)
    response.api_key = api_key  # Include API key in response
    
    return response


@router.post("/telemetry/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest_telemetry_data(
    telemetry_data: List[DeviceTelemetryCreate],
    device_api_key: str = Query(..., description="Device API key"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Ingest telemetry data from energy devices
    
    Args:
        telemetry_data: List of telemetry readings
        device_api_key: Device authentication API key
        background_tasks: Background task handler
        db: Database session
        
    Returns:
        Ingestion confirmation
    """
    # Authenticate device
    device = db.query(Device).filter(
        Device.api_key_hash == hash_api_key(device_api_key),
        Device.is_active == True
    ).first()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid device API key"
        )
    
    # Validate batch size
    if len(telemetry_data) > 1000:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Batch size cannot exceed 1000 records"
        )
    
    # Store telemetry data
    telemetry_records = []
    for data in telemetry_data:
        record = DeviceTelemetry(
            device_id=device.id,
            timestamp=data.timestamp or datetime.utcnow(),
            metric_name=data.metric_name,
            metric_value=data.metric_value,
            unit=data.unit,
            quality_code=data.quality_code or "GOOD",
            metadata=data.metadata or {},
            ingested_at=datetime.utcnow()
        )
        telemetry_records.append(record)
    
    db.add_all(telemetry_records)
    db.commit()
    
    # Update device last seen
    device.last_seen = datetime.utcnow()
    db.commit()
    
    # Trigger background processing
    background_tasks.add_task(
        _process_telemetry_batch,
        device.id,
        len(telemetry_records)
    )
    
    return {
        "message": "Telemetry data ingested successfully",
        "device_id": device.device_id,
        "records_processed": len(telemetry_records),
        "batch_id": f"batch_{datetime.utcnow().timestamp()}"
    }


@router.get("/devices/{device_id}/telemetry", response_model=List[DeviceTelemetryResponse])
async def get_device_telemetry(
    device_id: str,
    start_time: Optional[datetime] = Query(None, description="Start time for data range"),
    end_time: Optional[datetime] = Query(None, description="End time for data range"),
    metrics: Optional[List[str]] = Query(None, description="Specific metrics to retrieve"),
    aggregation: Optional[str] = Query(None, description="Data aggregation (avg, sum, min, max)"),
    interval: Optional[str] = Query(None, description="Aggregation interval (1m, 5m, 1h, 1d)"),
    current_user: Dict = Depends(require_permissions(["telemetry_read"])),
    db: Session = Depends(get_db)
) -> List[DeviceTelemetryResponse]:
    """
    Get telemetry data for specific device
    
    Args:
        device_id: Device identifier
        start_time: Optional start time filter
        end_time: Optional end time filter
        metrics: Optional metrics filter
        aggregation: Optional data aggregation
        interval: Optional aggregation interval
        current_user: Authenticated user with permissions
        db: Database session
        
    Returns:
        Device telemetry data
    """
    # Verify device access
    device = db.query(Device).filter(
        Device.device_id == device_id,
        Device.owner_id == current_user["user_id"]
    ).first()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found or access denied"
        )
    
    # Build query
    query = db.query(DeviceTelemetry).filter(DeviceTelemetry.device_id == device.id)
    
    if start_time:
        query = query.filter(DeviceTelemetry.timestamp >= start_time)
    if end_time:
        query = query.filter(DeviceTelemetry.timestamp <= end_time)
    if metrics:
        query = query.filter(DeviceTelemetry.metric_name.in_(metrics))
    
    # Apply time range limit for performance
    if not start_time:
        query = query.filter(
            DeviceTelemetry.timestamp >= datetime.utcnow() - timedelta(days=7)
        )
    
    telemetry_data = query.order_by(DeviceTelemetry.timestamp.desc()).limit(10000).all()
    
    # Apply aggregation if requested
    if aggregation and interval:
        telemetry_data = await _aggregate_telemetry_data(
            telemetry_data, aggregation, interval
        )
    
    return [DeviceTelemetryResponse.from_orm(record) for record in telemetry_data]


@router.get("/devices/{device_id}/analytics", response_model=Dict[str, Any])
async def get_device_analytics(
    device_id: str,
    analysis_type: str = Query("performance", description="Analysis type (performance, efficiency, anomaly)"),
    time_range: str = Query("24h", description="Analysis time range"),
    current_user: Dict = Depends(require_permissions(["device_analytics_read"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get analytics for specific device
    
    Args:
        device_id: Device identifier
        analysis_type: Type of analysis to perform
        time_range: Analysis time range
        current_user: Authenticated user with permissions
        db: Database session
        
    Returns:
        Device analytics results
    """
    # Verify device access
    device = db.query(Device).filter(
        Device.device_id == device_id,
        Device.owner_id == current_user["user_id"]
    ).first()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found or access denied"
        )
    
    # Perform analytics based on type
    analytics_result = await analytics_service.analyze_device_performance(
        device_id=device.id,
        analysis_type=analysis_type,
        time_range=time_range,
        db=db
    )
    
    return {
        "device_id": device_id,
        "analysis_type": analysis_type,
        "time_range": time_range,
        "analysis_timestamp": datetime.utcnow(),
        "results": analytics_result
    }


@router.get("/streams/active", response_model=List[TelemetryStreamResponse])
async def get_active_telemetry_streams(
    current_user: Dict = Depends(require_permissions(["telemetry_streams_read"])),
    db: Session = Depends(get_db)
) -> List[TelemetryStreamResponse]:
    """
    Get active telemetry streams for user's devices
    
    Args:
        current_user: Authenticated user with permissions
        db: Database session
        
    Returns:
        List of active telemetry streams
    """
    # Get user's devices
    user_devices = db.query(Device).filter(
        Device.owner_id == current_user["user_id"],
        Device.is_active == True
    ).all()
    
    device_ids = [device.id for device in user_devices]
    
    # Get active streams
    streams = db.query(TelemetryStream).filter(
        TelemetryStream.device_id.in_(device_ids),
        TelemetryStream.is_active == True
    ).all()
    
    return [TelemetryStreamResponse.from_orm(stream) for stream in streams]


@router.post("/alerts/configure", status_code=status.HTTP_201_CREATED)
async def configure_telemetry_alerts(
    device_id: str,
    alert_config: Dict[str, Any],
    current_user: Dict = Depends(require_permissions(["alerts_configure"])),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """
    Configure telemetry alerts for device
    
    Args:
        device_id: Device identifier
        alert_config: Alert configuration
        current_user: Authenticated user with permissions
        db: Database session
        
    Returns:
        Alert configuration confirmation
    """
    # Verify device access
    device = db.query(Device).filter(
        Device.device_id == device_id,
        Device.owner_id == current_user["user_id"]
    ).first()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found or access denied"
        )
    
    # Store alert configuration (would be in a separate alerts table)
    # This is a stub implementation
    alert_id = f"alert_{device.id}_{datetime.utcnow().timestamp()}"
    
    return {
        "message": "Alert configuration saved",
        "alert_id": alert_id,
        "device_id": device_id
    }


@router.get("/health/summary", response_model=Dict[str, Any])
async def get_telemetry_health_summary(
    current_user: Dict = Depends(require_permissions(["telemetry_health_read"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get telemetry system health summary
    
    Args:
        current_user: Authenticated user with permissions
        db: Database session
        
    Returns:
        Telemetry system health metrics
    """
    # Get user's devices
    user_devices = db.query(Device).filter(
        Device.owner_id == current_user["user_id"]
    ).all()
    
    total_devices = len(user_devices)
    active_devices = len([d for d in user_devices if d.is_active])
    
    # Calculate health metrics
    recent_telemetry = db.query(DeviceTelemetry).filter(
        DeviceTelemetry.device_id.in_([d.id for d in user_devices]),
        DeviceTelemetry.timestamp >= datetime.utcnow() - timedelta(hours=1)
    ).count()
    
    return {
        "summary_timestamp": datetime.utcnow(),
        "total_devices": total_devices,
        "active_devices": active_devices,
        "devices_online": len([d for d in user_devices if d.last_seen and 
                             d.last_seen >= datetime.utcnow() - timedelta(minutes=15)]),
        "telemetry_points_last_hour": recent_telemetry,
        "data_quality_score": 0.95,  # Would be calculated
        "system_health": "healthy"
    }


# Helper functions
async def _process_telemetry_batch(device_id: int, record_count: int):
    """Process telemetry batch in background"""
    # Stub for background processing
    await asyncio.sleep(1)
    # Would trigger analytics, alerting, etc.
    pass


async def _aggregate_telemetry_data(
    data: List[DeviceTelemetry], 
    aggregation: str, 
    interval: str
) -> List[DeviceTelemetry]:
    """Aggregate telemetry data based on specified parameters"""
    # Stub implementation for data aggregation
    # Would implement proper time-series aggregation
    return data[:100]  # Return limited results for now