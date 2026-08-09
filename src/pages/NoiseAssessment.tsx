import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones, Gauge, Ear, Plus, Search,
  FileText, Eye, Edit3, Trash2, CheckCircle2,
  Calendar, Zap, Shield, AlertTriangle, BarChart3,
  Activity, Share2, Volume2, Download, User, MapPin, Clock
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import NoiseAssessmentPdf from '../components/NoiseAssessmentPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import { downloadCSV } from '../services/exportCsv';
import toast from 'react-hot-toast';

// Límites según ISO 9612 / Res. 295/03
const NOISE_LIMITS = {
  actionLevel: 80, // Nivel de acción inferior (dB)
  actionLevelHigh: 85, // Nivel de acción superior (dB)
  limitValue: 87, // Valor límite (dB)
  peakAction: 135, // Pico de acción (dB)
  peakLimit: 140 // Pico límite (dB)
};

const MEASUREMENT_TYPES = [
  { id: 'personal', name: 'Dosimetría Personal', icon: '👤' },
  { id: 'area', name: 'Medición de Área', icon: '📍' },
  { id: 'peak', name: 'Ruido de Impacto', icon: '💥' },
  { id: 'octave', name: 'Análisis Octavas', icon: '🎵' }
];

const HEARING_PROTECTION = [
  { id: 'earplugs', name: 'Tapones de espuma', nrr: 29 },
  { id: 'earmuffs', name: 'Orejeras', nrr: 25 },
  { id: 'dual', name: 'Protección dual', nrr: 35 }
];

