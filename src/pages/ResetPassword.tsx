import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import toast from 'react-hot-toast';
import { getErrorCode } from '../utils/errorUtils';

export default function ResetPassword(): React.ReactElement | null {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode') || searchParams.get('token');

  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });
  const [showPass, setShowPass] = useState({ new: false, confirm: false });
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (!oobCode) {
      setStatus({ type: 'error', message: 'Enlace de restablecimiento no válido o ausente.' });
    }
  }, [oobCode]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setStatus({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }

    // Enhanced password validation
    if (passwords.new.length < 8) {
      setStatus({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (!/[A-Z]/.test(passwords.new)) {
      setStatus({ type: 'error', message: 'La contraseña debe incluir al menos una letra mayúscula.' });
      return;
    }
    if (!/[a-z]/.test(passwords.new)) {
      setStatus({ type: 'error', message: 'La contraseña debe incluir al menos una letra minúscula.' });
      return;
    }
    if (!/[0-9]/.test(passwords.new)) {
      setStatus({ type: 'error', message: 'La contraseña debe incluir al menos un número.' });
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'`~]/.test(passwords.new)) {
      setStatus({ type: 'error', message: 'La contraseña debe incluir al menos un carácter especial (!@#$%^&*...).' });
      return;
    }

    setStatus({ type: 'loading', message: 'Actualizando contraseña...' });

    try {
      // First verify code to get email for the notification
      const email = await verifyPasswordResetCode(auth, oobCode);

      // Apply new password to Firebase Auth
      await confirmPasswordReset(auth, oobCode, passwords.new);

      // Notify user of successful change asynchronously
      fetch(`${API_BASE_URL}/api/send-password-changed-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }).catch((e) => console.error("Notification failed", e));

      setStatus({ type: 'success', message: '¡Contraseña actualizada con éxito!' });
      toast.success("Tu contraseña ha sido cambiada");
      setTimeout(() => navigate('/login'), 2000);

    } catch (error) {
      console.error("Firebase Reset Error:", error);
      let errorMessage = 'El enlace ha expirado o ya fue utilizado.';
      const code = getErrorCode(error);
      if (code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil. Debe tener 8+ caracteres, mayúscula, minúscula, número y carácter especial.';
      } else if (code === 'auth/invalid-action-code') {
        errorMessage = 'El enlace de recuperación es inválido o ya ha caducado.';
      }
      setStatus({ type: 'error', message: errorMessage });
    }
  };
  return (
    <div className="container flex flex-col justify-center min-h-[100vh] max-w-[450px]">
            <div className="card shadow-lg p-[2.5rem]">
                <div className="text-center mb-[2rem]">
                    <div className="w-[80px] h-[80px] m-[0_auto_1rem_auto]">



            
                        <img
              src="/logo.png"
              alt="Asistente H&S Logo" className="w-[100%] h-[100%] object-fit-[contain]" />

            
                    </div>
                    <h1 className="text-[1.6rem] mb-[0.5rem]">Nueva Contraseña</h1>
                    <p className="text-[var(--color-text-muted)] text-[0.9rem]">Introduce tu nueva clave de acceso</p>
                </div>

                {!oobCode ?
        <div className="p-[1rem] rounded-[12px] bg-[rgba(239,_68,_68,_0.1)] text-[#ef4444] text-center flex flex-col gap-[1rem]">








          
                        <AlertCircle size={32} className="m-[0_auto]" />
                        <p className="m-[0] font-[500]">{status.message}</p>
                        <></>
                    </div> :

        <form onSubmit={handleReset} className="flex flex-col gap-[1.5rem]">
                        <div>
                            <label className="block text-[0.85rem] mb-[0.5rem] font-[600]">Nueva Contraseña</label>
                            <div className="relative">
                                <input
                type={showPass.new ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                required
                placeholder="••••••••" className="w-[100%] p-[0.8rem] pr-[2.5rem] rounded-[8px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]" />

              
                                <button type="button" onClick={() => setShowPass({ ...showPass, new: !showPass.new })} className="absolute right-[0.8rem] top-[50%] transform-[translateY(-50%)] bg-[none] border-none text-[var(--color-text-muted)] cursor-pointer">
                                    {showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[0.85rem] mb-[0.5rem] font-[600]">Confirmar Contraseña</label>
                            <div className="relative">
                                <input
                type={showPass.confirm ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                required
                placeholder="••••••••" className="w-[100%] p-[0.8rem] pr-[2.5rem] rounded-[8px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]" />

              
                                <button type="button" onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })} className="absolute right-[0.8rem] top-[50%] transform-[translateY(-50%)] bg-[none] border-none text-[var(--color-text-muted)] cursor-pointer">
                                    {showPass.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {status.message &&
          <div style={{



            background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            color: status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#10b981' : 'var(--color-primary)'



          }} className="p-[0.8rem] rounded-[8px] text-[0.85rem] flex items-center gap-[0.5rem]">
                                {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {status.message}
                            </div>
          }

                        <button
            type="submit"
            disabled={status.type === 'loading' || status.type === 'success'}
            className="btn-primary m-[0]">

            
                            {status.type === 'loading' ? 'Procesando...' : 'Restablecer Contraseña'}
                        </button>
                    </form>
        }

                <p className="text-center mt-[1.5rem] text-[0.85rem]">
                    <a href="/login" onClick={(e) => {e.preventDefault();navigate('/login');}} className="text-[var(--color-text-muted)] text-decoration-[none] flex items-center justify-center gap-[0.5rem]">
                        <ArrowLeft size={14} /> Volver al inicio de sesión
                    </a>
                </p>
            </div>
        </div>);

}