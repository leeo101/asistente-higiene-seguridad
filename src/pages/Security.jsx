import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Key, Fingerprint, Smartphone, ChevronRight, Lock, Eye, EyeOff, CheckCircle2, Moon, Sun, Check } from 'lucide-react';

export default function Security() {
    const navigate = useNavigate();
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [toggles, setToggles] = useState({
        biometrics: false,
        twoFactor: false
    });
    const [status, setStatus] = useState({ type: '', message: '' });

    const toggleFeature = (key) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        setStatus({ type: 'loading', message: 'Enviando link de recuperación...' });

        try {
            const userEmail = JSON.parse(localStorage.getItem('user'))?.email || 'usuario@ejemplo.com';

            const response = await fetch('http://localhost:3001/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: '¡Link enviado con éxito! Revisa tu Gmail.' });
                setTimeout(() => {
                    setShowPasswordChange(false);
                    setStatus({ type: '', message: '' });
                }, 3000);
            } else {
                setStatus({ type: 'error', message: data.error || 'Error al enviar el link.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Error de conexión con el servidor.' });
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '2rem', maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/settings')}
                    style={{
                        padding: '0.5rem',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Seguridad y Contraseña</h1>
            </div>

            {!showPasswordChange ? (
                <>
                    <div className="card shadow-sm" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                            <Shield size={24} color="var(--color-primary)" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Acceso y Acceso Local</h3>
                        </div>

                        <div
                            onClick={() => setShowPasswordChange(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                borderRadius: '12px',
                                background: 'rgba(59, 130, 246, 0.05)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                marginBottom: '1rem'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'white',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    <Key size={18} color="var(--color-primary)" />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Cambiar Contraseña</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Te enviaremos un link a tu email</p>
                                </div>
                            </div>
                            <ChevronRight size={18} color="var(--color-text-muted)" />
                        </div>
                    </div>

                    <div className="card shadow-sm">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                            <Smartphone size={24} color="var(--color-primary)" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Seguridad Avanzada</h3>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem 0', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ color: 'var(--color-text-muted)' }}><Fingerprint size={20} /></div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>Biometría</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Huella o reconocimiento facial</p>
                            </div>
                            <div
                                onClick={() => toggleFeature('biometrics')}
                                style={{
                                    width: '44px',
                                    height: '24px',
                                    background: toggles.biometrics ? 'var(--color-primary)' : 'var(--color-border)',
                                    borderRadius: '12px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '3px',
                                    left: toggles.biometrics ? '23px' : '3px',
                                    transition: 'all 0.3s ease'
                                }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem 0' }}>
                            <div style={{ color: 'var(--color-text-muted)' }}><Lock size={20} /></div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>Doble Factor (2FA)</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Código extra al iniciar sesión</p>
                            </div>
                            <div
                                onClick={() => toggleFeature('twoFactor')}
                                style={{
                                    width: '44px',
                                    height: '24px',
                                    background: toggles.twoFactor ? 'var(--color-primary)' : 'var(--color-border)',
                                    borderRadius: '12px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '3px',
                                    left: toggles.twoFactor ? '23px' : '3px',
                                    transition: 'all 0.3s ease'
                                }} />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="card animate-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <button onClick={() => setShowPasswordChange(false)} style={{ padding: '0.4rem', background: 'var(--color-surface-hover)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: 'var(--color-text)' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Cambiar Contraseña</h3>
                    </div>

                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Por seguridad, te enviaremos un enlace a tu correo electrónico para que puedas establecer una nueva contraseña.
                    </p>

                    <form onSubmit={handlePasswordChange}>
                        {status.message && (
                            <div style={{
                                padding: '1rem',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                marginBottom: '1rem',
                                background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#10b981' : 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                {status.type === 'success' && <CheckCircle2 size={16} />}
                                {status.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status.type === 'loading' || status.type === 'success'}
                            className="btn-primary"
                            style={{ margin: 0 }}
                        >
                            {status.type === 'loading' ? 'Enviando...' : 'Enviar Link de Recuperación'}
                        </button>
                    </form>
                </div>
            )}

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
                Tu seguridad es nuestra prioridad. Todos los datos están cifrados de extremo a extremo.
            </p>
        </div>
    );
}
