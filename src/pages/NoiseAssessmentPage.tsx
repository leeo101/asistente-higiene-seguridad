import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Search, Filter, Download, CheckCircle2,
  XCircle, Clock, User, Users, Calendar, AlertTriangle,
  Volume2, Activity, BarChart3, Eye, Trash2, Edit3, Printer } from
'lucide-react';
import ShareModal from '../components/ShareModal';
import NoiseAssessmentPdf from '../components/NoiseAssessmentPdf';
import CompanyLogo from '../components/CompanyLogo';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import ConfirmModal from '../components/ConfirmModal';

const NOISE_LIMITS = {
  actionLevel: 80,
  actionLevelHigh: 85,
  limitValue: 87,
  peakAction: 135,
  peakLimit: 140
};

export default function NoiseAssessmentPage(): React.ReactElement | null {
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    const saved = localStorage.getItem('noise_assessments_db');
    if (saved) setMeasurements(JSON.parse(saved));

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveMeasurements = (data: any[]) => {
    localStorage.setItem('noise_assessment_db', JSON.stringify(data));
    setMeasurements(data);
  };

  const calculateRiskLevel = (level: number) => {
    if (level >= NOISE_LIMITS.limitValue) return { level: 'critical', color: '#dc2626', label: 'CRÍTICO' };
    if (level >= NOISE_LIMITS.actionLevelHigh) return { level: 'high', color: '#f59e0b', label: 'ALTO' };
    if (level >= NOISE_LIMITS.actionLevel) return { level: 'medium', color: '#eab308', label: 'MEDIO' };
    return { level: 'low', color: '#16a34a', label: 'BAJO' };
  };

  const deleteMeasurement = (id: string) => {
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      saveMeasurements(measurements.filter((m) => m.id !== confirmModal.payload));
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredMeasurements = measurements.filter((m) =>
  m.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  m.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: measurements.length,
    critical: measurements.filter((m) => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'critical').length,
    avgLevel: measurements.length > 0 ?
    (measurements.reduce((sum, m) => sum + (parseFloat(m.levels.lavg) || 0), 0) / measurements.length).toFixed(1) :
    0
  };

  return (
    <div style={{ paddingBottom: isMobile ? '80px' : '2rem' }} className="min-h-[100vh] bg-[var(--color-background)]">
            {/* Header */}
            <div style={{


        padding: isMobile ? '1rem' : '1.5rem'




      }} className="bg-[var(--color-surface)] border-bottom-[1px_solid_var(--color-border)] sticky top-[0] z-[100] backdrop-filter-[blur(20px)]">
                <div className="flex items-center gap-[1rem] max-w-[1400px] m-[0_auto]">





          
                    <></>
                    <div className="flex-[1]">
                        <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} className="m-[0] font-[900]">
                            <Volume2 size={isMobile ? 20 : 24} className="display-[inline] mr-[0.5rem] vertical-align-[middle]" />
                            Evaluación de Ruido
                        </h1>
                        <p className="m-[0.25rem_0_0_0] text-[0.85rem] text-[var(--color-text-muted)]">
                            ISO 9612 • {measurements.length} mediciones
                        </p>
                    </div>
                    <button
            onClick={() => navigate('/noise-assessment/new')}
            className="btn-primary w-[auto] m-[0] p-[0.75rem_1.25rem] items-center gap-[0.5rem]"
            style={{



              display: isMobile ? 'none' : 'flex'


            }}>
            
                        <Plus size={20} strokeWidth={2.5} />
                        Nueva Medición
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ marginTop: isMobile ? '1rem' : '1.5rem' }}>
            <div style={{

          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',

          padding: isMobile ? '1rem' : '1.5rem'


        }} className="grid gap-[1rem] max-w-[1400px] m-[0_auto]">
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<Activity size={20} />} />
                <StatCard label="Críticas" value={stats.critical} color="#dc2626" icon={<AlertTriangle size={20} />} />
                <StatCard label="Promedio dB" value={stats.avgLevel} color="#8b5cf6" icon={<Volume2 size={20} />} />
            </div>

            {/* Search & Add Button Mobile */}
            {isMobile &&
        <div className="p-[0_1rem_1rem] flex gap-[0.75rem]">
                    <div className="flex-[1] relative">
                        <Search size={18} color="var(--color-text-muted)" className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)]" />
                        <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.75rem_1rem_0.75rem_2.5rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[0.95rem]" />








            
                    </div>
                    <button
            onClick={() => navigate('/noise-assessment/new')}
            className="btn-primary w-[auto] m-[0] p-[0_1rem] flex items-center justify-center">








            
                        <Plus size={20} />
                    </button>
                </div>
        }

            {/* Measurements List */}
            <div style={{
          padding: isMobile ? '0 1rem' : '0 1.5rem'





        }} className="max-w-[1400px] m-[0_auto] flex flex-col gap-[0.75rem]">
                {filteredMeasurements.length === 0 ?
          <EmptyStateIllustrated
            title="Sin Mediciones de Ruido"
            description="Comenzá a evaluar la exposición al ruido según ISO 9612 para proteger la salud auditiva."
            onAction={() => navigate('/noise-assessment/new')}
            icon={<Volume2 />} /> :


          filteredMeasurements.map((m) =>
          <MeasurementCard
            key={m.id}
            measurement={m}
            riskLevel={calculateRiskLevel(parseFloat(m.levels.lavg) || 0)}
            onView={() => setSelectedMeasurement(m)}
            onDelete={() => deleteMeasurement(m.id)}
            isMobile={isMobile} />

          )
          }
            </div>

            </div>

            {selectedMeasurement &&
      <DetailModal
        measurement={selectedMeasurement}
        onClose={() => setSelectedMeasurement(null)}
        isMobile={isMobile}
        onPrint={() => setShowShareModal(true)}
        calculateRiskLevel={calculateRiskLevel} />

      }

            {/* @ts-ignore */}
            <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Evaluación de Ruido"
        fileName={`Ruido_${selectedMeasurement?.workerName || 'Evaluacion'}.pdf`} />
      

            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <NoiseAssessmentPdf data={selectedMeasurement} />
            </div>

            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar medición?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}

