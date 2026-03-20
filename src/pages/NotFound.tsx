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
    { label: '📸 Cámara IA', path: '/ai-camera' },
  ];

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
    }}>
      {/* Big animated 404 */}
      <div style={{
        fontSize: 'clamp(5rem, 20vw, 9rem)',
        fontWeight: 900,
        lineHeight: 1,
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb, #0ea5e9)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '1rem',
        letterSpacing: '-4px',
        animation: 'pulse 2.5s ease-in-out infinite',
      }}>
        404
      </div>

      <div style={{
        width: '80px', height: '80px',
        background: 'rgba(37,99,235,0.08)',
        borderRadius: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
      }}>
        <Search size={36} color="#2563eb" />
      </div>

      <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.6rem', color: 'var(--color-text)' }}>
        Página no encontrada
      </h1>
      <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', maxWidth: '380px', lineHeight: 1.6, margin: '0 0 2rem' }}>
        La página que buscás no existe o fue movida. Usá el botón de abajo para volver al inicio.
      </p>

      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.8rem 1.4rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer',
            color: 'var(--color-text)',
          }}
        >
          <ArrowLeft size={18} /> Volver
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.8rem 1.4rem',
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer',
            color: '#ffffff',
            boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
          }}
        >
          <Home size={18} /> Ir al Inicio
        </button>
      </div>

      {/* Helpful links */}
      <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, margin: 0 }}>
          Accesos rápidos:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
          {quickLinks.map((link, i) => (
            <button
              key={i}
              onClick={() => navigate(link.path)}
              style={{
                padding: '0.4rem 0.9rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--color-text)',
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
