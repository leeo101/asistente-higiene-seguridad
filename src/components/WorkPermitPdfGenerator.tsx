import React from 'react';
import { permitTypes } from '../data/workPermits';
import { ShieldCheck, Users } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function WorkPermitPdfGenerator({ data, id = "pdf-content" }: { data: any, id?: string }): React.ReactElement | null {
    if (!data) return null;

    // Obtener firma profesional desde data o localStorage
    let actSignature: string | null = data?.professionalSignature || null;
    let actStamp: string | null = data?.professionalStamp || null;
    let actName: string | null = data?.professionalName || null;
    let actLic: string | null = data?.professionalLicense || data?.license || null;

    if (!actSignature) {
        try {
            const lsStamp = localStorage.getItem('signatureStampData');
            const legacySig = localStorage.getItem('capturedSignature');
            const lsPersonal = localStorage.getItem('personalData');
            if (lsStamp) {
                const parsed = JSON.parse(lsStamp);
                actSignature = parsed.signature;
                actStamp = parsed.stamp;
            }
            else if (legacySig) {
                actSignature = legacySig;
            }
            if (lsPersonal) {
                const pd = JSON.parse(lsPersonal);
                actName = actName || pd.name;
                actLic = actLic || pd.license;
            }
        } catch (e) { }
    }

    const selectedTypeLabel = permitTypes.find(t => t.id === data.tipoPermiso)?.label || 'Permiso de Trabajo';

    // Ensure all arrays exist
    const checklist = data.checklist || [];
    const personal = data.personal || [];

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id={id}
                className="pdf-container print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #333', paddingBottom: '1rem', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#1e293b' }}>PERMISO DE TRABAJO</h1>
                        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#666' }}>{selectedTypeLabel.toUpperCase()}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <CompanyLogo
                            style={{
                                height: '45px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '140px'
                            }}
                        />
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>SISTEMA DE GESTIÓN HYS</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>N°</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>{data.numeroPermiso || 'S/N'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Grid */}
                <div style={{ border: '2px solid #ddd', borderRadius: '10px',  marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #ddd' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>CLIENTE / EMPRESA</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.empresa}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #ddd', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>OBRA / UBICACIÓN</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.obra}</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>FECHA</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{new Date(data.fecha).toLocaleDateString('es-AR')}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #ddd', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>HORA INICIO</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.validezDesde}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #ddd', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>HORA FIN</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.validezHasta}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #ddd', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>TIPO DE TRABAJO</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{selectedTypeLabel}</span>
                        </div>
                    </div>
                </div>

                {/* Checklist Section */}
                {checklist.length > 0 && (
                    <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={20} /> VERIFICACIÓN PREVENTIVA (CHECKLIST)
                        </h3>
                        <div style={{ border: '1px solid #eee', borderRadius: '10px',  }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 80px 1.5fr', background: '#f8fafc', padding: '0.6rem 1rem', borderBottom: '2px solid #ddd', fontWeight: 800, fontSize: '0.75rem', color: '#64748b' }}>
                                <div>PREGUNTA / ITEM</div>
                                <div style={{ textAlign: 'center' }}>ESTADO</div>
                                <div>OBSERVACIONES</div>
                            </div>
                            {checklist.map((item: any, idx: number) => (
                                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 80px 1.5fr', gap: '1rem', alignItems: 'center', padding: '0.8rem 1rem', borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item.pregunta}</div>
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0, justifyContent: 'center' }}>
                                        {['SI', 'NO'].map((label) => {
                                            const isSelected = (label === 'SI' && (item.estado === 'Cumple' || item.estado === 'SI')) ||
                                                (label === 'NO' && (item.estado === 'No Cumple' || item.estado === 'NO'));

                                            return (
                                                <div key={label} style={{
                                                    width: '35px',
                                                    height: '24px',
                                                    border: isSelected ? '2.5px solid #000' : '1px solid #94a3b8',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.9rem',
                                                    fontWeight: isSelected ? 900 : 400,
                                                    color: isSelected ? (label === 'SI' ? '#166534' : '#dc2626') : '#94a3b8',
                                                    background: isSelected ? (label === 'SI' ? '#f0fdf4' : '#fef2f2') : 'transparent'
                                                }}>
                                                    {isSelected ? (label === 'SI' ? '✓' : '✗') : ''}
                                                    <span style={{ fontSize: '0.5rem', marginLeft: '2px', opacity: isSelected ? 1 : 0.6 }}>{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item.observaciones || '-'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Personnel Section */}
                {checklist.length > 0 && personal.length > 0 && (
                    <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={20} /> PERSONAL AUTORIZADO
                        </h3>
                        <div style={{ border: '1px solid #ddd', borderRadius: '10px',  }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#f8fafc', padding: '0.6rem 1rem', borderBottom: '2px solid #ddd', fontWeight: 800, fontSize: '0.75rem', color: '#64748b' }}>
                                <div>NOMBRE Y APELLIDO</div>
                                <div>DNI</div>
                                <div>FIRMA</div>
                            </div>
                            {personal.map((p: any) => (
                                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', padding: '1rem', borderBottom: '1px solid #f1f5f9', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>{p.nombre}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{p.dni}</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{ width: '100%', height: '1px', background: '#cbd5e1' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Firmas */}
                <PdfSignatures 
                    data={data}
                    box1={data.showSignatures?.operator !== false ? {
                        title: 'SOLICITANTE / OPERADOR',
                        subtitle: 'Aclaración y Firma',
                        signatureUrl: data.operatorSignature || data.firmas?.solicitante?.sign || null,
                        isProfessional: false
                    } : null}
                    box2={data.showSignatures?.professional !== false ? {
                        title: 'GERENCIA EHS / EMISOR',
                        subtitle: (actName || 'Firma y Sello H&S').toUpperCase(),
                        signatureUrl: actSignature || data.professionalSignature || data.firmas?.ehs?.sign || null,
                        stampUrl: data.professionalStamp || actStamp || null,
                        isProfessional: true,
                        license: actLic || null
                    } : null}
                    box3={data.showSignatures?.supervisor !== false ? {
                        title: 'SUPERVISOR DE TRABAJO',
                        subtitle: 'Aprobación / Autorización',
                        signatureUrl: data.supervisorSignature || data.firmas?.supervisor?.sign || null,
                        isProfessional: false
                    } : null}
                />

                <PdfBrandingFooter />
            </div>
        </div>
    );
}
