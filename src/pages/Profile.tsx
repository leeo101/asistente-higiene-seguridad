import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  PenTool,
  Shield,
  LogOut,
  ChevronRight,
  Trash2,
  Share2,
  Copy,
  Check,
  CreditCard,
  CheckCircle2,
  Image as ImageIcon,
  Award,
  Mail,
  Phone,
  MapPin,
  Download,
  Edit3,
  Sparkles,
  FileCheck,
  Building2,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { useCompany } from '../contexts/CompanyContext';
import toast from 'react-hot-toast';
import { safeGetLocalStorage } from '../utils/storageHelper';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getCountryNormativa } from '../data/legislationData';
import { useLanguage } from '../contexts/LanguageContext';
import PremiumHeader from '../components/PremiumHeader';

interface PersonalProfileData {
  name: string;
  email: string;
  dni: string;
  license: string;
  phone: string;
  address: string;
  country: string;
  photo: string | null;
  profession: string;
  college?: string;
  specialty?: string;
}

export default function Profile(): React.ReactElement | null {
  const navigate = useNavigate();
  const { isPro, daysRemaining } = usePaywall();
  const { currentUser, logout, deleteAccount } = useAuth();
  const { activeCompany } = useCompany();
  const { selectedFramework } = useLanguage();
  useDocumentTitle('Mi Perfil Profesional');

  const [linkCopied, setLinkCopied] = useState(false);
  const [signatureCopied, setSignatureCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [userData, setUserData] = useState<PersonalProfileData>({
    name: currentUser?.displayName || 'Profesional H&S',
    email: currentUser?.email || '',
    dni: '',
    license: '',
    phone: '',
    address: '',
    country: selectedFramework || 'argentina',
    photo: null,
    profession: 'Licenciado en Higiene y Seguridad en el Trabajo',
    college: '',
    specialty: 'Seguridad Industrial y Prevención de Riesgos'
  });

  const [signatureData, setSignatureData] = useState<{ signature: string | null; stamp: string | null }>({
    signature: null,
    stamp: null
  });
  const [hasCompanyLogo, setHasCompanyLogo] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parsed = safeGetLocalStorage<any>('personalData', null);
      if (parsed) {
        setUserData((prev) => ({
          ...prev,
          ...parsed,
          name: parsed.name || currentUser?.displayName || 'Profesional H&S',
          email: parsed.email || currentUser?.email || '',
          country: selectedFramework || parsed.country || 'argentina'
        }));
      } else if (currentUser) {
        setUserData((prev) => ({
          ...prev,
          name: currentUser.displayName || prev.name,
          email: currentUser.email || prev.email,
          country: selectedFramework || prev.country
        }));
      }

      // Check signature & stamp
      try {
        const rawSig = localStorage.getItem('signatureStampData');
        if (rawSig) {
          const trimmed = rawSig.trim();
          if (trimmed.startsWith('data:')) {
            setSignatureData({ signature: trimmed, stamp: null });
          } else {
            const parsedSig = JSON.parse(trimmed);
            setSignatureData({
              signature: parsedSig?.signature || null,
              stamp: parsedSig?.stamp || null
            });
          }
        }
      } catch {
        // ignore
      }

      // Check company logo
      const rawLogo = localStorage.getItem('companyLogo');
      setHasCompanyLogo(Boolean(rawLogo && rawLogo !== 'null' && rawLogo !== 'undefined'));
    }
  }, [currentUser, selectedFramework]);

  const countryNorms = getCountryNormativa(userData.country || 'argentina');

  // Calculate profile completeness percentage
  const completenessFields = [
    Boolean(userData.name && userData.name !== 'Usuario'),
    Boolean(userData.profession),
    Boolean(userData.license && userData.license !== '---'),
    Boolean(userData.dni),
    Boolean(userData.email),
    Boolean(userData.phone),
    Boolean(userData.photo),
    Boolean(signatureData.signature || signatureData.stamp)
  ];
  const completenessPct = Math.round(
    (completenessFields.filter(Boolean).length / completenessFields.length) * 100
  );

  const menuItems = [
    {
      id: 'data',
      label: 'Datos Personales y Matrícula',
      desc: 'Nombre, título habilitante, matrícula profesional, DNI y contacto',
      badge: userData.license ? `Mat. ${userData.license}` : 'Completar ficha',
      badgeColor: userData.license ? '#10b981' : '#f59e0b',
      icon: <User className="w-6 h-6" />,
      accent: '#2563eb',
      path: '/personal-data'
    },
    {
      id: 'signature',
      label: 'Firma y Sello Digital',
      desc: 'Pizarra táctil, generador automático de sello profesional y carga PNG',
      badge:
        signatureData.signature && signatureData.stamp
          ? 'Firma y Sello Activos'
          : signatureData.signature || signatureData.stamp
          ? 'Parcialmente cargado'
          : 'Sin configurar',
      badgeColor:
        signatureData.signature && signatureData.stamp
          ? '#10b981'
          : signatureData.signature || signatureData.stamp
          ? '#3b82f6'
          : '#f59e0b',
      icon: <PenTool className="w-6 h-6" />,
      accent: '#7c3aed',
      path: '/signature-stamp'
    },
    {
      id: 'logo',
      label: 'Logo e Identidad Corporativa',
      desc: 'Logotipo de empresa, escudo H&S, paleta de colores y membrete A4',
      badge: hasCompanyLogo ? 'Logo Configurado' : 'Personalizar PDF',
      badgeColor: hasCompanyLogo ? '#10b981' : '#0284c7',
      icon: <ImageIcon className="w-6 h-6" />,
      accent: '#0284c7',
      path: '/logo-settings'
    },
    {
      id: 'subscription',
      label: 'Suscripción y Membresía PRO',
      desc: 'Estado de tu licencia, facturación y desbloqueo de herramientas IA',
      badge: isPro ? 'Plan PRO Activo' : 'Plan Básico',
      badgeColor: isPro ? '#10b981' : '#d97706',
      icon: <CreditCard className="w-6 h-6" />,
      accent: '#d97706',
      path: '/subscribe'
    },
    {
      id: 'settings',
      label: 'Configuración del Sistema',
      desc: 'Modo claro/oscuro/alto contraste, idioma, legislación y backups JSON',
      badge: `${countryNorms.flag} ${countryNorms.name}`,
      badgeColor: '#059669',
      icon: <Settings className="w-6 h-6" />,
      accent: '#059669',
      path: '/settings'
    },
    {
      id: 'security',
      label: 'Seguridad y Privacidad',
      desc: 'Cambio de contraseña, sesiones activas, 2FA y auditoría de accesos',
      badge: 'Cuenta Protegida',
      badgeColor: '#4f46e5',
      icon: <Shield className="w-6 h-6" />,
      accent: '#4f46e5',
      path: '/security'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada correctamente');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR') {
      toast.error('Escribí ELIMINAR para confirmar la baja definitiva');
      return;
    }
    try {
      await deleteAccount();
      localStorage.clear();
      toast.success('Cuenta eliminada permanentemente.');
      navigate('/login');
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      toast.error('Por seguridad, volvé a iniciar sesión antes de eliminar la cuenta.');
    }
  };

  const downloadVCard = () => {
    const vcf = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${userData.name || 'Profesional H&S'}`,
      `TITLE:${userData.profession || 'Especialista en Higiene y Seguridad'}`,
      `ORG:${activeCompany?.name || 'Consultora de Higiene y Seguridad'}`,
      userData.phone ? `TEL;TYPE=CELL:${userData.phone}` : '',
      userData.email ? `EMAIL;TYPE=INTERNET:${userData.email}` : '',
      userData.address ? `ADR;TYPE=WORK:;;${userData.address};;;;` : '',
      `NOTE:Matrícula Profesional: ${userData.license || 'S/D'} | DNI: ${userData.dni || 'S/D'}`,
      'END:VCARD'
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credencial-${(userData.name || 'profesional').toLowerCase().replace(/\s+/g, '-')}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Tarjeta de contacto (.VCF) descargada');
  };

  const copyEmailSignature = () => {
    const sigText = `${userData.name || 'Profesional H&S'}\n${
      userData.profession || 'Especialista en Higiene y Seguridad'
    }\nMatrícula: ${userData.license || '---'}${
      userData.college ? ` (${userData.college})` : ''
    }\nTel: ${userData.phone || '---'} | Email: ${userData.email || '---'}`;
    navigator.clipboard.writeText(sigText).catch(() => {});
    setSignatureCopied(true);
    toast.success('Pie de firma copiado al portapapeles');
    setTimeout(() => setSignatureCopied(false), 2500);
  };

  return (
    <div
      className="container max-w-6xl mx-auto px-3 sm:px-6 animate-fade-in"
      style={{ paddingTop: '7.25rem', paddingBottom: '6.5rem' }}
    >
      {/* Premium Header */}
      <div className="mb-5 sm:mb-6">
        <PremiumHeader
          title="Mi Perfil y Credencial Profesional"
          subtitle="Administrá tus datos personales, matrícula habilitante, firma y sello digital, suscripción y seguridad de cuenta."
          icon={<User className="w-7 h-7" />}
          gradient="linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #4f46e5 100%)"
          badge={isPro ? 'Credencial PRO Verificada' : `Perfil al ${completenessPct}%`}
        />
      </div>

      {/* 4 KPI Summary Cards (2x2 on mobile, 4 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        {/* KPI 1: Profile Completeness */}
        <div
          onClick={() => navigate('/personal-data')}
          className="rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2.5 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="min-w-0 text-left">
            <span
              className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              FICHA PROFESIONAL
            </span>
            <p
              className="text-xs sm:text-base font-black mt-0.5 truncate"
              style={{ color: completenessPct >= 75 ? '#10b981' : '#2563eb' }}
            >
              {completenessPct}% Completa
            </p>
            <span
              className="text-[10px] sm:text-[11px] font-medium block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              {userData.license ? `Mat: ${userData.license}` : 'Falta matrícula'}
            </span>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: '#2563eb'
            }}
          >
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* KPI 2: Signature & Stamp */}
        <div
          onClick={() => navigate('/signature-stamp')}
          className="rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2.5 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="min-w-0 text-left">
            <span
              className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              FIRMA Y SELLO
            </span>
            <p
              className="text-xs sm:text-base font-black mt-0.5 truncate"
              style={{
                color:
                  signatureData.signature && signatureData.stamp
                    ? '#10b981'
                    : signatureData.signature || signatureData.stamp
                    ? '#3b82f6'
                    : '#f59e0b'
              }}
            >
              {signatureData.signature && signatureData.stamp
                ? 'Ambos Activos'
                : signatureData.signature
                ? 'Solo Firma'
                : signatureData.stamp
                ? 'Solo Sello'
                : 'Sin Configurar'}
            </p>
            <span
              className="text-[10px] sm:text-[11px] font-medium block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              Estampado en PDFs
            </span>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(124, 58, 237, 0.12)',
              color: '#7c3aed'
            }}
          >
            <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* KPI 3: Plan Status */}
        <div
          onClick={() => navigate('/subscribe')}
          className="rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2.5 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="min-w-0 text-left">
            <span
              className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              MEMBRESÍA
            </span>
            <p
              className="text-xs sm:text-base font-black mt-0.5 truncate"
              style={{ color: isPro ? '#10b981' : '#d97706' }}
            >
              {isPro ? 'Versión PRO' : 'Plan Básico'}
            </p>
            <span
              className="text-[10px] sm:text-[11px] font-medium block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              {isPro
                ? daysRemaining === Infinity
                  ? 'Licencia vitalicia'
                  : `${daysRemaining} días activos`
                : 'Tocá para mejorar'}
            </span>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: isPro ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: isPro ? '#10b981' : '#d97706'
            }}
          >
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* KPI 4: Jurisdiction */}
        <div
          onClick={() => navigate('/settings')}
          className="rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2.5 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="min-w-0 text-left">
            <span
              className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              MARCO LEGAL
            </span>
            <p
              className="text-xs sm:text-base font-black mt-0.5 truncate"
              style={{ color: 'var(--color-text)' }}
            >
              {countryNorms.flag} {countryNorms.name}
            </p>
            <span
              className="text-[10px] sm:text-[11px] font-medium block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              {countryNorms.general}
            </span>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(14, 165, 233, 0.12)',
              color: '#0284c7'
            }}
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Main Responsive Grid: Left (Digital ID Card) + Right (6 Profile Selections) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* LEFT COLUMN (5 cols on desktop): Digital Professional ID Card */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div
            className="rounded-3xl overflow-hidden shadow-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            {/* Top Banner of ID Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #0284c7 100%)',
                padding: '1.25rem 1.25rem 3.25rem 1.25rem',
                position: 'relative'
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Credencial H&S Oficial
                </span>
                <span
                  style={{
                    backgroundColor: isPro ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.35)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isPro ? 'PRO Verificado' : 'Activo'}
                </span>
              </div>
            </div>

            {/* Avatar & Identity Info */}
            <div className="px-4 sm:px-6 pb-5 -mt-12 relative z-10 text-center">
              <div
                onClick={() => navigate('/personal-data')}
                className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden shadow-lg cursor-pointer relative"
                style={{
                  background: userData.photo
                    ? '#ffffff'
                    : 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                  border: '4px solid var(--color-surface)',
                  color: '#ffffff',
                  fontSize: '2.2rem',
                  fontWeight: 900
                }}
                title="Hacé clic para cambiar tu foto"
              >
                {userData.photo ? (
                  <img
                    src={userData.photo}
                    alt="Foto de Perfil"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (userData.name || 'P').charAt(0).toUpperCase()
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black m-0" style={{ color: 'var(--color-text)' }}>
                {userData.name || 'Profesional H&S'}
              </h2>
              <p className="text-xs sm:text-sm font-bold mt-1 mb-2" style={{ color: '#2563eb' }}>
                {userData.profession || 'Especialista en Higiene y Seguridad'}
              </p>

              {/* License & DNI Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                <span
                  className="text-xs font-extrabold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  Matrícula: {userData.license || 'Sin cargar'}
                </span>
                {userData.dni && (
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text-light)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    DNI / ID: {userData.dni}
                  </span>
                )}
              </div>

              {/* Contact Info List */}
              <div
                className="rounded-2xl p-3.5 text-left space-y-2 mb-4"
                style={{
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center gap-2.5 text-xs">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate font-semibold" style={{ color: 'var(--color-text)' }}>
                    {userData.email || currentUser?.email || 'Sin correo configurado'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate font-semibold" style={{ color: 'var(--color-text)' }}>
                    {userData.phone || 'Sin teléfono registrado'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate font-semibold" style={{ color: 'var(--color-text)' }}>
                    {userData.address || `${countryNorms.name} (${countryNorms.general})`}
                  </span>
                </div>
                {activeCompany && (
                  <div className="flex items-center gap-2.5 text-xs">
                    <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="truncate font-semibold" style={{ color: 'var(--color-text)' }}>
                      Empresa activa: {activeCompany.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Mini Preview of Signature & Stamp on Card */}
              <div
                onClick={() => navigate('/signature-stamp')}
                className="rounded-2xl p-3 mb-4 cursor-pointer text-left"
                style={{
                  backgroundColor: 'var(--color-background)',
                  border: '1px dashed var(--color-border)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    Vista Rápida de Firma y Sello
                  </span>
                  <span className="text-[11px] font-bold text-blue-600">Editar →</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="h-14 rounded-xl flex items-center justify-center p-1.5 border"
                    style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
                  >
                    {signatureData.signature ? (
                      <img
                        src={signatureData.signature}
                        alt="Firma"
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">Sin Firma</span>
                    )}
                  </div>
                  <div
                    className="h-14 rounded-xl flex items-center justify-center p-1.5 border"
                    style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
                  >
                    {signatureData.stamp ? (
                      <img
                        src={signatureData.stamp}
                        alt="Sello"
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">Sin Sello</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons on Credential Card */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/personal-data')}
                  className="col-span-2"
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.7rem 1rem',
                    borderRadius: '0.85rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: '1px solid #1d4ed8',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Datos Personales
                </button>

                <button
                  type="button"
                  onClick={downloadVCard}
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Guardar vCard
                </button>

                <button
                  type="button"
                  onClick={copyEmailSignature}
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.75rem',
                    backgroundColor: signatureCopied
                      ? 'rgba(16, 185, 129, 0.14)'
                      : 'var(--color-background)',
                    color: signatureCopied ? '#059669' : 'var(--color-text)',
                    border: `1px solid ${
                      signatureCopied ? 'rgba(16, 185, 129, 0.4)' : 'var(--color-border)'
                    }`,
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                >
                  {signatureCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copiada
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-3.5 h-3.5" />
                      Copiar Firma
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* PRO Upgrade Banner if not PRO */}
          {!isPro && (
            <div
              className="rounded-3xl p-4 sm:p-5 text-left"
              style={{
                background:
                  'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                border: '1px solid rgba(37, 99, 235, 0.28)'
              }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                    Potenciá tu Perfil a Versión PRO
                  </h3>
                  <span className="text-[11px] font-bold text-blue-600">
                    Informes ilimitados + Firma y Logo en PDF + IA
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-3.5" style={{ color: 'var(--color-text-light)' }}>
                Desbloqueá la exportación de PDFs oficiales con tu matrícula, firma digital, sello y logo corporativo sin restricciones.
              </p>
              <button
                type="button"
                onClick={() => navigate('/subscribe')}
                style={{
                  marginBottom: 0,
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.85rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(37, 99, 235, 0.3)'
                }}
              >
                <CreditCard className="w-4 h-4" />
                Activar Versión PRO
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (7 cols on desktop): 6 Profile Selections + Share & Account Actions */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* 6 Selections Grid */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="text-left">
                <h2 className="text-base sm:text-lg font-black m-0" style={{ color: 'var(--color-text)' }}>
                  Secciones y Ajustes de tu Perfil
                </h2>
                <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--color-text-light)' }}>
                  Seleccioná cualquier módulo para configurar tus credenciales y preferencias.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="group text-left"
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '1.15rem',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${item.accent}18`,
                        color: item.accent,
                        border: `1px solid ${item.accent}35`
                      }}
                    >
                      {item.icon}
                    </div>

                    <span
                      className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full truncate max-w-[140px]"
                      style={{
                        backgroundColor: `${item.badgeColor}18`,
                        color: item.badgeColor,
                        border: `1px solid ${item.badgeColor}35`
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <div className="w-full">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="font-black text-sm sm:text-base truncate"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {item.label}
                      </span>
                      <ChevronRight
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--color-text-light)' }}
                      />
                    </div>
                    <p
                      className="text-xs m-0 mt-1 line-clamp-2 leading-relaxed font-normal"
                      style={{ color: 'var(--color-text-light)' }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Share with a Colleague Card */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm text-left"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black m-0" style={{ color: 'var(--color-text)' }}>
                  Recomendar a un Colega H&S
                </h3>
                <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--color-text-light)' }}>
                  Compartí Asistente H&S con otros prevencionistas o integrantes de tu equipo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `🛡️ ¡Hola! Te comparto esta plataforma para profesionales de Higiene y Seguridad.\n\n*Asistente H&S* permite:\n🔥 Carga de Fuego (${countryNorms.fire})\n💡 Estudios de Iluminación y Ruido\n📋 Matrices IPER, ATS y Checklists con QR\n🤖 Consultar IA legal\n\n🔗 https://asistentehs.com`
                )}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.85rem',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                }}
              >
                <Share2 className="w-4 h-4 shrink-0" />
                Compartir por WhatsApp
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('https://asistentehs.com').catch(() => {});
                  setLinkCopied(true);
                  toast.success('Enlace copiado al portapapeles');
                  setTimeout(() => setLinkCopied(false), 2500);
                }}
                style={{
                  marginBottom: 0,
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.85rem',
                  backgroundColor: linkCopied
                    ? 'rgba(16, 185, 129, 0.14)'
                    : 'var(--color-background)',
                  color: linkCopied ? '#059669' : 'var(--color-text)',
                  border: `1px solid ${
                    linkCopied ? 'rgba(16, 185, 129, 0.4)' : 'var(--color-border)'
                  }`,
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {linkCopied ? '¡Enlace Copiado!' : 'Copiar Link de Invitación'}
              </button>
            </div>
          </div>

          {/* Session & Account Management Card */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  marginBottom: 0,
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '0.9rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión Actual
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal((prev) => !prev)}
                style={{
                  marginBottom: 0,
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '0.9rem',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text-light)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer'
                }}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                Eliminar Cuenta Permanentemente
              </button>
            </div>

            {showDeleteModal && (
              <div
                className="mt-4 p-4 rounded-2xl text-left"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <p className="text-xs sm:text-sm font-bold text-red-600 m-0 mb-2">
                  ⚠️ Atención: Esta acción borrará permanentemente tu cuenta y todos tus datos locales.
                </p>
                <p className="text-xs m-0 mb-3" style={{ color: 'var(--color-text)' }}>
                  Para confirmar, escribí <strong>ELIMINAR</strong> en el siguiente campo:
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Escribí ELIMINAR"
                    style={{
                      marginBottom: 0,
                      flex: 1,
                      minWidth: '160px',
                      padding: '0.55rem 0.8rem',
                      borderRadius: '0.65rem',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    style={{
                      marginBottom: 0,
                      width: 'auto',
                      padding: '0.55rem 1rem',
                      borderRadius: '0.65rem',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Confirmar Baja
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
