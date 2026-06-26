import React, { useState, useEffect } from 'react';
import { Smartphone, X, Share } from 'lucide-react';

/**
 * InstallBanner – Muestra un banner para instalar la PWA en el celular.
 * Detecta el evento `beforeinstallprompt` del navegador.
 */
export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIosPrompt, setIsIosPrompt] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('pwa_banner_dismissed') === 'true') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const isIos = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase());
    const isSafari = /safari/.test(navigator.userAgent.toLowerCase()) && !/chrome|crios|fxios/.test(navigator.userAgent.toLowerCase());

    if (isIos && isSafari) {
      setIsIosPrompt(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIosPrompt) return;
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      localStorage.setItem('pwa_banner_dismissed', 'true');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-[1.5rem] left-[50%] transform-[translateX(-50%)] z-[99999] w-[calc(100%_-_2.4rem)] max-w-[480px] bg-[rgba(30,_58,_138,_0.95)] backdrop-filter-[blur(12px)] webkit-backdrop-filter-[blur(12px)] rounded-[24px] p-[1.2rem] flex items-center gap-[1.2rem] box-shadow-[0_12px_40px_rgba(37,99,235,0.4)] border-[1px_solid_rgba(255,255,255,0.15)] animation-[slideUpBounce_0.6s_cubic-bezier(0.16,_1,_0.3,_1)]">


















      
            <style>{`
            @keyframes slideUpBounce {
                0%   { opacity: 0; transform: translateX(-50%) translateY(40px); }
                70%  { transform: translateX(-50%) translateY(-5px); }
                100% { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            .install-btn:hover {
                transform: scale(1.05);
            }
        `}</style>
            <div className="w-[48px] h-[48px] flex-shrink-[0] bg-[linear-gradient(135deg,_rgba(255,255,255,0.2),_rgba(255,255,255,0.05))] rounded-[16px] flex items-center justify-center box-shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border-[1px_solid_rgba(255,255,255,0.1)]">






        
                <Smartphone size={24} color="#60a5fa" strokeWidth={2.5} />
            </div>
            <div className="flex-[1] min-width-[0]">
                <div className="font-[800] text-[0.95rem] text-[#ffffff] mb-[0.2rem]">
                    Instalá Asistente HYS
                </div>
                <div className="text-[0.8rem] text-[#cbd5e1] line-height-[1.4]">
                    {isIosPrompt ?
          <div className="flex items-center gap-[0.4rem] flex-wrap">
                            Tocá <Share size={14} color="#fff" /> y elegí <strong className="text-[white]">"Agregar a inicio"</strong>
                        </div> :

          'Acceso sin internet, más rápido y seguro.'
          }
                </div>
            </div>
            {!isIosPrompt &&
      <button
        className="install-btn bg-[#3b82f6] text-[#ffffff] border-none rounded-[12px] p-[0.6rem_1.2rem] font-[800] text-[0.85rem] cursor-pointer flex-shrink-[0] white-space-[nowrap] box-shadow-[0_4px_12px_rgba(59,130,246,0.5)] transition-[transform_0.2s_ease]"
        onClick={handleInstall}>








        
                    Instalar
                </button>
      }
            <button
        onClick={handleDismiss}







        onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
        onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'} className="bg-[transparent] border-none text-[#94a3b8] cursor-pointer p-[0.4rem] flex-shrink-[0] flex items-center transition-[color_0.2s_ease] rounded-[50%]">
        
                <X size={20} />
            </button>
        </div>);

}