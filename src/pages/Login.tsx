import { useNavigate, useLocation, NavigateFunction, Location } from 'react-router-dom';
import React, { useEffect, useState, useRef, ChangeEvent, FormEvent } from 'react';
import { User, Lock, LogIn, Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, CreditCard, Award, GraduationCap, Phone, MapPin, Smartphone, ExternalLink, Eye, EyeOff, Shield, LucideIcon, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

// ─── Brute-force protection constants ────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos
const ATTEMPTS_KEY = 'login_attempts';
const LOCKOUT_KEY = 'login_lockout_until';
import { User as FirebaseUser, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
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

  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem('remember_user') === 'true' || localStorage.getItem('remembered_email') !== null;
  });
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>(() => localStorage.getItem('remembered_email') || '');
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
  const [showOptionalProfile, setShowOptionalProfile] = useState<boolean>(false);
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
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
        localStorage.setItem('remember_user', 'true');
      } else {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remember_user');
      }
      clearAttempts(); // Limpiar contadores en login exitoso
      navigate('/');
    } catch (error: any) {
      recordFailedAttempt();
      const remaining = MAX_ATTEMPTS - (loginAttempts + 1);
      const errCode = error?.code || '';
      console.error('[Login error]', error);

      let detailMsg = 'Correo o contraseña incorrectos.';
      if (errCode === 'auth/user-not-found') {
        detailMsg = 'El correo no está registrado. Podés crear tu cuenta gratis haciendo clic en Registrate.';
      } else if (errCode === 'auth/wrong-password' || errCode === 'auth/invalid-credential') {
        detailMsg = 'Credenciales incorrectas. Si tu cuenta fue creada con Google, hacé clic en "Continuar con Google".';
      } else if (errCode === 'auth/too-many-requests') {
        detailMsg = 'Demasiados intentos fallidos. Usá "¿Olvidaste tu contraseña?" para restablecerla.';
      }

      if (loginAttempts + 1 >= MAX_ATTEMPTS) {
        setStatus({ type: 'error', message: `Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.` });
      } else {
        setStatus({
          type: 'error',
          message: `${detailMsg} Te quedan ${remaining} intento${remaining !== 1 ? 's' : ''}.`
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
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('Dominio no autorizado en Firebase. Agregá asistentehs.com en Firebase Console -> Authentication -> Dominios Autorizados.', { duration: 6000 });
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Inicio de sesión cancelado');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('Este email ya está registrado. Usá tu contraseña habitual.');
      } else {
        toast.error('Error al iniciar con Google: ' + (error.message || 'Intente nuevamente'));
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

    // Validar formato de email explícitamente
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setStatus({ type: 'error', message: 'El formato del correo electrónico no es válido.' });
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
    if (!email) {
      setStatus({ type: 'error', message: 'Ingresá tu correo electrónico para enviarte el enlace de recuperación.' });
      return;
    }
    setStatus({ type: 'loading', message: 'Enviando enlace...' });

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus({
        type: 'success',
        message: '¡Enlace enviado! Te enviamos un correo para restablecer tu contraseña. Revisá tu casilla (y la carpeta de spam).'
      });
    } catch (error: any) {
      console.error('Password Reset Error:', error);
      if (error.code === 'auth/user-not-found') {
        setStatus({ type: 'error', message: 'El correo ingresado no se encuentra registrado.' });
      } else {
        setStatus({ type: 'error', message: 'Error al enviar enlace: ' + (error.message || 'Intente nuevamente.') });
      }
    }
  };

  const strengthScore = [
    passwordStrength.length,
    passwordStrength.uppercase,
    passwordStrength.lowercase,
    passwordStrength.number,
    passwordStrength.special
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[500px] h-[400px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Centered Container */}
      <div className="relative z-10 w-full max-w-[500px] mx-auto rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl shadow-2xl p-5 sm:p-8 my-4 sm:my-6">
        {/* Top Brand Logo */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <img
              src="/logo.png"
              alt="Logo Asistente H&S"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl border border-white/10 shadow-md group-hover:scale-105 transition-transform"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
              Asistente H&S
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">PRO</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer"
          >
            <span>Volver</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* View Switcher Tabs (Only if not in forgot view) */}
        {view !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-2xl mb-5 sm:mb-6">
            <button
              type="button"
              onClick={() => { setView('login'); setStatus({ type: '', message: '' }); }}
              className={`py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 sm:gap-2 ${
                view === 'login'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              <LogIn size={15} />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => { setView('register'); setStatus({ type: '', message: '' }); }}
              className={`py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 sm:gap-2 ${
                view === 'register'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              <User size={15} />
              <span>Crear Cuenta</span>
            </button>
          </div>
        )}

        {/* Back Button for Forgot Password */}
        {view === 'forgot' && (
          <button
            type="button"
            onClick={() => { setView('login'); setStatus({ type: '', message: '' }); }}
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 mb-6 transition-colors bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Volver a Iniciar Sesión</span>
          </button>
        )}

        {/* HEADINGS BY VIEW */}
        {view === 'login' && (
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#ffffff' }}>
              Bienvenido de nuevo
            </h1>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
              Ingresá a tu Centro de Control de Higiene y Seguridad.
            </p>
          </div>
        )}

        {view === 'register' && (
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#ffffff' }}>
              Creá tu Cuenta Profesional
            </h1>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
              Empezá gratis en 30 segundos • Sin tarjeta requerida.
            </p>
          </div>
        )}

        {view === 'forgot' && (
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#ffffff' }}>
              Recuperar Contraseña
            </h1>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
              Te enviaremos un enlace seguro a tu casilla de correo para restablecerla.
            </p>
          </div>
        )}

        {/* GOOGLE SIGN IN BUTTON (Only for login and register) */}
        {view !== 'forgot' && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer border-none"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M18.125 8.125H10V11.875H14.6875C14.3125 13.875 12.875 15.5 10 15.5C6.6875 15.5 4.0625 12.8125 4.0625 10C4.0625 7.1875 6.6875 4.5 10 4.5C11.5625 4.5 12.875 5.0625 13.875 6.0625L16.5625 3.375C14.875 1.8125 12.5625 1 10 1C4.5625 1 0 5.5625 0 11C0 16.4375 4.5625 21 10 21C15.4375 21 19.375 17 19.375 12.5C19.375 11.6875 19.3125 10.9375 19.1875 10.1875H18.125V8.125Z" fill="#4285F4" />
              </svg>
              <span>Continuar con Google</span>
            </button>

            <div className="flex items-center gap-3 my-5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <div className="flex-1 h-px bg-white/10" />
              <span>o con tu correo</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </div>
        )}

        {/* FORM 1: LOGIN */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Lockout banner */}
            {isLockedOut && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-left">
                <Shield size={22} className="text-red-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-red-400">Cuenta bloqueada temporalmente</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Demasiados intentos fallidos. Podés reintentar en{' '}
                    <strong className="text-red-400 font-bold">
                      {Math.floor(lockoutSecondsLeft / 60)}:{String(lockoutSecondsLeft % 60).padStart(2, '0')}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Remaining attempts indicator */}
            {!isLockedOut && loginAttempts > 0 && loginAttempts < MAX_ATTEMPTS && (
              <div className="p-2.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>Te quedan {MAX_ATTEMPTS - loginAttempts} intento{MAX_ATTEMPTS - loginAttempts !== 1 ? 's' : ''} antes del bloqueo temporal.</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#cbd5e1' }}>
                Correo Electrónico
              </label>
              <div className="flex items-center rounded-xl bg-white/5 border border-white/15 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden px-3.5 py-1">
                <Mail size={18} className="text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="email"
                  id="email"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-2 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none border-none shadow-none"
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', boxShadow: 'none', margin: 0, padding: '0.6rem 0' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#cbd5e1' }}>
                Contraseña
              </label>
              <div className="flex items-center rounded-xl bg-white/5 border border-white/15 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden px-3.5 py-1">
                <Lock size={18} className="text-slate-400 shrink-0 mr-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="w-full py-2 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none border-none shadow-none"
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', boxShadow: 'none', margin: 0, padding: '0.6rem 0' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer shrink-0 ml-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-medium" style={{ color: '#cbd5e1' }}>Recordarme</span>
              </label>

              <button
                type="button"
                onClick={() => { setView('forgot'); setStatus({ type: '', message: '' }); }}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Status Message */}
            {status.message && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                status.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-white/5 border border-white/10 text-slate-300'
              }`}>
                {status.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
                <span>{status.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status.type === 'loading' || isLockedOut}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLockedOut ? `Bloqueado (${lockoutSecondsLeft}s)` : status.type === 'loading' ? 'Iniciando sesión...' : 'Ingresar a mi cuenta'}
            </button>
          </form>
        )}

        {/* FORM 2: REGISTER */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#cbd5e1' }}>
                Nombre Completo
              </label>
              <div className="flex items-center rounded-xl bg-white/5 border border-white/15 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden px-3.5 py-1">
                <User size={18} className="text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="text"
                  id="name"
                  placeholder="Lic. María González"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full py-2 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none border-none shadow-none"
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', boxShadow: 'none', margin: 0, padding: '0.6rem 0' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#cbd5e1' }}>
                Correo Electrónico
              </label>
              <div className="flex items-center rounded-xl bg-white/5 border border-white/15 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden px-3.5 py-1">
                <Mail size={18} className="text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="email"
                  id="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-2 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none border-none shadow-none"
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', boxShadow: 'none', margin: 0, padding: '0.6rem 0' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#cbd5e1' }}>
                  Contraseña
                </label>
                <div className="flex items-center rounded-xl bg-white/5 border border-white/15 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden px-3.5 py-1">
                  <Lock size={18} className="text-slate-400 shrink-0 mr-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full py-2 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none border-none shadow-none"
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', boxShadow: 'none', margin: 0, padding: '0.6rem 0' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer shrink-0 ml-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#cbd5e1' }}>
                  Confirmar Contraseña
                </label>
                <div className="flex items-center rounded-xl bg-white/5 border border-white/15 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden px-3.5 py-1">
                  <Lock size={18} className="text-slate-400 shrink-0 mr-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full py-2 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none border-none shadow-none"
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', boxShadow: 'none', margin: 0, padding: '0.6rem 0' }}
                  />
                </div>
              </div>
            </div>

            {/* Password Strength Meter */}
            {password && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Seguridad de la clave:</span>
                  <span className={`font-bold ${
                    strengthScore <= 2 ? 'text-red-400' : strengthScore <= 4 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {strengthScore <= 2 ? 'Débil' : strengthScore <= 4 ? 'Media' : 'Excelente'}
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strengthScore <= 2 ? 'w-2/5 bg-red-500' : strengthScore <= 4 ? 'w-4/5 bg-amber-500' : 'w-full bg-emerald-500'
                    }`}
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className={passwordStrength.length ? 'text-emerald-400' : 'text-slate-500'}>✓ 8+ carácteres</span>
                  <span className={passwordStrength.uppercase ? 'text-emerald-400' : 'text-slate-500'}>✓ Mayúscula</span>
                  <span className={passwordStrength.lowercase ? 'text-emerald-400' : 'text-slate-500'}>✓ Minúscula</span>
                  <span className={passwordStrength.number ? 'text-emerald-400' : 'text-slate-500'}>✓ Número</span>
                  <span className={passwordStrength.special ? 'text-emerald-400' : 'text-slate-500'}>✓ Símbolo</span>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="country" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#cbd5e1' }}>
                País & Normativa Aplicable
              </label>
              <div className="flex items-center rounded-xl bg-white/5 border border-white/15 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden px-3.5 py-1">
                <MapPin size={18} className="text-slate-400 shrink-0 mr-2.5" />
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="w-full py-2 bg-transparent text-white text-sm focus:outline-none border-none shadow-none cursor-pointer"
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', boxShadow: 'none', margin: 0, padding: '0.6rem 0' }}
                >
                  {countryList.map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Collapsible Profile Block */}
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setShowOptionalProfile(!showOptionalProfile)}
                className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-blue-400 hover:text-blue-300 bg-transparent border-none cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Award size={16} />
                  <span>Preconfigurar Membrete de Informes (Opcional)</span>
                </span>
                {showOptionalProfile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showOptionalProfile && (
                <div className="p-4 pt-1 space-y-3 border-t border-white/10 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Título / Profesión</label>
                      <div className="flex items-center rounded-lg bg-slate-950/80 border border-white/10 px-2.5 py-0.5">
                        <Award size={14} className="text-slate-400 shrink-0 mr-2" />
                        <select
                          value={profession}
                          onChange={(e) => setProfession(e.target.value)}
                          className="w-full py-1.5 bg-transparent text-white text-xs focus:outline-none border-none"
                          style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', margin: 0, padding: '0.4rem 0' }}
                        >
                          <option value="" className="bg-slate-900 text-white">Seleccionar...</option>
                          <option value="Técnico" className="bg-slate-900 text-white">Técnico Superior HyS</option>
                          <option value="Licenciado" className="bg-slate-900 text-white">Licenciado en HyS</option>
                          <option value="Ingeniero" className="bg-slate-900 text-white">Ingeniero Especialista</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Matrícula Profesional</label>
                      <div className="flex items-center rounded-lg bg-slate-950/80 border border-white/10 px-2.5 py-0.5">
                        <Award size={14} className="text-slate-400 shrink-0 mr-2" />
                        <input
                          type="text"
                          placeholder="Ej: MP 8421"
                          value={license}
                          onChange={(e) => setLicense(e.target.value)}
                          className="w-full py-1.5 bg-transparent text-white text-xs placeholder-slate-600 focus:outline-none border-none"
                          style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', margin: 0, padding: '0.4rem 0' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">DNI / Cédula</label>
                      <div className="flex items-center rounded-lg bg-slate-950/80 border border-white/10 px-2.5 py-0.5">
                        <CreditCard size={14} className="text-slate-400 shrink-0 mr-2" />
                        <input
                          type="text"
                          placeholder="Identificación"
                          value={dni}
                          onChange={(e) => setDni(e.target.value)}
                          className="w-full py-1.5 bg-transparent text-white text-xs placeholder-slate-600 focus:outline-none border-none"
                          style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', margin: 0, padding: '0.4rem 0' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Teléfono</label>
                      <div className="flex items-center rounded-lg bg-slate-950/80 border border-white/10 px-2.5 py-0.5">
                        <Phone size={14} className="text-slate-400 shrink-0 mr-2" />
                        <input
                          type="tel"
                          placeholder="+54 9..."
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full py-1.5 bg-transparent text-white text-xs placeholder-slate-600 focus:outline-none border-none"
                          style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', margin: 0, padding: '0.4rem 0' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Terms and Privacy Checkbox */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-medium" style={{ color: '#cbd5e1' }}>
                Acepto los Términos de Servicio y las{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-400 font-bold hover:underline"
                >
                  Políticas de Privacidad
                </a>
              </span>
            </label>

            {/* Status Message */}
            {status.message && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                status.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-white/5 border border-white/10 text-slate-300'
              }`}>
                {status.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
                <span>{status.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status.type === 'loading'}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition-all cursor-pointer border-none disabled:opacity-50 mt-2"
            >
              {status.type === 'loading' ? 'Creando cuenta...' : 'Crear Cuenta Profesional'}
            </button>
          </form>
        )}

        {/* FORM 3: FORGOT PASSWORD */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#cbd5e1' }}>
                Correo Electrónico
              </label>
              <div className="flex items-center rounded-xl bg-white/5 border border-white/15 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden px-3.5 py-1">
                <Mail size={18} className="text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="email"
                  id="email"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-2 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none border-none shadow-none"
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', boxShadow: 'none', margin: 0, padding: '0.6rem 0' }}
                />
              </div>
            </div>

            {status.message && (
              <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                status.type === 'error'
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              }`}>
                {status.type === 'error' ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />}
                <span className="leading-relaxed">{status.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status.type === 'loading'}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition-all cursor-pointer border-none disabled:opacity-50 mt-2"
            >
              {status.type === 'loading' ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            </button>
          </form>
        )}

        {/* Form Bottom Micro-copy & Trust */}
        <div className="pt-6 mt-6 border-t border-white/10 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Conexión Segura TLS 256-bit</span>
          </span>
          <span>•</span>
          <span>Soporte HyS</span>
        </div>
      </div>
    </div>
  );
}
