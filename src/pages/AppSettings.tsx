import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon, Sun, Smartphone, Bell, Shield, Info, ChevronRight, Cloud,
  RefreshCw, CheckCircle, Lock, Download, Upload, TriangleAlert,
  Globe, Scale, HardDrive, User, PenTool, Image as ImageIcon,
  Building2, Zap, Sparkles, Volume2, FileCheck2, RotateCcw, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCompany } from '../contexts/CompanyContext';
import { countryList } from '../data/legislationData';
import { Language } from '../utils/i18n';
import {
  pushAllToCloud,
  pullAllFromCloud,
  SYNC_COLLECTIONS,
  SYNC_DOCUMENTS,
  SYNC_VALUES
} from '../services/cloudSync';
import PremiumHeader from '../components/PremiumHeader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const BACKUP_KEYS = [...SYNC_COLLECTIONS, ...SYNC_DOCUMENTS, ...SYNC_VALUES, 'ehs_assets', 'safety_calendar_events'];

interface SystemPreferences {
  notifications: boolean;
  offlineSync: boolean;
  dataSaver: boolean;
  scannerSound: boolean;
  autoBrandingPdf: boolean;
}

const DEFAULT_PREFS: SystemPreferences = {
  notifications: true,
  offlineSync: true,
  dataSaver: false,
  scannerSound: true,
  autoBrandingPdf: true
};

