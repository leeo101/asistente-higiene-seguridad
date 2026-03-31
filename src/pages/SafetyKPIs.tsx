import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, TrendingUp, TrendingDown, Shield, AlertTriangle,
    Clock, Users, Calendar, RefreshCw, Info, Target, Activity,
    ChevronDown, ChevronUp, Save, Printer
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine
} from 'recharts';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Breadcrumbs from '../components/Breadcrumbs';
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
    ltifr: number;
    trifr: number;
    indiceSeveridad: number;
    tasaIncidencia: number;
    diasSinAccidentes: number;
}

function calcMetrics(entry: KPIEntry): KPIMetrics {
    const millon = 1_000_000;
    const horas = entry.horasTrabajadas || 0;
    const trabajadores = entry.numeroDeTrabajadores || 1;
    const conBaja = entry.accidentesConBaja || 0;
    const total = conBaja + (entry.accidentesSinBaja || 0);
    const dias = entry.diasPerdidos || 0;

    return {
        ltifr: horas > 0 ? parseFloat(((conBaja * millon) / horas).toFixed(2)) : 0,
        trifr: horas > 0 ? parseFloat(((total * millon) / horas).toFixed(2)) : 0,
        indiceSeveridad: horas > 0 ? parseFloat(((dias * millon) / horas).toFixed(2)) : 0,
        tasaIncidencia: parseFloat(((total / trabajadores) * 100).toFixed(2)),
        diasSinAccidentes: 0
    };
}

const infoTexts: Record<string, string> = {
    ltifr: 'Lost Time Injury Frequency Rate: accidentes con pérdida de tiempo × 1.000.000 / horas trabajadas. Estándar internacional ISO 45001.',
    trifr: 'Total Recordable Injury Frequency Rate: total de accidentes registrables × 1.000.000 / horas trabajadas.',
    indiceSeveridad: 'Días perdidos por accidente × 1.000.000 / horas trabajadas. Mide la gravedad de los accidentes.',
    tasaIncidencia: 'Total de accidentes / Número de trabajadores × 100. Indica cuántos trabajadores de cada 100 se accidentan.',
};

