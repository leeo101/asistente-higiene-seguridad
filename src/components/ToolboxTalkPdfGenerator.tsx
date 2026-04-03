import React from 'react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

interface Attendee {
    id: string;
    nombre: string;
    dni: string;
    firma: boolean;
}

interface ToolboxTalkData {
    fecha: string;
    empresa: string;
    area: string;
    responsable: string;
    cargoResponsable: string;
    tema: string;
    desarrollo: string;
    observaciones: string;
    asistentes: Attendee[];
}

interface ProfessionalData {
    name: string;
    license: string;
    signature: string | null;
    stamp: string | null;
}

interface Props {
    data: ToolboxTalkData;
    professional: ProfessionalData;
}

export default function ToolboxTalkPdfGenerator({ data, professional }: Props) {
    if (!data) return null;

    return (
        <div 
            id="toolbox-pdf-content" 
            className="pdf-container print-area"
            style={{ 
                padding: '20mm 15mm', 
                fontFamily: 'Arial, sans-serif', 
                background: '#ffffff', 
                color: '#000000',
                width: '210mm',
                boxSizing: 'border-box',
                position: 'relative'
            }}
        >
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', borderBottom: '3px solid #0052CC', paddingBottom: '12px', marginBottom: '20px' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                    <p style={{ margin: 0, fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}>Control H&S</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#0052CC', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        📋 CHARLA DE 5 MINUTOS
                    </h2>
                    <p style={{ margin: '3px 0 0', fontSize: '8px', color: '#64748b', fontWeight: 600 }}>Toolbox Talk — Registro de Capacitación</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <CompanyLogo style={{ height: '40px', width: 'auto', maxWidth: '120px' }} />
                </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {[
                    ['Fecha', new Date(data.fecha + 'T12:00').toLocaleDateString('es-AR')],
                    ['Empresa', data.empresa || '-'],
                    ['Área / Sector', data.area || '-'],
                    ['Responsable', data.responsable || '-'],
                    ['Cargo', data.cargoResponsable || '-'],
                    ['Total Asistentes', `${data.asistentes.filter(a => a.nombre).length} personas`],
                ].map(([label, value]) => (
                    <div key={label}>
                        <span style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>{label}: </span>
                        <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#1e293b' }}>{value}</span>
                    </div>
                ))}
            </div>

            {/* Topic */}
            <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#eff6ff', borderLeft: '4px solid #0052CC', borderRadius: '6px' }}>
                <p style={{ margin: 0, fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', color: '#0052CC' }}>Tema</p>
                <p style={{ margin: '3px 0 0', fontSize: '11px', fontWeight: 900, color: '#1e293b' }}>{data.tema || '-'}</p>
            </div>

            {/* Desarrollo */}
            {data.desarrollo && (
                <div style={{ marginBottom: '14px' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', color: '#374151' }}>Desarrollo / Puntos Tratados</p>
                    <p style={{ margin: 0, fontSize: '8.5px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{data.desarrollo}</p>
                </div>
            )}

            {/* Attendees Table */}
            <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', color: '#374151' }}>
                    Lista de Asistentes — {data.asistentes.filter(a => a.nombre).length} personas
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                    <thead>
                        <tr style={{ background: '#0052CC' }}>
                            <th style={{ padding: '5px 8px', color: '#fff', fontWeight: 800, textAlign: 'left', width: '5%' }}>N°</th>
                            <th style={{ padding: '5px 8px', color: '#fff', fontWeight: 800, textAlign: 'left', width: '45%' }}>Nombre y Apellido</th>
                            <th style={{ padding: '5px 8px', color: '#fff', fontWeight: 800, textAlign: 'left', width: '20%' }}>DNI</th>
                            <th style={{ padding: '5px 8px', color: '#fff', fontWeight: 800, textAlign: 'center', width: '30%' }}>Firma</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...data.asistentes.filter(a => a.nombre), ...Array(Math.max(0, 10 - data.asistentes.filter(a => a.nombre).length)).fill({ id: '', nombre: '', dni: '', firma: false })].slice(0, 20).map((att, idx) => (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px 8px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                                <td style={{ padding: '6px 8px', fontWeight: 600, color: '#1e293b' }}>{att.nombre}</td>
                                <td style={{ padding: '6px 8px', color: '#374151' }}>{att.dni}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                    {att.firma ? '✅' : <span style={{ display: 'inline-block', width: '100px', borderBottom: '1px solid #aaa' }}>&nbsp;</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Observaciones */}
            {data.observaciones && (
                <div style={{ marginBottom: '14px', padding: '10px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '7px', fontWeight: 800, textTransform: 'uppercase', color: '#92400e' }}>Observaciones</p>
                    <p style={{ margin: 0, fontSize: '8.5px', color: '#374151', whiteSpace: 'pre-wrap' }}>{data.observaciones}</p>
                </div>
            )}

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '20px' }}>
                {['Operador', 'Supervisor', 'Responsable'].map((role, i) => (
                    <div key={role} style={{ textAlign: 'center' }}>
                        {i === 2 && professional.signature ? (
                            <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                                <img src={professional.signature} alt="Firma" style={{ maxHeight: '50px', maxWidth: '100px' }} />
                                {professional.stamp && <img src={professional.stamp} alt="Sello" style={{ maxHeight: '50px', maxWidth: '60px', marginLeft: '6px' }} />}
                            </div>
                        ) : (
                            <div style={{ height: '50px', marginBottom: '4px' }} />
                        )}
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '4px' }}>
                            <p style={{ margin: 0, fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>{role}</p>
                            {i === 2 && professional.name && <p style={{ margin: '2px 0 0', fontSize: '8px', fontWeight: 800, color: '#1e293b' }}>{professional.name}</p>}
                        </div>
                    </div>
                ))}
            </div>

            <PdfBrandingFooter />
        </div>
    );
}
