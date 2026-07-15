import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

export default function PWAReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    }
  });

  // Escuchamos el cambio de controlador del Service Worker para recargar la página inmediatamente
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        console.log('SW: Controller changed, reloading page...');
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
    // Solicitamos la actualización del Service Worker
    updateServiceWorker(true);
    // Forzamos un fallback de recarga después de 1.2 segundos por si el navegador no lo hace automáticamente
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div 
      className="fixed z-[999999] p-4 flex flex-col gap-3"
      style={{
        bottom: '24px',
        right: '24px',
        width: 'calc(100% - 48px)',
        maxWidth: '360px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.15)',
        color: '#ffffff',
        animation: 'slideUpBounce 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center text-blue-400"
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              padding: '8px',
              borderRadius: '50%',
            }}
          >
            <RefreshCw size={20} className="animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-widest text-blue-400 uppercase flex items-center gap-1">
                <Sparkles size={11} /> ACTUALIZACIÓN
              </span>
            </div>
            <h4 className="m-0 text-white text-[0.88rem] font-bold mt-0.5">
              Nueva versión disponible
            </h4>
            <p className="m-0 text-slate-300 text-[0.72rem] leading-relaxed mt-1">
              Instalá las últimas mejoras y correcciones de Asistente HYS de inmediato.
            </p>
          </div>
        </div>
        <button
          onClick={() => setNeedRefresh(false)}
          title="Cerrar" 
          className="bg-transparent border-none text-slate-400 hover:text-white cursor-pointer p-1 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <button
        onClick={handleUpdate}
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.18s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'} 
        className="border-none py-2.5 px-4 rounded-xl font-bold text-xs cursor-pointer w-full flex items-center justify-center gap-1.5"
      >
        <RefreshCw size={13} />
        ACTUALIZAR AHORA
      </button>
    </div>
  );
}