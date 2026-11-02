import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Plus, Search, FileText, Eye, Edit3, Trash2, CheckCircle2,
  Calendar, ShieldAlert, BarChart3, Share2, Download, Copy,
  Building2, Gauge, AlertTriangle, ShieldCheck, Printer, X, TrendingUp, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import GroundingProtocolPdf from '../components/GroundingProtocolPdf';
import { printElementAsDocument } from '../utils/pdfHelper';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import AnimatedPage from '../components/AnimatedPage';
import { downloadCSV } from '../services/exportCsv';
import toast from 'react-hot-toast';
import type { GroundingProtocol } from '../types/grounding';
import { evaluateFullGroundingProtocol } from '../utils/srtProtocols';
import MeasurementTrendChart from '../components/MeasurementTrendChart';

const INITIAL_SAMPLE: GroundingProtocol = {
  id: 'PAT-SAMPLE-01',
  razonSocial: 'Logística & Almacenes Centrales S.A.',
  cuit: '30-71458920-4',
  artNombre: 'Provincia ART',
  establecimiento: 'Centro Logístico Tortuguitas',
  tipoInstalacion: 'Industrial',
  direccion: 'Ruta Panamericana Km 38.5, Tortuguitas',
  localidad: 'Malvinas Argentinas',
  provincia: 'Buenos Aires',
  actividadPrincipal: 'Depósito y distribución de mercaderías generales',
  fechaMedicion: new Date().toISOString().split('T')[0],
  fechaVencimiento: (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  })(),
  profesionalNombre: 'Ing. Alejandro Gómez',
  profesionalMatricula: 'COPIME N° 8492',
  profesionalTitulo: 'Especialista en Higiene y Seguridad Laboral',
  instrumentoMarca: 'Megger',
  instrumentoModelo: 'DET-4TD2',
  instrumentoNroSerie: 'MG-992144',
  instrumentoFechaCalibracion: '2025-11-10',
  instrumentoCertificadoNro: 'INTI-CAL-9942',
  instrumentoLaboratorio: 'Laboratorio Trazable INTI / SAC',
  tensionSuministro: '380 V Trifásico + N / 220 V',
  esquemaConexionTierra: 'TT',
  tipoAcometida: 'Subterránea',
  potenciaContratadaKw: '50 kW',
  transformadorPropio: false,
  estadoSuelo: 'Húmedo',
  tensionSeguridadContacto: 50,
  jabalinas: [
    {
      id: '1',
      codigo: 'PAT-01',
      ubicacion: 'Tablero General Acometida',
      tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
      resistenciaMedida: 3.2,
      resistenciaMaximaAdmisible: 10,
      camaraInspeccion: true,
      borneDesconexion: true,
      estadoFisico: 'Bueno',
      conforme: true,
      observaciones: 'Jabalina normalizada IRAM 2309'
    },
    {
      id: '2',
      codigo: 'PAT-02',
      ubicacion: 'Sala de Baterías y Autoelevadores',
      tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
      resistenciaMedida: 4.1,
      resistenciaMaximaAdmisible: 10,
      camaraInspeccion: true,
      borneDesconexion: true,
      estadoFisico: 'Bueno',
      conforme: true,
      observaciones: 'Cámara con tapa de hierro fundido'
    }
  ],
  continuidadMasas: [
    {
      id: '1',
      codigo: 'CM-01',
      elemento: 'Chasis Tablero General y Puerta',
      ubicacion: 'Sala Eléctrica',
      resistenciaContinuidad: 0.12,
      continuidadConforme: true,
      observaciones: 'Colilla de puesta a tierra flexible instalada'
    },
    {
      id: '2',
      codigo: 'CM-02',
      elemento: 'Cargadores de Batería de Autoelevadores',
      ubicacion: 'Sector Carga',
      resistenciaContinuidad: 0.25,
      continuidadConforme: true,
      observaciones: 'Continuidad correcta'
    },
    {
      id: '3',
      codigo: 'CM-03',
      elemento: 'Racks Metálicos de Almacenamiento',
      ubicacion: 'Nave Principal',
      resistenciaContinuidad: 0.38,
      continuidadConforme: true,
      observaciones: 'Equipotencialidad general garantizada'
    }
  ],
  diferenciales: [
    {
      id: '1',
      codigo: 'ID-01',
      tableroUbicacion: 'Tablero General',
      circuitoProtegido: 'Circuito de Iluminación y Tomas',
      corrienteSensibilidadMa: 30,
      tiempoDisparoMs: 25,
      pulsadorTestFunciona: true,
      conforme: true,
      observaciones: 'Disparo en tiempo reglamentario'
    }
  ],
  fotos: [],
  cumpleNormativa: true,
  conclusiones: 'La instalación eléctrica inspeccionada CUMPLE satisfactoriamente con los requisitos del Anexo I de la Resolución S.R.T. N° 900/15 y la Reglamentación AEA 90364.',
  recomendaciones: [
    'Mantener despejadas las cámaras de inspección de las tomas de tierra.',
    'Reiterar la verificación con periodicidad anual según Res. SRT 900/15.'
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export default function GroundingProtocol(): React.ReactElement | null {
  const navigate = useNavigate();
  const [protocols, setProtocols] = useState<GroundingProtocol[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'conforme' | 'no_conforme'>('all');
  const [selectedProtocol, setSelectedProtocol] = useState<GroundingProtocol | null>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  const [showTrendChart, setShowTrendChart] = useState(false);
  const [directPrintProtocol, setDirectPrintProtocol] = useState<GroundingProtocol | null>(null);
  const [previewZoom, setPreviewZoom] = useState(typeof window !== 'undefined' && window.innerWidth < 640 ? 0.45 : 1);

  const handleDirectPrint = (p: GroundingProtocol) => {
    setDirectPrintProtocol(p);
    setTimeout(() => {
      printElementAsDocument('grounding-direct-print', `Protocolo_PAT_SRT900_${p.razonSocial || 'SRT'}`);
    }, 120);
  };

  const patTrendData = useMemo(() => {
    const points: { date: string; value: number; label: string }[] = [];
    protocols.forEach(p => {
      (p.jabalinas || []).forEach(j => {
        if (j.resistenciaMedida !== undefined && j.resistenciaMedida !== null) {
          points.push({
            date: p.fechaMedicion,
            value: Number(j.resistenciaMedida),
            label: `${j.codigo || 'PAT'} - ${j.ubicacion || ''}`
          });
        }
      });
    });
    return points;
  }, [protocols]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadProtocols = () => {
      const saved = localStorage.getItem('grounding_protocols_db');
      if (saved) {
        try {
          setProtocols(JSON.parse(saved));
        } catch (e) {
          console.error('[GROUNDING] Error parsing local storage:', e);
        }
      } else {
        // Inicializar con un ejemplo ilustrativo para que la pantalla no esté vacía
        setProtocols([INITIAL_SAMPLE]);
        localStorage.setItem('grounding_protocols_db', JSON.stringify([INITIAL_SAMPLE]));
      }
    };

    loadProtocols();
  }, []);

  const saveProtocols = (newList: GroundingProtocol[]) => {
    setProtocols(newList);
    localStorage.setItem('grounding_protocols_db', JSON.stringify(newList));
  };

  const handleDelete = () => {
    if (!deleteConfirm.id) return;
    const updated = protocols.filter(p => p.id !== deleteConfirm.id);
    saveProtocols(updated);
    setDeleteConfirm({ isOpen: false, id: null });
    toast.success('Protocolo eliminado correctamente');
  };

  const handleDuplicate = (proto: GroundingProtocol) => {
    const duplicated: GroundingProtocol = {
      ...proto,
      id: `PAT-${Date.now()}`,
      razonSocial: `${proto.razonSocial} (Copia)`,
      fechaMedicion: new Date().toISOString().split('T')[0],
      fechaVencimiento: (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split('T')[0];
      })(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveProtocols([duplicated, ...protocols]);
    toast.success('Protocolo duplicado como borrador');
  };

  const handleExportCSV = () => {
    if (protocols.length === 0) {
      toast.error('No hay protocolos para exportar');
      return;
    }
    const data = protocols.map(p => {
      const evalData = evaluateFullGroundingProtocol(p);
      return {
        ID: p.id,
        'Razón Social': p.razonSocial,
        CUIT: p.cuit,
        Establecimiento: p.establecimiento || 'Planta Principal',
        ART: p.artNombre || '-',
        'Tipo Instalación': p.tipoInstalacion || 'Industrial',
        Dirección: p.direccion,
        'Fecha Medición': p.fechaMedicion,
        'Fecha Vencimiento': p.fechaVencimiento,
        Régimen: p.esquemaConexionTierra,
        'Total Jabalinas': p.jabalinas.length,
        'Promedio PAT (Ohms)': evalData.promedioResistenciaOhms,
        'Máxima PAT (Ohms)': evalData.maxResistenciaMedida,
        'Continuidad Masas': `${evalData.masasConformes}/${evalData.totalMasas}`,
        'Diferenciales OK': `${evalData.diferencialesConformes}/${evalData.totalDiferenciales}`,
        'Tensión Contacto Uc (V)': evalData.tensionContactoPresuntaMaxVolts,
        'Tensión Seguridad UL (V)': p.tensionSeguridadContacto || 50,
        'Calibración Vencida': evalData.calibracionVencida ? 'SÍ' : 'NO',
        Dictamen: evalData.dictamenGeneral,
        'Estado Instalación': evalData.estadoInstalacion,
        Resultado: evalData.isFullyCompliant ? 'CONFORME' : 'NO CONFORME'
      };
    });
    downloadCSV(data, `protocolos_pat_res900_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Archivo CSV descargado con éxito');
  };

  // Filtrado y búsqueda
  const filteredProtocols = useMemo(() => {
    return protocols.filter(p => {
      const evalData = evaluateFullGroundingProtocol(p);
      const matchesSearch =
        p.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cuit?.includes(searchTerm) ||
        p.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (filterStatus === 'conforme') return evalData.isFullyCompliant;
      if (filterStatus === 'no_conforme') return !evalData.isFullyCompliant;
      return true;
    });
  }, [protocols, searchTerm, filterStatus]);

  // Estadísticas globales
  const stats = useMemo(() => {
    let totalJabalinas = 0;
    let conformes = 0;
    let conDesvios = 0;

    protocols.forEach(p => {
      totalJabalinas += p.jabalinas?.length || 0;
      const evalData = evaluateFullGroundingProtocol(p);
      if (evalData.isFullyCompliant) conformes++;
      else conDesvios++;
    });

    return {
      total: protocols.length,
      conformes,
      conDesvios,
      totalJabalinas
    };
  }, [protocols]);

  return (
    <AnimatedPage>
      <div
        className="container min-h-screen pb-16 flex flex-col"
        style={{ paddingTop: '7rem' }}
      >
        {/* Encabezado Principal Limpio (sin botones adentro del recuadro dorado) */}
        <PremiumHeader
          title="Puesta a Tierra y Continuidad de Masas"
          subtitle="Protocolo Oficial conforme a la Resolución S.R.T. N° 900/15 y AEA 90364"
          icon={<Zap size={28} className="text-amber-400" />}
          onBack={() => navigate('/')}
        />

        <div className="max-w-7xl w-full mx-auto mt-5 space-y-5">
          {/* Barra de Botones de Acción Principal (Fuera del recuadro dorado y con colores vivos) */}
          <div className="bg-white dark:bg-slate-800/90 p-3.5 sm:px-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Zap size={18} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 m-0 leading-tight">
                  Gestión de Protocolos Eléctricos (Res. SRT 900/15)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                  Administrá mediciones de jabalinas, continuidad de masas y disyuntores diferenciales
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={() => setShowTrendChart(prev => !prev)}
                style={{
                  background: showTrendChart
                    ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#ffffff'
                }}
                className="px-4 py-2.5 rounded-xl border-none text-xs font-extrabold flex items-center gap-2 shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all cursor-pointer"
              >
                <TrendingUp size={15} />
                <span>{showTrendChart ? 'Ocultar Tendencias' : 'Tendencias Históricas'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                  color: '#ffffff'
                }}
                className="px-4 py-2.5 rounded-xl border-none text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Exportar CSV</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/grounding/new')}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  color: '#ffffff'
                }}
                className="px-4.5 py-2.5 rounded-xl border-none text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/25 hover:opacity-95 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Nueva Medición Res. 900/15</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Protocolos Realizados</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Instalaciones Conformes</span>
                <span className="text-2xl font-black text-emerald-600">{stats.conformes}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Con Desvíos / A Adecuar</span>
                <span className="text-2xl font-black text-amber-600">{stats.conDesvios}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                <Zap size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Jabalinas / PAT Ensayadas</span>
                <span className="text-2xl font-black text-indigo-600">{stats.totalJabalinas}</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Tendencias Comparativas PAT */}
          {showTrendChart && (
            <MeasurementTrendChart
              title="Evolución Histórica de Resistencia de Puesta a Tierra"
              subtitle="Res. S.R.T. 900/15 & Reglamentación AEA 90364 (Máximo admisible: 10 Ω)"
              unit="Ω"
              legalLimit={10}
              limitLabel="Máx. reglamentario (10 Ω)"
              limitType="max"
              data={patTrendData}
            />
          )}

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96 flex items-center">
              <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por Razón Social, CUIT, Dirección..."
                style={{ paddingLeft: '2.4rem' }}
                className="w-full pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todos ({protocols.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('conforme')}
                className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  filterStatus === 'conforme'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Conformes ({stats.conformes})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('no_conforme')}
                className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                  filterStatus === 'no_conforme'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Con Observaciones ({stats.conDesvios})
              </button>
            </div>
          </div>

          {/* Listado de Protocolos */}
          {filteredProtocols.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <EmptyStateIllustrated
                title="No se encontraron protocolos de puesta a tierra"
                description="Comience creando una nueva medición para generar el informe oficial según Res. SRT 900/15."
                actionLabel="Nueva Medición Res. 900/15"
                onAction={() => navigate('/grounding/new')}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProtocols.map(p => {
                const evalData = evaluateFullGroundingProtocol(p);
                const isConforme = evalData.isFullyCompliant;

                // Verificación de vencimiento
                const fechaVenc = new Date(p.fechaVencimiento);
                const hoy = new Date();
                const diasRestantes = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                const estaVencido = diasRestantes < 0;
                const proximoAVencer = diasRestantes >= 0 && diasRestantes <= 30;

                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Info de la Empresa */}
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {p.razonSocial || 'Sin Razón Social'}
                        </h3>
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          CUIT: {p.cuit || 'S/D'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          isConforme ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {isConforme ? 'CONFORME SRT 900' : 'NO CONFORME'}
                        </span>

                        {estaVencido ? (
                          <span className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold uppercase">
                            VENCIDO
                          </span>
                        ) : proximoAVencer ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold uppercase">
                            VENCE EN {diasRestantes} DÍAS
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                        <span>🏭 {p.establecimiento || 'Planta Principal'} ({p.tipoInstalacion || 'Industrial'})</span>
                        {p.artNombre && <span>🛡️ ART: {p.artNombre}</span>}
                        <span>📍 {p.direccion}</span>
                        <span>⚡ Esquema {p.esquemaConexionTierra} · {p.tensionSuministro}</span>
                        <span>📅 Ensayo: {new Date(p.fechaMedicion).toLocaleDateString('es-AR')}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          🛡️ Vence: {new Date(p.fechaVencimiento).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </div>

                    {/* Métricas rápidas */}
                    <div className="flex items-center gap-4 py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-100 dark:border-slate-700/60 px-0 lg:px-4">
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Jabalinas</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {evalData.jabalinasConformes}/{evalData.totalJabalinas}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Promedio PAT</span>
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">
                          {evalData.promedioResistenciaOhms} Ω
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Continuidad</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {evalData.masasConformes}/{evalData.totalMasas}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Tensión Uc</span>
                        <span className={`text-base font-black ${evalData.tensionContactoExcedida ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {evalData.tensionContactoPresuntaMaxVolts} V
                        </span>
                      </div>
                    </div>

                    {/* Botones de acción con colores */}
                    <div className="flex items-center gap-1.5 self-end lg:self-center flex-wrap">
                      <button
                        type="button"
                        onClick={() => { setSelectedProtocol(p); setPreviewZoom(1); }}
                        title="Vista Previa A4 Protocolo Oficial"
                        className="px-2.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500 text-sky-600 dark:text-sky-400 hover:text-white border border-sky-500/30 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Eye size={16} />
                        <span className="hidden xl:inline">Previa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDirectPrint(p)}
                        title="Imprimir / Exportar PDF Oficial Directo"
                        className="px-2.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Printer size={16} />
                        <span className="hidden xl:inline">PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/grounding/new', { state: { editData: p } })}
                        title="Editar Protocolo"
                        className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-white border border-amber-500/30 transition-all cursor-pointer"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(p)}
                        title="Duplicar como Borrador"
                        className="p-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white border border-indigo-500/30 transition-all cursor-pointer"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareItem({ title: `Protocolo Res. SRT 900/15 - ${p.razonSocial}`, text: `Medición de PAT: ${evalData.promedioResistenciaOhms} Ω. Estado: ${isConforme ? 'Conforme' : 'Con desvíos'}` })}
                        title="Compartir"
                        className="p-2 rounded-xl bg-teal-500/15 hover:bg-teal-600 text-teal-600 dark:text-teal-400 hover:text-white border border-teal-500/30 transition-all cursor-pointer"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ isOpen: true, id: p.id })}
                        title="Eliminar"
                        className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal para Vista Previa e Impresión del PDF */}
        {selectedProtocol && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 dark:border-slate-700">
              {/* Header del Modal */}
              <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Protocolo Oficial Res. SRT 900/15
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedProtocol.razonSocial} · Medición del {selectedProtocol.fechaMedicion}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Controles de Zoom */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.max(0.6, z - 0.1))}
                      className="p-1 rounded hover:bg-white dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                      title="Reducir Zoom"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <span className="text-[11px] font-bold px-1.5 min-w-[42px] text-center text-slate-700 dark:text-slate-200">
                      {Math.round(previewZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.min(1.5, z + 0.1))}
                      className="p-1 rounded hover:bg-white dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                      title="Aumentar Zoom"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(1)}
                      className="p-1 rounded hover:bg-white dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                      title="Restablecer Zoom"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      printElementAsDocument('grounding-preview-modal', `Protocolo_PAT_SRT900_${selectedProtocol.razonSocial || 'SRT'}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer size={15} /> <span className="hidden sm:inline">Imprimir / </span>Guardar PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProtocol(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Contenedor del PDF con scroll */}
              <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-200/80 dark:bg-slate-950">
                <div style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }}>
                  <GroundingProtocolPdf data={selectedProtocol} customId="grounding-preview-modal" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenedor offscreen para impresión aislada directa */}
        {directPrintProtocol && (
          <div className="ats-pdf-offscreen" id="grounding-direct-print" aria-hidden="true">
            <GroundingProtocolPdf data={directPrintProtocol} customId="grounding-direct-print" />
          </div>
        )}

        {/* Modal de Confirmación de Borrado */}
        {deleteConfirm.isOpen && (
          <ConfirmModal
            isOpen={true}
            title="¿Eliminar Protocolo?"
            message="Esta acción no se puede deshacer. Se eliminarán todas las mediciones de jabalinas y registros de este protocolo."
            confirmText="Eliminar"
            cancelText="Cancelar"
            iconEmoji="⚡"
            onConfirm={handleDelete}
            onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
          />
        )}

        {/* Modal de Compartir */}
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
