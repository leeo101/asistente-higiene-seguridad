import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, User, History, LogOut, Home, Settings, ClipboardList, Flame, FileText, Calendar, MessageSquare, Sun, Moon } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = React.useState({
        name: 'Juan Pérez',
        photo: null
    });

    const [isDarkMode, setIsDarkMode] = React.useState(() => {
        return typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;
    });

    const toggleTheme = () => {
        const newDark = !isDarkMode;
        setIsDarkMode(newDark);
        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    React.useEffect(() => {
        const savedData = localStorage.getItem('personalData');
        if (savedData) {
            setUserInfo(JSON.parse(savedData));
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

            <div
                className={isOpen ? "shadow-2xl" : ""}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '280px',
                    height: '100%',
                    background: isOpen ? 'var(--color-surface)' : 'transparent',
                    zIndex: 1000,
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s',
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    visibility: isOpen ? 'visible' : 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.5rem',
                    pointerEvents: isOpen ? 'all' : 'none',
                    borderRight: '1px solid var(--color-border)'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text)', fontWeight: 800 }}>Asistente H&S</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '0.5rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--color-background)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--color-border)'
                    }}>
                        {userInfo.photo ? (
                            <img src={userInfo.photo} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={20} color="var(--color-text-muted)" />
                        )}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{userInfo.name}</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {/* Reusable Nav Item Style */}
                    {[
                        { to: '/', icon: Home, label: 'Inicio' },
                        { to: '/profile', icon: User, label: 'Mi Perfil' },
                        { to: '/history', icon: History, label: 'Historiales' },
                        { to: '/calendar', icon: Calendar, label: 'Calendario' },
                        { to: '/settings', icon: Settings, label: 'Configuración' }
                    ].map((item, idx) => (
                        <Link key={idx} to={item.to} onClick={onClose} style={{ textDecoration: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-background)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <item.icon size={20} color="var(--color-text-muted)" />
                                <span style={{ fontWeight: 500 }}>{item.label}</span>
                            </div>
                        </Link>
                    ))}



                    <a href="mailto:asistente.hs.soporte@gmail.com?subject=Sugerencia de Mejora - Asistente H&S" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-background)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <MessageSquare size={20} color="var(--color-text-muted)" />
                            <span style={{ fontWeight: 500 }}>Sugerencias y Mejoras</span>
                        </div>
                    </a>

                    <div style={{ margin: '1rem 0', borderTop: '1px solid var(--color-border)' }}></div>
                    <Link to="/subscribe" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                            borderRadius: '12px', color: 'var(--color-primary)',
                            background: 'rgba(37, 99, 235, 0.1)',
                            boxShadow: 'none',
                            transition: 'transform 0.2s, background 0.2s'
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = 'rgba(37, 99, 235, 0.15)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)' }}
                        >
                            <User size={20} color="var(--color-primary)" />
                            <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Activar Versión Pro</span>
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