// Componentes
function StatCard({ label, value, color, icon }: any) {
  return (
    <div className="card p-[1.25rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border-subtle)] flex items-center gap-[1rem]">






      
            <div style={{


        background: `linear-gradient(135deg, ${color}, ${color}cc)`





      }} className="w-[48px] h-[48px] rounded-[var(--radius-lg)] flex items-center justify-center text-[#fff]">
                {icon}
            </div>
            <div>
                <div className="text-[0.85rem] font-[600] text-[var(--color-text-muted)]">{label}</div>
                <div className="text-[2rem] font-[900] text-[var(--color-text)] line-height-[1]">{value}</div>
            </div>
        </div>);

}

function DetailModal({ measurement, onClose, isMobile, onPrint, calculateRiskLevel }: any) {
  const riskLevel = calculateRiskLevel(parseFloat(measurement.levels.lavg) || 0);

  return (
    <div style={{ alignItems: isMobile ? 'flex-end' : 'center', padding: isMobile ? '1rem' : '1.5rem' }} onClick={onClose} className="fixed inset-[0] bg-[rgba(0,0,0,0.7)] backdrop-filter-[blur(8px)] z-[9999] flex justify-center box-sizing-[border-box]">
            <div className="card w-[100%] max-w-[600px] max-height-[85vh] overflow-[auto] m-[0] box-sizing-[border-box] flex flex-col" style={{ borderRadius: isMobile ? '28px' : 'var(--radius-2xl)' }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-space-between items-center mb-[1.5rem] pb-[1rem] border-bottom-[1px_solid_var(--color-border)] p-[1.5rem_1.5rem_0]">
                    <h2 className="m-[0] text-[1.25rem] font-[900]">Detalle de Evaluación</h2>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>
                
                <div className="p-[0_1.5rem_1.5rem]">
                    <div style={{ background: `${riskLevel.color}10`, border: `1px solid ${riskLevel.color}30` }} className="text-center p-[1.5rem] rounded-[var(--radius-xl)] mb-[1.5rem]">
                        <Volume2 size={40} color={riskLevel.color} className="mb-[0.5rem]" />
                        <div className="text-[3rem] font-[900] text-[var(--color-text)] line-height-[1]">{measurement.levels.lavg}<span className="text-[1.5rem]">dB</span></div>
                        <div className="text-[0.9rem] text-[var(--color-text-muted)] mt-[0.5rem]">{measurement.workerName}</div>
                        <div className="mt-[0.75rem]">
                            <span style={{ background: riskLevel.color }} className="p-[0.35rem_0.85rem] text-[#fff] rounded-[var(--radius-full)] text-[0.75rem] font-[800]">{riskLevel.label}</span>
                        </div>
                    </div>

                    <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[1.5rem]">
                        <StatItem label="Ubicación" value={measurement.location} />
                        <StatItem label="Fecha" value={new Date(measurement.date).toLocaleDateString('es-AR')} />
                        <StatItem label="Duración" value={`${measurement.duration} hs`} />
                        <StatItem label="Turno" value={measurement.shift} />
                    </div>

                    <div className="flex gap-[1rem] mt-[1rem]">
                        <button
              onClick={onPrint} className="flex-[1] p-[1rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-primary)] rounded-[var(--radius-lg)] font-[700] cursor-pointer text-[var(--color-primary)] flex items-center justify-center gap-[0.5rem]">














              
                            <Printer size={18} />
                            Imprimir / PDF
                        </button>
                        <button onClick={onClose} className="btn-primary flex-[1] m-[0]">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>);

}

function StatItem({ label, value }: {label: string;value: any;}) {
  return (
    <div className="p-[1rem] bg-[var(--color-background)] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-border)]">
            <div className="text-[0.7rem] font-[700] text-[var(--color-text-muted)] uppercase mb-[0.25rem]">{label}</div>
            <div className="text-[0.95rem] font-[600] text-[var(--color-text)]">{value || '-'}</div>
        </div>);

}

function MeasurementCard({ measurement, riskLevel, onView, onDelete, isMobile }: any) {
  return (
    <div className="card flex items-center gap-[1rem]" style={{
      padding: isMobile ? '1rem' : '1.25rem',



      borderLeft: `4px solid ${riskLevel.color}`
    }}>
            <div style={{
        width: isMobile ? '56px' : '64px',
        height: isMobile ? '56px' : '64px',
        background: `${riskLevel.color}15`,





        border: `2px solid ${riskLevel.color}`

      }} className="rounded-[var(--radius-xl)] flex flex-col items-center justify-center flex-shrink-[0]">
                <Volume2 size={isMobile ? 20 : 24} color={riskLevel.color} />
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }} className="font-[900] text-[var(--color-text)] line-height-[1]">
                    {parseFloat(measurement.levels.lavg) || 0}
                </span>
            </div>

            <div className="flex-[1] min-width-[0]">
                <div className="flex items-center gap-[0.5rem] mb-[0.5rem] flex-wrap">
                    <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem' }} className="m-[0] font-[800] text-[var(--color-text)]">
                        {measurement.workerName}
                    </h3>
                    <span style={{

            background: `${riskLevel.color}15`,
            color: riskLevel.color




          }} className="p-[0.25rem_0.65rem] rounded-[var(--radius-full)] text-[0.7rem] font-[800] uppercase">
                        {riskLevel.label}
                    </span>
                </div>
                <div style={{ gap: isMobile ? '0.5rem' : '1rem' }} className="flex flex-wrap text-[0.85rem] text-[var(--color-text-muted)]">
                    <span>📅 {new Date(measurement.date).toLocaleDateString('es-AR')}</span>
                    <span>📍 {measurement.location || 'Sin ubicación'}</span>
                    <span>⏱️ {measurement.duration ? `${measurement.duration}h` : '-'}</span>
                </div>
            </div>

            <div className="flex gap-[0.5rem]">
                <button onClick={onView} className="p-[0.5rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-md)] cursor-pointer text-[var(--color-primary)]">
                    <Eye size={isMobile ? 16 : 18} />
                </button>
                <button onClick={onDelete} className="p-[0.5rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-md)] cursor-pointer text-[#ef4444]">
                    <Trash2 size={isMobile ? 16 : 18} />
                </button>
            </div>
        </div>);

}

function EmptyState({ onAdd, isMobile }: any) {
  return (
    <div style={{
      padding: isMobile ? '3rem 1rem' : '4rem 2rem'




    }} className="text-center bg-[var(--gradient-card)] rounded-[var(--radius-2xl)] border-[2px_dashed_var(--color-border)]">
            <div className="w-[80px] h-[80px] m-[0_auto_1.5rem] bg-[var(--color-background)] rounded-[50%] flex items-center justify-center">








        
                <Volume2 size={40} color="var(--color-text-muted)" />
            </div>
            <h3 className="m-[0_0_0.5rem_0] text-[1.25rem] font-[800]">Sin Mediciones</h3>
            <p className="m-[0_0_1.5rem_0] text-[var(--color-text-muted)] text-[0.95rem]">
                Comenzá a evaluar la exposición al ruido según ISO 9612
            </p>
            <button onClick={onAdd} className="btn-primary w-[auto] m-[0]">
                <Plus size={20} className="mr-[0.5rem]" />
                Primera Medición
            </button>
        </div>);

}