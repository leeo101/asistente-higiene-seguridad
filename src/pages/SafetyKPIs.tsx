import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, TrendingDown, Shield, AlertTriangle,
  Clock, Users, Calendar, RefreshCw, Info, Target, Activity,
  ChevronDown, ChevronUp, Save, Printer, X, ArrowLeft } from
'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine } from
'recharts';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';

const STORAGE_KEY = 'ehs_kpi_data';

interface KPIEntry {
  id: string;
  period: string; // "2024-03"
  label: string; // "Mar 2024"
  horasTrabajadas: number;
  numeroDeTrabajadores: number;
  accidentesConBaja: number;
  accidentesSinBaja: number;
  diasPerdidos: number;
  enfermedadesProfesionales: number;
  createdAt: string;
}

interface KPIMetrics {
  indiceFrecuencia: number; // IF
  indiceGravedad: number; // IG
  indiceFrecuenciaAusentismo: number; // IFCA
  tasaIncidencia: number;
  diasSinAccidentes: number;
}

function calcMetrics(entry: KPIEntry): KPIMetrics {
  const millon = 1_000_000;
  const mil = 1_000;
  const horas = entry.horasTrabajadas || 0;
  const trabajadores = entry.numeroDeTrabajadores || 1;
  const conBaja = entry.accidentesConBaja || 0;
  const total = conBaja + (entry.accidentesSinBaja || 0);
  const dias = entry.diasPerdidos || 0;

  return {
    indiceFrecuencia: horas > 0 ? parseFloat((total * millon / horas).toFixed(2)) : 0,
    indiceGravedad: horas > 0 ? parseFloat((dias * mil / horas).toFixed(2)) : 0,
    indiceFrecuenciaAusentismo: horas > 0 ? parseFloat((conBaja * millon / horas).toFixed(2)) : 0,
    tasaIncidencia: parseFloat((total / trabajadores * 100).toFixed(2)),
    diasSinAccidentes: 0
  };
}

const infoTexts: Record<string, string> = {
  indiceFrecuencia: 'Índice de Frecuencia (IF): Total de accidentes × 1.000.000 / horas trabajadas. Oficial SRT.',
  indiceFrecuenciaAusentismo: 'Índice de Frecuencia con Ausentismo (IFCA): Accidentes con baja × 1.000.000 / horas trabajadas.',
  indiceGravedad: 'Índice de Gravedad (IG): Días perdidos × 1.000 / horas trabajadas. Mide la gravedad oficial.',
  tasaIncidencia: 'Total de accidentes / Número de trabajadores × 100. Indica cuántos trabajadores de cada 100 se accidentan.'
};

function KPICard({ title, value, unit, icon: Icon, color, gradient, infoKey, trend
}: {title: string;value: number | string;unit: string;icon: any;color: string;gradient: string;infoKey?: string;trend?: number;}) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="relative flex flex-col justify-center p-5 rounded-3xl text-white shadow-xl cursor-default transition-all duration-300 group hover:-translate-y-1.5" style={{ background: gradient, boxShadow: `0 12px 35px ${color}40, inset 0 1px 1px rgba(255,255,255,0.2)` }}
    onMouseEnter={(e) => {e.currentTarget.style.boxShadow = `0 20px 40px ${color}60, inset 0 1px 1px rgba(255,255,255,0.3)`;}} onMouseLeave={(e) => {e.currentTarget.style.boxShadow = `0 12px 35px ${color}40, inset 0 1px 1px rgba(255,255,255,0.2)`;}}>
      
            <div className="flex justify-between items-start mb-3">
                <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                    <Icon size={24} color="#fff" />
                </div>
                <div className="flex items-center gap-2">
                    {trend !== undefined &&
          <span className="flex items-center gap-1 bg-white/25 px-2.5 py-1 rounded-full text-xs font-extrabold backdrop-blur-sm">
                            {trend <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                            {Math.abs(trend).toFixed(1)}%
                        </span>
          }
                    {infoKey &&
          <button
            onClick={() => setShowInfo((s) => !s)}
            className="bg-white/25 hover:bg-white/40 border-none rounded-xl p-1.5 cursor-pointer text-white flex transition-colors backdrop-blur-sm"
            title="Ver definición">
            
                            <Info size={16} />
                        </button>
          }
                </div>
            </div>
            <div className="text-sm/tight opacity-90 mb-1 font-semibold tracking-wide">{title}</div>
            <div className="text-[2rem] font-black leading-none drop-shadow-md">{value}</div>
            <div className="text-xs opacity-85 mt-1.5 font-medium">{unit}</div>
            {showInfo && infoKey &&
      <div className="animate-fade-in absolute top-full left-0 right-0 mt-3 bg-slate-900/95 text-white p-4 rounded-2xl text-[0.82rem] font-medium z-50 shadow-2xl backdrop-blur-md border border-white/10 leading-relaxed">
                    <div className="absolute -top-1.5 right-6 w-3 h-3 bg-slate-900/95 rotate-45 border-l border-t border-white/10" />
                    <strong className="block mb-1 text-[0.9rem]" style={{ color }}>{title}</strong>
                    {infoTexts[infoKey]}
                </div>
      }
        </div>);

}

