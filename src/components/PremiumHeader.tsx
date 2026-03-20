import React from 'react';
import { Sparkles, Crown } from 'lucide-react';

interface PremiumHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  isPro?: boolean;
  daysRemaining?: number | typeof Infinity;
}

export default function PremiumHeader({
  title,
  subtitle,
  icon,
  isPro = false,
  daysRemaining
}: PremiumHeaderProps): React.ReactElement {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
      padding: '2rem',
      borderRadius: '20px 20px 0 0',
      marginBottom: '0',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)'
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
      
      {/* Premium badge */}
      {isPro && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <Crown size={16} fill="#ffffff" color="#ffffff" />
          <span style={{
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {daysRemaining === Infinity ? 'Admin' : `PRO ${daysRemaining}d`}
          </span>
        </div>
      )}
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        {icon && (
          <div style={{
            width: '70px',
            height: '70px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
          }}>
            {React.cloneElement(icon as React.ReactElement, {
              size: 36,
              color: '#ffffff',
              strokeWidth: 2.5
            })}
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <h1 style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 900,
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            letterSpacing: '-0.5px'
          }}>
            {title}
          </h1>
          <p style={{
            margin: '0.5rem 0 0',
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 600
          }}>
            {subtitle}
          </p>
        </div>
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
        `}
      </style>
    </div>
  );
}
