import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Search, FileText, Calendar, ChevronRight,
    ClipboardList, Flame, BarChart3, ShieldAlert, Plus, Sparkles, Trash2, Camera
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';

// ─── Reusable delete confirmation dialog ───────────────────────────
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
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: '#0f172a' }}>¿Eliminar registro?</h3>
                <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                    Esta acción no se puede deshacer.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{
                        flex: 1, padding: '0.8rem', borderRadius: '12px',
                        background: '#f1f5f9', border: 'none', cursor: 'pointer',
                        fontWeight: 800, fontSize: '0.85rem', color: '#475569'
                    }}>Cancelar</button>
                    <button onClick={onConfirm} style={{
                        flex: 1, padding: '0.8rem', borderRadius: '12px',
                        background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                        border: 'none', cursor: 'pointer',
                        fontWeight: 800, fontSize: '0.85rem', color: 'white'
                    }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function History() {
    const navigate = useNavigate();
    const location = useLocation();
    const { syncCollection, syncPulse } = useSync();
    const [view, setView] = useState(location.state?.view || 'hub');

    useEffect(() => {
        if (location.state?.view) {
            setView(location.state.view);
        }
    }, [location.state?.view]);

    const [historicalData, setHistoricalData] = useState([]);
    const [matrixData, setMatrixData] = useState([]);
    const [reportsData, setReportsData] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null); // { storageKey, id, view }
    const [counts, setCounts] = useState({});

    const refreshCounts = () => {
        setCounts({
            inspections: JSON.parse(localStorage.getItem('inspections_history') || '[]').length,
            ats: JSON.parse(localStorage.getItem('ats_history') || '[]').length,
            fireload: JSON.parse(localStorage.getItem('fireload_history') || '[]').length,
            matrices: JSON.parse(localStorage.getItem('risk_matrix_history') || '[]').length,
            reports: JSON.parse(localStorage.getItem('reports_history') || '[]').length,
            checklists: JSON.parse(localStorage.getItem('tool_checklists_history') || '[]').length,
            ai: JSON.parse(localStorage.getItem('ai_advisor_history') || '[]').length,
            aiCamera: JSON.parse(localStorage.getItem('ai_camera_history') || '[]').length,
        });
    };

    useEffect(() => { refreshCounts(); }, [syncPulse]);

    useEffect(() => {
        if (view === 'inspections') {
            const raw = localStorage.getItem('inspections_history');
            setHistoricalData(raw ? JSON.parse(raw) : []);
        } else if (view === 'matrices') {
            const raw = localStorage.getItem('risk_matrix_history');
            setMatrixData(raw ? JSON.parse(raw) : []);
        } else if (view === 'reports') {
            const raw = localStorage.getItem('reports_history');
            setReportsData(raw ? JSON.parse(raw) : []);
        }
    }, [view, syncPulse]);

    // ─── Delete helpers ───────────────────────────────────────────
    const askDelete = (e, storageKey, id) => {
        e.stopPropagation();
        setDeleteTarget({ storageKey, id });
    };

    const confirmDelete = () => {
        const { storageKey, id } = deleteTarget;
        const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updated = current.filter(item => String(item.id) !== String(id));
        localStorage.setItem(storageKey, JSON.stringify(updated));
        syncCollection(storageKey, updated);
        setDeleteTarget(null);
        // refresh the right list
        if (storageKey === 'inspections_history') setHistoricalData(updated);
        if (storageKey === 'risk_matrix_history') setMatrixData(updated);
        if (storageKey === 'reports_history') setReportsData(updated);
        refreshCounts();
    };

    // ─── Shared delete button ─────────────────────────────────────
    const DeleteBtn = ({ storageKey, id }) => (
        <button
            onClick={e => askDelete(e, storageKey, id)}
            title="Eliminar"
            style={{
                background: '#fee2e2', border: 'none', borderRadius: '10px',
                color: '#dc2626', cursor: 'pointer', padding: '0.5rem 0.6rem',
                display: 'flex', alignItems: 'center', flexShrink: 0
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
            onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
        >
            <Trash2 size={16} />
        </button>
    );

    const historyCategories = [
        { title: 'Inspecciones', icon: <FileText />, color: '#3b82f6', path: '/history-list', countKey: 'inspections', view: 'inspections' },
        { title: 'ATS (Análisis Seguro)', icon: <BarChart3 />, color: '#10b981', path: '/ats-history', countKey: 'ats' },
        { title: 'Carga de Fuego', icon: <Flame />, color: '#f97316', path: '/fire-load-history', countKey: 'fireload' },
        { title: 'Matrices de Riesgo', icon: <ShieldAlert />, color: '#8b5cf6', path: '/history-list-matrix', countKey: 'matrices', view: 'matrices' },
        { title: 'Informes Profesionales', icon: <FileText />, color: '#ec4899', path: '/reports-history', countKey: 'reports', view: 'reports' },
        { title: 'Checklist Herramientas', icon: <ClipboardList />, color: '#3b82f6', path: '/checklists-history', countKey: 'checklists' },
        { title: 'Cámara IA — Inspección Visual', icon: <Camera />, color: '#06b6d4', path: '/ai-camera-history', countKey: 'aiCamera' },
        { title: 'Consultas Asesor IA', icon: <Sparkles />, color: '#8b5cf6', path: '/ai-history', countKey: 'ai' },
    ];

    // ─── HUB ──────────────────────────────────────────────────────
    if (view === 'hub') {
        return (
            <div className="container" style={{ paddingBottom: '3rem' }}>
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
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
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', cursor: 'pointer' }}
                            onClick={() => {
                                if (cat.view) setView(cat.view);
                                else navigate(cat.path);
                            }}
                        >
                            <div style={{ background: `${cat.color}15`, color: cat.color, padding: '1rem', borderRadius: '12px' }}>
                                {React.cloneElement(cat.icon, { size: 24 })}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{cat.title}</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    {counts[cat.countKey] ?? 0} registros guardados
                                </p>
                            </div>
                            <ChevronRight size={18} color="var(--color-text-muted)" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ─── MATRICES ─────────────────────────────────────────────────
    if (view === 'matrices') {
        return (
            <div className="container">
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <ArrowLeft />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', flex: 1 }}>Historial de Matrices</h1>
                    <button onClick={() => navigate('/risk-matrix')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}>
                        <Plus size={18} /> Nuevo
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {matrixData.length > 0 ? matrixData.map(item => (
                        <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(139,92,246,0.1)', padding: '0.8rem', borderRadius: '12px', color: '#8b5cf6' }}>
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
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.8rem' }}>
                                    <button
                                        onClick={() => { localStorage.setItem('current_risk_matrix', JSON.stringify(item)); navigate('/risk-matrix-report'); }}
                                        className="btn-primary"
                                        style={{ flex: 2, padding: '0.5rem', fontSize: '0.85rem' }}
                                    >
                                        <FileText size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} /> Ver PDF
                                    </button>
                                    <button
                                        onClick={() => navigate('/risk-matrix', { state: { editData: item } })}
                                        className="btn-secondary"
                                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                                    >
                                        Editar
                                    </button>
                                    <DeleteBtn storageKey="risk_matrix_history" id={item.id} />
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <ShieldAlert size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <p style={{ marginBottom: '1.5rem' }}>No hay matrices registradas</p>
                            <button onClick={() => navigate('/risk-matrix')} className="btn-primary" style={{ margin: '0 auto' }}>Crear mi primera Matriz</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── REPORTS ───────────────────────────────────────────────────
    if (view === 'reports') {
        return (
            <div className="container">
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <ArrowLeft />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', flex: 1 }}>Historial de Informes</h1>
                    <button onClick={() => navigate('/reports')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}>
                        <Plus size={18} /> Nuevo
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reportsData.length > 0 ? reportsData.map(item => (
                        <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(236,72,153,0.1)', padding: '0.8rem', borderRadius: '12px', color: '#ec4899' }}>
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
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.8rem' }}>
                                    <button
                                        onClick={() => { localStorage.setItem('current_report', JSON.stringify(item)); navigate('/reports-report'); }}
                                        className="btn-primary"
                                        style={{ flex: 2, padding: '0.5rem', fontSize: '0.85rem' }}
                                    >
                                        <FileText size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} /> Ver PDF
                                    </button>
                                    <button
                                        onClick={() => navigate('/reports', { state: { editData: item } })}
                                        className="btn-secondary"
                                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                                    >
                                        Editar
                                    </button>
                                    <DeleteBtn storageKey="reports_history" id={item.id} />
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <FileText size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <p style={{ marginBottom: '1.5rem' }}>No hay informes registrados</p>
                            <button onClick={() => navigate('/reports')} className="btn-primary" style={{ margin: '0 auto' }}>Crear mi primer Informe</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── INSPECTIONS ───────────────────────────────────────────────
    return (
        <div className="container">
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Historial de Inspecciones</h1>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input type="text" placeholder="Buscar por obra..." style={{ paddingLeft: '2.8rem' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {historicalData.length > 0 ? historicalData.map(item => (
                    <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.8rem', borderRadius: '12px', color: 'var(--color-primary)', flexShrink: 0 }}>
                                    <FileText />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ margin: '0 0 0.3rem 0', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name || 'Sin nombre'}</h4>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                                            <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
                                        </span>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.type}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>{item.result || '--'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.8rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.8rem' }}>
                                <button
                                    onClick={() => { localStorage.setItem('current_inspection', JSON.stringify(item)); navigate('/report'); }}
                                    className="btn-primary"
                                    style={{ flex: 2, padding: '0.5rem', fontSize: '0.85rem' }}
                                >
                                    <FileText size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} /> Ver PDF
                                </button>
                                <button
                                    onClick={() => { localStorage.setItem('current_inspection', JSON.stringify(item)); navigate('/checklist', { state: { editData: item } }); }}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                                >
                                    Editar
                                </button>
                                <DeleteBtn storageKey="inspections_history" id={item.id} />
                            </div>
                        </div>
                    </div>
                )) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <FileText size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p>No hay inspecciones registradas</p>
                    </div>
                )}
            </div>
        </div>
    );
}
