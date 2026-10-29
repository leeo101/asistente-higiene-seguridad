import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, CaretDown, Shield } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language, getTranslation } from '../utils/i18n';
import { countryList } from '../data/legislationData';
import toast from 'react-hot-toast';

export default function LanguageSelector() {
  const { language, setLanguage, selectedFramework, setSelectedFramework, countryNorms, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];
  const currentCountryObj = countryList.find((c) => c.code === selectedFramework) || countryList[0];

  return (
    <div ref={dropdownRef} className="relative inline-block text-left" data-no-translate="true">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/85 hover:bg-slate-700/95 border border-slate-700/80 text-xs text-slate-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
        title={`${t('selector.lang_title')} & ${t('selector.framework_title')}`}
      >
        <Globe size={16} className="text-blue-400 shrink-0" />
        <span className="font-bold uppercase">
          {currentLangObj.flag} {currentLangObj.code}
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-emerald-300 font-bold text-[11px] flex items-center gap-1">
          <span>{currentCountryObj.flag}</span>
          <span className="hidden sm:inline">{currentCountryObj.shortName}</span>
          <span className="hidden lg:inline text-slate-400 font-mono text-[10px]">
            ({countryNorms.general})
          </span>
        </span>
        <CaretDown size={12} className="text-slate-400 ml-0.5 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/98 border border-slate-700/90 shadow-2xl z-[1200] p-2.5 backdrop-blur-xl">
          {/* Idiomas */}
          <div className="text-[11px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider flex items-center gap-1.5">
            <Globe size={13} className="text-blue-400" />
            <span>{t('selector.lang_title')}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-2 px-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  toast.success(getTranslation('selector.lang_changed', lang.code), {
                    id: 'lang-toast',
                    duration: 2200
                  });
                }}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  language === lang.code
                    ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-800 my-1.5" />

          {/* Marco Normativo / Países */}
          <div className="text-[11px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield size={13} className="text-emerald-400" />
              <span>{t('selector.framework_title')}</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {countryList.length}
            </span>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {countryList.map((fw) => {
              const isSelected = selectedFramework === fw.code;
              return (
                <button
                  key={fw.code}
                  type="button"
                  onClick={() => {
                    setSelectedFramework(fw.code);
                    toast.success(
                      `${t('selector.framework_changed')} ${fw.flag} ${fw.shortName} (${fw.mainLaw})`,
                      { id: 'framework-toast', duration: 2600 }
                    );
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
                      : 'text-slate-200 hover:bg-slate-800/75 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-sm">{fw.flag}</span>
                      <span className="font-bold truncate">{fw.shortName}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700/80 truncate">
                        {fw.mainLaw}
                      </span>
                    </span>
                    {isSelected && <Check size={14} weight="bold" className="text-emerald-400 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal pl-6 mt-0.5 truncate">
                    {fw.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
