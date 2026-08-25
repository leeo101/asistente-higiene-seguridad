import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, CaretDown, Shield } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../utils/i18n';

export default function LanguageSelector() {
  const { language, setLanguage, selectedFramework, setSelectedFramework } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
  ];

  const frameworks = [
    { id: 'iso45001', name: 'ISO 45001:2018', sub: 'OH&S Management Standard' },
    { id: 'osha', name: 'OSHA 1910 / 1926', sub: 'US Federal Safety Standard' },
    { id: 'iso14001', name: 'ISO 14001:2015', sub: 'Environmental Management' },
    { id: 'stps', name: 'STPS NOMs (México)', sub: 'Normatividad Mexicana' },
    { id: 'nr_brasil', name: 'NR 01-38 (Brasil)', sub: 'Normas Regulamentadoras' },
    { id: 'local', name: 'Normativa Local / Nacional', sub: 'Ley 19.587 / DS 44 / Regional' },
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

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 text-xs text-slate-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        title="Idioma & Norma Marco Global"
      >
        <Globe size={16} className="text-blue-400" />
        <span className="font-medium uppercase">{currentLangObj.flag} {currentLangObj.code}</span>
        <span className="hidden md:inline-block text-slate-400">|</span>
        <span className="hidden md:inline-block text-slate-300 font-mono text-[11px]">
          {selectedFramework.toUpperCase()}
        </span>
        <CaretDown size={12} className="text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700/90 shadow-2xl z-50 p-2 backdrop-blur-md">
          {/* Idiomas */}
          <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
            Idioma / Language
          </div>
          <div className="space-y-0.5 mb-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  language === lang.code
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {language === lang.code && <Check size={14} className="text-blue-400" />}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-800 my-1.5" />

          {/* Marco Normativo */}
          <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center gap-1">
            <Shield size={12} className="text-emerald-400" />
            Marco EHS Preferido
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
            {frameworks.map((fw) => (
              <button
                key={fw.id}
                onClick={() => {
                  setSelectedFramework(fw.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedFramework === fw.id
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-medium'
                    : 'text-slate-300 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{fw.name}</span>
                  {selectedFramework === fw.id && <Check size={14} className="text-emerald-400" />}
                </div>
                <div className="text-[10px] text-slate-400 font-normal">{fw.sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
