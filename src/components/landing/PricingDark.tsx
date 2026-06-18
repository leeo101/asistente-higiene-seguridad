import React from 'react';
import {
  CheckCircle,
  Sparkle as Sparkles,
  Crown,
  ArrowRight,
  Shield,
} from '@phosphor-icons/react';

interface PricingDarkProps {
  onStart: () => void;
}

const freeFeatures = [
  { label: 'Uso Ilimitado y Gratuito', desc: 'Cargá datos y generá registros sin pagar nunca' },
  { label: 'Todos los Módulos Base', desc: 'ATS, Matrices, Carga de Fuego y Checklists' },
  { label: 'Cámara IA On-Screen', desc: 'Vigilancia de riesgos y EPP en tiempo real' },
  { label: 'Asesor IA (Básico)', desc: 'Resolución de dudas normativas al instante' },
  { label: 'Visualización de Reportes', desc: 'Ver reportes completos en pantalla' },
  { label: 'Guardado en Historial Local', desc: 'Tus registros se guardan en tu dispositivo' },
];

const proFeatures = [
  { label: 'Exportación a PDF Profesional', desc: 'Documentos listos con tu logo para el cliente' },
  { label: 'Compartir por WhatsApp y QR', desc: 'Envío instantáneo de registros para firmas' },
  { label: 'Sincronización en la Nube', desc: 'Recuperá tus datos desde cualquier dispositivo' },
  { label: 'Exportación a Excel / CSV', desc: 'Generación de planillas de historial rápidas' },
  { label: 'Módulos Críticos y Gestión', desc: 'LOTO, Altura, CAPA, Auditorías y Accidentes' },
  { label: 'Capacitación y Charlas', desc: 'Registro de firmas y actas de instrucción' },
  { label: 'KPIs y Estadísticas PRO', desc: 'Dashboards avanzados (LFITR/TRIFR)' },
  { label: 'Asesor IA Premium', desc: 'Sin límites de consultas técnicas de seguridad' },
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
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
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
              Dos opciones, sin sorpresas
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
            Elegí tu{' '}
            <span
              style={{
                background: 'linear-gradient(to right, #60a5fa, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              plan
            </span>
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '1.05rem',
              maxWidth: '520px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Empezá gratis y pasá a PRO cuando lo necesites. Sin permanencia ni cargos ocultos.
          </p>
        </div>

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}
        >
          {/* FREE CARD */}
          <div
            style={{
              borderRadius: '28px',
              padding: '2.5rem 2rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              position: 'relative',
              transition: 'border-color 0.3s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <Shield size={18} color="rgba(255,255,255,0.4)" weight="duotone" />
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  Plan Gratuito
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.4rem',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '3.2rem',
                    fontWeight: 900,
                    color: 'white',
                    lineHeight: 1,
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  USD $0
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>
                  / siempre
                </span>
              </div>
              <p
                style={{
                  color: 'rgba(255,255,255,0.45)',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Todo lo que necesitás para empezar a trabajar de forma profesional.
              </p>
            </div>

            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.07)',
                paddingTop: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
                flex: 1,
              }}
            >
              {freeFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                  <CheckCircle
                    size={16}
                    color="#10b981"
                    weight="fill"
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <div>
                    <div
                      style={{ fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}
                    >
                      {f.label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.35)',
                        lineHeight: 1.4,
                      }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = 'white';
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
              }}
            >
              Crear cuenta gratis
            </button>
          </div>

          {/* PRO CARD */}
          <div
            style={{
              borderRadius: '28px',
              padding: '2.5rem 2rem',
              background: 'linear-gradient(145deg, rgba(30,64,175,0.3) 0%, rgba(139,92,246,0.2) 100%)',
              border: '1px solid rgba(99,102,241,0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 30px 60px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Top glow */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #3b82f6, #a855f7, #3b82f6)',
                backgroundSize: '200% 100%',
                animation: 'gradient-shift 3s ease infinite',
              }}
            />
            {/* Glow orb */}
            <div
              style={{
                position: 'absolute',
                top: '-40%',
                right: '-20%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Popular badge */}
            <div
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(251,191,36,0.15)',
                border: '1px solid rgba(251,191,36,0.3)',
                color: '#fbbf24',
                padding: '0.25rem 0.8rem',
                borderRadius: '100px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Crown size={12} color="#fbbf24" weight="fill" />
              Más popular
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <Crown size={18} color="#fbbf24" weight="fill" />
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  Plan PRO
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.4rem',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '3.2rem',
                    fontWeight: 900,
                    color: 'white',
                    lineHeight: 1,
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  USD $2
                </span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                  / mes
                </span>
              </div>
              <p
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Todo del plan gratuito, más historial en nube, PDFs profesionales y herramientas avanzadas.
              </p>
            </div>

            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
                flex: 1,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {proFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                  <CheckCircle
                    size={16}
                    color="#86efac"
                    weight="fill"
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <div>
                    <div
                      style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white' }}
                    >
                      {f.label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.45)',
                        lineHeight: 1.4,
                      }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              className="hover-lift btn-shimmer"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '14px',
                border: 'none',
                background: 'white',
                color: '#1e3a8a',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                overflow: 'hidden',
              }}
            >
              <Sparkles size={18} weight="fill" /> Crear cuenta y ver planes PRO
            </button>
          </div>
        </div>

        {/* Trust line */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '2rem',
            color: 'rgba(255,255,255,0.28)',
            fontSize: '0.8rem',
          }}
        >
          Sin tarjeta de crédito · Sin contratos · Cancelás cuando querés
        </p>
      </div>
    </div>
  );
}
