import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from './translations';

type Language = 'en' | 'es' | 'fr';
type TranslationKey = string;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, defaultLanguage = 'en' }) => {
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('language') as Language) || defaultLanguage
  );

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: TranslationKey): string => {
    const keys = key.split('.');
    // Use fallback to English if language is missing
    let value: any = translations[language] || translations['en'];

    for (const k of keys) {
      value = value?.[k];
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export default I18nProvider;
