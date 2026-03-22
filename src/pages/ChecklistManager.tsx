import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ClipboardCheck, Printer, Plus,
    Settings, TriangleAlert, Building2, Calendar,
    Check, ShieldCheck, Trash2, Edit3, X,
    Share2, Save, ArrowLeft, Info
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import ShareModal from '../components/ShareModal';
import CompanyLogo from '../components/CompanyLogo';
import ChecklistPdfGenerator from '../components/ChecklistPdfGenerator';
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
        icon: <TriangleAlert size={18} />,
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

// Normativas aplicables por país (Mercosur + Chile)
const NORMS_BY_COUNTRY = {
    argentina: [
        { id: 'ley19587', name: 'Ley 19.587 - Higiene y Seguridad en el Trabajo', category: 'Nacional' },
        { id: 'dec351', name: 'Decreto 351/79 - Reglamento General', category: 'Nacional' },
        { id: 'res481', name: 'Res. SRT 481/16 - Estiba y Desestiba', category: 'SRT' },
        { id: 'res299', name: 'Res. SRT 299/11 - Trabajo en Altura', category: 'SRT' },
        { id: 'res295', name: 'Res. SRT 295/11 - Espacios Confinados', category: 'SRT' },
        { id: 'res101', name: 'Res. SRT 101/17 - Soldadura', category: 'SRT' },
        { id: 'res594', name: 'Res. SRT 594/15 - Agentes Químicos', category: 'SRT' },
        { id: 'art_reglamento', name: 'Reglamento Interno de ART', category: 'ART' }
    ],
    chile: [
        { id: 'dl109', name: 'D.L. 109/1970 - Código del Trabajo', category: 'Nacional' },
        { id: 'dec594', name: 'Decreto 594/1999 - Condiciones Sanitarias', category: 'Ministerio Salud' },
        { id: 'dec40', name: 'Decreto 40/1969 - Reglamento Higiene y Seguridad', category: 'Ministerio Trabajo' },
        { id: 'dec32', name: 'Decreto 32/2014 - Elementos Protección Personal', category: 'Ministerio Trabajo' },
        { id: 'ley16744', name: 'Ley 16.744 - Accidentes del Trabajo', category: 'Nacional' },
        { id: 'dec109', name: 'Decreto 109/2012 - Trabajo en Altura', category: 'Ministerio Trabajo' },
        { id: 'dec118', name: 'Decreto 118/2020 - Espacios Confinados', category: 'Ministerio Trabajo' },
        { id: 'mutual', name: 'Reglamento Mutual de Seguridad', category: 'Mutual' }
    ],
    uruguay: [
        { id: 'dec351', name: 'Decreto 351/007 - Reglamento de Higiene y Seguridad', category: 'Nacional' },
        { id: 'ley18320', name: 'Ley 18.320 - Accidentes de Trabajo', category: 'Nacional' },
        { id: 'dec488', name: 'Decreto 488/013 - Trabajo en Altura', category: 'MTSS' },
        { id: 'dec182', name: 'Decreto 182/018 - Espacios Confinados', category: 'MTSS' },
        { id: 'bps', name: 'Normativa BPS - Seguros de Accidentes', category: 'BPS' }
    ],
    bolivia: [
        { id: 'ley548', name: 'Ley 548 - Código Niña, Niño y Adolescente', category: 'Nacional' },
        { id: 'dec16998', name: 'Decreto Supremo 16998 - Seguridad Industrial', category: 'Nacional' },
        { id: 'dec24266', name: 'Decreto Supremo 24266 - Reglamento Higiene y Seguridad', category: 'Nacional' },
        { id: 'res068', name: 'Res. Min. 068/94 - Salud Ocupacional', category: 'Ministerio Salud' },
        { id: 'cnss', name: 'Reglamento CNSS - Seguridad Social', category: 'CNSS' }
    ],
    paraguay: [
        { id: 'ley213', name: 'Ley 213/93 - Seguridad y Salud en el Trabajo', category: 'Nacional' },
        { id: 'dec4234', name: 'Decreto 4.234 - Reglamento General', category: 'Nacional' },
        { id: 'res616', name: 'Res. MTES 616/14 - Trabajo en Altura', category: 'MTES' },
        { id: 'ips', name: 'Reglamento IPS - Instituto de Previsión Social', category: 'IPS' }
    ],
    internacional: [
        { id: 'iso45001', name: 'ISO 45001:2018 - Sistema de Gestión SST', category: 'ISO' },
        { id: 'iso14001', name: 'ISO 14001 - Gestión Ambiental', category: 'ISO' },
        { id: 'iso9001', name: 'ISO 9001 - Gestión de Calidad', category: 'ISO' },
        { id: 'nfpa10', name: 'NFPA 10 - Extintores Portátiles', category: 'NFPA' },
        { id: 'nfpa70e', name: 'NFPA 70E - Seguridad Eléctrica', category: 'NFPA' },
        { id: 'oshact', name: 'OSHA Act - Seguridad y Salud Ocupacional', category: 'OSHA' }
    ]
};

