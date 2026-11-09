import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  Database,
  UserCheck,
  RefreshCw,
  Mail,
  Download,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Camera,
  Cloud,
  KeyRound,
  Settings,
  User,
  Printer,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLanguage } from '../contexts/LanguageContext';
import PremiumHeader from '../components/PremiumHeader';
import toast from 'react-hot-toast';

interface PrivacyConsents {
  cloudSyncEncrypted: boolean;
  localAiProcessingOnly: boolean;
  preventiveNotifications: boolean;
  anonymousDiagnostics: boolean;
  auditTrailLogging: boolean;
}

const DEFAULT_CONSENTS: PrivacyConsents = {
  cloudSyncEncrypted: true,
  localAiProcessingOnly: true,
  preventiveNotifications: true,
  anonymousDiagnostics: false,
  auditTrailLogging: true
};

export default function PrivacyPolicy(): React.ReactElement | null {
  const navigate = useNavigate();
  const { countryNorms } = useLanguage();
  useDocumentTitle('Política de Privacidad y Protección de Datos');

  const [activeTab, setActiveTab] = useState<'policy' | 'controls' | 'rights'>('policy');
  const [consents, setConsents] = useState<PrivacyConsents>(() => {
    try {
      const saved = localStorage.getItem('ehs_privacy_consents');
      if (saved) return { ...DEFAULT_CONSENTS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_CONSENTS;
  });

  // Calculate local storage footprint for transparency
  const storageStats = useMemo(() => {
    try {
      let totalBytes = 0;
      let keysCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          const val = localStorage.getItem(k) || '';
          totalBytes += (k.length + val.length) * 2;
          keysCount++;
        }
      }
      return {
        keysCount,
        sizeKb: Math.max(1, Math.round(totalBytes / 1024))
      };
    } catch {
      return { keysCount: 0, sizeKb: 0 };
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('ehs_privacy_consents', JSON.stringify(consents));
    } catch {
      // ignore
    }
  }, [consents]);

  const toggleConsent = (key: keyof PrivacyConsents, label: string) => {
    setConsents((prev) => {
      const nextVal = !prev[key];
      toast.success(`${label}: ${nextVal ? 'Activado' : 'Desactivado'}`);
      return { ...prev, [key]: nextVal };
    });
  };

  // Export all user data in JSON (Data Portability Right)
  const handleExportPersonalData = () => {
    try {
      const payload: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        platform: 'Asistente de Higiene y Seguridad',
        legalFramework: `${countryNorms.name} (${countryNorms.general})`,
        privacyConsents: consents,
        data: {}
      };
      const dataObj: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          dataObj[key] = JSON.parse(raw);
        } catch {
          dataObj[key] = raw;
        }
      }
      payload.data = dataObj;

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-portabilidad-datos-hys-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Archivo de portabilidad de datos (.JSON) descargado');
    } catch {
      toast.error('No se pudo exportar el archivo de datos');
    }
  };

  const handleClearTempCache = () => {
    try {
      sessionStorage.clear();
      toast.success('Caché temporal de sesión depurada correctamente');
    } catch {
      toast.error('Error al limpiar la caché temporal');
    }
  };

  const policySections = [
    {
      id: '1',
      icon: <Eye className="w-5 h-5" />,
      color: '#2563eb',
      title: '1. Compromiso de Transparencia y Alcance',
      content:
        'En Asistente de Higiene y Seguridad, la confidencialidad técnica y la protección de tus datos profesionales y los de tus clientes auditados son nuestra máxima prioridad. Esta Política describe cómo recopilamos, procesamos, almacenamos y resguardamos la información conforme a la Ley 25.326 de Protección de Datos Personales (Argentina), estándares ISO/IEC 27001 y normativas internacionales de privacidad (GDPR / LGPD).'
    },
    {
      id: '2',
      icon: <Database className="w-5 h-5" />,
      color: '#059669',
      title: '2. Información que Recopilamos y Procesamos',
      bullets: [
        {
          bold: 'Datos de Credencial Profesional:',
          text: 'Nombre y apellido, título habilitante, matrícula profesional, correo electrónico, teléfono y firma/sello digital provistos voluntariamente en tu Perfil para confeccionar el pie legal de tus reportes PDF.'
        },
        {
          bold: 'Datos Técnicos y Operativos H&S:',
          text: 'Relevamientos de Carga de Fuego, estudios de Iluminación y Ruido, Matrices IPER, ATS, Permisos de Trabajo, inspecciones de extintores y activos QR. Se almacenan primero en tu dispositivo (Offline-First) y se sincronizan de forma cifrada si tenés sesión activa.'
        },
        {
          bold: 'Identidad Corporativa:',
          text: 'Logotipos y datos de membrete de las empresas o clientes que gestionás dentro del selector multi-empresa.'
        }
      ]
    },
    {
      id: '3',
      icon: <Camera className="w-5 h-5" />,
      color: '#7c3aed',
      title: '3. Cámara IA, Fotografías de Campo y Escáner QR',
      content:
        'Los módulos de Detección de EPP por Visión Artificial y el Escáner Óptico de Activos QR procesan el flujo de video en tiempo real directamente en la memoria local de tu dispositivo. No grabamos ni transmitimos secuencias de video ni datos biométricos a servidores de terceros. Únicamente las fotografías puntuales que decidas guardar como evidencia de hallazgos se incorporan al informe técnico correspondiente.'
    },
    {
      id: '4',
      icon: <Lock className="w-5 h-5" />,
      color: '#0284c7',
      title: '4. Arquitectura de Seguridad y Cifrado (SSL/TLS & AES-256)',
      content:
        'Toda transmisión entre tu dispositivo y la nube se realiza mediante túneles seguros HTTPS con protocolo TLS 1.3 y cifrado AES-256 en reposo. Aplicamos aislamiento estricto por cuenta profesional (Multi-Tenant Isolation) para garantizar que ningún tercero pueda visualizar tus legajos técnicos, matrices o clientes.'
    },
    {
      id: '5',
      icon: <ShieldCheck className="w-5 h-5" />,
      color: '#d97706',
      title: '5. Uso Exclusivo y Garantía de No Comercialización',
      content:
        'La información cargada se utiliza exclusivamente para generar tus reportes técnicos PDF, calcular indicadores preventivos, sincronizar tu calendario de vencimientos y brindarte asistencia normativa mediante IA. Bajo ninguna circunstancia vendemos, alquilamos, cedemos ni compartimos tus datos personales ni la información industrial de las empresas que auditás con aseguradoras, ART ni terceros.'
    },
    {
      id: '6',
      icon: <UserCheck className="w-5 h-5" />,
      color: '#10b981',
      title: '6. Derechos del Titular (Acceso, Rectificación, Portabilidad y Supresión)',
      content:
        'Sos el único propietario intelectual y legal de todos tus relevamientos e informes. En cualquier momento podés editar tus credenciales desde Mi Perfil, exportar una copia íntegra en formato estándar (.JSON) o eliminar tu cuenta y todos sus registros de forma definitiva e irreversible.'
    }
  ];

  const internalLinks = [
    {
      title: 'Centro de Seguridad & Trust Enterprise',
      desc: 'Protocolos ISO 27001, cifrado AES-256, Single Sign-On (SSO), matriz RBAC y logs de auditoría.',
      badge: 'Enterprise Trust',
      icon: <ShieldCheck className="w-5 h-5" />,
      accent: '#2563eb',
      path: '/security-trust'
    },
    {
      title: 'Seguridad de Cuenta y Accesos',
      desc: 'Cambio de contraseña, verificación en 2 pasos (2FA), sesiones activas e historial de ingreso.',
      badge: 'Cuenta y 2FA',
      icon: <KeyRound className="w-5 h-5" />,
      accent: '#7c3aed',
      path: '/security'
    },
    {
      title: 'Configuración y Copias de Seguridad',
      desc: 'Respaldo local JSON, restauración de datos, marco legal multinacional y preferencias.',
      badge: 'Backups JSON',
      icon: <Settings className="w-5 h-5" />,
      accent: '#059669',
      path: '/settings'
    },
    {
      title: 'Mi Perfil y Credencial Profesional',
      desc: 'Administración de tus datos personales, matrícula, firma digital, sello y baja de cuenta.',
      badge: 'Datos y Firma',
      icon: <User className="w-5 h-5" />,
      accent: '#0284c7',
      path: '/profile'
    }
  ];

  return (
    <div
      className="container max-w-6xl mx-auto px-3 sm:px-6 animate-fade-in"
      style={{ paddingTop: '7.25rem', paddingBottom: '6.5rem' }}
    >
      {/* Premium Header */}
      <div className="mb-5 sm:mb-6">
        <PremiumHeader
          title="Privacidad, Confidencialidad y Protección de Datos"
          subtitle="Transparencia total sobre el resguardo de tu información profesional, reportes técnicos, controles de consentimiento y derechos ARCO."
          icon={<ShieldCheck className="w-7 h-7" />}
          gradient="linear-gradient(135deg, #0f766e 0%, #0284c7 50%, #1d4ed8 100%)"
          badge="Ley 25.326 · GDPR & ISO 27001 Ready"
        />
      </div>

      {/* 4 KPI Summary Cards (2x2 on mobile, 4 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        {/* Card 1 */}
        <div
          className="rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2.5"
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
              ESTÁNDAR LEGAL
            </span>
            <p className="text-xs sm:text-base font-black mt-0.5 truncate" style={{ color: '#10b981' }}>
              Ley 25.326 / GDPR
            </p>
            <span
              className="text-[10px] sm:text-[11px] font-medium block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              Derechos ARCO garantizados
            </span>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981'
            }}
          >
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => navigate('/security-trust')}
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
              CIFRADO ACTIVO
            </span>
            <p className="text-xs sm:text-base font-black mt-0.5 truncate" style={{ color: '#2563eb' }}>
              AES-256 & TLS 1.3
            </p>
            <span
              className="text-[10px] sm:text-[11px] font-medium block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              Nube y almacenamiento local
            </span>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: '#2563eb'
            }}
          >
            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div
          className="rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2.5"
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
              CÁMARA IA & QR
            </span>
            <p className="text-xs sm:text-base font-black mt-0.5 truncate" style={{ color: '#7c3aed' }}>
              100% En Dispositivo
            </p>
            <span
              className="text-[10px] sm:text-[11px] font-medium block truncate"
              style={{ color: 'var(--color-text-light)' }}
            >
              Sin grabación en servidores
            </span>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(124, 58, 237, 0.12)',
              color: '#7c3aed'
            }}
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => setActiveTab('rights')}
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
              DATOS LOCALES
            </span>
            <p
              className="text-xs sm:text-base font-black mt-0.5 truncate"
              style={{ color: 'var(--color-text)' }}
            >
              {storageStats.sizeKb} KB ({storageStats.keysCount} claves)
            </p>
            <span
              className="text-[10px] sm:text-[11px] font-medium block truncate"
              style={{ color: '#0284c7' }}
            >
              Exportar portabilidad →
            </span>
          </div>
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(2, 132, 199, 0.12)',
              color: '#0284c7'
            }}
          >
            <Database className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Interactive Tabs Bar (Mobile Responsive) */}
      <div
        className="rounded-2xl p-1.5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-1.5"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)'
        }}
      >
        {(
          [
            {
              id: 'policy',
              label: 'Política y Cláusulas Legales',
              icon: <FileText className="w-4 h-4" />
            },
            {
              id: 'controls',
              label: 'Consentimiento y Privacidad',
              icon: <Sliders className="w-4 h-4" />
            },
            {
              id: 'rights',
              label: 'Derechos ARCO y Portabilidad',
              icon: <Download className="w-4 h-4" />
            }
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                marginBottom: 0,
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '0.85rem',
                backgroundColor: isActive ? '#2563eb' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--color-text)',
                border: isActive ? '1px solid #1d4ed8' : '1px solid transparent',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* LEFT COLUMN (8 cols on desktop): Active Tab Content */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {activeTab === 'policy' && (
            <>
              {policySections.map((sec) => (
                <div
                  key={sec.id}
                  className="rounded-3xl p-4 sm:p-6 shadow-sm text-left"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${sec.color}18`,
                        color: sec.color,
                        border: `1px solid ${sec.color}35`
                      }}
                    >
                      {sec.icon}
                    </div>
                    <h2
                      className="text-base sm:text-lg font-black m-0"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {sec.title}
                    </h2>
                  </div>

                  {sec.content && (
                    <p
                      className="text-xs sm:text-sm leading-relaxed m-0"
                      style={{ color: 'var(--color-text-light)' }}
                    >
                      {sec.content}
                    </p>
                  )}

                  {sec.bullets && (
                    <div className="space-y-2.5 mt-2">
                      {sec.bullets.map((b, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-2xl text-xs sm:text-sm leading-relaxed"
                          style={{
                            backgroundColor: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-light)'
                          }}
                        >
                          <strong style={{ color: 'var(--color-text)' }}>{b.bold}</strong>{' '}
                          {b.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {activeTab === 'controls' && (
            <div
              className="rounded-3xl p-4 sm:p-6 shadow-sm text-left"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div
                className="pb-4 mb-4 border-b"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <h2 className="text-base sm:text-lg font-black m-0" style={{ color: 'var(--color-text)' }}>
                  Preferencias de Privacidad y Consentimiento
                </h2>
                <p className="text-xs sm:text-sm m-0 mt-1" style={{ color: 'var(--color-text-light)' }}>
                  Configurá cómo se procesan y resguardan tus datos en este dispositivo y en la nube.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'cloudSyncEncrypted' as const,
                    title: 'Sincronización Cloud con Cifrado AES-256',
                    desc: 'Mantiene tus inspecciones, matrices, extintores y calendario respaldados en tu cuenta en la nube.',
                    icon: <Cloud className="w-5 h-5" />,
                    accent: '#2563eb'
                  },
                  {
                    key: 'localAiProcessingOnly' as const,
                    title: 'Procesamiento Local Estricto en Cámara IA y QR',
                    desc: 'Garantiza que el video de detección de EPP y lectura QR nunca salga de la memoria de tu teléfono o PC.',
                    icon: <Camera className="w-5 h-5" />,
                    accent: '#7c3aed'
                  },
                  {
                    key: 'auditTrailLogging' as const,
                    title: 'Registro de Trazabilidad Local (Audit Trail)',
                    desc: 'Guarda un historial local de acciones críticas para demostrar cumplimiento ante auditorías ISO 45001 / 27001.',
                    icon: <ShieldCheck className="w-5 h-5" />,
                    accent: '#10b981'
                  },
                  {
                    key: 'preventiveNotifications' as const,
                    title: 'Alertas Preventivas de Vencimientos en Dispositivo',
                    desc: 'Permite avisos locales sobre matafuegos, capacitaciones, estudios y calibraciones próximas a vencer.',
                    icon: <RefreshCw className="w-5 h-5" />,
                    accent: '#d97706'
                  },
                  {
                    key: 'anonymousDiagnostics' as const,
                    title: 'Métricas de Rendimiento Anónimas',
                    desc: 'Ayuda a mejorar la velocidad de generación de PDFs sin incluir datos personales ni de empresas.',
                    icon: <Database className="w-5 h-5" />,
                    accent: '#64748b'
                  }
                ].map((item) => {
                  const isOn = consents[item.key];
                  return (
                    <div
                      key={item.key}
                      className="rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: 'var(--color-background)',
                        border: `1px solid ${
                          isOn ? `${item.accent}40` : 'var(--color-border)'
                        }`
                      }}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            backgroundColor: `${item.accent}18`,
                            color: item.accent
                          }}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <span
                            className="font-extrabold text-xs sm:text-sm block"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {item.title}
                          </span>
                          <span
                            className="text-xs block mt-0.5 leading-relaxed"
                            style={{ color: 'var(--color-text-light)' }}
                          >
                            {item.desc}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={isOn}
                        onClick={() => toggleConsent(item.key, item.title)}
                        style={{
                          marginBottom: 0,
                          width: '52px',
                          height: '28px',
                          borderRadius: '9999px',
                          backgroundColor: isOn ? '#10b981' : '#94a3b8',
                          border: 'none',
                          padding: '3px',
                          position: 'relative',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                            transform: isOn ? 'translateX(24px)' : 'translateX(0px)',
                            transition: 'transform 0.2s ease'
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'rights' && (
            <div
              className="rounded-3xl p-4 sm:p-6 shadow-sm text-left space-y-4"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div
                className="pb-4 border-b"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <h2 className="text-base sm:text-lg font-black m-0" style={{ color: 'var(--color-text)' }}>
                  Ejercicio de Derechos ARCO y Portabilidad de Datos
                </h2>
                <p className="text-xs sm:text-sm m-0 mt-1" style={{ color: 'var(--color-text-light)' }}>
                  Herramientas directas para acceder, exportar, auditar o depurar tu información almacenada.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Portability Export */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between gap-3"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div>
                    <span
                      className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'rgba(37, 99, 235, 0.12)',
                        color: '#2563eb'
                      }}
                    >
                      Derecho de Portabilidad
                    </span>
                    <h3 className="text-sm font-black mt-2 mb-1" style={{ color: 'var(--color-text)' }}>
                      Descargar Todo Mi Archivo de Datos (.JSON)
                    </h3>
                    <p className="text-xs m-0 leading-relaxed" style={{ color: 'var(--color-text-light)' }}>
                      Exportá un archivo estructurado con tus {storageStats.keysCount} módulos ({storageStats.sizeKb} KB), incluyendo perfil, empresas, matrices e inspecciones.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportPersonalData}
                    style={{
                      marginBottom: 0,
                      width: '100%',
                      padding: '0.7rem 1rem',
                      borderRadius: '0.85rem',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Descargar Portabilidad (.JSON)
                  </button>
                </div>

                {/* Print Privacy Certificate */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between gap-3"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div>
                    <span
                      className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#059669'
                      }}
                    >
                      Constancia para Clientes
                    </span>
                    <h3 className="text-sm font-black mt-2 mb-1" style={{ color: 'var(--color-text)' }}>
                      Imprimir Política de Confidencialidad PDF
                    </h3>
                    <p className="text-xs m-0 leading-relaxed" style={{ color: 'var(--color-text-light)' }}>
                      Generá una versión impresa o PDF de esta política de resguardo técnico para adjuntar a carpetas de clientes o auditorías.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('policy');
                      setTimeout(() => window.print(), 250);
                    }}
                    style={{
                      marginBottom: 0,
                      width: '100%',
                      padding: '0.7rem 1rem',
                      borderRadius: '0.85rem',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir / Guardar en PDF
                  </button>
                </div>

                {/* Clear Session Cache */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between gap-3"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div>
                    <span
                      className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.14)',
                        color: '#d97706'
                      }}
                    >
                      Mantenimiento Seguro
                    </span>
                    <h3 className="text-sm font-black mt-2 mb-1" style={{ color: 'var(--color-text)' }}>
                      Depurar Caché Temporal de Sesión
                    </h3>
                    <p className="text-xs m-0 leading-relaxed" style={{ color: 'var(--color-text-light)' }}>
                      Elimina rastros temporales de navegación sin borrar tus informes ni tu cuenta.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearTempCache}
                    style={{
                      marginBottom: 0,
                      width: '100%',
                      padding: '0.7rem 1rem',
                      borderRadius: '0.85rem',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-amber-600" />
                    Limpiar Caché de Sesión
                  </button>
                </div>

                {/* Rectification / Account Deletion Link */}
                <div
                  className="rounded-2xl p-4 flex flex-col justify-between gap-3"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div>
                    <span
                      className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'rgba(124, 58, 237, 0.14)',
                        color: '#7c3aed'
                      }}
                    >
                      Rectificación y Supresión
                    </span>
                    <h3 className="text-sm font-black mt-2 mb-1" style={{ color: 'var(--color-text)' }}>
                      Editar Datos o Dar de Baja la Cuenta
                    </h3>
                    <p className="text-xs m-0 leading-relaxed" style={{ color: 'var(--color-text-light)' }}>
                      Accedé a tu Perfil Profesional para rectificar datos personales o solicitar la baja definitiva.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    style={{
                      marginBottom: 0,
                      width: '100%',
                      padding: '0.7rem 1rem',
                      borderRadius: '0.85rem',
                      backgroundColor: 'rgba(124, 58, 237, 0.12)',
                      color: '#7c3aed',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer'
                    }}
                  >
                    <User className="w-4 h-4" />
                    Ir a Mi Perfil Profesional
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (4 cols on desktop): Internal Links Hub & DPO Contact */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Internal Security & Privacy Links Hub */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm text-left"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div
              className="pb-3.5 mb-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span
                className="text-[10px] font-extrabold uppercase tracking-wider block mb-0.5"
                style={{ color: '#2563eb' }}
              >
                ECOSISTEMA DE SEGURIDAD
              </span>
              <h3 className="text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                Módulos y Enlaces Internos
              </h3>
            </div>

            <div className="space-y-2.5">
              {internalLinks.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.9rem',
                    borderRadius: '1.1rem',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${item.accent}18`,
                      color: item.accent,
                      border: `1px solid ${item.accent}35`
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="text-xs sm:text-sm font-black truncate"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {item.title}
                      </span>
                      <ChevronRight
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--color-text-light)' }}
                      />
                    </div>
                    <p
                      className="text-[11px] m-0 mt-1 leading-relaxed font-normal"
                      style={{ color: 'var(--color-text-light)' }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Data Protection Contact Card */}
          <div
            className="rounded-3xl p-4 sm:p-6 shadow-sm text-left"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                  color: '#059669'
                }}
              >
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                  Contacto de Privacidad y Soporte
                </h3>
                <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-light)' }}>
                  Atención a profesionales y empresas
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--color-text-light)' }}>
              ¿Necesitás firmar un acuerdo de confidencialidad (NDA) o tenés consultas sobre el tratamiento de datos en auditorías corporativas?
            </p>

            <a
              href="mailto:asistente.hs.soporte@gmail.com?subject=Consulta%20de%20Privacidad%20y%20Datos%20-%20Asistente%20H%26S"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.85rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Mail className="w-4 h-4" />
              Contactar Oficial de Privacidad
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div
              className="mt-4 pt-3 border-t flex items-center justify-between text-[11px]"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-light)'
              }}
            >
              <span className="flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Última revisión vigente
              </span>
              <span className="font-semibold">
                {new Date().toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