const PERIOD_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
};

function getPeriodLabel(period: string) {
  const [year, month] = period.split('-');
  return `${PERIOD_LABELS[month] || month} ${year}`;
}

export default function SafetyKPIs(): React.ReactElement {
  const { requirePro } = usePaywall();
  useDocumentTitle('KPIs de Seguridad');
  const navigate = useNavigate();

  const [entries, setEntries] = useState<KPIEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KPIEntry | null>(null);
  const [expandedInfo, setExpandedInfo] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    actionType: '', // 'delete' | 'overwrite'
    payload: null as any
  });

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const emptyForm: KPIEntry = {
    id: '',
    period: currentPeriod,
    label: getPeriodLabel(currentPeriod),
    horasTrabajadas: 0,
    numeroDeTrabajadores: 0,
    accidentesConBaja: 0,
    accidentesSinBaja: 0,
    diasPerdidos: 0,
    enfermedadesProfesionales: 0,
    createdAt: ''
  };

  const [form, setForm] = useState<KPIEntry>(emptyForm);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionData, setPredictionData] = useState<any>(null);
  
  // Try to load prediction from local storage
  useEffect(() => {
    const raw = localStorage.getItem('ehs_prediction');
    if (raw) {
      try {
        setPredictionData(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const handlePredict = async () => {
    try {
      requirePro(async () => {
          setIsPredicting(true);
          const toastId = toast.loading('Analizando historial de accidentes con IA...');
          
          try {
            const rawAcc = localStorage.getItem('accident_history');
            const historyData = rawAcc ? JSON.parse(rawAcc) : [];
            
            if (historyData.length === 0) {
              toast.error('No hay suficientes accidentes registrados para predecir.', { id: toastId });
              setIsPredicting(false);
              return;
            }

            const token = await auth.currentUser?.getIdToken(true);
            const response = await fetch(`${API_BASE_URL}/api/predict-accidents`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ historyData })
            });

            if (!response.ok) throw new Error('Error en el servidor');

            const data = await response.json();
            setPredictionData(data);
            localStorage.setItem('ehs_prediction', JSON.stringify(data));
            toast.success('Predicción generada con éxito ✨', { id: toastId });
          } catch (err) {
            console.error(err);
            toast.error('Error al generar la predicción', { id: toastId });
          } finally {
            setIsPredicting(false);
          }
      });
    } catch(e) { }
  };

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: KPIEntry[] = JSON.parse(raw);
        // Auto-import from accident_history if no entries
        setEntries(parsed.sort((a, b) => a.period.localeCompare(b.period)));
      } catch {}
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [showForm]);

  const save = (data: KPIEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setEntries(data.sort((a, b) => a.period.localeCompare(b.period)));
  };

  const handleSave = () => {
    if (!form.horasTrabajadas || !form.numeroDeTrabajadores) {
      toast.error('Ingresá horas trabajadas y número de trabajadores');
      return;
    }
    const entry: KPIEntry = {
      ...form,
      id: editing?.id || `kpi-${Date.now()}`,
      label: getPeriodLabel(form.period),
      createdAt: editing?.createdAt || new Date().toISOString()
    };

    if (editing) {
      const updated = entries.map((e) => e.id === editing.id ? entry : e);
      save(updated);
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      toast.success('KPIs actualizados 📊');
    } else {
      const exists = entries.find((e) => e.period === form.period);
      if (exists) {
        setConfirmModal({
          isOpen: true,
          title: '¿Sobreescribir período?',
          message: `Ya existe un registro para ${getPeriodLabel(form.period)}.`,
          actionType: 'overwrite',
          payload: entry
        });
        return;
      } else {
        const updated = [...entries, entry];
        save(updated);
        setShowForm(false);
        setEditing(null);
        setForm(emptyForm);
        toast.success('KPIs guardados 📊');
      }
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar período?',
      message: 'Esta acción no se puede deshacer.',
      actionType: 'delete',
      payload: id
    });
  };

  const handleConfirmAction = () => {
    if (confirmModal.actionType === 'delete') {
      save(entries.filter((e) => e.id !== confirmModal.payload));
      toast.success('Período eliminado');
    } else if (confirmModal.actionType === 'overwrite') {
      const updated = entries.map((e) => e.period === form.period ? confirmModal.payload : e);
      save(updated);
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      toast.success('KPIs sobreescritos 📊');
    }
    setConfirmModal({ isOpen: false, title: '', message: '', actionType: '', payload: null });
  };

  // Calculate days without accidents from accident_history
  const getDaysSinceLastAccident = (): number => {
    try {
      const raw = localStorage.getItem('accident_history');
      if (!raw) return 365;
      const accidents = JSON.parse(raw) as any[];
      if (!accidents.length) return 365;
      const lastDate = new Date(Math.max(...accidents.map((a) => new Date(a.date || a.createdAt || 0).getTime())));
      return Math.floor((now.getTime() - lastDate.getTime()) / 86400000);
    } catch {return 365;}
  };

  const autoImportFromAccidents = () => {
    try {
      const raw = localStorage.getItem('accident_history');
      if (!raw) {
        toast.error('No hay registro de accidentes.');
        return;
      }
      const accidents = JSON.parse(raw) as any[];
      const currentYearMonth = form.period; // e.g., "2024-03"
      const monthAccidents = accidents.filter((a) => {
        const date = new Date(a.date || a.createdAt);
        const aYearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return aYearMonth === currentYearMonth;
      });

      if (monthAccidents.length === 0) {
        toast.success('No hubo accidentes en este período.');
        setForm((prev) => ({
          ...prev,
          accidentesConBaja: 0,
          accidentesSinBaja: 0,
          diasPerdidos: 0
        }));
        return;
      }

      let conBaja = 0;
      let sinBaja = 0;
      let dias = 0;

      monthAccidents.forEach((a) => {
        if (a.diasBaja || a.diasPerdidos) {
          conBaja++;
          dias += Number(a.diasBaja || a.diasPerdidos || 0);
        } else {
          sinBaja++;
        }
      });

      setForm((prev) => ({
        ...prev,
        accidentesConBaja: conBaja,
        accidentesSinBaja: sinBaja,
        diasPerdidos: dias
      }));
      toast.success(`Importados ${monthAccidents.length} accidentes del período.`);
    } catch {
      toast.error('Error al importar accidentes.');
    }
  };

  const diasSinAccidentes = getDaysSinceLastAccident();

  // Latest period metrics
  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const latestMetrics = latest ? calcMetrics(latest) : null;
  const prev = entries.length > 1 ? entries[entries.length - 2] : null;
  const prevMetrics = prev ? calcMetrics(prev) : null;

  const trendOf = (curr: number, prev: number | undefined) =>
  prev && prev > 0 ? (curr - prev) / prev * 100 : undefined;

  // Chart data
  const chartData = entries.map((e) => {
    const m = calcMetrics(e);
    return { label: e.label, IF: m.indiceFrecuencia, IFCA: m.indiceFrecuenciaAusentismo, IG: m.indiceGravedad };
  });




  const colorScheme = {
    indiceFrecuencia: { gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#ef4444' },
    indiceFrecuenciaAusentismo: { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#f59e0b' },
    indiceGravedad: { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#8b5cf6' },
    incidencia: { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#3b82f6' },
    dias: { gradient: 'linear-gradient(135deg, #10b981, #059669)', color: '#10b981' }
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 py-24">
            {/* Dashboard View */}
            {!showForm ?
      <>
                    <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
        title="KPIs de Seguridad"
        subtitle="IF • IG • IFCA • Incidencia — Estadísticas Oficiales"
        icon={<BarChart3 size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        

                    <div className="mb-[2rem] flex justify-start gap-4 flex-wrap">
                        <button
            onClick={() => {setShowForm(true);setEditing(null);setForm(emptyForm);}}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all"
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            
                            <RefreshCw size={18} /> Ingresar Período
                        </button>
                        
                        <button
            onClick={handlePredict}
            disabled={isPredicting}
            className="px-6 py-3 bg-[linear-gradient(135deg,_#6366f1,_#4f46e5)] hover:opacity-90 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
            onMouseEnter={(e) => { if (!isPredicting) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            
                            {isPredicting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            Análisis Predictivo de Accidentes (IA)
                        </button>
                    </div>

                    {predictionData && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 p-6 rounded-3xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Sparkles size={120} />
                            </div>
                            <h3 className="m-0 mb-4 flex items-center gap-3 text-indigo-700 dark:text-indigo-400 font-extrabold text-lg">
                                <Sparkles size={24} /> Predicción IA para el Próximo Mes
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 font-semibold mb-6 text-sm">
                                {predictionData.prediccionPrincipal}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <h4 className="text-rose-500 font-bold m-0 mb-2 uppercase text-xs">Zonas de Riesgo</h4>
                                    <ul className="m-0 pl-4 text-slate-600 dark:text-slate-400">
                                        {predictionData.zonasRiesgo?.map((z:string, i:number) => <li key={i}>{z}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <h4 className="text-amber-500 font-bold m-0 mb-2 uppercase text-xs">Tareas Críticas</h4>
                                    <ul className="m-0 pl-4 text-slate-600 dark:text-slate-400">
                                        {predictionData.tareasCriticas?.map((z:string, i:number) => <li key={i}>{z}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <h4 className="text-emerald-500 font-bold m-0 mb-2 uppercase text-xs">Recomendaciones</h4>
                                    <ul className="m-0 pl-4 text-slate-600 dark:text-slate-400">
                                        {predictionData.recomendaciones?.map((z:string, i:number) => <li key={i}>{z}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

            {/* KPI Cards */}
            {latestMetrics ?
                <>
                    <p className="m-0 mb-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        📅 Último período: {latest?.label}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                        <KPICard
              title="Índice de Frecuencia (IF)" value={latestMetrics.indiceFrecuencia} unit="× millón horas"
              icon={AlertTriangle} infoKey="indiceFrecuencia"
              gradient={colorScheme.indiceFrecuencia.gradient} color={colorScheme.indiceFrecuencia.color}
              trend={prevMetrics ? trendOf(latestMetrics.indiceFrecuencia, prevMetrics.indiceFrecuencia) : undefined} />
            
                        <KPICard
              title="IFCA (Con Ausentismo)" value={latestMetrics.indiceFrecuenciaAusentismo} unit="× millón horas"
              icon={Activity} infoKey="indiceFrecuenciaAusentismo"
              gradient={colorScheme.indiceFrecuenciaAusentismo.gradient} color={colorScheme.indiceFrecuenciaAusentismo.color}
              trend={prevMetrics ? trendOf(latestMetrics.indiceFrecuenciaAusentismo, prevMetrics.indiceFrecuenciaAusentismo) : undefined} />
            
                        <KPICard
              title="Índice de Gravedad (IG)" value={latestMetrics.indiceGravedad} unit="días × 1.000 horas"
              icon={Target} infoKey="indiceGravedad"
              gradient={colorScheme.indiceGravedad.gradient} color={colorScheme.indiceGravedad.color} />
            
                        <KPICard
              title="Tasa de Incidencia" value={`${latestMetrics.tasaIncidencia}%`} unit="por cada 100 trabajadores"
              icon={Users} infoKey="tasaIncidencia"
              gradient={colorScheme.incidencia.gradient} color={colorScheme.incidencia.color} />
            
                        <KPICard
              title="Días sin Accidentes" value={diasSinAccidentes} unit="días consecutivos"
              icon={Shield}
              gradient={diasSinAccidentes >= 30 ? colorScheme.dias.gradient : 'linear-gradient(135deg, #ef4444, #dc2626)'}
              color={colorScheme.dias.color} />
            
                    </div>

                    {/* Chart */}
                    {chartData.length > 1 &&
          <div className="bg-white dark:bg-slate-800 p-6 mb-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                            <h3 className="m-0 mb-6 text-lg font-extrabold text-slate-800 dark:text-slate-100">
                                📈 Evolución Histórica
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="label" fontSize={12} stroke="var(--color-text-muted)" />
                                    <YAxis fontSize={12} stroke="var(--color-text-muted)" />
                                    <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: '0.82rem' }} />
                
                                    <Legend />
                                    <Line type="monotone" dataKey="IF" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 5 }} name="IF" />
                                    <Line type="monotone" dataKey="IFCA" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 5 }} name="IFCA" />
                                    <Line type="monotone" dataKey="IG" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 5 }} name="IG" />
                                    <ReferenceLine y={0} stroke="var(--color-border)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
          }
                </> :

        <div className="bg-white dark:bg-slate-800 p-12 text-center mb-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                    <BarChart3 size={56} className="opacity-20 mx-auto mb-4 text-slate-800 dark:text-slate-200" />
                    <p className="text-slate-500 dark:text-slate-400 font-semibold m-0">
                        No hay datos de KPI aún. Ingresá el primer período para comenzar.
                    </p>
                </div>
        }

            {/* Definitions box */}
            <div className="p-[1.5rem] mb-[2rem] bg-[linear-gradient(135deg,_rgba(59,_130,_246,_0.05),_rgba(37,_99,_235,_0.1))] border-[1px_solid_rgba(59,_130,_246,_0.2)] rounded-[20px] box-shadow-[0_8px_32px_rgba(0,0,0,0.05)]">





          
                <h4 className="m-0 mb-4 text-[0.95rem] font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                    <div className="bg-blue-500 text-white rounded-xl p-1.5 flex">
                        <Info size={16} strokeWidth={2.5} />
                    </div>
                    Fórmulas y Estándares de Cálculo (ISO 45001 / OIT)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-[0.82rem] text-slate-800 dark:text-slate-200 font-medium">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border-l-4 border-red-500 shadow-sm">
                        <strong className="block mb-1 text-[0.9rem] text-[#ef4444]">LTIFR</strong>
                        <span className="text-slate-500 dark:text-slate-400">(Accidentes con baja × 1.000.000) ÷ Horas trabajadas</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border-l-4 border-amber-500 shadow-sm">
                        <strong className="block mb-1 text-[0.9rem] text-[#f59e0b]">TRIFR</strong>
                        <span className="text-slate-500 dark:text-slate-400">(Total de accidentes × 1.000.000) ÷ Horas trabajadas</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border-l-4 border-purple-500 shadow-sm">
                        <strong className="block mb-1 text-[0.9rem] text-[#8b5cf6]">Índice de Severidad</strong>
                        <span className="text-slate-500 dark:text-slate-400">(Días perdidos × 1.000.000) ÷ Horas trabajadas</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border-l-4 border-blue-500 shadow-sm">
                        <strong className="block mb-1 text-[0.9rem] text-[#3b82f6]">Tasa de Incidencia</strong>
                        <span className="text-slate-500 dark:text-slate-400">(Accidentes ÷ Total trabajadores) × 100</span>
                    </div>
                </div>
            </div>

            {/* History Table */}
            {entries.length > 0 &&
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                    <h3 className="m-0 mb-4 text-base font-extrabold text-slate-800 dark:text-slate-100">Historial de Períodos</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[0.85rem]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    {['Período', 'Hrs Trab.', 'Trabaj.', 'A c/baja', 'A s/baja', 'Días perd.', 'IF', 'IFCA', 'IG', ''].map((h) =>
                  <th key={h} className="px-3 py-2.5 text-left font-extrabold text-slate-500 dark:text-slate-400 text-xs uppercase whitespace-nowrap">{h}</th>
                  )}
                                </tr>
                            </thead>
                            <tbody>
                                {[...entries].reverse().map((e) => {
                  const m = calcMetrics(e);
                  return (
                    <tr key={e.id} className="border-t border-slate-200 dark:border-slate-700">
                                            <td className="px-3 py-3 font-bold text-slate-800 dark:text-slate-200">{e.label}</td>
                                            <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{e.horasTrabajadas.toLocaleString()}</td>
                                            <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{e.numeroDeTrabajadores}</td>
                                            <td className="px-3 py-3 font-bold text-red-500">{e.accidentesConBaja}</td>
                                            <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{e.accidentesSinBaja}</td>
                                            <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{e.diasPerdidos}</td>
                                            <td className="px-3 py-3 font-extrabold text-red-500">{m.indiceFrecuencia}</td>
                                            <td className="px-3 py-3 font-extrabold text-amber-500">{m.indiceFrecuenciaAusentismo}</td>
                                            <td className="px-3 py-3 font-extrabold text-purple-500">{m.indiceGravedad}</td>
                                            <td className="px-2 py-3">
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => {setEditing(e);setForm(e);setShowForm(true);}}
                          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 cursor-pointer text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                                        Editar
                                                    </button>
                                                    <button onClick={() => handleDelete(e.id)}
                          className="bg-transparent border border-red-500 rounded-lg px-2.5 py-1.5 cursor-pointer text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>);

                })}
                            </tbody>
                        </table>
                    </div>
                </div>
        }
            </> :

      <div className="animate-fade-in">
                {/* Form Full View */}
                <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
        title={editing ? 'Editar Período KPI' : 'Ingresar Período KPI'}
        subtitle="Registrá los datos mensuales para calcular tus índices de seguridad automáticamente."
        icon={<BarChart3 size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        
                
                <div className="mb-[1.5rem] mt-[1.5rem] flex gap-[1rem] flex-wrap">
                    <button
            onClick={() => {
              try {
                const raw = localStorage.getItem('accident_history');
                if (raw) {
                  const accidents = JSON.parse(raw);
                  const [year, month] = form.period.split('-');
                  const filtered = accidents.filter((a: any) => {
                    const d = new Date(a.date || a.createdAt);
                    return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
                  });
                  const conBaja = filtered.filter((a: any) => a.hasLostDays || a.type === 'con_baja').length;
                  const sinBaja = filtered.filter((a: any) => !a.hasLostDays && a.type !== 'con_baja').length;
                  const diasPerdidos = filtered.reduce((acc: number, val: any) => acc + (Number(val.lostDays) || 0), 0);

                  setForm((f) => ({
                    ...f,
                    accidentesConBaja: conBaja,
                    accidentesSinBaja: sinBaja,
                    diasPerdidos: diasPerdidos
                  }));
                  toast.success(`Se importaron ${filtered.length} registros del período.`);
                } else {
                  toast.error('No hay registros de accidentes guardados.');
                }
              } catch (e) {
                toast.error('Error al leer registros de accidentes.');
              }
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all">
            
                        <RefreshCw size={16} /> Auto-completar Incidentes
                    </button>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-10 mt-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Período (mes/año)</label>
                            <input type="month" value={form.period}
              onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
              className="input-professional" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Horas Trabajadas</label>
                            <input type="number" value={form.horasTrabajadas || ''}
              onChange={(e) => setForm((f) => ({ ...f, horasTrabajadas: +e.target.value }))}
              placeholder="Ej: 40000" className="input-professional" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número de Trabajadores</label>
                            <input type="number" value={form.numeroDeTrabajadores || ''}
              onChange={(e) => setForm((f) => ({ ...f, numeroDeTrabajadores: +e.target.value }))}
              placeholder="Ej: 150" className="input-professional" />
                        </div>
                        </div>
                    

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-[0.8rem] font-[600] text-[var(--color-text-muted)] mb-[6]">Acc. con Baja</label>
                            <input type="number" min="0" value={form.accidentesConBaja} onChange={(e) => setForm({ ...form, accidentesConBaja: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                        </div>
                        <div>
                            <label className="block text-[0.8rem] font-[600] text-[var(--color-text-muted)] mb-[6]">Acc. sin Baja</label>
                            <input type="number" min="0" value={form.accidentesSinBaja} onChange={(e) => setForm({ ...form, accidentesSinBaja: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                        </div>
                        <div>
                            <label className="block text-[0.8rem] font-[600] text-[var(--color-text-muted)] mb-[6]">Días Perdidos</label>
                            <input type="number" min="0" value={form.diasPerdidos} onChange={(e) => setForm({ ...form, diasPerdidos: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                        </div>
                        <div>
                            <label className="block text-[0.8rem] font-[600] text-[var(--color-text-muted)] mb-[6]">Enf. Profesionales</label>
                            <input type="number" min="0" value={form.enfermedadesProfesionales} onChange={(e) => setForm({ ...form, enfermedadesProfesionales: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center mb-6 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 gap-4">
                        <div className="text-[0.85rem] text-slate-700 dark:text-slate-300">
                            <strong>Tip:</strong> Puedes autocompletar los accidentes desde el módulo de investigación.
                        </div>
                        <button type="button" onClick={autoImportFromAccidents} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-none px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors shadow-lg shadow-blue-500/20">
                            <RefreshCw size={16} /> Importar Accidentes
                        </button>
                    </div>

                    {/* Preview */}
                    {form.horasTrabajadas > 0 && form.numeroDeTrabajadores > 0 &&
          <div className="bg-blue-500/5 rounded-2xl p-5 border border-dashed border-blue-500/30 mb-6">
                            <div className="font-extrabold mb-3 text-blue-500 flex items-center gap-2">
                                <Activity size={16} /> Previsualización de Índices
                            </div>
                            {(() => {
              const m = calcMetrics(form);
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col"><span className="text-xs font-semibold uppercase">IF</span> <strong className="text-red-500 text-2xl">{m.indiceFrecuencia}</strong></div>
                                        <div className="flex flex-col"><span className="text-xs font-semibold uppercase">IFCA</span> <strong className="text-amber-500 text-2xl">{m.indiceFrecuenciaAusentismo}</strong></div>
                                        <div className="flex flex-col"><span className="text-xs font-semibold uppercase">IG</span> <strong className="text-purple-500 text-2xl">{m.indiceGravedad}</strong></div>
                                        <div className="flex flex-col"><span className="text-xs font-semibold uppercase">Incidencia</span> <strong className="text-blue-500 text-2xl">{m.tasaIncidencia}%</strong></div>
                                    </div>);

            })()}
                        </div>
          }
                </div>

                <div className="no-print floating-action-bar">
                    <button
            onClick={() => {setShowForm(false);setEditing(null);}}
            className="btn-floating-action bg-[var(--color-surface)] text-[var(--color-text)] border-[1px_solid_var(--color-border)]">

            
                        <X size={18} /> CANCELAR
                    </button>
                    <button
            onClick={(e) => {e.preventDefault();requirePro(handleSave);}}
            className="btn-floating-action bg-[#10b981] text-[#ffffff] border-none">

            
                        <Save size={18} /> GUARDAR KPI
                    </button>
                </div>
            </div>
      }

            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        iconEmoji={confirmModal.actionType === 'delete' ? '🗑️' : '⚠️'} />
      
        </div>);

}