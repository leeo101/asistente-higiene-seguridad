import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    X, User, History, LogOut, Home, Settings,
    Calendar, MessageSquare, Sun, Moon, Sparkles, Star, ShieldCheck, HardHat, BarChart3, Users, TriangleAlert, CreditCard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from './AdBanner';

const navItems = [
    { to: '/', icon: <Home size={18} />, label: 'Inicio', always: true },
    { to: '/profile', icon: <User size={18} />, label: 'Mi Perfil', auth: true },
    { to: '/history', icon: <History size={18} />, label: 'Historiales', auth: true },
    { to: '/calendar', icon: <Calendar size={18} />, label: 'Calendario', always: true },
    { to: '/analytics', icon: <BarChart3 size={18} color="#3b82f6" />, label: 'Estadísticas', auth: true },
    { to: '/management-report', icon: <BarChart3 size={18} color="#10b981" />, label: 'Reporte Mensual', auth: true },
    { to: '/settings', icon: <Settings size={18} />, label: 'Configuración', auth: true },
    { to: '/privacy', icon: <ShieldCheck size={18} />, label: 'Privacidad', always: true },
];

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const { isPro, daysRemaining } = usePaywall();
    const [userInfo, setUserInfo] = React.useState({
        name: currentUser?.displayName || currentUser?.email || 'Usuario',
        photo: null,
        profession: ''
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
            setUserInfo(prev => ({ ...prev, photo: parsed.photo, profession: parsed.profession || '' }));
        }

        // Lock background scroll when sidebar is open on mobile
        if (isOpen) {
            document.body.classList.add('sidebar-open-lock');
        } else {
            document.body.classList.remove('sidebar-open-lock');
        }

        // Cleanup on unmount or close
        return () => {
            document.body.classList.remove('sidebar-open-lock');
        };
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

    const isActive = (path) => location.pathname === path;

    const visibleItems = navItems.filter(item =>
        item.always || (item.auth && currentUser)
    );

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 999,
                        animation: 'fadeIn 0.2s ease'
                    }}
                />
            )}

            <div
                style={{
                    position: 'fixed', top: 0, left: 0,
                    width: '285px', height: '100%',
                    zIndex: 1000,
                    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), visibility 0.3s',
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    visibility: isOpen ? 'visible' : 'hidden',
                    display: 'flex', flexDirection: 'column',
                    pointerEvents: isOpen ? 'all' : 'none',
                    background: 'var(--color-surface)',
                    borderRight: '1px solid var(--color-border)',
                    maxHeight: '100vh',
                    overflow: 'hidden',
                    boxShadow: isOpen ? '8px 0 32px rgba(0,0,0,0.2)' : 'none',
                }}
            >
                {/* ── HEADER ── */}
                <div style={{
                    background: 'var(--color-hero-bg)',
                    padding: '1.5rem 1.2rem 1.8rem',
                    position: 'relative', overflow: 'hidden',
                    flexShrink: 0,
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

                    {/* Top row: Logo + close */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                            <div style={{ width: '44px', height: '44px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '6px', flexShrink: 0, backdropFilter: 'blur(8px)' }}>
                                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-hero-text)', letterSpacing: '-0.5px' }}>Asistente HYS</span>
                        </div>
                        <button onClick={onClose} style={{ padding: 0, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff', backdropFilter: 'blur(8px)', transition: 'all 0.2s ease' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* User card */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <div style={{
                            width: '46px', height: '46px', borderRadius: '50%',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            {userInfo.photo ? (
                                <img src={userInfo.photo} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={22} color="rgba(255,255,255,0.9)" />
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-hero-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {currentUser ? userInfo.name : 'Invitado'}
                                    {isPro() && <Sparkles size={14} color="#f59e0b" fill="#f59e0b" title="Plan PRO Activo" />}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                                    style={{
                                        padding: 0,
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#ffffff',
                                        flexShrink: 0,
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    title={isDarkMode ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
                                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                >
                                    {isDarkMode ? (
                                        <Sun size={20} color="#ffffff" strokeWidth={2.5} />
                                    ) : (
                                        <Moon size={20} color="#ffffff" strokeWidth={2.5} />
                                    )}
                                </button>
                            </div>
                            {currentUser ? (
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.1rem' }}>
                                    {userInfo.profession || 'Profesional H&S'}
                                </div>
                            ) : (
                                <Link to="/login" onClick={onClose} style={{ fontSize: '0.78rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    Iniciar sesión →
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── NAVIGATION ── */}
                <nav style={{
                    flex: 1, overflowY: 'auto', padding: '1rem 0.8rem',
                    display: 'flex', flexDirection: 'column', gap: '0.25rem',
                    scrollbarWidth: 'thin',
                    paddingBottom: '2rem',
                }}>
                    {visibleItems.map((item, i) => {
                        const active = isActive(item.to);
                        return (
                            <Link key={i} to={item.to} onClick={onClose} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                                    padding: '0.7rem 1rem', borderRadius: '12px',
                                    color: active ? 'var(--color-surface)' : 'var(--color-text)',
                                    background: active ? 'linear-gradient(135deg,#2563eb,#3b82f6)' : 'transparent',
                                    fontWeight: active ? 700 : 500,
                                    fontSize: '0.9rem',
                                    transition: 'background 0.15s, transform 0.15s',
                                    boxShadow: active ? '0 4px 12px rgba(37,99,235,0.35)' : 'none',
                                }}
                                    onMouseOver={e => { if (!active) e.currentTarget.style.background = 'var(--color-background)'; }}
                                    onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span style={{ color: active ? 'white' : 'var(--color-text-muted)', flexShrink: 0 }}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}

                    <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.8rem 0.5rem' }} />

                    <a href="mailto:asistente.hs.soporte@gmail.com?subject=Sugerencia - Asistente HYS" onClick={onClose} style={{ textDecoration: 'none' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.9rem',
                            padding: '0.7rem 1rem', borderRadius: '12px',
                            color: 'var(--color-text)', fontWeight: 500, fontSize: '0.9rem',
                            marginBottom: '0.5rem'
                        }}
                            onMouseOver={e => e.currentTarget.style.background = 'var(--color-background)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <MessageSquare size={18} color="var(--color-text-muted)" />
                            <span>Sugerencias y Mejoras</span>
                        </div>
                    </a>

                    {/* PRO banner */}
                    {!isPro() && (
                        <Link to="/subscribe" onClick={onClose} style={{ textDecoration: 'none', marginBottom: '0.5rem' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.8rem',
                                padding: '0.9rem 1rem', borderRadius: '14px',
                                background: 'linear-gradient(135deg,rgba(37,99,235,0.12),rgba(14,165,233,0.08))',
                                border: '1px solid rgba(37,99,235,0.25)',
                                cursor: 'pointer',
                            }}>
                                <Star size={18} color="#f59e0b" fill="#f59e0b" />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}>Activar Versión Pro</span>
                            </div>
                        </Link>
                    )}

                    <AdBanner placement="sidebar" />

                    {currentUser && (
                        <button
                            onClick={handleLogout}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.9rem',
                                padding: '0.8rem 1rem', borderRadius: '12px',
                                color: '#ef4444', background: 'rgba(239,68,68,0.05)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                cursor: 'pointer', marginTop: '0.5rem',
                                textAlign: 'left', width: '100%',
                                fontWeight: 600, fontSize: '0.9rem',
                                transition: 'background 0.15s',
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                        >
                            <LogOut size={18} />
                            <span>Cerrar Sesión</span>
                        </button>
                    )}
                </nav>
            </div>
        </>
    );
}
