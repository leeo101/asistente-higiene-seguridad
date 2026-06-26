import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, TrendingUp, TrendingDown, Shield, AlertTriangle,
    Clock, Users, Calendar, RefreshCw, Info, Target, Activity,
    ChevronDown, ChevronUp, Save, Printer, X, ArrowLeft
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine
} from 'recharts';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'ehs_kpi_data';

interface KPIEntry {
    id: string;
    period: string; // "2024-03"
    label: string;  // "Mar 2024"
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
        indiceFrecuencia: horas > 0 ? parseFloat(((total * millon) / horas).toFixed(2)) : 0,
        indiceGravedad: horas > 0 ? parseFloat(((dias * mil) / horas).toFixed(2)) : 0,
        indiceFrecuenciaAusentismo: horas > 0 ? parseFloat(((conBaja * millon) / horas).toFixed(2)) : 0,
        tasaIncidencia: parseFloat(((total / trabajadores) * 100).toFixed(2)),
        diasSinAccidentes: 0
    };
}

const infoTexts: Record<string, string> = {
    indiceFrecuencia: 'Índice de Frecuencia (IF): Total de accidentes × 1.000.000 / horas trabajadas. Oficial SRT.',
    indiceFrecuenciaAusentismo: 'Índice de Frecuencia con Ausentismo (IFCA): Accidentes con baja × 1.000.000 / horas trabajadas.',
    indiceGravedad: 'Índice de Gravedad (IG): Días perdidos × 1.000 / horas trabajadas. Mide la gravedad oficial.',
    tasaIncidencia: 'Total de accidentes / Número de trabajadores × 100. Indica cuántos trabajadores de cada 100 se accidentan.',
};

