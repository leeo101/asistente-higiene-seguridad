import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Clock, ShieldAlert } from 'lucide-react';
import { usePaywall } from '../hooks/usePaywall';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionRenewalBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isPro, isAdmin, daysRemaining, isExpiringSoon, isExpired, expiryDate } = usePaywall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('dismissed_renewal_banner') === 'true';
    setDismissed(isDismissed);
  }, []);

  if (!currentUser || isAdmin || dismissed || location.pathname === '/subscribe' || location.pathname === '/login') {
    return null;
  }

  const shouldShow = isExpiringSoon || (isExpired && !isPro);

  if (!shouldShow) return null;

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    sessionStorage.setItem('dismissed_renewal_banner', 'true');
    setDismissed(true);
  };

  const formattedExpiry = expiryDate
    ? expiryDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'próximamente';

  return (
    <div
      className="no-print w-full z-[9990] px-3 sm:px-6"
      style={{
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '5.5rem',
        paddingBottom: '0.25rem'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '980px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
          border: '1.5px solid rgba(245, 158, 11, 0.7)',
          borderRadius: '18px',
          padding: '14px 18px',
          boxShadow: '0 16px 32px -8px rgba(0,0,0,0.45)'
        }}
        className="flex flex-col sm:flex-row items-center justify-between gap-3.5"
      >
        {/* Icono y Texto */}
        <div className="flex items-center gap-3 w-full sm:w-auto text-left">
          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#fbbf24',
              borderRadius: '12px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {isExpiringSoon ? <Clock size={22} color="#fbbf24" /> : <ShieldAlert size={22} color="#f87171" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 900 }}>
                {isExpiringSoon ? '⚠️ ¡Tu Suscripción PRO vence pronto!' : '🚨 Suscripción PRO Inactiva / Vencida'}
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.22)',
                  color: '#fef3c7',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase'
                }}
              >
                {isExpiringSoon ? `${daysRemaining} días restantes` : 'Renovación requerida'}
              </span>
            </div>

            <p style={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
              {isExpiringSoon ? (
                <>
                  Vence el <strong style={{ color: '#fbbf24' }}>{formattedExpiry}</strong>. Renová ahora por{' '}
                  <strong style={{ color: '#fbbf24' }}>$2 USD/mes</strong> para mantener reportes con tu logo y Asesor IA.
                </>
              ) : (
                <>
                  Activá tu plan Profesional PRO por solo <strong style={{ color: '#fbbf24' }}>$2 USD/mes</strong> para exportar PDFs con tu logo y usar IA ilimitada.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-center sm:justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/subscribe');
            }}
            style={{
              marginBottom: 0,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#0f172a',
              fontWeight: 900,
              fontSize: '0.8rem',
              padding: '0.6rem 1rem',
              borderRadius: '11px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
            }}
          >
            <Sparkles size={15} /> Ver Suscripción <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            title="Cerrar aviso por esta sesión"
            style={{
              marginBottom: 0,
              backgroundColor: '#334155',
              color: '#ffffff',
              border: '1px solid #64748b',
              borderRadius: '9999px',
              width: '36px',
              height: '36px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 900,
              flexShrink: 0
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