export default function NoiseAssessment(): React.ReactElement | null {
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('measurements'); // measurements, workers, statistics
  const [shareItem, setShareItem] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = () => {
      const savedMeasurements = localStorage.getItem('noise_assessments_db');
      const savedWorkers = localStorage.getItem('noise_workers_db');
      if (savedMeasurements) {
        try { setMeasurements(JSON.parse(savedMeasurements)); } catch (e) {}
      }
      if (savedWorkers) {
        try { setWorkers(JSON.parse(savedWorkers)); } catch (e) {}
      }
    };

    loadData();

    const handleStorageChange = (e: any) => {
      if (e.key === 'noise_assessments_db' || e.key === 'noise_workers_db') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const calculateRiskLevel = (lavg: number) => {
    if (lavg >= NOISE_LIMITS.actionLevelHigh) {
      return { level: 'critical', color: '#dc2626', label: 'Crítico (>85 dB)' };
    }
    if (lavg >= NOISE_LIMITS.actionLevel) {
      return { level: 'warning', color: '#d97706', label: 'Precaución (80-85 dB)' };
    }
    return { level: 'normal', color: '#16a34a', label: 'Aceptable (<80 dB)' };
  };

  const calculateAttenuatedLevel = (lavg: number, nrr: number) => {
    if (!nrr) return lavg;
    const deratingFactor = 0.7;
    const effectiveAttenuated = (nrr - 7) * deratingFactor;
    return Math.max(0, Math.round((lavg - effectiveAttenuated) * 10) / 10);
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = measurements.filter((m) => m.id !== confirmModal.payload);
      setMeasurements(updated);
      localStorage.setItem('noise_assessments_db', JSON.stringify(updated));
      toast.success('Medición de ruido eliminada correctamente');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredMeasurements = useMemo(() => {
    return measurements.filter((m) => {
      const worker = String(m.workerName || '').toLowerCase();
      const location = String(m.location || '').toLowerCase();
      const task = String(m.task || '').toLowerCase();
      const term = String(searchTerm || '').toLowerCase();

      const matchesSearch = worker.includes(term) || location.includes(term) || task.includes(term);
      if (!matchesSearch) return false;

      if (filterType === 'critical') {
        return (parseFloat(m.levels?.lavg) || 0) >= 85;
      }
      if (filterType !== 'all') {
        return m.type === filterType;
      }
      return true;
    });
  }, [measurements, searchTerm, filterType]);

  const stats = useMemo(() => {
    const total = measurements.length;
    const critical = measurements.filter((m) => (parseFloat(m.levels?.lavg) || 0) >= NOISE_LIMITS.actionLevelHigh).length;
    const sumLavg = measurements.reduce((acc, curr) => acc + (parseFloat(curr.levels?.lavg) || 0), 0);
    const avgLevel = total > 0 ? Math.round((sumLavg / total) * 10) / 10 : 0;
    const workersExposed = new Set(measurements.map((m: any) => m.workerId)).size;
    return { total, critical, avgLevel, workersExposed };
  }, [measurements]);

  const handleExportCSV = () => {
    const rows = filteredMeasurements.map(item => ({
      'Fecha': item.date || '',
      'Trabajador': item.workerName || '',
      'Puesto / Tarea': item.task || '',
      'Ubicación': item.location || '',
      'Tipo Medición': item.type || '',
      'Nivel Lavg dB(A)': item.levels?.lavg || '0',
      'Protección Auditiva': item.hearingProtection || 'Sin EPP',
      'Técnico Evaluador': item.technician || ''
    }));
    downloadCSV(rows, `Mediciones_Ruido_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('📊 Protocolos de ruido exportados');
  };

  const columns = [
    {
      header: 'Fecha / Hora',
      accessor: 'date',
      sortable: true,
      render: (item: any) => (
        <span style={{ color: '#000000', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={14} className="text-amber-500" />
          {item.date ? new Date(item.date).toLocaleDateString('es-AR') : '-'}
        </span>
      )
    },
    {
      header: 'Trabajador / Puesto',
      accessor: 'workerName',
      sortable: true,
      render: (item: any) => (
        <div>
          <div style={{ color: '#000000', fontWeight: '900', fontSize: '14px', lineHeight: '1.2' }}>{item.workerName || 'Área General'}</div>
          <div style={{ color: '#1e293b', fontWeight: '800', fontSize: '12px', marginTop: '2px' }}>{item.task ? `Tarea: ${item.task}` : ''} {item.location ? `• ${item.location}` : ''}</div>
        </div>
      )
    },
    {
      header: 'Nivel Lavg dB(A)',
      accessor: 'levels',
      sortable: true,
      render: (item: any) => {
        const lavgVal = parseFloat(item.levels?.lavg) || 0;
        const risk = calculateRiskLevel(lavgVal);
        return (
          <span style={{ 
            backgroundColor: `${risk.color}15`, 
            color: risk.color, 
            border: `1px solid ${risk.color}40`,
            padding: '4px 10px', 
            borderRadius: '6px', 
            fontWeight: '900', 
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Volume2 size={14} /> {lavgVal} dB(A) ({risk.label})
          </span>
        );
      }
    },
    {
      header: 'EPP Auditivo',
      accessor: 'hearingProtection',
      render: (item: any) => (
        <span style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontWeight: '800', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Headphones size={14} className="text-blue-500" /> {item.hearingProtection || 'Sin EPP'}
        </span>
      )
    },
    {
      header: 'Técnico Evaluador',
      accessor: 'technician',
      render: (item: any) => (
        <span style={{ color: '#1e293b', fontWeight: '800', fontSize: '12px' }}>
          {item.technician || 'Especialista HSE'}
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Botón Editar estilo Aptitudes Médicas (Fondo Ámbar Sólido) */}
          <button 
            onClick={() => navigate('/noise-assessment/new', { state: { editData: item } })} 
            title="Editar Medición" 
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Edit3 size={12} /> Editar
          </button>

          {/* Botón Ver (Fondo Azul Sólido) */}
          <button 
            onClick={() => setSelectedMeasurement(item)} 
            title="Ver Detalle de Medición" 
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={12} /> Ver
          </button>

          {/* Botón Compartir / PDF (Fondo Esmeralda Sólido) */}
          <button 
            onClick={() => setShareItem(item)} 
            title="Exportar PDF o Compartir" 
            style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Share2 size={12} /> PDF
          </button>

          {/* Botón Eliminar (Fondo Rojo Sólido) */}
          <button 
            onClick={() => setConfirmModal({ isOpen: true, payload: item.id })} 
            title="Eliminar Medición"
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Protocolo Ruido - ${shareItem?.workerName || ''}`}
          text={shareItem ? `🔊 Protocolo de Medición de Ruido (Res. 85/12)\n👤 Trabajador: ${shareItem.workerName}\n📈 Nivel: ${shareItem.levels?.lavg} dB(A)\n📅 Fecha: ${new Date(shareItem.date).toLocaleDateString('es-AR')}` : ''}
          rawMessage={shareItem ? `🔊 Protocolo de Medición de Ruido (Res. 85/12)\n👤 Trabajador: ${shareItem.workerName}\n📈 Nivel: ${shareItem.levels?.lavg} dB(A)\n📅 Fecha: ${new Date(shareItem.date).toLocaleDateString('es-AR')}` : ''}
          elementIdToPrint="pdf-content"
          fileName={`Ruido_${shareItem?.workerName || 'Protocolo'}.pdf`} 
        />

        <div className="fixed left-0 opacity-0 top-0 pointer-events-none">
          {shareItem && <NoiseAssessmentPdf data={shareItem} />}
        </div>

        <PremiumHeader
          title="Evaluación de Ruido en Ambiente de Trabajo"
          subtitle="Mediciones de Nivel Sonoro Continuo Equivalente • Res. SRT 85/12 / Res. 295/03"
          icon={<Volume2 size={36} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" 
        />

        {/* Tarjetas resumen KPI Estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div 
            onClick={() => setFilterType('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'all' 
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}>
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Mediciones</span>
              <Activity size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
          </div>

          <div 
            onClick={() => setFilterType('critical')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'critical' 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}>
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Nivel Crítico (&gt;85 dB)</span>
              <AlertTriangle size={18} />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.critical}</div>
          </div>

          <div 
            onClick={() => setFilterType('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'all' 
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}>
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Promedio dB(A)</span>
              <Gauge size={18} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.avgLevel} <span className="text-xs font-normal">dB(A)</span></div>
          </div>

          <div 
            onClick={() => setFilterType('personal')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'personal' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md' 
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Trabajadores Evaluados</span>
              <User size={18} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.workersExposed}</div>
          </div>
        </div>

        {/* Toolbar de Acciones con Botones de Colores Vibrantes */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { id: 'all', label: 'Todas las mediciones', bg: '#2563eb', activeBg: '#1d4ed8' },
              { id: 'personal', label: '👤 Dosimetría Personal', bg: '#059669', activeBg: '#047857' },
              { id: 'area', label: '📍 Medición de Área', bg: '#0284c7', activeBg: '#0369a1' },
              { id: 'peak', label: '💥 Ruido de Impacto', bg: '#9333ea', activeBg: '#7e22ce' },
              { id: 'critical', label: '⚠️ Exposición Crítica', bg: '#dc2626', activeBg: '#991b1b' }
            ].map((tab) => {
              const isSelected = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  style={{
                    backgroundColor: isSelected ? tab.activeBg : tab.bg,
                    color: '#ffffff',
                    boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 6px rgba(0,0,0,0.12)',
                    transform: isSelected ? 'scale(1.04)' : 'none',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}>
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none' }}
              className="px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-colors cursor-pointer">
              <Download size={16} /> Exportar Excel / CSV
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigate('/noise-assessment/new');
              }}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
              className="px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-emerald-700 transition-colors cursor-pointer">
              <Plus size={16} /> Nueva Medición
            </button>
          </div>
        </div>

        {/* Data Table Estilo Aptitudes Médicas */}
        {filteredMeasurements.length === 0 ? (
          <EmptyStateIllustrated
            title="Sin Mediciones de Ruido"
            description="Comenzá a evaluar la exposición al ruido según ISO 9612 para proteger la salud auditiva."
            icon={<Volume2 />} 
          />
        ) : (
          <DataTable
            data={filteredMeasurements}
            columns={columns}
            searchPlaceholder="Buscar por trabajador, ubicación, tarea..."
          />
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar medición de ruido?"
          message="Esta acción eliminará la medición del registro permanentemente."
          iconEmoji="🗑️" 
        />
      </div>
    </AnimatedPage>
  );
}