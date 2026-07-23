import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PWAReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] SW Registered', r);
    },
    onRegisterError(error) {
      console.error('[PWA] SW registration error', error);
    }
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Escuchamos el cambio de controlador del Service Worker para recargar la página inmediatamente
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        console.log('[PWA] SW: Controller changed, reloading page...');
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  if (!needRefresh) return null;

  const handleUpdate = () => {
    setIsUpdating(true);
    setNeedRefresh(false);
    try {
      updateServiceWorker(true);
    } catch {
      // ignore
    }
    // Hard reload instantáneo de fallback
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <div 
      className="fixed z-[9999999] p-4 flex flex-col gap-3"
      style={{
        bottom: '24px',
        right: '24px',
        width: 'calc(100% - 48px)',
        maxWidth: '380px',
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(59, 130, 246, 0.5)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 25px rgba(59, 130, 246, 0.25)',
        color: '#ffffff',
        animation: 'slideUpBounce 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes slideUpBounce {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center text-blue-400 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.1))',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              width: '42px',
              height: '42px',
              borderRadius: '12px',
            }}
          >
            <RefreshCw size={22} className={isUpdating ? 'animate-spin' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[0.62rem] font-black tracking-widest text-blue-400 uppercase flex items-center gap-1">
                <Sparkles size={11} /> PWA · ACTUALIZACIÓN
              </span>
            </div>
            <h4 className="m-0 text-white text-[0.92rem] font-black leading-tight">
              Nueva versión disponible
            </h4>
            <p className="m-0 text-slate-300 text-[0.75rem] leading-snug mt-1 font-medium">
              Instalá las últimas mejoras y correcciones del sistema de inmediato.
            </p>
          </div>
        </div>
        <button
          onClick={() => setNeedRefresh(false)}
          title="Cerrar aviso" 
          className="bg-transparent border-none text-slate-400 hover:text-white cursor-pointer p-1 transition-colors flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>
      
      <button
        onClick={handleUpdate}
        disabled={isUpdating}
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
        className="border-none py-3 px-4 rounded-xl font-black text-xs cursor-pointer w-full flex items-center justify-center gap-2 tracking-wide uppercase"
      >
        {isUpdating ? (
          <>
            <RefreshCw size={15} className="animate-spin" />
            <span>Recargando sistema...</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={15} />
            <span>Actualizar y recargar ahora</span>
          </>
        )}
      </button>
    </div>
  );
}