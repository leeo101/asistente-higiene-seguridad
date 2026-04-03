import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
    ArrowLeft, Save, FileText, UserPlus, FileSpreadsheet,
    MapPin, Clock, Search, ListPlus, Trash2, CheckCircle2, ChevronRight, ChevronLeft,
    Plus, Share2, Printer, Sparkles, Loader2
} from 'lucide-react';
import { usePaywall } from '../hooks/usePaywall';
import ShareModal from '../components/ShareModal';
import AccidentPdfGenerator from '../components/AccidentPdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

const SECTIONS = ['Datos Generales', 'Accidentado', 'Descripción y Testigos', 'Análisis Causal', 'Medidas Preventivas'];

export default function AccidentInvestigation(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const editData = location.state?.editData;
    useDocumentTitle(editData ? 'Editar Investigación' : 'Investigación de Accidentes');

    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState(editData || {
        // Datos Generales
        fecha: new Date().toISOString().split('T')[0],
        hora: '',
        empresa: '',
        ubicacion: '',
        gravedad: 'Leve',
        // Accidentado
        victimaNombre: '',
        victimaDni: '',
        victimaPuesto: '',
        victimaAntiguedad: '',
        lesion: '',
        parteCuerpo: '',
        // Descripción y Testigos
        descripcionHecho: '',
        testigos: [{ nombre: '', declaracion: '' }],
        // Análisis Causal (5 Porqués)
        problemaCentral: '',
        porques: [''],
        // Medidas Preventivas
        medidas: [{ accion: '', responsable: '', fechaLimite: '' }]
    });

    const [showShare, setShowShare] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'report'

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentStep]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (arrayName, index, field, value) => {
        setFormData(prev => {
            const newArray = [...prev[arrayName]];
            // If it's an array of strings (like porques)
            if (typeof newArray[index] === 'string') {
                newArray[index] = value;
            } else {
                newArray[index] = { ...newArray[index], [field]: value };
            }
            return { ...prev, [arrayName]: newArray };
        });
    };

    const addArrayItem = (arrayName, defaultItem) => {
        setFormData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], defaultItem] }));
    };

    const removeArrayItem = (arrayName, index) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].filter((_, i) => i !== index)
        }));
    };

    const handleNext = () => {
        if (currentStep < SECTIONS.length - 1) setCurrentStep(s => s + 1);
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(s => s - 1);
    };

    const handleSave = () => {
        if (!formData.empresa || !formData.victimaNombre) {
            toast.error('La empresa y el nombre del accidentado son obligatorios.');
            return;
        }

        const report = {
            id: editData?.id || Date.now(),
            date: editData?.date || new Date().toISOString(),
            ...formData
        };

        let history = JSON.parse(localStorage.getItem('accident_history') || '[]');

        if (editData) {
            history = history.map(item => item.id === editData.id ? report : item);
        } else {
            history.unshift(report);
        }

        localStorage.setItem('accident_history', JSON.stringify(history));
        syncCollection('accident_history', history);

        toast.success(editData ? 'Investigación actualizada correctamente.' : 'Investigación guardada correctamente.');
        navigate('/accident-history');
    };

    const handlePrint = () => {
        requirePro(() => {
            // Ensure ID exists for PDF ref (INV-XXXXXX)
            const idToUse = formData.id || Date.now();
            if (!formData.id) {
                setFormData(prev => ({ ...prev, id: idToUse }));
            }
            window.print();
        });
    };



    return (
        <div className="container" style={{ paddingBottom: '6rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', zIndex: 10 }}>
                    <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{editData ? 'Editar Investigación' : 'Investigación de Accidente'}</h1>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Metodología Árbol de Causas</p>
                    </div>
                </div>

                {/* Actualización Normativa */}
                <div style={{
                    marginBottom: '1.5rem', padding: '1.25rem', borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(8,145,178,0.1), rgba(6,182,212,0.05))',
                    border: '1px solid rgba(8,145,178,0.2)', display: 'flex', gap: '1rem', alignItems: 'flex-start'
                }}>
                    <Sparkles size={24} color="#0891b2" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.4rem', color: '#164e63', fontSize: '0.95rem', fontWeight: 800 }}>
                            Metodología Avalada: Res. SRT 7/2026 y Dec. 549/2025
                        </h4>
                        <p style={{ margin: 0, color: '#155e75', fontSize: '0.85rem', lineHeight: 1.5 }}>
                            El presente análisis de causas y recolección testimonial se estructura para conformar prueba sólida frente a Comisiones Médicas, cumpliendo exigencias del Nuevo Protocolo de Valoración del Daño Corporal y nuevo baremo vigente.
                        </p>
                    </div>
                </div>

                <ShareModal
                    isOpen={showShare}
                    open={showShare}
                    onClose={() => setShowShare(false)}
                    title={`Investigación de Accidente - ${formData.victimaNombre}`}
                    text={`⚠️ Informe de Investigación de Accidente\n👤 Accidentado: ${formData.victimaNombre}\n🏢 Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⚠️ Gravedad: ${formData.gravedad}\n\nGenerado con Asistente HYS`}
                    rawMessage={`⚠️ Informe de Investigación de Accidente\n👤 Accidentado: ${formData.victimaNombre}\n🏢 Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⚠️ Gravedad: ${formData.gravedad}\n\nGenerado con Asistente HYS`}
                    elementIdToPrint="pdf-content"
                    fileName={`Accidente_${formData.victimaNombre || 'Sin_Nombre'}.pdf`}
                />

                {/* Floating Action Buttons */}
                <div className="floating-action-bar">
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
                        onClick={handlePrint}
                        className="btn-floating-action"
                        style={{ background: '#FF8B00', color: '#ffffff' }}
                    >
                        <Printer size={18} /> IMPRIMIR PDF
                    </button>
                </div>

                {/* Stepper */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'var(--color-border)', zIndex: 0, transform: 'translateY(-50%)' }} />
                    {SECTIONS.map((section, index) => (
                        <div key={index} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '0.5rem',
                            cursor: 'pointer'
                        }} onClick={() => setCurrentStep(index)}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: currentStep >= index ? 'var(--color-primary)' : 'var(--color-surface)',
                                border: `2px solid ${currentStep >= index ? 'var(--color-primary)' : 'var(--color-border)'}`,
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

                <div className="card" style={{ flex: 1, padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', color: 'var(--color-primary)' }}>
                        {SECTIONS[currentStep]}
                    </h2>

                    {currentStep === 0 && (
                        <div className="grid-2-cols">
                            <div>
                                <label>Fecha del Suceso</label>
                                <input type="date" value={formData.fecha} onChange={e => handleInputChange('fecha', e.target.value)} />
                            </div>
                            <div>
                                <label>Hora Aprox.</label>
                                <input type="time" value={formData.hora} onChange={e => handleInputChange('hora', e.target.value)} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label>Razón Social / Empresa</label>
                                <input type="text" placeholder="Ej. Constructora SRL" value={formData.empresa} onChange={e => handleInputChange('empresa', e.target.value)} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label>Ubicación / Sector</label>
                                <input type="text" placeholder="Ej. Obra Centro, Sector Hormigonado" value={formData.ubicacion} onChange={e => handleInputChange('ubicacion', e.target.value)} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label>Gravedad Estimada</label>
                                <select value={formData.gravedad} onChange={e => handleInputChange('gravedad', e.target.value)}>
                                    <option value="Leve">Leve (Sin baja)</option>
                                    <option value="Moderado">Moderado (Con baja médica corta)</option>
                                    <option value="Grave">Grave (Internación, amputaciones)</option>
                                    <option value="Mortal">Mortal</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="grid-2-cols">
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label>Nombre del Accidentado</label>
                                <input type="text" placeholder="Nombre completo" value={formData.victimaNombre} onChange={e => handleInputChange('victimaNombre', e.target.value)} />
                            </div>
                            <div>
                                <label>DNI / CUIL</label>
                                <input type="text" placeholder="Sin guiones" value={formData.victimaDni} onChange={e => handleInputChange('victimaDni', e.target.value)} />
                            </div>
                            <div>
                                <label>Puesto / Tarea</label>
                                <input type="text" placeholder="Ej. Oficial Albañil" value={formData.victimaPuesto} onChange={e => handleInputChange('victimaPuesto', e.target.value)} />
                            </div>
                            <div>
                                <label>Antigüedad en el puesto</label>
                                <input type="text" placeholder="Ej. 2 años" value={formData.victimaAntiguedad} onChange={e => handleInputChange('victimaAntiguedad', e.target.value)} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label>Tipo de Lesión</label>
                                <input type="text" placeholder="Ej. Corte profundo, contusión, fractura..." value={formData.lesion} onChange={e => handleInputChange('lesion', e.target.value)} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label>Parte del Cuerpo Afectada</label>
                                <input type="text" placeholder="Ej. Mano derecha indíce" value={formData.parteCuerpo} onChange={e => handleInputChange('parteCuerpo', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label>Descripción detallada del Hecho (¿Qué pasó?)</label>
                                <textarea
                                    rows={5}
                                    placeholder="Relato detallado de cómo ocurrió el accidente, basado en los testimonios y evidencias iniciales..."
                                    value={formData.descripcionHecho}
                                    onChange={e => handleInputChange('descripcionHecho', e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', margin: 0 }}>Testigos del Hecho</h3>
                                <button className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => addArrayItem('testigos', { nombre: '', declaracion: '' })}>
                                    <UserPlus size={16} /> Añadir Testigo
                                </button>
                            </div>

                            {formData.testigos.map((t, i) => (
                                <div key={i} className="responsive-list-card">
                                    {formData.testigos.length > 1 && (
                                        <button
                                            onClick={() => removeArrayItem('testigos', i)}
                                            className="card-delete-btn"
                                            title="Eliminar Testigo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <label>Nombre del Testigo {i + 1}</label>
                                    <input type="text" placeholder="Nombre completo o cargo" value={t.nombre} onChange={e => handleArrayChange('testigos', i, 'nombre', e.target.value)} />
                                    <label>Declaración Breve</label>
                                    <textarea rows={2} placeholder="Lo que presenció..." value={t.declaracion} onChange={e => handleArrayChange('testigos', i, 'declaracion', e.target.value)} />
                                </div>
                            ))}
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                                    <Search size={18} /> Metodología de los "5 Porqués"
                                </div>
                                Técnica sistemática para iterar preguntando "¿Por qué ocurrió?" hasta llegar a la causa raíz sistémica o de gestión, evitando culpar únicamente al error humano.
                            </div>

                            <label>El Problema (Efecto Final)</label>
                            <input type="text" placeholder="Ej. El trabajador se cortó la mano con la amoladora" value={formData.problemaCentral} onChange={e => handleInputChange('problemaCentral', e.target.value)} style={{ fontWeight: 'bold' }} />

                            <div style={{ marginTop: '1.5rem', borderLeft: '3px solid var(--color-primary)', paddingLeft: '1rem' }}>
                                {formData.porques.map((pq, i) => (
                                    <div key={i} className="responsive-list-card" style={{ padding: '1rem' }}>
                                        <label style={{ color: 'var(--color-text)', margin: 0 }}>¿Por qué? (Nivel {i + 1})</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input type="text" placeholder="Respuesta al porqué anterior..." value={pq} onChange={e => handleArrayChange('porques', i, null, e.target.value)} style={{ marginBottom: 0, flex: 1 }} />
                                            {formData.porques.length > 1 && (
                                                <button
                                                    onClick={() => removeArrayItem('porques', i)}
                                                    className="card-delete-btn"
                                                    style={{ position: 'relative', top: 'auto', right: 'auto', borderRadius: '8px', zIndex: 1 }}
                                                    title="Eliminar Porqué"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {formData.porques.length < 5 && (
                                    <button className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginTop: '0.5rem' }} onClick={() => addArrayItem('porques', '')}>
                                        <ListPlus size={16} /> Preguntar otro "¿Por qué?"
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div>
                            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                En base a la causa raíz detectada, defina el Plan de Acción Correctivo/Preventivo para asegurar que no vuelva a ocurrir.
                            </p>

                            {formData.medidas.map((m, i) => (
                                <div key={i} className="responsive-list-card">
                                    {formData.medidas.length > 1 && (
                                        <button
                                            onClick={() => removeArrayItem('medidas', i)}
                                            className="card-delete-btn"
                                            title="Eliminar Medida"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <label>Acción Correctiva / Preventiva</label>
                                    <input type="text" placeholder="Ej. Instalar guardas fijas, dar capacitación" value={m.accion} onChange={e => handleArrayChange('medidas', i, 'accion', e.target.value)} />

                                    <div className="grid-2-cols">
                                        <div>
                                            <label>Responsable</label>
                                            <input type="text" placeholder="Ej. Jefe de Mantenimiento" value={m.responsable} onChange={e => handleArrayChange('medidas', i, 'responsable', e.target.value)} />
                                        </div>
                                        <div>
                                            <label>Fecha Límite</label>
                                            <input type="date" value={m.fechaLimite} onChange={e => handleArrayChange('medidas', i, 'fechaLimite', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: '100%', justifyContent: 'center', marginBottom: '1rem' }} onClick={() => addArrayItem('medidas', { accion: '', responsable: '', fechaLimite: '' })}>
                                <Plus size={16} /> Añadir otra Medida
                            </button>
                        </div>
                    )}
                </div>

                {/* Navegación Inferior Responsive */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn-outline"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        style={{ opacity: currentStep === 0 ? 0.4 : 1, flex: 1, minWidth: '120px', background: 'var(--color-surface)', margin: 0 }}
                    >
                        <ChevronLeft size={20} /> Atrás
                    </button>

                    {currentStep < SECTIONS.length - 1 && (
                        <button className="btn-primary" onClick={handleNext} style={{ margin: 0, flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            Siguiente <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Hidden report for direct printing */}
            <div className="print-only">
                <AccidentPdfGenerator report={{ ...formData, id: formData.id || Date.now() }} onBack={() => { }} />
            </div>

        </div>
    );
}
