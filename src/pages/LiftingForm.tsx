import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, ShieldCheck, Weight, ArrowDownToLine, Users, Printer, Share2 } from 'lucide-react';
import { Crane } from '@phosphor-icons/react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import LiftingPdfGenerator from '../components/LiftingPdfGenerator';

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

export default function LiftingForm(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const { isPro, requirePro } = usePaywall();

    useDocumentTitle(isEdit ? 'Editar Plan de Izaje' : 'Nuevo Plan de Izaje');
    
    const [plan, setPlan] = useState({
        location: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        equipment: 'Grua Movil',
        equipmentCapacity: '',
        loadWeight: '',
        maxRadius: '',
        windSpeed: '',
        riggingElements: {
            slings: false,
            shackles: false,
            spreaderBar: false,
            hooks: false
        },
        personnel: {
            operator: '',
            rigger: '',
            supervisor: ''
        },
        checklist: {
            groundStable: false,
            areaIsolated: false,
            weatherGood: false,
            powerLinesClear: false,
            elementsInspected: false
        },
        observations: '',
        signatures: {
            operator: '',
            supervisor: ''
        }
    });

    useEffect(() => {
        if (location.state?.editData) {
            setPlan(location.state.editData);
            setIsEdit(true);
        }
    }, [location.state]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const calculateLoadPercentage = () => {
        const load = parseFloat(plan.loadWeight);
        const capacity = parseFloat(plan.equipmentCapacity);
        if (isNaN(load) || isNaN(capacity) || capacity === 0) return 0;
        return ((load / capacity) * 100).toFixed(1);
    };

    const handleSave = () => {
        if (!plan.location || !plan.loadWeight || !plan.equipmentCapacity) {
            toast.error('Complete la Ubicación y los pesos de carga y capacidad');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('lifting_plans_db') || '[]');
        let updated;

        if (isEdit) {
            updated = saved.map((p: any) => p.id === (plan as any).id ? plan : p);
            toast.success('Plan de Izaje actualizado');
        } else {
            const newPlan = {
                ...plan,
                id: `LIFT-${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: 'active'
            };
            updated = [newPlan, ...saved];
            toast.success('Plan de Izaje guardado');
        }
        
        localStorage.setItem('lifting_plans_db', JSON.stringify(updated));
        navigate('/lifting-history');
    };

    const toggleChecklist = (key: string) => {
        setPlan(prev => ({
            ...prev,
            checklist: { ...prev.checklist, [key]: !(prev.checklist as any)[key] }
        }));
    };

    const loadPercentage = calculateLoadPercentage();
    const isCritical = parseFloat(loadPercentage as string) >= 75;

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
                        <Crane size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        {isEdit ? 'Editar Plan de Izaje' : 'Nuevo Plan de Izaje Seguro'}
                    </h1>
                </div>
            </div>

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Ubicación de la Maniobra *</label>
                            <input type="text" value={plan.location} onChange={(e) => setPlan({ ...plan, location: e.target.value })} style={inputStyle} placeholder="Sector, Plataforma..." />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha</label>
                            <input type="date" value={plan.date} onChange={(e) => setPlan({ ...plan, date: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Hora Estimada</label>
                            <input type="time" value={plan.time} onChange={(e) => setPlan({ ...plan, time: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Equipo a Utilizar</label>
                            <select value={plan.equipment} onChange={(e) => setPlan({ ...plan, equipment: e.target.value })} style={inputStyle}>
                                <option value="Grua Movil">Grúa Móvil</option>
                                <option value="Grua Torre">Grúa Torre</option>
                                <option value="Puente Grua">Puente Grúa</option>
                                <option value="Autoelevador">Autoelevador</option>
                                <option value="Hidrogrúa">Hidrogrúa</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Velocidad Viento (km/h)</label>
                            <input type="number" value={plan.windSpeed} onChange={(e) => setPlan({ ...plan, windSpeed: e.target.value })} style={inputStyle} placeholder="Máx 32 km/h" />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', padding: '1.5rem', borderRadius: '12px', background: isCritical ? '#fef2f2' : 'var(--color-surface)', border: `1px solid ${isCritical ? '#fecaca' : 'var(--color-border)'}` }}>
                        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: isCritical ? '#dc2626' : 'var(--color-primary)' }}>
                            <Weight size={20} /> Cálculos de Carga {isCritical && '(IZAJE CRÍTICO)'}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Peso Total a Izar (kg) *</label>
                                <input type="number" value={plan.loadWeight} onChange={(e) => setPlan({ ...plan, loadWeight: e.target.value })} style={inputStyle} placeholder="Incluye accesorios" />
                            </div>
                            <div>
                                <label style={labelStyle}>Capacidad Bruta Grúa (kg) *</label>
                                <input type="number" value={plan.equipmentCapacity} onChange={(e) => setPlan({ ...plan, equipmentCapacity: e.target.value })} style={inputStyle} placeholder="Capacidad a radio max" />
                            </div>
                            <div>
                                <label style={labelStyle}>Porcentaje Capacidad</label>
                                <div style={{ 
                                    padding: '0.75rem', 
                                    borderRadius: '12px', 
                                    background: isCritical ? '#dc2626' : '#16a34a',
                                    color: 'white',
                                    fontWeight: 900,
                                    fontSize: '1.1rem',
                                    textAlign: 'center',
                                    marginTop: '0.2rem'
                                }}>
                                    {loadPercentage}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Personal Involucrado</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Operador del Equipo</label>
                                    <input type="text" value={plan.personnel.operator} onChange={(e) => setPlan({ ...plan, personnel: { ...plan.personnel, operator: e.target.value } })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Rigger / Señalero</label>
                                    <input type="text" value={plan.personnel.rigger} onChange={(e) => setPlan({ ...plan, personnel: { ...plan.personnel, rigger: e.target.value } })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Supervisor a cargo</label>
                                    <input type="text" value={plan.personnel.supervisor} onChange={(e) => setPlan({ ...plan, personnel: { ...plan.personnel, supervisor: e.target.value } })} style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Condiciones de Seguridad</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[
                                    { key: 'groundStable', label: 'Terreno Firme y Nivelado' },
                                    { key: 'areaIsolated', label: 'Área Delimitada y Señalizada' },
                                    { key: 'weatherGood', label: 'Condiciones Climáticas Favorables' },
                                    { key: 'powerLinesClear', label: 'Distancia de Líneas Eléctricas' },
                                    { key: 'elementsInspected', label: 'Elementos de Izaje Inspeccionados' }
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        onClick={() => toggleChecklist(item.key)}
                                        style={{
                                            padding: '0.75rem',
                                            background: (plan.checklist as any)[item.key] ? 'rgba(22, 163, 74, 0.1)' : 'var(--color-surface)',
                                            border: `2px solid ${(plan.checklist as any)[item.key] ? '#16a34a' : 'var(--color-border)'}`,
                                            borderRadius: 'var(--radius-lg)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: '2px solid #16a34a', background: (plan.checklist as any)[item.key] ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {(plan.checklist as any)[item.key] && <ShieldCheck size={14} color="#fff" />}
                                        </div>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Observaciones Adicionales</label>
                        <textarea 
                            value={plan.observations} 
                            onChange={(e) => setPlan({ ...plan, observations: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '100px' }} 
                            placeholder="Interferencias, maniobras complejas..."
                        />
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                        <SignatureCanvas 
                            onSave={(sig) => setPlan({ ...plan, signatures: { ...plan.signatures, operator: sig || '' } })}
                            initialImage={plan.signatures.operator}
                            label="Firma del Operador"
                        />
                        <SignatureCanvas 
                            onSave={(sig) => setPlan({ ...plan, signatures: { ...plan.signatures, supervisor: sig || '' } })}
                            initialImage={plan.signatures.supervisor}
                            label="Firma del Supervisor"
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
                    <Save size={18} /> GUARDAR PLAN
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Plan de Izaje"
                text={`Plan de Izaje en ${plan.location}`}
                rawMessage={`Plan de Izaje en ${plan.location}`}
                fileName={`Izaje_${plan.location?.replace(/\s+/g, '_') || 'Nuevo'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <LiftingPdfGenerator data={plan} />
            </div>
        </div>
    );
}
