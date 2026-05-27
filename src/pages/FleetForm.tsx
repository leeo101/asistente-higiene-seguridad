import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, CarFront, AlertTriangle, ShieldCheck, Printer, Share2, ClipboardList, Wrench, FileText, Pencil } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import FleetPdfGenerator from '../components/FleetPdfGenerator';

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
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const { isPro, requirePro } = usePaywall();

    useDocumentTitle(isEdit ? 'Editar Inspección de Vehículo' : 'Nueva Inspección de Vehículo');
    
    // Initialize checklist state with "ok" (others: "fail", "na")
    const initialChecklist = CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 'ok' }), {});

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
        navigate('/fleet-history');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem', paddingTop: isMobile ? '7.5rem' : '6.5rem' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: isMobile ? '6.5rem' : '5.5rem',
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
                        <CarFront size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        {isEdit ? 'Editar Inspección Pre-Operacional' : 'Inspección Pre-Operacional Vehicular'}
                    </h1>
                </div>
            </div>

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
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
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {CHECKLIST_ITEMS.map((item, index) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ flex: '1 1 200px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.label}</span>
                                    </div>
                                    <div className="checklist-status-buttons" style={{ minWidth: '180px' }}>
                                        <button
                                            type="button"
                                            onClick={() => updateChecklist(item.id, 'ok')}
                                            className={`status-btn ${form.checklist?.[item.id] === 'ok' ? 'active-ok' : ''}`}
                                        >
                                            OK
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateChecklist(item.id, 'fail')}
                                            className={`status-btn ${form.checklist?.[item.id] === 'fail' ? 'active-fail' : ''}`}
                                        >
                                            FALLA
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateChecklist(item.id, 'na')}
                                            className={`status-btn ${form.checklist?.[item.id] === 'na' ? 'active-na' : ''}`}
                                        >
                                            N/A
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Observaciones Generales / Novedades</label>
                        <textarea 
                            value={form.observations} 
                            onChange={(e) => setForm({ ...form, observations: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '100px' }} 
                            placeholder="Ej: Rayón en guardabarros derecho. Próximo service en 1000 km..."
                        />
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
