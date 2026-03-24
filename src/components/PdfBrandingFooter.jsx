import React from 'react';

/**
 * PdfBrandingFooter – Pie de página legal y de marca.
 */
export default function PdfBrandingFooter() {
    return (
        <div className="pdf-brand-container">
            <style>{`
                .pdf-brand-container { display: none; }
                @media print {
                    .pdf-brand-container {
                        display: flex !important;
                        flex-direction: column;
                        margin-top: 2rem;
                        padding-top: 1.5rem;
                        border-top: 1px solid #e2e8f0;
                        gap: 1rem;
                        page-break-inside: avoid;
                    }
                }
                .force-pdf-print .pdf-brand-container {
                    display: flex !important;
                    flex-direction: column;
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid #e2e8f0;
                    gap: 1rem;
                }
                
                @media print {
                    .pdf-legal-text {
                        font-size: 0.55rem;
                        color: #64748b;
                        line-height: 1.5;
                        text-align: justify;
                    }
                    .pdf-legal-text strong {
                        color: #475569;
                    }
                    .pdf-brand {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        font-size: 0.7rem;
                        color: #94a3b8;
                        font-weight: 600;
                        letter-spacing: 0.02em;
                        margin-top: 0.5rem;
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

                .force-pdf-print .pdf-legal-text {
                    font-size: 0.55rem;
                    color: #64748b;
                    line-height: 1.5;
                    text-align: justify;
                }
                .force-pdf-print .pdf-legal-text strong {
                    color: #475569;
                }
                .force-pdf-print .pdf-brand {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-size: 0.7rem;
                    color: #94a3b8;
                    font-weight: 600;
                    letter-spacing: 0.02em;
                    margin-top: 0.5rem;
                }
                .force-pdf-print .pdf-brand img {
                    width: 18px;
                    height: 18px;
                    object-fit: contain;
                    opacity: 0.7;
                }
                .force-pdf-print .pdf-brand a {
                    color: #2563eb;
                    font-weight: 700;
                    text-decoration: none;
                }
            `}</style>
            
            <div className="pdf-legal-text">
                <strong>AVISO LEGAL Y DECLARACIÓN JURADA:</strong> Este documento reviste carácter de Declaración Jurada. Quienes suscriben declaran haber sido notificados e instruidos sobre los riesgos inherentes a las tareas a realizar, comprendiendo plenamente los procedimientos de trabajo seguro y comprometiéndose a utilizar los Elementos de Protección Personal (EPP) y salvaguardas correspondientes. Todo el personal involucrado tiene el derecho, la autoridad y la obligación de detener inmediatamente cualquier tarea (Stop Work Authority) si las condiciones de seguridad descriptas cambian y representan un riesgo inaceptable o peligro inminente. La validez de este documento se limita exclusivamente a la jornada, área y tareas especificadas, debiendo emitirse uno nuevo ante cualquier modificación eventual del entorno, tareas o personal. Documento elaborado en concordancia con los requerimientos de la Ley N° 19.587 de Higiene y Seguridad en el Trabajo, sus Decretos Reglamentarios y la Ley N° 24.557 de Riesgos del Trabajo de la República Argentina. Los datos y firmas aquí recabados serán tratados conforme a la Ley N° 25.326 de Protección de Datos Personales, con fines exclusivos de cumplimiento registral en materia de gestión de seguridad laboral.
            </div>

            <div className="pdf-brand">
                <img src="/logo.png" alt="Asistente HYS" />
                <span>Generado con <a href="https://asistentehs.com">Asistente HYS</a> — La plataforma de Higiene y Seguridad con IA</span>
            </div>
        </div>
    );
}
