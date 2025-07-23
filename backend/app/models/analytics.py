"""
QuantEnerGx Analytics Models

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.sql import func

from ..core.database import Base


class AnalyticsReport(Base):
    """Generated analytics reports"""
    
    __tablename__ = "analytics_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String, nullable=False)
    parameters = Column(JSON, default=dict)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    progress = Column(Integer, default=0)
    
    # Results
    results = Column(JSON, nullable=True)
    file_path = Column(String, nullable=True)
    
    # Metadata
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)


class PortfolioAnalysis(Base):
    """Portfolio analysis results"""
    
    __tablename__ = "portfolio_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    portfolio_id = Column(String, nullable=True)
    analysis_type = Column(String, nullable=False)
    
    # Results
    total_return = Column(Float, nullable=True)
    volatility = Column(Float, nullable=True)
    sharpe_ratio = Column(Float, nullable=True)
    var_95 = Column(Float, nullable=True)
    
    # Metadata
    analysis_date = Column(DateTime, default=func.now())
    time_period_start = Column(DateTime, nullable=False)
    time_period_end = Column(DateTime, nullable=False)