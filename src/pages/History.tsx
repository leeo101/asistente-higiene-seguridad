import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, Search, Calendar, ChevronRight,
ClipboardList, Flame, BarChart3, ShieldAlert, Plus, Sparkles, Trash2, Camera, Lightbulb, HardHat, Share2,
ClipboardCheck, CheckCircle2, ScrollText, ShieldCheck, KeySquare, Bot, TriangleAlert, FileText, Shield, ThermometerSun, Siren, Map, BookOpen,
FlaskConical, Volume2, Lock, Tent, Droplets, MessageSquare, Download, CarFront, Weight, Timer, Building2 } from
'lucide-react';
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
      iconEmoji="🗑️" />);


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
      return parsed.filter((item) => item && typeof item === 'object');
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
      extinguisherAi: safeGetList('extinguisher_ai_history').length
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
    const updated = current.filter((item) => String(item.id) !== String(id));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    syncCollection(storageKey, updated);
    setDeleteTarget(null);

    // Update the unified lists state
    setLists((prev) => {
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
  const DeleteBtn = ({ storageKey, id }) =>
  <button
    onClick={(e) => askDelete(e, storageKey, id)}
    title="Eliminar"





    onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
    onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'} className="bg-[#fee2e2] border-none rounded-[10px] text-[#dc2626] cursor-pointer p-[0.5rem_0.6rem] flex items-center flex-shrink-[0]">
    
            <Trash2 size={16} />
        </button>;




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
          fileName={`Matriz_${shareItem?.data?.name || 'Riesgo'}.pdf`} />
        

                <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                    {shareItem?.type === 'matrix' && <RiskMatrixPdfGenerator data={shareItem.data} />}
                </div>

                <div className="flex items-center justify-space-between gap-[1rem] mb-[2rem] flex-wrap">
                    <div className="flex items-center gap-[0.8rem] min-width-[200px]">
                        <></>
                        <h1 className="m-[0] text-[clamp(1.1rem,_4vw,_1.4rem)] font-[800]">Historial de Matrices</h1>
                    </div>
                    <div className="flex gap-[0.8rem] mt-[auto]">
                        <button onClick={() => {
              downloadCSV(matrixData.map((m) => ({
                nombre: m.name, ubicacion: m.location, fecha: new Date(m.createdAt).toLocaleDateString('es-AR'),
                riesgos: m.rows?.length || 0
              })), 'historial_matrices', {
                nombre: 'Nombre/Obra', ubicacion: 'Ubicación', fecha: 'Fecha Creación', riesgos: 'Cant. Riesgos'
              });
            }} className="flex items-center gap-[0.4rem] bg-[#36B37E] border-none rounded-[10px] p-[0.6rem_1rem] text-[0.8rem] font-[800] cursor-pointer text-[#ffffff]">
                            <Download size={14} /> EXCEL
                        </button>
                        <button onClick={() => navigate('/risk-matrix')} className="btn-primary flex items-center gap-[0.5rem] p-[0.6rem_1.2rem] w-[auto] mt-[0]">
                            <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
                        </button>
                    </div>
                </div>

                <div className="p-[0_0_2rem_0]">
                    <DataTable
            data={matrixData}
            searchPlaceholder="Buscar por nombre o ubicación..."
            searchFields={['name', 'location']}
            emptyMessage="No hay matrices registradas."
            emptyIcon={<ShieldAlert size={48} />}
            columns={[
            {
              header: 'Fecha',
              accessor: 'createdAt',
              sortable: true,
              render: (item: any) =>
              <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)]">
                                        <Calendar size={14} /> 
                                        {new Date(item.createdAt).toLocaleDateString('es-AR')}
                                    </span>

            },
            {
              header: 'Nombre',
              accessor: 'name',
              sortable: true,
              render: (item: any) =>
              <div className="flex items-center gap-[0.8rem]">
                                        <div className="bg-[rgba(139,92,246,0.1)] p-[0.5rem] rounded-[8px] text-[#8b5cf6]">
                                            <ShieldAlert size={16} />
                                        </div>
                                        <div className="font-[700]">{item.name}</div>
                                    </div>

            },
            {
              header: 'Ubicación',
              accessor: 'location',
              sortable: true
            },
            {
              header: 'Riesgos',
              accessor: 'rows',
              render: (item: any) =>
              <span className="p-[0.2rem_0.6rem] bg-[var(--color-background)] rounded-[var(--radius-full)] text-[0.75rem] font-[800]">





                
                                        {item.rows?.length || 0}
                                    </span>

            },
            {
              header: 'Acciones',
              accessor: 'id',
              render: (item: any) =>
              <div className="flex gap-[0.5rem]">
                                        <button
                  onClick={() => {localStorage.setItem('current_risk_matrix', JSON.stringify(item));navigate('/risk-matrix-report');}}



                  title="Ver PDF" className="p-[0.4rem_0.6rem] bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border-[1px_solid_rgba(59,130,246,0.2)] rounded-[8px] cursor-pointer flex items-center gap-[4px]">
                  
                                            <FileText size={16} /> <span className="text-[0.75rem] font-[700]">PDF</span>
                                        </button>
                                        <button
                  onClick={() => setShareItem({ type: 'matrix', data: item })}

                  title="Compartir" className="p-[0.4rem_0.6rem] bg-[rgba(22,163,74,0.1)] text-[#16a34a] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] cursor-pointer">
                  
                                            <Share2 size={16} />
                                        </button>
                                        <DeleteBtn storageKey="risk_matrix_history" id={item.id} />
                                    </div>

            }]
            } />
          
                </div>
            </div>);

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
        fileName={`Inspeccion_${shareItem?.data?.name || 'Seguridad'}.pdf`} />
      

            <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                {shareItem?.type === 'inspection' && <ReportPdfGenerator initialData={shareItem.data} />}
            </div>

            <div className="flex items-center gap-[0.8rem] mb-[2rem] flex-wrap">
                <></>
                <div className="flex gap-[0.8rem] mt-[auto]">
                    <button onClick={() => {
            downloadCSV(historicalData.map((h) => ({
              obra: h.name, fecha: new Date(h.date).toLocaleDateString('es-AR'), tipo: h.type, resultado: h.result
            })), 'historial_inspecciones', {
              obra: 'Obra/Lugar', fecha: 'Fecha', tipo: 'Tipo de Inspección', resultado: 'Resultado'
            });
          }} className="flex items-center gap-[0.4rem] bg-[#36B37E] border-none rounded-[10px] p-[0.6rem_1rem] text-[0.8rem] font-[800] cursor-pointer text-[#ffffff]">
                        <Download size={14} /> EXCEL
                    </button>
                </div>
            </div>

            <div className="p-[0_0_2rem_0]">
                <DataTable
          data={historicalData}
          searchPlaceholder="Buscar por obra o tipo..."
          searchFields={['name', 'type']}
          emptyMessage="No hay inspecciones registradas."
          emptyIcon={<FileText size={48} />}
          columns={[
          {
            header: 'Fecha',
            accessor: 'date',
            sortable: true,
            render: (item: any) =>
            <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)]">
                                    <Calendar size={14} /> 
                                    {new Date(item.date).toLocaleDateString('es-AR')}
                                </span>

          },
          {
            header: 'Obra / Lugar',
            accessor: 'name',
            sortable: true,
            render: (item: any) =>
            <div className="flex items-center gap-[0.8rem]">
                                    <div className="bg-[rgba(59,130,246,0.1)] p-[0.5rem] rounded-[8px] text-[#3b82f6]">
                                        <FileText size={16} />
                                    </div>
                                    <div className="font-[700]">{item.name || 'Sin nombre'}</div>
                                </div>

          },
          {
            header: 'Tipo',
            accessor: 'type',
            sortable: true
          },
          {
            header: 'Resultado',
            accessor: 'result',
            render: (item) =>
            <span className="p-[0.2rem_0.6rem] bg-[var(--color-background)] rounded-[var(--radius-full)] text-[0.75rem] font-[800] text-[var(--color-primary)]">






              
                                    {item.result || '--'}
                                </span>

          },
          {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) =>
            <div className="flex gap-[0.5rem]">
                                    <button
                onClick={() => {localStorage.setItem('current_inspection', JSON.stringify(item));navigate('/report');}}



                title="Ver PDF" className="p-[0.4rem_0.6rem] bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border-[1px_solid_rgba(59,130,246,0.2)] rounded-[8px] cursor-pointer flex items-center gap-[4px]">
                
                                        <FileText size={16} /> <span className="text-[0.75rem] font-[700]">PDF</span>
                                    </button>
                                    <button
                onClick={() => {localStorage.setItem('current_inspection', JSON.stringify(item));navigate('/checklist', { state: { editData: item } });}}

                title="Editar" className="p-[0.4rem_0.6rem] bg-[var(--color-surface)] text-[var(--color-text)] border-[1px_solid_var(--color-border)] rounded-[8px] cursor-pointer">
                
                                        Editar
                                    </button>
                                    <button
                onClick={() => setShareItem({ type: 'inspection', data: item })}

                title="Compartir" className="p-[0.4rem_0.6rem] bg-[rgba(22,163,74,0.1)] text-[#16a34a] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] cursor-pointer">
                
                                        <Share2 size={16} />
                                    </button>
                                    <DeleteBtn storageKey="inspections_history" id={item.id} />
                                </div>

          }]
          } />
        
            </div>
        </div>);

}