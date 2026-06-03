import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Users, Calendar, Clock, BookOpen,
    UserPlus, Trash2, CheckCircle2, FileText, Briefcase,
    Plus, Share2, Printer, Pencil, QrCode, Timer
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import TrainingPdfGenerator from '../components/TrainingPdfGenerator';
import TrainingExamPdfGenerator from '../components/TrainingExamPdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import QRModal from '../components/QRModal';

function StatCard({ icon, label, value, color, gradient }: { icon: React.ReactNode; label: string; value: string | number; color: string; gradient: string }) {
    return (
        <div className="training-stat-card" style={{ cursor: 'pointer' }}>
            <div className="training-stat-glow" style={{ background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    background: gradient,
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 24px ${color}30`,
                    color: '#ffffff'
                }}>
                    {React.cloneElement(icon as React.ReactElement<any>, { color: '#ffffff', size: 20 })}
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

export default function TrainingManagement(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection, syncing } = useSync();
    const { requirePro } = usePaywall();
    const [searchParams] = useSearchParams();
    
    // Core state
    const [history, setHistory] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [qrTarget, setQrTarget] = useState<any>(null);
    const [shareItem, setShareItem] = useState<any>(null);
    const [selectedTraining, setSelectedTraining] = useState<any>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [printType, setPrintType] = useState<'asistencia' | 'examen'>('asistencia');
    const [showExamForm, setShowExamForm] = useState(false);

    const initialFormState = {
        tema: '',
        expositor: currentUser?.displayName || '',
        fecha: new Date().toISOString().split('T')[0],
        duracion: '1',
        empresa: '',
        ubicacion: '',
        observaciones: '',
        preguntas: [
            { texto: '¿Comprendió los riesgos asociados a la tarea?' },
            { texto: '¿Identificó las medidas preventivas correctas?' }
        ],
        asistentes: [{ nombre: '', dni: '', puesto: '', nota: '' }],
        operatorSignature: '',
        signature: '',
        supervisorSignature: '',
        showSignatures: { operator: false, professional: true, supervisor: false }
    };

    const [formData, setFormData] = useState(initialFormState);
    const [showSignatures, setShowSignatures] = useState(initialFormState.showSignatures);

    const [professional, setProfessional] = useState({ name: '', license: '', signature: '', stamp: '' });
    const [isMobile, setIsMobile] = useState(false);

    useDocumentTitle(showExamForm ? 'Generador de Exámenes' : showForm ? (editingId ? 'Editar Capacitación' : 'Nueva Capacitación') : 'Gestión de Capacitaciones');

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        try {
            const personal = localStorage.getItem('personalData');
            const stamp = localStorage.getItem('signatureStampData');
            if (personal) {
                const p = JSON.parse(personal);
                setProfessional(prev => ({ ...prev, name: p.name || '', license: p.license || '' }));
            }
            if (stamp) {
                const s = JSON.parse(stamp);
                setProfessional(prev => ({ ...prev, signature: s.signature || '', stamp: s.stamp || '' }));
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('training_history');
            if (raw && raw !== 'undefined') {
                const h = JSON.parse(raw);
                setHistory(Array.isArray(h) ? h.sort((a, b) => (new Date(b.fecha) as any) - (new Date(a.fecha) as any)) : []);
            } else {
                setHistory([]);
            }
        } catch (e) {
            setHistory([]);
        }
    }, [syncing]);

    // Handle deep links (e.g. from history hub)
    useEffect(() => {
        const editData = location.state?.editData;
        if (editData && !showForm) {
            setFormData(editData);
            setShowSignatures(editData.showSignatures || initialFormState.showSignatures);
            setEditingId(editData.id);
            setShowForm(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state, showForm]);

    const handlePrint = (type: 'asistencia' | 'examen' = 'asistencia') => requirePro(() => {
        setPrintType(type);
        setTimeout(() => {
            document.body.classList.add('printing-isolated');
            const element = document.getElementById('pdf-content');
            if (element) {
                element.classList.add('isolated-print-target');
                window.print();
            setTimeout(() => {
                document.body.classList.remove('printing-isolated');
                element.classList.remove('isolated-print-target');
            }, 8000);
            } else {
                window.print();
            }
        }, 50);
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (index, field, value) => {
        setFormData(prev => {
            const newAsistentes = [...prev.asistentes];
            newAsistentes[index] = { ...newAsistentes[index], [field]: value };
            return { ...prev, asistentes: newAsistentes };
        });
    };

    const addAsistente = () => setFormData(prev => ({ ...prev, asistentes: [...prev.asistentes, { nombre: '', dni: '', puesto: '', nota: '' }] }));
    const removeAsistente = (index) => setFormData(prev => ({ ...prev, asistentes: prev.asistentes.filter((_, i) => i !== index) }));

    const handlePreguntaChange = (index, value) => {
        setFormData(prev => {
            const newPreguntas = [...(prev.preguntas || [])];
            newPreguntas[index] = { ...newPreguntas[index], texto: value };
            return { ...prev, preguntas: newPreguntas };
        });
    };

    const addPregunta = () => setFormData(prev => ({ ...prev, preguntas: [...(prev.preguntas || []), { texto: '' }] }));
    const removePregunta = (index) => setFormData(prev => ({ ...prev, preguntas: (prev.preguntas || []).filter((_, i) => i !== index) }));

    const handleSave = () => {
        if (!formData.tema || !formData.fecha) {
            toast.error('El tema y la fecha son obligatorios.');
            return;
        }

        const asistentesValidos = formData.asistentes.filter(a => a.nombre.trim() !== '' || a.dni.trim() !== '');
        if (asistentesValidos.length === 0) {
            toast.error('Debe ingresar al menos 1 asistente a la capacitación.');
            return;
        }

        const report = {
            id: editingId || Date.now().toString(),
            date: editingId ? (formData as any).date : new Date().toISOString(),
            ...formData,
            showSignatures,
            asistentes: asistentesValidos
        };

        let updatedHistory;
        if (editingId) {
            updatedHistory = history.map(item => item.id === editingId ? report : item);
        } else {
            updatedHistory = [report, ...history];
        }

        localStorage.setItem('training_history', JSON.stringify(updatedHistory));
        syncCollection('training_history', updatedHistory);
        setHistory(updatedHistory);

        toast.success(editingId ? 'Capacitación actualizada correctamente.' : 'Capacitación registrada correctamente.');
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormState);
        setShowSignatures(initialFormState.showSignatures);
    };

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('training_history', JSON.stringify(updated));
        syncCollection('training_history', updated);
        setDeleteTarget(null);
        toast.success("Capacitación eliminada.");
    };

    const handleEdit = (item) => {
        setFormData(item);
        setShowSignatures(item.showSignatures || initialFormState.showSignatures);
        setEditingId(item.id);
        setShowForm(true);
    };

    if (selectedTraining) {
        return <TrainingPdfGenerator data={selectedTraining} onBack={() => setSelectedTraining(null)} />;
    }

    const totalCharlas = history.length;
    const totalAsistentes = history.reduce((acc, item) => acc + (item.asistentes?.length || 0), 0);
    const totalHours = history.reduce((acc, item) => acc + (parseFloat(item.duracion) || 0), 0);
    const avgDuration = totalCharlas > 0 ? (totalHours / totalCharlas).toFixed(1) : '0';

    const columns = [
        {
            header: 'Fecha',
            accessor: 'fecha',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} /> {new Date(item.fecha + 'T12:00:00Z').toLocaleDateString('es-AR')}
                </span>
            )
        },
        {
            header: 'Tema',
            accessor: 'tema',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(99,102,241,0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--color-primary)' }}>
                        <BookOpen size={16} />
                    </div>
                    <span style={{ fontWeight: 700 }}>{item.tema}</span>
                </div>
            )
        },
        {
            header: 'Expositor',
            accessor: 'expositor',
            sortable: true,
            render: (item: any) => <span style={{ color: 'var(--color-text-muted)' }}>{item.expositor || '—'}</span>
        },
        {
            header: 'Asistentes',
            accessor: 'asistentes',
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.6rem', background: 'var(--color-background)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, width: 'fit-content' }}>
                    <Users size={13} /> {item.asistentes?.length || 0}
                </span>
            )
        },
        {
            header: 'Duración',
            accessor: 'duracion',
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    <Timer size={14} /> {item.duracion} hs
                </span>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => setSelectedTraining(item)} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>Ver</button>
                    <button onClick={() => handleEdit(item)} style={{ padding: '0.5rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Editar"><Pencil size={15} /></button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/training/${item.id}?print=true`; setQrTarget({ text: url, title: `Capacitación — ${item.tema}` }); })} style={{ padding: '0.5rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.5rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Eliminar"><Trash2 size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container" style={{ paddingBottom: '6rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {deleteTarget && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                        <div className="glass-card" style={{ maxWidth: '360px', width: '95%', textAlign: 'center', padding: '2.5rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', position: 'relative' }}>
                            <Trash2 size={48} style={{ color: '#ef4444', margin: '0 auto 1.5rem auto' }} />
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>¿Eliminar capacitación?</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Esta acción es permanente y no se podrá deshacer.</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text)', fontWeight: 700 }}>Cancelar</button>
                                <button onClick={confirmDelete} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                )}
                
                {shareItem && (
                    <ShareModal 
                        isOpen={!!shareItem} 
                        open={!!shareItem} 
                        onClose={() => setShareItem(null)} 
                        title={`Capacitación - ${shareItem?.tema || ''}`} 
                        text={`📊 Capacitación\n📚 Tema: ${shareItem.tema}\n🧑‍🏫 Expositor: ${shareItem.expositor}\n📅 Fecha: ${shareItem.fecha}\n👥 Asistentes: ${shareItem.asistentes?.length}`} 
                        rawMessage={''} 
                        elementIdToPrint="pdf-content" 
                        fileName={`Capacitacion_${shareItem?.tema || 'registro'}.pdf`} 
                    />
                )}
                {createPortal(
                    <div className="ats-pdf-offscreen" aria-hidden="true">
                        {(shareItem || showForm || showExamForm) && (
                            printType === 'examen' ? (
                                <TrainingExamPdfGenerator data={shareItem || { ...formData, showSignatures }} />
                            ) : (
                                <TrainingPdfGenerator 
                                    data={shareItem || { ...formData, showSignatures }} 
                                    isHeadless={true} 
                                />
                            )
                        )}
                    </div>,
                    document.body
                )}

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

                {showExamForm ? (
                    <>
                        {/* EXAM BUILDER VIEW */}
                        <div className="floating-action-bar no-print">
                            <button onClick={() => handlePrint('examen')} className="btn-floating-action" style={{ background: '#8E44AD', color: '#ffffff' }}>
                                <FileText size={18} /> IMPRIMIR EXAMEN
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={() => setShowExamForm(false)} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={20}  />
                        </button>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800 }}>Generador de Exámenes</h1>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Cree plantillas en blanco para evaluar capacitaciones</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(12px)' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                                <BookOpen size={20} /> Metadatos del Examen
                            </h2>
                            <div className="grid-2-cols" style={{ gap: '1.5rem' }}>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>TEMA / TÍTULO DE LA CAPACITACIÓN</label>
                                    <input type="text" placeholder="Ej. Inducción de Seguridad..." value={formData.tema} onChange={e => handleInputChange('tema', e.target.value)} className="input-professional capa-focus-glow" style={{ fontWeight: 'bold', height: '46px', borderRadius: '10px' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>EXPOSITOR / INSTRUCTOR</label>
                                    <input type="text" value={formData.expositor} onChange={e => handleInputChange('expositor', e.target.value)} className="input-professional capa-focus-glow" style={{ height: '46px', borderRadius: '10px' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>FECHA DE EVALUACIÓN</label>
                                    <input type="date" value={formData.fecha} onChange={e => handleInputChange('fecha', e.target.value)} className="input-professional capa-focus-glow" style={{ height: '46px', borderRadius: '10px' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>EMPRESA / CONTRATISTA</label>
                                    <input type="text" placeholder="Si aplica a una subcontratista" value={formData.empresa} onChange={e => handleInputChange('empresa', e.target.value)} className="input-professional capa-focus-glow" style={{ height: '46px', borderRadius: '10px' }} />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(12px)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                                    <FileText size={20} /> Preguntas de Evaluación
                                </h2>
                                <button onClick={addPregunta} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Plus size={16} /> Agregar Pregunta
                                </button>
                            </div>
                            
                            {(!formData.preguntas || formData.preguntas.length === 0) && (
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>No se cargaron preguntas. El examen saldrá solo con un renglón.</p>
                            )}
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {(formData.preguntas || []).map((pregunta, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{idx + 1}.</span>
                                        <input 
                                            type="text" 
                                            value={pregunta.texto} 
                                            onChange={(e) => handlePreguntaChange(idx, e.target.value)} 
                                            placeholder="Escriba la pregunta a evaluar..."
                                            className="input-professional capa-focus-glow" 
                                            style={{ margin: 0, height: '44px', flex: 1, borderRadius: '10px' }} 
                                        />
                                        <button onClick={() => removePregunta(idx)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '10px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : showForm ? (
                    <>
                        {/* FORM VIEW */}
                        <div className="floating-action-bar no-print">
                            <button onClick={handleSave} className="btn-floating-action" style={{ background: '#36B37E', color: '#ffffff' }}>
                                <Save size={18} /> GUARDAR
                            </button>
                            <button onClick={() => requirePro(() => setShareItem(formData))} className="btn-floating-action" style={{ background: '#0052CC', color: '#ffffff' }}>
                                <Share2 size={18} /> COMPARTIR
                            </button>
                            <button onClick={() => handlePrint('asistencia')} className="btn-floating-action" style={{ background: '#FF8B00', color: '#ffffff' }}>
                                <Printer size={18} /> IMPRIMIR PDF
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={() => { setShowForm(false); setEditingId(null); setFormData(initialFormState); setShowSignatures(initialFormState.showSignatures); } } className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={20}  />
                        </button>
                                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{editingId ? 'Editar Capacitación' : 'Nueva Capacitación'}</h1>
                            </div>
                        </div>

                        {/* General Metadata Panel */}
                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(12px)' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                                <BookOpen size={20} /> Metadatos de la Charla
                            </h2>

                            <div className="grid-2-cols" style={{ gap: '1.5rem' }}>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <BookOpen size={16} /> Tema / Título de la Capacitación
                                    </label>
                                    <input type="text" placeholder="Ej. Inducción de Seguridad..." value={formData.tema} onChange={e => handleInputChange('tema', e.target.value)} className="input-professional capa-focus-glow" style={{ fontWeight: 'bold', height: '46px', borderRadius: '10px' }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <Users size={16} /> Expositor / Instructor
                                    </label>
                                    <input type="text" value={formData.expositor} onChange={e => handleInputChange('expositor', e.target.value)} className="input-professional capa-focus-glow" style={{ height: '46px', borderRadius: '10px' }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <Briefcase size={16} /> Sector / Lugar de Dictado
                                    </label>
                                    <input type="text" placeholder="Ej. Sala de Reuniones 1" value={formData.ubicacion} onChange={e => handleInputChange('ubicacion', e.target.value)} className="input-professional capa-focus-glow" style={{ height: '46px', borderRadius: '10px' }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <Calendar size={16} /> Fecha
                                    </label>
                                    <input type="date" value={formData.fecha} onChange={e => handleInputChange('fecha', e.target.value)} className="input-professional capa-focus-glow" style={{ height: '46px', borderRadius: '10px' }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <Clock size={16} /> Duración (Horas)
                                    </label>
                                    <input type="number" min="0.5" step="0.5" value={formData.duracion} onChange={e => handleInputChange('duracion', e.target.value)} className="input-professional capa-focus-glow" style={{ height: '46px', borderRadius: '10px' }} />
                                </div>

                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <FileText size={16} /> Empresa / Contratista (Opcional)
                                    </label>
                                    <input type="text" placeholder="Si aplica a una subcontratista específica" value={formData.empresa} onChange={e => handleInputChange('empresa', e.target.value)} className="input-professional capa-focus-glow" style={{ height: '46px', borderRadius: '10px' }} />
                                </div>
                            </div>
                        </div>

                        {/* Attendee Planilla Panel */}
                        <div className="glass-card" style={{ flex: 1, padding: '2rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(12px)', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                                    <Users size={20} /> Planilla de Asistentes
                                </h2>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, background: 'var(--color-primary)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', boxShadow: '0 2px 8px rgba(var(--color-primary-rgb), 0.2)' }}>
                                        {formData.asistentes.length} {formData.asistentes.length === 1 ? 'asistente' : 'asistentes'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {formData.asistentes.map((asistente, i) => (
                                    <div key={i} className="training-asistente-card">
                                        <span className="training-asistente-badge">Asistente #{i + 1}</span>
                                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1.2fr 1.5fr 1fr auto', gap: '1.25rem', alignItems: 'end', marginTop: '0.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nombre Completo</label>
                                                <input type="text" placeholder="Apellido y Nombre" value={asistente.nombre} onChange={e => handleArrayChange(i, 'nombre', e.target.value)} className="input-professional capa-focus-glow" style={{ margin: 0, height: '44px', width: '100%', borderRadius: '10px' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DNI / CUIL</label>
                                                <input type="text" placeholder="Número de documento" value={asistente.dni} onChange={e => handleArrayChange(i, 'dni', e.target.value)} className="input-professional capa-focus-glow" style={{ margin: 0, height: '44px', width: '100%', borderRadius: '10px' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Puesto / Sector</label>
                                                <input type="text" placeholder="Ej. Operario" value={asistente.puesto} onChange={e => handleArrayChange(i, 'puesto', e.target.value)} className="input-professional capa-focus-glow" style={{ margin: 0, height: '44px', width: '100%', borderRadius: '10px' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nota / Eval.</label>
                                                <input type="text" placeholder="Ej. Aprobado, 8" value={asistente.nota || ''} onChange={e => handleArrayChange(i, 'nota', e.target.value)} className="input-professional capa-focus-glow" style={{ margin: 0, height: '44px', width: '100%', borderRadius: '10px' }} />
                                            </div>

                                            {formData.asistentes.length > 1 ? (
                                                <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-end' : 'center', width: isMobile ? '100%' : 'auto' }}>
                                                    <button onClick={() => removeAsistente(i)} className="delete-asistente-btn" title="Eliminar Asistente" style={{ width: isMobile ? '100%' : '44px', height: '44px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', marginTop: isMobile ? '0.5rem' : '0' }}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="hidden sm:block" style={{ width: '44px' }}></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="btn-outline" onClick={addAsistente} style={{ width: '100%', padding: '1.2rem', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--color-primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--color-primary)', background: 'rgba(var(--color-primary-rgb), 0.03)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
                                <UserPlus size={18} /> Añadir Fila de Asistente
                            </button>
                        </div>

                        {/* Signatures & Approvals Panel */}
                        <div className="glass-card" style={{ marginTop: '1.5rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(12px)', padding: '2rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <Pencil size={24} /> Firmas y Autorizaciones
                            </h3>

                            <div className="no-print" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--color-surface-hover)', border: '1px solid var(--glass-border-subtle)', borderRadius: '16px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Incluir Firmas en el Documento:</div>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <button type="button" className={`training-signature-pill ${showSignatures.operator ? 'training-signature-pill-active' : ''}`} onClick={() => setShowSignatures(s => ({ ...s, operator: !s.operator }))}>
                                        <CheckCircle2 size={16} style={{ opacity: showSignatures.operator ? 1 : 0.4 }} /> Delegado / Asistente
                                    </button>
                                    <button type="button" className={`training-signature-pill ${showSignatures.professional ? 'training-signature-pill-active' : ''}`} onClick={() => setShowSignatures(s => ({ ...s, professional: !s.professional }))}>
                                        <CheckCircle2 size={16} style={{ opacity: showSignatures.professional ? 1 : 0.4 }} /> Instructor / Expositor
                                    </button>
                                    <button type="button" className={`training-signature-pill ${showSignatures.supervisor ? 'training-signature-pill-active' : ''}`} onClick={() => setShowSignatures(s => ({ ...s, supervisor: !s.supervisor }))}>
                                        <CheckCircle2 size={16} style={{ opacity: showSignatures.supervisor ? 1 : 0.4 }} /> Supervisión / Verificador
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <PdfSignatures
                                    data={{ ...formData, professionalSignature: professional.signature, professionalName: professional.name, professionalLicense: professional.license, professionalStamp: professional.stamp }}
                                    box1={showSignatures.operator ? { title: 'DELEGADO / ASISTENTE', subtitle: 'En representación de asistentes', signatureUrl: formData.operatorSignature || null, isProfessional: false } : null}
                                    box2={showSignatures.professional ? { title: 'INSTRUCTOR / EXPOSITOR', subtitle: (professional.name || 'Firma de Especialista').toUpperCase(), signatureUrl: formData.signature || professional.signature || null, stampUrl: professional.stamp || null, isProfessional: true, license: professional.license } : null}
                                    box3={showSignatures.supervisor ? { title: 'SUPERVISIÓN / VERIFICADOR', subtitle: 'Verificación de Capacitación', signatureUrl: formData.supervisorSignature || null, isProfessional: false } : null}
                                />
                            </div>

                            {(showSignatures.operator || showSignatures.professional || showSignatures.supervisor) && (
                                <div className="no-print" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                    {showSignatures.operator && (
                                        <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border-subtle)' }}>
                                            <SignatureCanvas onSave={(sig) => setFormData(prev => ({ ...prev, operatorSignature: sig || '' }))} initialImage={formData.operatorSignature} label="Firma de Delegado / Asistente" />
                                        </div>
                                    )}
                                    {showSignatures.professional && (
                                        <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border-subtle)' }}>
                                            <SignatureCanvas onSave={(sig) => setFormData(prev => ({ ...prev, signature: sig || '' }))} initialImage={formData.signature} label="Firma de Instructor / Expositor" />
                                        </div>
                                    )}
                                    {showSignatures.supervisor && (
                                        <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border-subtle)' }}>
                                            <SignatureCanvas onSave={(sig) => setFormData(prev => ({ ...prev, supervisorSignature: sig || '' }))} initialImage={formData.supervisorSignature} label="Firma de Supervisión / Verificador" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        

                    </>
                ) : (
                    <>
                        {/* HISTORY VIEW */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={() => navigate('/')} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={20}  />
                        </button>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800 }}>Gestión de Capacitaciones</h1>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Registros de formación del personal</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => setShowExamForm(true)}
                                    style={{ flex: '0 1 auto', padding: '1rem 1.5rem', borderRadius: '16px', background: '#8E44AD', color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(142,68,173,0.3)', whiteSpace: 'nowrap', margin: 0 }}
                                >
                                    <FileText size={20} strokeWidth={3} /> Crear Examen
                                </button>
                                <button
                                    onClick={() => setShowForm(true)}
                                    style={{ flex: '0 1 auto', padding: '1rem 1.5rem', borderRadius: '16px', background: '#36B37E', color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(54,179,126,0.3)', whiteSpace: 'nowrap', margin: 0 }}
                                >
                                    <Plus size={20} strokeWidth={3} /> Nueva Charla
                                </button>
                            </div>
                        </div>

                        {/* EHS Training Hub Dashboard Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <StatCard icon={<BookOpen />} label="Charlas Dictadas" value={totalCharlas} color="#8b5cf6" gradient="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" />
                            <StatCard icon={<Users />} label="Personal Capacitado" value={totalAsistentes} color="#10b981" gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
                            <StatCard icon={<Timer />} label="Horas Totales" value={`${totalHours} hs`} color="#f59e0b" gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
                            <StatCard icon={<Timer />} label="Duración Promedio" value={`${avgDuration} hs`} color="#3b82f6" gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" />
                        </div>

                        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(12px)' }}>
                            <DataTable
                                data={history}
                                columns={columns}
                                searchPlaceholder="Buscar por tema, expositor o empresa..."
                                searchFields={['tema', 'expositor', 'empresa']}
                                emptyMessage="No hay capacitaciones registradas."
                                emptyIcon={<BookOpen size={48} />}
                            />
                        </div>
                    </>
                )}
            </div>
            
            {!showForm && <AdBanner />}
        </AnimatedPage>
    );
}
