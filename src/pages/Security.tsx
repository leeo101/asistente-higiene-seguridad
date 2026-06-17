import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Shield, Key, Fingerprint, Smartphone, ChevronRight, Lock, Eye, EyeOff, CheckCircle2, Moon, Sun, Check, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { isError, getErrorMessage } from '../utils/errorUtils';

export default function Security(): React.ReactElement | null {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [toggles, setToggles] = useState({
        biometrics: false,
        twoFactor: false
    });
    const [status, setStatus] = useState({ type: '', message: '', resetLink: '', code: '', details: '', suggestion: '' });

    const toggleFeature = (key) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Enviando...', resetLink: '', code: '', details: '', suggestion: '' });

        try {
            const userEmail = currentUser?.email;
            if (!userEmail) throw new Error('Usuario no identificado');

            // Add a timeout to the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s

            const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (response.ok) {
                setStatus({
                    type: 'success',
                    message: '¡Link enviado con éxito! Revisa tu Gmail.',
                    details: '',
                    suggestion: '',
                    resetLink: '',
                    code: ''
                });

                if (!data.devLink) {
                    setTimeout(() => {
                        setShowPasswordChange(false);
                        setStatus({ type: '', message: '', details: '', suggestion: '', resetLink: '', code: '' });
                    }, 3000);
                }
            } else {
                setStatus({
                    type: 'error',
                    message: data.error || 'Error al enviar el link.',
                    details: data.details || '',
                    suggestion: data.suggestion || '',
                    resetLink: '',
                    code: ''
                });
            }
        } catch (error) {
            console.error('[SECURITY] Password reset error:', error);
            const isAbort = isError(error) && error.name === 'AbortError';
            const errorMsg = isAbort ? 'El servidor tardó demasiado en responder.' : 'Error de conexión con el servidor.';
            setStatus({ type: 'error', message: errorMsg, details: getErrorMessage(error), suggestion: 'Asegúrate de que el servidor backend esté corriendo.', resetLink: '', code: '' });
        }
    };

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '4rem', maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)}
                    style={{
                        padding: '0.6rem',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={20}  />
                        </button>
                <div>
                    <h1 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 900, letterSpacing: '-0.5px' }}>Seguridad y Contraseña</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Gestioná el acceso a tu cuenta</p>
                </div>
            </div>

            {!showPasswordChange ? (
                <>
                    <div style={{ 
                        background: 'rgba(var(--color-surface-rgb), 0.5)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.6rem', borderRadius: '12px', color: 'var(--color-primary)', display: 'flex' }}>
                                <Shield size={22} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>Acceso y Contraseña</h3>
                        </div>

                        <div
                            onClick={() => setShowPasswordChange(true)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '1.1rem 1.2rem', borderRadius: '14px',
                                background: 'var(--color-background)',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.06)';
                                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--color-background)';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '42px', height: '42px',
                                    background: 'rgba(56, 189, 248, 0.1)',
                                    borderRadius: '12px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Key size={20} color="var(--color-primary)" />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Cambiar Contraseña</h4>
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Te enviaremos un link a tu email</p>
                                </div>
                            </div>
                            <ChevronRight size={20} color="var(--color-text-secondary)" />
                        </div>
                    </div>

                    <div style={{ 
                        background: 'rgba(var(--color-surface-rgb), 0.5)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '20px', padding: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.6rem', borderRadius: '12px', color: 'var(--color-primary)', display: 'flex' }}>
                                <Smartphone size={22} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>Seguridad Avanzada</h3>
                        </div>

                        {[{ key: 'biometrics', Icon: Fingerprint, title: 'Biometría', desc: 'Huella o reconocimiento facial' },
                          { key: 'twoFactor', Icon: Lock, title: 'Doble Factor (2FA)', desc: 'Código extra al iniciar sesión' }
                        ].map(({ key, Icon, title, desc }, idx, arr) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: idx < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                <div style={{
                                    width: '40px', height: '40px',
                                    background: toggles[key] ? 'rgba(56, 189, 248, 0.12)' : 'var(--color-background)',
                                    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: toggles[key] ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    transition: 'all 0.3s'
                                }}>
                                    <Icon size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{title}</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{desc}</p>
                                </div>
                                <div
                                    onClick={() => toggleFeature(key)}
                                    style={{
                                        width: '48px', height: '26px',
                                        background: toggles[key] ? '#38bdf8' : 'var(--color-border)',
                                        borderRadius: '13px', position: 'relative',
                                        cursor: 'pointer', transition: 'all 0.3s ease',
                                        boxShadow: toggles[key] ? '0 4px 10px rgba(56, 189, 248, 0.3)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '20px', height: '20px', background: 'white',
                                        borderRadius: '50%', position: 'absolute', top: '3px',
                                        left: toggles[key] ? '25px' : '3px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div style={{ 
                    background: 'rgba(var(--color-surface-rgb), 0.5)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '20px', padding: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <button onClick={() => setShowPasswordChange(false)}
                            style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '10px', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-background)'} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={18}  />
                        </button>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Cambiar Contraseña</h3>
                        </div>
                    </div>

                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        Por seguridad, te enviaremos un enlace a tu correo electrónico para que puedas establecer una nueva contraseña.
                    </p>

                    <form onSubmit={handlePasswordChange}>
                        {status.message && (
                            <div style={{
                                padding: '1.2rem',
                                borderRadius: '12px',
                                fontSize: '0.9rem',
                                marginBottom: '1.5rem',
                                background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#10b981' : 'var(--color-primary)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.8rem',
                                border: `1px solid ${status.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {status.type === 'success' && <CheckCircle2 size={18} />}
                                    <span style={{ fontWeight: 600 }}>{status.message}</span>
                                </div>
                                {status.details && (
                                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                                        <strong>Error técnico:</strong> {status.details}
                                    </p>
                                )}
                                {status.suggestion && (
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500 }}>
                                        💡 {status.suggestion}
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status.type === 'loading' || status.type === 'success'}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                width: '100%', padding: '1.1rem', margin: 0,
                                background: status.type === 'success' ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #38bdf8, #3b82f6)',
                                color: 'white', border: 'none', borderRadius: '14px',
                                fontSize: '1rem', fontWeight: 800, cursor: status.type === 'loading' ? 'default' : 'pointer',
                                boxShadow: '0 8px 20px rgba(56, 189, 248, 0.3)',
                                opacity: status.type === 'loading' ? 0.8 : 1,
                                transition: 'all 0.3s'
                            }}
                        >
                            {status.type === 'loading' ? 'Enviando...' : status.type === 'success' ? <><CheckCircle2 size={18} /> ¡Enviado!</> : 'Enviar Link de Recuperación'}
                        </button>
                    </form>
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.04)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    🔒 Tu seguridad es nuestra prioridad. Todos los datos están cifrados de extremo a extremo.
                </p>
            </div>
        </div>
    );
}
