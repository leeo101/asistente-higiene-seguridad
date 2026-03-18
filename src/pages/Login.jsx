import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, LogIn, Mail, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, CreditCard, Award, GraduationCap, Phone, MapPin, Smartphone, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import { countryList } from '../data/legislationData';
import toast from 'react-hot-toast';

export default function Login() {
    const navigate = useNavigate();
    const { login, signup, currentUser } = useAuth();
    const location = useLocation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [dni, setDni] = useState('');
    const [license, setLicense] = useState('');
    const [profession, setProfession] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [country, setCountry] = useState('argentina');
    const [view, setView] = useState(location.state?.view || 'login'); // 'login', 'register', or 'forgot'
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '', resetLink: '', code: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });

    // Password strength validator
    const validatePasswordStrength = (pwd) => {
        return {
            length: pwd.length >= 8,
            uppercase: /[A-Z]/.test(pwd),
            lowercase: /[a-z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'`~]/.test(pwd)
        };
    };

    const handlePasswordChange = (e) => {
        const pwd = e.target.value;
        setPassword(pwd);
        setPasswordStrength(validatePasswordStrength(pwd));
    };

    const isPasswordStrong = () => {
        return passwordStrength.length && passwordStrength.uppercase &&
            passwordStrength.lowercase && passwordStrength.number && passwordStrength.special;
    };

    // Redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Iniciando sesión...' });
        try {
            await login(email, password);
            navigate('/');
        } catch (error) {
            setStatus({ type: 'error', message: 'Correo o contraseña incorrectos.' });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Validations - Solo campos básicos requeridos
        if (!name || !email || !password || !confirmPassword) {
            return setStatus({ type: 'error', message: 'Nombre, email y contraseña son obligatorios.' });
        }
        if (!acceptedTerms) {
            return setStatus({ type: 'error', message: 'Debes aceptar las Políticas de Privacidad para registrarte.' });
        }

        // Enhanced password validation
        if (password.length < 8) {
            return setStatus({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' });
        }
        if (!/[A-Z]/.test(password)) {
            return setStatus({ type: 'error', message: 'La contraseña debe incluir al menos una letra mayúscula.' });
        }
        if (!/[a-z]/.test(password)) {
            return setStatus({ type: 'error', message: 'La contraseña debe incluir al menos una letra minúscula.' });
        }
        if (!/[0-9]/.test(password)) {
            return setStatus({ type: 'error', message: 'La contraseña debe incluir al menos un número.' });
        }
        if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'`~]/.test(password)) {
            return setStatus({ type: 'error', message: 'La contraseña debe incluir al menos un carácter especial (!@#$%^&*...).' });
        }
        if (password !== confirmPassword) {
            return setStatus({ type: 'error', message: 'Las contraseñas no coinciden.' });
        }

        setStatus({ type: 'loading', message: 'Creando cuenta...' });
        try {
            await signup(email, password, name);

            // Send Welcome Email (Background-ish, don't block navigation)
            try {
                fetch(`${API_BASE_URL}/api/welcome-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, name })
                }).catch(err => console.error('[WELCOME EMAIL ERR]', err));
            } catch (e) {
                console.warn('Welcome email call failed', e);
            }

            // Save minimal professional data - Solo nombre y email
            const personalData = {
                name,
                email,
                dni: dni || '',
                license: license || '',
                profession: profession || '',
                phone: phone || '',
                address: address || '',
                country: country || 'argentina',
                photo: null,
                profileComplete: false // Flag para indicar que falta completar perfil
            };
            localStorage.setItem('personalData', JSON.stringify(personalData));

            toast.success('¡Cuenta creada! Te damos la bienvenida 🎉');
            navigate('/');
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                setStatus({ type: 'error', message: 'Ese correo ya está registrado.' });
            } else if (error.code === 'auth/weak-password') {
                setStatus({ type: 'error', message: 'La contraseña es muy débil. Debe tener 8+ caracteres, mayúscula, minúscula, número y carácter especial.' });
            } else {
                setStatus({ type: 'error', message: `Error: ${error.message}` });
            }
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Enviando...' });

        try {
            const fetchUrl = `${API_BASE_URL}/api/forgot-password`;
            console.log(`[AUTH] Requesting password reset from: ${fetchUrl}`);

            // Add a timeout to the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();
            if (response.ok) {
                setStatus({
                    type: 'success',
                    message: data.devLink ? 'No se pudo enviar el mail, pero aquí tienes tu link o código:' : 'Enlace enviado a tu email. Revisa tu spam.',
                    details: data.devLink || '',
                    suggestion: ''
                });
            } else {
                setStatus({
                    type: 'error',
                    message: data.error || 'Error al enviar email.',
                    details: data.details || '',
                    suggestion: data.suggestion || ''
                });
            }
        } catch (error) {
            console.error('[AUTH] Reset error:', error);
            const msg = error.name === 'AbortError' ? 'El servidor tardó demasiado.' : 'Error de conexión.';
            setStatus({
                type: 'error',
                message: msg,
                details: error.message,
                suggestion: 'Asegúrate de que el servidor backend esté encendido.'
            });
        }
    };

    return (
        <div className="login-page-wrapper" style={{
            minHeight: '100vh',
            background: 'var(--color-background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            width: '100%',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background enhancement for login */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at top right, var(--color-primary) 0%, transparent 40%), radial-gradient(circle at bottom left, var(--color-accent) 0%, transparent 40%)',
                opacity: 0.1,
                pointerEvents: 'none'
            }} />
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '480px',
                padding: '2rem',
                borderRadius: '24px',
                textAlign: 'center',
                animation: 'fadeIn 0.6s ease-out',
                margin: '0 auto'
            }}>
                <img
                    src="/logo.png"
                    alt="Logo de Asistente HYS"
                    className="floating-logo"
                    style={{
                        width: 'auto',
                        height: '90px',
                        margin: '0 auto 2rem auto',
                        display: 'block',
                        filter: 'drop-shadow(0 0 15px var(--color-primary))'
                    }}
                />
                <style>
                    {`
                        @keyframes floatingLogo {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-10px); }
                        }
                        .floating-logo {
                            animation: floatingLogo 3s infinite ease-in-out;
                        }
                        .login-page-wrapper input, .login-page-wrapper select {
                            background: var(--color-surface);
                            border: 1px solid var(--color-border);
                            color: var(--color-text);
                        }
                        .login-page-wrapper label {
                            color: var(--color-text-muted);
                        }
                        .login-page-wrapper h1, .login-page-wrapper h2 {
                            color: var(--color-text);
                            font-family: var(--font-heading);
                        }
                        .dark .login-page-wrapper input, .dark .login-page-wrapper select {
                            background: rgba(255,255,255,0.05);
                            border-color: rgba(255,255,255,0.1);
                            color: white;
                        }
                        .dark .login-page-wrapper label {
                            color: rgba(255,255,255,0.7);
                        }
                        .dark .login-page-wrapper h1, .dark .login-page-wrapper h2 {
                            color: white;
                        }
                        .dark .login-page-wrapper {
                            background: radial-gradient(circle at top right, #1e3a8a 0%, #0f172a 100%) !important;
                        }
                    `}
                </style>

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
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        placeholder="••••••••"
                                        style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                        value={password}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--color-text-muted)',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {status.message && (
                                <div style={{
                                    padding: '0.8rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    marginBottom: '1rem',
                                    background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                    color: status.type === 'error' ? '#ef4444' : 'var(--color-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {status.type === 'error' && <AlertCircle size={18} />}
                                    {status.message}
                                </div>
                            )}

                            <button type="submit" className="btn-primary" disabled={status.type === 'loading'} style={{ marginTop: '0' }}>
                                {status.type === 'loading' ? 'Cargando...' : 'Ingresar'}
                            </button>
                        </form>

                        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            <p style={{ marginBottom: '0.5rem' }}>
                                ¿No tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setView('register'); setStatus({ type: '', message: '' }); }} style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Regístrate</a>
                            </p>
                            <p>
                                ¿Olvidaste tu contraseña? <a href="#" onClick={(e) => { e.preventDefault(); setView('forgot'); setStatus({ type: '', message: '' }); }} style={{ color: 'var(--color-primary)' }}>Recupérala aquí</a>
                            </p>
                        </div>
                    </>
                ) : view === 'register' ? (
                    <>
                        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Crear Cuenta</h1>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Comienza gratis - Solo 3 pasos</p>

                        <form onSubmit={handleRegister} style={{ textAlign: 'left' }}>
                            {/* Paso 1: Datos básicos */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="name">Nombre Completo</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                    <input
                                        type="text"
                                        id="name"
                                        placeholder="Tu Nombre"
                                        style={{ paddingLeft: '40px' }}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

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

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="password">Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        placeholder="••••••••"
                                        style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                        value={password}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--color-text-muted)',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {/* Password Strength Indicator */}
                                <div style={{
                                    marginTop: '0.8rem',
                                    padding: '0.8rem',
                                    background: 'var(--color-surface)',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem'
                                }}>
                                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: 'var(--color-text-muted)' }}>
                                        Requisitos de contraseña:
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.4rem' }}>
                                        {[
                                            { key: 'length', label: '8+ caracteres', icon: '📏' },
                                            { key: 'uppercase', label: 'Mayúscula', icon: 'A' },
                                            { key: 'lowercase', label: 'Minúscula', icon: 'a' },
                                            { key: 'number', label: 'Número', icon: '1' },
                                            { key: 'special', label: 'Carácter especial', icon: '#' }
                                        ].map(req => (
                                            <div
                                                key={req.key}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    color: passwordStrength[req.key] ? '#10b981' : 'var(--color-text-muted)',
                                                    transition: 'color 0.2s'
                                                }}
                                            >
                                                <span style={{ fontSize: '0.9rem' }}>{req.icon}</span>
                                                <span>{req.label}</span>
                                                {passwordStrength[req.key] && (
                                                    <CheckCircle2 size={14} style={{ marginLeft: 'auto' }} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        placeholder="••••••••"
                                        style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--color-text-muted)',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Datos profesionales - Opcionales (se completan después) */}
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(59, 130, 246, 0.08)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '12px',
                                marginBottom: '1.5rem'
                            }}>
                                <p style={{
                                    margin: '0 0 1rem 0',
                                    fontSize: '0.85rem',
                                    fontWeight: '700',
                                    color: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <ShieldCheck size={16} />
                                    Datos profesionales (opcional)
                                </p>
                                <p style={{
                                    margin: '0 0 1rem 0',
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-muted)',
                                    lineHeight: 1.5
                                }}>
                                    Podés completar estos datos después en tu perfil.
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label htmlFor="dni" style={{ fontSize: '0.8rem' }}>DNI</label>
                                        <div style={{ position: 'relative' }}>
                                            <CreditCard size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                            <input
                                                type="text"
                                                id="dni"
                                                placeholder="DNI"
                                                style={{ paddingLeft: '36px', fontSize: '0.9rem' }}
                                                value={dni}
                                                onChange={(e) => setDni(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="license" style={{ fontSize: '0.8rem' }}>Matrícula</label>
                                        <div style={{ position: 'relative' }}>
                                            <Award size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                            <input
                                                type="text"
                                                id="license"
                                                placeholder="Matrícula"
                                                style={{ paddingLeft: '36px', fontSize: '0.9rem' }}
                                                value={license}
                                                onChange={(e) => setLicense(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label htmlFor="profession" style={{ fontSize: '0.8rem' }}>Profesión</label>
                                    <div style={{ position: 'relative' }}>
                                        <GraduationCap size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', zIndex: 1 }} />
                                        <select
                                            id="profession"
                                            value={profession}
                                            onChange={(e) => setProfession(e.target.value)}
                                            style={{ paddingLeft: '36px', fontSize: '0.9rem' }}
                                        >
                                            <option value="">Seleccione profesión</option>
                                            <option value="Técnico">Técnico</option>
                                            <option value="Ingeniero">Ingeniero</option>
                                            <option value="Licenciado">Licenciado</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label htmlFor="country" style={{ fontSize: '0.8rem' }}>País / Región</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', zIndex: 1 }} />
                                        <select
                                            id="country"
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                            style={{ paddingLeft: '36px', fontSize: '0.9rem' }}
                                        >
                                            {countryList.map(c => (
                                                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label htmlFor="phone" style={{ fontSize: '0.8rem' }}>Teléfono</label>
                                        <div style={{ position: 'relative' }}>
                                            <Phone size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                            <input
                                                type="text"
                                                id="phone"
                                                placeholder="Teléfono"
                                                style={{ paddingLeft: '36px', fontSize: '0.9rem' }}
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="address" style={{ fontSize: '0.8rem' }}>Dirección</label>
                                        <div style={{ position: 'relative' }}>
                                            <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                            <input
                                                type="text"
                                                id="address"
                                                placeholder="Dirección"
                                                style={{ paddingLeft: '36px', fontSize: '0.9rem' }}
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    style={{ marginTop: '0.2rem', accentColor: 'var(--color-primary)' }}
                                />
                                <label htmlFor="terms" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.4', margin: 0, fontWeight: 'normal' }}>
                                    Declaro que he leído y acepto las{' '}
                                    <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 'bold', textDecoration: 'underline' }}>
                                        Políticas de Privacidad
                                    </a>{' '}
                                    y de tratamiento de datos.
                                </label>
                            </div>

                            {status.message && (
                                <div style={{
                                    padding: '0.8rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    marginBottom: '1rem',
                                    background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                    color: status.type === 'error' ? '#ef4444' : 'var(--color-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {status.type === 'error' && <AlertCircle size={18} />}
                                    {status.message}
                                </div>
                            )}

                            <button type="submit" className="btn-primary" disabled={status.type === 'loading'} style={{ marginTop: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
                                {status.type === 'loading' ? (
                                    'Creando cuenta...'
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        Crear cuenta gratis
                                    </>
                                )}
                            </button>
                        </form>

                        <p style={{
                            marginTop: '1.5rem',
                            fontSize: '0.85rem',
                            color: 'var(--color-text-muted)',
                            textAlign: 'center',
                            padding: '1rem',
                            background: 'rgba(34, 197, 94, 0.08)',
                            borderRadius: '8px',
                            border: '1px solid rgba(34, 197, 94, 0.2)'
                        }}>
                            ✅ Sin tarjeta de crédito • Configuración rápida en 2 minutos
                        </p>

                        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                            ¿Ya tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); setStatus({ type: '', message: '' }); }} style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Ingresa aquí</a>
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
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                        <span style={{ fontWeight: 600 }}>{status.message}</span>
                                    </div>
                                    {status.details && (
                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                                            <strong>Error:</strong> {status.details}
                                        </p>
                                    )}
                                    {status.suggestion && (
                                        <p style={{ margin: 0, fontSize: '0.8rem' }}>
                                            💡 {status.suggestion}
                                        </p>
                                    )}
                                </div>
                            )}

                            <button type="submit" className="btn-primary" disabled={status.type === 'loading'} style={{ marginTop: '0' }}>
                                {status.type === 'loading' ? 'Enviando...' : 'Enviar Enlace'}
                            </button>
                        </form>
                    </>
                )}
                <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                    Asistente de Higiene y Seguridad v1.1
                </p>
            </div>
        </div>
    );
}
