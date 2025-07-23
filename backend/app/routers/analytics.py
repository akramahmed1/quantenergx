# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

from fastapi import APIRouter, Depends, Query
from typing import Dict, List, Optional
from app.core.security import get_current_user
from app.services.analytics_service import AnalyticsService

router = APIRouter()
analytics_service = AnalyticsService()


@router.get("/dashboard")
async def get_dashboard_data(
    current_user: dict = Depends(get_current_user),
    time_range: str = Query("7d", description="Time range (1d, 7d, 30d, 90d)")
):
    """Get comprehensive dashboard data for the user."""
    dashboard_data = await analytics_service.get_dashboard_data(
        user_id=current_user["id"],
        time_range=time_range
    )
    return dashboard_data


@router.post("/reports")
async def generate_custom_report(
    report_config: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generate a custom analytics report based on user configuration."""
    report = await analytics_service.generate_report(
        user_id=current_user["id"],
        config=report_config
    )
    return {
        "report_id": report["id"],
        "status": "generated",
        "download_url": f"/analytics/reports/{report['id']}/download"
    }


@router.get("/reports/{report_id}")
async def get_report_status(
    report_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the status and details of a generated report."""
    report = await analytics_service.get_report_by_id(report_id, current_user["id"])
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report


@router.get("/reports/{report_id}/download")
async def download_report(
    report_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download a generated report."""
    report_data = await analytics_service.download_report(report_id, current_user["id"])
    if not report_data:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report_data


@router.get("/metrics")
async def get_performance_metrics(
    current_user: dict = Depends(get_current_user),
    metric_types: Optional[str] = Query(None, description="Comma-separated metric types"),
    period: str = Query("30d", description="Time period for metrics")
):
    """Get performance metrics for the user's activities."""
    metric_list = metric_types.split(",") if metric_types else None
    metrics = await analytics_service.get_performance_metrics(
        user_id=current_user["id"],
        metric_types=metric_list,
        period=period
    )
    return {"metrics": metrics, "period": period}


@router.get("/widgets")
async def get_widget_configurations(
    current_user: dict = Depends(get_current_user)
):
    """Get user's dashboard widget configurations."""
    widgets = await analytics_service.get_user_widgets(current_user["id"])
    return {"widgets": widgets}


@router.post("/widgets")
async def create_widget(
    widget_config: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new dashboard widget."""
    widget = await analytics_service.create_widget(
        user_id=current_user["id"],
        config=widget_config
    )
    return {"widget_id": widget["id"], "message": "Widget created successfully"}


@router.put("/widgets/{widget_id}")
async def update_widget(
    widget_id: str,
    widget_config: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing dashboard widget."""
    success = await analytics_service.update_widget(
        widget_id=widget_id,
        user_id=current_user["id"],
        config=widget_config
    )
    if not success:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    return {"message": "Widget updated successfully"}


@router.delete("/widgets/{widget_id}")
async def delete_widget(
    widget_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a dashboard widget."""
    success = await analytics_service.delete_widget(widget_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    return {"message": "Widget deleted successfully"}


@router.get("/insights")
async def get_ai_insights(
    current_user: dict = Depends(get_current_user),
    category: Optional[str] = Query(None, description="Insight category"),
    limit: int = Query(10, le=50, description="Number of insights to return")
):
    """Get AI-generated insights based on user's data."""
    insights = await analytics_service.get_ai_insights(
        user_id=current_user["id"],
        category=category,
        limit=limit
    )
    return {"insights": insights}


@router.get("/trends")
async def get_trend_analysis(
    current_user: dict = Depends(get_current_user),
    data_type: str = Query("trading", description="Type of data to analyze"),
    period: str = Query("30d", description="Analysis period")
):
    """Get trend analysis for user's data."""
    trends = await analytics_service.get_trend_analysis(
        user_id=current_user["id"],
        data_type=data_type,
        period=period
    )
    return {"trends": trends, "period": period}