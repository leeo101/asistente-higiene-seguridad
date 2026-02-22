import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Settings, LogOut, ChevronRight } from 'lucide-react';

export default function Profile() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        name: 'Lic. Juan Pérez',
        profession: 'Licenciado en Higiene y Seguridad',
        license: '5542',
        photo: null
    });

    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const savedData = localStorage.getItem('personalData');
        if (savedData) {
            setUserData(JSON.parse(savedData));
        }
        const status = localStorage.getItem('subscriptionStatus');
        setIsSubscribed(status === 'active');
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Mi Perfil</h1>
            </div>

            <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}>
                    {userData.photo ? (
                        <img src={userData.photo} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <User size={30} color="white" />
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.3rem 0' }}>{userData.name}</h3>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 500 }}>{userData.profession}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Matrícula: {userData.license}</p>
                        <span style={{
                            padding: '0.1rem 0.5rem',
                            borderRadius: '20px',
                            fontSize: '0.65rem',
                            fontWeight: '800',
                            background: isSubscribed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: isSubscribed ? '#10b981' : '#ef4444',
                            border: `1px solid ${isSubscribed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            textTransform: 'uppercase'
                        }}>
                            {isSubscribed ? 'Premium' : 'Básico'}
                        </span>
                    </div>
                </div>
                {!isSubscribed && (
                    <div style={{ width: '100%', marginTop: '0.5rem' }}>
                        <button
                            onClick={() => navigate('/subscribe')}
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem',
                                fontSize: '0.9rem',
                                fontWeight: '700',
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            MEJORAR A PRO
                        </button>
                    </div>
                )}
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div
                    onClick={() => navigate('/personal-data')}
                    style={{ padding: '1.5rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Settings size={20} color="var(--color-primary)" />
                        <span style={{ fontWeight: 500 }}>Datos Personales</span>
                    </div>
                    <ChevronRight size={18} color="var(--color-text-muted)" />
                </div>
                <div
                    onClick={() => navigate('/signature-stamp')}
                    style={{ padding: '1.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Settings size={20} color="var(--color-primary)" />
                        <span style={{ fontWeight: 500 }}>Mi Firma y Sello</span>
                    </div>
                    <ChevronRight size={18} color="var(--color-text-muted)" />
                </div>
            </div>

            <button
                onClick={handleLogout}
                style={{ width: '100%', marginTop: '2rem', color: '#ef4444', display: 'flex', justifyContent: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid #ef4444' }}
            >
                <LogOut size={20} />
                Cerrar Sesión
            </button>
        </div>
    );
}
