import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Save, Plus, Trash2, Printer,
    ShieldCheck, Building2, User, Calendar,
    CheckCircle2, AlertCircle, HelpCircle, Pencil, Info, Share2, Sparkles, Loader2,
    MapPin, FileText, Search, QrCode, Download, ClipboardList
} from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { downloadCSV } from '../services/exportCsv';
import QRModal from '../components/QRModal';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSync } from '../contexts/SyncContext';
import { auth } from '../firebase';
import ShareModal from '../components/ShareModal';
import ATSPdfGenerator from '../components/ATSPdfGenerator';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import SignatureCanvas from '../components/SignatureCanvas';
import { API_BASE_URL } from '../config';
import AdModal from '../components/ads/AdModal';

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

const PRESETS = {
    'Andamios (Altura)': [
        { id: 101, paso: 'Verificación de nivelación y apoyos de andamio', riesgo: 'Caída de estructura / Desnivel', control: 'Uso de durmientes y nivelación con burbuja', realizado: false },
        { id: 102, paso: 'Montaje de tablones y barandas de seguridad', riesgo: 'Caída de personas u objetos', control: 'Doble baranda y rodapié reglamentario', realizado: false },
        { id: 103, paso: 'Anclaje de arnés a punto estructural', riesgo: 'Caída a distinto nivel', control: 'Arnés de cuerpo completo y doble cabo de vida', realizado: false }
    ],
    'Soldadura (Caliente)': [
        { id: 201, paso: 'Inspección de equipo y pinzas', riesgo: 'Contacto eléctrico / Incendio', control: 'Verificación de aislación y puesta a tierra', realizado: false },
        { id: 202, paso: 'Colocación de biombos y despeje de área', riesgo: 'Proyección de partículas / Irradiación', control: 'Careta fotosensible y vestimenta de cuero ignífugo', realizado: false },
        { id: 203, paso: 'Vigilancia de chispas post-tarea', riesgo: 'Principio de incendio latente', control: 'Matafuego ABC a mano y guardia de cenizas (30 min)', realizado: false }
    ],
    'Excavación (Zanjas)': [
        { id: 301, paso: 'Detección de interferencias', riesgo: 'Rotura de servicios / Explosión', control: 'Cateo manual previo y chequeo de planos', realizado: false },
        { id: 302, paso: 'Señalización perimetral', riesgo: 'Caída de personas o vehículos', control: 'Cerco rígido y balizamiento nocturno', realizado: false },
        { id: 303, paso: 'Excavación y entibado', riesgo: 'Derrumbe de paredes', control: 'Perfilado/Escalonamiento de talud según tipo de suelo', realizado: false }
    ],
    'Corte Eléctrico (LOTO)': [
        { id: 401, paso: 'Identificación de tablero y circuitos', riesgo: 'Corte erróneo', control: 'Uso de diagramas unifilares actualizados', realizado: false },
        { id: 402, paso: 'Maniobra de corte y bloqueo (LOTO)', riesgo: 'Energización accidental', control: 'Colocación de candado personal y tarjeta de peligro', realizado: false },
        { id: 403, paso: 'Verificación de ausencia de tensión', riesgo: 'Electrocución por tensión residual', control: 'Uso de multímetro/detector de tensión homologado', realizado: false }
    ],
    'Espacio Confinado': [
        { id: 501, paso: 'Medición de gases previa', riesgo: 'Asfixia / Intoxicación / Explosión', control: 'Uso de explosímetro calibrado multigas', realizado: false },
        { id: 502, paso: 'Ventilación mecánica', riesgo: 'Acumulación de vapores', control: 'Extractor/Insuflador portátil continuo', realizado: false },
        { id: 503, paso: 'Ingreso supervisado', riesgo: 'Atrapamiento / Desvanecimiento', control: 'Vigía permanente en boca de hombre y trípode de rescate', realizado: false }
    ]
};

