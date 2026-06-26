
import React, { useState, useEffect } from 'react';
import { ExternalLink, ShieldCheck, Tag } from 'lucide-react';
import { usePaywall } from '../hooks/usePaywall';

const MOCK_ADS = [
{
  title: "Pack de Protectores 3M",
  desc: "Equipamiento profesional con 20% de descuento para matriculados.",
  link: "https://www.3m.com.ar",
  tag: "Patrocinado",
  icon: <ShieldCheck size={20} color="#2563EB" />
},
{
  title: "Curso: Res. 886/15",
  desc: "Capacitación online en Ergonomía. Inicia este lunes. ¡Inscribite!",
  link: "https://www.srt.gob.ar",
  tag: "Formación",
  icon: <Tag size={20} color="#10b981" />
},
{
  title: "Software Gestión HYS",
  desc: "Digitalizá tus planillas y reportes con nuestra suite premium.",
  link: "#",
  tag: "Software",
  icon: <ShieldCheck size={20} color="#8b5cf6" />
}];



interface AdBannerProps {
  placement?: 'general' | 'home' | 'dashboard' | 'sidebar';
}

export default function AdBanner({ placement = 'general' }: AdBannerProps) {
  const { isPro } = usePaywall();
  const [currentAd, setCurrentAd] = useState(null);

  useEffect(() => {
    // Pick a random ad
    const randomAd = MOCK_ADS[Math.floor(Math.random() * MOCK_ADS.length)];
    setCurrentAd(randomAd);
  }, []);

  if (isPro || !currentAd) return null;

  const isSidebar = placement === 'sidebar';

  return (
    <div
      className="card flex gap-[1rem] relative overflow-[hidden]"
      style={{
        background: isSidebar ? 'rgba(37, 99, 235, 0.03)' : 'var(--color-surface)',
        border: isSidebar ? '1px dashed var(--color-border)' : '1px solid var(--color-border)',
        padding: isSidebar ? '0.6rem' : '1.2rem',
        margin: isSidebar ? '0.5rem 0' : '2rem 0',

        flexDirection: isSidebar ? 'column' : 'row',
        alignItems: isSidebar ? 'flex-start' : 'center'



      }}>
      
            <div className="absolute top-[0] right-[0] bg-[var(--color-background)] p-[2px_8px] text-[0.6rem] font-[700] text-[var(--color-text-muted)] rounded-[0_0_0_8px] uppercase">










        
                Anuncio
            </div>

            <div style={{
        width: isSidebar ? '32px' : '48px',
        height: isSidebar ? '32px' : '48px'






      }} className="rounded-[8px] bg-[var(--color-background)] flex items-center justify-center flex-shrink-[0]">
                {currentAd.icon}
            </div>

            <div className="flex-[1]">
                <div className="flex items-center gap-[0.5rem] mb-[0.2rem]">
                    <h5 style={{ fontSize: isSidebar ? '0.85rem' : '1rem' }} className="m-[0] font-[800]">{currentAd.title}</h5>
                    <span className="text-[0.65rem] p-[1px_6px] rounded-[4px] bg-[rgba(37,_99,_235,_0.1)] text-[var(--color-primary)] font-[700]">






            
                        {currentAd.tag}
                    </span>
                </div>
                <p style={{ fontSize: isSidebar ? '0.75rem' : '0.85rem' }} className="m-[0] text-[var(--color-text-muted)] line-height-[1.3]">
                    {currentAd.desc}
                </p>
            </div>

            <a
        href={currentAd.link}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline p-[0.4rem_0.8rem] text-[0.75rem] rounded-[6px]"
        style={{


          width: isSidebar ? '100%' : 'auto',
          marginTop: isSidebar ? '0.5rem' : 0

        }}>
        
                Ver más <ExternalLink size={12} className="ml-[4px]" />
            </a>
        </div>);

}