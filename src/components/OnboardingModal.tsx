
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { Flame, Sparkles, Camera, X, ChevronRight } from 'lucide-react';

import { getCountryNormativa } from '../data/legislationData';

const savedData = localStorage.getItem('personalData');
const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
const countryNorms = getCountryNormativa(userCountry);

const STEPS = [
{
  icon: <Flame size={28} color="#f97316" />,
  bg: 'rgba(249,115,22,0.1)',
  title: 'Hacé tu primer cálculo',
  desc: `Calculá la Carga de Fuego de un sector según ${countryNorms.fire} en minutos.`,
  cta: 'Ir a Carga de Fuego',
  path: '/fire-load'
},
{
  icon: <Sparkles size={28} color="#f59e0b" />,
  bg: 'rgba(245,158,11,0.1)',
  title: 'Consultá el Asesor IA',
  desc: `Hacé preguntas sobre normativa de ${userCountry.charAt(0).toUpperCase() + userCountry.slice(1)} y recibí respuestas legales al instante.`,
  cta: 'Ir al Asesor IA',
  path: '/ai-advisor'
},
{
  icon: <Camera size={28} color="#06b6d4" />,
  bg: 'rgba(6,182,212,0.1)',
  title: 'Probá la Cámara IA',
  desc: 'Sacá una foto en obra y detectá automáticamente si falta EPP.',
  cta: 'Ir a Cámara IA',
  path: '/ai-camera'
}];


interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setAnimating(true);
      setTimeout(() => {setStep((s) => s + 1);setAnimating(false);}, 200);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-[0] z-[9999] bg-[rgba(0,0,0,0.55)] backdrop-filter-[blur(6px)] flex items-center justify-center p-[1rem]">




      
            <div className="bg-[var(--color-surface,_#fff)] rounded-[24px] max-w-[440px] w-[100%] box-shadow-[0_24px_80px_rgba(0,0,0,0.25)] overflow-[hidden] animation-[fadeInUp_0.35s_ease]">






        
                {/* Header gradient */}
                <div className="bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] p-[1.8rem_1.8rem_3.5rem] relative">



          
                    <button onClick={onClose} className="absolute top-[1rem] right-[1rem] bg-[rgba(255,255,255,0.15)] border-none rounded-[50%] w-[32px] h-[32px] p-[0] flex items-center justify-center cursor-pointer text-[#ffffff]">





            
                        <X size={16} />
                    </button>
                    <p className="text-[rgba(255,255,255,0.7)] text-[0.8rem] font-[600] m-[0_0_0.4rem] letter-spacing-[1px] uppercase">
                        ¡Bienvenido!
                    </p>
                    <h2 className="text-[var(--color-surface)] m-[0] text-[1.4rem] font-[900] line-height-[1.2]">
                        Empezá con Asistente HYS
                    </h2>
                    <p className="text-[rgba(255,255,255,0.75)] m-[0.6rem_0_0] text-[0.88rem]">
                        3 cosas que podés hacer ahora mismo
                    </p>
                </div>

                {/* Step indicator dots */}
                <div className="flex justify-center gap-[0.5rem] mt-[-1.2rem] relative z-[1]">
                    {STEPS.map((_, i) =>
          <div key={i} onClick={() => setStep(i)} style={{
            width: i === step ? '24px' : '8px',

            background: i === step ? 'var(--color-surface)' : 'rgba(255,255,255,0.4)'



          }} className="h-[8px] rounded-[4px] transition-[all_0.3s] cursor-pointer box-shadow-[0_2px_6px_rgba(0,0,0,0.2)]" />
          )}
                </div>

                {/* Card content */}
                <div style={{

          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(8px)' : 'translateY(0)'

        }} className="p-[1.5rem_1.8rem_1.8rem] transition-[all_0.2s]">
                    <div className="flex items-center gap-[1rem] mb-[1rem]">

            
                        <div style={{ background: STEPS[step].bg }} className="w-[56px] h-[56px] rounded-[16px] flex items-center justify-center flex-shrink-[0]">
                            {STEPS[step].icon}
                        </div>
                        <div>
                            <h3 className="m-[0] font-[800] text-[1.05rem]">{STEPS[step].title}</h3>
                            <p className="m-[0.3rem_0_0] text-[0.85rem] text-[var(--color-text-muted,_#64748b)] line-height-[1.5]">
                                {STEPS[step].desc}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-[0.8rem] mt-[1.2rem]">
                        <button
              onClick={() => handleNavigate(STEPS[step].path)}
              className="btn-primary flex-[2] p-[0.8rem] text-[0.9rem] flex items-center justify-center gap-[0.4rem]">

              
                            {STEPS[step].cta} <ChevronRight size={16} />
                        </button>
                        <button
              onClick={next} className="flex-[1] p-[0.8rem] bg-[var(--color-surface-hover,_#f1f5f9)] border-[1px_solid_var(--color-border,_#e2e8f0)] rounded-[12px] font-[700] text-[0.85rem] cursor-pointer text-[var(--color-text-muted,_#64748b)]">

              
                            {step < STEPS.length - 1 ? 'Siguiente' : 'Cerrar'}
                        </button>
                    </div>

                    <p className="text-center text-[0.72rem] text-[var(--color-text-muted,_#94a3b8)] mt-[0.8rem]">
                        {step + 1} de {STEPS.length} — Podés cerrar esto en cualquier momento
                    </p>
                </div>
            </div>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>);

}