import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Check, X } from 'lucide-react';

export default function ChecklistPdfGenerator({ checklistData }) {
    const [fullData, setFullData] = useState(null);

    // Obtener logo de empresa
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';

    // Debug: verificar si el logo existe
    useEffect(() => {
        if (companyLogo && showLogo) {
            console.log('[Checklist] Logo cargado:', companyLogo.substring(0, 50) + '...');
        } else if (!companyLogo) {
            console.log('[Checklist] No hay logo guardado');
        } else if (!showLogo) {
            console.log('[Checklist] Logo desactivado por el usuario');
        }
    }, [companyLogo, showLogo]);

    useEffect(() => {
        if (checklistData?.id) {
            const stored = localStorage.getItem(`checklist_${checklistData.id}`);
            if (stored) {
                try {
                    setFullData(JSON.parse(stored));
                } catch (e) {
                    console.error('Error parsing checklist data', e);
                }
            }
        }
    }, [checklistData]);

    if (!checklistData || !fullData) return null;

    const sections = fullData.activeSections || [];
    const compInfo = fullData.companyInfo || {};
    const inspInfo = fullData.inspectionInfo || {};
    const obs = fullData.observations || '';

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area border-none shadow-none"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm', background: '#ffffff', color: '#000000',
                    boxSizing: 'border-box', margin: '0 auto', fontSize: '10pt',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
            >
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area {
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 5mm !important;
                            width: 100% !important;
                            max-width: none !important;
                            border: none !important;
                            border-radius: 0 !important;
                        }
                        .company-logo {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    `}
                </style>

                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e293b' }}>Control H&S</p>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.5rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#1e293b' }}>CHECK LIST</h1>
                        <p style={{ margin: 0, color: '#64748b', fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '0.25rem' }}>Higiene y Seguridad</p>
                    </div>

                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        {companyLogo && showLogo && (
                            <img
                                className="company-logo"
                                src={companyLogo}
                                alt="Logo de empresa"
                                style={{
                                    height: '40px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    maxWidth: '120px',
                                    WebkitPrintColorAdjust: 'exact',
                                    printColorAdjust: 'exact',
                                    colorAdjust: 'exact'
                                }}
                            />
                        )}
                        <div>
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>DOCUMENTO N°</div>
                            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', borderBottom: '2px solid #e2e8f0', display: 'inline-block', paddingBottom: '2px' }}>{inspInfo.serial || checklistData.serial || 'S/N'}</div>
                        </div>
                    </div>
                </div>

                {/* Information Box */}
                <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: '2.5rem', width: '100%', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: '2px solid #e2e8f0', width: '100%' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>CLIENTE / EMPRESA</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.name || checklistData.empresa || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>CUIT / CUIL</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.cuit || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>UBICACIÓN / OBRA</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.location || '-'}</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', width: '100%' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>EQUIPO REVISADO</span>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2563eb' }}>{inspInfo.item || checklistData.equipo || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>FECHA REVISIÓN</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{inspInfo.date || new Date().toLocaleDateString()}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>OPERADOR / INSPECTOR</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.inspector || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    {sections.map(section => (
                        <div key={section.id} style={{ border: '2px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', color: '#1e293b' }}>{section.title}</h3>
                            </div>
                            <div>
                                {section.items.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '40px 1fr 100px',
                                        borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid #f1f5f9',
                                        alignItems: 'stretch',
                                        pageBreakInside: 'avoid'
                                    }}>
                                        <div style={{ padding: '0.8rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <div style={{ background: '#f8fafc', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', border: '1px solid #e2e8f0' }}>{idx + 1}</div>
                                        </div>
                                        <div style={{ padding: '0.8rem 1rem 0.8rem 0', display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                                            {item.text}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.8rem', borderLeft: '1px dotted #e2e8f0' }}>
                                            {item.status === 'OK' ? <Check size={20} color="#16a34a" strokeWidth={3} /> :
                                                item.status === 'FAIL' ? <X size={20} color="#dc2626" strokeWidth={3} /> :
                                                    item.status === 'NA' ? <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8' }}>N/A</span> : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Observations */}
                {obs && (
                    <div style={{ position: 'relative', border: '2px solid #cbd5e1', borderRadius: '12px', padding: '1.5rem', background: '#f8fafc', marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                        <div style={{ position: 'absolute', top: '-10px', left: '1.5rem', background: '#1e293b', color: '#ffffff', padding: '2px 10px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', borderRadius: '4px' }}>OBSERVACIONES</div>
                        <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {obs}
                        </div>
                    </div>
                )}

                {/* Signatures */}
                <div style={{ marginTop: 'auto', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid' }}>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>OPERADOR / RESPONSABLE</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Firma y Aclaración</p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', width: '30%' }}>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>SUPERVISOR H&S</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Aprobación</p>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    Documento certificado según normativas de seguridad industrial.
                </div>
            </div>
        </div>
    );
}
