import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, Search, Calendar, ChevronRight,
    ClipboardList, Flame, BarChart3, ShieldAlert, Plus, Sparkles, Trash2, Camera, Lightbulb, HardHat, Share2,
    ClipboardCheck, CheckCircle2, ScrollText, ShieldCheck, KeySquare, Bot, TriangleAlert, FileText, Shield, ThermometerSun, Siren, Map, BookOpen,
    FlaskConical, Volume2, Lock, Tent, Droplets, MessageSquare, Download, CarFront, Weight, Timer, Building2
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
function DeleteConfirm({ onConfirm, onCancel }: any) {
    return (
        <ConfirmModal
            isOpen={true}
            onClose={onCancel}
            onConfirm={onConfirm}
            title="¿Eliminar registro?"
            message="Esta acción no se puede deshacer."
            iconEmoji="🗑️"
        />
    );
}

export default function History(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { syncCollection, syncPulse } = useSync();
    const [view, setView] = useState(location.state?.view || 'inspections');
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

            ai: safeGetList('ai_advisor_history').length,

            lighting: safeGetList('lighting_history').length,
            workPermits: safeGetList('work_permits_history').length,
            ppeTracker: safeGetList('ppe_items').length,
            riskAssessments: safeGetList('risk_assessment_history').length,
            accidents: safeGetList('accident_history').length,
            legajos: safeGetList('legajos_history').length,
            trainings: safeGetList('training_history').length,
            thermal: safeGetList('thermal_history').length,
            drills: safeGetList('drills_history').length,
            riskmaps: safeGetList('risk_map_history').length,
            stopCards: safeGetList('stop_cards_history').length,
            extinguishers: safeGetList('extinguishers_inventory').length,
            chemicalSafety: safeGetList('chemical_safety_db').length,
            noise: safeGetList('noise_assessments_db').length,
            loto: safeGetList('loto_procedures_db').length,
            confinedSpace: safeGetList('confined_space_permits_db').length,
            workHeight: safeGetList('working_height_permits_db').length,
            audits: safeGetList('ehs_audits_db').length,
            capa: safeGetList('ehs_capa_db').length,
            environmental: safeGetList('environmental_measurements_db').length,
            safetyKPIs: safeGetList('ehs_kpi_data').length,
            toolboxTalks: safeGetList('ehs_toolbox_talks').length,
            fleetInspections: safeGetList('fleet_inspections_db').length,
            liftingPlans: safeGetList('lifting_plans_db').length,
            evacuationSimulator: safeGetList('evacuation_simulator_db').length,
            extinguisherAi: safeGetList('extinguisher_ai_history').length,
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

                <div style={{ position: 'absolute', left: 0, opacity: 0.01, top: '-9999px', pointerEvents: 'none' }}>
                    {shareItem?.type === 'matrix' && <RiskMatrixPdfGenerator data={shareItem.data} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '200px' }}>
                        <></>
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
                                            <Share2 size={16} />
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

            <div style={{ position: 'absolute', left: 0, opacity: 0.01, top: '-9999px', pointerEvents: 'none' }}>
                {shareItem?.type === 'inspection' && <ReportPdfGenerator initialData={shareItem.data} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <></>
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
                                        <Share2 size={16} />
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
