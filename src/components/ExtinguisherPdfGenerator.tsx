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

export default function ExtinguisherPdfGenerator({ extinguishers }: { extinguishers: any[] }): React.ReactElement | null {
    const componentRef = useRef<HTMLDivElement>(null);
    const isLandscape = (extinguishers || []).length > 15; // Auto rotate if many

    const stats = {
        total: extinguishers.length,
        vencidos: extinguishers.filter(e => {
            const cargaStatus = getStatus(e.ultimaCarga, 12).text;
            const phStatus = getStatus(e.ultimaPH, 60).text;
            return cargaStatus === 'Vencido' || phStatus === 'Vencido';
        }).length
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
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
                                            background: '#1e293b', color: '#ffffff', padding: '10px 15px', 
                                            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' 
                                        }}>
                                            <span style={{ fontSize: '12pt', fontWeight: 900 }}>🏢 {empresa}</span>
                                            <span style={{ fontSize: '9pt', background: '#334155', padding: '2px 8px', borderRadius: '12px' }}>
                                                {group.length} extintores
                                            </span>
                                        </div>

                                        {/* Grid of Cards */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                                            {group.map((ext, idx) => {
                                                const sCarga = getStatus(ext?.ultimaCarga || ext?.vencimientoRecarga);
                                                const sPH = getStatus(ext?.ultimaPH || ext?.vencimientoPH);
                                                const lastInspection = ext?.inspections && ext.inspections.length > 0 ? ext.inspections[ext.inspections.length - 1] : null;

                                                return (
                                                    <div key={`${empresa}-${idx}`} style={{ 
                                                        border: '1px solid #cbd5e1', borderRadius: '8px', 
                                                        padding: '12px', background: '#ffffff', 
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                        pageBreakInside: 'avoid',
                                                        display: 'flex', flexDirection: 'column', gap: '10px'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                                            <div>
                                                                <div style={{ fontSize: '11pt', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <div style={{ background: '#fef3c7', color: '#d97706', padding: '4px', borderRadius: '6px' }}>
                                                                        <Flame size={14} weight="fill" />
                                                                    </div>
                                                                    CHAPA: {ext?.chapa || ext?.numero || '-'}
                                                                </div>
                                                                <div style={{ fontSize: '9pt', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <MapPin size={12} /> <strong>{ext?.ubicacion || 'Sin ubicación'}</strong>
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '9pt', fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                                                    {ext?.tipo || 'N/A'} - {ext?.capacidad || '-'}
                                                                </div>
                                                                {ext?.fechaFabricacion && (
                                                                    <div style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '4px' }}>
                                                                        Fab: {new Date(ext.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Dates */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '8.5pt' }}>
                                                            <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                                <div style={{ color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>RECARGA</div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span style={{ color: sCarga.color, fontWeight: 900 }}>{sCarga.text}</span>
                                                                    <span style={{ color: '#475569' }}>{sCarga.vto}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                                <div style={{ color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>PRUEBA HIDR.</div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span style={{ color: sPH.color, fontWeight: 900 }}>{sPH.text}</span>
                                                                    <span style={{ color: '#475569' }}>{sPH.vto}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Last Inspection */}
                                                        {lastInspection ? (
                                                            <div style={{ fontSize: '8.5pt', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 800 }}>
                                                                    <span style={{ color: '#475569' }}>Insp: {new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR')}</span>
                                                                    <span style={{ color: lastInspection.resultado === 'C' ? '#166534' : '#dc2626' }}>
                                                                        {lastInspection.resultado === 'C' ? 'CUMPLE ✓' : 'NO CUMPLE ⚠️'}
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                                                    {Object.entries(lastInspection.controles || {}).map(([key, value]) => {
                                                                        const labels = {
                                                                            manometro: 'Man.', acceso: 'Acc.', senalizacion: 'Señ.', manguera: 'Mang.', cilindro: 'Cil.'
                                                                        };
                                                                        const color = value === 'C' ? '#166534' : value === 'NC' ? '#dc2626' : '#64748b';
                                                                        const bg = value === 'C' ? '#dcfce7' : value === 'NC' ? '#fee2e2' : '#f1f5f9';
                                                                        return (
                                                                            <span key={key} style={{ padding: '2px 5px', borderRadius: '4px', fontSize: '7pt', background: bg, color, fontWeight: 'bold' }}>
                                                                                {(labels as any)[key] || key}: {value as string}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {lastInspection.observacion && (
                                                                    <div style={{ color: '#475569', fontStyle: 'italic', marginTop: '6px', fontSize: '7.5pt', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                                                                        Obs: {lastInspection.observacion}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: '8pt', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                                                Sin controles mensuales este período.
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
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
