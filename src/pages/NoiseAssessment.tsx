import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones, Gauge, Ear, Plus, Search,
  FileText, Eye, Edit3, Trash2, CheckCircle2,
  XCircle, Clock, User, Calendar,
  Zap, Shield, AlertTriangle, BarChart3,
  TrendingUp, Target, Activity, Share2, Volume2,
  Wind, Info, Play, Printer, VolumeX, Mic, ArrowLeft } from
'lucide-react';
import ShareModal from '../components/ShareModal';
import NoiseAssessmentPdf from '../components/NoiseAssessmentPdf';
import CompanyLogo from '../components/CompanyLogo';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';

// Límites según ISO 9612 y directivas internacionales
const NOISE_LIMITS = {
  actionLevel: 80, // Nivel de acción inferior (dB)
  actionLevelHigh: 85, // Nivel de acción superior (dB)
  limitValue: 87, // Valor límite (dB)
  peakAction: 135, // Pico de acción (dB)
  peakLimit: 140 // Pico límite (dB)
};

// Niveles de referencia para ejemplos
const NOISE_REFERENCES = [
{ level: 30, description: 'Susurro', icon: '🤫' },
{ level: 60, description: 'Conversación normal', icon: '💬' },
{ level: 80, description: 'Tráfico intenso', icon: '🚗' },
{ level: 85, description: 'Umbral de riesgo', icon: '⚠️' },
{ level: 90, description: 'Taladro industrial', icon: '🔧' },
{ level: 100, description: 'Sierra circular', icon: '🪚' },
{ level: 110, description: 'Martillo neumático', icon: '🔨' },
{ level: 120, description: 'Sirena de emergencia', icon: '🚨' },
{ level: 130, description: 'Umbral del dolor', icon: '😖' },
{ level: 140, description: 'Daño inmediato', icon: '💥' }];


// Tipos de medición
const MEASUREMENT_TYPES = [
{ id: 'personal', name: 'Dosimetría Personal', icon: '👤' },
{ id: 'area', name: 'Medición de Área', icon: '📍' },
{ id: 'peak', name: 'Ruido de Impacto', icon: '💥' },
{ id: 'octave', name: 'Análisis Octavas', icon: '🎵' }];


// EPP Auditivo disponible
const HEARING_PROTECTION = [
{ id: 'earplugs', name: 'Tapones de espuma', nrr: 29 },
{ id: 'earmuffs', name: 'Orejeras', nrr: 25 },
{ id: 'dual', name: 'Protección dual', nrr: 35 }];


