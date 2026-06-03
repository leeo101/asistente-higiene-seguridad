import React, { useRef } from 'react';
import { Calendar, Flame, MapPin } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';

const getStatus = (dueDateStr: string) => {
    if (!dueDateStr) return { text: 'Sin Dato', color: '#64748b', vto: '-' };
    try {
        const dueDate = new Date(dueDateStr + 'T12:00:00Z');
        if (isNaN(dueDate.getTime())) return { text: 'Sin Dato', color: '#64748b', vto: '-' };
        const today = new Date();
        const diffDays = Math.ceil(((dueDate as any) - (today as any)) / (1000 * 60 * 60 * 24));
        const formattedDate = dueDate.toLocaleDateString('es-AR');

        if (diffDays < 0) return { text: 'Vencido', color: '#dc2626', vto: formattedDate };
        if (diffDays <= 30) return { text: 'Próximo', color: '#d97706', vto: formattedDate };
        return { text: 'Vigente', color: '#166534', vto: formattedDate };
    } catch (e) {
        return { text: 'Sin Dato', color: '#64748b', vto: '-' };
    }
};

const getPHStatus = (dueDateStr: string) => {
    if (!dueDateStr) return { text: 'Sin Dato', color: '#64748b', vto: '-' };
    try {
        const d = new Date(dueDateStr + 'T12:00:00Z');
        if (isNaN(d.getTime())) return { text: 'Sin Dato', color: '#64748b', vto: '-' };
        
        d.setFullYear(d.getFullYear() + 5);
        
        const today = new Date();
        const diffDays = Math.ceil(((d as any) - (today as any)) / (1000 * 60 * 60 * 24));
        const formattedDate = d.toLocaleDateString('es-AR');

        if (diffDays < 0) return { text: 'Vencido', color: '#dc2626', vto: formattedDate };
        if (diffDays <= 30) return { text: 'Próximo', color: '#d97706', vto: formattedDate };
        return { text: 'Vigente', color: '#166534', vto: formattedDate };
    } catch (e) {
        return { text: 'Sin Dato', color: '#64748b', vto: '-' };
    }
};

export default function ExtinguisherPdfGenerator({ extinguishers }: { extinguishers: any[] }): React.ReactElement | null {
    const componentRef = useRef<HTMLDivElement>(null);
    const isLandscape = (extinguishers || []).length > 15; // Auto rotate if many

    const stats = {
        total: extinguishers.length,
        vencidos: extinguishers.filter(e => {
            const cargaStatus = getStatus(e.ultimaCarga || e.vencimientoRecarga).text;
            const phStatus = getPHStatus(e.ultimaPH || e.vencimientoPH).text;
            return cargaStatus === 'Vencido' || phStatus === 'Vencido';
        }).length
    };

    return (
        <div id="extinguisher-pdf-wrap" className="container" style={{ paddingBottom: '3rem' }}>
            <div style={{ overflowX: 'auto' }}>
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
                                min-height: 0 !important;
                                height: auto !important;
                            }
                            #extinguisher-pdf-wrap {
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {(() => {
                            if (!extinguishers || extinguishers.length === 0) {
                                return (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                        No hay extintores registrados.
                                    </div>
                                );
                            }

                            const grouped = extinguishers.reduce((acc, ext) => {
                                const key = ext.empresa || 'Sin Empresa Especificada';
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(ext);
                                return acc;
                            }, {});

                            const sortedCompanies = Object.keys(grouped).sort();

                            return sortedCompanies.map(empresa => {
                                const group = grouped[empresa].sort((a, b) => {
                                    const numA = parseInt(a.chapa || a.numero || '0', 10);
                                    const numB = parseInt(b.chapa || b.numero || '0', 10);
                                    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                                    return String(a.chapa || a.numero || '').localeCompare(String(b.chapa || b.numero || ''));
                                });

                                return (
                                    <div key={empresa} style={{ pageBreakInside: 'avoid', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {/* Company Header */}
                                        <div style={{ 
                                            background: '#f8fafc', color: '#0f172a', padding: '10px 15px', 
                                            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px',
                                            border: '2px solid #cbd5e1'
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
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>CHAPA</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>TIPO / CAP.</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>UBICACIÓN</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>VENC. CARGA</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>VENC. PH</th>
                                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, color: '#1e293b' }}>ÚLTIMA INSP.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.map((ext, idx) => {
                                                    const sCarga = getStatus(ext?.ultimaCarga || ext?.vencimientoRecarga);
                                                    const sPH = getPHStatus(ext?.ultimaPH || ext?.vencimientoPH);
                                                    const lastInspection = ext?.inspections && ext.inspections.length > 0 ? ext.inspections[ext.inspections.length - 1] : null;

                                                    return (
                                                        <tr key={`${empresa}-${idx}`} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid' }}>
                                                            <td style={{ padding: '8px', fontWeight: 900, color: '#0f172a' }}>{ext?.chapa || ext?.numero || '-'}</td>
                                                            <td style={{ padding: '8px', color: '#334155', fontWeight: 600 }}>{ext?.tipo || 'N/A'} {ext?.capacidad ? `- ${ext.capacidad}` : ''}</td>
                                                            <td style={{ padding: '8px', color: '#475569' }}>{ext?.ubicacion || 'Sin ubicación'}</td>
                                                            <td style={{ padding: '8px', color: sCarga.color, fontWeight: 700 }}>{sCarga.vto}</td>
                                                            <td style={{ padding: '8px', color: sPH.color, fontWeight: 700 }}>{sPH.vto}</td>
                                                            <td style={{ padding: '8px' }}>
                                                                {lastInspection ? (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                        <span style={{ fontWeight: 800, color: lastInspection.resultado === 'C' ? '#166534' : '#dc2626' }}>
                                                                            {new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR')} - {lastInspection.resultado === 'C' ? 'CUMPLE' : 'NO CUMPLE'}
                                                                        </span>
                                                                        {lastInspection.observacion && <span style={{ fontSize: '7.5pt', color: '#64748b', fontStyle: 'italic' }}>Obs: {lastInspection.observacion}</span>}
                                                                    </div>
                                                                ) : (
                                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin inspecciones</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
