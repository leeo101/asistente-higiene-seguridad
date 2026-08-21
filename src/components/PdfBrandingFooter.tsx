import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface PdfBrandingFooterProps {
    documentId?: string;
    documentType?: string;
    verificationUrl?: string;
    signedBy?: string;
    timestamp?: string;
    hash?: string;
}

/**
 * PdfBrandingFooter – Pie de página legal y de marca con código QR de verificación de autenticidad y Hash SHA-256.
 */
export default function PdfBrandingFooter({
    documentId,
    documentType,
    verificationUrl,
    signedBy,
    timestamp,
    hash
}: PdfBrandingFooterProps) {
    const baseUrl = typeof window !== 'undefined' && window.location.origin 
        ? window.location.origin 
        : 'https://asistentehs.com';

    const finalVerificationUrl = verificationUrl || (documentId 
        ? `${baseUrl}/verify?id=${encodeURIComponent(documentId)}`
        : `${baseUrl}/verify`);

    const formattedDate = timestamp || new Date().toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return (
        <div className="pdf-brand-container avoid-break avoid-break-strictly" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <style>{`
                .pdf-brand-container {
                    display: block !important;
                    margin-top: 0.5rem;
                    padding-top: 0.4rem;
                    padding-bottom: 0.2rem;
                    margin-bottom: 0.2rem;
                    border-top: 2px solid #0f172a;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    background-color: #ffffff;
                }
                .pdf-legal-box {
                    border: 1px solid #e2e8f0;
                    border-left: 4px solid #0f172a;
                    background-color: #f8fafc;
                    padding: 0.6rem 0.8rem;
                    border-radius: 6px;
                    display: flex;
                    gap: 0.8rem;
                    align-items: center;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
                }

                .pdf-legal-text {
                    font-size: 0.62rem !important;
                    color: #334155 !important;
                    line-height: 1.55 !important;
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
                    font-size: 0.7rem !important;
                    display: block;
                    margin-bottom: 0.35rem;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 0.2rem;
                }
                .pdf-qr-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #cbd5e1;
                    background: #ffffff;
                    padding: 0.4rem;
                    border-radius: 6px;
                    width: 85px;
                    flex-shrink: 0;
                    text-align: center;
                }
                .pdf-qr-label {
                    font-size: 0.45rem !important;
                    font-weight: 800 !important;
                    color: #0f172a;
                    margin-top: 0.25rem;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    font-family: 'Inter', sans-serif;
                }
                .pdf-verified-badge {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border: 1.5px solid #10b981;
                    background: #f0fdf4;
                    color: #15803d;
                    padding: 0.5rem;
                    border-radius: 6px;
                    width: 75px;
                    font-family: 'Inter', sans-serif;
                    text-align: center;
                    flex-shrink: 0;
                }
                .pdf-verified-badge svg {
                    color: #10b981;
                    margin-bottom: 0.2rem;
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
                    justify-content: space-between;
                    gap: 0.5rem;
                    font-size: 0.65rem !important;
                    color: #64748b !important;
                    font-weight: 600 !important;
                    letter-spacing: 0.02em;
                    margin-top: 0.75rem;
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
                .pdf-doc-meta {
                    font-size: 0.55rem !important;
                    color: #475569 !important;
                    font-family: monospace;
                }
            `}</style>
            
            <div className="pdf-legal-box">
                <div className="pdf-legal-text">
                    <strong>Aviso Legal y Declaración Jurada</strong>
                    Quienes suscriben el presente documento declaran haber sido notificados e instruidos exhaustivamente sobre los riesgos inherentes a las tareas a realizar, comprendiendo plenamente los procedimientos de trabajo seguro y comprometiéndose irrevocablemente a utilizar los EPP y salvaguardas correspondientes. Todo el personal involucrado retiene el derecho y obligación de detener cualquier tarea (Stop Work Authority) ante condiciones de riesgo inaceptables. Documento elaborado conforme a la Ley N° 19.587 de Higiene y Seguridad en el Trabajo (Dec. 351/79, 911/96) y Ley N° 24.557 de Riesgos del Trabajo. Protección de Datos Personales resguardada bajo Ley N° 25.326.
                </div>

                <div className="pdf-qr-section">
                    <QRCodeSVG 
                        value={finalVerificationUrl} 
                        size={54}
                        level="M"
                        includeMargin={false}
                    />
                    <span className="pdf-qr-label">Escanear QR</span>
                </div>
                
                <div className="pdf-verified-badge">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="m9 11 2 2 4-4"/>
                    </svg>
                    <span className="pdf-verified-title">VERIFICADO</span>
                    <span className="pdf-verified-subtitle">FIRMA DIGITAL</span>
                </div>
            </div>

            <div className="pdf-brand">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <img src="/logo.png" alt="Asistente HYS" />
                    <span>Auditado vía <a href="https://asistentehs.com">Asistente H&S</a></span>
                </div>
                <div className="pdf-doc-meta">
                    {documentId && <span>ID: {documentId} | </span>}
                    {hash && <span title={hash}>SHA-256: {hash.substring(0, 16).toUpperCase()}... | </span>}
                    {signedBy && <span>Firmado: {signedBy} | </span>}
                    <span>Emisión: {formattedDate}</span>
                </div>
            </div>
        </div>
    );
}

