import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Plus, FileText,
    Accessibility, Clock, Trash2, Search, Calendar, Building2, TriangleAlert
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';

function DeleteConfirm({ onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card animate-fade-in" style={{
                background: 'var(--color-surface)', borderRadius: '20px', padding: '2rem',
                maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                textAlign: 'center', border: '1px solid var(--color-border)'
            }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--color-text)' }}>¿Eliminar estudio?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: '1px solid var(--color-border)', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function Ergonomics(): React.ReactElement | null {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem('ergonomics_history');
        if (saved) setHistory(JSON.parse(saved));
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('ergonomics_history', JSON.stringify(updated));
        syncCollection('ergonomics_history', updated);
        setDeleteTarget(null);
    };

    const filteredHistory = history
        .sort((a, b) => b.id - a.id)
        .filter(item =>
            item.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sector?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div className="container" style={{ maxWidth: '1200px', paddingBottom: '8rem' }}>
            <Breadcrumbs />
            
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

            <PremiumHeader
                title="Protocolo de Ergonomía"
                subtitle="Res. SRT 886/15 — Evaluación disergonómica"
                icon={<Accessibility size={36} />}
            />

            <div className="no-print floating-action-bar">
                <button
                    onClick={() => navigate('/ergonomics-form')}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: '#ffffff' }}
                >
                    <Plus size={18} /> NUEVO ESTUDIO
                </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={20} />
                <input
                    type="text"
                    placeholder="Buscar por empresa, sector o puesto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3rem',
                        borderRadius: '16px',
                        border: '2px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        fontSize: '1rem',
                        outline: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                    }}
                />
            </div>

            {/* History List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                        <div key={item.id} className="card hover:shadow-md transition-all" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                                        <Accessibility size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>{item.empresa || 'Empresa sin nombre'}</h3>
                                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.2rem' }}>
                                            {item.puesto} · {item.sector}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-background)', padding: '0.6rem', borderRadius: '8px' }}>
                                <Calendar size={16} /> 
                                <span style={{ fontWeight: 600 }}>{new Date(parseInt(item.id)).toLocaleDateString('es-AR')}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: '1px dashed var(--color-border)' }}>
                                <span style={{ fontWeight: 800, color: 'var(--color-text-muted)' }}>NIVEL DE RIESGO</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', background: item.riesgo === 'Moderado' ? '#fef3c7' : '#d1fae5', color: item.riesgo === 'Moderado' ? '#f59e0b' : '#10b981' }}>
                                    {item.riesgo || 'Tolerable'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <button
                                    onClick={() => navigate('/ergonomics-form', { state: { editData: item } })}
                                    style={{ flex: 1, padding: '0.6rem', background: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(var(--color-primary-rgb), 0.2)', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                    className="hover:bg-[rgba(var(--color-primary-rgb),0.15)]"
                                >
                                    <FileText size={16} /> VER / EDITAR
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(item.id)}
                                    style={{ padding: '0.6rem', marginLeft: '0.5rem', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '20px', border: '2px dashed var(--color-border)' }}>
                        <Accessibility size={48} color="var(--color-text-muted)" style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ margin: 0, color: 'var(--color-text)' }}>No hay estudios registrados</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Creá tu primer evaluación ergonómica para comenzar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
