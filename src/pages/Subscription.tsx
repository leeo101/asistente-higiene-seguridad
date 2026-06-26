import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ShieldCheck, CreditCard, Sparkles, CheckCircle2, Lock, ArrowRight, ArrowLeft, Calendar, TriangleAlert } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { usePaywall } from '../hooks/usePaywall';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';

export default function Subscription(): React.ReactElement | null {
  const navigate = useNavigate();
  const { isPro, daysRemaining } = usePaywall();
  const { currentUser } = useAuth();
  const { syncDocument } = useSync();
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');
    const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');

    // Check if user is active
    if (isPro) {
      setIsSubscribed(true);
      const expiry = parseInt(subData.expiry || '0', 10);
      if (expiry) setExpiryDate(new Date(expiry));
    }

    if (paymentStatus === 'approved') {
      const payment_id = urlParams.get('payment_id');

      if (payment_id) {
        setLoading(true);
        // Call backend to verify
        currentUser?.getIdToken().then((token) => {
          fetch(`${API_BASE_URL}/api/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ payment_id })
          }).
          then((res) => res.json()).
          then((data) => {
            if (data.success) {
              setIsSubscribed(true);
              toast.success('¡Suscripción activada con éxito!');
              // Force token refresh to get new custom claims
              return currentUser.getIdToken(true);
            } else {
              toast.error('Hubo un error verificando el pago. Contacta soporte.');
            }
          }).
          catch((err) => {
            console.error('Payment verification error', err);
            toast.error('Error de red al verificar el pago.');
          }).
          finally(() => {
            setLoading(false);
            window.history.replaceState({}, document.title, window.location.pathname);
          });
        });
      } else {
        toast.error('Pago aprobado pero falta ID de validación.');
      }
    }
  }, [isPro, currentUser]);

  const handleMercadoPago = async () => {
    if (!currentUser) {
      toast.error('Debes crear una cuenta o iniciar sesión para suscribirte.', { duration: 4000 });
      navigate('/login', { state: { view: 'register' } });
      return;
    }

    setLoading(true);
    try {
      const fetchUrl = `${API_BASE_URL}/api/create-subscription`;

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser?.uid,
          email: currentUser?.email
        })
      });
      const data = await response.json();

      if (data.init_point) {
        // Redirect user to Mercado Pago checkout for subscription
        window.location.href = data.init_point;
      } else {
        toast.error('Error al generar el link de pago.');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de conexión con el servidor de pago.');
      setLoading(false);
    }
  };


  if (isSubscribed && !showPricing) {
    const days = daysRemaining;
    const isExpiringSoon = days > 0 && days <= 7;

    return (
      <div className="p-[2rem] max-w-[600px] m-[10rem_auto] bg-[var(--color-surface)] rounded-[24px] border-[1px_solid_var(--color-border)] text-center box-shadow-[0_20px_40px_rgba(0,0,0,0.1)]">








        
                <div className="w-[80px] h-[80px] bg-[rgba(16,_185,_129,_0.1)] rounded-[50%] flex items-center justify-center m-[0_auto_1.5rem] text-[#10b981]">









          
                    <CheckCircle2 size={40} />
                </div>
                <h1 className="text-[2rem] mb-[0.5rem] text-[var(--color-text)]">Suscripción Activa ✓</h1>
                <p className="text-[var(--color-text-secondary)] mb-[1.5rem]">
                    Tienes acceso ilimitado a todas las funciones profesionales.
                </p>

                <div style={{
          background: isExpiringSoon ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16,185,129,0.08)',



          border: `1px solid ${isExpiringSoon ? '#f59e0b' : '#10b981'}`
        }} className="p-[1.2rem] rounded-[16px] mb-[2rem]">
                    <div className="flex items-center justify-center gap-[0.5rem] mb-[0.5rem]">
                        <Calendar size={18} color={isExpiringSoon ? '#f59e0b' : '#10b981'} />
                        <span style={{ color: isExpiringSoon ? '#f59e0b' : '#10b981' }} className="font-[700]">
                            {isExpiringSoon ? '¡Vence pronto!' : 'Estado del Plan'}
                        </span>
                    </div>
                    {expiryDate &&
          <p className="m-[0] text-[0.9rem] text-[var(--color-text)] font-[600]">
                            Válida hasta: {expiryDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
          }
                    <p className="m-[0.5rem_0_0] text-[1.2rem] font-[900] text-[var(--color-text)]">
                        {days === Infinity ? 'Acceso Permanente' : `Quedan ${days} días`} 
                        {isExpiringSoon && <Sparkles size={18} className="display-[inline] ml-[5px]" />}
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <></>

                    {isExpiringSoon &&
          <button
            onClick={() => setShowPricing(true)} className="w-[100%] p-[1rem] bg-[linear-gradient(90deg,_#3b82f6,_#8b5cf6)] text-[#ffffff] border-none rounded-[12px] font-[700] cursor-pointer flex items-center justify-center gap-[0.5rem] box-shadow-[0_4px_12px_rgba(59,_130,_246,_0.3)]">















            
                            Renovar Ahora <Sparkles size={18} />
                        </button>
          }

                    <button
            onClick={() => window.location.reload()}
            className="btn-secondary w-[100%] p-[1rem] rounded-[12px] font-[800] mb-[0.8rem] text-[0.95rem]">








            
                        Verificar mi pago
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

                      Sí, cancelar</button>
                                        <button
                      onClick={() => toast.dismiss(toastId)} className="bg-[#f1f5f9] text-[#475569] border-none rounded-[8px] p-[0.4rem_1rem] cursor-pointer font-[800] text-[0.85rem]">

                      No</button>
                                    </div>
                                </div>,
                { duration: 6000 }
              );
            }} className="w-[100%] p-[1rem] bg-[transparent] text-[#ef4444] border-[1px_solid_#ef4444] rounded-[12px] font-[600] cursor-pointer text-[0.9rem]">











            
                        Cancelar Suscripción
                    </button>
                </div>
            </div>);

  }

  return (
    <div className="relative overflow-[hidden]">
            {/* Ambient Background Glows */}
            <div className="ambient-glow blue top-[20%] left-[-10%] w-[500px] h-[500px]" />
            <div className="ambient-glow purple bottom-[10%] right-[-5%] w-[600px] h-[600px] animation-delay-[2s]" />

            <div className="subscription-layout stagger-item p-[2rem_1rem] max-w-[1200px] m-[0_auto] grid grid-template-columns-[minmax(300px,_1fr)_450px] gap-[2rem] items-center min-h-[80vh] pt-[6rem]">









        
            {/* Benefits Side */}
            <div>
                {showPricing &&
          <></>
          }

                {!showPricing &&
          <></>
          }

                <div className="flex items-center gap-[1rem] text-[#3b82f6] mb-[1.5rem]">
                    <div className="bg-[transparent] rounded-[10px]">
                        <img src="/logo.png" alt="Logo de Asistente H&S" className="w-[48px] h-[48px] object-fit-[contain]" />
                    </div>
                    <span className="font-[800] letter-spacing-[2px] text-[1.3rem] uppercase text-[var(--color-text)]">ASISTENTE H&S</span>
                </div>

                <h1 className="text-[clamp(2.5rem,_5vw,_3.5rem)] font-[900] mb-[1.5rem] line-height-[1.2] text-[var(--color-text)]">
                    Potencia tu trabajo como <br />
                    <span className="gradient-text">Profesional</span>
                </h1>

                <p className="text-[1.15rem] text-[var(--color-text-secondary)] mb-[2rem] line-height-[1.6] max-w-[600px]">
                    Esta aplicación está diseñada exclusivamente para profesionales de Higiene y Seguridad.
                    Olvídate de perder horas redactando informes. Genera relevamientos de riesgos, constancias de carga de fuego, matrices, reportes fotográficos y más en segundos, desde cualquier lugar.
                </p>

                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(240px,_1fr))] gap-[1.5rem]">
                    {[
            { icon: <ShieldCheck />, title: 'Informes Instantáneos', desc: 'Genera PDFs profesionales listos para enviar al cliente.', delay: '1' },
            { icon: <CreditCard />, title: 'Todo centralizado', desc: 'Gestiona inspecciones, ATS y cálculos ergonómicos.', delay: '2' },
            { icon: <Lock />, title: '100% Confidencial', desc: 'Tus datos están completamente seguros y cifrados.', delay: '3' },
            { icon: <CheckCircle2 />, title: 'Actualizaciones', desc: 'Soporte para nuevas normativas y herramientas.', delay: '4' }].
            map((item, i) =>
            <div key={i} className={`glass-card hover-lift stagger-item-delay- p-[1.5rem] flex flex-col gap-[1rem] items-start ${item.delay}`}>
                            <div className="text-[#ffffff] bg-[linear-gradient(135deg,_#3b82f6,_#8b5cf6)] p-[0.8rem] rounded-[12px] box-shadow-[0_8px_16px_rgba(59,130,246,0.3)]">
                                {item.icon}
                            </div>
                            <div>
                                <div className="font-[800] mb-[0.4rem] text-[1.05rem] text-[var(--color-text)]">{item.title}</div>
                                <div className="text-[0.9rem] text-[var(--color-text-secondary)] line-height-[1.5]">{item.desc}</div>
                            </div>
                        </div>
            )}
                </div>
            </div>

            {/* Pricing Card */}
            <div className="stagger-item-delay-2 relative mt-[20px]">
                <div className="absolute top-[-20px] left-[50%] transform-[translateX(-50%)] bg-[linear-gradient(90deg,_#3b82f6,_#8b5cf6)] text-[#ffffff] p-[0.5rem_2rem] rounded-[50px] text-[0.9rem] font-[800] box-shadow-[0_10px_20px_rgba(59,_130,_246,_0.4)] white-space-[nowrap] z-[10]">













            
                    SUSCRIPCIÓN MENSUAL PRO
                </div>

                <div className="pricing-card glass-mockup hover-lift p-[3rem_2.5rem] text-center relative">



            

                    <div className="flex items-baseline justify-center m-[3rem_0_1rem]">
                        <span className="gradient-text text-[2.5rem] font-[800] mr-[0.2rem]">$</span>
                    <span className="gradient-text text-[5.5rem] font-[900] letter-spacing-[-2px]">2.00</span>
                    <span className="text-[1.5rem] text-[var(--color-text-secondary)] ml-[0.8rem] font-[700]">/ MES</span>
                </div>

                <p className="text-[var(--color-text-secondary)] mb-[2rem] text-[0.95rem]">
                    Facturación mensual. Cancela en cualquier momento. Desbloquea todo el potencial.
                </p>

                <div className="flex flex-col gap-[1rem] mb-[2rem]">
                    <button
                onClick={handleMercadoPago}
                disabled={loading}
                style={{








                  cursor: loading ? 'not-allowed' : 'pointer'





                }} className="w-[100%] p-[1rem] bg-[#009ee3] text-[#ffffff] border-none rounded-[12px] text-[1.1rem] font-[700] transition-[all_0.3s_ease] flex items-center justify-center gap-[0.75rem]">
                
                        <div className="bg-[#ffffff] rounded-[50%] w-[28px] h-[28px] flex items-center justify-center">







                  
                            <img src="/mercadopago.svg" alt="Mercado Pago" className="w-[18px] h-[18px]" />
                        </div>
                        {loading ? 'Generando link...' : 'Pagar con Mercado Pago'}
                    </button>

                </div>

                <p className="mt-[1.5rem] text-[0.85rem] text-[var(--color-text-secondary)] font-[600]">
                    Pagos 100% seguros y encriptados. Activación instantánea.
                </p>
            </div>
            </div>
        </div>
        </div>);

}