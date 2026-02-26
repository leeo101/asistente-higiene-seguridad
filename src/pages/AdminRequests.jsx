import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Mail, Phone, Briefcase, RefreshCw, AlertCircle, Eye, Users, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminRequests() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
            const base = isLocal ? `http://${window.location.hostname}:3001` : '';

            const [reqRes, statsRes] = await Promise.all([
                fetch(`${base}/api/admin/requests`),
                fetch(`${base}/api/admin/stats`)
            ]);

            if (!reqRes.ok || !statsRes.ok) throw new Error('Error al cargar datos');

            const [reqData, statsData] = await Promise.all([
                reqRes.json(),
                statsRes.json()
            ]);

            setRequests(reqData);
            setStats(statsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta solicitud?')) return;

        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
            const fetchUrl = isLocal ? `http://${window.location.hostname}:3001/api/admin/requests/${id}` : `/api/admin/requests/${id}`;

            const response = await fetch(fetchUrl, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar');
            setRequests(requests.filter(req => req.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="container pb-20">
            <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="icon-wrapper" style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>
                        <UserPlus className="text-primary" size={24} />
                    </div>
                    <div>
                        <h1 className="header-title">Solicitudes de Acceso</h1>
                        <p className="header-subtitle">Usuarios esperando aprobación</p>
                    </div>
                </div>
                <button
                    onClick={fetchAll}
                    className="btn-secondary"
                    style={{ padding: '0.5rem', width: 'auto', borderRadius: '50%' }}
                    title="Actualizar lista"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </header>

            {stats && (
                <div style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart size={20} className="text-secondary" /> Estadísticas de la Página
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.8rem', borderRadius: '10px', color: '#3b82f6' }}>
                                <Eye size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.totalVisits}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Visitas Totales</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: '10px', color: '#10b981' }}>
                                <Users size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.uniqueUsers}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Usuarios Únicos</div>
                            </div>
                        </div>
                    </div>

                    {Object.keys(stats.pageHits).length > 0 && (
                        <div className="card" style={{ marginTop: '1rem', padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Uso por Sección</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                {Object.entries(stats.pageHits)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 6)
                                    .map(([page, hits]) => (
                                        <div key={page} style={{ flex: '1 1 150px', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page === '/' ? 'Inicio' : page}</div>
                                            <div style={{ fontWeight: 800 }}>{hits} clic{hits !== 1 ? 's' : ''}</div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} className="text-primary" /> Solicitudes Pendientes
            </h2>

            {error && (
                <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', gap: '0.8rem', color: '#ef4444' }}>
                    <AlertCircle size={24} />
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && requests.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <UserPlus size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--color-text-muted)', opacity: 0.5 }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No hay solicitudes pendientes</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>Cuando un usuario pida acceso dándolo de alta, aparecerá aquí.</p>
                </div>
            )}

            {!loading && !error && requests.length > 0 && (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {requests.map((req) => (
                        <div key={req.id} className="card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{req.name}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(req.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(req.id)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: 'none',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                    title="Eliminar solicitud"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                    <Mail size={16} />
                                    <a href={`mailto:${req.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{req.email}</a>
                                </div>
                                {req.profession && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                        <Briefcase size={16} />
                                        <span>{req.profession}</span>
                                    </div>
                                )}
                                {req.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                        <Phone size={16} />
                                        <a href={`tel:${req.phone}`} style={{ color: 'var(--color-primary)' }}>{req.phone}</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
