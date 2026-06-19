import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, ShieldCheck, Weight, ArrowDownToLine, Users, Printer, Share2, Pencil, Search, Plus, Trash2, Calendar, CheckCircle2, FileText } from 'lucide-react';
import { Crane } from '@phosphor-icons/react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import LiftingPdfGenerator from '../components/LiftingPdfGenerator';
import ConfirmModal from '../components/ConfirmModal';
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

export default function LiftingForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

    useDocumentTitle(isEdit ? 'Editar Plan de Izaje' : 'Planes de Izaje');
    
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [plans, setPlans] = useState<any[]>([]);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

    useEffect(() => {
        window.scrollTo(0, 0);
        const saved = JSON.parse(localStorage.getItem('lifting_plans_db') || '[]');
        setPlans(saved);
    }, [isFormVisible]);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmModal({ isOpen: true, payload: id });
    };

    const executeDelete = () => {
        if (confirmModal.payload) {
            const updated = plans.filter((p: any) => p.id !== confirmModal.payload);
            localStorage.setItem('lifting_plans_db', JSON.stringify(updated));
            setPlans(updated);
            toast.success('Registro eliminado');
        }
        setConfirmModal({ isOpen: false, payload: null });
    };

    const filteredPlans = plans.filter((p: any) => 
        p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.personnel?.operator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.equipment?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const [plan, setPlan] = useState<any>({
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
        },
        operatorSignature: '',
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
        setPlan((prev: any) => {
            const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
            return { ...prev, showSignatures: updated };
        });
    };

    const showSignatures = plan.showSignatures || { operator: true, professional: true, supervisor: true };

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
        if (location.state?.editData) {
            const editData = location.state.editData;
            setPlan({
                ...editData,
                operatorSignature: editData.operatorSignature || editData.signatures?.operator || '',
                professionalSignature: editData.professionalSignature || '',
                supervisorSignature: editData.supervisorSignature || editData.signatures?.supervisor || '',
                showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
            });
            setIsEdit(true);
            setIsFormVisible(true);
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

        const planWithSignatures = {
            ...plan,
            professionalSignature: plan.professionalSignature || professional.signature,
            professionalName: plan.professionalName || professional.name,
            professionalLicense: plan.professionalLicense || professional.license,
            professionalStamp: plan.professionalStamp || professional.stamp,
            signatures: {
                operator: plan.operatorSignature,
                supervisor: plan.supervisorSignature
            }
        };

        if (isEdit) {
            updated = saved.map((p: any) => p.id === (plan as any).id ? planWithSignatures : p);
            toast.success('Plan de Izaje actualizado');
        } else {
            const newPlan = {
                ...planWithSignatures,
                id: `LIFT-${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: 'active'
            };
            updated = [newPlan, ...saved];
            toast.success('Plan de Izaje guardado');
        }
        
        localStorage.setItem('lifting_plans_db', JSON.stringify(updated));
        
        setIsFormVisible(false);
        setIsEdit(false);
        setPlan({
            location: '', date: new Date().toISOString().split('T')[0], time: '',
            equipment: 'Grua Movil', equipmentCapacity: '', loadWeight: '', maxRadius: '', windSpeed: '',
            riggingElements: { slings: false, shackles: false, spreaderBar: false, hooks: false },
            personnel: { operator: '', rigger: '', supervisor: '' },
            checklist: { groundStable: false, areaIsolated: false, weatherGood: false, powerLinesClear: false, elementsInspected: false },
            observations: '', signatures: { operator: '', supervisor: '' },
            operatorSignature: '', professionalSignature: '', supervisorSignature: '',
            showSignatures: { operator: true, professional: true, supervisor: true }
        });
        window.scrollTo(0, 0);
    };

    const toggleChecklist = (key: string) => {
        setPlan(prev => ({
            ...prev,
            checklist: { ...prev.checklist, [key]: !(prev.checklist as any)[key] }
        }));
    };

    const loadPercentage = calculateLoadPercentage();
    const isCritical = parseFloat(loadPercentage as string) >= 75;

    if (!isFormVisible && !isEdit) {
        return (
            <div className="container" style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '7rem', paddingTop: isMobile ? '4.5rem' : '5.5rem' }}>
                <PremiumHeader 
                    title="Planes de Izaje"
                    subtitle="Gestión e historial de planes de izaje seguro."
                    icon={<Weight size={32} color="#ffffff" />}
                    color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                />
                
                <main style={{ padding: '0 0 2rem 0', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    {/* Botones de Navegación */}
                    <div style={{ display: 'flex', gap: '1rem', padding: '0 1rem', marginBottom: '1rem' }}>
                        <></>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', padding: '0 1rem' }}>
                        <div style={{ position: 'relative', flex: '1 1 300px' }}>
                            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar por ubicación o equipo..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem 0.8rem 2.8rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text)',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <button
                            onClick={() => setIsFormVisible(true)}
                            className="btn-primary"
                            style={{ margin: 0, background: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={20} /> NUEVO PLAN
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', padding: '0 1rem' }}>
                        {filteredPlans.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-surface)', borderRadius: '24px', border: '1px dashed var(--color-border)' }}>
                                <Weight size={48} style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }} />
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>No hay planes registrados</h3>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Cargue su primer plan de izaje.</p>
                            </div>
                        ) : (
                            filteredPlans.map((item: any) => {
                                const loadRatio = item.loadWeight && item.equipmentCapacity 
                                    ? (parseFloat(item.loadWeight) / parseFloat(item.equipmentCapacity)) * 100 
                                    : 0;
                                const isCritical = loadRatio >= 75;

                                return (
                                    <div 
                                        key={item.id}
                                        onClick={() => {
                                            setPlan({ ...item, showSignatures: item.showSignatures || { operator: true, professional: true, supervisor: true } });
                                            setIsEdit(true);
                                            setIsFormVisible(true);
                                        }}
                                        className="card hover-lift animate-fade-in"
                                        style={{ cursor: 'pointer', padding: '1.5rem', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 900 }}>{item.location}</h3>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <span style={{ 
                                                background: isCritical ? '#fef2f2' : '#f0fdf4', 
                                                color: isCritical ? '#dc2626' : '#16a34a', 
                                                padding: '0.3rem 0.6rem', 
                                                borderRadius: '6px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 900,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                {isCritical ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                                                {isCritical ? 'CRÍTICO' : 'NORMAL'}
                                            </span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Equipo:</span>
                                                <span style={{ fontWeight: 600 }}>{item.equipment || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Carga:</span>
                                                <span style={{ fontWeight: 600 }}>{item.loadWeight ? `${item.loadWeight} kg` : '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>% Capacidad:</span>
                                                <span style={{ fontWeight: 600, color: isCritical ? '#dc2626' : 'inherit' }}>
                                                    {loadRatio ? `${loadRatio.toFixed(1)}%` : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <FileText size={14} /> Ver / Editar
                                            </span>
                                            <button 
                                                onClick={(e) => handleDelete(item.id, e)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
                <ConfirmModal 
                    isOpen={confirmModal.isOpen} 
                    onClose={() => setConfirmModal({ isOpen: false, payload: null })} 
                    onConfirm={executeDelete} 
                    title="¿Eliminar registro?" 
                    message="Esta acción no se puede deshacer." 
                    iconEmoji="🗑️" 
                />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem', paddingTop: isMobile ? '7.5rem' : '6.5rem' }}>
            <PremiumHeader 
                title={isEdit ? 'Editar Plan de Izaje' : 'Nuevo Plan de Izaje'}
                subtitle="Complete la información del plan de izaje."
                icon={<Crane size={32} color="#ffffff" />}
                color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
            />

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <></>
                </div>
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

                    {/* Firmas y Autorizaciones */}
                    <div style={{ marginTop: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                                <Pencil size={24} color="#38bdf8" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                                Firmas y Autorizaciones del Plan
                            </h3>
                        </div>

                        {/* Signature Visibility Toggles (Pill style) */}
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
                                    { id: 'operator', label: 'Operador', checked: showSignatures.operator },
                                    { id: 'professional', label: 'Especialista H&S', checked: showSignatures.professional },
                                    { id: 'supervisor', label: 'Supervisor de Izaje', checked: showSignatures.supervisor }
                                ].map((sig) => (
                                    <label key={sig.id} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem', 
                                        cursor: 'pointer',
                                        padding: '0.5rem 1rem',
                                        background: sig.checked ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-background)',
                                        border: `1px solid ${sig.checked ? '#38bdf8' : 'var(--color-border)'}`,
                                        borderRadius: '20px',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '4px',
                                            border: `2px solid ${sig.checked ? '#38bdf8' : 'var(--color-text-secondary)'}`,
                                            background: sig.checked ? '#38bdf8' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {sig.checked && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={sig.checked} 
                                            onChange={e => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))} 
                                            style={{ display: 'none' }} 
                                        /> 
                                        <span style={{ fontSize: '0.9rem', fontWeight: sig.checked ? 700 : 500, color: sig.checked ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
                                            {sig.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <PdfSignatures
                                data={{
                                    ...plan,
                                    professionalSignature: professional.signature,
                                    professionalName: professional.name,
                                    professionalLicense: professional.license,
                                    professionalStamp: professional.stamp
                                }}
                                box1={showSignatures.operator ? {
                                    title: 'OPERADOR DEL EQUIPO',
                                    subtitle: (plan.personnel?.operator || 'Firma del Operador').toUpperCase(),
                                    signatureUrl: plan.operatorSignature || null,
                                    isProfessional: false
                                } : null}
                                box2={showSignatures.professional ? {
                                    title: 'PROFESIONAL H&S',
                                    subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                    signatureUrl: plan.professionalSignature || professional.signature || null,
                                    stampUrl: plan.professionalStamp || professional.stamp || null,
                                    isProfessional: true,
                                    license: professional.license
                                } : null}
                                box3={showSignatures.supervisor ? {
                                    title: 'SUPERVISOR DE IZAJE',
                                    subtitle: (plan.personnel?.supervisor || 'Firma del Supervisor').toUpperCase(),
                                    signatureUrl: plan.supervisorSignature || null,
                                    isProfessional: false
                                } : null}
                            />
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads - Premium Glassmorphism */}
                        <div className="no-print" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                            gap: '2rem', 
                            marginTop: '2rem' 
                        }}>
                            {showSignatures.operator && (
                                <div className="animate-fade-in" style={{
                                    background: 'rgba(var(--color-surface-rgb), 0.3)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Firma del Operador
                                    </div>
                                    <SignatureCanvas 
                                        onSave={(sig) => setPlan((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                        initialImage={plan.operatorSignature}
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
                                        onSave={(sig) => setPlan((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                        initialImage={plan.professionalSignature || professional.signature}
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
                                        Firma del Supervisor
                                    </div>
                                    <SignatureCanvas 
                                        onSave={(sig) => setPlan((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                                        initialImage={plan.supervisorSignature}
                                        label=""
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <div className="no-print floating-action-bar">
                <button
                    onClick={() => { setIsFormVisible(false); setIsEdit(false); }}
                    className="btn-floating-action"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                    <ArrowLeft size={18} /> ATRÁS
                </button>
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

            <div className="print-only" style={{ position: 'fixed', left: 0, opacity: 0.01, top: 0 }}>
                <LiftingPdfGenerator data={{
                    ...plan,
                    professionalSignature: plan.professionalSignature || professional.signature,
                    professionalName: plan.professionalName || professional.name,
                    professionalLicense: plan.professionalLicense || professional.license,
                    professionalStamp: plan.professionalStamp || professional.stamp,
                    signatures: {
                        operator: plan.operatorSignature || plan.signatures?.operator || '',
                        supervisor: plan.supervisorSignature || plan.signatures?.supervisor || ''
                    }
                }} />
            </div>
        </div>
    );
}