function KPICard({ title, value, unit, icon: Icon, color, gradient, infoKey, trend }:
    { title: string; value: number | string; unit: string; icon: any; color: string; gradient: string; infoKey?: string; trend?: number }) {
    const [showInfo, setShowInfo] = useState(false);
    return (
        <div style={{
            background: gradient,
            borderRadius: '20px',
            padding: '1.5rem',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            position: 'relative',
            transition: 'transform 0.2s',
            cursor: 'default'
        }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={26} color="#fff" />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {trend !== undefined && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800 }}>
                            {trend <= 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                            {Math.abs(trend).toFixed(1)}%
                        </span>
                    )}
                    {infoKey && (
                        <button
                            onClick={() => setShowInfo(s => !s)}
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: 4, cursor: 'pointer', color: '#fff', display: 'flex' }}
                            title="Ver definición"
                        >
                            <Info size={15} />
                        </button>
                    )}
                </div>
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '0.3rem', fontWeight: 600 }}>{title}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.3rem' }}>{unit}</div>
            {showInfo && infoKey && (
                <div style={{
                    position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8,
                    background: '#1e293b', color: '#fff', padding: '0.75rem 1rem',
                    borderRadius: 12, fontSize: '0.78rem', fontWeight: 500, zIndex: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)', lineHeight: 1.5
                }}>
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
    useDocumentTitle('KPIs de Seguridad');
    const navigate = useNavigate();

    const [entries, setEntries] = useState<KPIEntry[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<KPIEntry | null>(null);
    const [expandedInfo, setExpandedInfo] = useState('');

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
        let updated: KPIEntry[];
        if (editing) {
            updated = entries.map(e => e.id === editing.id ? entry : e);
        } else {
            const exists = entries.find(e => e.period === form.period);
            if (exists) {
                if (!confirm(`Ya existe un registro para ${getPeriodLabel(form.period)}. ¿Sobreescribir?`)) return;
                updated = entries.map(e => e.period === form.period ? entry : e);
            } else {
                updated = [...entries, entry];
            }
        }
        save(updated);
        setShowForm(false);
        setEditing(null);
        setForm(emptyForm);
        toast.success('KPIs guardados 📊');
    };

    const handleDelete = (id: string) => {
        if (!confirm('¿Eliminar este período?')) return;
        save(entries.filter(e => e.id !== id));
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
        return { label: e.label, LTIFR: m.ltifr, TRIFR: m.trifr, Severidad: m.indiceSeveridad };
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
        ltifr: { gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#ef4444' },
        trifr: { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#f59e0b' },
        severidad: { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#8b5cf6' },
        incidencia: { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#3b82f6' },
        dias: { gradient: 'linear-gradient(135deg, #10b981, #059669)', color: '#10b981' },
    };

    return (
        <div className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem', maxWidth: 1100 }}>
            <Breadcrumbs />

            {/* Header */}
            <div style={{
                marginBottom: '2rem', padding: '1.5rem 2rem',
                background: 'linear-gradient(135deg, #1e293b, #334155)',
                borderRadius: 24, display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: 56, height: 56, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(59,130,246,0.4)'
                    }}>
                        <BarChart3 size={30} color="#fff" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                            KPIs de Seguridad
                        </h1>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>
                            LTIFR • TRIFR • Severidad • Incidencia — Estándar ISO 45001
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
                    style={{
                        padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff',
                        border: 'none', borderRadius: 14, fontWeight: 800, fontSize: '0.9rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        boxShadow: '0 4px 15px rgba(59,130,246,0.4)'
                    }}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <KPICard
                            title="LTIFR" value={latestMetrics.ltifr} unit="× millón horas"
                            icon={AlertTriangle} infoKey="ltifr"
                            gradient={colorScheme.ltifr.gradient} color={colorScheme.ltifr.color}
                            trend={prevMetrics ? trendOf(latestMetrics.ltifr, prevMetrics.ltifr) : undefined}
                        />
                        <KPICard
                            title="TRIFR" value={latestMetrics.trifr} unit="× millón horas"
                            icon={Activity} infoKey="trifr"
                            gradient={colorScheme.trifr.gradient} color={colorScheme.trifr.color}
                            trend={prevMetrics ? trendOf(latestMetrics.trifr, prevMetrics.trifr) : undefined}
                        />
                        <KPICard
                            title="Índice de Severidad" value={latestMetrics.indiceSeveridad} unit="días × millón horas"
                            icon={Target} infoKey="indiceSeveridad"
                            gradient={colorScheme.severidad.gradient} color={colorScheme.severidad.color}
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
                                    <Line type="monotone" dataKey="LTIFR" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 5 }} name="LTIFR" />
                                    <Line type="monotone" dataKey="TRIFR" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 5 }} name="TRIFR" />
                                    <Line type="monotone" dataKey="Severidad" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 5 }} name="Severidad" />
                                    <ReferenceLine y={0} stroke="var(--color-border)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            ) : (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
                    <BarChart3 size={56} style={{ opacity: 0.15, marginBottom: '1rem' }} color="var(--color-text)" />
                    <p style={{ color: 'var(--color-text-muted)', fontWeight: 600, margin: 0 }}>
                        No hay datos de KPI aún. Ingresá el primer período para comenzar.
                    </p>
                    <button
                        onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
                        className="btn-primary"
                        style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <RefreshCw size={18} /> Ingresar Primer Período
                    </button>
                </div>
            )}

            {/* Definitions box */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', borderLeft: '4px solid #3b82f6' }}>
                <h4 style={{ margin: '0 0 0.8rem', fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={18} color="#3b82f6" /> Definiciones — Estándar ISO 45001 / OIT
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    <div><strong style={{ color: '#ef4444' }}>LTIFR:</strong> Accidentes c/baja × 1.000.000 ÷ Horas trabajadas</div>
                    <div><strong style={{ color: '#f59e0b' }}>TRIFR:</strong> Total accidentes × 1.000.000 ÷ Horas trabajadas</div>
                    <div><strong style={{ color: '#8b5cf6' }}>Severidad:</strong> Días perdidos × 1.000.000 ÷ Horas trabajadas</div>
                    <div><strong style={{ color: '#3b82f6' }}>Incidencia:</strong> Accidentes ÷ Trabajadores × 100</div>
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
                                    {['Período', 'Hrs Trab.', 'Trabaj.', 'A c/baja', 'A s/baja', 'Días perd.', 'LTIFR', 'TRIFR', 'Severidad', ''].map(h => (
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
                                            <td style={{ padding: '0.75rem 0.8rem', fontWeight: 800, color: '#ef4444' }}>{m.ltifr}</td>
                                            <td style={{ padding: '0.75rem 0.8rem', fontWeight: 800, color: '#f59e0b' }}>{m.trifr}</td>
                                            <td style={{ padding: '0.75rem 0.8rem', fontWeight: 800, color: '#8b5cf6' }}>{m.indiceSeveridad}</td>
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

            {/* Form Modal */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }} onClick={() => setShowForm(false)}>
                    <div style={{
                        background: 'var(--color-surface)', borderRadius: 24, padding: '2rem',
                        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.4)'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-text)' }}>
                            📊 {editing ? 'Editar' : 'Ingresar'} Período KPI
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Período (mes/año)</label>
                                <input type="month" value={form.period}
                                    onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                                    style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Horas Trabajadas</label>
                                <input type="number" value={form.horasTrabajadas || ''}
                                    onChange={e => setForm(f => ({ ...f, horasTrabajadas: +e.target.value }))}
                                    placeholder="Ej: 40000" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Número de Trabajadores</label>
                                <input type="number" value={form.numeroDeTrabajadores || ''}
                                    onChange={e => setForm(f => ({ ...f, numeroDeTrabajadores: +e.target.value }))}
                                    placeholder="Ej: 150" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Accidentes con Baja</label>
                                <input type="number" value={form.accidentesConBaja || ''}
                                    onChange={e => setForm(f => ({ ...f, accidentesConBaja: +e.target.value }))}
                                    placeholder="0" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Accidentes sin Baja</label>
                                <input type="number" value={form.accidentesSinBaja || ''}
                                    onChange={e => setForm(f => ({ ...f, accidentesSinBaja: +e.target.value }))}
                                    placeholder="0" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Días Perdidos</label>
                                <input type="number" value={form.diasPerdidos || ''}
                                    onChange={e => setForm(f => ({ ...f, diasPerdidos: +e.target.value }))}
                                    placeholder="0" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Enfermedades Profesionales</label>
                                <input type="number" value={form.enfermedadesProfesionales || ''}
                                    onChange={e => setForm(f => ({ ...f, enfermedadesProfesionales: +e.target.value }))}
                                    placeholder="0" style={inputStyle} />
                            </div>
                        </div>

                        {/* Preview */}
                        {form.horasTrabajadas > 0 && form.numeroDeTrabajadores > 0 && (
                            <div style={{ background: 'var(--color-background)', borderRadius: 14, padding: '1rem', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                                <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Preview de KPIs</div>
                                {(() => {
                                    const m = calcMetrics(form);
                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                            <span>LTIFR: <strong style={{ color: '#ef4444' }}>{m.ltifr}</strong></span>
                                            <span>TRIFR: <strong style={{ color: '#f59e0b' }}>{m.trifr}</strong></span>
                                            <span>Severidad: <strong style={{ color: '#8b5cf6' }}>{m.indiceSeveridad}</strong></span>
                                            <span>Incidencia: <strong style={{ color: '#3b82f6' }}>{m.tasaIncidencia}%</strong></span>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowForm(false); setEditing(null); }}
                                style={{ padding: '0.75rem 1.25rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--color-text)' }}>
                                Cancelar
                            </button>
                            <button onClick={handleSave}
                                style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Save size={18} /> Guardar KPIs
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
