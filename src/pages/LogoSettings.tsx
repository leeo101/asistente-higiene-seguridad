import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Palette,
  FileText,
  Download,
  Building2,
  Eye,
  EyeOff,
  Wand2,
  Sliders,
  Check,
  Printer
} from 'lucide-react';
import { usePaywall } from '../hooks/usePaywall';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { saveValue, listenToValue } from '../services/cloudSync';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';

interface CorporateBrandingMeta {
  headerTitle: string;
  headerSubtitle: string;
  taxId: string;
  footerText: string;
  logoScale: 'compact' | 'standard' | 'large';
  logoAlign: 'left' | 'center' | 'right';
  showHeaderAccentBar: boolean;
  showWatermark: boolean;
}

const DEFAULT_BRANDING_META: CorporateBrandingMeta = {
  headerTitle: 'Departamento de Higiene y Seguridad',
  headerSubtitle: 'Gestión Preventiva y Cumplimiento Normativo',
  taxId: '30-71458920-4',
  footerText: 'Documento Técnico Oficial — Generado por Asistente H&S Profesional',
  logoScale: 'standard',
  logoAlign: 'left',
  showHeaderAccentBar: true,
  showWatermark: false,
};

const PRESET_PALETTES = [
  { name: 'Océano Corporativo', primary: '#2563EB', secondary: '#10B981', badge: 'Clásico' },
  { name: 'Seguridad Vial', primary: '#EA580C', secondary: '#F59E0B', badge: 'Alto Impacto' },
  { name: 'Ingeniería Industrial', primary: '#059669', secondary: '#0284C7', badge: 'Planta' },
  { name: 'Prevención Crítica', primary: '#DC2626', secondary: '#D97706', badge: 'Emergencias' },
  { name: 'Consultora Premium', primary: '#7C3AED', secondary: '#06B6D4', badge: 'Ejecutivo' },
  { name: 'Acero Estructural', primary: '#334155', secondary: '#0EA5E9', badge: 'Sobrio' },
  { name: 'Bioseguridad', primary: '#0D9488', secondary: '#6366F1', badge: 'Salud' },
  { name: 'Energía & Minería', primary: '#B45309', secondary: '#16A34A', badge: 'Campo' },
];

