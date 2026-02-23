import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Settings, PenTool, Database, Shield, LogOut, ChevronRight } from 'lucide-react';

export default function Profile() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        name: 'Juan Pérez',
        license: 'MP 5567'
    });

    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('personalData');
            if (savedData) {
                setUserData(JSON.parse(savedData));
            }
            const status = localStorage.getItem('subscriptionStatus');
            setIsSubscribed(status === 'active');
        }
    }, []);

    const menuItems = [
        { id: 'data', label: 'Datos Personales', icon: <User />, path: '/personal-data' },
        { id: 'signature', label: 'Firma y Sello', icon: <PenTool />, path: '/signature-stamp' },
        { id: 'settings', label: 'Configuración', icon: <Settings />, path: '/settings' },
        { id: 'privacy', label: 'Seguridad', icon: <Shield />, path: '/security' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Perfil Profesional</h1>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: userData.photo ? 'transparent' : 'var(--color-primary)',
                    margin: '0 auto 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    color: 'white',
                    fontWeight: 900,
                    boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)',
                    overflow: 'hidden',
                    border: userData.photo ? '3px solid var(--color-primary)' : 'none'
                }}>
                    {userData.photo ? (
                        <img src={userData.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        userData.name.charAt(0)
                    )}
                </div>
                <h2 style={{ margin: '0 0 0.5rem 0' }}>{userData.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Matrícula: {userData.license}</p>
                    <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        background: isSubscribed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isSubscribed ? '#10b981' : '#ef4444',
                        border: `1px solid ${isSubscribed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        textTransform: 'uppercase'
                    }}>
                        {isSubscribed ? 'Versión Pro' : 'Básico'}
                    </span>
                </div>
                {!isSubscribed && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Desbloquea Todo el Potencial</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Genera reportes PDF sin límites, usa plantillas avanzadas y guarda todo en la nube.</p>
                        <button
                            onClick={() => navigate('/subscribe')}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            Activar Versión Pro
                        </button>
                    </div>
                )}
            </div>

            <div className="card" style={{ padding: '0.5rem' }}>
                {menuItems.map((item, idx) => (
                    <div
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1.2rem',
                            cursor: 'pointer',
                            borderBottom: idx === menuItems.length - 1 ? 'none' : '1px solid var(--color-border)',
                            transition: 'background 0.2s',
                            borderRadius: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <div style={{ color: 'var(--color-primary)' }}>{item.icon}</div>
                        <span style={{ flex: 1, fontWeight: 600 }}>{item.label}</span>
                        <ChevronRight size={18} color="var(--color-text-muted)" />
                    </div>
                ))}
            </div>

            <button
                onClick={handleLogout}
                style={{
                    width: '100%',
                    padding: '1.2rem',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.1)',
                    borderRadius: '12px',
                    color: '#ef4444',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.8rem',
                    marginTop: '1rem',
                    cursor: 'pointer'
                }}
            >
                <LogOut size={20} /> Cerrar Sesión
            </button>
        </div>
    );
}
