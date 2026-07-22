import React, { useState, useEffect } from 'react';
import { Smartphone, X, Share, Download, CheckCircle } from 'lucide-react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIosPrompt, setIsIosPrompt] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Escuchar evento manual para abrir desde cualquier lugar de la app
    const handleManualShow = () => {
      setVisible(true);
    };
    window.addEventListener('show-pwa-install', handleManualShow);

    // Verificar si ya está instalada como PWA nativa
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      return () => window.removeEventListener('show-pwa-install', handleManualShow);
    }

    // Verificar descarte (dismissed en las últimas 24hs en lugar de permanente)
    const dismissedTime = localStorage.getItem('pwa_banner_dismissed_time');
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    if (dismissedTime && now - parseInt(dismissedTime, 10) < dayInMs) {
      // Ignorar si se descartó hace menos de 24 hs, salvo evento manual
      return () => window.removeEventListener('show-pwa-install', handleManualShow);
    }

    const ua = navigator.userAgent.toLowerCase();
    const isIos = /ipad|iphone|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);

    if (isIos && isSafari) {
      setIsIosPrompt(true);
      setVisible(true);
      return () => window.removeEventListener('show-pwa-install', handleManualShow);
    }

    // Capturar el evento beforeinstallprompt de Chrome/Android/Edge
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: mostrar pasados 3 segundos si el usuario está en móvil o desktop y no es standalone
    const timer = setTimeout(() => {
      setVisible(true);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('show-pwa-install', handleManualShow);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (isIosPrompt) {
      setShowGuide(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setVisible(false);
          localStorage.setItem('pwa_banner_dismissed_time', Date.now().toString());
        }
        setDeferredPrompt(null);
      } catch (err) {
        setShowGuide(true);
      }
    } else {
      // Mostrar instrucciones alternativas si el evento del navegador aún no se disparó
      setShowGuide(true);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setShowGuide(false);
    localStorage.setItem('pwa_banner_dismissed_time', Date.now().toString());
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15)'
      }}
      className="bottom-[5rem] md:bottom-[2rem] w-[calc(100%-2rem)] max-w-[480px] bg-slate-900/95 text-white backdrop-blur-xl rounded-[24px] p-[1.1rem] flex flex-col gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      
      <div className="flex items-center gap-3">
        <div className="w-[44px] h-[44px] flex-shrink-0 bg-blue-600/20 text-blue-400 rounded-[14px] flex items-center justify-center border border-blue-500/30">
          <Smartphone size={24} strokeWidth={2.2} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[0.95rem] text-white flex items-center gap-1.5">
            Instalar Asistente H&S
            <span className="bg-emerald-500/20 text-emerald-400 text-[0.65rem] px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">PWA</span>
          </div>
          <div className="text-[0.78rem] text-slate-300 leading-snug">
            Acceso directo rápido, trabaja offline y sin descargas pesadas.
          </div>
        </div>

        <button
          onClick={handleInstall}
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white border-none rounded-[12px] px-3.5 py-2 font-extrabold text-[0.82rem] cursor-pointer flex-shrink-0 whitespace-nowrap shadow-lg shadow-blue-600/40 transition-all flex items-center gap-1">
          <Download size={15} /> Instalar
        </button>

        <button
          onClick={handleDismiss}
          aria-label="Cerrar banner de instalación"
          className="bg-transparent border-none text-slate-400 hover:text-white cursor-pointer p-1.5 flex-shrink-0 flex items-center transition-colors rounded-full">
          <X size={18} />
        </button>
      </div>

      {showGuide && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-[16px] p-3 text-[0.8rem] text-slate-200 flex flex-col gap-2 animate-in fade-in">
          <div className="font-bold text-white flex items-center gap-1.5 text-[0.85rem]">
            <CheckCircle size={16} className="text-blue-400" /> Pasos para instalar en tu dispositivo:
          </div>
          {isIosPrompt ? (
            <ol className="m-0 pl-4 space-y-1 text-slate-300">
              <li>Tocá el botón <strong>Compartir <Share size={14} className="inline mx-0.5" /></strong> abajo en Safari.</li>
              <li>Desplazate hacia abajo y seleccioná <strong>"Agregar al inicio"</strong> 📲.</li>
            </ol>
          ) : (
            <ol className="m-0 pl-4 space-y-1 text-slate-300">
              <li>Tocá el menú del navegador <strong>(los 3 puntos ⋮ arriba a la derecha)</strong>.</li>
              <li>Seleccioná <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</li>
            </ol>
          )}
          <button
            onClick={() => setShowGuide(false)}
            className="self-end text-xs font-bold text-blue-400 hover:underline bg-transparent border-none cursor-pointer mt-1">
            Entendido
          </button>
        </div>
      )}
    </div>
  );
}