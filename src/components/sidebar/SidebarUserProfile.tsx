import React, { useState } from 'react';
import { User, Crown, Sun, Moon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';

interface UserInfo {
    name: string;
    photo: string | null;
    profession: string;
}

interface SidebarUserProfileProps {
    currentUser: FirebaseUser | null;
    userInfo: UserInfo;
    isPro: boolean;
    daysRemaining: number;
    onClose: () => void;
}

export default function SidebarUserProfile({ currentUser, userInfo, isPro, daysRemaining, onClose }: SidebarUserProfileProps) {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        return typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;
    });

    const toggleTheme = (): void => {
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

    return (
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
                    <User weight="duotone" size={26} color="rgba(255,255,255,0.9)" />
                )}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-hero-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {currentUser ? userInfo.name : 'Invitado'}
                        {isPro && (
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
                                title={daysRemaining === Infinity ? "Plan Administrador - Acceso Total" : `Días PRO: ${daysRemaining}`}
                            >
                                <Crown weight="fill" size={12} color="#f59e0b" />
                                <span style={{ fontSize: '0.6rem', color: '#fcd34d', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {daysRemaining === Infinity ? 'Admin' : `PRO ${daysRemaining}d`}
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
                            <Sun weight="bold" size={22} color="#ffffff" />
                        ) : (
                            <Moon weight="bold" size={22} color="#ffffff" />
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
    );
}