function DeleteConfirm({ onConfirm, onCancel }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '2rem', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900 }}>¿Eliminar ATS?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800 }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#fff' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function ATS(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { requirePro, isPro, daysRemaining } = usePaywall();
    const { syncCollection, syncPulse } = useSync();
    const { currentUser } = useAuth();
    const editData = location.state?.editData;
    useDocumentTitle(editData ? 'Editar ATS' : 'Análisis de Trabajo Seguro (ATS)');
    
    // History State
    const [showForm, setShowForm] = useState(false);
    const [history, setHistory] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        id: '',
        empresa: '',
        cuit: '',
        obra: '',
        tarea: '',
        fecha: new Date().toISOString().split('T')[0],
        capatazNombre: '',
        operatorSignature: '',
        capatazSignature: '',
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
    const [isAdModalOpen, setIsAdModalOpen] = useState(true);

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
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
                },
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

    const handleApplyPreset = (name) => {
        const tasks = PRESETS[name];
        if (!tasks) return;
        
        if (formData.tareas.length > 2 && !window.confirm('¿Deseas reemplazar los pasos actuales por esta plantilla?')) return;
        
        setFormData(prev => ({
            ...prev,
            tareas: tasks.map((t, i) => ({ ...t, id: Date.now() + i }))
        }));
        toast.success(`Plantilla de ${name} aplicada.`);
    };

    const handleClearForm = () => {
        if (!window.confirm('¿Seguro que deseas reiniciar el formulario? Se perderán los cambios no guardados.')) return;
        setFormData({
            id: '',
            empresa: '', cuit: '', obra: '', tarea: '',
            fecha: new Date().toISOString().split('T')[0],
            capatazNombre: '',
            operatorSignature: '',
            capatazSignature: '',
            checklist: defaultChecklist,
            tareas: []
        });
        toast.success('Formulario reiniciado');
    };

    const [professional, setProfessional] = useState({
        name: 'Juan Pérez',
        license: '',
        signature: null
    });

    // Cargar historial
    useEffect(() => {
        const historyRaw = localStorage.getItem('ats_history');
        if (historyRaw) setHistory(JSON.parse(historyRaw));
    }, [syncPulse]);

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
        const historyRaw = localStorage.getItem('ats_history');
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        const entryId = formData.id || Date.now().toString();
        const newEntry = {
            ...formData,
            id: entryId,
            showSignatures: showSignatures,
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
        setHistory(updated);
        await syncCollection('ats_history', updated);
        toast.success('Análisis de Trabajo Seguro guardado con éxito');
        setShowForm(false);
    };

    const handleShare = () => requirePro(() => setShowShare(true));
    const handlePrint = () => {
        requirePro(() => {
            const element = document.getElementById('pdf-content');
            if (!element) {
                toast.error('No se pudo generar el documento para imprimir.');
                return;
            }
            document.body.classList.add('printing-isolated');
            element.classList.add('isolated-print-target');
            window.print();
            setTimeout(() => {
                document.body.classList.remove('printing-isolated');
                element.classList.remove('isolated-print-target');
            }, 8000);
        });
    };

        
    // Grouping checklist by category
    const categories = [...new Set(formData.checklist.map(i => i.categoria))];

    // --- Progress tracking ---
    const progressItems = [
        { label: 'Empresa', done: !!formData.empresa?.trim() },
        { label: 'Obra/Ubicación', done: !!formData.obra?.trim() },
        { label: 'Descripción de tarea', done: !!formData.tarea?.trim() },
        { label: 'Responsable', done: !!formData.capatazNombre?.trim() },
        { label: 'Secuencia de tareas', done: formData.tareas.length > 0 && formData.tareas.every(t => t.paso?.trim() && t.riesgo?.trim()) },
        { label: 'Checklist preventivo', done: formData.checklist.every(c => c.estado !== '') },
    ];
    const completedCount = progressItems.filter(p => p.done).length;
    const progressPct = Math.round((completedCount / progressItems.length) * 100);
    const progressLabel = progressPct === 100 ? 'Listo para guardar ✅' : progressPct >= 66 ? 'Casi completo' : progressPct >= 33 ? 'En progreso' : 'Pendiente';
    const progressColor = progressPct === 100 ? '#10b981' : progressPct >= 66 ? '#f59e0b' : progressPct >= 33 ? '#3b82f6' : '#94a3b8';

    const confirmDelete = () => {
        const updated = history.filter((item: any) => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('ats_history', JSON.stringify(updated));
        syncCollection('ats_history', updated);
        setDeleteTarget(null);
    };

    const handleExportCSV = () => {
        requirePro(() => {
            downloadCSV(history.map((i: any) => ({
                empresa: i.empresa, obra: i.obra, fecha: i.fecha,
                responsable: i.capatazNombre || '', tarea: i.tarea || ''
            })), 'ats_historial', {
                empresa: 'Empresa', obra: 'Obra/Proyecto', fecha: 'Fecha',
                responsable: 'Responsable', tarea: 'Tarea'
            });
        });
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
                    <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--color-secondary)' }}>
                        <ClipboardList size={16} />
                    </div>
                    <div style={{ fontWeight: 700 }}>{item.empresa || 'Sin nombre'}</div>
                </div>
            )
        },
        {
            header: 'Obra / Proyecto',
            accessor: 'obra',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={14} /> {item.obra || '—'}
                </span>
            )
        },
        {
            header: 'Responsable',
            accessor: 'capatazNombre',
            render: (item: any) => <span style={{ color: 'var(--color-text-muted)' }}>{item.capatazNombre || '—'}</span>
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => { setFormData(item); setShowForm(true); }} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={15} /> Ver</button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/ats/${item.id}?print=true`; setQrTarget({ text: url, title: `ATS — ${item.empresa}` } as any); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(JSON.parse(localStorage.getItem('ats_' + item.id) || 'null') || item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
                </div>
            )
        }
    ];

    const filteredHistory = history.filter((e: any) => {
        const query = searchTerm.toLowerCase();
        return (e.empresa || '').toLowerCase().includes(query) || 
               (e.obra || '').toLowerCase().includes(query) ||
               (e.capatazNombre || '').toLowerCase().includes(query);
    });

    return (
        <>
            <style>{printStyles}</style>
            <AdModal 
                isOpen={isAdModalOpen} 
                onClose={() => setIsAdModalOpen(false)} 
                adSlot="ats-popup" 
            />
            <div className="container" style={{ maxWidth: '1200px', paddingBottom: '12rem' }}>
                {/* Breadcrumbs de navegación */}
                <Breadcrumbs />

                <PremiumHeader
                    title="Generador de ATS"
                    subtitle="Identificación y control de riesgos para tareas críticas"
                    icon={<ShieldCheck size={36} />}
                />

                {!showForm ? (
                    <>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button
                                onClick={() => { 
                                    setFormData({
                                        id: '', empresa: '', cuit: '', obra: '', tarea: '', fecha: new Date().toISOString().split('T')[0], capatazNombre: '', operatorSignature: '', capatazSignature: '', checklist: defaultChecklist, tareas: [ { id: 1, paso: 'Preparación de área', riesgo: 'Caídas', control: 'Delimitación', realizado: true }, { id: 2, paso: 'Ejecución de tarea', riesgo: 'Golpes', control: 'Uso de EPP', realizado: false } ]
                                    }); 
                                    setShowForm(true); 
                                }}
                                style={{ flex: '0 1 auto', padding: '1rem 1.5rem', borderRadius: '16px', background: '#36B37E', color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(54,179,126,0.3)', whiteSpace: 'nowrap' }}
                            >
                                <Plus size={20} /> Nuevo ATS
                            </button>
                            <div style={{ flex: '1 1 300px', position: 'relative' }}>
                                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por empresa, obra o responsable..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '16px', border: '2px solid var(--color-border)', fontSize: '1rem', outline: 'none', background: 'var(--color-surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                                />
                            </div>
                            {history.length > 0 && (
                                <button onClick={handleExportCSV} style={{ flex: '0 1 auto', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-primary)', border: 'none', borderRadius: '16px', padding: '1rem 1.5rem', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                    <Download size={20} /> Excel
                                </button>
                            )}
                        </div>

                        <DataTable
                            data={filteredHistory}
                            columns={columns}
                            searchPlaceholder="Buscar..."
                            emptyMessage="No se encontraron registros de ATS."
                            emptyIcon={<ClipboardList size={48} />}
                            onEmptyAction={() => setShowForm(true)}
                            emptyActionLabel="Crear mi primer ATS"
                        />

                        {qrTarget && <QRModal text={(qrTarget as any).text} title={(qrTarget as any).title} onClose={() => setQrTarget(null)} />}
                        {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                        <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`ATS - ${(shareItem as any)?.obra || ''}`} rawMessage={shareItem ? `📋 ATS\n🏗️ Empresa: ${(shareItem as any).empresa}\n🚧 Obra: ${(shareItem as any).obra}\n📅 Fecha: ${(shareItem as any).fecha}` : ''} text={shareItem ? `📋 ATS\n🏗️ Empresa: ${(shareItem as any).empresa}\n🚧 Obra: ${(shareItem as any).obra}\n📅 Fecha: ${(shareItem as any).fecha}` : ''} elementIdToPrint="pdf-content" fileName={`ATS_${(shareItem as any)?.empresa?.replace(/\s+/g, '_') || 'Reporte'}.pdf`} />
                        <div className="ats-pdf-offscreen">
                            <ATSPdfGenerator atsData={shareItem} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <button onClick={() => setShowForm(false)} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={18} /> 
                            </button>
                        </div>

                <ShareModal
                    isOpen={showShare}
                    open={showShare}
                    onClose={() => setShowShare(false)}
                    title={`ATS – ${formData.empresa} (${formData.obra})`}
                    text={`🔐 Análisis de Trabajo Seguro\n🏗️ Empresa: ${formData.empresa}\n🚧 Obra: ${formData.obra}\n📅 Fecha: ${formData.fecha}\n📋 Tarea: ${formData.tarea}\n\nGenerado con Asistente HYS`}
                    elementIdToPrint="pdf-content"
                    rawMessage={``}
                    fileName={`ATS_${formData.empresa || 'Reporte'}.pdf`}
                />

                <div className="ats-pdf-offscreen" aria-hidden="true">
                    <ATSPdfGenerator
                        atsData={{
                            ...formData,
                            showSignatures,
                            professionalName: professional.name,
                            professionalLicense: professional.license,
                            professionalSignature: professional.signature,
                        }}
                    />
                </div>

                {/* Floating Action Buttons */}
                <div className="no-print floating-action-bar">
                    <button
                        onClick={handleClearForm}
                        className="btn-floating-action"
                        style={{ background: 'var(--color-surface)', color: '#ef4444', border: '1px solid #ef4444' }}
                    >
                        <Trash2 size={18} /> LIMPIAR
                    </button>
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
                    padding: '2rem',
                    background: 'var(--color-surface)',
                    borderRadius: '24px',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.2rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => navigate('/#tools')} style={{ padding: '0.6rem', background: 'var(--color-background)', borderRadius: '12px', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex' }}>
                                <ArrowLeft size={22}  />
                        </button>
                            <div>
                                <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <ShieldCheck className="text-blue-600" size={28} />
                                    {editData ? 'Editar ATS' : 'Análisis de Trabajo Seguro'}
                                </h1>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Control HYS</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: progressColor }}>{progressPct}%</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{progressLabel}</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ height: '8px', background: 'var(--color-background)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${progressPct}%`,
                                background: progressColor,
                                borderRadius: '999px',
                                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: `0 0 8px ${progressColor}88`
                            }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {progressItems.map((item) => (
                                <span key={item.label} style={{
                                    fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                                    borderRadius: '999px',
                                    background: item.done ? 'rgba(16,185,129,0.12)' : 'var(--color-background)',
                                    color: item.done ? '#10b981' : 'var(--color-text-muted)',
                                    border: `1px solid ${item.done ? 'rgba(16,185,129,0.3)' : 'var(--color-border)'}`,
                                    display: 'flex', alignItems: 'center', gap: '0.3rem'
                                }}>
                                    {item.done ? '✓' : '○'} {item.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div id="ats-editor-content" className="card ats-editor-panel" style={{ width: '100%', maxWidth: '950px', boxSizing: 'border-box', padding: '1rem', margin: '0 auto' }}>

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

                        {/* Right Document Counter + Logo */}
                        <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <CompanyLogo style={{ height: '40px', maxWidth: '120px' }} />
                            <div>
                                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--color-border)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>PÁGINA</div>
                                <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--color-text)' }}>01 / 01</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ border: '2px solid var(--color-border)', borderRadius: '16px', marginBottom: '2.5rem', width: '100%', overflow: 'hidden', background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.3s' }} className="hover:border-blue-400/50 hover:shadow-md">
                        <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ borderBottom: '2px solid var(--color-border)', width: '100%' }}>
                            <div className="sm:col-span-2 print:col-span-2"><DocBox label="CLIENTE / EMPRESA" value={formData.empresa} onChange={v => setFormData({ ...formData, empresa: v })} large icon={<Building2 size={14} />} /></div>
                            <div className="sm:col-span-1 print:col-span-1"><DocBox label="CUIT / CUIL" value={formData.cuit} onChange={v => setFormData({ ...formData, cuit: v })} borderLeft icon={<ShieldCheck size={14} />} /></div>
                            <div className="sm:col-span-1 print:col-span-1"><DocBox label="UBICACIÓN / OBRA" value={formData.obra} onChange={v => setFormData({ ...formData, obra: v })} borderLeft icon={<MapPin size={14} />} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%', borderBottom: '2px solid var(--color-border)' }}>
                            <div className="sm:col-span-1 print:col-span-1"><DocBox label="FECHA" value={formData.fecha} onChange={v => setFormData({ ...formData, fecha: v })} type="date" icon={<Calendar size={14} />} /></div>
                            <div className="sm:col-span-3 print:col-span-3"><DocBox label="DESCRIPCIÓN DE LA TAREA" value={formData.tarea} onChange={v => setFormData({ ...formData, tarea: v })} borderLeft icon={<FileText size={14} />} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%' }}>
                            <div className="sm:col-span-2 print:col-span-2"><DocBox label="RESPONSABLE" value={formData.capatazNombre} onChange={v => setFormData({ ...formData, capatazNombre: v })} icon={<User size={14} />} /></div>
                            <div className="sm:col-span-2 print:col-span-2"><DocBox label="PROFESIONAL HYS" value={professional.name} onChange={() => { }} borderLeft icon={<ShieldCheck size={14} />} /></div>
                        </div>
                    </div>

                    {/* Sección de Secuencia de Tareas */}
                    <div style={{ marginTop: '3rem', marginBottom: '3rem' }}>
                        <div className="no-print" style={{ marginBottom: '1.5rem' }}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ marginBottom: '1.25rem' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <Pencil size={22} className="text-blue-600" /> Secuencia de Tareas
                                </h3>
                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={handleGenerateAI}
                                        disabled={isGeneratingATS}
                                        style={{ 
                                            flex: 1, 
                                            minWidth: '120px', 
                                            padding: '0.7rem 1.4rem', 
                                            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', 
                                            color: '#ffffff', 
                                            border: 'none', 
                                            borderRadius: '14px', 
                                            fontWeight: 900, 
                                            fontSize: '0.8rem', 
                                            cursor: isGeneratingATS ? 'wait' : 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '0.5rem', 
                                            boxShadow: '0 4px 18px rgba(139,92,246,0.35)', 
                                            opacity: isGeneratingATS ? 0.7 : 1,
                                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                        }}
                                        className="hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_6px_22px_rgba(139,92,246,0.5)]"
                                    >
                                        {isGeneratingATS ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        {isGeneratingATS ? 'PENSANDO...' : 'IA MÁGICA'}
                                    </button>
                                    <button
                                        onClick={addTask}
                                        style={{ 
                                            flex: 1, 
                                            minWidth: '120px', 
                                            padding: '0.7rem 1.4rem', 
                                            background: '#10b981', 
                                            color: '#ffffff', 
                                            border: 'none', 
                                            borderRadius: '14px', 
                                            fontWeight: 900, 
                                            fontSize: '0.8rem', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '0.5rem',
                                            boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
                                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                        }}
                                        className="hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_6px_18px_rgba(16,185,129,0.35)]"
                                    >
                                        <Plus size={16} /> AGREGAR PASO
                                    </button>
                                </div>
                            </div>

                            {/* Presets List */}
                            <div style={{ 
                                display: 'flex', 
                                gap: '0.6rem', 
                                flexWrap: 'wrap', 
                                background: 'var(--glass-bg)', 
                                backdropFilter: 'blur(12px)',
                                padding: '1.25rem', 
                                borderRadius: '18px', 
                                border: '1px solid var(--glass-border-subtle)', 
                                boxShadow: 'var(--shadow-sm)' 
                            }}>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 900, 
                                    color: 'var(--color-primary)', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '1px', 
                                    width: '100%', 
                                    marginBottom: '0.5rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.4rem' 
                                }}>
                                    <Sparkles size={14} className="text-purple-500" /> Plantillas Rápidas para Tareas Críticas:
                                </span>
                                {Object.keys(PRESETS).map(name => (
                                    <button
                                        key={name}
                                        onClick={() => handleApplyPreset(name)}
                                        style={{ 
                                            padding: '0.5rem 1rem', 
                                            background: 'var(--color-surface)', 
                                            border: '1px solid var(--color-border)', 
                                            borderRadius: '12px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 800, 
                                            cursor: 'pointer', 
                                            color: 'var(--color-text)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem', 
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                                        }}
                                        className="hover:-translate-y-0.5 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-blue-400 hover:text-blue-500 hover:shadow-sm"
                                    >
                                        <Plus size={14} className="text-blue-500" /> {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <h3 className="print-only" style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <Pencil size={22} /> Secuencia de Tareas (Análisis)
                        </h3>

                        <div className="ats-sequence-container">
                            <div className="ats-seq-header no-print">
                                <div className="ats-seq-head-num">#</div>
                                <div>1. Paso a seguir</div>
                                <div>2. Riesgos asociados</div>
                                <div>3. Medidas de control</div>
                                <div className="ats-seq-head-action" aria-hidden="true" />
                            </div>

                            <div className="ats-seq-body">
                                {formData.tareas.map((t, index) => (
                                    <div key={t.id} className="ats-seq-row ats-table-row">
                                        <div className="ats-seq-cell ats-seq-cell-num">
                                            <span className="ats-seq-num-desktop">{index + 1}</span>
                                            <span className="ats-seq-num-mobile">PASO {index + 1}</span>
                                        </div>

                                        <div className="ats-seq-cell ats-seq-cell-paso">
                                            <span className="ats-seq-mobile-label">Paso a seguir</span>
                                            <textarea
                                                rows={1}
                                                value={t.paso}
                                                onChange={(e) => updateTask(t.id, 'paso', e.target.value)}
                                                onInput={(e) => {
                                                    const target = e.target as HTMLTextAreaElement;
                                                    target.style.height = 'auto';
                                                    target.style.height = target.scrollHeight + 'px';
                                                }}
                                                className="no-print ats-textarea ats-seq-textarea"
                                                placeholder="Ej: Preparación de área..."
                                            />
                                            <div className="print-only font-bold text-slate-800 text-[0.85rem] whitespace-pre-wrap break-words">
                                                {t.paso}
                                            </div>
                                        </div>

                                        <div className="ats-seq-cell ats-seq-cell-riesgo">
                                            <span className="ats-seq-mobile-label">Riesgos asociados</span>
                                            <textarea
                                                rows={1}
                                                value={t.riesgo}
                                                onChange={(e) => updateTask(t.id, 'riesgo', e.target.value)}
                                                onInput={(e) => {
                                                    const target = e.target as HTMLTextAreaElement;
                                                    target.style.height = 'auto';
                                                    target.style.height = target.scrollHeight + 'px';
                                                }}
                                                className="no-print ats-textarea ats-seq-textarea"
                                                placeholder="Ej: Caídas, Golpes..."
                                            />
                                            <div className="print-only text-slate-700 text-[0.8rem] whitespace-pre-wrap break-words">
                                                {t.riesgo}
                                            </div>
                                        </div>

                                        <div className="ats-seq-cell ats-seq-cell-control">
                                            <span className="ats-seq-mobile-label">Medidas de control</span>
                                            <textarea
                                                rows={1}
                                                value={t.control}
                                                onChange={(e) => updateTask(t.id, 'control', e.target.value)}
                                                onInput={(e) => {
                                                    const target = e.target as HTMLTextAreaElement;
                                                    target.style.height = 'auto';
                                                    target.style.height = target.scrollHeight + 'px';
                                                }}
                                                className="no-print ats-textarea ats-seq-textarea"
                                                placeholder="Ej: Delimitación, Uso EPP..."
                                            />
                                            <div className="print-only text-slate-700 text-[0.8rem] whitespace-pre-wrap break-words">
                                                {t.control}
                                            </div>
                                        </div>

                                        <div className="ats-seq-cell ats-seq-cell-action no-print">
                                            <button
                                                type="button"
                                                onClick={() => removeTask(t.id)}
                                                className="ats-seq-delete-btn"
                                                title="Eliminar paso"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <ShieldCheck size={24} className="text-blue-600" /> Verificación de Seguridad
                        </h3>

                        {categories.map(cat => (
                            <div key={cat} className="ats-checklist-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem' }}>
                                    <h4 style={{ margin: 0, color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <div className="no-print" style={{ padding: '0.4rem', background: 'rgba(var(--color-primary-rgb), 0.1)', borderRadius: '8px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                                            <Info size={16} />
                                        </div>
                                        <span
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => updateCategoryName(cat, e.target.innerText)}
                                            style={{ outline: 'none' }}
                                            className="hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-0.5 rounded cursor-edit"
                                        >
                                            {cat}
                                        </span>
                                    </h4>
                                    <button
                                        className="no-print"
                                        onClick={() => addQuestion(cat)}
                                        style={{ padding: '0.5rem 1rem', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129, 0.2)', transition: 'all 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'none'}
                                    >
                                        + AGREGAR
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {formData.checklist.filter(i => i.categoria === cat).map((item) => (
                                        <div key={item.id} className="group p-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-sm">
                                            {/* Question text */}
                                            <div
                                                contentEditable
                                                suppressContentEditableWarning
                                                onBlur={(e) => updateChecklist(item.id, 'pregunta', e.target.innerText)}
                                                className="font-bold text-[var(--color-text)] text-[0.95rem] outline-none border-b border-dashed border-transparent focus:border-[var(--color-primary)] leading-tight mb-2 cursor-edit hover:bg-slate-100 dark:hover:bg-slate-800 px-1 py-0.5 rounded"
                                            >
                                                {item.pregunta}
                                            </div>

                                            {/* Observaciones */}
                                            <textarea
                                                rows={1}
                                                placeholder="Observaciones o medidas preventivas..."
                                                value={item.observaciones}
                                                className="no-print ats-textarea"
                                                onInput={(e) => {
                                                    const target = e.target as HTMLTextAreaElement;
                                                    target.style.height = 'auto';
                                                    target.style.height = target.scrollHeight + 'px';
                                                }}
                                                onChange={(e) => updateChecklist(item.id, 'observaciones', e.target.value)}
                                                style={{ marginTop: '0.5rem' }}
                                            />
                                            <div className="print-only text-[0.7rem] text-slate-500 whitespace-pre-wrap break-words mb-1">
                                                {item.observaciones || ''}
                                            </div>

                                            {/* Bottom row: status buttons + delete */}
                                            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.8rem' }}>
                                                <div className="ats-status-group">
                                                    <StatusBtn active={item.estado === 'Cumple'} type="OK" onClick={() => updateChecklist(item.id, 'estado', 'Cumple')} label="SI" />
                                                    <StatusBtn active={item.estado === 'No Cumple'} type="FAIL" onClick={() => updateChecklist(item.id, 'estado', 'No Cumple')} label="NO" />
                                                    <StatusBtn active={item.estado === 'N/A'} type="NA" onClick={() => updateChecklist(item.id, 'estado', 'N/A')} label="N/A" />
                                                </div>
                                                <button
                                                    onClick={() => removeQuestion(item.id)}
                                                    style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', padding: '0.4rem', display: 'flex', alignItems: 'center' }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
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
                                                            background: 'transparent'
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

                    <div className="card animate-fade-in" style={{ marginTop: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                            <Pencil size={22} style={{ color: 'var(--color-primary)' }} /> Firmas y Autorizaciones
                        </h3>

                        {/* Custom visual switches */}
                        <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    { id: 'operator', label: 'Operador / Capataz' },
                                    { id: 'supervisor', label: 'Supervisor' },
                                    { id: 'professional', label: 'Profesional' }
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
                                ...formData,
                                professionalSignature: professional.signature,
                                professionalName: professional.name,
                                professionalLicense: professional.license
                            }}
                            box1={showSignatures.operator ? {
                                title: 'OPERADOR / CAPATAZ',
                                subtitle: (formData.capatazNombre || 'Firma / Aclaración').toUpperCase(),
                                signatureUrl: formData.operatorSignature || null,
                                isProfessional: false
                            } : null}
                            box2={showSignatures.supervisor ? {
                                title: 'SUPERVISOR / JEFE OBRA',
                                subtitle: 'FIRMA DEL SUPERVISOR',
                                signatureUrl: formData.capatazSignature || null,
                                isProfessional: false
                            } : null}
                            box3={showSignatures.professional ? {
                                title: 'PROFESIONAL ACTUANTE',
                                subtitle: (professional.name || 'Firma y Sello').toUpperCase(),
                                signatureUrl: professional.signature || null,
                                isProfessional: true,
                                license: professional.license
                            } : null}
                        />

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-8">
                            {showSignatures.operator && (
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas 
                                        onSave={(sig) => setFormData(prev => ({ ...prev, operatorSignature: sig || '' }))}
                                        initialImage={formData.operatorSignature}
                                        label="Firma del Operador / Responsable"
                                    />
                                </div>
                            )}
                            
                            {showSignatures.supervisor && (
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas 
                                        onSave={(sig) => setFormData(prev => ({ ...prev, capatazSignature: sig || '' }))}
                                        initialImage={formData.capatazSignature}
                                        label="Firma del Supervisor"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <PdfBrandingFooter />
                </div>
                </>
                )}
            </div>
            {/* ─── Modal IA Mágica ─── */}
            {
                showAIModal && (
                    <div
                        onClick={() => setShowAIModal(false)}
                        className="modal-overlay-glass"
                        style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            className="modal-glass"
                            style={{ width: '100%', maxWidth: '460px', padding: '2.5rem', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 25px 60px rgba(168,85,247,0.2)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="ai-glow" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)', borderRadius: '14px', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(168,85,247,0.4)' }}>
                                    <Sparkles size={24} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IA Mágica</h2>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Generador Inteligente de ATS</p>
                                </div>
                            </div>
                            
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                                Describí la tarea que vas a realizar. La IA analizará los riesgos potenciales y propondrá las mejores medidas de control.
                            </p>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.6rem', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Tarea a Analizar
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={aiTaskInput}
                                    onChange={e => setAiTaskInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && aiTaskInput.trim()) runAIGeneration(); }}
                                    placeholder="Ej: Pintura en altura con balancín..."
                                    style={{ width: '100%', padding: '1rem 1.2rem', borderRadius: '14px', border: '2px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', fontSize: '1rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'all 0.3s ease' }}
                                    className="focus:border-purple-500 focus:shadow-[0_0_0_4px_rgba(168,85,247,0.1)]"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowAIModal(false)}
                                    style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: '1.5px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
                                    className="hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={runAIGeneration}
                                    disabled={!aiTaskInput.trim()}
                                    style={{ flex: 2, padding: '1rem', borderRadius: '14px', border: 'none', background: aiTaskInput.trim() ? 'linear-gradient(135deg,#a855f7,#ec4899)' : 'var(--color-border)', color: '#ffffff', fontWeight: 800, cursor: aiTaskInput.trim() ? 'pointer' : 'not-allowed', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', boxShadow: aiTaskInput.trim() ? '0 10px 25px rgba(168,85,247,0.3)' : 'none', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                                    className={aiTaskInput.trim() ? "hover:scale-[1.03] active:scale-[0.97]" : ""}
                                >
                                    <Sparkles size={18} /> GENERAR AHORA
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
    const classes = `ats-status-btn ${active ? (type === 'OK' ? 'active-ok' : type === 'FAIL' ? 'active-fail' : 'active-na') : ''}`;
    return (
        <button className={classes} onClick={onClick}>
            {label}
        </button>
    );
}

function DocBox({ label, value, onChange, type = "text", large = false, borderLeft = false, icon }) {
    const [focused, setFocused] = useState(false);
    
    return (
        <div style={{
            padding: '1rem 1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            justifyContent: 'center',
            borderLeft: borderLeft ? '2px solid var(--color-border)' : 'none',
            borderTop: '0',
            background: focused ? 'rgba(var(--color-primary-rgb), 0.04)' : 'transparent',
            minHeight: '75px',
            transition: 'all 0.3s ease',
        }} className={focused ? 'shadow-inner' : ''}>
            <span style={{
                fontSize: '0.65rem',
                fontWeight: 900,
                color: focused ? 'var(--color-primary)' : 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                opacity: 0.9,
                transition: 'color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
            }}>
                {icon && <span className="no-print" style={{ color: focused ? 'var(--color-primary)' : 'var(--color-text-muted)', opacity: focused ? 1 : 0.7, transition: 'all 0.3s', display: 'flex', alignItems: 'center' }}>{icon}</span>}
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    margin: 0,
                    padding: '0.3rem 0',
                    border: 'none',
                    borderBottom: focused ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: 'transparent',
                    fontSize: large ? '1.1rem' : '0.95rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    outline: 'none',
                    width: '100%',
                    transition: 'border-bottom-color 0.2s',
                    boxShadow: 'none'
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
        </div>
    );
}
