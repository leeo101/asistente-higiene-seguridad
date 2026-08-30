import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { ShieldCheck, CreditCard, Sparkles, CheckCircle2, Lock, ArrowRight, ArrowLeft, Calendar, TriangleAlert, Globe, Crown, GraduationCap, Building } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { usePaywall } from '../hooks/usePaywall';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';

export default function Subscription(): React.ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPro, daysRemaining } = usePaywall();
  const { currentUser } = useAuth();
  const { syncDocument } = useSync();
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  const initialPlan = (location.state as any)?.plan || 'pro';
  const [selectedPlan, setSelectedPlan] = useState<'student' | 'pro' | 'enterprise'>(initialPlan);
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'mercadopago'>('stripe');

  useEffect(() => {
    if ((location.state as any)?.plan) {
      setSelectedPlan((location.state as any).plan);
    }
  }, [location.state]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status') || urlParams.get('collection_status');
    const payment_id = urlParams.get('payment_id') || urlParams.get('collection_id');
    const session_id = urlParams.get('session_id');
    const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');

    // Check if user is active
    if (isPro) {
      setIsSubscribed(true);
      const expiry = parseInt(subData.expiry || '0', 10);
      if (expiry) setExpiryDate(new Date(expiry));
    }

    if (paymentStatus === 'approved' && (payment_id || session_id)) {
      setLoading(true);
      currentUser?.getIdToken().then((token) => {
        fetch(`${API_BASE_URL}/api/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ payment_id, collection_id: payment_id, session_id })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              const newExpiry = data.expiry || (Date.now() + 30 * 24 * 60 * 60 * 1000);
              const updatedSub = {
                status: 'active',
                expiry: String(newExpiry),
                provider: session_id ? 'stripe' : 'mercadopago',
                updatedAt: Date.now()
              };
              localStorage.setItem('subscriptionData', JSON.stringify(updatedSub));
              setIsSubscribed(true);
              setExpiryDate(new Date(newExpiry));
              toast.success('¡Suscripción activada con éxito!');
              window.dispatchEvent(new Event('storage'));
              return currentUser.getIdToken(true);
            } else {
              toast.error('Hubo un error verificando el pago. Contacta soporte.');
            }
          })
          .catch((err) => {
            console.error('Payment verification error', err);
            toast.error('Error de red al verificar el pago.');
          })
          .finally(() => {
            setLoading(false);
            window.history.replaceState({}, document.title, window.location.pathname);
          });
      });
    }
  }, [isPro, currentUser]);

  const handleStripe = async () => {
    if (!currentUser) {
      toast.error('Debes crear una cuenta o iniciar sesión para suscribirte.', { duration: 4000 });
      navigate('/login', { state: { view: 'register' } });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/create-stripe-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.uid,
          email: currentUser?.email,
          planId: selectedPlan
        })
      });

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch (e) {
          errData = {};
        }
        throw new Error(errData.error || `Error ${response.status}: Servidor no disponible`);
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'No se pudo generar la sesión de cobro con Stripe.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Stripe Checkout Error:', error);
      toast.error(error.message || 'Error de conexión con el servidor backend de Stripe. Verifica tu conexión.');
      setLoading(false);
    }
  };

  const handleMercadoPago = async () => {
    if (!currentUser) {
      toast.error('Debes crear una cuenta o iniciar sesión para suscribirte.', { duration: 4000 });
      navigate('/login', { state: { view: 'register' } });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.uid,
          email: currentUser?.email,
          planId: selectedPlan
        })
      });

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch (e) {
          errData = {};
        }
        throw new Error(errData.error || `Error ${response.status}: Servidor no disponible`);
      }

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        toast.error(data.error || 'Error al generar el link de pago con Mercado Pago.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Mercado Pago Error:', error);
      toast.error(error.message || 'Error de conexión con Mercado Pago.');
      setLoading(false);
    }
  };

  if (isSubscribed && !showPricing) {
    const days = daysRemaining;
    const isExpiringSoon = days > 0 && days <= 7;

    return (
      <div className="p-[2rem] max-w-[650px] m-[5rem_auto] bg-[var(--color-surface)] rounded-[28px] border border-[var(--color-border)] text-center shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className={`absolute top-0 left-0 right-0 h-[6px] ${isExpiringSoon ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500'}`} />
        
        <div className={`w-[80px] h-[80px] rounded-full flex items-center justify-center m-[0_auto_1.2rem] shadow-lg ${isExpiringSoon ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
          {isExpiringSoon ? <TriangleAlert size={40} className="animate-pulse" /> : <CheckCircle2 size={40} />}
        </div>

        <h1 className="text-[2rem] font-[900] mb-[0.3rem] text-[var(--color-text)]">
          {isExpiringSoon ? '⚠️ Tu Plan Vence Pronto' : 'Suscripción PRO Activa ✓'}
        </h1>
        
        <p className="text-[var(--color-text-secondary)] mb-[1.5rem] text-[0.95rem]">
          {isExpiringSoon
            ? 'Renová tu membresía por $2 USD para no perder acceso a la IA y tus PDFs con logo.'
            : 'Tenés acceso ilimitado a todas las funciones profesionales de la plataforma.'}
        </p>

        {/* Expiration Card Poster */}
        <div
          style={{
            background: isExpiringSoon ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.1) 100%)' : 'rgba(16, 185, 129, 0.08)',
            borderColor: isExpiringSoon ? '#f59e0b' : 'rgba(16, 185, 129, 0.3)'
          }}
          className="p-[1.4rem] rounded-[20px] mb-[1.8rem] border text-left flex flex-col gap-2 relative overflow-hidden"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={20} color={isExpiringSoon ? '#f59e0b' : '#10b981'} />
              <span style={{ color: isExpiringSoon ? '#f59e0b' : '#10b981' }} className="font-[800] text-[0.95rem]">
                {isExpiringSoon ? '⚠️ Renovación Requerida Pronto' : '✦ Estado de Membresía PRO'}
              </span>
            </div>
            <span className={`text-[0.72rem] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${isExpiringSoon ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
              {days === Infinity ? 'Acceso Vitalicio / Admin' : days === 0 ? 'Vence Hoy' : `${days} Días Restantes`}
            </span>
          </div>

          {expiryDate && (
            <p className="m-0 text-[0.95rem] text-[var(--color-text)] font-[700] mt-1">
              Válida hasta: <span className="text-blue-400 font-extrabold">{expiryDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </p>
          )}

          <div className="mt-2 pt-2 border-t border-white/10 text-xs text-[var(--color-text-muted)] flex flex-wrap gap-x-4 gap-y-1">
            <span>✓ PDFs con tu Logo</span>
            <span>✓ Asesor IA Ilimitado</span>
            <span>✓ Visión EPP Fotos</span>
            <span>✓ Todos los Módulos Críticos</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowPricing(true)}
            className="w-full p-[1.1rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-none rounded-[16px] font-[900] text-[1.05rem] cursor-pointer flex items-center justify-center gap-[0.6rem] shadow-xl shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles size={20} /> Renovar / Ver Planes ($2 USD) <ArrowRight size={18} />
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full p-[0.9rem] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[var(--color-border)] rounded-[14px] font-[800] text-[0.9rem] text-[var(--color-text)] cursor-pointer transition-all">
            🔄 Verificar mi pago
          </button>

          <button
            onClick={() => {
              const toastId = toast(
                <div className="flex flex-col gap-[0.5rem]">
                  <span className="text-[0.9rem] font-[700]">⚠️ ¿Cancelar suscripción?</span>
                  <span className="text-[0.8rem] text-[#555]">Perderás acceso a las funciones Premium.</span>
                  <div className="flex gap-[0.5rem] mt-[0.3rem]">
                    <button
                      onClick={async () => {
                        toast.dismiss(toastId);
                        await syncDocument('subscriptionData', { status: 'inactive', expiry: '0' });
                        setIsSubscribed(false);
                        setExpiryDate(null);
                        toast.success('Suscripción cancelada.');
                      }} className="bg-[#ef4444] text-[#ffffff] border-none rounded-[8px] p-[0.4rem_1rem] cursor-pointer font-[800] text-[0.85rem]">
                      Sí, cancelar
                    </button>
                    <button
                      onClick={() => toast.dismiss(toastId)} className="bg-[#f1f5f9] text-[#475569] border-none rounded-[8px] p-[0.4rem_1rem] cursor-pointer font-[800] text-[0.85rem]">
                      No
                    </button>
                  </div>
                </div>,
                { duration: 6000 }
              );
            }} className="w-full p-[0.8rem] bg-transparent text-[#ef4444] border border-[#ef4444]/40 hover:bg-[#ef4444]/10 rounded-[14px] font-[600] cursor-pointer text-[0.85rem] transition-all">
            Cancelar Suscripción
          </button>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: 'pro',
      name: 'Profesional PRO',
      price: '$2',
      period: '/ mes',
      icon: <Crown size={20} className="text-amber-400" />,
      desc: 'Acceso TOTAL e ilimitado a todas las herramientas e IA',
      badge: '✦ ACCESO TOTAL ($2 USD)'
    }
  ];

  return (
    <div className="relative overflow-[hidden]">
      {/* Ambient Background Glows */}
      <div className="ambient-glow blue top-[20%] left-[-10%] w-[500px] h-[500px]" />
      <div className="ambient-glow purple bottom-[10%] right-[-5%] w-[600px] h-[600px] animation-delay-[2s]" />

      <div className="subscription-layout stagger-item p-[2rem_1rem] max-w-[1200px] m-[0_auto] grid grid-cols-1 lg:grid-cols-12 gap-[2rem] items-start min-h-[80vh] pt-[5rem]">

        {/* Left Side: Benefits */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-[1rem] text-[#3b82f6] mb-[1.5rem]">
            <div className="bg-[transparent] rounded-[10px]">
              <img src="/logo.png" alt="Logo de Asistente H&S" className="w-[48px] h-[48px] object-contain" />
            </div>
            <span className="font-[800] tracking-widest text-[1.3rem] uppercase text-[var(--color-text)]">ASISTENTE H&S</span>
          </div>

          <h1 className="text-[clamp(2.2rem,_5vw,_3.2rem)] font-[900] mb-[1.2rem] leading-tight text-[var(--color-text)]">
            Elegí tu Plan e Impulsá tu <br />
            <span className="gradient-text">Gestión de HyS</span>
          </h1>

          <p className="text-[1.1rem] text-[var(--color-text-secondary)] mb-[2rem] leading-relaxed max-w-[600px]">
            Diseñado especialmente para prevencionistas en Argentina y Latinoamérica. Redactá informes, realizá evaluaciones con IA y descargá documentos con tu logo en segundos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1.2rem]">
            {[
              { icon: <ShieldCheck />, title: 'Informes Instantáneos', desc: 'PDFs profesionales con tu logo listos para enviar al cliente.' },
              { icon: <CreditCard />, title: 'Cobro Multimoneda Global', desc: 'Pagá con tarjeta desde Argentina o cualquier país en USD.' },
              { icon: <Lock />, title: '100% Confidencial & Nube', desc: 'Respaldo automático y seguridad cifrada de nivel bancario.' },
              { icon: <CheckCircle2 />, title: 'Asesoría IA Ilimitada', desc: 'Respuestas normativas y diagnósticos técnicos en segundos.' }
            ].map((item, i) => (
              <div key={i} className="glass-card p-[1.2rem] flex flex-col gap-[0.8rem] items-start rounded-[18px]">
                <div className="text-white bg-[linear-gradient(135deg,_#3b82f6,_#8b5cf6)] p-[0.7rem] rounded-[12px] shadow-md">
                  {item.icon}
                </div>
                <div>
                  <div className="font-[800] mb-[0.3rem] text-[1rem] text-[var(--color-text)]">{item.title}</div>
                  <div className="text-[0.85rem] text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Checkout Card */}
        <div className="lg:col-span-5 relative mt-[10px] w-full">
          <div className="pricing-card glass-mockup p-[2rem_1.5rem] rounded-[28px] border border-[var(--color-border)] relative shadow-2xl">
            
            <h2 className="text-[1.2rem] font-[800] text-[var(--color-text)] text-center mb-[1rem]">
              1. Seleccioná tu Plan
            </h2>

            {/* Plan selector cards */}
            <div className="flex flex-col gap-[0.8rem] mb-[1.5rem]">
              {plans.map((p) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id as any)}
                    className={`w-full p-[1rem] rounded-[16px] text-left transition-all border flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg scale-[1.01]'
                        : 'border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                  >
                    <div className="flex items-center gap-[0.8rem]">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-500/20' : 'bg-gray-500/10'}`}>
                        {p.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-[0.5rem]">
                          <span className="font-[800] text-[0.95rem] text-[var(--color-text)]">{p.name}</span>
                          <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-extrabold uppercase">
                            {p.badge}
                          </span>
                        </div>
                        <span className="text-[0.78rem] text-[var(--color-text-muted)] block mt-0.5">{p.desc}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[1.3rem] font-[900] text-[var(--color-text)]">{p.price}</span>
                      <span className="text-[0.75rem] text-[var(--color-text-muted)] block">{p.period}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <h2 className="text-[1.2rem] font-[800] text-[var(--color-text)] text-center mb-[1rem]">
              2. Método de Pago
            </h2>

            {/* Gateway Tabs */}
            <div className="grid grid-cols-2 gap-[0.75rem] mb-[1.5rem]">
              <button
                onClick={() => setPaymentGateway('stripe')}
                style={{
                  background: paymentGateway === 'stripe' ? 'linear-gradient(135deg, #635bff 0%, #7a73ff 100%)' : 'rgba(99, 91, 255, 0.1)',
                  color: paymentGateway === 'stripe' ? '#ffffff' : '#c7d2fe',
                  borderColor: paymentGateway === 'stripe' ? '#a5b4fc' : 'rgba(99, 91, 255, 0.3)',
                  boxShadow: paymentGateway === 'stripe' ? '0 8px 20px rgba(99, 91, 255, 0.35)' : 'none'
                }}
                className="p-[0.9rem_0.6rem] rounded-[16px] text-[0.88rem] font-[800] border transition-all duration-300 flex flex-col items-center gap-[0.4rem] cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Globe size={18} color={paymentGateway === 'stripe' ? '#ffffff' : '#818cf8'} />
                  <span>Stripe 🌎 (Global)</span>
                </div>
                <span className="text-[0.68rem] font-medium opacity-90">Chile, Uruguay, LatAm & World</span>
              </button>

              <button
                onClick={() => setPaymentGateway('mercadopago')}
                style={{
                  background: paymentGateway === 'mercadopago' ? 'linear-gradient(135deg, #009ee3 0%, #00c6ff 100%)' : 'rgba(0, 158, 227, 0.1)',
                  color: paymentGateway === 'mercadopago' ? '#ffffff' : '#bae6fd',
                  borderColor: paymentGateway === 'mercadopago' ? '#38bdf8' : 'rgba(0, 158, 227, 0.3)',
                  boxShadow: paymentGateway === 'mercadopago' ? '0 8px 20px rgba(0, 158, 227, 0.35)' : 'none'
                }}
                className="p-[0.9rem_0.6rem] rounded-[16px] text-[0.88rem] font-[800] border transition-all duration-300 flex flex-col items-center gap-[0.4rem] cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <img src="/mercadopago.svg" alt="Mercado Pago" className="w-[16px] h-[16px]" />
                  <span>Mercado Pago 🇦🇷</span>
                </div>
                <span className="text-[0.68rem] font-medium opacity-90">Argentina (Pesos / Tarjetas)</span>
              </button>
            </div>

            {/* Action Payment Button */}
            {paymentGateway === 'stripe' ? (
              <button
                onClick={handleStripe}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 50%, #7c3aed 100%)',
                  color: '#ffffff',
                  boxShadow: '0 12px 28px -6px rgba(99, 91, 255, 0.55)'
                }}
                className="w-full p-[1.1rem] border-none rounded-[16px] text-[1.1rem] font-[900] cursor-pointer transition-all duration-300 flex items-center justify-center gap-[0.7rem] hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
              >
                <CreditCard size={22} color="#ffffff" />
                {loading ? 'Generando checkout Stripe...' : `Pagar ${plans.find(p => p.id === selectedPlan)?.price} USD con Stripe 💳`}
              </button>
            ) : (
              <button
                onClick={handleMercadoPago}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #009ee3 0%, #00b1ea 50%, #0284c7 100%)',
                  color: '#ffffff',
                  boxShadow: '0 12px 28px -6px rgba(0, 158, 227, 0.55)'
                }}
                className="w-full p-[1.1rem] border-none rounded-[16px] text-[1.1rem] font-[900] cursor-pointer transition-all duration-300 flex items-center justify-center gap-[0.7rem] hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
              >
                <img src="/mercadopago.svg" alt="Mercado Pago" className="w-[22px] h-[22px] filter drop-shadow" />
                {loading ? 'Generando link MP...' : `Pagar ${plans.find(p => p.id === selectedPlan)?.price} USD con Mercado Pago 🇦🇷`}
              </button>
            )}

            <p className="mt-[1.2rem] text-center text-[0.78rem] text-[var(--color-text-muted)] font-[600]">
              🔒 Procesamiento 100% seguro y cifrado. Activación e ingreso inmediato.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}