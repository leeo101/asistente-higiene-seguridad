import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, CarFront, AlertTriangle, ShieldCheck, Printer, Share2, ClipboardList, Wrench, FileText, Pencil, Search, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import FleetPdfGenerator from '../components/FleetPdfGenerator';
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
    padding: '0.85rem 1.2rem',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    fontWeight: 500,
    outline: 'none',
    boxSizing: 'border-box' as any,
    transition: 'all 0.3s ease',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
};

const CHECKLIST_ITEMS = [
    { category: 'Documentación', id: 'docs_vtv', label: 'VTV / RTO Vigente' },
    { category: 'Documentación', id: 'docs_insurance', label: 'Seguro Vigente' },
    { category: 'Documentación', id: 'docs_license', label: 'Licencia Conducir OK' },
    
    { category: 'Exterior', id: 'ext_tires', label: 'Estado de Neumáticos (Profundidad >1.6mm)' },
    { category: 'Exterior', id: 'ext_lights', label: 'Luces (Altas, Bajas, Giro, Freno, Retroceso)' },
    { category: 'Exterior', id: 'ext_mirrors', label: 'Espejos Retrovisores Sanos' },
    { category: 'Exterior', id: 'ext_windshield', label: 'Parabrisas sin roturas' },
    
    { category: 'Interior', id: 'int_seatbelts', label: 'Cinturones de Seguridad Funcionales' },
    { category: 'Interior', id: 'int_horn', label: 'Bocina / Alarma de Retroceso' },
    { category: 'Interior', id: 'int_wipers', label: 'Limpiaparabrisas y Sapito' },
    
    { category: 'Elementos de Seguridad', id: 'sec_extinguisher', label: 'Matafuego (Carga Vigente)' },
    { category: 'sec_cones', id: 'sec_cones', label: 'Balizas / Conos Reflectivos' },
    { category: 'sec_firstaid', id: 'sec_firstaid', label: 'Botiquín de Primeros Auxilios' },
];

