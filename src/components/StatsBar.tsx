
import React, { useState, useEffect } from 'react';
import { ClipboardList, ShieldCheck, ScrollText, Camera, HardHat, TriangleAlert } from 'lucide-react';

const STATS_CONFIG = [
{ key: 'ats_history', label: 'ATS', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <ClipboardList size={18} /> },
{ key: 'ai_camera_history', label: 'Cámara IA', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', icon: <Camera size={18} /> },
{ key: 'tool_checklists_history', label: 'Checklists', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <ClipboardList size={18} /> },
{ key: 'reports_history', label: 'Informes', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: <ScrollText size={18} /> },
{ key: 'inspections_history', label: 'Inspecciones', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <ShieldCheck size={18} /> },
{ key: 'work_permits_history', label: 'Permisos', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: <HardHat size={18} /> }];


interface AnimatedNumberProps {
  value: number;
}

function AnimatedNumber({ value }: AnimatedNumberProps) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let curr = 0;
    const step = Math.max(1, Math.ceil(value / 20));
    const timer = setInterval(() => {
      curr += step;
      if (curr >= value) {setDisplayed(value);clearInterval(timer);} else
      setDisplayed(curr);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);
  return <>{displayed}</>;
}

export default function StatsBar() {
  const [stats, setStats] = useState([]);
  const [eppAlert, setEppAlert] = useState(0);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [safetyScore, setSafetyScore] = useState(100);

  useEffect(() => {
    // Load counts from localStorage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let monthTotal = 0;

    const computed = STATS_CONFIG.map((cfg) => {
      try {
        const items = JSON.parse(localStorage.getItem(cfg.key) || '[]');
        // Count this month
        const thisMonth = items.filter((i) => {
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
        const eppOk = aiHistory.filter((i) => i.ppeComplete).length;
        const eppFail = aiHistory.filter((i) => i.ppeComplete === false).length;
        currentCompliance = Math.round(eppOk / Math.max(eppOk + eppFail, 1) * 100);
      }
    } catch {/* ignore */}

    setStats(computed.map((s) => s.key === 'ai_camera_history' ? { ...s, compliance: currentCompliance } : s));
    setTotalThisMonth(monthTotal);

    // Check EPP alerts
    let ppeUrgent = 0;
    try {
      const ppe = JSON.parse(localStorage.getItem('ppe_items') || '[]');
      ppeUrgent = ppe.filter((item) => {
        if (!item.purchaseDate || !item.lifeMonths) return false;
        const expiry = new Date(item.purchaseDate);
        expiry.setMonth(expiry.getMonth() + Number(item.lifeMonths));
        const days = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return days <= 30;
      }).length;
      setEppAlert(ppeUrgent);
    } catch {/* ignore */}

    // Safety Score Calculation (Demo Logic)
    // Base 100
    // -10 per accident this month
    // +10 per 5 ATS/Inspections
    // -5 per urgent EPP alert
    let score = 100;
    const accidents = JSON.parse(localStorage.getItem('accident_history') || '[]');
    const accidentsThisMonth = accidents.filter((a) => new Date(a.date).getTime() >= monthStart).length;
    score -= accidentsThisMonth * 15;
    score += Math.min(20, Math.floor(monthTotal / 5) * 10);
    score -= ppeUrgent * 5;
    if (currentCompliance !== null) {
      score = Math.floor((score + currentCompliance) / 2);
    }
    setSafetyScore(Math.max(0, Math.min(100, score)));

  }, []);

  const hasAnyData = stats.some((s) => s.total > 0);
  if (!hasAnyData && eppAlert === 0) return null;

  return (
    <div className="mb-[2rem]">
            {/* Month summary */}
            <div className="flex items-center justify-space-between mb-[1rem] flex-wrap gap-[0.5rem]">
                <h2 className="m-[0] text-[1.05rem] font-[800] text-[var(--color-text)]">
                    📊 Actividad del mes
                </h2>
                {eppAlert > 0 &&
        <a href="/ppe-tracker" className="flex items-center gap-[0.4rem] bg-[rgba(239,68,68,0.1)] border-[1px_solid_rgba(239,68,68,0.25)] rounded-[20px] p-[0.3rem_0.8rem] text-[0.72rem] font-[800] text-[#ef4444] text-decoration-[none]">
                        <TriangleAlert size={12} /> {eppAlert} EPP por vencer
                    </a>
        }
            </div>

            <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(280px,_1fr))] gap-[1rem] mb-[1.2rem]">
                <div className="bg-[linear-gradient(135deg,_rgba(59,_130,_246,_0.15)_0%,_rgba(37,_99,_235,_0.05)_100%)] border-[1px_solid_rgba(59,_130,_246,_0.2)] rounded-[20px] p-[1.2rem] flex items-center gap-[1.2rem]">







          
                    <div style={{

            border: `4px solid ${safetyScore > 75 ? '#10b981' : safetyScore > 40 ? '#f59e0b' : '#ef4444'}22`


          }} className="w-[60px] h-[60px] rounded-[50%] flex items-center justify-center relative">
                        <div style={{
              inset: -4,

              borderTopColor: safetyScore > 75 ? '#10b981' : safetyScore > 40 ? '#f59e0b' : '#ef4444',
              transform: `rotate(${Math.min(360, safetyScore / 100 * 360)}deg)`

            }} className="absolute rounded-[50%] border-[4px_solid_transparent] transition-[transform_1s_ease-out]" />
                        <span className="text-[1.2rem] font-[900] text-[var(--color-text)]">{safetyScore}</span>
                    </div>
                    <div>
                        <div className="text-[0.9rem] font-[800] text-[var(--color-text)] mb-[0.2rem]">Índice de Seguridad</div>
                        <div className="text-[0.75rem] text-[var(--color-text-muted)] line-height-[1.3]">
                            {safetyScore > 85 ? 'Excelente desempeño preventivo.' : safetyScore > 60 ? 'Buen nivel, mantenga las inspecciones.' : 'Atención: Se requiere reforzar controles.'}
                        </div>
                    </div>
                </div>

                <div className="bg-[rgba(255,255,255,0.03)] border-[1px_solid_var(--color-border)] rounded-[20px] p-[1.2rem] flex flex-col justify-center">







          
                    <div className="flex justify-space-between items-center mb-[0.5rem]">
                        <span className="text-[0.8rem] font-[700] text-[var(--color-text-muted)]">Carga de Trabajo</span>
                        <span className="text-[0.8rem] font-[800] text-[var(--color-primary)]">{totalThisMonth} docs</span>
                    </div>
                    <div className="w-[100%] h-[8px] bg-[rgba(59,_130,_246,_0.1)] rounded-[4px] overflow-[hidden]">
                        <div style={{ width: `${Math.min(100, totalThisMonth / 20 * 100)}%` }} className="h-[100%] bg-[var(--color-primary)] rounded-[4px]" />
                    </div>
                    <p className="m-[0.5rem_0_0] text-[0.65rem] text-[var(--color-text-muted)]">Meta mensual: 20 documentos de prevención</p>
                </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-template-columns-[repeat(auto-fill,_minmax(130px,_1fr))] gap-[0.7rem]">
                {stats.filter((s) => s.total > 0).map((stat) =>
        <div key={stat.key} style={{ background: stat.bg, border: `1px solid ${stat.color}22` }} className="rounded-[14px] p-[1rem_0.9rem]">
                        <div style={{ color: stat.color }} className="flex items-center gap-[0.5rem] mb-[0.5rem]">
                            {stat.icon}
                            <span className="text-[0.72rem] font-[700] text-[var(--color-text-muted)]">{stat.label}</span>
                        </div>
                        <div style={{ color: stat.color }} className="text-[1.8rem] font-[900] line-height-[1]">
                            <AnimatedNumber value={stat.total} />
                        </div>
                        <div className="text-[0.65rem] text-[var(--color-text-muted)] mt-[0.3rem]">
                            {stat.thisMonth > 0 ? `+${stat.thisMonth} este mes` : 'total guardados'}
                        </div>
                        {stat.key === 'ai_camera_history' && stat.compliance !== null && stat.compliance !== undefined &&
          <div style={{ borderTop: `1px solid ${stat.color}33` }} className="mt-[0.6rem] pt-[0.6rem]">
                                <div style={{ color: stat.color }} className="flex justify-space-between text-[0.6rem] font-[800] mb-[0.2rem]">
                                    <span>Cumplimiento de EPP</span>
                                    <span>{stat.compliance}%</span>
                                </div>
                                <div style={{ background: `${stat.color}22` }} className="w-[100%] h-[4px] rounded-[2px] overflow-[hidden]">
                                    <div style={{ width: `${stat.compliance}%`, background: stat.color }} className="h-[100%] transition-[width_1s_ease-out]" />
                                </div>
                            </div>
          }
                    </div>
        )}
            </div>
        </div>);

}