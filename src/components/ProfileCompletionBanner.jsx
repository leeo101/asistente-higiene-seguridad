import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, User } from 'lucide-react';

export default function ProfileCompletionBanner({ onComplete }) {
    const [visible, setVisible] = useState(false);
    
    useEffect(() => {
        const personalData = localStorage.getItem('personalData');
        if (personalData) {
            const data = JSON.parse(personalData);
            // Mostrar banner si profileComplete es false o si faltan datos importantes
            const hasIncompleteProfile = !data.profileComplete || 
                !data.dni || 
                !data.license || 
                !data.profession ||
                !data.phone;
            
            // Solo mostrar si es la primera vez que ven el banner en esta sesión
            const hasSeenBanner = sessionStorage.getItem('hasSeenProfileBanner');
            
            if (hasIncompleteProfile && !hasSeenBanner) {
                setVisible(true);
            }
        }
    }, []);

    const handleClose = () => {
        setVisible(false);
        sessionStorage.setItem('hasSeenProfileBanner', 'true');
    };

    const handleComplete = () => {
        navigate('/personal-data');
        sessionStorage.setItem('hasSeenProfileBanner', 'true');
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: '90%',
            maxWidth: '600px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '2px solid #3b82f6',
            borderRadius: '16px',
            padding: '1rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)',
            animation: 'slideDown 0.4s ease-out'
        }}>
            <style>
                {`
                    @keyframes slideDown {
                        from {
                            opacity: 0;
                            transform: translate(-50%, -20px);
                        }
                        to {
                            opacity: 1;
                            transform: translate(-50%, 0);
                        }
                    }
                    @media (max-width: 768px) {
                        .profile-banner-mobile {
                            flex-direction: column;
                            text-align: center;
                        }
                    }
                `}
            </style>

            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <User size={20} color="#ffffff" strokeWidth={2.5} />
            </div>

            <div style={{ flex: 1, className: 'profile-banner-mobile' }}>
                <p style={{
                    margin: '0 0 0.3rem 0',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    color: '#1e40af'
                }}>
                    ¡Bienvenido! 🎉
                </p>
                <p style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: '#1e3a8a',
                    lineHeight: 1.4
                }}>
                    Completá tu perfil profesional para acceder a todas las funciones.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                    onClick={handleComplete}
                    style={{
                        padding: '0.6rem 1.2rem',
                        background: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                >
                    Completar
                </button>
                <button
                    onClick={handleClose}
                    style={{
                        padding: '0.6rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    aria-label="Cerrar"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
