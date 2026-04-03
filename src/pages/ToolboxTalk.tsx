import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare, Plus, Trash2, Save, Share2, Printer,
    Users, Calendar, User, Building2, FileText, ChevronDown,
    CheckCircle2, Clock, Search, Eye, Edit3, History
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import ShareModal from '../components/ShareModal';
import Breadcrumbs from '../components/Breadcrumbs';
import CompanyLogo from '../components/CompanyLogo';
import ToolboxTalkPdfGenerator from '../components/ToolboxTalkPdfGenerator';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'ehs_toolbox_talks';

const TOPICS_TEMPLATES = [
    { icon: '🦺', label: 'Uso correcto de EPP' },
    { icon: '🧹', label: 'Orden y limpieza en el lugar de trabajo' },
    { icon: '⚡', label: 'Riesgos eléctricos' },
    { icon: '🔥', label: 'Prevención y control de incendios' },
    { icon: '🚧', label: 'Trabajos en altura' },
    { icon: '🧰', label: 'Uso seguro de herramientas' },
    { icon: '🚗', label: 'Seguridad vial y manejo defensivo' },
    { icon: '🧪', label: 'Manejo de sustancias peligrosas' },
    { icon: '💪', label: 'Ergonomía y manejo manual de cargas' },
    { icon: '🆘', label: 'Plan de emergencia y evacuación' },
    { icon: '👷', label: 'Señalización de seguridad' },
    { icon: '🤝', label: 'Reporte de incidentes y casi accidentes' },
    { icon: '☀️', label: 'Estrés térmico y golpe de calor' },
    { icon: '🔒', label: 'LOTO - Bloqueo y etiquetado' },
    { icon: '🏗️', label: 'Espacios confinados' },
];

interface Attendee {
    id: string;
    nombre: string;
    dni: string;
    firma: boolean;
}

interface ToolboxTalk {
    id: string;
    fecha: string;
    empresa: string;
    area: string;
    responsable: string;
    cargoResponsable: string;
    tema: string;
    desarrollo: string;
    observaciones: string;
    asistentes: Attendee[];
    createdAt: string;
}

const emptyTalk = (): ToolboxTalk => ({
    id: '',
    fecha: new Date().toISOString().split('T')[0],
    empresa: '',
    area: '',
    responsable: '',
    cargoResponsable: '',
    tema: '',
    desarrollo: '',
    observaciones: '',
    asistentes: [{ id: `att-${Date.now()}`, nombre: '', dni: '', firma: false }],
    createdAt: ''
});

const printStyles = `
@media print {
    .no-print { display: none !important; }
    .print-area { 
        display: block !important; 
        width: 100% !important; 
        position: static !important;
        background: white !important; 
        color: black !important;
        opacity: 1 !important;
        visibility: visible !important;
    }
    .print-area * { color: black !important; }
    body { background: white !important; color: black !important; }
    @page { size: A4 portrait; margin: 10mm; }
}
`;

