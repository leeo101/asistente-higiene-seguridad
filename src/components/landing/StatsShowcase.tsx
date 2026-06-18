import React, { useEffect, useRef, useState } from 'react';
import { Users, FileText, Globe, Wrench } from '@phosphor-icons/react';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  sublabel: string;
  icon: React.ReactElement;
  color: string;
  gradient: string;
}

const stats: StatItem[] = [
  {
    value: 1240,
    suffix: '+',
    label: 'Profesionales',
    sublabel: 'confían en la plataforma',
    icon: <Users size={28} weight="duotone" />,
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
  },
  {
    value: 8500,
    suffix: '+',
    label: 'Reportes Generados',
    sublabel: 'documentos profesionales',
    icon: <FileText size={28} weight="duotone" />,
    color: '#34d399',
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.05))',
  },
  {
    value: 35,
    suffix: '+',
    label: 'Módulos Activos',
    sublabel: 'herramientas especializadas',
    icon: <Wrench size={28} weight="duotone" />,
    color: '#c084fc',
    gradient: 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(192,132,252,0.05))',
  },
  {
    value: 5,
    suffix: '',
    label: 'Países',
    sublabel: 'Argentina, Chile, Bolivia, Paraguay, Uruguay',
    icon: <Globe size={28} weight="duotone" />,
    color: '#fb923c',
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(251,146,60,0.05))',
  },
];

function useCounterOnVisible(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target, duration]);

  return { count, ref };
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const { count, ref } = useCounterOnVisible(stat.value, 1800 + index * 200);

  return (
    <div
      ref={ref}
      style={{
        background: stat.gradient,
        border: `1px solid ${stat.color}25`,
        borderRadius: '24px',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 40px ${stat.color}20`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Glow orb */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '120px',
          height: '120px',
          background: `radial-gradient(circle, ${stat.color}30 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: `${stat.color}18`,
          border: `1px solid ${stat.color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.2rem',
          color: stat.color,
        }}
      >
        {stat.icon}
      </div>

      {/* Counter */}
      <div
        style={{
          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
          fontWeight: 900,
          color: 'white',
          lineHeight: 1,
          fontFamily: 'var(--font-heading)',
          letterSpacing: '-2px',
          marginBottom: '0.4rem',
        }}
      >
        {count.toLocaleString('es-AR')}
        <span style={{ color: stat.color }}>{stat.suffix}</span>
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: '1.1rem',
          fontWeight: 800,
          color: 'white',
          marginBottom: '0.3rem',
        }}
      >
        {stat.label}
      </div>
      <div
        style={{
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 500,
          lineHeight: 1.3,
        }}
      >
        {stat.sublabel}
      </div>
    </div>
  );
}

export default function StatsShowcase() {
  return (
    <div
      style={{
        padding: '5rem 1.2rem',
        background: 'linear-gradient(180deg, #020617 0%, #0a0f1e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '400px',
          background:
            'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
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
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              background: 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: '100px',
              marginBottom: '1rem',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#34d399',
                display: 'inline-block',
                animation: 'pulse-soft 2s ease-in-out infinite',
              }}
            />
            <span
              style={{
                color: '#34d399',
                fontSize: '0.8rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Creciendo cada día
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
            La plataforma que ya{' '}
            <span
              style={{
                background: 'linear-gradient(to right, #60a5fa, #34d399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              eligió la industria
            </span>
          </h2>
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
