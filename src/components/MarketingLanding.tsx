
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
    <div style={{ color: 'var(--color-text)', maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
      
      {/* 1. Value Props - Premium Cards */}
      <section className="stagger-item" style={{ padding: '6rem 0 3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 900, marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            ¿Por qué elegir Asistente HYS?
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.15rem', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>
            Nuestra IA está entrenada específicamente con la legislación vigente para darte resultados técnicos, precisos y listos para presentar.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          {valueProps.map((prop, i) => (
            <div key={i} className="glass-card hover-lift" style={{ 
              padding: '2.5rem 2rem', 
              borderRadius: '24px',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--gradient-premium)' }} />
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '16px', 
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                color: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.15)'
              }}>
                {prop.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-text)' }}>{prop.title}</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{prop.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. How it Works - Timeline */}
      <section className="stagger-item" style={{ padding: '5rem 0 3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 900, marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            Tu reporte listo en 3 simples pasos
          </h2>
        </div>
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2.5rem', position: 'relative' 
        }}>
          {[
            { step: "01", title: "Carga de Datos", desc: "Ingresá la información visual o textual del sector, tarea o riesgo a evaluar." },
            { step: "02", title: "Procesamiento IA", desc: "Nuestra inteligencia artificial cruza los datos con normativas de H&S y propone controles." },
            { step: "03", title: "Exportación Profesional", desc: "Descargá un PDF ejecutivo con tu logo, listo para firmar y presentar al cliente." }
          ].map((s, i) => (
            <div key={i} className="hover-lift" style={{ 
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '24px', padding: '2.5rem', position: 'relative' 
            }}>
              <div style={{ 
                position: 'absolute', top: '-20px', left: '2.5rem',
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--gradient-premium)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)'
              }}>{s.step}</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '1rem', marginBottom: '1rem' }}>{s.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Social Proof & Testimonials */}
      <section className="stagger-item" style={{ padding: '5rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
           <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 900, marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            Lo que dicen los expertos
          </h2>
        </div>
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem'
        }}>
          {testimonials.map((t, i) => (
            <div key={i} className="glass-card hover-lift" style={{ 
              padding: '2.5rem', 
              borderRadius: '24px',
              display: 'flex', flexDirection: 'column', gap: '1.5rem',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ display: 'flex', color: '#f59e0b', gap: '4px' }}>
                <Star size={18} fill="#f59e0b" />
                <Star size={18} fill="#f59e0b" />
                <Star size={18} fill="#f59e0b" />
                <Star size={18} fill="#f59e0b" />
                <Star size={18} fill="#f59e0b" />
              </div>
              <p style={{ fontSize: '1.05rem', fontStyle: 'italic', lineHeight: 1.7, color: 'var(--color-text)', flex: 1 }}>
                "{t.content}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <img src={t.avatar} alt={t.name} style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)' }} />
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{t.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Plans / Pricing */}
      <section className="stagger-item" style={{ padding: '5rem 0 3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '100px', marginBottom: '1.5rem' }}>
            <Sparkles size={14} color="#60a5fa" />
            <span style={{ color: '#60a5fa', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>Dos opciones, sin sorpresas</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 900, marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            Elegí tu plan
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
            Empezá gratis y pasá a PRO cuando lo necesites. Sin permanencia ni cargos ocultos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '860px', margin: '0 auto' }}>

          {/* FREE CARD */}
          <div className="glass-card" style={{
            borderRadius: '28px',
            padding: '2.5rem 2rem',
            border: '1px solid var(--color-border)',
            display: 'flex', flexDirection: 'column', gap: '1.5rem',
            position: 'relative'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: '0.8rem' }}>Plan Gratuito</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>USD $0</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>/ siempre</span>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                Todo lo que necesitás para empezar a trabajar de forma profesional.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', flex: 1 }}>
              {[
                { label: 'ATS · Análisis de Trabajo Seguro', desc: 'Generá ATS completos con asistencia de IA' },
                { label: 'Matrices de Riesgo', desc: 'Evaluación de riesgos Probabilidad × Consecuencia' },
                { label: 'Carga de Fuego', desc: 'Cálculo normativo para Argentina, Chile y más' },
                { label: 'Checklists de Herramientas', desc: 'Inspección de equipos y EPP' },
                { label: 'Ergonomía y Estrés Térmico', desc: 'Módulos de evaluación específicos' },
                { label: 'Asesor IA', desc: 'Consultas de H&S asistidas por inteligencia artificial' },
                { label: 'Cámara IA · Detección EPP', desc: 'Detección en tiempo real vía cámara' },
                { label: 'Administración local', desc: 'Datos guardados en tu dispositivo' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={17} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>{f.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              style={{
                width: '100%', padding: '1rem', borderRadius: '14px',
                border: '1px solid var(--color-border)',
                background: 'rgba(255,255,255,0.04)', color: 'var(--color-text)',
                fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              Crear cuenta gratis
            </button>
          </div>

          {/* PRO CARD */}
          <div style={{
            borderRadius: '28px',
            padding: '2.5rem 2rem',
            background: 'var(--gradient-premium)',
            border: '1px solid rgba(99,102,241,0.4)',
            display: 'flex', flexDirection: 'column', gap: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 30px 60px rgba(59, 130, 246, 0.25)'
          }}>
            {/* Glow spots */}
            <div style={{ position: 'absolute', top: '-40%', right: '-20%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Popular badge */}
            <div style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)',
              color: '#fbbf24', padding: '0.25rem 0.8rem', borderRadius: '100px',
              fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase'
            }}>
              Más popular ✦
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.6)', marginBottom: '0.8rem' }}>Plan PRO</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>USD $2</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>/ mes</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                Todo del plan gratuito, más historial en nube, PDF profesionales y herramientas avanzadas.
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', flex: 1, position: 'relative', zIndex: 1 }}>
              {[
                { label: 'Todo el plan gratuito incluido', desc: 'Acceso completo a todos los módulos base' },
                { label: 'Exportación PDF profesional', desc: 'PDFs con tu logo listos para presentar al cliente' },
                { label: 'Historial en la nube', desc: 'Sincronizá y accedé a tus registros desde cualquier dispositivo' },
                { label: 'Permisos de Trabajo Críticos', desc: 'Espacios confinados, trabajo en altura, LOTO' },
                { label: 'Auditorías y CAPA', desc: 'Gestión de no conformidades y acciones correctivas' },
                { label: 'Investigación de Accidentes', desc: 'Árbol de causas y árbol de fallas integrado' },
                { label: 'Seguridad Química (SGA)', desc: 'Fichas de sustancias peligrosas y gestión de riesgos' },
                { label: 'Simulacros y Capacitaciones', desc: 'Actas firmadas, listas de asistencia y planificación' },
                { label: 'Control EPP y Matafuegos', desc: 'Alertas de vencimientos y auditoría de equipos' },
                { label: 'Asesor IA ilimitado', desc: 'Sin restricciones de consultas de seguridad' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={17} color="#86efac" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{f.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              className="hover-lift"
              style={{
                width: '100%', padding: '1rem', borderRadius: '14px',
                border: 'none',
                background: 'white', color: '#1e3a8a',
                fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transition: 'all 0.2s', position: 'relative', zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem'
              }}
            >
              <Sparkles size={18} /> Crear cuenta y ver planes PRO
            </button>
          </div>
        </div>
      </section>

      {/* 5. Massive CTA Banner */}
      <section className="stagger-item" style={{ 
        padding: '6rem 2rem', 
        textAlign: 'center',
        background: 'var(--gradient-premium)',
        color: 'white',
        borderRadius: '32px',
        margin: '2rem 0 6rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 30px 60px rgba(59, 130, 246, 0.3)'
      }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Sparkles size={48} style={{ marginBottom: '1.5rem', opacity: 0.9, color: '#fcd34d' }} />
          <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
            Llevá tu gestión al próximo nivel
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '3rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
            Miles de profesionales ya están ahorrando horas de trabajo diario. Creá tu cuenta gratuita y comprobá el poder de la IA.
          </p>
          <button 
            onClick={onStart}
            className="hover-lift"
            style={{ 
              padding: '1.4rem 3.5rem', 
              borderRadius: '100px', 
              border: 'none', 
              background: 'white', 
              color: 'var(--color-primary-dark)', 
              fontWeight: 900, 
              fontSize: '1.2rem',
              cursor: 'pointer',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all 0.3s ease'
            }}
          >
            Crear mi cuenta gratis <ArrowRight size={22} />
          </button>
        </div>
      </section>
    </div>
  );
}
