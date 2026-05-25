import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, Save, FileText, AlertCircle, GraduationCap, ClipboardCheck, Package, Plus, Trash2, History, Share2, Printer, Clock, Edit2, CheckCircle2 } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import PhotoAttachments from '../components/PhotoAttachments';
import CompanyLogo from '../components/CompanyLogo';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';

export default function Reports(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { syncCollection } = useSync();
    const [template, setTemplate] = useState('general'); // general, accident, training, rgrl, epp
    const [projectData, setProjectData] = useState<{
        id?: number | string;
        title: string;
        company: string;
        location: string;
        date: string;
        responsable: string;
    }>({
        title: '',
        company: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        responsable: ''
    });

    const [content, setContent] = useState('');
    const [recentReports, setRecentReports] = useState([]);
    const [photos, setPhotos] = useState([]);

    // Template specific fields
    const [extraFields, setExtraFields] = useState<Record<string, any>>({});
    const [personnel, setPersonnel] = useState(() => [{ id: Date.now(), name: '', dni: '' }]);

    // Signature states
    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });
    const [operatorSignature, setOperatorSignature] = useState('');
    const [signature, setSignature] = useState('');
    const [supervisorSignature, setSupervisorSignature] = useState('');
    const [professional, setProfessional] = useState({ name: '', license: '', signature: null as string | null, stamp: null as string | null });

    useEffect(() => {
        if (location.state?.editData) {
            const data = location.state.editData;
            setTemplate(data.template || 'general');
            setProjectData({
                id: data.id,
                title: data.title || '',
                company: data.company || '',
                location: data.location || '',
                date: data.date || new Date().toISOString().split('T')[0],
                responsable: data.responsable || ''
            });
            setContent(data.content || '');
            setExtraFields(data.extraFields || {});
            setPhotos(data.photos || []);
            if (data.personnel && data.personnel.length > 0) {
                setPersonnel(data.personnel);
            }
            if (data.showSignatures) setShowSignatures(data.showSignatures);
            setOperatorSignature(data.operatorSignature || '');
            setSignature(data.signature || '');
            setSupervisorSignature(data.supervisorSignature || '');
        } else {
            const savedProfile = localStorage.getItem('personalData');
            if (savedProfile) {
                const parsed = JSON.parse(savedProfile);
                setProjectData(prev => ({ ...prev, responsable: parsed.name || '' }));
                
                const sd = localStorage.getItem('signatureStampData');
                const lg = localStorage.getItem('capturedSignature');
                let sig = lg || null;
                let stamp = null;
                if (sd) { const p = JSON.parse(sd); sig = p.signature || sig; stamp = p.stamp || null; }
                setProfessional({ name: parsed.name, license: parsed.license, signature: sig, stamp });
            }
        }
        // Load recent reports
        const hist = JSON.parse(localStorage.getItem('reports_history') || '[]');
        setRecentReports(hist.slice(0, 3));
    }, [location.state]);

    const handleAddPerson = () => {
        setPersonnel([...personnel, { id: Date.now(), name: '', dni: '' }]);
    };

    const handleRemovePerson = (id) => {
        if (personnel.length > 1) {
            setPersonnel(personnel.filter(p => p.id !== id));
        }
    };

    const handlePersonChange = (id, field, value) => {
        setPersonnel(personnel.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSave = async () => {
        if (!projectData.title || !projectData.company) {
            toast.error('Por favor, complete al menos el título y la empresa.');
            return;
        }

        const entryId = projectData.id || Date.now();
        const newReport = {
            id: entryId,
            template,
            ...projectData,
            content,
            extraFields,
            photos,
            personnel: (template === 'training' || template === 'epp') ? personnel : [],
            createdAt: new Date().toISOString(),
            showSignatures,
            operatorSignature,
            signature,
            supervisorSignature
        };

        const history = JSON.parse(localStorage.getItem('reports_history') || '[]');
        let updated;
        if (projectData.id) {
            updated = history.map(h => h.id === entryId ? newReport : h);
        } else {
            updated = [newReport, ...history];
        }

        await syncCollection('reports_history', updated);
        localStorage.setItem('current_report', JSON.stringify(newReport));
        navigate('/reports-report');
    };

    const templates = [
        { id: 'general', label: 'Informe Técnico', icon: <FileText /> },
        { id: 'accident', label: 'Accidente', icon: <AlertCircle /> },
        { id: 'training', label: 'Capacitación', icon: <GraduationCap /> },
        { id: 'rgrl', label: 'RGRL', icon: <ClipboardCheck /> },
        { id: 'epp', label: 'Entrega EPP', icon: <Package /> }
    ];

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Generar Informe</h1>
                </div>
                <CompanyLogo style={{ height: '32px', width: 'auto', maxWidth: '80px', objectFit: 'contain' }} />
                <button
                    onClick={() => navigate('/history')}
                    className="btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                >
                    <History size={18} /> Historial
                </button>
            </div>

            {/* Template Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.8rem', marginBottom: '2.5rem' }}>
                {templates.map(t => (
                    <div
                        key={t.id}
                        onClick={() => {
                            setTemplate(t.id);
                            if ((t.id === 'training' || t.id === 'epp') && personnel.length === 0) {
                                setPersonnel([{ id: Date.now(), name: '', dni: '' }]);
                            }
                        }}
                        className="card"
                        style={{
                            textAlign: 'center',
                            padding: '1.5rem 1rem',
                            cursor: 'pointer',
                            border: template === t.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: template === t.id ? 'rgba(59, 130, 246, 0.05)' : 'var(--color-surface)',
                            transition: 'all 0.3s ease',
                            transform: template === t.id ? 'translateY(-3px)' : 'none',
                            boxShadow: template === t.id ? '0 10px 20px -5px rgba(59, 130, 246, 0.15)' : 'none',
                            borderRadius: '16px'
                        }}
                    >
                        <div style={{ color: template === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)', marginBottom: '0.8rem', display: 'flex', justifyContent: 'center' }}>
                            {React.cloneElement(t.icon, { size: 32 })}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: template === t.id ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{t.label}</div>
                    </div>
                ))}
            </div>

            {/* General Info */}
            <div className="card" style={{ marginBottom: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', padding: '1.8rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block' }}>Título del Informe</label>
                    <input
                        type="text"
                        value={projectData.title}
                        onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                        placeholder="Ej: Relevamiento de Condiciones de Seguridad"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block' }}>Empresa / Cliente</label>
                    <input
                        type="text"
                        value={projectData.company}
                        onChange={(e) => setProjectData({ ...projectData, company: e.target.value })}
                        placeholder="Nombre de la empresa"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block' }}>Ubicación / Planta</label>
                    <input
                        type="text"
                        value={projectData.location}
                        onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
                        placeholder="Ej: Sede Central"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block' }}>Fecha</label>
                    <input
                        type="date"
                        value={projectData.date}
                        onChange={(e) => setProjectData({ ...projectData, date: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block' }}>Responsable</label>
                    <input
                        type="text"
                        value={projectData.responsable}
                        onChange={(e) => setProjectData({ ...projectData, responsable: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
                    />
                </div>
            </div>

            {/* Template Content */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Desarrollo del Informe</h3>

                {template === 'training' && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Tema de la Capacitación</label>
                            <input
                                type="text"
                                placeholder="Ej: Uso de Extintores, RCP, etc."
                                value={extraFields.topic || ''}
                                onChange={(e) => setExtraFields({ ...extraFields, topic: e.target.value })}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Duración (minutos)</label>
                            <input
                                type="number"
                                value={extraFields.duration || ''}
                                onChange={(e) => setExtraFields({ ...extraFields, duration: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {template === 'accident' && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Hora del Evento</label>
                                <input
                                    type="time"
                                    value={extraFields.eventTime || ''}
                                    onChange={(e) => setExtraFields({ ...extraFields, eventTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Persona Afectada</label>
                                <input
                                    type="text"
                                    value={extraFields.affectedPerson || ''}
                                    onChange={(e) => setExtraFields({ ...extraFields, affectedPerson: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {(template === 'training' || template === 'epp') && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Personal Interviniente / Receptores</label>
                            <button
                                onClick={handleAddPerson}
                                className="btn-outline"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                <Plus size={14} /> Añadir Persona
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {personnel.map((p, index) => (
                                <div key={p.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ flex: 2 }}>
                                        <input
                                            type="text"
                                            placeholder="Nombre completo"
                                            style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                                            value={p.name}
                                            onChange={(e) => handlePersonChange(p.id, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="text"
                                            placeholder="DNI/CUIL"
                                            style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                                            value={p.dni}
                                            onChange={(e) => handlePersonChange(p.id, 'dni', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleRemovePerson(p.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                        disabled={personnel.length === 1}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block' }}>Contenido Principal / Observaciones</label>
                <textarea
                    style={{ minHeight: '350px', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '0.95rem', width: '100%', resize: 'vertical' }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describa los hallazgos, recomendaciones o el cuerpo del informe..."
                />

                <div style={{ marginTop: '2rem' }}>
                    <PhotoAttachments
                        photos={photos}
                        onChange={setPhotos}
                        maxPhotos={8}
                        label="Fotos de Evidencia"
                    />
                </div>
            </div>

            {/* Interactive Signature Drawing Pads */}
            <div className="card animate-fade-in" style={{ marginTop: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                    ✍️ Firmas y Autorizaciones
                </h3>

                {/* Custom visual switches */}
                <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {[
                            { id: 'operator', label: 'Operador / Empleado' },
                            { id: 'supervisor', label: 'Supervisor / Responsable' },
                            { id: 'professional', label: 'Profesional HYS' }
                        ].map(sig => {
                            const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                            return (
                                <label
                                    key={sig.id}
                                    className="flex items-center gap-2 cursor-pointer select-none"
                                    style={{
                                        padding: '0.55rem 1.1rem',
                                        borderRadius: 'var(--radius-full)',
                                        border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                                        color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',
                                        fontWeight: 750,
                                        fontSize: '0.8rem',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={e => setShowSignatures(s => ({ ...s, [sig.id]: e.target.checked }))}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '4px',
                                        border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                                        background: isChecked ? 'var(--color-primary)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        {isChecked && <CheckCircle2 size={12} color="white" />}
                                    </div>
                                    {sig.label}
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* On-Sheet Visual Preview of PDF signature blocks */}
                <PdfSignatures
                    data={{
                        ...projectData,
                        professionalSignature: professional.signature,
                        professionalName: professional.name,
                        professionalLicense: professional.license
                    }}
                    box1={showSignatures.operator ? {
                        title: 'OPERADOR',
                        subtitle: 'Firma / Aclaración',
                        signatureUrl: operatorSignature || null,
                        isProfessional: false
                    } : null}
                    box2={showSignatures.supervisor ? {
                        title: 'SUPERVISOR',
                        subtitle: 'Firma / Aclaración',
                        signatureUrl: supervisorSignature || null,
                        isProfessional: false
                    } : null}
                    box3={showSignatures.professional ? {
                        title: 'PROFESIONAL ACTUANTE',
                        subtitle: (professional.name || 'Firma y Sello').toUpperCase(),
                        signatureUrl: signature || professional.signature || null,
                        isProfessional: true,
                        license: professional.license
                    } : null}
                />

                {/* Interactive Signature Drawing Pads */}
                <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {showSignatures.operator && (
                        <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <SignatureCanvas 
                                onSave={(sig) => setOperatorSignature(sig || '')} 
                                initialImage={operatorSignature} 
                                title="Firma Operador" 
                            />
                        </div>
                    )}
                    {showSignatures.supervisor && (
                        <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <SignatureCanvas 
                                onSave={(sig) => setSupervisorSignature(sig || '')} 
                                initialImage={supervisorSignature} 
                                title="Firma Supervisor" 
                            />
                        </div>
                    )}
                    {showSignatures.professional && (
                        <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                            <SignatureCanvas 
                                onSave={(sig) => setSignature(sig || '')} 
                                initialImage={signature} 
                                title="Firma Profesional" 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Reports Mini-Panel */}
            {recentReports.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} color="var(--color-primary)" /> Informes Recientes
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {recentReports.map((r) => (
                            <div key={r.id} style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                borderRadius: '12px', padding: '0.8rem 1rem', transition: 'border-color 0.2s'
                            }}
                                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title || 'Sin título'}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.6rem', marginTop: '0.15rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--color-primary)', padding: '0.1rem 0.5rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.65rem' }}>{r.template?.toUpperCase() || 'GENERAL'}</span>
                                        {r.company} · {new Date(r.createdAt).toLocaleDateString('es-AR')}
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/reports', { state: { editData: r } })}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                                        borderRadius: '8px', padding: '0.4rem 0.8rem',
                                        color: 'var(--color-primary)', cursor: 'pointer',
                                        fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0
                                    }}
                                >
                                    <Edit2 size={13} /> Editar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                <button
                    onClick={handleSave}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: 'white' }}
                >
                    <Save size={18} /> GENERAR INFORME
                </button>
                <button
                    onClick={() => toast.error('Selecciona "Generar Informe" primero para poder compartirlo.')}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: 'white' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => toast.error('Selecciona "Generar Informe" primero para poder imprimirlo.')}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: 'white' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>
        </div>
    );
}
