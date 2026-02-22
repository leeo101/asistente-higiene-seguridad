import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Calendar, Building2, ClipboardList,
    Printer, Trash2, ChevronRight, FileText, Search,
    Filter, AlertTriangle
} from 'lucide-react';

export default function ATSHistory() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const savedHistory = localStorage.getItem('ats_history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este registro de ATS?')) {
            const newHistory = history.filter(item => item.id !== id);
            setHistory(newHistory);
            localStorage.setItem('ats_history', JSON.stringify(newHistory));
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredHistory = history.filter(item =>
        item.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tarea?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Historial de ATS</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{history.length} documentos guardados</p>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por empresa, tarea o ubicación..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.8rem 1rem 0.8rem 2.8rem',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        fontSize: '0.9rem'
                    }}
                />
            </div>

            {/* History List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                        <div key={item.id} className="card" style={{ padding: '1.2rem', transition: 'transform 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                        <Building2 size={16} color="var(--color-primary)" />
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{item.empresa || 'Empresa No Definida'}</h3>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            <Calendar size={14} /> {formatDate(item.createdAt)}
                                        </div>
                                        {item.ubicacion && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                <ClipboardList size={14} /> {item.ubicacion}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => {
                                            localStorage.setItem('tempATS', JSON.stringify(item));
                                            navigate('/ats');
                                        }}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-surface)',
                                            color: 'var(--color-primary)',
                                            cursor: 'pointer'
                                        }}
                                        title="Ver / Editar"
                                    >
                                        <FileText size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-surface)',
                                            color: '#ef4444',
                                            cursor: 'pointer'
                                        }}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '0.8rem', background: 'var(--color-surface-hover)', borderRadius: '8px', marginBottom: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Tarea: </span>
                                    {item.tarea || 'Sin descripción'}
                                </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.1)', color: '#059669', fontWeight: 600 }}>
                                        {item.checklist?.length || 0} Ítems
                                    </span>
                                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(251, 191, 36, 0.1)', color: '#d97706', fontWeight: 600 }}>
                                        {item.pasos?.length || 0} Etapas
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        localStorage.setItem('tempATS', JSON.stringify(item));
                                        navigate('/ats');
                                        // Auto-print triggered by presence of tempATS could be handled if needed
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--color-primary)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Abrir Documento <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
                        <ClipboardList size={48} color="var(--color-text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>No hay ATS guardados</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Los documentos que guardes aparecerán aquí.</p>
                        <button
                            onClick={() => navigate('/ats')}
                            style={{
                                padding: '0.8rem 1.5rem',
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Crear Nuevo ATS
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
