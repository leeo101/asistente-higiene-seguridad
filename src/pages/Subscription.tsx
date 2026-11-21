import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Calendar,
  TriangleAlert,
  Globe,
  Crown,
  Award,
  FileCheck2,
  QrCode,
  Cloud
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { usePaywall } from '../hooks/usePaywall';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';
import toast from 'react-hot-toast';

export default function Subscription(): React.ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPro, daysRemaining } = usePaywall();
  const { currentUser } = useAuth();
  const { syncDocument } = useSync();
  useDocumentTitle('Suscripción y Membresía PRO');

  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  const CYBER_MONDAY_DEADLINE = new Date('2026-11-07T17:00:00-03:00').getTime();

  const initialPlan = (location.state as any)?.plan || 'pro';
  const [selectedPlan, setSelectedPlan] = useState<'student' | 'pro' | 'enterprise'>(initialPlan);
  const [paymentGateway, setPaymentGateway] = useState<'paypal' | 'mercadopago'>('mercadopago');
  const [billingMode, setBillingMode] = useState<'recurring' | 'single'>('recurring');
  const [hasCardAdhered, setHasCardAdhered] = useState<boolean>(false);
  const [usdToArsRate, setUsdToArsRate] = useState<number>(1600);

  // Obtener cotización del dólar del día automáticamente
  useEffect(() => {
    let mounted = true;
    const loadExchangeRate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/exchange-rate`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data?.rate && Number(data.rate) > 100) {
            setUsdToArsRate(Number(data.rate));
            return;
          }
        }
      } catch {
        // Fallback directo a DolarApi
      }
      try {
        const res2 = await fetch('https://dolarapi.com/v1/dolares/oficial');
        if (res2.ok) {
          const data2 = await res2.json();
          const venta = Number(data2?.venta || data2?.compra);
          if (mounted && venta && venta > 100) {
            setUsdToArsRate(venta);
          }
        }
      } catch {
        // Conservar valor de respaldo
      }
    };
    loadExchangeRate();
    return () => {
      mounted = false;
    };
  }, []);
  const [isCyberMonday, setIsCyberMonday] = useState<boolean>(() => {
    try {
      if (Date.now() > CYBER_MONDAY_DEADLINE) {
        localStorage.removeItem('active_promo');
        return false;
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('promo') === 'cybermonday') {
        localStorage.setItem('active_promo', 'cybermonday');
        return true;
      }
      return localStorage.getItem('active_promo') === 'cybermonday';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if ((location.state as any)?.plan) {
      setSelectedPlan((location.state as any).plan);
    }
  }, [location.state]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (Date.now() > CYBER_MONDAY_DEADLINE) {
      localStorage.removeItem('active_promo');
      setIsCyberMonday(false);
    } else if (urlParams.get('promo') === 'cybermonday') {
      localStorage.setItem('active_promo', 'cybermonday');
      setIsCyberMonday(true);
    }
    const paymentStatus = urlParams.get('status') || urlParams.get('collection_status');
    const payment_id = urlParams.get('payment_id') || urlParams.get('collection_id');
    const session_id = urlParams.get('session_id');
    const preapproval_id = urlParams.get('preapproval_id');
    const paypal_subscription_id = urlParams.get('subscription_id');
    const paypal_order_id = urlParams.get('token') || urlParams.get('order_id');
    let subData: any = {};
    try {
      const rawSub = localStorage.getItem('subscriptionData');
      if (rawSub && !rawSub.startsWith('data:')) {
        subData = JSON.parse(rawSub);
      }
    } catch {
      // ignore
    }

    if (subData.autoRenew === true || subData.autoRenew === 'true' || subData.paymentMethod === 'card_auto_debit') {
      setHasCardAdhered(true);
    }

    if (isPro) {
      setIsSubscribed(true);
      const expiry = parseInt(subData.expiry || '0', 10);
      if (expiry) setExpiryDate(new Date(expiry));
    }

    if (
      (paymentStatus === 'approved' || preapproval_id || paypal_subscription_id || paypal_order_id) &&
      (payment_id || session_id || preapproval_id || paypal_subscription_id || paypal_order_id)
    ) {
      setLoading(true);
      currentUser?.getIdToken().then((token) => {
        fetch(`${API_BASE_URL}/api/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            payment_id,
            collection_id: payment_id,
            session_id,
            preapproval_id,
            paypal_subscription_id,
            paypal_order_id
          })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              const newExpiry = data.expiry || Date.now() + 30 * 24 * 60 * 60 * 1000;
              const isAuto = Boolean(data.autoRenew || preapproval_id || paypal_subscription_id || session_id);
              const updatedSub = {
                status: 'active',
                expiry: String(newExpiry),
                provider: paypal_subscription_id || paypal_order_id ? 'paypal' : session_id ? 'stripe' : 'mercadopago',
                autoRenew: isAuto ? 'true' : 'false',
                paymentMethod: isAuto ? 'card_auto_debit' : 'card',
                updatedAt: Date.now()
              };
              localStorage.setItem('subscriptionData', JSON.stringify(updatedSub));
              setIsSubscribed(true);
              setHasCardAdhered(isAuto);
              setExpiryDate(new Date(newExpiry));
              setShowPricing(false);
              toast.success(isAuto ? '¡Tarjeta adherida y suscripción PRO activada!' : '¡Suscripción activada con éxito!');
              window.dispatchEvent(new Event('storage'));
              return currentUser.getIdToken(true);
            } else {
              toast.error('Hubo un error verificando la adhesión de tarjeta. Contacta soporte.');
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

  const handlePayPal = async () => {
    if (!currentUser) {
      toast.error('Debés iniciar sesión para suscribirte.', { duration: 4000 });
      navigate('/login', { state: { view: 'register' } });
      return;
    }

    setLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/create-paypal-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          planId: selectedPlan,
          promo: isCyberMonday ? 'cybermonday' : undefined,
          billingMode
        })
      });

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch {
          errData = {};
        }
        throw new Error(errData.error || `Error ${response.status}: Servidor no disponible`);
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'No se pudo generar la sesión de cobro con PayPal.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('PayPal Checkout Error:', error);
      toast.error(error.message || 'Error de conexión con PayPal.');
      setLoading(false);
    }
  };

  const handleMercadoPago = async () => {
    if (!currentUser) {
      toast.error('Debés iniciar sesión para suscribirte.', { duration: 4000 });
      navigate('/login', { state: { view: 'register' } });
      return;
    }

    setLoading(true);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          planId: selectedPlan,
          promo: isCyberMonday ? 'cybermonday' : undefined,
          billingMode
        })
      });

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch {
          errData = {};
        }
        throw new Error(errData.error || `Error ${response.status}: Servidor no disponible`);
      }

      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        toast.error(data.error || 'Error al generar el link de adhesión con Mercado Pago.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Mercado Pago Error:', error);
      toast.error(error.message || 'Error de conexión con Mercado Pago.');
      setLoading(false);
    }
  };

  const usdBasePrice = isCyberMonday ? 0.99 : 2.0;
  const convertedArsPrice = Math.round(usdBasePrice * usdToArsRate);
  const formattedArs = `$${convertedArsPrice.toLocaleString('es-AR')} ARS`;
  const formattedOriginalArs = `$${Math.round(2.0 * usdToArsRate).toLocaleString('es-AR')} ARS`;

  const displayPrice =
    paymentGateway === 'mercadopago'
      ? formattedArs
      : isCyberMonday
      ? '$0.99 USD'
      : '$2.00 USD';

  const displayOriginalPrice =
    paymentGateway === 'mercadopago'
      ? isCyberMonday
        ? formattedOriginalArs
        : null
      : isCyberMonday
      ? '$2.00 USD'
      : null;

  const plans = [
    {
      id: 'pro',
      name: 'Profesional PRO Ilimitado',
      price: '$2.00 USD',
      subPriceArs: `≈ ${formattedArs} al dólar de hoy ($${usdToArsRate.toLocaleString('es-AR')})`,
      originalPrice: displayOriginalPrice,
      period: '/ mes',
      icon: <Crown size={22} color="#f59e0b" />,
      desc: isCyberMonday
        ? 'Oferta especial usuarios registrados (Acceso TOTAL)'
        : 'Valor fijo de $2.00 USD mensuales pesificados automáticamente a la cotización del día',
      badge: isCyberMonday ? '🔥 PROMO (-50%)' : '✦ USD $2 EN PESOS'
    }
  ];

  const days = daysRemaining;
  const isExpiringSoon = days > 0 && days <= 7;

  const formattedExpiry = expiryDate
    ? expiryDate.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : days === Infinity
    ? 'Acceso Vitalicio / Permanente'
    : 'Suscripción Mensual Activa';

  return (
    <div
      className="container max-w-6xl mx-auto px-3 sm:px-6 animate-fade-in"
      style={{
        paddingTop: '7.25rem',
        paddingBottom: '6.5rem',
        margin: '0 auto',
        width: '100%'
      }}
    >
      {/* Premium Header */}
      <div className="mb-5 sm:mb-6">
        <PremiumHeader
          title="Suscripción y Membresía PRO"
          subtitle="Gestioná el estado de tu licencia profesional, métodos de pago y beneficios desbloqueados."
          icon={<Crown className="w-7 h-7" />}
          gradient="linear-gradient(135deg, #1d4ed8 0%, #4f46e5 55%, #7c3aed 100%)"
          badge={isSubscribed ? 'Membresía PRO Activa' : 'Planes Profesionales'}
          onBack={() => navigate('/profile')}
        />
      </div>

      {isSubscribed && !showPricing ? (
        /* CONTENEDOR FLEX ESTRICTAMENTE CENTRADO */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '0.25rem 0'
          }}
        >
          {/* CARTEL CENTRAL DE SUSCRIPCIÓN PRO ACTIVA */}
          <div
            className="rounded-3xl shadow-xl relative overflow-hidden"
            style={{
              width: '100%',
              maxWidth: '760px',
              margin: '0 auto',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.14)'
            }}
          >
            {/* Cabecera Visual del Cartel */}
            <div
              style={{
                background: isExpiringSoon
                  ? 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #ea580c 100%)'
                  : 'linear-gradient(135deg, #047857 0%, #059669 45%, #2563eb 100%)',
                padding: '2rem 1.5rem 1.75rem',
                textAlign: 'center',
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Brillo decorativo */}
              <div
                style={{
                  position: 'absolute',
                  top: '-45px',
                  right: '-45px',
                  width: '170px',
                  height: '170px',
                  borderRadius: '9999px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }}
              />

              {/* Pill Superior */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.32rem 0.9rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.32)',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  marginBottom: '1rem'
                }}
              >
                <Crown size={14} color="#fde047" />
                {isExpiringSoon ? 'Renovación Próxima' : 'Licencia Profesional Verificada'}
              </div>

              {/* Ícono Central */}
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '24px',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18)',
                  color: '#ffffff'
                }}
              >
                {isExpiringSoon ? (
                  <TriangleAlert size={38} color="#ffffff" />
                ) : (
                  <CheckCircle2 size={40} color="#ffffff" />
                )}
              </div>

              {/* Título y Subtítulo del Cartel */}
              <h2
                style={{
                  color: '#ffffff',
                  fontSize: 'clamp(1.35rem, 3vw, 1.85rem)',
                  fontWeight: 900,
                  margin: '0 0 0.45rem 0',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                {isExpiringSoon ? '⚠️ Tu Membresía Vence Pronto' : 'Suscripción PRO Activa ✓'}
              </h2>

              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.92)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  maxWidth: '540px',
                  margin: '0 auto',
                  lineHeight: 1.5
                }}
              >
                {isExpiringSoon
                  ? 'Renová tu membresía para mantener tus reportes PDF con logo, firma digital y asesor IA.'
                  : 'Tenés acceso total e ilimitado a todas las herramientas profesionales de Higiene y Seguridad.'}
              </p>
            </div>

            {/* Cuerpo del Cartel Centrado */}
            <div className="p-4 sm:p-7">
              {/* Resumen de Estado en 3 Tarjetas Simétricas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div
                  className="rounded-2xl p-3.5 text-center"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider block mb-1"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    Estado Actual
                  </span>
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '9999px',
                        backgroundColor: isExpiringSoon ? '#f59e0b' : '#10b981',
                        display: 'inline-block'
                      }}
                    />
                    <span
                      className="text-sm font-black"
                      style={{ color: isExpiringSoon ? '#d97706' : '#059669' }}
                    >
                      {isExpiringSoon ? 'Por Renovar' : 'PRO Activa'}
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-3.5 text-center"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider block mb-1"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    Vigencia / Cobertura
                  </span>
                  <span className="text-sm font-black block" style={{ color: '#2563eb' }}>
                    {days === Infinity
                      ? 'Vitalicio / Admin'
                      : days === 0
                      ? 'Vence Hoy'
                      : `${days} Días Restantes`}
                  </span>
                </div>

                <div
                  className="rounded-2xl p-3.5 text-center"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider block mb-1"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    Cuenta Vinculada
                  </span>
                  <span
                    className="text-xs sm:text-sm font-black block truncate"
                    style={{ color: 'var(--color-text)' }}
                    title={currentUser?.email || 'Profesional H&S'}
                  >
                    {currentUser?.email || 'Profesional H&S'}
                  </span>
                </div>
              </div>

              {/* Barra de Detalle de Licencia */}
              <div
                className="rounded-2xl p-4 sm:p-5 mb-5"
                style={{
                  backgroundColor: isExpiringSoon
                    ? 'rgba(245, 158, 11, 0.08)'
                    : 'rgba(16, 185, 129, 0.07)',
                  border: `1px solid ${
                    isExpiringSoon ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.28)'
                  }`
                }}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-3.5 mb-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} color={isExpiringSoon ? '#d97706' : '#059669'} />
                    <span
                      className="font-black text-xs sm:text-sm"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Validez de la Suscripción:{' '}
                      <span style={{ color: isExpiringSoon ? '#d97706' : '#059669' }}>
                        {formattedExpiry}
                      </span>
                    </span>
                  </div>

                  <span
                    className="text-[11px] font-black uppercase px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: isExpiringSoon
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(16, 185, 129, 0.18)',
                      color: isExpiringSoon ? '#b45309' : '#047857'
                    }}
                  >
                    ✦ Plan Profesional Ilimitado
                  </span>
                </div>

                {/* Grilla de Beneficios Desbloqueados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      icon: <FileCheck2 size={16} color="#2563eb" />,
                      label: 'Reportes PDF A4 con tu Logo',
                      sub: 'Membrete corporativo sin marca de agua'
                    },
                    {
                      icon: <Award size={16} color="#7c3aed" />,
                      label: 'Firma Olográfica y Sello H&S',
                      sub: 'Certificación profesional en documentos'
                    },
                    {
                      icon: <Sparkles size={16} color="#059669" />,
                      label: 'Asesor IA Legal y Técnico',
                      sub: 'Consultas ilimitadas Ley 19.587 / SRT'
                    },
                    {
                      icon: <QrCode size={16} color="#d97706" />,
                      label: 'Escáner QR + Nube Híbrida',
                      sub: 'Todos los protocolos SRT y sincronización'
                    }
                  ].map((feat, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-3 flex items-center gap-3 text-left"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        {feat.icon}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-xs font-black truncate"
                          style={{ color: 'var(--color-text)' }}
                        >
                          ✓ {feat.label}
                        </div>
                        <div
                          className="text-[11px] truncate"
                          style={{ color: 'var(--color-text-light)' }}
                        >
                          {feat.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tarjeta de Adhesión a Débito Automático para usuarios actuales */}
              <div
                className="rounded-2xl p-4 sm:p-5 mb-5"
                style={{
                  backgroundColor: hasCardAdhered
                    ? 'rgba(37, 99, 235, 0.07)'
                    : 'rgba(245, 158, 11, 0.09)',
                  border: `1.5px solid ${
                    hasCardAdhered ? 'rgba(37, 99, 235, 0.3)' : 'rgba(245, 158, 11, 0.45)'
                  }`
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 text-left">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: hasCardAdhered ? 'rgba(37, 99, 235, 0.15)' : 'rgba(245, 158, 11, 0.2)',
                        color: hasCardAdhered ? '#2563eb' : '#d97706'
                      }}
                    >
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black" style={{ color: 'var(--color-text)' }}>
                        {hasCardAdhered
                          ? '✓ Tarjeta de Débito / Crédito Adherida (Débito Automático Activo)'
                          : '💳 Adherí tu Tarjeta de Débito o Crédito para Renovación Automática'}
                      </div>
                      <p className="text-xs m-0 mt-1 leading-relaxed" style={{ color: 'var(--color-text-light)' }}>
                        {hasCardAdhered
                          ? 'Tu membresía se debitará automáticamente cada mes sin interrupciones. Podés cambiar de tarjeta o cancelar cuando quieras.'
                          : 'Vinculá tu tarjeta (Visa, Mastercard, Cabal, Naranja o Amex — Débito o Crédito) para que se debite automáticamente mes a mes y no pierdas el acceso PRO.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBillingMode('recurring');
                      setShowPricing(true);
                    }}
                    style={{
                      marginBottom: 0,
                      padding: '0.65rem 1rem',
                      borderRadius: '0.85rem',
                      background: hasCardAdhered
                        ? 'var(--color-surface)'
                        : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                      color: hasCardAdhered ? 'var(--color-text)' : '#ffffff',
                      border: hasCardAdhered ? '1px solid var(--color-border)' : 'none',
                      fontWeight: 900,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      boxShadow: hasCardAdhered ? 'none' : '0 6px 16px rgba(37, 99, 235, 0.28)'
                    }}
                  >
                    {hasCardAdhered ? 'Cambiar Tarjeta' : '💳 Adherir Tarjeta Ahora'}
                  </button>
                </div>
              </div>

              {/* Botones de Acción Centrados */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPricing(true)}
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.95rem 1.25rem',
                    borderRadius: '0.95rem',
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.28)'
                  }}
                >
                  <CreditCard size={18} /> Adherir Tarjeta (Débito / Crédito) u Opciones de Pago <ArrowRight size={17} />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    style={{
                      marginBottom: 0,
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '0.9rem',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowLeft size={16} /> Volver a Mi Perfil
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const toastId = toast(
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-bold">⚠️ ¿Cancelar débito automático y suscripción?</span>
                          <span className="text-xs text-slate-600">
                            Se dará de baja el cobro automático en tu tarjeta y las funciones PRO.
                          </span>
                          <div className="flex gap-2 mt-1">
                            <button
                              type="button"
                              onClick={async () => {
                                toast.dismiss(toastId);
                                try {
                                  const token = await currentUser?.getIdToken();
                                  await fetch(`${API_BASE_URL}/api/cancel-subscription`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      ...(token ? { Authorization: `Bearer ${token}` } : {})
                                    }
                                  });
                                } catch (e) {
                                  console.warn('Error al cancelar en servidor:', e);
                                }
                                await syncDocument('subscriptionData', {
                                  status: 'inactive',
                                  autoRenew: 'false',
                                  expiry: '0'
                                });
                                setIsSubscribed(false);
                                setHasCardAdhered(false);
                                setExpiryDate(null);
                                toast.success('Débito automático y suscripción cancelados.');
                              }}
                              style={{
                                marginBottom: 0,
                                backgroundColor: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.35rem 0.85rem',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              Sí, cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => toast.dismiss(toastId)}
                              style={{
                                marginBottom: 0,
                                backgroundColor: '#e2e8f0',
                                color: '#1e293b',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.35rem 0.85rem',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              No
                            </button>
                          </div>
                        </div>,
                        { duration: 6000 }
                      );
                    }}
                    style={{
                      marginBottom: 0,
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '0.9rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      color: '#dc2626',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar Suscripción
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start"
          style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}
        >
          {/* Left Side (7 cols): Benefits Grid */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div
              className="rounded-3xl p-4 sm:p-6 shadow-sm text-left"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              <h2 className="text-lg sm:text-xl font-black m-0 mb-1.5" style={{ color: 'var(--color-text)' }}>
                Todo lo que incluye la Membresía PRO
              </h2>
              <p className="text-xs sm:text-sm m-0 mb-5" style={{ color: 'var(--color-text-light)' }}>
                Diseñado para licenciados, ingenieros y técnicos en Higiene y Seguridad de Argentina y Latinoamérica.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    icon: <ShieldCheck className="w-5 h-5" />,
                    title: 'Protocolos Oficiales SRT',
                    desc: 'Puesta a Tierra (900/15), Ruido (85/12), Iluminación (84/12), RGRL (463/09) y Autoelevadores (960/15).'
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5" />,
                    title: 'PDFs A4 con Logo y Firma',
                    desc: 'Reportes formales con tu membrete corporativo, matrícula, firma digital y sello oficial.'
                  },
                  {
                    icon: <CreditCard className="w-5 h-5" />,
                    title: 'Escáner QR de Activos y Firmas',
                    desc: 'Inspección de equipos en planta mediante etiquetas QR y validación instantánea desde el celular.'
                  },
                  {
                    icon: <Sparkles className="w-5 h-5" />,
                    title: 'Asesor IA y Dossier ZIP',
                    desc: 'Consultas técnicas ilimitadas con IA normativa y exportación masiva de legajos.'
                  },
                  {
                    icon: <Cloud className="w-5 h-5" />,
                    title: 'Sincronización Cloud + Offline',
                    desc: 'Relevá en planta sin señal y sincronizá automáticamente en todos tus dispositivos.'
                  },
                  {
                    icon: <Globe className="w-5 h-5" />,
                    title: 'Mercado Pago o PayPal',
                    desc: 'Activación inmediata en pesos argentinos o dólares. Cancelá cuando quieras con 1 clic.'
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-4 flex flex-col gap-2.5 text-left"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        color: '#ffffff'
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-black m-0 mb-1" style={{ color: 'var(--color-text)' }}>
                        {item.title}
                      </h3>
                      <p className="text-xs m-0 leading-relaxed" style={{ color: 'var(--color-text-light)' }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side (5 cols): Checkout Card */}
          <div className="lg:col-span-5">
            <div
              className="rounded-3xl p-4 sm:p-6 shadow-md text-left"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              {isCyberMonday && (
                <div
                  className="mb-4 p-3 rounded-2xl text-center"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)'
                  }}
                >
                  <div className="text-xs font-black uppercase text-amber-600">
                    🔥 Oferta Especial Activa
                  </div>
                  <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>
                    Precio promocional: <span className="line-through opacity-60">$2.00</span>{' '}
                    <span className="text-emerald-600 font-black">$0.99 USD</span>
                  </div>
                </div>
              )}

              <h3 className="text-sm sm:text-base font-black m-0 mb-3" style={{ color: 'var(--color-text)' }}>
                1. Plan Seleccionado
              </h3>

              <div className="space-y-2.5 mb-5">
                {plans.map((p) => {
                  const isSelected = selectedPlan === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p.id as any)}
                      style={{
                        marginBottom: 0,
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '1.1rem',
                        backgroundColor: isSelected
                          ? 'rgba(37, 99, 235, 0.08)'
                          : 'var(--color-background)',
                        border: `2px solid ${isSelected ? '#2563eb' : 'var(--color-border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.35)'
                          }}
                        >
                          {p.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-black text-sm" style={{ color: 'var(--color-text)' }}>
                              {p.name}
                            </span>
                            <span
                              className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                                color: '#2563eb'
                              }}
                            >
                              {p.badge}
                            </span>
                          </div>
                          <p className="text-xs m-0 mt-1" style={{ color: 'var(--color-text-light)' }}>
                            {p.desc}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {p.originalPrice && (
                          <span
                            className="text-xs line-through block"
                            style={{ color: 'var(--color-text-light)' }}
                          >
                            {p.originalPrice}
                          </span>
                        )}
                        <span className="text-xl font-black block" style={{ color: '#2563eb' }}>
                          {isCyberMonday ? '$0.99 USD' : p.price}
                        </span>
                        {paymentGateway === 'mercadopago' && (
                          <span className="text-xs font-extrabold block" style={{ color: '#059669' }}>
                            {formattedArs}
                          </span>
                        )}
                        <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-light)' }}>
                          {p.period}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {paymentGateway === 'mercadopago' && (
                <div
                  className="mb-4 p-2.5 rounded-xl flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'var(--color-text)'
                  }}
                >
                  <span className="font-bold">
                    💵 Cotización hoy: <strong>1 USD = ${usdToArsRate.toLocaleString('es-AR')} ARS</strong>
                  </span>
                  <span className="font-black text-emerald-600">
                    ${usdBasePrice.toFixed(2)} USD = {formattedArs}
                  </span>
                </div>
              )}

              <h3 className="text-sm sm:text-base font-black m-0 mb-2" style={{ color: 'var(--color-text)' }}>
                2. Adherí tu Tarjeta (Débito o Crédito)
              </h3>
              <p className="text-xs m-0 mb-3" style={{ color: 'var(--color-text-light)' }}>
                Aceptamos todas las tarjetas de <strong>Débito y Crédito</strong> (Visa, Mastercard, Cabal, Naranja, American Express).
              </p>

              {/* Tarjetas Aceptadas Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                {['💳 VISA Débito/Crédito', '💳 Mastercard Débito/Crédito', '💳 Amex', '💳 Cabal / Naranja'].map((cardLabel) => (
                  <span
                    key={cardLabel}
                    className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)'
                    }}
                  >
                    {cardLabel}
                  </span>
                ))}
              </div>

              {/* High-Contrast Gateway Selector */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentGateway('mercadopago')}
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.85rem 0.65rem',
                    borderRadius: '0.95rem',
                    backgroundColor:
                      paymentGateway === 'mercadopago' ? '#009ee3' : 'var(--color-background)',
                    color: paymentGateway === 'mercadopago' ? '#ffffff' : 'var(--color-text)',
                    border: `2px solid ${
                      paymentGateway === 'mercadopago' ? '#009ee3' : 'var(--color-border)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem',
                    cursor: 'pointer',
                    boxShadow:
                      paymentGateway === 'mercadopago'
                        ? '0 6px 16px rgba(0, 158, 227, 0.3)'
                        : 'none'
                  }}
                >
                  <span className="font-black text-xs sm:text-sm">🇦🇷 Mercado Pago</span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{
                      color:
                        paymentGateway === 'mercadopago'
                          ? 'rgba(255,255,255,0.9)'
                          : 'var(--color-text-light)'
                    }}
                  >
                    Tarjetas en Pesos (ARS)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentGateway('paypal')}
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.85rem 0.65rem',
                    borderRadius: '0.95rem',
                    backgroundColor:
                      paymentGateway === 'paypal' ? '#003087' : 'var(--color-background)',
                    color: paymentGateway === 'paypal' ? '#ffffff' : 'var(--color-text)',
                    border: `2px solid ${
                      paymentGateway === 'paypal' ? '#0070ba' : 'var(--color-border)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem',
                    cursor: 'pointer',
                    boxShadow:
                      paymentGateway === 'paypal'
                        ? '0 6px 16px rgba(0, 112, 186, 0.35)'
                        : 'none'
                  }}
                >
                  <span className="font-black text-xs sm:text-sm">🌎 PayPal Internacional</span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{
                      color:
                        paymentGateway === 'paypal'
                          ? 'rgba(255,255,255,0.9)'
                          : 'var(--color-text-light)'
                    }}
                  >
                    Tarjetas en USD / PayPal
                  </span>
                </button>
              </div>

              {/* Modalidad de Débito Automático vs 1 Mes */}
              <div className="mb-4 space-y-2">
                <span className="text-xs font-extrabold block" style={{ color: 'var(--color-text)' }}>
                  3. Modalidad de Débito con Tarjeta:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingMode('recurring')}
                    style={{
                      marginBottom: 0,
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '0.85rem',
                      backgroundColor:
                        billingMode === 'recurring' ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-background)',
                      border: `2px solid ${billingMode === 'recurring' ? '#10b981' : 'var(--color-border)'}`,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <div className="text-xs font-black" style={{ color: 'var(--color-text)' }}>
                        🔄 Adherir Tarjeta — Débito Automático Mensual (Recomendado)
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                        Ingresás tu tarjeta de débito o crédito una vez y se debita cada mes automáticamente.
                      </div>
                    </div>
                    <CheckCircle2 size={18} color={billingMode === 'recurring' ? '#10b981' : '#94a3b8'} className="shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingMode('single')}
                    style={{
                      marginBottom: 0,
                      width: '100%',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '0.85rem',
                      backgroundColor:
                        billingMode === 'single' ? 'rgba(37, 99, 235, 0.08)' : 'var(--color-background)',
                      border: `1.5px solid ${billingMode === 'single' ? '#2563eb' : 'var(--color-border)'}`,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <div className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                        1️⃣ Pago con Tarjeta por 1 Mes (Sin renovación automática)
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                        Ideal para tarjetas prepagas o pago único manual por 30 días.
                      </div>
                    </div>
                    <CheckCircle2 size={16} color={billingMode === 'single' ? '#2563eb' : '#94a3b8'} className="shrink-0" />
                  </button>
                </div>
              </div>

              {/* Checkout Submit Button */}
              {paymentGateway === 'mercadopago' ? (
                <button
                  type="button"
                  onClick={handleMercadoPago}
                  disabled={loading}
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.95rem 1.2rem',
                    borderRadius: '0.95rem',
                    background: 'linear-gradient(135deg, #009ee3 0%, #0284c7 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: loading ? 'wait' : 'pointer',
                    boxShadow: '0 8px 22px rgba(0, 158, 227, 0.35)'
                  }}
                >
                  <CreditCard size={20} color="#ffffff" />
                  {loading
                    ? 'Abriendo adhesión segura de tarjeta...'
                    : billingMode === 'recurring'
                    ? `Adherir Tarjeta Débito / Crédito (${displayPrice}/mes)`
                    : `Pagar 1 Mes con Tarjeta (${displayPrice})`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePayPal}
                  disabled={loading}
                  style={{
                    marginBottom: 0,
                    width: '100%',
                    padding: '0.95rem 1.2rem',
                    borderRadius: '0.95rem',
                    background: 'linear-gradient(135deg, #003087 0%, #0070ba 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: loading ? 'wait' : 'pointer',
                    boxShadow: '0 8px 22px rgba(0, 112, 186, 0.35)'
                  }}
                >
                  <CreditCard size={20} color="#ffffff" />
                  {loading
                    ? 'Abriendo formulario seguro de PayPal...'
                    : billingMode === 'recurring'
                    ? `Adherir Tarjeta / PayPal (${displayPrice}/mes)`
                    : `Pagar 1 Mes con PayPal (${displayPrice})`}
                </button>
              )}

              {isSubscribed && showPricing && (
                <button
                  type="button"
                  onClick={() => setShowPricing(false)}
                  style={{
                    marginBottom: 0,
                    marginTop: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.85rem',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft size={16} /> Volver al cartel de mi suscripción
                </button>
              )}

              <p
                className="text-center text-xs m-0 mt-4 font-semibold flex items-center justify-center gap-1.5"
                style={{ color: 'var(--color-text-light)' }}
              >
                <Lock size={13} /> Pago 100% seguro y cifrado. Activación inmediata.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
