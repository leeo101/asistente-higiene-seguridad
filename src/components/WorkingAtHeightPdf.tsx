import React from 'react';
import { Users, ShieldCheck, HeartPulse, LifeBuoy } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

const RISK_FACTORS_MAP = {
    weather: 'Condiciones climáticas adversas',
    height: 'Altura superior a 2 metros',
    electrical: 'Riesgo eléctrico cercano',
    unstable: 'Superficies inestables',
    load: 'Cargas suspendidas',
    confined: 'Espacios confinados',
    heat: 'Estrés térmico'
};

const EQUIPMENT_MAP = {
    harness: 'Arnés de seguridad de cuerpo completo',
    lanyard: 'Cabo de vida simple/doble con amortiguador',
    helmet: 'Casco con barboquejo',
    carabiner: 'Mosquetones de seguridad con cierre automático',
    rope: 'Cuerda de seguridad / Línea de vida vertical',
    anchor: 'Punto de anclaje certificado',
    sling: 'Eslinga de anclaje de cinta'
};

export default function WorkingAtHeightPdf({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    const sections = [
        { id: 'description', title: 'Descripción del Trabajo', icon: <Users size={18} />, value: data.workDescription },
        { id: 'department', title: 'Departamento / Área', icon: <ShieldCheck size={18} />, value: data.department },
        { id: 'medical', title: 'Aptitud Médica', icon: <HeartPulse size={18} />, value: data.medicalFitness ? 'Vigente' : 'No verificada' },
        { id: 'rescue', title: 'Plan de Rescate', icon: <LifeBuoy size={18} />, value: data.rescuePlan }
    ];

    // Map risk factors and equipment if they are IDs
    const hazards = Array.isArray(data.riskFactors) 
        ? data.riskFactors.map(h => RISK_FACTORS_MAP[h] || h)
        : (data.hazards || []);

    const mitigation = Array.isArray(data.fallProtection)
        ? data.fallProtection.filter(e => e.checked).map(e => e.name || EQUIPMENT_MAP[e.id] || e.id)
        : (data.mitigation || []);

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
                {/* Header and Style remains same as previous */}
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
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>PERMISO DE TRABAJO EN ALTURA</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#666' }}>SISTEMA DE GESTIÓN DE SEGURIDAD (RES. SRT 61/23)</p>
                    </div>
                    <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1.5px solid #000', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>TRABAJADOR</span>
                        <span style={{ fontWeight: 700 }}>{data.workerName || 'N/A'}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>UBICACIÓN / SECTOR</span>
                        <span style={{ fontWeight: 700 }}>{data.location}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>FECHA</span>
                        <span style={{ fontWeight: 700 }}>{new Date(data.createdAt).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>ALTURA ESTIMADA</span>
                        <span style={{ fontWeight: 700 }}>{data.height} metros</span>
                    </div>
                </div>

                {/* Core Safety Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    {sections.map(section => (
                        <div key={section.id} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.3rem' }}>
                                <span style={{ color: '#0056b3' }}>{section.icon}</span>
                                <span style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase' }}>{section.title}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{section.value || 'No especificado'}</div>
                        </div>
                    ))}
                </div>

                {/* Hazards & Mitigation */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 900, background: '#f8fafc', padding: '0.4rem', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}>ANÁLISIS DE RIESGOS Y MITIGACIÓN</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px solid #eee', padding: '0.8rem', borderRadius: '6px' }}>
                        <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block', color: '#64748b' }}>RIESGOS DETECTADOS</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                {hazards.length > 0 ? hazards.map((h, i) => (
                                    <span key={i} style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>{h}</span>
                                )) : <span style={{ fontSize: '0.8rem', color: '#666' }}>Ninguno identificado</span>}
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block', color: '#64748b' }}>MEDIDAS / EPP</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                {mitigation.length > 0 ? mitigation.map((m, i) => (
                                    <span key={i} style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>{m}</span>
                                )) : <span style={{ fontSize: '0.8rem', color: '#666' }}>Ninguna identificada</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div style={{ marginTop: 'auto', paddingTop: '3rem', display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid', gap: '3rem', paddingBottom: '2rem' }}>
                    <div style={{ flex: 1, maxWidth: '240px', textAlign: 'center' }}>
                        <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '2px solid #1e293b', marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Firma original</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>OPERADOR / TRABAJADOR</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b' }}>Firma y Aclaración</p>
                    </div>

                    <div style={{ flex: 1, maxWidth: '240px', textAlign: 'center' }}>
                        <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '2px solid #1e293b', marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Firma original</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>SUPERVISOR H&S</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b' }}>Aprobación</p>
                    </div>

                    <div style={{ flex: 1, maxWidth: '240px', textAlign: 'center' }}>
                        <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '2px solid #1e293b', marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
                            {data.signature ? (
                                <img src={data.signature} alt="Firma Profesional" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Sello y Firma original</span>
                            )}
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>PROFESIONAL ACTUANTE</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b' }}>
                            {data.professionalName || 'Sello y Firma'}
                        </p>
                        {data.license && (
                            <p style={{ margin: 0, fontSize: '0.6rem', color: '#64748b' }}>Lic: {data.license}</p>
                        )}
                    </div>
                </div>

                <PdfBrandingFooter />
            </div>
        </div>
    );
}
