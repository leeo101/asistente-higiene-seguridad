import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, User, History, LogOut, Home, Settings, ClipboardList, Flame, FileText, Calendar, MessageSquare, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AdBanner from './AdBanner';

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [userInfo, setUserInfo] = React.useState({
        name: currentUser?.displayName || currentUser?.email || 'Usuario',
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
        setUserInfo(prev => ({ ...prev, name: currentUser?.displayName || currentUser?.email || 'Usuario' }));
        const savedData = localStorage.getItem('personalData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setUserInfo(prev => ({ ...prev, photo: parsed.photo }));
        }
    }, [isOpen, currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            onClose();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
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
                    borderRight: '1px solid var(--color-border)',
                    maxHeight: '100vh'
                }}>
                <Link to="/" onClick={onClose} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text)', fontWeight: 800 }}>Asistente H&S</h2>
                </Link>

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
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                            {currentUser ? userInfo.name : 'Invitado'}
                        </span>
                        {!currentUser && (
                            <Link to="/login" onClick={onClose} style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>

                <nav style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    flex: 1,
                    overflowY: 'auto',
                    marginRight: '-0.5rem',
                    paddingRight: '0.5rem',
                    paddingBottom: '2rem', // Safe area for taskbar
                    scrollbarWidth: 'thin'
                }}>
                    <Link to="/" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
                            <Home size={20} color="var(--color-text-muted)" />
                            <span style={{ fontWeight: 500 }}>Inicio</span>
                        </div>
                    </Link>

                    {currentUser && (
                        <>
                            <Link to="/profile" onClick={onClose} style={{ textDecoration: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
                                    <User size={20} color="var(--color-text-muted)" />
                                    <span style={{ fontWeight: 500 }}>Mi Perfil</span>
                                </div>
                            </Link>
                            <Link to="/history" onClick={onClose} style={{ textDecoration: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
                                    <History size={20} color="var(--color-text-muted)" />
                                    <span style={{ fontWeight: 500 }}>Historiales</span>
                                </div>
                            </Link>
                        </>
                    )}

                    <Link to="/calendar" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
                            <Calendar size={20} color="var(--color-text-muted)" />
                            <span style={{ fontWeight: 500 }}>Calendario</span>
                        </div>
                    </Link>

                    {currentUser && (
                        <>
                            <Link to="/settings" onClick={onClose} style={{ textDecoration: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
                                    <Settings size={20} color="var(--color-text-muted)" />
                                    <span style={{ fontWeight: 500 }}>Configuración</span>
                                </div>
                            </Link>
                        </>
                    )}

                    <a href="mailto:asistente.hs.soporte@gmail.com?subject=Sugerencia de Mejora - Asistente H&S" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: '8px', color: 'var(--color-text)', background: 'transparent' }}>
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
                            transition: 'transform 0.2s, background 0.2s'
                        }}>
                            <User size={20} color="var(--color-primary)" />
                            <span style={{ fontWeight: 700 }}>Activar Versión Pro</span>
                        </div>
                    </Link>

                    <AdBanner placement="sidebar" />

                    {currentUser && (
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
                                marginTop: '1rem',
                                textAlign: 'left',
                                width: '100%',
                            }}
                        >
                            <LogOut size={20} />
                            <span style={{ fontWeight: 600 }}>Cerrar Sesión</span>
                        </button>
                    )}
                </nav>
            </div>
        </>
    );
}
