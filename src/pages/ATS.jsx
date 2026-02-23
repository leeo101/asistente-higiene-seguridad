import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Printer,
    ShieldCheck, Building2, User, Calendar,
    CheckCircle2, AlertCircle, HelpCircle, Pencil, Info
} from 'lucide-react';

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
        window.print();
    };

    // Grouping checklist by category
    const categories = [...new Set(formData.checklist.map(i => i.categoria))];

    return (
        <div className="container" style={{ maxWidth: '900px', paddingBottom: '5rem' }}>


            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <h1 className="print-text-center w-full" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Análisis de Trabajo Seguro (ATS)</h1>
            </div>

            <div className="bg-white text-black p-8 shadow-sm border-2 border-slate-200 rounded-2xl mb-8" style={{ width: '100%', boxSizing: 'border-box' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Building2 size={20} color="var(--color-primary)" /> Datos de la Empresa y Tarea
                </h3>
                <div className="grid-res-2" style={{ marginBottom: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Empresa Contratista</label>
                        <input type="text" value={formData.empresa} onChange={e => setFormData({ ...formData, empresa: e.target.value })} placeholder="Ej: Techint S.A." />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>CUIT</label>
                        <input type="text" value={formData.cuit} onChange={e => setFormData({ ...formData, cuit: e.target.value })} placeholder="30-XXXXXXXX-X" />
                    </div>
                </div>
                <div className="grid-res-2">
                    <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Obra / Frente de Trabajo</label>
                        <input type="text" value={formData.obra} onChange={e => setFormData({ ...formData, obra: e.target.value })} placeholder="Ej: Sector Fundaciones" />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Fecha</label>
                        <input type="date" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} />
                    </div>
                </div>
            </div>

            <div className="bg-white text-black p-8 shadow-sm border-2 border-slate-200 rounded-2xl mb-8" style={{ width: '100%', boxSizing: 'border-box' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <ShieldCheck size={20} color="var(--color-secondary)" /> Verificación de Seguridad
                </h3>

                {categories.map(cat => (
                    <div key={cat} style={{ marginBottom: '2rem' }}>
                        <div className="print-category-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', pb: '0.5rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Info size={16} /> {cat}
                            </h4>
                            <button className="no-print" onClick={() => addQuestion(cat)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>+ Agregar</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {formData.checklist.filter(i => i.categoria === cat).map(item => (
                                <div key={item.id} className="print-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1.5rem', alignItems: 'start', position: 'relative' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                            <div
                                                contentEditable
                                                suppressContentEditableWarning
                                                onBlur={(e) => updateChecklist(item.id, 'pregunta', e.target.innerText)}
                                                style={{ flex: 1, fontSize: '0.9rem', marginBottom: '0.5rem', outline: 'none', borderBottom: '1px dashed transparent', padding: '2px' }}
                                                onFocus={(e) => e.target.style.borderBottom = '1px dashed var(--color-primary)'}
                                            >
                                                {item.pregunta}
                                            </div>
                                            <button
                                                className="no-print"
                                                onClick={() => removeQuestion(item.id)}
                                                title="Eliminar pregunta"
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem', marginTop: '-0.2rem' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Observaciones / Medidas tomadas..."
                                            value={item.observaciones}
                                            onChange={(e) => updateChecklist(item.id, 'observaciones', e.target.value)}
                                            style={{ margin: 0, padding: '0.4rem', fontSize: '0.8rem', opacity: 0.8 }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        {['Cumple', 'No Cumple', 'N/A'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => updateChecklist(item.id, 'estado', status)}
                                                style={{
                                                    padding: '0.4rem 0.6rem',
                                                    fontSize: '0.7rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--color-border)',
                                                    background: item.estado === status ?
                                                        (status === 'Cumple' ? 'var(--color-secondary)' : status === 'No Cumple' ? '#ef4444' : '#64748b')
                                                        : 'transparent',
                                                    color: item.estado === status ? 'white' : 'var(--color-text)',
                                                    fontWeight: 600,
                                                    minWidth: '70px'
                                                }}
                                            >
                                                {status === 'Cumple' ? '✓' : status === 'No Cumple' ? '✗' : '-'} {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                </h3>

                {/* SIGNATURE CONTROLS (NO PRINT) */}
                <div className="no-print mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 justify-between items-center text-xs font-bold text-slate-700">
                    <div>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.operator} onChange={e => setShowSignatures(s => ({ ...s, operator: e.target.checked }))} className="w-4 h-4 accent-emerald-600" /> Operador
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.supervisor} onChange={e => setShowSignatures(s => ({ ...s, supervisor: e.target.checked }))} className="w-4 h-4 accent-emerald-600" /> Supervisor
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.professional} onChange={e => setShowSignatures(s => ({ ...s, professional: e.target.checked }))} className="w-4 h-4 accent-emerald-600" /> Profesional
                        </label>
                    </div>
                </div>

                <div className="flex flex-row justify-around items-start w-full gap-8">
                    {showSignatures.operator && (
                        <div className="flex-1 flex flex-col items-center pt-20">
                            <div className="w-full border-t-2 border-slate-400 border-dashed mb-3"></div>
                            <div className="text-center w-full">
                                <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">OPERADOR</p>
                                <p className="text-[0.8rem] font-black uppercase text-black leading-none min-h-[0.8rem]">Aclaración y Firma</p>
                            </div>
                        </div>
                    )}

                    {showSignatures.supervisor && (
                        <div className="flex-1 flex flex-col items-center">
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem', textAlign: 'center' }} className="no-print">Supervisor</label>
                            <canvas
                                ref={capatazCanvasRef}
                                width={500}
                                height={150}
                                style={{ width: '100%', height: '120px', border: '1px dashed var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', touchAction: 'none' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={() => setIsDrawingCapataz(false)}
                                onMouseLeave={() => setIsDrawingCapataz(false)}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={() => setIsDrawingCapataz(false)}
                            />
                            <button type="button" onClick={clearCapatazSignature} className="no-print text-center" style={{ marginTop: '0.5rem', fontSize: '0.75rem', background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer', width: '100%' }}>Limpiar Firma</button>
                            <div className="print:block hidden w-full border-t-2 border-slate-400 border-dashed mt-20 mb-3"></div>
                            <div className="text-center w-full">
                                <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">SUPERVISOR</p>
                                <p className="text-[0.8rem] font-black uppercase text-black leading-none">Firma del Supervisor</p>
                            </div>
                        </div>
                    )}

                    {showSignatures.professional && (
                        <div className="flex-1 flex flex-col items-center">
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem', textAlign: 'center' }} className="no-print">Profesional Actuante</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '1px dashed var(--color-border)', borderRadius: '4px', minHeight: '120px', background: 'white', padding: '0.5rem', width: '100%' }}>
                                {professional.signature ? (
                                    <img src={professional.signature} alt="Firma" style={{ height: '50px', maxWidth: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ height: '50px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#999' }}>Sin Firma</div>
                                )}
                            </div>
                            <div className="print:block hidden w-full border-t-2 border-slate-400 border-dashed mt-8 mb-3"></div>
                            <div className="text-center w-full">
                                <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">PROFESIONAL ACTUANTE</p>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem' }}>{professional.name}</p>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Matrícula: {professional.license}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="no-print flex flex-col md:flex-row gap-4 mt-8">
                <button
                    onClick={handleSave}
                    className="flex-1 flex justify-center items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl font-bold transition-all hover:bg-emerald-700 active:scale-95 shadow-sm border-0"
                >
                    <Save size={20} />
                    GUARDAR DATOS
                </button>
                <button
                    onClick={handlePrint}
                    className="flex-1 flex justify-center items-center gap-2 px-6 py-4 bg-orange-600 text-white rounded-xl font-bold transition-all hover:bg-orange-700 active:scale-95 shadow-sm border-0"
                >
                    <Printer size={20} />
                    IMPRIMIR / GENERAR PDF
                </button>
            </div>
        </div>
    );
}
