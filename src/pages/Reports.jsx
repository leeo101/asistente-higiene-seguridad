import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText, AlertCircle, GraduationCap, ClipboardCheck, Package, Plus, Trash2, History } from 'lucide-react';

export default function Reports() {
    const navigate = useNavigate();
    const [template, setTemplate] = useState('general'); // general, accident, training, rgrl, epp
    const [projectData, setProjectData] = useState({
        title: '',
        company: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        responsable: ''
    });

    const [content, setContent] = useState('');

    // Template specific fields
    const [extraFields, setExtraFields] = useState({});
    const [personnel, setPersonnel] = useState([{ id: Date.now(), name: '', dni: '' }]);

    useEffect(() => {
        const savedProfile = localStorage.getItem('personalData');
        if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            setProjectData(prev => ({ ...prev, responsable: parsed.name || '' }));
        }
    }, []);

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

    const handleSave = () => {
        if (!projectData.title || !projectData.company) {
            alert('Por favor, complete al menos el título y la empresa.');
            return;
        }

        const newReport = {
            id: Date.now(),
            template,
            ...projectData,
            content,
            extraFields,
            personnel: (template === 'training' || template === 'epp') ? personnel : [],
            createdAt: new Date().toISOString()
        };

        const history = JSON.parse(localStorage.getItem('reports_history') || '[]');
        localStorage.setItem('reports_history', JSON.stringify([newReport, ...history]));
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
                <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Generar Informe</h1>
                </div>
                <button
                    onClick={() => navigate('/history')}
                    className="btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                >
                    <History size={18} /> Historial
                </button>
            </div>

            {/* Template Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.8rem', marginBottom: '2rem' }}>
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
                            padding: '1rem',
                            cursor: 'pointer',
                            border: template === t.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: template === t.id ? 'rgba(59, 130, 246, 0.05)' : 'var(--color-surface)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ color: template === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            {React.cloneElement(t.icon, { size: 28 })}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.label}</div>
                    </div>
                ))}
            </div>

            {/* General Info */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Título del Informe</label>
                    <input
                        type="text"
                        value={projectData.title}
                        onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                        placeholder="Ej: Relevamiento de Condiciones de Seguridad"
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Empresa / Cliente</label>
                    <input
                        type="text"
                        value={projectData.company}
                        onChange={(e) => setProjectData({ ...projectData, company: e.target.value })}
                        placeholder="Nombre de la empresa"
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Ubicación / Planta</label>
                    <input
                        type="text"
                        value={projectData.location}
                        onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
                        placeholder="Ej: Sede Central"
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Fecha</label>
                    <input
                        type="date"
                        value={projectData.date}
                        onChange={(e) => setProjectData({ ...projectData, date: e.target.value })}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Responsable</label>
                    <input
                        type="text"
                        value={projectData.responsable}
                        onChange={(e) => setProjectData({ ...projectData, responsable: e.target.value })}
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

                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Contenido Principal / Observaciones</label>
                <textarea
                    style={{ minHeight: '300px', padding: '1rem' }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describa los hallazgos, recomendaciones o el cuerpo del informe..."
                />
            </div>

            <button
                onClick={handleSave}
                className="btn-primary"
                style={{ width: '100%', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
            >
                <Save size={20} /> Generar Informe Final
            </button>
        </div>
    );
}
