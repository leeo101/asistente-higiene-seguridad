import React from 'react';
import { Users, ShieldCheck, HeartPulse, LifeBuoy } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

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
    harness: 'Arnés de Seguridad de cuerpo completo',
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
        ? data.riskFactors.map(h => RISK_FACTORS_MAP[h as keyof typeof RISK_FACTORS_MAP] || h)
        : (data.hazards || []);

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
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 900, background: '#f8fafc', padding: '0.4rem', border: '1px solid #cbd5e1', marginBottom: '0.5rem', color: '#0f172a' }}>ANÁLISIS DE RIESGOS Y EPP REQUERIDO</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px', background: '#f8fafc' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, display: 'block', color: '#475569', marginBottom: '0.5rem' }}>RIESGOS DETECTADOS</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {hazards.length > 0 ? hazards.map((h: string, i: number) => (
                                    <span key={i} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{h}</span>
                                )) : <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Trabajo en altura estándar.</span>}
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, display: 'block', color: '#475569', marginBottom: '0.5rem' }}>EQUIPOS DE PROTECCIÓN (EPP)</span>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                {['harness', 'lanyard', 'helmet', 'lifeline'].map((key) => {
                                    const hasIt = data.ppe && data.ppe[key];
                                    const labels = { harness: 'Arnés de Seguridad', lanyard: 'Cola de Amarre', helmet: 'Casco con Barbijo', lifeline: 'Línea de Vida' };
                                    return (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '14px', height: '14px', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hasIt ? '#000' : '#fff' }}>
                                                {hasIt && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: hasIt ? 700 : 500, color: '#1e293b' }}>{labels[key as keyof typeof labels]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <PdfSignatures 
                    data={data} 
                    box3={{
                        title: 'SUPERVISOR DE ALTURA',
                        subtitle: 'Firma del Supervisor',
                        signatureUrl: data.signature || null,
                        isProfessional: false
                    }}
                />

                <PdfBrandingFooter />
            </div>
        </div>
    );
}