export default function FleetForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

    useDocumentTitle(isEdit ? 'Editar Inspección de Vehículo' : 'Control de Flota');
    
    // Initialize checklist state with "ok" (others: "fail", "na")
    const initialChecklist = CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 'ok' }), {});

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [inspections, setInspections] = useState<any[]>([]);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('fleet_inspections_db') || '[]');
        setInspections(saved);
    }, [isFormVisible]);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmModal({ isOpen: true, payload: id });
    };

    const executeDelete = () => {
        if (confirmModal.payload) {
            const updated = inspections.filter((p: any) => p.id !== confirmModal.payload);
            localStorage.setItem('fleet_inspections_db', JSON.stringify(updated));
            setInspections(updated);
            toast.success('Registro eliminado');
        }
        setConfirmModal({ isOpen: false, payload: null });
    };

    const filteredInspections = inspections.filter((p: any) => 
        p.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.driver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brandModel?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [form, setForm] = useState<any>({
        vehicleId: '',
        vehicleType: 'Camioneta',
        brandModel: '',
        plate: '',
        mileage: '',
        date: new Date().toISOString().split('T')[0],
        driver: '',
        inspector: '',
        checklist: initialChecklist,
        observations: '',
        status: 'Apto',
        signatures: {
            driver: '',
            inspector: ''
        },
        driverSignature: '',
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
        if (location.state?.editData) {
            const editData = location.state.editData;
            setForm({
                ...editData,
                driverSignature: editData.driverSignature || editData.signatures?.driver || '',
                professionalSignature: editData.professionalSignature || '',
                supervisorSignature: editData.supervisorSignature || editData.signatures?.inspector || '',
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

    const updateChecklist = (id: string, value: string) => {
        setForm(prev => {
            const newChecklist = { ...prev.checklist, [id]: value };
            const hasFailures = Object.values(newChecklist).some(val => val === 'fail');
            return {
                ...prev,
                checklist: newChecklist,
                status: hasFailures ? 'No Apto' : 'Apto'
            };
        });
    };

    const handleSave = () => {
        if (!form.plate || !form.driver) {
            toast.error('Complete la Patente y el Conductor');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('fleet_inspections_db') || '[]');
        let updated;

        const formWithSignatures = {
            ...form,
            professionalSignature: form.professionalSignature || professional.signature,
            professionalName: form.professionalName || professional.name,
            professionalLicense: form.professionalLicense || professional.license,
            professionalStamp: form.professionalStamp || professional.stamp,
            signatures: {
                driver: form.driverSignature,
                inspector: form.supervisorSignature
            }
        };

        if (isEdit) {
            updated = saved.map((p: any) => p.id === (form as any).id ? formWithSignatures : p);
            toast.success('Inspección actualizada');
        } else {
            const newForm = {
                ...formWithSignatures,
                id: `FLEET-${Date.now()}`,
                createdAt: new Date().toISOString()
            };
            updated = [newForm, ...saved];
            toast.success('Inspección guardada');
        }
        
        localStorage.setItem('fleet_inspections_db', JSON.stringify(updated));
        
        setIsFormVisible(false);
        setIsEdit(false);
        setForm({
            vehicleId: '', vehicleType: 'Camioneta', brandModel: '', plate: '', mileage: '',
            date: new Date().toISOString().split('T')[0], driver: '', inspector: '',
            checklist: initialChecklist, observations: '', status: 'Apto',
            signatures: { driver: '', inspector: '' }, driverSignature: '', professionalSignature: '', supervisorSignature: '',
            showSignatures: { operator: true, professional: true, supervisor: true }
        });
        window.scrollTo(0, 0);
    };

    if (!isFormVisible && !isEdit) {
        return (
            <div className="container" style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '7rem', paddingTop: isMobile ? '4.5rem' : '5.5rem' }}>
                <PremiumHeader onBack={isFormVisible ? () => { setIsFormVisible(false); } : undefined} 
                    title="Control de Flota y Vehículos"
                    subtitle="Gestión e historial de inspecciones pre-operacionales."
                    icon={<CarFront size={32} color="#ffffff"  />}
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
                                placeholder="Buscar por patente o conductor..." 
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
                            className="btn-primary hover-lift"
                            style={{ margin: 0, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', padding: '0.8rem 1.5rem', borderRadius: '12px' }}
                        >
                            <Plus size={20} /> NUEVA INSPECCIÓN
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', padding: '0 1rem' }}>
                        {filteredInspections.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-surface)', borderRadius: '24px', border: '1px dashed var(--color-border)' }}>
                                <CarFront size={48} style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }} />
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>No hay inspecciones registradas</h3>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Cargue la primera inspección pre-operacional.</p>
                            </div>
                        ) : (
                            filteredInspections.map((item: any) => {
                                const isApto = item.status === 'Apto';
                                return (
                                    <div 
                                        key={item.id}
                                        onClick={() => {
                                            setForm({ ...item, showSignatures: item.showSignatures || { operator: true, professional: true, supervisor: true } });
                                            setIsEdit(true);
                                            setIsFormVisible(true);
                                        }}
                                        className="card hover-lift animate-fade-in"
                                        style={{ cursor: 'pointer', padding: '1.5rem', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>{item.plate}</h3>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <span style={{ 
                                                background: isApto ? '#f0fdf4' : '#fef2f2', 
                                                color: isApto ? '#16a34a' : '#dc2626', 
                                                padding: '0.3rem 0.6rem', 
                                                borderRadius: '6px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 900,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                {isApto ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                                {item.status?.toUpperCase() || 'N/A'}
                                            </span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Modelo:</span>
                                                <span style={{ fontWeight: 600 }}>{item.brandModel || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Conductor:</span>
                                                <span style={{ fontWeight: 600 }}>{item.driver}</span>
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
            <PremiumHeader onBack={isFormVisible ? () => { setIsFormVisible(false); } : undefined} 
                title={isEdit ? 'Editar Inspección' : 'Nueva Inspección Vehicular'}
                subtitle="Complete el checklist pre-operacional para autorizar el uso del vehículo."
                icon={<CarFront size={32} color="#ffffff"  />}
                color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
            />

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <></>
                </div>

                <div className="card animate-fade-in" style={{ padding: '2.5rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Dominio / Patente *</label>
                            <input type="text" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 800 }} placeholder="AB 123 CD" />
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de Vehículo</label>
                            <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} style={inputStyle}>
                                <option value="Camioneta">Camioneta / Pick-up</option>
                                <option value="Automóvil">Automóvil Liviano</option>
                                <option value="Camión">Camión</option>
                                <option value="Autoelevador">Autoelevador</option>
                                <option value="Maquinaria">Maquinaria Vial</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Marca y Modelo</label>
                            <input type="text" value={form.brandModel} onChange={(e) => setForm({ ...form, brandModel: e.target.value })} style={inputStyle} placeholder="Ej: Toyota Hilux" />
                        </div>
                        <div>
                            <label style={labelStyle}>Kilometraje / Horómetro</label>
                            <input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} style={inputStyle} placeholder="Ej: 120500" />
                        </div>
                        <div>
                            <label style={labelStyle}>Conductor Asignado *</label>
                            <input type="text" value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha de Inspección</label>
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '12px', background: form.status === 'Apto' ? '#f0fdf4' : '#fef2f2', border: `2px solid ${form.status === 'Apto' ? '#bbf7d0' : '#fecaca'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.2rem 0', color: form.status === 'Apto' ? '#166534' : '#991b1b' }}>Estado del Vehículo</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: form.status === 'Apto' ? '#15803d' : '#b91c1c' }}>Basado en el checklist</p>
                        </div>
                        <div style={{ padding: '0.5rem 1.5rem', background: form.status === 'Apto' ? '#16a34a' : '#dc2626', color: 'white', fontWeight: 900, borderRadius: '2rem', fontSize: '1.2rem' }}>
                            {form.status.toUpperCase()}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ClipboardList size={22} /> Checklist Pre-Operacional
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {CHECKLIST_ITEMS.map((item, index) => (
                                <div key={item.id} className="hover-lift" style={{ 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                    padding: '1.2rem 1.5rem', background: 'rgba(255,255,255,0.02)', 
                                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', 
                                    flexWrap: 'wrap', gap: '1rem', transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }}>{item.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                                        <button
                                            type="button"
                                            onClick={() => updateChecklist(item.id, 'ok')}
                                            style={{
                                                padding: '0.6rem 1rem', borderRadius: '8px', border: form.checklist?.[item.id] === 'ok' ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem', flex: '1 1 auto', textAlign: 'center', minWidth: '70px',
                                                background: form.checklist?.[item.id] === 'ok' ? '#10b981' : 'var(--color-surface)',
                                                color: form.checklist?.[item.id] === 'ok' ? 'white' : 'var(--color-text)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            OK
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateChecklist(item.id, 'fail')}
                                            style={{
                                                padding: '0.6rem 1rem', borderRadius: '8px', border: form.checklist?.[item.id] === 'fail' ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem', flex: '1 1 auto', textAlign: 'center', minWidth: '70px',
                                                background: form.checklist?.[item.id] === 'fail' ? '#ef4444' : 'var(--color-surface)',
                                                color: form.checklist?.[item.id] === 'fail' ? 'white' : 'var(--color-text)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            FALLA
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateChecklist(item.id, 'na')}
                                            style={{
                                                padding: '0.6rem 1rem', borderRadius: '8px', border: form.checklist?.[item.id] === 'na' ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem', flex: '1 1 auto', textAlign: 'center', minWidth: '70px',
                                                background: form.checklist?.[item.id] === 'na' ? '#6b7280' : 'var(--color-surface)',
                                                color: form.checklist?.[item.id] === 'na' ? 'white' : 'var(--color-text)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            N/A
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                      <div style={{ marginTop: '2.5rem' }}>
                        <label style={{ ...labelStyle, color: 'var(--color-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <FileText size={20} /> Observaciones Generales / Novedades
                        </label>
                        <textarea 
                            value={form.observations} 
                            onChange={(e) => setForm({ ...form, observations: e.target.value })}
                            style={{ ...inputStyle, minHeight: '140px', resize: 'vertical', fontSize: '1rem', padding: '1.2rem' }}
                            placeholder="Describa cualquier novedad, daño o elemento faltante..."
                        />
                    </div>
                    </div>

                    {/* Firmas y Autorizaciones */}
                    <div style={{ marginTop: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                                <Pencil size={24} color="#38bdf8" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                                Firmas y Autorizaciones del Permiso
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
                                    { id: 'operator', label: 'Conductor', checked: showSignatures.operator },
                                    { id: 'professional', label: 'Especialista H&S', checked: showSignatures.professional },
                                    { id: 'supervisor', label: 'Inspector / Control', checked: showSignatures.supervisor }
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
                                    ...form,
                                    professionalSignature: professional.signature,
                                    professionalName: professional.name,
                                    professionalLicense: professional.license,
                                    professionalStamp: professional.stamp
                                }}
                                box1={showSignatures.operator ? {
                                    title: 'CONDUCTOR ASIGNADO',
                                    subtitle: (form.driver || 'Firma del Conductor').toUpperCase(),
                                    signatureUrl: form.driverSignature || null,
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
                                    title: 'INSPECTOR / CONTROL',
                                    subtitle: (form.inspector || 'Firma del Inspector').toUpperCase(),
                                    signatureUrl: form.supervisorSignature || null,
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
                                        Firma del Conductor
                                    </div>
                                    <SignatureCanvas 
                                        onSave={(sig) => setForm((prev: any) => ({ ...prev, driverSignature: sig || '' }))}
                                        initialImage={form.driverSignature}
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
                                        Firma del Inspector
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
                title="Inspección Vehicular"
                text={`Inspección Vehículo ${form.plate} - Estado: ${form.status}`}
                rawMessage={`Inspección Vehículo ${form.plate} - Estado: ${form.status}`}
                fileName={`Vehiculo_${form.plate || 'Nuevo'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: 0, opacity: 0.01, top: 0 }}>
                <FleetPdfGenerator data={{
                    ...form,
                    professionalSignature: form.professionalSignature || professional.signature,
                    professionalName: form.professionalName || professional.name,
                    professionalLicense: form.professionalLicense || professional.license,
                    professionalStamp: form.professionalStamp || professional.stamp,
                    signatures: {
                        driver: form.driverSignature || form.signatures?.driver || '',
                        inspector: form.supervisorSignature || form.signatures?.inspector || ''
                    }
                }} checklistItems={CHECKLIST_ITEMS} />
            </div>
        </div>
    );
}
