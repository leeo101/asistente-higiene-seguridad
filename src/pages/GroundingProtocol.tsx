import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Plus, Search, FileText, Eye, Edit3, Trash2, CheckCircle2,
  Calendar, ShieldAlert, BarChart3, Share2, Download, Copy,
  Building2, Gauge, AlertTriangle, ShieldCheck, Printer, X
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import GroundingProtocolPdf from '../components/GroundingProtocolPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import AnimatedPage from '../components/AnimatedPage';
import { downloadCSV } from '../services/exportCsv';
import toast from 'react-hot-toast';
import type { GroundingProtocol } from '../types/grounding';
import { evaluateFullGroundingProtocol } from '../utils/srtProtocols';

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
        {/* Encabezado Principal */}
        <PremiumHeader
          title="Puesta a Tierra y Continuidad de Masas"
          subtitle="Protocolo Oficial conforme a la Resolución S.R.T. N° 900/15 y AEA 90364"
          icon={<Zap size={28} className="text-amber-400" />}
          onBack={() => navigate('/')}
        >
          <div className="flex items-center gap-2 mt-2 justify-center">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download size={15} /> Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => navigate('/grounding/new')}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={16} className="text-amber-600" /> Nueva Medición Res. 900/15
            </button>
          </div>
        </PremiumHeader>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 space-y-6">
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

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por Razón Social, CUIT, Dirección..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todos ({protocols.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('conforme')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  filterStatus === 'conforme'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Conformes ({stats.conformes})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('no_conforme')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  filterStatus === 'no_conforme'
                    ? 'bg-amber-600 text-white'
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

                    {/* Botones de acción */}
                    <div className="flex items-center gap-1.5 self-end lg:self-center">
                      <button
                        type="button"
                        onClick={() => setSelectedProtocol(p)}
                        title="Ver Protocolo Oficial PDF"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/grounding/new', { state: { editData: p } })}
                        title="Editar Protocolo"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(p)}
                        title="Duplicar como Borrador"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        <Copy size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareItem({ title: `Protocolo Res. SRT 900/15 - ${p.razonSocial}`, text: `Medición de PAT: ${evalData.promedioResistenciaOhms} Ω. Estado: ${isConforme ? 'Conforme' : 'Con desvíos'}` })}
                        title="Compartir"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        <Share2 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ isOpen: true, id: p.id })}
                        title="Eliminar"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-red-50 hover:text-red-600 transition-colors"
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

        {/* Modal para Vista Previa e Impresión del PDF */}
        {selectedProtocol && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 dark:border-slate-700">
              {/* Header del Modal */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800 rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Protocolo Oficial Res. SRT 900/15
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedProtocol.razonSocial} · Medición del {selectedProtocol.fechaMedicion}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer size={15} /> Imprimir / Guardar PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProtocol(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Contenedor del PDF con scroll */}
              <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-200/80 dark:bg-slate-950">
                <GroundingProtocolPdf data={selectedProtocol} />
              </div>
            </div>
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
