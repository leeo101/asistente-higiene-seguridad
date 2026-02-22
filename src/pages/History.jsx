import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, FileText, Calendar, ChevronRight,
    ClipboardList, Flame, BarChart3, ShieldAlert, Plus
} from 'lucide-react';

export default function History() {
    const navigate = useNavigate();

    const historyCategories = [
        {
            title: 'Inspecciones',
            icon: <FileText />,
            color: '#3b82f6',
            path: '/history-list',
            count: JSON.parse(localStorage.getItem('inspections_history') || '[]').length
        },
        {
            title: 'ATS (Análisis Seguro)',
            icon: <BarChart3 />,
            color: '#10b981',
            path: '/ats-history',
            count: JSON.parse(localStorage.getItem('ats_history') || '[]').length
        },
        {
            title: 'Carga de Fuego',
            icon: <Flame />,
            color: '#f97316',
            path: '/fire-load-history',
            count: JSON.parse(localStorage.getItem('fireload_history') || '[]').length
        },
        {
            title: 'Matrices de Riesgo',
            icon: <ShieldAlert />,
            color: '#8b5cf6',
            path: '/history-list-matrix',
            count: JSON.parse(localStorage.getItem('risk_matrix_history') || '[]').length
        },
        {
            title: 'Informes Profesionales',
            icon: <FileText />,
            color: '#ec4899',
            path: '/reports-history',
            count: JSON.parse(localStorage.getItem('reports_history') || '[]').length
        },
        {
            title: 'Checklist Herramientas',
            icon: <ClipboardList />,
            color: '#3b82f6',
            path: '/checklists-history',
            count: JSON.parse(localStorage.getItem('tool_checklists_history') || '[]').length
        }
    ];

    const [view, setView] = useState('hub'); // 'hub', 'inspections', 'matrices', 'reports'

    // Load data conditionally
    const [historicalData, setHistoricalData] = useState([]);
    const [matrixData, setMatrixData] = useState([]);
    const [reportsData, setReportsData] = useState([]);

    useEffect(() => {
        if (view === 'inspections') {
            const raw = localStorage.getItem('inspections_history');
            if (raw) setHistoricalData(JSON.parse(raw));
        } else if (view === 'matrices') {
            const raw = localStorage.getItem('risk_matrix_history');
            if (raw) setMatrixData(JSON.parse(raw));
        } else if (view === 'reports') {
            const raw = localStorage.getItem('reports_history');
            if (raw) setReportsData(JSON.parse(raw));
        }
    }, [view]);

    if (view === 'hub') {
        return (
            <div className="container" style={{ paddingBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <ArrowLeft />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Historiales</h1>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {historyCategories.map((cat, i) => (
                        <div
                            key={i}
                            className="card"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1.2rem',
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                if (cat.title === 'Inspecciones') setView('inspections');
                                else if (cat.title === 'Matrices de Riesgo') setView('matrices');
                                else if (cat.title === 'Informes Profesionales') setView('reports');
                                else navigate(cat.path);
                            }}
                        >
                            <div style={{
                                background: `${cat.color}15`,
                                color: cat.color,
                                padding: '1rem',
                                borderRadius: '12px'
                            }}>
                                {React.cloneElement(cat.icon, { size: 24 })}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{cat.title}</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    {cat.count} registros guardados
                                </p>
                            </div>
                            <ChevronRight size={18} color="var(--color-text-muted)" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (view === 'matrices') {
        return (
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <ArrowLeft />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', flex: 1 }}>Historial de Matrices</h1>
                    <button
                        onClick={() => navigate('/risk-matrix')}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
                    >
                        <Plus size={18} /> Nuevo
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {matrixData.length > 0 ? (
                        matrixData.map(item => (
                            <div
                                key={item.id}
                                className="card"
                                style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                                onClick={() => {
                                    localStorage.setItem('current_risk_matrix', JSON.stringify(item));
                                    navigate('/risk-matrix-report');
                                }}
                            >
                                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.8rem', borderRadius: '12px', color: '#8b5cf6' }}>
                                    <ShieldAlert />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 0.3rem 0', fontWeight: 700 }}>{item.name}</h4>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Calendar size={14} /> {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                        <span>{item.location}</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} color="var(--color-text-muted)" />
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <ShieldAlert size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <p style={{ marginBottom: '1.5rem' }}>No hay matrices registradas</p>
                            <button
                                onClick={() => navigate('/risk-matrix')}
                                className="btn-primary"
                                style={{ margin: '0 auto' }}
                            >
                                Crear mi primera Matriz
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'reports') {
        return (
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <ArrowLeft />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', flex: 1 }}>Historial de Informes</h1>
                    <button
                        onClick={() => navigate('/reports')}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
                    >
                        <Plus size={18} /> Nuevo
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reportsData.length > 0 ? (
                        reportsData.map(item => (
                            <div
                                key={item.id}
                                className="card"
                                style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                                onClick={() => {
                                    localStorage.setItem('current_report', JSON.stringify(item));
                                    navigate('/reports-report');
                                }}
                            >
                                <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '0.8rem', borderRadius: '12px', color: '#ec4899' }}>
                                    <FileText size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 0.3rem 0', fontWeight: 700 }}>{item.title}</h4>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Calendar size={14} /> {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                        <span>{item.company}</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} color="var(--color-text-muted)" />
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <FileText size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <p style={{ marginBottom: '1.5rem' }}>No hay informes registrados</p>
                            <button
                                onClick={() => navigate('/reports')}
                                className="btn-primary"
                                style={{ margin: '0 auto' }}
                            >
                                Crear mi primer Informe
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Inspections List View
    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Historial de Inspecciones</h1>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por obra..."
                    style={{ paddingLeft: '2.8rem' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {historicalData.length > 0 ? (
                    historicalData.map(item => (
                        <div
                            key={item.id}
                            className="card"
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                            onClick={() => {
                                localStorage.setItem('current_inspection', JSON.stringify(item));
                                navigate('/report');
                            }}
                        >
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.8rem', borderRadius: '12px', color: 'var(--color-primary)' }}>
                                <FileText />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 0.3rem 0', fontWeight: 700 }}>{item.name || 'Sin nombre'}</h4>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
                                    </span>
                                    <span>{item.type}</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>{item.result || '--'}</div>
                                <ChevronRight size={18} color="var(--color-text-muted)" />
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <FileText size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p>No hay inspecciones registradas</p>
                    </div>
                )}
            </div>
        </div>
    );
}
