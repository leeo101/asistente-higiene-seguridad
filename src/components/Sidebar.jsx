import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, User, History, LogOut, Home, Settings, ClipboardList, Flame, FileText, Calendar, MessageSquare } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = React.useState({
        name: 'Profesional',
        photo: null
    });

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('personalData');
            if (savedData) {
                setUserInfo(JSON.parse(savedData));
            }
        }
    }, [isOpen]);

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        onClose();
        navigate('/login');
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999,
                    }}
                />
            )}

            {/* Sidebar */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '280px',
                height: '100%',
                background: 'var(--color-surface)',
                zIndex: 1000,
                transition: 'transform 0.3s ease, visibility 0.3s',
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                visibility: isOpen ? 'visible' : 'hidden',
                boxShadow: isOpen ? '4px 0 20px rgba(0,0,0,0.15)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                pointerEvents: isOpen ? 'all' : 'none',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary)' }}>Asistente H&S</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '0.5rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {userInfo.photo ? (
                            <img src={userInfo.photo} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={20} color="white" />
                        )}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{userInfo.name}</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <Link to="/" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
                            <Home size={20} color="var(--color-primary)" />
                            <span style={{ fontWeight: 500 }}>Inicio</span>
                        </div>
                    </Link>

                    <Link to="/profile" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
                            <User size={20} color="var(--color-primary)" />
                            <span style={{ fontWeight: 500 }}>Mi Perfil</span>
                        </div>
                    </Link>

                    <Link to="/history" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
                            <History size={20} color="var(--color-primary)" />
                            <span style={{ fontWeight: 500 }}>Historiales</span>
                        </div>
                    </Link>

                    <Link to="/calendar" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
                            <Calendar size={20} color="var(--color-primary)" />
                            <span style={{ fontWeight: 500 }}>Calendario</span>
                        </div>
                    </Link>

                    <Link to="/settings" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
                            <Settings size={20} color="var(--color-primary)" />
                            <span style={{ fontWeight: 500 }}>Configuración</span>
                        </div>
                    </Link>

                    <a
                        href="mailto:asistente.hs.soporte@gmail.com?subject=Sugerencia de Mejora - Asistente H&S"
                        onClick={onClose}
                        style={{ textDecoration: 'none' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
                            <MessageSquare size={20} color="var(--color-primary)" />
                            <span style={{ fontWeight: 500 }}>Sugerencias y Mejoras</span>
                        </div>
                    </a>

                    <div style={{ margin: '1rem 0', borderTop: '1px solid var(--color-border)' }}></div>
                    <Link to="/subscribe" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', color: 'white', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}>
                            <User size={20} color="white" />
                            <span style={{ fontWeight: 700 }}>Activar Versión Pro</span>
                        </div>
                    </Link>
                </nav>

                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '8px',
                        color: '#ef4444',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: 'none',
                        cursor: 'pointer',
                        marginTop: 'auto',
                        textAlign: 'left',
                        width: '100%',
                    }}
                >
                    <LogOut size={20} />
                    <span style={{ fontWeight: 600 }}>Cerrar Sesión</span>
                </button>
            </div>
        </>
    );
}
