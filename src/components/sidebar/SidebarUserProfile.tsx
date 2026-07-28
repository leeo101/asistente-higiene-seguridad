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
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentUser ? userInfo.name : 'Invitado'}
                        {isPro ? (
                            <Link
                                to="/subscribe"
                                onClick={onClose}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.2rem 0.55rem',
                                    background: daysRemaining <= 7 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(245, 158, 11, 0.2))' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1))',
                                    border: daysRemaining <= 7 ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: '20px',
                                    backdropFilter: 'blur(4px)',
                                    textDecoration: 'none'
                                }}
                                title={daysRemaining === Infinity ? "Plan Administrador - Acceso Total" : `Vence en ${daysRemaining} días. Haz clic para renovar por $2 USD`}
                            >
                                <Crown weight="fill" size={12} color="#f59e0b" />
                                <span style={{ fontSize: '0.62rem', color: daysRemaining <= 7 ? '#fde68a' : '#fcd34d', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {daysRemaining === Infinity ? 'Admin' : daysRemaining <= 7 ? `⚠️ Renovar $2 (${daysRemaining}d)` : `PRO ${daysRemaining}d`}
                                </span>
                            </Link>
                        ) : (
                            <Link
                                to="/subscribe"
                                onClick={onClose}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0.2rem 0.55rem',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                    borderRadius: '20px',
                                    textDecoration: 'none'
                                }}
                            >
                                <Crown weight="fill" size={12} color="#60a5fa" />
                                <span style={{ fontSize: '0.62rem', color: '#93c5fd', fontWeight: 900, textTransform: 'uppercase' }}>
                                    Activar PRO $2
                                </span>
                            </Link>
                        )}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                        style={{
                            padding: 0,
                            background: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            flexShrink: 0,
                            transition: 'all 0.2s ease',
                        }}
                        title={isDarkMode ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
                        onMouseOver={e => { e.currentTarget.style.background = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'var(--color-background)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                    >
                        {isDarkMode ? (
                            <Sun weight="bold" size={18} />
                        ) : (
                            <Moon weight="bold" size={18} />
                        )}
                    </button>
                </div>
                {currentUser ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
