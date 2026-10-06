import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wind, Plus, Search, Calendar, FileText, Download,
  Trash2, AlertTriangle, CheckCircle2, ShieldAlert,
  Activity, User, MapPin, Clock, ArrowRight,
  FileSpreadsheet, Eye, X, ShieldCheck, Printer, Check,
  Sparkles, Info, ChevronRight, Ban, Edit3, Gauge,
  Fan, AlertOctagon, RefreshCw
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import toast from 'react-hot-toast';
import {
  VentilationStudy,
  VentilationEquipment,
  AnemometerPoint,
  WorkplaceActivityType,
  RoomEnvironmentType,
  ENVIRONMENT_AIR_CHANGES,
  DEC351_VENTILATION_TABLE,
  calcVentilationMetrics,
  DEFAULT_VENTILATION_STUDIES
} from '../data/ventilationData';
import { generateVentilationProtocolPdf } from '../utils/ventilationPdfGenerator';

export default function VentilationStudyManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  // Estados
  const [studies, setStudies] = useState<VentilationStudy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal de Calculador / Estudio
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulario reactivo
  const [sectorName, setSectorName] = useState('');
  const [activityType, setActivityType] = useState<WorkplaceActivityType>('moderada');
  const [environmentType, setEnvironmentType] = useState<RoomEnvironmentType>('taller_mecanico');
  const [surfaceM2, setSurfaceM2] = useState<number>(100);
  const [heightM, setHeightM] = useState<number>(4);
  const [workersCount, setWorkersCount] = useState<number>(5);
  const [naturalOpeningsAreaM2, setNaturalOpeningsAreaM2] = useState<number>(2);
  const [evaluatorName, setEvaluatorName] = useState('Ing. / Lic. Higiene y Seguridad');
  const [evaluatorLicense, setEvaluatorLicense] = useState('Matrícula Profesional Vigente');
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
  const [recommendations, setRecommendations] = useState('');

  // Equipos en el modal
  const [equipments, setEquipments] = useState<VentilationEquipment[]>([
    { id: 'eq-1', type: 'extractor_axial', tag: 'EXT-01', flowRateM3H: 3500, quantity: 1, diameterMm: 500 }
  ]);

  // Puntos de medición
  const [points, setPoints] = useState<AnemometerPoint[]>([
    { id: 'p-1', location: 'Puesto Operativo Principal', airVelocityMS: 0.3, co2Ppm: 600, temperatureC: 22 }
  ]);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Clave de almacenamiento por empresa
  const storageKey = useMemo(() => {
    return activeCompany ? `ventilation_studies_db_${activeCompany.id}` : 'ventilation_studies_db_default';
  }, [activeCompany]);

  // Carga inicial
  useEffect(() => {
    window.scrollTo(0, 0);
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setStudies(JSON.parse(raw));
      } catch (e) {
        setStudies(DEFAULT_VENTILATION_STUDIES);
      }
    } else {
      setStudies(DEFAULT_VENTILATION_STUDIES);
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_VENTILATION_STUDIES));
    }
  }, [storageKey]);

  // Guardado
  const saveStudies = (data: VentilationStudy[]) => {
    setStudies(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  // Cálculo en vivo dentro del formulario
  const liveMetrics = useMemo(() => {
    return calcVentilationMetrics(
      surfaceM2,
      heightM,
      workersCount,
      activityType,
      environmentType,
      equipments,
      naturalOpeningsAreaM2
    );
  }, [surfaceM2, heightM, workersCount, activityType, environmentType, equipments, naturalOpeningsAreaM2]);

  // Métricas acumuladas para los KPIs
  const kpis = useMemo(() => {
    const total = studies.length;
    const compliant = studies.filter(s => s.isCompliant).length;
    const deficient = studies.filter(s => !s.isCompliant).length;
    const totalFlow = studies.reduce((acc, s) => acc + s.totalActualFlowRateM3H, 0);
    const avgRenH = total > 0
      ? Math.round((studies.reduce((acc, s) => acc + s.actualAirChangesPerHour, 0) / total) * 10) / 10
      : 0;

    return { total, compliant, deficient, totalFlow, avgRenH };
  }, [studies]);

  // Manejo de apertura de modal
  const handleOpenNew = () => {
    setEditingId(null);
    setSectorName('Depósito y Logística');
    setActivityType('moderada');
    setEnvironmentType('deposito_logistica');
    setSurfaceM2(150);
    setHeightM(4.5);
    setWorkersCount(6);
    setNaturalOpeningsAreaM2(3);
    setStudyDate(new Date().toISOString().split('T')[0]);
    setRecommendations('');
    setEquipments([
      { id: `eq-${Date.now()}`, type: 'extractor_axial', tag: 'EXT-01', flowRateM3H: 4000, quantity: 2, diameterMm: 600 }
    ]);
    setPoints([
      { id: `p-${Date.now()}`, location: 'Pasillo Central', airVelocityMS: 0.25, co2Ppm: 550, temperatureC: 22 }
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = (study: VentilationStudy) => {
    setEditingId(study.id);
    setSectorName(study.sectorName);
    setActivityType(study.activityType);
    setEnvironmentType(study.environmentType);
    setSurfaceM2(study.surfaceM2);
    setHeightM(study.heightM);
    setWorkersCount(study.workersCount);
    setNaturalOpeningsAreaM2(study.naturalOpeningsAreaM2);
    setEvaluatorName(study.evaluatorName);
    setEvaluatorLicense(study.evaluatorLicense);
    setStudyDate(study.date);
    setRecommendations(study.recommendations);
    setEquipments(study.equipments || []);
    setPoints(study.measurementPoints || []);
    setShowModal(true);
  };

  // Manejo de equipos dinámicos en el modal
  const handleAddEquipment = () => {
    setEquipments([
      ...equipments,
      {
        id: `eq-${Date.now()}`,
        type: 'extractor_axial',
        tag: `EXT-0${equipments.length + 1}`,
        flowRateM3H: 3000,
        quantity: 1,
        diameterMm: 500
      }
    ]);
  };

  const handleRemoveEquipment = (id: string) => {
    setEquipments(equipments.filter(e => e.id !== id));
  };

  const handleUpdateEquipment = (id: string, field: keyof VentilationEquipment, val: any) => {
    setEquipments(equipments.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  // Manejo de puntos de medición
  const handleAddPoint = () => {
    setPoints([
      ...points,
      {
        id: `p-${Date.now()}`,
        location: `Puesto ${points.length + 1}`,
        airVelocityMS: 0.25,
        co2Ppm: 600,
        temperatureC: 22
      }
    ]);
  };

  const handleRemovePoint = (id: string) => {
    setPoints(points.filter(p => p.id !== id));
  };

  const handleUpdatePoint = (id: string, field: keyof AnemometerPoint, val: any) => {
    setPoints(points.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  // Guardar estudio
  const handleSaveStudy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectorName.trim()) {
      toast.error('Indique el nombre del sector evaluado');
      return;
    }

    const calculated = calcVentilationMetrics(
      surfaceM2,
      heightM,
      workersCount,
      activityType,
      environmentType,
      equipments,
      naturalOpeningsAreaM2
    );

    const studyData: VentilationStudy = {
      id: editingId || `vent-${Date.now()}`,
      companyId: activeCompany?.id,
      sectorName,
      activityType,
      environmentType,
      date: studyDate,
      evaluatorName,
      evaluatorLicense,
      surfaceM2,
      heightM,
      volumeM3: calculated.volumeM3,
      workersCount,
      equipments,
      naturalOpeningsAreaM2,
      measurementPoints: points,
      cubicMetersPerPerson: calculated.cubicMetersPerPerson,
      requiredFlowRateByPersonsM3H: calculated.requiredFlowRateByPersonsM3H,
      recommendedAirChangesPerHour: calculated.recommendedAirChangesPerHour,
      requiredFlowRateByVolumeM3H: calculated.requiredFlowRateByVolumeM3H,
      totalRequiredFlowRateM3H: calculated.totalRequiredFlowRateM3H,
      totalActualFlowRateM3H: calculated.totalActualFlowRateM3H,
      actualAirChangesPerHour: calculated.actualAirChangesPerHour,
      flowDeficitM3H: calculated.flowDeficitM3H,
      coveragePercent: calculated.coveragePercent,
      isCompliant: calculated.isCompliant,
      recommendations,
      status: calculated.isCompliant ? 'conforme' : 'no_conforme',
      createdAt: new Date().toISOString()
    };

    if (editingId) {
      const updated = studies.map(s => s.id === editingId ? studyData : s);
      saveStudies(updated);
      toast.success('Estudio de ventilación actualizado');
    } else {
      saveStudies([studyData, ...studies]);
      toast.success('Estudio de ventilación registrado conforme a Dec. 351/79');
    }

    setShowModal(false);
  };

  // Eliminar estudio
  const confirmDelete = () => {
    if (!deleteTargetId) return;
    saveStudies(studies.filter(s => s.id !== deleteTargetId));
    toast.success('Estudio eliminado');
    setDeleteTargetId(null);
  };

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'SECTOR',
      'ACTIVIDAD',
      'AMBIENTE',
      'VOLUMEN_M3',
      'PERSONAS',
      'CAUDAL_REQUERIDO_M3H',
      'CAUDAL_REAL_M3H',
      'RENOVACIONES_REALES_RENH',
      'COBERTURA_PORCENTAJE',
      'ESTADO',
      'FECHA'
    ];

    const rows = studies.map(s => [
      `"${s.id}"`,
      `"${s.sectorName}"`,
      `"${s.activityType}"`,
      `"${s.environmentType}"`,
      `"${s.volumeM3}"`,
      `"${s.workersCount}"`,
      `"${s.totalRequiredFlowRateM3H}"`,
      `"${s.totalActualFlowRateM3H}"`,
      `"${s.actualAirChangesPerHour}"`,
      `"${s.coveragePercent}%"`,
      `"${s.status}"`,
      `"${s.date}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Estudios_Ventilacion_Dec351_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Datos exportados en CSV');
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header Premium */}
        <PremiumHeader
          title="Ventilación & Calidad de Aire"
          subtitle="Cálculo de Caudales Mínimos y Renovaciones Horarias — Decreto 351/79 Cap. 11 y Anexo III"
          badge="Dec. 351/79 Anexo III"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Exportar CSV
            </button>
            <button
              onClick={handleOpenNew}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Estudio de Ventilación
            </button>
          </div>
        </PremiumHeader>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          {/* Tarjetas de KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sectores Auditados</span>
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Wind className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {kpis.total}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-emerald-600 font-bold">{kpis.compliant} Conformes</span>
                <span className="text-slate-400">•</span>
                <span className={kpis.deficient > 0 ? 'text-red-500 font-bold' : 'text-slate-400'}>
                  {kpis.deficient} con Déficit
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Caudal Total Instalado</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Fan className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {kpis.totalFlow.toLocaleString()} <span className="text-xs font-normal text-slate-400">m³/h</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Capacidad total de inyección y extracción
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Renovaciones Promedio</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Gauge className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {kpis.avgRenH} <span className="text-xs font-normal text-slate-400">Ren/h</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Tasa horaria de recambio de aire ambiental
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conformidad Legal</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {kpis.total > 0 ? Math.round((kpis.compliant / kpis.total) * 100) : 100}%
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Sectores que cumplen o superan la tabla oficial
              </div>
            </div>
          </div>

          {/* Banner de Referencia Técnica Dec. 351/79 */}
          <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border-l-4 border-teal-500 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                Criterios Oficiales de Ventilación — Decreto 351/79 Capítulo 11 y Anexo III
              </p>
              <p>
                El caudal mínimo de aire exterior por trabajador se determina por tabla según cubicaje (m³/persona) y tipo de actividad (Sedentaria: 12-43 m³/h, Moderada: 18-65 m³/h, Pesada: 24-86 m³/h). Cuando existan fuentes de calor o vapores químicos, prima la tasa de renovaciones horarias requeridas para la dilución adecuada.
              </p>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por sector o responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 w-52 sm:w-72"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
              >
                <option value="all">Todos los Estados</option>
                <option value="conforme">Conformes / Aprobados</option>
                <option value="no_conforme">Con Déficit / No Conformes</option>
              </select>
            </div>
          </div>

          {/* Lista de Estudios */}
          {studies.length === 0 ? (
            <EmptyStateIllustrated
              title="No hay estudios de ventilación registrados"
              description="Realice el primer estudio para calcular los caudales de renovación reglamentarios de sus sectores."
              actionLabel="Nuevo Estudio de Ventilación"
              onAction={handleOpenNew}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studies
                .filter(s => {
                  if (filterStatus !== 'all' && s.status !== filterStatus) return false;
                  if (searchTerm.trim()) {
                    const q = searchTerm.toLowerCase();
                    return s.sectorName.toLowerCase().includes(q) || s.evaluatorName.toLowerCase().includes(q);
                  }
                  return true;
                })
                .map((study) => {
                  const isOk = study.isCompliant;

                  return (
                    <div
                      key={study.id}
                      className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                        isOk
                          ? 'border-slate-200 dark:border-slate-800'
                          : 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20'
                      }`}
                    >
                      <div>
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="font-black text-base text-slate-900 dark:text-white block">
                              {study.sectorName}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {study.date} • {study.volumeM3} m³ ({study.workersCount} operarios)
                            </span>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isOk
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-300'
                          }`}>
                            {isOk ? 'APROBADO' : 'DÉFICIT'}
                          </span>
                        </div>

                        {/* Indicadores técnicos */}
                        <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-100 dark:border-slate-800/80 my-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Caudal Exigido</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{study.totalRequiredFlowRateM3H.toLocaleString()} m³/h</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Caudal Real</span>
                            <span className={`font-bold ${isOk ? 'text-emerald-600' : 'text-red-500'}`}>
                              {study.totalActualFlowRateM3H.toLocaleString()} m³/h
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Renovaciones</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{study.actualAirChangesPerHour} Ren/h</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Cobertura</span>
                            <span className={`font-black ${isOk ? 'text-emerald-600' : 'text-red-500'}`}>
                              {study.coveragePercent}%
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 my-1">
                          {study.recommendations || 'Sin observaciones técnicas.'}
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => generateVentilationProtocolPdf(study, activeCompany?.name, activeCompany?.cuit)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Protocolo PDF
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(study)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(study.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* MODAL: CALCULADOR Y ESTUDIO DE VENTILACIÓN */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 my-8 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Wind className="w-5 h-5 text-teal-600" />
                    {editingId ? 'Editar Estudio de Ventilación' : 'Nuevo Cálculo y Memoria de Ventilación (Dec. 351/79)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Memoria de cálculo oficial de caudales, renovaciones horarias y balance de aire.
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStudy} className="space-y-4">
                {/* 1. Datos del Sector y Evaluador */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Sector Evaluado (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Taller de Pintura y Soldadura"
                      value={sectorName}
                      onChange={(e) => setSectorName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fecha</label>
                    <input
                      type="date"
                      value={studyDate}
                      onChange={(e) => setStudyDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* 2. Geometría y Ocupación */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Parámetros del Local y Ocupación:
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-slate-500 block mb-1">Superficie (m²)</label>
                      <input
                        type="number"
                        min="1"
                        value={surfaceM2}
                        onChange={(e) => setSurfaceM2(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Altura Media (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={heightM}
                        onChange={(e) => setHeightM(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Personal en Turno</label>
                      <input
                        type="number"
                        min="1"
                        value={workersCount}
                        onChange={(e) => setWorkersCount(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Aberturas Naturales (m²)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={naturalOpeningsAreaM2}
                        onChange={(e) => setNaturalOpeningsAreaM2(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-slate-500 block mb-1">Tipo de Actividad (Anexo III)</label>
                      <select
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value as WorkplaceActivityType)}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                      >
                        <option value="sedentaria">Sedentaria (Oficinas / Control)</option>
                        <option value="moderada">Moderada (Talleres / Fabricación)</option>
                        <option value="pesada">Pesada (Fundición / Cargas Manuales)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-1">Destino del Ambiente</label>
                      <select
                        value={environmentType}
                        onChange={(e) => setEnvironmentType(e.target.value as RoomEnvironmentType)}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                      >
                        {Object.entries(ENVIRONMENT_AIR_CHANGES).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Equipos de Ventilación */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Equipos de Extracción / Inyección Mecánica:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddEquipment}
                      className="px-2.5 py-1 rounded-lg text-teal-600 bg-teal-50 dark:bg-teal-950/40 font-bold flex items-center gap-1 hover:bg-teal-100"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Equipo
                    </button>
                  </div>

                  {equipments.map((eq, idx) => (
                    <div key={eq.id} className="grid grid-cols-5 gap-2 items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <input
                          type="text"
                          placeholder="Tag (EXT-01)"
                          value={eq.tag}
                          onChange={(e) => handleUpdateEquipment(eq.id, 'tag', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={eq.type}
                          onChange={(e) => handleUpdateEquipment(eq.id, 'type', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          <option value="extractor_axial">Extractor Axial de Muro</option>
                          <option value="extractor_eolico">Extractor Eólico de Techo</option>
                          <option value="extractor_centrifugo">Extractor Centrífugo</option>
                          <option value="inyector_aire_fresco">Inyector de Aire Fresco</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="m³/h unitario"
                          value={eq.flowRateM3H}
                          onChange={(e) => handleUpdateEquipment(eq.id, 'flowRateM3H', Number(e.target.value))}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          placeholder="Cant."
                          value={eq.quantity}
                          onChange={(e) => handleUpdateEquipment(eq.id, 'quantity', Number(e.target.value))}
                          className="w-14 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipment(eq.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 4. Panel de Resultados en Tiempo Real */}
                <div className={`p-4 rounded-2xl border ${
                  liveMetrics.isCompliant
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60'
                    : 'bg-red-50/60 dark:bg-red-950/20 border-red-300 dark:border-red-900/60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-teal-600" />
                      Diagnóstico de Ventilación en Tiempo Real (Dec. 351/79):
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                      liveMetrics.isCompliant
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                    }`}>
                      {liveMetrics.isCompliant ? 'APROBADO' : `DÉFICIT: ${liveMetrics.flowDeficitM3H} m³/h`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Volumen Total:</span>
                      <span className="font-bold">{liveMetrics.volumeM3} m³</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Caudal Exigido:</span>
                      <span className="font-bold">{liveMetrics.totalRequiredFlowRateM3H.toLocaleString()} m³/h</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Caudal Real:</span>
                      <span className="font-bold">{liveMetrics.totalActualFlowRateM3H.toLocaleString()} m³/h</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Renovaciones Reales:</span>
                      <span className="font-bold">{liveMetrics.actualAirChangesPerHour} Ren/h (Min {liveMetrics.recommendedAirChangesPerHour})</span>
                    </div>
                  </div>
                </div>

                {/* 5. Recomendaciones */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Recomendaciones de Ingeniería / Medidas Preventivas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Indique medidas correctivas, mantenimiento de extractores o necesidad de aspiración localizada..."
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md"
                  >
                    Guardar Estudio y Cálculos
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          isOpen={!!deleteTargetId}
          title="¿Eliminar estudio de ventilación?"
          message="Se borrará el registro y los cálculos asociados de la base de datos."
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      </div>
    </AnimatedPage>
  );
}
