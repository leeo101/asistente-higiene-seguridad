import { useNavigate, useLocation, NavigateFunction, Location } from 'react-router-dom';
import React, { useEffect, useState, useRef, ChangeEvent, FormEvent } from 'react';
import { User, Lock, LogIn, Mail, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, CreditCard, Award, GraduationCap, Phone, MapPin, Smartphone, ExternalLink, Eye, EyeOff, Shield, LucideIcon } from 'lucide-react';

// ─── Brute-force protection constants ────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos
const ATTEMPTS_KEY = 'login_attempts';
const LOCKOUT_KEY = 'login_lockout_until';
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

  // ─── Brute-force protection state ──────────────────────────────────────────
  const [loginAttempts, setLoginAttempts] = useState<number>(() => {
    return parseInt(sessionStorage.getItem(ATTEMPTS_KEY) || '0', 10);
  });
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    return parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10);
  });
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState<number>(0);
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer para el bloqueo
  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutSecondsLeft(remaining);
      } else {
        setLockoutSecondsLeft(0);
        if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
      }
    };
    if (lockoutUntil > Date.now()) {
      updateCountdown();
      lockoutTimerRef.current = setInterval(updateCountdown, 1000);
    }
    return () => { if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current); };
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil > Date.now() && lockoutSecondsLeft > 0;

  const recordFailedAttempt = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    sessionStorage.setItem(ATTEMPTS_KEY, String(newAttempts));
    if (newAttempts >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_DURATION_MS;
      setLockoutUntil(until);
      sessionStorage.setItem(LOCKOUT_KEY, String(until));
    }
  };

  const clearAttempts = () => {
    setLoginAttempts(0);
    setLockoutUntil(0);
    sessionStorage.removeItem(ATTEMPTS_KEY);
    sessionStorage.removeItem(LOCKOUT_KEY);
  };

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

    // Verificar bloqueo por intentos fallidos
    if (isLockedOut) {
      const mins = Math.ceil(lockoutSecondsLeft / 60);
      setStatus({ type: 'error', message: `Cuenta bloqueada temporalmente. Intentá en ${lockoutSecondsLeft}s.` });
      return;
    }

    setStatus({ type: 'loading', message: 'Iniciando sesión...' });
    try {
      await login(email, password);
      clearAttempts(); // Limpiar contadores en login exitoso
      navigate('/');
    } catch (error: any) {
      recordFailedAttempt();
      const remaining = MAX_ATTEMPTS - (loginAttempts + 1);
      if (loginAttempts + 1 >= MAX_ATTEMPTS) {
        setStatus({ type: 'error', message: `Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.` });
      } else {
        setStatus({
          type: 'error',
          message: `Correo o contraseña incorrectos. Te quedan ${remaining} intento${remaining !== 1 ? 's' : ''}.`
        });
      }
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
        }).catch((err) => console.error('[WELCOME EMAIL ERR]', err));
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
    <div className="login-page-wrapper min-h-[100vh] bg-[linear-gradient(135deg,_#f8fafc_0%,_#e2e8f0_100%)] flex items-center justify-center p-[1.5rem] w-[100%] box-sizing-[border-box] relative overflow-[hidden]">










      
      {/* Background enhancement: Mesh Gradient Effect */}
      <div className="absolute top-[0] left-[0] right-[0] bottom-[0] bg-[radial-gradient(circle_at_top_right,_rgba(139,_92,_246,_0.4)_0%,_transparent_40%),_radial-gradient(circle_at_bottom_left,_rgba(59,_130,_246,_0.4)_0%,_transparent_40%),_radial-gradient(circle_at_50%_50%,_rgba(16,_185,_129,_0.2)_0%,_transparent_50%)] opacity-[0.8] filter-[blur(60px)] pointer-events-[none]" />






      

      {/* Decorative Orbs */}
      <div className="absolute top-[10%] left-[15%] w-[300px] h-[300px] bg-[rgba(139,_92,_246,_0.3)] rounded-[50%] filter-[blur(80px)] animation-[float_10s_ease-in-out_infinite]" />
      <div className="absolute bottom-[10%] right-[15%] w-[250px] h-[250px] bg-[rgba(59,_130,_246,_0.3)] rounded-[50%] filter-[blur(80px)] animation-[float_12s_ease-in-out_infinite_reverse]" />

      <div className="login-card w-[100%] max-w-[480px] rounded-[24px] text-center bg-[rgba(255,_255,_255,_0.7)] backdrop-filter-[blur(20px)] webkit-backdrop-filter-[blur(20px)] border-[1px_solid_rgba(255,_255,_255,_0.5)] box-shadow-[0_25px_50px_-12px_rgba(0,_0,_0,_0.15)] animation-[fadeIn_0.6s_ease-out,_slideUp_0.6s_ease-out] m-[0_auto] relative z-[1] box-sizing-[border-box]">














        
        <img
          src="/logo.png"
          alt="Logo de Asistente HYS"
          className="floating-logo w-[auto] h-[90px] m-[0_auto_2rem_auto] block filter-[drop-shadow(0_0_15px_var(--color-primary))]" />







        

        <style>
          {`
            @keyframes floatingLogo {
              0%, 100% { transform: translateY(0); filter: drop-shadow(0 10px 15px rgba(59, 130, 246, 0.4)); }
              50% { transform: translateY(-10px); filter: drop-shadow(0 15px 25px rgba(59, 130, 246, 0.6)); }
            }
            .floating-logo {
              animation: floatingLogo 4s infinite ease-in-out;
            }

            .login-card {
              padding: 2.5rem 2rem;
            }

            @media (max-width: 600px) {
              .login-card {
                padding: 2rem 1.2rem !important;
              }
              .login-page-wrapper {
                padding: 1rem !important;
              }
              .floating-logo {
                height: 70px !important;
                margin-bottom: 1.5rem !important;
              }
            }
            
            /* Glassmorphism Inputs */
            .login-page-wrapper input, .login-page-wrapper select {
              display: block !important;
              width: 100% !important;
              box-sizing: border-box !important;
              background: rgba(255, 255, 255, 0.6) !important;
              border: 1px solid rgba(255, 255, 255, 0.8) !important;
              color: #1e293b !important;
              border-radius: 14px;
              padding: 0.85rem;
              padding-left: 45px !important;
              transition: all 0.3s ease;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            }
            
            .dark .login-page-wrapper input, .dark .login-page-wrapper select {
               background: rgba(15, 23, 42, 0.6) !important;
               border: 1px solid rgba(255, 255, 255, 0.1) !important;
               color: #f8fafc !important;
            }

            .login-page-wrapper input:focus, .login-page-wrapper select:focus {
              background: rgba(255, 255, 255, 0.9) !important;
              border-color: #3b82f6 !important;
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
              transform: translateY(-2px);
            }

            .dark .login-page-wrapper input:focus, .dark .login-page-wrapper select:focus {
               background: rgba(15, 23, 42, 0.9) !important;
            }

            .login-page-wrapper label {
              color: #475569;
              font-weight: 700;
              font-size: 0.9rem;
              margin-bottom: 0.4rem;
              display: block;
            }
            
            .dark .login-page-wrapper label {
               color: #cbd5e1;
            }

            .login-page-wrapper h1, .login-page-wrapper h2 {
              color: #0f172a;
              font-family: var(--font-heading);
              font-weight: 900;
              letter-spacing: -0.5px;
            }
            
            .dark .login-page-wrapper h1, .dark .login-page-wrapper h2 {
               color: #f8fafc;
            }
            
            .btn-glass-primary {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              border: none;
              padding: 0.9rem;
              border-radius: 14px;
              font-weight: 700;
              font-size: 1rem;
              width: 100%;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
              margin-top: 1rem;
            }
            
            .btn-glass-primary:hover {
              transform: translateY(-3px);
              box-shadow: 0 15px 25px -5px rgba(59, 130, 246, 0.5);
            }
            
            .btn-glass-primary:active {
              transform: translateY(0);
            }
            
            .dark .login-page-wrapper > div:last-child {
               background: rgba(15, 23, 42, 0.7) !important;
               border: 1px solid rgba(255, 255, 255, 0.1) !important;
               box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
            }
          `}
        </style>

        {view === 'login' &&
        <>
            <h1 className="text-[1.8rem] mb-[0.5rem]">Bienvenido</h1>
            <p className="text-[var(--color-text-muted)] mb-[2rem]">Inicia sesión para continuar</p>

            <form onSubmit={handleLogin} className="text-left">
              {/* Lockout banner */}
              {isLockedOut && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <Shield size={22} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.9rem' }}>
                      Cuenta bloqueada temporalmente
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      Demasiados intentos fallidos. Podés volver a intentar en{' '}
                      <strong style={{ color: '#ef4444' }}>
                        {Math.floor(lockoutSecondsLeft / 60)}:{String(lockoutSecondsLeft % 60).padStart(2, '0')}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Attempt indicator */}
              {!isLockedOut && loginAttempts > 0 && loginAttempts < MAX_ATTEMPTS && (
                <div style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  marginBottom: '0.75rem',
                  fontSize: '0.78rem',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={14} />
                  {MAX_ATTEMPTS - loginAttempts} intento{MAX_ATTEMPTS - loginAttempts !== 1 ? 's' : ''} restante{MAX_ATTEMPTS - loginAttempts !== 1 ? 's' : ''} antes del bloqueo
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="email">Correo Electrónico</label>
                <div className="relative w-[100%]">
                  <User size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                  <input
                  type="email"
                  id="email"
                  placeholder="tu@email.com"

                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required className="pl-[40px]" />
                
                </div>
              </div>

              <div className="mb-8">
                <label htmlFor="password">Contraseña</label>
                <div className="relative w-[100%]">
                  <Lock size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                  <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"

                  value={password}
                  onChange={handlePasswordChange}
                  required className="pl-[40px] pr-[40px]" />
                
                  <button type="button" onClick={() => setShowPassword(!showPassword)}





                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-[14px] top-[50%] transform-[translateY(-50%)] bg-[none] border-none cursor-pointer text-[#64748b] flex items-center p-[0]">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {status.message &&
                <div style={{
                  background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  color: status.type === 'error' ? '#ef4444' : 'var(--color-text-muted)'
                }} className="p-[0.8rem] rounded-[8px] text-[0.9rem] mb-[1rem] flex items-center gap-[0.5rem]">
                  {status.type === 'error' && <AlertCircle size={18} />}
                  {status.message}
                </div>
              }

              <button type="submit" className="btn-glass-primary" disabled={status.type === 'loading' || isLockedOut} style={isLockedOut ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                {isLockedOut ? `Bloqueado (${Math.floor(lockoutSecondsLeft / 60)}:${String(lockoutSecondsLeft % 60).padStart(2, '0')})` : status.type === 'loading' ? 'Cargando...' : 'Ingresar'}
              </button>
            </form>

            {/* Google Sign-In */}

            <div className="flex items-center gap-[1rem] m-[1.5rem_0] text-[var(--color-text-muted)] text-[0.85rem]">






            
              <div className="flex-[1] h-[1px] bg-[var(--color-border)]" />
              <span>o continuá con</span>
              <div className="flex-[1] h-[1px] bg-[var(--color-border)]" />
            </div>

            <button
            onClick={handleGoogleSignIn}



















            onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';e.currentTarget.style.background = '#ffffff';}}
            onMouseOut={(e) => {e.currentTarget.style.transform = 'translateY(0)';e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';}} className="w-[100%] p-[0.9rem] bg-[rgba(255,_255,_255,_0.8)] backdrop-filter-[blur(10px)] text-[#1e293b] border-[1px_solid_rgba(203,_213,_225,_0.8)] rounded-[14px] font-[700] text-[0.95rem] cursor-pointer flex items-center justify-center gap-[0.8rem] transition-[all_0.3s_ease] mb-[1rem] box-shadow-[0_4px_6px_-1px_rgba(0,_0,_0,_0.05)]">
            
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M18.125 8.125H10V11.875H14.6875C14.3125 13.875 12.875 15.5 10 15.5C6.6875 15.5 4.0625 12.8125 4.0625 10C4.0625 7.1875 6.6875 4.5 10 4.5C11.5625 4.5 12.875 5.0625 13.875 6.0625L16.5625 3.375C14.875 1.8125 12.5625 1 10 1C4.5625 1 0 5.5625 0 11C0 16.4375 4.5625 21 10 21C15.4375 21 19.375 17 19.375 12.5C19.375 11.6875 19.3125 10.9375 19.1875 10.1875H18.125V8.125Z" fill="#4285F4" />
              </svg>
              Continuar con Google
            </button>

            <div className="mt-[1.5rem] text-[0.9rem] text-[var(--color-text-muted)]">
              <p className="mb-[0.5rem]">
                ¿No tienes cuenta?{' '}
                <a href="#" onClick={(e) => {e.preventDefault();setView('register');setStatus({ type: '', message: '' });}} className="text-[var(--color-primary)] font-[bold]">Regístrate</a>
              </p>
              <p>
                ¿Olvidaste tu contraseña?{' '}
                <a href="#" onClick={(e) => {e.preventDefault();setView('forgot');setStatus({ type: '', message: '' });}} className="text-[var(--color-primary)]">Recupérala aquí</a>
              </p>
            </div>
          </>
        }

        {view === 'register' &&
        <>
            <></>

            <h1 className="text-[1.8rem] mb-[0.5rem]">Crear Cuenta</h1>
            <p className="text-[var(--color-text-muted)] mb-[2rem]">Comienza gratis</p>

            <form onSubmit={handleRegister} className="text-left">
              <div className="mb-6">
                <label htmlFor="name">Nombre Completo</label>
                <div className="relative w-[100%]">
                  <User size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                  <input
                  type="text"
                  id="name"
                  placeholder="Tu Nombre"

                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required className="pl-[40px]" />
                
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="email">Correo Electrónico</label>
                <div className="relative w-[100%]">
                  <Mail size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                  <input
                  type="email"
                  id="email"
                  placeholder="tu@email.com"

                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required className="pl-[40px]" />
                
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="password">Contraseña</label>
                <div className="relative w-[100%]">
                  <Lock size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                  <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"

                  value={password}
                  onChange={handlePasswordChange}
                  required className="pl-[40px] pr-[40px]" />
                
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-[12px] top-[50%] transform-[translateY(-50%)] bg-[none] border-none cursor-pointer text-[var(--color-text-muted)]">










                  
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Password strength indicator */}
                <div className="mt-[0.5rem] text-[0.75rem] text-[var(--color-text-muted)]">
                  <div className="flex gap-[0.3rem] flex-wrap">
                    <span style={{ color: passwordStrength.length ? '#10b981' : 'inherit' }}>• 8 caracteres</span>
                    <span style={{ color: passwordStrength.uppercase ? '#10b981' : 'inherit' }}>• Mayúscula</span>
                    <span style={{ color: passwordStrength.lowercase ? '#10b981' : 'inherit' }}>• Minúscula</span>
                    <span style={{ color: passwordStrength.number ? '#10b981' : 'inherit' }}>• Número</span>
                    <span style={{ color: passwordStrength.special ? '#10b981' : 'inherit' }}>• Especial</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                <div className="relative w-[100%]">
                  <Lock size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                  <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="••••••••"

                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required className="pl-[40px]" />
                
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="country">País</label>
                <div className="relative w-[100%]">
                  <MapPin size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                  <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}

                  required className="pl-[40px] w-[100%]">
                  
                    {countryList.map((c) =>
                  <option key={c.code} value={c.code}>{c.name}</option>
                  )}
                  </select>
                </div>
              </div>

              {/* Optional Professional Info Section */}
              <div className="m-[2.5rem_0_1.5rem] p-[1.5rem] border-[1px_solid_var(--color-border)] rounded-[16px] bg-[rgba(59,_130,_246,_0.03)]">
                <div className="flex items-center gap-[0.6rem] mb-[1.2rem] text-[var(--color-primary)]">
                  <Award size={20} />
                  <h3 className="m-[0] text-[1rem] font-[800]">Información Profesional (Opcional)</h3>
                </div>

                <div className="mb-[1.2rem]">
                  <label htmlFor="profession">Profesión / Título</label>
                  <div className="relative w-[100%]">
                    <GraduationCap size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                    <select
                    id="profession"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)} className="pl-[40px] w-[100%]">

                    
                      <option value="">Seleccione su título</option>
                      <option value="Técnico">Técnico</option>
                      <option value="Licenciado">Licenciado</option>
                      <option value="Ingeniero">Ingeniero</option>
                    </select>
                  </div>
                </div>

                <div className="mb-[1.2rem]">
                  <label htmlFor="license">Matrícula Profesional</label>
                  <div className="relative w-[100%]">
                    <Award size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                    <input
                    type="text"
                    id="license"
                    placeholder="Ej: MP 1234"

                    value={license}
                    onChange={(e) => setLicense(e.target.value)} className="pl-[40px]" />
                  
                  </div>
                </div>

                <div className="mb-[1.2rem]">
                  <label htmlFor="dni">DNI / Cédula</label>
                  <div className="relative w-[100%]">
                    <CreditCard size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                    <input
                    type="text"
                    id="dni"
                    placeholder="Identificación"

                    value={dni}
                    onChange={(e) => setDni(e.target.value)} className="pl-[40px]" />
                  
                  </div>
                </div>

                <div className="mb-[0]">
                  <label htmlFor="phone">Teléfono de Contacto</label>
                  <div className="relative w-[100%]">
                    <Phone size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                    <input
                    type="tel"
                    id="phone"
                    placeholder="+54 9..."

                    value={phone}
                    onChange={(e) => setPhone(e.target.value)} className="pl-[40px]" />
                  
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-start gap-[0.5rem] cursor-pointer">
                  <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-[0.2rem]" />

                
                  <span className="text-[0.85rem] text-[var(--color-text-muted)]">
                    Acepto las <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)]">Políticas de Privacidad</a>
                  </span>
                </label>
              </div>

              {status.message &&
            <div style={{




              background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              color: status.type === 'error' ? '#ef4444' : 'var(--color-text-muted)'



            }} className="p-[0.8rem] rounded-[8px] text-[0.9rem] mb-[1rem] flex items-center gap-[0.5rem]">
                  {status.type === 'error' && <AlertCircle size={18} />}
                  {status.message}
                </div>
            }

              <button type="submit" className="btn-glass-primary" disabled={status.type === 'loading'}>
                {status.type === 'loading' ? 'Creando...' : 'Registrarme'}
              </button>
            </form>
          </>
        }

        {view === 'forgot' &&
        <>
            <></>

            <h1 className="text-[1.8rem] mb-[0.5rem]">Recuperar Contraseña</h1>
            <p className="text-[var(--color-text-muted)] mb-[2rem]">Te enviaremos un enlace</p>

            <form onSubmit={handleForgotPassword} className="text-left">
              <div className="mb-6">
                <label htmlFor="email">Correo Electrónico</label>
                <div className="relative w-[100%]">
                  <Mail size={18} className="absolute left-[14px] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none]" />
                  <input
                  type="email"
                  id="email"
                  placeholder="tu@email.com"

                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required className="pl-[40px]" />
                
                </div>
              </div>

              {status.message &&
            <div style={{




              background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              color: status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#10b981' : 'var(--color-text-muted)'



            }} className="p-[0.8rem] rounded-[8px] text-[0.9rem] mb-[1rem] flex items-center gap-[0.5rem]">
                  {status.type === 'error' && <AlertCircle size={18} />}
                  {status.type === 'success' && <CheckCircle2 size={18} />}
                  {status.message}
                </div>
            }

              <button type="submit" className="btn-glass-primary" disabled={status.type === 'loading'}>
                {status.type === 'loading' ? 'Enviando...' : 'Enviar Enlace'}
              </button>
            </form>
          </>
        }
      </div>
    </div>);

}