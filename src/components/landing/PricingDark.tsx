import React from 'react';
import {
  CheckCircle,
  ShieldCheck,
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
    id: 'pro',
    name: 'Plan 2: Profesional PRO',
    price: 'USD $2',
    period: '/ mes',
    desc: 'Acceso TOTAL para Licenciados, Técnicos e Ingenieros que asesoran activamente.',
    icon: <Crown size={20} color="#fbbf24" weight="fill" />,
    badge: { label: '✦ Acceso Total ($2)', bg: 'rgba(251,191,36,0.18)', border: 'rgba(251,191,36,0.4)', color: '#fbbf24' },
    border: 'rgba(99,102,241,0.5)',
    bg: 'linear-gradient(145deg, rgba(30,64,175,0.35) 0%, rgba(124,58,237,0.25) 100%)',
    buttonBg: '#ffffff',
    buttonText: '#1e3a8a',
    buttonHoverBg: '#f8fafc',
    btnLabel: 'Activar Profesional ($2 USD)',
    popular: true,
    features: [
      { label: 'PDFs con TU LOGO e Identidad', desc: 'Presentación profesional con tu marca de agua y membrete en todos los informes' },
      { label: 'Firma Digital & QR de Validación', desc: 'Firma táctil en pantalla y verificación pública por QR para auditorías' },
      { label: 'Asesor IA Normativo Ilimitado', desc: 'Consultas 24/7 sin límite (Dec. 351/79, SRT, NFPA, OSHA, Ley 19587/16744/29783)' },
      { label: 'Cámara IA & Visión Computacional', desc: 'Detección automática de EPP, actos inseguros y riesgos en fotos de terreno' },
      { label: 'Módulos Críticos Desbloqueados', desc: 'ATS, Trabajo en Altura, Espacios Confinados, LOTO (Bloqueo) & Módulo CAPA' },
      { label: 'Carga de Fuego & Extintores', desc: 'Cálculos de calorías, masa combustible, cantidad de extintores e inventario QR' },
      { label: 'Checklists, Matriz IPERC & Legajos', desc: 'Formularios en terreno, árbol de causas y legajos por cliente' },
      { label: 'Envío Instantáneo a WhatsApp & Mail', desc: 'Compartí el PDF generado con el cliente o responsable con 1 solo clic' },
      { label: 'Exportación a Excel / CSV', desc: 'Descarga planillas ejecutivas completas para análisis y auditorías' },
      { label: 'Sincronización Nube & Modo Offline', desc: 'Cargá datos en obra sin internet y respaldá automáticamente al conectar' },
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

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
            <ShieldCheck size={15} color="#60a5fa" weight="bold" />
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
            Plan Gratuito para explorar y Plan Profesional PRO para gestión completa e ilimitada.
          </p>
        </div>

        {/* 2 Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.8rem',
            alignItems: 'stretch',
          }}
        >
          {plansData.map((plan) => (
            <div
              key={plan.id}
              style={{
                borderRadius: '24px',
                padding: '2rem 1.6rem',
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
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {plan.icon}
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', color: plan.popular ? '#60a5fa' : 'rgba(255,255,255,0.8)' }}>
                      {plan.name}
                    </span>
                  </div>

                  {/* Badge positioned inline in flex header (NO OVERLAP) */}
                  {plan.badge && (
                    <div
                      style={{
                        background: plan.badge.bg,
                        border: `1px solid ${plan.badge.border}`,
                        color: plan.badge.color,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '100px',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {plan.badge.label}
                    </div>
                  )}
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
                {plan.popular && <ShieldCheck size={16} weight="bold" />}
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
