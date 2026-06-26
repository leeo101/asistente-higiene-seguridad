import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ArrowsClockwise, X } from '@phosphor-icons/react';

export default function PWAReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {

      // Optional: Check for updates periodically
    }, onRegisterError(error) {
      console.error('SW registration error', error);
    }
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-[5rem] right-[1.5rem] z-[99999] bg-[var(--glass-bg-header,_rgba(15,_23,_42,_0.95))] backdrop-filter-[blur(20px)] webkit-backdrop-filter-[blur(20px)] border-[1px_solid_var(--glass-border,_rgba(56,_189,_248,_0.3))] rounded-[16px] p-[1rem] w-[calc(100%_-_3rem)] max-w-[350px] box-shadow-[0_20px_40px_rgba(0,0,0,0.3),_0_0_0_1px_rgba(56,_189,_248,_0.2)] animation-[slideUpBounce_0.5s_cubic-bezier(0.16,_1,_0.3,_1)] flex flex-col gap-[0.8rem]">

















      
            <div className="flex items-start justify-space-between gap-[1rem]">
                <div className="flex items-center gap-[0.6rem]">
                    <div className="bg-[rgba(56,_189,_248,_0.15)] p-[0.5rem] rounded-[50%] flex items-center justify-center text-[#38bdf8]">







            
                        <ArrowsClockwise size={24} weight="bold" />
                    </div>
                    <div>
                        <h4 className="m-[0] text-[#fff] text-[0.9rem] font-[800]">
                            Nueva actualización
                        </h4>
                        <p className="m-[0.2rem_0_0] text-[rgba(255,255,255,0.7)] text-[0.75rem] line-height-[1.4]">
                            Hay una nueva versión disponible. Actualizá para acceder a las últimas mejoras.
                        </p>
                    </div>
                </div>
                <button
          onClick={() => setNeedRefresh(false)}







          title="Cerrar" className="bg-[transparent] border-none text-[rgba(255,255,255,0.5)] cursor-pointer p-[0.2rem]">
          
                    <X size={18} weight="bold" />
                </button>
            </div>
            
            <button
        onClick={() => updateServiceWorker(true)}













        onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'} className="bg-[#38bdf8] text-[#0f172a] border-none p-[0.6rem] rounded-[8px] font-[800] text-[0.85rem] cursor-pointer w-[100%] box-shadow-[0_4px_12px_rgba(56,_189,_248,_0.3)] transition-[transform_0.2s_ease,_filter_0.2s_ease]">
        
                Actualizar ahora
            </button>
        </div>);

}