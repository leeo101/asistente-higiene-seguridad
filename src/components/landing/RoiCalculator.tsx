import React, { useState } from 'react';
import { TrendUp, Clock, CurrencyDollar, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

export default function RoiCalculator() {
  const [reportsPerWeek, setReportsPerWeek] = useState(15);
  const navigate = useNavigate();

  // Assuming each manual report takes 45 mins, and AI takes 5 mins.
  const savedMinutesPerWeek = reportsPerWeek * 40;
  const savedHoursPerMonth = Math.round((savedMinutesPerWeek * 4) / 60);
  const savedMoney = savedHoursPerMonth * 18;

  return (
    <div
      style={{
        padding: '5rem 1.2rem',
        background: 'linear-gradient(180deg, #060d1f 0%, #020617 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '300px',
          background: 'radial-gradient(ellipse, rgba(52,211,153,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '850px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '32px',
            border: '1px solid rgba(52,211,153,0.12)',
            padding: 'clamp(2rem, 5vw, 4rem)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
          }}
        >
          {/* Top glow line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.5), transparent)',
            }}
          />

          <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.3rem 0.8rem',
                background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: '100px',
                marginBottom: '1rem',
              }}
            >
              <TrendUp size={14} color="#34d399" weight="fill" />
              <span
                style={{
                  color: '#34d399',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Calculadora de ROI
              </span>
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 900,
                color: 'white',
                margin: '0 0 1rem',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Calculá tu{' '}
              <span style={{ color: '#34d399' }}>Ahorro Real</span>
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '1rem',
                margin: 0,
                maxWidth: '480px',
                marginInline: 'auto',
                lineHeight: 1.6,
              }}
            >
              Descubrí cuánto tiempo (y dinero) te ahorrás automatizando tu papelería de obra.
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Slider label */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                alignItems: 'flex-end',
              }}
            >
              <label
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 800,
                  fontSize: '1rem',
                }}
              >
                Informes / ATS por semana
              </label>
              <span
                style={{
                  fontSize: '2.8rem',
                  fontWeight: 900,
                  color: '#34d399',
                  lineHeight: 1,
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {reportsPerWeek}
              </span>
            </div>

            {/* Slider track */}
            <div style={{ position: 'relative', marginBottom: '3rem' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  height: '8px',
                  width: `${(reportsPerWeek / 50) * 100}%`,
                  background: 'linear-gradient(90deg, #059669, #34d399)',
                  borderRadius: '4px',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  transition: 'width 0.1s ease',
                }}
              />
              <input
                type="range"
                aria-label="Cantidad de informes o ATS por semana"
                min="1"
                max="50"
                value={reportsPerWeek}
                onChange={e => setReportsPerWeek(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  appearance: 'none' as const,
                  height: '8px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 2,
                }}
              />
            </div>

            <style>{`
              input[type=range]::-webkit-slider-thumb {
                appearance: none;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: linear-gradient(135deg, #34d399, #059669);
                cursor: pointer;
                box-shadow: 0 0 20px rgba(52, 211, 153, 0.5), 0 0 0 4px rgba(52,211,153,0.15);
                border: 2px solid #020617;
                transition: box-shadow 0.2s;
              }
              input[type=range]::-webkit-slider-thumb:hover {
                box-shadow: 0 0 30px rgba(52, 211, 153, 0.7), 0 0 0 6px rgba(52,211,153,0.2);
              }
            `}</style>

            {/* Result cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              <div
                style={{
                  background: 'rgba(52,211,153,0.07)',
                  border: '1px solid rgba(52,211,153,0.18)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <Clock size={32} color="#34d399" weight="duotone" style={{ margin: '0 auto 1rem' }} />
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '0.4rem',
                  }}
                >
                  Tiempo Ahorrado
                </div>
                <div
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: 900,
                    color: 'white',
                    lineHeight: 1,
                  }}
                >
                  {savedHoursPerMonth}
                  <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)' }}> hrs/mes</span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(59,130,246,0.07)',
                  border: '1px solid rgba(59,130,246,0.18)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <CurrencyDollar size={32} color="#60a5fa" weight="duotone" style={{ margin: '0 auto 1rem' }} />
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '0.4rem',
                  }}
                >
                  Valor Generado
                </div>
                <div
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: 900,
                    color: 'white',
                    lineHeight: 1,
                  }}
                >
                  ${savedMoney}
                  <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)' }}> /mes</span>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.1)',
                borderRadius: '14px',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', margin: 0, flex: 1 }}>
                <TrendUp
                  size={16}
                  color="#34d399"
                  style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }}
                />
                Con este volumen, la suscripción PRO se paga sola en el <strong style={{ color: '#34d399' }}>primer día de uso.</strong>
              </p>
              <button
                onClick={() => navigate('/login', { state: { view: 'register' } })}
                style={{
                  padding: '0.7rem 1.4rem',
                  borderRadius: '100px',
                  background: 'linear-gradient(135deg, #059669, #34d399)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: '0 8px 20px rgba(52,211,153,0.25)',
                }}
              >
                Empezar gratis <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
