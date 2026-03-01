import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Home, ExternalLink } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{
            marginTop: 'auto',
            padding: '3rem 1.5rem 2rem',
            background: 'rgba(15, 23, 42, 0.02)',
            borderTop: '1px solid var(--color-border)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2.5rem',
                marginBottom: '3rem'
            }}>
                {/* Brand & Mission */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text)', letterSpacing: '-0.5px' }}>Asistente H&S</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                        Potenciando la labor de los profesionales de Higiene y Seguridad con herramientas inteligentes y cálculos normativos precisos.
                    </p>
                </div>

                {/* Quick Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>Accesos Rápidos</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Home size={14} /> Inicio
                        </Link>
                        <Link to="/privacy" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={14} /> Privacidad
                        </Link>
                        <a href="mailto:asistente.hs.soporte@gmail.com" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={14} /> Soporte Técnico
                        </a>
                    </div>
                </div>

                {/* Legal & Standards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>Marco Legal</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                        Basado en Ley 19.587, Dec. 351/79 y normativas SRT vigentes en la República Argentina.
                    </p>
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={{
                maxWidth: '1200px',
                margin: '2rem auto 0',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'center',
                textAlign: 'center'
            }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    © {currentYear} Asistente H&S - Todos los derechos reservados.
                </p>
            </div>
        </footer>
    );
}
