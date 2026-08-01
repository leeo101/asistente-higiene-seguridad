import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crown, X, Sparkle as Sparkles, Shield } from '@phosphor-icons/react';
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
      badgeBg: 'rgba(255,255,255,0.15)',
      badgeColor: '#cbd5e1',
      desc: 'Formularios e inspecciones iniciales sin costo',
      buttonLabel: 'Continuar Gratis',
      buttonBg: '#334155',
      buttonColor: '#ffffff',
      icon: <Shield size={20} color="#cbd5e1" weight="duotone" />,
    },
    {
      id: 'pro',
      name: 'Profesional PRO',
      price: '$2',
      period: '/ mes',
      badge: '✦ ACCESO TOTAL ($2)',
      badgeBg: 'rgba(251,191,36,0.25)',
      badgeColor: '#fbbf24',
      popular: true,
      desc: 'PDFs con tu LOGO, Firma Digital, QR de Verificación, Asesor IA Ilimitado, Cámara Visión, Módulos Críticos y Nube.',
      buttonLabel: 'Activar Profesional ($2 USD)',
      buttonBg: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      buttonColor: '#ffffff',
      icon: <Crown size={20} color="#fbbf24" weight="fill" />,
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Modal Container */}
      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: '2px solid #3b82f6',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)'
        }}
        className="relative w-full max-w-[700px] max-h-[90vh] overflow-y-auto z-10"
      >

        {/* Botón Cerrar (Cruz bien visible) */}
        <button
          type="button"
          onClick={onClose}
          title="Cerrar ventana"
          style={{
            backgroundColor: '#334155',
            color: '#ffffff',
            border: '1px solid #64748b',
            borderRadius: '9999px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 20
          }}
        >
          <X size={20} color="#ffffff" weight="bold" />
        </button>

        {/* Encabezado */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/40 rounded-full mb-3">
            <Sparkles size={14} color="#60a5fa" weight="fill" />
            <span className="text-[#60a5fa] text-[0.75rem] font-bold uppercase tracking-wider">
              Desbloqueá el Poder Completo
            </span>
          </div>

          <h2 style={{ color: '#ffffff' }} className="text-xl sm:text-2xl font-black tracking-tight mb-2">
            Elegí el Plan a la medida de tu gestión
          </h2>
          <p style={{ color: '#94a3b8' }} className="text-xs sm:text-sm max-w-[550px] mx-auto leading-relaxed">
            Podés seguir usando la versión gratuita o pasar al plan Profesional PRO para exportar PDFs con tu logo, sincronizar en la nube y usar IA ilimitada.
          </p>
        </div>

        {/* Tarjetas de Planes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 relative z-10 max-w-[620px] mx-auto">
          {modalPlans.map((plan) => (
            <div
              key={plan.id}
              style={{
                backgroundColor: plan.popular ? '#1e1b4b' : '#1e293b',
                borderColor: plan.popular ? '#6366f1' : '#334155'
              }}
              className="rounded-2xl p-4 flex flex-col justify-between border-2 transition-all"
            >
              <div>
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {plan.icon}
                    <span style={{ color: '#ffffff' }} className="text-xs font-bold uppercase">{plan.name}</span>
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
                  <span style={{ color: '#ffffff' }} className="text-2xl font-black">{plan.price}</span>
                  <span style={{ color: '#94a3b8' }} className="text-xs">{plan.period}</span>
                </div>

                {/* Description */}
                <p style={{ color: '#cbd5e1' }} className="text-xs leading-relaxed mb-4 min-h-[36px]">
                  {plan.desc}
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleSelectPlan(plan.id)}
                style={{ background: plan.buttonBg, color: plan.buttonColor, fontWeight: '800' }}
                className="w-full py-2.5 px-3 rounded-xl text-xs cursor-pointer shadow-md transition-all border-none flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95"
              >
                {plan.popular && <Sparkles size={14} weight="fill" />}
                {plan.buttonLabel}
              </button>
            </div>
          ))}
        </div>

        {/* Pie Seguro */}
        <div className="text-center border-t border-slate-700/60 pt-4 relative z-10">
          <p style={{ color: '#94a3b8' }} className="text-[0.75rem] font-semibold flex items-center justify-center gap-2 flex-wrap">
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