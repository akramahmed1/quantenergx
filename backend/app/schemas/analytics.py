"""
QuantEnerGx Analytics Schemas

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class AnalyticsReportResponse(BaseModel):
    """Analytics report response schema"""
    id: int
    report_type: str
    parameters: Dict[str, Any]
    status: str
    progress: int
    results: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    requested_by: int
    requested_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PortfolioAnalysisResponse(BaseModel):
    """Portfolio analysis response schema"""
    id: int
    user_id: int
    portfolio_id: Optional[str] = None
    analysis_type: str
    total_return: Optional[float] = None
    volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    var_95: Optional[float] = None
    analysis_date: datetime
    time_period_start: datetime
    time_period_end: datetime
    
    class Config:
        from_attributes = True