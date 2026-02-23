import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [passwords, setPasswords] = useState({
        new: '',
        confirm: ''
    });
    const [showPass, setShowPass] = useState({ new: false, confirm: false });
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        if (!token) {
            setStatus({ type: 'error', message: 'Token de restablecimiento no válido o ausente.' });
        }
    }, [token]);

    const handleReset = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setStatus({ type: 'error', message: 'Las contraseñas no coinciden.' });
            return;
        }
        if (passwords.new.length < 6) {
            setStatus({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
            return;
        }

        setStatus({ type: 'loading', message: 'Actualizando contraseña...' });

        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
            const fetchUrl = isLocal ? `http://${window.location.hostname}:3001/api/reset-password` : '/api/reset-password';

            // Simulated API call to backend
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: passwords.new })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: '¡Contraseña actualizada con éxito!' });
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setStatus({ type: 'error', message: data.error || 'Error al restablecer la contraseña.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Error de conexión con el servidor.' });
        }
    };

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', maxWidth: '450px' }}>
            <div className="card shadow-lg" style={{ padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto',
                        color: 'var(--color-primary)'
                    }}>
                        <Lock size={32} />
                    </div>
                    <h1 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Nueva Contraseña</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Introduce tu nueva clave de acceso</p>
                </div>

                {!token ? (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <AlertCircle size={32} style={{ margin: '0 auto' }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>{status.message}</p>
                        <button onClick={() => navigate('/login')} className="btn-secondary" style={{ width: '100%' }}>
                            Volver al Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Nueva Contraseña</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass.new ? 'text' : 'password'}
                                    value={passwords.new}
                                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                    required
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '0.8rem', paddingRight: '2.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                                />
                                <button type="button" onClick={() => setShowPass({ ...showPass, new: !showPass.new })} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                                    {showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Confirmar Contraseña</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass.confirm ? 'text' : 'password'}
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    required
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '0.8rem', paddingRight: '2.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                                />
                                <button type="button" onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                                    {showPass.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {status.message && (
                            <div style={{
                                padding: '0.8rem',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#10b981' : 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {status.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status.type === 'loading' || status.type === 'success'}
                            className="btn-primary"
                            style={{ margin: 0 }}
                        >
                            {status.type === 'loading' ? 'Procesando...' : 'Restablecer Contraseña'}
                        </button>
                    </form>
                )}

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                    <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ color: 'var(--color-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={14} /> Volver al inicio de sesión
                    </a>
                </p>
            </div>
        </div>
    );
}
