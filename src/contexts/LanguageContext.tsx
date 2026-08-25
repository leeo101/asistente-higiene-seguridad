import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslation } from '../utils/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  selectedFramework: string;
  setSelectedFramework: (framework: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('ehs_language');
      if (saved && (saved === 'es' || saved === 'en' || saved === 'pt')) {
        return saved as Language;
      }
      const navLang = navigator.language.substring(0, 2);
      if (navLang === 'en' || navLang === 'pt') return navLang;
    } catch (e) {
      console.error('[i18n] Error reading language from localStorage:', e);
    }
    return 'es';
  });

  const [selectedFramework, setSelectedFrameworkState] = useState<string>(() => {
    try {
      return localStorage.getItem('ehs_framework') || 'iso45001';
    } catch (e) {
      return 'iso45001';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('ehs_language', lang);
    } catch (e) {
      console.error('[i18n] Error saving language to localStorage:', e);
    }
  };

  const setSelectedFramework = (framework: string) => {
    setSelectedFrameworkState(framework);
    try {
      localStorage.setItem('ehs_framework', framework);
    } catch (e) {
      console.error('[i18n] Error saving framework to localStorage:', e);
    }
  };

  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        selectedFramework,
        setSelectedFramework,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
