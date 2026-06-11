import { useEffect } from 'react';
import { usePaywall } from '../../hooks/usePaywall';
import { useLocation } from 'react-router-dom';

export default function AutoAdsManager() {
  const { isPro, isLoading } = usePaywall();
  const location = useLocation();

  useEffect(() => {
    // Wait until we know if the user is PRO
    if (isLoading) return;

    // Si es PRO, nos aseguramos de no inyectar nada
    if (isPro) return;

    // Solo inyectar el script una vez
    const existingScript = document.getElementById('adsense-auto-ads');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'adsense-auto-ads';
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1680464549658020';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, [isPro, isLoading]);

  return null;
}
