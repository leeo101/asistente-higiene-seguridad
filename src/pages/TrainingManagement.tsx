import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState } from 'react';

import {
    ArrowLeft, Save, Users, Calendar, Clock, BookOpen,
    UserPlus, Trash2, CheckCircle2, FileText, Briefcase,
    Plus, Share2, Printer, ChevronLeft, ChevronRight
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import TrainingPdfGenerator from '../components/TrainingPdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';

export default function TrainingManagement(): React.ReactElement | null {
    useDocumentTitle('Gestión de Capacitaciones');
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();

    const editData = location.state?.editData;

    const [formData, setFormData] = useState(editData || {
        tema: '',
        expositor: currentUser?.displayName || '',
        fecha: new Date().toISOString().split('T')[0],
        duracion: '1',
        empresa: '',
        ubicacion: '',
        observaciones: '',
        asistentes: [
            { nombre: '', dni: '', puesto: '' }
        ]
    });

    const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'report'
    const [showShareModal, setShowShareModal] = useState(false);

    const handlePrint = () => requirePro(() => window.print());

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (index, field, value) => {
        setFormData(prev => {
            const newAsistentes = [...prev.asistentes];
            newAsistentes[index] = { ...newAsistentes[index], [field]: value };
            return { ...prev, asistentes: newAsistentes };
        });
    };

    const addAsistente = () => {
        setFormData(prev => ({
            ...prev,
            asistentes: [...prev.asistentes, { nombre: '', dni: '', puesto: '' }]
        }));
    };

    const removeAsistente = (index) => {
        setFormData(prev => ({
            ...prev,
            asistentes: prev.asistentes.filter((_, i) => i !== index)
        }));
    };

    const doSave = () => {
        if (!formData.tema || !formData.fecha) {
            toast.error('El tema y la fecha son obligatorios.');
            return;
        }

        // Filter out completely empty rows before saving
        const asistentesValidos = formData.asistentes.filter(a => a.nombre.trim() !== '' || a.dni.trim() !== '');

        if (asistentesValidos.length === 0) {
            toast.error('Debe ingresar al menos 1 asistente a la capacitación.');
            return;
        }

        const report = {
            id: editData?.id || Date.now(),
            date: editData?.date || new Date().toISOString(),
            ...formData,
            asistentes: asistentesValidos
        };

        let history = [];
        try {
            const raw = localStorage.getItem('training_history');
            if (raw && raw !== 'undefined') {
                const parsed = JSON.parse(raw);
                history = Array.isArray(parsed) ? parsed : [];
            }
        } catch (e) {
            console.error('[TrainingManagement] Error parsing history:', e);
            history = [];
        }

        if (editData) {
            // Update existing
            history = history.map(item => item.id === editData.id ? report : item);
        } else {
            // Add new
            history.unshift(report);
        }

        localStorage.setItem('training_history', JSON.stringify(history));
        syncCollection('training_history', history);

        toast.success(editData ? 'Capacitación actualizada correctamente.' : 'Capacitación registrada correctamente.');
        navigate('/training-history');
    };

    const handleSave = () => requirePro(doSave);

    const handleBack = () => {
        navigate('/training-history');
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="no-print">
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    title="Compartir Capacitación"
                    text={`📊 Registro de Capacitación: ${formData.tema}\n📅 Fecha: ${formData.fecha}\n👥 Asistentes: ${formData.asistentes.length}\n\nEnviado desde Asistente HYS`}
                    rawMessage={`📊 Registro de Capacitación: ${formData.tema}\n📅 Fecha: ${formData.fecha}\n👥 Asistentes: ${formData.asistentes.length}\n\nEnviado desde Asistente HYS`}
                    elementIdToPrint="pdf-content"
                    fileName={`Capacitacion_${formData.tema.replace(/\s+/g, '_')}.pdf`}
                />

                {/* Floating Action Bar Premium */}
                <div className="floating-action-bar">
                    <button
                        onClick={handleSave}
                        className="btn-floating-action"
                        style={{ background: '#36B37E', color: '#ffffff' }}
                    >
                        <Save size={18} /> GUARDAR
                    </button>
                    <button
                        onClick={() => requirePro(() => setShowShareModal(true))}
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

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{editData ? 'Editar Capacitación' : 'Nueva Capacitación'}</h1>
                    </div>
                </div>

                <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                        <BookOpen size={20} /> Metadatos de la Charla
                    </h2>

                    <div className="grid-2-cols">
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label>Tema / Título de la Capacitación</label>
                            <input
                                type="text"
                                placeholder="Ej. Inducción de Seguridad, Uso de EPP, Primeros Auxilios..."
                                value={formData.tema}
                                onChange={e => handleInputChange('tema', e.target.value)}
                                style={{ fontWeight: 'bold' }}
                            />
                        </div>
                        <div>
                            <label>Expositor / Instructor</label>
                            <input
                                type="text"
                                value={formData.expositor}
                                onChange={e => handleInputChange('expositor', e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Sector / Lugar de Dictado</label>
                            <input
                                type="text"
                                placeholder="Ej. Sala de Reuniones 1"
                                value={formData.ubicacion}
                                onChange={e => handleInputChange('ubicacion', e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Fecha</label>
                            <input
                                type="date"
                                value={formData.fecha}
                                onChange={e => handleInputChange('fecha', e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Duración (Horas)</label>
                            <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={formData.duracion}
                                onChange={e => handleInputChange('duracion', e.target.value)}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label>Empresa / Contratista (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Si aplica a una subcontratista específica"
                                value={formData.empresa}
                                onChange={e => handleInputChange('empresa', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ flex: 1, padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                            <Users size={20} /> Planilla de Asistentes
                        </h2>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
                            {formData.asistentes.length} cargados
                        </span>
                    </div>

                    <div className="hidden sm:grid" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 40px', gap: '1rem', marginBottom: '0.5rem', padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        <div>Apellido y Nombre</div>
                        <div>DNI / CUIL</div>
                        <div>Puesto / Sector</div>
                        <div></div>
                    </div>

                    {formData.asistentes.map((asistente, i) => (
                        <div key={i} className="responsive-list-card">

                            <div className="responsive-card-row">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 2 }}>
                                    <label className="sm:hidden" style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0 }}>Apellido y Nombre</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre completo"
                                        value={asistente.nombre}
                                        onChange={e => handleArrayChange(i, 'nombre', e.target.value)}
                                        style={{ margin: 0, height: '44px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                                    <label className="sm:hidden" style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0 }}>DNI / CUIL</label>
                                    <input
                                        type="text"
                                        placeholder="DNI..."
                                        value={asistente.dni}
                                        onChange={e => handleArrayChange(i, 'dni', e.target.value)}
                                        style={{ margin: 0, height: '44px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1.5 }}>
                                    <label className="sm:hidden" style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0 }}>Puesto / Sector</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Soldador"
                                        value={asistente.puesto}
                                        onChange={e => handleArrayChange(i, 'puesto', e.target.value)}
                                        style={{ margin: 0, height: '44px' }}
                                    />
                                </div>

                                {/* Acción de Borrar (Móvil full, PC cuadrado 44px) */}
                                {formData.asistentes.length > 1 ? (
                                    <div style={{ display: 'flex' }} className="mt-2 sm:mt-0 sm:ml-2 sm:w-[44px] flex-none">
                                        <style>{`
                                            @media (min-width: 640px) {
                                                .btn-del-${i} { width: 44px !important; flex: none !important; margin-top: 0 !important; }
                                            }
                                        `}</style>
                                        <button
                                            onClick={() => removeAsistente(i)}
                                            className={`delete-asistente-btn btn-del-${i}`}
                                            title="Eliminar Asistente"
                                            style={{
                                                width: '100%', height: '44px', borderRadius: '8px',
                                                marginTop: '0.5rem', padding: 0, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="hidden sm:block" style={{ width: '44px', flex: 'none' }}></div>
                                )}
                            </div>
                        </div>
                    ))}

                    <button
                        className="btn-outline"
                        onClick={addAsistente}
                        style={{
                            width: '100%', padding: '1rem', borderStyle: 'dashed',
                            borderWidth: '2px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '0.5rem', marginTop: '1rem'
                        }}
                    >
                        <UserPlus size={18} /> Añadir Fila de Asistente
                    </button>
                </div>
            </div>

            {/* PRO upgrade banner for free users */}
            <AdBanner />

            {/* Hidden report for direct printing */}
            <div className="print-only">
                <TrainingPdfGenerator data={formData} onBack={() => { }} />
            </div>

        </div>
    );
}
