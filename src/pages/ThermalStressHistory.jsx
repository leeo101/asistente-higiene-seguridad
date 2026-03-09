import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Calendar, ChevronRight, ThermometerSun,
    Clock, MapPin, Printer, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ThermalStressPdfGenerator from '../components/ThermalStressPdfGenerator';

export default function ThermalStressHistory() {
    useDocumentTitle('Historial de Estrés Térmico');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncing } = useSync();

    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        const h = JSON.parse(localStorage.getItem('thermal_history') || '[]');
        setHistory(h.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, [syncing]);

    const filteredHistory = history.filter(item => {
        const searchStr = `${item.puesto} ${item.sector} ${item.tarea}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    if (selectedReport) {
        return <ThermalStressPdfGenerator report={selectedReport} onBack={() => setSelectedReport(null)} />;
    }

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Evaluaciones de Carga Térmica</h1>
                </div>
                <button onClick={() => navigate('/thermal-stress')} className="btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    Nueva Medición
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por puesto o sector..."
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
                    <div key={report.id} className="card" style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `6px solid ${report.resultados.admisible ? '#10b981' : '#ef4444'}` }}
                        onClick={() => setSelectedReport(report)}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: report.resultados.admisible ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: report.resultados.admisible ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {report.resultados.admisible ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {report.puesto}
                                </h3>
                                <span style={{ fontSize: '1rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                                    {report.resultados.tgbh}°C
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {new Date(report.fecha + 'T12:00:00Z').toLocaleDateString()}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {report.sector}</span>
                            </div>
                        </div>
                        <ChevronRight style={{ color: 'var(--color-border)', flexShrink: 0 }} />
                    </div>
                ))}

                {filteredHistory.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface)', borderRadius: '24px', border: '1.5px dashed var(--color-border)' }}>
                        <ThermometerSun size={48} style={{ color: 'var(--color-border)', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>No hay evaluaciones térmicas</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            {searchTerm ? 'Ningún registro coincide con la búsqueda.' : 'Tus cálculos de TGBH guardados aparecerán aquí.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
