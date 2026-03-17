import { ShieldAlert, Activity, AlertCircle, Calendar, MapPin, Briefcase } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

export default function RiskAssessmentPdfGenerator({ assessmentData }) {
    if (!assessmentData) return null;

    const data = assessmentData;
    const score = data.score || (data.probability * data.severity) || 0;

    // Risk Level details for the report
    let riskInfo = {
        label: data.riskLabel || 'Bajo',
        color: '#10b981',
        bg: '#d1fae5',
        action: 'Riesgo aceptable. No requiere medidas adicionales.'
    };

    if (score > 6) {
        riskInfo = { label: 'Crítico', color: '#ef4444', action: 'PELIGRO INMINENTE. Detener la tarea hasta mitigar el riesgo.', bg: '#fee2e2' };
    } else if (score > 4) {
        riskInfo = { label: 'Alto', color: '#f97316', action: 'Riesgo importante. Requiere medidas de ingeniería inmediatas.', bg: '#ffedd5' };
    } else if (score > 2) {
        riskInfo = { label: 'Moderado', color: '#f59e0b', action: 'Requiere seguimiento. Implementar medidas de control administrativas.', bg: '#fef3c7' };
    }

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '20mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                    boxSizing: 'border-box', margin: '0 auto', fontSize: '10pt',
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

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #1e293b', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sistema de Gestión HYS</p>
                            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', textTransform: 'uppercase' }}>Evaluación de Riesgo</h1>
                        </div>
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
                            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#10b981' }}>IPER</div>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>METODOLOGÍA BINARIA</p>
                        </div>
                    </div>
                </div>

                {/* Project Context */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem', pageBreakInside: 'avoid' }}>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b' }}>
                            <Briefcase size={14} />
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>Tarea / Actividad</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{data.name || 'Sin nombre'}</div>
                    </div>

                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b' }}>
                            <MapPin size={14} />
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>Ubicación / Área</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{data.location || 'No especificada'}</div>
                    </div>

                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b' }}>
                            <Calendar size={14} />
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>Fecha de Evaluación</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{data.date ? new Date(data.date).toLocaleDateString() : 'N/A'}</div>
                    </div>
                </div>

                {/* Risk Analysis Section */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#1e293b', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase' }}>
                        <Activity size={20} color="#2563eb" /> Análisis de Matriz
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div style={{ textAlign: 'center', padding: '1.5rem', border: '2px solid #e2e8f0', borderRadius: '16px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Probabilidad</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#2563eb' }}>{data.probability || 0}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 300, color: '#64748b' }}>×</div>
                        <div style={{ textAlign: 'center', padding: '1.5rem', border: '2px solid #e2e8f0', borderRadius: '16px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Severidad</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ef4444' }}>{data.severity || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Result Card */}
                <div style={{
                    padding: '2.5rem',
                    borderRadius: '24px',
                    background: riskInfo.bg,
                    border: `2px solid ${riskInfo.color}30`,
                    textAlign: 'center',
                    marginBottom: '2.5rem'
                }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: riskInfo.color, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem' }}>Resultado del Nivel de Riesgo</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: 900, color: riskInfo.color, lineHeight: 1, marginBottom: '0.5rem' }}>{score}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: riskInfo.color, textTransform: 'uppercase' }}>{riskInfo.label}</div>
                </div>

                {/* Recommendation */}
                <div style={{ borderLeft: `8px solid ${riskInfo.color}`, background: '#f8fafc', padding: '1.5rem', borderRadius: '0 16px 16px 0', marginBottom: '4rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <AlertCircle size={24} color={riskInfo.color} />
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: riskInfo.color, fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase' }}>Acción Recomendada</h4>
                            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: '#334155', fontWeight: 500 }}>{riskInfo.action}</p>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                    <div style={{ width: '40%', textAlign: 'center' }}>
                        <div style={{ height: '60px' }}></div>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>RESPONSABLE DE SEGURIDAD</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Firma y Sello</p>
                        </div>
                    </div>
                    <div style={{ width: '40%', textAlign: 'center' }}>
                        <div style={{ height: '60px' }}></div>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>FECHA DE REVISIÓN</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Sello de Recepción</p>
                        </div>
                    </div>
                </div>

                {/* Footer Branding */}
                <div style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.5 }}>
                    <p style={{ margin: 0, fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>Documento generado mediante Asistente de Higiene y Seguridad PRO</p>
                </div>
            </div>
        </div>
    );
}