export default function LogoSettings(): React.ReactElement | null {
  const navigate = useNavigate();
  const { isPro } = usePaywall();
  const { currentUser } = useAuth();
  const { activeCompany, updateCompany } = useCompany();
  useDocumentTitle('Logo e Identidad Corporativa');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [logo, setLogo] = useState<string | null>(null);
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [primaryColor, setPrimaryColor] = useState<string>('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState<string>('#10B981');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [previewBg, setPreviewBg] = useState<'white' | 'grid' | 'dark'>('white');
  const [brandingMeta, setBrandingMeta] = useState<CorporateBrandingMeta>(() => {
    try {
      const saved = localStorage.getItem('ehs_corporate_branding');
      if (saved) {
        return { ...DEFAULT_BRANDING_META, ...JSON.parse(saved) };
      }
    } catch {
      // ignore parse error
    }
    return DEFAULT_BRANDING_META;
  });

  // Load saved values from localStorage and Cloud Sync
  useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    const savedShowLogo = localStorage.getItem('showCompanyLogo');
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    const savedSecondaryColor = localStorage.getItem('secondaryColor');

    if (savedLogo && savedLogo !== 'null' && savedLogo !== 'undefined') {
      setLogo(savedLogo);
    } else if (activeCompany?.logo) {
      setLogo(activeCompany.logo);
    }

    if (savedShowLogo !== null) {
      setShowLogo(savedShowLogo !== 'false');
    }
    if (savedPrimaryColor) setPrimaryColor(savedPrimaryColor);
    if (savedSecondaryColor) setSecondaryColor(savedSecondaryColor);

    if (currentUser?.uid) {
      const unsubscribeLogo = listenToValue<string>(currentUser.uid, 'companyLogo', (val) => {
        if (val && val !== 'null' && val !== 'undefined') {
          setLogo(val);
          localStorage.setItem('companyLogo', val);
        } else {
          setLogo(null);
          localStorage.removeItem('companyLogo');
        }
      });
      const unsubscribeShow = listenToValue<boolean>(currentUser.uid, 'showCompanyLogo', (val) => {
        const normalized = val === null ? true : Boolean(val);
        setShowLogo(normalized);
        localStorage.setItem('showCompanyLogo', String(normalized));
      });
      const unsubscribePrimary = listenToValue<string>(currentUser.uid, 'primaryColor', (val) => {
        if (val) {
          setPrimaryColor(val);
          localStorage.setItem('primaryColor', val);
        }
      });
      const unsubscribeSecondary = listenToValue<string>(currentUser.uid, 'secondaryColor', (val) => {
        if (val) {
          setSecondaryColor(val);
          localStorage.setItem('secondaryColor', val);
        }
      });
      return () => {
        unsubscribeLogo();
        unsubscribeShow();
        unsubscribePrimary();
        unsubscribeSecondary();
      };
    }
  }, [currentUser, activeCompany?.id]);

  // Sync active company fields into branding preview if available
  useEffect(() => {
    if (activeCompany) {
      setBrandingMeta((prev) => ({
        ...prev,
        headerTitle: activeCompany.name || prev.headerTitle,
        taxId: activeCompany.cuit || prev.taxId,
        headerSubtitle: activeCompany.activity || prev.headerSubtitle,
      }));
    }
  }, [activeCompany?.id]);

  const saveBrandingMeta = (updates: Partial<CorporateBrandingMeta>) => {
    setBrandingMeta((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('ehs_corporate_branding', JSON.stringify(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  const persistLogo = (base64: string) => {
    setLogo(base64);
    localStorage.setItem('companyLogo', base64);
    if (currentUser?.uid) {
      saveValue(currentUser.uid, 'companyLogo', base64);
    }
    if (activeCompany) {
      updateCompany(activeCompany.id, { logo: base64 });
    }
  };

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    if (!file.type.startsWith('image/')) {
      toast.error('Subí un archivo de imagen válido (PNG, JPG, SVG o WEBP)');
      setIsUploading(false);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2 MB');
      setIsUploading(false);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      persistLogo(base64);
      setIsUploading(false);
      toast.success('Logo corporativo actualizado correctamente');
    };
    reader.onerror = () => {
      toast.error('Error al procesar el archivo de imagen');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const removeLogo = () => {
    setLogo(null);
    localStorage.removeItem('companyLogo');
    if (currentUser?.uid) {
      saveValue(currentUser.uid, 'companyLogo', null);
    }
    if (activeCompany) {
      updateCompany(activeCompany.id, { logo: undefined });
    }
    toast.success('Logo eliminado del sistema');
  };

  const toggleShowLogo = () => {
    const newValue = !showLogo;
    setShowLogo(newValue);
    localStorage.setItem('showCompanyLogo', String(newValue));
    if (currentUser?.uid) {
      saveValue(currentUser.uid, 'showCompanyLogo', newValue);
    }
    toast.success(newValue ? 'Logo activado en todos los PDFs' : 'Logo ocultado temporalmente en PDFs');
  };

  const handleColorChange = (type: 'primary' | 'secondary', value: string) => {
    if (type === 'primary') {
      setPrimaryColor(value);
      localStorage.setItem('primaryColor', value);
      if (currentUser?.uid) saveValue(currentUser.uid, 'primaryColor', value);
    } else {
      setSecondaryColor(value);
      localStorage.setItem('secondaryColor', value);
      if (currentUser?.uid) saveValue(currentUser.uid, 'secondaryColor', value);
    }
  };

  const resetColors = () => {
    const defPrimary = '#2563EB';
    const defSecondary = '#10B981';
    setPrimaryColor(defPrimary);
    setSecondaryColor(defSecondary);
    localStorage.setItem('primaryColor', defPrimary);
    localStorage.setItem('secondaryColor', defSecondary);
    if (currentUser?.uid) {
      saveValue(currentUser.uid, 'primaryColor', defPrimary);
      saveValue(currentUser.uid, 'secondaryColor', defSecondary);
    }
    toast.success('Colores corporativos restablecidos');
  };

  const applyPalette = (palette: typeof PRESET_PALETTES[0]) => {
    handleColorChange('primary', palette.primary);
    handleColorChange('secondary', palette.secondary);
    toast.success(`Paleta "${palette.name}" aplicada`);
  };

  // Generate an instant high-res corporate monogram/shield SVG data URL if user has no file handy
  const generateCorporateMonogram = () => {
    const companyName = activeCompany?.name || brandingMeta.headerTitle || 'H&S';
    const words = companyName
      .replace(/[^a-zA-Z0-9ÁÉÍÓÚÑáéíóúñ\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const initials =
      words.length >= 2
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : (words[0]?.slice(0, 3) || 'HYS').toUpperCase();

    const shortTitle = companyName.length > 24 ? `${companyName.slice(0, 22)}...` : companyName;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="140" viewBox="0 0 460 140">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primaryColor}" />
          <stop offset="100%" stop-color="${secondaryColor}" />
        </linearGradient>
      </defs>
      <rect x="8" y="12" width="116" height="116" rx="28" fill="url(#grad)" />
      <path d="M66 32 L98 46 L98 74 C98 96 84 110 66 116 C48 110 34 96 34 74 L34 46 Z" fill="rgba(255,255,255,0.18)" stroke="#ffffff" stroke-width="3"/>
      <text x="66" y="83" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="900" fill="#ffffff" text-anchor="middle">${initials}</text>
      <text x="142" y="64" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="900" fill="#0f172a">${shortTitle}</text>
      <text x="142" y="92" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700" fill="${primaryColor}" letter-spacing="1.2">HIGIENE Y SEGURIDAD LABORAL</text>
      <rect x="142" y="104" width="95" height="6" rx="3" fill="${secondaryColor}" />
    </svg>`;

    const base64Svg = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    persistLogo(base64Svg);
    toast.success('Escudo corporativo generado y aplicado');
  };

  const downloadCurrentLogo = () => {
    if (!logo) return;
    const link = document.createElement('a');
    link.href = logo;
    link.download = `logo-corporativo-${(activeCompany?.name || 'hys').toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Descargando logo corporativo...');
  };

  const activePaletteName =
    PRESET_PALETTES.find(
      (p) =>
        p.primary.toLowerCase() === primaryColor.toLowerCase() &&
        p.secondary.toLowerCase() === secondaryColor.toLowerCase()
    )?.name || 'Personalizada';

  const logoSizeKb = logo ? Math.max(1, Math.round((logo.length * 0.75) / 1024)) : 0;

  const logoHeightPx =
    brandingMeta.logoScale === 'compact' ? 38 : brandingMeta.logoScale === 'large' ? 62 : 48;

  return (
    <div
      className="container max-w-6xl mx-auto px-3 sm:px-6 animate-fade-in"
      style={{ paddingTop: '7.25rem', paddingBottom: '6.5rem' }}
    >
      {/* Hidden File Input — strictly hidden so global input CSS never renders it */}
      <input
        ref={fileInputRef}
        id="logo-file-input"
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
        style={{
          display: 'none',
          width: 0,
          height: 0,
          opacity: 0,
          position: 'absolute',
          pointerEvents: 'none',
        }}
      />

      {/* Premium Header with valid CSS linear-gradient */}
      <div className="mb-5 sm:mb-6">
        <PremiumHeader
          title="Logo de Empresa e Identidad Visual"
          subtitle="Configurá el logotipo oficial, membrete técnico y paleta de colores para todos tus reportes PDF, checklists y certificados."
          icon={<ImageIcon className="w-7 h-7" />}
          gradient="linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4338ca 100%)"
          badge={isPro ? 'Identidad PRO Activa' : 'Personalización Corporativa'}
        />
      </div>

      {/* 4 KPI Status Cards (2x2 on mobile, 4 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        {/* Card 1: Logo Status */}
        <div
          className="rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2.5"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="min-w-0">
            <span
              className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              ESTADO DEL LOGO
            </span>
            <p
              className="text-xs sm:text-base font-black mt-0.5 truncate"
              style={{ color: logo ? '#10b981' : '#f59e0b' }}
            >
              {logo ? 'Cargado y Activo' : 'Sin Cargar'}
            </p>
            <span
              className="text-[10px] sm:text-[11px] font-medium block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              {logo ? `Peso aprox: ${logoSizeKb} KB` : 'Subí PNG/SVG o generá'}
            </span>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: logo ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: logo ? '#10b981' : '#f59e0b',
            }}
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Card 2: PDF Visibility */}
        <div
          className="rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2.5"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="min-w-0">
            <span
              className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              MEMBRETE EN PDF
            </span>
            <p
              className="text-xs sm:text-base font-black mt-0.5 truncate"
              style={{ color: showLogo ? '#2563eb' : 'var(--color-text-light)' }}
            >
              {showLogo ? 'Visible en Reportes' : 'Oculto en PDFs'}
            </p>
            <span
              className="text-[10px] sm:text-[11px] font-medium block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              {showLogo ? 'Se imprime en cabecera' : 'Impresión desactivada'}
            </span>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: showLogo ? 'rgba(37, 99, 235, 0.12)' : 'rgba(148, 163, 184, 0.15)',
              color: showLogo ? '#2563eb' : '#64748b',
            }}
          >
            {showLogo ? (
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </div>
        </div>

        {/* Card 3: Active Palette */}
        <div
          className="rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2.5"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="min-w-0">
            <span
              className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              PALETA ACTIVA
            </span>
            <p
              className="text-xs sm:text-base font-black mt-0.5 truncate"
              style={{ color: 'var(--color-text)' }}
            >
              {activePaletteName}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full inline-block border border-black/10"
                style={{ backgroundColor: primaryColor }}
              />
              <span
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full inline-block border border-black/10"
                style={{ backgroundColor: secondaryColor }}
              />
              <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--color-text-light)' }}>
                {primaryColor.toUpperCase()}
              </span>
            </div>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}22, ${secondaryColor}22)`,
              color: primaryColor,
              border: `1px solid ${primaryColor}40`,
            }}
          >
            <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Card 4: Active Company Sync */}
        <div
          className="rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2.5"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="min-w-0">
            <span
              className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              EMPRESA VINCULADA
            </span>
            <p
              className="text-xs sm:text-base font-black mt-0.5 truncate"
              style={{ color: 'var(--color-text)' }}
            >
              {activeCompany ? activeCompany.name : 'Global (Consultora)'}
            </p>
            <span
              className="text-[10px] sm:text-[11px] font-medium block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              {activeCompany?.cuit ? `CUIT: ${activeCompany.cuit}` : 'Todos los módulos'}
            </span>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
            }}
          >
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* LEFT COLUMN (7 cols on desktop): Logo Upload & Corporate Branding */}
        <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
          {/* 1. LOGO UPLOAD & PREVIEW CARD */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Card Header: flex-wrap guarantees side-by-side on desktop and clean wrap on mobile */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(14, 165, 233, 0.15))',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                    color: '#2563eb',
                  }}
                >
                  <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 text-left">
                  <h2 className="text-base sm:text-lg font-black m-0 truncate" style={{ color: 'var(--color-text)' }}>
                    Logotipo Oficial de Empresa
                  </h2>
                  <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--color-text-light)' }}>
                    Se estampa en la cabecera de todos los informes PDF y matrices.
                  </p>
                </div>
              </div>

              {/* Instant Monogram Generator Button */}
              <button
                type="button"
                onClick={generateCorporateMonogram}
                style={{
                  marginBottom: 0,
                  width: 'auto',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  color: '#7c3aed',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Wand2 className="w-4 h-4 shrink-0" />
                Generar Escudo H&S
              </button>
            </div>

            {logo ? (
              <div className="flex flex-col gap-4">
                {/* Preview Container using CSS Grid (1 col on mobile, 12 cols on tablet/desktop) */}
                <div
                  className="rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-center"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {/* Logo Canvas Box (5 cols on desktop) */}
                  <div className="md:col-span-5 flex flex-col items-center gap-2.5">
                    <div
                      className="w-full h-36 sm:h-40 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden shadow-inner"
                      style={{
                        backgroundColor:
                          previewBg === 'dark'
                            ? '#0f172a'
                            : previewBg === 'grid'
                            ? '#f8fafc'
                            : '#ffffff',
                        backgroundImage:
                          previewBg === 'grid'
                            ? 'radial-gradient(#cbd5e1 1px, transparent 1px)'
                            : 'none',
                        backgroundSize: previewBg === 'grid' ? '12px 12px' : 'auto',
                        border: '2px solid var(--color-border)',
                      }}
                    >
                      <img
                        src={logo}
                        alt="Logo Corporativo"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>

                    {/* Background Switcher to test transparency */}
                    <div className="flex items-center gap-1.5 w-full justify-center flex-wrap">
                      <span
                        className="text-[10px] font-bold uppercase mr-0.5"
                        style={{ color: 'var(--color-text-light)' }}
                      >
                        Fondo:
                      </span>
                      {(
                        [
                          { id: 'white', label: 'Blanco' },
                          { id: 'grid', label: 'Transp.' },
                          { id: 'dark', label: 'Oscuro' },
                        ] as const
                      ).map((bgOpt) => (
                        <button
                          key={bgOpt.id}
                          type="button"
                          onClick={() => setPreviewBg(bgOpt.id)}
                          style={{
                            marginBottom: 0,
                            width: 'auto',
                            padding: '0.22rem 0.55rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor:
                              previewBg === bgOpt.id ? '#2563eb' : 'var(--color-surface)',
                            color: previewBg === bgOpt.id ? '#ffffff' : 'var(--color-text)',
                            border: `1px solid ${
                              previewBg === bgOpt.id ? '#2563eb' : 'var(--color-border)'
                            }`,
                            cursor: 'pointer',
                          }}
                        >
                          {bgOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Info & Action Buttons (7 cols on desktop) */}
                  <div className="md:col-span-7 flex flex-col justify-between text-left">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold"
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.14)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Logo Optimizado para Impresión
                        </span>
                      </div>
                      <p
                        className="text-xs sm:text-sm leading-relaxed mb-4"
                        style={{ color: 'var(--color-text-light)' }}
                      >
                        Tu logotipo está listo y sincronizado. Podés ajustar su escala en el membrete o reemplazar la imagen en cualquier momento.
                      </p>
                    </div>

                    {/* Responsive Action Buttons: 2 cols on mobile, 3 cols on sm+ */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="col-span-2 sm:col-span-1"
                        style={{
                          marginBottom: 0,
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '0.85rem',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: '1px solid #1d4ed8',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                        }}
                      >
                        <Upload className="w-4 h-4 shrink-0" />
                        Cambiar
                      </button>

                      <button
                        type="button"
                        onClick={downloadCurrentLogo}
                        style={{
                          marginBottom: 0,
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '0.85rem',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                          border: '1px solid var(--color-border)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        Descargar
                      </button>

                      <button
                        type="button"
                        onClick={removeLogo}
                        style={{
                          marginBottom: 0,
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '0.85rem',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                        }}
                      >
                        <X className="w-4 h-4 shrink-0" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scale & Position Controls */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <label
                      className="text-[11px] font-extrabold uppercase tracking-wider block mb-1.5"
                      style={{ color: 'var(--color-text-light)' }}
                    >
                      Tamaño del Logo en PDF
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'compact', label: 'Compacto' },
                          { id: 'standard', label: 'Estándar' },
                          { id: 'large', label: 'Destacado' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => saveBrandingMeta({ logoScale: opt.id })}
                          style={{
                            marginBottom: 0,
                            width: '100%',
                            padding: '0.45rem 0.4rem',
                            borderRadius: '0.65rem',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            backgroundColor:
                              brandingMeta.logoScale === opt.id
                                ? '#2563eb'
                                : 'var(--color-surface)',
                            color:
                              brandingMeta.logoScale === opt.id
                                ? '#ffffff'
                                : 'var(--color-text)',
                            border: `1px solid ${
                              brandingMeta.logoScale === opt.id
                                ? '#2563eb'
                                : 'var(--color-border)'
                            }`,
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      className="text-[11px] font-extrabold uppercase tracking-wider block mb-1.5"
                      style={{ color: 'var(--color-text-light)' }}
                    >
                      Posición en Encabezado
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'left', label: 'Izquierda' },
                          { id: 'center', label: 'Centro' },
                          { id: 'right', label: 'Derecha' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => saveBrandingMeta({ logoAlign: opt.id })}
                          style={{
                            marginBottom: 0,
                            width: '100%',
                            padding: '0.45rem 0.4rem',
                            borderRadius: '0.65rem',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            backgroundColor:
                              brandingMeta.logoAlign === opt.id
                                ? '#2563eb'
                                : 'var(--color-surface)',
                            color:
                              brandingMeta.logoAlign === opt.id
                                ? '#ffffff'
                                : 'var(--color-text)',
                            border: `1px solid ${
                              brandingMeta.logoAlign === opt.id
                                ? '#2563eb'
                                : 'var(--color-border)'
                            }`,
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* High-Contrast Drag & Drop Zone */
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl p-5 sm:p-8 text-center flex flex-col items-center justify-center gap-3.5 transition-all"
                style={{
                  backgroundColor: dragActive
                    ? 'rgba(37, 99, 235, 0.08)'
                    : 'var(--color-background)',
                  border: `2px dashed ${dragActive ? '#2563eb' : 'var(--color-border)'}`,
                  cursor: isUploading ? 'wait' : 'pointer',
                }}
              >
                <div
                  className="w-14 h-14 sm:w-18 sm:h-18 rounded-full flex items-center justify-center shadow-sm"
                  style={{
                    backgroundColor: dragActive
                      ? 'rgba(37, 99, 235, 0.15)'
                      : 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                  }}
                >
                  {isUploading ? (
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  ) : (
                    <Upload className="w-7 h-7" />
                  )}
                </div>

                <div className="max-w-md">
                  <h3 className="text-sm sm:text-base font-black mb-1" style={{ color: 'var(--color-text)' }}>
                    {dragActive ? '¡Soltá la imagen acá!' : 'Tocá para subir el logo de tu empresa'}
                  </h3>
                  <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--color-text-light)' }}>
                    Arrastrá una imagen o hacé clic para buscar en tu galería o archivos. Recomendamos PNG o SVG transparente.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-0.5">
                  {['PNG Transparente', 'JPG / JPEG', 'SVG Vectorial', 'Máx. 2 MB'].map((fmt) => (
                    <span
                      key={fmt}
                      className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {fmt}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  style={{
                    marginBottom: 0,
                    marginTop: '0.25rem',
                    width: 'auto',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '0.85rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: '1px solid #1d4ed8',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <Upload className="w-4 h-4" />
                  Seleccionar Archivo de Logo
                </button>
              </div>
            )}

            {/* Toggle Visibility Bar (Always visible & High Contrast) */}
            <div
              className="mt-4 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3"
              style={{
                backgroundColor: showLogo
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'var(--color-background)',
                border: `1px solid ${
                  showLogo ? 'rgba(16, 185, 129, 0.3)' : 'var(--color-border)'
                }`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: showLogo
                      ? 'rgba(16, 185, 129, 0.18)'
                      : 'rgba(148, 163, 184, 0.2)',
                    color: showLogo ? '#059669' : '#64748b',
                  }}
                >
                  {showLogo ? <ShieldCheck className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </div>
                <div className="min-w-0 text-left">
                  <span
                    className="block font-extrabold text-xs sm:text-sm truncate"
                    style={{ color: showLogo ? '#059669' : 'var(--color-text)' }}
                  >
                    {showLogo ? 'Logo visible en documentos PDF' : 'Logo oculto temporalmente'}
                  </span>
                  <span className="block text-[11px] sm:text-xs truncate" style={{ color: 'var(--color-text-light)' }}>
                    {showLogo
                      ? 'Se imprimirá automáticamente en cada reporte generado.'
                      : 'Los reportes saldrán sin logotipo en el encabezado.'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={showLogo}
                onClick={toggleShowLogo}
                style={{
                  marginBottom: 0,
                  width: '54px',
                  height: '30px',
                  borderRadius: '9999px',
                  backgroundColor: showLogo ? '#10b981' : '#94a3b8',
                  border: 'none',
                  padding: '3px',
                  position: 'relative',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background-color 0.25s ease',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                    transform: showLogo ? 'translateX(24px)' : 'translateX(0px)',
                    transition: 'transform 0.25s ease',
                  }}
                />
              </button>
            </div>
          </div>

          {/* 2. CORPORATE COLORS & PALETTES CARD */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}25)`,
                    border: `1px solid ${primaryColor}45`,
                    color: primaryColor,
                  }}
                >
                  <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 text-left">
                  <h2 className="text-base sm:text-lg font-black m-0 truncate" style={{ color: 'var(--color-text)' }}>
                    Colores Corporativos y Paletas
                  </h2>
                  <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--color-text-light)' }}>
                    Personalizá los tonos de encabezados, líneas divisoras y sellos en tus reportes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetColors}
                style={{
                  marginBottom: 0,
                  width: 'auto',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restablecer
              </button>
            </div>

            {/* Primary & Secondary Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
              {(
                [
                  {
                    label: 'Color Primario Institucional',
                    type: 'primary' as const,
                    value: primaryColor,
                    desc: 'Títulos, franjas de membrete y bordes principales.',
                  },
                  {
                    label: 'Color Secundario / Acento',
                    type: 'secondary' as const,
                    value: secondaryColor,
                    desc: 'Indicadores de aprobación, badges e íconos.',
                  },
                ]
              ).map(({ label, type, value, desc }) => (
                <div
                  key={type}
                  className="rounded-2xl p-3.5 sm:p-4 text-left"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <span
                    className="text-[11px] font-extrabold uppercase tracking-wider block mb-2.5"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    {label}
                  </span>

                  <div className="flex items-center gap-3 mb-2">
                    <label
                      className="w-12 h-12 rounded-2xl shrink-0 cursor-pointer relative overflow-hidden shadow-md flex items-center justify-center mb-0"
                      style={{
                        backgroundColor: value,
                        border: '2px solid rgba(255,255,255,0.6)',
                        boxShadow: `0 6px 16px ${value}40`,
                      }}
                      title="Hacé clic para elegir un color"
                    >
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => handleColorChange(type, e.target.value)}
                        style={{
                          opacity: 0,
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer',
                          border: 'none',
                          padding: 0,
                          margin: 0,
                        }}
                      />
                    </label>

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={value.toUpperCase()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                            if (val.length === 7) handleColorChange(type, val);
                            else if (type === 'primary') setPrimaryColor(val);
                            else setSecondaryColor(val);
                          }
                        }}
                        style={{
                          marginBottom: 0,
                          width: '100%',
                          padding: '0.4rem 0.65rem',
                          borderRadius: '0.6rem',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                          border: '1px solid var(--color-border)',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                        }}
                      />
                      <span className="text-[11px] block mt-1" style={{ color: 'var(--color-text-light)' }}>
                        Tocá el color o editá el código HEX
                      </span>
                    </div>
                  </div>

                  <p className="text-xs m-0" style={{ color: 'var(--color-text-light)' }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Preset Palettes Grid (2 cols on mobile, 4 cols on desktop) */}
            <div className="text-left">
              <span
                className="text-[11px] font-extrabold uppercase tracking-wider block mb-2.5"
                style={{ color: 'var(--color-text-light)' }}
              >
                Paletas Profesionales Recomendadas
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PRESET_PALETTES.map((palette) => {
                  const isSelected =
                    primaryColor.toLowerCase() === palette.primary.toLowerCase() &&
                    secondaryColor.toLowerCase() === palette.secondary.toLowerCase();

                  return (
                    <button
                      key={palette.name}
                      type="button"
                      onClick={() => applyPalette(palette)}
                      style={{
                        marginBottom: 0,
                        width: '100%',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '0.9rem',
                        backgroundColor: isSelected
                          ? palette.primary
                          : 'var(--color-background)',
                        color: isSelected ? '#ffffff' : 'var(--color-text)',
                        border: `2px solid ${
                          isSelected ? palette.primary : 'var(--color-border)'
                        }`,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '0.4rem',
                        textAlign: 'left',
                        boxShadow: isSelected
                          ? `0 6px 16px ${palette.primary}35`
                          : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <span
                            className="w-4 h-4 rounded-l-full inline-block border border-white/30"
                            style={{ backgroundColor: palette.primary }}
                          />
                          <span
                            className="w-4 h-4 rounded-r-full inline-block border border-white/30"
                            style={{ backgroundColor: palette.secondary }}
                          />
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                      </div>

                      <div className="w-full">
                        <span className="block text-xs font-extrabold truncate">
                          {palette.name}
                        </span>
                        <span
                          className="block text-[10px] font-semibold truncate"
                          style={{
                            color: isSelected
                              ? 'rgba(255,255,255,0.85)'
                              : 'var(--color-text-light)',
                          }}
                        >
                          {palette.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. CORPORATE HEADER & FOOTER TEXT CONFIGURATION */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              className="flex items-center gap-3 pb-4 mb-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <Sliders className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-left">
                <h2 className="text-base sm:text-lg font-black m-0 truncate" style={{ color: 'var(--color-text)' }}>
                  Textos de Membrete y Pie de Página
                </h2>
                <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--color-text-light)' }}>
                  Personalizá la leyenda institucional que acompaña a tu logo en los encabezados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--color-text)' }}>
                  Título Principal / Razón Social
                </label>
                <input
                  type="text"
                  value={brandingMeta.headerTitle}
                  onChange={(e) => saveBrandingMeta({ headerTitle: e.target.value })}
                  placeholder="Ej: Consultora H&S Integral S.A."
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--color-text)' }}>
                  CUIT / Identificación Fiscal
                </label>
                <input
                  type="text"
                  value={brandingMeta.taxId}
                  onChange={(e) => saveBrandingMeta({ taxId: e.target.value })}
                  placeholder="Ej: 30-71458920-4"
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--color-text)' }}>
                  Subtítulo / Área Técnica
                </label>
                <input
                  type="text"
                  value={brandingMeta.headerSubtitle}
                  onChange={(e) => saveBrandingMeta({ headerSubtitle: e.target.value })}
                  placeholder="Ej: Departamento de Higiene, Seguridad y Medio Ambiente"
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--color-text)' }}>
                  Leyenda de Pie de Página en Reportes
                </label>
                <input
                  type="text"
                  value={brandingMeta.footerText}
                  onChange={(e) => saveBrandingMeta({ footerText: e.target.value })}
                  placeholder="Ej: Documento confidencial - Ley 19.587 de Higiene y Seguridad en el Trabajo"
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols on desktop): Live Interactive PDF Document Preview */}
        <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
          {/* LIVE A4 REPORT HEADER PREVIEW */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm lg:sticky lg:top-28"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              className="flex items-center justify-between gap-2 pb-4 mb-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563eb',
                  }}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 text-left">
                  <h3 className="text-sm sm:text-base font-black m-0 truncate" style={{ color: 'var(--color-text)' }}>
                    Vista Previa de Membrete PDF
                  </h3>
                  <p className="text-[11px] sm:text-xs m-0 truncate" style={{ color: 'var(--color-text-light)' }}>
                    Simulación en tiempo real de tus documentos A4
                  </p>
                </div>
              </div>

              <span
                className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shrink-0"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                  color: '#059669',
                }}
              >
                En Vivo
              </span>
            </div>

            {/* Simulated A4 Paper Sheet (Always crisp white paper like a real PDF) */}
            <div
              className="rounded-2xl overflow-hidden shadow-lg border mx-auto"
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                borderColor: '#cbd5e1',
              }}
            >
              {/* Top Accent Bar */}
              {brandingMeta.showHeaderAccentBar && (
                <div
                  style={{
                    height: '8px',
                    background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                  }}
                />
              )}

              <div className="p-3.5 sm:p-5">
                {/* PDF Header Box */}
                <div
                  className="pb-3.5 mb-3.5 border-b-2 flex flex-col gap-2.5"
                  style={{
                    borderColor: primaryColor,
                    alignItems:
                      brandingMeta.logoAlign === 'center'
                        ? 'center'
                        : brandingMeta.logoAlign === 'right'
                        ? 'flex-end'
                        : 'stretch',
                  }}
                >
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2.5 ${
                      brandingMeta.logoAlign === 'right'
                        ? 'flex-row-reverse'
                        : brandingMeta.logoAlign === 'center'
                        ? 'flex-col text-center'
                        : 'flex-row'
                    }`}
                  >
                    {/* Logo in Header */}
                    {showLogo && logo ? (
                      <img
                        src={logo}
                        alt="Logo en PDF"
                        style={{
                          height: `${logoHeightPx}px`,
                          maxWidth: '150px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <div
                        className="px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold border border-dashed shrink-0"
                        style={{
                          borderColor: '#cbd5e1',
                          color: '#64748b',
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        {showLogo ? 'Sin Logo Cargado' : 'Logo Oculto'}
                      </div>
                    )}

                    {/* Corporate Text Block */}
                    <div
                      className={`min-w-0 ${
                        brandingMeta.logoAlign === 'center'
                          ? 'text-center'
                          : brandingMeta.logoAlign === 'right'
                          ? 'text-left'
                          : 'text-right'
                      }`}
                    >
                      <div
                        className="text-[11px] sm:text-xs font-black uppercase tracking-tight break-words"
                        style={{ color: '#0f172a' }}
                      >
                        {brandingMeta.headerTitle || 'Nombre de Empresa'}
                      </div>
                      <div
                        className="text-[10px] sm:text-[11px] font-bold break-words"
                        style={{ color: primaryColor }}
                      >
                        {brandingMeta.headerSubtitle || 'Higiene y Seguridad Laboral'}
                      </div>
                      {brandingMeta.taxId && (
                        <div className="text-[9px] sm:text-[10px] font-mono" style={{ color: '#64748b' }}>
                          ID / CUIT: {brandingMeta.taxId}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Simulated Document Body */}
                <div className="space-y-3 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span
                      className="text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${primaryColor}18`,
                        color: primaryColor,
                      }}
                    >
                      INFORME TÉCNICO OFICIAL #0042
                    </span>
                    <span
                      className="text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${secondaryColor}20`,
                        color: secondaryColor,
                      }}
                    >
                      APROBADO / VIGENTE
                    </span>
                  </div>

                  <div
                    className="p-2.5 rounded-xl border"
                    style={{
                      backgroundColor: '#f8fafc',
                      borderColor: '#e2e8f0',
                    }}
                  >
                    <div className="text-[11px] font-extrabold mb-1" style={{ color: '#1e293b' }}>
                      1. Relevamiento de Condiciones de Seguridad
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 rounded bg-slate-200 w-full" />
                      <div className="h-2 rounded bg-slate-200 w-5/6" />
                      <div className="h-2 rounded bg-slate-200 w-4/6" />
                    </div>
                  </div>

                  {/* Simulated Metrics Bar using Primary & Secondary Colors */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
                    <div
                      className="p-1.5 sm:p-2 rounded-lg text-center border"
                      style={{
                        backgroundColor: `${primaryColor}0D`,
                        borderColor: `${primaryColor}30`,
                      }}
                    >
                      <span className="block text-[8px] sm:text-[9px] font-bold uppercase truncate" style={{ color: '#64748b' }}>
                        Cumplimiento
                      </span>
                      <span className="text-[11px] sm:text-xs font-black" style={{ color: primaryColor }}>
                        98.4%
                      </span>
                    </div>
                    <div
                      className="p-1.5 sm:p-2 rounded-lg text-center border"
                      style={{
                        backgroundColor: `${secondaryColor}0D`,
                        borderColor: `${secondaryColor}30`,
                      }}
                    >
                      <span className="block text-[8px] sm:text-[9px] font-bold uppercase truncate" style={{ color: '#64748b' }}>
                        Riesgo Global
                      </span>
                      <span className="text-[10px] sm:text-xs font-black" style={{ color: secondaryColor }}>
                        CONTROLADO
                      </span>
                    </div>
                    <div
                      className="p-1.5 sm:p-2 rounded-lg text-center border"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderColor: '#e2e8f0',
                      }}
                    >
                      <span className="block text-[8px] sm:text-[9px] font-bold uppercase truncate" style={{ color: '#64748b' }}>
                        Validez
                      </span>
                      <span className="text-[11px] sm:text-xs font-black" style={{ color: '#0f172a' }}>
                        12 Meses
                      </span>
                    </div>
                  </div>

                  {/* Simulated Footer */}
                  <div
                    className="pt-3 mt-4 border-t flex items-center justify-between gap-2 text-[9px]"
                    style={{
                      borderColor: '#e2e8f0',
                      color: '#64748b',
                    }}
                  >
                    <span className="truncate max-w-[75%] font-medium">
                      {brandingMeta.footerText}
                    </span>
                    <span className="font-bold shrink-0" style={{ color: primaryColor }}>
                      Pág. 1 de 1
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Cards Below Preview */}
            <div className="mt-4 space-y-3 text-left">
              <div
                className="rounded-2xl p-3.5 flex items-start gap-3"
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.07)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                }}
              >
                <Printer className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>
                  <strong>Estampado Automático:</strong> Este membrete se aplica de inmediato en matrices IPER, análisis ATS, inspecciones, carga de fuego, checklists y certificados de capacitación.
                </div>
              </div>

              <div
                className="rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3"
                style={{
                  backgroundColor: isPro
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${
                    isPro ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'
                  }`,
                }}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-[200px]">
                  <Sparkles
                    className="w-5 h-5 shrink-0 mt-0.5"
                    style={{ color: isPro ? '#059669' : '#d97706' }}
                  />
                  <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>
                    <strong>{isPro ? 'Licencia PRO Activa:' : 'Personalización sin límites:'}</strong>{' '}
                    {isPro
                      ? 'Exportación de alta definición sin marcas de agua habilitada en todos tus reportes.'
                      : 'Podés configurar y previsualizar tu logo y colores libremente en el dispositivo.'}
                  </div>
                </div>

                {!isPro && (
                  <button
                    type="button"
                    onClick={() => navigate('/subscribe')}
                    style={{
                      marginBottom: 0,
                      width: 'auto',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.65rem',
                      backgroundColor: '#f59e0b',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Ver PRO
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
