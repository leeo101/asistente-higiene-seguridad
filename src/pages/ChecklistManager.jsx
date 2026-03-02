import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ClipboardCheck, Printer, Plus,
    Settings, AlertTriangle, Building2, Calendar,
    Check, ShieldCheck, Trash2, Edit3, X,
    Share2, Save, ArrowLeft
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';

const DEFAULT_TEMPLATES = {
    'manual_tools': {
        title: 'Herramientas Manuales',
        icon: <Plus size={18} />,
        items: [
            'Mangos en buen estado (sin fisuras, astillas ni flojos)',
            'Cabezas de herramientas de golpe sin rebabas ni deformaciones (hongos)',
            'Herramienta limpia, seca y libre de grasa/aceite',
            'No presenta oxidacion excesiva que debilite la estructura',
            'Filo adecuado y protegido cuando no esta en uso',
            'Sujecion firme de las partes moviles',
            'Almacenamiento en portaherramientas adecuados'
        ]
    },
    'electric_tools': {
        title: 'Herramientas Electricas Portatiles',
        icon: <Settings size={18} />,
        items: [
            'Cables sin peladuras, cortes ni empalmes precarios',
            'Ficha de conexion original y en buen estado (con puesta a tierra)',
            'Carcasa sin roturas, fisuras ni tornillos faltantes',
            'Gatillo de accionamiento funciona correctamente',
            'Protecciones/resguardos en su lugar y firmes',
            'Escobillas sin chispas excesivas'
        ]
    },
    'circular_saw': {
        title: 'Sierra Circular de Mano',
        icon: <ShieldCheck size={18} />,
        items: [
            'Resguardo retractil funciona suavemente',
            'Hoja de sierra sin dientes rotos y con filo',
            'Cuchillo divisor alineado y firmemente sujeto',
            'Boton de bloqueo de seguridad operativo',
            'Disco adecuado para las RPM de la maquina'
        ]
    },
    'grinder': {
        title: 'Amoladora Angular',
        icon: <AlertTriangle size={18} />,
        items: [
            'Resguardo metalico cubre como minimo el 50% del disco',
            'Mango lateral colocado y permanentemente firme',
            'Disco adecuado para la velocidad (RPM) de la maquina',
            'Disco sin rajaduras ni golpes'
        ]
    },
    'scaffolding': {
        title: 'Andamios y Estructuras',
        icon: <Building2 size={18} />,
        items: [
            'Apoyos sobre base firme y nivelada',
            'Estructura libre de oxidacion y deformaciones',
            'Tablones metalicos o madera sin fisuras',
            'Plataforma de trabajo completa y trabada'
        ]
    }
};

const MANDATORY_SECTIONS = [
    {
        id: 'epp', title: 'Elementos de Protección Personal (EPP)', items: [
            'Casco de seguridad con barbijofle',
            'Proteccion ocular / facial',
            'Calzado de seguridad con puntera',
            'Proteccion auditiva',
            'Guantes adecuados a la tarea'
        ]
    },
    {
        id: 'entorno', title: 'Condiciones del Entorno', items: [
            'Iluminacion adecuada',
            'Orden y limpieza del sector',
            'Extintor de incendios cercano',
            'Señalización de seguridad'
        ]
    }
];

