import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Users, Target, ShieldCheck, Printer, Share2, Timer } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import EvacuationPdfGenerator from '../components/EvacuationPdfGenerator';

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
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const { requirePro } = usePaywall();

    useDocumentTitle(isEdit ? 'Editar Simulador de Evacuación' : 'Simulador de Evacuación');

    const [form, setForm] = useState({
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
        }
    });

    useEffect(() => {
        if (location.state?.editData) {
            setForm(location.state.editData);
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
            calculatedTime: results.total
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
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: '5.5rem',
                zIndex: 100,
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '0.5rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900 }}>
                        <Timer size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        {isEdit ? 'Editar Simulación de Evacuación' : 'Simulador de Evacuación (Teórico)'}
                    </h1>
                </div>
            </div>

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    
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

                    <h3 style={{ margin: '2rem 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <Users size={22} /> Parámetros de Cálculo
                    </h3>

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

                    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                        <SignatureCanvas 
                            onSave={(sig) => setForm({ ...form, signatures: { ...form.signatures, evaluator: sig || '' } })}
                            initialImage={form.signatures.evaluator}
                            label="Firma Evaluador H&S"
                        />
                        <SignatureCanvas 
                            onSave={(sig) => setForm({ ...form, signatures: { ...form.signatures, manager: sig || '' } })}
                            initialImage={form.signatures.manager}
                            label="Firma Responsable Sector"
                        />
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
                    onClick={handleSave}
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

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <EvacuationPdfGenerator data={{...form, calculatedTime: results.total, flowTime: results.flowTime, travelTime: results.travelTime}} />
            </div>
        </div>
    );
}