export default function AppSettings(): React.ReactElement | null {
  useDocumentTitle('Configuración del Sistema');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncing, lastSync, isOnline, pendingCount } = useSync();
  const { language, setLanguage, selectedFramework, setSelectedFramework, countryNorms } = useLanguage();
  const { activeCompany, companies } = useCompany();

  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'dark');
  const [manualSyncing, setManualSyncing] = useState(false);
  const [prefs, setPrefs] = useState<SystemPreferences>(() => {
    try {
      const saved = localStorage.getItem('ehs_system_preferences');
      if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_PREFS;
  });
  const [storageVersion, setStorageVersion] = useState(0);
  const importRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    document.documentElement.classList.toggle('high-contrast', newTheme === 'high-contrast');
    if (newTheme === 'high-contrast') {
      document.documentElement.setAttribute('data-theme', 'high-contrast');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    toast.success(
      newTheme === 'dark'
        ? 'Modo Oscuro activado'
        : newTheme === 'high-contrast'
        ? 'Modo Alto Contraste Industrial activado'
        : 'Modo Claro activado'
    );
  };

  const handleTogglePref = async (key: keyof SystemPreferences) => {
    const nextValue = !prefs[key];
    if (key === 'notifications' && nextValue && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            toast.error('Permiso de notificaciones denegado por el navegador');
          }
        } catch {
          // ignore
        }
      }
    }
    const updated = { ...prefs, [key]: nextValue };
    setPrefs(updated);
    localStorage.setItem('ehs_system_preferences', JSON.stringify(updated));
    toast.success('Preferencia actualizada');
  };

  const handleTestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Asistente H&S', {
          body: 'Las alertas preventivas y recordatorios de vencimientos están activos.',
          icon: '/logo.png'
        });
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('Asistente H&S', {
            body: 'Notificaciones activadas correctamente.',
            icon: '/logo.png'
          });
        }
      }
    }
    toast.success('🔔 Alerta de prueba enviada correctamente');
  };

  const handleManualSync = async () => {
    if (!currentUser) {
      toast.error('Iniciá sesión para sincronizar tus datos en la nube.');
      return;
    }
    setManualSyncing(true);
    try {
      await pushAllToCloud(currentUser.uid);
      await pullAllFromCloud(currentUser.uid);
      setStorageVersion((v) => v + 1);
      toast.success('Datos sincronizados correctamente con la nube');
    } catch {
      toast.error('Error al sincronizar. Verificá tu conexión a internet.');
    } finally {
      setManualSyncing(false);
    }
  };

  // Diagnóstico de almacenamiento local y perfil
  const systemDiagnostics = useMemo(() => {
    let totalBytes = 0;
    let totalRecords = 0;
    let activeModules = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2;
      }

      const uniqueKeys = Array.from(new Set(BACKUP_KEYS));
      uniqueKeys.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        activeModules++;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) totalRecords += parsed.length;
          else if (parsed && typeof parsed === 'object') totalRecords += 1;
        } catch {
          totalRecords += 1;
        }
      });
    } catch {
      // ignore
    }

    let personalData: any = null;
    let hasSignature = false;
    let hasLogo = false;
    try {
      const rawPd = localStorage.getItem('personalData');
      if (rawPd) personalData = JSON.parse(rawPd);
      hasSignature = Boolean(localStorage.getItem('signatureData') || localStorage.getItem('professionalSignature'));
      hasLogo = Boolean(localStorage.getItem('companyLogo') || activeCompany?.logo);
    } catch {
      // ignore
    }

    const kbUsed = Math.max(1, Math.round(totalBytes / 1024));
    const quotaPercent = Math.min(100, Math.round((kbUsed / 5120) * 100));

    return {
      kbUsed,
      quotaPercent,
      totalRecords,
      activeModules,
      personalData,
      hasSignature,
      hasLogo
    };
  }, [storageVersion, activeCompany]);

  // Exportar JSON completo
  const handleExport = () => {
    const backup: { version: number; exportedAt: string; framework: string; data: Record<string, any> } = {
      version: 3,
      exportedAt: new Date().toISOString(),
      framework: selectedFramework,
      data: {}
    };
    const uniqueKeys = Array.from(new Set(BACKUP_KEYS));
    uniqueKeys.forEach((k) => {
      const val = localStorage.getItem(k);
      if (val !== null) {
        try {
          backup.data[k] = JSON.parse(val);
        } catch {
          backup.data[k] = val;
        }
      }
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_hys_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Copia de seguridad (.JSON) descargada');
  };

  // Importar JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed.data || typeof parsed.data !== 'object') throw new Error('Formato inválido');
        let imported = 0;
        const allowedKeys = new Set(BACKUP_KEYS);
        Object.entries(parsed.data).forEach(([k, v]) => {
          if (allowedKeys.has(k)) {
            localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
            imported++;
          }
        });
        setStorageVersion((v) => v + 1);
        toast.success(`Backup restaurado (${imported} módulos actualizados)`);
      } catch {
        toast.error('El archivo seleccionado no es un backup válido de Asistente H&S.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetPreferences = () => {
    setPrefs(DEFAULT_PREFS);
    localStorage.setItem('ehs_system_preferences', JSON.stringify(DEFAULT_PREFS));
    toggleTheme('dark');
    toast.success('Preferencias restauradas a los valores recomendados');
  };

  const activeCountryInfo = useMemo(() => {
    return countryList.find((c) => c.code === selectedFramework) || countryList[0];
  }, [selectedFramework]);

  return (
    <div
      className="container max-w-7xl mx-auto px-3 sm:px-4 animate-fade-in"
      style={{ paddingTop: '7.25rem', paddingBottom: '6.5rem' }}
    >
      <div className="mb-5 sm:mb-6">
        <PremiumHeader
          title="Centro de Configuración y Preferencias"
          subtitle="Personalización de interfaz, marco normativo multinacional, sincronización en la nube, respaldos y ajustes profesionales."
          icon={<Sparkles size={32} className="text-sky-400" />}
        />
      </div>

      {/* ── KPIs DE ESTADO DEL SISTEMA (Responsivo 2x2 en celular, 4x1 en escritorio) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-5 sm:mb-6">
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: currentUser ? 'rgba(16,185,129,0.35)' : 'var(--color-border)'
          }}
          className="p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-2 min-w-0"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider m-0 truncate" style={{ color: 'var(--color-text-muted)' }}>
              Estado Cloud
            </p>
            <p
              className="text-sm sm:text-lg font-black mt-1 mb-0 truncate"
              style={{ color: currentUser ? '#10b981' : '#f59e0b' }}
            >
              {currentUser ? (isOnline ? 'Sincronizado' : 'Modo Offline') : 'Solo Local'}
            </p>
            <p className="text-[10px] sm:text-[11px] font-semibold m-0 mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
              {lastSync
                ? `Últ. sync: ${lastSync.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
                : currentUser
                ? 'Nube activa'
                : 'Sin sesión activa'}
            </p>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: currentUser ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
              color: currentUser ? '#10b981' : '#f59e0b'
            }}
          >
            <Cloud className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          className="p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-2 min-w-0"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider m-0 truncate" style={{ color: 'var(--color-text-muted)' }}>
              Marco Normativo
            </p>
            <p className="text-sm sm:text-lg font-black mt-1 mb-0 truncate" style={{ color: 'var(--color-text)' }}>
              {activeCountryInfo.flag} {activeCountryInfo.shortName}
            </p>
            <p className="text-[10px] sm:text-[11px] font-semibold m-0 mt-0.5 truncate" style={{ color: '#0284c7' }}>
              {countryNorms.general}
            </p>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(2,132,199,0.12)', color: '#0284c7' }}
          >
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          className="p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-2 min-w-0"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider m-0 truncate" style={{ color: 'var(--color-text-muted)' }}>
              Datos Locales
            </p>
            <p className="text-sm sm:text-lg font-black mt-1 mb-0 truncate" style={{ color: 'var(--color-text)' }}>
              {systemDiagnostics.totalRecords} registros
            </p>
            <p className="text-[10px] sm:text-[11px] font-semibold m-0 mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
              {systemDiagnostics.kbUsed} KB • {systemDiagnostics.activeModules} mód.
            </p>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}
          >
            <HardDrive className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          className="p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-2 min-w-0"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider m-0 truncate" style={{ color: 'var(--color-text-muted)' }}>
              Apariencia Activa
            </p>
            <p className="text-sm sm:text-lg font-black mt-1 mb-0 truncate" style={{ color: 'var(--color-text)' }}>
              {theme === 'dark' ? 'Modo Oscuro' : theme === 'high-contrast' ? 'Alto Contraste' : 'Modo Claro'}
            </p>
            <p className="text-[10px] sm:text-[11px] font-semibold m-0 mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
              Idioma: {language === 'es' ? 'Español' : language === 'en' ? 'English' : 'Português'}
            </p>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}
          >
            {theme === 'dark' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : theme === 'high-contrast' ? <Zap className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
        </div>
      </div>

      {/* ── GRILLA PRINCIPAL DE 2 COLUMNAS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* COLUMNA IZQUIERDA (7 COLUMNAS) */}
        <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
          {/* 1. APARIENCIA Y TEMA VISUAL */}
          <div
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            className="rounded-2xl sm:rounded-3xl border p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}
                >
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                    Tema de Interfaz y Visualización
                  </h2>
                  <p className="text-xs font-medium m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Adaptá el contraste según trabajes en oficina o en planta bajo luz solar intensa
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {[
                {
                  key: 'light',
                  title: 'Modo Claro',
                  sub: 'Ideal para oficina y lectura de informes',
                  icon: <Sun className="w-5 h-5" />,
                  accent: '#f59e0b'
                },
                {
                  key: 'dark',
                  title: 'Modo Oscuro',
                  sub: 'Descanso visual y ahorro de batería',
                  icon: <Moon className="w-5 h-5" />,
                  accent: '#38bdf8'
                },
                {
                  key: 'high-contrast',
                  title: 'Alto Contraste',
                  sub: 'Uso industrial en campo al aire libre',
                  icon: <Zap className="w-5 h-5" />,
                  accent: '#eab308'
                }
              ].map((item) => {
                const isSelected = theme === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleTheme(item.key)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(37,99,235,0.12)' : 'var(--color-background)',
                      borderColor: isSelected ? '#2563eb' : 'var(--color-border)',
                      color: 'var(--color-text)',
                      padding: '0.9rem 1rem',
                      borderRadius: '1rem',
                      borderWidth: isSelected ? '2px' : '1px',
                      borderStyle: 'solid',
                      textAlign: 'left'
                    }}
                    className="flex sm:flex-col items-center sm:items-start justify-between gap-3 sm:gap-2.5 cursor-pointer transition-all hover:opacity-95 w-full"
                  >
                    <div className="flex items-center gap-3 sm:justify-between sm:w-full">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isSelected ? '#2563eb' : 'var(--color-surface)',
                          color: isSelected ? '#ffffff' : item.accent
                        }}
                      >
                        {item.icon}
                      </div>
                      <div className="sm:hidden">
                        <p className="text-sm font-black m-0" style={{ color: 'var(--color-text)' }}>
                          {item.title}
                        </p>
                        <p className="text-[11px] font-medium m-0 mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                          {item.sub}
                        </p>
                      </div>
                      {isSelected && (
                        <span
                          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                          className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Activo
                        </span>
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-black m-0" style={{ color: 'var(--color-text)' }}>
                        {item.title}
                      </p>
                      <p className="text-[11px] font-medium m-0 mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                        {item.sub}
                      </p>
                    </div>
                    {isSelected && (
                      <span
                        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                        className="sm:hidden px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shrink-0"
                      >
                        <Check className="w-3 h-3" /> Activo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. IDIOMA Y MARCO NORMATIVO MULTINACIONAL */}
          <div
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            className="rounded-2xl sm:rounded-3xl border p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(14,165,233,0.12)', color: '#0284c7' }}
              >
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                  Idioma y Marco Legal de Higiene y Seguridad
                </h2>
                <p className="text-xs font-medium m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Adapta automáticamente todas las leyes, decretos y protocolos técnicos en informes y calculadoras
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Idioma de la Plataforma
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {[
                    { code: 'es' as Language, label: '🇦🇷 Español' },
                    { code: 'en' as Language, label: '🇺🇸 English' },
                    { code: 'pt' as Language, label: '🇧🇷 Português' }
                  ].map((lang) => {
                    const active = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code);
                          toast.success(`Idioma cambiado a ${lang.label}`);
                        }}
                        style={{
                          backgroundColor: active ? '#2563eb' : 'var(--color-background)',
                          color: active ? '#ffffff' : 'var(--color-text)',
                          borderColor: active ? '#2563eb' : 'var(--color-border)',
                          padding: '0.6rem 0.35rem',
                          borderRadius: '0.75rem',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                        className="text-[11px] sm:text-xs font-black cursor-pointer transition-all flex items-center justify-center truncate"
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  País / Jurisdicción Legal
                </label>
                <select
                  value={selectedFramework}
                  onChange={(e) => {
                    setSelectedFramework(e.target.value);
                    toast.success('Marco normativo actualizado en toda la aplicación');
                  }}
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)',
                    marginBottom: 0,
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.75rem'
                  }}
                  className="w-full text-xs font-bold border focus:outline-none focus:border-blue-500"
                >
                  {countryList.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vista previa de normas activas */}
            <div
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)'
              }}
              className="rounded-2xl border p-3 sm:p-3.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Normativa Vigente Aplicada ({activeCountryInfo.flag} {countryNorms.name})
                </span>
                <span
                  style={{ backgroundColor: 'rgba(14,165,233,0.12)', color: '#0284c7' }}
                  className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase"
                >
                  Ente: {countryNorms.authority}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-xl min-w-0" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <span className="block text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>Ley General</span>
                  <span className="font-black block truncate" style={{ color: 'var(--color-text)' }}>{countryNorms.general}</span>
                </div>
                <div className="p-2 rounded-xl min-w-0" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <span className="block text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>Incendio / Fuego</span>
                  <span className="font-black block truncate" style={{ color: 'var(--color-text)' }}>{countryNorms.fire}</span>
                </div>
                <div className="p-2 rounded-xl min-w-0" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <span className="block text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>Riesgo Eléctrico</span>
                  <span className="font-black block truncate" style={{ color: 'var(--color-text)' }}>{countryNorms.grounding}</span>
                </div>
                <div className="p-2 rounded-xl min-w-0" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <span className="block text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>Ergonomía</span>
                  <span className="font-black block truncate" style={{ color: 'var(--color-text)' }}>{countryNorms.ergo}</span>
                </div>
                <div className="p-2 rounded-xl min-w-0" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <span className="block text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>Ruido Laboral</span>
                  <span className="font-black block truncate" style={{ color: 'var(--color-text)' }}>{countryNorms.noise}</span>
                </div>
                <div className="p-2 rounded-xl min-w-0" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <span className="block text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>Iluminación</span>
                  <span className="font-black block truncate" style={{ color: 'var(--color-text)' }}>{countryNorms.lighting}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. PREFERENCIAS OPERATIVAS Y DE CAMPO */}
          <div
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            className="rounded-2xl sm:rounded-3xl border p-4 sm:p-6 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                >
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                    Preferencias Operativas y Notificaciones
                  </h2>
                  <p className="text-xs font-medium m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Comportamiento en inspecciones de campo, avisos de vencimientos y generación de PDF
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestNotification}
                style={{
                  backgroundColor: 'rgba(37,99,235,0.1)',
                  color: '#2563eb',
                  borderColor: 'rgba(37,99,235,0.25)',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '0.75rem',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
                className="w-full sm:w-auto text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 shrink-0"
              >
                <Bell className="w-3.5 h-3.5" /> Probar Alerta
              </button>
            </div>

            <div className="flex flex-col divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {[
                {
                  key: 'notifications' as keyof SystemPreferences,
                  icon: <Bell className="w-4 h-4" />,
                  title: 'Alertas de Vencimientos y Agenda H&S',
                  desc: 'Notificar extintores por vencer, estudios anuales y capacitaciones programadas'
                },
                {
                  key: 'offlineSync' as keyof SystemPreferences,
                  icon: <Smartphone className="w-4 h-4" />,
                  title: 'Modo Offline Inteligente en Planta',
                  desc: 'Guardar relevamientos sin señal y sincronizar automáticamente al recuperar conexión'
                },
                {
                  key: 'autoBrandingPdf' as keyof SystemPreferences,
                  icon: <FileCheck2 className="w-4 h-4" />,
                  title: 'Incluir Firma, Sello y Logo automáticamente en PDFs',
                  desc: 'Inserta tu membrete corporativo y firma profesional en todas las actas exportadas'
                },
                {
                  key: 'scannerSound' as keyof SystemPreferences,
                  icon: <Volume2 className="w-4 h-4" />,
                  title: 'Confirmación Sonora/Vibración en Escáner QR',
                  desc: 'Emitir señal al detectar etiquetas QR de activos y extintores en campo'
                },
                {
                  key: 'dataSaver' as keyof SystemPreferences,
                  icon: <Zap className="w-4 h-4" />,
                  title: 'Optimización de Fotos en Evidencias (Ahorro de Datos)',
                  desc: 'Comprimir capturas fotográficas para acelerar la subida con redes móviles 3G/4G'
                }
              ].map((item) => {
                const enabled = prefs[item.key];
                return (
                  <div
                    key={item.key}
                    className="py-3.5 flex items-center justify-between gap-3 sm:gap-4"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                      <div
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: enabled ? 'rgba(37,99,235,0.12)' : 'var(--color-background)',
                          color: enabled ? '#2563eb' : 'var(--color-text-muted)'
                        }}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-black m-0 leading-snug" style={{ color: 'var(--color-text)' }}>
                          {item.title}
                        </p>
                        <p className="text-[11px] sm:text-xs font-medium m-0 mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {/* Custom Toggle Switch immune to global input CSS */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => handleTogglePref(item.key)}
                      style={{
                        width: '48px',
                        height: '26px',
                        minHeight: '26px',
                        backgroundColor: enabled ? '#2563eb' : 'rgba(148,163,184,0.35)',
                        padding: '3px',
                        borderRadius: '9999px',
                        border: 'none',
                        position: 'relative'
                      }}
                      className="shrink-0 cursor-pointer transition-colors flex items-center"
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#ffffff',
                          borderRadius: '9999px',
                          transform: enabled ? 'translateX(22px)' : 'translateX(0px)',
                          transition: 'transform 0.2s ease',
                          display: 'block',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (5 COLUMNAS) */}
        <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
          {/* 1. SINCRONIZACIÓN EN LA NUBE & RESPALDOS */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: currentUser ? 'rgba(16,185,129,0.35)' : 'var(--color-border)'
            }}
            className="rounded-2xl sm:rounded-3xl border p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: currentUser ? 'rgba(16,185,129,0.14)' : 'rgba(100,116,139,0.12)',
                  color: currentUser ? '#10b981' : 'var(--color-text-muted)'
                }}
              >
                <Cloud className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black m-0 truncate" style={{ color: 'var(--color-text)' }}>
                    {currentUser ? 'Sincronización Cloud Activa' : 'Sincronización en la Nube'}
                  </h2>
                  {currentUser && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>
                <p className="text-xs font-medium m-0 mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {currentUser
                    ? currentUser.email
                    : 'Iniciá sesión para respaldar tus datos en todos tus dispositivos'}
                </p>
              </div>
            </div>

            {currentUser ? (
              <div className="flex flex-col gap-3">
                <div
                  style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}
                  className="p-3 sm:p-3.5 rounded-2xl border text-xs leading-relaxed"
                >
                  <span style={{ color: 'var(--color-text)' }}>
                    🔒 <strong>Respaldo continuo:</strong> Tus inspecciones, ATS, matrices de riesgo, extintores, activos QR, calendario y legajos se sincronizan automáticamente.
                  </span>
                  {pendingCount > 0 && (
                    <div className="mt-2 font-bold text-amber-500">
                      ⏳ {pendingCount} cambios pendientes de subir.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={manualSyncing || syncing}
                  style={{
                    background:
                      manualSyncing || syncing
                        ? 'rgba(16,185,129,0.15)'
                        : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: manualSyncing || syncing ? '#10b981' : '#ffffff',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.85rem',
                    border: manualSyncing || syncing ? '1px solid rgba(16,185,129,0.35)' : 'none',
                    boxShadow: manualSyncing || syncing ? 'none' : '0 8px 20px -4px rgba(16,185,129,0.4)'
                  }}
                  className="w-full font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-95"
                >
                  <RefreshCw className={`w-4 h-4 ${manualSyncing || syncing ? 'animate-spin' : ''}`} />
                  {manualSyncing || syncing ? 'Sincronizando con la nube...' : 'Sincronizar Ahora'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  color: '#ffffff',
                  padding: '0.85rem 1rem',
                  borderRadius: '0.85rem',
                  border: 'none',
                  boxShadow: '0 8px 20px -4px rgba(37,99,235,0.4)'
                }}
                className="w-full font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Lock className="w-4 h-4" /> Iniciar Sesión para Activar la Nube
              </button>
            )}

            {/* Respaldo Local JSON siempre visible y claro */}
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs font-black uppercase tracking-wider m-0 mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
                Copia de Seguridad Manual (Archivo .JSON)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleExport}
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)',
                    padding: '0.7rem 0.75rem',
                    borderRadius: '0.75rem',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                  className="text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer hover:border-blue-500 transition-all"
                >
                  <Download className="w-4 h-4 text-blue-500" /> Exportar Backup (.JSON)
                </button>
                <button
                  type="button"
                  onClick={() => importRef.current?.click()}
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)',
                    padding: '0.7rem 0.75rem',
                    borderRadius: '0.75rem',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                  className="text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer hover:border-blue-500 transition-all"
                >
                  <Upload className="w-4 h-4 text-emerald-500" /> Importar Backup (.JSON)
                </button>
                <input ref={importRef} type="file" accept=".json" hidden onChange={handleImport} />
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(245,158,11,0.08)',
                  borderColor: 'rgba(245,158,11,0.25)',
                  color: 'var(--color-text-muted)'
                }}
                className="mt-2.5 p-2.5 rounded-xl border flex items-start gap-2 text-[11px]"
              >
                <TriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Importar un archivo JSON restaura y reemplaza las colecciones locales actuales.</span>
              </div>
            </div>
          </div>

          {/* 2. ACCESOS RÁPIDOS DE CONFIGURACIÓN PROFESIONAL */}
          <div
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            className="rounded-2xl sm:rounded-3xl border p-4 sm:p-6 shadow-sm"
          >
            <h2 className="text-sm sm:text-base font-black m-0 mb-1" style={{ color: 'var(--color-text)' }}>
              Identidad Profesional y Seguridad
            </h2>
            <p className="text-xs font-medium m-0 mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Configurá tus credenciales para firmas de reportes PDF, membretes y accesos de cuenta
            </p>

            <div className="flex flex-col gap-2.5">
              {[
                {
                  title: 'Datos Personales y Matrícula',
                  desc: systemDiagnostics.personalData?.name
                    ? `${systemDiagnostics.personalData.name} • Mat: ${systemDiagnostics.personalData.license || 'S/N'}`
                    : 'Nombre completo, título habilitante y matrícula profesional',
                  icon: <User className="w-4 h-4" />,
                  color: '#3b82f6',
                  path: '/personal-data',
                  badge: systemDiagnostics.personalData?.name ? 'Configurado' : 'Pendiente'
                },
                {
                  title: 'Firma Digital y Sello Profesional',
                  desc: 'Trazo ológrafo y sello para inserción automática en informes',
                  icon: <PenTool className="w-4 h-4" />,
                  color: '#8b5cf6',
                  path: '/signature-stamp',
                  badge: systemDiagnostics.hasSignature ? 'Lista' : 'Configurar'
                },
                {
                  title: 'Logo e Identidad Corporativa',
                  desc: activeCompany
                    ? `Empresa activa: ${activeCompany.name}`
                    : `${companies.length} empresas registradas • Membrete para reportes`,
                  icon: <ImageIcon className="w-4 h-4" />,
                  color: '#0ea5e9',
                  path: '/logo-settings',
                  badge: systemDiagnostics.hasLogo ? 'Activo' : 'Subir Logo'
                },
                {
                  title: 'Seguridad, Contraseña y 2FA',
                  desc: 'Cambio de clave por correo, biometría y protección de cuenta',
                  icon: <Shield className="w-4 h-4" />,
                  color: '#10b981',
                  path: '/security',
                  badge: 'Protegido'
                },
                {
                  title: 'Trust Center & Privacidad Enterprise',
                  desc: 'Encriptación, políticas de datos y estándares de cumplimiento',
                  icon: <Building2 className="w-4 h-4" />,
                  color: '#f59e0b',
                  path: '/security-trust',
                  badge: 'ISO / SOC2'
                }
              ].map((link) => (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => navigate(link.path)}
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                    padding: '0.8rem 0.95rem',
                    borderRadius: '1rem',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    textAlign: 'left'
                  }}
                  className="w-full flex items-center justify-between gap-2.5 sm:gap-3 cursor-pointer hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${link.color}18`, color: link.color }}
                    >
                      {link.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-xs font-black" style={{ color: 'var(--color-text)' }}>
                          {link.title}
                        </span>
                        <span
                          style={{ backgroundColor: `${link.color}18`, color: link.color }}
                          className="px-2 py-0.5 rounded-full text-[10px] font-black"
                        >
                          {link.badge}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium m-0 mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {link.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                </button>
              ))}
            </div>
          </div>

          {/* 3. DIAGNÓSTICO DE ALMACENAMIENTO Y MANTENIMIENTO */}
          <div
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            className="rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Uso de Almacenamiento Local
              </span>
              <span className="text-[11px] sm:text-xs font-black" style={{ color: 'var(--color-text)' }}>
                {systemDiagnostics.kbUsed} KB / 5,120 KB ({systemDiagnostics.quotaPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden mb-4" style={{ backgroundColor: 'var(--color-background)' }}>
              <div
                style={{
                  width: `${Math.max(4, systemDiagnostics.quotaPercent)}%`,
                  background: 'linear-gradient(90deg, #2563eb, #10b981)'
                }}
                className="h-full rounded-full transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Asistente H&S • Suite v2.4 Enterprise</span>
              </div>
              <button
                type="button"
                onClick={handleResetPreferences}
                style={{
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text-muted)',
                  borderColor: 'var(--color-border)',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '0.65rem',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
                className="text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-85"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar Ajustes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
