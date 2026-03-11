import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Printer,
    ShieldCheck, Building2, User, Calendar,
    CheckCircle2, AlertCircle, HelpCircle, Pencil, Info, Share2, Sparkles, Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSync } from '../contexts/SyncContext';
import ShareModal from '../components/ShareModal';
import ATSPdfGenerator from '../components/ATSPdfGenerator';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { API_BASE_URL } from '../config';

const printStyles = `
@media print {
    .no-print { display: none !important; }
    .print-area { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
    .checklist-print-box { display: flex !important; gap: 4px !important; }
}
`;

const defaultChecklist = [
    // General
    { id: 1, categoria: 'General', pregunta: '¿Se cuenta con el Programa de Seguridad aprobado por ART?', estado: 'Cumple', observaciones: '' },
    { id: 2, categoria: 'General', pregunta: '¿Se realizó charla de seguridad previa a la tarea (5 min)?', estado: 'Cumple', observaciones: '' },
    { id: 3, categoria: 'General', pregunta: '¿La zona de trabajo está señalizada y delimitada?', estado: 'Cumple', observaciones: '' },
    { id: 4, categoria: 'General', pregunta: '¿Se verificó el estado de máquinas y herramientas a utilizar?', estado: 'Cumple', observaciones: '' },
    { id: 5, categoria: 'General', pregunta: '¿El personal fue capacitado para esta tarea específica?', estado: 'Cumple', observaciones: '' },

    // EPP y Calzado
    { id: 6, categoria: 'EPP y Calzado', pregunta: '¿Se dispone de los EPP necesarios (Casco, Anteojos, Guantes)?', estado: 'Cumple', observaciones: '' },
    { id: 7, categoria: 'EPP y Calzado', pregunta: '¿El calzado de seguridad es el adecuado para el terreno/riesgo?', estado: 'Cumple', observaciones: '' },
    { id: 8, categoria: 'EPP y Calzado', pregunta: '¿Los EPP se encuentran en buen estado de conservación?', estado: 'Cumple', observaciones: '' },

    // Instalaciones Eléctricas
    { id: 9, categoria: 'Instalaciones Eléctricas', pregunta: '¿El tablero eléctrico cuenta con disyuntor y térmicas?', estado: 'Cumple', observaciones: '' },
    { id: 10, categoria: 'Instalaciones Eléctricas', pregunta: '¿Se verificó la puesta a tierra de los equipos?', estado: 'Cumple', observaciones: '' },
    { id: 11, categoria: 'Instalaciones Eléctricas', pregunta: '¿Los cables y prolongaciones están sin empalmes precarios?', estado: 'Cumple', observaciones: '' },

    // Trabajo en Altura
    { id: 12, categoria: 'Trabajo en Altura', pregunta: '¿Se utiliza arnés de seguridad de cuerpo completo (si >2m)?', estado: 'N/A', observaciones: '' },
    { id: 13, categoria: 'Trabajo en Altura', pregunta: '¿El punto de anclaje es estructural y lo suficientemente fuerte?', estado: 'N/A', observaciones: '' },
    { id: 14, categoria: 'Trabajo en Altura', pregunta: '¿Las escaleras/andamios están nivelados y asegurados?', estado: 'N/A', observaciones: '' },
    { id: 15, categoria: 'Trabajo en Altura', pregunta: '¿Se ha delimitado el área inferior para evitar golpes por caída de objetos?', estado: 'N/A', observaciones: '' },

    // Orden y Limpieza
    { id: 16, categoria: 'Orden y Limpieza', pregunta: '¿Se mantienen los pasillos y vías de escape despejadas?', estado: 'Cumple', observaciones: '' },
    { id: 17, categoria: 'Orden y Limpieza', pregunta: '¿Existen recipientes para la disposición de residuos?', estado: 'Cumple', observaciones: '' },
    { id: 18, categoria: 'Orden y Limpieza', pregunta: '¿Se almacenan los materiales de forma estable y segura?', estado: 'Cumple', observaciones: '' },
    { id: 19, categoria: 'Orden y Limpieza', pregunta: '¿Se dispone de iluminación adecuada en el área?', estado: 'Cumple', observaciones: '' }
];

