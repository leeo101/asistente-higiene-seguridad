import React, { useRef } from 'react';
import { Calendar, Flame, MapPin } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

const getStatus = (dueDateStr: string) => {
    if (!dueDateStr) return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
    try {
        const d = new Date(dueDateStr + 'T12:00:00Z');
        if (isNaN(d.getTime())) return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
        const base = d.toLocaleDateString('es-AR');
        d.setFullYear(d.getFullYear() + 1);
        const today = new Date();
        const diffDays = Math.ceil(((d as any) - (today as any)) / (1000 * 60 * 60 * 24));
        const formattedDate = d.toLocaleDateString('es-AR');

        if (diffDays < 0) return { text: 'Vencido', color: '#dc2626', vto: formattedDate, base };
        if (diffDays <= 30) return { text: 'Próximo', color: '#d97706', vto: formattedDate, base };
        return { text: 'Vigente', color: '#166534', vto: formattedDate, base };
    } catch (e) {
        return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
    }
};

const getPHStatus = (dueDateStr: string) => {
    if (!dueDateStr) return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
    try {
        const d = new Date(dueDateStr + 'T12:00:00Z');
        if (isNaN(d.getTime())) return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
        const base = d.toLocaleDateString('es-AR');
        d.setFullYear(d.getFullYear() + 5);
        
        const today = new Date();
        const diffDays = Math.ceil(((d as any) - (today as any)) / (1000 * 60 * 60 * 24));
        const formattedDate = d.toLocaleDateString('es-AR');

        if (diffDays < 0) return { text: 'Vencido', color: '#dc2626', vto: formattedDate, base };
        if (diffDays <= 30) return { text: 'Próximo', color: '#d97706', vto: formattedDate, base };
        return { text: 'Vigente', color: '#166534', vto: formattedDate, base };
    } catch (e) {
        return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
    }
};

const formatType = (tipo: string) => {
    if (!tipo) return 'N/A';
    return tipo;
};

