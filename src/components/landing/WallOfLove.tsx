import React from 'react';
import { Star, CheckCircle, ShieldCheck, Quotes } from '@phosphor-icons/react';

const testimonials = [
  {
    name: "Juan Pérez",
    role: "Supervisor de Obra",
    company: "Constructora Norte S.A.",
    content: "Antes tardaba 40 minutos en hacer un ATS de espacios confinados, ahora lo hago en la obra desde el celular mientras reviso el área.",
    rating: 5,
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.05))',
    border: 'rgba(59,130,246,0.15)',
    avatarGrad: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  },
  {
    name: "María Gómez",
    role: "Ing. en Higiene y Seguridad",
    company: "Consultora HYS Arg.",
    content: "La función de Carga de Fuego es increíble. Me ahorró horas de cálculos y formato en Excel. Lo recomiendo 100%.",
    rating: 5,
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(16,185,129,0.05))',
    border: 'rgba(52,211,153,0.15)',
    avatarGrad: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    name: "Carlos R.",
    role: "Técnico H&S",
    company: "Planta Industrial CBA",
    content: "Llevar el registro de las capacitaciones y reportes con las firmas digitalizadas me solucionó la vida en las auditorías.",
    rating: 5,
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(139,92,246,0.05))',
    border: 'rgba(168,85,247,0.15)',
    avatarGrad: 'linear-gradient(135deg, #a855f7, #7c3aed)',
  },
  {
    name: "Lorena B.",
    role: "Jefa de Seguridad",
    company: "Empresa Minera Salta",
    content: "El módulo de LOTO me permitió digitalizar todos nuestros procedimientos de bloqueo. La fiscalización quedó impresionada.",
    rating: 5,
    gradient: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,88,12,0.05))',
    border: 'rgba(249,115,22,0.15)',
    avatarGrad: 'linear-gradient(135deg, #f97316, #ea580c)',
  },
  {
    name: "Ricardo V.",
    role: "Coordinador SSO",
    company: "Logística del Sur",
    content: "La app funciona perfecta sin internet en los galpones. Mis choferes hacen la inspección pre-operacional en el celular y me llega todo.",
    rating: 5,
    gradient: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(6,182,212,0.05))',
    border: 'rgba(14,165,233,0.15)',
    avatarGrad: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  },
  {
    name: "Andrea M.",
    role: "Técnica HSMA",
    company: "Agroindustria Pampa",
    content: "Gestiono 3 empresas diferentes con una sola cuenta. El informe mensual para gerencia me lo genera automáticamente.",
    rating: 5,
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(219,39,119,0.05))',
    border: 'rgba(236,72,153,0.15)',
    avatarGrad: 'linear-gradient(135deg, #ec4899, #db2777)',
  },
];

export default function WallOfLove() {
  return (
    <div
      style={{
        padding: '5rem 1.2rem',
        background: 'linear-gradient(180deg, #020617 0%, #060d1f 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Normativas badge */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '1.5rem',
            }}
          >
            Diseñado bajo normativas internacionales
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(1rem, 5vw, 3.5rem)',
              flexWrap: 'wrap',
            }}
          >
            {['ISO 45001', 'ISO 14001', 'NFPA 10', 'Ley 19.587', 'Dec. 351/79'].map(norm => (
              <div
                key={norm}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <ShieldCheck size={16} color="rgba(96,165,250,0.6)" />
                {norm}
              </div>
            ))}
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          {/* Rating overview */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.8rem',
              padding: '0.6rem 1.5rem',
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: '100px',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.15rem' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} weight="fill" color="#fbbf24" />
              ))}
            </div>
            <span style={{ color: '#fbbf24', fontWeight: 900, fontSize: '0.95rem' }}>4.9</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
              basado en 500+ opiniones
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)',
              fontWeight: 900,
              color: 'white',
              margin: '0 0 1rem',
              fontFamily: 'var(--font-heading)',
              lineHeight: 1.1,
            }}
          >
            Profesionales que ya{' '}
            <span
              style={{
                background: 'linear-gradient(to right, #fbbf24, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              no usan papel.
            </span>
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '1rem',
              margin: '0 0 3rem',
            }}
          >
            Esto es lo que nos dicen los profesionales de toda la región.
          </p>
        </div>

        {/* Testimonials grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {testimonials.map((t, i) => (
            <div
              key={i}
              style={{
                padding: '1.8rem',
                background: t.gradient,
                border: `1px solid ${t.border}`,
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 40px ${t.border}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              {/* Quote icon */}
              <Quotes
                size={28}
                color={t.border.replace('0.15', '0.4')}
                weight="fill"
                style={{ position: 'absolute', top: '1.2rem', right: '1.2rem' }}
              />

              {/* Stars */}
              <div style={{ display: 'flex', gap: '0.2rem' }}>
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} size={14} weight="fill" color="#fbbf24" />
                ))}
              </div>

              {/* Content */}
              <p
                style={{
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: '0.95rem',
                  lineHeight: 1.65,
                  margin: 0,
                  flex: 1,
                }}
              >
                "{t.content}"
              </p>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.3rem' }}>
                <div
                  translate="no"
                  className="notranslate"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: t.avatarGrad,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${t.border}`,
                  }}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div
                    style={{
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    {t.name}
                    <CheckCircle weight="fill" color="#3b82f6" size={13} />
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                    {t.role}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>
                    {t.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
