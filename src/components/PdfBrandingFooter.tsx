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
                        margin-top: 1.5rem; /* Reducido para que la línea final entre en la primera hoja */
                        padding-top: 1rem;
                        padding-bottom: 0.5rem;
                        margin-bottom: 0.5rem;
                        border-top: 2px solid #1e293b;
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
                    border-top: 2px solid #1e293b;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    background-color: #ffffff;
                }
                
                .pdf-legal-box {
                    border: 1px solid #cbd5e1;
                    background-color: #f8fafc;
                    padding: 1.25rem;
                    border-radius: 4px;
                }

                .pdf-legal-text {
                    font-size: 0.65rem !important;
                    color: #334155 !important;
                    line-height: 1.6 !important;
                    text-align: justify !important;
                    font-family: 'Times New Roman', Times, serif;
                    font-style: italic;
                }
                .pdf-legal-text strong {
                    color: #0f172a !important;
                    font-style: normal;
                    font-family: 'Inter', sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-size: 0.7rem !important;
                    display: block;
                    margin-bottom: 0.5rem;
                    border-bottom: 1px solid #cbd5e1;
                    padding-bottom: 0.3rem;
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
                    margin-top: 0.75rem;
                    font-family: 'Inter', sans-serif;
                }
                .pdf-brand img {
                    width: 16px !important;
                    height: 16px !important;
                    object-fit: contain !important;
                    opacity: 0.8 !important;
                    filter: grayscale(100%) !important;
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
                    Quienes suscriben el presente documento declaran haber sido notificados e instruidos exhaustivamente sobre los riesgos inherentes a las tareas a realizar, comprendiendo plenamente los procedimientos de trabajo seguro y comprometiéndose irrevocablemente a utilizar los Elementos de Protección Personal (EPP) y salvaguardas correspondientes. Todo el personal involucrado retiene el derecho, la autoridad y la obligación indelegable de detener inmediatamente cualquier tarea (Stop Work Authority) si las condiciones de seguridad descriptas sufrieran modificaciones que representen un riesgo inaceptable o peligro inminente. La validez de este documento se circunscribe de manera exclusiva a la jornada, área y tareas aquí especificadas, debiendo emitirse un nuevo instrumento ante cualquier modificación eventual del entorno, maquinarias o personal asignado. Documento elaborado en estricta concordancia con los lineamientos exigidos por la Ley N° 19.587 de Higiene y Seguridad en el Trabajo, sus Decretos Reglamentarios (Dec. 351/79, 911/96) y la Ley N° 24.557 de Riesgos del Trabajo de la República Argentina. Los datos biométricos y firmas recabados serán resguardados conforme a la Ley N° 25.326 de Protección de Datos Personales, con fines de cumplimiento registral auditorable en materia de gestión de Prevención de Riesgos Laborales.
                </div>
            </div>

            <div className="pdf-brand">
                <img src="/logo.png" alt="Asistente HYS" />
                <span>Documento oficial auditado mediante tecnología de <a href="https://asistentehs.com">Asistente H&S</a></span>
            </div>
        </div>
    );
}
