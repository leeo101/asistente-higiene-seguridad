import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Camera, Calendar, Building2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';

function DeleteConfirm({ onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: '#fff', borderRadius: '20px', padding: '2rem',
                maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: '#0f172a' }}>¿Eliminar informe?</h3>
                <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: 'white' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function AICameraHistory() {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem('ai_camera_history');
        if (raw) setHistory(JSON.parse(raw));
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('ai_camera_history', JSON.stringify(updated));
        syncCollection('ai_camera_history', updated);
        setDeleteTarget(null);
    };

    const filtered = history.filter(item =>
        item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '5rem' }}>
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/history')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Cámara IA — Historial</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Inspecciones visuales con inteligencia artificial</p>
                </div>
                <button
                    onClick={() => navigate('/ai-camera')}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                >
                    <Camera size={18} /> Nueva Inspección
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                <input
                    type="text"
                    placeholder="Buscar por empresa o ubicación..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem',
                        borderRadius: '12px', border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)', fontSize: '0.95rem'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.length > 0 ? (
                    filtered.map((item) => (
                        <div key={item.id} className="card" style={{ padding: '1.2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
                                    <div style={{ width: '45px', height: '45px', background: 'rgba(6,182,212,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                                        <Camera size={22} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.company || 'Empresa sin nombre'}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                            <Calendar size={14} /> {new Date(item.date).toLocaleDateString()} — <Building2 size={14} /> {item.location}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    fontSize: '0.75rem', fontWeight: 700,
                                    padding: '0.3rem 0.7rem', borderRadius: '20px',
                                    background: item.ppeComplete ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: item.ppeComplete ? '#10b981' : '#ef4444',
                                    flexShrink: 0
                                }}>
                                    {item.ppeComplete ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                                    {item.ppeComplete ? 'EPP OK' : 'Falta EPP'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                <button
                                    onClick={() => navigate('/ai-camera')}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                                >
                                    <Camera size={16} /> Nueva inspección
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(item.id)}
                                    style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <Camera size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No hay inspecciones guardadas.</p>
                        <button onClick={() => navigate('/ai-camera')} className="btn-primary" style={{ marginTop: '1rem' }}>
                            Realizar Primera Inspección
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
