import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Settings, PenTool, Database, Shield, LogOut, ChevronRight, Trash2, AlertCircle, Share2, Copy, Check, CreditCard, Upload, CheckCircle, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getCountryNormativa } from '../data/legislationData';

// Componente para subir y gestionar el logo de empresa
function LogoEmpresaSection({ isPro }) {
    const [logo, setLogo] = useState(null);
    const [showLogo, setShowLogo] = useState(true);
    const [dragActive, setDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const savedLogo = localStorage.getItem('companyLogo');
        const savedShowLogo = localStorage.getItem('showCompanyLogo');
        if (savedLogo) {
            setLogo(savedLogo);
            console.log('[LogoEmpresa] Logo cargado desde localStorage:', savedLogo.substring(0, 50) + '...');
        }
        if (savedShowLogo !== null) setShowLogo(savedShowLogo === 'true');
    }, []);

    const handleFileChange = (file) => {
        if (!file) return;
        setIsUploading(true);

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor subí una imagen válida (PNG, JPG, SVG)');
            setIsUploading(false);
            return;
        }

        // Validar tamaño (max 500KB)
        if (file.size > 500 * 1024) {
            toast.error('La imagen debe pesar menos de 500KB');
            setIsUploading(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            setLogo(base64);
            localStorage.setItem('companyLogo', base64);
            setIsUploading(false);
            toast.success('✅ Logo guardado exitosamente. Aparecerá en todos tus PDFs.');
            console.log('[LogoEmpresa] Logo guardado correctamente');
        };
        reader.onerror = () => {
            toast.error('Error al leer la imagen');
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = () => {
        setDragActive(false);
    };

    const handleRemoveLogo = () => {
        setLogo(null);
        localStorage.removeItem('companyLogo');
        toast.success('Logo eliminado');
    };

    const toggleShowLogo = () => {
        const newValue = !showLogo;
        setShowLogo(newValue);
        localStorage.setItem('showCompanyLogo', String(newValue));
        toast.success(newValue ? 'Logo activado en PDFs' : 'Logo desactivado en PDFs');
    };

    return (
        <div className="card" style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(139,92,246,0.05))',
            border: '1px solid rgba(37,99,235,0.15)',
            borderRadius: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(37,99,235,0.1)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    flexShrink: 0
                }}>
                    <ImageIcon size={20} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Logo de tu Empresa</h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        Aparece en la esquina superior derecha de tus PDFs
                    </p>
                </div>
            </div>

            {/* Vista previa o Upload */}
            {logo ? (
                <div style={{
                    padding: '1rem',
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    marginBottom: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '8px',
                            background: 'white',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            flexShrink: 0
                        }}>
                            <img
                                src={logo}
                                alt="Logo de empresa"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '0.9rem' }}>
                                Logo cargado
                            </p>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Se mostrará en todos tus reportes PDF
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => document.getElementById('logo-upload-input')?.click()}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.5rem 0.8rem',
                                        background: 'rgba(59,130,246,0.1)',
                                        border: '1px solid rgba(59,130,246,0.2)',
                                        borderRadius: '8px',
                                        color: '#3b82f6',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Upload size={14} /> {isUploading ? 'Subiendo...' : 'Cambiar logo'}
                                </button>
                                <button
                                    onClick={handleRemoveLogo}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.5rem 0.8rem',
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        borderRadius: '8px',
                                        color: '#ef4444',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={14} /> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    style={{
                        padding: '2rem 1rem',
                        background: 'var(--color-surface)',
                        borderRadius: '12px',
                        border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        textAlign: 'center',
                        marginBottom: '1rem',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        opacity: isUploading ? 0.7 : 1
                    }}
                    onClick={() => document.getElementById('logo-upload-input')?.click()}
                >
                    <Upload size={32} style={{ color: 'var(--color-primary)', margin: '0 auto 0.5rem' }} />
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '0.9rem' }}>
                        {isUploading ? 'Subiendo logo...' : 'Arrastrá tu logo o hacé clic para subir'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        PNG, JPG o SVG - Máx. 500KB
                    </p>
                    <input
                        id="logo-upload-input"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange(e.target.files?.[0])}
                        disabled={isUploading}
                    />
                </div>
            )}

            {/* Toggle para activar/desactivar */}
            {logo && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: showLogo ? 'rgba(16,185,129,0.05)' : 'rgba(156,163,175,0.05)',
                    borderRadius: '8px',
                    border: `1px solid ${showLogo ? 'rgba(16,185,129,0.2)' : 'rgba(156,163,175,0.2)'}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle
                            size={18}
                            color={showLogo ? '#10b981' : '#9ca3af'}
                        />
                        <span style={{
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: showLogo ? '#10b981' : '#9ca3af'
                        }}>
                            {showLogo ? 'Logo activado en PDFs' : 'Logo desactivado'}
                        </span>
                    </div>
                    <button
                        onClick={toggleShowLogo}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '20px',
                            border: 'none',
                            background: showLogo ? '#10b981' : '#9ca3af',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {showLogo ? 'Activado' : 'Desactivado'}
                    </button>
                </div>
            )}

            {/* Mensaje para usuarios no PRO - movido abajo para que siempre se vea la info */}
            <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: isPro() ? 'rgba(16,185,129,0.05)' : 'rgba(251,191,36,0.1)',
                borderRadius: '8px',
                border: `1px solid ${isPro() ? 'rgba(16,185,129,0.2)' : 'rgba(251,191,36,0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                {isPro() ? (
                    <>
                        <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
                        <p style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: '#10b981',
                            fontWeight: 600
                        }}>
                            ¡Tenés acceso PRO! El logo aparecerá en todos tus PDFs
                        </p>
                    </>
                ) : (
                    <>
                        <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                        <p style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: '#f59e0b',
                            fontWeight: 600
                        }}>
                            Esta función está disponible solo para usuarios PRO
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function Profile() {
    const navigate = useNavigate();
    const { isPro } = usePaywall();
    useDocumentTitle('Mi Perfil');
    const [linkCopied, setLinkCopied] = useState(false);
    const [userData, setUserData] = useState({
        name: 'Usuario',
        license: '---'
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
            const proStatus = isPro();
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
                    alt="Logo de Asistente HYS"
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
                        <img src={userData.photo} alt="Foto de Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        (userData.name || 'U').charAt(0)
                    )}
                </div>
                <h2 style={{ margin: '0 0 0.5rem 0' }}>{userData.name || 'Usuario'}</h2>
                {userData.profession && (
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontWeight: 700, fontSize: '1rem' }}>{userData.profession}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Matrícula: {userData.license || '---'}</p>
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
                        href={`https://wa.me/?text=${encodeURIComponent(`🛡️ ¡Hola! Te comparto esta plataforma gratuita para profesionales de Higiene y Seguridad.\n\n*Asistente HYS* te permite:\n🔥 Calcular Carga de Fuego (${countryNorms.fire})\n💡 Estudios de Iluminación\n📋 Hacer ATS y Matrices de Riesgo\n🤖 Consultar la IA legal\n\n¡Y todo gratis!\n🔗 https://asistentehs.com`)}`}
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

            {/* ─── Logo de Empresa ─────────────────────── */}
            <LogoEmpresaSection isPro={isPro} />

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
