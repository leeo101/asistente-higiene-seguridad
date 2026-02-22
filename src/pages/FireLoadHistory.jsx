import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Trash2, FileText, Printer,
    Calendar, Building2, Flame, ExternalLink, Plus
} from 'lucide-react';

export default function FireLoadHistory() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const historyRaw = localStorage.getItem('fireload_history');
        if (historyRaw) {
            setHistory(JSON.parse(historyRaw));
        }
    }, []);

    const deleteEntry = (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este estudio de carga de fuego?')) {
            const newHistory = history.filter(item => item.id !== id);
            setHistory(newHistory);
            localStorage.setItem('fireload_history', JSON.stringify(newHistory));
        }
    };

    const filteredHistory = history.filter(item =>
        item.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sector?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Historial de Carga de Fuego</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Estudios técnicos guardados</p>
                </div>
                <button
                    onClick={() => navigate('/fire-load')}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                >
                    <Plus size={18} /> Nuevo Estudio
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                <input
                    type="text"
                    placeholder="Buscar por empresa o sector..."
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                        <div key={item.id} className="card" style={{ padding: '1.2rem', transition: 'transform 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: '45px', height: '45px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#f97316' }}>
                                        <Flame style={{ marginLeft: '12px' }} size={21} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{item.empresa || 'Empresa sin nombre'}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                            <Calendar size={14} /> {new Date(item.createdAt).toLocaleDateString()} - <Building2 size={14} /> {item.sector}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f97316' }}>{item.results?.cargaDeFuego?.toFixed(2)}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Kg/m² - {item.results?.rfRequerida}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                <button
                                    onClick={() => navigate('/fire-load', { state: { editData: item } })}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                                >
                                    <FileText size={16} /> Ver / Editar
                                </button>
                                <button
                                    onClick={() => deleteEntry(item.id)}
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
                        <Flame size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No se encontraron estudios de carga de fuego.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
