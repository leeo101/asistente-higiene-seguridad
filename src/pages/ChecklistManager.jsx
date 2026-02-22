import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ClipboardCheck, Printer, Plus,
    Settings, AlertTriangle, Building2, Calendar,
    Check, ShieldCheck, Trash2, Edit3, X,
    Share2, Save
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const DEFAULT_TEMPLATES = {
    'manual_tools': {
        title: 'Herramientas Manuales',
        icon: <Plus size={18} />,
        items: [
            'Mangos en buen estado (sin fisuras, astillas ni flojos)',
            'Cabezas de herramientas de golpe sin rebabas ni deformaciones (hongos)',
            'Herramienta limpia, seca and libre de grasa/aceite',
            'No presenta oxidacion excesiva que debilite la estructura',
            'Filo adecuado and protegido cuando no esta en uso',
            'Sujecion firme de las partes moviles',
            'Almacenamiento en portaherramientas adecuados'
        ]
    },
    'electric_tools': {
        title: 'Herramientas Electricas Portatiles',
        icon: <Settings size={18} />,
        items: [
            'Cables sin peladuras, cortes and empalmes precarios',
            'Ficha de conexion original and en buen estado (con puesta a tierra)',
            'Carcasa sin roturas, fisuras ni tornillos faltantes',
            'Gatillo de accionamiento funciona correctamente',
            'Protecciones/resguardos en su lugar and firmes',
            'Escobillas sin chispas excesivas'
        ]
    },
    'circular_saw': {
        title: 'Sierra Circular de Mano',
        icon: <ShieldCheck size={18} />,
        items: [
            'Resguardo retractil funciona suavemente',
            'Hoja de sierra sin dientes rotos and con filo',
            'Cuchillo divisor alineado and firmemente sujeto',
            'Boton de bloqueo de seguridad operativo',
            'Disco adecuado para las RPM de la maquina'
        ]
    },
    'grinder': {
        title: 'Amoladora Angular',
        icon: <AlertTriangle size={18} />,
        items: [
            'Resguardo metalico cubre como minimo el 50% del disco',
            'Mango lateral colocado and permanentemente firme',
            'Disco adecuado para la velocidad (RPM) de la maquina',
            'Disco sin rajaduras ni golpes'
        ]
    },
    'scaffolding': {
        title: 'Andamios and Estructuras',
        icon: <Building2 size={18} />,
        items: [
            'Apoyos sobre base firme and nivelada',
            'Estructura libre de oxidacion and deformaicones',
            'Tablones metalicos o madera sin fisuras',
            'Plataforma de trabajo completa and trabada'
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
            'Orden and limpieza del sector',
            'Extintor de incendios cercano',
            'Señalización de seguridad'
        ]
    }
];

