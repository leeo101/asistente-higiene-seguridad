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
import { exportRARToOfficialExcel } from '../services/artExcelExporter';

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

  const handleExportOfficialExcel = async (survey?: RARSurvey) => {
    const target = survey || surveys[0];
    if (!target) {
      toast.error('No hay nómina para exportar');
      return;
    }
    const tId = toast.loading('Generando planilla oficial Excel RAR (Res. 37/10)...');
    try {
      await exportRARToOfficialExcel(target);
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
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        {/* Encabezado Principal */}
        <PremiumHeader
          title="Nómina de Expuestos (RAR)"
          subtitle="Relevamiento de Agentes de Riesgo · Res. S.R.T. N° 37/10 y Dec. 658/96"
          icon={<Stethoscope size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/')}
        />

        {/* 4 Tarjetas KPI interactivas estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setFilterStatus('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Nóminas Creadas</span>
              <FileText size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalStats.totalNominas}</div>
            <span className="text-[11px] text-slate-500">Relevamientos cargados</span>
          </div>

          <div
            className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80"
          >
            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Empleados</span>
              <Users size={20} />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalStats.totalTrabajadores}</div>
            <span className="text-[11px] text-slate-500">Personal en nóminas</span>
          </div>

          <div
            onClick={() => setFilterStatus('con_expuestos')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'con_expuestos'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Expuestos a Riesgos</span>
              <ShieldAlert size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalStats.totalExpuestos}</div>
            <span className="text-[11px] text-slate-500">Agentes declarados</span>
          </div>

          <div
            className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80"
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Tasa de Exposición</span>
              <BarChart3 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalStats.porcentajeExpuestos}%</div>
            <span className="text-[11px] text-slate-500">Proporción general</span>
          </div>
        </div>

        {/* Toolbar de Búsqueda y Botones estilo Aptitudes Médicas */}
        <div className="mt-8 space-y-4">
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
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por Empresa, CUIT o DNI..."
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Exportar CSV ART */}
              <button
                type="button"
                onClick={handleExportCSV}
                title="Exportar nómina de trabajadores en formato CSV para la ART"
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  height: '34px',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                  minHeight: 'unset'
                }}
              >
                <Download size={14} />
                <span>Exportar CSV</span>
              </button>

              {/* Botón Excel Oficial RAR */}
              <button
                type="button"
                onClick={() => handleExportOfficialExcel()}
                title="Exportar archivo Excel reglamentario de la SRT (.xlsx)"
                style={{
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  height: '34px',
                  boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)',
                  minHeight: 'unset'
                }}
              >
                <FileText size={14} />
                <span>Excel Oficial</span>
              </button>

              {/* Botón Nueva Nómina RAR */}
              <button
                type="button"
                onClick={() => navigate('/rar/new')}
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  height: '34px',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                  minHeight: 'unset'
                }}
              >
                <Plus size={14} />
                <span>Nueva Nómina RAR</span>
              </button>
            </div>
          </div>

          {/* Filter Pills estilo Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                backgroundColor: filterStatus === 'all' ? '#2563eb' : '#ffffff',
                color: filterStatus === 'all' ? '#ffffff' : '#334155',
                border: filterStatus === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Todas ({surveys.length})
            </button>
            <button
              onClick={() => setFilterStatus('con_expuestos')}
              style={{
                backgroundColor: filterStatus === 'con_expuestos' ? '#d97706' : '#ffffff',
                color: filterStatus === 'con_expuestos' ? '#ffffff' : '#334155',
                border: filterStatus === 'con_expuestos' ? '1px solid #d97706' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Con Expuestos
            </button>
            <button
              onClick={() => setFilterStatus('sin_expuestos')}
              style={{
                backgroundColor: filterStatus === 'sin_expuestos' ? '#059669' : '#ffffff',
                color: filterStatus === 'sin_expuestos' ? '#ffffff' : '#334155',
                border: filterStatus === 'sin_expuestos' ? '1px solid #059669' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Sin Expuestos
            </button>
          </div>

          {/* Listado de Nóminas */}
          {filteredSurveys.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-sm">
              <EmptyStateIllustrated
                title="No se encontraron nóminas RAR"
                description="Comience creando una nueva declaración de trabajadores expuestos para la ART."
                actionLabel="Nueva Nómina RAR"
                onAction={() => navigate('/rar/new')}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSurveys.map(s => {
                const stats = calculateRARStats(s.trabajadores || []);

                return (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:border-emerald-500 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                          {s.razonSocial || 'Sin Razón Social'}
                        </h3>
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-md">
                          CUIT: {s.cuit}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          ART: {s.artNombre}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                          Póliza: {s.nroPoliza || 'S/N'}
                        </span>
                        {stats.trabajadoresConCancerigenos > 0 && (
                          <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                            ☣️ {stats.trabajadoresConCancerigenos} c/ Cancerígenos (Res. 81/19)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                        <span>📍 {s.direccion}</span>
                        <span>👥 <strong>{stats.totalTrabajadores}</strong> trabajadores relevados</span>
                        <span>📅 Relevado: {new Date(s.fechaRelevamiento).toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>

                    {/* Métricas rápidas */}
                    <div className="flex items-center gap-5 py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-100 dark:border-slate-700/60 px-0 lg:px-5">
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Expuestos</span>
                        <span className="text-base font-black text-amber-600">
                          {stats.trabajadoresExpuestos} ({stats.porcentajeExpuestos}%)
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Sin Riesgo</span>
                        <span className="text-base font-black text-slate-800 dark:text-white">
                          {stats.trabajadoresNoExpuestos}
                        </span>
                      </div>
                    </div>

                    {/* Acciones con Botones Sólidos estilo Aptitudes Médicas */}
                    <div className="flex items-center gap-2 self-end lg:self-center flex-wrap">
                      {/* Botón Ver PDF */}
                      <button
                        type="button"
                        onClick={() => setSelectedSurvey(s)}
                        title="Ver Planilla Oficial PDF"
                        style={{
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: '800',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          minHeight: 'unset',
                          boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                        }}
                      >
                        <Eye size={12} /> Ver PDF
                      </button>

                      {/* Botón Excel Oficial */}
                      <button
                        type="button"
                        onClick={() => handleExportOfficialExcel(s)}
                        title="Descargar Planilla Oficial Excel RAR (.xlsx)"
                        style={{
                          backgroundColor: '#0d9488',
                          color: '#ffffff',
                          border: 'none',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: '800',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          minHeight: 'unset',
                          boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)'
                        }}
                      >
                        <Download size={12} /> Excel
                      </button>

                      {/* Botón Editar */}
                      <button
                        type="button"
                        onClick={() => navigate('/rar/new', { state: { editData: s } })}
                        title="Editar Nómina"
                        style={{
                          backgroundColor: '#d97706',
                          color: '#ffffff',
                          border: 'none',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: '800',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          minHeight: 'unset',
                          boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
                        }}
                      >
                        <Edit3 size={12} /> Editar
                      </button>

                      {/* Botón Duplicar */}
                      <button
                        type="button"
                        onClick={() => handleDuplicate(s)}
                        title="Duplicar como Borrador"
                        style={{
                          backgroundColor: '#4f46e5',
                          color: '#ffffff',
                          border: 'none',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: '800',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          minHeight: 'unset',
                          boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                        }}
                      >
                        <Copy size={12} /> Duplicar
                      </button>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ isOpen: true, id: s.id })}
                        title="Eliminar"
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: '800',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          minHeight: 'unset',
                          boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                        }}
                      >
                        <Trash2 size={12} /> Eliminar
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
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800 rounded-t-3xl">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base m-0">
                    Nómina Oficial RAR · Res. S.R.T. N° 37/10
                  </h3>
                  <p className="text-xs text-slate-500 m-0 mt-0.5">
                    {selectedSurvey.razonSocial} · ART: {selectedSurvey.artNombre}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const printBtn = document.querySelector('.rar-pdf-container') as HTMLElement;
                      if (printBtn) {
                        window.print();
                      }
                    }}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: '800',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: 'unset'
                    }}
                  >
                    <Printer size={15} /> Imprimir
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSurvey(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-slate-200/50 dark:bg-slate-950 flex justify-center rar-pdf-container">
                <div className="bg-white text-slate-900 p-6 shadow-md rounded max-w-4xl w-full my-auto">
                  <RARPdf data={selectedSurvey} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Eliminar Nómina RAR"
          message="¿Está seguro de que desea eliminar este relevamiento de agentes de riesgo? Esta acción eliminará permanentemente la declaración de expuestos."
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          type="danger"
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        />

        {/* Modal Compartir */}
        {shareItem && (
          <ShareModal
            isOpen={!!shareItem}
            onClose={() => setShareItem(null)}
            title={shareItem.title}
            text={shareItem.text}
          />
        )}
      </div>
    </AnimatedPage>
  );
}
