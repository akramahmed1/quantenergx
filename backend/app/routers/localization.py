# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

from fastapi import APIRouter, Depends, Query
from typing import Dict
from app.core.security import get_current_user
from app.services.localization_service import LocalizationService

router = APIRouter()
localization_service = LocalizationService()


@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages."""
    languages = await localization_service.get_supported_languages()
    return {"languages": languages}


@router.get("/translations/{language}")
async def get_translations(
    language: str,
    namespace: str = Query("common", description="Translation namespace")
):
    """Get translations for a specific language and namespace."""
    translations = await localization_service.get_translations(language, namespace)
    if not translations:
        raise HTTPException(status_code=404, detail="Language or namespace not found")
    
    return {"language": language, "namespace": namespace, "translations": translations}


@router.post("/translations/{language}")
async def update_translations(
    language: str,
    translations: Dict[str, str],
    namespace: str = Query("common", description="Translation namespace"),
    current_user: dict = Depends(get_current_user)
):
    """Update translations for a specific language (admin only)."""
    # Check admin permissions
    if not check_permissions("admin")(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    success = await localization_service.update_translations(
        language=language,
        namespace=namespace,
        translations=translations
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update translations")
    
    return {"message": "Translations updated successfully"}


@router.get("/user-locale")
async def get_user_locale(
    current_user: dict = Depends(get_current_user)
):
    """Get current user's locale preferences."""
    locale = await localization_service.get_user_locale(current_user["id"])
    return {
        "language": locale["language"],
        "region": locale["region"],
        "timezone": locale["timezone"],
        "currency": locale["currency"],
        "date_format": locale["date_format"],
        "number_format": locale["number_format"]
    }


@router.put("/user-locale")
async def update_user_locale(
    locale_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user's locale preferences."""
    success = await localization_service.update_user_locale(
        user_id=current_user["id"],
        locale_data=locale_data
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update locale")
    
    return {"message": "Locale preferences updated successfully"}


@router.get("/formats/{language}")
async def get_locale_formats(
    language: str,
    format_type: str = Query("all", description="Format type (date, number, currency, all)")
):
    """Get locale-specific formats (date, number, currency) for a language."""
    formats = await localization_service.get_locale_formats(language, format_type)
    if not formats:
        raise HTTPException(status_code=404, detail="Language not supported")
    
    return {"language": language, "formats": formats}


@router.post("/validate-translation")
async def validate_translation_key(
    key: str,
    language: str,
    namespace: str = Query("common", description="Translation namespace")
):
    """Validate if a translation key exists for a specific language."""
    exists = await localization_service.validate_translation_key(key, language, namespace)
    return {
        "key": key,
        "language": language,
        "namespace": namespace,
        "exists": exists
    }


@router.get("/rtl-languages")
async def get_rtl_languages():
    """Get list of right-to-left (RTL) languages."""
    rtl_languages = await localization_service.get_rtl_languages()
    return {"rtl_languages": rtl_languages}


@router.get("/region-settings/{region}")
async def get_region_settings(
    region: str
):
    """Get region-specific settings (currency, date format, etc.)."""
    settings = await localization_service.get_region_settings(region)
    if not settings:
        raise HTTPException(status_code=404, detail="Region not supported")
    
    return {"region": region, "settings": settings}


@router.post("/detect-language")
async def detect_user_language(
    text_sample: str = None,
    user_agent: str = None,
    accept_language: str = None
):
    """Detect user's preferred language from various inputs."""
    detected = await localization_service.detect_language(
        text_sample=text_sample,
        user_agent=user_agent,
        accept_language=accept_language
    )
    
    return {
        "detected_language": detected["language"],
        "confidence": detected["confidence"],
        "fallback": detected["fallback"]
    }