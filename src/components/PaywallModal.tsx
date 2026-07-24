import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crown, X, CheckCircle, ShieldCheck, LockKey, Sparkle as Sparkles, GraduationCap, Buildings, Shield } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps): React.ReactElement | null {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSelectPlan = (planId: string) => {
    onClose();
    if (planId === 'free') {
      return;
    }
    navigate('/subscribe', { state: { plan: planId } });
  };

  const modalPlans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: '$0',
      period: '/ siempre',
      badge: 'Base',
      badgeBg: 'rgba(255,255,255,0.1)',
      badgeColor: '#94a3b8',
      desc: 'Carga de datos y formularios base',
      buttonLabel: 'Continuar Gratis',
      buttonBg: 'rgba(255,255,255,0.06)',
      buttonColor: '#94a3b8',
      icon: <Shield size={18} color="#94a3b8" weight="duotone" />,
    },
    {
      id: 'student',
      name: 'Estudiante',
      price: '$2',
      period: '/ mes',
      badge: '🎓 Alumnos',
      badgeBg: 'rgba(16,185,129,0.15)',
      badgeColor: '#34d399',
      desc: 'PDFs limpios, Cámara IA & Visión y Nube',
      buttonLabel: 'Elegir Estudiante ($2)',
      buttonBg: '#059669',
      buttonColor: '#ffffff',
      icon: <GraduationCap size={18} color="#34d399" weight="duotone" />,
    },
    {
      id: 'pro',
      name: 'Profesional',
      price: '$6',
      period: '/ mes',
      badge: '✦ MÁS POPULAR',
      badgeBg: 'rgba(251,191,36,0.2)',
      badgeColor: '#fbbf24',
      popular: true,
      desc: 'PDFs con TU LOGO, IA Ilimitada, WhatsApp & QR',
      buttonLabel: 'Elegir Profesional ($6)',
      buttonBg: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      buttonColor: '#ffffff',
      icon: <Crown size={18} color="#fbbf24" weight="fill" />,
    },
    {
      id: 'enterprise',
      name: 'Empresa',
      price: '$25',
      period: '/ mes',
      badge: '🏢 Consultoras',
      badgeBg: 'rgba(168,85,247,0.2)',
      badgeColor: '#c084fc',
      desc: 'Multi-usuario, Multi-cliente, KPIs EHS y Soporte 24/7',
      buttonLabel: 'Elegir Empresa ($25)',
      buttonBg: 'linear-gradient(135deg, #7e22ce 0%, #4338ca 100%)',
      buttonColor: '#ffffff',
      icon: <Buildings size={18} color="#c084fc" weight="duotone" />,
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 animation-[fadeIn_0.2s_ease-out]">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Container */}
      <div className="glass-panel relative w-full max-w-[850px] max-h-[90vh] overflow-y-auto bg-[var(--color-surface)] border border-blue-500/30 rounded-[28px] p-4 sm:p-6 shadow-2xl animation-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent pointer-events-none rounded-full blur-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 border-none text-white/70 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all z-20"
        >
          <X size={18} weight="bold" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3">
            <Sparkles size={14} color="#60a5fa" weight="fill" />
            <span className="text-[#60a5fa] text-[0.75rem] font-bold uppercase tracking-wider">
              Desbloqueá el Poder Completo
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight mb-2">
            Elegí el Plan a la medida de tu gestión
          </h2>
          <p className="text-[var(--color-text-muted)] text-xs sm:text-sm max-w-[550px] mx-auto leading-relaxed">
            Podés seguir usando la versión gratuita o pasar a un plan Pro para exportar PDFs con tu logo, sincronizar en la nube y usar IA ilimitada.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 relative z-10">
          {modalPlans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-4 flex flex-col justify-between border transition-all ${
                plan.popular
                  ? 'bg-gradient-to-b from-blue-900/30 via-purple-900/20 to-transparent border-blue-500/60 shadow-xl shadow-blue-500/10 scale-[1.02]'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {plan.icon}
                    <span className="text-xs font-bold uppercase text-white/80">{plan.name}</span>
                  </div>
                  <span
                    style={{ background: plan.badgeBg, color: plan.badgeColor }}
                    className="text-[0.65rem] px-2 py-0.5 rounded-full font-black uppercase tracking-wider"
                  >
                    {plan.badge}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-2xl font-black text-white font-heading">{plan.price}</span>
                  <span className="text-xs text-white/50">{plan.period}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-white/60 leading-relaxed mb-4 min-h-[36px]">
                  {plan.desc}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                style={{ background: plan.buttonBg, color: plan.buttonColor }}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs cursor-pointer shadow-md transition-all border-none flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95"
              >
                {plan.popular && <Sparkles size={14} weight="fill" />}
                {plan.buttonLabel}
              </button>
            </div>
          ))}
        </div>

        {/* Footer Security Note */}
        <div className="text-center border-t border-white/10 pt-4 relative z-10">
          <p className="text-[0.75rem] text-[var(--color-text-muted)] font-medium flex items-center justify-center gap-2 flex-wrap">
            <span>🔒 Pagos 100% seguros con Mercado Pago 🇦🇷 y Stripe 🌎</span>
            <span>•</span>
            <span>Sin contratos de permanencia</span>
          </p>
        </div>

      </div>
    </div>,
    document.body
  );
}