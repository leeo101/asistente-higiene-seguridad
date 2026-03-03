import React from 'react';

/**
 * PdfBrandingFooter – Pie de página que aparece solo al imprimir/exportar PDF.
 * Se oculta en pantalla usando CSS en index.css (.pdf-brand { display: none } @media print { display: flex }).
 */
export default function PdfBrandingFooter() {
    return (
        <>
            <style>{`
                .pdf-brand { display: none; }
                @media print {
                    .pdf-brand {
                        display: flex !important;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        margin-top: 2rem;
                        padding-top: 1rem;
                        border-top: 1px solid #e2e8f0;
                        font-size: 0.7rem;
                        color: #94a3b8;
                        font-weight: 600;
                        letter-spacing: 0.02em;
                    }
                    .pdf-brand img {
                        width: 18px;
                        height: 18px;
                        object-fit: contain;
                        opacity: 0.7;
                    }
                    .pdf-brand a {
                        color: #2563eb;
                        font-weight: 700;
                        text-decoration: none;
                    }
                }
            `}</style>
            <div className="pdf-brand">
                <img src="/logo.png" alt="Asistente HYS" />
                <span>Generado con <a href="https://asistentehs-b594e.web.app">Asistente HYS</a> — La plataforma de Higiene y Seguridad con IA</span>
            </div>
        </>
    );
}
