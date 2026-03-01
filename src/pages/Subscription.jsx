import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Sparkles, CheckCircle2, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

export default function Subscription() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [expiryDate, setExpiryDate] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('status');

        if (paymentStatus === 'approved') {
            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
            localStorage.setItem('subscriptionStatus', 'active');
            localStorage.setItem('subscriptionExpiry', String(expiry));
            setExpiryDate(new Date(expiry));
            setIsSubscribed(true);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            const status = localStorage.getItem('subscriptionStatus');
            const expiry = parseInt(localStorage.getItem('subscriptionExpiry') || '0', 10);
            // Check not expired
            if (status === 'active' && (expiry === 0 || Date.now() <= expiry)) {
                setIsSubscribed(true);
                if (expiry) setExpiryDate(new Date(expiry));
            } else if (status === 'active' && expiry > 0 && Date.now() > expiry) {
                // Grace period passed — clean up
                localStorage.removeItem('subscriptionStatus');
                localStorage.removeItem('subscriptionExpiry');
            }
        }
    }, []);

    const handleMercadoPago = async () => {
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


    if (isSubscribed) {
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
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Suscripción Activa ✓</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                    Ya tienes acceso ilimitado a todas las funciones profesionales.
                </p>
                {expiryDate && (
                    <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, marginBottom: '2rem', background: 'rgba(16,185,129,0.08)', padding: '0.5rem 1rem', borderRadius: '10px', display: 'inline-block' }}>
                        ✅ Válida hasta: {expiryDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                )}
                {!expiryDate && <div style={{ marginBottom: '2rem' }} />}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                    }}
                >
                    Ir al Inicio <ArrowRight size={18} />
                </button>
                <button
                    onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas cancelar tu suscripción? Perderás acceso a las funciones Premium.')) {
                            localStorage.removeItem('subscriptionStatus');
                            localStorage.removeItem('subscriptionExpiry');
                            setIsSubscribed(false);
                            setExpiryDate(null);
                            toast.success('Suscripción cancelada con éxito.');
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'transparent',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Cancelar Suscripción
                </button>
            </div>
        );
    }

    return (
        <div className="subscription-layout" style={{
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
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        marginBottom: '3rem',
                        padding: '0'
                    }}
                >
                    <ArrowLeft size={18} /> Regresar al Inicio
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#3b82f6', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'transparent', borderRadius: '10px' }}>
                        <img src="/logo.png" alt="Logo de Asistente H&S" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontWeight: '800', letterSpacing: '2px', fontSize: '1.3rem', textTransform: 'uppercase', color: 'var(--color-text)' }}>ASISTENTE H&S</span>
                </div>

                <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1.5rem', lineHeight: '1.2', color: 'var(--color-text)' }}>
                    Potencia tu trabajo como <span style={{ color: '#3b82f6' }}>Profesional</span>
                </h1>

                <p style={{ fontSize: '1.15rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: '1.6', maxWidth: '600px' }}>
                    Esta aplicación está diseñada exclusivamente para profesionales de Higiene y Seguridad.
                    Olvídate de perder horas redactando informes. Genera relevamientos de riesgos, constancias de carga de fuego, matrices, reportes fotográficos y más en segundos, desde cualquier lugar.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {[
                        { icon: <ShieldCheck />, title: 'Informes Instantáneos', desc: 'Genera PDFs profesionales con tu logo y firma listos para enviar al cliente.' },
                        { icon: <CreditCard />, title: 'Todo en un solo lugar', desc: 'Gestiona historiales, inspecciones, ATS y cálculos ergonómicos centralizados.' },
                        { icon: <Lock />, title: '100% Confidencial', desc: 'Tus datos y los de tus clientes están completamente seguros y cifrados.' },
                        { icon: <CheckCircle2 />, title: 'Actualizaciones', desc: 'Soporte para nuevas normativas y herramientas constantemente añadidas.' }
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>{item.icon}</div>
                            <div>
                                <div style={{ fontWeight: '700', marginBottom: '0.25rem', fontSize: '1rem' }}>{item.title}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Card */}
            <div className="pricing-card" style={{
                background: 'var(--color-surface)',
                borderRadius: '40px',
                padding: '3rem',
                border: '1px solid var(--color-border)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
                textAlign: 'center',
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    color: 'white',
                    padding: '0.5rem 2rem',
                    borderRadius: '50px',
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    boxShadow: '0 10px 20px rgba(59, 130, 246, 0.4)',
                    whiteSpace: 'nowrap'
                }}>
                    SUSCRIPCIÓN MENSUAL PRO
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', margin: '3rem 0 1rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '800', marginRight: '0.5rem' }}>$</span>
                    <span style={{ fontSize: '5rem', fontWeight: '900', letterSpacing: '-2px' }}>5.00</span>
                    <span style={{ fontSize: '1.5rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>USD / MES</span>
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
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? 'Generando link...' : 'Pagar con Mercado Pago'}
                    </button>

                </div>

                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    Pagos 100% seguros y encriptados. Activación instantánea.
                </p>
            </div>
        </div>
    );
}
