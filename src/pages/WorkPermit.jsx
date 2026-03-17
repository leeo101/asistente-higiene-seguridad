import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Printer,
    ShieldCheck, Building2, User, Calendar,
    CheckCircle2, AlertCircle, HelpCircle, Pencil, Info, Share2,
    Users, Clock, Zap, Flame, HardHat, Construction
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import { permitTypes } from '../data/workPermits';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import CompanyLogo from '../components/CompanyLogo';

export default function WorkPermit() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();
    useDocumentTitle('Permiso de Trabajo');

    // Default state
    const [formData, setFormData] = useState(() => ({
        id: null,
        numeroPermiso: '',
        empresa: '',
        obra: '',
        fecha: new Date().toISOString().split('T')[0],
        tipoPermiso: permitTypes[0].id,
        validezDesde: '08:00',
        validezHasta: '18:00',
        checklist: permitTypes[0].questions.map((q, i) => ({ id: Date.now() + i, pregunta: q, estado: 'Cumple', observaciones: '' })),
        personal: [
            { id: 1, nombre: '', dni: '', firma: true }
        ],
        eppRequeridos: ['Casco', 'Calzado de Seguridad', 'Guantes', 'Anteojos'],
        observacionesGenerales: ''
    }));

    const [professional, setProfessional] = useState({
        name: 'Profesional',
        license: '',
        signature: null
    });

    const [showSignatures, setShowSignatures] = useState({
        supervisor: true,
        professional: true
    });

    const [showShare, setShowShare] = useState(false);

    // Load data for editing
    useEffect(() => {
        if (location.state?.editData) {
            setFormData(location.state.editData);
        }
    }, [location.state]);

    // Load professional data
    useEffect(() => {
        const savedData = localStorage.getItem('personalData');
        const savedSigData = localStorage.getItem('signatureStampData');
        if (savedData) {
            const data = JSON.parse(savedData);
            let signature = null;
            if (savedSigData) {
                signature = JSON.parse(savedSigData).signature;
            }
            setProfessional({
                name: data.name || 'Profesional',
                license: data.license || '',
                signature: signature
            });
        }
    }, []);

    const handleTypeChange = (typeId) => {
        const selectedType = permitTypes.find(t => t.id === typeId);
        if (selectedType) {
            setFormData({
                ...formData,
                tipoPermiso: typeId,
                checklist: selectedType.questions.map((q, i) => ({ id: Date.now() + i, pregunta: q, estado: 'Cumple', observaciones: '' }))
            });
        }
    };

    const updateChecklist = (id, field, value) => {
        const newList = formData.checklist.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        setFormData({ ...formData, checklist: newList });
    };

    const addChecklistItem = () => {
        const newItem = {
            id: Date.now(),
            pregunta: '',
            estado: 'Cumple',
            observaciones: ''
        };
        setFormData({
            ...formData,
            checklist: [...formData.checklist, newItem]
        });
    };

    const removeChecklistItem = (id) => {
        setFormData({
            ...formData,
            checklist: formData.checklist.filter(item => item.id !== id)
        });
    };

    const addPersonnel = () => {
        const newId = Math.max(0, ...formData.personal.map(p => p.id)) + 1;
        setFormData({
            ...formData,
            personal: [...formData.personal, { id: newId, nombre: '', dni: '', firma: true }]
        });
    };

    const removePersonnel = (id) => {
        if (formData.personal.length > 1) {
            setFormData({
                ...formData,
                personal: formData.personal.filter(p => p.id !== id)
            });
        }
    };

    const updatePersonnel = (id, field, value) => {
        setFormData({
            ...formData,
            personal: formData.personal.map(p => p.id === id ? { ...p, [field]: value } : p)
        });
    };

    const handleSave = async () => {
        requirePro(async () => {
            if (!formData.empresa) {
                toast.error('Por favor complete el nombre de la empresa');
                return;
            }
            const historyRaw = localStorage.getItem('work_permits_history');
            const history = historyRaw ? JSON.parse(historyRaw) : [];
            const entryId = formData.id || Date.now().toString();

            const newEntry = {
                ...formData,
                id: entryId,
                professionalName: professional.name,
                professionalLicense: professional.license,
                professionalSignature: professional.signature,
                createdAt: formData.createdAt || new Date().toISOString()
            };

            let updated;
            if (formData.id) {
                updated = history.map(h => h.id === entryId ? newEntry : h);
            } else {
                updated = [newEntry, ...history];
            }

            localStorage.setItem('work_permits_history', JSON.stringify(updated));
            await syncCollection('work_permits_history', updated);
            toast.success('Permiso de Trabajo guardado con éxito');
            navigate('/work-permit-history');
        });
    };

    const handlePrint = () => requirePro(() => window.print());
    const handleShare = () => requirePro(() => setShowShare(true));

    const selectedTypeLabel = permitTypes.find(t => t.id === formData.tipoPermiso)?.label || 'Permiso de Trabajo';

    return (
        <div className="container" style={{ maxWidth: '1000px', paddingBottom: '8rem' }}>
            <ShareModal
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Permiso de Trabajo – ${formData.empresa}`}
                text={`📄 Permiso de Trabajo: ${selectedTypeLabel}\n🏗️ Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⏰ Validez: ${formData.validezDesde} a ${formData.validezHasta}\n\nGenerado con Asistente HYS`}
                elementIdToPrint="pdf-content"
            />

            {/* Action Bar */}
            <div className="no-print floating-action-bar">
                <button onClick={handleSave} className="btn-floating-action" style={{ background: '#36B37E', color: '#ffffff' }}>
                    <Save size={18} /> GUARDAR
                </button>
                <button onClick={handleShare} className="btn-floating-action" style={{ background: '#0052CC', color: '#ffffff' }}>
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button onClick={handlePrint} className="btn-floating-action" style={{ background: '#FF8B00', color: '#ffffff' }}>
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>

            <div className="no-print" style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: 'var(--color-surface)',
                borderRadius: '20px',
                border: '1px solid #EBECF0',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1.5rem',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'var(--color-background)', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>Permisos de Trabajo</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Gestión de Riesgos Especiales</p>
                    </div>
                </div>
            </div>

            {/* Print Area */}
            <div id="pdf-content" className="bg-white text-black p-6 sm:p-10 shadow-xl mx-auto print-area border border-slate-200 rounded-2xl print:shadow-none print:border-none" style={{ width: '100%', boxSizing: 'border-box' }}>

                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', borderBottom: '4px solid #333', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e293b' }}>Control H&S</p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1.2 }}>
                            Permiso de Trabajo
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{selectedTypeLabel}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                             <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#999' }}>N° PERMISO</span>
                             <span style={{ fontSize: '1rem', fontWeight: 900 }}>{formData.numeroPermiso || '____'}</span>
                        </div>
                        <CompanyLogo style={{ height: '40px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} />
                    </div>
                </div>

                {/* Form Grid */}
                <div style={{ border: '2px solid #ddd', borderRadius: '10px', overflow: 'hidden', marginBottom: '2rem' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2">
                        <DocBox label="CLIENTE / EMPRESA" value={formData.empresa} onChange={v => setFormData({ ...formData, empresa: v })} />
                        <DocBox label="OBRA / UBICACIÓN" value={formData.obra} onChange={v => setFormData({ ...formData, obra: v })} borderLeft />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4">
                        <DocBox label="FECHA" value={formData.fecha} onChange={v => setFormData({ ...formData, fecha: v })} type="date" borderTop />
                        <DocBox label="HORA INICIO" value={formData.validezDesde} onChange={v => setFormData({ ...formData, validezDesde: v })} type="time" borderLeft borderTop />
                        <DocBox label="HORA FIN" value={formData.validezHasta} onChange={v => setFormData({ ...formData, validezHasta: v })} type="time" borderLeft borderTop />
                        <DocBox label="TIPO DE TRABAJO" borderLeft borderTop noInput>
                            <select
                                value={formData.tipoPermiso}
                                onChange={e => handleTypeChange(e.target.value)}
                                className="no-print"
                                style={{ border: 'none', background: 'transparent', fontWeight: 800, width: '100%', outline: 'none' }}
                            >
                                {permitTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                            <div className="print-only" style={{ fontWeight: 800 }}>{selectedTypeLabel}</div>
                        </DocBox>
                    </div>
                </div>

                {/* Checklist Section */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={20} /> VERIFICACIÓN PREVENTIVA (CHECKLIST)
                        </h3>
                        <button className="no-print" onClick={addChecklistItem} style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>
                            + AGREGAR PREGUNTA
                        </button>
                    </div>
                    <div style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1.5fr 40px', background: 'var(--color-background)', padding: '0.6rem 1rem', borderBottom: '2px solid #ddd', fontWeight: 800, fontSize: '0.7rem', color: '#666' }} className="hidden sm:grid">
                            <div>PREGUNTA / ITEM</div>
                            <div style={{ textAlign: 'center' }}>ESTADO</div>
                            <div>OBSERVACIONES</div>
                            <div className="no-print"></div>
                        </div>
                        {formData.checklist.map((item, idx) => (
                            <div key={item.id} style={{ padding: '1rem', borderBottom: '1px solid #f0f0f0', background: idx % 2 === 0 ? '#fafafa' : 'var(--color-surface)' }} className="grid grid-cols-1 sm:grid-cols-[2fr_100px_1.5fr_40px] gap-4 sm:gap-4 items-center">
                                <div className="flex flex-col sm:block">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase mb-1">Item/Pregunta:</span>
                                    <input
                                        type="text"
                                        value={item.pregunta}
                                        onChange={e => updateChecklist(item.id, 'pregunta', e.target.value)}
                                        style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                                        placeholder="Descripción de la tarea o riesgo..."
                                    />
                                </div>
                                <div className="flex items-center justify-between sm:justify-center">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase">Estado:</span>
                                    <div className="no-print" style={{ display: 'flex', gap: '5px' }}>
                                        <StatusBtn active={item.estado === 'Cumple'} onClick={() => updateChecklist(item.id, 'estado', 'Cumple')} label="SI" />
                                        <StatusBtn active={item.estado === 'No Cumple'} onClick={() => updateChecklist(item.id, 'estado', 'No Cumple')} label="NO" color="#FF4D4F" />
                                    </div>
                                    <div className="print-only" style={{ fontWeight: 900, color: item.estado === 'No Cumple' ? '#FF4D4F' : 'inherit' }}>{item.estado === 'Cumple' ? 'SI' : 'NO'}</div>
                                </div>
                                <div className="flex flex-col sm:block">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase mb-1">Observaciones:</span>
                                    <input
                                        type="text"
                                        value={item.observaciones}
                                        onChange={e => updateChecklist(item.id, 'observaciones', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #eee', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.8rem' }}
                                        placeholder="Detalle / Sector..."
                                    />
                                </div>
                                <div className="no-print text-right">
                                    <button onClick={() => removeChecklistItem(item.id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Personnel Section */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={20} /> PERSONAL AUTORIZADO
                        </h3>
                        <button className="no-print" onClick={addPersonnel} style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>
                            + AGREGAR PERSONAL
                        </button>
                    </div>
                    <div style={{ border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', background: 'var(--color-background)', padding: '0.6rem 1rem', borderBottom: '2px solid #ddd', fontWeight: 800, fontSize: '0.7rem', color: '#666' }} className="hidden sm:grid">
                            <div>NOMBRE Y APELLIDO</div>
                            <div>DNI</div>
                            <div>FIRMA</div>
                            <div></div>
                        </div>
                        {formData.personal.map((p, idx) => (
                            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', padding: '1rem', borderBottom: '1px solid #eee' }} className="sm:grid sm:grid-cols-[2fr_1fr_1fr_40px] sm:items-center">
                                <div className="flex flex-col sm:block">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase mb-1">Nombre:</span>
                                    <input
                                        type="text"
                                        value={p.nombre}
                                        placeholder="Nombre Completo"
                                        onChange={e => updatePersonnel(p.id, 'nombre', e.target.value)}
                                        style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontWeight: 600 }}
                                    />
                                </div>
                                <div className="flex flex-col sm:block">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase mb-1">DNI:</span>
                                    <input
                                        type="text"
                                        value={p.dni}
                                        placeholder="DNI"
                                        onChange={e => updatePersonnel(p.id, 'dni', e.target.value)}
                                        style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase">Firma:</span>
                                    <div style={{ width: '100%', height: '1px', background: '#ccc' }} className="hidden sm:block"></div>
                                </div>
                                <button className="no-print" onClick={() => removePersonnel(p.id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', textAlign: 'right' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Signatures */}
                <div style={{ marginTop: '3rem' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-10 print:gap-6">
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ height: '60px' }}></div>
                            <div style={{ borderTop: '2px solid #333', paddingTop: '10px' }}>
                                <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem' }}>SUPERVISOR / RESPONSABLE</p>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: '#666' }}>Aclaración y Firma</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {professional.signature && <img src={professional.signature} alt="Firma" style={{ height: '100%', objectFit: 'contain' }} />}
                            </div>
                            <div style={{ borderTop: '2px solid #333', paddingTop: '10px' }}>
                                <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem' }}>{professional.name.toUpperCase()}</p>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: '#666' }}>Mat.: {professional.license}</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }} className="hidden sm:block print:block">
                            <div style={{ height: '60px' }}></div>
                            <div style={{ borderTop: '2px solid #333', paddingTop: '10px' }}>
                                <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem' }}>FECHA DE CIERRE</p>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: '#666' }}>Sello y Firma receptora</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div style={{ marginTop: '3rem', fontSize: '0.65rem', color: '#666', fontStyle: 'italic', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    * El presente permiso tiene validez únicamente por la jornada laboral y tareas especificadas.
                    En caso de cambios en las condiciones o personal, se deberá emitir un nuevo permiso.
                </div>
            </div>
        </div>
    );
}

function StatusBtn({ active, onClick, label, color = '#36B37E' }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                background: active ? color : 'var(--color-surface)',
                color: active ? 'white' : '#666',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer'
            }}
        >
            {label}
        </button>
    );
}

function DocBox({ label, value, onChange, type = "text", borderLeft, borderTop, noInput, children }) {
    return (
        <div style={{
            padding: '1rem',
            borderLeft: borderLeft ? '2px solid #ddd' : 'none',
            borderTop: borderTop ? '2px solid #ddd' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#999', textTransform: 'uppercase' }}>{label}</span>
            {noInput ? children : (
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.9rem', outline: 'none', width: '100%' }}
                />
            )}
        </div>
    );
}
