import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, FileText, Calendar, MapPin, Printer,
    Search, AlertTriangle, ChevronRight, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AccidentPdfGenerator from '../components/AccidentPdfGenerator';

export default function AccidentHistory() {
    useDocumentTitle('Historial de Accidentes');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncing } = useSync();

    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        const h = JSON.parse(localStorage.getItem('accident_history') || '[]');
        // Sort newest first
        setHistory(h.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, [syncing]);

    const filteredHistory = history.filter(item => {
        const searchStr = `${item.empresa} ${item.victimaNombre} ${item.lesion}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    const getSeverityColor = (sev) => {
        if (sev === 'Leve') return '#3b82f6';
        if (sev === 'Moderado') return '#fbbf24';
        if (sev === 'Grave') return '#f97316';
        if (sev === 'Mortal') return '#dc2626';
        return '#64748b';
    };

    if (selectedReport) {
        return <AccidentPdfGenerator report={selectedReport} onBack={() => setSelectedReport(null)} />;
    }

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Investigaciones de Accidentes</h1>
                </div>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por empleado, empresa o lesión..."
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
                {filteredHistory.map((report) => {
                    const sevColor = getSeverityColor(report.gravedad);
                    return (
                        <div key={report.id} className="card" style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `6px solid ${sevColor}` }}
                            onClick={() => setSelectedReport(report)}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${sevColor}15`, color: sevColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {report.victimaNombre}
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px', background: sevColor, color: '#fff' }}>
                                        {report.gravedad}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {new Date(report.date).toLocaleDateString()}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {report.empresa}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-text)' }}><Activity size={14} /> {report.lesion}</span>
                                </div>
                            </div>
                            <ChevronRight style={{ color: 'var(--color-border)', flexShrink: 0 }} />
                        </div>
                    );
                })}

                {filteredHistory.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface)', borderRadius: '24px', border: '1.5px dashed var(--color-border)' }}>
                        <FileText size={48} style={{ color: 'var(--color-border)', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>No hay investigaciones</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            {searchTerm ? 'Ningún reporte coincide con la búsqueda.' : 'Los accidentes investigados aparecerán aquí.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
