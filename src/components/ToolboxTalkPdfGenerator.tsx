import React from 'react';
import { MessageSquare, Building2, MapPin, Calendar, User, Users, Briefcase, AlertCircle } from 'lucide-react';
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

    const validAttendees = data.asistentes.filter(a => a.nombre);
    const signedCount = data.asistentes.filter(a => a.firma).length;

    // Fill empty rows to minimum 8
    const filledAttendees = [
        ...validAttendees,
        ...Array(Math.max(0, 8 - validAttendees.length)).fill({ id: '', nombre: '', dni: '', firma: false })
    ].slice(0, 30);

    return (
        <div
            id="toolbox-pdf-content"
            className="pdf-container print-area"
            style={{
                padding: '12mm 15mm',
                fontFamily: 'Helvetica, Arial, sans-serif',
                background: '#ffffff',
                color: '#1e293b',
                width: '210mm',
                boxSizing: 'border-box',
                position: 'relative',
                borderTop: '12px solid #0052CC',
                fontSize: '9pt'
            }}
        >
            <style type="text/css" media="print">
                {`
                    @page { size: A4 portrait; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                    .no-print { display: none !important; }
                    .print-area {
                        box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                        width: 100% !important; max-width: none !important;
                        border-top: 12px solid #0052CC !important; border-radius: 0 !important;
                        min-height: auto !important; height: auto !important;
                    }
                `}
            </style>

            {/* Header Tripartito */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.5rem', width: '100%' }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de Gestión HSE</p>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: '#0052CC' }}>Doc. Inducción / Entrenamiento</p>
                </div>

                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>CHARLA 5'</h1>
                    <div style={{ marginTop: '0.3rem', background: '#0052CC', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                        REGISTRO DE SEGURIDAD — CHARLA DE 5 MINUTOS
                    </div>
                </div>

                <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <CompanyLogo style={{ height: '38px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }} />
                </div>
            </div>

            {/* Tema + Metadatos */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.2rem', width: '100%', overflow: 'hidden' }}>
                <div style={{ padding: '0.9rem 1.2rem', background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#0052CC', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MessageSquare size={13} /> TEMA DE LA CHARLA
                    </span>
                    <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0f172a', marginTop: '0.3rem' }}>{data.tema || '-'}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: '#ffffff' }}>
                    <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={11}/> FECHA</span>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginTop: '0.15rem' }}>{data.fecha ? new Date(data.fecha + 'T12:00').toLocaleDateString('es-AR') : '-'}</div>
                    </div>
                    <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Building2 size={11}/> EMPRESA</span>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginTop: '0.15rem' }}>{data.empresa || '-'}</div>
                    </div>
                    <div style={{ padding: '0.7rem 1rem' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={11}/> ÁREA / SECTOR</span>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginTop: '0.15rem' }}>{data.area || '-'}</div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={11}/> RESPONSABLE DE LA CHARLA</span>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginTop: '0.15rem' }}>{data.responsable || '-'}</div>
                    </div>
                    <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Briefcase size={11}/> CARGO</span>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginTop: '0.15rem' }}>{data.cargoResponsable || '-'}</div>
                    </div>
                    <div style={{ padding: '0.7rem 1rem' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Users size={11}/> ASISTENTES</span>
                        <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0052CC', marginTop: '0.15rem' }}>{validAttendees.length} personas | {signedCount} firmaron</div>
                    </div>
                </div>
            </div>

            {/* Desarrollo */}
            {data.desarrollo && (
                <div style={{ marginBottom: '1rem', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ padding: '0.5rem 1rem', background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#334155', textTransform: 'uppercase' }}>DESARROLLO / PUNTOS TRATADOS</span>
                    </div>
                    <div style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#ffffff' }}>
                        {data.desarrollo}
                    </div>
                </div>
            )}

            {/* Tabla de Asistentes */}
            <div style={{ marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                    <thead>
                        <tr style={{ background: '#0052CC', color: '#ffffff' }}>
                            <th style={{ padding: '0.5rem 0.4rem', width: '5%', textAlign: 'center', fontWeight: 800, border: '1px solid #003d99' }}>N°</th>
                            <th style={{ padding: '0.5rem 0.8rem', width: '48%', textAlign: 'left', fontWeight: 800, border: '1px solid #003d99' }}>Nombre y Apellido</th>
                            <th style={{ padding: '0.5rem 0.8rem', width: '22%', textAlign: 'center', fontWeight: 800, border: '1px solid #003d99' }}>DNI / CUIL</th>
                            <th style={{ padding: '0.5rem 0.8rem', width: '25%', textAlign: 'center', fontWeight: 800, border: '1px solid #003d99' }}>Firma del Participante</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filledAttendees.map((att, idx) => (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid' }}>
                                <td style={{ border: '1px solid #cbd5e1', padding: '0.55rem 0.4rem', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{idx + 1}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '0.55rem 0.8rem', fontWeight: 700, color: '#1e293b' }}>{att.nombre}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '0.55rem 0.8rem', textAlign: 'center', color: '#334155' }}>{att.dni}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '0.9rem 0.8rem', textAlign: 'center' }}>
                                    {att.firma ? <span style={{ color: '#10b981', fontWeight: 900, fontSize: '0.75rem' }}>✓ FIRMÓ</span> : ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Observaciones */}
            {data.observaciones && (
                <div style={{ marginBottom: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ padding: '0.5rem 1rem', background: '#fef3c7', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertCircle size={13} color="#92400e" />
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#92400e', textTransform: 'uppercase' }}>OBSERVACIONES Y COMPROMISOS</span>
                    </div>
                    <div style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: '#78350f', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {data.observaciones}
                    </div>
                </div>
            )}

            {/* Firmas */}
            <div style={{ marginTop: 'auto', paddingTop: '1.2rem', borderTop: '2px dashed #cbd5e1', pageBreakInside: 'avoid', display: 'flex', gap: '1rem', paddingBottom: '0.8rem' }}>

                <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: '55px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.55rem', color: '#cbd5e1' }}>Firma original</span>
                    </div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '0.65rem', color: '#1e293b' }}>REPRESENTANTE DE ÁREA</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.55rem', color: '#64748b' }}>Toma de conocimiento</p>
                </div>

                <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: '55px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.55rem', color: '#cbd5e1' }}>Firma original</span>
                    </div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '0.65rem', color: '#1e293b' }}>SUPERVISOR H&S</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.55rem', color: '#64748b' }}>Aprobación y visado</p>
                </div>

                <div style={{ flex: 1, border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: '55px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #86efac', paddingBottom: '0.2rem', marginBottom: '0.4rem' }}>
                        {professional?.signature ? (
                            <img src={professional.signature} alt="Firma Profesional" style={{ maxHeight: '48px', objectFit: 'contain' }} />
                        ) : (
                            <span style={{ fontSize: '0.55rem', color: '#86efac' }}>Sello y Firma Digital</span>
                        )}
                    </div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '0.65rem', color: '#166534' }}>PROFESIONAL ACTUANTE HSE</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.55rem', color: '#15803d', fontWeight: 600 }}>
                        {professional?.name || 'Especialista H&S'}
                    </p>
                    {professional?.license && (
                        <p style={{ margin: '2px 0 0', fontSize: '0.55rem', color: '#16a34a' }}>Mat: {professional.license}</p>
                    )}
                </div>
            </div>

            <PdfBrandingFooter />
        </div>
    );
}
