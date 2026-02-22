import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Shield, Wrench,
    HardHat, Eye, Footprints, Ear, UserCheck, AlertTriangle,
    Construction, Thermometer, Zap, Activity, Users, FileText,
    Check, X, Building2, Pencil, ListChecks, HelpCircle, Printer
} from 'lucide-react';

export default function ATS() {
    const navigate = useNavigate();
    const capatazCanvasRef = useRef(null);
    const [isDrawingCapataz, setIsDrawingCapataz] = useState(false);

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

    const [formData, setFormData] = useState({
        empresa: '',
        cuit: '',
        actividad: '',
        sector: '',
        fecha: new Date().toISOString().slice(0, 10),
        personal: [{ nombre: '', dni: '' }],
        epp: [],
        herramientas: '',
        riesgos: {
            mecanicos: false,
            electricos: false,
            quimicos: false,
            ergonomicos: false,
            biologicos: false,
            caidas: false,
            incendio: false
        },
        pasos: [
            { paso: '', riesgo: '', medida: '', cumple: true }
        ],
        checklist: defaultChecklist,
        firmaCapataz: null
    });

    const [professional, setProfessional] = useState({
        name: '',
        license: '',
        signature: null
    });

    useEffect(() => {
        // Load professional data
        const personalData = localStorage.getItem('personalData');
        const sigData = localStorage.getItem('signatureStampData');
        const legacySig = localStorage.getItem('capturedSignature');

        let profName = 'Profesional no registrado';
        let profLicense = '';
        let profSig = legacySig || null;

        if (personalData) {
            const parsed = JSON.parse(personalData);
            profName = parsed.name || profName;
            profLicense = parsed.license || '';
        }

        if (sigData) {
            const parsed = JSON.parse(sigData);
            profSig = parsed.signature || profSig;
        }

        setProfessional({
            name: profName,
            license: profLicense,
            signature: profSig
        });
    }, []);

    const eppOptions = [
        { id: 'helmet', label: 'Casco', icon: <HardHat size={24} /> },
        { id: 'goggles', label: 'Anteojos', icon: <Eye size={24} /> },
        { id: 'boots', label: 'Calzado', icon: <Footprints size={24} /> },
        { id: 'ear', label: 'Auditiva', icon: <Ear size={24} /> },
        { id: 'gloves', label: 'Guantes', icon: <Shield size={24} /> },
        { id: 'vest', label: 'Reflectante', icon: <Construction size={24} /> },
        { id: 'respirator', label: 'Respiratoria', icon: <Activity size={24} /> },
        { id: 'harness', label: 'Arnés', icon: <AlertTriangle size={24} /> }
    ];

    const riesgoOptions = [
        { id: 'mecanicos', label: 'Mecánicos', icon: <Wrench size={20} /> },
        { id: 'electricos', label: 'Eléctricos', icon: <Zap size={20} /> },
        { id: 'quimicos', label: 'Químicos', icon: <Thermometer size={20} /> },
        { id: 'caidas', label: 'Caídas', icon: <AlertTriangle size={20} /> },
        { id: 'incendio', label: 'Incendio', icon: <Zap size={20} /> }
    ];

    const handlePPEChange = (id) => {
        setFormData(prev => ({
            ...prev,
            epp: prev.epp.includes(id)
                ? prev.epp.filter(i => i !== id)
                : [...prev.epp, id]
        }));
    };

    const handleRiskChange = (id) => {
        setFormData(prev => ({
            ...prev,
            riesgos: { ...prev.riesgos, [id]: !prev.riesgos[id] }
        }));
    };

    const handlePasoChange = (index, field, value) => {
        const newPasos = [...formData.pasos];
        newPasos[index][field] = value;
        setFormData({ ...formData, pasos: newPasos });
    };

    const toggleCumple = (index) => {
        const newPasos = [...formData.pasos];
        newPasos[index].cumple = !newPasos[index].cumple;
        setFormData({ ...formData, pasos: newPasos });
    };

    const addPaso = () => {
        setFormData({
            ...formData,
            pasos: [...formData.pasos, { paso: '', riesgo: '', medida: '', cumple: true }]
        });
    };

    const removePaso = (index) => {
        if (formData.pasos.length > 1) {
            setFormData({ ...formData, pasos: formData.pasos.filter((_, i) => i !== index) });
        }
    };

    const handlePersonalChange = (index, field, value) => {
        const newPersonal = [...formData.personal];
        newPersonal[index][field] = value;
        setFormData({ ...formData, personal: newPersonal });
    };

    const addPersonal = () => {
        setFormData({
            ...formData,
            personal: [...formData.personal, { nombre: '', dni: '' }]
        });
    };

    // Checklist functions
    const toggleChecklistState = (id, newState) => {
        const newChecklist = formData.checklist.map(item =>
            item.id === id ? { ...item, estado: newState } : item
        );
        setFormData({ ...formData, checklist: newChecklist });
    };

    const handleQuestionChange = (id, newText) => {
        const newChecklist = formData.checklist.map(item =>
            item.id === id ? { ...item, pregunta: newText } : item
        );
        setFormData({ ...formData, checklist: newChecklist });
    };

    const handleObservationChange = (id, newText) => {
        const newChecklist = formData.checklist.map(item =>
            item.id === id ? { ...item, observaciones: newText } : item
        );
        setFormData({ ...formData, checklist: newChecklist });
    };

    const addQuestion = (categoria = 'General') => {
        setFormData({
            ...formData,
            checklist: [...formData.checklist, { id: Date.now(), categoria, pregunta: '', estado: 'Cumple', observaciones: '' }]
        });
    };

    const removeQuestion = (id) => {
        setFormData({
            ...formData,
            checklist: formData.checklist.filter(item => item.id !== id)
        });
    };

    // Signature Logic for Capataz
    const startDrawing = (e) => {
        const canvas = capatazCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawingCapataz(true);
    };

    const draw = (e) => {
        if (!isDrawingCapataz) return;
        const canvas = capatazCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const clearCapatazSignature = () => {
        const canvas = capatazCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setFormData(prev => ({ ...prev, firmaCapataz: null }));
    };

    const handlePrint = () => {
        // We capture the signature if it's not already saved to state
        if (capatazCanvasRef.current) {
            setFormData(prev => ({ ...prev, firmaCapataz: capatazCanvasRef.current.toDataURL() }));
        }

        // Wait a bit for state to update (though not strictly necessary for window.print usually)
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const handleSave = (e) => {
        e.preventDefault();

        // Final signature capture
        const finalData = {
            ...formData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };

        if (capatazCanvasRef.current) {
            finalData.firmaCapataz = capatazCanvasRef.current.toDataURL();
        }

        // Get existing history or empty array
        const existingHistoryRaw = localStorage.getItem('ats_history');
        const existingHistory = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];

        // Add new record to history
        const newHistory = [finalData, ...existingHistory];

        localStorage.setItem('ats_history', JSON.stringify(newHistory));
        localStorage.removeItem('tempATS'); // Clean up old temp if exists

        alert('ATS Profesional guardado con éxito en el historial');
        navigate('/ats-history'); // Plan to create this page
    };

    return (
        <div className="container" style={{ paddingBottom: '7rem', maxWidth: '800px' }}>
            <style>
                {`
                    @media print {
                        nav, .sidebar, button, .no-print, [role="button"], .btn-primary, .btn-secondary, .trash-btn {
                            display: none !important;
                        }
                        .container {
                            padding: 0 !important;
                            margin: 0 !important;
                            max-width: 100% !important;
                        }
                        body {
                            background: white !important;
                            color: black !important;
                        }
                        .card {
                            border: 1px solid #eee !important;
                            box-shadow: none !important;
                            margin-bottom: 20px !important;
                            break-inside: avoid;
                        }
                        input, textarea {
                            border: none !important;
                            padding: 0 !important;
                            background: transparent !important;
                            color: black !important;
                            font-size: 1rem !important;
                            resize: none !important;
                        }
                        label {
                            color: #666 !important;
                        }
                        h3, h2 {
                            color: black !important;
                            border-bottom: 2px solid #eee;
                            padding-bottom: 5px;
                        }
                        .print-category-header {
                            background: #f9fafb !important;
                            padding: 5px 10px !important;
                            border-radius: 4px !important;
                            margin: 15px 0 10px 0 !important;
                            font-weight: bold !important;
                            font-size: 1rem !important;
                            text-transform: uppercase !important;
                            border-left: 4px solid #374151 !important;
                        }
                        .signature-box {
                            break-inside: avoid;
                        }
                        .checklist-btn {
                            display: none !important;
                        }
                        .print-status {
                            display: block !important;
                            font-weight: bold !important;
                            font-size: 1.1rem !important;
                            margin: 10px 0 !important;
                        }
                        .status-symbol-cumple {
                            color: #166534 !important;
                            margin-right: 8px;
                        }
                        .status-symbol-nocumple {
                            color: #991b1b !important;
                            margin-right: 8px;
                        }
                        .printable-header {
                            display: block !important;
                            margin-bottom: 30px;
                            text-align: center;
                        }
                        .non-printable-header {
                            display: none !important;
                        }
                    }
                    .printable-header, .print-status {
                        display: none;
                    }
                `}
            </style>

            <div className="printable-header">
                <h1 style={{ marginBottom: '5px' }}>ANÁLISIS DE TRABAJO SEGURO (ATS)</h1>
                <p style={{ color: '#666' }}>Documento de Seguridad en Obra - Generado digitalmente</p>
                <hr />
            </div>

            {/* Header */}
            <div className="non-printable-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Análisis de Trabajo Seguro</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Gestión de Riesgos Constructivos</p>
                </div>
            </div>

            <form onSubmit={handleSave}>
                {/* Datos Empresa */}
                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <Building2 size={22} color="var(--color-primary)" /> Datos de la Empresa
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Empresa Contratista / Principal</label>
                            <input
                                type="text"
                                value={formData.empresa}
                                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                                placeholder="Ej: Constructora S.A."
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>CUIT</label>
                            <input
                                type="text"
                                value={formData.cuit}
                                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                                placeholder="Ej: 30-12345678-9"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Datos Generales */}
                <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <FileText size={22} color="var(--color-primary)" /> Información de Tarea
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Obra / Frente de Obra</label>
                            <input type="text" value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} placeholder="Ej: Torre Alvear - Subsuelo" required />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Fecha de Realización</label>
                            <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required />
                        </div>
                    </div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '1rem', display: 'block' }}>Actividad a Realizar</label>
                    <input type="text" value={formData.actividad} onChange={(e) => setFormData({ ...formData, actividad: e.target.value })} placeholder="Ej: Excavación manual" required />
                </div>

                {/* EPP Visual Selector */}
                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <Shield size={22} color="var(--color-primary)" /> E.P.P. Requerido
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem' }}>
                        {eppOptions.map(opt => (
                            <div
                                key={opt.id}
                                onClick={() => handlePPEChange(opt.id)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.8rem 0.4rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${formData.epp.includes(opt.id) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    background: formData.epp.includes(opt.id) ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'center',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ color: formData.epp.includes(opt.id) ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                    {opt.icon}
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                                    {formData.epp.includes(opt.id) && <span className="print-status" style={{ display: 'inline', margin: 0 }}>✓ </span>}
                                    {opt.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lista de Chequeo de Seguridad Categorizada */}
                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.8rem' }}>
                        <ListChecks size={22} color="var(--color-primary)" /> Lista de Chequeo de Seguridad
                    </h3>

                    {[
                        { name: 'General', icon: <FileText size={18} /> },
                        { name: 'EPP y Calzado', icon: <Shield size={18} /> },
                        { name: 'Instalaciones Eléctricas', icon: <Zap size={18} /> },
                        { name: 'Trabajo en Altura', icon: <ArrowLeft size={18} style={{ transform: 'rotate(90deg)' }} /> },
                        { name: 'Orden y Limpieza', icon: <Wrench size={18} /> }
                    ].map(cat => {
                        const items = formData.checklist.filter(i => i.categoria === cat.name);
                        return (
                            <div key={cat.name} style={{ marginBottom: '2.5rem' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.6rem',
                                    marginBottom: '1.2rem',
                                    padding: '0.5rem 0.8rem',
                                    background: 'var(--color-surface-hover)',
                                    borderRadius: '8px',
                                    color: 'var(--color-primary)'
                                }}>
                                    {cat.icon}
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat.name}</h4>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '0.5rem' }}>
                                    {items.map((item) => (
                                        <div key={item.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.2rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem', marginBottom: '0.8rem' }}>
                                                <textarea
                                                    value={item.pregunta}
                                                    onChange={(e) => handleQuestionChange(item.id, e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        fontSize: '0.9rem',
                                                        padding: '0.5rem',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        resize: 'none',
                                                        fontWeight: 600,
                                                        lineHeight: '1.4'
                                                    }}
                                                    rows={2}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(item.id)}
                                                    className="no-print"
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '0.2rem', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="print-status">
                                                <span style={{ fontSize: '0.9rem', color: '#666' }}>Estado: </span>
                                                {item.estado === 'Cumple' && <span className="status-symbol-cumple">✓ CUMPLE</span>}
                                                {item.estado === 'No Cumple' && <span className="status-symbol-nocumple">✗ NO CUMPLE</span>}
                                                {item.estado === 'N/A' && <span style={{ color: '#666' }}>- NO APLICA</span>}
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem' }} className="no-print">
                                                {['Cumple', 'No Cumple', 'N/A'].map(state => (
                                                    <button
                                                        key={state}
                                                        type="button"
                                                        onClick={() => toggleChecklistState(item.id, state)}
                                                        className={`checklist-btn ${item.estado === state ? 'checklist-btn-active' : ''}`}
                                                        style={{
                                                            flex: 1,
                                                            padding: '0.5rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            borderRadius: '8px',
                                                            border: `2px solid ${item.estado === state ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                                            background: item.estado === state ? 'var(--color-primary)' : 'var(--color-surface)',
                                                            color: item.estado === state ? 'white' : 'var(--color-text)',
                                                            transition: 'all 0.2s',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {state}
                                                    </button>
                                                ))}
                                            </div>

                                            <div style={{ marginTop: '0.8rem' }}>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Observaciones / Acción Preventiva</label>
                                                <textarea
                                                    value={item.observaciones}
                                                    onChange={(e) => handleObservationChange(item.id, e.target.value)}
                                                    placeholder="Escribe aquí detalles o soluciones..."
                                                    style={{
                                                        width: '100%',
                                                        fontSize: '0.85rem',
                                                        padding: '0.8rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--color-border)',
                                                        background: 'var(--color-surface-hover)',
                                                        resize: 'vertical',
                                                        minHeight: '70px'
                                                    }}
                                                />
                                            </div>

                                            {item.estado === 'No Cumple' && (
                                                <div style={{ marginTop: '0.8rem', padding: '0.7rem', background: '#fee2e2', borderRadius: '8px', fontSize: '0.8rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600 }}>
                                                    <AlertTriangle size={16} /> Requiere acción inmediata / Detención de tarea
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => addQuestion(cat.name)}
                                        className="no-print"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'var(--color-primary)',
                                            background: 'transparent',
                                            border: '1px dashed var(--color-primary)',
                                            padding: '0.8rem',
                                            borderRadius: '10px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Plus size={18} /> Agregar a {cat.name}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Riesgos Principales (Inherentes) */}
                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <AlertTriangle size={22} color="#fbbf24" /> Riesgos Inherentes
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                        {riesgoOptions.map(opt => (
                            <div
                                key={opt.id}
                                onClick={() => handleRiskChange(opt.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.6rem',
                                    padding: '0.6rem 1rem',
                                    borderRadius: '25px',
                                    border: `1px solid ${formData.riesgos[opt.id] ? '#fbbf24' : 'var(--color-border)'}`,
                                    background: formData.riesgos[opt.id] ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ color: formData.riesgos[opt.id] ? '#d97706' : 'var(--color-text-muted)' }}>
                                    {opt.icon}
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                    {formData.riesgos[opt.id] && <span className="print-status" style={{ display: 'inline', margin: 0 }}>✓ </span>}
                                    {opt.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Secuencia de Tareas */}
                <h2 style={{ fontSize: '1.1rem', margin: '2rem 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={20} /> Secuencia Operativa (Paso a Paso)
                </h2>

                {formData.pasos.map((item, index) => (
                    <div key={index} className="card" style={{ marginBottom: '1rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700, background: 'var(--color-primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>Etapa {index + 1}</span>
                                <div className="print-status" style={{ margin: 0, paddingLeft: '1rem' }}>
                                    {item.cumple ? <span className="status-symbol-cumple">✓ COMPLETO</span> : <span className="status-symbol-nocumple">✗ PENDIENTE</span>}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleCumple(index)}
                                    className="no-print"
                                    style={{
                                        border: 'none',
                                        background: item.cumple ? '#dcfce7' : '#fee2e2',
                                        color: item.cumple ? '#166534' : '#991b1b',
                                        padding: '0.3rem 0.7rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {item.cumple ? <Check size={14} /> : <X size={14} />}
                                    {item.cumple ? 'COMPLETO' : 'PENDIENTE'}
                                </button>
                            </div>
                            {formData.pasos.length > 1 && (
                                <button type="button" onClick={() => removePaso(index)} style={{ padding: '0.3rem', color: '#ef4444', background: 'transparent', border: 'none' }}>
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Descripción de la Tarea</label>
                                <input type="text" value={item.paso} onChange={(e) => handlePasoChange(index, 'paso', e.target.value)} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Amenaza Identificada</label>
                                    <input type="text" value={item.riesgo} onChange={(e) => handlePasoChange(index, 'riesgo', e.target.value)} placeholder="Riesgo de..." required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Control / Preventiva</label>
                                    <input type="text" value={item.medida} onChange={(e) => handlePasoChange(index, 'medida', e.target.value)} placeholder="Medida..." required />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button type="button" onClick={addPaso} className="btn-secondary" style={{ width: '100%', marginBottom: '2rem', borderStyle: 'dashed', background: 'var(--color-surface)' }}>
                    <Plus size={18} /> Agregar Nueva Etapa
                </button>

                {/* Personal Involucrado */}
                <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <Users size={22} color="var(--color-primary)" /> Personal de Tarea
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {formData.personal.map((p, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem' }}>Nombre y Apellido</label>
                                    <input type="text" value={p.nombre} onChange={(e) => handlePersonalChange(idx, 'nombre', e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem' }}>DNI</label>
                                    <input type="text" value={p.dni} onChange={(e) => handlePersonalChange(idx, 'dni', e.target.value)} required />
                                </div>
                                <button type="button" onClick={() => {
                                    if (formData.personal.length > 1) {
                                        setFormData({ ...formData, personal: formData.personal.filter((_, i) => i !== idx) });
                                    }
                                }} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444' }}>
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addPersonal} className="btn-secondary" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', width: 'fit-content', borderStyle: 'dashed' }}>
                            <Plus size={16} /> Agregar Trabajador
                        </button>
                    </div>
                </div>

                {/* Firmas Responsables */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <Pencil size={22} color="var(--color-primary)" /> Responsables y Firmas
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        {/* Capataz Signature */}
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', background: '#fcfcfc' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Firma del Capataz / Responsable</label>
                            <canvas
                                ref={capatazCanvasRef}
                                width={500}
                                height={150}
                                style={{ width: '100%', height: '150px', border: '1px dashed var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', touchAction: 'none' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={() => setIsDrawingCapataz(false)}
                                onMouseLeave={() => setIsDrawingCapataz(false)}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={() => setIsDrawingCapataz(false)}
                            />
                            <button type="button" onClick={clearCapatazSignature} style={{ marginTop: '0.5rem', fontSize: '0.75rem', background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer' }}>Limpiar Firma</button>
                        </div>

                        {/* Professional Signature (Auto) */}
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', background: 'var(--color-surface-hover)' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Profesional de Higiene y Seguridad</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {professional.signature ? (
                                    <img src={professional.signature} alt="Firma Profesional" style={{ height: '80px', maxWidth: '150px', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ height: '80px', width: '150px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#999' }}>Firma no registrada</div>
                                )}
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{professional.name}</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Matrícula: {professional.license}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Save Button */}
                <div className="no-print" style={{ position: 'fixed', bottom: '1.5rem', left: '1rem', right: '1rem', display: 'flex', gap: '1rem', zIndex: 100 }}>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="btn-secondary"
                        style={{ flex: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.7rem', padding: '1.2rem', background: '#374151', color: 'white', border: 'none' }}
                    >
                        <Printer size={22} /> PDF
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ flex: 2, boxShadow: '0 4px 20px rgba(30, 64, 175, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.7rem', padding: '1.2rem' }}
                    >
                        <Save size={22} /> Guardar ATS
                    </button>
                </div>
            </form>
        </div>
    );
}
