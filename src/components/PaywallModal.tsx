import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crown, X, CheckCircle, ShieldCheck, LockKey } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps): React.ReactElement | null {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleUpgrade = () => {
    onClose();
    navigate('/subscribe');
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal Content */}
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '450px',
          background: 'var(--color-surface)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.1)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 40%)',
          pointerEvents: 'none'
        }} />

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: 'var(--color-text-muted)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 2
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <X size={18} weight="bold" />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.5rem',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)'
          }}>
            <LockKey size={36} weight="duotone" color="#8b5cf6" />
          </div>

          <h2 style={{ 
            fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', 
            color: 'var(--color-text)', letterSpacing: '-0.5px' 
          }}>
            Función Premium Requerida
          </h2>
          
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
            Para guardar tus formularios, descargar reportes y compartir, necesitas activar la versión Pro. Tus datos actuales no se han perdido.
          </p>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '12px' }}>
              <CheckCircle size={20} weight="fill" color="#10b981" />
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>Guardado ilimitado en la nube</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '12px' }}>
              <ShieldCheck size={20} weight="fill" color="#10b981" />
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>Generación de PDFs y códigos QR</span>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            style={{
              width: '100%',
              background: 'var(--gradient-premium)',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Crown size={20} weight="fill" />
            Activar Versión Pro
          </button>
          
          <button
            onClick={onClose}
            style={{
              marginTop: '1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            Seguir explorando gratis
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