export default function NoiseAssessment(): React.ReactElement | null {
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('measurements'); // measurements, workers, statistics
  const [shareItem, setShareItem] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  const [newMeasurement, setNewMeasurement] = useState({
    id: '',
    workerId: '',
    workerName: '',
    type: 'personal',
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    task: '',
    duration: '',
    levels: {
      lavg: '', // Nivel promedio (dB)
      lmax: '', // Nivel máximo (dB)
      lmin: '', // Nivel mínimo (dB)
      lpeak: '', // Nivel pico (dB)
      lex8h: '' // Nivel equivalente 8h (dB)
    },
    hearingProtection: '',
    observations: '',
    equipment: '',
    calibrated: true,
    technician: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = () => {
      const savedMeasurements = localStorage.getItem('noise_assessments_db');
      const savedWorkers = localStorage.getItem('noise_workers_db');
      if (savedMeasurements) setMeasurements(JSON.parse(savedMeasurements));
      if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
    };

    loadData();

    const handleStorageChange = (e: any) => {
      if (e.key === 'noise_assessments_db' || e.key === 'noise_workers_db') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const params = new URLSearchParams(window.location.search);
    if (params.get('created')) {
      loadData();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const saveMeasurements = (data: any[]) => {
    localStorage.setItem('noise_assessments_db', JSON.stringify(data));
    setMeasurements(data);
  };

  const handleAddMeasurement = () => {
    navigate('/noise-assessment/new');
  };

  const getLevelColor = (level: number) => {
    if (level >= NOISE_LIMITS.limitValue) return { level: 'critical', color: '#dc2626', label: 'CRÍTICO' };
    if (level >= NOISE_LIMITS.actionLevelHigh) return { level: 'high', color: '#f59e0b', label: 'ALTO' };
    if (level >= NOISE_LIMITS.actionLevel) return { level: 'medium', color: '#eab308', label: 'MEDIO' };
    return { level: 'low', color: '#16a34a', label: 'BAJO' };
  };

  const calculateRiskLevel = (level: number) => {
    if (level >= NOISE_LIMITS.limitValue) return { level: 'critical', color: '#dc2626', label: 'CRÍTICO' };
    if (level >= NOISE_LIMITS.actionLevelHigh) return { level: 'high', color: '#f59e0b', label: 'ALTO' };
    if (level >= NOISE_LIMITS.actionLevel) return { level: 'medium', color: '#eab308', label: 'MEDIO' };
    return { level: 'low', color: '#16a34a', label: 'BAJO' };
  };

  const calculateAttenuatedLevel = (level: number, protectionId: string) => {
    const protection = HEARING_PROTECTION.find((p) => p.id === protectionId);
    if (!protection) return level;
    // Método NRR (Noise Reduction Rating) simplificado
    const attenuation = (protection.nrr - 7) / 2;
    return Math.max(level - attenuation, 0).toFixed(1);
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      saveMeasurements(measurements.filter((m) => m.id !== confirmModal.payload));
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredMeasurements = measurements.filter((m) => {
    const matchesSearch = m.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.task?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  // Estadísticas
  const stats = {
    total: measurements.length,
    critical: measurements.filter((m: any) => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'critical').length,
    high: measurements.filter((m: any) => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'high').length,
    medium: measurements.filter((m: any) => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'medium').length,
    low: measurements.filter((m: any) => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'low').length,
    complianceRate: measurements.length > 0 ?
    Math.round(measurements.filter((m: any) => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level !== 'critical').length / measurements.length * 100) :
    100,
    avgLevel: measurements.length > 0 ?
    (measurements.reduce((sum, m: any) => sum + (parseFloat(m.levels.lavg) || 0), 0) / measurements.length).toFixed(1) :
    0,
    workersExposed: new Set(measurements.map((m: any) => m.workerId)).size
  };

  return (
    <div className="container pb-[6rem]">
             <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`Protocolo Ruido - ${shareItem?.workerName || ''}`}
        text={shareItem ? `🔊 Protocolo de Medición de Ruido (Res. 85/12)\n👤 Trabajador: ${shareItem.workerName}\n📈 Nivel: ${shareItem.levels?.lavg} dB(A)\n📅 Fecha: ${new Date(shareItem.date).toLocaleDateString('es-AR')}` : ''}
        rawMessage={shareItem ? `🔊 Protocolo de Medición de Ruido (Res. 85/12)\n👤 Trabajador: ${shareItem.workerName}\n📈 Nivel: ${shareItem.levels?.lavg} dB(A)\n📅 Fecha: ${new Date(shareItem.date).toLocaleDateString('es-AR')}` : ''}
        elementIdToPrint="pdf-content"
        fileName={`Ruido_${shareItem?.workerName || 'Protocolo'}.pdf`} />
      

            <div className="fixed left-[0] opacity-[0.01] top-[0] pointer-events-[none]">
                {shareItem && <NoiseAssessmentPdf data={shareItem} />}
            </div>
            {/* Header Premium */}
            <div className="no-print mb-8">
                <PremiumHeader
          title="Evaluación de Ruido"
          subtitle={`ISO 9612 • ${measurements.length} mediciones`}
          icon={<Volume2 size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        
                <div className="flex justify-space-between items-center flex-wrap gap-[1rem] mt-[1rem]">
                    <></>
                    <div className="flex gap-[0.75rem] flex-wrap">
                        <button
              onClick={handleAddMeasurement} className="w-[auto] m-[0] flex items-center gap-[0.5rem] p-[0.75rem_1.25rem] bg-[linear-gradient(135deg,_#10b981_0%,_#059669_100%)] text-[#ffffff] border-none rounded-[8px] font-[700] cursor-pointer box-shadow-[0_4px_15px_rgba(16,_185,_129,_0.3)] transition-[all_0.2s_ease]">
















              
                            <Plus size={20} strokeWidth={2.5} />
                            Nueva Medición
                        </button>
                        <button
              onClick={() => navigate('/history')}
              className="btn-outline p-[0.75rem_1rem]">



              
                            <FileText size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
          icon={<Activity size={24} />}
          label="Total Mediciones"
          value={stats.total}
          color="#3B82F6"
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)" />
        
                <StatCard
          icon={<AlertTriangle size={24} />}
          label="Nivel Crítico"
          value={stats.critical}
          color="#dc2626"
          gradient="linear-gradient(135deg, #dc2626, #991b1b)" />
        
                <StatCard
          icon={<Gauge size={24} />}
          label="Promedio dB(A)"
          value={stats.avgLevel}
          color="#8b5cf6"
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
        
                <StatCard
          icon={<User size={20} />}
          label="Trabajadores"
          value={stats.workersExposed}
          color="#10b981"
          gradient="linear-gradient(135deg, #10b981, #059669)" />
        
            </div>

            {/* Tabs */}
            <div className="flex gap-[0.5rem] mb-[1.5rem] border-bottom-[2px_solid_var(--color-border)] pb-[0.5rem]">





        
                <TabButton
          active={activeTab === 'measurements'}
          onClick={() => setActiveTab('measurements')}
          icon={<Volume2 size={18} />}
          label="Mediciones" />
        
                <TabButton
          active={activeTab === 'workers'}
          onClick={() => setActiveTab('workers')}
          icon={<User size={18} />}
          label="Trabajadores" />
        
                <TabButton
          active={activeTab === 'statistics'}
          onClick={() => setActiveTab('statistics')}
          icon={<BarChart3 size={18} />}
          label="Estadísticas" />
        
            </div>

            {/* Content by Tab */}
            {activeTab === 'measurements' &&
      <>
                    {/* Search & Filters */}
                    <div className="flex gap-[1rem] mb-[1.5rem] flex-wrap">




          
                        <div className="flex-[1] min-width-[280px] relative">
                            <Search
              size={20}
              color="var(--color-text-muted)" className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] pointer-events-[none]" />







            
                            <input
              type="text"
              placeholder="Buscar por trabajador, ubicación, tarea..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem 0.85rem 3rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-input-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box'
              } as any} />
            
                        </div>

                        <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)} className="p-[0.85rem_1.25rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[0.9rem] font-[600] outline-[none] cursor-pointer">











            
                            <option value="all">Todos los Tipos</option>
                            {MEASUREMENT_TYPES.map((type) =>
            <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
            )}
                        </select>
                    </div>

                    {/* Measurements List */}
                    {filteredMeasurements.length === 0 ?
        <EmptyStateIllustrated
          title="Sin Mediciones de Ruido"
          description="Comenzá a evaluar la exposición al ruido según ISO 9612 para proteger la salud auditiva."
          icon={<Volume2 />} /> :


        <div className="flex flex-col gap-3">
                            {filteredMeasurements.map((measurement) =>
          <MeasurementCard
            key={measurement.id}
            measurement={measurement}
            riskLevel={calculateRiskLevel(parseFloat(measurement.levels.lavg) || 0)}
            onView={() => setSelectedMeasurement(measurement)}
            onEdit={() => navigate('/noise-assessment/new', { state: { editData: measurement } })}
            onShare={() => setShareItem(measurement)}
            onDelete={() => {
              setConfirmModal({ isOpen: true, payload: measurement.id });
            }} />

          )}
                        </div>
        }
                </>
      }

            {activeTab === 'workers' &&
      <WorkerDetails
        workers={workers}
        measurements={measurements}
        calculateRiskLevel={calculateRiskLevel} />

      }

            {activeTab === 'statistics' &&
      <Statistics
        measurements={measurements}
        calculateRiskLevel={calculateRiskLevel}
        NOISE_LIMITS={NOISE_LIMITS} />

      }

            {/* Modal de Detalle */}
            {selectedMeasurement &&
      <MeasurementDetailModal
        measurement={selectedMeasurement}
        riskLevel={calculateRiskLevel(parseFloat(selectedMeasurement.levels.lavg) || 0)}
        onClose={() => setSelectedMeasurement(null)}
        calculateAttenuatedLevel={calculateAttenuatedLevel}
        HEARING_PROTECTION={HEARING_PROTECTION}
        NOISE_LIMITS={NOISE_LIMITS} />

      }

            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar medición?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}

// Componentes Auxiliares
function StatCard({ icon, label, value, color, gradient }: {icon: React.ReactElement;label: string;value: string | number;color: string;gradient: string;}) {
  return (
    <div className="card p-[1.25rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border-subtle)] relative overflow-[hidden]">





      
            <div style={{





        background: gradient


      }} className="absolute top-[-20px] right-[-20px] w-[80px] h-[80px] rounded-[50%] opacity-[0.1]" />
            <div className="flex items-center gap-[0.75rem] mb-[0.75rem]">
                <div style={{


          background: gradient,




          boxShadow: `0 4px 15px ${color}40`
        }} className="w-[48px] h-[48px] rounded-[var(--radius-lg)] flex items-center justify-center">
                    {React.cloneElement(icon as any, { color: '#ffffff', size: 24 } as any)}
                </div>
            </div>
            <div className="text-[2rem] font-[900] text-[var(--color-text)] line-height-[1]">
                {value}
            </div>
            <div className="text-[0.85rem] font-[600] text-[var(--color-text-muted)]">
                {label}
            </div>
        </div>);

}

function TabButton({ active, onClick, icon, label }: {active: boolean;onClick: () => void;icon: React.ReactElement;label: string;}) {
  return (
    <button
      onClick={onClick}
      style={{




        background: active ? 'var(--color-primary)' : 'transparent',
        color: active ? '#fff' : 'var(--color-text-muted)'






      }} className="flex items-center gap-[0.5rem] p-[0.75rem_1.25rem] border-none rounded-[var(--radius-lg)_var(--radius-lg)_0_0] cursor-pointer font-[700] text-[0.9rem] transition-[all_var(--transition-fast)]">
      
            {icon}
            {label}
        </button>);

}

function MeasurementCard({ measurement, riskLevel, onView, onEdit, onShare, onDelete }: {measurement: any;riskLevel: {level: string;color: string;label: string;};onView: () => void;onEdit: () => void;onShare: () => void;onDelete: () => void;}) {
  return (
    <div className="card p-[1.25rem] flex items-center gap-[1rem] transition-[all_var(--transition-fast)]">





      
            {/* Nivel de ruido visual */}
            <div style={{


        background: `linear-gradient(135deg, ${riskLevel.color}, ${riskLevel.color}cc)`,







        boxShadow: `0 4px 20px ${riskLevel.color}40`
      }} className="w-[64px] h-[64px] rounded-[var(--radius-xl)] flex flex-col items-center justify-center text-[#fff] flex-shrink-[0]">
                <Volume2 size={24} strokeWidth={2.5} />
                <span className="text-[1rem] font-[900] line-height-[1]">
                    {parseFloat(measurement.levels.lavg) || 0}
                </span>
                <span className="text-[0.6rem] font-[700] opacity-[0.9]">dB(A)</span>
            </div>

            {/* Información */}
            <div className="flex-[1] min-width-[0]">
                <div className="flex items-center gap-[0.75rem] mb-[0.5rem]">
                    <h3 className="m-[0] text-[1.1rem] font-[800] text-[var(--color-text)] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">







            
                        {measurement.workerName}
                    </h3>
                    <span style={{

            background: `${riskLevel.color}15`,
            color: riskLevel.color





          }} className="p-[0.35rem_0.75rem] rounded-[var(--radius-full)] text-[0.7rem] font-[800] uppercase flex-shrink-[0]">
                        {riskLevel.label}
                    </span>
                </div>
                <div className="flex flex-wrap gap-[1rem] text-[0.85rem] text-[var(--color-text-muted)] font-[500]">






          
                    <span className="flex items-center gap-[0.35rem]">
                        <Calendar size={14} />
                        {new Date(measurement.date).toLocaleDateString('es-AR')}
                    </span>
                    <span className="flex items-center gap-[0.35rem]">
                        <Clock size={14} />
                        {measurement.duration || '-'}h
                    </span>
                    <span className="flex items-center gap-[0.35rem]">
                        <Headphones size={14} />
                        {measurement.hearingProtection ? 'Con EPP' : 'Sin EPP'}
                    </span>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-[0.5rem]">
                <button
          onClick={onView}









          title="Ver detalle" className="p-[0.6rem_0.75rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-md)] cursor-pointer text-[var(--color-primary)] transition-[all_var(--transition-fast)]">
          
                    <Eye size={18} />
                </button>
                <button
          onClick={onEdit}
          className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-500 hover:bg-slate-700 transition-colors"
          title="Editar Evaluación">
          
                    <Edit3 size={18} />
                </button>
                <button
          onClick={onShare}









          title="Compartir PDF" className="p-[0.6rem_0.75rem] bg-[#dcfce7] border-[1px_solid_#86efac] rounded-[var(--radius-md)] cursor-pointer text-[#16a34a] transition-[all_var(--transition-fast)]">
          
                    <Share2 size={18} />
                </button>
                <button
          onClick={onDelete}
          className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-red-500 hover:bg-slate-700 transition-colors"
          title="Eliminar">
          
                    <Trash2 size={18} />
                </button>
            </div>
        </div>);

}

function WorkerDetails({ workers, measurements, calculateRiskLevel }: {workers: any[];measurements: any[];calculateRiskLevel: (level: number) => any;}) {
  const workerStats = workers.map((worker) => {
    const workerMeasurements = measurements.filter((m) => m.workerId === worker.id);
    const avgLevel = workerMeasurements.length > 0 ?
    (workerMeasurements.reduce((sum, m) => sum + (parseFloat(m.levels.lavg) || 0), 0) / workerMeasurements.length).toFixed(1) :
    0;
    const lastMeasurement = workerMeasurements[0]?.date || '-';

    return {
      ...worker,
      measurementCount: workerMeasurements.length,
      avgLevel,
      lastMeasurement,
      riskLevel: calculateRiskLevel(parseFloat(avgLevel as string) || 0)
    };
  });

  if (workers.length === 0) {
    return (
      <div className="p-[3rem_2rem] text-center bg-[var(--gradient-card)] rounded-[var(--radius-2xl)] border-[2px_dashed_var(--color-border)]">





        
                <User size={48} color="var(--color-text-muted)" className="mb-[1rem]" />
                <p className="text-[var(--color-text-muted)] text-[0.95rem]">
                    No hay trabajadores registrados. Agregá mediciones para ver el listado.
                </p>
            </div>);

  }

  return (
    <div className="flex flex-col gap-3">
            {workerStats.map((worker) =>
      <div key={worker.id} className="card p-[1.25rem] flex items-center gap-[1rem]">




        
                    <div style={{


          background: `linear-gradient(135deg, ${worker.riskLevel.color}, ${worker.riskLevel.color}cc)`








        }} className="w-[56px] h-[56px] rounded-[var(--radius-xl)] flex items-center justify-center text-[#fff] text-[1.5rem] font-[900] flex-shrink-[0]">
                        {worker.workerName?.charAt(0) || 'W'}
                    </div>
                    <div className="flex-[1]">
                        <h3 className="m-[0] text-[1rem] font-[800]">
                            {worker.workerName || 'Sin nombre'}
                        </h3>
                        <p className="m-[0.25rem_0_0_0] text-[0.85rem] text-[var(--color-text-muted)]">
                            {worker.measurementCount} mediciones • Promedio: {worker.avgLevel} dB(A) • Última: {new Date(worker.lastMeasurement).toLocaleDateString('es-AR')}
                        </p>
                    </div>
                    <span style={{

          background: `${worker.riskLevel.color}15`,
          color: worker.riskLevel.color




        }} className="p-[0.35rem_0.75rem] rounded-[var(--radius-full)] text-[0.7rem] font-[800] uppercase">
                        {worker.riskLevel.label}
                    </span>
                </div>
      )}
        </div>);

}

function Statistics({ measurements, calculateRiskLevel, NOISE_LIMITS }: {measurements: any[];calculateRiskLevel: (level: number) => any;NOISE_LIMITS: any;}) {
  // Distribución por niveles
  const distribution = {
    low: measurements.filter((m: any) => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'low').length,
    medium: measurements.filter((m: any) => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'medium').length,
    high: measurements.filter((m: any) => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'high').length,
    critical: measurements.filter((m: any) => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'critical').length
  };

  const maxCount = Math.max(...Object.values(distribution), 1);

  const RISK_LEVELS_CONFIG: {[key: string]: {color: string;label: string;};} = {
    low: { color: '#16a34a', label: 'Bajo' },
    medium: { color: '#eab308', label: 'Medio' },
    high: { color: '#f59e0b', label: 'Alto' },
    critical: { color: '#dc2626', label: 'Crítico' }
  };

  return (
    <div className="flex flex-col gap-[1.5rem]">
            {/* Gráfico de distribución */}
            <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl">
                <h3 className="m-[0_0_1.5rem_0] text-[1rem] font-[800]">
                    Distribución por Nivel de Riesgo
                </h3>
                <div className="flex items-end gap-[1rem] h-[200px]">
                    {Object.entries(distribution).map(([level, count]: [string, number]) => {
            const config = RISK_LEVELS_CONFIG[level];
            if (!config) return null; // Should not happen if distribution keys match RISK_LEVELS_CONFIG keys

            const height = count / maxCount * 100;

            return (
              <div key={level} className="flex-[1] flex flex-col items-center">
                                <div style={{

                  height: `${height}%`,
                  background: config.color,


                  minHeight: count > 0 ? '20px' : '0'
                }} className="w-[100%] rounded-[var(--radius-lg)_var(--radius-lg)_0_0] transition-[height_var(--transition-base)]" />
                                <div className="mt-[0.75rem] text-center">
                                    <div style={{ color: config.color }} className="text-[1.5rem] font-[900]">
                                        {count}
                                    </div>
                                    <div className="text-[0.75rem] font-[600] text-[var(--color-text-muted)]">
                                        {config.label}
                                    </div>
                                </div>
                            </div>);

          })}
                </div>
            </div>

            {/* Límites de referencia */}
            <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl">
                <h3 className="m-[0_0_1.5rem_0] text-[1rem] font-[800]">
                    Límites de Referencia (ISO 9612)
                </h3>
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(200px,_1fr))] gap-[1rem]">
                    <RiskDetailRow
            label="Nivel de Acción Inferior"
            value={`${NOISE_LIMITS.actionLevel} dB(A)`}
            description="Inicio de programa de conservación auditiva"
            color="#eab308" />
          
                    <RiskDetailRow
            label="Nivel de Acción Superior"
            value={`${NOISE_LIMITS.actionLevelHigh} dB(A)`}
            description="EPP obligatorio"
            color="#f59e0b" />
          
                    <RiskDetailRow
            label="Valor Límite"
            value={`${NOISE_LIMITS.limitValue} dB(A)`}
            description="Exposición máxima permitida"
            color="#dc2626" />
          
                    <RiskDetailRow
            label="Pico Límite"
            value={`${NOISE_LIMITS.peakLimit} dB`}
            description="Nivel de pico máximo"
            color="#991b1b" />
          
                </div>
            </div>

            {/* Escala de referencia */}
            <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl">
                <h3 className="m-[0_0_1.5rem_0] text-[1rem] font-[800]">
                    Escala de Niveles de Ruido
                </h3>
                <div className="h-[40px] bg-[linear-gradient(to_right,_#16a34a,_#eab308,_#f59e0b,_#dc2626)] rounded-[var(--radius-lg)] relative mb-[1rem]">





          
                    <div style={{

            left: `${NOISE_LIMITS.actionLevel / 140 * 100}%`





          }} className="absolute top-[0] bottom-[0] w-[2px] bg-[#fff] opacity-[0.8]" />
                    <div style={{

            left: `${NOISE_LIMITS.actionLevelHigh / 140 * 100}%`





          }} className="absolute top-[0] bottom-[0] w-[2px] bg-[#fff] opacity-[0.8]" />
                    <div style={{

            left: `${NOISE_LIMITS.limitValue / 140 * 100}%`





          }} className="absolute top-[0] bottom-[0] w-[2px] bg-[#fff] opacity-[0.8]" />
                </div>
                <div className="flex justify-space-between text-[0.75rem] font-[600] text-[var(--color-text-muted)]">
                    <span>0 dB</span>
                    <span>{NOISE_LIMITS.actionLevel} dB</span>
                    <span>{NOISE_LIMITS.actionLevelHigh} dB</span>
                    <span>{NOISE_LIMITS.limitValue} dB</span>
                    <span>140 dB</span>
                </div>
            </div>
        </div>);

}

