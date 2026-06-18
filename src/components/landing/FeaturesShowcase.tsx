import React, { useRef, useEffect, useState } from 'react';
import {
  Sparkle as Sparkles,
  Robot,
  FilePdf,
  DeviceMobile,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Lightning,
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

interface Feature {
  badge: string;
  badgeColor: string;
  title: string;
  desc: string;
  bullets: string[];
  accentColor: string;
  MockupComponent: React.FC;
}

/* ─── Mockup: ATS generado por IA ─── */
function AISMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s < 3 ? s + 1 : 0)), 1400);
    return () => clearInterval(t);
  }, []);

  const steps = [
    { label: 'Detectando tarea…', color: '#60a5fa', done: false },
    { label: 'Cruzando normativa…', color: '#a78bfa', done: false },
    { label: 'Generando medidas…', color: '#34d399', done: false },
    { label: '¡ATS listo en 2s!', color: '#fbbf24', done: true },
  ];

  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.7)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '1.5rem',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          marginBottom: '1.2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Robot size={20} color="white" weight="fill" />
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>
            IA de Análisis H&S
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
            Modelo entrenado con normativas
          </div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            padding: '0.2rem 0.6rem',
            background: 'rgba(52,211,153,0.2)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: '20px',
            color: '#34d399',
            fontSize: '0.65rem',
            fontWeight: 900,
          }}
        >
          EN VIVO
        </div>
      </div>

      {/* Input */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '0.8rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.7)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Lightning size={14} color="#60a5fa" weight="fill" />
        "Soldadura en espacio confinado nivel C"
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.6rem 0.8rem',
              borderRadius: '10px',
              background:
                i <= step
                  ? `${s.color}12`
                  : 'rgba(255,255,255,0.02)',
              border: `1px solid ${i <= step ? s.color + '30' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.4s ease',
              opacity: i <= step ? 1 : 0.35,
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: i <= step ? s.color : 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.4s',
              }}
            >
              {i < step || (i === step && s.done) ? (
                <CheckCircle size={12} color="white" weight="fill" />
              ) : i === step ? (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'white',
                    animation: 'pulse-soft 1s ease infinite',
                  }}
                />
              ) : null}
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: i <= step ? 700 : 500,
                color: i <= step ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
              }}
            >
              {s.label}
            </span>
            {i <= step && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.65rem',
                  color: s.color,
                  fontWeight: 800,
                }}
              >
                ✓
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Mockup: PDF Profesional ─── */
function PDFMockup() {
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.7)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '1.5rem',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Doc header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldCheck size={22} color="white" weight="fill" />
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>
            ANÁLISIS TRABAJO SEGURO
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
            ATS-2024-001 | Con firma digital
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <FilePdf size={28} color="rgba(255,255,255,0.8)" weight="fill" />
        </div>
      </div>

      {/* Content lines */}
      {[
        { w: '100%', label: 'Tarea: Soldadura en espacio confinado' },
        { w: '80%', label: 'Riesgo: ALTO · Medidas: 8 identificadas' },
        { w: '90%', label: 'EPP requerido: Arnés, Máscara, Guantes' },
      ].map((line, i) => (
        <div
          key={i}
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '8px',
            padding: '0.6rem 0.8rem',
            marginBottom: '0.5rem',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.65)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {line.label}
        </div>
      ))}

      {/* Signature area */}
      <div
        style={{
          marginTop: '0.8rem',
          padding: '0.8rem',
          background: 'rgba(52,211,153,0.08)',
          border: '1px dashed rgba(52,211,153,0.3)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}
      >
        <CheckCircle size={16} color="#34d399" weight="fill" />
        <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
          Firmado digitalmente · Listo para presentar
        </span>
      </div>
    </div>
  );
}

/* ─── Mockup: Multi-dispositivo ─── */
function MultiDeviceMockup() {
  const devices = [
    { label: 'Celular', icon: '📱', users: '68%', color: '#60a5fa' },
    { label: 'Tablet', icon: '📲', users: '18%', color: '#a78bfa' },
    { label: 'PC', icon: '💻', users: '14%', color: '#34d399' },
  ];
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.7)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '1.5rem',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: '1.2rem',
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 800,
          fontSize: '0.9rem',
        }}
      >
        Usala desde cualquier dispositivo
      </div>
      {devices.map((d, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '0.8rem',
          }}
        >
          <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{d.icon}</div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.3rem',
              }}
            >
              <span
                style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}
              >
                {d.label}
              </span>
              <span style={{ fontSize: '0.8rem', color: d.color, fontWeight: 700 }}>
                {d.users}
              </span>
            </div>
            <div
              style={{
                height: '6px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: d.users,
                  background: d.color,
                  borderRadius: '4px',
                  transition: 'width 1s ease',
                }}
              />
            </div>
          </div>
        </div>
      ))}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.8rem',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '10px',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#60a5fa',
          fontWeight: 700,
        }}
      >
        <DeviceMobile size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
        Instalable como App en iOS y Android
      </div>
    </div>
  );
}

const features: Feature[] = [
  {
    badge: 'Inteligencia Artificial',
    badgeColor: '#a78bfa',
    title: 'La IA analiza los riesgos por vos',
    desc: 'Escribí la tarea o tomá una foto, y nuestra IA identifica riesgos, propone medidas y genera el documento técnico completo en segundos.',
    bullets: [
      'Detección automática de riesgos por tarea',
      'Propuestas de controles y EPP obligatorio',
      'Validación contra normativa vigente',
    ],
    accentColor: '#a78bfa',
    MockupComponent: AISMockup,
  },
  {
    badge: 'Documentación Profesional',
    badgeColor: '#60a5fa',
    title: 'PDFs de nivel corporativo con tu logo',
    desc: 'Cada registro genera un PDF con diseño profesional, firma digital, código QR y tu logo de empresa. Listos para presentar al cliente en segundos.',
    bullets: [
      'Firma digital integrada con huella',
      'Código QR único por documento',
      'Logo y datos de empresa personalizados',
    ],
    accentColor: '#60a5fa',
    MockupComponent: PDFMockup,
  },
  {
    badge: 'Multi-Plataforma',
    badgeColor: '#34d399',
    title: 'En la obra, desde el celular, sin internet',
    desc: 'Descargala como App en tu celular y usala en zonas sin cobertura. Cuando volvés a conectarte, sincroniza automáticamente con la nube.',
    bullets: [
      'Funciona 100% offline en campo',
      'Sincronización automática al conectarse',
      'Instalable en iOS y Android (PWA)',
    ],
    accentColor: '#34d399',
    MockupComponent: MultiDeviceMockup,
  },
];

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
  const isEven = index % 2 === 0;
  const { ref, visible } = useInView();
  const isMobile = useIsMobile();
  const Mock = feature.MockupComponent;

  return (
    <div
      ref={ref}
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: isMobile ? '2rem' : '4rem',
        alignItems: 'center',
        padding: isMobile ? '3rem 0' : '5rem 0',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Text — always order 0 on mobile */}
      <div style={{ order: isMobile ? 0 : (isEven ? 0 : 1) }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.8rem',
            background: `${feature.accentColor}15`,
            border: `1px solid ${feature.accentColor}30`,
            borderRadius: '100px',
            marginBottom: '1.2rem',
          }}
        >
          <Sparkles size={12} color={feature.accentColor} weight="fill" />
          <span style={{ color: feature.accentColor, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {feature.badge}
          </span>
        </div>

        <h3
          style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
            fontWeight: 900,
            color: 'white',
            lineHeight: 1.15,
            margin: '0 0 1rem',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {feature.title}
        </h3>
        <p
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '1.05rem',
            lineHeight: 1.7,
            margin: '0 0 1.8rem',
          }}
        >
          {feature.desc}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {feature.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: `${feature.accentColor}20`,
                  border: `1px solid ${feature.accentColor}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle size={12} color={feature.accentColor} weight="fill" />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: 500 }}>
                {b}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mockup — always order 1 on mobile (below text) */}
      <div
        style={{
          order: isMobile ? 1 : (isEven ? 1 : 0),
          filter: `drop-shadow(0 30px 60px ${feature.accentColor}20)`,
        }}
      >
        <Mock />
      </div>
    </div>
  );
}

export default function FeaturesShowcase() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: '4rem 1.2rem 0',
        background: 'linear-gradient(180deg, #0a0f1e 0%, #020617 100%)',
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

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
            Todo lo que necesitás,{' '}
            <span
              style={{
                background: 'linear-gradient(to right, #a78bfa, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ya incluido.
            </span>
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '1.15rem',
              maxWidth: '560px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Desde la IA que redacta hasta el PDF que presentás. Todo en una sola plataforma.
          </p>
        </div>

        {/* Feature rows */}
        {features.map((f, i) => (
          <FeatureRow key={i} feature={f} index={i} />
        ))}

        {/* CTA inside features */}
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <button
            onClick={() => navigate('/login', { state: { view: 'register' } })}
            className="glow-button hover-lift"
            style={{ padding: '1.1rem 2.5rem', fontSize: '1.05rem' }}
          >
            Empezar gratis ahora <ArrowRight size={18} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.4rem' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
