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
                currentUser?.getIdToken().then(token => {
                    fetch(`${API_BASE_URL}/api/verify-payment`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ payment_id })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            setIsSubscribed(true);
                            toast.success('¡Suscripción activada con éxito!');
                            // Force token refresh to get new custom claims
                            return currentUser.getIdToken(true);
                        } else {
                            toast.error('Hubo un error verificando el pago. Contacta soporte.');
                        }
                    })
                    .catch(err => {
                        console.error('Payment verification error', err);
                        toast.error('Error de red al verificar el pago.');
                    })
                    .finally(() => {
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
            <div style={{
                padding: '2rem',
                maxWidth: '600px',
                margin: '10rem auto',
                background: 'var(--color-surface)',
                borderRadius: '24px',
                border: '1px solid var(--color-border)',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: '#10b981'
                }}>
                    <CheckCircle2 size={40} />
                </div>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Suscripción Activa ✓</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                    Tienes acceso ilimitado a todas las funciones profesionales.
                </p>

                <div style={{
                    background: isExpiringSoon ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16,185,129,0.08)',
                    padding: '1.2rem',
                    borderRadius: '16px',
                    marginBottom: '2rem',
                    border: `1px solid ${isExpiringSoon ? '#f59e0b' : '#10b981'}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Calendar size={18} color={isExpiringSoon ? '#f59e0b' : '#10b981'} />
                        <span style={{ fontWeight: 700, color: isExpiringSoon ? '#f59e0b' : '#10b981' }}>
                            {isExpiringSoon ? '¡Vence pronto!' : 'Estado del Plan'}
                        </span>
                    </div>
                    {expiryDate && (
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 600 }}>
                            Válida hasta: {expiryDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    )}
                    <p style={{ margin: '0.5rem 0 0', fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-text)' }}>
                        {days === Infinity ? 'Acceso Permanente' : `Quedan ${days} días`} 
                        {isExpiringSoon && <Sparkles size={18} style={{ display: 'inline', marginLeft: '5px' }} />}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <></>

                    {isExpiringSoon && (
                        <button
                            onClick={() => setShowPricing(true)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            Renovar Ahora <Sparkles size={18} />
                        </button>
                    )}

                    <button
                        onClick={() => window.location.reload()}
                        className="btn-secondary"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            fontWeight: '800',
                            marginBottom: '0.8rem',
                            fontSize: '0.95rem'
                        }}
                    >
                        Verificar mi pago
                    </button>
                    <button
                        onClick={() => {
                            const toastId = toast(
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>⚠️ ¿Cancelar suscripción?</span>
                                    <span style={{ fontSize: '0.8rem', color: '#555' }}>Perderás acceso a las funciones Premium.</span>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                                        <button
                                            onClick={async () => {
                                                toast.dismiss(toastId);
                                                await syncDocument('subscriptionData', { status: 'inactive', expiry: '0' });
                                                setIsSubscribed(false);
                                                setExpiryDate(null);
                                                toast.success('Suscripción cancelada.');
                                            }}
                                            style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}
                                        >Sí, cancelar</button>
                                        <button
                                            onClick={() => toast.dismiss(toastId)}
                                            style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}
                                        >No</button>
                                    </div>
                                </div>,
                                { duration: 6000 }
                            );
                        }}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Cancelar Suscripción
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Ambient Background Glows */}
            <div className="ambient-glow blue" style={{ top: '20%', left: '-10%', width: '500px', height: '500px' }} />
            <div className="ambient-glow purple" style={{ bottom: '10%', right: '-5%', width: '600px', height: '600px', animationDelay: '2s' }} />

            <div className="subscription-layout stagger-item" style={{
            padding: '2rem 1rem', // Added horizontal padding for mobile
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1fr) 450px', // More flexible column
            gap: '2rem', // Reduced gap for mobile
            alignItems: 'center',
            minHeight: '80vh',
            paddingTop: '6rem' // Prevent overlap with fixed header
        }}>
            {/* Benefits Side */}
            <div>
                {showPricing && (
                    <></>
                )}

                {!showPricing && (
                    <></>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#3b82f6', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'transparent', borderRadius: '10px' }}>
                        <img src="/logo.png" alt="Logo de Asistente H&S" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontWeight: '800', letterSpacing: '2px', fontSize: '1.3rem', textTransform: 'uppercase', color: 'var(--color-text)' }}>ASISTENTE H&S</span>
                </div>

                <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: '900', marginBottom: '1.5rem', lineHeight: '1.2', color: 'var(--color-text)' }}>
                    Potencia tu trabajo como <br />
                    <span className="gradient-text">Profesional</span>
                </h1>

                <p style={{ fontSize: '1.15rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: '1.6', maxWidth: '600px' }}>
                    Esta aplicación está diseñada exclusivamente para profesionales de Higiene y Seguridad.
                    Olvídate de perder horas redactando informes. Genera relevamientos de riesgos, constancias de carga de fuego, matrices, reportes fotográficos y más en segundos, desde cualquier lugar.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    {[
                        { icon: <ShieldCheck />, title: 'Informes Instantáneos', desc: 'Genera PDFs profesionales listos para enviar al cliente.', delay: '1' },
                        { icon: <CreditCard />, title: 'Todo centralizado', desc: 'Gestiona inspecciones, ATS y cálculos ergonómicos.', delay: '2' },
                        { icon: <Lock />, title: '100% Confidencial', desc: 'Tus datos están completamente seguros y cifrados.', delay: '3' },
                        { icon: <CheckCircle2 />, title: 'Actualizaciones', desc: 'Soporte para nuevas normativas y herramientas.', delay: '4' }
                    ].map((item, i) => (
                        <div key={i} className={`glass-card hover-lift stagger-item-delay-${item.delay}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ color: '#ffffff', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '0.8rem', borderRadius: '12px', boxShadow: '0 8px 16px rgba(59,130,246,0.3)' }}>
                                {item.icon}
                            </div>
                            <div>
                                <div style={{ fontWeight: '800', marginBottom: '0.4rem', fontSize: '1.05rem', color: 'var(--color-text)' }}>{item.title}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Card */}
            <div className="stagger-item-delay-2" style={{ position: 'relative', marginTop: '20px' }}>
                <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    color: '#ffffff',
                    padding: '0.5rem 2rem',
                    borderRadius: '50px',
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    boxShadow: '0 10px 20px rgba(59, 130, 246, 0.4)',
                    whiteSpace: 'nowrap',
                    zIndex: 10
                }}>
                    SUSCRIPCIÓN MENSUAL PRO
                </div>

                <div className="pricing-card glass-mockup hover-lift" style={{
                    padding: '3rem 2.5rem',
                    textAlign: 'center',
                    position: 'relative'
                }}>

                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', margin: '3rem 0 1rem' }}>
                        <span className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: '800', marginRight: '0.2rem' }}>$</span>
                    <span className="gradient-text" style={{ fontSize: '5.5rem', fontWeight: '900', letterSpacing: '-2px' }}>2.00</span>
                    <span style={{ fontSize: '1.5rem', color: 'var(--color-text-secondary)', marginLeft: '0.8rem', fontWeight: '700' }}>/ MES</span>
                </div>

                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
                    Facturación mensual. Cancela en cualquier momento. Desbloquea todo el potencial.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        onClick={handleMercadoPago}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: '#009ee3', // Mercado Pago color
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img src="/mercadopago.svg" alt="Mercado Pago" style={{ width: '18px', height: '18px' }} />
                        </div>
                        {loading ? 'Generando link...' : 'Pagar con Mercado Pago'}
                    </button>

                </div>

                <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Pagos 100% seguros y encriptados. Activación instantánea.
                </p>
            </div>
            </div>
        </div>
        </div>
    );
}
