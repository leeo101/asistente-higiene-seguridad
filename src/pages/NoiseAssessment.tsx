import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones, Gauge, Ear, Plus, Search,
  FileText, Eye, Edit3, Trash2, CheckCircle2,
  Calendar, Zap, Shield, AlertTriangle, BarChart3,
  Activity, Share2, Volume2, Download, User, MapPin, Clock,
  ArrowLeft, Printer
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
      'Empresa': item.empresa || item.razonSocial || '',
      'CUIT': item.cuit || '',
      'Sector': item.sector || item.location || '',
      'Puesto': item.puestoTrabajo || item.task || '',
      'Trabajador': item.workerName || item.trabajadorNombre || '',
      'CUIL': item.trabajadorCuil || '',
      'Fecha': item.date ? new Date(item.date).toLocaleDateString('es-AR') : '',
      'Tipo Medición': item.type || 'personal',
      'Nivel LAeq dB(A)': item.levels?.lavg || item.levels?.laeq || 0,
      'Nivel LEX 8h dB(A)': item.levels?.lex8h || item.levels?.lavg || 0,
      'Dosis %': item.levels?.dose || 0,
      'EPP Auditivo': typeof item.hearingProtection === 'object' ? item.hearingProtection?.tipoEPP : (item.hearingProtection || 'Sin EPP'),
      'Dictamen Res. SRT 85/12': item.dictamen || (parseFloat(item.levels?.lavg) > 85 ? 'SUPERA LMPE' : 'CONFORME'),
      'Técnico Evaluador': item.technician || ''
    }));
    downloadCSV(rows, `Protocolos_Ruido_SRT85_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('📊 Protocolos de ruido exportados correctamente');
  };

  const columns = [
    {
      header: 'Fecha Medición',
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
      header: 'Empresa / Sector',
      accessor: 'empresa',
      sortable: true,
      render: (item: any) => (
        <div>
          <div style={{ color: '#000000', fontWeight: '900', fontSize: '14px', lineHeight: '1.2' }}>
            {item.empresa || item.razonSocial || 'Empresa sin especificar'}
          </div>
          <div style={{ color: '#475569', fontWeight: '700', fontSize: '12px', marginTop: '2px' }}>
            📍 {item.sector || item.location || 'General'} {item.cuit ? `• CUIT: ${item.cuit}` : ''}
          </div>
        </div>
      )
    },
    {
      header: 'Trabajador / Puesto',
      accessor: 'workerName',
      sortable: true,
      render: (item: any) => (
        <div>
          <div style={{ color: '#000000', fontWeight: '900', fontSize: '13px', lineHeight: '1.2' }}>
            👤 {item.workerName || item.trabajadorNombre || 'Trabajador del Puesto'}
          </div>
          <div style={{ color: '#64748b', fontWeight: '600', fontSize: '11px', marginTop: '1px' }}>
            🛠️ Puesto: {item.puestoTrabajo || item.task || item.tarea || 'Operativo'}
          </div>
        </div>
      )
    },
    {
      header: 'Nivel Sonoro LAeq',
      accessor: 'levels',
      sortable: true,
      render: (item: any) => {
        const lavgVal = parseFloat(item.levels?.lavg || item.levels?.laeq || 0);
        const dosis = item.levels?.dose || Math.round((8 / (8 / Math.pow(2, (lavgVal - 85)/3))) * 100);
        const isCritical = lavgVal > 85;
        return (
          <div>
            <span style={{ 
              backgroundColor: isCritical ? '#fef2f2' : '#f0fdf4', 
              color: isCritical ? '#dc2626' : '#16a34a', 
              border: `1px solid ${isCritical ? '#fecdd3' : '#bbf7d0'}`,
              padding: '3px 8px', 
              borderRadius: '6px', 
              fontWeight: '900', 
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Volume2 size={13} /> {lavgVal} dB(A)
            </span>
            <span style={{ display: 'block', color: '#64748b', fontSize: '11px', fontWeight: '700', marginTop: '2px' }}>
              Dosis: {dosis}% • Jornada: {item.duracionJornadaHoras || item.duration || 8}h
            </span>
          </div>
        );
      }
    },
    {
      header: 'EPP Auditivo',
      accessor: 'hearingProtection',
      render: (item: any) => {
        const eppText = typeof item.hearingProtection === 'object'
          ? (item.hearingProtection?.tipoEPP || item.hearingProtection?.marcaModelo || 'Sin EPP')
          : (item.hearingProtection || 'Sin EPP');
        const nrr = typeof item.hearingProtection === 'object' ? item.hearingProtection?.nrr_snr : null;
        return (
          <div>
            <span style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Headphones size={13} className="text-blue-500" /> {eppText}
            </span>
            {nrr && (
              <span style={{ display: 'block', color: '#64748b', fontSize: '10px', fontWeight: '700', marginTop: '1px' }}>
                NRR: {nrr} dB
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Dictamen Res. 85/12',
      accessor: 'dictamen',
      render: (item: any) => {
        const lavgVal = parseFloat(item.levels?.lavg || item.levels?.laeq || 0);
        const isCritical = lavgVal > 85;
        const isAction = lavgVal >= 80 && lavgVal <= 85;
        if (isCritical) {
          return (
            <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={12} /> SUPERA LMPE
            </span>
          );
        }
        if (isAction) {
          return (
            <span style={{ backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '4px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} /> ALERTA (80-85)
            </span>
          );
        }
        return (
          <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> CONFORME
          </span>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setSelectedMeasurement(item)} 
            title="Ver Protocolo Oficial Anexo I" 
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '5px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>
            <FileText size={12} /> Ver PDF
          </button>

          <button 
            onClick={() => navigate('/noise-assessment/new', { state: { editData: item } })} 
            title="Editar Medición" 
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '5px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)' }}>
            <Edit3 size={12} /> Editar
          </button>

          <button 
            onClick={() => setShareItem(item)} 
            title="Exportar PDF o Compartir" 
            style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '5px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}>
            <Share2 size={12} /> Compartir
          </button>

          <button 
            onClick={() => setConfirmModal({ isOpen: true, payload: item.id })} 
            title="Eliminar Medición"
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '5px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)' }}>
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  if (selectedMeasurement) {
    return (
      <div className="print-only-wrapper min-h-[100vh] bg-slate-900 pb-12 pt-4">
        <div className="no-print flex items-center justify-between max-w-[210mm] mx-auto mb-4 px-4">
          <button 
            onClick={() => setSelectedMeasurement(null)} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs cursor-pointer border border-slate-700 transition-all">
            <ArrowLeft size={16} /> Volver al Historial
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-lg shadow-amber-500/30 transition-all">
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
        <NoiseAssessmentPdf data={selectedMeasurement} />
      </div>
    );
  }

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