export default function ChecklistManager() {
    const navigate = useNavigate();
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
            }
        }
    }, [searchParams]);

    const handleSave = () => {
        const id = searchParams.get('id') || Date.now().toString();

        const data = {
            id,
            companyInfo,
            inspectionInfo,
            activeSections,
            observations,
            updatedAt: new Date().toISOString()
        };

        // Deep save for specific report persistence
        localStorage.setItem(`checklist_${id}`, JSON.stringify(data));

        // Sync with history list
        const history = JSON.parse(localStorage.getItem('tool_checklists_history') || '[]');
        const existingIndex = history.findIndex(h => h.id === id);

        const summaryData = {
            id,
            empresa: companyInfo.name,
            equipo: inspectionInfo.item,
            serial: inspectionInfo.serial,
            fecha: inspectionInfo.date,
            type: 'Checklist'
        };

        if (existingIndex >= 0) {
            history[existingIndex] = summaryData;
        } else {
            history.unshift(summaryData);
        }

        localStorage.setItem('tool_checklists_history', JSON.stringify(history));
        alert('Checklist guardado con éxito y registrado en el historial ✅');
    };

    const handleShare = async () => {
        const text = `Checklist H&S (Escritorio) - ${inspectionInfo.item}\nDocumento: ${inspectionInfo.serial}\nEmpresa: ${companyInfo.name}\nOperador: ${companyInfo.inspector}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Checklist de Higiene y Seguridad',
                    text: text,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Error al compartir:', err);
            }
        } else {
            await navigator.clipboard.writeText(text);
            alert('Enlace y resumen copiados al portapapeles 📋');
        }
    };

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
        <div className="flex bg-[#0f172a] min-h-screen text-white font-sans overflow-x-hidden">
            <div className="no-print">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 ml-64 overflow-y-auto print:ml-0 print:p-0">
                <div className="no-print mb-8 flex justify-between items-center bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl max-w-5xl mx-auto">
                    <div className="flex gap-6 items-center">
                        <div className="p-4 bg-blue-500/10 rounded-2xl">
                            <ClipboardCheck className="text-blue-500" size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Escritorio - Control H&S</h1>
                            <p className="text-slate-400">Edición de listas de chequeo.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-black transition-all shadow-lg active:scale-95 border border-slate-700"
                        >
                            <Save size={20} className="text-green-500" />
                            GUARDAR
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-black transition-all shadow-lg active:scale-95 border border-slate-700"
                        >
                            <Share2 size={20} className="text-blue-400" />
                            COMPARTIR
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-black transition-all shadow-xl active:scale-95"
                        >
                            <Printer size={20} />
                            IMPRIMIR
                        </button>
                    </div>
                </div>

                {/* TEMPLATE SELECTOR - EXPLICITLY HIDDEN */}
                <div className="no-print grid grid-cols-5 gap-6 mb-10 max-w-5xl mx-auto" id="template-selector">
                    {Object.entries(DEFAULT_TEMPLATES).map(([key, value]) => {
                        const active = activeSections.some(s => s.id === key);
                        return (
                            <button
                                key={key}
                                onClick={() => toggleTemplate(key)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${active ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                                    }`}
                            >
                                <div className="font-black text-[0.75rem] text-slate-100 uppercase tracking-tight">{value.title}</div>
                            </button>
                        );
                    })}
                </div>

                <div className="bg-white text-black p-10 shadow-2xl mx-auto print-area border-4 border-black" style={{ width: '100%', maxWidth: '850px', boxSizing: 'border-box' }}>

                    <div className="flex justify-between items-end border-b-[6px] border-black pb-6 mb-8 text-left">
                        <div className="flex gap-6 items-center">
                            <h1 className="font-black text-4xl uppercase leading-none tracking-tighter">CHECK LIST</h1>
                        </div>
                        <div className="text-right">
                            <div className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest mb-1">DOCUMENTO N°</div>
                            <input className="text-right font-black text-2xl outline-none bg-transparent w-40 border-b-2 border-slate-100" value={inspectionInfo.serial} onChange={e => setInspectionInfo({ ...inspectionInfo, serial: e.target.value })} />
                        </div>
                    </div>

                    <div className="border-[4px] border-black mb-10 w-full overflow-hidden text-left">
                        <div className="flex border-b-[4px] border-black">
                            <DocBox label="CLIENTE / EMPRESA" value={companyInfo.name} onChange={v => setCompanyInfo({ ...companyInfo, name: v })} flex={2} large />
                            <DocBox label="CUIT / CUIL" value={companyInfo.cuit} onChange={v => setCompanyInfo({ ...companyInfo, cuit: v })} flex={1} />
                            <DocBox label="UBICACIÓN / OBRA" value={companyInfo.location} onChange={v => setCompanyInfo({ ...companyInfo, location: v })} flex={1} />
                        </div>
                        <div className="flex">
                            <DocBox
                                label="EQUIPO REVISADO"
                                value={inspectionInfo.item}
                                onChange={v => setInspectionInfo({ ...inspectionInfo, item: v })}
                                flex={2}
                                large
                                highlight
                                list="equipment-examples-desktop"
                            />
                            <datalist id="equipment-examples-desktop">
                                <option value="Amoladora Angular 4.5 pulgadas" />
                                <option value="Andamio Tubular Metálico" />
                                <option value="Sierra Circular de Banco" />
                                <option value="Retroexcavadora CAT 416" />
                                <option value="Arnés de Seguridad Completo" />
                                <option value="Escalera de Extensión (Dieléctrica)" />
                                <option value="Tablero Eléctrico de Obra" />
                            </datalist>
                            <DocBox label="FECHA REVISIÓN" value={inspectionInfo.date} onChange={v => setInspectionInfo({ ...inspectionInfo, date: v })} type="date" flex={1} />
                            <DocBox label="OPERADOR" value={companyInfo.inspector} onChange={v => setCompanyInfo({ ...companyInfo, inspector: v })} flex={1} />
                        </div>
                    </div>

                    <div className="space-y-12">
                        {activeSections.map(section => (
                            <div key={section.id} className="border-[4px] border-black w-full overflow-hidden">
                                <div className="bg-slate-100 p-4 border-b-[6px] border-black flex justify-between items-center h-16">
                                    <input className="font-black text-xl uppercase tracking-tighter bg-transparent outline-none w-full text-left" value={section.title} onChange={e => updateSectionTitle(section.id, e.target.value)} />
                                    <div className="flex gap-2 no-print shrink-0">
                                        <button
                                            onClick={() => removeSection(section.id)}
                                            className="px-3 py-1 bg-red-600 text-white text-[0.65rem] font-black hover:bg-red-700 transition-colors flex items-center gap-1"
                                        >
                                            <X size={12} strokeWidth={4} /> QUITAR SECCIÓN
                                        </button>
                                        <button onClick={() => checkAllOk(section.id)} className="px-3 py-1 bg-black text-white text-[0.65rem] font-black">TODO OK</button>
                                        <button onClick={() => addItem(section.id)} className="px-3 py-1 bg-blue-600 text-white text-[0.65rem] font-black">+ ITEM</button>
                                    </div>
                                </div>
                                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                                    <tbody className="divide-y divide-slate-200">
                                        {section.items.map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50">
                                                <td className="w-8 text-center font-black text-[0.6rem] bg-slate-50/50 h-12 leading-none shrink-0 text-slate-400">{idx + 1}</td>
                                                <td className="p-0 align-middle text-left">
                                                    <textarea
                                                        rows={1}
                                                        className="w-full p-4 font-bold text-slate-800 text-[0.85rem] outline-none bg-transparent resize-none leading-tight border-none text-left"
                                                        value={item.text}
                                                        onChange={e => updateItem(section.id, idx, 'text', e.target.value)}
                                                    />
                                                </td>
                                                <td className="w-[150px] no-print px-2 py-2"><div className="flex gap-1 h-9"><StatusBtn active={item.status === 'OK'} type="OK" onClick={() => updateItem(section.id, idx, 'status', 'OK')} /><StatusBtn active={item.status === 'FAIL'} type="FAIL" onClick={() => updateItem(section.id, idx, 'status', 'FAIL')} /><StatusBtn active={item.status === 'NA'} type="NA" onClick={() => updateItem(section.id, idx, 'status', 'NA')} /></div></td>
                                                <td className="w-[60px] hidden print:table-cell text-center bg-white align-middle">
                                                    <div className="flex items-center justify-center font-black text-black">
                                                        {item.status === 'OK' ? <Check size={20} strokeWidth={4} /> :
                                                            item.status === 'FAIL' ? <X size={20} strokeWidth={4} /> :
                                                                item.status === 'NA' ? <span className="text-[0.6rem]">N/A</span> : ''}
                                                    </div>
                                                </td>
                                                <td className="no-print w-8 text-center shrink-0"><button onClick={() => removeItem(section.id, idx)} className="text-red-200 hover:text-red-600 opacity-0 group-hover:opacity-100 p-1"><Trash2 size={14} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 border-[4px] border-black p-8 bg-slate-50 relative text-left">
                        <div className="absolute -top-4 left-8 bg-black text-white px-5 py-0.5 font-black text-[0.65rem] uppercase italic tracking-widest z-10 shadow-md">OBSERVACIONES</div>
                        <textarea className="w-full bg-transparent outline-none text-[1rem] font-bold min-h-[140px] relative z-20 text-left" value={observations} onChange={e => setObservations(e.target.value)} />
                    </div>

                    <div className="mt-32 px-4">
                        <div className="print-flex-row justify-between items-start gap-12 flex flex-row">
                            <div className="flex-1 flex flex-col items-center">
                                <div className="w-full border-t-2 border-black mb-3"></div>
                                <div className="text-center">
                                    <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest mb-1">OPERADOR</p>
                                    <p className="text-[0.8rem] font-black uppercase text-black leading-none">{companyInfo.inspector}</p>
                                    <p className="text-[0.55rem] font-bold text-blue-600 uppercase tracking-tighter mt-1">Firma y DNI</p>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                                <div className="w-full border-t-2 border-black mb-3"></div>
                                <div className="text-center">
                                    <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest mb-1">SUPERVISOR</p>
                                    <p className="text-[0.8rem] font-black uppercase text-black leading-none">DNI / ACLARACIÓN</p>
                                    <p className="text-[0.55rem] font-bold text-blue-600 uppercase tracking-tighter mt-1">Firma del Supervisor</p>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                                <div className="w-full border-t-2 border-black mb-3"></div>
                                <div className="text-center">
                                    <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest mb-1">PROFESIONAL ACTUANTE</p>
                                    <p className="text-[0.8rem] font-black uppercase text-black leading-none">SELLO Y FIRMA</p>
                                    <p className="text-[0.55rem] font-bold text-blue-600 uppercase tracking-tighter mt-1">Matrícula Profesional</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap'); .font-sans { font-family: 'Outfit', sans-serif !important; } 
                @media print { 
                    .no-print, .no-print *, button, .sidebar, #template-selector { 
                        display: none !important; 
                        visibility: hidden !important; 
                        opacity: 0 !important; 
                        height: 0 !important; 
                        width: 0 !important; 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        position: absolute !important; 
                        left: -9999px !important; 
                    } 
                    body, html { 
                        background: white !important; 
                        color: black !important;
                        margin: 0 !important; 
                        padding: 0 !important; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    } 
                    main { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        width: 100% !important;
                    } 
                    .print-area { 
                        border: 4px solid black !important; 
                        width: 100% !important; 
                        max-width: none !important; 
                        margin: 0 !important; 
                        padding: 5mm !important; 
                        overflow: visible !important; 
                        background: white !important;
                        box-shadow: none !important;
                    } 
                    /* Maintain original document styling but ensure readability */
                    * { 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page { margin: 10mm; size: auto; } 
                    table { 
                        width: 100% !important; 
                        border-collapse: collapse !important; 
                    } 
                    td, th { 
                        vertical-align: middle !important; 
                    } 
                    td:first-child { width: 6mm !important; text-align: center !important; font-size: 8px !important; } 
                    td:last-child { text-align: center !important; } 
                    .print-flex-row { display: flex !important; flex-direction: row !important; justify-content: space-between !important; } 
                    .mt-32 { margin-top: 25mm !important; } 
                    .gap-12 { gap: 15mm !important; } 
                }
`}
            </style>
        </div>
    );
}

function DocBox({ label, value, onChange, type = "text", large = false, highlight = false, flex = 1, list = null }) {
    return (
        <div className={`p-4 flex flex-col justify-center border-r-[4px] last:border-r-0 border-black ${highlight ? 'bg-slate-50' : ''}`} style={{ flex }}>
            <label className="text-[0.55rem] font-black text-slate-400 uppercase tracking-widest block mb-1 whitespace-nowrap leading-none text-left">{label}</label>
            <input
                type={type}
                list={list}
                className={`w-full outline-none bg-transparent font-black ${large ? 'text-lg tracking-tight' : 'text-xs uppercase'} text-black text-left focus:bg-yellow-50`}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={large ? "Ej: Amoladora, Andamio..." : ""}
            />
        </div>
    );
}

function StatusBtn({ active, type, onClick }) {
    const config = { OK: { label: 'SI', activeClass: 'bg-green-600 border-green-700 text-white shadow-md' }, FAIL: { label: 'NO', activeClass: 'bg-red-600 border-red-700 text-white shadow-md' }, NA: { label: 'NA', activeClass: 'bg-black text-white shadow-sm' } };
    const c = config[type];
    return <button onClick={onClick} className={`flex-1 flex items-center justify-center border-2 font-black text-[0.65rem] transition-all uppercase ${active ? c.activeClass : 'bg-white text-slate-200 border-slate-100 hover:border-slate-300'}`}>{c.label}</button>;
}
