import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Settings, PenTool, Database, Shield, LogOut, ChevronRight, Trash2, AlertCircle, Share2, Copy, Check, CreditCard, Upload, CheckCircle, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getCountryNormativa } from '../data/legislationData';

export default function Profile(): React.ReactElement | null {
  const navigate = useNavigate();
  const { isPro } = usePaywall();
  useDocumentTitle('Mi Perfil');
    const [linkCopied, setLinkCopied] = useState(false);
    const [userData, setUserData] = useState({
        name: 'Usuario',
        license: '---',
        photo: null,
        profession: ''
    });

    const [isSubscribed, setIsSubscribed] = useState(false);

    const [userCountry, setUserCountry] = useState('argentina');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('personalData');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                setUserData(parsed);
                setUserCountry(parsed.country || 'argentina');
            }
            const proStatus = isPro;
            setIsSubscribed(proStatus);
        }
    }, [isPro]);

    const countryNorms = getCountryNormativa(userCountry);

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
        <div className="container animate-fade-in" style={{ maxWidth: '600px', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/')} style={{ 
                    padding: '0.6rem', 
                    background: 'var(--color-surface)', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: '12px',
                    cursor: 'pointer', 
                    color: 'var(--color-text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}>
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Perfil Profesional</h1>
            </div>

            <div className="card" style={{ 
                textAlign: 'center', 
                padding: '3rem 2rem',
                background: 'linear-gradient(180deg, var(--color-surface) 0%, rgba(var(--color-surface-rgb), 0.5) 100%)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(12px)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative background blur */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '200px',
                    height: '200px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    filter: 'blur(40px)',
                    borderRadius: '50%',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <img
                        src="/logo.png"
                        alt="Logo de Asistente HYS"
                        style={{
                            width: 'auto',
                            height: '40px',
                            margin: '0 auto 2rem auto',
                            display: 'block',
                            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))'
                        }}
                    />
                    <div style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        background: userData.photo ? 'transparent' : 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
                        margin: '0 auto 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        color: '#ffffff',
                        fontWeight: 900,
                        boxShadow: '0 10px 25px rgba(56, 189, 248, 0.3)',
                        overflow: 'hidden',
                        border: userData.photo ? '4px solid var(--color-surface)' : '4px solid var(--color-surface)',
                        outline: '2px solid rgba(56, 189, 248, 0.3)'
                    }}>
                        {userData.photo ? (
                            <img src={userData.photo} alt="Foto de Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            (userData.name || 'U').charAt(0)
                        )}
                    </div>
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{userData.name || 'Usuario'}</h2>
                    {userData.profession && (
                        <p style={{ margin: '0 0 0.8rem 0', color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.1rem' }}>{userData.profession}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>Matrícula: {userData.license || '---'}</p>
                        <span style={{
                            padding: '0.3rem 0.8rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            background: isSubscribed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: isSubscribed ? '#10b981' : '#ef4444',
                            border: `1px solid ${isSubscribed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {isSubscribed && <CheckCircle size={14} />}
                            {isSubscribed ? 'Versión Pro' : 'Básico'}
                        </span>
                    </div>
                    
                    {!isSubscribed && (
                        <div style={{ 
                            marginTop: '2rem', 
                            padding: '1.5rem', 
                            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(139, 92, 246, 0.08))', 
                            borderRadius: '20px', 
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                            boxShadow: '0 10px 30px rgba(56, 189, 248, 0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                <Shield size={20} color="#38bdf8" />
                                <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--color-primary)', fontWeight: 800 }}>Desbloquea Todo el Potencial</h3>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontWeight: 500 }}>
                                Genera reportes PDF sin límites, usa plantillas avanzadas y guarda todo en la nube.
                            </p>
                            <button
                                onClick={() => navigate('/subscribe')}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'linear-gradient(90deg, #38bdf8, #8b5cf6)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '14px',
                                    fontSize: '1.05rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 20px rgba(56, 189, 248, 0.3)',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 25px rgba(56, 189, 248, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(56, 189, 248, 0.3)';
                                }}
                            >
                                <CreditCard size={20} /> Activar Versión Pro
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ 
                marginTop: '1.5rem',
                background: 'rgba(var(--color-surface-rgb), 0.5)',
                backdropFilter: 'blur(12px)',
                borderRadius: '24px',
                border: '1px solid var(--glass-border)',
                overflow: 'hidden',
                padding: '0.5rem'
            }}>
                {menuItems.map((item, idx) => (
                    <div
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1.2rem 1.5rem',
                            cursor: 'pointer',
                            borderBottom: idx === menuItems.length - 1 ? 'none' : '1px solid var(--color-border)',
                            transition: 'all 0.2s ease',
                            borderRadius: '16px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--color-surface)';
                            e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'none';
                        }}
                    >
                        <div style={{ 
                            background: 'rgba(56, 189, 248, 0.1)', 
                            padding: '0.6rem', 
                            borderRadius: '12px',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {item.icon}
                        </div>
                        <span style={{ flex: 1, fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)' }}>{item.label}</span>
                        <ChevronRight size={20} color="var(--color-text-secondary)" />
                    </div>
                ))}
            </div>

            {/* ─── Invitar a un Colega ─────────────────────── */}
            <div className="card" style={{
                marginTop: '1.5rem',
                padding: '1.8rem',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(16, 185, 129, 0.08))',
                border: '1px solid rgba(37, 99, 235, 0.15)',
                borderRadius: '24px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    filter: 'blur(30px)',
                    borderRadius: '50%',
                    zIndex: 0
                }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ 
                            width: '48px', height: '48px', 
                            background: 'rgba(37, 99, 235, 0.15)', 
                            borderRadius: '14px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            color: 'var(--color-primary)', 
                            flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.1)'
                        }}>
                            <Share2 size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: 'var(--color-text)' }}>Invitar a un Colega</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Compartir esta herramienta gratuita</p>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6, fontWeight: 500 }}>
                        ¿Tenés colegas de Higiene y Seguridad? Invitalos a usar la plataforma — es completamente <strong>gratuita</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(`🛡️ ¡Hola! Te comparto esta plataforma gratuita para profesionales de Higiene y Seguridad.\n\n*Asistente HYS* te permite:\n🔥 Calcular Carga de Fuego (${countryNorms.fire})\n💡 Estudios de Iluminación\n📋 Hacer ATS y Matrices de Riesgo\n🤖 Consultar la IA legal\n\n¡Y todo gratis!\n🔗 https://asistentehs.com`)}`}
                            target="_blank" rel="noreferrer"
                            style={{ 
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', 
                                padding: '1rem', 
                                background: '#25D366', color: '#ffffff', 
                                borderRadius: '14px', fontWeight: 800, fontSize: '0.95rem', 
                                textDecoration: 'none', 
                                boxShadow: '0 8px 15px rgba(37,211,102,0.25)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                        >
                            <Share2 size={18} /> Invitar por WhatsApp
                        </a>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText('https://asistentehs.com').catch(() => { });
                                setLinkCopied(true);
                                setTimeout(() => setLinkCopied(false), 2500);
                            }}
                            style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                                padding: '1rem', 
                                background: linkCopied ? '#dcfce7' : 'var(--color-surface)', 
                                border: `1px solid ${linkCopied ? '#86efac' : 'var(--color-border)'}`, 
                                borderRadius: '14px', 
                                color: linkCopied ? '#16a34a' : 'var(--color-text)', 
                                fontWeight: 700, fontSize: '0.9rem', 
                                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                            }}
                            onMouseEnter={(e) => !linkCopied && (e.currentTarget.style.background = 'var(--color-surface-hover)')}
                            onMouseLeave={(e) => !linkCopied && (e.currentTarget.style.background = 'var(--color-surface)')}
                        >
                            {linkCopied ? <Check size={18} /> : <Copy size={18} />}
                            {linkCopied ? '¡Copiado!' : 'Copiar link'}
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={handleLogout}
                style={{
                    width: '100%',
                    padding: '1.2rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '16px',
                    color: '#ef4444',
                    fontWeight: 800,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.8rem',
                    marginTop: '2rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                    e.currentTarget.style.transform = 'none';
                }}
            >
                <LogOut size={22} /> Cerrar Sesión
            </button>

            <button
                onClick={handleDeleteAccount}
                style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '1.5rem',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                    textDecoration: 'underline'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
            >
                <Trash2 size={16} /> Eliminar mi cuenta permanentemente
            </button>
        </div>
    );
}
