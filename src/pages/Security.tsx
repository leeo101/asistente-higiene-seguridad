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
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
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
    <div className="container animate-fade-in pb-[4rem] max-w-[600px]">
            <div className="flex items-center gap-[1rem] mb-[2rem]">
                <></>
                <div>
                    <h1 className="text-[1.6rem] m-[0] font-[900] letter-spacing-[-0.5px]">Seguridad y Contraseña</h1>
                    <p className="m-[0] text-[0.85rem] text-[var(--color-text-secondary)]">Gestioná el acceso a tu cuenta</p>
                </div>
            </div>

            {!showPasswordChange ?
      <>
                    <div className="bg-[rgba(var(--color-surface-rgb),_0.5)] backdrop-filter-[blur(12px)] border-[1px_solid_var(--glass-border)] rounded-[20px] p-[1.5rem] mb-[1.5rem]">




          
                        <div className="flex items-center gap-[0.8rem] mb-[1.2rem]">
                            <div className="bg-[rgba(56,_189,_248,_0.1)] p-[0.6rem] rounded-[12px] text-[var(--color-primary)] flex">
                                <Shield size={22} />
                            </div>
                            <h3 className="m-[0] text-[1.05rem] font-[900]">Acceso y Contraseña</h3>
                        </div>

                        <div
            onClick={() => setShowPasswordChange(true)}







            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-background)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }} className="flex items-center justify-space-between p-[1.1rem_1.2rem] rounded-[14px] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] cursor-pointer transition-[all_0.2s_ease]">
            
                            <div className="flex items-center gap-4">
                                <div className="w-[42px] h-[42px] bg-[rgba(56,_189,_248,_0.1)] rounded-[12px] flex items-center justify-center">




                
                                    <Key size={20} color="var(--color-primary)" />
                                </div>
                                <div>
                                    <h4 className="m-[0] text-[1rem] font-[800]">Cambiar Contraseña</h4>
                                    <p className="m-[0] text-[0.82rem] text-[var(--color-text-secondary)]">Te enviaremos un link a tu email</p>
                                </div>
                            </div>
                            <ChevronRight size={20} color="var(--color-text-secondary)" />
                        </div>
                    </div>

                    <div className="bg-[rgba(var(--color-surface-rgb),_0.5)] backdrop-filter-[blur(12px)] border-[1px_solid_var(--glass-border)] rounded-[20px] p-[1.5rem]">




          
                        <div className="flex items-center gap-[0.8rem] mb-[1.2rem]">
                            <div className="bg-[rgba(56,_189,_248,_0.1)] p-[0.6rem] rounded-[12px] text-[var(--color-primary)] flex">
                                <Smartphone size={22} />
                            </div>
                            <h3 className="m-[0] text-[1.05rem] font-[900]">Seguridad Avanzada</h3>
                        </div>

                        {[{ key: 'biometrics', Icon: Fingerprint, title: 'Biometría', desc: 'Huella o reconocimiento facial' },
          { key: 'twoFactor', Icon: Lock, title: 'Doble Factor (2FA)', desc: 'Código extra al iniciar sesión' }].
          map(({ key, Icon, title, desc }, idx, arr) =>
          <div key={key} style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }} className="flex items-center gap-[1rem] p-[1rem_0]">
                                <div style={{

              background: toggles[key] ? 'rgba(56, 189, 248, 0.12)' : 'var(--color-background)',

              color: toggles[key] ? 'var(--color-primary)' : 'var(--color-text-secondary)'

            }} className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center transition-[all_0.3s]">
                                    <Icon size={20} />
                                </div>
                                <div className="flex-[1]">
                                    <h4 className="m-[0] text-[1rem] font-[800]">{title}</h4>
                                    <p className="m-[0] text-[0.8rem] text-[var(--color-text-secondary)]">{desc}</p>
                                </div>
                                <div
              onClick={() => toggleFeature(key)}
              style={{

                background: toggles[key] ? '#38bdf8' : 'var(--color-border)',


                boxShadow: toggles[key] ? '0 4px 10px rgba(56, 189, 248, 0.3)' : 'none'
              }} className="w-[48px] h-[26px] rounded-[13px] relative cursor-pointer transition-[all_0.3s_ease]">
              
                                    <div style={{


                left: toggles[key] ? '25px' : '3px'


              }} className="w-[20px] h-[20px] bg-[white] rounded-[50%] absolute top-[3px] transition-[all_0.3s_ease] box-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                                </div>
                            </div>
          )}
                    </div>
                </> :

      <div className="bg-[rgba(var(--color-surface-rgb),_0.5)] backdrop-filter-[blur(12px)] border-[1px_solid_var(--glass-border)] rounded-[20px] p-[1.5rem]">




        
                    <div className="flex items-center gap-[1rem] mb-[1.5rem]">
                        <></>
                        <div>
                            <h3 className="m-[0] text-[1.1rem] font-[900]">Cambiar Contraseña</h3>
                        </div>
                    </div>

                    <p className="text-[var(--color-text-secondary)] text-[0.9rem] mb-[1.5rem] line-height-[1.6]">
                        Por seguridad, te enviaremos un enlace a tu correo electrónico para que puedas establecer una nueva contraseña.
                    </p>

                    <form onSubmit={handlePasswordChange}>
                        {status.message &&
          <div style={{




            background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            color: status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#10b981' : 'var(--color-primary)',



            border: `1px solid ${status.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
          }} className="p-[1.2rem] rounded-[12px] text-[0.9rem] mb-[1.5rem] flex flex-col gap-[0.8rem]">
                                <div className="flex items-center gap-[0.5rem]">
                                    {status.type === 'success' && <CheckCircle2 size={18} />}
                                    <span className="font-[600]">{status.message}</span>
                                </div>
                                {status.details &&
            <p className="m-[0] text-[0.8rem] opacity-[0.8]">
                                        <strong>Error técnico:</strong> {status.details}
                                    </p>
            }
                                {status.suggestion &&
            <p className="m-[0] text-[0.8rem] font-[500]">
                                        💡 {status.suggestion}
                                    </p>
            }
                            </div>
          }

                        <button
            type="submit"
            disabled={status.type === 'loading' || status.type === 'success'}
            style={{


              background: status.type === 'success' ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #38bdf8, #3b82f6)',

              cursor: status.type === 'loading' ? 'default' : 'pointer',

              opacity: status.type === 'loading' ? 0.8 : 1

            }} className="flex items-center justify-center gap-[0.6rem] w-[100%] p-[1.1rem] m-[0] text-[white] border-none rounded-[14px] text-[1rem] font-[800] box-shadow-[0_8px_20px_rgba(56,_189,_248,_0.3)] transition-[all_0.3s]">
            
                            {status.type === 'loading' ? 'Enviando...' : status.type === 'success' ? <><CheckCircle2 size={18} /> ¡Enviado!</> : 'Enviar Link de Recuperación'}
                        </button>
                    </form>
                </div>
      }

            <div className="text-center mt-[2rem] p-[1rem] bg-[rgba(56,_189,_248,_0.04)] rounded-[12px] border-[1px_solid_rgba(56,_189,_248,_0.1)]">
                <p className="text-[0.82rem] text-[var(--color-text-secondary)] m-[0] flex items-center justify-center gap-[0.4rem]">
                    🔒 Tu seguridad es nuestra prioridad. Todos los datos están cifrados de extremo a extremo.
                </p>
            </div>
        </div>);

}