export default function ATS() {
    const navigate = useNavigate();
    const location = useLocation();
    const { requirePro } = usePaywall();
    const { syncCollection } = useSync();
    useDocumentTitle('Análisis de Trabajo Seguro (ATS)');
    const capatazCanvasRef = useRef(null);
    const [isDrawingCapataz, setIsDrawingCapataz] = useState(false);

    // State
    const [formData, setFormData] = useState({
        empresa: '',
        cuit: '',
        obra: '',
        fecha: new Date().toISOString().split('T')[0],
        capatazNombre: '',
        checklist: defaultChecklist,
        tareas: [
            { id: 1, paso: 'Preparación de área', riesgo: 'Caídas', control: 'Delimitación', realizado: true },
            { id: 2, paso: 'Ejecución de tarea', riesgo: 'Golpes', control: 'Uso de EPP', realizado: false },
        ]
    });

    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

    const [showShare, setShowShare] = useState(false);
    const [isGeneratingATS, setIsGeneratingATS] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiTaskInput, setAiTaskInput] = useState('');

    const handleGenerateAI = () => {
        setAiTaskInput('');
        setShowAIModal(true);
    };

    const runAIGeneration = async () => {
        const taskTitle = aiTaskInput.trim();
        if (!taskTitle) return;
        setShowAIModal(false);

        setIsGeneratingATS(true);
        const loadingToast = toast.loading('Calculando pasos, riesgos y protocolos...');

        try {
            const res = await fetch(`${API_BASE_URL}/api/ai-ats-generator`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskTitle })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Fallo en la conexión');
            }

            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('La respuesta de la IA no tiene el formato correcto');
            }

            // Map AI result to internal task structure
            const newTasks = data.map((item, index) => ({
                id: Date.now() + index,
                paso: item.paso || '',
                riesgo: item.riesgo || '',
                control: item.control || '',
                realizado: false
            }));

            setFormData(prev => ({
                ...prev,
                tareas: newTasks
            }));

            toast.success('ATS Autocompletado con IA ✨', { id: loadingToast });
        } catch (error) {
            console.error('Error generating ATS:', error);
            toast.error(`Error al generar: ${error.message}`, { id: loadingToast });
        } finally {
            setIsGeneratingATS(false);
        }
    };

    const [professional, setProfessional] = useState({
        name: 'Juan Pérez',
        license: '',
        signature: null
    });

    // Cargar datos de edición si existen
    useEffect(() => {
        if (location.state?.editData) {
            setFormData(location.state.editData);
        }
    }, [location.state]);

    // Cargar datos del profesional
    useEffect(() => {
        const savedData = localStorage.getItem('personalData');
        const savedSigData = localStorage.getItem('signatureStampData');
        const legacySignature = localStorage.getItem('capturedSignature');

        let signature = legacySignature || null;
        if (savedSigData) {
            const parsed = JSON.parse(savedSigData);
            signature = parsed.signature || signature;
        }

        if (savedData) {
            const data = JSON.parse(savedData);
            setProfessional({
                name: data.name || 'Juan Pérez',
                license: data.license || '',
                signature: signature
            });
        } else {
            setProfessional(prev => ({ ...prev, signature }));
        }
    }, []);

    const startDrawing = (e) => {
        setIsDrawingCapataz(true);
        draw(e);
    };

    const draw = (e) => {
        if (!isDrawingCapataz) return;
        const canvas = capatazCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        let x, y;
        if (e.touches) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'var(--color-text)';

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearCapatazSignature = () => {
        const canvas = capatazCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
    };

    const updateChecklist = (id, field, value) => {
        const newList = formData.checklist.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        setFormData({ ...formData, checklist: newList });
    };

    const addQuestion = (categoria) => {
        const newId = Math.max(0, ...formData.checklist.map(i => i.id)) + 1;
        const newQuestion = { id: newId, categoria, pregunta: 'Nueva Pregunta', estado: 'Cumple', observaciones: '' };
        setFormData({ ...formData, checklist: [...formData.checklist, newQuestion] });
    };

    const removeQuestion = (id) => {
        setFormData({
            ...formData,
            checklist: formData.checklist.filter(item => item.id !== id)
        });
    };

    const updateTask = (id, field, value) => {
        const newTasks = formData.tareas.map(t =>
            t.id === id ? { ...t, [field]: value } : t
        );
        setFormData({ ...formData, tareas: newTasks });
    };

    const addTask = () => {
        const newId = Math.max(0, ...formData.tareas.map(t => t.id)) + 1;
        const newTask = { id: newId, paso: '', riesgo: '', control: '', realizado: false };
        setFormData({ ...formData, tareas: [...formData.tareas, newTask] });
    };

    const removeTask = (id) => {
        setFormData({
            ...formData,
            tareas: formData.tareas.filter(t => t.id !== id)
        });
    };

    const updateCategoryName = (oldName, newName) => {
        if (!newName.trim() || oldName === newName) return;
        const newList = formData.checklist.map(item =>
            item.categoria === oldName ? { ...item, categoria: newName } : item
        );
        setFormData({ ...formData, checklist: newList });
    };

    const handleSave = async () => {
        requirePro(async () => {
            const historyRaw = localStorage.getItem('ats_history');
            const history = historyRaw ? JSON.parse(historyRaw) : [];
            const entryId = formData.id || Date.now().toString();
            const newEntry = {
                ...formData,
                id: entryId,
                capatazSignature: capatazCanvasRef.current?.toDataURL() || null,
                professionalSignature: professional.signature,
                professionalName: professional.name,
                professionalLicense: professional.license
            };

            let updated;
            if (formData.id) {
                updated = history.map(h => h.id === entryId ? newEntry : h);
            } else {
                updated = [newEntry, ...history];
            }

            localStorage.setItem('ats_history', JSON.stringify(updated));
            await syncCollection('ats_history', updated);
            toast.success('Análisis de Trabajo Seguro guardado con éxito');
            navigate('/ats-history');
        });
    };

    const handlePrint = () => requirePro(() => window.print());
    const handleShare = () => requirePro(() => setShowShare(true));

    // Grouping checklist by category
    const categories = [...new Set(formData.checklist.map(i => i.categoria))];

    return (
        <>
            <style>{printStyles}</style>
            <div className="container" style={{ maxWidth: '1200px', paddingBottom: '12rem' }}>
                <ShareModal
                    open={showShare}
                    onClose={() => setShowShare(false)}
                    title={`ATS – ${formData.empresa}`}
                    text={`📋 Análisis de Trabajo Seguro\n🏗️ Empresa: ${formData.empresa}\n🚧 Obra: ${formData.obra}\n📅 Fecha: ${formData.fecha}\n👷 Responsable: ${formData.capatazNombre}\n\nGenerado con Asistente HYS`}
                    elementIdToPrint="pdf-content"
                />

                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    <ATSPdfGenerator atsData={formData} />
                </div>

                {/* Floating Action Buttons */}
                <div className="no-print floating-action-bar">
                    <button
                        onClick={handleSave}
                        className="btn-floating-action"
                        style={{ background: '#36B37E', color: '#ffffff' }}
                    >
                        <Save size={18} /> GUARDAR
                    </button>
                    <button
                        onClick={handleShare}
                        className="btn-floating-action"
                        style={{ background: '#0052CC', color: '#ffffff' }}
                    >
                        <Share2 size={18} /> COMPARTIR
                    </button>
                    <button
                        onClick={handlePrint}
                        className="btn-floating-action"
                        style={{ background: '#FF8B00', color: '#ffffff' }}
                    >
                        <Printer size={18} /> IMPRIMIR PDF
                    </button>
                </div>


                <div className="no-print" style={{
                    marginBottom: '2rem',
                    padding: '2.5rem',
                    background: 'var(--color-surface)',
                    borderRadius: '24px',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '2rem',
                    alignItems: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button onClick={() => navigate(-1)} style={{ padding: '0.6rem', background: 'var(--color-background)', borderRadius: '12px', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex' }}>
                            <ArrowLeft size={22} />
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <ShieldCheck className="text-blue-600" size={32} />
                                Análisis de Trabajo Seguro
                            </h1>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Control HYS</p>
                        </div>
                    </div>
                </div>

                <div id="pdf-content" className="card print-area" style={{ width: '100%', maxWidth: '950px', boxSizing: 'border-box', padding: '1rem', smPadding: '3rem', margin: '0 auto' }}>

                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%', gap: '1.5rem' }}>
                        {/* Top Left Text */}
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text)' }}>Control HYS</p>
                        </div>

                        {/* Center Main Title */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.5rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1 }}>A.T.S.</h1>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '0.25rem' }}>Análisis de Trabajo Seguro</p>
                        </div>

                        {/* Right Document Counter */}
                        <div style={{ flex: 1, textAlign: 'right' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--color-border)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>PÁGINA</div>
                            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--color-text)' }}>01 / 01</div>
                        </div>
                    </div>

                    <div style={{ border: '2px solid var(--color-border)', borderRadius: '12px', marginBottom: '2.5rem', width: '100%', overflow: 'hidden' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ borderBottom: '2px solid var(--color-border)', width: '100%' }}>
                            <div className="sm:col-span-2 print:col-span-2"><DocBox label="CLIENTE / EMPRESA" value={formData.empresa} onChange={v => setFormData({ ...formData, empresa: v })} large /></div>
                            <div className="sm:col-span-1 print:col-span-1"><DocBox label="CUIT / CUIL" value={formData.cuit} onChange={v => setFormData({ ...formData, cuit: v })} borderLeft /></div>
                            <div className="sm:col-span-1 print:col-span-1"><DocBox label="UBICACIÓN / OBRA" value={formData.obra} onChange={v => setFormData({ ...formData, obra: v })} borderLeft /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%' }}>
                            <div className="sm:col-span-1 print:col-span-1"><DocBox label="FECHA" value={formData.fecha} onChange={v => setFormData({ ...formData, fecha: v })} type="date" /></div>
                            <div className="sm:col-span-1 print:col-span-1"><DocBox label="RESPONSABLE" value={formData.capatazNombre} onChange={v => setFormData({ ...formData, capatazNombre: v })} borderLeft /></div>
                            <div className="sm:col-span-2 print:col-span-2"><DocBox label="PROFESIONAL HYS" value={professional.name} onChange={() => { }} borderLeft /></div>
                        </div>
                    </div>

                    {/* Sección de Secuencia de Tareas */}
                    <div style={{ marginTop: '3rem', marginBottom: '3rem' }}>
                        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <Pencil size={22} /> Secuencia de Tareas
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={handleGenerateAI}
                                    disabled={isGeneratingATS}
                                    style={{ flex: 1, minWidth: '120px', padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.75rem', cursor: isGeneratingATS ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 4px 15px rgba(236,72,153,0.3)', opacity: isGeneratingATS ? 0.7 : 1 }}
                                >
                                    {isGeneratingATS ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    {isGeneratingATS ? 'PENSANDO...' : 'IA MÁGICA'}
                                </button>
                                <button
                                    onClick={addTask}
                                    style={{ flex: 1, minWidth: '120px', padding: '0.6rem 1.2rem', background: '#36B37E', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Plus size={16} /> AGREGAR PASO
                                </button>
                            </div>
                        </div>
                        <h3 className="print-only" style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <Pencil size={22} /> Secuencia de Tareas (Análisis)
                        </h3>

                        <div style={{ border: '2px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden' }}>
                            {/* Table Header - Only Desktop/Print */}
                            <div className="hidden sm:flex print:flex" style={{ background: 'var(--color-background)', borderBottom: '2px solid var(--color-border)', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                <div style={{ padding: '1rem', flex: 3, borderRight: '1px solid var(--color-border)' }}>Paso</div>
                                <div style={{ padding: '1rem', flex: 3, borderRight: '1px solid var(--color-border)' }}>Riesgos</div>
                                <div style={{ padding: '1rem', flex: 4 }}>Controles</div>
                                <div className="no-print" style={{ width: '50px' }}></div>
                            </div>

                            {/* Table Body / Mobile Cards */}
                            <div className="flex flex-col">
                                {formData.tareas.map((t) => (
                                    <div key={t.id} className="flex flex-col sm:flex-row print:flex-row border-b border-[var(--color-border)] last:border-0">
                                        {/* Paso */}
                                        <div className="flex-1 sm:flex-[3] print:flex-[3] px-2 py-4 sm:p-4 sm:border-r print:border-r border-[var(--color-border)]">
                                            <span className="sm:hidden print:hidden block text-[0.6rem] font-black text-blue-600 uppercase mb-1">Paso:</span>
                                            <textarea
                                                rows={1}
                                                value={t.paso}
                                                onChange={(e) => updateTask(t.id, 'paso', e.target.value)}
                                                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                                                className="no-print"
                                                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', fontWeight: 700, overflow: 'hidden', fontSize: '0.9rem' }}
                                                placeholder="Ej: Preparación de área..."
                                            />
                                            <div className="print-only font-bold text-slate-800 text-[0.85rem] whitespace-pre-wrap break-words">
                                                {t.paso}
                                            </div>
                                        </div>

                                        {/* Riesgo */}
                                        <div className="flex-1 sm:flex-[3] print:flex-[3] px-2 py-4 sm:p-4 sm:border-r print:border-r border-[var(--color-border)] bg-slate-50/30 sm:bg-transparent">
                                            <span className="sm:hidden print:hidden block text-[0.6rem] font-black text-blue-600 uppercase mb-1">Riesgos:</span>
                                            <textarea
                                                rows={1}
                                                value={t.riesgo}
                                                onChange={(e) => updateTask(t.id, 'riesgo', e.target.value)}
                                                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                                                className="no-print"
                                                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', overflow: 'hidden', fontSize: '0.85rem' }}
                                                placeholder="Ej: Caídas, Golpes..."
                                            />
                                            <div className="print-only text-slate-700 text-[0.8rem] whitespace-pre-wrap break-words">
                                                {t.riesgo}
                                            </div>
                                        </div>

                                        {/* Control */}
                                        <div className="flex-1 sm:flex-[4] print:flex-[4] px-2 py-4 sm:p-4">
                                            <span className="sm:hidden print:hidden block text-[0.6rem] font-black text-blue-600 uppercase mb-1">Controles:</span>
                                            <textarea
                                                rows={1}
                                                value={t.control}
                                                onChange={(e) => updateTask(t.id, 'control', e.target.value)}
                                                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                                                className="no-print"
                                                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', overflow: 'hidden', fontSize: '0.85rem' }}
                                                placeholder="Ej: Delimitación, Uso EPP..."
                                            />
                                            <div className="print-only text-slate-700 text-[0.8rem] whitespace-pre-wrap break-words">
                                                {t.control}
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <div className="no-print flex items-center justify-end border-t sm:border-t-0 sm:border-l border-[var(--color-border)] px-2 py-1 sm:py-0" style={{ width: 'auto', minWidth: '40px' }}>
                                            <button
                                                onClick={() => {
                                                    const toastId = toast(
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                            <span style={{ fontSize: '0.9rem' }}>¿Eliminar este paso?</span>
                                                            <button
                                                                onClick={() => { removeTask(t.id); toast.dismiss(toastId); }}
                                                                style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem' }}
                                                            >Eliminar</button>
                                                        </div>,
                                                        { duration: 4000, icon: '🗑️' }
                                                    );
                                                }}
                                                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Eliminar paso"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <ShieldCheck size={24} /> Verificación de Seguridad
                        </h3>

                        {categories.map(cat => (
                            <div key={cat} className="card mt-10 mb-10" style={{ padding: 0, border: '2px solid var(--color-border)' }}>
                                <div style={{ background: 'var(--color-background)', padding: '1.2rem', borderBottom: '2px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0, color: 'var(--color-text)', fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Info size={18} className="text-blue-600" />
                                        <span
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => updateCategoryName(cat, e.target.innerText)}
                                            style={{ outline: 'none', borderBottom: '1px dashed transparent' }}
                                        >
                                            {cat}
                                        </span>
                                    </h4>
                                    <button
                                        className="no-print"
                                        onClick={() => addQuestion(cat)}
                                        style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}
                                    >
                                        + AGREGAR PUNTO
                                    </button>
                                </div>

                                <div className="w-full flex-col">
                                    {formData.checklist.filter(i => i.categoria === cat).map((item) => (
                                        <div key={item.id} className="group border-b border-slate-200" style={{ padding: '0.75rem 1rem' }}>
                                            {/* Question text */}
                                            <div
                                                contentEditable
                                                suppressContentEditableWarning
                                                onBlur={(e) => updateChecklist(item.id, 'pregunta', e.target.innerText)}
                                                className="font-bold text-slate-800 text-[0.9rem] outline-none border-b border-dashed border-transparent focus:border-[var(--color-primary)] leading-tight"
                                                style={{ marginBottom: '0.5rem' }}
                                            >
                                                {item.pregunta}
                                            </div>

                                            {/* Observaciones */}
                                            <textarea
                                                rows={1}
                                                placeholder="Observaciones / Medidas tomadas..."
                                                value={item.observaciones}
                                                className="no-print block overflow-hidden"
                                                onInput={(e) => {
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                }}
                                                onChange={(e) => updateChecklist(item.id, 'observaciones', e.target.value)}
                                                style={{ margin: '0 0 0.6rem 0', padding: '0.4rem', fontSize: '0.7rem', background: 'transparent', border: '1px solid #efefef', borderRadius: '4px', width: '100%', boxSizing: 'border-box', color: 'var(--color-text-muted)', resize: 'none', minHeight: '30px' }}
                                            />
                                            <div className="print-only text-[0.7rem] text-slate-500 whitespace-pre-wrap break-words mb-1">
                                                {item.observaciones || ''}
                                            </div>

                                            {/* Bottom row: status buttons + delete */}
                                            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'nowrap' }}>
                                                <div className="checklist-status-buttons" style={{ justifyContent: 'flex-start', flexShrink: 0 }}>
                                                    <StatusBtn active={item.estado === 'Cumple'} type="OK" onClick={() => updateChecklist(item.id, 'estado', 'Cumple')} label="SI" />
                                                    <StatusBtn active={item.estado === 'No Cumple'} type="FAIL" onClick={() => updateChecklist(item.id, 'estado', 'No Cumple')} label="NO" />
                                                    <StatusBtn active={item.estado === 'N/A'} type="NA" onClick={() => updateChecklist(item.id, 'estado', 'N/A')} label="NA" />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const toastId = toast(
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                                <span style={{ fontSize: '0.9rem' }}>¿Eliminar este punto?</span>
                                                                <button
                                                                    onClick={() => { removeQuestion(item.id); toast.dismiss(toastId); }}
                                                                    style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem' }}
                                                                >Sí</button>
                                                            </div>,
                                                            { duration: 4000, icon: '🗑️' }
                                                        );
                                                    }}
                                                    style={{ flexShrink: 0, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', padding: '0.3rem 0.5rem', display: 'flex', alignItems: 'center' }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                            {/* Vista de Impresión Reforzada */}
                                            <div className="checklist-print-box hidden print:flex gap-1" style={{ flexShrink: 0 }}>
                                                {['SI', 'NO', 'NA'].map((label) => {
                                                    const isSelected = (label === 'SI' && (item.estado === 'Cumple' || item.estado === 'SI')) ||
                                                                     (label === 'NO' && (item.estado === 'No Cumple' || item.estado === 'NO')) ||
                                                                     (label === 'NA' && (item.estado === 'N/A' || item.estado === 'NA'));
                                                    
                                                    return (
                                                        <div key={label} style={{
                                                            width: '35px',
                                                            height: '24px',
                                                            border: isSelected ? '2.5px solid #000' : '1px solid #94a3b8',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.65rem',
                                                            fontWeight: isSelected ? 900 : 400,
                                                            color: isSelected ? '#000' : '#94a3b8',
                                                            background: 'transparent',
                                                            WebkitPrintColorAdjust: 'exact'
                                                        }}>
                                                            {isSelected ? 'X' : ''}
                                                            <span style={{ fontSize: '0.5rem', marginLeft: '2px', opacity: isSelected ? 1 : 0.6 }}>{label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <Pencil size={24} /> Firmas y Autorizaciones
                        </h3>

                        <div className="no-print mb-8 p-6 bg-slate-50/5 border border-[var(--color-border)] rounded-xl w-full flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center text-sm font-bold text-slate-700">
                            <div className="text-center">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div className="flex gap-4 flex-wrap justify-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={showSignatures.operator} onChange={e => setShowSignatures(s => ({ ...s, operator: e.target.checked }))} className="w-5 h-5 accent-blue-600" /> Operador
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={showSignatures.supervisor} onChange={e => setShowSignatures(s => ({ ...s, supervisor: e.target.checked }))} className="w-5 h-5 accent-blue-600" /> Supervisor
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={showSignatures.professional} onChange={e => setShowSignatures(s => ({ ...s, professional: e.target.checked }))} className="w-5 h-5 accent-blue-600" /> Profesional
                                </label>
                            </div>
                        </div>

                        <div className="signature-container-row">
                            {showSignatures.operator && (
                                <div className="signature-item-box">
                                    <div className="signature-line"></div>
                                    <p className="text-[0.6rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">OPERADOR / CAPATAZ</p>
                                    <p className="text-[0.8rem] font-black uppercase text-black leading-none break-words min-h-[0.8rem]">{formData.capatazNombre || ' '}</p>
                                    <p className="text-[0.5rem] font-bold text-blue-600 uppercase tracking-tighter mt-1" style={{ color: 'var(--color-primary)' }}>Firma / Aclaración</p>
                                </div>
                            )}

                            {showSignatures.supervisor && (
                                <div className="signature-item-box">
                                    <div className="no-print flex flex-col items-center w-full mb-4">
                                        <label className="text-xs font-semibold mb-1 text-slate-400">Firma Digital (Supervisor)</label>
                                        <canvas
                                            ref={capatazCanvasRef}
                                            width={400}
                                            height={120}
                                            className="w-full h-[100px] border border-dashed border-slate-200 rounded-lg bg-white touch-none"
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={() => setIsDrawingCapataz(false)}
                                            onMouseLeave={() => setIsDrawingCapataz(false)}
                                        />
                                        <button type="button" onClick={clearCapatazSignature} className="mt-1 text-[0.6rem] text-red-500 underline hover:text-red-700 bg-transparent border-none cursor-pointer">Limpiar</button>
                                    </div>
                                    <div className="signature-line"></div>
                                    <p className="text-[0.6rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">SUPERVISOR / JEFE OBRA</p>
                                    <p className="text-[0.8rem] font-black uppercase text-black leading-none min-h-[0.8rem]">Firma del Supervisor</p>
                                    <p className="text-[0.5rem] font-bold text-blue-600 uppercase tracking-tighter mt-1" style={{ color: 'var(--color-primary)' }}>Validación / Sello</p>
                                </div>
                            )}

                            {showSignatures.professional && (
                                <div className="signature-item-box">
                                    <div className="flex flex-col items-center justify-center gap-2 mb-4 w-full h-[100px]">
                                        {professional.signature ? (
                                            <img src={professional.signature} alt="Firma Professional" className="max-h-16 max-w-full object-contain" />
                                        ) : (
                                            <div className="text-[0.6rem] text-slate-300 italic">Sin firma digital</div>
                                        )}
                                    </div>
                                    <div className="signature-line"></div>
                                    <p className="text-[0.6rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">PROFESIONAL ACTUANTE</p>
                                    <p className="text-[0.8rem] font-black uppercase text-black leading-none break-words">{professional.name}</p>
                                    <p className="text-[0.5rem] font-bold text-blue-600 uppercase tracking-tighter mt-1" style={{ color: 'var(--color-primary)' }}>Matrícula: {professional.license}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <PdfBrandingFooter />
                </div>
            </div>
            {/* ─── Modal IA Mágica ─── */}
            {
                showAIModal && (
                    <div
                        onClick={() => setShowAIModal(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(6px)' }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '440px', background: 'var(--color-surface)', borderRadius: '24px', padding: '2rem', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 20px 60px rgba(168,85,247,0.2)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)', borderRadius: '12px', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(168,85,247,0.4)' }}>
                                    <Sparkles size={20} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, background: 'linear-gradient(135deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IA Mágica</h2>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Generador automático de ATS</p>
                                </div>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                Ingresá el nombre de la tarea y la IA generará automáticamente los pasos, riesgos y medidas de control.
                            </p>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem', display: 'block' }}>
                                ¿Para qué tarea?
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={aiTaskInput}
                                onChange={e => setAiTaskInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && aiTaskInput.trim()) runAIGeneration(); }}
                                placeholder="Ej: Soldadura en altura, Excavación manual..."
                                style={{ width: '100%', padding: '0.9rem 1rem', borderRadius: '12px', border: '2px solid rgba(168,85,247,0.3)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box', marginBottom: '1.5rem', transition: 'border-color 0.2s' }}
                                onFocus={e => e.target.style.borderColor = '#a855f7'}
                                onBlur={e => e.target.style.borderColor = 'rgba(168,85,247,0.3)'}
                            />
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => setShowAIModal(false)}
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={runAIGeneration}
                                    disabled={!aiTaskInput.trim()}
                                    style={{ flex: 2, padding: '0.8rem', borderRadius: '12px', border: 'none', background: aiTaskInput.trim() ? 'linear-gradient(135deg,#a855f7,#ec4899)' : 'var(--color-border)', color: '#ffffff', fontWeight: 800, cursor: aiTaskInput.trim() ? 'pointer' : 'not-allowed', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: aiTaskInput.trim() ? '0 4px 15px rgba(168,85,247,0.4)' : 'none', transition: 'all 0.2s' }}
                                >
                                    <Sparkles size={16} /> GENERAR ATS
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </>
    );
}

// Internal Sub-components
function StatusBtn({ active, type, onClick, label }) {
    const classes = `status - btn ${active ? (type === 'OK' ? 'active-ok' : type === 'FAIL' ? 'active-fail' : 'active-na') : ''
        } `;
    return (
        <button className={classes} onClick={onClick}>
            {active && <CheckCircle2 size={10} style={{ marginRight: '2px' }} />}
            {label}
        </button>
    );
}

function DocBox({ label, value, onChange, type = "text", large = false, borderLeft = false }) {
    return (
        <div style={{
            padding: '0.8rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
            justifyContent: 'center',
            borderLeft: borderLeft ? '2px solid var(--color-border)' : 'none',
            borderTop: '0',
            background: 'transparent',
            minHeight: '60px',
        }}>
            <span style={{
                fontSize: '0.6rem',
                fontWeight: 900,
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                opacity: 0.8,
            }}>{label}</span>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    margin: 0,
                    padding: '0.15rem 0',
                    border: 'none',
                    borderBottom: '1.5px solid var(--color-border)',
                    background: 'transparent',
                    fontSize: large ? '1.05rem' : '0.9rem',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderBottomColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderBottomColor = 'var(--color-border)'}
            />
        </div>
    );
}
