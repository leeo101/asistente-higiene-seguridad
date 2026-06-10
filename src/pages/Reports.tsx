import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, FileText, AlertCircle, GraduationCap, ClipboardCheck, Package, Plus, Trash2, History, Share2, Printer, Clock, Edit2, CheckCircle2, Download, Calendar } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import PhotoAttachments from '../components/PhotoAttachments';
import CompanyLogo from '../components/CompanyLogo';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PremiumHeader from '../components/PremiumHeader';
import { DataTable } from '../components/DataTable';

import ShareModal from '../components/ShareModal';
import ProfessionalReportPdfGenerator from '../components/ProfessionalReportPdfGenerator';

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    border: '1px solid var(--glass-border)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

function DeleteConfirm({ onConfirm, onCancel }: any) {
    return (
        <ConfirmModal
            isOpen={true}
            onClose={onCancel}
            onConfirm={onConfirm}
            title="¿Eliminar registro?"
            message="Esta acción no se puede deshacer."
            iconEmoji="🗑️"
        />
    );
}

export default function Reports(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { syncCollection } = useSync();
    
    // Core state
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [reportsHistory, setReportsHistory] = useState<any[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [shareItem, setShareItem] = useState<any>(null);

    // Form state
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
    const [photos, setPhotos] = useState<any[]>([]);
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

    const loadHistory = () => {
        const hist = JSON.parse(localStorage.getItem('reports_history') || '[]');
        setReportsHistory(hist);
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        loadHistory();
        
        if (location.state?.editData) {
            setIsFormVisible(true);
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
    }, [location.state]);

    const handleAddPerson = () => {
        setPersonnel([...personnel, { id: Date.now(), name: '', dni: '' }]);
    };

    const handleRemovePerson = (id: any) => {
        if (personnel.length > 1) {
            setPersonnel(personnel.filter(p => p.id !== id));
        }
    };

    const handlePersonChange = (id: any, field: string, value: string) => {
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
            updated = history.map((h: any) => h.id === entryId ? newReport : h);
        } else {
            updated = [newReport, ...history];
        }

        await syncCollection('reports_history', updated);
        localStorage.setItem('current_report', JSON.stringify(newReport));
        toast.success('Informe guardado con éxito');
        navigate('/reports-report');
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        const current = JSON.parse(localStorage.getItem('reports_history') || '[]');
        const updated = current.filter((item: any) => String(item.id) !== String(deleteTarget));
        localStorage.setItem('reports_history', JSON.stringify(updated));
        syncCollection('reports_history', updated);
        setReportsHistory(updated);
        setDeleteTarget(null);
        toast.success('Informe eliminado');
    };

    const DeleteBtn = ({ id }: { id: any }) => (
        <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(id); }}
            title="Eliminar"
            style={{
                background: '#fee2e2', border: 'none', borderRadius: '10px',
                color: '#dc2626', cursor: 'pointer', padding: '0.5rem 0.6rem',
                display: 'flex', alignItems: 'center', flexShrink: 0
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
            onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
        >
            <Trash2 size={16} />
        </button>
    );

    const templates = [
        { id: 'general', label: 'Informe Técnico', icon: <FileText /> },
        { id: 'accident', label: 'Incidente / Acc.', icon: <AlertCircle /> },
        { id: 'training', label: 'Capacitación', icon: <GraduationCap /> },
        { id: 'rgrl', label: 'RGRL', icon: <ClipboardCheck /> },
        { id: 'epp', label: 'Entrega EPP', icon: <Package /> }
    ];

    if (!isFormVisible) {
        return (
            <div className="container" style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '7rem', paddingTop: '5.5rem' }}>
                <PremiumHeader 
                    title="Informes Profesionales"
                    subtitle="Gestión e historial de informes técnicos."
                    icon={<FileText size={32} color="#ffffff" />}
                    color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                />

                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                
                <ShareModal
                    isOpen={!!shareItem}
                    open={!!shareItem}
                    onClose={() => setShareItem(null)}
                    title={`Informe - ${shareItem?.data?.title || ''}`}
                    text={shareItem ? `📄 Informe Profesional\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}\n📅 ${new Date(shareItem.data.createdAt).toLocaleDateString('es-AR')}` : ''}
                    rawMessage={shareItem ? `📄 Informe Profesional\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}\n📅 ${new Date(shareItem.data.createdAt).toLocaleDateString('es-AR')}` : ''}
                    elementIdToPrint="pdf-content"
                    fileName={`Informe_${shareItem?.data?.title || 'Profesional'}.pdf`}
                />

                <div style={{ position: 'absolute', left: 0, opacity: 0.01, top: '-9999px', pointerEvents: 'none' }}>
                    {shareItem?.type === 'report' && <ProfessionalReportPdfGenerator currentReport={shareItem.data} />}
                </div>

                <main style={{ padding: '0 0 2rem 0', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    {/* Botones de Navegación */}
                    <div style={{ display: 'flex', gap: '1rem', padding: '0 1rem', marginBottom: '1rem' }}>
                        <button
                            onClick={() => navigate('/', { state: { scrollTo: 'reports' } })}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            INICIO
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', padding: '0 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button onClick={() => {
                                // downloadCSV
                            }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff' }}>
                                <Download size={14} /> EXCEL
                            </button>
                            <button onClick={() => {
                                setProjectData({
                                    title: '', company: '', location: '', date: new Date().toISOString().split('T')[0],
                                    responsable: professional.name || ''
                                });
                                setContent('');
                                setPhotos([]);
                                setTemplate('general');
                                setIsFormVisible(true);
                            }} className="btn-primary hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', width: 'auto', margin: 0, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                                <Plus size={18} /> NUEVO INFORME
                            </button>
                        </div>
                    </div>

                <div style={{ padding: '0 0 2rem 0' }}>
                    <DataTable 
                        data={reportsHistory}
                        searchPlaceholder="Buscar por título o empresa..."
                        searchFields={['title', 'company']}
                        emptyMessage="No hay informes registrados."
                        emptyIcon={<FileText size={48} />}
                        columns={[
                            {
                                header: 'Fecha',
                                accessor: 'createdAt',
                                sortable: true,
                                render: (item: any) => (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                        <Calendar size={14} /> 
                                        {new Date(item.createdAt).toLocaleDateString('es-AR')}
                                    </span>
                                )
                            },
                            {
                                header: 'Título',
                                accessor: 'title',
                                sortable: true,
                                render: (item: any) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <div style={{ background: 'rgba(236,72,153,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#ec4899' }}>
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{item.title || 'Sin Título'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.template?.toUpperCase() || 'GENERAL'}</div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: 'Empresa',
                                accessor: 'company',
                                sortable: true
                            },
                            {
                                header: 'Acciones',
                                accessor: 'id',
                                render: (item: any) => (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => {
                                                navigate('/reports', { state: { editData: item } });
                                                setIsFormVisible(true);
                                            }}
                                            style={{ padding: '0.4rem 0.6rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => { localStorage.setItem('current_report', JSON.stringify(item)); navigate('/reports-report'); }}
                                            style={{
                                                padding: '0.4rem 0.6rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                            title="Ver PDF"
                                        >
                                            <FileText size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>PDF</span>
                                        </button>
                                        <button
                                            onClick={() => setShareItem({ type: 'report', data: item })}
                                            style={{ padding: '0.4rem 0.6rem', background: 'rgba(236,72,153,0.1)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '8px', cursor: 'pointer' }}
                                            title="Compartir"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                        <DeleteBtn id={item.id} />
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '6rem', paddingTop: '5.5rem' }}>
            <PremiumHeader 
                title="Generar Informe"
                subtitle="Documentación Profesional de Seguridad e Higiene"
                icon={<FileText />}
                color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
            />

            <main style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => { setIsFormVisible(false); loadHistory(); window.scrollTo(0, 0); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #36B37E 0%, #2A9365 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(54, 179, 126, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <ArrowLeft size={20} /> Volver
                    </button>
                </div>

                {/* Template Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                    {templates.map(t => (
                        <div
                            key={t.id}
                            onClick={() => {
                                setTemplate(t.id);
                                if ((t.id === 'training' || t.id === 'epp') && personnel.length === 0) {
                                    setPersonnel([{ id: Date.now(), name: '', dni: '' }]);
                                }
                            }}
                            className="card hover-lift"
                            style={{
                                textAlign: 'center',
                                padding: '1.5rem 1rem',
                                cursor: 'pointer',
                                border: template === t.id ? '2px solid var(--color-primary)' : '1px solid var(--glass-border)',
                                background: template === t.id ? 'rgba(var(--color-primary-rgb), 0.08)' : 'var(--gradient-card)',
                                transition: 'all 0.3s ease',
                                borderRadius: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.8rem'
                            }}
                        >
                            <div style={{ 
                                color: template === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)', 
                                padding: '1rem',
                                background: template === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: '50%'
                            }}>
                                {React.cloneElement(t.icon, { size: 36 })}
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: template === t.id ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{t.label}</div>
                        </div>
                    ))}
                </div>

                {/* General Info */}
                <div className="card" style={{ marginBottom: '2.5rem', padding: '2.5rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)', borderRadius: '20px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                        <FileText size={20} /> Datos Generales
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Título del Informe</label>
                            <input
                                type="text"
                                value={projectData.title}
                                onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                                placeholder="Ej: Relevamiento de Condiciones de Seguridad"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Empresa / Cliente</label>
                            <input
                                type="text"
                                value={projectData.company}
                                onChange={(e) => setProjectData({ ...projectData, company: e.target.value })}
                                placeholder="Nombre de la empresa"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación / Planta</label>
                            <input
                                type="text"
                                value={projectData.location}
                                onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
                                placeholder="Ej: Sede Central"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha</label>
                            <input
                                type="date"
                                value={projectData.date}
                                onChange={(e) => setProjectData({ ...projectData, date: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Responsable / Profesional</label>
                            <input
                                type="text"
                                value={projectData.responsable}
                                onChange={(e) => setProjectData({ ...projectData, responsable: e.target.value })}
                                placeholder="Nombre del responsable"
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* Template Content */}
                <div className="card" style={{ marginBottom: '2.5rem', padding: '2.5rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)', borderRadius: '20px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                        <ClipboardCheck size={20} /> Desarrollo del Informe
                    </h3>

                    {template === 'training' && (
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={labelStyle}>Tema de la Capacitación</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Uso de Extintores, RCP, etc."
                                        value={extraFields.topic || ''}
                                        onChange={(e) => setExtraFields({ ...extraFields, topic: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Duración (minutos)</label>
                                    <input
                                        type="number"
                                        placeholder="60"
                                        value={extraFields.duration || ''}
                                        onChange={(e) => setExtraFields({ ...extraFields, duration: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {template === 'accident' && (
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={labelStyle}>Hora del Evento</label>
                                    <input
                                        type="time"
                                        value={extraFields.eventTime || ''}
                                        onChange={(e) => setExtraFields({ ...extraFields, eventTime: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Persona Afectada</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del afectado"
                                        value={extraFields.affectedPerson || ''}
                                        onChange={(e) => setExtraFields({ ...extraFields, affectedPerson: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {(template === 'training' || template === 'epp') && (
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <label style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Personal Interviniente / Receptores</label>
                                <button
                                    onClick={handleAddPerson}
                                    className="btn-outline hover-lift"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}
                                >
                                    <Plus size={14} /> Añadir Persona
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {personnel.map((p, index) => (
                                    <div key={p.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ flex: 2 }}>
                                            <input
                                                type="text"
                                                placeholder="Nombre completo"
                                                style={inputStyle}
                                                value={p.name}
                                                onChange={(e) => handlePersonChange(p.id, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                type="text"
                                                placeholder="DNI/CUIL"
                                                style={inputStyle}
                                                value={p.dni}
                                                onChange={(e) => handlePersonChange(p.id, 'dni', e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleRemovePerson(p.id)}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            disabled={personnel.length === 1}
                                            className="hover-lift"
                                        >
                                            <Trash2 size={18}  />
                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <label style={labelStyle}>Contenido Principal / Observaciones</label>
                    <textarea
                        style={{ ...inputStyle, minHeight: '350px', resize: 'vertical', lineHeight: '1.6' }}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Describa los hallazgos, recomendaciones o el cuerpo del informe..."
                    />

                    <div style={{ marginTop: '2.5rem' }}>
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
                    <div style={{ marginBottom: '2rem' }}>
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
                    </div>

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
            </main>
        </div>
    );
}
