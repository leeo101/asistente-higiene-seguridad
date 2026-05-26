import React, { useRef } from 'react';
import { Calendar, Flame, MapPin } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';

const addMonths = (dateString, months) => {
    if (!dateString) return '';
    try {
        const d = new Date(dateString + 'T12:00:00Z');
        if (isNaN(d.getTime())) return '';
        d.setMonth(d.getMonth() + months);
        return d.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

const getStatus = (lastDate, monthsValid) => {
    if (!lastDate) return { text: 'Sin Dato', color: '#000000', vto: '-' };
    const dueDate = addMonths(lastDate, monthsValid);
    if (!dueDate) return { text: 'Sin Dato', color: '#000000', vto: '-' };
    const today = new Date().toISOString().split('T')[0];
    const diffDays = Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));

    if (isNaN(diffDays)) return { text: 'Sin Dato', color: '#000000', vto: '-' };

    if (diffDays < 0) return { text: 'Vencido', color: '#dc2626', vto: new Date(dueDate).toLocaleDateString('es-AR') };
    if (diffDays <= 30) return { text: 'Próximo', color: '#d97706', vto: new Date(dueDate).toLocaleDateString('es-AR') };
    return { text: 'Vigente', color: '#166534', vto: new Date(dueDate).toLocaleDateString('es-AR') };
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

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', fontFamily: 'sans-serif' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', width: '8%', fontWeight: 800 }}>Chapa</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left', width: '20%', fontWeight: 800 }}>Ubicación</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left', width: '20%', fontWeight: 800 }}>Tipo / Cap. / Fabricación</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', width: '20%', fontWeight: 800 }}>Vto. Mantenimiento</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left', width: '32%', fontWeight: 800 }}>Último Control Mensual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                if (!extinguishers || extinguishers.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                                No hay extintores registrados.
                                            </td>
                                        </tr>
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
                                        <React.Fragment key={empresa}>
                                            <tr style={{ background: '#e2e8f0', borderBottom: '2px solid #cbd5e1' }}>
                                                <td colSpan={5} style={{ padding: '10px 8px', fontWeight: 900, fontSize: '10pt', color: '#0f172a' }}>
                                                    🏢 Empresa: {empresa} <span style={{ fontWeight: 'normal', fontSize: '8pt', color: '#475569', marginLeft: '10px' }}>({group.length} extintores)</span>
                                                </td>
                                            </tr>
                                            {group.map((ext, idx) => {
                                                const sCarga = getStatus(ext?.ultimaCarga || ext?.vencimientoRecarga, 12);
                                                const sPH = getStatus(ext?.ultimaPH || ext?.vencimientoPH, 60);
                                                const lastInspection = ext?.inspections && ext.inspections.length > 0 ? ext.inspections[ext.inspections.length - 1] : null;

                                                return (
                                                    <tr key={`${empresa}-${idx}`} style={{ pageBreakInside: 'avoid' }}>
                                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{ext?.chapa || ext?.numero || '-'}</td>
                                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>
                                                            <strong>{ext?.ubicacion || 'Sin ubicación'}</strong>
                                                        </td>
                                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>
                                                            {ext?.tipo || 'N/A'} <br />
                                                            <span style={{ fontSize: '8pt', color: '#475569' }}>Cap: {ext?.capacidad || '-'}</span>
                                                            {ext?.fechaFabricacion && (
                                                                <div style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '2px' }}>
                                                                    Fab: {new Date(ext.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR')}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontSize: '8pt' }}>
                                                            <div style={{ marginBottom: '4px' }}>
                                                                <strong>Recarga:</strong> <span style={{ color: sCarga.color }}>{sCarga.text}</span>
                                                                <div style={{ fontSize: '7pt', color: '#64748b' }}>Vto: {sCarga.vto}</div>
                                                            </div>
                                                            <div>
                                                                <strong>P.H.:</strong> <span style={{ color: sPH.color }}>{sPH.text}</span>
                                                                <div style={{ fontSize: '7pt', color: '#64748b' }}>Vto: {sPH.vto}</div>
                                                            </div>
                                                        </td>

                                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '8pt' }}>
                                                            {lastInspection ? (
                                                                <div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 'bold' }}>
                                                                        <span>Insp: {new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR')}</span>
                                                                        <span style={{ color: lastInspection.resultado === 'C' ? '#166534' : '#dc2626' }}>
                                                                            {lastInspection.resultado === 'C' ? 'CUMPLE ✓' : 'NO CUMPLE ⚠️'}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                                        {Object.entries(lastInspection.controles || {}).map(([key, value]) => {
                                                                            const labels = {
                                                                                manometro: 'Man.',
                                                                                acceso: 'Acc.',
                                                                                senalizacion: 'Señ.',
                                                                                manguera: 'Mang.',
                                                                                cilindro: 'Cil.'
                                                                            };
                                                                            const color = value === 'C' ? '#166534' : value === 'NC' ? '#dc2626' : '#64748b';
                                                                            const bg = value === 'C' ? '#dcfce7' : value === 'NC' ? '#fee2e2' : '#f1f5f9';
                                                                            return (
                                                                                <span key={key} style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '7.5pt', background: bg, color, fontWeight: 'bold' }}>
                                                                                    {(labels as any)[key] || key}: {value as string}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    {lastInspection.observacion && (
                                                                        <div style={{ color: '#475569', fontStyle: 'italic', marginTop: '2px', fontSize: '7.5pt' }}>
                                                                            Obs: {lastInspection.observacion}
                                                                        </div>
                                                                    )}
                                                                    {lastInspection.fotos && lastInspection.fotos.length > 0 && (
                                                                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                                            {lastInspection.fotos.map((img: string, i: number) => (
                                                                                <img key={i} src={img} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div style={{ color: '#64748b', fontStyle: 'italic' }}>Sin controles este período.</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>

                    {/* Firmas */}
                    <PdfSignatures data={extinguishers[0] || {}} />
                </div>
            </div>
        </div>
    );
}
