import React, { useState, useEffect } from 'react';
import {
  FileX,
  MicrosoftExcelLogo,
  Clock,
  Sparkle as Sparkles,
  MagicWand,
  FilePdf,
  ShieldCheck,
  ArrowRight,
} from '@phosphor-icons/react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

const comparisons = [
  { before: '40–60 min por ATS', after: '< 2 minutos con IA', icon: '⚡' },
  { before: 'Excel con errores de formato', after: 'PDF profesional automático', icon: '📄' },
  { before: 'Firma en papel, fácil de perder', after: 'Firma digital + QR verificable', icon: '✍️' },
  { before: 'Cálculos manuales con tablas', after: 'Resultados instantáneos y precisos', icon: '🎯' },
];

export default function BeforeAndAfter() {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        padding: '5rem 1.2rem',
        background: '#020617',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grid bg */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '100px',
              marginBottom: '1rem',
            }}
          >
            <MagicWand size={14} color="#c084fc" />
            <span
              style={{
                color: '#c084fc',
                fontSize: '0.78rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              La transformación real
            </span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 900,
              color: 'white',
              margin: 0,
              lineHeight: 1.1,
              fontFamily: 'var(--font-heading)',
            }}
          >
            Hacer prevención no debería{' '}
            <br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>
              ser un trabajo burocrático.
            </span>
          </h2>
        </div>

        {/* Two-column cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem',
          }}
        >
          {/* El Pasado */}
          <div
            style={{
              background: 'rgba(239,68,68,0.04)',
              border: '1px solid rgba(239,68,68,0.12)',
              borderRadius: '24px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #ef4444, #dc2626)',
              }}
            />
            <h3
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#f87171',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>😰</span> El Pasado
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: <MicrosoftExcelLogo size={22} color="#f87171" weight="duotone" />, text: 'Planillas de Excel desactualizadas' },
                { icon: <FileX size={22} color="#f87171" weight="duotone" />, text: 'Pérdida de documentos y firmas' },
                { icon: <Clock size={22} color="#f87171" weight="duotone" />, text: 'Horas de escritorio redactando' },
                { icon: <Clock size={22} color="#f87171" weight="duotone" />, text: 'Cálculos manuales propensos a error' },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    color: 'rgba(255,255,255,0.55)',
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(239,68,68,0.04)',
                    borderRadius: '10px',
                    border: '1px solid rgba(239,68,68,0.08)',
                  }}
                >
                  {item.icon}
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: '1.2rem',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '14px',
                border: '1px dashed rgba(239,68,68,0.2)',
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.95rem',
                textAlign: 'center',
                fontWeight: 700,
              }}
            >
              ❌ 2-3 horas perdidas al día
            </div>
          </div>

          {/* El Futuro */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(168,85,247,0.05) 100%)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: '24px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(59,130,246,0.15)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
              }}
            />
            <h3
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'white',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>🚀</span> Con Asistente H&S{' '}
              <Sparkles color="#60a5fa" weight="fill" size={18} />
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: <Sparkles size={22} color="#60a5fa" weight="duotone" />, text: 'IA que redacta por ti en segundos' },
                { icon: <FilePdf size={22} color="#60a5fa" weight="duotone" />, text: 'PDFs profesionales con firmas integradas' },
                { icon: <ShieldCheck size={22} color="#60a5fa" weight="duotone" />, text: 'Cumplimiento normativo automático' },
                { icon: <ShieldCheck size={22} color="#60a5fa" weight="duotone" />, text: 'Acceso desde el celular en la obra' },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    color: 'rgba(255,255,255,0.85)',
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(59,130,246,0.06)',
                    borderRadius: '10px',
                    border: '1px solid rgba(59,130,246,0.1)',
                  }}
                >
                  {item.icon}
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: '1.2rem',
                background: 'linear-gradient(135deg, #1e40af, #6b21a8)',
                borderRadius: '14px',
                color: 'white',
                fontSize: '0.95rem',
                textAlign: 'center',
                fontWeight: 800,
                boxShadow: '0 10px 20px -5px rgba(0,0,0,0.5)',
              }}
            >
              ✅ Todo listo en menos de 2 minutos
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '1rem',
              padding: '1rem 1.5rem',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ color: '#f87171', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Antes
            </div>
            <div />
            <div style={{ color: '#60a5fa', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>
              Con Asistente H&S
            </div>
          </div>

          {comparisons.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: isMobile ? '0.4rem' : '1rem',
                padding: isMobile ? '0.75rem 0.8rem' : '1rem 1.5rem',
                borderBottom: i < comparisons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center',
              }}
            >
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? '0.75rem' : '0.88rem', fontWeight: 500, lineHeight: 1.3 }}>
                {c.before}
              </div>
              <div
                style={{
                  width: isMobile ? '24px' : '32px',
                  height: isMobile ? '24px' : '32px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '0.75rem' : '1rem',
                  flexShrink: 0,
                }}
              >
                {c.icon}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: isMobile ? '0.75rem' : '0.88rem', fontWeight: 700, textAlign: 'right', lineHeight: 1.3 }}>
                {c.after}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
