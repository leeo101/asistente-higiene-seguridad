
import React from 'react';
import { 
  ArrowLeft, Sparkles, CheckCircle2, 
  Lock, ArrowRight, Star,
  MessageSquare, FileText, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const moduleData = {
  '/ats': {
    title: "Análisis de Trabajo Seguro (ATS)",
    subtitle: "IA para la prevención en tiempo real",
    icon: <FileText size={40} />,
    color: "#10b981",
    features: [
      "Generación de pasos y riesgos con IA",
      "Medidas de control automáticas",
      "Firma digital y sellos profesionales",
      "Exportación a PDF con logo personalizado"
    ],
    ideas: [
      "Trabajos en altura y andamios",
      "Excavaciones y movimiento de suelos",
      "Soldadura y trabajos en caliente",
      "Izamiento de cargas críticas"
    ]
  },
  '/fire-load': {
    title: "Carga de Fuego",
    subtitle: "Cálculos precisos según normativa",
    icon: <Zap size={40} />,
    color: "#f97316",
    features: [
      "Inventario dinámico de materiales",
      "Cálculo automático de RF y matafuegos",
      "Validado por Dec. 351/79 y DS 594",
      "Redacción de conclusiones con IA"
    ],
    ideas: [
      "Depósitos de logística",
      "Plantas industriales",
      "Locales comerciales",
      "Oficinas administrativas"
    ]
  },
  '/ai-advisor': {
    title: "Asesor IA Legal",
    subtitle: "Tu biblioteca normativa 24/7",
    icon: <Sparkles size={40} />,
    color: "#a855f7",
    features: [
      "Consultas legales instantáneas",
      "Respuestas basadas en leyes locales",
      "Historial de consultas guardado",
      "Asesoría en EPP y protocolos"
    ],
    ideas: [
      "Dudas sobre entrega de EPP",
      "Requisitos de capacitación SRT",
      "Normativa de ruido y vibraciones",
      "Límites de carga térmica"
    ]
  }
};

export default function ModulePreview({ path, onBack }) {
  const navigate = useNavigate();
  const data = moduleData[path] || {
    title: "Módulo Profesional",
    subtitle: "Herramientas avanzadas de H&S",
    icon: <Sparkles size={40} />,
    color: "var(--color-primary)",
    features: ["Próximamente más detalles"],
    ideas: ["Varios proyectos"]
  };

  const handleRegister = () => {
    navigate('/login', { state: { view: 'register' } });
  };

  return (
    <div className="page-transition" style={{ 
      minHeight: '100vh', 
      background: 'var(--color-background)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <button 
          onClick={onBack}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            background: 'none', border: 'none', color: 'var(--color-text-muted)',
            cursor: 'pointer', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: 600
          }}
        >
          <ArrowLeft size={18} /> Volver al Inicio
        </button>

        <div style={{ 
          background: 'var(--color-surface)',
          borderRadius: '32px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0,0,0,0.1)'
        }}>
          {/* Hero section */}
          <div style={{ 
            padding: '4rem 2rem', 
            background: `linear-gradient(135deg, ${data.color}20, ${data.color}05)`,
            textAlign: 'center',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <div style={{ 
              width: '80px', height: '80px', 
              borderRadius: '24px', 
              background: 'white', 
              color: data.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: `0 20px 40px ${data.color}30`
            }}>
              {data.icon}
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>{data.title}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>{data.subtitle}</p>
          </div>

          <div style={{ padding: '3rem 2rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '3rem' 
            }}>
              {/* Features */}
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Star size={20} color={data.color} fill={data.color} /> Beneficios Clave
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                      <CheckCircle2 size={18} style={{ color: '#10b981', marginTop: '3px' }} />
                      <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Ideas */}
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                   <Zap size={20} color={data.color} fill={data.color} /> Ideas de Proyectos
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                  {data.ideas.map((idea, i) => (
                    <span key={i} style={{ 
                      padding: '0.6rem 1rem', 
                      background: 'rgba(59,130,246,0.05)', 
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      border: '1px solid rgba(59,130,246,0.1)'
                    }}>
                      {idea}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Mock Preview / Illustration */}
            <div style={{ 
              marginTop: '4rem', 
              padding: '2rem', 
              background: 'var(--color-background)', 
              borderRadius: '24px', 
              textAlign: 'center',
              border: '2px dashed var(--color-border)',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)',
                borderRadius: '22px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 2
              }}>
                <Lock size={32} style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }} />
                <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>Función Profesional</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '280px' }}>
                  Regístrate gratis para acceder a esta herramienta y generar tus reportes.
                </p>
              </div>
              {/* Blurred content placeholder */}
              <div style={{ opacity: 0.3, userSelect: 'none' }}>
                <div style={{ height: '20px', width: '60%', background: '#ddd', borderRadius: '4px', margin: '0 auto 1rem' }}></div>
                <div style={{ height: '40px', width: '80%', background: '#eee', borderRadius: '8px', margin: '0 auto 1.5rem' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ height: '100px', background: '#f5f5f5', borderRadius: '12px' }}></div>
                  <div style={{ height: '100px', background: '#f5f5f5', borderRadius: '12px' }}></div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
              <button 
                onClick={handleRegister}
                style={{ 
                  padding: '1.2rem 3rem', 
                  borderRadius: '100px', 
                  border: 'none', 
                  background: data.color, 
                  color: 'white', 
                  fontWeight: 800, 
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  boxShadow: `0 20px 40px ${data.color}40`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.8rem'
                }}
                className="hover-lift"
              >
                Comenzar Ahora - Gratis <ArrowRight size={20} />
              </button>
              <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                ¿Ya tienes cuenta? <span 
                  onClick={() => navigate('/login')}
                  style={{ color: data.color, cursor: 'pointer', textDecoration: 'underline' }}
                >Ingresar</span>
              </p>
            </div>
          </div>
        </div>

        {/* Industry Comment */}
        <div style={{ 
          marginTop: '3rem', 
          padding: '2rem', 
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '24px',
          border: '1px solid var(--color-border)',
          fontStyle: 'italic',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center'
        }}>
          <MessageSquare size={32} style={{ color: data.color, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              "Como profesional, valoro mucho que el {data.title} se adapte a la ley 19.587. Me da seguridad técnica en cada auditoría."
            </p>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>
              — Lic. Pablo Guerrero, Consultor Senior EHS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
