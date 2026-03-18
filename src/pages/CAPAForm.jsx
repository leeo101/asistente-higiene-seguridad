import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RefreshCw, Shield, AlertTriangle, Clock, CheckCircle2, User, Calendar, FileText, Target, Info } from 'lucide-react';

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
    const [capa, setCapa] = useState({
        title: '',
        capaType: 'corrective',
        priority: 'medium',
        responsible: '',
        dueDate: '',
        description: '',
        rootCause: '',
        actionPlan: '',
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
        
        navigate('/capa');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: 0,
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
                <button
                    onClick={handleSave}
                    className="btn-primary"
                    style={{ width: 'auto', margin: 0, padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Save size={18} />
                    {!isMobile && 'Abrir CAPA'}
                </button>
            </div>

            <main style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
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

                    <div style={{ marginTop: '1.5rem' }}>
                        <label style={labelStyle}>Análisis de Causa Raíz (Opcional)</label>
                        <textarea 
                            value={capa.rootCause} 
                            onChange={(e) => setCapa({ ...capa, rootCause: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '80px', paddingTop: '0.75rem' }} 
                            placeholder="¿Por qué ocurrió el problema? (5 porqués, Ishikawa, etc.)"
                        />
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <label style={labelStyle}>Plan de Acción Inmediato</label>
                        <textarea 
                            value={capa.actionPlan} 
                            onChange={(e) => setCapa({ ...capa, actionPlan: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '100px', paddingTop: '0.75rem' }} 
                            placeholder="Pasos a seguir para resolver o mitigar la situación..."
                        />
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        style={{ 
                            flex: 1, 
                            padding: '1rem', 
                            background: 'var(--color-surface)', 
                            border: '1px solid var(--color-border)', 
                            borderRadius: 'var(--radius-lg)', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            color: 'var(--color-text)'
                        }}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="btn-primary" 
                        style={{ flex: 2, margin: 0 }}
                    >
                        Emitir CAPA
                    </button>
                </div>
            </main>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', transition: 'all var(--transition-fast)', boxSizing: 'border-box' };