export default function ExtinguisherPdfGenerator({ extinguishers, showSignatures, globalSignatures }: { extinguishers: any[], showSignatures?: { operator: boolean, professional: boolean, supervisor: boolean }, globalSignatures?: { operatorSignature?: string, supervisorSignature?: string } }): React.ReactElement | null {
    const componentRef = useRef<HTMLDivElement>(null);
    const isLandscape = (extinguishers || []).length > 15; // Auto rotate if many

    const stats = {
        total: extinguishers.length,
        vencidos: extinguishers.filter(e => {
            const cargaStatus = getStatus(e.vencimientoRecarga || e.ultimaCarga).text;
            const phStatus = getPHStatus(e.vencimientoPH || e.ultimaPH).text;
            return cargaStatus === 'Vencido' || phStatus === 'Vencido';
        }).length
    };

    return (
        <div id="extinguisher-pdf-wrap" style={{ paddingBottom: '0' }}>
            <div style={{ overflowX: 'visible' }}>
                <div
                    id="pdf-content"
                    className="pdf-container card print-area"
                    ref={componentRef}
                    style={{
                        width: isLandscape ? '297mm' : '210mm',
                        minHeight: isLandscape ? '210mm' : '297mm',
                        padding: '15mm', background: '#ffffff', color: '#000000',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                        boxSizing: 'border-box'
                    }}
                >
                    <style type="text/css" media="print">
                        {`
                            @page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 15mm; }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            .no-print { display: none !important; }
                            .print-area { 
                                box-shadow: none !important; 
                                margin: 0 !important; 
                                padding: 10mm !important; 
                                width: 100% !important; 
                                max-width: none !important; 
                                border: 1px solid #1e293b !important;
                                border-radius: 0 !important;
                                height: auto !important;
                            }
                            #extinguisher-pdf-wrap {
                                padding-top: 0 !important;
                                padding-bottom: 0 !important;
                                min-height: 0 !important;
                                margin: 0 !important;
                                display: block !important;
                            }
                            #extinguisher-pdf-wrap > div {
                                display: block !important;
                            }
                            .company-logo {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                            .text-vencido {
                                color: #dc2626 !important;
                                -webkit-text-fill-color: #dc2626 !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                        `}
                    </style>

                    {/* Header */}
                    <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ margin: '0 0 5px 0', fontSize: '18pt', color: '#1e293b', fontWeight: 900, textTransform: 'uppercase' }}>
                                Planilla de Control de Extintores
                            </h1>
                            <p style={{ margin: 0, fontSize: '10pt', color: '#475569', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Fecha: {new Date().toLocaleDateString('es-AR')}</span>
                                <span><Flame size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Equipos: {stats.total}</span>
                                {stats.vencidos > 0 && <span style={{ color: '#dc2626', fontWeight: 'bold' }}>({stats.vencidos} Vencidos)</span>}
                            </p>
                        </div>
                        <CompanyLogo
                            style={{
                                height: '45px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '140px'
                            }}
                        />
                    </div>

                    <div style={{ display: 'block' }}>
                        {(() => {
                            if (!extinguishers || extinguishers.length === 0) {
                                return (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                        No hay extintores registrados.
                                    </div>
                                );
                            }

                            const grouped = extinguishers.reduce((acc, ext) => {
                                const key = (ext.empresa || '').trim().toUpperCase() || 'SIN EMPRESA ESPECIFICADA';
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(ext);
                                return acc;
                            }, {});

                            const sortedCompanies = Object.keys(grouped).sort();

                            return sortedCompanies.map(empresa => {
                                const group = grouped[empresa].sort((a, b) => {
                                    const valA = String(a.chapa || a.numero || '');
                                    const valB = String(b.chapa || b.numero || '');
                                    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                                });

                                return (
                                    <div key={empresa} style={{ display: 'block', marginBottom: '25px' }}>
                                        {/* Company Header */}
                                        <div style={{ 
                                            background: '#f8fafc', color: '#0f172a', padding: '10px 15px', 
                                            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px',
                                            border: '2px solid #cbd5e1', marginBottom: '15px'
                                        }}>
                                            <span style={{ fontSize: '12pt', fontWeight: 900 }}>🏢 {empresa}</span>
                                            <span style={{ fontSize: '9pt', background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                                                {group.length} extintores
                                            </span>
                                        </div>

                                        {/* Compact Table */}
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginTop: '5px' }}>
                                            <thead>
                                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 900, color: '#1e293b', width: '10%' }}>Nº / CHAPA</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>TIPO / CAP.</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>F. FABRICACIÓN</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>UBICACIÓN</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>VENC. CARGA</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>VENC. PH</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>ÚLTIMA INSP.</th>
                                                </tr>
                                            </thead>
                                            {group.map((ext, idx) => {
                                                    const sCarga = getStatus(ext?.vencimientoRecarga || ext?.ultimaCarga);
                                                    const sPH = getPHStatus(ext?.vencimientoPH || ext?.ultimaPH);
                                                    const lastInspection = ext?.inspections && ext.inspections.length > 0 ? ext.inspections[ext.inspections.length - 1] : null;

                                                    const getFabInfo = () => {
                                                        if (!ext?.fechaFabricacion) return { base: '-', vto: '-', expired: false };
                                                        try {
                                                            const d = new Date(ext.fechaFabricacion + 'T12:00:00Z');
                                                            if (isNaN(d.getTime())) return { base: '-', vto: '-', expired: false };
                                                            const base = d.toLocaleDateString('es-AR');
                                                            d.setFullYear(d.getFullYear() + 20);
                                                            const vto = d.toLocaleDateString('es-AR');
                                                            return { base, vto, expired: d.getTime() < new Date().getTime() };
                                                        } catch { return { base: '-', vto: '-', expired: false }; }
                                                    };
                                                    const fabInfo = getFabInfo();
                                                    const fFabBg = 'transparent';
                                                    const fFabColor = fabInfo.expired ? '#dc2626' : '#475569';

                                                    const cargaBg = 'transparent';
                                                    const cargaColor = sCarga.text === 'Vencido' ? '#dc2626' : sCarga.color;
                                                    
                                                    const phBg = 'transparent';
                                                    const phColor = sPH.text === 'Vencido' ? '#dc2626' : sPH.color;

                                                    const hasObs = !!(lastInspection && lastInspection.observacion);

                                                    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

                                                    return (
                                                        <tbody key={`${empresa}-${idx}`} style={{ pageBreakInside: 'avoid' }}>
                                                            <tr style={{ borderTop: '1px solid #e2e8f0', background: rowBg }}>
                                                                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 900, color: '#0f172a', fontSize: '10pt' }}>
                                                                    <div style={{ fontSize: '7pt', color: '#94a3b8', marginBottom: '2px' }}>{idx + 1}</div>
                                                                    <div>{ext?.numero || ext?.chapa || '-'}</div>
                                                                </td>
                                                                <td style={{ padding: '8px', color: '#334155', fontWeight: 600 }}>{formatType(ext?.tipo)} {ext?.capacidad ? `- ${ext.capacidad}` : ''}</td>
                                                                <td style={{ padding: '8px', color: '#475569', backgroundColor: fFabBg, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '8pt' }}>
                                                                        <span>Fab: <span style={{ fontWeight: 600 }}>{fabInfo.base}</span></span>
                                                                        <span className={fabInfo.expired ? 'text-vencido' : ''} style={{ color: fFabColor, fontWeight: fabInfo.expired ? 800 : 600 }}>Vto: {fabInfo.vto}</span>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '8px', color: '#475569' }}>{ext?.ubicacion || 'Sin ubicación'}</td>
                                                                <td style={{ padding: '8px', color: '#475569', backgroundColor: cargaBg, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '8pt' }}>
                                                                        <span>Carga: <span style={{ fontWeight: 600 }}>{sCarga.base}</span></span>
                                                                        <span className={sCarga.text === 'Vencido' ? 'text-vencido' : ''} style={{ color: cargaColor, fontWeight: sCarga.text === 'Vencido' ? 800 : 600 }}>Vto: {sCarga.vto}</span>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '8px', color: '#475569', backgroundColor: phBg, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '8pt' }}>
                                                                        <span>PH: <span style={{ fontWeight: 600 }}>{sPH.base}</span></span>
                                                                        <span className={sPH.text === 'Vencido' ? 'text-vencido' : ''} style={{ color: phColor, fontWeight: sPH.text === 'Vencido' ? 800 : 600 }}>Vto: {sPH.vto}</span>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '8px' }}>
                                                                    {lastInspection ? (
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                            <span style={{ fontWeight: 800, color: '#1e293b', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                                                                {new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR')} - Res: <span style={{ display: 'inline-block', width: '30px', borderBottom: '1px solid #1e293b', verticalAlign: 'bottom', position: 'relative', top: '-1px' }}></span>
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin inspecciones</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                            <tr style={{ borderBottom: '2px solid #cbd5e1', background: rowBg, height: 'auto' }}>
                                                                <td colSpan={7} style={{ padding: '0 8px 6px 8px', height: '1px' }}>
                                                                    <div style={{ border: hasObs ? '1px dashed #dc2626' : '1px dashed #94a3b8', borderRadius: '4px', padding: '4px 6px', fontSize: '7.5pt', color: hasObs ? '#dc2626' : '#334155', background: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', minHeight: '20px', height: '100%' }}>
                                                                        <strong style={{ color: '#0f172a' }}>Observación:</strong> <span style={{ fontWeight: 700, color: hasObs ? '#dc2626' : 'inherit', WebkitTextFillColor: hasObs ? '#dc2626' : 'inherit' }}>{hasObs ? lastInspection.observacion : ''}</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    );
                                                })}
                                        </table>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    {/* Add Signatures here */}
                    {showSignatures && (showSignatures.operator || showSignatures.professional || showSignatures.supervisor) && (
                        <div style={{ marginTop: '20px', pageBreakInside: 'avoid' }}>
                            <PdfSignatures data={{ showSignatures, operatorSignature: globalSignatures?.operatorSignature, supervisorSignature: globalSignatures?.supervisorSignature }} />
            <PdfBrandingFooter />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
