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
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div style={{ textAlign: 'left', marginBottom: '2rem', marginTop: '1.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.3rem' }}>Hola, <span style={{ color: 'var(--color-primary)' }}>{userName}</span></h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Dashboard de Seguridad e Higiene</p>
            </div>

            <div className="card" style={{
                background: 'linear-gradient(135deg, var(--color-surface), rgba(59, 130, 246, 0.05))',
                border: '1px solid rgba(59, 130, 246, 0.1)',
                padding: '1rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    flexShrink: 0
                }}>
                    <img src="/logo.png" alt="Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>Aviso del Sistema</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{isSubscribed ? 'Bienvenido a la versión premium de Asistente H&S.' : 'Pásate a Premium para desbloquear todas las funciones.'}</p>
                </div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSubscribed ? '#10b981' : '#ef4444' }}></div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Historiales</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            className="card"
                            style={{ textAlign: 'center', padding: '1rem 0.2rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                            onClick={() => {
                                if (stat.key === 'ats_history') navigate('/ats-history');
                                else if (stat.key === 'fireload_history') navigate('/fire-load-history');
                                else if (stat.key === 'reports_history') navigate('/reports');
                                else if (stat.key === 'risk_matrix_history') navigate('/risk-matrix');
                                else navigate('/history');
                            }}
                        >
                            <div style={{ color: stat.color, marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                                {React.cloneElement(stat.icon, { size: 20 })}
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stat.value}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Accesos Rápidos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                    <Link to="/create-inspection" style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px' }}>
                                <PlusCircle size={28} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Nueva Inspección</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Checklist en obra/establecimiento</p>
                            </div>
                            <ChevronRight size={20} color="var(--color-border)" />
                        </div>
                    </Link>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <Link to="/ats" onClick={(e) => { if (!isSubscribed) { e.preventDefault(); navigate('/subscribe'); } }} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1rem', minHeight: '100px', justifyContent: 'center', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                                {!isSubscribed && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#ef4444' }}><Lock size={14} /></div>}
                                <div style={{ color: '#10b981', display: 'flex', justifyContent: 'center' }}><BarChart3 size={24} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>ATS</h4>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Seguridad</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/fire-load" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1rem', minHeight: '100px', justifyContent: 'center', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                                <div style={{ color: '#f97316', display: 'flex', justifyContent: 'center' }}><Flame size={24} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Fuego</h4>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Cálculo</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/risk-matrix" onClick={(e) => { if (!isSubscribed) { e.preventDefault(); navigate('/subscribe'); } }} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1rem', minHeight: '100px', justifyContent: 'center', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                                {!isSubscribed && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#ef4444' }}><Lock size={14} /></div>}
                                <div style={{ color: '#8b5cf6', display: 'flex', justifyContent: 'center' }}><ShieldAlert size={24} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Matrices</h4>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Riesgos</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/ergonomics" onClick={(e) => { if (!isSubscribed) { e.preventDefault(); navigate('/subscribe'); } }} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1rem', minHeight: '100px', justifyContent: 'center', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                                {!isSubscribed && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#ef4444' }}><Lock size={14} /></div>}
                                <div style={{ color: '#3b82f6', display: 'flex', justifyContent: 'center' }}><Accessibility size={24} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Ergonomía</h4>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Res. 886/15</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/reports" onClick={(e) => { if (!isSubscribed) { e.preventDefault(); navigate('/subscribe'); } }} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1rem', minHeight: '100px', justifyContent: 'center', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                                {!isSubscribed && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#ef4444' }}><Lock size={14} /></div>}
                                <div style={{ color: '#ec4899', display: 'flex', justifyContent: 'center' }}><FileText size={24} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Informes</h4>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Técnicos</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/legislation" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1rem', minHeight: '100px', justifyContent: 'center', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                                <div style={{ color: '#8b5cf6', display: 'flex', justifyContent: 'center' }}><Gavel size={24} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Leyes</h4>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Biblioteca</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/ai-camera" onClick={(e) => { if (!isSubscribed) { e.preventDefault(); navigate('/subscribe'); } }} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.6rem',
                                padding: '1rem',
                                minHeight: '100px',
                                justifyContent: 'center',
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))',
                                border: '1px solid var(--color-primary)'
                            }}>
                                {!isSubscribed && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#ef4444' }}><Lock size={14} /></div>}
                                <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'center' }}>
                                    <PlusCircle size={24} />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>Cámara IA</h4>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Escaneo</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/checklists" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.6rem',
                                padding: '1rem',
                                minHeight: '100px',
                                justifyContent: 'center',
                                textAlign: 'center',
                                border: '1px solid var(--color-border)',
                                background: 'rgba(59, 130, 246, 0.05)'
                            }}>
                                <div style={{ color: '#3b82f6', display: 'flex', justifyContent: 'center' }}>
                                    <ClipboardList size={24} />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Checklists</h4>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Herramientas</p>
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
