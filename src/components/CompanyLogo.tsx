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
 * Shared component to render the company logo with standardized styling and print-safe rules.
 */
export default function CompanyLogo({ style = {}, className = '' }: CompanyLogoProps): React.ReactElement | null {
  // If we are in public view, the logo might be passed via window.sharedLogoData
  const sharedData = typeof window !== 'undefined' ? window.sharedLogoData : null;

  const companyLogo = sharedData ? sharedData.logo : localStorage.getItem('companyLogo');
  const showLogo = sharedData ? sharedData.show : (localStorage.getItem('showCompanyLogo') !== 'false');

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
        className={`shared-company-logo ${className}`}
        style={{
          height: '45px',
          width: 'auto',
          objectFit: 'contain',
          maxWidth: '150px',
          ...style
        }}
      />
    </>
  );
}
