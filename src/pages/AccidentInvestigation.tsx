import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, UserPlus, ListPlus, Trash2, CheckCircle2, ChevronRight, ChevronLeft,
    Plus, Share2, Printer, Sparkles, Pencil, Search, AlertTriangle, Calendar, MapPin, QrCode, Download, FileText
} from 'lucide-react';
import { usePaywall } from '../hooks/usePaywall';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import AccidentPdfGenerator from '../components/AccidentPdfGenerator';
import PdfSignatures from '../components/PdfSignatures';
import SignatureCanvas from '../components/SignatureCanvas';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { downloadCSV } from '../services/exportCsv';
import { DataTable } from '../components/DataTable';
import PremiumHeader from '../components/PremiumHeader';
import toast from 'react-hot-toast';

const SECTIONS = ['Datos Generales', 'Accidentado', 'Descripción y Testigos', 'Análisis Causal', 'Medidas Preventivas'];

const severityConfig: Record<string, { color: string, bg: string }> = {
    'Leve':     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    'Moderado': { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    'Grave':    { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    'Mortal':   { color: '#dc2626', bg: 'rgba(220,38,38,0.14)' },
};

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

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                <Trash2 size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>¿Eliminar investigación?</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={onCancel} style={{ padding: '0.8rem 1.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, color: 'var(--color-text)' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ padding: '0.8rem 1.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Sí, Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function AccidentInvestigation(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();
    
    useDocumentTitle('Investigación de Accidentes');

    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    // List vs Form state
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [qrTarget, setQrTarget] = useState<any>(null);
    const [shareItem, setShareItem] = useState<any>(null);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    // Form state
    const [currentStep, setCurrentStep] = useState(0);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState<any>({
        fecha: new Date().toISOString().split('T')[0],
        hora: '', empresa: '', ubicacion: '', gravedad: 'Leve',
        victimaNombre: '', victimaDni: '', victimaPuesto: '', victimaAntiguedad: '', lesion: '', parteCuerpo: '',
        descripcionHecho: '', testigos: [{ nombre: '', declaracion: '' }],
        problemaCentral: '', porques: [''],
        medidas: [{ accion: '', responsable: '', fechaLimite: '' }],
        operatorSignature: '', supervisorSignature: '', signature: '',
        showSignatures: { operator: true, professional: true, supervisor: true }
    });

    const [professional, setProfessional] = useState<any>({ name: '', license: '', signature: null, stamp: null });

    const loadHistory = () => {
        const h = JSON.parse(localStorage.getItem('accident_history') || '[]');
        setHistory(h.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        loadHistory();
        
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

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

        if (location.state?.editData) {
            const editData = location.state.editData;
            setFormData({
                ...editData,
                operatorSignature: editData.operatorSignature || '',
                supervisorSignature: editData.supervisorSignature || editData.signature || '',
                signature: editData.signature || editData.supervisorSignature || '',
                showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
            });
            setIsEdit(true);
            setIsFormVisible(true);
        }

        return () => window.removeEventListener('resize', handleResize);
    }, [location.state]);

    useEffect(() => {
        if (isFormVisible) window.scrollTo(0, 0);
    }, [currentStep, isFormVisible]);

    const setShowSignatures = (updater: any) => {
        setFormData((prev: any) => {
            const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
            return { ...prev, showSignatures: updated };
        });
    };
    const showSignatures = formData.showSignatures || { operator: true, professional: true, supervisor: true };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (arrayName: string, index: number, field: string | null, value: string) => {
        setFormData((prev: any) => {
            const newArray = [...prev[arrayName]];
            if (field === null) {
                newArray[index] = value;
            } else {
                newArray[index] = { ...newArray[index], [field]: value };
            }
            return { ...prev, [arrayName]: newArray };
        });
    };

    const addArrayItem = (arrayName: string, defaultItem: any) => {
        setFormData((prev: any) => ({ ...prev, [arrayName]: [...prev[arrayName], defaultItem] }));
    };

    const removeArrayItem = (arrayName: string, index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            [arrayName]: prev[arrayName].filter((_: any, i: number) => i !== index)
        }));
    };

    const handleNext = () => { if (currentStep < SECTIONS.length - 1) setCurrentStep(s => s + 1); };
    const handlePrev = () => { if (currentStep > 0) setCurrentStep(s => s - 1); };

    const handleSave = () => {
        if (!formData.empresa || !formData.victimaNombre) {
            toast.error('La empresa y el nombre del accidentado son obligatorios.');
            return;
        }

        const report = {
            id: isEdit ? formData.id : Date.now(),
            date: formData.fecha || new Date().toISOString(),
            ...formData,
            professionalSignature: formData.professionalSignature || professional.signature,
            professionalName: formData.professionalName || professional.name,
            professionalLicense: formData.professionalLicense || professional.license,
            professionalStamp: formData.professionalStamp || professional.stamp,
        };

        const currentHistory = JSON.parse(localStorage.getItem('accident_history') || '[]');
        let updated;
        if (isEdit) {
            updated = currentHistory.map((item: any) => item.id === formData.id ? report : item);
        } else {
            updated = [report, ...currentHistory];
        }

        localStorage.setItem('accident_history', JSON.stringify(updated));
        syncCollection('accident_history', updated);
        
        toast.success(isEdit ? 'Investigación actualizada correctamente.' : 'Investigación guardada correctamente.');
        
        // Reset and close form
        setFormData({
            fecha: new Date().toISOString().split('T')[0], hora: '', empresa: '', ubicacion: '', gravedad: 'Leve',
            victimaNombre: '', victimaDni: '', victimaPuesto: '', victimaAntiguedad: '', lesion: '', parteCuerpo: '',
            descripcionHecho: '', testigos: [{ nombre: '', declaracion: '' }],
            problemaCentral: '', porques: [''],
            medidas: [{ accion: '', responsable: '', fechaLimite: '' }],
            operatorSignature: '', supervisorSignature: '', signature: '',
            showSignatures: { operator: true, professional: true, supervisor: true }
        });
        setIsEdit(false);
        setIsFormVisible(false);
        setCurrentStep(0);
        loadHistory();
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        const currentHistory = JSON.parse(localStorage.getItem('accident_history') || '[]');
        const updated = currentHistory.filter((item: any) => String(item.id) !== String(deleteTarget));
        localStorage.setItem('accident_history', JSON.stringify(updated));
        syncCollection('accident_history', updated);
        setHistory(updated);
        setDeleteTarget(null);
        toast.success('Investigación eliminada.');
    };

    const handleExportCSV = () => {
        requirePro(() => downloadCSV(history.map(i => ({
            victima: i.victimaNombre, empresa: i.empresa, fecha: i.date,
            lesion: i.lesion || '', sector: i.ubicacion || '', gravedad: i.gravedad || ''
        })), 'historial_accidentes', {
            victima: 'Víctima', empresa: 'Empresa', fecha: 'Fecha',
            lesion: 'Tipo de Lesión', sector: 'Sector/Área', gravedad: 'Gravedad'
        }));
    };

    if (selectedReport) {
        return (
            <div className="print-only-wrapper">
                <AccidentPdfGenerator report={{...selectedReport, id: selectedReport.id || Date.now()}} onBack={() => setSelectedReport(null)} />
            </div>
        );
    }

    if (!isFormVisible) {
        const columns = [
            {
                header: 'Fecha',
                accessor: 'date',
                sortable: true,
                render: (item: any) => (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        <Calendar size={14} /> {new Date(item.date || item.fecha).toLocaleDateString('es-AR')}
                    </span>
                )
            },
            {
                header: 'Accidentado',
                accessor: 'victimaNombre',
                sortable: true,
                render: (item: any) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#ef4444' }}>
                            <AlertTriangle size={16} />
                        </div>
                        <span style={{ fontWeight: 700 }}>{item.victimaNombre}</span>
                    </div>
                )
            },
            {
                header: 'Empresa',
                accessor: 'empresa',
                sortable: true,
                render: (item: any) => (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={14} /> {item.empresa}
                    </span>
                )
            },
            {
                header: 'Gravedad',
                accessor: 'gravedad',
                sortable: true,
                render: (item: any) => {
                    const cfg = severityConfig[item.gravedad] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
                    return (
                        <span style={{ background: cfg.bg, color: cfg.color, padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                            {item.gravedad || '—'}
                        </span>
                    );
                }
            },
            {
                header: 'Acciones',
                accessor: 'id',
                render: (item: any) => (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => setSelectedReport(item)} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>Ver</button>
                        <button onClick={() => { setFormData(item); setIsEdit(true); setIsFormVisible(true); }} style={{ padding: '0.4rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer' }} title="Editar"><Pencil size={15} /></button>
                        <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/accident/${item.id}?print=true`; setQrTarget({ text: url, title: `Accidente — ${item.victimaNombre}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                        <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                        <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
                    </div>
                )
            }
        ];

        return (
            <div className="container" style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '7rem', paddingTop: '5.5rem' }}>
                <PremiumHeader 
                    title="Investigaciones de Accidentes"
                    subtitle="Registros de siniestros"
                    icon={<AlertTriangle size={32} color="#ffffff" />}
                    color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                />

                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Investigación de Accidente - ${shareItem?.victimaNombre || ''}`} text={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⚠️ Gravedad: ${shareItem.gravedad}` : ''} rawMessage={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}` : ''} elementIdToPrint="pdf-content" fileName={`Accidente_${shareItem?.victimaNombre || 'Reporte'}.pdf`} />
                <div style={{ position: 'absolute', left: 0, opacity: 0.01, top: '-9999px', pointerEvents: 'none' }}>
                    {shareItem && <AccidentPdfGenerator report={{...shareItem, id: shareItem.id || Date.now()}} isHeadless={true} />}
                </div>

                <main style={{ padding: '0 0 2rem 0', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    {/* Botones de Navegación */}
                    <div style={{ display: 'flex', gap: '1rem', padding: '0 1rem', marginBottom: '1rem' }}>
                        <button
                            onClick={() => navigate('/', { state: { scrollTo: 'accident-investigation' } })}
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
                            {history.length > 0 && (
                                <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff' }}>
                                    <Download size={14} /> EXCEL
                                </button>
                            )}
                            <button onClick={() => setIsFormVisible(true)} className="btn-primary hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', width: 'auto', margin: 0, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                                <Plus size={18} /> NUEVA INVESTIGACIÓN
                            </button>
                        </div>
                    </div>

                <DataTable
                    data={history}
                    columns={columns}
                    searchPlaceholder="Buscar por empleado, empresa o gravedad..."
                    searchFields={['victimaNombre', 'empresa', 'gravedad', 'lesion']}
                    emptyMessage="No hay investigaciones registradas."
                    emptyIcon={<FileText size={48} />}
                />
                </main>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '6rem', paddingTop: '5.5rem' }}>
            <PremiumHeader 
                title={isEdit ? 'Editar Investigación' : 'Investigación de Accidente'}
                subtitle="Metodología Árbol de Causas"
                icon={<AlertTriangle />}
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
                {/* Actualización Normativa */}
                <div style={{
                    marginBottom: '2.5rem', padding: '1.25rem', borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(8,145,178,0.1), rgba(6,182,212,0.05))',
                    border: '1px solid rgba(8,145,178,0.2)', display: 'flex', gap: '1rem', alignItems: 'flex-start'
                }}>
                    <Sparkles size={24} color="#0891b2" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.4rem', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 800 }}>
                            Metodología Avalada: Res. SRT 7/2026 y Dec. 549/2025
                        </h4>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                            El presente análisis de causas y recolección testimonial se estructura para conformar prueba sólida frente a Comisiones Médicas, cumpliendo exigencias del Nuevo Protocolo de Valoración del Daño Corporal y nuevo baremo vigente.
                        </p>
                    </div>
                </div>

                {/* Stepper */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'var(--glass-border)', zIndex: 0, transform: 'translateY(-50%)' }} />
                    {SECTIONS.map((section, index) => (
                        <div key={index} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '0.5rem',
                            cursor: 'pointer'
                        }} onClick={() => setCurrentStep(index)}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: currentStep >= index ? 'var(--color-primary)' : 'var(--gradient-card)',
                                border: `2px solid ${currentStep >= index ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                                color: currentStep >= index ? '#fff' : 'var(--color-text-muted)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.3s'
                            }}>
                                {currentStep > index ? <CheckCircle2 size={16} /> : index + 1}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: currentStep === index ? 700 : 500, color: currentStep === index ? 'var(--color-text)' : 'var(--color-text-muted)', textAlign: 'center', maxWidth: '80px', display: 'none' }} className="sm:inline">{section}</span>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ flex: 1, padding: '2.5rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)', borderRadius: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', color: 'var(--color-primary)' }}>
                        {SECTIONS[currentStep]}
                    </h2>

                    {currentStep === 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>Fecha del Suceso</label>
                                <input type="date" value={formData.fecha} onChange={e => handleInputChange('fecha', e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Hora Aprox.</label>
                                <input type="time" value={formData.hora} onChange={e => handleInputChange('hora', e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Razón Social / Empresa</label>
                                <input type="text" placeholder="Ej. Constructora SRL" value={formData.empresa} onChange={e => handleInputChange('empresa', e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Ubicación / Sector</label>
                                <input type="text" placeholder="Ej. Obra Centro, Sector Hormigonado" value={formData.ubicacion} onChange={e => handleInputChange('ubicacion', e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Gravedad Estimada</label>
                                <select value={formData.gravedad} onChange={e => handleInputChange('gravedad', e.target.value)} style={inputStyle}>
                                    <option value="Leve">Leve (Sin baja)</option>
                                    <option value="Moderado">Moderado (Con baja médica corta)</option>
                                    <option value="Grave">Grave (Internación, amputaciones)</option>
                                    <option value="Mortal">Mortal</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Nombre del Accidentado</label>
                                <input type="text" placeholder="Nombre completo" value={formData.victimaNombre} onChange={e => handleInputChange('victimaNombre', e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>DNI / CUIL</label>
                                <input type="text" placeholder="Sin guiones" value={formData.victimaDni} onChange={e => handleInputChange('victimaDni', e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Puesto / Tarea</label>
                                <input type="text" placeholder="Ej. Oficial Albañil" value={formData.victimaPuesto} onChange={e => handleInputChange('victimaPuesto', e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Antigüedad en el puesto</label>
                                <input type="text" placeholder="Ej. 2 años" value={formData.victimaAntiguedad} onChange={e => handleInputChange('victimaAntiguedad', e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Tipo de Lesión</label>
                                <input type="text" placeholder="Ej. Corte profundo, contusión, fractura..." value={formData.lesion} onChange={e => handleInputChange('lesion', e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Parte del Cuerpo Afectada</label>
                                <input type="text" placeholder="Ej. Mano derecha indíce" value={formData.parteCuerpo} onChange={e => handleInputChange('parteCuerpo', e.target.value)} style={inputStyle} />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>Descripción detallada del Hecho (¿Qué pasó?)</label>
                                <textarea
                                    style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                                    placeholder="Relato detallado de cómo ocurrió el accidente, basado en los testimonios y evidencias iniciales..."
                                    value={formData.descripcionHecho}
                                    onChange={e => handleInputChange('descripcionHecho', e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-primary)' }}>Testigos del Hecho</h3>
                                <button className="btn-outline hover-lift" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '10px' }} onClick={() => addArrayItem('testigos', { nombre: '', declaracion: '' })}>
                                    <UserPlus size={16} /> Añadir Testigo
                                </button>
                            </div>

                            {formData.testigos.map((t: any, i: number) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)', position: 'relative' }}>
                                    {formData.testigos.length > 1 && (
                                        <button
                                            onClick={() => removeArrayItem('testigos', i)}
                                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                                            title="Eliminar Testigo"
                                        >
                                            <Trash2 size={16}  />
                        </button>
                                    )}
                                    <label style={labelStyle}>Nombre del Testigo {i + 1}</label>
                                    <input type="text" placeholder="Nombre completo o cargo" value={t.nombre} onChange={e => handleArrayChange('testigos', i, 'nombre', e.target.value)} style={{ ...inputStyle, marginBottom: '1rem' }} />
                                    
                                    <label style={labelStyle}>Declaración Breve</label>
                                    <textarea placeholder="Lo que presenció..." value={t.declaracion} onChange={e => handleArrayChange('testigos', i, 'declaracion', e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                                </div>
                            ))}
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#3b82f6' }}>
                                    <Search size={20} /> Metodología de los "5 Porqués"
                                </div>
                                Técnica sistemática para iterar preguntando "¿Por qué ocurrió?" hasta llegar a la causa raíz sistémica o de gestión, evitando culpar únicamente al error humano.
                            </div>

                            <div>
                                <label style={labelStyle}>El Problema (Efecto Final)</label>
                                <input type="text" placeholder="Ej. El trabajador se cortó la mano con la amoladora" value={formData.problemaCentral} onChange={e => handleInputChange('problemaCentral', e.target.value)} style={{ ...inputStyle, fontWeight: 'bold' }} />
                            </div>

                            <div style={{ marginTop: '1rem', borderLeft: '3px solid var(--color-primary)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {formData.porques.map((pq: string, i: number) => (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                        <label style={{ ...labelStyle, color: 'var(--color-primary)' }}>¿Por qué? (Nivel {i + 1})</label>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <input type="text" placeholder="Respuesta al porqué anterior..." value={pq} onChange={e => handleArrayChange('porques', i, null, e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                                            {formData.porques.length > 1 && (
                                                <button
                                                    onClick={() => removeArrayItem('porques', i)}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.8rem', borderRadius: '12px', cursor: 'pointer', flexShrink: 0 }}
                                                    title="Eliminar Porqué"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {formData.porques.length < 5 && (
                                    <button className="btn-outline hover-lift" style={{ padding: '0.8rem', fontSize: '0.85rem', alignSelf: 'flex-start', borderRadius: '10px' }} onClick={() => addArrayItem('porques', '')}>
                                        <ListPlus size={16} /> Preguntar otro "¿Por qué?"
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                En base a la causa raíz detectada, defina el Plan de Acción Correctivo/Preventivo para asegurar que no vuelva a ocurrir.
                            </p>

                            {formData.medidas.map((m: any, i: number) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)', position: 'relative' }}>
                                    {formData.medidas.length > 1 && (
                                        <button
                                            onClick={() => removeArrayItem('medidas', i)}
                                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                                            title="Eliminar Medida"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Acción Correctiva / Preventiva</label>
                                        <input type="text" placeholder="Ej. Instalar guardas fijas, dar capacitación" value={m.accion} onChange={e => handleArrayChange('medidas', i, 'accion', e.target.value)} style={inputStyle} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={labelStyle}>Responsable</label>
                                            <input type="text" placeholder="Ej. Jefe de Mantenimiento" value={m.responsable} onChange={e => handleArrayChange('medidas', i, 'responsable', e.target.value)} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Fecha Límite</label>
                                            <input type="date" value={m.fechaLimite} onChange={e => handleArrayChange('medidas', i, 'fechaLimite', e.target.value)} style={inputStyle} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button className="btn-outline hover-lift" style={{ padding: '0.8rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center', borderRadius: '12px' }} onClick={() => addArrayItem('medidas', { accion: '', responsable: '', fechaLimite: '' })}>
                                <Plus size={16} /> Añadir otra Medida
                            </button>
                        </div>
                    )}
                </div>

                {/* Navegación Inferior Responsive */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn-outline"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        style={{ opacity: currentStep === 0 ? 0.4 : 1, flex: 1, minWidth: '120px', background: 'var(--color-surface)', margin: 0, borderRadius: '12px', padding: '0.8rem' }}
                    >
                        <ChevronLeft size={20} /> Atrás
                    </button>

                    {currentStep < SECTIONS.length - 1 && (
                        <button className="btn-primary hover-lift" onClick={handleNext} style={{ margin: 0, flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '12px', padding: '0.8rem' }}>
                            Siguiente <ChevronRight size={20} />
                        </button>
                    )}
                </div>

                {/* Firmas y Autorizaciones */}
                <div className="card animate-fade-in" style={{ marginTop: '3rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                        <Pencil size={22} style={{ color: 'var(--color-primary)' }} /> Firmas y Autorizaciones
                    </h3>

                    <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {[
                                { id: 'operator', label: 'Accidentado / Testigo' },
                                { id: 'professional', label: 'Profesional HYS' },
                                { id: 'supervisor', label: 'Supervisor / Empleador' }
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

                    <div style={{ marginBottom: '2.5rem' }}>
                        <PdfSignatures
                            data={{
                                ...formData,
                                professionalSignature: professional.signature,
                                professionalName: professional.name,
                                professionalLicense: professional.license,
                                professionalStamp: professional.stamp
                            }}
                            box1={showSignatures.operator ? {
                                title: 'ACCIDENTADO / TESTIGO',
                                subtitle: 'Declaración y firma',
                                signatureUrl: formData.operatorSignature || null,
                                isProfessional: false
                            } : null}
                            box2={showSignatures.professional ? {
                                title: 'PROFESIONAL H&S',
                                subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                signatureUrl: formData.professionalSignature || professional.signature || null,
                                stampUrl: formData.professionalStamp || professional.stamp || null,
                                isProfessional: true,
                                license: professional.license
                            } : null}
                            box3={showSignatures.supervisor ? {
                                title: 'SUPERVISOR / EMPLEADOR',
                                subtitle: 'Validación del informe',
                                signatureUrl: formData.supervisorSignature || formData.signature || null,
                                isProfessional: false
                            } : null}
                        />
                    </div>

                    <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {showSignatures.operator && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas 
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                    initialImage={formData.operatorSignature}
                                    title="Firma del Accidentado / Testigo"
                                />
                            </div>
                        )}
                        
                        {showSignatures.professional && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas 
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                    initialImage={formData.professionalSignature || professional.signature}
                                    title="Firma de Profesional Actuante"
                                />
                            </div>
                        )}

                        {showSignatures.supervisor && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas 
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                                    initialImage={formData.supervisorSignature || formData.signature}
                                    title="Firma de Supervisor / Empleador"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <div className="no-print floating-action-bar">
                <button
                    onClick={handleSave}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: '#ffffff' }}
                >
                    <Save size={18} /> GUARDAR
                </button>
            </div>
        </div>
    );
}
