import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, RefreshCw, Shield, AlertTriangle, Clock, CheckCircle2, User, Calendar, FileText, Target, Info, Eye, Printer, Share2 } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import CAPAPdf from '../components/CAPAPdf';

const CAPA_TYPES = [
    { id: 'corrective', name: 'Correctiva', icon: '🔧' },
    { id: 'preventive', name: 'Preventiva', icon: '🛡️' },
    { id: 'improvement', name: 'Mejora', icon: '📈' },
    { id: 'containment', name: 'Contención', icon: '🚨' }
];

const PRIORITY = {
    critical: { label: 'CRÍTICA', color: '#dc2626', days: 3, icon: '🚨' },
    high: { label: 'ALTA', color: '#f59e0b', days: 7, icon: '⚠️' },
    medium: { label: 'MEDIA', color: '#3b82f6', days: 15, icon: 'ℹ️' },
    low: { label: 'BAJA', color: '#16a34a', days: 30, icon: '✅' }
};

export default function CAPAForm() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [capa, setCapa] = useState({
        title: '',
        capaType: 'corrective',
        priority: 'medium',
        responsible: '',
        dueDate: '',
        description: '',
        rootCause: {
            why1: '',
            why2: '',
            why3: '',
            why4: '',
            why5: '',
            finalCause: ''
        },
        actionPlan: '',
        verification: {
            implemented: false,
            effective: false,
            comments: ''
        },
        tags: []
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSave = () => {
        if (!capa.title || !capa.description) {
            alert('Por favor complete los campos obligatorios (*)');
            return;
        }

        const newCapa = {
            ...capa,
            id: `CAPA-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'open'
        };

        const saved = JSON.parse(localStorage.getItem('ehs_capa_db') || '[]');
        const updated = [newCapa, ...saved];
        localStorage.setItem('ehs_capa_db', JSON.stringify(updated));
        
        navigate('/capa-history');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: '5.5rem',
                zIndex: 100,
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '0.5rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900 }}>
                        <RefreshCw size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Nueva Acción CAPA
                    </h1>
                </div>
                {/* Header Buttons Removed as they are now in the floating bar */}
            </div>

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Título de la Acción *</label>
                            <input type="text" value={capa.title} onChange={(e) => setCapa({ ...capa, title: e.target.value })} style={inputStyle} placeholder="Ej: Fugas detectadas en sector de químicos" />
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de Acción</label>
                            <select value={capa.capaType} onChange={(e) => setCapa({ ...capa, capaType: e.target.value })} style={inputStyle}>
                                {CAPA_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Prioridad</label>
                            <select value={capa.priority} onChange={(e) => setCapa({ ...capa, priority: e.target.value })} style={inputStyle}>
                                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Responsable</label>
                            <input type="text" value={capa.responsible} onChange={(e) => setCapa({ ...capa, responsible: e.target.value })} style={inputStyle} placeholder="Nombre del responsable" />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha Límite</label>
                            <input type="date" value={capa.dueDate} onChange={(e) => setCapa({ ...capa, dueDate: e.target.value })} style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Descripción del Problema / No Conformidad *</label>
                        <textarea 
                            value={capa.description} 
                            onChange={(e) => setCapa({ ...capa, description: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '80px', paddingTop: '0.75rem' }} 
                            placeholder="Describa brevemente la situación detectada..."
                        />
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Análisis de Causa Raíz (5 Porqués)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[1, 2, 3, 4, 5].map(num => (
                                <div key={num} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--color-primary)', width: '80px' }}>{num}° Porqué:</span>
                                    <input 
                                        type="text" 
                                        value={capa.rootCause[`why${num}`]} 
                                        onChange={(e) => setCapa({ ...capa, rootCause: { ...capa.rootCause, [`why${num}`]: e.target.value } })} 
                                        style={{ ...inputStyle, padding: '0.5rem 0.75rem' }} 
                                        placeholder={`Pregunta ${num}...`} 
                                    />
                                </div>
                            ))}
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary)' }}>
                                <label style={labelStyle}>Causa Raíz Final Identificada</label>
                                <input 
                                    type="text" 
                                    value={capa.rootCause.finalCause} 
                                    onChange={(e) => setCapa({ ...capa, rootCause: { ...capa.rootCause, finalCause: e.target.value } })} 
                                    style={inputStyle} 
                                    placeholder="La causa fundamental es..." 
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Plan de Acción y Verificación</h3>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>Acciones Correctivas / Preventivas Detalladas</label>
                            <textarea 
                                value={capa.actionPlan} 
                                onChange={(e) => setCapa({ ...capa, actionPlan: e.target.value })} 
                                style={{ ...inputStyle, minHeight: '100px' }} 
                                placeholder="1. Reparar... 2. Capacitar... 3. Modificar procedimiento..." 
                            />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button
                                    onClick={() => setCapa({ ...capa, verification: { ...capa.verification, implemented: !capa.verification.implemented } })}
                                    style={{
                                        padding: '0.75rem',
                                        background: capa.verification.implemented ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-background)',
                                        border: `2px solid ${capa.verification.implemented ? 'var(--color-success)' : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}
                                >
                                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--color-success)', background: capa.verification.implemented ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {capa.verification.implemented && <CheckCircle2 size={12} color="#fff" />}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Implementación Verificada</span>
                                </button>
                                <button
                                    onClick={() => setCapa({ ...capa, verification: { ...capa.verification, effective: !capa.verification.effective } })}
                                    style={{
                                        padding: '0.75rem',
                                        background: capa.verification.effective ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-background)',
                                        border: `2px solid ${capa.verification.effective ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}
                                >
                                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--color-primary)', background: capa.verification.effective ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {capa.verification.effective && <CheckCircle2 size={12} color="#fff" />}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Eficacia Comprobada</span>
                                </button>
                            </div>
                            <div>
                                <label style={labelStyle}>Comentarios de Verificación</label>
                                <textarea 
                                    value={capa.verification.comments} 
                                    onChange={(e) => setCapa({ ...capa, verification: { ...capa.verification, comments: e.target.value } })} 
                                    style={{ ...inputStyle, minHeight: '80px', fontSize: '0.85rem' }} 
                                    placeholder="Resultados de la verificación de eficacia..." 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botones de acción flotantes */}
            </main>

            <div className="no-print floating-action-bar">
                <button
                    onClick={() => setShowShareModal(true)}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => window.print()}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: '#ffffff' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
                <button
                    onClick={handleSave}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: '#ffffff' }}
                >
                    <Save size={18} /> GUARDAR CAPA
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Acción CAPA"
                fileName={`CAPA_${capa.title || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <CAPAPdf data={{ ...capa, createdAt: capa.createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

