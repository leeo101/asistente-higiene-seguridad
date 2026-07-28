import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Sparkles, ArrowRight, X, Clock, ShieldAlert } from 'lucide-react';
import { usePaywall } from '../hooks/usePaywall';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionRenewalBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isPro, isAdmin, daysRemaining, isExpiringSoon, isExpired, expiryDate } = usePaywall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('dismissed_renewal_banner') === 'true';
    setDismissed(isDismissed);
  }, []);

  // Don't show if user not logged in, is admin, or dismissed for this session, or already on /subscribe page
  if (!currentUser || isAdmin || dismissed || location.pathname === '/subscribe' || location.pathname === '/login') {
    return null;
  }

  // Only show if subscription is expiring soon (<= 7 days) OR expired
  const shouldShow = isExpiringSoon || (isExpired && !isPro);

  if (!shouldShow) return null;

  const handleDismiss = () => {
    sessionStorage.getItem('dismissed_renewal_banner');
    sessionStorage.setItem('dismissed_renewal_banner', 'true');
    setDismissed(true);
  };

  const formattedExpiry = expiryDate
    ? expiryDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'próximamente';

  return (
    <div className="no-print w-full z-[9990] animate-in fade-in slide-in-from-top-4 duration-300 px-3 sm:px-6 pt-2 pb-1">
      <div className="max-w-[1200px] mx-auto rounded-2xl p-3 sm:p-4 bg-gradient-to-r from-amber-950/80 via-orange-950/70 to-red-950/80 border border-amber-500/40 shadow-xl shadow-amber-500/10 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
            {isExpiringSoon ? <Clock size={22} className="animate-pulse" /> : <ShieldAlert size={22} className="text-red-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base text-amber-300">
                {isExpiringSoon ? '⚠️ ¡Tu Suscripción PRO vence pronto!' : '🚨 Suscripción PRO Inactiva / Vencida'}
              </span>
              <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-black uppercase">
                {isExpiringSoon ? `${daysRemaining} días restantes` : 'Renovación requerida'}
              </span>
            </div>
            <p className="text-xs text-amber-100/80 mt-0.5 leading-relaxed">
              {isExpiringSoon ? (
                <>Vence el <strong className="text-white">{formattedExpiry}</strong>. Renová ahora por solo <strong className="text-amber-300">$2 USD/mes</strong> para mantener la IA ilimitada, PDFs con tu logo y todos los módulos.</>
              ) : (
                <>Mantené el acceso a la generación de informes con tu logo, Asesor IA y exportaciones activando tu plan por solo <strong className="text-amber-300">$2 USD/mes</strong>.</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            onClick={() => navigate('/subscribe')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 border-none"
          >
            <Sparkles size={16} /> Renovar por $2 USD <ArrowRight size={14} />
          </button>
          <button
            onClick={handleDismiss}
            title="Cerrar aviso por esta sesión"
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
