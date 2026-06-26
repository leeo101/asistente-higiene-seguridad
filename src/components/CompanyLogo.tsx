import React from 'react';

// Tipos
interface CompanyLogoProps {
  style?: React.CSSProperties;
  className?: string;
}

interface SharedLogoData {
  logo: string;
  show: boolean;
}

// Extender window para TypeScript
declare global {
  interface Window {
    sharedLogoData?: SharedLogoData;
  }
}

/**
 * Lee el logo de localStorage de forma robusta:
 * Soporta tanto el valor raw (base64) como envuelto en JSON {value: "..."}
 * para ser resistente a inconsistencias de sincronización.
 */
function readLogoFromStorage(): string | null {
  try {
    const raw = localStorage.getItem('companyLogo');
    if (!raw || raw === 'null' || raw === 'undefined' || raw === '') return null;
    // Si el valor empieza con data: o http, es directamente el logo
    if (raw.startsWith('data:') || raw.startsWith('http')) return raw;
    // Puede ser JSON {value: "..."} guardado por pullAllFromCloud (bug anterior)
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.value === 'string' && parsed.value) return parsed.value;
        if (typeof parsed.logo === 'string' && parsed.logo) return parsed.logo;
      }
    } catch {/* no era JSON */}
    return raw;
  } catch {
    return null;
  }
}

function readShowLogoFromStorage(): boolean {
  try {
    const raw = localStorage.getItem('showCompanyLogo');
    if (raw === null) return true; // default: mostrar
    if (raw === 'false') return false;
    if (raw === 'true') return true;
    // Puede ser JSON {value: true/false} guardado por pullAllFromCloud (bug anterior)
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && 'value' in parsed) return Boolean(parsed.value);
    } catch {/* no era JSON */}
    return true;
  } catch {
    return true;
  }
}

/**
 * Shared component to render the company logo with standardized styling and print-safe rules.
 */
export default function CompanyLogo({ style = {}, className = '' }: CompanyLogoProps): React.ReactElement | null {
  // If we are in public view, the logo might be passed via window.sharedLogoData
  const sharedData = typeof window !== 'undefined' ? window.sharedLogoData : null;

  const companyLogo = sharedData ? sharedData.logo : readLogoFromStorage();
  const showLogo = sharedData ? sharedData.show : readShowLogoFromStorage();

  if (!companyLogo || !showLogo) return null;

  return (
    <>
      <style>
        {`
        @media print {
          .shared-company-logo {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }
        `}
      </style>
      <img
        src={companyLogo}
        alt="Logo de empresa"
        className={`shared-company-logo  h-[45px] w-[auto] object-fit-[contain] max-w-[150px] ${className}`}
        style={{




          ...style
        }} />
      
    </>);

}