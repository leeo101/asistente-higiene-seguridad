import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, User } from 'lucide-react';

export default function ProfileCompletionBanner() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const personalData = localStorage.getItem('personalData');
    if (personalData) {
      const data = JSON.parse(personalData);
      // Mostrar banner si profileComplete es false o si faltan datos importantes
      const hasIncompleteProfile = !data.profileComplete ||
      !data.dni ||
      !data.license ||
      !data.profession ||
      !data.phone;

      // Solo mostrar si es la primera vez que ven el banner en esta sesión
      const hasSeenBanner = sessionStorage.getItem('hasSeenProfileBanner');

      if (hasIncompleteProfile && !hasSeenBanner) {
        setVisible(true);
      }
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('hasSeenProfileBanner', 'true');
  };

  const handleComplete = () => {
    navigate('/personal-data');
    sessionStorage.setItem('hasSeenProfileBanner', 'true');
  };

  if (!visible) return null;

  return (
    <div className="fixed top-[20px] left-[50%] transform-[translateX(-50%)] z-[9999] w-[90%] max-w-[600px] bg-[linear-gradient(135deg,_#eff6ff_0%,_#dbeafe_100%)] border-[2px_solid_#3b82f6] rounded-[16px] p-[1rem_1.2rem] flex items-center gap-[1rem] box-shadow-[0_10px_40px_rgba(59,_130,_246,_0.3)] animation-[slideDown_0.4s_ease-out]">
















      
            <style>
                {`
                    @keyframes slideDown {
                        from {
                            opacity: 0;
                            transform: translate(-50%, -20px);
                        }
                        to {
                            opacity: 1;
                            transform: translate(-50%, 0);
                        }
                    }
                    @media (max-width: 768px) {
                        .profile-banner-mobile {
                            flex-direction: column;
                            text-align: center;
                        }
                    }
                `}
            </style>

            <div className="w-[40px] h-[40px] rounded-[50%] bg-[#3b82f6] flex items-center justify-center flex-shrink-[0]">








        
                <User size={20} color="#ffffff" strokeWidth={2.5} />
            </div>

            <div className="profile-banner-mobile flex-[1]">
                <p className="m-[0_0_0.3rem_0] font-[800] text-[0.95rem] text-[#1e40af]">




          
                    ¡Bienvenido! 🎉
                </p>
                <p className="m-[0] text-[0.85rem] text-[#1e3a8a] line-height-[1.4]">




          
                    Completá tu perfil profesional para acceder a todas las funciones.
                </p>
            </div>

            <div className="flex gap-[0.5rem] flex-shrink-[0]">
                <button
          onClick={handleComplete}












          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = '#2563eb'}
          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = '#3b82f6'} className="p-[0.6rem_1.2rem] bg-[#3b82f6] text-[#ffffff] border-none rounded-[8px] font-[700] text-[0.85rem] cursor-pointer white-space-[nowrap] transition-[background_0.2s]">
          
                    Completar
                </button>
                <button
          onClick={handleClose}










          aria-label="Cerrar" className="p-[0.6rem] bg-[transparent] border-none rounded-[8px] cursor-pointer text-[#64748b] flex items-center">
          
                    <X size={18} />
                </button>
            </div>
        </div>);

}