// Función para obtener normativas según el país
const getNormsForCountry = (country) => {
    const countryNorms = NORMS_BY_COUNTRY[country] || [];
    const internationalNorms = NORMS_BY_COUNTRY.internacional || [];
    return [...countryNorms, ...internationalNorms];
};

export default function ChecklistManager(): React.ReactElement | null {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const [searchParams] = useSearchParams();

    const [companyInfo, setCompanyInfo] = useState({
        name: '',
        inspector: '',
        address: '',
        responsable: ''
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
    const [actionPlan, setActionPlan] = useState([]);
    const [nextReview, setNextReview] = useState('');
    const [newAction, setNewAction] = useState({ action: '', responsible: '', dueDate: '', priority: 'medio' });
    const [selectedNorms, setSelectedNorms] = useState([]);
    const [userCountry, setUserCountry] = useState('argentina');
    const [availableNorms, setAvailableNorms] = useState([]);

    useEffect(() => {
        // Obtener país del usuario desde personalData
        const savedData = localStorage.getItem('personalData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            const country = parsed.country || 'argentina';
            setUserCountry(country);
            setAvailableNorms(getNormsForCountry(country));
        } else {
            setAvailableNorms(getNormsForCountry('argentina'));
        }
    }, []);

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
                setActionPlan(parsed.actionPlan || []);
                setNextReview(parsed.nextReview || '');
                setSelectedNorms(parsed.selectedNorms || []);
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
            actionPlan,
            nextReview,
            selectedNorms,
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
                isOpen={showShare}
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Checklist – ${companyInfo?.name || ''}`}
                text={`📋 Checklist de Inspección\n🏗️ Empresa: ${companyInfo?.name || '-'}\n📍 Ubicación: ${companyInfo?.address || '-'}\n👷 Responsable: ${companyInfo?.responsable || '-'}\n\nGenerado con Asistente H&S`}
                rawMessage={`📋 Checklist de Inspección\n🏗️ Empresa: ${companyInfo?.name || '-'}\n📍 Ubicación: ${companyInfo?.address || '-'}\n👷 Responsable: ${companyInfo?.responsable || '-'}\n\nGenerado con Asistente H&S`}
                elementIdToPrint="pdf-content"
                fileName={`Checklist_${companyInfo?.name || 'Reporte'}.pdf`}
            />

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
                    onClick={() => requirePro(() => setShowShare(true))}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => requirePro(() => window.print())}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: '#ffffff' }}
                >
                    <Printer size={18} /> IMPRIMIR
                </button>
            </div>

            {/* Header - Responsive */}
            <div className="no-print" style={{
                marginBottom: '1.5rem',
                padding: '1.5rem',
                background: 'var(--color-surface)',
                borderRadius: '20px',
                border: '1px solid #EBECF0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', justifyContent: 'center' }}>
                    <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'var(--color-background)', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 900, color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <ClipboardCheck size={24} />
                            Generador de Checklist
                        </h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Control H&S</p>
                    </div>
                </div>
            </div>

            {/* TEMPLATE SELECTOR - Responsive Grid */}
            <div className="no-print" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '0.8rem',
                marginBottom: '1.5rem'
            }}>
                {Object.entries(DEFAULT_TEMPLATES).map(([key, value]) => {
                    const active = activeSections.some(s => s.id === key);
                    return (
                        <button
                            key={key}
                            onClick={() => toggleTemplate(key)}
                            className="card"
                            style={{
                                padding: '0.8rem 0.5rem',
                                margin: 0,
                                border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: active ? 'var(--color-background)' : 'var(--color-surface)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                textAlign: 'center',
                                minHeight: '80px'
                            }}
                        >
                            <div style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                {React.cloneElement(value.icon, { size: 20 })}
                            </div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, lineHeight: 1.1 }}>{value.title}</span>
                        </button>
                    );
                })}
            </div>

            {/* EDITABLE SECTIONS - Responsive */}
            <div className="no-print" style={{ marginBottom: '2rem' }}>
                {activeSections.map(section => {
                                        return (
                        <div key={section.id} className="card" style={{ padding: 0, marginBottom: '1.5rem' }}>
                            <div style={{ background: 'var(--color-background)', padding: '1rem', borderBottom: '2px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
                                <input
                                    className="font-black text-xl uppercase tracking-tighter bg-transparent outline-none w-full border-none focus:ring-0 text-black text-center placeholder:text-slate-400"
                                    style={{ textAlign: 'center', margin: 0, width: '100%' }}
                                    value={section.title}
                                    onChange={e => updateSectionTitle(section.id, e.target.value)}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => removeSection(section.id)}
                                        style={{ padding: '0.4rem 0.8rem', background: 'var(--color-danger)', color: '#ffffff', fontSize: '0.65rem', fontWeight: 900, border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                                    >
                                        <X size={12} strokeWidth={4} /> QUITAR
                                    </button>
                                    <button
                                        onClick={() => checkAllOk(section.id)}
                                        style={{ padding: '0.4rem 0.8rem', background: 'var(--color-text)', color: '#ffffff', fontSize: '0.65rem', fontWeight: 900, border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                        TODO OK
                                    </button>
                                    <button
                                        onClick={() => addItem(section.id)}
                                        style={{ padding: '0.4rem 0.8rem', background: 'var(--color-primary)', color: '#ffffff', fontSize: '0.65rem', fontWeight: 900, border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                        + ITEM
                                    </button>
                                </div>
                            </div>

                            <div>
                                {section.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0', borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', gap: '0.8rem', flexWrap: 'wrap' }}>
                                            <div style={{ minWidth: '24px', height: '24px', background: 'var(--color-background)', color: 'var(--color-text-muted)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, flexShrink: 0 }}>
                                                {idx + 1}
                                            </div>
                                            <textarea
                                                rows={1}
                                                style={{ flex: 1, minWidth: '200px', padding: '0.5rem', fontWeight: 700, fontSize: '0.9rem', outline: 'none', background: 'transparent', resize: 'none', border: 'none', color: 'var(--color-text)' }}
                                                value={item.text}
                                                onInput={(e) => {
                                                    const target = e.target as any;
                                                    target.style.height = 'auto';
                                                    target.style.height = target.scrollHeight + 'px';
                                                }}
                                                onChange={e => updateItem(section.id, idx, 'text', e.target.value)}
                                            />
                                            <button
                                                onClick={() => {
                                                    const toastId = toast(
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                            <span style={{ fontSize: '0.9rem' }}>¿Eliminar este punto?</span>
                                                            <button
                                                                onClick={() => { removeItem(section.id, idx); toast.dismiss(toastId); }}
                                                                style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem' }}
                                                            >Sí</button>
                                                        </div>,
                                                        { duration: 4000, icon: '🗑️' }
                                                    );
                                                }}
                                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', padding: '0.3rem 0.45rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--color-background)', flexWrap: 'wrap' }}>
                                            <div className="checklist-status-buttons" style={{ flexShrink: 0, display: 'flex', gap: '0.5rem' }}>
                                                <StatusBtn active={item.status === 'OK'} type="OK" onClick={() => updateItem(section.id, idx, 'status', 'OK')} />
                                                <StatusBtn active={item.status === 'FAIL'} type="FAIL" onClick={() => updateItem(section.id, idx, 'status', 'FAIL')} />
                                                <StatusBtn active={item.status === 'NA'} type="NA" onClick={() => updateItem(section.id, idx, 'status', 'NA')} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FORMULARIOS EDITABLES - NO PRINT */}
            <div className="no-print" style={{ marginBottom: '2rem' }}>
                {/* PLAN DE ACCIÓN - FORMULARIO */}
                <div style={{ border: '2px solid #f59e0b', borderRadius: '12px', padding: '1.5rem', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '20px', background: '#f59e0b', color: '#fff', padding: '4px 12px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '4px' }}>
                        🎯 Plan de Acción
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.8rem', marginBottom: '1rem', marginTop: '0.5rem' }}>
                        <input type="text" placeholder="Acción correctiva" value={newAction.action} onChange={(e) => setNewAction({ ...newAction, action: e.target.value })} style={{ padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} />
                        <input type="text" placeholder="Responsable" value={newAction.responsible} onChange={(e) => setNewAction({ ...newAction, responsible: e.target.value })} style={{ padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="date" value={newAction.dueDate} onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })} style={{ flex: 1, padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} />
                            <select value={newAction.priority} onChange={(e) => setNewAction({ ...newAction, priority: e.target.value })} style={{ padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, outline: 'none', background: '#fff' }}>
                                <option value="bajo">🟢 Bajo</option>
                                <option value="medio">🟡 Medio</option>
                                <option value="alto">🟠 Alto</option>
                                <option value="critico">🔴 Crítico</option>
                            </select>
                        </div>
                        <button onClick={() => { if (newAction.action.trim()) { setActionPlan([...actionPlan, { ...newAction, id: Date.now() }]); setNewAction({ action: '', responsible: '', dueDate: '', priority: 'medio' }); toast.success('Acción agregada ✅'); } }} style={{ padding: '0.6rem 1rem', background: '#f59e0b', color: '#fff', fontWeight: 900, fontSize: '0.85rem', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Plus size={16} /> AGREGAR
                        </button>
                    </div>
                    {actionPlan.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.8rem' }}>
                            {actionPlan.map((action, idx) => (
                                <div key={action.id} style={{ background: '#fff', border: '1px solid #fcd34d', borderRadius: '8px', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <div style={{ minWidth: '24px', height: '24px', background: '#f59e0b', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, flexShrink: 0 }}>{idx + 1}</div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{action.action}</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.3rem', fontSize: '0.75rem' }}>
                                                {action.responsible && <span style={{ color: '#475569' }}>👤 {action.responsible}</span>}
                                                {action.dueDate && <span style={{ color: '#dc2626' }}>📅 {new Date(action.dueDate).toLocaleDateString()}</span>}
                                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem', background: action.priority === 'critico' ? '#fef2f2' : action.priority === 'alto' ? '#fff7ed' : action.priority === 'medio' ? '#fefce8' : '#f0fdf4', color: action.priority === 'critico' ? '#dc2626' : action.priority === 'alto' ? '#ea580c' : action.priority === 'medio' ? '#ca8a04' : '#16a34a' }}>
                                                    {action.priority === 'critico' ? '🔴' : action.priority === 'alto' ? '🟠' : action.priority === 'medio' ? '🟡' : '🟢'} {action.priority.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => { setActionPlan(actionPlan.filter(a => a.id !== action.id)); toast.success('Acción eliminada'); }} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', padding: '0.3rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* PRÓXIMA REVISIÓN */}
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Calendar size={24} color="#2563eb" />
                        <div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.85rem', color: '#1e3a8a', textTransform: 'uppercase' }}>Próxima Revisión Programada</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Seleccioná la fecha para el próximo control</p>
                        </div>
                    </div>
                    <input type="date" value={nextReview} onChange={(e) => setNextReview(e.target.value)} style={{ padding: '0.6rem 0.8rem', border: '1px solid #93c5fd', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, outline: 'none', background: '#fff' }} />
                </div>

                {/* NORMATIVA APLICABLE */}
                <div style={{ marginTop: '1rem', border: '2px solid #c084fc', borderRadius: '12px', padding: '1.5rem', background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '20px', background: '#9333ea', color: '#fff', padding: '4px 12px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '4px' }}>
                        📚 Normativa Aplicable
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1rem', marginTop: '0.5rem' }}>Seleccioná las normativas que aplican a esta inspección:</p>
                    {Array.from(new Set(availableNorms.map(norm => norm.category))).map(category => (
                        <div key={category} style={{ marginBottom: '1rem' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{category}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                                {availableNorms.filter(norm => norm.category === category).map(norm => (
                                    <label key={norm.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', background: selectedNorms.includes(norm.id) ? '#f3e8ff' : '#fff', border: `1px solid ${selectedNorms.includes(norm.id) ? '#a855f7' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <input type="checkbox" checked={selectedNorms.includes(norm.id)} onChange={(e) => { if (e.target.checked) { setSelectedNorms([...selectedNorms, norm.id]); } else { setSelectedNorms(selectedNorms.filter(id => id !== norm.id)); } }} className="w-4 h-4" />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>{norm.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PDF Generator - Fuera de pantalla, solo visible al imprimir o generar PDF */}
            <div
                id="pdf-generator-container"
                className="print-only"
                style={{
                    position: 'fixed',
                    left: '-99999px',
                    top: 0,
                    width: '210mm',
                    visibility: 'hidden'
                }}
            >
                <ChecklistPdfGenerator
                    checklistData={{
                        companyInfo,
                        inspectionInfo,
                        activeSections,
                        observations,
                        actionPlan,
                        nextReview,
                        selectedNorms,
                        showSignatures,
                        availableNorms
                    }}
                />
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
