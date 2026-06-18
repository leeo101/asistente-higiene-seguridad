import React, { useState } from 'react';
import { ArrowRight, Sparkle as Sparkles } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

const items = [
  {
    q: '¿Es realmente gratis?',
    a: 'Sí, la carga de datos y el uso de los módulos es 100% gratuito e ilimitado. Podés completar ATS, hacer mediciones y cargar registros sin pagar. El plan PRO solo es necesario si deseás exportar esos resultados a PDF profesional, compartirlos por WhatsApp o sincronizarlos en la nube.',
  },
  {
    q: '¿Puedo usar la IA gratis?',
    a: '¡Sí! Podés usar la Cámara IA y el Asesor IA de forma gratuita para ver los resultados y análisis en tiempo real en tu pantalla. La versión PRO te permite incluir esos hallazgos en reportes exportables y compartirlos.',
  },
  {
    q: '¿Cumple con la normativa de mi país?',
    a: 'Los cálculos están basados en la Ley 19.587, el Dec. 351/79, resoluciones SRT, ISO 45001 y normativas vigentes de Argentina, Chile, Bolivia, Paraguay y Uruguay.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Usamos Firebase (Google) para autenticación y almacenamiento cifrado. Tu información está protegida y bajo tu control total.',
  },
  {
    q: '¿Funciona en el celular?',
    a: 'Perfecto. Está optimizada para mobile y podés instalarla directamente en tu pantalla de inicio como una app nativa (PWA). Funciona 100% offline en zonas sin cobertura.',
  },
  {
    q: '¿Cómo cancelo la suscripción PRO?',
    a: 'En cualquier momento desde tu perfil, en la sección Suscripción. No hay contratos de permanencia ni cargos ocultos.',
  },
];

export default function FaqAndCtaDark() {
  const [open, setOpen] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0a0f1e 0%, #020617 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── FAQ ── */}
      <div style={{ padding: '5rem 1.2rem 4rem' }}>
        {/* Ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 900,
                color: 'white',
                margin: '0 0 0.8rem',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Preguntas{' '}
              <span
                style={{
                  background: 'linear-gradient(to right, #60a5fa, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Frecuentes
              </span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', margin: 0 }}>
              Todo lo que necesitás saber antes de empezar.
            </p>
          </div>

          {/* Accordion items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: open === i
                    ? '1px solid rgba(96,165,250,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                  background: open === i
                    ? 'rgba(59,130,246,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.25s ease',
                  boxShadow: open === i ? '0 4px 20px rgba(59,130,246,0.1)' : 'none',
                }}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '1.1rem 1.4rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: open === i ? '#93c5fd' : 'rgba(255,255,255,0.85)',
                    transition: 'color 0.2s',
                    minHeight: '48px',
                  }}
                >
                  <span style={{ flex: 1 }}>{item.q}</span>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: open === i ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${open === i ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.1rem',
                        color: open === i ? '#93c5fd' : 'rgba(255,255,255,0.4)',
                        lineHeight: 1,
                        display: 'block',
                        transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                        transition: 'transform 0.3s ease',
                        fontWeight: 300,
                      }}
                    >
                      +
                    </span>
                  </div>
                </button>
                <div
                  style={{
                    maxHeight: open === i ? '300px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div
                    style={{
                      padding: '0 1.4rem 1.2rem',
                      fontSize: '0.9rem',
                      color: 'rgba(255,255,255,0.5)',
                      lineHeight: 1.7,
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      paddingTop: '1rem',
                    }}
                  >
                    {item.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA Final ── */}
      <div style={{ padding: '0 1.2rem 6rem' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            borderRadius: '32px',
            padding: 'clamp(3rem, 6vw, 5rem) 2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated gradient background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 25%, #8b5cf6 50%, #3b82f6 75%, #1e40af 100%)',
              backgroundSize: '300% 300%',
              animation: 'gradient-shift 8s ease infinite',
              borderRadius: '32px',
            }}
          />
          {/* Glow orbs */}
          <div
            style={{
              position: 'absolute',
              top: '-40%',
              left: '-10%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-20%',
              right: '-5%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          {/* Particle dots */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${6 + i * 3}px`,
                height: `${6 + i * 3}px`,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                top: `${15 + i * 12}%`,
                left: `${8 + i * 15}%`,
                animation: `particle-float ${3 + i * 0.8}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          ))}

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, color: 'white' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 1rem',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '100px',
                marginBottom: '2rem',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#34d399',
                  display: 'inline-block',
                  animation: 'pulse-soft 2s ease infinite',
                }}
              />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                +50 profesionales se registraron esta semana
              </span>
            </div>

            <Sparkles
              size={48}
              style={{ marginBottom: '1.5rem', opacity: 0.9 }}
              color="#fcd34d"
              weight="fill"
            />

            <h2
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
                fontWeight: 900,
                margin: '0 0 1.5rem',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.1,
              }}
            >
              Llevá tu gestión al próximo nivel
            </h2>
            <p
              style={{
                fontSize: '1.15rem',
                opacity: 0.85,
                maxWidth: '580px',
                margin: '0 auto 3rem',
                lineHeight: 1.6,
              }}
            >
              Miles de profesionales ya están ahorrando horas de trabajo diario. Creá tu cuenta gratuita y comprobá el poder de la IA.
            </p>

            <button
              onClick={() => navigate('/login', { state: { view: 'register' } })}
              className="hover-lift btn-shimmer"
              style={{
                padding: '1.3rem 3.5rem',
                borderRadius: '100px',
                border: 'none',
                background: 'white',
                color: '#1e3a8a',
                fontWeight: 900,
                fontSize: '1.15rem',
                cursor: 'pointer',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.8rem',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              Crear mi cuenta gratis{' '}
              <ArrowRight size={22} weight="bold" />
            </button>

            <p
              style={{
                marginTop: '1.5rem',
                opacity: 0.5,
                fontSize: '0.82rem',
              }}
            >
              Sin tarjeta de crédito · Sin contratos · Sin cargos ocultos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
