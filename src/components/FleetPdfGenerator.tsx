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

                {/* Modern Gradient Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    margin: '-15mm -15mm 15mm -15mm',
                    padding: '15mm',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '4px solid #38bdf8'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '12px' }}>
                            <CarFront size={32} color="#38bdf8" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.5px' }}>INSPECCIÓN PRE-OPERACIONAL</h1>
                            <p style={{ margin: '4px 0 0 0', fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>VEHÍCULOS Y FLOTA</p>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                        <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                    </div>
                </div>

                {/* Main Info */}
                <div style={{ background: '#f8fafc', padding: '1.2rem', border: `2px solid ${isApto ? '#16a34a' : '#dc2626'}`, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', letterSpacing: '1px' }}>DOMINIO / PATENTE</span>
                        <h2 style={{ margin: '4px 0', fontSize: '1.8rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>{data.plate || 'N/A'}</h2>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CarFront size={16} /> {data.vehicleType} | {data.brandModel}
                        </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ background: isApto ? '#dcfce7' : '#fee2e2', color: isApto ? '#15803d' : '#b91c1c', padding: '0.6rem 2rem', borderRadius: '30px', fontWeight: 900, fontSize: '1.2rem', border: `2px solid ${isApto ? '#86efac' : '#fca5a5'}`, display: 'inline-block', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            {data.status?.toUpperCase() || 'N/A'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, display: 'block', color: '#64748b', marginBottom: '4px' }}>FECHA DE INSPECCIÓN</span>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{data.date ? new Date(data.date).toLocaleDateString('es-AR') : '-'}</span>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, display: 'block', color: '#64748b', marginBottom: '4px' }}>KILOMETRAJE / HORÓMETRO</span>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{data.mileage || '-'}</span>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, display: 'block', color: '#64748b', marginBottom: '4px' }}>CONDUCTOR ASIGNADO</span>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{data.driver || '-'}</span>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, display: 'block', color: '#64748b', marginBottom: '4px' }}>INSPECTOR</span>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{data.inspector || 'Mismo conductor'}</span>
                    </div>
                </div>

                {/* Checklist Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ 
                        margin: '0 0 1rem 0', 
                        fontSize: '1.1rem', 
                        fontWeight: 900, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        borderBottom: '2px solid #e2e8f0', 
                        paddingBottom: '0.5rem',
                        color: '#0f172a'
                    }}>
                        <ClipboardList size={20} color="#38bdf8" /> PUNTOS DE INSPECCIÓN
                    </h3>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '0.8rem',
                        background: '#f8fafc',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                    }}>
                        {checklistItems.map((item, index) => {
                            const val = data.checklist?.[item.id];
                            const isOk = val === 'ok';
                            const isFail = val === 'fail';
                            
                            let bgColor = '#f1f5f9';
                            let icon = '-';
                            let color = '#64748b';
                            
                            if (isOk) {
                                bgColor = '#dcfce7';
                                icon = '✓';
                                color = '#16a34a';
                            } else if (isFail) {
                                bgColor = '#fee2e2';
                                icon = '✗';
                                color = '#dc2626';
                            } else if (val === 'na') {
                                bgColor = '#e2e8f0';
                                icon = '-';
                                color = '#64748b';
                            }
                            
                            return (
                                <div key={index} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    background: 'white',
                                    padding: '0.6rem 0.8rem',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ paddingRight: '10px' }}>
                                        <span style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.65rem', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>
                                            {item.category}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                                            {item.label}
                                        </span>
                                    </div>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        background: bgColor,
                                        color: color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 900,
                                        fontSize: '1rem',
                                        flexShrink: 0
                                    }}>
                                        {icon}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
