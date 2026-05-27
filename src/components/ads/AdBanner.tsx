import React, { useEffect, useRef } from 'react';
import { usePaywall } from '../../hooks/usePaywall';

interface AdBannerProps {
  adSlot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
}

export default function AdBanner({ adSlot, format = 'auto', responsive = true }: AdBannerProps) {
  const { isPro } = usePaywall();
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Si el usuario es Pro, no cargamos el anuncio
    if (isPro) return;

    try {
      if (adRef.current && !adRef.current.dataset.adLoaded) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adRef.current.dataset.adLoaded = "true";
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [isPro, adSlot]);

  // Si el usuario es PRO, devolvemos null (no renderiza absolutamente nada)
  if (isPro) return null;

  return (
    <div className="ad-container" style={{ textAlign: 'center', margin: '1rem 0', width: '100%', overflow: 'hidden' }}>
      <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '0.5rem' }}>
        Publicidad
      </span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1680464549658020"
        data-ad-slot={adSlot || undefined}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
