import React from 'react';
import { Sparkles, Crown, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  size?: string;
  color?: string;
  gradient?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}

export default function PremiumHeader({
  title,
  subtitle,
  icon,
  onBack,
  color,
  gradient,
  children
}: PremiumHeaderProps): React.ReactElement {
  const bg = gradient || color || 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)';
  const navigate = useNavigate();

  return (
    <div style={{
      background: bg,
      padding: 'clamp(1rem, 3vw, 2rem)',
      borderRadius: '20px',
      marginTop: '0.5rem',
      marginBottom: '0',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Animated background pattern */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        animation: 'shimmer 3s infinite linear',
        pointerEvents: 'none'
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(0.75rem, 2vw, 1.5rem)',
        flexWrap: 'wrap',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        {/* Botones de navegación para desktop (ocultos en móvil mediante CSS) */}
        <div className="desktop-nav-buttons no-print" style={{ marginRight: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
                onClick={() => { if(onBack) onBack(); else navigate(-1); }}
                style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '8px', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', backdropFilter: 'blur(10px)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
                <ArrowLeft size={16} /> VOLVER
            </button>
            <button 
                onClick={() => navigate('/')}
                style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '8px', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', backdropFilter: 'blur(10px)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
                <Home size={16} /> INICIO
            </button>
        </div>

        {icon && (
          <div style={{
            width: 'clamp(50px, 15vw, 70px)',
            height: 'clamp(50px, 15vw, 70px)',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            flexShrink: 0
          }}>
            {React.cloneElement(icon as React.ReactElement, {
              size: undefined,
              width: '60%',
              height: '60%',
              color: '#ffffff',
              strokeWidth: 2.5
            } as any)}
          </div>
        )}

        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(1.25rem, 4vw, 2rem)',
            fontWeight: 900,
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            letterSpacing: '-0.5px',
            lineHeight: 1.2
          }}>
            {title}
          </h1>
          <p style={{
            margin: '0.5rem 0 0',
            fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 600
          }}>
            {subtitle}
          </p>
        </div>
        {children}
      </div>

      {/* Sparkle effect */}
      <Sparkles
        size={24}
        color="#ffffff"
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          opacity: 0.6,
          animation: 'twinkle 2s infinite ease-in-out'
        }}
      />

      <style>
        {`
          @keyframes shimmer {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @media (max-width: 640px) {
            .premium-header-content {
              flex-direction: column;
              text-align: center;
            }
          }
          @media (max-width: 768px) {
            .desktop-nav-buttons {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
