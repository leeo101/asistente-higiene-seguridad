import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Users, Target, ShieldCheck, Printer, Share2, Timer, Pencil, Building2, Search } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import EvacuationPdfGenerator from '../components/EvacuationPdfGenerator';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--color-text)'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-background)',
    color: 'var(--color-text)',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box' as any,
    transition: 'all 0.2s'
};

export default function EvacuationSimulatorForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useDocumentTitle(isEdit ? 'Editar Simulador de Evacuación' : 'Simulador de Evacuación');

    const [form, setForm] = useState<any>({
        sector: '',
        date: new Date().toISOString().split('T')[0],
        evaluator: '',
        
        // Variables de cálculo
        peopleCount: 50,
        exitWidth: 1.2, // in meters
        maxDistance: 30, // in meters
        walkingSpeed: 1.2, // m/s
        specificFlow: 1.3, // people / (meter * second)

        observations: '',
        signatures: {
            evaluator: '',
            manager: ''
        },
        evaluatorSignature: '',
        professionalSignature: '',
        supervisorSignature: '',
        showSignatures: { operator: true, professional: true, supervisor: true }
    });

    const [professional, setProfessional] = useState<any>({
        name: '',
        license: '',
        signature: null,
        stamp: null
    });

    const setShowSignatures = (updater: any) => {
        setForm((prev: any) => {
            const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
            return { ...prev, showSignatures: updated };
        });
    };

    const showSignatures = form.showSignatures || { operator: true, professional: true, supervisor: true };

    useEffect(() => {
        const savedData = localStorage.getItem('personalData');
        const savedSigData = localStorage.getItem('signatureStampData');
        const legacySignature = localStorage.getItem('capturedSignature');

        let signature = legacySignature || null;
        let stamp = null;
        if (savedSigData) {
            const parsed = JSON.parse(savedSigData);
            signature = parsed.signature || signature;
            stamp = parsed.stamp || null;
        }

        if (savedData) {
            const data = JSON.parse(savedData);
            setProfessional({
                name: data.name || '',
                license: data.license || '',
                signature: signature,
                stamp: stamp
            });
        } else {
            setProfessional((prev: any) => ({ ...prev, signature, stamp }));
        }
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (location.state?.editData) {
            const editData = location.state.editData;
            setForm({
                ...editData,
                evaluatorSignature: editData.evaluatorSignature || editData.signatures?.evaluator || '',
                professionalSignature: editData.professionalSignature || '',
                supervisorSignature: editData.supervisorSignature || editData.signatures?.manager || '',
                showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
            });
            setIsEdit(true);
        }
    }, [location.state]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const calculateEvacuationTime = () => {
        const { peopleCount, exitWidth, maxDistance, walkingSpeed, specificFlow } = form;
        if (!exitWidth || !walkingSpeed || !specificFlow) return { flowTime: 0, travelTime: 0, total: 0 };
        
        // Tiempo de flujo (pasar por la puerta)
        const flowTime = peopleCount / (exitWidth * specificFlow);
        
        // Tiempo de viaje (caminar hasta la salida)
        const travelTime = maxDistance / walkingSpeed;
        
        // El tiempo total es la suma teórica básica
        const total = flowTime + travelTime;
        
        return {
            flowTime: flowTime.toFixed(1),
            travelTime: travelTime.toFixed(1),
            total: total.toFixed(1)
        };
    };

    const results = calculateEvacuationTime();

    const handleSave = () => {
        if (!form.sector || !form.evaluator) {
            toast.error('Complete el Sector y el Evaluador');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('evacuation_simulator_db') || '[]');
        let updated;

        const dataToSave = {
            ...form,
            calculatedTime: results.total,
            professionalSignature: form.professionalSignature || professional.signature,
            professionalName: form.professionalName || professional.name,
            professionalLicense: form.professionalLicense || professional.license,
            professionalStamp: form.professionalStamp || professional.stamp,
            signatures: {
                evaluator: form.evaluatorSignature,
                manager: form.supervisorSignature
            }
        };

        if (isEdit) {
            updated = saved.map((p: any) => p.id === (form as any).id ? dataToSave : p);
            toast.success('Simulación actualizada');
        } else {
            const newForm = {
                ...dataToSave,
                id: `EVAC-${Date.now()}`,
                createdAt: new Date().toISOString()
            };
            updated = [newForm, ...saved];
            toast.success('Simulación guardada');
        }
        
        localStorage.setItem('evacuation_simulator_db', JSON.stringify(updated));
        navigate('/evacuation-history');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem', paddingTop: isMobile ? '7.5rem' : '6.5rem' }}>
            <main style={{ padding: '0rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="no-print" style={{ marginBottom: '2rem' }}>
                    <PremiumHeader 
                        title={isEdit ? 'Editar Simulación de Evacuación' : 'Simulador de Evacuación (Teórico)'}
                        subtitle="Cálculo de tiempos teóricos de escape"
                        icon={<Timer size={32} color="#ffffff" />}
                        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                        <></>
                    </div>
                </div>

                <div className="card" style={{ padding: '2rem', borderTop: '4px solid #3b82f6', background: 'linear-gradient(180deg, rgba(59,130,246,0.03) 0%, rgba(0,0,0,0) 100%)', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 800 }}>
                        <Building2 size={24} /> Datos del Establecimiento
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div>
                            <label style={labelStyle}>Sector / Edificio *</label>
                            <input type="text" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} style={inputStyle} placeholder="Ej: Planta Baja, Oficinas Administrativas" />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha de Evaluación</label>
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                            <label style={labelStyle}>Evaluador a Cargo *</label>
                            <input type="text" value={form.evaluator} onChange={(e) => setForm({ ...form, evaluator: e.target.value })} style={inputStyle} />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '2rem', borderTop: '4px solid #f97316', background: 'linear-gradient(180deg, rgba(249,115,22,0.03) 0%, rgba(0,0,0,0) 100%)', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f97316', fontWeight: 800 }}>
                        <Users size={24} /> Parámetros de Cálculo
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Población Estimada (N)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="number" min="1" value={form.peopleCount} onChange={(e) => setForm({ ...form, peopleCount: Number(e.target.value) })} style={inputStyle} />
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>personas</span>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Ancho Total Salidas (A)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="number" step="0.1" min="0.8" value={form.exitWidth} onChange={(e) => setForm({ ...form, exitWidth: Number(e.target.value) })} style={inputStyle} />
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>metros</span>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Dist. Máx. a Salida (D)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="number" min="1" value={form.maxDistance} onChange={(e) => setForm({ ...form, maxDistance: Number(e.target.value) })} style={inputStyle} />
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>metros</span>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Velocidad Marcha (V)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="number" step="0.1" value={form.walkingSpeed} onChange={(e) => setForm({ ...form, walkingSpeed: Number(e.target.value) })} style={inputStyle} />
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>m/s</span>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Flujo Específico (k)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="number" step="0.1" value={form.specificFlow} onChange={(e) => setForm({ ...form, specificFlow: Number(e.target.value) })} style={inputStyle} />
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>pers/m·s</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', background: '#1e293b', color: 'white', padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Tiempo de Desplazamiento</span>
                                <span style={{ fontWeight: 700 }}>{results.travelTime} seg</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Tiempo de Paso por Puertas</span>
                                <span style={{ fontWeight: 700 }}>{results.flowTime} seg</span>
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '12px', minWidth: '200px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Tiempo Total Estimado</span>
                            <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, margin: '0.5rem 0' }}>{results.total} <span style={{ fontSize: '1rem' }}>seg</span></div>
                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(~{(Number(results.total) / 60).toFixed(1)} minutos)</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Conclusiones / Observaciones</label>
                        <textarea 
                            value={form.observations} 
                            onChange={(e) => setForm({ ...form, observations: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '100px' }} 
                            placeholder="El tiempo de evacuación teórico es aceptable. Se recomienda realizar simulacro práctico para validar tiempos reales."
                        />
                    </div>
                </div>

                    {/* Firmas y Autorizaciones */}
                    <div className="card animate-fade-in" style={{ marginTop: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)' }}>
                        <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                            <Pencil size={22} style={{ color: 'var(--color-primary)' }} /> Firmas y Autorizaciones del Reporte
                        </h3>

                        <div className="no-print" style={{ 
                            marginBottom: '2rem', 
                            padding: '1.2rem', 
                            background: 'var(--color-surface)', 
                            border: '1px solid var(--color-border)', 
                            borderRadius: '16px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '1rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{ color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                INCLUIR FIRMAS EN EL DOCUMENTO:
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {[
                                    { id: 'operator', label: 'Evaluador Técnico' },
                                    { id: 'professional', label: 'Especialista H&S' },
                                    { id: 'supervisor', label: 'Responsable Sector' }
                                ].map((sig) => {
                                    const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                                    return (
                                        <label key={sig.id} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem', 
                                            cursor: 'pointer',
                                            padding: '0.5rem 1rem',
                                            background: isChecked ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-background)',
                                            border: `1px solid ${isChecked ? '#38bdf8' : 'var(--color-border)'}`,
                                            borderRadius: '20px',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '4px',
                                                border: `2px solid ${isChecked ? '#38bdf8' : 'var(--color-text-secondary)'}`,
                                                background: isChecked ? '#38bdf8' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {isChecked && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                onChange={e => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))} 
                                                style={{ display: 'none' }} 
                                            /> 
                                            <span style={{ fontSize: '0.9rem', fontWeight: isChecked ? 700 : 500, color: isChecked ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
                                                {sig.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <PdfSignatures
                                data={{
                                    ...form,
                                    professionalSignature: professional.signature,
                                    professionalName: professional.name,
                                    professionalLicense: professional.license,
                                    professionalStamp: professional.stamp
                                }}
                                box1={showSignatures.operator ? {
                                    title: 'EVALUADOR TÉCNICO',
                                    subtitle: (form.evaluator || 'Firma del Evaluador').toUpperCase(),
                                    signatureUrl: form.evaluatorSignature || null,
                                    isProfessional: false
                                } : null}
                                box2={showSignatures.professional ? {
                                    title: 'PROFESIONAL H&S',
                                    subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                    signatureUrl: form.professionalSignature || professional.signature || null,
                                    stampUrl: form.professionalStamp || professional.stamp || null,
                                    isProfessional: true,
                                    license: professional.license
                                } : null}
                                box3={showSignatures.supervisor ? {
                                    title: 'RESPONSABLE SECTOR',
                                    subtitle: 'Firma de Responsable',
                                    signatureUrl: form.supervisorSignature || null,
                                    isProfessional: false
                                } : null}
                            />
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {showSignatures.operator && (
                                <div className="animate-fade-in" style={{
                                    background: 'rgba(var(--color-surface-rgb), 0.3)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Firma de Evaluador Técnico
                                    </div>
                                    <SignatureCanvas 
                                        onSave={(sig) => setForm((prev: any) => ({ ...prev, evaluatorSignature: sig || '' }))}
                                        initialImage={form.evaluatorSignature}
                                        label=""
                                    />
                                </div>
                            )}
                            
                            {showSignatures.professional && (
                                <div className="animate-fade-in" style={{
                                    background: 'rgba(var(--color-surface-rgb), 0.3)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Firma de Especialista H&S
                                    </div>
                                    <SignatureCanvas 
                                        onSave={(sig) => setForm((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                        initialImage={form.professionalSignature || professional.signature}
                                        label=""
                                    />
                                </div>
                            )}

                            {showSignatures.supervisor && (
                                <div className="animate-fade-in" style={{
                                    background: 'rgba(var(--color-surface-rgb), 0.3)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Firma del Responsable del Sector
                                    </div>
                                    <SignatureCanvas 
                                        onSave={(sig) => setForm((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                                        initialImage={form.supervisorSignature}
                                        label=""
                                    />
                                </div>
                            )}
                        </div>
                    </div>
            </main>

            <div className="no-print floating-action-bar">
                <button
                    onClick={() => requirePro(() => setShowShareModal(true))}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => requirePro(() => window.print())}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: '#ffffff' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); requirePro(handleSave); }}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: '#ffffff' }}
                >
                    <Save size={18} /> GUARDAR
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Simulación de Evacuación"
                text={`Simulación Sector ${form.sector} - Tiempo Total Estimado: ${results.total} segundos`}
                rawMessage={`Simulación Sector ${form.sector} - Tiempo Total Estimado: ${results.total} segundos`}
                fileName={`Evacuacion_${form.sector || 'Nuevo'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: 0, opacity: 0.01, top: 0 }}>
                <EvacuationPdfGenerator data={{
                    ...form,
                    calculatedTime: results.total,
                    flowTime: results.flowTime,
                    travelTime: results.travelTime,
                    professionalSignature: form.professionalSignature || professional.signature,
                    professionalName: form.professionalName || professional.name,
                    professionalLicense: form.professionalLicense || professional.license,
                    professionalStamp: form.professionalStamp || professional.stamp,
                    signatures: {
                        evaluator: form.evaluatorSignature || form.signatures?.evaluator || '',
                        manager: form.supervisorSignature || form.signatures?.manager || ''
                    }
                }} />
            </div>
        </div>
    );
}
