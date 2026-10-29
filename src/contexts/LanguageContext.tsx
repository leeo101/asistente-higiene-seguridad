import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language, getTranslation, translateAndAdaptText } from '../utils/i18n';
import {
  CountryNormativa,
  getCountryNormativa,
  normalizeCountryCode,
  countryList
} from '../data/legislationData';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  selectedFramework: string;
  setSelectedFramework: (framework: string) => void;
  countryNorms: CountryNormativa;
  adaptText: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const originalTextMap = new WeakMap<Node, string>();
const lastAppliedTextMap = new WeakMap<Node, string>();
const originalAttrMap = new WeakMap<Element, { placeholder?: string; title?: string }>();
const lastAppliedAttrMap = new WeakMap<Element, { placeholder?: string; title?: string }>();

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'NOSCRIPT', 'SVG']);

function processDomTree(root: HTMLElement, lang: Language, country: string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current: Node | null = walker.currentNode;

  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      const parent = current.parentElement;
      if (parent && !SKIP_TAGS.has(parent.tagName) && !parent.closest('[data-no-translate="true"]')) {
        const currentVal = current.nodeValue || '';
        if (currentVal.trim().length > 0) {
          const lastApplied = lastAppliedTextMap.get(current);
          let orig = originalTextMap.get(current);
          if (orig === undefined || (lastApplied !== undefined && currentVal !== lastApplied)) {
            orig = currentVal;
            originalTextMap.set(current, orig);
          }
          const nextVal = translateAndAdaptText(orig, lang, country);
          if (nextVal !== currentVal) {
            current.nodeValue = nextVal;
          }
          lastAppliedTextMap.set(current, nextVal);
        }
      }
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement;
      if (!SKIP_TAGS.has(el.tagName) && !el.closest('[data-no-translate="true"]')) {
        const origAttrs = originalAttrMap.get(el) || {};
        const lastAttrs = lastAppliedAttrMap.get(el) || {};

        const ph = el.getAttribute('placeholder');
        if (ph && ph.trim().length > 0) {
          if (origAttrs.placeholder === undefined || (lastAttrs.placeholder !== undefined && ph !== lastAttrs.placeholder)) {
            origAttrs.placeholder = ph;
          }
          const nextPh = translateAndAdaptText(origAttrs.placeholder, lang, country);
          if (nextPh !== ph) {
            el.setAttribute('placeholder', nextPh);
          }
          lastAttrs.placeholder = nextPh;
        }

        const titleAttr = el.getAttribute('title');
        if (titleAttr && titleAttr.trim().length > 0) {
          if (origAttrs.title === undefined || (lastAttrs.title !== undefined && titleAttr !== lastAttrs.title)) {
            origAttrs.title = titleAttr;
          }
          const nextTitle = translateAndAdaptText(origAttrs.title, lang, country);
          if (nextTitle !== titleAttr) {
            el.setAttribute('title', nextTitle);
          }
          lastAttrs.title = nextTitle;
        }

        if (origAttrs.placeholder !== undefined || origAttrs.title !== undefined) {
          originalAttrMap.set(el, origAttrs);
          lastAppliedAttrMap.set(el, lastAttrs);
        }
      }
    }
    current = walker.nextNode();
  }
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('ehs_language');
      if (saved && (saved === 'es' || saved === 'en' || saved === 'pt')) {
        return saved as Language;
      }
    } catch (e) {
      console.error('[i18n] Error reading language from localStorage:', e);
    }
    return 'es';
  });

  const [selectedFramework, setSelectedFrameworkState] = useState<string>(() => {
    try {
      const savedFw = localStorage.getItem('ehs_framework');
      const rawPd = localStorage.getItem('personalData');
      let pdCountry: string | null = null;
      if (rawPd && rawPd.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawPd);
          pdCountry = parsed?.country || null;
        } catch {}
      }
      // Priorizar ehs_framework si fue elegido explícitamente y es un país válido; sino personalData.country
      const initial = normalizeCountryCode(
        savedFw && savedFw !== 'iso45001' ? savedFw : pdCountry || savedFw || 'argentina'
      );
      return initial;
    } catch (e) {
      return 'argentina';
    }
  });

  // Mantener sincronizado personalData.country y ehs_framework al iniciar y cuando cambie
  useEffect(() => {
    try {
      const normalized = normalizeCountryCode(selectedFramework);
      localStorage.setItem('ehs_framework', normalized);

      const rawPd = localStorage.getItem('personalData');
      let pd: Record<string, any> = {};
      if (rawPd && rawPd.startsWith('{')) {
        try {
          pd = JSON.parse(rawPd) || {};
        } catch {
          pd = {};
        }
      }
      if (pd.country !== normalized) {
        pd.country = normalized;
        if (!pd.name) pd.name = 'Profesional';
        localStorage.setItem('personalData', JSON.stringify(pd));
      }
    } catch (e) {
      console.error('[i18n] Error syncing framework with personalData:', e);
    }
  }, [selectedFramework]);

  // Escuchar cambios externos de país (por ejemplo, desde Datos Personales o Legislación)
  useEffect(() => {
    const handleFrameworkEvent = (e: Event) => {
      const custom = e as CustomEvent<{ country?: string }>;
      if (custom.detail?.country) {
        const norm = normalizeCountryCode(custom.detail.country);
        setSelectedFrameworkState((prev) => (prev !== norm ? norm : prev));
      }
    };
    window.addEventListener('ehs-framework-change', handleFrameworkEvent);
    return () => window.removeEventListener('ehs-framework-change', handleFrameworkEvent);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('ehs_language', lang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
    } catch (e) {
      console.error('[i18n] Error saving language to localStorage:', e);
    }
  };

  const setSelectedFramework = (framework: string) => {
    const normalized = normalizeCountryCode(framework);
    setSelectedFrameworkState(normalized);
    try {
      localStorage.setItem('ehs_framework', normalized);
      const rawPd = localStorage.getItem('personalData');
      let pd: Record<string, any> = {};
      if (rawPd && rawPd.startsWith('{')) {
        try {
          pd = JSON.parse(rawPd) || {};
        } catch {
          pd = {};
        }
      }
      pd.country = normalized;
      if (!pd.name) pd.name = 'Profesional';
      localStorage.setItem('personalData', JSON.stringify(pd));
      window.dispatchEvent(new CustomEvent('ehs-framework-change', { detail: { country: normalized } }));
    } catch (e) {
      console.error('[i18n] Error saving framework to localStorage:', e);
    }
  };

  const countryNorms = useMemo(() => getCountryNormativa(selectedFramework), [selectedFramework]);

  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  const adaptText = (text: string): string => {
    return translateAndAdaptText(text, language, selectedFramework);
  };

  // Efecto global para traducir textos estáticos y adaptar leyes en páginas internas
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = language;
    const root = document.getElementById('root');
    if (!root) return;

    let rafId: number | null = null;
    let isProcessing = false;

    const runPass = () => {
      if (isProcessing) return;
      isProcessing = true;
      try {
        processDomTree(root, language, selectedFramework);
      } finally {
        isProcessing = false;
      }
    };

    runPass();

    const observer = new MutationObserver(() => {
      if (isProcessing) return;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        runPass();
      });
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [language, selectedFramework]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        selectedFramework,
        setSelectedFramework,
        countryNorms,
        adaptText
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
