
import React from 'react';
import { 
  Shield, Zap, CheckCircle2, Star, 
  Users, BarChart3, Globe, Sparkles,
  ArrowRight
} from 'lucide-react';

const testimonials = [
  {
    name: "Lic. Carlos Méndez",
    role: "Especialista en H&S - Argentina",
    content: "Asistente HYS transformó mi flujo de trabajo. Generar un ATS que antes me tomaba 20 minutos ahora me lleva 2 gracias a la IA.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos"
  },
  {
    name: "Ing. Lucía Rojas",
    role: "Gestión de Riesgos - Chile",
    content: "La precisión en los cálculos de Carga de Fuego y el cumplimiento con el DS 594 es impecable. Una herramienta indispensable.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia"
  },
  {
    name: "Téc. Roberto Silva",
    role: "Inspector de Obra - Uruguay",
    content: "Poder usar la Cámara IA para detectar EPP en tiempo real es el futuro de la prevención. Mis reportes son mucho más profesionales.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto"
  }
];

const valueProps = [
  {
    icon: <Zap size={24} />,
    title: "Velocidad con IA",
    desc: "Redactá conclusiones técnicas y descripciones de riesgo en segundos con inteligencia artificial especializada."
  },
  {
    icon: <Shield size={24} />,
    title: "Cumplimiento Legal",
    desc: "Validado para normativas de Argentina, Chile, Bolivia, Paraguay y Uruguay. Siempre actualizado."
  },
  {
    icon: <BarChart3 size={24} />,
    title: "Métricas Reales",
    desc: "Visualizá el desempeño de seguridad de tus proyectos con dashboards dinámicos y reportes ejecutivos."
  },
  {
    icon: <Globe size={24} />,
    title: "Acceso Universal",
    desc: "Usalo desde tu PC, Tablet o descarga la App. Funciona 100% offline en zonas sin cobertura."
  }
];

export default function MarketingLanding({ onStart }) {
  return (
    <div style={{ color: 'var(--color-text)' }}>
      {/* Social Proof Stats */}
      <section className="stagger-item" style={{ 
        padding: '4rem 1rem', 
        background: 'rgba(59, 130, 246, 0.03)',
        borderRadius: '32px',
        margin: '2rem 1rem',
        border: '1px solid rgba(59, 130, 246, 0.1)',
        animationDelay: '0.1s'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
            La plataforma #1 para Profesionales de H&S
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            Únete a más de 1,200 colegas que ya digitalizaron su gestión de seguridad.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '2rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {valueProps.map((prop, i) => (
            <div key={i} style={{ 
              padding: '2rem', 
              background: 'var(--color-surface)', 
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
              transition: 'transform 0.3s ease'
            }} className="hover-lift">
              <div style={{ 
                width: '48px', height: '48px', 
                borderRadius: '12px', 
                background: 'var(--color-primary-light, rgba(59, 130, 246, 0.1))',
                color: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                {prop.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.8rem' }}>{prop.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{prop.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="stagger-item" style={{ padding: '4rem 1rem', textAlign: 'center', animationDelay: '0.3s' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '3rem' }}>Tu reporte listo en 3 simples pasos</h2>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: '3rem',
          position: 'relative'
        }}>
          {[
            { step: "01", title: "Carga de Datos", desc: "Ingresá la información del sector o tarea." },
            { step: "02", title: "Procesamiento IA", desc: "Nuestra IA analiza riesgos y propone controles." },
            { step: "03", title: "Exportación", desc: "Descargá PDF profesional firmado digitalmente." }
          ].map((s, i) => (
            <div key={i} style={{ maxWidth: '200px', position: 'relative' }}>
              <div style={{ 
                fontSize: '3rem', 
                fontWeight: 900, 
                opacity: 0.1, 
                marginBottom: '-1.5rem',
                color: 'var(--color-primary)'
              }}>{s.step}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="stagger-item" style={{ padding: '4rem 1rem', animationDelay: '0.5s' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, textAlign: 'center', marginBottom: '3rem' }}>
          Lo que dicen los expertos
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem',
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{ 
              padding: '2rem', 
              background: 'var(--color-surface)', 
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', color: '#f59e0b', gap: '2px' }}>
                <Star size={14} fill="#f59e0b" />
                <Star size={14} fill="#f59e0b" />
                <Star size={14} fill="#f59e0b" />
                <Star size={14} fill="#f59e0b" />
                <Star size={14} fill="#f59e0b" />
              </div>
              <p style={{ fontSize: '0.95rem', fontStyle: 'italic', lineHeight: 1.6 }}>"{t.content}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: 'auto' }}>
                <img src={t.avatar} alt={t.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{t.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="stagger-item" style={{ 
        padding: '5rem 1rem', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
        color: 'white',
        borderRadius: '32px',
        margin: '4rem 1rem',
        animationDelay: '0.7s'
      }}>
        <Sparkles size={48} style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Empezá hoy mismo gratis</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2.5rem', opacity: 0.9 }}>
          Unite a la comunidad de profesionales que lideran la prevención con tecnología.
        </p>
        <button 
          onClick={onStart}
          style={{ 
            padding: '1.2rem 3rem', 
            borderRadius: '100px', 
            border: 'none', 
            background: 'white', 
            color: 'var(--color-primary)', 
            fontWeight: 800, 
            fontSize: '1.1rem',
            cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.8rem'
          }}
          className="hover-lift"
        >
          Crear mi cuenta <ArrowRight size={20} />
        </button>
      </section>
    </div>
  );
}
