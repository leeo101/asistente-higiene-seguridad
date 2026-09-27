import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, Plus, Search, FileText, Eye, Edit3, Trash2, CheckCircle2,
  AlertTriangle, BarChart3, Share2, Download, Copy, Building2,
  Printer, X, ShieldCheck
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import RGRLPdf from '../components/RGRLPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import AnimatedPage from '../components/AnimatedPage';
import { downloadCSV } from '../services/exportCsv';
import toast from 'react-hot-toast';
import type { RGRLSurvey } from '../types/rgrl';
import { getDefaultQuestionsForAnnex, calculateRGRLMetrics, generatePlanRegularizacion } from '../utils/rgrlEngine';
import { exportRGRLToOfficialExcel } from '../services/artExcelExporter';

const INITIAL_RGRL_SAMPLE: RGRLSurvey = (() => {
  const baseItems = getDefaultQuestionsForAnnex('anexo1_351');
  // Marcamos 2 ítems como no cumple para ilustrar el plan de regularización
  const items = baseItems.map(it => {
    if (it.codigo === '5.1') {
      return {
        ...it,
        estado: 'NO_CUMPLE' as const,
        observacion: 'Protocolo de puesta a tierra vencido, programar medición anual.'
      };
    }
    if (it.codigo === '8.3') {
      return {
        ...it,
        estado: 'NO_CUMPLE' as const,
        observacion: 'Completar Planilla 2 de Ergonomía s/Res. 886/15 en puesto de empaque.'
      };
    }
    return it;
  });

  const metrics = calculateRGRLMetrics(items);
  const plan = generatePlanRegularizacion(metrics.itemsNoCumple);

  return {
    id: 'RGRL-SAMPLE-01',
    razonSocial: 'Manufacturas del Plata S.A.',
    cuit: '30-70984512-8',
    establecimientoNombre: 'Planta Industrial Central',
    direccion: 'Av. Juan B. Justo 7800',
    localidad: 'Córdoba Capital',
    provincia: 'Córdoba',
    artNombre: 'Prevención ART',
    nroPoliza: 'ART-889410',
    ciiuActividad: '281100 - Fabricación de motores y turbinas',
    cantidadTrabajadores: 42,
    superficieM2: 2500,
    anexo: 'anexo1_351',
    fechaRelevamiento: new Date().toISOString().split('T')[0],
    profesionalHySNombre: 'Lic. Mariano Benítez',
    profesionalHySMatricula: 'Mat. HyS N° 4190',
    empleadorResponsable: 'Roberto Gómez (Apoderado)',
    items,
    planRegularizacion: plan,
    porcentajeCumplimiento: metrics.porcentajeCumplimiento,
    estadoGeneral: metrics.estadoGeneral,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
})();

export default function RGRLManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<RGRLSurvey[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'optimo' | 'critico'>('all');
  const [selectedSurvey, setSelectedSurvey] = useState<RGRLSurvey | null>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadSurveys = () => {
      const saved = localStorage.getItem('rgrl_surveys_db');
      if (saved) {
        try {
          setSurveys(JSON.parse(saved));
        } catch (e) {
          console.error('[RGRL] Error parsing local storage:', e);
        }
      } else {
        setSurveys([INITIAL_RGRL_SAMPLE]);
        localStorage.setItem('rgrl_surveys_db', JSON.stringify([INITIAL_RGRL_SAMPLE]));
      }
    };

    loadSurveys();
  }, []);

  const saveSurveys = (newList: RGRLSurvey[]) => {
    setSurveys(newList);
    localStorage.setItem('rgrl_surveys_db', JSON.stringify(newList));
  };

  const handleDelete = () => {
    if (!deleteConfirm.id) return;
    const updated = surveys.filter(s => s.id !== deleteConfirm.id);
    saveSurveys(updated);
    setDeleteConfirm({ isOpen: false, id: null });
    toast.success('Relevamiento RGRL eliminado');
  };

  const handleDuplicate = (survey: RGRLSurvey) => {
    const duplicated: RGRLSurvey = {
      ...survey,
      id: `RGRL-${Date.now()}`,
      razonSocial: `${survey.razonSocial} (Copia)`,
      fechaRelevamiento: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveSurveys([duplicated, ...surveys]);
    toast.success('Relevamiento duplicado como borrador');
  };

  const handleExportCSV = () => {
    if (surveys.length === 0) {
      toast.error('No hay relevamientos para exportar');
      return;
    }
    const data = surveys.map(s => {
      const m = calculateRGRLMetrics(s.items);
      return {
        ID: s.id,
        'Razón Social': s.razonSocial,
        CUIT: s.cuit,
        ART: s.artNombre,
        Póliza: s.nroPoliza || 'S/N',
        Anexo: s.anexo === 'anexo2_911' ? 'Construcción (911)' : s.anexo === 'anexo3_617' ? 'Agro (617)' : 'Industria (351)',
        'Fecha Relevamiento': s.fechaRelevamiento,
        'Trabajadores': s.cantidadTrabajadores,
        'Cumple': m.cumpleCount,
        'No Cumple': m.noCumpleCount,
        'No Aplica': m.noAplicaCount,
        '% Cumplimiento': `${m.porcentajeCumplimiento}%`,
        'Diagnóstico': m.estadoGeneral
      };
    });
    downloadCSV(data, `rgrl_res463_declaraciones_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Archivo CSV descargado');
  };

  const handleExportExcelArt = async (survey?: RGRLSurvey) => {
    const target = survey || surveys[0];
    if (!target) {
      toast.error('No hay relevamiento para exportar');
      return;
    }
    const tId = toast.loading('Generando planilla oficial Excel SRT...');
    try {
      await exportRGRLToOfficialExcel(target);
      toast.success('Planilla oficial Excel (.xlsx) descargada ✨', { id: tId });
    } catch (err: any) {
      console.error(err);
      toast.error('Error al generar el archivo Excel', { id: tId });
    }
  };

  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      const matchesSearch =
        s.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cuit?.includes(searchTerm) ||
        s.artNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      const m = calculateRGRLMetrics(s.items);
      if (filterStatus === 'optimo') return m.porcentajeCumplimiento >= 90;
      if (filterStatus === 'critico') return m.porcentajeCumplimiento < 75;
      return true;
    });
  }, [surveys, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    let sumPct = 0;
    let optimos = 0;
    let conDesvios = 0;

    surveys.forEach(s => {
      const m = calculateRGRLMetrics(s.items);
      sumPct += m.porcentajeCumplimiento;
      if (m.porcentajeCumplimiento >= 90) optimos++;
      if (m.noCumpleCount > 0) conDesvios++;
    });

    return {
      total: surveys.length,
      promedio: surveys.length > 0 ? Math.round(sumPct / surveys.length) : 0,
      optimos,
      conDesvios
    };
  }, [surveys]);

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
        {/* Encabezado Principal */}
        <PremiumHeader
          title="Relevamiento General de Riesgos (RGRL)"
          subtitle="Declaración Jurada Anual obligatoria ante ART · Res. S.R.T. N° 463/09, 529/09 y 74/10"
          badge="Res. SRT 463/09 & 529/09"
          icon={<ClipboardCheck size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/')}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 space-y-6">
          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">DDJJ Registradas</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                <BarChart3 size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">% Promedio Cumple</span>
                <span className="text-2xl font-black text-emerald-600">{stats.promedio}%</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                <ShieldCheck size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Nivel Óptimo (≥ 90%)</span>
                <span className="text-2xl font-black text-indigo-600">{stats.optimos}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Con Plan de Adecuación</span>
                <span className="text-2xl font-black text-amber-600">{stats.conDesvios}</span>
              </div>
            </div>
          </div>

          {/* Toolbar de Búsqueda y Botones estilo Aptitudes Médicas */}
          <div className="space-y-4">
            <div className="flex flex-row items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs h-[38px]">
                <Search
                  size={16}
                  className="text-slate-400 pointer-events-none z-10"
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: 0,
                    bottom: 0,
                    marginTop: 'auto',
                    marginBottom: 'auto',
                    display: 'block'
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar por Empresa, CUIT, ART..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full h-[38px] pl-9 pr-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  title="Exportar listado a CSV"
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0 14px',
                    height: '38px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: 'unset'
                  }}
                >
                  <Download size={14} />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportExcelArt()}
                  title="Exportar a Planilla Excel Oficial ART (.xlsx)"
                  style={{
                    backgroundColor: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0 14px',
                    height: '38px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: 'unset'
                  }}
                >
                  <Download size={14} />
                  <span>Excel ART</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/rgrl/new')}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0 16px',
                    height: '38px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: 'unset'
                  }}
                >
                  <Plus size={16} />
                  <span>Nuevo Relevamiento</span>
                </button>
              </div>
            </div>

            {/* Pastillas de Filtro con Fondo Sólido */}
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                style={{
                  backgroundColor: filterStatus === 'all' ? '#0f172a' : '#f1f5f9',
                  color: filterStatus === 'all' ? '#ffffff' : '#475569',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  minHeight: 'unset'
                }}
              >
                Todos ({surveys.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('optimo')}
                style={{
                  backgroundColor: filterStatus === 'optimo' ? '#059669' : '#f1f5f9',
                  color: filterStatus === 'optimo' ? '#ffffff' : '#475569',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  minHeight: 'unset'
                }}
              >
                Óptimos ≥ 90% ({stats.optimos})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('critico')}
                style={{
                  backgroundColor: filterStatus === 'critico' ? '#dc2626' : '#f1f5f9',
                  color: filterStatus === 'critico' ? '#ffffff' : '#475569',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  minHeight: 'unset'
                }}
              >
                Críticos &lt; 75%
              </button>
            </div>
          </div>

          {/* Listado */}
          {filteredSurveys.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <EmptyStateIllustrated
                title="No se encontraron relevamientos RGRL"
                description="Comience creando una nueva declaración jurada para presentar ante la aseguradora."
                actionLabel="Nuevo Relevamiento RGRL"
                onAction={() => navigate('/rgrl/new')}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSurveys.map(s => {
                const m = calculateRGRLMetrics(s.items);
                const isOptimo = m.porcentajeCumplimiento >= 90;
                const isCritico = m.porcentajeCumplimiento < 75;

                return (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs hover:border-blue-400 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {s.razonSocial || 'Sin Razón Social'}
                        </h3>
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          CUIT: {s.cuit}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                          {s.anexo === 'anexo2_911' ? 'Construcción Dec. 911' : s.anexo === 'anexo3_617' ? 'Agro Dec. 617' : 'Industria Dec. 351'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          ART: {s.artNombre}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                        <span>📍 {s.direccion}</span>
                        <span>👥 {s.cantidadTrabajadores} trabajadores</span>
                        <span>📅 Relevado: {new Date(s.fechaRelevamiento).toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>

                    {/* Porcentaje y Acciones */}
                    <div className="flex items-center gap-4 py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-100 dark:border-slate-700/60 px-0 lg:px-4">
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Cumplimiento</span>
                        <span className={`text-xl font-black ${
                          isOptimo ? 'text-emerald-600' : isCritico ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {m.porcentajeCumplimiento}%
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Plan Adecuación</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {m.noCumpleCount} ítems
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end lg:self-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSurvey(s)}
                        title="Ver Planilla Oficial PDF"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportExcelArt(s)}
                        title="Descargar Planilla Oficial Excel SRT / ART (.xlsx)"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        <Download size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/rgrl/new', { state: { editData: s } })}
                        title="Editar RGRL"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(s)}
                        title="Duplicar como Borrador"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        <Copy size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareItem({ title: `RGRL Res. SRT 463/09 - ${s.razonSocial}`, text: `Cumplimiento: ${m.porcentajeCumplimiento}%. ART: ${s.artNombre}. Desvíos: ${m.noCumpleCount}` })}
                        title="Compartir"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer"
                      >
                        <Share2 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ isOpen: true, id: s.id })}
                        title="Eliminar"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Vista Previa PDF */}
        {selectedSurvey && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800 rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Planilla Oficial RGRL · Res. S.R.T. N° 463/09
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedSurvey.razonSocial} · ART: {selectedSurvey.artNombre}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer size={15} /> Imprimir / Guardar PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSurvey(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-200/80 dark:bg-slate-950">
                <RGRLPdf data={selectedSurvey} />
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Borrado */}
        {deleteConfirm.isOpen && (
          <ConfirmModal
            isOpen={true}
            title="¿Eliminar Relevamiento RGRL?"
            message="Esta acción no se puede deshacer. Se eliminarán todas las respuestas y el plan de regularización."
            confirmText="Eliminar"
            cancelText="Cancelar"
            iconEmoji="📋"
            onConfirm={handleDelete}
            onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
          />
        )}

        {/* Modal Compartir */}
        {shareItem && (
          <ShareModal
            isOpen={true}
            onClose={() => setShareItem(null)}
            title={shareItem.title}
            text={shareItem.text}
          />
        )}
      </div>
    </AnimatedPage>
  );
}
