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
            <div style={{ textAlign: 'left', marginBottom: '2.5rem', marginTop: '1.5rem', padding: '0 0.5rem' }}>
                <h1 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '0.2rem', color: '#172B4D', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                    Hola, <br />
                    <span style={{ color: 'var(--color-primary)' }}>{userName}</span>
                </h1>
                <p style={{ color: '#6B778C', fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: 500 }}>Dashboard de Seguridad e Higiene</p>
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

            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#172B4D' }}>Historiales</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            className="card"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                padding: '1.2rem',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                background: '#fff',
                                margin: 0 /* Reset margin if card has it */
                            }}
                            onClick={() => {
                                if (stat.key === 'ats_history') navigate('/ats-history');
                                else if (stat.key === 'fireload_history') navigate('/fire-load-history');
                                else if (stat.key === 'reports_history') navigate('/reports');
                                else if (stat.key === 'risk_matrix_history') navigate('/risk-matrix');
                                else navigate('/history');
                            }}
                        >
                            <div style={{ color: stat.color, marginBottom: '0.6rem' }}>
                                {React.cloneElement(stat.icon, { size: 24 })}
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#172B4D' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.65rem', color: '#6B778C', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#172B4D' }}>Accesos Rápidos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Link to="/create-inspection" style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', border: '1px solid var(--color-border)', background: 'var(--color-primary)' }}>
                            <div style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PlusCircle size={40} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>Nueva Inspección</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Sincronización en la nube</p>
                            </div>
                            <ChevronRight size={24} style={{ color: 'white', opacity: 0.5 }} />
                        </div>
                    </Link>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <Link to="/ats" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.2rem', minHeight: '110px', gap: '0.5rem', margin: 0 }}>
                                <div style={{ color: '#10b981' }}><BarChart3 size={28} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#172B4D' }}>ATS</h4>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#6B778C' }}>Seguridad</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/fire-load" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.2rem', minHeight: '110px', gap: '0.5rem', margin: 0 }}>
                                <div style={{ color: '#f97316' }}><Flame size={28} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#172B4D' }}>Fuego</h4>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#6B778C' }}>Cálculo</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/risk-matrix" onClick={(e) => { if (!isSubscribed) { e.preventDefault(); navigate('/subscribe'); } }} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.2rem', minHeight: '110px', gap: '0.5rem', margin: 0 }}>
                                {!isSubscribed && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#ef4444' }}><Lock size={14} /></div>}
                                <div style={{ color: '#8b5cf6' }}><ShieldAlert size={28} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#172B4D' }}>Matrices</h4>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#6B778C' }}>Riesgos</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/ergonomics" onClick={(e) => { if (!isSubscribed) { e.preventDefault(); navigate('/subscribe'); } }} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.2rem', minHeight: '110px', gap: '0.5rem', margin: 0 }}>
                                {!isSubscribed && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#ef4444' }}><Lock size={14} /></div>}
                                <div style={{ color: '#3b82f6' }}><Accessibility size={28} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#172B4D' }}>Ergonomía</h4>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#6B778C' }}>Res. 886/15</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/reports" onClick={(e) => { if (!isSubscribed) { e.preventDefault(); navigate('/subscribe'); } }} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.2rem', minHeight: '110px', gap: '0.5rem', margin: 0 }}>
                                {!isSubscribed && <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#ef4444' }}><Lock size={14} /></div>}
                                <div style={{ color: '#ec4899' }}><FileText size={28} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#172B4D' }}>Informes</h4>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#6B778C' }}>Técnicos</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/legislation" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.2rem', minHeight: '110px', gap: '0.5rem', margin: 0 }}>
                                <div style={{ color: '#8b5cf6' }}><Gavel size={28} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#172B4D' }}>Leyes</h4>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#6B778C' }}>Biblioteca</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/ai-camera" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.2rem', minHeight: '110px', gap: '0.5rem', border: '1px solid #EBECF0', margin: 0 }}>
                                <div style={{ color: 'var(--color-primary)' }}><PlusCircle size={28} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#172B4D' }}>Cámara IA</h4>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#6B778C' }}>Escaneo Libre</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/checklists" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.2rem', minHeight: '110px', gap: '0.5rem', border: '1px solid #EBECF0', margin: 0 }}>
                                <div style={{ color: 'var(--color-primary)' }}><ClipboardList size={28} /></div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#172B4D' }}>Checklists</h4>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#6B778C' }}>Herramientas</p>
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
