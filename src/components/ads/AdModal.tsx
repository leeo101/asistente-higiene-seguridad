import React, { useEffect, useState, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { usePaywall } from '../../hooks/usePaywall';
import { useNavigate } from 'react-router-dom';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  adSlot: string;
}

export default function AdModal({ isOpen, onClose, adSlot }: AdModalProps) {
  const { isPro } = usePaywall();
  const navigate = useNavigate();
  const adRef = useRef<HTMLModElement>(null);
  
  // Timer for forcing user to look at ad for a few seconds before closing
  const [canClose, setCanClose] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen && !isPro) {
      setCanClose(false);
      setCountdown(5);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Load Ad
      try {
        if (adRef.current && !adRef.current.dataset.adLoaded) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adRef.current.dataset.adLoaded = "true";
        }
      } catch (error) {
        console.error('AdSense popup error:', error);
      }

      return () => clearInterval(timer);
    }
  }, [isOpen, isPro]);

  if (isPro || !isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        width: '100%',
        maxWidth: '400px',
        borderRadius: '24px',
        padding: '1.5rem',
        border: '1px solid var(--color-border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        
        {/* Encabezado del Ad */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Patrocinado
          </span>
          <button 
            onClick={onClose}
            disabled={!canClose}
            style={{
              background: canClose ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)',
              color: canClose ? '#ef4444' : '#94a3b8',
              border: 'none',
              borderRadius: '50%',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canClose ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: canClose ? 1 : 0.6
            }}
          >
            {canClose ? <X size={18} /> : <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{countdown}s</span>}
          </button>
        </div>

        {/* Contenedor del Anuncio Real */}
        <div style={{ background: 'var(--color-background)', borderRadius: '12px', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'inline-block', width: '300px', height: '250px' }}
            data-ad-client="ca-pub-1680464549658020"
            data-ad-slot={adSlot || undefined}
          />
        </div>

        {/* Upsell to PRO */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.8rem' }}>
            ¿Cansado de los anuncios y esperas?
          </p>
          <button
            onClick={() => {
              onClose();
              navigate('/subscribe');
            }}
            style={{
              width: '100%',
              padding: '0.8rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <Sparkles size={16} /> Pasate a PRO ahora
          </button>
        </div>

      </div>
    </div>
  );
}
