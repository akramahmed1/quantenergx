#!/usr/bin/env python3
"""
QuantEnergX MVP - Localization & Internationalization Router
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform
"""

from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
import logging

from app.core.security import get_current_user, require_permission, audit_logger
from app.core.config import get_settings

logger = logging.getLogger("quantenergx.localization")
settings = get_settings()
router = APIRouter()

class TranslationUpdate(BaseModel):
    key: str = Field(..., max_length=100)
    language: str = Field(..., regex="^(en|ar|fr|es)$")
    value: str = Field(..., max_length=1000)

# Mock translation data
TRANSLATIONS = {
    "en": {
        "dashboard.title": "Energy Trading Dashboard",
        "trading.buy": "Buy",
        "trading.sell": "Sell",
        "analytics.performance": "Performance Analytics",
        "notifications.alert": "System Alert",
        "common.loading": "Loading...",
        "common.error": "An error occurred"
    },
    "ar": {
        "dashboard.title": "لوحة تحكم تداول الطاقة",
        "trading.buy": "شراء",
        "trading.sell": "بيع",
        "analytics.performance": "تحليلات الأداء",
        "notifications.alert": "تنبيه النظام",
        "common.loading": "جارٍ التحميل...",
        "common.error": "حدث خطأ"
    },
    "fr": {
        "dashboard.title": "Tableau de Bord de Trading Énergétique",
        "trading.buy": "Acheter",
        "trading.sell": "Vendre",
        "analytics.performance": "Analyses de Performance",
        "notifications.alert": "Alerte Système",
        "common.loading": "Chargement...",
        "common.error": "Une erreur s'est produite"
    },
    "es": {
        "dashboard.title": "Panel de Control de Trading Energético",
        "trading.buy": "Comprar",
        "trading.sell": "Vender",
        "analytics.performance": "Análisis de Rendimiento",
        "notifications.alert": "Alerta del Sistema",
        "common.loading": "Cargando...",
        "common.error": "Ocurrió un error"
    }
}

@router.get("/translations", dependencies=[Depends(require_permission("localization:read"))])
async def get_translations(
    language: str = Query(..., regex="^(en|ar|fr|es)$"),
    namespace: str = Query(default="", description="Filter by namespace (e.g., 'dashboard', 'trading')"),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get translations for specified language."""
    translations = TRANSLATIONS.get(language, {})
    
    if namespace:
        translations = {
            key: value for key, value in translations.items()
            if key.startswith(f"{namespace}.")
        }
    
    audit_logger.log_data_access(
        current_user["user_id"],
        "translations",
        "read",
        len(translations),
        {"language": language, "namespace": namespace}
    )
    
    return {
        "language": language,
        "translations": translations,
        "count": len(translations),
        "rtl": language == "ar"  # Right-to-left languages
    }

@router.get("/languages", dependencies=[Depends(require_permission("localization:read"))])
async def get_supported_languages(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get list of supported languages."""
    languages = [
        {"code": "en", "name": "English", "native_name": "English", "rtl": False},
        {"code": "ar", "name": "Arabic", "native_name": "العربية", "rtl": True},
        {"code": "fr", "name": "French", "native_name": "Français", "rtl": False},
        {"code": "es", "name": "Spanish", "native_name": "Español", "rtl": False}
    ]
    
    return {
        "languages": languages,
        "default_language": settings.DEFAULT_LANGUAGE,
        "total_languages": len(languages)
    }

@router.put("/translations", dependencies=[Depends(require_permission("localization:write"))])
async def update_translation(
    translation: TranslationUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Update translation for a specific key and language."""
    # Update mock translation data
    if translation.language not in TRANSLATIONS:
        TRANSLATIONS[translation.language] = {}
    
    TRANSLATIONS[translation.language][translation.key] = translation.value
    
    audit_logger.log_user_action(
        current_user["user_id"],
        "translation_updated",
        f"key:{translation.key}",
        "success",
        {"language": translation.language, "key": translation.key}
    )
    
    return {
        "message": "Translation updated successfully",
        "key": translation.key,
        "language": translation.language,
        "value": translation.value,
        "updated_at": datetime.utcnow().isoformat()
    }