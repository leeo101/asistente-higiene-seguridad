import React from 'react';
import {
  CheckCircle,
  Sparkle as Sparkles,
  Crown,
  Shield,
  Buildings,
  GraduationCap,
  ArrowRight,
} from '@phosphor-icons/react';

interface PricingDarkProps {
  onStart: () => void;
}

const plansData = [
  {
    id: 'free',
    name: 'Plan 1: Gratuito',
    price: 'USD $0',
    period: '/ siempre',
    desc: 'Para explorar la herramienta y hacer inspecciones iniciales sin costo.',
    icon: <Shield size={20} color="#94a3b8" weight="duotone" />,
    badge: null,
    border: 'rgba(255,255,255,0.1)',
    bg: 'rgba(255,255,255,0.02)',
    buttonBg: 'rgba(255,255,255,0.06)',
    buttonText: 'rgba(255,255,255,0.85)',
    buttonHoverBg: 'rgba(255,255,255,0.12)',
    btnLabel: 'Probar Gratis',
    checkColor: '#10b981',
    features: [
      { label: 'Uso Base Ilimitado', desc: 'ATS, Carga de Fuego y Checklists' },
      { label: 'Asesor IA Inicial', desc: 'Consultas normativas rápidas' },
      { label: 'Guardado Local', desc: 'Registro seguro en tu equipo' },
      { label: 'Normativas Locales', desc: 'Arg, Chile, Uruguay y LatAm' },
    ],
  },
  {
    id: 'student',
    name: 'Plan 2: Estudiante',
    price: 'USD $2',
    period: '/ mes',
    desc: 'Para alumnos, practicantes y técnicos que están dando sus primeros pasos.',
    icon: <GraduationCap size={20} color="#34d399" weight="duotone" />,
    badge: { label: 'Estudiantes 🎓', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', color: '#34d399' },
    border: 'rgba(16,185,129,0.3)',
    bg: 'linear-gradient(180deg, rgba(6,78,59,0.2) 0%, rgba(2,6,23,0.4) 100%)',
    buttonBg: '#059669',
    buttonText: '#ffffff',
    buttonHoverBg: '#047857',
    btnLabel: 'Elegir Estudiante',
    checkColor: '#34d399',
    features: [
      { label: 'Todo del Plan Gratuito', desc: 'Más funciones para formación' },
      { label: 'Exportación a PDF Oficial', desc: 'Formato limpio e impresiones' },
      { label: 'Cámara IA & Visión', desc: 'Detección EPP y riesgos en fotos' },
      { label: 'Nube & Firma Digital', desc: 'Respaldo seguro de documentos' },
    ],
  },
  {
    id: 'pro',
    name: 'Plan 3: Profesional',
    price: 'USD $6',
    period: '/ mes',
    desc: 'Para Licenciados, Técnicos e Ingenieros que asesoran empresas activamente.',
    icon: <Crown size={20} color="#fbbf24" weight="fill" />,
    badge: { label: 'Más Popular ✦', bg: 'rgba(251,191,36,0.18)', border: 'rgba(251,191,36,0.4)', color: '#fbbf24' },
    border: 'rgba(99,102,241,0.5)',
    bg: 'linear-gradient(145deg, rgba(30,64,175,0.35) 0%, rgba(124,58,237,0.25) 100%)',
    buttonBg: '#ffffff',
    buttonText: '#1e3a8a',
    buttonHoverBg: '#f8fafc',
    btnLabel: 'Probar Profesional',
    popular: true,
    checkColor: '#86efac',
    features: [
      { label: 'PDFs con TU LOGO', desc: 'Presentación ejecutiva a clientes' },
      { label: 'Asesor IA Ilimitado', desc: 'Conclusiones técnicas en segundos' },
      { label: 'Módulos Críticos', desc: 'LOTO, Altura, Confinados, CAPA' },
      { label: 'Envío WhatsApp & QR', desc: 'Firma inmediata en obra o planta' },
      { label: 'Exportar a Excel / CSV', desc: 'Planillas completas de historial' },
    ],
  },
  {
    id: 'enterprise',
    name: 'Plan 4: Empresa',
    price: 'USD $25',
    period: '/ mes',
    desc: 'Para Servicios de HyS externos, consultoras y empresas multi-planta.',
    icon: <Buildings size={20} color="#c084fc" weight="duotone" />,
    badge: { label: 'Consultoras 🏢', bg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.4)', color: '#c084fc' },
    border: 'rgba(168,85,247,0.4)',
    bg: 'linear-gradient(180deg, rgba(88,28,135,0.25) 0%, rgba(2,6,23,0.4) 100%)',
    buttonBg: 'linear-gradient(135deg, #7e22ce 0%, #4338ca 100%)',
    buttonText: '#ffffff',
    buttonHoverBg: 'linear-gradient(135deg, #6b21a8 0%, #3730a3 100%)',
    btnLabel: 'Elegir Empresa',
    checkColor: '#c084fc',
    features: [
      { label: 'Multi-Usuario & Equipo', desc: 'Acceso para todo tu personal' },
      { label: 'Gestión Multi-Cliente', desc: 'Legajos independientes por cliente' },
      { label: 'Dashboards KPIs EHS', desc: 'Índices de Frecuencia y Severidad' },
      { label: 'Soporte VIP 24/7', desc: 'Atención prioritaria inmediata' },
    ],
  },
];

export default function PricingDark({ onStart }: PricingDarkProps) {
  return (
    <div
      style={{
        padding: '5rem 1.2rem',
        background: 'linear-gradient(180deg, #020617 0%, #0a0f1e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
          maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
        }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1.1rem',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '100px',
              marginBottom: '1.2rem',
            }}
          >
            <Sparkles size={14} color="#60a5fa" weight="fill" />
            <span
              style={{
                color: '#60a5fa',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Planes a tu medida · Sin sorpresas ni permanencia
            </span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 900,
              color: 'white',
              margin: '0 0 1rem',
              fontFamily: 'var(--font-heading)',
              lineHeight: 1.1,
            }}
          >
            Elegí el plan perfecto para{' '}
            <span
              style={{
                background: 'linear-gradient(to right, #60a5fa, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              tu gestión
            </span>
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '1.05rem',
              maxWidth: '620px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Desde estudiantes e inspectores independientes hasta consultoras EHS integrales.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch',
          }}
        >
          {plansData.map((plan) => (
            <div
              key={plan.id}
              style={{
                borderRadius: '24px',
                padding: '2rem 1.4rem',
                background: plan.bg,
                border: `1.5px solid ${plan.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: plan.popular ? '0 20px 40px rgba(59,130,246,0.2)' : '0 10px 25px rgba(0,0,0,0.2)',
                transform: plan.popular ? 'scale(1.02)' : 'none',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
              }}
            >
              {/* Badge if present */}
              {plan.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: '1.2rem',
                    right: '1.2rem',
                    background: plan.badge.bg,
                    border: `1px solid ${plan.badge.border}`,
                    color: plan.badge.color,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '100px',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  {plan.badge.label}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  {plan.icon}
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                    {plan.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', lineHeight: 1, fontFamily: 'var(--font-heading)' }}>
                    {plan.price}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>{plan.period}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.4, margin: 0 }}>
                  {plan.desc}
                </p>
              </div>

              {/* Features List */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                    <CheckCircle size={16} color={plan.checkColor} weight="fill" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{f.label}</div>
                      <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.3 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={onStart}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: plan.buttonBg,
                  color: plan.buttonText,
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                {plan.popular && <Sparkles size={16} weight="fill" />}
                {plan.btnLabel}
              </button>
            </div>
          ))}
        </div>

        {/* Trust line */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontWeight: 600 }}>
            🔒 Sin contratos de permanencia
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem' }}>•</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontWeight: 600 }}>
            💳 Pago 100% seguro
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem' }}>•</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontWeight: 600 }}>
            ⚡ Activación inmediata
          </span>
        </div>
      </div>
    </div>
  );
}
