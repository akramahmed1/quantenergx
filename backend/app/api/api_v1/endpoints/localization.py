"""
QuantEnerGx Localization Endpoints

Copyright (c) 2025 QuantEnerGx Technologies
Patent Pending - All Rights Reserved

Energy Industry Compliance: NERC CIP, IEC 61850, FERC compliant
SaaS Security: SOC 2, GDPR/CCPA compliant
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from ...core.database import get_db
from ...core.security import get_current_user


router = APIRouter()


@router.get("/languages/supported")
async def get_supported_languages() -> Dict[str, Any]:
    """Get list of supported languages"""
    return {
        "languages": [
            {"code": "en", "name": "English", "rtl": False},
            {"code": "ar", "name": "العربية", "rtl": True},
            {"code": "es", "name": "Español", "rtl": False},
            {"code": "fr", "name": "Français", "rtl": False},
            {"code": "de", "name": "Deutsch", "rtl": False},
            {"code": "zh", "name": "中文", "rtl": False}
        ]
    }


@router.get("/translations/{language_code}")
async def get_translations(
    language_code: str,
    namespace: Optional[str] = Query(None, description="Translation namespace"),
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get translations for specific language"""
    
    # Sample translations for the energy domain
    translations = {
        "en": {
            "common": {
                "login": "Login",
                "logout": "Logout",
                "dashboard": "Dashboard",
                "analytics": "Analytics",
                "settings": "Settings"
            },
            "energy": {
                "power": "Power",
                "voltage": "Voltage",
                "current": "Current",
                "frequency": "Frequency",
                "energy_consumption": "Energy Consumption",
                "carbon_footprint": "Carbon Footprint"
            }
        },
        "ar": {
            "common": {
                "login": "تسجيل الدخول",
                "logout": "تسجيل الخروج",
                "dashboard": "لوحة القيادة",
                "analytics": "التحليلات",
                "settings": "الإعدادات"
            },
            "energy": {
                "power": "القدرة",
                "voltage": "الجهد",
                "current": "التيار",
                "frequency": "التردد",
                "energy_consumption": "استهلاك الطاقة",
                "carbon_footprint": "البصمة الكربونية"
            }
        }
    }
    
    if language_code not in translations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Language not supported"
        )
    
    lang_translations = translations[language_code]
    
    if namespace and namespace in lang_translations:
        return {namespace: lang_translations[namespace]}
    
    return lang_translations


@router.get("/locale/formats")
async def get_locale_formats(
    language_code: str = Query(..., description="Language code"),
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get locale-specific formatting rules"""
    
    formats = {
        "en": {
            "date_format": "MM/DD/YYYY",
            "time_format": "HH:mm:ss",
            "number_format": "1,234.56",
            "currency_symbol": "$",
            "decimal_separator": ".",
            "thousands_separator": ","
        },
        "ar": {
            "date_format": "DD/MM/YYYY",
            "time_format": "HH:mm:ss",
            "number_format": "1٬234٫56",
            "currency_symbol": "ر.س",
            "decimal_separator": "٫",
            "thousands_separator": "٬"
        }
    }
    
    return formats.get(language_code, formats["en"])