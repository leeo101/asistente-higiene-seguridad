import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Key,
  Fingerprint,
  Smartphone,
  ChevronRight,
  Lock,
  CheckCircle2,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { isError, getErrorMessage } from '../utils/errorUtils';
import PremiumHeader from '../components/PremiumHeader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Security(): React.ReactElement | null {
  useDocumentTitle('Seguridad y Contraseña');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [toggles, setToggles] = useState<{ biometrics: boolean; twoFactor: boolean }>(() => {
    try {
      const saved = localStorage.getItem('ehs_security_toggles');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { biometrics: false, twoFactor: false };
  });

  const [status, setStatus] = useState({
    type: '',
    message: '',
    resetLink: '',
    code: '',
    details: '',
    suggestion: ''
  });

  const toggleFeature = (key: 'biometrics' | 'twoFactor') => {
    setToggles((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('ehs_security_toggles', JSON.stringify(next));
      toast.success(
        `${key === 'biometrics' ? 'Acceso biométrico' : 'Doble factor (2FA)'} ${
          next[key] ? 'activado' : 'desactivado'
        }`
      );
      return next;
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Enviando enlace seguro...', resetLink: '', code: '', details: '', suggestion: '' });

    try {
      const userEmail = currentUser?.email;
      if (!userEmail) throw new Error('Iniciá sesión primero para recuperar o cambiar tu contraseña');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: '¡Enlace enviado con éxito! Revisá tu bandeja de correo electrónico.',
          details: '',
          suggestion: '',
          resetLink: '',
          code: ''
        });

        if (!data.devLink) {
          setTimeout(() => {
            setShowPasswordChange(false);
            setStatus({ type: '', message: '', details: '', suggestion: '', resetLink: '', code: '' });
          }, 3000);
        }
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Error al enviar el enlace de recuperación.',
          details: data.details || '',
          suggestion: data.suggestion || '',
          resetLink: '',
          code: ''
        });
      }
    } catch (error) {
      console.error('[SECURITY] Password reset error:', error);
      const isAbort = isError(error) && error.name === 'AbortError';
      const errorMsg = isAbort ? 'El servidor tardó demasiado en responder.' : 'Error de conexión con el servidor.';
      setStatus({
        type: 'error',
        message: errorMsg,
        details: getErrorMessage(error),
        suggestion: 'Verificá tu conexión a internet o intentá nuevamente en unos instantes.',
        resetLink: '',
        code: ''
      });
    }
  };

  return (
    <div
      className="container max-w-4xl mx-auto px-3 sm:px-4 animate-fade-in"
      style={{ paddingTop: '7.25rem', paddingBottom: '6.5rem' }}
    >
      <div className="mb-4 sm:mb-5">
        <PremiumHeader
          title="Seguridad y Protección de Cuenta"
          subtitle="Gestioná tu contraseña, métodos de autenticación y parámetros de seguridad de tu sesión."
          icon={<Shield size={32} className="text-emerald-400" />}
        />
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => (showPasswordChange ? setShowPasswordChange(false) : navigate('/settings'))}
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            borderColor: 'var(--color-border)',
            padding: '0.55rem 1rem',
            borderRadius: '0.85rem',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
          className="text-xs font-black flex items-center gap-2 cursor-pointer hover:border-blue-500 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          {showPasswordChange ? 'Volver a Opciones de Seguridad' : 'Volver a Configuración'}
        </button>
      </div>

      {!showPasswordChange ? (
        <div className="flex flex-col gap-5">
          {/* ACCESO Y CONTRASEÑA */}
          <div
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            className="rounded-3xl border p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(56,189,248,0.12)', color: '#0284c7' }}
              >
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                  Credenciales y Contraseña
                </h2>
                <p className="text-xs font-medium m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Cuenta activa: {currentUser?.email || 'Modo sin conexión / Invitado'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswordChange(true)}
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
                padding: '1rem 1.25rem',
                borderRadius: '1rem',
                borderWidth: '1px',
                borderStyle: 'solid',
                textAlign: 'left'
              }}
              className="w-full flex items-center justify-between gap-4 cursor-pointer hover:border-blue-500 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(37,99,235,0.12)', color: '#2563eb' }}
                >
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black m-0" style={{ color: 'var(--color-text)' }}>
                    Cambiar o Restablecer Contraseña
                  </p>
                  <p className="text-xs font-medium m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Recibirás un enlace de verificación seguro en tu correo electrónico
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>

          {/* SEGURIDAD AVANZADA */}
          <div
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            className="rounded-3xl border p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                  Seguridad Avanzada del Dispositivo
                </h2>
                <p className="text-xs font-medium m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Protección adicional para el acceso en teléfonos y tablets corporativas
                </p>
              </div>
            </div>

            <div className="flex flex-col divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {[
                {
                  key: 'biometrics' as const,
                  Icon: Fingerprint,
                  title: 'Desbloqueo Biométrico',
                  desc: 'Usar huella digital o reconocimiento facial del dispositivo'
                },
                {
                  key: 'twoFactor' as const,
                  Icon: Lock,
                  title: 'Verificación en Dos Pasos (2FA)',
                  desc: 'Solicitar confirmación adicional al iniciar sesión en un equipo nuevo'
                }
              ].map(({ key, Icon, title, desc }) => {
                const enabled = toggles[key];
                return (
                  <div key={key} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: enabled ? 'rgba(37,99,235,0.12)' : 'var(--color-background)',
                          color: enabled ? '#2563eb' : 'var(--color-text-muted)'
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black m-0" style={{ color: 'var(--color-text)' }}>
                          {title}
                        </p>
                        <p className="text-xs font-medium m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {desc}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => toggleFeature(key)}
                      style={{
                        width: '48px',
                        height: '26px',
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
      ) : (
        <div
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          className="rounded-3xl border p-6 shadow-sm"
        >
          <h2 className="text-lg font-black m-0 mb-2" style={{ color: 'var(--color-text)' }}>
            Cambiar Contraseña de Acceso
          </h2>
          <p className="text-sm font-medium m-0 mb-5 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Por razones de seguridad, enviaremos un enlace verificado a{' '}
            <strong style={{ color: 'var(--color-text)' }}>{currentUser?.email || 'tu correo registrado'}</strong> para
            que puedas establecer tu nueva contraseña.
          </p>

          <form onSubmit={handlePasswordChange}>
            {status.message && (
              <div
                style={{
                  backgroundColor:
                    status.type === 'error'
                      ? 'rgba(239,68,68,0.1)'
                      : status.type === 'success'
                      ? 'rgba(16,185,129,0.1)'
                      : 'rgba(59,130,246,0.1)',
                  color:
                    status.type === 'error'
                      ? '#ef4444'
                      : status.type === 'success'
                      ? '#10b981'
                      : '#2563eb',
                  borderColor:
                    status.type === 'error'
                      ? 'rgba(239,68,68,0.25)'
                      : status.type === 'success'
                      ? 'rgba(16,185,129,0.25)'
                      : 'rgba(59,130,246,0.25)'
                }}
                className="p-4 rounded-2xl border text-xs font-bold mb-4 flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2">
                  {status.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{status.message}</span>
                </div>
                {status.details && <p className="m-0 opacity-80">Detalle: {status.details}</p>}
                {status.suggestion && <p className="m-0">💡 {status.suggestion}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={status.type === 'loading' || status.type === 'success'}
              style={{
                background:
                  status.type === 'success'
                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                    : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                color: '#ffffff',
                padding: '0.9rem 1.25rem',
                borderRadius: '0.85rem',
                border: 'none',
                boxShadow: '0 8px 20px -4px rgba(37,99,235,0.4)'
              }}
              className="w-full font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {status.type === 'loading' ? (
                'Enviando enlace...'
              ) : status.type === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> ¡Enlace Enviado!
                </>
              ) : (
                'Enviar Enlace de Recuperación'
              )}
            </button>
          </form>
        </div>
      )}

      <div
        style={{ backgroundColor: 'rgba(56,189,248,0.06)', borderColor: 'rgba(56,189,248,0.2)' }}
        className="text-center mt-6 p-4 rounded-2xl border"
      >
        <p className="text-xs font-semibold m-0" style={{ color: 'var(--color-text-muted)' }}>
          🔒 Tu seguridad es nuestra prioridad. Todas las comunicaciones y respaldos se transmiten mediante conexiones cifradas TLS.
        </p>
      </div>
    </div>
  );
}
