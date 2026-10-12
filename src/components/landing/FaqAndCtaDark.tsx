import React, { useState } from 'react';
import { ArrowRight, ShieldCheck } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

const items = [
  {
    q: '¿Los informes y protocolos tienen validez legal formal ante la ART y el Ministerio?',
    a: 'Totalmente. Cada módulo fue diseñado respetando taxativamente las resoluciones vigentes de la SRT (Res. 900/15 de Puesta a Tierra, Res. 84/12 de Iluminación, Res. 85/12 de Ruido, Res. 463/09 de RGRL, Res. 960/15 de Autoelevadores, Dec. 351/79 y Dec. 911/96). Los PDFs emitidos incluyen tu membrete, matrícula profesional, sello digital y código QR de validación pública de autenticidad.',
  },
  {
    q: '¿Los trabajadores o contratistas necesitan crearse una cuenta para firmar?',
    a: 'No. El operario o supervisor no necesita registrarse ni descargar ninguna aplicación. Desde tu teléfono generás el código QR del permiso o charla; el operario lo escanea con la cámara de su celular (o se lo enviás por WhatsApp) y firma directamente en la pantalla con el dedo. La firma y la geolocalización quedan estampadas al instante en el documento oficial.',
  },
  {
    q: '¿Cómo puedo pagar la suscripción PRO desde Argentina?',
    a: 'Podés pagar de forma muy sencilla en pesos argentinos a través de Mercado Pago (tarjeta de débito, crédito o dinero en cuenta) o en USD a través de Stripe si estás en el exterior. La suscripción cuesta solo $2 USD (o su equivalente oficial) y se activa de manera 100% automática en tu cuenta.',
  },
  {
    q: '¿Es realmente gratis la prueba?',
    a: 'Sí, la carga de datos, el uso de las calculadoras y los módulos es 100% gratuito e ilimitado para que pruebes la herramienta en tu trabajo diario. La suscripción PRO solo es necesaria cuando querés exportar los documentos vectoriales A4 con tu logo sin marcas de agua, almacenar en la nube o emitir el Dossier ZIP masivo.',
  },
  {
    q: '¿Funciona en el celular sin señal de internet en obra?',
    a: 'Perfecto. La plataforma está construida como una PWA (Progressive Web App). Podés instalarla en la pantalla de inicio de tu celular Android o iPhone y usarla en zonas rurales, subsuelos o galpones sin cobertura. Cuando tu teléfono recupera señal de Wi-Fi o datos, todo se sincroniza automáticamente a la nube.',
  },
  {
    q: '¿Puedo descargar toda la carpeta o legajo de un cliente de una sola vez?',
    a: 'Sí. Con el módulo Dossier ZIP podés seleccionar la empresa o planta y el rango de fechas, y el sistema compila automáticamente todos los ATS, protocolos SRT, constancias de entrega de EPP y registros de capacitación en un único archivo comprimido listo para entregar al auditor o inspector.',
  },
  {
    q: '¿Cómo cancelo la suscripción PRO?',
    a: 'En cualquier momento con 1 solo clic desde tu perfil en la sección Suscripción. No hay períodos de permanencia obligatorios ni costos de cancelación ocultos.',
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
      <div style={{ padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 1.2rem) 3rem' }}>
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
      <div style={{ padding: '0 clamp(0.75rem, 3vw, 1.2rem) clamp(3.5rem, 8vw, 6rem)' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            borderRadius: 'clamp(20px, 4vw, 32px)',
            padding: 'clamp(2.5rem, 6vw, 4.5rem) clamp(1rem, 4vw, 2rem)',
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
              borderRadius: 'clamp(20px, 4vw, 32px)',
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

            <ShieldCheck
              size={48}
              style={{ marginBottom: '1.5rem', opacity: 0.9 }}
              color="#60a5fa"
              weight="duotone"
            />

            <h2
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 900,
                margin: '0 0 1.5rem',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.15,
              }}
            >
              Llevá tu gestión al próximo nivel
            </h2>
            <p
              style={{
                fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
                opacity: 0.85,
                maxWidth: '580px',
                margin: '0 auto 2.5rem',
                lineHeight: 1.6,
              }}
            >
              Miles de profesionales ya están ahorrando horas de trabajo diario. Creá tu cuenta gratuita y comprobá el poder de la IA.
            </p>

            <button
              onClick={() => navigate('/login', { state: { view: 'register' } })}
              className="hover-lift btn-shimmer"
              style={{
                padding: '1.1rem clamp(1.5rem, 5vw, 3.5rem)',
                maxWidth: '100%',
                borderRadius: '100px',
                border: 'none',
                background: 'white',
                color: '#1e3a8a',
                fontWeight: 900,
                fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)',
                cursor: 'pointer',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span>Crear mi cuenta gratis</span>
              <ArrowRight size={20} weight="bold" />
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