export default function ChecklistManager() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const [searchParams] = useSearchParams();

    const [companyInfo, setCompanyInfo] = useState({
        name: '',
        inspector: '',
    });

    const [inspectionInfo, setInspectionInfo] = useState({
        item: '',
        serial: '',
        date: new Date().toISOString().split('T')[0],
    });

    const [activeSections, setActiveSections] = useState([]);
    const [observations, setObservations] = useState('');
    const [showShare, setShowShare] = useState(false);
    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            const savedData = localStorage.getItem(`checklist_${id}`);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                setCompanyInfo(parsed.companyInfo);
                setInspectionInfo(parsed.inspectionInfo);
                setActiveSections(parsed.activeSections);
                setObservations(parsed.observations || '');
                if (parsed.showSignatures) setShowSignatures(parsed.showSignatures);
            }
        }
    }, [searchParams]);

    const handleSave = async () => {
        const id = searchParams.get('id') || Date.now().toString();

        const data = {
            id,
            companyInfo,
            inspectionInfo,
            activeSections,
            observations,
            showSignatures,
            updatedAt: new Date().toISOString()
        };

        // Deep save for specific report persistence
        localStorage.setItem(`checklist_${id}`, JSON.stringify(data));

        // Sync with history list
        const history = JSON.parse(localStorage.getItem('tool_checklists_history') || '[]');
        const existingIndex = history.findIndex(h => h.id === id);

        const summaryData = {
            id,
            empresa: companyInfo.name || 'Sin Empresa',
            equipo: inspectionInfo.item || 'Inspección General',
            serial: inspectionInfo.serial || 'S/N',
            fecha: (new Date()).toISOString(),
            type: 'Checklist'
        };

        if (existingIndex >= 0) {
            history[existingIndex] = summaryData;
        } else {
            history.unshift(summaryData);
        }

        localStorage.setItem('tool_checklists_history', JSON.stringify(history));
        await syncCollection('tool_checklists_history', history);
        toast.success('Checklist guardado con éxito y registrado en el historial ✅');
    };

    const handleShare = () => requirePro(() => setShowShare(true));

    useEffect(() => {
        const initial = MANDATORY_SECTIONS.map(s => ({
            id: s.id,
            title: s.title,
            isMandatory: false,
            items: s.items.map(text => ({ text, status: null }))
        }));
        setActiveSections(initial);
    }, []);

    const toggleTemplate = (templateKey) => {
        const template = DEFAULT_TEMPLATES[templateKey];
        const existingIdx = activeSections.findIndex(s => s.id === templateKey);

        if (existingIdx >= 0) {
            setActiveSections(prev => prev.filter(s => s.id !== templateKey));
        } else {
            const newSection = {
                id: templateKey,
                title: template.title,
                isMandatory: false,
                items: template.items.map(text => ({ text, status: null }))
            };
            setActiveSections(prev => [...prev, newSection]);
        }
    };

    const updateSectionTitle = (sectionId, newTitle) => {
        setActiveSections(prev => prev.map(section =>
            section.id === sectionId ? { ...section, title: newTitle } : section
        ));
    };

    const removeSection = (sectionId) => {
        setActiveSections(prev => prev.filter(s => s.id !== sectionId));
    };

    const updateItem = (sectionId, itemIdx, field, value) => {
        setActiveSections(prev => prev.map(section => {
            if (section.id !== sectionId) return section;
            const newItems = [...section.items];
            newItems[itemIdx] = { ...newItems[itemIdx], [field]: value };
            return { ...section, items: newItems };
        }));
    };

    const addItem = (sectionId) => {
        setActiveSections(prev => prev.map(section => {
            if (section.id !== sectionId) return section;
            return {
                ...section,
                items: [...section.items, { text: 'Nuevo punto de inspección', status: null }]
            };
        }));
    };

    const removeItem = (sectionId, itemIdx) => {
        setActiveSections(prev => prev.map(section => {
            if (section.id !== sectionId) return section;
            return {
                ...section,
                items: section.items.filter((_, idx) => idx !== itemIdx)
            };
        }));
    };

    const checkAllOk = (sectionId) => {
        setActiveSections(prev => prev.map(section => {
            if (section.id !== sectionId) return section;
            return {
                ...section,
                items: section.items.map(item => ({ ...item, status: 'OK' }))
            };
        }));
    };

    return (
        <div className="container" style={{ maxWidth: '1100px', paddingBottom: '8rem' }}>
            <ShareModal
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Checklist – ${companyInfo?.name || ''}`}
                text={`📋 Checklist de Inspección\n🏗️ Empresa: ${companyInfo?.name || '-'}\n📍 Ubicación: ${companyInfo?.address || '-'}\n👷 Responsable: ${companyInfo?.responsable || '-'}\n\nGenerado con Asistente H&S`}
            />

            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                <button
                    onClick={handleSave}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: 'white' }}
                >
                    <Save size={18} /> GUARDAR
                </button>
                <button
                    onClick={() => requirePro(() => setShowShare(true))}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: 'white' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => requirePro(() => window.print())}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: 'white' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>
            <div className="no-print" style={{
                marginBottom: '2rem',
                padding: '2.5rem',
                background: '#fff',
                borderRadius: '24px',
                border: '1px solid #EBECF0',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '2rem',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button onClick={() => navigate(-1)} style={{ padding: '0.6rem', background: '#F4F5F7', borderRadius: '12px', border: 'none', cursor: 'pointer', color: '#42526E', display: 'flex' }}>
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#172B4D', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <ClipboardCheck className="text-blue-600" size={32} />
                            Generador de Checklist
                        </h1>
                        <p style={{ margin: 0, color: '#6B778C', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Control H&S</p>
                    </div>
                </div>

            </div>

            {/* TEMPLATE SELECTOR - EXPLICITLY HIDDEN IN PRINT */}
            <div className="pb-4 pt-1 no-print grid-4-cols gap-6 mb-10 max-w-5xl mx-auto" id="template-selector">
                {Object.entries(DEFAULT_TEMPLATES).map(([key, value]) => {
                    const active = activeSections.some(s => s.id === key);
                    return (
                        <button
                            key={key}
                            onClick={() => toggleTemplate(key)}
                            className="card"
                            style={{
                                padding: '1rem',
                                margin: 0,
                                border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: active ? 'var(--color-background)' : 'var(--color-surface)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                {React.cloneElement(value.icon, { size: 24 })}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, lineHeight: 1.2 }}>{value.title}</span>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white text-black p-12 shadow-2xl mx-auto print-area border border-slate-200 rounded-2xl" style={{ width: '100%', maxWidth: '850px', boxSizing: 'border-box' }}>

                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%', gap: '1.5rem' }}>
                    {/* Top Left Text */}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text)' }}>Control H&S</p>
                    </div>

                    {/* Center Main Title */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.5rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1 }}>CHECK LIST</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '0.25rem' }}>Higiene y Seguridad</p>
                    </div>

                    {/* Right Document Counter */}
                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--color-border)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>DOCUMENTO N°</div>
                        <input
                            style={{ textAlign: 'right', fontWeight: 900, fontSize: '1.5rem', border: 'none', borderBottom: '2px solid var(--color-border)', background: 'transparent', width: '120px', outline: 'none' }}
                            value={inspectionInfo.serial}
                            onChange={e => setInspectionInfo({ ...inspectionInfo, serial: e.target.value })}
                        />
                    </div>
                </div>

                <div style={{ border: '2px solid var(--color-border)', borderRadius: '12px', marginBottom: '2.5rem', width: '100%', overflow: 'hidden' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ borderBottom: '2px solid var(--color-border)', width: '100%' }}>
                        <div className="sm:col-span-2 print:col-span-2"><DocBox label="CLIENTE / EMPRESA" value={companyInfo.name} onChange={v => setCompanyInfo({ ...companyInfo, name: v })} large /></div>
                        <div className="sm:col-span-1 print:col-span-1 border-t sm:border-t-0 border-[var(--color-border)] sm:border-l"><DocBox label="CUIT / CUIL" value={companyInfo.cuit} onChange={v => setCompanyInfo({ ...companyInfo, cuit: v })} /></div>
                        <div className="sm:col-span-1 print:col-span-1 border-t sm:border-t-0 border-[var(--color-border)] sm:border-l"><DocBox label="UBICACIÓN / OBRA" value={companyInfo.location} onChange={v => setCompanyInfo({ ...companyInfo, location: v })} /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%' }}>
                        <div className="sm:col-span-2 print:col-span-2">
                            <DocBox
                                label="EQUIPO REVISADO"
                                value={inspectionInfo.item}
                                onChange={v => setInspectionInfo({ ...inspectionInfo, item: v })}
                                large
                                highlight
                                list="equipment-examples"
                                placeholder="Ej: Amoladora, Andamio..."
                            />
                        </div>
                        <div className="sm:col-span-1 print:col-span-1 border-t sm:border-t-0 border-[var(--color-border)] sm:border-l"><DocBox label="FECHA REVISIÓN" value={inspectionInfo.date} onChange={v => setInspectionInfo({ ...inspectionInfo, date: v })} type="date" /></div>
                        <div className="sm:col-span-1 print:col-span-1 border-t sm:border-t-0 border-[var(--color-border)] sm:border-l"><DocBox label="OPERADOR" value={companyInfo.inspector} onChange={v => setCompanyInfo({ ...companyInfo, inspector: v })} /></div>
                    </div>
                </div>

                <div className="space-y-12">
                    {activeSections.map(section => (
                        <div key={section.id} className="card w-full mb-6" style={{ padding: 0 }}>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderBottom: '2px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '4rem' }}>
                                <input
                                    className="font-black text-xl uppercase tracking-tighter bg-transparent outline-none w-full border-none focus:ring-0 text-black text-center placeholder:text-slate-400 print-text-center block"
                                    style={{ textAlign: 'center', margin: 0 }}
                                    value={section.title}
                                    onChange={e => updateSectionTitle(section.id, e.target.value)}
                                />
                                <div className="flex gap-2 no-print shrink-0 ml-4">
                                    <button
                                        onClick={() => removeSection(section.id)}
                                        style={{ padding: '0.4rem 0.8rem', background: 'var(--color-danger)', color: 'white', fontSize: '0.65rem', fontWeight: 900, border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        <X size={12} strokeWidth={4} /> QUITAR
                                    </button>
                                    <button
                                        onClick={() => checkAllOk(section.id)}
                                        style={{ padding: '0.4rem 0.8rem', background: 'var(--color-text)', color: 'white', fontSize: '0.65rem', fontWeight: 900, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        TODO OK
                                    </button>
                                    <button
                                        onClick={() => addItem(section.id)}
                                        style={{ padding: '0.4rem 0.8rem', background: 'var(--color-primary)', color: 'white', fontSize: '0.65rem', fontWeight: 900, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        + ITEM
                                    </button>
                                </div>
                            </div>

                            <div className="w-full flex-col divide-y divide-slate-200">
                                {section.items.map((item, idx) => (
                                    <div key={idx} className="group hover:bg-slate-50/20 transition-colors flex flex-col sm:flex-row print:flex-row items-stretch sm:items-center print:items-center">
                                        <div className="flex-1 flex flex-row items-start sm:items-center min-w-0 p-4 pb-0 sm:pb-4 print:pb-4 border-b border-transparent sm:pr-4 print:pr-4">
                                            <div className="text-center font-black text-[0.6rem] bg-slate-50/50 h-10 w-8 flex items-center justify-center rounded-md mr-3 text-slate-400 border border-slate-100 shrink-0">{idx + 1}</div>
                                            <textarea
                                                rows={1}
                                                className="w-full px-1 py-2 font-bold text-slate-800 text-[0.85rem] outline-none bg-transparent resize-none leading-tight border-none focus:ring-0 placeholder:text-slate-300 min-h-[40px] no-print block"
                                                value={item.text}
                                                onInput={(e) => {
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                }}
                                                onChange={e => updateItem(section.id, idx, 'text', e.target.value)}
                                            />
                                            <div className="print-only w-full px-1 py-2 font-bold text-slate-800 text-[0.85rem] leading-tight whitespace-pre-wrap break-words">
                                                {item.text}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end print:justify-end gap-2 w-full sm:w-auto print:w-auto p-4 pt-2 sm:pt-4 print:pt-4">
                                            <div className="no-print w-[135px] flex-shrink-0">
                                                <div className="checklist-status-buttons">
                                                    <StatusBtn active={item.status === 'OK'} type="OK" onClick={() => updateItem(section.id, idx, 'status', 'OK')} />
                                                    <StatusBtn active={item.status === 'FAIL'} type="FAIL" onClick={() => updateItem(section.id, idx, 'status', 'FAIL')} />
                                                    <StatusBtn active={item.status === 'NA'} type="NA" onClick={() => updateItem(section.id, idx, 'status', 'NA')} />
                                                </div>
                                            </div>
                                            <div className="hidden print:flex items-center justify-center font-black text-black w-[50px]">
                                                {item.status === 'OK' ? <Check size={18} strokeWidth={4} /> :
                                                    item.status === 'FAIL' ? <X size={18} strokeWidth={4} /> :
                                                        item.status === 'NA' ? <span className="text-[0.6rem]">N/A</span> : ''}
                                            </div>
                                            <div className="no-print w-[35px] text-right">
                                                <button onClick={() => removeItem(section.id, idx)} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-1 active:scale-95 bg-transparent border-none cursor-pointer"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 border-2 border-slate-300 rounded-xl p-8 bg-slate-50 relative text-left">
                    <div className="absolute -top-4 left-8 bg-slate-800 text-white px-5 py-0.5 font-black text-[0.65rem] uppercase italic tracking-[0.2em] shadow-sm z-10 rounded-b-md">OBSERVACIONES</div>
                    <textarea
                        className="w-full bg-transparent outline-none text-[1rem] font-bold leading-relaxed resize-none min-h-[140px] placeholder:text-slate-300 relative z-20 text-left no-print block"
                        placeholder="Ingrese observaciones, hallazgos o medidas correctivas..."
                        value={observations}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onChange={e => setObservations(e.target.value)}
                    />
                    <div className="print-only w-full text-[1rem] font-bold leading-relaxed whitespace-pre-wrap break-words relative z-20 text-left min-h-[140px]">
                        {observations || 'Sin observaciones adicionales.'}
                    </div>
                </div>

                {/* SIGNATURE CONTROLS (NO PRINT) */}
                <div className="no-print mt-10 p-6 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center text-sm font-bold text-slate-700">
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

                <div className="mt-16 sm:px-4 signature-section">
                    <div className="signature-container-row">
                        {showSignatures.operator && (
                            <div className="signature-item-box">
                                <div className="signature-line"></div>
                                <p className="text-[0.6rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">OPERADOR</p>
                                <p className="text-[0.7rem] font-black uppercase text-black leading-none break-words min-h-[0.7rem]">{companyInfo.inspector || ' '}</p>
                                <p className="text-[0.5rem] font-bold text-blue-600 uppercase tracking-tighter mt-1" style={{ color: 'var(--color-primary)' }}>Firma / Aclaración</p>
                            </div>
                        )}

                        {showSignatures.supervisor && (
                            <div className="signature-item-box">
                                <div className="signature-line"></div>
                                <p className="text-[0.6rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">SUPERVISOR</p>
                                <p className="text-[0.7rem] font-black uppercase text-black leading-none">DNI / ACLARACIÓN</p>
                                <p className="text-[0.5rem] font-bold text-blue-600 uppercase tracking-tighter mt-1" style={{ color: 'var(--color-primary)' }}>Firma del Supervisor</p>
                            </div>
                        )}

                        {showSignatures.professional && (
                            <div className="signature-item-box">
                                <div className="signature-line"></div>
                                <p className="text-[0.6rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">PROFESIONAL ACTUANTE</p>
                                <p className="text-[0.7rem] font-black uppercase text-black leading-none">SELLO Y FIRMA</p>
                                <p className="text-[0.5rem] font-bold text-blue-600 uppercase tracking-tighter mt-1" style={{ color: 'var(--color-primary)' }}>Matrícula</p>
                            </div>
                        )}
                    </div>
                    {(showSignatures.operator || showSignatures.supervisor || showSignatures.professional) && (
                        <p className="text-center mt-12 text-slate-400 font-black text-[0.6rem] uppercase tracking-[0.5em] leading-none opacity-50 italic">Documento certificado según normativas de seguridad industrial.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function DocBox({ label, value, onChange, type = "text", large = false, highlight = false, flex = 1, list = null }) {
    return (
        <div className={`p-3 min-w-0 flex flex-col justify-center sm:border-r-2 last:border-r-0 sm:print:border-r-2 border-slate-200 ${highlight ? 'bg-slate-50/50' : ''}`}>
            <label className="text-[0.55rem] font-black text-slate-400 uppercase tracking-widest block mb-1 whitespace-nowrap leading-none text-left">{label}</label>
            <input
                type={type}
                list={list}
                className={`w-full outline-none bg-transparent font-black ${large ? 'text-lg tracking-tight' : 'text-xs uppercase'} text-black focus:bg-yellow-50 text-left transition-colors min-w-0`}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={large ? "Ej: Amoladora, Andamio..." : ""}
            />
        </div>
    );
}

function StatusBtn({ active, type, onClick }) {
    const config = {
        OK: { label: 'SI', activeClass: 'active-ok' },
        FAIL: { label: 'NO', activeClass: 'active-fail' },
        NA: { label: 'NA', activeClass: 'active-na' }
    };
    const c = config[type];
    return (
        <button
            onClick={onClick}
            className={`status-btn ${active ? c.activeClass : ''}`}
        >
            {c.label}
        </button>
    );
}
