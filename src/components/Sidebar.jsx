import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    X, User, History, LogOut, Home, Settings,
    Calendar, MessageSquare, Sun, Moon, Sparkles, Star, ShieldCheck, HardHat, BarChart3, Users, TriangleAlert, CreditCard, Crown, ImageIcon, Upload, X as CloseIcon, CheckCircle, AlertCircle,
    FlaskConical, Volume2, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from './AdBanner';

const navItems = [
    { to: '/', icon: <Home size={18} />, label: 'Inicio', always: true },
    { to: '/profile', icon: <User size={18} />, label: 'Mi Perfil', auth: true },
    { to: '/history', icon: <History size={18} />, label: 'Historiales', auth: true },
    { to: '/calendar', icon: <Calendar size={18} />, label: 'Calendario', always: true },
    { to: '/dashboard', icon: <BarChart3 size={18} color="#10b981" />, label: 'Dashboard', auth: true },
    { to: '/management-report', icon: <BarChart3 size={18} color="#8b5cf6" />, label: 'Reporte Mensual', auth: true },
    { to: '/chemical-safety', icon: <FlaskConical size={18} color="#10b981" />, label: 'Productos Químicos', auth: true },
    { to: '/noise-assessment', icon: <Volume2 size={18} color="#8b5cf6" />, label: 'Evaluación de Ruido', auth: true },
    { to: '/loto', icon: <Lock size={18} color="#dc2626" />, label: 'LOTO', auth: true },
    { to: '/settings', icon: <Settings size={18} />, label: 'Configuración', auth: true },
    { to: '/logo-settings', icon: <ImageIcon size={18} />, label: 'Logo de Empresa', auth: true },
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

    // Logo Management State
    const [logo, setLogo] = React.useState(null);
    const [showLogo, setShowLogo] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);

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
        if (!currentUser) {
            setUserInfo({
                name: 'Invitado',
                photo: null,
                profession: ''
            });
            return;
        }

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

    // Load logo data
    React.useEffect(() => {
        const savedLogo = localStorage.getItem('companyLogo');
        const savedShowLogo = localStorage.getItem('showCompanyLogo');
        if (savedLogo) setLogo(savedLogo);
        if (savedShowLogo !== null) setShowLogo(savedShowLogo === 'true');
    }, [isOpen]);

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);

        if (!file.type.startsWith('image/')) {
            // Reusing toast if available globally, otherwise quiet fail
            setIsUploading(false);
            return;
        }

        if (file.size > 500 * 1024) {
            setIsUploading(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            setLogo(base64);
            localStorage.setItem('companyLogo', base64);
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const toggleShowLogo = () => {
        const newValue = !showLogo;
        setShowLogo(newValue);
        localStorage.setItem('showCompanyLogo', String(newValue));
    };

    const removeLogo = () => {
        setLogo(null);
        localStorage.removeItem('companyLogo');
    };

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
                    boxShadow: isOpen ? '20px 0 60px rgba(0,0,0,0.15)' : 'none',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '14px', padding: '8px', flexShrink: 0, backdropFilter: 'blur(10px)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                                <img src="/logo.png" alt="Logo de Asistente HYS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-hero-text)', letterSpacing: '-0.8px', fontFamily: 'var(--font-heading)' }}>Asistente HYS</span>
                        </div>
                        <button onClick={onClose} style={{ padding: 0, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease' }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'rotate(0)'; }}
                        >
                            <X size={20} />
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
                                <img src={userInfo.photo} alt="Foto de Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={22} color="rgba(255,255,255,0.9)" />
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-hero-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {currentUser ? userInfo.name : 'Invitado'}
                                    {isPro() && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.2rem 0.5rem',
                                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1))',
                                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                                borderRadius: '20px',
                                                backdropFilter: 'blur(4px)'
                                            }}
                                            title={daysRemaining() === Infinity ? "Plan Administrador - Acceso Total" : `Días PRO: ${daysRemaining()}`}
                                        >
                                            <Crown size={12} color="#f59e0b" fill="#f59e0b" />
                                            <span style={{ fontSize: '0.6rem', color: '#fcd34d', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {daysRemaining() === Infinity ? 'Admin' : `PRO ${daysRemaining()}d`}
                                            </span>
                                        </div>
                                    )}
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
                            <Link key={i} className="stagger-item" to={item.to} onClick={onClose} style={{ textDecoration: 'none', animationDelay: `${0.1 + (i * 0.03)}s` }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                                    padding: '0.8rem 1rem', borderRadius: '14px',
                                    color: active ? '#ffffff' : 'var(--color-text)',
                                    background: active ? 'var(--gradient-premium)' : 'transparent',
                                    fontWeight: active ? 800 : 500,
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: active ? '0 10px 20px rgba(59, 130, 246, 0.3)' : 'none',
                                    border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                }}
                                    onMouseOver={e => { if (!active) { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.transform = 'translateX(4px)'; } }}
                                    onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; } }}
                                >
                                    <span style={{ color: active ? 'white' : 'var(--color-primary)', flexShrink: 0, transition: 'transform 0.3s ease' }} className={active ? 'scale-110' : ''}>
                                        {item.icon}
                                    </span>
                                    <span style={{ letterSpacing: active ? '0.2px' : '0' }}>{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}

                    <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.8rem 0.5rem' }} />

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
                                display: 'flex', alignItems: 'center', gap: '0.9rem',
                                padding: '1rem', borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                                onMouseOver={e => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                    flexShrink: 0
                                }}>
                                    <Crown size={18} color="#ffffff" fill="rgba(255,255,255,0.2)" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-primary)', letterSpacing: '-0.3px' }}>Activar Versión Pro</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Desbloquea todas las funciones</span>
                                </div>
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
