# Copyright (c) 2025 QuantEnergX. All rights reserved.
# This software contains proprietary and confidential information.
# Unauthorized copying, distribution, or use is strictly prohibited.
# Patent Pending - Application filed under applicable jurisdictions.

import pytest
from app.services.localization_service import LocalizationService


@pytest.fixture
def localization_service():
    """Create localization service instance for testing."""
    return LocalizationService()


class TestLocalizationService:
    """Test localization service."""
    
    @pytest.mark.asyncio
    async def test_get_supported_languages(self, localization_service):
        """Test getting supported languages."""
        languages = await localization_service.get_supported_languages()
        assert len(languages) == 4
        
        language_codes = [lang["code"] for lang in languages]
        assert "en" in language_codes
        assert "ar" in language_codes
        assert "fr" in language_codes
        assert "es" in language_codes
        
        # Check Arabic is marked as RTL
        arabic = next(lang for lang in languages if lang["code"] == "ar")
        assert arabic["rtl"] is True
    
    @pytest.mark.asyncio
    async def test_get_translations_english(self, localization_service):
        """Test getting English translations."""
        translations = await localization_service.get_translations("en", "common")
        assert translations is not None
        assert "welcome" in translations
        assert translations["welcome"] == "Welcome"
    
    @pytest.mark.asyncio
    async def test_get_translations_arabic(self, localization_service):
        """Test getting Arabic translations."""
        translations = await localization_service.get_translations("ar", "common")
        assert translations is not None
        assert "welcome" in translations
        assert translations["welcome"] == "أهلاً وسهلاً"
    
    @pytest.mark.asyncio
    async def test_get_translations_trading_namespace(self, localization_service):
        """Test getting trading namespace translations."""
        translations = await localization_service.get_translations("en", "trading")
        assert translations is not None
        assert "buy" in translations
        assert "sell" in translations
    
    @pytest.mark.asyncio
    async def test_validate_translation_key(self, localization_service):
        """Test validating translation keys."""
        # Valid key
        exists = await localization_service.validate_translation_key("welcome", "en", "common")
        assert exists is True
        
        # Invalid key
        exists = await localization_service.validate_translation_key("nonexistent", "en", "common")
        assert exists is False
    
    @pytest.mark.asyncio
    async def test_get_rtl_languages(self, localization_service):
        """Test getting RTL languages."""
        rtl_languages = await localization_service.get_rtl_languages()
        assert "ar" in rtl_languages
        assert "he" in rtl_languages
    
    @pytest.mark.asyncio
    async def test_get_locale_formats(self, localization_service):
        """Test getting locale formats."""
        formats = await localization_service.get_locale_formats("en", "all")
        assert formats is not None
        assert "date" in formats
        assert "number" in formats
        assert "currency" in formats
        
        # Test specific format type
        date_formats = await localization_service.get_locale_formats("en", "date")
        assert date_formats is not None
        assert "short" in date_formats
    
    @pytest.mark.asyncio
    async def test_detect_language(self, localization_service):
        """Test language detection."""
        result = await localization_service.detect_language(
            accept_language="ar-SA,ar;q=0.9,en;q=0.8"
        )
        assert result["language"] == "ar"
        assert result["confidence"] > 0.5
        assert result["fallback"] == "en"