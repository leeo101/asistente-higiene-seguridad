import { useNavigate } from 'react-router-dom';
import React from 'react';
import { Home, ArrowLeft, Search, ShieldAlert, LucideIcon } from 'lucide-react';

interface QuickLink {
  label: string;
  path: string;
}

export default function NotFound(): React.ReactElement {
  const navigate = useNavigate();

  const quickLinks: QuickLink[] = [
  { label: '🔥 Carga de Fuego', path: '/fire-load' },
  { label: '✨ Asesor IA', path: '/ai-advisor' },
  { label: '📋 ATS', path: '/ats' },
  { label: '📸 Cámara IA', path: '/ai-camera' }];


  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-[2rem] text-center">







      
      {/* Big animated 404 */}
      <div className="text-[clamp(5rem,_20vw,_9rem)] font-[900] line-height-[1] bg-[linear-gradient(135deg,_#1e3a8a,_#2563eb,_#0ea5e9)] webkit-background-clip-[text] webkit-text-fill-color-[transparent] background-clip-[text] mb-[1rem] letter-spacing-[-4px] animation-[pulse_2.5s_ease-in-out_infinite]">










        
        404
      </div>

      <div className="w-[80px] h-[80px] bg-[rgba(37,99,235,0.08)] rounded-[20px] flex items-center justify-center mb-[1.5rem]">





        
        <Search size={36} color="#2563eb" />
      </div>

      <h1 className="text-[1.6rem] font-[900] m-[0_0_0.6rem] text-[var(--color-text)]">
        Página no encontrada
      </h1>
      <p className="text-[0.95rem] text-[var(--color-text-muted)] max-w-[380px] line-height-[1.6] m-[0_0_2rem]">
        La página que buscás no existe o fue movida. Usá el botón de abajo para volver al inicio.
      </p>

      <div className="flex gap-[0.8rem] flex-wrap justify-center">
        <></>
        <></>
      </div>

      {/* Helpful links */}
      <div className="mt-[3rem] flex flex-col gap-[0.6rem] items-center">
        <p className="text-[0.8rem] text-[var(--color-text-muted)] font-[600] m-[0]">
          Accesos rápidos:
        </p>
        <div className="flex flex-wrap gap-[0.5rem] justify-center">
          {quickLinks.map((link, i) =>
          <button
            key={i}
            onClick={() => navigate(link.path)} className="p-[0.4rem_0.9rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[20px] text-[0.8rem] font-[600] cursor-pointer text-[var(--color-text)]">










            
              {link.label}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>);

}