import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
    ArrowLeft, Save, Plus, Trash2, Printer,
    ShieldCheck, Building2, User, Calendar,
    CheckCircle2, AlertCircle, HelpCircle, Pencil, Info, Share2,
    Users, Clock, Zap, Flame, HardHat, Construction, QrCode
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import ShareModal from '../components/ShareModal';
import PdfSignatures from '../components/PdfSignatures';
import SignatureCanvas from '../components/SignatureCanvas';
import { usePaywall } from '../hooks/usePaywall';
import { permitTypes } from '../data/workPermits';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import CompanyLogo from '../components/CompanyLogo';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import WorkPermitPdfGenerator from '../components/WorkPermitPdfGenerator';

export default function WorkPermit(): React.ReactElement | null {
  const { requirePro } = usePaywall();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const editData = location.state?.editData;
    useDocumentTitle(editData ? 'Editar Permiso de Trabajo' : 'Permiso de Trabajo');

    const [showForm, setShowForm] = useState(!!editData);
    const [history, setHistory] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState<any>(null);
    const [shareItem, setShareItem] = useState<any>(null);

    // Default state
    const [formData, setFormData] = useState<any>(() => ({
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
        observacionesGenerales: '',
        estado: 'Borrador', // 'Borrador' | 'Pendiente Supervisor' | 'Pendiente EHS' | 'Aprobado'
        firmas: {
            solicitante: null,
            supervisor: null,
            ehs: null
        },
        operatorSignature: '',
        professionalSignature: '',
        supervisorSignature: '',
        showSignatures: { operator: true, professional: true, supervisor: true }
    }));

    const [professional, setProfessional] = useState<any>({
        name: 'Profesional',
        license: '',
        signature: null,
        stamp: null
    });

    const setShowSignatures = (updater: any) => {
        setFormData((prev: any) => {
            const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
            return { ...prev, showSignatures: updated };
        });
    };

    const showSignatures = formData.showSignatures || { operator: true, professional: true, supervisor: true };

    const [showShare, setShowShare] = useState(false);

    // Load data for editing
    useEffect(() => {
        window.scrollTo(0, 0);
        if (location.state?.editData) {
            const ed = location.state.editData;
            setFormData({
                ...ed,
                operatorSignature: ed.operatorSignature || ed.firmas?.solicitante?.sign || '',
                professionalSignature: ed.professionalSignature || ed.firmas?.ehs?.sign || '',
                supervisorSignature: ed.supervisorSignature || ed.firmas?.supervisor?.sign || '',
                showSignatures: ed.showSignatures || { operator: true, professional: true, supervisor: true }
            });
            setShowForm(true);
        }
    }, [location.state]);

    // Load History
    useEffect(() => {
        const saved = localStorage.getItem('work_permits_history');
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    }, [showForm]);

    // Load professional data
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
                name: data.name || 'Profesional',
                license: data.license || '',
                signature: signature,
                stamp: stamp
            });
        } else {
            setProfessional((prev: any) => ({ ...prev, signature, stamp }));
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
            professionalName: formData.professionalName || professional.name,
            professionalLicense: formData.professionalLicense || professional.license,
            professionalSignature: formData.professionalSignature || professional.signature,
            professionalStamp: formData.professionalStamp || professional.stamp,
            createdAt: (formData as any).createdAt || new Date().toISOString()
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
        setShowForm(false);
    };

    const handlePrint = () => requirePro(() => window.print());
    const handleShare = () => requirePro(() => setShowShare(true));

    const selectedTypeLabel = permitTypes.find(t => t.id === formData.tipoPermiso)?.label || 'Permiso de Trabajo';

    // --- Progress tracking ---
    const wpProgressItems = [
        { label: 'Empresa', done: !!formData.empresa?.trim() },
        { label: 'Obra', done: !!formData.obra?.trim() },
        { label: 'Tipo de Permiso', done: !!formData.tipoPermiso },
        { label: 'Horario', done: !!formData.validezDesde && !!formData.validezHasta },
        { label: 'Personal autorizado', done: formData.personal.some(p => p.nombre?.trim()) },
        { label: 'Checklist completo', done: formData.checklist.length > 0 && formData.checklist.every(c => c.estado !== '') },
    ];
    const wpDone = wpProgressItems.filter(p => p.done).length;
    const wpPct = Math.round((wpDone / wpProgressItems.length) * 100);
    const wpColor = wpPct === 100 ? '#10b981' : wpPct >= 66 ? '#f59e0b' : '#3b82f6';

    // Quick templates per permit type
    const QUICK_TEMPLATES = [
        { id: 'hot_work', label: 'Trabajo en Caliente', emoji: '🔥', color: '#ef4444', eppPreset: ['Casco', 'Calzado de Seguridad', 'Guantes de Cuero', 'Careta de Soldar', 'Mandil de Cuero', 'Extintor a Mano'] },
        { id: 'height',   label: 'Trabajo en Altura',  emoji: '⛰️', color: '#f97316', eppPreset: ['Casco', 'Calzado de Seguridad', 'Arnés de Cuerpo Completo', 'Cabo de Vida', 'Guantes', 'Anteojos'] },
        { id: 'elec',     label: 'Trabajo Eléctrico',   emoji: '⚡',  color: '#eab308', eppPreset: ['Casco Dieléctrico', 'Guantes Dieléctricos', 'Calzado Dieléctrico', 'Anteojos', 'Herramienta Aislada'] },
        { id: 'confined', label: 'Espacio Confinado',  emoji: '🕒', color: '#8b5cf6', eppPreset: ['Equipo de Respiración', 'Arnés', 'Detector de Gas', 'Radio Comunicación', 'Casco', 'Guantes'] },
    ];

    const applyQuickTemplate = (tpl) => {
        const matched = permitTypes.find(t => t.id === tpl.id) || permitTypes[0];
        setFormData(prev => ({
            ...prev,
            tipoPermiso: matched.id,
            checklist: matched.questions.map((q, i) => ({ id: Date.now() + i, pregunta: q, estado: 'Cumple', observaciones: '' })),
            eppRequeridos: tpl.eppPreset,
        }));
        toast.success(`Plantilla ${tpl.label} aplicada`);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const updated = history.filter((item: any) => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('work_permits_history', JSON.stringify(updated));
        await syncCollection('work_permits_history', updated);
        toast.success('Permiso eliminado');
        setDeleteTarget(null);
    };

    const handleExportCSV = () => {
        downloadCSV(history.map((i: any) => ({
            id: i.id, fecha: i.fecha, empresa: i.empresa, obra: i.obra,
            tipo: permitTypes.find(t => t.id === i.tipoPermiso)?.label || 'Permiso',
            desde: i.validezDesde, hasta: i.validezHasta
        })), 'permisos_de_trabajo', {
            id: 'ID Permiso', fecha: 'Fecha', empresa: 'Empresa', obra: 'Obra',
            tipo: 'Tipo de Tarea', desde: 'Hora Inicio', hasta: 'Hora Fin'
        }, 'Reporte de Permisos');
    };

    const columns = [
        {
            header: 'Fecha',
            accessor: 'fecha',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} /> {item.fecha}
                </span>
            )
        },
        {
            header: 'Empresa',
            accessor: 'empresa',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#3b82f6' }}>
                        <Building2 size={16} />
                    </div>
                    <span style={{ fontWeight: 700 }}>{item.empresa}</span>
                </div>
            )
        },
        {
            header: 'Obra',
            accessor: 'obra',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Construction size={14} /> {item.obra}
                </span>
            )
        },
        {
            header: 'Tipo',
            accessor: 'tipoPermiso',
            sortable: true,
            render: (item: any) => (
                <span style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    {permitTypes.find(t => t.id === item.tipoPermiso)?.label || 'Permiso'}
                </span>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => { setFormData(item); setShowForm(true); }} style={{ padding: '0.4rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', cursor: 'pointer' }} title="Ver"><Pencil size={15} /></button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/permit/${item.id}?print=true`; setQrTarget({ text: url, title: `Permiso — ${item.empresa}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <div className="container" style={{ maxWidth: '1000px', paddingBottom: '8rem' }}>
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ margin: '0 0 1rem' }}>¿Eliminar este permiso?</h3>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent' }}>Cancelar</button>
                            <button onClick={confirmDelete} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white' }}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
            
            {!showForm ? (
                <AnimatedPage>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <Breadcrumbs />
                    </div>

                    <PremiumHeader onBack={showForm ? () => { setShowForm(false); if(typeof setSearchParams !== 'undefined') setSearchParams({}); } : undefined}
                        title="Permisos de Trabajo"
                        subtitle="Gestión de Tareas Críticas y Especiales"
                        icon={<ShieldCheck size={32} color="#ffffff"  />}
                        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                    />

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                        <></>
                    </div>

                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button onClick={() => setShowForm(true)} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#36B37E', color: 'white', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(54, 179, 126, 0.3)' }}>
                            <Plus size={18} /> NUEVA TAREA
                        </button>
                        {history.length > 0 && (
                            <button onClick={() => requirePro(handleExportCSV)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.8rem 1.2rem', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', color: 'var(--color-text)' }}>
                                EXCEL
                            </button>
                        )}
                    </div>

                    <div className="ats-pdf-offscreen">
                        {shareItem && <WorkPermitPdfGenerator data={shareItem} id="pdf-content-list" />}
                    </div>

                    <ShareModal 
                        isOpen={!!shareItem} 
                        open={!!shareItem} 
                        onClose={() => setShareItem(null)} 
                        title={`Permiso de Trabajo - ${shareItem?.empresa || ''}`} 
                        text={shareItem ? `🔐 Permiso de Trabajo\n🏗️ Empresa: ${shareItem.empresa}\n🚧 Obra: ${shareItem.obra}\n📅 Fecha: ${shareItem.fecha}` : ''} 
                        rawMessage={``} 
                        elementIdToPrint="pdf-content-list" 
                        fileName={`Permiso_${shareItem?.empresa || 'Trabajo'}`} 
                    />

                    <div style={{ marginTop: '2rem' }}>
                        <DataTable
                            data={history}
                            columns={columns}
                            searchPlaceholder="Buscar por empresa, obra o tipo..."
                            searchFields={['empresa', 'obra']}
                            emptyMessage="No hay permisos registrados."
                            emptyIcon={<ShieldCheck size={48} />}
                        />
                    </div>

                    {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
                </AnimatedPage>
            ) : (
                <AnimatedPage>
                    <div className="no-print" style={{ marginBottom: '2rem' }}>
                        <PremiumHeader onBack={showForm ? () => { setShowForm(false); if(typeof setSearchParams !== 'undefined') setSearchParams({}); } : undefined} 
                            title={editData ? 'Editar Permiso de Trabajo' : 'Nuevo Permiso de Trabajo'}
                            subtitle="Gestión de Riesgos Especiales"
                            icon={<ShieldCheck size={32} color="#ffffff"  />}
                            color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                            <></>
                        </div>
                    </div>
            <ShareModal
                isOpen={showShare}
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Permiso de Trabajo – ${formData.empresa}`}
                text={`📄 Permiso de Trabajo: ${selectedTypeLabel}\n🏗️ Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⏰ Validez: ${formData.validezDesde} a ${formData.validezHasta}\n\nGenerado con Asistente HYS`}
                rawMessage={`📄 Permiso de Trabajo: ${selectedTypeLabel}\n🏗️ Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⏰ Validez: ${formData.validezDesde} a ${formData.validezHasta}\n\nGenerado con Asistente HYS`}
                elementIdToPrint="pdf-content"
                fileName={`Permiso_${formData.empresa || 'Trabajo'}.pdf`}
            />

            {/* Action Bar */}
            <div className="no-print floating-action-bar">
                <button onClick={(e) => { e.preventDefault(); requirePro(handleSave); }} className="btn-floating-action" style={{ background: '#36B37E', color: '#ffffff' }}>
                    <Save size={18} /> GUARDAR
                </button>
                <button onClick={handleShare} className="btn-floating-action" style={{ background: '#0052CC', color: '#ffffff' }}>
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button onClick={handlePrint} className="btn-floating-action" style={{ background: '#FF8B00', color: '#ffffff' }}>
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>



            {/* Quick Templates + Progress */}
            <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', background: 'rgba(var(--color-surface-rgb), 0.7)', backdropFilter: 'blur(12px)', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 900, color: wpColor }}>{wpPct}%</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{wpPct === 100 ? 'Listo ✅' : 'Completando...'}</span>
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: '6px', background: 'var(--color-background)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${wpPct}%`, background: wpColor, borderRadius: '999px', transition: 'width 0.4s ease', boxShadow: `0 0 6px ${wpColor}88` }} />
                </div>

                {/* Quick Templates */}
                <div>
                    <p style={{ margin: '0 0 0.6rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)' }}>Plantillas Rápidas por Tipo de Riesgo:</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {QUICK_TEMPLATES.map(tpl => (
                            <button
                                key={tpl.id}
                                onClick={() => applyQuickTemplate(tpl)}
                                style={{
                                    padding: '0.45rem 0.85rem',
                                    background: `${tpl.color}15`,
                                    border: `1.5px solid ${tpl.color}40`,
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    color: tpl.color,
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${tpl.color}28`; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${tpl.color}15`; }}
                            >
                                {tpl.emoji} {tpl.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Print Area */}
            <div id="pdf-content" className="bg-white text-black p-6 sm:p-10 shadow-2xl mx-auto print-area border border-slate-200 rounded-3xl print:shadow-none print:border-none" style={{ width: '100%', boxSizing: 'border-box' }}>

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
                                        <Trash2 size={16}  />
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
                <div className="card animate-fade-in" style={{ marginTop: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                        <Pencil size={22} style={{ color: 'var(--color-primary)' }} /> Firmas y Aprobaciones del Permiso
                    </h3>

                    <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {[
                                { id: 'operator', label: 'Solicitante' },
                                { id: 'professional', label: 'Gerencia EHS' },
                                { id: 'supervisor', label: 'Supervisor' }
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
                                            onChange={e => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))}
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

                    <div style={{ marginBottom: '2rem' }}>
                        <PdfSignatures
                            data={{
                                ...formData,
                                professionalSignature: professional.signature,
                                professionalName: professional.name,
                                professionalLicense: professional.license,
                                professionalStamp: professional.stamp
                            }}
                            box1={showSignatures.operator ? {
                                title: 'SOLICITANTE / OPERADOR',
                                subtitle: 'Aclaración y Firma',
                                signatureUrl: formData.operatorSignature || formData.firmas?.solicitante?.sign || null,
                                isProfessional: false
                            } : null}
                            box2={showSignatures.professional ? {
                                title: 'GERENCIA EHS / EMISOR',
                                subtitle: (professional.name || 'Firma y Sello H&S').toUpperCase(),
                                signatureUrl: formData.professionalSignature || professional.signature || formData.firmas?.ehs?.sign || null,
                                stampUrl: formData.professionalStamp || professional.stamp || null,
                                isProfessional: true,
                                license: professional.license
                            } : null}
                            box3={showSignatures.supervisor ? {
                                title: 'SUPERVISOR DE TRABAJO',
                                subtitle: 'Aprobación / Autorización',
                                signatureUrl: formData.supervisorSignature || formData.firmas?.supervisor?.sign || null,
                                isProfessional: false
                            } : null}
                        />
                    </div>

                    {/* Signature Tactile Drawing Pads */}
                    <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {showSignatures.operator && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas 
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                    initialImage={formData.operatorSignature || formData.firmas?.solicitante?.sign}
                                    title="Firma de Solicitante"
                                />
                            </div>
                        )}
                        
                        {showSignatures.professional && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas 
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                    initialImage={formData.professionalSignature || professional.signature || formData.firmas?.ehs?.sign}
                                    title="Firma de Gerencia EHS"
                                />
                            </div>
                        )}

                        {showSignatures.supervisor && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas 
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                                    initialImage={formData.supervisorSignature || formData.firmas?.supervisor?.sign}
                                    title="Firma de Supervisor"
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Sello de Estado */}
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                         <span style={{ 
                             display: 'inline-block',
                             border: `3px solid ${formData.estado === 'Aprobado' ? '#10b981' : (formData.estado === 'Borrador' ? '#64748b' : '#f59e0b')}`, 
                             color: formData.estado === 'Aprobado' ? '#10b981' : (formData.estado === 'Borrador' ? '#64748b' : '#f59e0b'),
                             padding: '0.5rem 2rem', 
                             fontWeight: 900, 
                             fontSize: '1.2rem', 
                             textTransform: 'uppercase',
                             transform: 'rotate(-5deg)',
                             opacity: 0.8
                         }}>
                             ESTADO: {formData.estado}
                         </span>
                    </div>
                </div>

                {/* Footer Notes */}
                <PdfBrandingFooter />
            </div>
            </AnimatedPage>
            )}
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

function DocBox({ label, value = '', onChange = () => {}, type = "text", borderLeft = false, borderTop = false, noInput = false, children = null }: any) {
    return (
        <div style={{
            padding: '1.2rem',
            borderLeft: borderLeft ? '1px solid var(--color-border)' : 'none',
            borderTop: borderTop ? '1px solid var(--color-border)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'rgba(248, 250, 252, 0.4)',
            transition: 'background 0.2s ease'
        }} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
            {noInput ? children : (
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.95rem', outline: 'none', width: '100%', color: 'var(--color-text)' }}
                />
            )}
        </div>
    );
}
