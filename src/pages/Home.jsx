import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ClipboardList, PlusCircle, History, User, Settings,
    Flame, ShieldAlert, BarChart3, ChevronRight, Plus, FileText, Gavel,
    Accessibility, AlertTriangle, Lock
} from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [stats, setStats] = useState([
        { label: 'Inspecciones', value: 0, icon: <ClipboardList />, color: '#3b82f6', key: 'inspections_history' },
        { label: 'ATS Realizados', value: 0, icon: <BarChart3 />, color: '#10b981', key: 'ats_history' },
        { label: 'Checklists', value: 0, icon: <ClipboardList />, color: '#8b5cf6', key: 'tool_checklists_history' },
        { label: 'Carga de Fuego', value: 0, icon: <Flame />, color: '#f97316', key: 'fireload_history' },
        { label: 'Matrices', value: 0, icon: <ShieldAlert />, color: '#8b5cf6', key: 'risk_matrix_history' },
        { label: 'Informes', value: 0, icon: <FileText />, color: '#ec4899', key: 'reports_history' }
    ]);
    const [recentWorks, setRecentWorks] = useState([]);
    const [userName, setUserName] = useState('Profesional');

    useEffect(() => {
        // ... Load Profile Name omitted for brevity, keeping only the relevant parts if possible, but replace_file_content needs contiguous block.
        // Wait, handle the whole useEffect if needed or just the internal functions.
        // Let's replace the whole state and useEffect to be safe if they are close.

        // I'll try to target just the loadRecent part if it's contiguous.
    }, []); // This is not ideal.

    useEffect(() => {
        // Load Profile Name and Subscription Status
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('personalData');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                let name = parsed.name || 'Profesional';
                if (parsed.profession) {
                    const prof = parsed.profession.toLowerCase();
                    if (prof.includes('lic')) name = `Lic. ${name}`;
                    else if (prof.includes('téc')) name = `Téc. ${name}`;
                    else if (prof.includes('ing')) name = `Ing. ${name}`;
                }
                setUserName(name);
            }

            const status = localStorage.getItem('subscriptionStatus');
            setIsSubscribed(status === 'active');
        }

        // Load Stats
        const loadStats = () => {
            const newStats = stats.map(stat => {
                const history = localStorage.getItem(stat.key);
                const count = history ? JSON.parse(history).length : 0;
                return { ...stat, value: count };
            });
            setStats(newStats);
        };

        // Load Recent Works (Merge all histories and sort by date)
        const loadRecent = () => {
            const ats = JSON.parse(localStorage.getItem('ats_history') || '[]');
            const fire = JSON.parse(localStorage.getItem('fireload_history') || '[]');
            const insp = JSON.parse(localStorage.getItem('inspections_history') || '[]');
            const matrix = JSON.parse(localStorage.getItem('risk_matrix_history') || '[]');
            const reports = JSON.parse(localStorage.getItem('reports_history') || '[]');
            const tools = JSON.parse(localStorage.getItem('tool_checklists_history') || '[]');

            const combined = [
                ...ats.map(a => ({ id: a.id, title: a.empresa, subtitle: a.obra, date: a.fecha, type: 'ATS' })),
                ...fire.map(f => ({ id: f.id, title: f.empresa, subtitle: f.sector, date: f.createdAt, type: 'Carga Fuego' })),
                ...insp.map(i => ({ id: i.id, title: i.name, subtitle: i.location, date: i.date, type: 'Inspección' })),
                ...matrix.map(m => ({ id: m.id, title: m.name, subtitle: m.location, date: m.createdAt, type: 'Matriz' })),
                ...reports.map(r => ({ id: r.id, title: r.title, subtitle: r.company, date: r.createdAt, type: 'Informe' })),
                ...tools.map(t => ({ id: t.id, title: t.equipo, subtitle: t.empresa, date: t.fecha, type: 'Checklist' }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

            setRecentWorks(combined);
        };

        loadStats();
        loadRecent();
    }, []);

    return (
        <div className="container" style={{ paddingBottom: '3rem', marginTop: '3rem' }}>
            <div className="text-left mb-8 mt-6 px-2">
                <h1 className="text-3xl sm:text-5xl font-extrabold mb-1 text-[#172B4D]">Hola, <br /><span className="text-[var(--color-primary)]">{userName}</span></h1>
                <p className="text-slate-500 text-sm sm:text-lg mt-2 font-heading">Dashboard de Seguridad e Higiene</p>
            </div>

            <div className="card" style={{
                background: '#ffffff',
                padding: '1.5rem',
                marginBottom: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.2rem',
                boxShadow: '0 1px 3px rgba(9, 30, 66, 0.05)',
                color: '#172B4D'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    flexShrink: 0,
                    background: 'var(--color-background)',
                    borderRadius: '8px',
                    padding: '8px',
                    border: '1px solid var(--color-border)'
                }}>
                    <img src="/logo.png" alt="Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#172B4D' }}>Asistente H&S PRO</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B778C' }}>Bienvenido a tu suite de gestión profesional.</p>
                </div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-secondary)' }}></div>
            </div>

            <div className="mb-10">
                <h3 className="text-lg font-bold mb-4">Historiales</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            className="card flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-transform hover:scale-[1.02]"
                            onClick={() => {
                                if (stat.key === 'ats_history') navigate('/ats-history');
                                else if (stat.key === 'fireload_history') navigate('/fire-load-history');
                                else if (stat.key === 'reports_history') navigate('/reports');
                                else if (stat.key === 'risk_matrix_history') navigate('/risk-matrix');
                                else navigate('/history');
                            }}
                        >
                            <div style={{ color: stat.color }} className="mb-2">
                                {React.cloneElement(stat.icon, { size: 24 })}
                            </div>
                            <div className="text-xl font-extrabold">{stat.value}</div>
                            <div className="text-[0.65rem] text-slate-500 uppercase font-bold tracking-tight">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">Accesos Rápidos</h3>
                <div className="flex flex-col gap-4">
                    <Link to="/create-inspection" className="no-underline">
                        <div className="card flex items-center gap-4 p-5 border border-slate-100 hover:border-slate-300 transition-colors">
                            <div className="text-[var(--color-primary)] flex items-center justify-center h-12 w-12 shrink-0">
                                <PlusCircle size={32} />
                            </div>
                            <div className="flex-1">
                                <h4 className="m-0 text-lg font-bold text-[#172B4D]">Nueva Inspección</h4>
                                <p className="m-0 text-sm text-slate-500">Sincronización en la nube</p>
                            </div>
                            <ChevronRight size={20} className="text-slate-300" />
                        </div>
                    </Link>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Link to="/ats" className="no-underline">
                            <div className="card flex flex-col items-center justify-center text-center p-4 min-h-[110px] gap-2 hover:bg-slate-50 transition-colors">
                                <div className="text-[#10b981]"><BarChart3 size={28} /></div>
                                <div>
                                    <h4 className="m-0 text-sm font-bold">ATS</h4>
                                    <p className="m-0 text-[0.65rem] text-slate-500">Seguridad</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/fire-load" className="no-underline">
                            <div className="card flex flex-col items-center justify-center text-center p-4 min-h-[110px] gap-2 hover:bg-slate-50 transition-colors">
                                <div className="text-[#f97316]"><Flame size={28} /></div>
                                <div>
                                    <h4 className="m-0 text-sm font-bold">Fuego</h4>
                                    <p className="m-0 text-[0.65rem] text-slate-500">Cálculo</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/risk-matrix" onClick={(e) => { if (!isSubscribed) { e.preventDefault(); navigate('/subscribe'); } }} className="no-underline">
                            <div className="card relative flex flex-col items-center justify-center text-center p-4 min-h-[110px] gap-2 hover:bg-slate-50 transition-colors">
                                {!isSubscribed && <div className="absolute top-2 right-2 text-red-500"><Lock size={14} /></div>}
                                <div className="text-[#8b5cf6]"><ShieldAlert size={28} /></div>
                                <div>
                                    <h4 className="m-0 text-sm font-bold">Matrices</h4>
                                    <p className="m-0 text-[0.65rem] text-slate-500">Riesgos</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/ergonomics" onClick={(e) => { if (!isSubscribed) { e.preventDefault(); navigate('/subscribe'); } }} className="no-underline">
                            <div className="card relative flex flex-col items-center justify-center text-center p-4 min-h-[110px] gap-2 hover:bg-slate-50 transition-colors">
                                {!isSubscribed && <div className="absolute top-2 right-2 text-red-500"><Lock size={14} /></div>}
                                <div className="text-[#3b82f6]"><Accessibility size={28} /></div>
                                <div>
                                    <h4 className="m-0 text-sm font-bold">Ergonomía</h4>
                                    <p className="m-0 text-[0.65rem] text-slate-500">Res. 886/15</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/reports" onClick={(e) => { if (!isSubscribed) { e.preventDefault(); navigate('/subscribe'); } }} className="no-underline">
                            <div className="card relative flex flex-col items-center justify-center text-center p-4 min-h-[110px] gap-2 hover:bg-slate-50 transition-colors">
                                {!isSubscribed && <div className="absolute top-2 right-2 text-red-500"><Lock size={14} /></div>}
                                <div className="text-[#ec4899]"><FileText size={28} /></div>
                                <div>
                                    <h4 className="m-0 text-sm font-bold">Informes</h4>
                                    <p className="m-0 text-[0.65rem] text-slate-500">Técnicos</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/legislation" className="no-underline">
                            <div className="card flex flex-col items-center justify-center text-center p-4 min-h-[110px] gap-2 hover:bg-slate-50 transition-colors">
                                <div className="text-[#8b5cf6]"><Gavel size={28} /></div>
                                <div>
                                    <h4 className="m-0 text-sm font-bold">Leyes</h4>
                                    <p className="m-0 text-[0.65rem] text-slate-500">Biblioteca</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/ai-camera" className="no-underline">
                            <div className="card flex flex-col items-center justify-center text-center p-4 min-h-[110px] gap-2 border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="text-[var(--color-primary)]"><PlusCircle size={28} /></div>
                                <div>
                                    <h4 className="m-0 text-sm font-bold text-[#172B4D]">Cámara IA</h4>
                                    <p className="m-0 text-[0.65rem] text-slate-500">Escaneo Libre</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/checklists" className="no-underline">
                            <div className="card flex flex-col items-center justify-center text-center p-4 min-h-[110px] gap-2 border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="text-[var(--color-primary)]"><ClipboardList size={28} /></div>
                                <div>
                                    <h4 className="m-0 text-sm font-bold text-[#172B4D]">Checklists</h4>
                                    <p className="m-0 text-[0.65rem] text-slate-500">Herramientas</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '3.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Obras Recientes</h3>
                    {recentWorks.length > 0 && (
                        <Link to="/history" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Ver todo</Link>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {recentWorks.length > 0 ? (
                        recentWorks.map((work, i) => (
                            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: work.type === 'ATS' ? 'rgba(16, 185, 129, 0.1)' : work.type === 'Carga Fuego' ? 'rgba(249, 115, 22, 0.1)' : work.type === 'Matriz' ? 'rgba(139, 92, 246, 0.1)' : work.type === 'Informe' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                    color: work.type === 'ATS' ? '#10b981' : work.type === 'Carga Fuego' ? '#f97316' : work.type === 'Matriz' ? '#8b5cf6' : work.type === 'Informe' ? '#ec4899' : 'var(--color-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {work.type === 'ATS' ? <BarChart3 size={20} /> : work.type === 'Carga Fuego' ? <Flame size={20} /> : work.type === 'Matriz' ? <ShieldAlert size={20} /> : work.type === 'Informe' ? <FileText size={20} /> : <ClipboardList size={20} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{work.title}</h4>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{work.subtitle} • {work.type}</p>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                    {new Date(work.date || work.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>
                            <History size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No hay actividad reciente</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
