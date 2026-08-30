import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, X, Clock, ShieldAlert } from 'lucide-react';
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

  // No mostrar en login, registro, o para administradores/cuentas permanentes activos
  if (!currentUser || isAdmin || dismissed || location.pathname === '/subscribe' || location.pathname === '/login') {
    return null;
  }

  // Mostrar si falta poco tiempo (<= 7 días) o si la suscripción está vencida
  const shouldShow = isExpiringSoon || (isExpired && !isPro);

  if (!shouldShow) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('dismissed_renewal_banner', 'true');
    setDismissed(true);
  };

  const formattedExpiry = expiryDate
    ? expiryDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'próximamente';

  return (
    <div className="no-print w-full z-[9990] animate-in fade-in slide-in-from-top-4 duration-300 px-3 sm:px-6 pt-3 pb-2">
      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: '2px solid #f59e0b',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 0 15px rgba(245,158,11,0.2)'
        }}
        className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        {/* Icono y Texto */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            style={{
              backgroundColor: '#b45309',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {isExpiringSoon ? <Clock size={24} className="animate-pulse text-amber-300" /> : <ShieldAlert size={24} className="text-red-400" />}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span style={{ color: '#fbbf24', fontSize: '15px', fontWeight: '900' }}>
                {isExpiringSoon ? '⚠️ ¡Tu Suscripción PRO vence pronto!' : '🚨 Suscripción PRO Inactiva / Vencida'}
              </span>
              <span
                style={{
                  backgroundColor: '#78350f',
                  color: '#fef3c7',
                  fontSize: '11px',
                  fontWeight: '900',
                  padding: '3px 8px',
                  borderRadius: '100px',
                  textTransform: 'uppercase'
                }}
              >
                {isExpiringSoon ? `${daysRemaining} días restantes` : 'Renovación requerida'}
              </span>
            </div>

            <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600', margin: 0, lineHeight: '1.4' }}>
              {isExpiringSoon ? (
                <>Vence el <strong style={{ color: '#fbbf24' }}>{formattedExpiry}</strong>. Renová ahora por solo <strong style={{ color: '#fbbf24' }}>$2 USD/mes</strong> para mantener la IA ilimitada y PDFs con tu logo.</>
              ) : (
                <>Mantené el acceso a la generación de informes con tu logo, Asesor IA y exportaciones activando tu plan por solo <strong style={{ color: '#fbbf24' }}>$2 USD/mes</strong>.</>
              )}
            </p>
          </div>
        </div>

        {/* Botones de Acción y Cruz para Cerrar */}
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-center sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/subscribe')}
            style={{
              backgroundColor: '#f59e0b',
              color: '#000000',
              fontWeight: '900',
              fontSize: '13px',
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
              transition: 'transform 0.2s'
            }}
          >
            <Sparkles size={16} /> Renovar por $2 USD <ArrowRight size={14} />
          </button>

          {/* Cruz circular bien visible */}
          <button
            type="button"
            onClick={handleDismiss}
            title="Cerrar aviso por esta sesión"
            style={{
              backgroundColor: '#334155',
              color: '#ffffff',
              border: '1.5px solid #64748b',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 900,
              lineHeight: 1,
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#475569')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#334155')}
          >
            ✕
          </button>
        </div>

      </div>
    </div>
  );
}
