import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { XCircle, ClipboardCheck } from 'lucide-react';


const CAPA_TYPES = [
    { id: 'corrective', name: 'Acción Correctiva', icon: '🔧' },
    { id: 'preventive', name: 'Acción Preventiva', icon: '🛡️' },
    { id: 'improvement', name: 'Mejora Continua', icon: '📈' },
    { id: 'containment', name: 'Contención', icon: '🚨' }
];

const PRIORITY = [
    { id: 'critical', label: 'Crítica', color: '#dc2626', icon: '🔴' },
    { id: 'high', label: 'Alta', color: '#f59e0b', icon: '🟠' },
    { id: 'medium', label: 'Media', color: '#3b82f6', icon: '🔵' },
    { id: 'low', label: 'Baja', color: '#16a34a', icon: '🟢' }
];

export default function CAPACreate() {
        const [capa, setCapa] = useState({
        title: '',
        description: '',
        capaType: '',
        priority: 'medium',
        responsible: '',
        dueDate: '',
        problemStatement: '',
        relatedProcess: ''
    });

    const handleSave = () => {
        if (!capa.title.trim() || !capa.capaType) return;
        const newCapa = { ...capa, id: `CAPA-${Date.now()}`, createdAt: new Date().toISOString(), status: 'open' };
        const saved = JSON.parse(localStorage.getItem('ehs_capa_db') || '[]');
        localStorage.setItem('ehs_capa_db', JSON.stringify([newCapa, ...saved]));
        navigate('/capa?created=' + newCapa.id);
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem', maxWidth: '900px', paddingTop: '2rem' }}>
            <div style={{ marginBottom: '2.5rem', padding: '1.75rem', background: 'var(--gradient-card)', borderRadius: 'var(--radius-2xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <XCircle size={32} color="#ffffff" onClick={() => navigate('/capa')} style={{ cursor: 'pointer' }} />
                    </div>
                    <div><h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2 }}>Nueva CAPA</h1><p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>Acción Correctiva/Preventiva</p></div>
                </div>
            </div>
            <div className="card" style={{ padding: '2.5rem', paddingTop: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Título *</label><input type="text" value={capa.title} onChange={(e) => setCapa({ ...capa, title: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Tipo de Acción *</label><select value={capa.capaType} onChange={(e) => setCapa({ ...capa, capaType: e.target.value })} style={inputStyle}>{CAPA_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}</select></div>
                    <div><label style={labelStyle}>Prioridad</label><select value={capa.priority} onChange={(e) => setCapa({ ...capa, priority: e.target.value })} style={inputStyle}>{PRIORITY.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}</select></div>
                    <div><label style={labelStyle}>Responsable</label><input type="text" value={capa.responsible} onChange={(e) => setCapa({ ...capa, responsible: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Fecha Límite</label><input type="date" value={capa.dueDate} onChange={(e) => setCapa({ ...capa, dueDate: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Proceso Relacionado</label><input type="text" value={capa.relatedProcess} onChange={(e) => setCapa({ ...capa, relatedProcess: e.target.value })} style={inputStyle} /></div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}><label style={labelStyle}>Descripción del Problema *</label><textarea value={capa.problemStatement} onChange={(e) => setCapa({ ...capa, problemStatement: e.target.value })} style={{ ...inputStyle, minHeight: '100px' }} /></div>
                <div style={{ marginBottom: '1.5rem' }}><label style={labelStyle}>Descripción Adicional</label><textarea value={capa.description} onChange={(e) => setCapa({ ...capa, description: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} /></div>
                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={() => navigate('/capa')} style={{ flex: 1, padding: '1rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontWeight: 700 }}>Cancelar</button>
                    <button onClick={handleSave} className="btn-primary" style={{ flex: 1 }}>Crear CAPA</button>
                </div>
            </div>
        </div>
    );
}
