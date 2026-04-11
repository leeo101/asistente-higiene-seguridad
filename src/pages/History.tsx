import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, Search, Calendar, ChevronRight,
    ClipboardList, Flame, BarChart3, ShieldAlert, Plus, Sparkles, Trash2, Camera, Lightbulb, HardHat, ShareNetwork as Share2,
    ClipboardCheck, CheckCircle2, ScrollText, ShieldCheck, KeySquare, Bot, TriangleAlert, FileText, Shield, ThermometerSun, Siren, Map, BookOpen,
    FlaskConical, Volume2, Lock, Tent, Droplets, MessageSquare, Download
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSync } from '../contexts/SyncContext';
import { HistoryCardSkeleton } from '../components/SkeletonLoader';
import { DataTable } from '../components/DataTable';
import ShareModal from '../components/ShareModal';
import RiskMatrixPdfGenerator from '../components/RiskMatrixPdfGenerator';
import ProfessionalReportPdfGenerator from '../components/ProfessionalReportPdfGenerator';
import ReportPdfGenerator from '../components/ReportPdfGenerator';
import { downloadCSV } from '../services/exportCsv';

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

export default function History(): React.ReactElement | null {
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

    const [lists, setLists] = useState({
        historicalData: [],
        matrixData: [],
        reportsData: [],
        thermalData: []
    });
    const [deleteTarget, setDeleteTarget] = useState(null); // { storageKey, id, view }
    const [shareItem, setShareItem] = useState(null); // { type, data }
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(timer);
    }, [view]);

    const safeGetList = (key) => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw || raw === 'null' || raw === 'undefined') return [];
            // Basic sanitization: remove items that are null/invalid
            if (typeof raw === 'string' && raw.includes('corrupted-')) {
                console.warn(`[safeGetList] Corrupted data detected for key ${key}, ignoring.`);
                return [];
            }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            // Basic sanitization: remove items that are null/invalid
            return parsed.filter(item => item && typeof item === 'object');
        } catch (err) {
            console.error(`Error in safeGetList for key ${key}:`, err);
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
            accidents: safeGetList('accident_history').length,
            trainings: safeGetList('training_history').length,
            thermal: safeGetList('thermal_history').length,
            drills: safeGetList('drills_history').length,
            riskmaps: safeGetList('risk_map_history').length,
            stopCards: safeGetList('stop_cards_history').length,
            extinguishers: safeGetList('extinguishers_inventory').length,
            chemicalSafety: safeGetList('chemical_safety_db').length,
            noise: safeGetList('noise_assessments_db').length,
            loto: safeGetList('loto_procedures_db').length,
            confinedSpace: safeGetList('confined_space_permits').length,
            workHeight: safeGetList('working_at_height_permits').length,
            audits: safeGetList('ehs_audits_db').length,
            capa: safeGetList('ehs_capa_db').length,
            environmental: safeGetList('environmental_measurements_db').length,
            safetyKPIs: safeGetList('ehs_kpi_data').length,
            toolboxTalks: safeGetList('ehs_toolbox_talks').length,
        });
    };

    useEffect(() => {
        try {
            const hData = safeGetList('inspections_history');
            const mData = safeGetList('risk_matrix_history');
            const rData = safeGetList('reports_history');
            const tData = safeGetList('thermal_history');
            
            setLists({
                historicalData: hData,
                matrixData: mData,
                reportsData: rData,
                thermalData: tData
            });
            refreshCounts();
        } catch (err) {
            console.error("History.jsx: Error in sync Effect:", err);
        }
    }, [syncPulse]);

    const historicalData = lists.historicalData || [];
    const matrixData = lists.matrixData || [];
    const reportsData = lists.reportsData || [];
    const thermalData = lists.thermalData || [];

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
        
        // Update the unified lists state
        setLists(prev => {
            const next = { ...prev };
            if (storageKey === 'inspections_history') next.historicalData = updated;
            if (storageKey === 'risk_matrix_history') next.matrixData = updated;
            if (storageKey === 'reports_history') next.reportsData = updated;
            if (storageKey === 'thermal_history') next.thermalData = updated;
            return next;
        });
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
        { title: 'ATS — Análisis Trabajo Seguro', icon: <ShieldCheck size={24} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)', path: '/ats-history', countKey: 'ats' },
        { title: 'Cámara IA — Inspección Visual', icon: <Camera size={24} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', path: '/ai-camera-history', countKey: 'aiCamera' },
        { title: 'Capacitaciones Dictadas', icon: <BookOpen size={24} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', path: '/training-history', countKey: 'trainings' },
        { title: 'Carga de Fuego', icon: <Flame size={24} />, color: '#f97316', bg: 'rgba(249,115,22,0.1)', path: '/fire-load-history', countKey: 'fireload' },
        { title: 'Checklist Herramientas', icon: <ClipboardList size={24} />, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', path: '/checklists-history', countKey: 'checklists' },
        { title: 'Consultas Asesor IA', icon: <Bot size={24} />, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', path: '/ai-history', countKey: 'ai' },
        { title: 'Control de EPP', icon: <HardHat size={24} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)', path: '/ppe-tracker', countKey: 'ppeTracker' },
        { title: 'Control de Extintores', icon: <Flame size={24} />, color: '#f97316', bg: 'rgba(249,115,22,0.1)', path: '/extinguishers-history', countKey: 'extinguishers' },
        { title: 'Estrés Térmico', icon: <ThermometerSun size={24} />, color: '#f97316', bg: 'rgba(249,115,22,0.1)', path: '/thermal-stress-history', countKey: 'thermal', view: 'thermal' },
        { title: 'Evaluaciones de Riesgo', icon: <Shield size={24} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', path: '/risk-assessment-history', countKey: 'riskAssessments' },
        { title: 'Iluminación', icon: <Lightbulb size={24} />, color: '#eab308', bg: 'rgba(234,179,8,0.1)', path: '/lighting-history', countKey: 'lighting' },
        { title: 'Informes Profesionales', icon: <ScrollText size={24} />, color: '#ec4899', bg: 'rgba(236,72,153,0.1)', path: '/reports-history', countKey: 'reports', view: 'reports' },
        { title: 'Inspecciones', icon: <ClipboardCheck size={24} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', path: '/history', countKey: 'inspections', view: 'inspections' },
        { title: 'Investigación de Accidentes', icon: <TriangleAlert size={24} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', path: '/accident-history', countKey: 'accidents' },
        { title: 'Mapas de Riesgo', icon: <Map size={24} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', path: '/risk-maps-history', countKey: 'riskmaps' },
        { title: 'Matrices de Riesgo', icon: <TriangleAlert size={24} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', path: '/risk-matrix-history', countKey: 'matrices', view: 'matrices' },
        { title: 'Permisos de Trabajo', icon: <KeySquare size={24} />, color: '#2563eb', bg: 'rgba(37,99,235,0.1)', path: '/work-permit-history', countKey: 'workPermits' },
        { title: 'Simulacros', icon: <Siren size={24} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', path: '/drills-history', countKey: 'drills' },
        { title: 'Tarjetas STOP', icon: <TriangleAlert size={24} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', path: '/stop-cards-history', countKey: 'stopCards' },
        { title: 'Auditorías de Seguridad', icon: <ClipboardCheck size={24} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', path: '/audit-history', countKey: 'audits' },
        { title: 'Gestión CAPA', icon: <CheckCircle2 size={24} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)', path: '/capa-history', countKey: 'capa' },
        { title: 'LOTO - Bloqueo/Etiquetado', icon: <Lock size={24} />, color: '#dc2626', bg: 'rgba(220,38,38,0.1)', path: '/loto-history', countKey: 'loto' },
        { title: 'Mediciones de Ruido', icon: <Volume2 size={24} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', path: '/noise-assessment-history', countKey: 'noise' },
        { title: 'Monitoreo Ambiental', icon: <Droplets size={24} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', path: '/environmental-history', countKey: 'environmental' },
        { title: 'Permisos de Espacios Confinados', icon: <Tent size={24} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', path: '/confined-space-history', countKey: 'confinedSpace' },
        { title: 'Permisos Trabajo en Altura', icon: <HardHat size={24} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', path: '/working-at-height-history', countKey: 'workHeight' },
        { title: 'Seguridad Química (SGA)', icon: <FlaskConical size={24} />, color: '#ec4899', bg: 'rgba(236,72,153,0.1)', path: '/chemical-safety-history', countKey: 'chemicalSafety' },
        { title: 'KPIs de Seguridad', icon: <BarChart3 size={24} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', path: '/safety-kpis', countKey: 'safetyKPIs' },
        { title: 'Charlas de 5 Minutos', icon: <MessageSquare size={24} />, color: '#0052CC', bg: 'rgba(0,82,204,0.1)', path: '/toolbox-talk', countKey: 'toolboxTalks' },
    ];

    // ─── HUB ──────────────────────────────────────────────────────
    if (view === 'hub') {
        return (
            <div className="container page-transition" style={{ paddingBottom: '3rem' }}>
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <ArrowLeft />
                        </button>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Historiales</h1>
                    </div>
                    <button
                        onClick={async () => {
                            const { exportAllDataToExcel } = await import('../services/exportCsv');
                            exportAllDataToExcel();
                        }}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.2rem', width: 'auto', margin: 0 }}
                    >
                        <FileText size={18} /> Exportar Toda mi Gestión
                    </button>
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
            <div className="container page-transition">
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                
                <ShareModal
                    isOpen={!!shareItem}
                    open={!!shareItem}
                    onClose={() => setShareItem(null)}
                    title={`Matriz de Riesgos - ${shareItem?.data?.name || ''}`}
                    text={shareItem ? `🚫 Matriz de Riesgo\n🏗️ ${shareItem.data.name}\n📍 ${shareItem.data.location}\n📅 ${new Date(shareItem.data.createdAt).toLocaleDateString('es-AR')}` : ''}
                    rawMessage={shareItem ? `🚫 Matriz de Riesgo\n🏗️ ${shareItem.data.name}\n📍 ${shareItem.data.location}\n📅 ${new Date(shareItem.data.createdAt).toLocaleDateString('es-AR')}` : ''}
                    elementIdToPrint="pdf-content"
                    fileName={`Matriz_${shareItem?.data?.name || 'Riesgo'}.pdf`}
                />

                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    {shareItem?.type === 'matrix' && <RiskMatrixPdfGenerator data={shareItem.data} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                        <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            <ArrowLeft />
                        </button>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800 }}>Historial de Matrices</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: 'auto' }}>
                        <button onClick={() => {
                            downloadCSV(matrixData.map(m => ({
                                nombre: m.name, ubicacion: m.location, fecha: new Date(m.createdAt).toLocaleDateString('es-AR'),
                                riesgos: m.rows?.length || 0
                            })), 'historial_matrices', {
                                nombre: 'Nombre/Obra', ubicacion: 'Ubicación', fecha: 'Fecha Creación', riesgos: 'Cant. Riesgos'
                            });
                        }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff' }}>
                            <Download size={14} /> EXCEL
                        </button>
                        <button onClick={() => navigate('/risk-matrix')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', width: 'auto', marginTop: 0 }}>
                            <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
                        </button>
                    </div>
                </div>

                <div style={{ padding: '0 0 2rem 0' }}>
                    <DataTable 
                        data={matrixData}
                        searchPlaceholder="Buscar por nombre o ubicación..."
                        searchFields={['name', 'location']}
                        emptyMessage="No hay matrices registradas."
                        emptyIcon={<ShieldAlert size={48} />}
                        onEmptyAction={() => navigate('/risk-matrix')}
                        emptyActionLabel="Crear mi primera Matriz"
                        columns={[
                            {
                                header: 'Fecha',
                                accessor: 'createdAt',
                                sortable: true,
                                render: (item: any) => (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                        <Calendar size={14} /> 
                                        {new Date(item.createdAt).toLocaleDateString('es-AR')}
                                    </span>
                                )
                            },
                            {
                                header: 'Nombre',
                                accessor: 'name',
                                sortable: true,
                                render: (item: any) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <div style={{ background: 'rgba(139,92,246,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#8b5cf6' }}>
                                            <ShieldAlert size={16} />
                                        </div>
                                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                                    </div>
                                )
                            },
                            {
                                header: 'Ubicación',
                                accessor: 'location',
                                sortable: true
                            },
                            {
                                header: 'Riesgos',
                                accessor: 'rows',
                                render: (item: any) => (
                                    <span style={{ 
                                        padding: '0.2rem 0.6rem', 
                                        background: 'var(--color-background)', 
                                        borderRadius: 'var(--radius-full)', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 800 
                                    }}>
                                        {item.rows?.length || 0}
                                    </span>
                                )
                            },
                            {
                                header: 'Acciones',
                                accessor: 'id',
                                render: (item: any) => (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => { localStorage.setItem('current_risk_matrix', JSON.stringify(item)); navigate('/risk-matrix-report'); }}
                                            style={{
                                                padding: '0.4rem 0.6rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                            title="Ver PDF"
                                        >
                                            <FileText size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>PDF</span>
                                        </button>
                                        <button
                                            onClick={() => setShareItem({ type: 'matrix', data: item })}
                                            style={{ padding: '0.4rem 0.6rem', background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', cursor: 'pointer' }}
                                            title="Compartir"
                                        >
                                            <ShareNetwork as Share2 size={16} />
                                        </button>
                                        <DeleteBtn storageKey="risk_matrix_history" id={item.id} />
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            </div>
        );
    }

    // ─── REPORTS ───────────────────────────────────────────────────
    if (view === 'reports') {
        return (
            <div className="container">
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                
                <ShareModal
                    isOpen={!!shareItem}
                    open={!!shareItem}
                    onClose={() => setShareItem(null)}
                    title={`Informe - ${shareItem?.data?.title || ''}`}
                    text={shareItem ? `📄 Informe Profesional\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}\n📅 ${new Date(shareItem.data.createdAt).toLocaleDateString('es-AR')}` : ''}
                    rawMessage={shareItem ? `📄 Informe Profesional\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}\n📅 ${new Date(shareItem.data.createdAt).toLocaleDateString('es-AR')}` : ''}
                    elementIdToPrint="pdf-content"
                    fileName={`Informe_${shareItem?.data?.title || 'Profesional'}.pdf`}
                />

                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    {shareItem?.type === 'report' && <ProfessionalReportPdfGenerator currentReport={shareItem.data} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                        <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            <ArrowLeft />
                        </button>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800 }}>Historial de Informes</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: 'auto' }}>
                        <button onClick={() => {
                            downloadCSV(reportsData.map(r => ({
                                titulo: r.title, empresa: r.company, fecha: new Date(r.createdAt).toLocaleDateString('es-AR'),
                                autor: r.author || ''
                            })), 'historial_informes', {
                                titulo: 'Título del Informe', empresa: 'Empresa', fecha: 'Fecha', autor: 'Autor'
                            });
                        }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff' }}>
                            <Download size={14} /> EXCEL
                        </button>
                        <button onClick={() => navigate('/reports')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', width: 'auto', marginTop: 0 }}>
                            <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
                        </button>
                    </div>
                </div>

                <div style={{ padding: '0 0 2rem 0' }}>
                    <DataTable 
                        data={reportsData}
                        searchPlaceholder="Buscar por título o empresa..."
                        searchFields={['title', 'company', 'author']}
                        emptyMessage="No hay informes registrados."
                        emptyIcon={<FileText size={48} />}
                        onEmptyAction={() => navigate('/reports')}
                        emptyActionLabel="Crear mi primer Informe"
                        columns={[
                            {
                                header: 'Fecha',
                                accessor: 'createdAt',
                                sortable: true,
                                render: (item: any) => (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                        <Calendar size={14} /> 
                                        {new Date(item.createdAt).toLocaleDateString('es-AR')}
                                    </span>
                                )
                            },
                            {
                                header: 'Título',
                                accessor: 'title',
                                sortable: true,
                                render: (item: any) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <div style={{ background: 'rgba(236,72,153,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#ec4899' }}>
                                            <FileText size={16} />
                                        </div>
                                        <div style={{ fontWeight: 700 }}>{item.title}</div>
                                    </div>
                                )
                            },
                            {
                                header: 'Empresa',
                                accessor: 'company',
                                sortable: true
                            },
                            {
                                header: 'Autor',
                                accessor: 'author',
                                render: (item) => <span style={{ color: 'var(--color-text-muted)' }}>{item.author || '--'}</span>
                            },
                            {
                                header: 'Acciones',
                                accessor: 'id',
                                render: (item: any) => (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => { localStorage.setItem('current_report', JSON.stringify(item)); navigate('/reports-report'); }}
                                            style={{
                                                padding: '0.4rem 0.6rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                            title="Ver PDF"
                                        >
                                            <FileText size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>PDF</span>
                                        </button>
                                        <button
                                            onClick={() => navigate('/reports', { state: { editData: item } })}
                                            style={{ padding: '0.4rem 0.6rem', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}
                                            title="Editar"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => setShareItem({ type: 'report', data: item })}
                                            style={{ padding: '0.4rem 0.6rem', background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', cursor: 'pointer' }}
                                            title="Compartir"
                                        >
                                            <ShareNetwork as Share2 size={16} />
                                        </button>
                                        <DeleteBtn storageKey="reports_history" id={item.id} />
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            </div>
        );
    }

    // ─── INSPECTIONS ───────────────────────────────────────────────
    return (
        <div className="container page-transition">
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
            
            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Inspección - ${shareItem?.data?.name || ''}`}
                text={shareItem ? `📋 Inspección de Seguridad\n🏗️ ${shareItem.data.name || 'Sin nombre'}\n📅 ${new Date(shareItem.data.date).toLocaleDateString('es-AR')}\n🔎 Tipo: ${shareItem.data.type || '—'}\n📊 Resultado: ${shareItem.data.result || '—'}` : ''}
                rawMessage={shareItem ? `📋 Inspección de Seguridad\n🏗️ ${shareItem.data.name || 'Sin nombre'}\n📅 ${new Date(shareItem.data.date).toLocaleDateString('es-AR')}\n🔎 Tipo: ${shareItem.data.type || '—'}\n📊 Resultado: ${shareItem.data.result || '—'}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Inspeccion_${shareItem?.data?.name || 'Seguridad'}.pdf`}
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                {shareItem?.type === 'inspection' && <ReportPdfGenerator initialData={shareItem.data} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button onClick={() => setView('hub')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    <ArrowLeft />
                </button>
                <div style={{ display: 'flex', gap: '0.8rem', marginTop: 'auto' }}>
                    <button onClick={() => {
                        downloadCSV(historicalData.map(h => ({
                            obra: h.name, fecha: new Date(h.date).toLocaleDateString('es-AR'), tipo: h.type, resultado: h.result
                        })), 'historial_inspecciones', {
                            obra: 'Obra/Lugar', fecha: 'Fecha', tipo: 'Tipo de Inspección', resultado: 'Resultado'
                        });
                    }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff' }}>
                        <Download size={14} /> EXCEL
                    </button>
                </div>
            </div>

            <div style={{ padding: '0 0 2rem 0' }}>
                <DataTable 
                    data={historicalData}
                    searchPlaceholder="Buscar por obra o tipo..."
                    searchFields={['name', 'type']}
                    emptyMessage="No hay inspecciones registradas."
                    emptyIcon={<FileText size={48} />}
                    onEmptyAction={() => navigate('/create-inspection')}
                    emptyActionLabel="Crear mi primera Inspección"
                    columns={[
                        {
                            header: 'Fecha',
                            accessor: 'date',
                            sortable: true,
                            render: (item: any) => (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                    <Calendar size={14} /> 
                                    {new Date(item.date).toLocaleDateString('es-AR')}
                                </span>
                            )
                        },
                        {
                            header: 'Obra / Lugar',
                            accessor: 'name',
                            sortable: true,
                            render: (item: any) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#3b82f6' }}>
                                        <FileText size={16} />
                                    </div>
                                    <div style={{ fontWeight: 700 }}>{item.name || 'Sin nombre'}</div>
                                </div>
                            )
                        },
                        {
                            header: 'Tipo',
                            accessor: 'type',
                            sortable: true
                        },
                        {
                            header: 'Resultado',
                            accessor: 'result',
                            render: (item) => (
                                <span style={{ 
                                    padding: '0.2rem 0.6rem', 
                                    background: 'var(--color-background)', 
                                    borderRadius: 'var(--radius-full)', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 800,
                                    color: 'var(--color-primary)'
                                }}>
                                    {item.result || '--'}
                                </span>
                            )
                        },
                        {
                            header: 'Acciones',
                            accessor: 'id',
                            render: (item: any) => (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => { localStorage.setItem('current_inspection', JSON.stringify(item)); navigate('/report'); }}
                                        style={{
                                            padding: '0.4rem 0.6rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                        title="Ver PDF"
                                    >
                                        <FileText size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>PDF</span>
                                    </button>
                                    <button
                                        onClick={() => { localStorage.setItem('current_inspection', JSON.stringify(item)); navigate('/checklist', { state: { editData: item } }); }}
                                        style={{ padding: '0.4rem 0.6rem', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}
                                        title="Editar"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => setShareItem({ type: 'inspection', data: item })}
                                        style={{ padding: '0.4rem 0.6rem', background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', cursor: 'pointer' }}
                                        title="Compartir"
                                    >
                                        <ShareNetwork as Share2 size={16} />
                                    </button>
                                    <DeleteBtn storageKey="inspections_history" id={item.id} />
                                </div>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    );
}
