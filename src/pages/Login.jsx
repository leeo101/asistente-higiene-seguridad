import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [view, setView] = useState('login'); // 'login' or 'forgot'
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleLogin = (e) => {
        e.preventDefault();
        // Mock authentication
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/');
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Enviando...' });

        try {
            const response = await fetch('http://localhost:3001/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (response.ok) {
                setStatus({ type: 'success', message: 'Enlace enviado a tu email (ver consola en dev).' });
            } else {
                setStatus({ type: 'error', message: data.error || 'Error al enviar email.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Error de conexión.' });
        }
    };

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'var(--color-primary)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem auto',
                    boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.5)'
                }}>
                    <LogIn size={40} color="white" />
                </div>

                {view === 'login' ? (
                    <>
                        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Bienvenido</h1>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Inicia sesión para continuar</p>

                        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="email">Correo Electrónico</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="tu@email.com"
                                        style={{ paddingLeft: '40px' }}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label htmlFor="password">Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                    <input
                                        type="password"
                                        id="password"
                                        placeholder="••••••••"
                                        style={{ paddingLeft: '40px' }}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ marginTop: '0' }}>
                                Ingresar
                            </button>
                        </form>

                        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            ¿Olvidaste tu contraseña? <a href="#" onClick={(e) => { e.preventDefault(); setView('forgot'); setStatus({ type: '', message: '' }); }} style={{ color: 'var(--color-primary)' }}>Recupérala aquí</a>
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <button onClick={() => setView('login')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                                <ArrowLeft size={20} />
                            </button>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Recuperar Acceso</h2>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', textAlign: 'left' }}>Ingresa tu email y te enviaremos un link para restablecer tu clave.</p>

                        <form onSubmit={handleForgotPassword} style={{ textAlign: 'left' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="email">Correo Electrónico</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="tu@email.com"
                                        style={{ paddingLeft: '40px' }}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {status.message && (
                                <div style={{
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    marginBottom: '1.5rem',
                                    background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: status.type === 'error' ? '#ef4444' : '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    {status.message}
                                </div>
                            )}

                            <button type="submit" className="btn-primary" disabled={status.type === 'loading'} style={{ marginTop: '0' }}>
                                {status.type === 'loading' ? 'Enviando...' : 'Enviar Enlace'}
                            </button>
                        </form>
                    </>
                )}
            </div>

            <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Asistente de Higiene y Seguridad v1.0
            </p>
        </div>
    );
}
