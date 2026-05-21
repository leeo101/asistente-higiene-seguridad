import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare, Plus, Trash2, Save, Share2, Printer,
    Users, Calendar, User, Building2, FileText, ChevronDown,
    CheckCircle2, Clock, Search, Eye, Edit3, History, Pencil,
    Briefcase, MapPin, Award, UserCheck
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import ShareModal from '../components/ShareModal';
import Breadcrumbs from '../components/Breadcrumbs';
import CompanyLogo from '../components/CompanyLogo';
import ToolboxTalkPdfGenerator from '../components/ToolboxTalkPdfGenerator';
import toast from 'react-hot-toast';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';

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
    operatorSignature?: string;
    signature?: string;
    supervisorSignature?: string;
    showSignatures?: { operator: boolean; professional: boolean; supervisor: boolean };
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
    createdAt: '',
    operatorSignature: '',
    signature: '',
    supervisorSignature: '',
    showSignatures: { operator: false, professional: true, supervisor: false }
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

/* ── Premium Stat Card ── */
function ToolboxStatCard({ icon, label, value, color, gradient }: { icon: React.ReactNode; label: string; value: string | number; color: string; gradient: string }) {
    return (
        <div className="toolbox-stat-card">
            <div className="toolbox-stat-glow" style={{ background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: 44, height: 44,
                    background: gradient,
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 8px 24px ${color}30`,
                    color: '#ffffff'
                }}>
                    {icon}
                </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1, letterSpacing: '-1px', marginBottom: '0.25rem' }}>
                {value}
            </div>
            <div style={{ position: 'relative', zIndex: 1, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {label}
            </div>
        </div>
    );
}

/* ── Section Header ── */
function SectionHeader({ icon, title, rightContent }: { icon: React.ReactNode; title: string; rightContent?: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{
                margin: 0, fontWeight: 900, fontSize: '1.1rem',
                color: 'var(--color-text)',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
                <div style={{
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, #0052CC, #0077ff)',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 82, 204, 0.25)'
                }}>
                    {icon}
                </div>
                {title}
            </h3>
            {rightContent}
        </div>
    );
}

/* ── Input with Icon ── */
function IconInput({ icon, label, ...props }: { icon: React.ReactNode; label: string; [key: string]: any }) {
    return (
        <div>
            <label style={{
                display: 'block', fontSize: '0.7rem', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--color-text-muted)', marginBottom: '0.4rem'
            }}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <div style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)', pointerEvents: 'none', display: 'flex'
                }}>
                    {icon}
                </div>
                <input className="toolbox-input-pro toolbox-focus-glow" {...props} />
            </div>
        </div>
    );
}

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

    const [showSignatures, setShowSignatures] = useState({
        operator: false,
        professional: true,
        supervisor: false
    });

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (form.showSignatures) {
            setShowSignatures(form.showSignatures);
        }
    }, [form.showSignatures]);

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
        if (!form.tema.trim() || !form.responsable.trim()) {
            toast.error('Completá el tema y el responsable');
            return;
        }
        const entry: ToolboxTalk = {
            ...form,
            id: editId || `talk-${Date.now()}`,
            createdAt: form.createdAt || new Date().toISOString(),
            showSignatures
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
        setShowSignatures({ operator: false, professional: true, supervisor: false });
    };

    const handleDelete = (id: string) => {
        if (!confirm('¿Eliminar esta charla?')) return;
        save(talks.filter(t => t.id !== id));
    };

    const handleEdit = (talk: ToolboxTalk) => {
        setForm(talk);
        setEditId(talk.id);
        setShowSignatures(talk.showSignatures || { operator: false, professional: true, supervisor: false });
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

    // Dashboard stats
    const totalCharlas = talks.length;
    const totalAsistentes = talks.reduce((acc, t) => acc + t.asistentes.filter(a => a.nombre).length, 0);
    const totalFirmados = talks.reduce((acc, t) => acc + t.asistentes.filter(a => a.firma).length, 0);
    const tasaFirma = totalAsistentes > 0 ? Math.round((totalFirmados / totalAsistentes) * 100) : 0;

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
                    <button onClick={handleSave} className="btn-floating-action" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
                        <Save size={18} /> GUARDAR
                    </button>
                    <button onClick={() => requirePro(() => setShowShare(true))} className="btn-floating-action" style={{ background: 'linear-gradient(135deg, #0052CC, #0077ff)', color: '#fff' }}>
                        <Share2 size={18} /> COMPARTIR
                    </button>
                    <button onClick={() => requirePro(() => window.print())} className="btn-floating-action" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}>
                        <Printer size={18} /> IMPRIMIR
                    </button>
                </div>

                {/* ═══ Premium Header ═══ */}
                <div style={{
                    marginBottom: '1.5rem', padding: '1.5rem 2rem',
                    background: 'linear-gradient(135deg, #0052CC 0%, #003d99 50%, #001a66 100%)',
                    borderRadius: 24, display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                    boxShadow: '0 10px 40px rgba(0,82,204,0.35), 0 0 80px rgba(0,82,204,0.1)',
                    position: 'relative', overflow: 'hidden'
                }}>
                    {/* Background glow */}
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'radial-gradient(circle, rgba(0,197,255,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: 56, height: 56,
                            background: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                        }}>
                            <MessageSquare size={30} color="#fff" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                                Charla de 5 Minutos
                            </h1>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.3px' }}>
                                Registro de asistentes y firma digital
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', zIndex: 1 }}>
                        {[
                            { key: 'form' as const, icon: <FileText size={15} />, text: 'Nueva Charla' },
                            { key: 'history' as const, icon: <History size={15} />, text: `Historial (${talks.length})` }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setView(tab.key)}
                                style={{
                                    padding: '0.55rem 1rem', borderRadius: 12,
                                    fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem',
                                    background: view === tab.key ? '#fff' : 'rgba(255,255,255,0.12)',
                                    color: view === tab.key ? '#0052CC' : 'rgba(255,255,255,0.9)',
                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    backdropFilter: view === tab.key ? 'none' : 'blur(8px)',
                                    border: view === tab.key ? 'none' : '1px solid rgba(255,255,255,0.15)',
                                    transition: 'all 0.2s',
                                    boxShadow: view === tab.key ? '0 4px 15px rgba(0,0,0,0.15)' : 'none'
                                }}
                            >
                                {tab.icon} {tab.text}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ═══ Stats Dashboard ═══ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <ToolboxStatCard
                        icon={<MessageSquare size={20} color="#fff" />}
                        label="Charlas Dictadas"
                        value={totalCharlas}
                        color="#8b5cf6"
                        gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                    />
                    <ToolboxStatCard
                        icon={<Users size={20} color="#fff" />}
                        label="Personal Capacitado"
                        value={totalAsistentes}
                        color="#10b981"
                        gradient="linear-gradient(135deg, #10b981, #059669)"
                    />
                    <ToolboxStatCard
                        icon={<CheckCircle2 size={20} color="#fff" />}
                        label="Firmas Obtenidas"
                        value={totalFirmados}
                        color="#0052CC"
                        gradient="linear-gradient(135deg, #0052CC, #0077ff)"
                    />
                    <ToolboxStatCard
                        icon={<Award size={20} color="#fff" />}
                        label="Tasa de Firma"
                        value={`${tasaFirma}%`}
                        color="#f59e0b"
                        gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                    />
                </div>

                {view === 'form' && (
                    <>
                        {/* ═══ DATOS GENERALES ═══ */}
                        <div className="toolbox-glass-section no-print" style={{ marginBottom: '1.5rem' }}>
                            <SectionHeader
                                icon={<Building2 size={18} color="#fff" />}
                                title="Datos Generales"
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <IconInput icon={<Calendar size={16} />} label="Fecha"
                                    type="date" value={form.fecha}
                                    onChange={(e: any) => setForm(f => ({ ...f, fecha: e.target.value }))}
                                />
                                <IconInput icon={<Building2 size={16} />} label="Empresa / Establecimiento"
                                    type="text" value={form.empresa}
                                    onChange={(e: any) => setForm(f => ({ ...f, empresa: e.target.value }))}
                                    placeholder="Nombre de la empresa"
                                />
                                <IconInput icon={<MapPin size={16} />} label="Área / Sector"
                                    type="text" value={form.area}
                                    onChange={(e: any) => setForm(f => ({ ...f, area: e.target.value }))}
                                    placeholder="Ej: Producción, Almacén..."
                                />
                                <IconInput icon={<User size={16} />} label="Responsable de la Charla"
                                    type="text" value={form.responsable}
                                    onChange={(e: any) => setForm(f => ({ ...f, responsable: e.target.value }))}
                                    placeholder="Nombre y apellido"
                                />
                                <IconInput icon={<Briefcase size={16} />} label="Cargo del Responsable"
                                    type="text" value={form.cargoResponsable}
                                    onChange={(e: any) => setForm(f => ({ ...f, cargoResponsable: e.target.value }))}
                                    placeholder="Ej: Supervisor, HSYMA..."
                                />
                            </div>

                            {/* ── Tema con plantillas ── */}
                            <div style={{ marginTop: '1.25rem' }}>
                                <label style={{
                                    display: 'block', fontSize: '0.7rem', fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    color: 'var(--color-text-muted)', marginBottom: '0.4rem'
                                }}>
                                    Tema de la Charla *
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                                    <input type="text" value={form.tema}
                                        onChange={e => setForm(f => ({ ...f, tema: e.target.value }))}
                                        placeholder="Ingresá o seleccioná un tema..."
                                        className="toolbox-input-plain toolbox-focus-glow"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        onClick={() => setShowTopics(s => !s)}
                                        style={{
                                            padding: '0 1.1rem',
                                            background: 'linear-gradient(135deg, #0052CC, #0077ff)',
                                            color: '#fff', border: 'none', borderRadius: 12,
                                            fontWeight: 700, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                                            whiteSpace: 'nowrap', fontSize: '0.85rem',
                                            boxShadow: '0 4px 12px rgba(0,82,204,0.25)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <ChevronDown size={18} style={{
                                            transition: 'transform 0.25s',
                                            transform: showTopics ? 'rotate(180deg)' : 'rotate(0deg)'
                                        }} /> Plantillas
                                    </button>
                                </div>

                                {/* ── Topic Chips Gallery ── */}
                                {showTopics && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                                        gap: '0.5rem',
                                        animation: 'fadeIn 0.25s ease-out'
                                    }}>
                                        {TOPICS_TEMPLATES.map(t => (
                                            <button key={t.label}
                                                className="toolbox-topic-chip"
                                                onClick={() => { setForm(f => ({ ...f, tema: `${t.icon} ${t.label}` })); setShowTopics(false); }}
                                            >
                                                <span style={{ fontSize: '1.1rem' }}>{t.icon}</span> {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Desarrollo ── */}
                            <div style={{ marginTop: '1.25rem' }}>
                                <label style={{
                                    display: 'block', fontSize: '0.7rem', fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    color: 'var(--color-text-muted)', marginBottom: '0.4rem'
                                }}>
                                    Desarrollo / Puntos Tratados
                                </label>
                                <textarea value={form.desarrollo}
                                    onChange={e => setForm(f => ({ ...f, desarrollo: e.target.value }))}
                                    placeholder="Describí los puntos principales de la charla..."
                                    className="toolbox-input-plain toolbox-focus-glow"
                                    style={{ minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
                                />
                            </div>

                            {/* ── Observaciones ── */}
                            <div style={{ marginTop: '1rem' }}>
                                <label style={{
                                    display: 'block', fontSize: '0.7rem', fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    color: 'var(--color-text-muted)', marginBottom: '0.4rem'
                                }}>
                                    Observaciones
                                </label>
                                <textarea value={form.observaciones}
                                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                                    placeholder="Dudas, compromisos, acciones a tomar..."
                                    className="toolbox-input-plain toolbox-focus-glow"
                                    style={{ minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
                                />
                            </div>
                        </div>

                        {/* ═══ LISTA DE ASISTENTES ═══ */}
                        <div className="toolbox-glass-section no-print" style={{ marginBottom: '1.5rem' }}>
                            <SectionHeader
                                icon={<Users size={18} color="#fff" />}
                                title={`Lista de Asistentes (${form.asistentes.filter(a => a.nombre).length})`}
                                rightContent={
                                    <button onClick={addAttendee}
                                        style={{
                                            padding: '0.5rem 1.1rem',
                                            background: 'linear-gradient(135deg, #0052CC, #0077ff)',
                                            color: '#fff', border: 'none', borderRadius: 12,
                                            fontWeight: 700, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            fontSize: '0.82rem',
                                            boxShadow: '0 4px 12px rgba(0,82,204,0.25)',
                                            transition: 'all 0.2s'
                                        }}>
                                        <Plus size={16} /> Agregar
                                    </button>
                                }
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {form.asistentes.map((att, idx) => (
                                    <div key={att.id} className="toolbox-asistente-card">
                                        <span className="toolbox-asistente-badge">Asistente #{idx + 1}</span>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr auto auto',
                                            gap: '0.6rem',
                                            alignItems: 'center'
                                        }}>
                                            <input type="text" value={att.nombre}
                                                onChange={e => updateAttendee(att.id, 'nombre', e.target.value)}
                                                placeholder={`Nombre completo`}
                                                className="toolbox-input-plain toolbox-focus-glow"
                                            />
                                            <input type="text" value={att.dni}
                                                onChange={e => updateAttendee(att.id, 'dni', e.target.value)}
                                                placeholder="DNI"
                                                className="toolbox-input-plain toolbox-focus-glow"
                                            />
                                            <button
                                                onClick={() => updateAttendee(att.id, 'firma', !att.firma)}
                                                className={`toolbox-signature-pill ${att.firma ? 'toolbox-signature-pill-active' : ''}`}
                                                style={{ border: att.firma ? '1.5px solid #10b981' : undefined, background: att.firma ? 'rgba(16,185,129,0.08)' : undefined, color: att.firma ? '#10b981' : undefined }}
                                            >
                                                <CheckCircle2 size={16} /> {att.firma ? 'Firmó ✓' : 'Sin firma'}
                                            </button>
                                            <button onClick={() => removeAttendee(att.id)}
                                                style={{
                                                    background: 'rgba(239,68,68,0.06)',
                                                    border: '1.5px solid rgba(239,68,68,0.2)',
                                                    borderRadius: 10, padding: '0.55rem',
                                                    cursor: 'pointer', color: '#ef4444',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ═══ FIRMAS Y AUTORIZACIONES ═══ */}
                        <div className="toolbox-glass-section" style={{ marginBottom: '1.5rem' }}>
                            <SectionHeader
                                icon={<Pencil size={18} color="#fff" />}
                                title="Firmas y Autorizaciones"
                            />

                            {/* Signature toggles - Premium Pills */}
                            <div className="no-print" style={{
                                display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                                gap: '0.75rem', marginBottom: '2rem',
                                padding: '1.25rem', borderRadius: 16,
                                background: 'var(--color-background)',
                                border: '1px solid var(--color-border)',
                                alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap'
                            }}>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    color: 'var(--color-text-muted)', whiteSpace: 'nowrap'
                                }}>
                                    Incluir firmas:
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {[
                                        { key: 'operator' as const, label: 'Delegado / Operador' },
                                        { key: 'professional' as const, label: 'Responsable / Expositor' },
                                        { key: 'supervisor' as const, label: 'Supervisión / Verificador' }
                                    ].map(sig => (
                                        <button
                                            key={sig.key}
                                            onClick={() => setShowSignatures(s => ({ ...s, [sig.key]: !s[sig.key] }))}
                                            className={`toolbox-signature-pill ${showSignatures[sig.key] ? 'toolbox-signature-pill-active' : ''}`}
                                        >
                                            <CheckCircle2 size={15} />
                                            {sig.label}
                                        </button>
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
                                        title: 'DELEGADO / OPERADOR',
                                        subtitle: 'En representación de asistentes',
                                        signatureUrl: form.operatorSignature || null,
                                        isProfessional: false
                                    } : null}
                                    box2={showSignatures.professional ? {
                                        title: 'RESPONSABLE / EXPOSITOR',
                                        subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                        signatureUrl: form.signature || professional.signature || null,
                                        stampUrl: professional.stamp || null,
                                        isProfessional: true,
                                        license: professional.license
                                    } : null}
                                    box3={showSignatures.supervisor ? {
                                        title: 'SUPERVISIÓN / VERIFICADOR',
                                        subtitle: 'Cierre / Control de Charla',
                                        signatureUrl: form.supervisorSignature || null,
                                        isProfessional: false
                                    } : null}
                                />
                            </div>

                            {/* Interactive Signature Drawing Pads */}
                            <div className="no-print" style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                gap: '2rem',
                                paddingTop: '2rem',
                                borderTop: '1px solid var(--color-border)'
                            }}>
                                {showSignatures.operator && (
                                    <SignatureCanvas
                                        onSave={(sig) => setForm(prev => ({ ...prev, operatorSignature: sig || '' }))}
                                        initialImage={form.operatorSignature}
                                        label="Firma de Delegado / Operador"
                                    />
                                )}

                                {showSignatures.professional && (
                                    <SignatureCanvas
                                        onSave={(sig) => setForm(prev => ({ ...prev, signature: sig || '' }))}
                                        initialImage={form.signature}
                                        label="Firma de Responsable / Expositor"
                                    />
                                )}

                                {showSignatures.supervisor && (
                                    <SignatureCanvas
                                        onSave={(sig) => setForm(prev => ({ ...prev, supervisorSignature: sig || '' }))}
                                        initialImage={form.supervisorSignature}
                                        label="Firma de Supervisión / Verificador"
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ═══ HISTORIAL ═══ */}
                {view === 'history' && (
                    <div>
                        <div style={{ marginBottom: '1rem', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                            <input type="text" value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar por tema, área o responsable..."
                                className="toolbox-input-pro toolbox-focus-glow"
                            />
                        </div>
                        {filteredTalks.length === 0 ? (
                            <div className="toolbox-glass-section" style={{ padding: '3rem', textAlign: 'center' }}>
                                <div style={{
                                    width: 72, height: 72, margin: '0 auto 1rem',
                                    background: 'rgba(0,82,204,0.08)', borderRadius: 20,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <MessageSquare size={36} style={{ opacity: 0.3 }} color="var(--color-text)" />
                                </div>
                                <p style={{ color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
                                    No hay charlas registradas
                                </p>
                                <p style={{ color: 'var(--color-text-light)', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
                                    Creá tu primera charla de 5 minutos
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {filteredTalks.map(talk => (
                                    <div key={talk.id} className="toolbox-history-card">
                                        <div style={{
                                            width: 48, height: 48,
                                            background: 'linear-gradient(135deg, rgba(0,82,204,0.12), rgba(0,197,255,0.08))',
                                            borderRadius: 14, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            <MessageSquare size={22} color="#0052CC" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: 800, color: 'var(--color-text)',
                                                fontSize: '0.95rem', overflow: 'hidden',
                                                textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                            }}>
                                                {talk.tema}
                                            </div>
                                            <div style={{
                                                fontSize: '0.78rem', color: 'var(--color-text-muted)',
                                                marginTop: '0.3rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem'
                                            }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Calendar size={12} /> {new Date(talk.fecha + 'T12:00').toLocaleDateString('es-AR')}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <User size={12} /> {talk.responsable}
                                                </span>
                                                {talk.area && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <MapPin size={12} /> {talk.area}
                                                </span>}
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Users size={12} /> {talk.asistentes.filter(a => a.nombre).length}
                                                </span>
                                                <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <CheckCircle2 size={12} /> {talk.asistentes.filter(a => a.firma).length} firmaron
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                            <button onClick={() => handleEdit(talk)}
                                                style={{
                                                    padding: '0.5rem',
                                                    background: 'rgba(0,82,204,0.06)',
                                                    border: '1.5px solid rgba(0,82,204,0.15)',
                                                    borderRadius: 10, cursor: 'pointer',
                                                    color: '#0052CC', display: 'flex',
                                                    transition: 'all 0.15s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,82,204,0.12)'; e.currentTarget.style.borderColor = '#0052CC'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,82,204,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,82,204,0.15)'; }}
                                                title="Editar">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(talk.id)}
                                                style={{
                                                    padding: '0.5rem',
                                                    background: 'rgba(239,68,68,0.06)',
                                                    border: '1.5px solid rgba(239,68,68,0.15)',
                                                    borderRadius: 10, cursor: 'pointer',
                                                    color: '#ef4444', display: 'flex',
                                                    transition: 'all 0.15s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
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
                <ToolboxTalkPdfGenerator data={{ ...form, showSignatures }} professional={professional} />
            </div>
        </>
    );
}
