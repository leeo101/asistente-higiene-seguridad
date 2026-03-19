
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import {
    ArrowLeft, Plus, FileText,
    Accessibility, Clock, Trash2, Search, Calendar, Building2
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import CompanyLogo from '../components/CompanyLogo';

function DeleteConfirm({ onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'var(--color-surface)', borderRadius: '20px', padding: '2rem',
                maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--color-text)' }}>¿Eliminar estudio?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function Ergonomics() {
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
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '5rem' }}>
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Protocolo de Ergonomía</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Res. SRT 886/15 — Evaluación disergonómica</p>
                </div>
                <CompanyLogo style={{ height: '32px', width: 'auto', maxWidth: '80px', objectFit: 'contain' }} />
                <button
                    onClick={() => navigate('/ergonomics-form')}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                >
                    <Plus size={18} /> Nuevo Estudio
                </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                <input
                    type="text"
                    placeholder="Buscar por empresa, sector o puesto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.8rem 1rem 0.8rem 2.8rem',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        fontSize: '0.95rem'
                    }}
                />
            </div>

            {/* History List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                        <div key={item.id} className="card" style={{ padding: '1.2rem', transition: 'transform 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: '45px', height: '45px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                        <Accessibility size={22} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{item.empresa || 'Empresa sin nombre'}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                            <Calendar size={14} /> {new Date(parseInt(item.id)).toLocaleDateString()} - <Building2 size={14} /> {item.puesto} · {item.sector}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.7rem', borderRadius: '20px',
                                    background: item.riesgo === 'Moderado' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: item.riesgo === 'Moderado' ? '#f97316' : '#10b981'
                                }}>
                                    {item.riesgo || 'Tolerable'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                <button
                                    onClick={() => navigate(`/ergonomics-report?id=${item.id}`)}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                                >
                                    <FileText size={16} /> Ver / Editar
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(item.id)}
                                    style={{
                                        padding: '0.6rem',
                                        background: 'rgba(239, 68, 68, 0.05)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '8px',
                                        color: '#ef4444',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <Accessibility size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No se encontraron estudios ergonómicos.</p>
                        <button onClick={() => navigate('/ergonomics-form')} className="btn-primary" style={{ marginTop: '1rem' }}>
                            Realizar Nuevo Estudio
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
