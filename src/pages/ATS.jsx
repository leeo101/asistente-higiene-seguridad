import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Printer,
    ShieldCheck, Building2, User, Calendar,
    CheckCircle2, AlertCircle, HelpCircle, Pencil, Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
    const { currentUser } = useAuth();
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

    const [professional, setProfessional] = useState({
        name: 'Juan Pérez',
        license: '',
        signature: null
    });

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
        ctx.strokeStyle = '#000';

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearCapatazSignature = () => {
        const canvas = capatazCanvasRef.current;
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

    const handleSave = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        const historyRaw = localStorage.getItem('ats_history');
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        const newEntry = {
            ...formData,
            id: Date.now().toString(),
            capatazSignature: capatazCanvasRef.current?.toDataURL(),
            professionalSignature: professional.signature,
            professionalName: professional.name,
            professionalLicense: professional.license
        };
        localStorage.setItem('ats_history', JSON.stringify([newEntry, ...history]));
        alert('Análisis de Trabajo Seguro guardado con éxito');
        navigate('/ats-history');
    };

    const handlePrint = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        const status = localStorage.getItem('subscriptionStatus');
        if (status !== 'active') {
            navigate('/subscribe');
            return;
        }
        window.print();
    };

    // Grouping checklist by category
    const categories = [...new Set(formData.checklist.map(i => i.categoria))];

    return (
        <div className="container" style={{ maxWidth: '1200px', paddingBottom: '5rem' }}>


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
                            <ShieldCheck className="text-blue-600" size={32} />
                            Análisis de Trabajo Seguro
                        </h1>
                        <p style={{ margin: 0, color: '#6B778C', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Control H&S</p>
                    </div>
                </div>
            </div>

            <div className="bg-white text-black p-12 shadow-2xl mx-auto print-area border border-slate-200 rounded-2xl" style={{ width: '100%', maxWidth: '950px', boxSizing: 'border-box' }}>

                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%', gap: '1.5rem' }}>
                    {/* Top Left Text */}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text)' }}>Control H&S</p>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: '2px solid var(--color-border)', width: '100%' }}>
                        <DocBox label="CLIENTE / EMPRESA" value={formData.empresa} onChange={v => setFormData({ ...formData, empresa: v })} flex={2} large />
                        <DocBox label="CUIT / CUIL" value={formData.cuit} onChange={v => setFormData({ ...formData, cuit: v })} flex={1} />
                        <DocBox label="UBICACIÓN / OBRA" value={formData.obra} onChange={v => setFormData({ ...formData, obra: v })} flex={1} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', width: '100%' }}>
                        <DocBox label="FECHA" value={formData.fecha} onChange={v => setFormData({ ...formData, fecha: v })} type="date" flex={1} />
                        <DocBox label="RESPONSABLE" value={formData.capatazNombre} onChange={v => setFormData({ ...formData, capatazNombre: v })} flex={1} />
                        <DocBox label="PROFESIONAL H&S" value={professional.name} onChange={() => { }} flex={2} />
                    </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <ShieldCheck size={24} /> Verificación de Seguridad
                    </h3>

                    {categories.map(cat => (
                        <div key={cat} className="card overflow-hidden mb-10" style={{ padding: 0, border: '2px solid var(--color-border)' }}>
                            <div style={{ background: '#f8fafc', padding: '1.2rem', borderBottom: '2px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, color: 'var(--color-text)', fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Info size={18} className="text-blue-600" /> {cat}
                                </h4>
                                <button
                                    className="no-print"
                                    onClick={() => addQuestion(cat)}
                                    style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}
                                >
                                    + AGREGAR PUNTO
                                </button>
                            </div>

                            <table className="w-full border-collapse" style={{ tableLayout: 'fixed', width: '100%', border: 'none' }}>
                                <colgroup>
                                    <col style={{ width: 'auto' }} />
                                    <col className="no-print" style={{ width: '140px' }} />
                                    <col className="print-only" style={{ width: '60px' }} />
                                    <col className="no-print" style={{ width: '40px' }} />
                                </colgroup>
                                <tbody className="divide-y divide-slate-200">
                                    {formData.checklist.filter(i => i.categoria === cat).map((item, idx) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/20 transition-colors">
                                            <td className="p-4 align-middle">
                                                <div
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => updateChecklist(item.id, 'pregunta', e.target.innerText)}
                                                    className="font-bold text-slate-800 text-[0.9rem] mb-2 outline-none border-b border-dashed border-transparent focus:border-[var(--color-primary)] leading-tight"
                                                >
                                                    {item.pregunta}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Observaciones / Medidas tomadas..."
                                                    value={item.observaciones}
                                                    onChange={(e) => updateChecklist(item.id, 'observaciones', e.target.value)}
                                                    style={{ margin: 0, padding: '0.4rem', fontSize: '0.7rem', background: 'transparent', border: '1px solid #efefef', borderRadius: '4px', width: '100%', color: 'var(--color-text-muted)' }}
                                                />
                                            </td>
                                            <td className="no-print p-2 align-middle">
                                                <div className="checklist-status-buttons" style={{ justifyContent: 'center' }}>
                                                    <StatusBtn active={item.estado === 'Cumple'} type="OK" onClick={() => updateChecklist(item.id, 'estado', 'Cumple')} label="SI" />
                                                    <StatusBtn active={item.estado === 'No Cumple'} type="FAIL" onClick={() => updateChecklist(item.id, 'estado', 'No Cumple')} label="NO" />
                                                    <StatusBtn active={item.estado === 'N/A'} type="NA" onClick={() => updateChecklist(item.id, 'estado', 'N/A')} label="NA" />
                                                </div>
                                            </td>
                                            <td className="hidden print:table-cell text-center align-middle border-l border-slate-100">
                                                <div className="font-black text-black text-[0.8rem]">
                                                    {item.estado === 'Cumple' ? '✓' : item.estado === 'No Cumple' ? '✗' : '-'}
                                                </div>
                                            </td>
                                            <td className="no-print text-center align-middle">
                                                <button
                                                    onClick={() => removeQuestion(item.id)}
                                                    className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ marginTop: '2.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <Pencil size={24} /> Firmas y Autorizaciones
                    </h3>

                    <div className="no-print mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 justify-between items-center text-sm font-bold text-slate-700">
                        <div>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div className="flex gap-6">
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
            </div>

            {/* Floating action bar */}
            <div className="no-print" style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                display: 'flex',
                gap: '0.8rem',
                zIndex: 100,
            }}>
                <button
                    onClick={handleSave}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 1.2rem',
                        background: 'linear-gradient(135deg, #36B37E, #00875A)',
                        color: 'white',
                        borderRadius: '50px',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(54,179,126,0.45)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        letterSpacing: '0.03em'
                    }}
                    onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 8px 24px rgba(54,179,126,0.55)'; }}
                    onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 6px 20px rgba(54,179,126,0.45)'; }}
                >
                    <Save size={16} /> GUARDAR
                </button>
                <button
                    onClick={handlePrint}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 1.2rem',
                        background: 'linear-gradient(135deg, #FF8B00, #FF5630)',
                        color: 'white',
                        borderRadius: '50px',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(255,86,48,0.4)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        letterSpacing: '0.03em'
                    }}
                    onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 8px 24px rgba(255,86,48,0.55)'; }}
                    onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 6px 20px rgba(255,86,48,0.4)'; }}
                >
                    <Printer size={16} /> IMPRIMIR PDF
                </button>
            </div>
        </div>
    );
}

// Internal Sub-components
function StatusBtn({ active, type, onClick, label }) {
    const classes = `status-btn ${active ? (type === 'OK' ? 'active-ok' : type === 'FAIL' ? 'active-fail' : 'active-na') : ''}`;
    return (
        <button className={classes} onClick={onClick}>
            {active && <CheckCircle2 size={10} style={{ marginRight: '2px' }} />}
            {label}
        </button>
    );
}

function DocBox({ label, value, onChange, type = "text", flex = 1, large = false }) {
    return (
        <div style={{ flex: flex, padding: '1.2rem', borderRight: '2px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    margin: 0,
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    fontSize: large ? '1.1rem' : '0.9rem',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    outline: 'none',
                    width: '100%'
                }}
            />
        </div>
    );
}
