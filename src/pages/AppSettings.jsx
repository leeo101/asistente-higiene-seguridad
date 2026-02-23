import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Smartphone, Bell, Shield, Info, ChevronRight } from 'lucide-react';

export default function AppSettings() {
    const navigate = useNavigate();
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
    }, []);

    const toggleTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'light') {
            document.documentElement.classList.add('light-mode');
        } else {
            document.documentElement.classList.remove('light-mode');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Configuración</h1>
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Apariencia</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div
                        onClick={() => toggleTheme('dark')}
                        style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            border: `2px solid ${theme === 'dark' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: theme === 'dark' ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Moon size={24} color={theme === 'dark' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Oscuro</span>
                    </div>

                    <div
                        onClick={() => toggleTheme('light')}
                        style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            border: `2px solid ${theme === 'light' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: theme === 'light' ? 'rgba(59, 130, 246, 0.05)' : 'var(--color-surface)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Sun size={24} color={theme === 'light' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Claro</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Preferencias</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <Bell size={20} color="var(--color-text-muted)" />
                            <div>
                                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Notificaciones</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Alertas de inspecciones pendientes</p>
                            </div>
                        </div>
                        <input type="checkbox" defaultChecked style={{ width: 'auto', margin: 0 }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <Smartphone size={20} color="var(--color-text-muted)" />
                            <div>
                                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Modo Offline</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sincronizar datos al recuperar señal</p>
                            </div>
                        </div>
                        <input type="checkbox" defaultChecked style={{ width: 'auto', margin: 0 }} />
                    </div>
                </div>
            </div>

            <div
                onClick={() => navigate('/security')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    marginTop: '1rem'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Shield size={20} color="var(--color-primary)" />
                    <span style={{ fontWeight: 700 }}>Privacidad y Seguridad</span>
                </div>
                <ChevronRight size={18} color="var(--color-text-muted)" />
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    <Info size={14} /> Versión 1.2.0 (Build 20240219)
                </div>
            </div>
        </div>
    );
}
