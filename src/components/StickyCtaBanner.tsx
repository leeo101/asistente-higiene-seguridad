import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from '@phosphor-icons/react';

/**
 * Sticky bottom CTA for anonymous visitors.
 * Shows up after scrolling 30% of the page, can be dismissed.
 */
export default function StickyCtaBanner() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('sticky_cta_dismissed')) return;

    const handleScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrolled > 0.18 && !visible) {
        setVisible(true);
        setTimeout(() => setAnimateIn(true), 50);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visible]);

  const handleDismiss = () => {
    setAnimateIn(false);
    setTimeout(() => {
      setDismissed(true);
      setVisible(false);
    }, 300);
    sessionStorage.setItem('sticky_cta_dismissed', '1');
  };

  if (!visible || dismissed) return null;

  return (
    <div style={{












      transform: animateIn ? 'translateY(0)' : 'translateY(100%)'

    }} className="fixed bottom-[0] left-[0] right-[0] z-[8000] p-[0.9rem_1rem] backdrop-filter-[blur(20px)] webkit-backdrop-filter-[blur(20px)] bg-[rgba(2,_6,_23,_0.92)] border-top-[1px_solid_rgba(59,130,246,0.25)] box-shadow-[0_-8px_32px_rgba(0,_0,_0,_0.5)] flex items-center gap-[0.8rem] transition-[transform_0.4s_cubic-bezier(0.16,_1,_0.3,_1)]">
            {/* Glow line at top */}
            <div className="absolute top-[0] left-[0] right-[0] h-[1px] bg-[linear-gradient(90deg,_transparent,_rgba(59,130,246,0.6),_rgba(168,85,247,0.6),_transparent)] pointer-events-[none]" />





      

            {/* Live indicator */}
            <div className="w-[8px] h-[8px] rounded-[50%] bg-[#34d399] flex-shrink-[0] box-shadow-[0_0_8px_#34d399] animation-[pulse-soft_2s_ease_infinite]" />








      

            <div className="flex-[1] min-width-[0]">
                <div className="text-[#ffffff] font-[800] text-[0.95rem] line-height-[1.2]">
                    Gratis, sin tarjeta de crédito
                </div>
                <div className="text-[rgba(255,255,255,0.5)] text-[0.78rem] mt-[0.1rem]">
                    ATS, Cálculos y Cámara IA disponibles ahora
                </div>
            </div>

            <button
        onClick={() => navigate('/login', { state: { view: 'register' } })}

















        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(59,130,246,0.5)';
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(59,130,246,0.3)';
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        }} className="bg-[linear-gradient(135deg,_#3b82f6,_#8b5cf6)] text-[white] border-none rounded-[12px] p-[0.65rem_1.1rem] font-[800] text-[0.85rem] cursor-pointer flex-shrink-[0] flex items-center gap-[0.4rem] box-shadow-[0_4px_16px_rgba(59,130,246,0.3)] white-space-[nowrap] transition-[all_0.2s_ease]">
        
                Empezar gratis <ArrowRight size={18} weight="bold" />
            </button>

            <button
        onClick={handleDismiss}
        aria-label="Cerrar"














        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
          (e.currentTarget as HTMLButtonElement).style.color = 'white';
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
        }} className="bg-[rgba(255,255,255,0.07)] border-[1px_solid_rgba(255,255,255,0.1)] rounded-[50%] w-[32px] h-[32px] p-[0] flex items-center justify-center cursor-pointer text-[rgba(255,255,255,0.5)] flex-shrink-[0] transition-[all_0.2s]">
        
                <X size={14} />
            </button>
        </div>);

}