import React from 'react';

/**
 * PdfBrandingFooter – Pie de página legal y de marca.
 */
export default function PdfBrandingFooter() {
    return (
        <div className="pdf-brand-container avoid-break">
            <style>{`
                .pdf-brand-container { display: none; }
                @media print {
                    .pdf-brand-container {
                        display: block !important;
                        margin-top: 1.5rem;
                        padding-top: 1rem;
                        padding-bottom: 0.5rem;
                        margin-bottom: 0.5rem;
                        border-top: 2px solid #0f172a;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        background-color: #ffffff;
                    }
                }
                .force-pdf-print .pdf-brand-container {
                    display: block !important;
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    padding-bottom: 0.5rem;
                    margin-bottom: 0.5rem;
                    border-top: 2px solid #0f172a;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    background-color: #ffffff;
                }
                
                .pdf-legal-box {
                    border: 1px solid #e2e8f0;
                    border-left: 4px solid #0f172a;
                    background-color: #f8fafc;
                    padding: 1.25rem;
                    border-radius: 8px;
                    display: flex;
                    gap: 1.25rem;
                    align-items: flex-start;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
                }

                .pdf-legal-text {
                    font-size: 0.65rem !important;
                    color: #334155 !important;
                    line-height: 1.65 !important;
                    text-align: justify !important;
                    font-family: 'Times New Roman', Times, serif;
                    font-style: italic;
                    flex: 1;
                }
                .pdf-legal-text strong {
                    color: #0f172a !important;
                    font-style: normal;
                    font-family: 'Inter', sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-size: 0.72rem !important;
                    display: block;
                    margin-bottom: 0.5rem;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 0.3rem;
                }
                .pdf-verified-badge {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border: 1.5px solid #10b981;
                    background: #f0fdf4;
                    color: #15803d;
                    padding: 0.6rem;
                    border-radius: 6px;
                    width: 75px;
                    font-family: 'Inter', sans-serif;
                    text-align: center;
                    flex-shrink: 0;
                    margin-top: 1.2rem;
                }
                .pdf-verified-badge svg {
                    color: #10b981;
                    margin-bottom: 0.25rem;
                }
                .pdf-verified-title {
                    font-size: 0.45rem !important;
                    font-weight: 900 !important;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    line-height: 1.1;
                }
                .pdf-verified-subtitle {
                    font-size: 0.35rem !important;
                    font-weight: 500 !important;
                    color: #166534;
                    margin-top: 1px;
                }
                .pdf-brand {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-size: 0.65rem !important;
                    color: #64748b !important;
                    font-weight: 600 !important;
                    letter-spacing: 0.02em;
                    margin-top: 0.85rem;
                    font-family: 'Inter', sans-serif;
                }
                .pdf-brand img {
                    width: 18px !important;
                    height: 18px !important;
                    object-fit: contain !important;
                    opacity: 0.95 !important;
                }
                .pdf-brand a {
                    color: #0f172a !important;
                    font-weight: 800 !important;
                    text-decoration: none;
                }
            `}</style>
            
            <div className="pdf-legal-box">
                <div className="pdf-legal-text">
                    <strong>Aviso Legal y Declaración Jurada</strong>
                    Quienes suscriben el presente documento declaran haber sido notificados e instruidos exhaustivamente sobre los riesgos inherentes a las tareas a realizar, comprendiendo plenamente los procedimientos de trabajo seguro y comprometiéndose irrevocablemente a utilizar los Elementos de Protección Personal (EPP) y salvaguardas correspondientes. Todo el personal involucrado retiene el derecho, la autoridad y la obligación indelegable de detener inmediatamente cualquier tarea (Stop Work Authority) si las condiciones de seguridad descriptas sufrieran modificaciones que representen un riesgo inaceptable o peligro inminente. La validez de este documento se circunscribe de manera exclusiva a la jornada, área y tareas aquí especificadas, debiendo emitirse un nuevo instrumento ante cualquier modificación eventual del entorno, maquinarias o personal asignado. Documento elaborado en estricta concordancia con los lineamientos exigidos por la Ley N° 19.587 de Higiene y Seguridad en el Trabajo, sus Decretos Reglamentarios (Dec. 351/79, 911/96) y la Ley N° 24.557 de Riesgos del Trabajo de la República Argentina. Los datos biométricos y firmas recabados serán resguardados conforme a la Ley N° 25.326 de Protección de Datos Personales, con fines de cumplimiento registral autorizable en materia de gestión de Prevención de Riesgos Laborales.
                </div>
                
                <div className="pdf-verified-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="m9 11 2 2 4-4"/>
                    </svg>
                    <span className="pdf-verified-title">AUDITADO</span>
                    <span className="pdf-verified-subtitle">EHS-COMPLIANT</span>
                </div>
            </div>

            <div className="pdf-brand">
                <img src="/logo.png" alt="Asistente HYS" />
                <span>Documento oficial auditado mediante tecnología de <a href="https://asistentehs.com">Asistente H&S</a></span>
            </div>
        </div>
    );
}
