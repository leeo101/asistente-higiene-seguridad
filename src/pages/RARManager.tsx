import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, Plus, Search, FileText, Eye, Edit3, Trash2, CheckCircle2,
  Users, BarChart3, Share2, Download, Copy, Building2,
  Printer, X, ShieldAlert, ShieldCheck
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import RARPdf from '../components/RARPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import AnimatedPage from '../components/AnimatedPage';
import { downloadCSV } from '../services/exportCsv';
import toast from 'react-hot-toast';
import type { RARSurvey } from '../types/rar';
import { calculateRARStats, getAgentByCode } from '../utils/rarCatalog';

const INITIAL_RAR_SAMPLE: RARSurvey = {
  id: 'RAR-SAMPLE-01',
  razonSocial: 'Mecánica de Precisión Andina S.R.L.',
  cuit: '30-71629481-2',
  establecimientoNombre: 'Planta de Fabricación y Armado',
  direccion: 'Parque Industrial Pilar, Lote 42',
  localidad: 'Pilar',
  provincia: 'Buenos Aires',
  artNombre: 'Prevención ART',
  nroPoliza: 'POL-394810',
  ciiuActividad: '281100 - Fabricación de maquinaria industrial',
  fechaRelevamiento: new Date().toISOString().split('T')[0],
  fechaVigenciaHasta: (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  })(),
  profesionalNombre: 'Lic. Gonzalo Valenzuela',
  profesionalMatricula: 'Mat. HyS COPIME N° 9924',
  empleadorResponsable: 'Ing. Carlos Rossi (Director)',
  trabajadores: [
    {
      id: '1',
      cuil: '20-34981204-5',
      nombre: 'Álvarez, Roberto',
      puesto: 'Soldador / Armador Metálico',
      sector: 'Taller de Soldadura',
      fechaIngreso: '2020-05-10',
      agentesCodigos: ['80001', '80003', '40001', '90001'],
      horasExposicionDiaria: 8,
      diasExposicionSemanal: 5,
      eppAdecuado: true,
      observaciones: 'Soldadura MIG/MAG, protección auditiva'
    },
    {
      id: '2',
      cuil: '20-37419823-1',
      nombre: 'Giménez, Mario',
      puesto: 'Operario de Pintura / Soplete',
      sector: 'Cabina de Pintura',
      fechaIngreso: '2021-09-01',
      agentesCodigos: ['40002', '90001'],
      horasExposicionDiaria: 6,
      diasExposicionSemanal: 5,
      eppAdecuado: true,
      observaciones: 'Semimáscara c/filtros orgánicos'
    },
    {
      id: '3',
      cuil: '20-31940182-9',
      nombre: 'Páez, Cristian',
      puesto: 'Conductor de Autoelevador',
      sector: 'Almacén Central',
      fechaIngreso: '2019-03-15',
      agentesCodigos: ['80001', '80005'],
      horasExposicionDiaria: 8,
      diasExposicionSemanal: 5,
      eppAdecuado: true,
      observaciones: 'Vibraciones de cuerpo entero y ruido'
    },
    {
      id: '4',
      cuil: '27-36192834-2',
      nombre: 'Romero, Lucía',
      puesto: 'Personal Administrativo / Oficina',
      sector: 'Administración',
      fechaIngreso: '2022-02-10',
      agentesCodigos: [],
      horasExposicionDiaria: 8,
      diasExposicionSemanal: 5,
      eppAdecuado: true,
      observaciones: 'Sin agentes de riesgo declarados'
    }
  ],
  observaciones: 'Relevamiento anual para exámenes periódicos de la ART.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export default function RARManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<RARSurvey[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'con_expuestos' | 'sin_expuestos'>('all');
  const [selectedSurvey, setSelectedSurvey] = useState<RARSurvey | null>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadSurveys = () => {
      const saved = localStorage.getItem('rar_surveys_db');
      if (saved) {
        try {
          setSurveys(JSON.parse(saved));
        } catch (e) {
          console.error('[RAR] Error parsing local storage:', e);
        }
      } else {
        setSurveys([INITIAL_RAR_SAMPLE]);
        localStorage.setItem('rar_surveys_db', JSON.stringify([INITIAL_RAR_SAMPLE]));
      }
    };

    loadSurveys();
  }, []);

  const saveSurveys = (newList: RARSurvey[]) => {
    setSurveys(newList);
    localStorage.setItem('rar_surveys_db', JSON.stringify(newList));
  };

  const handleDelete = () => {
    if (!deleteConfirm.id) return;
    const updated = surveys.filter(s => s.id !== deleteConfirm.id);
    saveSurveys(updated);
    setDeleteConfirm({ isOpen: false, id: null });
    toast.success('Nómina RAR eliminada');
  };

  const handleDuplicate = (survey: RARSurvey) => {
    const duplicated: RARSurvey = {
      ...survey,
      id: `RAR-${Date.now()}`,
      razonSocial: `${survey.razonSocial} (Copia)`,
      fechaRelevamiento: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveSurveys([duplicated, ...surveys]);
    toast.success('Nómina duplicada como borrador');
  };

  // Exportar en formato de subida masiva a portales de ART
  const handleExportCSV = () => {
    if (surveys.length === 0) {
      toast.error('No hay nóminas para exportar');
      return;
    }

    const rows: any[] = [];
    surveys.forEach(s => {
      s.trabajadores.forEach(w => {
        const codigosStr = (w.agentesCodigos || []).join('; ');
        rows.push({
          'Razón Social': s.razonSocial,
          CUIT: s.cuit,
          ART: s.artNombre,
          Póliza: s.nroPoliza,
          CUIL: w.cuil,
          'Apellido y Nombre': w.nombre,
          Puesto: w.puesto,
          Sector: w.sector,
          'Fecha Ingreso': w.fechaIngreso,
          'Códigos Agentes SRT': codigosStr,
          'Horas Exposición Diaria': w.horasExposicionDiaria,
          'EPP Res. 299/11': w.eppAdecuado ? 'SÍ' : 'NO'
        });
      });
    });

    downloadCSV(rows, `rar_nomina_expuestos_res37_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Archivo CSV con nómina consolidada descargado');
  };

  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      const matchesSearch =
        s.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cuit?.includes(searchTerm) ||
        s.artNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.trabajadores?.some(w => w.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || w.cuil.includes(searchTerm));

      if (!matchesSearch) return false;
      const stats = calculateRARStats(s.trabajadores || []);
      if (filterStatus === 'con_expuestos') return stats.trabajadoresExpuestos > 0;
      if (filterStatus === 'sin_expuestos') return stats.trabajadoresExpuestos === 0;
      return true;
    });
  }, [surveys, searchTerm, filterStatus]);

  const totalStats = useMemo(() => {
    let totalTrab = 0;
    let totalExp = 0;

    surveys.forEach(s => {
      const stats = calculateRARStats(s.trabajadores || []);
      totalTrab += stats.totalTrabajadores;
      totalExp += stats.trabajadoresExpuestos;
    });

    return {
      totalNominas: surveys.length,
      totalTrabajadores: totalTrab,
      totalExpuestos: totalExp,
      porcentajeExpuestos: totalTrab > 0 ? Math.round((totalExp / totalTrab) * 100) : 0
    };
  }, [surveys]);

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
        {/* Encabezado Principal */}
        <PremiumHeader
          title="Nómina de Expuestos (RAR)"
          subtitle="Relevamiento de Agentes de Riesgo · Res. S.R.T. N° 37/10 y Dec. 658/96"
          icon={<Stethoscope size={28} className="text-emerald-400" />}
          onBack={() => navigate('/')}
        >
          <div className="flex items-center gap-2 mt-2 justify-center">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download size={15} /> Exportar CSV ART
            </button>
            <button
              type="button"
              onClick={() => navigate('/rar/new')}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={16} className="text-emerald-600" /> Nueva Nómina RAR
            </button>
          </div>
        </PremiumHeader>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 space-y-6">
          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Nóminas Creadas</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{totalStats.totalNominas}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Total Empleados</span>
                <span className="text-2xl font-black text-blue-600">{totalStats.totalTrabajadores}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                <ShieldAlert size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Expuestos a Riesgos</span>
                <span className="text-2xl font-black text-amber-600">{totalStats.totalExpuestos}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                <BarChart3 size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">% Tasa Exposición</span>
                <span className="text-2xl font-black text-indigo-600">{totalStats.porcentajeExpuestos}%</span>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por Empresa, CUIT, Trabajador..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todas ({surveys.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('con_expuestos')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterStatus === 'con_expuestos'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Con Expuestos
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('sin_expuestos')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterStatus === 'sin_expuestos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Sin Expuestos
              </button>
            </div>
          </div>

          {/* Listado */}
          {filteredSurveys.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <EmptyStateIllustrated
                title="No se encontraron nóminas RAR"
                description="Comience creando una nueva declaración de trabajadores expuestos para la ART."
                actionLabel="Nueva Nómina RAR"
                onAction={() => navigate('/rar/new')}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSurveys.map(s => {
                const stats = calculateRARStats(s.trabajadores || []);

                return (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs hover:border-emerald-400 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {s.razonSocial || 'Sin Razón Social'}
                        </h3>
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          CUIT: {s.cuit}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          ART: {s.artNombre}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                          Póliza: {s.nroPoliza || 'S/N'}
                        </span>
                        {stats.trabajadoresConCancerigenos > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                            ☣️ {stats.trabajadoresConCancerigenos} c/ Cancerígenos (Res. 81/19)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                        <span>📍 {s.direccion}</span>
                        <span>👥 {stats.totalTrabajadores} trabajadores relevados</span>
                        <span>📅 Relevado: {new Date(s.fechaRelevamiento).toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>

                    {/* Métricas rápidas */}
                    <div className="flex items-center gap-4 py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-100 dark:border-slate-700/60 px-0 lg:px-4">
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Expuestos</span>
                        <span className="text-base font-black text-amber-600">
                          {stats.trabajadoresExpuestos} ({stats.porcentajeExpuestos}%)
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Sin Riesgo</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {stats.trabajadoresNoExpuestos}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1.5 self-end lg:self-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSurvey(s)}
                        title="Ver Planilla Oficial PDF"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer"
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/rar/new', { state: { editData: s } })}
                        title="Editar Nómina"
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
                        onClick={() => setShareItem({ title: `RAR Res. SRT 37/10 - ${s.razonSocial}`, text: `Nómina con ${stats.totalTrabajadores} operarios (${stats.trabajadoresExpuestos} expuestos). ART: ${s.artNombre}` })}
                        title="Compartir"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
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
            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800 rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Nómina Oficial RAR · Res. S.R.T. N° 37/10
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedSurvey.razonSocial} · ART: {selectedSurvey.artNombre}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                <RARPdf data={selectedSurvey} />
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmación de Borrado */}
        {deleteConfirm.isOpen && (
          <ConfirmModal
            isOpen={true}
            title="¿Eliminar Nómina RAR?"
            message="Esta acción no se puede deshacer. Se eliminarán los trabajadores y agentes declarados en esta nómina."
            confirmText="Eliminar"
            cancelText="Cancelar"
            iconEmoji="🩺"
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
