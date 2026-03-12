import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Settings, PenTool, Database, Shield, LogOut, ChevronRight, Trash2, AlertCircle, Share2, Copy, Check, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Profile() {
    const navigate = useNavigate();
    const { isPro } = usePaywall();
    useDocumentTitle('Mi Perfil');
    const [linkCopied, setLinkCopied] = useState(false);
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
            const proStatus = isPro();
            setIsSubscribed(proStatus);
        }
    }, []);

    const menuItems = [
        { id: 'data', label: 'Datos Personales', icon: <User />, path: '/personal-data' },
        { id: 'signature', label: 'Firma y Sello', icon: <PenTool />, path: '/signature-stamp' },
        { id: 'subscription', label: 'Suscripción', icon: <CreditCard />, path: '/subscribe' },
        { id: 'settings', label: 'Configuración', icon: <Settings />, path: '/settings' },
        { id: 'privacy', label: 'Seguridad', icon: <Shield />, path: '/security' },
    ];

    const { logout, deleteAccount } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        const confirmStr = "ELIMINAR MI CUENTA";
        const userInput = prompt(`¿Estás seguro de que quieres eliminar tu cuenta permanentemente? Esta acción NO se puede deshacer.\n\nEscribe "${confirmStr}" para confirmar:`);

        if (userInput === confirmStr) {
            try {
                await deleteAccount();
                localStorage.clear(); // Limpiar todo el rastro local
                toast.success("Cuenta eliminada con éxito. Lamentamos verte partir.");
                navigate('/login');
            } catch (error) {
                console.error("Error al eliminar cuenta:", error);
                toast.error("Hubo un error al intentar eliminar la cuenta. Por favor, intenta cerrar sesión e ingresar de nuevo antes de reintentar.");
            }
        }
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
                <img
                    src="/logo.png"
                    alt="Logo"
                    style={{
                        width: 'auto',
                        height: '40px',
                        margin: '0 auto 1.5rem auto',
                        display: 'block'
                    }}
                />
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
                    color: '#ffffff',
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
                {userData.profession && (
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontWeight: 700, fontSize: '1rem' }}>{userData.profession}</p>
                )}
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
                                color: '#ffffff',
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

            {/* ─── Invitar a un Colega ─────────────────────── */}
            <div className="card" style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(16,185,129,0.06))',
                border: '1px solid rgba(37,99,235,0.15)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(37,99,235,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                        <Share2 size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Invitar a un Colega</h3>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Compartir esta herramienta gratuita</p>
                    </div>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    ¿Tenés colegas de Higiene y Seguridad? Invitalos a usar la plataforma — es completamente <strong>gratuita</strong>.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(`🛡️ Hola! Te comparto esta plataforma gratuita para profesionales de Higiene y Seguridad.\n\n*Asistente HYS* te permite:\n🔥 Calcular Carga de Fuego (Dec 351/79)\n💡 Estudios de Iluminación\n📋 Hacer ATS y Matrices de Riesgo\n🤖 Consultar la IA legal\n\n¡Y todo gratis!\n🔗 https://asistentehs.com`)}`}
                        target="_blank" rel="noreferrer"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.8rem', background: '#25D366', color: '#ffffff', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}
                    >
                        <Share2 size={18} /> Invitar por WhatsApp
                    </a>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText('https://asistentehs.com').catch(() => { });
                            setLinkCopied(true);
                            setTimeout(() => setLinkCopied(false), 2500);
                        }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.8rem', background: linkCopied ? '#dcfce7' : 'var(--color-surface)', border: `1px solid ${linkCopied ? '#86efac' : 'var(--color-border)'}`, borderRadius: '12px', color: linkCopied ? '#16a34a' : 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                    >
                        {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                        {linkCopied ? 'Copiado!' : 'Copiar link'}
                    </button>
                </div>
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

            <button
                onClick={handleDeleteAccount}
                style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '12px',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '2rem',
                    cursor: 'pointer',
                    opacity: 0.7
                }}
            >
                <Trash2 size={16} /> Eliminar mi cuenta permanentemente
            </button>
        </div >
    );
}
