import React from 'react';
import { CarFront, ClipboardList, ShieldCheck } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';

export default function FleetPdfGenerator({ data, checklistItems }: { data: any, checklistItems: any[] }): React.ReactElement | null {
    if (!data) return null;

    const isApto = data.status === 'Apto';

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area"
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
                        .print-area { box-shadow: none !important; margin: 0 !important; padding: 5mm !important; width: 100% !important; max-width: none !important; border: none !important; border-radius: 0 !important; min-height: auto !important; height: auto !important; }
                    `}
                </style>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>INSPECCIÓN PRE-OPERACIONAL</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#666' }}>VEHÍCULOS Y FLOTA</p>
                    </div>
                    <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                </div>

                {/* Main Info */}
                <div style={{ background: '#f8fafc', padding: '1.2rem', border: `2px solid ${isApto ? '#16a34a' : '#dc2626'}`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block' }}>DOMINIO / PATENTE</span>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>{data.plate || 'N/A'}</h2>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{data.vehicleType} | {data.brandModel}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ background: isApto ? '#f0fdf4' : '#fef2f2', color: isApto ? '#16a34a' : '#dc2626', padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 900, fontSize: '1.1rem', border: `1px solid ${isApto ? '#bbf7d0' : '#fecaca'}` }}>
                            {data.status?.toUpperCase() || 'N/A'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1.5px solid #000', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>FECHA DE INSPECCIÓN</span>
                        <span style={{ fontWeight: 700 }}>{data.date ? new Date(data.date).toLocaleDateString('es-AR') : ''}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>KILOMETRAJE / HORÓMETRO</span>
                        <span style={{ fontWeight: 700 }}>{data.mileage || '-'}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>CONDUCTOR ASIGNADO</span>
                        <span style={{ fontWeight: 700 }}>{data.driver || '-'}</span>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>INSPECTOR (Opcional)</span>
                        <span style={{ fontWeight: 700 }}>{data.inspector || 'Mismo conductor'}</span>
                    </div>
                </div>

                {/* Checklist Table */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #000', paddingBottom: '0.3rem' }}>
                        <ClipboardList size={18} /> PUNTOS DE INSPECCIÓN
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ border: '1px solid #ddd', padding: '0.4rem', textAlign: 'left', fontSize: '0.7rem' }}>ITEM A VERIFICAR</th>
                                <th style={{ border: '1px solid #ddd', padding: '0.4rem', textAlign: 'center', fontSize: '0.7rem', width: '80px' }}>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {checklistItems.map((item, index) => {
                                const val = data.checklist?.[item.id];
                                let displayVal = '-';
                                let color = '#000';
                                if (val === 'ok') { displayVal = 'OK'; color = '#16a34a'; }
                                else if (val === 'fail') { displayVal = 'FALLA'; color = '#dc2626'; }
                                else if (val === 'na') { displayVal = 'N/A'; color = '#64748b'; }
                                
                                return (
                                    <tr key={index}>
                                        <td style={{ border: '1px solid #ddd', padding: '0.4rem', fontSize: '0.8rem' }}>
                                            <span style={{ fontWeight: 800, color: '#64748b', marginRight: '0.5rem', fontSize: '0.7rem' }}>{item.category}:</span>
                                            {item.label}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '0.4rem', textAlign: 'center', fontWeight: 900, fontSize: '0.8rem', color: color }}>
                                            {displayVal}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginBottom: '1.5rem', border: '1.5px solid #000', padding: '0.8rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block', marginBottom: '0.3rem' }}>OBSERVACIONES Y NOVEDADES</span>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{data.observations || 'Sin novedades registradas.'}</p>
                </div>

                {/* Signatures */}
                <PdfSignatures 
                    data={data} 
                    box1={data.showSignatures?.operator !== false ? {
                        title: 'CONDUCTOR ASIGNADO',
                        subtitle: (data.driver || 'Firma del Conductor').toUpperCase(),
                        signatureUrl: data.driverSignature || data.signatures?.driver || null,
                        isProfessional: false
                    } : null}
                    box2={data.showSignatures?.professional !== false ? {
                        title: 'PROFESIONAL H&S',
                        subtitle: (data.professionalName || 'Firma de Especialista').toUpperCase(),
                        signatureUrl: data.professionalSignature || null,
                        stampUrl: data.professionalStamp || null,
                        isProfessional: true,
                        license: data.professionalLicense || null
                    } : null}
                    box3={data.showSignatures?.supervisor !== false ? {
                        title: 'INSPECTOR / CONTROL',
                        subtitle: (data.inspector || 'Firma del Inspector').toUpperCase(),
                        signatureUrl: data.supervisorSignature || data.signatures?.inspector || null,
                        isProfessional: false
                    } : null}
                />


            </div>
        </div>
    );
}
