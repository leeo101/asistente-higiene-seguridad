import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Search, Calendar, ChevronRight,
    ClipboardList, Flame, BarChart3, ShieldAlert, Plus, Sparkles, Trash2, Camera, Lightbulb, HardHat, Share2,
    ClipboardCheck, ScrollText, ShieldCheck, KeySquare, Bot, TriangleAlert, FileText, Shield
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ─── Reusable delete confirmation dialog ───────────────────────────
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
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--color-text)' }}>¿Eliminar registro?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    Esta acción no se puede deshacer.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{
                        flex: 1, padding: '0.8rem', borderRadius: '12px',
                        background: 'var(--color-background)', border: 'none', cursor: 'pointer',
                        fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)'
                    }}>Cancelar</button>
                    <button onClick={onConfirm} style={{
                        flex: 1, padding: '0.8rem', borderRadius: '12px',
                        background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                        border: 'none', cursor: 'pointer',
                        fontWeight: 800, fontSize: '0.85rem', color: '#ffffff'
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
    useDocumentTitle('Historial');

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

    const safeGetList = (key) => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw || raw === 'null' || raw === 'undefined') return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const refreshCounts = () => {
        setCounts({
            inspections: safeGetList('inspections_history').length,
            ats: safeGetList('ats_history').length,
            fireload: safeGetList('fireload_history').length,
            matrices: safeGetList('risk_matrix_history').length,
            reports: safeGetList('reports_history').length,
            checklists: safeGetList('tool_checklists_history').length,
            ai: safeGetList('ai_advisor_history').length,
            aiCamera: safeGetList('ai_camera_history').length,
            lighting: safeGetList('lighting_history').length,
            workPermits: safeGetList('work_permits_history').length,
            ppeTracker: safeGetList('ppe_items').length,
            riskAssessments: safeGetList('risk_assessment_history').length,
        });
    };

    useEffect(() => { refreshCounts(); }, [syncPulse]);

    useEffect(() => {
        if (view === 'inspections') {
            setHistoricalData(safeGetList('inspections_history'));
        } else if (view === 'matrices') {
            setMatrixData(safeGetList('risk_matrix_history'));
        } else if (view === 'reports') {
            setReportsData(safeGetList('reports_history'));
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
        { title: 'Inspecciones', icon: <ClipboardCheck size={24} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', path: '/history', countKey: 'inspections', view: 'inspections' },
        { title: 'ATS — Análisis Trabajo Seguro', icon: <ShieldCheck size={24} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)', path: '/ats-history', countKey: 'ats' },
        { title: 'Carga de Fuego', icon: <Flame size={24} />, color: '#f97316', bg: 'rgba(249,115,22,0.1)', path: '/fire-load-history', countKey: 'fireload' },
        { title: 'Iluminación', icon: <Lightbulb size={24} />, color: '#eab308', bg: 'rgba(234,179,8,0.1)', path: '/lighting-history', countKey: 'lighting' },
        { title: 'Permisos de Trabajo', icon: <KeySquare size={24} />, color: '#2563eb', bg: 'rgba(37,99,235,0.1)', path: '/work-permit-history', countKey: 'workPermits' },
        { title: 'Matrices de Riesgo', icon: <TriangleAlert size={24} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', path: '/risk-matrix-history', countKey: 'matrices', view: 'matrices' },
        { title: 'Informes Profesionales', icon: <ScrollText size={24} />, color: '#ec4899', bg: 'rgba(236,72,153,0.1)', path: '/reports-history', countKey: 'reports', view: 'reports' },
        { title: 'Checklist Herramientas', icon: <ClipboardList size={24} />, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', path: '/checklists-history', countKey: 'checklists' },
        { title: 'Cámara IA — Inspección Visual', icon: <Camera size={24} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', path: '/ai-camera-history', countKey: 'aiCamera' },
        { title: 'Consultas Asesor IA', icon: <Bot size={24} />, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', path: '/ai-history', countKey: 'ai' },
        { title: 'Control de EPP', icon: <HardHat size={24} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)', path: '/ppe-tracker', countKey: 'ppeTracker' },
        { title: 'Evaluaciones de Riesgo', icon: <Shield size={24} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', path: '/risk-assessment-history', countKey: 'riskAssessments' },
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '0.9rem' }}>
                    {historyCategories.map((cat, i) => (
                        <div
                            key={i}
                            className="card"
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.2rem', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', border: '1.5px solid var(--color-border)' }}
                            onClick={() => {
                                if (cat.view) setView(cat.view);
                                else navigate(cat.path);
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.boxShadow = `0 4px 16px ${cat.color}22`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = ''; }}
                        >
                            <div style={{ background: cat.bg || `${cat.color}15`, color: cat.color, padding: '0.85rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {cat.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.92rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.title}</h3>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: (counts[cat.countKey] ?? 0) > 0 ? cat.color : 'var(--color-text-muted)', background: (counts[cat.countKey] ?? 0) > 0 ? (cat.bg || `${cat.color}15`) : 'transparent', padding: (counts[cat.countKey] ?? 0) > 0 ? '2px 8px' : '0', borderRadius: '20px', display: 'inline-block' }}>
                                    {counts[cat.countKey] ?? 0} registros
                                </span>
                            </div>
                            <ChevronRight size={16} color={cat.color} style={{ opacity: 0.6, flexShrink: 0 }} />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                        <ArrowLeft />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', flex: '1 1 auto', minWidth: '200px' }}>Historial de Matrices</h1>
                    <button onClick={() => navigate('/risk-matrix')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', width: 'auto', marginTop: 0, flexShrink: 0 }}>
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
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`🚫 Matriz de Riesgo\n🏗️ ${item.name}\n📍 ${item.location}\n📅 ${new Date(item.createdAt).toLocaleDateString()}\n\n📱 Generado con *Asistente HYS* — plataforma gratuita de HyS\n🔗 https://asistentehs.com`)}`}
                                        target="_blank" rel="noreferrer"
                                        style={{ padding: '0.5rem 0.7rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                                        title="Compartir por WhatsApp"
                                    >
                                        <Share2 size={16} />
                                    </a>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                        <ArrowLeft />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', flex: '1 1 auto', minWidth: '200px' }}>Historial de Informes</h1>
                    <button onClick={() => navigate('/reports')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', width: 'auto', marginTop: 0, flexShrink: 0 }}>
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
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`📄 Informe Profesional\n🏗️ ${item.title}\n🏢 ${item.company}\n📅 ${new Date(item.createdAt).toLocaleDateString()}\n\n📱 Generado con *Asistente HYS* — plataforma gratuita de HyS\n🔗 https://asistentehs.com`)}`}
                                        target="_blank" rel="noreferrer"
                                        style={{ padding: '0.5rem 0.7rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                                        title="Compartir por WhatsApp"
                                    >
                                        <Share2 size={16} />
                                    </a>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem', flex: '1 1 auto', minWidth: '200px' }}>Historial de Inspecciones</h1>
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
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`📋 Inspección de Seguridad\n🏗️ ${item.name || 'Sin nombre'}\n📅 ${new Date(item.date).toLocaleDateString()}\n🔎 Tipo: ${item.type || '—'}\n📊 Resultado: ${item.result || '—'}\n\n📱 Generado con *Asistente HYS* — plataforma gratuita de HyS\n🔗 https://asistentehs.com`)}`}
                                    target="_blank" rel="noreferrer"
                                    style={{ padding: '0.5rem 0.7rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                                    title="Compartir por WhatsApp"
                                >
                                    <Share2 size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <FileText size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p style={{ marginBottom: '1.5rem' }}>No hay inspecciones registradas</p>
                        <button onClick={() => navigate('/create-inspection')} className="btn-primary" style={{ margin: '0 auto' }}>Crear mi primera Inspección</button>
                    </div>
                )}
            </div>
        </div>
    );
}