export default function ToolboxTalk(): React.ReactElement {
    useDocumentTitle('Charla de 5 Minutos');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();

    const [talks, setTalks] = useState<ToolboxTalk[]>([]);
    const [form, setForm] = useState<ToolboxTalk>(emptyTalk());
    const [showShare, setShowShare] = useState(false);
    const [showTopics, setShowTopics] = useState(false);
    const [view, setView] = useState<'form' | 'history'>('form');
    const [searchTerm, setSearchTerm] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [professional, setProfessional] = useState({ name: '', license: '', signature: null as string | null, stamp: null as string | null });

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setTalks(JSON.parse(raw));

        // Load professional data
        try {
            const pd = localStorage.getItem('personalData');
            const sd = localStorage.getItem('signatureStampData');
            const lg = localStorage.getItem('capturedSignature');
            let sig = lg || null;
            let stamp = null as string | null;
            if (sd) { const p = JSON.parse(sd); sig = p.signature || sig; stamp = p.stamp || null; }
            const name = pd ? JSON.parse(pd).name || '' : '';
            const license = pd ? JSON.parse(pd).license || '' : '';
            setProfessional({ name, license, signature: sig, stamp });
        } catch { }
    }, []);

    const save = (data: ToolboxTalk[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setTalks(data);
    };

    const handleSave = () => {
        requirePro(() => {
            if (!form.tema.trim() || !form.responsable.trim()) {
                toast.error('Completá el tema y el responsable');
                return;
            }
            const entry: ToolboxTalk = {
                ...form,
                id: editId || `talk-${Date.now()}`,
                createdAt: form.createdAt || new Date().toISOString()
            };
            let updated: ToolboxTalk[];
            if (editId) {
                updated = talks.map(t => t.id === editId ? entry : t);
                toast.success('Charla actualizada ✅');
            } else {
                updated = [entry, ...talks];
                toast.success('Charla de 5 minutos guardada 📋');
            }
            save(updated);
            setEditId(null);
            setForm(emptyTalk());
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm('¿Eliminar esta charla?')) return;
        save(talks.filter(t => t.id !== id));
    };

    const handleEdit = (talk: ToolboxTalk) => {
        setForm(talk);
        setEditId(talk.id);
        setView('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const addAttendee = () => {
        setForm(f => ({
            ...f,
            asistentes: [...f.asistentes, { id: `att-${Date.now()}`, nombre: '', dni: '', firma: false }]
        }));
    };

    const removeAttendee = (id: string) => {
        setForm(f => ({ ...f, asistentes: f.asistentes.filter(a => a.id !== id) }));
    };

    const updateAttendee = (id: string, field: keyof Attendee, value: any) => {
        setForm(f => ({ ...f, asistentes: f.asistentes.map(a => a.id === id ? { ...a, [field]: value } : a) }));
    };

    const filteredTalks = talks.filter(t =>
        t.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.responsable.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.75rem', borderRadius: 12,
        border: '1.5px solid var(--color-border)', background: 'var(--color-background)',
        color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box'
    };
    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '0.75rem', fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'var(--color-text-muted)', marginBottom: '0.4rem'
    };

    return (
        <>
            <style>{printStyles}</style>
            <div className="container no-print" style={{ paddingTop: '6rem', paddingBottom: '6rem', maxWidth: 900 }}>
                <Breadcrumbs />

                <ShareModal
                    isOpen={showShare}
                    open={showShare}
                    onClose={() => setShowShare(false)}
                    title={`Charla de 5 Minutos — ${form.tema}`}
                    text={`📋 Charla de 5 Minutos\n📅 Fecha: ${form.fecha}\n👷 Responsable: ${form.responsable}\n🏢 Área: ${form.area}\n📌 Tema: ${form.tema}\n👥 Asistentes: ${form.asistentes.filter(a => a.nombre).length}`}
                    rawMessage={`📋 Charla de 5 Minutos\n📅 Fecha: ${form.fecha}\n👷 Responsable: ${form.responsable}\n🏢 Área: ${form.area}\n📌 Tema: ${form.tema}\n👥 Asistentes: ${form.asistentes.filter(a => a.nombre).length}`}
                    elementIdToPrint="toolbox-pdf-content"
                    fileName={`Charla_5min_${form.tema.replace(/\s+/g, '_') || 'sin_tema'}`}
                />

                {/* Floating Action Buttons */}
                <div className="no-print floating-action-bar">
                    <button onClick={handleSave} className="btn-floating-action" style={{ background: '#36B37E', color: '#fff' }}>
                        <Save size={18} /> GUARDAR
                    </button>
                    <button onClick={() => requirePro(() => setShowShare(true))} className="btn-floating-action" style={{ background: '#0052CC', color: '#fff' }}>
                        <Share2 size={18} /> COMPARTIR
                    </button>
                    <button onClick={() => requirePro(() => window.print())} className="btn-floating-action" style={{ background: '#FF8B00', color: '#fff' }}>
                        <Printer size={18} /> IMPRIMIR
                    </button>
                </div>

                {/* Header */}
                <div style={{
                    marginBottom: '1.5rem', padding: '1.5rem 2rem',
                    background: 'linear-gradient(135deg, #0052CC, #003d99)',
                    borderRadius: 24, display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                    boxShadow: '0 10px 40px rgba(0,82,204,0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: 56, height: 56, background: 'rgba(255,255,255,0.2)',
                            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <MessageSquare size={30} color="#fff" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                                Charla de 5 Minutos
                            </h1>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600 }}>
                                Charla de 5 Minutos • Registro de asistentes y firma
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => setView('form')}
                            style={{
                                padding: '0.6rem 1.1rem', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer',
                                background: view === 'form' ? '#fff' : 'rgba(255,255,255,0.15)',
                                color: view === 'form' ? '#0052CC' : '#fff', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}
                        >
                            <FileText size={16} /> Nueva Charla
                        </button>
                        <button
                            onClick={() => setView('history')}
                            style={{
                                padding: '0.6rem 1.1rem', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer',
                                background: view === 'history' ? '#fff' : 'rgba(255,255,255,0.15)',
                                color: view === 'history' ? '#0052CC' : '#fff', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}
                        >
                            <History size={16} /> Historial ({talks.length})
                        </button>
                    </div>
                </div>

                {view === 'form' && (
                    <>
                        {/* FORM */}
                        <div className="no-print card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Building2 size={20} color="var(--color-primary)" /> Datos Generales
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Fecha</label>
                                    <input type="date" value={form.fecha}
                                        onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                                        style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Empresa / Establecimiento</label>
                                    <input type="text" value={form.empresa}
                                        onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                                        placeholder="Nombre de la empresa" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Área / Sector</label>
                                    <input type="text" value={form.area}
                                        onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                                        placeholder="Ej: Producción, Almacén..." style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Responsable de la Charla</label>
                                    <input type="text" value={form.responsable}
                                        onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                                        placeholder="Nombre y apellido" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Cargo del Responsable</label>
                                    <input type="text" value={form.cargoResponsable}
                                        onChange={e => setForm(f => ({ ...f, cargoResponsable: e.target.value }))}
                                        placeholder="Ej: Supervisor, HSYMA..." style={inputStyle} />
                                </div>
                            </div>

                            {/* Topic with templates */}
                            <div style={{ marginTop: '1rem' }}>
                                <label style={labelStyle}>Tema de la Charla *</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                                    <input type="text" value={form.tema}
                                        onChange={e => setForm(f => ({ ...f, tema: e.target.value }))}
                                        placeholder="Ingresá o seleccioná un tema..." style={{ ...inputStyle, flex: 1 }} />
                                    <button
                                        onClick={() => setShowTopics(s => !s)}
                                        style={{ padding: '0 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                                    >
                                        <ChevronDown size={18} /> Plantillas
                                    </button>
                                </div>
                                {showTopics && (
                                    <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.5rem' }}>
                                        {TOPICS_TEMPLATES.map(t => (
                                            <button key={t.label}
                                                onClick={() => { setForm(f => ({ ...f, tema: `${t.icon} ${t.label}` })); setShowTopics(false); }}
                                                style={{
                                                    padding: '0.55rem 0.8rem', background: 'var(--color-background)',
                                                    border: '1.5px solid var(--color-border)', borderRadius: 10,
                                                    cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem',
                                                    fontWeight: 700, color: 'var(--color-text)',
                                                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-background)'; }}
                                            >
                                                {t.icon} {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <label style={labelStyle}>Desarrollo / Puntos Tratados</label>
                                <textarea value={form.desarrollo}
                                    onChange={e => setForm(f => ({ ...f, desarrollo: e.target.value }))}
                                    placeholder="Describí los puntos principales de la charla..."
                                    style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <label style={labelStyle}>Observaciones</label>
                                <textarea value={form.observaciones}
                                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                                    placeholder="Dudas, compromisos, acciones a tomar..."
                                    style={{ ...inputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                        </div>

                        {/* Attendees */}
                        <div className="no-print card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={20} color="var(--color-primary)" /> Lista de Asistentes ({form.asistentes.filter(a => a.nombre).length})
                                </h3>
                                <button onClick={addAttendee}
                                    style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                    <Plus size={16} /> Agregar
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {form.asistentes.map((att, idx) => (
                                    <div key={att.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: '0.6rem', alignItems: 'center' }}>
                                        <input type="text" value={att.nombre}
                                            onChange={e => updateAttendee(att.id, 'nombre', e.target.value)}
                                            placeholder={`Nombre asistente ${idx + 1}`} style={inputStyle} />
                                        <input type="text" value={att.dni}
                                            onChange={e => updateAttendee(att.id, 'dni', e.target.value)}
                                            placeholder="DNI" style={inputStyle} />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', color: att.firma ? '#10b981' : 'var(--color-text-muted)' }}>
                                            <input type="checkbox" checked={att.firma}
                                                onChange={e => updateAttendee(att.id, 'firma', e.target.checked)}
                                                style={{ width: 18, height: 18, accentColor: '#10b981' }} />
                                            Firmó
                                        </label>
                                        <button onClick={() => removeAttendee(att.id)}
                                            style={{ background: 'transparent', border: '1px solid #ef4444', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* HISTORY */}
                {view === 'history' && (
                    <div>
                        <div style={{ marginBottom: '1rem', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                            <input type="text" value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar por tema, área o responsable..."
                                style={{ ...inputStyle, paddingLeft: '2.8rem' }} />
                        </div>
                        {filteredTalks.length === 0 ? (
                            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                                <MessageSquare size={48} style={{ opacity: 0.15, marginBottom: '1rem' }} color="var(--color-text)" />
                                <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>No hay charlas registradas</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {filteredTalks.map(talk => (
                                    <div key={talk.id} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #0052CC' }}>
                                        <div style={{ width: 48, height: 48, background: 'rgba(0,82,204,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <MessageSquare size={24} color="#0052CC" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {talk.tema}
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                <span>📅 {new Date(talk.fecha + 'T12:00').toLocaleDateString('es-AR')}</span>
                                                <span>👷 {talk.responsable}</span>
                                                {talk.area && <span>🏢 {talk.area}</span>}
                                                <span>👥 {talk.asistentes.filter(a => a.nombre).length} asistentes</span>
                                                <span style={{ color: '#10b981', fontWeight: 700 }}>✅ {talk.asistentes.filter(a => a.firma).length} firmaron</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                            <button onClick={() => handleEdit(talk)}
                                                style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--color-primary)', display: 'flex' }}
                                                title="Editar">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(talk.id)}
                                                style={{ padding: '0.5rem', background: 'transparent', border: '1px solid #ef4444', borderRadius: 8, cursor: 'pointer', color: '#ef4444', display: 'flex' }}
                                                title="Eliminar">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="print-area" style={{ position: 'fixed', left: 0, top: 0, opacity: 0.01, pointerEvents: 'none', zIndex: -1 }}>
                <ToolboxTalkPdfGenerator data={form} professional={professional} />
            </div>
        </>
    );
}