const RiskDetailRow = ({ label, value, description, color }: {label: string;value: string;description: string;color: string;}) =>
<div style={{

  background: `${color}15`,
  border: `1px solid ${color}`

}} className="p-[1rem] rounded-[var(--radius-lg)]">
        <div style={{ color }} className="text-[0.7rem] font-[700] uppercase mb-[0.5rem]">
            {label}
        </div>
        <div className="text-[1.5rem] font-[900] text-[var(--color-text)] mb-[0.25rem]">
            {value}
        </div>
        <div className="text-[0.8rem] text-[var(--color-text-muted)] line-height-[1.4]">
            {description}
        </div>
    </div>;




function LevelInput({ label, value, onChange, placeholder }: {label: string;value: string;onChange: (value: string) => void;placeholder: string;}) {
  return (
    <div>
            <label style={{ ...labelStyle }} className="text-[0.75rem]">{label}</label>
            <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          padding: '0.6rem 0.75rem',
          fontSize: '0.9rem',
          boxSizing: 'border-box'
        } as any}
        placeholder={placeholder} />
      
        </div>);

}

// Modal de Detalle
function MeasurementDetailModal({ measurement, riskLevel, onClose, calculateAttenuatedLevel, HEARING_PROTECTION, NOISE_LIMITS }: {measurement: any;riskLevel: {level: string;color: string;label: string;};onClose: () => void;calculateAttenuatedLevel: (level: number, protectionId: string) => string | number;HEARING_PROTECTION: {id: string;name: string;nrr: number;}[];NOISE_LIMITS: any;}) {
  const protection = HEARING_PROTECTION.find((p: {id: string;name: string;nrr: number;}) => p.id === measurement.hearingProtection);
  const attenuatedLevel = protection ?
  calculateAttenuatedLevel(parseFloat(measurement.levels.lavg) || 0, measurement.hearingProtection) :
  null;

  return (
    <div className="modal-fullscreen-overlay" onClick={onClose}>
            <div className="modal-fullscreen-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{

          background: `linear-gradient(135deg, ${riskLevel.color}20, ${riskLevel.color}05)`,
          borderBottom: `2px solid ${riskLevel.color}`




        }} className="p-[1.5rem] flex justify-space-between items-center mb-[1.5rem]">
                    <div className="flex items-center gap-4">
                        <div style={{


              background: `linear-gradient(135deg, ${riskLevel.color}, ${riskLevel.color}cc)`






            }} className="w-[64px] h-[64px] rounded-[var(--radius-xl)] flex flex-col items-center justify-center text-[#fff]">
                            <Volume2 size={28} strokeWidth={2.5} />
                            <span className="text-[1.25rem] font-[900] line-height-[1]">
                                {parseFloat(measurement.levels.lavg) || 0}
                            </span>
                            <span className="text-[0.6rem] font-[700]">dB(A)</span>
                        </div>
                        <div>
                            <h2 className="m-0 text-2xl font-black">
                                {measurement.workerName}
                            </h2>
                            <p className="m-[0.25rem_0_0_0] text-[var(--color-text-muted)] text-[0.9rem]">
                                {measurement.location || 'Sin ubicación'} • {riskLevel.label}
                            </p>
                        </div>
                    </div>
                    <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
            
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Niveles */}
                <div className="grid grid-template-columns-[repeat(3,_1fr)] gap-[1rem] mb-[1.5rem]">




          
                    <LevelDetail label="Lavg (Promedio)" value={`${measurement.levels.lavg || '-'} dB(A)`} />
                    <LevelDetail label="Dosis D%" value={`${measurement.levels.dose || '-'} %`} />
                    <LevelDetail label="Lmax (Máximo)" value={`${measurement.levels.lmax || '-'} dB(A)`} />
                    <LevelDetail label="Lmin (Mínimo)" value={`${measurement.levels.lmin || '-'} dB(A)`} />
                    <LevelDetail label="Lpeak (Pico)" value={`${measurement.levels.lpeak || '-'} dB`} />
                    <LevelDetail label="Lex 8h" value={`${measurement.levels.lex8h || '-'} dB(A)`} />
                    <LevelDetail label="Duración" value={`${measurement.duration || '-'} horas`} />
                </div>

                {/* Protección auditiva */}
                {protection &&
        <div className="p-[1.25rem] bg-[#f0fdf4] border-[1px_solid_#16a34a] rounded-[var(--radius-xl)] mb-[1.5rem]">





          
                        <h3 className="text-[0.9rem] font-[800] mb-[0.75rem] text-[#16a34a] flex items-center gap-[0.5rem]">







            
                            <Headphones size={18} />
                            PROTECCIÓN AUDITIVA
                        </h3>
                        <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                            <div>
                                <div className="text-[0.75rem] font-[700] text-[var(--color-text-muted)] mb-[0.25rem]">
                                    Tipo de EPP
                                </div>
                                <div className="text-[1rem] font-[700] text-[var(--color-text)]">
                                    {protection.name}
                                </div>
                            </div>
                            <div>
                                <div className="text-[0.75rem] font-[700] text-[var(--color-text-muted)] mb-[0.25rem]">
                                    NRR (Reducción)
                                </div>
                                <div className="text-[1rem] font-[700] text-[#16a34a]">
                                    {protection.nrr} dB
                                </div>
                            </div>
                            <div>
                                <div className="text-[0.75rem] font-[700] text-[var(--color-text-muted)] mb-[0.25rem]">
                                    Nivel sin protección
                                </div>
                                <div className="text-[1rem] font-[700] text-[var(--color-text)]">
                                    {measurement.levels.lavg} dB(A)
                                </div>
                            </div>
                            <div>
                                <div className="text-[0.75rem] font-[700] text-[var(--color-text-muted)] mb-[0.25rem]">
                                    Nivel con protección
                                </div>
                                <div className="text-[1rem] font-[700] text-[#16a34a]">
                                    {attenuatedLevel} dB(A)
                                </div>
                            </div>
                        </div>
                    </div>
        }

                {/* Información adicional */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <InfoDetail label="Fecha" value={new Date(measurement.date).toLocaleDateString('es-AR')} />
                    <InfoDetail label="Tarea" value={measurement.task || '-'} />
                    <InfoDetail label="Equipo" value={measurement.equipment || '-'} />
                    <InfoDetail label="Técnico" value={measurement.technician || '-'} />
                    <InfoDetail label="Calibrado" value={measurement.calibrated ? '✓ Sí' : '✗ No'} />
                </div>

                {/* Observaciones */}
                {measurement.observations &&
        <div className="p-[1rem] bg-[var(--color-background)] rounded-[var(--radius-lg)] mb-[1.5rem]">




          
                        <h4 className="m-[0_0_0.5rem_0] text-[0.85rem] font-[700]">
                            Observaciones
                        </h4>
                        <p className="m-[0] text-[0.9rem] text-[var(--color-text)] line-height-[1.6]">
                            {measurement.observations}
                        </p>
                    </div>
        }

                {/* Límites de referencia */}
                <div className="p-[1rem] bg-[#fef2f2] border-[1px_solid_#fecaca] rounded-[var(--radius-lg)] mb-[1.5rem]">





          
                    <h4 className="m-[0_0_0.75rem_0] text-[0.85rem] font-[700] text-[#dc2626]">
                        <AlertTriangle size={16} className="display-[inline] mr-[0.5rem]" />
                        Límites de Referencia
                    </h4>
                    <div className="flex gap-[1rem] text-[0.8rem]">
                        <span className="text-[var(--color-text-muted)]">Acción: <strong>{NOISE_LIMITS.actionLevel} dB</strong></span>
                        <span className="text-[var(--color-text-muted)]">Obligatorio: <strong>{NOISE_LIMITS.actionLevelHigh} dB</strong></span>
                        <span className="text-[var(--color-text-muted)]">Límite: <strong>{NOISE_LIMITS.limitValue} dB</strong></span>
                    </div>
                </div>

                <button
          onClick={onClose}
          className="btn-primary w-[100%]">

          
                    Cerrar
                </button>
            </div>
        </div>);

}

function LevelDetail({ label, value }: {label: string;value: string;}) {
  return (
    <div className="p-[0.75rem] bg-[var(--color-background)] rounded-[var(--radius-lg)] text-center">




      
            <div className="text-[0.7rem] font-[700] text-[var(--color-text-muted)] uppercase mb-[0.25rem]">
                {label}
            </div>
            <div className="text-[1.1rem] font-[800] text-[var(--color-text)]">
                {value}
            </div>
        </div>);

}

function InfoDetail({ label, value }) {
  return (
    <div>
            <div className="text-[0.7rem] font-[700] text-[var(--color-text-muted)] uppercase mb-[0.25rem]">
                {label}
            </div>
            <div className="text-[0.95rem] font-[600] text-[var(--color-text)]">
                {value}
            </div>
        </div>);

}

function getColorForLevel(level) {
  if (level >= 120) return '#dc2626';
  if (level >= 100) return '#f59e0b';
  if (level >= 85) return '#eab308';
  return '#16a34a';
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  marginBottom: '0.5rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-input-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '0.95rem',
  fontWeight: 500,
  outline: 'none',
  transition: 'all var(--transition-fast)',
  boxSizing: 'border-box'
};