import React from 'react';

/**
 * Shared component to render the company logo with standardized styling and print-safe rules.
 */
export default function CompanyLogo({ style = {}, className = "" }) {
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';

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
