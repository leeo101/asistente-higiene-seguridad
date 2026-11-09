import React from 'react';
import { Sparkles, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface PremiumHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  icon?: React.ReactNode;
  size?: string;
  color?: string;
  gradient?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}

/**
 * Resolves either a CSS gradient/color string OR a Tailwind `from-...` string
 * into a guaranteed valid CSS `linear-gradient(...)` background so it never renders transparent.
 */
function resolveHeaderBackground(gradient?: string, color?: string): string {
  const raw = (gradient || color || '').trim();
  if (!raw) {
    return 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0284c7 100%)';
  }
  // Already valid CSS gradient or color
  if (
    raw.startsWith('linear-gradient') ||
    raw.startsWith('radial-gradient') ||
    raw.startsWith('#') ||
    raw.startsWith('rgb') ||
    raw.startsWith('hsl') ||
    raw.startsWith('var(')
  ) {
    return raw;
  }

  // Convert Tailwind gradient shorthand (e.g. "from-sky-600 via-blue-600 to-indigo-700") into CSS linear-gradient
  const lower = raw.toLowerCase();
  if (lower.includes('emerald') || lower.includes('teal') || lower.includes('green')) {
    return 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%)';
  }
  if (lower.includes('amber') || lower.includes('orange') || lower.includes('yellow')) {
    return 'linear-gradient(135deg, #d97706 0%, #ea580c 50%, #b45309 100%)';
  }
  if (lower.includes('rose') || lower.includes('red') || lower.includes('crimson')) {
    return 'linear-gradient(135deg, #dc2626 0%, #e11d48 50%, #991b1b 100%)';
  }
  if (lower.includes('purple') || lower.includes('violet') || lower.includes('fuchsia')) {
    return 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #4f46e5 100%)';
  }
  if (lower.includes('slate') || lower.includes('zinc') || lower.includes('gray')) {
    return 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #0f172a 100%)';
  }
  // Default blue/sky/indigo corporate gradient
  return 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4338ca 100%)';
}

export default function PremiumHeader({
  title,
  subtitle,
  badge,
  icon,
  onBack,
  color,
  gradient,
  children
}: PremiumHeaderProps): React.ReactElement {
  const bg = resolveHeaderBackground(gradient, color);
  const navigate = useNavigate();
  const { t, adaptText, countryNorms } = useLanguage();

  const adaptedTitle = adaptText(title);
  const adaptedSubtitle = adaptText(subtitle);
  const adaptedBadge = badge
    ? adaptText(badge)
    : `${countryNorms.flag} ${countryNorms.name} · ${countryNorms.general}`;

  return (
    <div
      style={{
        background: bg,
        padding: 'clamp(1rem, 2.5vw, 1.75rem)',
        borderRadius: '20px',
        marginTop: '0.25rem',
        marginBottom: 0,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}
    >
      {/* Subtle decorative radial highlight */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-30%',
          width: '160%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 65%)',
          pointerEvents: 'none'
        }}
      />

      {/* Content */}
      <div
        className="premium-header-content"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(0.75rem, 2vw, 1.35rem)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        {/* Navigation buttons for desktop (hidden on mobile via CSS) */}
        <div
          className="desktop-nav-buttons no-print"
          style={{
            marginRight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem'
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                if (pathParts.length === 1) {
                  navigate('/', { state: { scrollTo: pathParts[0] } });
                } else {
                  navigate(-1);
                }
              }
            }}
            style={{
              marginBottom: 0,
              width: 'auto',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              borderRadius: '10px',
              padding: '0.45rem 0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.78rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.28)',
              minHeight: 'unset',
              lineHeight: 1
            }}
          >
            <ArrowLeft size={15} style={{ flexShrink: 0 }} /> {t('nav.back')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              marginBottom: 0,
              width: 'auto',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              borderRadius: '10px',
              padding: '0.45rem 0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.78rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.28)',
              minHeight: 'unset',
              lineHeight: 1
            }}
          >
            <Home size={15} style={{ flexShrink: 0 }} /> {t('nav.home').toUpperCase()}
          </button>
        </div>

        {icon && (
          <div
            style={{
              width: 'clamp(46px, 11vw, 64px)',
              height: 'clamp(46px, 11vw, 64px)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.18)',
              flexShrink: 0,
              color: '#ffffff'
            }}
          >
            {React.cloneElement(
              icon as React.ReactElement,
              {
                size: undefined,
                width: '58%',
                height: '58%',
                color: '#ffffff',
                strokeWidth: 2.4
              } as any
            )}
          </div>
        )}

        <div style={{ flex: 1, minWidth: '210px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              flexWrap: 'wrap'
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(1.2rem, 3.6vw, 1.95rem)',
                fontWeight: 900,
                color: '#ffffff',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.22)',
                letterSpacing: '-0.4px',
                lineHeight: 1.2
              }}
            >
              {adaptedTitle}
            </h1>
            {adaptedBadge && (
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.38)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.22rem 0.7rem',
                  borderRadius: '9999px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  whiteSpace: 'nowrap'
                }}
              >
                {adaptedBadge}
              </span>
            )}
          </div>
          <p
            style={{
              margin: '0.45rem 0 0 0',
              fontSize: 'clamp(0.8rem, 2.2vw, 0.96rem)',
              color: 'rgba(255, 255, 255, 0.94)',
              fontWeight: 600,
              lineHeight: 1.4
            }}
          >
            {adaptedSubtitle}
          </p>
        </div>

        {children}
      </div>

      {/* Sparkle effect */}
      <Sparkles
        size={20}
        color="#ffffff"
        style={{
          position: 'absolute',
          top: '0.85rem',
          right: '0.95rem',
          opacity: 0.55,
          pointerEvents: 'none'
        }}
      />

      <style>
        {`
          @media (max-width: 640px) {
            .premium-header-content {
              flex-direction: column;
              text-align: center;
              gap: 0.55rem !important;
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