function KPICard({ title, value, unit, icon: Icon, color, gradient, infoKey, trend }:
    { title: string; value: number | string; unit: string; icon: any; color: string; gradient: string; infoKey?: string; trend?: number }) {
    const [showInfo, setShowInfo] = useState(false);
    return (
        <div style={{
            background: gradient,
            borderRadius: '24px',
            padding: '1.25rem 1.5rem',
            color: '#ffffff',
            boxShadow: `0 12px 35px ${color}40, inset 0 1px 1px rgba(255,255,255,0.2)`,
            position: 'relative',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 20px 40px ${color}60, inset 0 1px 1px rgba(255,255,255,0.3)`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = `0 12px 35px ${color}40, inset 0 1px 1px rgba(255,255,255,0.2)`;
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Icon size={24} color="#fff" />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {trend !== undefined && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.25)', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, backdropFilter: 'blur(5px)' }}>
                            {trend <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                            {Math.abs(trend).toFixed(1)}%
                        </span>
                    )}
                    {infoKey && (
                        <button
                            onClick={() => setShowInfo(s => !s)}
                            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 10, padding: 6, cursor: 'pointer', color: '#fff', display: 'flex', transition: 'all 0.2s', backdropFilter: 'blur(5px)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                            title="Ver definición"
                        >
                            <Info size={16} />
                        </button>
                    )}
                </div>
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.2rem', fontWeight: 600, letterSpacing: '0.02em' }}>{title}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.4rem', fontWeight: 500 }}>{unit}</div>
            {showInfo && infoKey && (
                <div className="animate-fade-in" style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 12,
                    background: 'rgba(15, 23, 42, 0.95)', color: '#fff', padding: '1rem 1.25rem',
                    borderRadius: 16, fontSize: '0.82rem', fontWeight: 500, zIndex: 100,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)', lineHeight: 1.6,
                    backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ position: 'absolute', top: -6, right: 24, width: 12, height: 12, background: 'rgba(15, 23, 42, 0.95)', transform: 'rotate(45deg)', borderLeft: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                    <strong style={{ display: 'block', marginBottom: '0.3rem', color: color, fontSize: '0.9rem' }}>{title}</strong>
                    {infoTexts[infoKey]}
                </div>
            )}
        </div>
    );
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

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const parsed: KPIEntry[] = JSON.parse(raw);
                // Auto-import from accident_history if no entries
                setEntries(parsed.sort((a, b) => a.period.localeCompare(b.period)));
            } catch { }
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
            const updated = entries.map(e => e.id === editing.id ? entry : e);
            save(updated);
            setShowForm(false);
            setEditing(null);
            setForm(emptyForm);
            toast.success('KPIs actualizados 📊');
        } else {
            const exists = entries.find(e => e.period === form.period);
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
            save(entries.filter(e => e.id !== confirmModal.payload));
            toast.success('Período eliminado');
        } else if (confirmModal.actionType === 'overwrite') {
            const updated = entries.map(e => e.period === form.period ? confirmModal.payload : e);
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
            const lastDate = new Date(Math.max(...accidents.map(a => new Date(a.date || a.createdAt || 0).getTime())));
            return Math.floor((now.getTime() - lastDate.getTime()) / 86400000);
        } catch { return 365; }
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
            const monthAccidents = accidents.filter(a => {
                const date = new Date(a.date || a.createdAt);
                const aYearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return aYearMonth === currentYearMonth;
            });

            if (monthAccidents.length === 0) {
                toast.success('No hubo accidentes en este período.');
                setForm(prev => ({
                    ...prev,
                    accidentesConBaja: 0,
                    accidentesSinBaja: 0,
                    diasPerdidos: 0,
                }));
                return;
            }

            let conBaja = 0;
            let sinBaja = 0;
            let dias = 0;

            monthAccidents.forEach(a => {
                if (a.diasBaja || a.diasPerdidos) {
                    conBaja++;
                    dias += Number(a.diasBaja || a.diasPerdidos || 0);
                } else {
                    sinBaja++;
                }
            });

            setForm(prev => ({
                ...prev,
                accidentesConBaja: conBaja,
                accidentesSinBaja: sinBaja,
                diasPerdidos: dias,
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
        prev && prev > 0 ? ((curr - prev) / prev) * 100 : undefined;

    // Chart data
    const chartData = entries.map(e => {
        const m = calcMetrics(e);
        return { label: e.label, IF: m.indiceFrecuencia, IFCA: m.indiceFrecuenciaAusentismo, IG: m.indiceGravedad };
    });

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.7rem 0.9rem',
        borderRadius: 12, border: '1.5px solid var(--color-border)',
        background: 'var(--color-background)', color: 'var(--color-text)',
        fontSize: '0.9rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box'
    };
    const labelStyle: React.CSSProperties = {
        fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block'
    };

    const colorScheme = {
        indiceFrecuencia: { gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#ef4444' },
        indiceFrecuenciaAusentismo: { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#f59e0b' },
        indiceGravedad: { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#8b5cf6' },
        incidencia: { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#3b82f6' },
        dias: { gradient: 'linear-gradient(135deg, #10b981, #059669)', color: '#10b981' },
    };

    return (
        <div className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem', maxWidth: 1100 }}>
            {/* Dashboard View */}
            {!showForm ? (
                <>
                    <PremiumHeader onBack={showForm ? () => { setShowForm(false); } : undefined} 
                        title="KPIs de Seguridad"
                        subtitle="IF • IG • IFCA • Incidencia — Estadísticas Oficiales"
                        icon={<BarChart3 size={32} color="#ffffff"  />}
                        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                    />

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <></>
                    </div>
                    
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                            onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
                            style={{
                                padding: '0.75rem 1.5rem', background: '#10b981', color: '#fff',
                                border: 'none', borderRadius: 14, fontWeight: 800, fontSize: '0.9rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                boxShadow: '0 4px 15px rgba(16,185,129,0.4)', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <RefreshCw size={18} /> Ingresar Período
                        </button>
                    </div>

            {/* KPI Cards */}
            {latestMetrics ? (
                <>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📅 Último período: {latest?.label}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                        <KPICard
                            title="Índice de Frecuencia (IF)" value={latestMetrics.indiceFrecuencia} unit="× millón horas"
                            icon={AlertTriangle} infoKey="indiceFrecuencia"
                            gradient={colorScheme.indiceFrecuencia.gradient} color={colorScheme.indiceFrecuencia.color}
                            trend={prevMetrics ? trendOf(latestMetrics.indiceFrecuencia, prevMetrics.indiceFrecuencia) : undefined}
                        />
                        <KPICard
                            title="IFCA (Con Ausentismo)" value={latestMetrics.indiceFrecuenciaAusentismo} unit="× millón horas"
                            icon={Activity} infoKey="indiceFrecuenciaAusentismo"
                            gradient={colorScheme.indiceFrecuenciaAusentismo.gradient} color={colorScheme.indiceFrecuenciaAusentismo.color}
                            trend={prevMetrics ? trendOf(latestMetrics.indiceFrecuenciaAusentismo, prevMetrics.indiceFrecuenciaAusentismo) : undefined}
                        />
                        <KPICard
                            title="Índice de Gravedad (IG)" value={latestMetrics.indiceGravedad} unit="días × 1.000 horas"
                            icon={Target} infoKey="indiceGravedad"
                            gradient={colorScheme.indiceGravedad.gradient} color={colorScheme.indiceGravedad.color}
                        />
                        <KPICard
                            title="Tasa de Incidencia" value={`${latestMetrics.tasaIncidencia}%`} unit="por cada 100 trabajadores"
                            icon={Users} infoKey="tasaIncidencia"
                            gradient={colorScheme.incidencia.gradient} color={colorScheme.incidencia.color}
                        />
                        <KPICard
                            title="Días sin Accidentes" value={diasSinAccidentes} unit="días consecutivos"
                            icon={Shield}
                            gradient={diasSinAccidentes >= 30 ? colorScheme.dias.gradient : 'linear-gradient(135deg, #ef4444, #dc2626)'}
                            color={colorScheme.dias.color}
                        />
                    </div>

                    {/* Chart */}
                    {chartData.length > 1 && (
                        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                                📈 Evolución Histórica
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="label" fontSize={12} stroke="var(--color-text-muted)" />
                                    <YAxis fontSize={12} stroke="var(--color-text-muted)" />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: '0.82rem' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="IF" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 5 }} name="IF" />
                                    <Line type="monotone" dataKey="IFCA" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 5 }} name="IFCA" />
                                    <Line type="monotone" dataKey="IG" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 5 }} name="IG" />
                                    <ReferenceLine y={0} stroke="var(--color-border)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            ) : (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
                    <BarChart3 size={56} style={{ opacity: 0.15, marginBottom: '1rem', margin: '0 auto 1rem' }} color="var(--color-text)" />
                    <p style={{ color: 'var(--color-text-muted)', fontWeight: 600, margin: 0 }}>
                        No hay datos de KPI aún. Ingresá el primer período para comenzar.
                    </p>
                </div>
            )}

            {/* Definitions box */}
            <div style={{
                padding: '1.5rem', marginBottom: '2rem',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.1))',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
            }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ background: '#3b82f6', color: '#fff', borderRadius: '10px', padding: '0.4rem', display: 'flex' }}>
                        <Info size={16} strokeWidth={2.5} />
                    </div>
                    Fórmulas y Estándares de Cálculo (ISO 45001 / OIT)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.82rem', color: 'var(--color-text)', fontWeight: 500 }}>
                    <div style={{ background: 'var(--color-surface)', padding: '0.8rem 1rem', borderRadius: '12px', borderLeft: '4px solid #ef4444', boxShadow: 'var(--shadow-sm)' }}>
                        <strong style={{ color: '#ef4444', display: 'block', marginBottom: '0.2rem', fontSize: '0.9rem' }}>LTIFR</strong>
                        <span style={{ color: 'var(--color-text-muted)' }}>(Accidentes con baja × 1.000.000) ÷ Horas trabajadas</span>
                    </div>
                    <div style={{ background: 'var(--color-surface)', padding: '0.8rem 1rem', borderRadius: '12px', borderLeft: '4px solid #f59e0b', boxShadow: 'var(--shadow-sm)' }}>
                        <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '0.2rem', fontSize: '0.9rem' }}>TRIFR</strong>
                        <span style={{ color: 'var(--color-text-muted)' }}>(Total de accidentes × 1.000.000) ÷ Horas trabajadas</span>
                    </div>
                    <div style={{ background: 'var(--color-surface)', padding: '0.8rem 1rem', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', boxShadow: 'var(--shadow-sm)' }}>
                        <strong style={{ color: '#8b5cf6', display: 'block', marginBottom: '0.2rem', fontSize: '0.9rem' }}>Índice de Severidad</strong>
                        <span style={{ color: 'var(--color-text-muted)' }}>(Días perdidos × 1.000.000) ÷ Horas trabajadas</span>
                    </div>
                    <div style={{ background: 'var(--color-surface)', padding: '0.8rem 1rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6', boxShadow: 'var(--shadow-sm)' }}>
                        <strong style={{ color: '#3b82f6', display: 'block', marginBottom: '0.2rem', fontSize: '0.9rem' }}>Tasa de Incidencia</strong>
                        <span style={{ color: 'var(--color-text-muted)' }}>(Accidentes ÷ Total trabajadores) × 100</span>
                    </div>
                </div>
            </div>

            {/* History Table */}
            {entries.length > 0 && (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>Historial de Períodos</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-background)' }}>
                                    {['Período', 'Hrs Trab.', 'Trabaj.', 'A c/baja', 'A s/baja', 'Días perd.', 'IF', 'IFCA', 'IG', ''].map(h => (
                                        <th key={h} style={{ padding: '0.6rem 0.8rem', textAlign: 'left', fontWeight: 800, color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[...entries].reverse().map(e => {
                                    const m = calcMetrics(e);
                                    return (
                                        <tr key={e.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '0.75rem 0.8rem', fontWeight: 700 }}>{e.label}</td>
                                            <td style={{ padding: '0.75rem 0.8rem' }}>{e.horasTrabajadas.toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem 0.8rem' }}>{e.numeroDeTrabajadores}</td>
                                            <td style={{ padding: '0.75rem 0.8rem', color: '#ef4444', fontWeight: 700 }}>{e.accidentesConBaja}</td>
                                            <td style={{ padding: '0.75rem 0.8rem' }}>{e.accidentesSinBaja}</td>
                                            <td style={{ padding: '0.75rem 0.8rem' }}>{e.diasPerdidos}</td>
                                            <td style={{ padding: '0.75rem 0.8rem', fontWeight: 800, color: '#ef4444' }}>{m.indiceFrecuencia}</td>
                                            <td style={{ padding: '0.75rem 0.8rem', fontWeight: 800, color: '#f59e0b' }}>{m.indiceFrecuenciaAusentismo}</td>
                                            <td style={{ padding: '0.75rem 0.8rem', fontWeight: 800, color: '#8b5cf6' }}>{m.indiceGravedad}</td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button onClick={() => { setEditing(e); setForm(e); setShowForm(true); }}
                                                        style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.35rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                        Editar
                                                    </button>
                                                    <button onClick={() => handleDelete(e.id)}
                                                        style={{ background: 'transparent', border: '1px solid #ef4444', borderRadius: 8, padding: '0.35rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            </>
            ) : (
            <div className="animate-fade-in">
                {/* Form Full View */}
                <PremiumHeader onBack={showForm ? () => { setShowForm(false); } : undefined} 
                    title={editing ? 'Editar Período KPI' : 'Ingresar Período KPI'}
                    subtitle="Registrá los datos mensuales para calcular tus índices de seguridad automáticamente."
                    icon={<BarChart3 size={32} color="#ffffff"  />}
                    color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                />
                
                <div style={{ marginBottom: '1.5rem', marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => {
                            try {
                                const raw = localStorage.getItem('accident_history');
                                if (raw) {
                                    const accidents = JSON.parse(raw);
                                    const [year, month] = form.period.split('-');
                                    const filtered = accidents.filter((a: any) => {
                                        const d = new Date(a.date || a.createdAt);
                                        return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month);
                                    });
                                    const conBaja = filtered.filter((a: any) => a.hasLostDays || a.type === 'con_baja').length;
                                    const sinBaja = filtered.filter((a: any) => !a.hasLostDays && a.type !== 'con_baja').length;
                                    const diasPerdidos = filtered.reduce((acc: number, val: any) => acc + (Number(val.lostDays) || 0), 0);
                                    
                                    setForm(f => ({
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
                        style={{
                            padding: '0.6rem 1rem', background: '#3b82f6', color: '#fff',
                            border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            boxShadow: '0 4px 15px rgba(59,130,246,0.3)', transition: 'all 0.2s'
                        }}
                    >
                        <RefreshCw size={16} /> Auto-completar Incidentes
                    </button>
                </div>
                
                <div className="card" style={{ padding: '2.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', marginTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Período (mes/año)</label>
                            <input type="month" value={form.period}
                                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                                className="input-professional" />
                        </div>
                        <div>
                            <label style={labelStyle}>Horas Trabajadas</label>
                            <input type="number" value={form.horasTrabajadas || ''}
                                onChange={e => setForm(f => ({ ...f, horasTrabajadas: +e.target.value }))}
                                placeholder="Ej: 40000" className="input-professional" />
                        </div>
                        <div>
                            <label style={labelStyle}>Número de Trabajadores</label>
                            <input type="number" value={form.numeroDeTrabajadores || ''}
                                onChange={e => setForm(f => ({ ...f, numeroDeTrabajadores: +e.target.value }))}
                                placeholder="Ej: 150" className="input-professional" />
                        </div>
                        </div>
                    

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Acc. con Baja</label>
                            <input type="number" min="0" value={form.accidentesConBaja} onChange={e => setForm({ ...form, accidentesConBaja: Number(e.target.value) })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Acc. sin Baja</label>
                            <input type="number" min="0" value={form.accidentesSinBaja} onChange={e => setForm({ ...form, accidentesSinBaja: Number(e.target.value) })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Días Perdidos</label>
                            <input type="number" min="0" value={form.diasPerdidos} onChange={e => setForm({ ...form, diasPerdidos: Number(e.target.value) })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Enf. Profesionales</label>
                            <input type="number" min="0" value={form.enfermedadesProfesionales} onChange={e => setForm({ ...form, enfermedadesProfesionales: Number(e.target.value) })} style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(59,130,246,0.05)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(59,130,246,0.1)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
                            <strong>Tip:</strong> Puedes autocompletar los accidentes desde el módulo de investigación.
                        </div>
                        <button type="button" onClick={autoImportFromAccidents} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                            <RefreshCw size={16} /> Importar Accidentes
                        </button>
                    </div>

                    {/* Preview */}
                    {form.horasTrabajadas > 0 && form.numeroDeTrabajadores > 0 && (
                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: 16, padding: '1.25rem', border: '1px dashed rgba(59, 130, 246, 0.3)', marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 800, marginBottom: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={16} /> Previsualización de Índices
                            </div>
                            {(() => {
                                const m = calcMetrics(form);
                                return (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', color: 'var(--color-text-muted)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>IF</span> <strong style={{ color: '#ef4444', fontSize: '1.4rem' }}>{m.indiceFrecuencia}</strong></div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>IFCA</span> <strong style={{ color: '#f59e0b', fontSize: '1.4rem' }}>{m.indiceFrecuenciaAusentismo}</strong></div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>IG</span> <strong style={{ color: '#8b5cf6', fontSize: '1.4rem' }}>{m.indiceGravedad}</strong></div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Incidencia</span> <strong style={{ color: '#3b82f6', fontSize: '1.4rem' }}>{m.tasaIncidencia}%</strong></div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                <div className="no-print floating-action-bar">
                    <button
                        onClick={() => { setShowForm(false); setEditing(null); }}
                        className="btn-floating-action"
                        style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                    >
                        <X size={18} /> CANCELAR
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); requirePro(handleSave); }}
                        className="btn-floating-action"
                        style={{ background: '#10b981', color: '#ffffff', border: 'none' }}
                    >
                        <Save size={18} /> GUARDAR KPI
                    </button>
                </div>
            </div>
            )}

            <ConfirmModal 
                isOpen={confirmModal.isOpen} 
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                onConfirm={handleConfirmAction} 
                title={confirmModal.title} 
                message={confirmModal.message} 
                iconEmoji={confirmModal.actionType === 'delete' ? '🗑️' : '⚠️'} 
            />
        </div>
    );
}
