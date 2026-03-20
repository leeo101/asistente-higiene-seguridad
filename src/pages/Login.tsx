import { useNavigate, useLocation, NavigateFunction, Location } from 'react-router-dom';
import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { User, Lock, LogIn, Mail, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, CreditCard, Award, GraduationCap, Phone, MapPin, Smartphone, ExternalLink, Eye, EyeOff, LucideIcon } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import { countryList } from '../data/legislationData';
import toast from 'react-hot-toast';

// Tipos
interface PasswordStrength {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

interface Status {
  type: 'loading' | 'error' | 'success' | '';
  message: string;
  resetLink?: string;
  code?: string;
  details?: string;
  suggestion?: string;
}

interface PersonalData {
  name: string;
  email: string;
  dni?: string;
  license?: string;
  profession?: string;
  phone?: string;
  address?: string;
  country: string;
  photo: string | null;
  profileComplete: boolean;
}

type ViewType = 'login' | 'register' | 'forgot';

export default function Login(): React.ReactElement {
  const { login, signup, signInWithGoogle, currentUser } = useAuth();
  const navigate: NavigateFunction = useNavigate();
  const location: Location = useLocation();
  
  // Form states
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [dni, setDni] = useState<string>('');
  const [license, setLicense] = useState<string>('');
  const [profession, setProfession] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [country, setCountry] = useState<string>('argentina');
  const [view, setView] = useState<ViewType>(location.state?.view || 'login');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [status, setStatus] = useState<Status>({ type: '', message: '', resetLink: '', code: '' });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Password strength validator
  const validatePasswordStrength = (pwd: string): PasswordStrength => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'`~]/.test(pwd)
    };
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(validatePasswordStrength(pwd));
  };

  const isPasswordStrong = (): boolean => {
    return passwordStrength.length && passwordStrength.uppercase &&
      passwordStrength.lowercase && passwordStrength.number && passwordStrength.special;
  };

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Iniciando sesión...' });
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      setStatus({ type: 'error', message: 'Correo o contraseña incorrectos.' });
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      toast.loading('Iniciando sesión con Google...', { duration: 1000 });
      await signInWithGoogle();
      toast.success('¡Bienvenido! 🎉');
      navigate('/');
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Inicio de sesión cancelado');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('Este email ya está registrado. Usá tu contraseña habitual.');
      } else {
        toast.error('Error al iniciar con Google: ' + error.message);
      }
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validations
    if (!name || !email || !password || !confirmPassword) {
      setStatus({ type: 'error', message: 'Nombre, email y contraseña son obligatorios.' });
      return;
    }
    if (!acceptedTerms) {
      setStatus({ type: 'error', message: 'Debes aceptar las Políticas de Privacidad.' });
      return;
    }

    // Password validation
    if (password.length < 8) {
      setStatus({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setStatus({ type: 'error', message: 'La contraseña debe incluir una mayúscula.' });
      return;
    }
    if (!/[a-z]/.test(password)) {
      setStatus({ type: 'error', message: 'La contraseña debe incluir una minúscula.' });
      return;
    }
    if (!/[0-9]/.test(password)) {
      setStatus({ type: 'error', message: 'La contraseña debe incluir un número.' });
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'`~]/.test(password)) {
      setStatus({ type: 'error', message: 'La contraseña debe incluir un carácter especial.' });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Creando cuenta...' });
    try {
      await signup(email, password, name);

      // Send Welcome Email
      try {
        fetch(`${API_BASE_URL}/api/welcome-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name })
        }).catch(err => console.error('[WELCOME EMAIL ERR]', err));
      } catch (error) {
        console.warn('Welcome email call failed', error);
      }

      // Save personal data
      const personalData: PersonalData = {
        name,
        email,
        dni: dni || '',
        license: license || '',
        profession: profession || '',
        phone: phone || '',
        address: address || '',
        country: country || 'argentina',
        photo: null,
        profileComplete: false
      };
      localStorage.setItem('personalData', JSON.stringify(personalData));

      toast.success('¡Cuenta creada! 🎉');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setStatus({ type: 'error', message: 'Ese correo ya está registrado.' });
      } else if (error.code === 'auth/weak-password') {
        setStatus({ type: 'error', message: 'Contraseña débil.' });
      } else {
        setStatus({ type: 'error', message: `Error: ${error.message}` });
      }
    }
  };

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Enviando...' });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
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
          message: data.devLink ? 'Link generado:' : 'Enlace enviado a tu email.',
          resetLink: data.devLink || ''
        });
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Error al enviar email.'
        });
      }
    } catch (error: any) {
      const msg = error.name === 'AbortError' ? 'El servidor tardó demasiado.' : 'Error de conexión.';
      setStatus({ type: 'error', message: msg });
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
      {/* Background enhancement */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
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
          `}
        </style>

        {view === 'login' && (
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

            {/* Google Sign-In */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              margin: '1.5rem 0',
              color: 'var(--color-text-muted)',
              fontSize: '0.85rem'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              <span>o continuá con</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            </div>

            <button
              onClick={handleGoogleSignIn}
              style={{
                width: '100%',
                padding: '0.9rem',
                background: '#ffffff',
                color: '#1e293b',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.8rem',
                transition: 'all 0.2s',
                marginBottom: '1rem'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M18.125 8.125H10V11.875H14.6875C14.3125 13.875 12.875 15.5 10 15.5C6.6875 15.5 4.0625 12.8125 4.0625 10C4.0625 7.1875 6.6875 4.5 10 4.5C11.5625 4.5 12.875 5.0625 13.875 6.0625L16.5625 3.375C14.875 1.8125 12.5625 1 10 1C4.5625 1 0 5.5625 0 11C0 16.4375 4.5625 21 10 21C15.4375 21 19.375 17 19.375 12.5C19.375 11.6875 19.3125 10.9375 19.1875 10.1875H18.125V8.125Z" fill="#4285F4"/>
              </svg>
              Continuar con Google
            </button>

            <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                ¿No tienes cuenta?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setView('register'); setStatus({ type: '', message: '' }); }} style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Regístrate</a>
              </p>
              <p>
                ¿Olvidaste tu contraseña?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setView('forgot'); setStatus({ type: '', message: '' }); }} style={{ color: 'var(--color-primary)' }}>Recupérala aquí</a>
              </p>
            </div>
          </>
        )}

        {view === 'register' && (
          <>
            <button
              onClick={() => setView('login')}
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'var(--color-surface)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-text)',
                zIndex: 10
              }}
            >
              <ArrowLeft size={20} />
            </button>

            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Crear Cuenta</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Comienza gratis</p>

            <form onSubmit={handleRegister} style={{ textAlign: 'left' }}>
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
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Password strength indicator */}
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ color: passwordStrength.length ? '#10b981' : 'inherit' }}>• 8 caracteres</span>
                    <span style={{ color: passwordStrength.uppercase ? '#10b981' : 'inherit' }}>• Mayúscula</span>
                    <span style={{ color: passwordStrength.lowercase ? '#10b981' : 'inherit' }}>• Minúscula</span>
                    <span style={{ color: passwordStrength.number ? '#10b981' : 'inherit' }}>• Número</span>
                    <span style={{ color: passwordStrength.special ? '#10b981' : 'inherit' }}>• Especial</span>
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
                    style={{ paddingLeft: '40px' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="country">País</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{ paddingLeft: '40px', width: '100%' }}
                    required
                  >
                    {countryList.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    style={{ marginTop: '0.2rem' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Acepto las <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Políticas de Privacidad</a>
                  </span>
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

              <button type="submit" className="btn-primary" disabled={status.type === 'loading'} style={{ marginTop: '0' }}>
                {status.type === 'loading' ? 'Creando...' : 'Registrarme'}
              </button>
            </form>
          </>
        )}

        {view === 'forgot' && (
          <>
            <button
              onClick={() => setView('login')}
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'var(--color-surface)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-text)',
                zIndex: 10
              }}
            >
              <ArrowLeft size={20} />
            </button>

            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Recuperar Contraseña</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Te enviaremos un enlace</p>

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
                  padding: '0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                  background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  color: status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#10b981' : 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {status.type === 'error' && <AlertCircle size={18} />}
                  {status.type === 'success' && <CheckCircle2 size={18} />}
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
    </div>
  );
}
