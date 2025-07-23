/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 */

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    
    // Set document direction for RTL languages
    const rtlLanguages = ['ar', 'he', 'fa'];
    const isRTL = rtlLanguages.includes(lng);
    
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    
    // Store language preference
    localStorage.setItem('preferred_language', lng);
  };

  const isRTL = () => {
    const rtlLanguages = ['ar', 'he', 'fa'];
    return rtlLanguages.includes(i18n.language);
  };

  useEffect(() => {
    // Set initial direction on mount
    const rtlLanguages = ['ar', 'he', 'fa'];
    const isRTLLang = rtlLanguages.includes(i18n.language);
    document.documentElement.dir = isRTLLang ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    isRTL: isRTL(),
    supportedLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
    ],
  };
};