import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crown, X, Sparkle as Sparkles, Shield, CheckCircle } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps): React.ReactElement | null {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSelectPlan = (planId: string) => {
    onClose();
    if (planId === 'free') {
      return;
    }
    navigate('/subscribe', { state: { plan: planId } });
  };

  const modalPlans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: '$0',
      period: '/ siempre',
      badge: 'Base',
      badgeBg: 'rgba(255,255,255,0.12)',
      badgeColor: '#cbd5e1',
      desc: 'Formularios e inspecciones iniciales en pantalla sin costo.',
      perks: ['Carga de datos básica', 'Vista previa en pantalla', 'Acceso a calculadoras base'],
      buttonLabel: 'Continuar Gratis',
      buttonBg: '#334155',
      buttonColor: '#ffffff',
      icon: <Shield size={20} color="#cbd5e1" weight="duotone" />
    },
    {
      id: 'pro',
      name: 'Profesional PRO',
      price: '$2',
      period: '/ mes',
      badge: '✦ ACCESO TOTAL ($2)',
      badgeBg: 'rgba(251,191,36,0.22)',
      badgeColor: '#fbbf24',
      popular: true,
      desc: 'PDFs A4 con tu LOGO y matrícula, Protocolos SRT, Firmas QR, Sincronización Cloud e IA Ilimitada.',
      perks: [
        'Reportes PDF con tu Logo y Sello',
        'Protocolos Oficiales SRT (PAT, Ruido, Luz)',
        'Asesor IA Legal + Escáner QR de Activos'
      ],
      buttonLabel: 'Activar Profesional ($2 USD)',
      buttonBg: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      buttonColor: '#ffffff',
      icon: <Crown size={20} color="#fbbf24" weight="fill" />
    }
  ];

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.82)',
          backdropFilter: 'blur(10px)'
        }}
      />

      {/* Modal Container Centrado */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          margin: 'auto',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: '2px solid rgba(59, 130, 246, 0.65)',
          borderRadius: '26px',
          padding: '1.6rem',
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.85)'
        }}
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          title="Cerrar ventana"
          style={{
            marginBottom: 0,
            backgroundColor: '#1e293b',
            color: '#ffffff',
            border: '1px solid #475569',
            borderRadius: '9999px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 20
          }}
        >
          <X size={20} color="#ffffff" weight="bold" />
        </button>

        {/* Encabezado Centrado */}
        <div style={{ textAlign: 'center', marginBottom: '1.35rem', position: 'relative', zIndex: 10 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.85rem',
              backgroundColor: 'rgba(59, 130, 246, 0.18)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              borderRadius: '9999px',
              marginBottom: '0.75rem'
            }}
          >
            <Sparkles size={14} color="#60a5fa" weight="fill" />
            <span
              style={{
                color: '#60a5fa',
                fontSize: '0.72rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
            >
              Membresía Profesional H&S
            </span>
          </div>

          <h2
            style={{
              color: '#ffffff',
              fontSize: 'clamp(1.25rem, 2.8vw, 1.65rem)',
              fontWeight: 900,
              margin: '0 0 0.4rem 0',
              letterSpacing: '-0.02em'
            }}
          >
            Desbloqueá todas las herramientas PRO
          </h2>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '0.84rem',
              maxWidth: '540px',
              margin: '0 auto',
              lineHeight: 1.5
            }}
          >
            Exportá informes PDF oficiales con tu logo y matrícula, sincronizá en la nube y utilizá el Asesor IA sin límites.
          </p>
        </div>

        {/* Tarjetas de Planes Centradas */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"
          style={{ maxWidth: '650px', margin: '0 auto 1.1rem auto' }}
        >
          {modalPlans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: plan.popular
                  ? 'linear-gradient(160deg, #1e1b4b 0%, #172554 100%)'
                  : '#1e293b',
                border: `2px solid ${plan.popular ? '#6366f1' : '#334155'}`,
                borderRadius: '20px',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'left'
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {plan.icon}
                    <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase' }}>
                      {plan.name}
                    </span>
                  </div>
                  <span
                    style={{
                      background: plan.badgeBg,
                      color: plan.badgeColor,
                      fontSize: '0.65rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      fontWeight: 900,
                      textTransform: 'uppercase'
                    }}
                  >
                    {plan.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 my-2">
                  <span style={{ color: '#ffffff', fontSize: '1.75rem', fontWeight: 900 }}>
                    {plan.price}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
                    {plan.period}
                  </span>
                </div>

                <p style={{ color: '#cbd5e1', fontSize: '0.76rem', lineHeight: 1.45, margin: '0 0 0.75rem 0' }}>
                  {plan.desc}
                </p>

                <div className="space-y-1.5 mb-4">
                  {plan.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs" style={{ color: '#e2e8f0' }}>
                      <CheckCircle
                        size={14}
                        weight="fill"
                        color={plan.popular ? '#34d399' : '#94a3b8'}
                      />
                      <span style={{ fontSize: '0.74rem', fontWeight: 600 }}>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan(plan.id)}
                style={{
                  marginBottom: 0,
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: plan.buttonBg,
                  color: plan.buttonColor,
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: plan.popular ? '0 8px 20px rgba(79, 70, 229, 0.4)' : 'none'
                }}
              >
                {plan.popular && <Sparkles size={15} weight="fill" />}
                {plan.buttonLabel}
              </button>
            </div>
          ))}
        </div>

        {/* Pie Seguro */}
        <div
          style={{
            textAlign: 'center',
            borderTop: '1px solid rgba(51, 65, 85, 0.7)',
            paddingTop: '0.85rem'
          }}
        >
          <p
            style={{
              color: '#94a3b8',
              fontSize: '0.74rem',
              fontWeight: 600,
              margin: 0
            }}
          >
            🔒 Pagos 100% seguros con Mercado Pago 🇦🇷 y Stripe 🌎 • Sin contratos de permanencia
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
