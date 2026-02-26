import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Plus, History, FileText,
    Accessibility, CheckCircle2, AlertTriangle, Clock, Trash2
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';

export default function Ergonomics() {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('ergonomics_history');
        if (saved) setHistory(JSON.parse(saved));
    }, [syncPulse]);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm('¿Desea eliminar este estudio?')) {
            const updated = history.filter(item => item.id !== id);
            setHistory(updated);
            localStorage.setItem('ergonomics_history', JSON.stringify(updated));
            syncCollection('ergonomics_history', updated);
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '1rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Protocolo de Ergonomía</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ textAlign: 'left' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Evaluación y gestión de riesgos disergonómicos según la **Resolución SRT 886/15**.
                    </p>

                    <button
                        className="btn-primary"
                        onClick={() => navigate('/ergonomics-form')}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1rem' }}
                    >
                        <Plus size={20} /> Nuevo Estudio Ergonómico
                    </button>
                </div>
            </div>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Estudios Recientes</h3>
                    <Clock size={18} color="var(--color-text-muted)" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {history.length > 0 ? (
                        history.sort((a, b) => b.id - a.id).map((item, i) => (
                            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', cursor: 'pointer' }} onClick={() => navigate(`/ergonomics-report?id=${item.id}`)}>
                                <div style={{
                                    width: '45px', height: '45px', borderRadius: '12px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: 'var(--color-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Accessibility size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{item.empresa}</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.puesto} • {item.sector}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: item.riesgo === 'Moderado' ? '#f97316' : '#10b981' }}>
                                            {item.riesgo || 'Tolerable'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(parseInt(item.id)).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(item.id, e)}
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--color-border)', borderRadius: '16px', opacity: 0.6 }}>
                            <Accessibility size={40} style={{ marginBottom: '1rem' }} />
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>No hay estudios registrados</p>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '2.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Recursos Legales</h3>
                <div className="card" style={{ padding: '1rem', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <FileText size={20} color="var(--color-primary)" />
                        <div>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Guía Res. 886/15</h4>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                Consulta los criterios de identificación de factores de riesgo y pasos del protocolo.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
