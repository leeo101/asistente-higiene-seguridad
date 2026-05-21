import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import {
    ArrowLeft, Save, Users, Calendar, Clock, BookOpen,
    UserPlus, Trash2, CheckCircle2, FileText, Briefcase,
    Plus, Share2, Printer, ChevronLeft, ChevronRight, Pencil
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import TrainingPdfGenerator from '../components/TrainingPdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';

export default function TrainingManagement(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const editData = location.state?.editData;
    useDocumentTitle(editData ? 'Editar Capacitación' : 'Gestión de Capacitaciones');

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
        ],
        operatorSignature: '',
        signature: '',
        supervisorSignature: '',
        showSignatures: { operator: false, professional: true, supervisor: false }
    });

    const [showSignatures, setShowSignatures] = useState(formData.showSignatures || {
        operator: false,
        professional: true,
        supervisor: false
    });

    const [professional, setProfessional] = useState({
        name: '',
        license: '',
        signature: '',
        stamp: ''
    });

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        try {
            const personal = localStorage.getItem('personalData');
            const stamp = localStorage.getItem('signatureStampData');
            if (personal) {
                const p = JSON.parse(personal);
                setProfessional(prev => ({ ...prev, name: p.name || '', license: p.license || '' }));
            }
            if (stamp) {
                const s = JSON.parse(stamp);
                setProfessional(prev => ({ ...prev, signature: s.signature || '', stamp: s.stamp || '' }));
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

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
            showSignatures,
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

    const handleSave = () => doSave();

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
                        <button onClick={() => navigate('/training-history')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{editData ? 'Editar Capacitación' : 'Nueva Capacitación'}</h1>
                    </div>
                </div>

                {/* General Metadata Panel */}
                <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(12px)' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                        <BookOpen size={20} /> Metadatos de la Charla
                    </h2>

                    <div className="grid-2-cols" style={{ gap: '1.5rem' }}>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <BookOpen size={16} /> Tema / Título de la Capacitación
                            </label>
                            <input
                                type="text"
                                placeholder="Ej. Inducción de Seguridad, Uso de EPP, Primeros Auxilios..."
                                value={formData.tema}
                                onChange={e => handleInputChange('tema', e.target.value)}
                                className="input-professional capa-focus-glow"
                                style={{ fontWeight: 'bold', height: '46px', borderRadius: '10px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <Users size={16} /> Expositor / Instructor
                            </label>
                            <input
                                type="text"
                                value={formData.expositor}
                                onChange={e => handleInputChange('expositor', e.target.value)}
                                className="input-professional capa-focus-glow"
                                style={{ height: '46px', borderRadius: '10px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <Briefcase size={16} /> Sector / Lugar de Dictado
                            </label>
                            <input
                                type="text"
                                placeholder="Ej. Sala de Reuniones 1"
                                value={formData.ubicacion}
                                onChange={e => handleInputChange('ubicacion', e.target.value)}
                                className="input-professional capa-focus-glow"
                                style={{ height: '46px', borderRadius: '10px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <Calendar size={16} /> Fecha
                            </label>
                            <input
                                type="date"
                                value={formData.fecha}
                                onChange={e => handleInputChange('fecha', e.target.value)}
                                className="input-professional capa-focus-glow"
                                style={{ height: '46px', borderRadius: '10px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <Clock size={16} /> Duración (Horas)
                            </label>
                            <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={formData.duracion}
                                onChange={e => handleInputChange('duracion', e.target.value)}
                                className="input-professional capa-focus-glow"
                                style={{ height: '46px', borderRadius: '10px' }}
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <FileText size={16} /> Empresa / Contratista (Opcional)
                            </label>
                            <input
                                type="text"
                                placeholder="Si aplica a una subcontratista específica"
                                value={formData.empresa}
                                onChange={e => handleInputChange('empresa', e.target.value)}
                                className="input-professional capa-focus-glow"
                                style={{ height: '46px', borderRadius: '10px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Attendee Planilla Panel */}
                <div className="glass-card" style={{ flex: 1, padding: '2rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(12px)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                            <Users size={20} /> Planilla de Asistentes
                        </h2>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, background: 'var(--color-primary)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', boxShadow: '0 2px 8px rgba(var(--color-primary-rgb), 0.2)' }}>
                            {formData.asistentes.length} {formData.asistentes.length === 1 ? 'asistente' : 'asistentes'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {formData.asistentes.map((asistente, i) => (
                            <div key={i} className="training-asistente-card">
                                <span className="training-asistente-badge">
                                    Asistente #{i + 1}
                                </span>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1.2fr 1.5fr auto', gap: '1.25rem', alignItems: 'end', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nombre Completo</label>
                                        <input
                                            type="text"
                                            placeholder="Apellido y Nombre"
                                            value={asistente.nombre}
                                            onChange={e => handleArrayChange(i, 'nombre', e.target.value)}
                                            className="input-professional capa-focus-glow"
                                            style={{ margin: 0, height: '44px', width: '100%', borderRadius: '10px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DNI / CUIL</label>
                                        <input
                                            type="text"
                                            placeholder="Número de documento"
                                            value={asistente.dni}
                                            onChange={e => handleArrayChange(i, 'dni', e.target.value)}
                                            className="input-professional capa-focus-glow"
                                            style={{ margin: 0, height: '44px', width: '100%', borderRadius: '10px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Puesto / Sector</label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Operario de Depósito"
                                            value={asistente.puesto}
                                            onChange={e => handleArrayChange(i, 'puesto', e.target.value)}
                                            className="input-professional capa-focus-glow"
                                            style={{ margin: 0, height: '44px', width: '100%', borderRadius: '10px' }}
                                        />
                                    </div>

                                    {formData.asistentes.length > 1 ? (
                                        <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-end' : 'center', width: isMobile ? '100%' : 'auto' }}>
                                            <button
                                                onClick={() => removeAsistente(i)}
                                                className="delete-asistente-btn"
                                                title="Eliminar Asistente"
                                                style={{
                                                    width: isMobile ? '100%' : '44px',
                                                    height: '44px',
                                                    borderRadius: '10px',
                                                    background: 'rgba(239, 68, 68, 0.08)',
                                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                                    color: '#ef4444',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    marginTop: isMobile ? '0.5rem' : '0'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#ef4444';
                                                    e.currentTarget.style.color = '#ffffff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                                                    e.currentTarget.style.color = '#ef4444';
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="hidden sm:block" style={{ width: '44px' }}></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        className="btn-outline"
                        onClick={addAsistente}
                        style={{
                            width: '100%',
                            padding: '1.2rem',
                            borderStyle: 'dashed',
                            borderWidth: '2px',
                            borderColor: 'var(--color-primary-light)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '1.5rem',
                            color: 'var(--color-primary)',
                            background: 'rgba(var(--color-primary-rgb), 0.03)',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(var(--color-primary-rgb), 0.06)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(var(--color-primary-rgb), 0.03)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <UserPlus size={18} /> Añadir Fila de Asistente
                    </button>
                </div>

                {/* Signatures & Approvals Panel */}
                <div className="glass-card" style={{ marginTop: '1.5rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(12px)', padding: '2rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <Pencil size={24} /> Firmas y Autorizaciones
                    </h3>

                    {/* Premium capsule-style signature toggles */}
                    <div className="no-print" style={{ 
                        marginBottom: '2rem', 
                        padding: '1.5rem', 
                        background: 'var(--color-surface-hover)', 
                        border: '1px solid var(--glass-border-subtle)', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row', 
                        gap: '1rem', 
                        alignItems: 'center', 
                        justifyContent: 'space-between' 
                    }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Incluir Firmas en el Documento:
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                                type="button"
                                className={`training-signature-pill ${showSignatures.operator ? 'training-signature-pill-active' : ''}`}
                                onClick={() => setShowSignatures(s => ({ ...s, operator: !s.operator }))}
                            >
                                <CheckCircle2 size={16} style={{ opacity: showSignatures.operator ? 1 : 0.4 }} /> Delegado / Asistente
                            </button>
                            <button
                                type="button"
                                className={`training-signature-pill ${showSignatures.professional ? 'training-signature-pill-active' : ''}`}
                                onClick={() => setShowSignatures(s => ({ ...s, professional: !s.professional }))}
                            >
                                <CheckCircle2 size={16} style={{ opacity: showSignatures.professional ? 1 : 0.4 }} /> Instructor / Expositor
                            </button>
                            <button
                                type="button"
                                className={`training-signature-pill ${showSignatures.supervisor ? 'training-signature-pill-active' : ''}`}
                                onClick={() => setShowSignatures(s => ({ ...s, supervisor: !s.supervisor }))}
                            >
                                <CheckCircle2 size={16} style={{ opacity: showSignatures.supervisor ? 1 : 0.4 }} /> Supervisión / Verificador
                            </button>
                        </div>
                    </div>

                    {/* On-Sheet Visual Preview of PDF signature blocks */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <PdfSignatures
                            data={{
                                ...formData,
                                professionalSignature: professional.signature,
                                professionalName: professional.name,
                                professionalLicense: professional.license,
                                professionalStamp: professional.stamp
                            }}
                            box1={showSignatures.operator ? {
                                title: 'DELEGADO / ASISTENTE',
                                subtitle: 'En representación de asistentes',
                                signatureUrl: formData.operatorSignature || null,
                                isProfessional: false
                            } : null}
                            box2={showSignatures.professional ? {
                                title: 'INSTRUCTOR / EXPOSITOR',
                                subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                signatureUrl: formData.signature || professional.signature || null,
                                stampUrl: professional.stamp || null,
                                isProfessional: true,
                                license: professional.license
                            } : null}
                            box3={showSignatures.supervisor ? {
                                title: 'SUPERVISIÓN / VERIFICADOR',
                                subtitle: 'Verificación de Capacitación',
                                signatureUrl: formData.supervisorSignature || null,
                                isProfessional: false
                            } : null}
                        />
                    </div>

                    {/* Interactive Signature Drawing Pads wrapped inside sleek glass containers */}
                    {(showSignatures.operator || showSignatures.professional || showSignatures.supervisor) && (
                        <div className="no-print" style={{ 
                            marginTop: '2rem', 
                            paddingTop: '2rem', 
                            borderTop: '1px solid var(--color-border)', 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', 
                            gap: '1.5rem' 
                        }}>
                            {showSignatures.operator && (
                                <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border-subtle)' }}>
                                    <SignatureCanvas 
                                        onSave={(sig) => setFormData(prev => ({ ...prev, operatorSignature: sig || '' }))}
                                        initialImage={formData.operatorSignature}
                                        label="Firma de Delegado / Asistente"
                                    />
                                </div>
                            )}
                            
                            {showSignatures.professional && (
                                <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border-subtle)' }}>
                                    <SignatureCanvas 
                                        onSave={(sig) => setFormData(prev => ({ ...prev, signature: sig || '' }))}
                                        initialImage={formData.signature}
                                        label="Firma de Instructor / Expositor"
                                    />
                                </div>
                            )}

                            {showSignatures.supervisor && (
                                <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border-subtle)' }}>
                                    <SignatureCanvas 
                                        onSave={(sig) => setFormData(prev => ({ ...prev, supervisorSignature: sig || '' }))}
                                        initialImage={formData.supervisorSignature}
                                        label="Firma de Supervisión / Verificador"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* PRO upgrade banner for free users */}
            <AdBanner />

            {/* Hidden report for direct printing */}
            <div className="print-only">
                <TrainingPdfGenerator data={{ ...formData, showSignatures }} onBack={() => { }} />
            </div>

        </div>
    );
}
