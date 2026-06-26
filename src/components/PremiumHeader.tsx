import React from 'react';
import { Sparkles, Crown, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  size?: string;
  color?: string;
  gradient?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}

export default function PremiumHeader({
  title,
  subtitle,
  icon,
  onBack,
  color,
  gradient,
  children
}: PremiumHeaderProps): React.ReactElement {
  const bg = gradient || color || 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)';
  const navigate = useNavigate();

  return (
    <div style={{
      background: bg









    }} className="p-[clamp(1rem,_3vw,_2rem)] rounded-[20px] mt-[0.5rem] mb-[0] relative overflow-[hidden] box-shadow-[0_10px_30px_rgba(0,_0,_0,_0.15)] w-[100%] box-sizing-[border-box]">
      {/* Animated background pattern */}
      <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_0%,_transparent_70%)] animation-[shimmer_3s_infinite_linear] pointer-events-[none]" />








      

      {/* Content */}
      <div className="relative z-[1] flex items-center gap-[clamp(0.75rem,_2vw,_1.5rem)] flex-wrap justify-center text-center">








        
        {/* Botones de navegación para desktop (ocultos en móvil mediante CSS) */}
        <div className="desktop-nav-buttons no-print mr-[auto] flex flex-col gap-[0.5rem]">
            <button
            onClick={() => {if (onBack) onBack();else navigate(-1);}}

            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} className="bg-[rgba(255,255,255,0.2)] border-[1px_solid_rgba(255,255,255,0.3)] text-[#fff] rounded-[8px] p-[0.4rem_0.8rem] flex items-center gap-[0.4rem] cursor-pointer font-[700] text-[0.8rem] backdrop-filter-[blur(10px)] transition-[background_0.2s]">
            
                <ArrowLeft size={16} /> VOLVER
            </button>
            <button
            onClick={() => navigate('/')}

            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} className="bg-[rgba(255,255,255,0.2)] border-[1px_solid_rgba(255,255,255,0.3)] text-[#fff] rounded-[8px] p-[0.4rem_0.8rem] flex items-center gap-[0.4rem] cursor-pointer font-[700] text-[0.8rem] backdrop-filter-[blur(10px)] transition-[background_0.2s]">
            
                <Home size={16} /> INICIO
            </button>
        </div>

        {icon &&
        <div className="w-[clamp(50px,_15vw,_70px)] h-[clamp(50px,_15vw,_70px)] bg-[rgba(255,255,255,0.2)] rounded-[16px] flex items-center justify-center backdrop-filter-[blur(10px)] border-[2px_solid_rgba(255,255,255,0.3)] box-shadow-[0_8px_20px_rgba(0,0,0,0.2)] flex-shrink-[0]">











          
            {React.cloneElement(icon as React.ReactElement, {
            size: undefined,
            width: '60%',
            height: '60%',
            color: '#ffffff',
            strokeWidth: 2.5
          } as any)}
          </div>
        }

        <div className="flex-[1] min-width-[200px]">
          <h1 className="m-[0] text-[clamp(1.25rem,_4vw,_2rem)] font-[900] text-[#ffffff] text-shadow-[0_2px_10px_rgba(0,0,0,0.2)] letter-spacing-[-0.5px] line-height-[1.2]">







            
            {title}
          </h1>
          <p className="m-[0.5rem_0_0] text-[clamp(0.85rem,_2.5vw,_1rem)] text-[rgba(255,255,255,0.9)] font-[600]">




            
            {subtitle}
          </p>
        </div>
        {children}
      </div>

      {/* Sparkle effect */}
      <Sparkles
        size={24}
        color="#ffffff" className="absolute top-[1rem] left-[1rem] opacity-[0.6] animation-[twinkle_2s_infinite_ease-in-out]" />







      

      <style>
        {`
          @keyframes shimmer {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @media (max-width: 640px) {
            .premium-header-content {
              flex-direction: column;
              text-align: center;
            }
          }
          @media (max-width: 768px) {
            .desktop-nav-buttons {
              display: none !important;
            }
          }
        `}
      </style>
    </div>);

}