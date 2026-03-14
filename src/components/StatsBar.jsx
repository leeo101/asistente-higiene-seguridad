import React, { useEffect, useState } from 'react';
import { ClipboardList, ShieldCheck, ScrollText, Camera, HardHat, TriangleAlert } from 'lucide-react';

const STATS_CONFIG = [
    { key: 'ats_history', label: 'ATS', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <ClipboardList size={18} /> },
    { key: 'ai_camera_history', label: 'Cámara IA', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', icon: <Camera size={18} /> },
    { key: 'tool_checklists_history', label: 'Checklists', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <ClipboardList size={18} /> },
    { key: 'reports_history', label: 'Informes', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: <ScrollText size={18} /> },
    { key: 'inspections_history', label: 'Inspecciones', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <ShieldCheck size={18} /> },
    { key: 'work_permits_history', label: 'Permisos', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: <HardHat size={18} /> },
];

function AnimatedNumber({ value }) {
    const [displayed, setDisplayed] = useState(0);
    useEffect(() => {
        let curr = 0;
        const step = Math.max(1, Math.ceil(value / 20));
        const timer = setInterval(() => {
            curr += step;
            if (curr >= value) { setDisplayed(value); clearInterval(timer); }
            else setDisplayed(curr);
        }, 40);
        return () => clearInterval(timer);
    }, [value]);
    return <>{displayed}</>;
}

export default function StatsBar() {
    const [stats, setStats] = useState([]);
    const [eppAlert, setEppAlert] = useState(0);
    const [totalThisMonth, setTotalThisMonth] = useState(0);

    useEffect(() => {
        // Load counts from localStorage
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        let monthTotal = 0;

        const computed = STATS_CONFIG.map(cfg => {
            try {
                const items = JSON.parse(localStorage.getItem(cfg.key) || '[]');
                // Count this month
                const thisMonth = items.filter(i => {
                    const d = new Date(i.fecha || i.date || i.createdAt || i.addedAt);
                    return d.getTime() >= monthStart;
                }).length;
                monthTotal += thisMonth;
                return { ...cfg, total: items.length, thisMonth };
            } catch {
                return { ...cfg, total: 0, thisMonth: 0 };
            }
        });

        // Calculate AI Camera Compliance
        let currentCompliance = null;
        try {
            const aiHistory = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');
            if (aiHistory.length > 0) {
                const eppOk = aiHistory.filter(i => i.ppeComplete).length;
                const eppFail = aiHistory.filter(i => i.ppeComplete === false).length;
                currentCompliance = Math.round((eppOk / Math.max(eppOk + eppFail, 1)) * 100);
            }
        } catch { /* ignore */ }

        setStats(computed.map(s => s.key === 'ai_camera_history' ? { ...s, compliance: currentCompliance } : s));
        setTotalThisMonth(monthTotal);

        // Check EPP alerts
        let ppeUrgent = 0;
        try {
            const ppe = JSON.parse(localStorage.getItem('ppe_items') || '[]');
            ppeUrgent = ppe.filter(item => {
                if (!item.purchaseDate || !item.lifeMonths) return false;
                const expiry = new Date(item.purchaseDate);
                expiry.setMonth(expiry.getMonth() + Number(item.lifeMonths));
                const days = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
                return days <= 30;
            }).length;
            setEppAlert(ppeUrgent);
        } catch { /* ignore */ }

        // Safety Score Calculation (Demo Logic)
        // Base 100
        // -10 per accident this month
        // +10 per 5 ATS/Inspections
        // -5 per urgent EPP alert
        let score = 100;
        const accidents = JSON.parse(localStorage.getItem('accident_history') || '[]');
        const accidentsThisMonth = accidents.filter(a => new Date(a.date).getTime() >= monthStart).length;
        score -= (accidentsThisMonth * 15);
        score += Math.min(20, Math.floor(monthTotal / 5) * 10);
        score -= (ppeUrgent * 5);
        if (currentCompliance !== null) {
            score = Math.floor((score + currentCompliance) / 2);
        }
        setSafetyScore(Math.max(0, Math.min(100, score)));

    }, []);

    const [safetyScore, setSafetyScore] = useState(100);

    const hasAnyData = stats.some(s => s.total > 0);
    if (!hasAnyData && eppAlert === 0) return null;

    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* Month summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)' }}>
                    📊 Actividad del mes
                </h2>
                {eppAlert > 0 && (
                    <a href="/ppe-tracker" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '20px', padding: '0.3rem 0.8rem', fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', textDecoration: 'none' }}>
                        <TriangleAlert size={12} /> {eppAlert} EPP por vencer
                    </a>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.2rem' }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '20px',
                    padding: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.2rem'
                }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        border: `4px solid ${safetyScore > 75 ? '#10b981' : safetyScore > 40 ? '#f59e0b' : '#ef4444'}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute', inset: -4, borderRadius: '50%',
                            border: '4px solid transparent',
                            borderTopColor: safetyScore > 75 ? '#10b981' : safetyScore > 40 ? '#f59e0b' : '#ef4444',
                            transform: `rotate(${Math.min(360, (safetyScore / 100) * 360)}deg)`,
                            transition: 'transform 1s ease-out'
                        }} />
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-text)' }}>{safetyScore}</span>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.2rem' }}>Índice de Seguridad</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                            {safetyScore > 85 ? 'Excelente desempeño preventivo.' : safetyScore > 60 ? 'Buen nivel, mantenga las inspecciones.' : 'Atención: Se requiere reforzar controles.'}
                        </div>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px',
                    padding: '1.2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Carga de Trabajo</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>{totalThisMonth} docs</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (totalThisMonth / 20) * 100)}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }} />
                    </div>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Meta mensual: 20 documentos de prevención</p>
                </div>
            </div>

            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.7rem' }}>
                {stats.filter(s => s.total > 0).map(stat => (
                    <div key={stat.key} style={{ background: stat.bg, border: `1px solid ${stat.color}22`, borderRadius: '14px', padding: '1rem 0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: stat.color }}>
                            {stat.icon}
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{stat.label}</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                            <AnimatedNumber value={stat.total} />
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                            {stat.thisMonth > 0 ? `+${stat.thisMonth} este mes` : 'total guardados'}
                        </div>
                        {stat.key === 'ai_camera_history' && stat.compliance !== null && stat.compliance !== undefined && (
                            <div style={{ marginTop: '0.6rem', borderTop: `1px solid ${stat.color}33`, paddingTop: '0.6rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 800, marginBottom: '0.2rem', color: stat.color }}>
                                    <span>Cumplimiento de EPP</span>
                                    <span>{stat.compliance}%</span>
                                </div>
                                <div style={{ width: '100%', height: '4px', background: `${stat.color}22`, borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${stat.compliance}%`, height: '100%', background: stat.color, transition: 'width 1s ease-out' }} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
