import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Lightbulb, Calculator,
    FileText, Printer, Building2, Layout, Maximize2,
    Info, AlertTriangle, ShieldCheck, History, Share2, Sun
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';

// Tipos de tareas visuales basados en el Decreto 351/79 (Anexo IV) - Resumido
const visualTasks = [
    { id: 'exteriores', label: 'Áreas exteriores generales y patios', minLux: 20 },
    { id: 'circulacion', label: 'Zonas de circulación, pasillos y escaleras', minLux: 100 },
    { id: 'simples', label: 'Tareas visuales simples (Depósitos, vestuarios)', minLux: 200 },
    { id: 'moderadas', label: 'Distinción moderada de detalles (Oficinas, lectura general)', minLux: 500 },
    { id: 'finos', label: 'Distinción de detalles finos (Dibujo, inspección fina)', minLux: 1000 },
    { id: 'muy_finos', label: 'Detalles muy finos (Relojería, electrónica, microcirugía)', minLux: 2000 }
];

export default function LightingReport() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();

    const [formData, setFormData] = useState({
        empresa: '',
        sector: '',
        descripcionActividad: '',
        tipoTarea: '',
        luxRequerido: 500,
        mediciones: [
            { id: Date.now().toString(), ubicacion: 'Puesto 1', luxMedido: 0 }
        ]
    });

    const [professional, setProfessional] = useState({
        name: 'Profesional',
        license: '',
        signature: null
    });

    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

    const [showShare, setShowShare] = useState(false);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('personalData');
            const savedSigData = localStorage.getItem('signatureStampData');
            const legacySignature = localStorage.getItem('capturedSignature');

            let signature = legacySignature || null;
            if (savedSigData) {
                const parsed = JSON.parse(savedSigData);
                signature = parsed.signature || signature;
            }

            let profData = {
                name: 'Profesional',
                license: '',
                signature: signature
            };

            if (savedData) {
                const data = JSON.parse(savedData);
                profData.name = data.name || 'Profesional';
                profData.license = data.license || '';
            }

            setProfessional(profData);
        } catch (error) {
            console.error('Error loading professional data:', error);
        }
    }, []);

    useEffect(() => {
        if (location.state?.editData) {
            setFormData(location.state.editData);
        }
    }, [location.state]);

    const [results, setResults] = useState({
        promedioLux: 0,
        cumplePromedio: false,
        puntosCumplen: 0,
        puntosNoCumplen: 0
    });

    // Actualizar lux requerido cuando cambia la tarea Y NO SE ESCRIBIÓ MANUALMENTE
    useEffect(() => {
        // Find if the current text matches any of the labels exactly (via the datalist)
        const task = visualTasks.find(t => t.label === formData.tipoTarea);
        if (task) {
            setFormData(prev => ({ ...prev, luxRequerido: task.minLux }));
        }
    }, [formData.tipoTarea]);

    // Calcular promedios y cumplimiento
    useEffect(() => {
        const meds = formData.mediciones || [];
        if (meds.length === 0) {
            setResults({ promedioLux: 0, cumplePromedio: false, puntosCumplen: 0, puntosNoCumplen: 0 });
            return;
        }

        const totalLux = meds.reduce((acc, curr) => acc + (parseFloat(curr.luxMedido) || 0), 0);
        const promedio = totalLux / meds.length;

        const cumpleProm = promedio >= formData.luxRequerido;
        const cumplen = meds.filter(m => (parseFloat(m.luxMedido) || 0) >= formData.luxRequerido).length;
        const noCumplen = meds.length - cumplen;

        setResults({
            promedioLux: Math.round(promedio),
            cumplePromedio: cumpleProm,
            puntosCumplen: cumplen,
            puntosNoCumplen: noCumplen
        });

    }, [formData.mediciones, formData.luxRequerido]);

    const handleDataChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const addMedicion = () => {
        setFormData({
            ...formData,
            mediciones: [...formData.mediciones, { id: Date.now().toString(), ubicacion: `Puesto ${formData.mediciones.length + 1}`, luxMedido: '' }]
        });
    };

    const removeMedicion = (index) => {
        const newMeds = [...formData.mediciones];
        newMeds.splice(index, 1);
        setFormData({ ...formData, mediciones: newMeds });
    };

    const updateMedicion = (index, field, value) => {
        const newMeds = [...formData.mediciones];
        newMeds[index][field] = value;
        setFormData({ ...formData, mediciones: newMeds });
    };

    const handlePrint = () => {
        if (!requirePro('imprimir este informe de iluminación')) return;
        window.print();
    };

    const saveReport = async () => {
        if (!requirePro('guardar este tipo de informe especial')) return;
        try {
            const reportData = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                empresa: formData.empresa || 'Empresa Sin Nombre',
                sector: formData.sector || 'Sin Sector',
                resultados: results,
                datos: formData,
                profesionalResponsable: professional?.name || 'Profesional no registrado'
            };

            const existingHistory = JSON.parse(localStorage.getItem('lighting_history') || '[]');
            existingHistory.push(reportData);
            localStorage.setItem('lighting_history', JSON.stringify(existingHistory));

            if (currentUser) {
                await syncCollection('lighting_history', reportData);
            }

            toast.success('Informe guardado en el Historial');
        } catch (err) {
            console.error("Error saving document:", err);
            toast.error("Error al guardar en la base de datos.");
        }
    };

    return (
        <div className="container" style={{ paddingTop: '6rem', paddingBottom: '5rem', maxWidth: '1000px' }}>
            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                <button
                    onClick={saveReport}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: 'white' }}
                >
                    <Save size={18} /> GUARDAR
                </button>
                <button
                    onClick={() => { if (requirePro('generar enlace compartido')) setShowShare(true); }}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: 'white' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={handlePrint}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: 'white' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>

            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Estudio de Iluminación</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Medición Dec. 351/79 Anexo IV</p>
                </div>
            </div>

            {showShare && (
                <ShareModal url={window.location.href} onClose={() => setShowShare(false)} />
            )}

            {/* ENCABEZADO PARA IMPRESIÓN */}
            <div className="report-header">
                <div>
                    <h1>INFORME DE ILUMINACIÓN</h1>
                    <p>PROTOCOLO DE MEDICIÓN PUESTO POR PUESTO</p>
                    <p style={{ marginTop: '5px', fontWeight: 'bold' }}>Referencia: Dec. 351/79 (Ley 19.587)</p>
                </div>
                {professional?.name !== 'Profesional' ? (
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>{professional.name}</h2>
                        {professional.license && <p style={{ margin: 0 }}>MP/Reg: {professional.license}</p>}
                        <p style={{ margin: 0 }}>Gestión de Riesgos Laborales</p>
                    </div>
                ) : (
                    <div style={{ opacity: 0.5, fontSize: '0.9rem', textAlign: 'right' }}>
                        <p>Perfil Profesional Incompleto</p>
                        <p style={{ fontSize: '0.8rem' }}>Actualice sus datos en Configuración</p>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-8 print-block">
                {/* COLUMNA 1: DATOS GENERALES */}
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <Building2 size={20} /> Datos del Establecimiento
                    </h3>

                    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Razón Social / Obra</label>
                            <input
                                type="text"
                                value={formData.empresa}
                                onChange={(e) => handleDataChange('empresa', e.target.value)}
                                className="form-input no-print"
                                placeholder="Nombre de la empresa..."
                            />
                            <div className="print-only" style={{ padding: '0.6rem', borderBottom: '1px solid #eee', fontSize: '1rem', color: '#000' }}>{formData.empresa || '-'}</div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Sector / Área de Estudio</label>
                            <input
                                type="text"
                                value={formData.sector}
                                onChange={(e) => handleDataChange('sector', e.target.value)}
                                className="form-input no-print"
                                placeholder="Ej: Nave Industrial, Administración..."
                            />
                            <div className="print-only" style={{ padding: '0.6rem', borderBottom: '1px solid #eee', fontSize: '1rem', color: '#000' }}>{formData.sector || '-'}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Descripción de las Tareas</label>
                            <input
                                type="text"
                                value={formData.descripcionActividad}
                                onChange={(e) => handleDataChange('descripcionActividad', e.target.value)}
                                className="form-input no-print"
                                placeholder="Ej: Trabajo en escritorio, torno mecánico..."
                            />
                            <div className="print-only" style={{ padding: '0.6rem', borderBottom: '1px solid #eee', fontSize: '1rem', color: '#000' }}>{formData.descripcionActividad || '-'}</div>
                        </div>
                    </div>

                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem', marginTop: '2rem' }}>
                        <Layout size={20} /> Requerimiento Legal
                    </h3>

                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Tipo de Tarea Visual (Dec 351/79 o Especial)</label>
                            <input
                                list="visualTasksList"
                                value={formData.tipoTarea}
                                onChange={(e) => handleDataChange('tipoTarea', e.target.value)}
                                className="form-input no-print"
                                style={{ width: '100%' }}
                                placeholder="Seleccione o escriba el tipo de tarea..."
                            />
                            <div className="print-only" style={{ padding: '0.6rem', borderBottom: '1px solid #eee', fontSize: '1rem', color: '#000', fontWeight: 'bold' }}>{formData.tipoTarea || '-'}</div>
                            <datalist id="visualTasksList">
                                {visualTasks.map((t) => (
                                    <option key={t.id} value={t.label} />
                                ))}
                            </datalist>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <Sun size={32} color="var(--color-primary)" />
                            <div>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Iluminación Mínima Exigida (Lux)</p>
                                <input
                                    type="number"
                                    value={formData.luxRequerido}
                                    onChange={(e) => handleDataChange('luxRequerido', e.target.value === '' ? '' : Number(e.target.value))}
                                    className="form-input"
                                    style={{ width: '120px', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', padding: '0.2rem 0.5rem', background: 'transparent' }}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA 2: MEDICIONES Y RESULTADOS */}
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Lightbulb size={20} /> Puntos de Medición
                        </div>
                        <button onClick={addMedicion} className="btn-secondary no-print" style={{ margin: 0, padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Plus size={14} /> Añadir Punto
                        </button>
                    </h3>

                    <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '350px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
                                        <th style={{ padding: '0.8rem', textAlign: 'left', borderBottom: '2px solid var(--color-border)' }}>Punto Exacto / Puesto</th>
                                        <th style={{ padding: '0.8rem', textAlign: 'center', borderBottom: '2px solid var(--color-border)' }}>Lux Medido</th>
                                        <th style={{ padding: '0.8rem', textAlign: 'center', borderBottom: '2px solid var(--color-border)' }} className="no-print">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.mediciones.map((med, index) => (
                                        <tr key={med.id}>
                                            <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                                <input
                                                    type="text"
                                                    value={med.ubicacion}
                                                    onChange={(e) => updateMedicion(index, 'ubicacion', e.target.value)}
                                                    style={{ width: '100%', padding: '0.5rem', border: 'none', background: 'transparent' }}
                                                    placeholder="Puesto X"
                                                    className="form-input-transparent no-print"
                                                />
                                                <div className="print-only" style={{ padding: '0.5rem' }}>{med.ubicacion}</div>
                                            </td>
                                            <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)', width: '100px' }}>
                                                <input
                                                    type="number"
                                                    value={med.luxMedido}
                                                    onChange={(e) => updateMedicion(index, 'luxMedido', e.target.value)}
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', textAlign: 'center' }}
                                                    placeholder="0"
                                                    min="0"
                                                    className="no-print"
                                                />
                                                <div className="print-only" style={{ textAlign: 'center', fontWeight: 'bold' }}>{med.luxMedido}</div>
                                            </td>
                                            <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)', textAlign: 'center', width: '50px' }} className="no-print">
                                                <button
                                                    onClick={() => removeMedicion(index)}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px' }}
                                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <Calculator size={20} /> Evaluación Normativa
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1rem' }}>
                        <div className="card" style={{ padding: '1.5rem', border: results.cumplePromedio ? '2px solid #10b981' : '2px solid #ef4444', background: results.cumplePromedio ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Nivel Promedio Registrado</p>
                                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: results.cumplePromedio ? '#10b981' : '#ef4444' }}>{results.promedioLux} Lux</p>
                                </div>
                                <div className="result-badge-print" style={{ background: results.cumplePromedio ? '#10b981' : '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
                                    {results.cumplePromedio ? 'CUMPLE' : 'NO CUMPLE'}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span>Requerido s/ Dec 351/79:</span>
                                    <span style={{ fontWeight: 700 }}>{formData.luxRequerido} Lux</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span>Puntos que Cumplen:</span>
                                    <span style={{ fontWeight: 700, color: '#10b981' }}>{results.puntosCumplen}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Puntos Deficientes:</span>
                                    <span style={{ fontWeight: 700, color: results.puntosNoCumplen > 0 ? '#ef4444' : 'var(--color-text)' }}>{results.puntosNoCumplen}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN DE DATOS OBTENIDOS POR */}
            <div className="bg-white text-black p-8 shadow-sm border-2 border-slate-200 rounded-2xl mb-8 mt-10 print-area" style={{ display: 'block', clear: 'both' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <ShieldCheck size={22} color="var(--color-primary)" /> Firmas y Validación
                </h3>

                <div className="no-print mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 justify-between items-center text-xs font-bold text-slate-700">
                    <div>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.operator} onChange={e => setShowSignatures(s => ({ ...s, operator: e.target.checked }))} className="w-4 h-4 accent-orange-600" /> Operador
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.supervisor} onChange={e => setShowSignatures(s => ({ ...s, supervisor: e.target.checked }))} className="w-4 h-4 accent-orange-600" /> Supervisor
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.professional} onChange={e => setShowSignatures(s => ({ ...s, professional: e.target.checked }))} className="w-4 h-4 accent-orange-600" /> Profesional
                        </label>
                    </div>
                </div>

                <div className="signature-container-row mt-10">
                    {showSignatures.operator && (
                        <div className="signature-item-box">
                            <div className="signature-line"></div>
                            <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">OPERADOR</p>
                            <p className="text-[0.8rem] font-black uppercase text-black leading-none break-words min-h-[0.8rem]">Aclaración y Firma</p>
                        </div>
                    )}

                    {showSignatures.supervisor && (
                        <div className="signature-item-box">
                            <div className="signature-line"></div>
                            <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">SUPERVISOR</p>
                            <p className="text-[0.8rem] font-black uppercase text-black leading-none break-words min-h-[0.8rem]">DNI / ACLARACIÓN</p>
                        </div>
                    )}

                    {showSignatures.professional && (
                        <div className="signature-item-box">
                            {professional?.signature || professional?.stamp ? (
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', height: '60px' }}>
                                    {professional?.signature && (
                                        <img src={professional.signature} alt="Firma Profesional" style={{ maxHeight: '100%', maxWidth: '120px', objectFit: 'contain' }} />
                                    )}
                                </div>
                            ) : (
                                <div className="signature-line"></div>
                            )}
                            <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">PROFESIONAL RESPONSABLE</p>
                            <p className="text-[0.8rem] font-black uppercase text-black leading-none break-words">{professional?.name || 'Firma y Sello'}</p>
                            {professional?.license && (
                                <p className="text-[0.65rem] font-bold text-slate-500 mt-1 uppercase">MP: {professional.license}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Estilos para impresión (Oculta botones) */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body, .app-layout, .main-content, .container {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        min-width: 100% !important;
                        box-shadow: none !important;
                    }
                    .btn-primary, .btn-secondary, .sidebar { display: none !important; }
                    .card {
                        box-shadow: none !important;
                        border: 1px solid #e2e8f0 !important;
                        break-inside: avoid;
                    }
                    .report-header {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        border-bottom: 3px solid #000 !important;
                        padding-bottom: 20px !important;
                        margin-bottom: 30px !important;
                    }
                    .report-header h1 {
                        font-size: 24pt !important;
                        margin: 0 0 10px 0 !important;
                        color: #000 !important;
                    }
                    * {
                        color: #000 !important;
                    }
                    
                    /* Signature Styles */
                    .signature-container-row {
                        display: flex !important;
                        justify-content: space-between !important;
                        gap: 20px !important;
                        width: 100% !important;
                        flex-wrap: nowrap !important;
                        page-break-inside: avoid !important;
                        margin-top: 50px !important;
                    }
                    .signature-item-box {
                        flex: 1 !important;
                        text-align: center !important;
                        min-width: 0 !important;
                    }
                     .signature-line {
                        border-top: 2px solid #000 !important;
                        margin: 0 auto 10px auto !important;
                        width: 80% !important;
                        min-height: 1px !important;
                        display: block !important;
                    }
                    .result-badge-print {
                        border: 2px solid #000 !important;
                        color: #000 !important;
                        background: none !important;
                    }
                }
                
                /* Layout para pantallas */
                .signature-container-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 30px;
                    width: 100%;
                    align-items: end;
                }
                .signature-item-box {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                }
                .signature-line {
                    border-top: 1px solid #94a3b8;
                    margin: 40px auto 10px auto;
                    width: 90%;
                }
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 2px solid var(--color-border);
                    padding-bottom: 1.5rem;
                    margin-bottom: 2rem;
                }
                .report-header h1 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.8rem;
                    color: var(--color-primary);
                }
                .report-header p {
                    margin: 0;
                    color: var(--color-text-muted);
                }
                
                @media (max-width: 600px) {
                    .report-header {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: left;
                    }
                    .report-header > div:last-child {
                        text-align: left !important;
                    }
                }
            `}</style>
        </div>
    );
}
