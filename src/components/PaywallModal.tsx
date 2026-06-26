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
    <div className="fixed inset-[0] z-[9999] flex items-center justify-center p-[1rem] animation-[fadeIn_0.2s_ease-out]">










      
      {/* Backdrop */}
      <div
        onClick={onClose} className="absolute inset-[0] bg-[rgba(0,_0,_0,_0.75)] backdrop-filter-[blur(8px)] webkit-backdrop-filter-[blur(8px)]" />







      

      {/* Modal Content */}
      <div
        className="glass-panel relative w-[100%] max-w-[450px] bg-[var(--color-surface)] border-[1px_solid_rgba(139,_92,_246,_0.3)] rounded-[24px] p-[2rem] box-shadow-[0_25px_50px_-12px_rgba(0,_0,_0,_0.5),_0_0_40px_rgba(139,_92,_246,_0.1)] animation-[slideUp_0.3s_cubic-bezier(0.16,_1,_0.3,_1)] overflow-[hidden]">












        
        {/* Glow effect */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_top_right,_rgba(139,_92,_246,_0.15),_transparent_40%)] pointer-events-[none]" />







        

        <button
          onClick={onClose}

















          onMouseOver={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.1)';e.currentTarget.style.color = '#fff';}}
          onMouseOut={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.05)';e.currentTarget.style.color = 'var(--color-text-muted)';}} className="absolute top-[1rem] right-[1rem] bg-[rgba(255,_255,_255,_0.05)] border-none text-[var(--color-text-muted)] w-[32px] h-[32px] rounded-[50%] flex items-center justify-center cursor-pointer transition-[all_0.2s] z-[2]">
          
          <X size={18} weight="bold" />
        </button>

        <div className="flex flex-col items-center text-center relative z-[1]">
          
          <div className="w-[72px] h-[72px] rounded-[20px] bg-[linear-gradient(135deg,_rgba(139,_92,_246,_0.2),_rgba(59,_130,_246,_0.2))] flex items-center justify-center mb-[1.5rem] border-[1px_solid_rgba(139,_92,_246,_0.3)] box-shadow-[0_8px_32px_rgba(139,_92,_246,_0.2)]">






            
            <LockKey size={36} weight="duotone" color="#8b5cf6" />
          </div>

          <h2 className="text-[1.5rem] font-[800] m-[0_0_0.5rem_0] text-[var(--color-text)] letter-spacing-[-0.5px]">


            
            Función Premium Requerida
          </h2>
          
          <p className="text-[var(--color-text-muted)] text-[0.95rem] m-[0_0_1.5rem_0] line-height-[1.5]">
            Para guardar tus formularios, descargar reportes y compartir, necesitas activar la versión Pro. Tus datos actuales no se han perdido.
          </p>

          <div className="w-[100%] flex flex-col gap-[0.8rem] mb-[2rem]">
            <div className="flex items-center gap-[0.8rem] bg-[rgba(255,255,255,0.03)] p-[0.8rem_1rem] rounded-[12px]">
              <CheckCircle size={20} weight="fill" color="#10b981" />
              <span className="text-[0.9rem] text-[var(--color-text)]">Guardado ilimitado en la nube</span>
            </div>
            <div className="flex items-center gap-[0.8rem] bg-[rgba(255,255,255,0.03)] p-[0.8rem_1rem] rounded-[12px]">
              <ShieldCheck size={20} weight="fill" color="#10b981" />
              <span className="text-[0.9rem] text-[var(--color-text)]">Generación de PDFs y códigos QR</span>
            </div>
          </div>

          <button
            onClick={handleUpgrade}

















            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'} className="w-[100%] bg-[var(--gradient-premium)] text-[white] border-none p-[1rem] rounded-[14px] text-[1rem] font-[700] flex items-center justify-center gap-[0.5rem] cursor-pointer transition-[all_0.3s_ease] box-shadow-[0_8px_25px_rgba(59,_130,_246,_0.4)]">
            
            <Crown size={20} weight="fill" />
            Activar Versión Pro
          </button>
          
          <button
            onClick={onClose} className="mt-[1rem] bg-[transparent] border-none text-[var(--color-text-muted)] text-[0.9rem] font-[600] cursor-pointer p-[0.5rem]">










            
            Seguir explorando gratis
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}