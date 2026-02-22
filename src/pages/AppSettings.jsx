import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Check, Shield, ChevronRight } from 'lucide-react';

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
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Configuración de la App</h1>
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Apariencia</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div
                        onClick={() => toggleTheme('dark')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            borderRadius: '8px',
                            background: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            border: `1px solid ${theme === 'dark' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Moon size={20} color={theme === 'dark' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                            <span style={{ fontWeight: theme === 'dark' ? 600 : 400 }}>Modo Oscuro</span>
                        </div>
                        {theme === 'dark' && <Check size={20} color="var(--color-primary)" />}
                    </div>

                    <div
                        onClick={() => toggleTheme('light')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            borderRadius: '8px',
                            background: theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            border: `1px solid ${theme === 'light' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Sun size={20} color={theme === 'light' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                            <span style={{ fontWeight: theme === 'light' ? 600 : 400 }}>Modo Claro</span>
                        </div>
                        {theme === 'light' && <Check size={20} color="var(--color-primary)" />}
                    </div>

                    <div style={{ margin: '0.5rem 0', borderTop: '1px solid var(--color-border)' }}></div>

                    <div
                        onClick={() => navigate('/security')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            borderRadius: '8px',
                            background: 'rgba(59, 130, 246, 0.05)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Shield size={20} color="var(--color-primary)" />
                            <span style={{ fontWeight: 600 }}>Seguridad y Contraseña</span>
                        </div>
                        <ChevronRight size={18} color="var(--color-text-muted)" />
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Sobre la Aplicación</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>Versión 1.0.0 (Beta)</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Desarrollado para Profesionales de Higiene y Seguridad.</p>
            </div>
        </div>
    );
}
