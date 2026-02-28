import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Mail, Phone, Briefcase, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminRequests() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
            const fetchUrl = isLocal ? `http://${window.location.hostname}:3001/api/admin/requests` : '/api/admin/requests';

            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error('Error al cargar solicitudes');
            const data = await response.json();
            setRequests(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
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
            toast.success('Solicitud eliminada');
        } catch (err) {
            toast.error(err.message);
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
                    onClick={fetchRequests}
                    className="btn-secondary"
                    style={{ padding: '0.5rem', width: 'auto', borderRadius: '50%' }}
                    title="Actualizar lista"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </header>

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
