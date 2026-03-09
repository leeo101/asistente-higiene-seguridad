import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Calendar, ChevronRight, Siren,
    Clock, Building2, Timer, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import DrillPdfGenerator from '../components/DrillPdfGenerator';

export default function DrillsHistory() {
    useDocumentTitle('Historial de Simulacros');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncing } = useSync();

    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        const h = JSON.parse(localStorage.getItem('drills_history') || '[]');
        setHistory(h.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, [syncing]);

    const filteredHistory = history.filter(item => {
        const searchStr = `${item.empresa} ${item.hipotesis}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    if (selectedReport) {
        return <DrillPdfGenerator report={selectedReport} onBack={() => setSelectedReport(null)} />;
    }

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Actas de Simulacros</h1>
                </div>
                <button onClick={() => navigate('/drills')} className="btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    Nuevo Simulacro
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por empresa o tipo de evento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '16px',
                        border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                        fontSize: '1rem', color: 'var(--color-text)', outline: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredHistory.map((report) => (
                    <div key={report.id} className="card" style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `6px solid #f97316` }}
                        onClick={() => setSelectedReport(report)}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(249,115,22,0.15)', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Siren size={24} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {report.empresa}
                                </h3>
                                <span style={{ fontSize: '0.9rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Timer size={14} /> {report.tiempoVisual}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {new Date(report.fecha + 'T12:00:00Z').toLocaleDateString()}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={14} color="#f59e0b" /> {report.hipotesis}</span>
                            </div>
                        </div>
                        <ChevronRight style={{ color: 'var(--color-border)', flexShrink: 0 }} />
                    </div>
                ))}

                {filteredHistory.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface)', borderRadius: '24px', border: '1.5px dashed var(--color-border)' }}>
                        <Siren size={48} style={{ color: 'var(--color-border)', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>No hay simulacros registrados</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            {searchTerm ? 'Ningún registro coincide con la búsqueda.' : 'Los reportes de evacuación que guardes aparecerán aquí.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
