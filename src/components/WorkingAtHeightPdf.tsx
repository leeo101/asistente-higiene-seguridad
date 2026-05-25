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
                className="pdf-container card print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm 20mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '12px',
                    boxSizing: 'border-box', margin: '0 auto',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
            >
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 15mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area {
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 10mm !important;
                            width: 100% !important;
                            max-width: none !important;
                            border-top: 12px solid #2563eb !important;
                            border-radius: 0 !important;
                        }
                        .gradient-header {
                            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                        }
                    `}
                </style>

                {/* Header - Mejorado visualmente */}
                <div className="gradient-header" style={{ 
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    color: '#ffffff'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ 
                                background: 'rgba(255,255,255,0.2)', 
                                padding: '8px', 
                                borderRadius: '8px',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <ShieldCheck size={28} color="#38bdf8" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 style={{ 
                                    margin: 0, 
                                    fontSize: '20pt', 
                                    fontWeight: 900, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '-0.5px',
                                    lineHeight: 1
                                }}>
                                    PERMISO TRABAJO EN ALTURA
                                </h1>
                                <p style={{ 
                                    margin: '4px 0 0 0', 
                                    fontSize: '9pt', 
                                    color: '#cbd5e1',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    SISTEMA DE GESTIÓN DE SEGURIDAD (RES. SRT 61/23)
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ marginLeft: '20px', flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <CompanyLogo 
                            style={{
                                height: '45px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '140px',
                                background: '#ffffff',
                                padding: '8px',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        />
                        <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Doc. Controlado</div>
                    </div>
                </div>

                {/* Info Grid */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>TRABAJADOR</span>
                        <span style={{ fontSize: '11pt', fontWeight: 800, color: '#0f172a' }}>{data.workerName || 'N/A'}</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>UBICACIÓN / SECTOR</span>
                        <span style={{ fontSize: '11pt', fontWeight: 800, color: '#0f172a' }}>{data.location}</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>FECHA</span>
                        <span style={{ fontSize: '11pt', fontWeight: 800, color: '#0f172a' }}>{new Date(data.createdAt).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>ALTURA ESTIMADA</span>
                        <span style={{ fontSize: '11pt', fontWeight: 800, color: '#0f172a' }}>{data.height} metros</span>
                    </div>
                </div>

                {/* Core Safety Sections */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    {sections.map(section => (
                        <div key={section.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ color: '#3b82f6' }}>{section.icon}</div>
                                <span style={{ fontWeight: 800, fontSize: '9pt', color: '#334155', textTransform: 'uppercase' }}>{section.title}</span>
                            </div>
                            <div style={{ fontSize: '10pt', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{section.value || 'No especificado'}</div>
                        </div>
                    ))}
                </div>

                {/* Hazards & Mitigation */}
                <div style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '0.8rem 1rem', color: '#ffffff' }}>
                        <h3 style={{ margin: 0, fontSize: '10.5pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={18} /> ANÁLISIS DE RIESGOS Y EPP REQUERIDO
                        </h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.2rem', background: '#f8fafc' }}>
                        <div>
                            <span style={{ fontSize: '8pt', fontWeight: 800, display: 'block', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>RIESGOS DETECTADOS</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {hazards.length > 0 ? hazards.map((h: string, i: number) => (
                                    <span key={i} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '4px 10px', borderRadius: '6px', fontSize: '8.5pt', fontWeight: 700 }}>{h}</span>
                                )) : <span style={{ fontSize: '9pt', color: '#64748b', fontWeight: 600 }}>Trabajo en altura estándar.</span>}
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '8pt', fontWeight: 800, display: 'block', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>EQUIPOS DE PROTECCIÓN (EPP)</span>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                                {['harness', 'lanyard', 'helmet', 'lifeline'].map((key) => {
                                    const hasIt = data.ppe && data.ppe[key];
                                    const labels = { harness: 'Arnés de Seguridad', lanyard: 'Cola de Amarre', helmet: 'Casco con Barbijo', lifeline: 'Línea de Vida' };
                                    return (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '4px 8px', background: hasIt ? '#f0fdf4' : '#ffffff', border: `1px solid ${hasIt ? '#86efac' : '#e2e8f0'}`, borderRadius: '6px' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${hasIt ? '#16a34a' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hasIt ? '#16a34a' : '#fff' }}>
                                                {hasIt && <span style={{ color: '#fff', fontSize: '12px', lineHeight: 1 }}>✓</span>}
                                            </div>
                                            <span style={{ fontSize: '9pt', fontWeight: hasIt ? 700 : 500, color: hasIt ? '#166534' : '#64748b' }}>{labels[key as keyof typeof labels]}</span>
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
                    box1={data.showSignatures?.operator !== false ? {
                        title: 'OPERADOR / TRABAJADOR',
                        subtitle: (data.workerName || 'Firma del Operador').toUpperCase(),
                        signatureUrl: data.operatorSignature || null,
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
                        title: 'SUPERVISOR / AUTORIZANTE',
                        subtitle: (data.supervisor || 'Firma del Supervisor').toUpperCase(),
                        signatureUrl: data.supervisorSignature || data.signature || null,
                        isProfessional: false
                    } : null}
                />

                <PdfBrandingFooter />
            </div>
        </div>
    );
}
