import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Fire,
  Cpu,
  Wrench,
  FirstAid,
  Eye,
  FileText,
  ChartBar,
  GraduationCap,
  Lock,
  HardHat,
  ClipboardText,
  Lightning,
  ArrowRight,
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

interface Module {
  icon: React.ReactElement;
  name: string;
  desc: string;
  color: string;
  gradient: string;
  tag?: string;
}

const modules: Module[] = [
  {
    icon: <ShieldCheck size={30} weight="duotone" />,
    name: 'ATS / JSA',
    desc: 'Análisis de Trabajo Seguro con IA que detecta riesgos en segundos',
    color: '#34d399',
    gradient: 'rgba(52,211,153,0.12)',
    tag: 'IA',
  },
  {
    icon: <Fire size={30} weight="duotone" />,
    name: 'Carga de Fuego',
    desc: 'Cálculo automático según NFPA 13 / Dec. 351 con gráfico incluido',
    color: '#fb923c',
    gradient: 'rgba(251,146,60,0.12)',
    tag: 'Auto',
  },
  {
    icon: <Eye size={30} weight="duotone" />,
    name: 'Cámara IA',
    desc: 'Detección en tiempo real de EPP, riesgos y condiciones inseguras',
    color: '#a78bfa',
    gradient: 'rgba(167,139,250,0.12)',
    tag: 'IA',
  },
  {
    icon: <FileText size={30} weight="duotone" />,
    name: 'Informes Técnicos',
    desc: 'PDFs profesionales con logo, firma digital y código QR',
    color: '#60a5fa',
    gradient: 'rgba(96,165,250,0.12)',
  },
  {
    icon: <Lock size={30} weight="duotone" />,
    name: 'Bloqueo LOTO',
    desc: 'Procedimientos de bloqueo y etiquetado para tareas de mantenimiento',
    color: '#f87171',
    gradient: 'rgba(248,113,113,0.12)',
    tag: 'PRO',
  },
  {
    icon: <HardHat size={30} weight="duotone" />,
    name: 'Trabajo en Altura',
    desc: 'Permisos, matrices de riesgo y checklists para trabajo en altura',
    color: '#fbbf24',
    gradient: 'rgba(251,191,36,0.12)',
    tag: 'PRO',
  },
  {
    icon: <GraduationCap size={30} weight="duotone" />,
    name: 'Capacitaciones',
    desc: 'Registro de asistencia con firma digital e historial exportable',
    color: '#34d399',
    gradient: 'rgba(52,211,153,0.12)',
    tag: 'PRO',
  },
  {
    icon: <ClipboardText size={30} weight="duotone" />,
    name: 'Auditorías',
    desc: 'Checklists personalizables con fotos, hallazgos y CAPA integrado',
    color: '#818cf8',
    gradient: 'rgba(129,140,248,0.12)',
    tag: 'PRO',
  },
  {
    icon: <FirstAid size={30} weight="duotone" />,
    name: 'Accidentes e Incidentes',
    desc: 'Registro, investigación y árbol de causas automatizado',
    color: '#f87171',
    gradient: 'rgba(248,113,113,0.12)',
    tag: 'PRO',
  },
  {
    icon: <ChartBar size={30} weight="duotone" />,
    name: 'KPIs & Estadísticas',
    desc: 'Dashboard de LFITR, TRIFR y tasas de accidentabilidad mensuales',
    color: '#38bdf8',
    gradient: 'rgba(56,189,248,0.12)',
    tag: 'PRO',
  },
  {
    icon: <Wrench size={30} weight="duotone" />,
    name: 'Inspecciones',
    desc: 'Check pre-operacional de equipos y herramientas con firma del operador',
    color: '#94a3b8',
    gradient: 'rgba(148,163,184,0.12)',
  },
  {
    icon: <Cpu size={30} weight="duotone" />,
    name: 'Asesor IA',
    desc: 'Chat experto en normativa HyS disponible 24/7 para consultas técnicas',
    color: '#c084fc',
    gradient: 'rgba(192,132,252,0.12)',
    tag: 'IA',
  },
];

const tagColors: Record<string, { bg: string; text: string }> = {
  IA: { bg: 'rgba(167,139,250,0.2)', text: '#c084fc' },
  PRO: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  Auto: { bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
};

export default function ModulesGrid() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      style={{
        padding: '5rem 1.2rem',
        background: 'linear-gradient(180deg, #020617 0%, #0a0f1e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
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
              padding: '0.4rem 1rem',
              background: 'rgba(251,146,60,0.1)',
              border: '1px solid rgba(251,146,60,0.2)',
              borderRadius: '100px',
              marginBottom: '1.2rem',
            }}
          >
            <Lightning size={14} color="#fb923c" weight="fill" />
            <span
              style={{
                color: '#fb923c',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Todo en una sola app
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
            12 módulos{' '}
            <span
              style={{
                background: 'linear-gradient(to right, #fb923c, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              especializados.
            </span>
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '1.05rem',
              maxWidth: '540px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Desde el ATS hasta las estadísticas de accidentabilidad. Todo lo que necesita un profesional H&S en un solo lugar.
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.2rem',
            marginBottom: '3rem',
          }}
        >
          {modules.map((mod, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '1.5rem',
                background: hovered === i ? mod.gradient.replace('0.12', '0.2') : `${mod.gradient}`,
                border: `1px solid ${mod.color}${hovered === i ? '35' : '18'}`,
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
                cursor: 'default',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: hovered === i ? 'translateY(-6px)' : 'translateY(0)',
                boxShadow: hovered === i ? `0 20px 40px ${mod.color}15` : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background glow */}
              {hovered === i && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-30px',
                    right: '-30px',
                    width: '100px',
                    height: '100px',
                    background: `radial-gradient(circle, ${mod.color}25 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Top row: icon + tag */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: `${mod.color}18`,
                    border: `1px solid ${mod.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: mod.color,
                    flexShrink: 0,
                    transition: 'transform 0.3s ease',
                    transform: hovered === i ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {mod.icon}
                </div>
                {mod.tag && (
                  <div
                    style={{
                      padding: '0.2rem 0.6rem',
                      background: tagColors[mod.tag].bg,
                      border: `1px solid ${tagColors[mod.tag].text}30`,
                      borderRadius: '100px',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      color: tagColors[mod.tag].text,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {mod.tag}
                  </div>
                )}
              </div>

              {/* Name + desc */}
              <div>
                <div
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    color: 'white',
                    marginBottom: '0.4rem',
                  }}
                >
                  {mod.name}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.5,
                  }}
                >
                  {mod.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/login', { state: { view: 'register' } })}
            className="glow-button hover-lift"
            style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}
          >
            Explorar todos los módulos{' '}
            <ArrowRight
              size={18}
              style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.4rem' }}
            />
          </button>
          <p
            style={{
              marginTop: '1rem',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '0.82rem',
            }}
          >
            6 módulos gratuitos · 6 módulos PRO desde USD $2/mes
          </p>
        </div>
      </div>
    </div>
  );
}
