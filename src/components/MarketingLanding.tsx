
import React from 'react';
import {
  Shield, Zap, CheckCircle2,
  Users, BarChart3, Globe, Sparkles,
  ArrowRight } from
'lucide-react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';


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
}];



interface MarketingLandingProps {
  onStart: () => void;
}

export default function MarketingLanding({ onStart }: MarketingLandingProps) {
  useIntersectionObserver();

  return (
    <div className="text-[var(--color-text)] max-w-[1200px] m-[0_auto] p-[0_1rem] relative">
      <div className="mesh-bg-1" />
      <div className="mesh-bg-2" />
      {/* 0. Trusted By Marquee */}
      <section className="stagger-item p-[2rem_0] mt-[2rem] border-bottom-[1px_solid_var(--color-border)]">
        <p className="text-center text-[0.85rem] font-[800] uppercase letter-spacing-[1px] text-[var(--color-text-muted)] mb-[1.5rem]">
          La tecnología elegida por miles de profesionales en
        </p>
        
        <div className="marquee-container m-[0_auto] max-w-[1000px]">
          <div className="marquee-content gap-[3rem]">
            {['🏢 Constructoras', '🏗️ Proyectos Mineros', '🏭 Industria Manufacturera', '👔 Consultores H&S', '🦺 Servicios Especializados', '🚚 Empresas de Logística', '⚡ Sector Energético', '🚜 Agroindustria'].map((tag, i) =>
            <span key={i} className="text-[1.05rem] font-[700] text-[var(--color-text)] opacity-[0.8] white-space-[nowrap] flex items-center gap-[0.5rem] p-[0.5rem_1rem] bg-[rgba(255,255,255,0.03)] rounded-[100px] border-[1px_solid_var(--color-border)]">












              
                {tag}
              </span>
            )}
          </div>
          {/* Duplicate for seamless looping */}
          <div className="marquee-content gap-[3rem]">
            {['🏢 Constructoras', '🏗️ Proyectos Mineros', '🏭 Industria Manufacturera', '👔 Consultores H&S', '🦺 Servicios Especializados', '🚚 Empresas de Logística', '⚡ Sector Energético', '🚜 Agroindustria'].map((tag, i) =>
            <span key={i} className="text-[1.05rem] font-[700] text-[var(--color-text)] opacity-[0.8] white-space-[nowrap] flex items-center gap-[0.5rem] p-[0.5rem_1rem] bg-[rgba(255,255,255,0.03)] rounded-[100px] border-[1px_solid_var(--color-border)]">












              
                {tag}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 1. Value Props - Premium Cards */}
      <section className="stagger-item p-[6rem_0_3rem]">
        <div className="text-center mb-[4rem]">
          <h2 className="text-[clamp(2rem,_5vw,_2.5rem)] font-[900] mb-[1rem] font-family-[var(--font-heading)]">
            ¿Por qué elegir Asistente HYS?
          </h2>
          <p className="text-[var(--color-text-muted)] text-[1.15rem] max-w-[650px] m-[0_auto] line-height-[1.6]">
            Nuestra IA está entrenada específicamente con la legislación vigente para darte resultados técnicos, precisos y listos para presentar.
          </p>
        </div>

        <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(260px,_1fr))] gap-[2rem]">
          {valueProps.map((prop, i) =>
          <div key={i} className="glass-card-premium stagger-up p-[2.5rem_2rem] transition-[all_0.4s_cubic-bezier(0.16,_1,_0.3,_1)] relative overflow-[hidden]">




            
              <div className="absolute top-[0] left-[0] w-[100%] h-[4px] bg-[var(--gradient-premium)]" />
              <div className="w-[60px] h-[60px] rounded-[16px] bg-[rgba(59,_130,_246,_0.1)] border-[1px_solid_rgba(59,_130,_246,_0.2)] text-[var(--color-primary)] flex items-center justify-center mb-[1.5rem] box-shadow-[0_10px_25px_rgba(59,_130,_246,_0.15)]">







              
                {prop.icon}
              </div>
              <h3 className="text-[1.25rem] font-[800] mb-[1rem] text-[var(--color-text)]">{prop.title}</h3>
              <p className="text-[0.95rem] text-[var(--color-text-muted)] line-height-[1.6]">{prop.desc}</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. How it Works - Timeline */}
      <section className="stagger-item p-[5rem_0_3rem]">
        <div className="text-center mb-[4rem]">
          <h2 className="text-[clamp(2rem,_5vw,_2.5rem)] font-[900] mb-[1rem] font-family-[var(--font-heading)]">
            Tu reporte listo en 3 simples pasos
          </h2>
        </div>
        <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(280px,_1fr))] gap-[2.5rem] relative">


          
          {[
          { step: "01", title: "Carga de Datos", desc: "Ingresá la información visual o textual del sector, tarea o riesgo a evaluar." },
          { step: "02", title: "Procesamiento IA", desc: "Nuestra inteligencia artificial cruza los datos con normativas de H&S y propone controles." },
          { step: "03", title: "Exportación Profesional", desc: "Descargá un PDF ejecutivo con tu logo, listo para firmar y presentar al cliente." }].
          map((s, i) =>
          <div key={i} className="glass-card-premium stagger-up p-[2.5rem] relative">

            
              <div className="absolute top-[-20px] left-[2.5rem] w-[40px] h-[40px] rounded-[50%] bg-[var(--gradient-premium)] text-[white] flex items-center justify-center font-[900] text-[1.1rem] box-shadow-[0_10px_20px_rgba(59,_130,_246,_0.3)]">





              {s.step}</div>
              <h3 className="text-[1.3rem] font-[800] mt-[1rem] mb-[1rem]">{s.title}</h3>
              <p className="text-[var(--color-text-muted)] line-height-[1.6] text-[0.95rem]">{s.desc}</p>
            </div>
          )}
        </div>
      </section>


      {/* 4. Plans / Pricing */}
      <section className="stagger-item p-[5rem_0_3rem]">
        <div className="text-center mb-[3rem]">
          <div className="display-[inline-flex] items-center gap-[0.5rem] p-[0.4rem_1rem] bg-[rgba(59,130,246,0.1)] border-[1px_solid_rgba(59,130,246,0.2)] rounded-[100px] mb-[1.5rem]">
            <Sparkles size={14} color="#60a5fa" />
            <span className="text-[#60a5fa] text-[0.8rem] font-[800] letter-spacing-[1px] uppercase">Dos opciones, sin sorpresas</span>
          </div>
          <h2 className="text-[clamp(2rem,_5vw,_2.5rem)] font-[900] mb-[1rem] font-family-[var(--font-heading)]">
            Elegí tu plan
          </h2>
          <p className="text-[var(--color-text-muted)] text-[1.1rem] max-w-[560px] m-[0_auto] line-height-[1.6]">
            Empezá gratis y pasá a PRO cuando lo necesites. Sin permanencia ni cargos ocultos.
          </p>
        </div>

        <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(300px,_1fr))] gap-[2rem] max-w-[860px] m-[0_auto]">

          {/* FREE CARD */}
          <div className="glass-card rounded-[28px] p-[2.5rem_2rem] border-[1px_solid_var(--color-border)] flex flex-col gap-[1.5rem] relative">





            
            <div>
              <div className="text-[0.8rem] font-[800] uppercase letter-spacing-[1px] text-[var(--color-text-muted)] mb-[0.8rem]">Plan Gratuito</div>
              <div className="flex items-baseline gap-[0.4rem] mb-[0.5rem]">
                <span className="text-[3rem] font-[900] text-[var(--color-text)] line-height-[1]">USD $0</span>
                <span className="text-[var(--color-text-muted)] text-[0.9rem]">/ siempre</span>
              </div>
              <p className="text-[var(--color-text-muted)] text-[0.9rem] line-height-[1.5] m-[0]">
                Todo lo que necesitás para empezar a trabajar de forma profesional.
              </p>
            </div>

            <div className="border-top-[1px_solid_var(--color-border)] pt-[1.5rem] flex flex-col gap-[0.9rem] flex-[1]">
              {[
              { label: 'Uso Ilimitado y Gratuito', desc: 'Cargá datos y generá registros sin pagar nunca' },
              { label: 'Todos los Módulos Base', desc: 'ATS, Matrices, Carga de Fuego y Checklists' },
              { label: 'Cámara IA On-Screen', desc: 'Vigilancia de riesgos y EPP en tiempo real' },
              { label: 'Asesor IA (Básico)', desc: 'Resolución de dudas normativas al instante' },
              { label: 'Visualización de Reportes', desc: 'Ver reportes completos en pantalla' },
              { label: 'Guardado en Historial Local', desc: 'Tus registros se guardan en tu dispositivo' }].
              map((f, i) =>
              <div key={i} className="flex gap-[0.8rem] items-start">
                  <CheckCircle2 size={17} color="#10b981" className="mt-[2px] flex-shrink-[0]" />
                  <div>
                    <div className="text-[0.9rem] font-[700] text-[var(--color-text)]">{f.label}</div>
                    <div className="text-[0.78rem] text-[var(--color-text-muted)] line-height-[1.4]">{f.desc}</div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onStart}







              onMouseOver={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.08)';}}
              onMouseOut={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.04)';}} className="w-[100%] p-[1rem] rounded-[14px] border-[1px_solid_var(--color-border)] bg-[rgba(255,255,255,0.04)] text-[var(--color-text)] font-[800] text-[1rem] cursor-pointer transition-[all_0.2s]">
              
              Crear cuenta gratis
            </button>
          </div>

          {/* PRO CARD */}
          <div className="rounded-[28px] p-[2.5rem_2rem] bg-[var(--gradient-premium)] border-[1px_solid_rgba(99,102,241,0.4)] flex flex-col gap-[1.5rem] relative overflow-[hidden] box-shadow-[0_30px_60px_rgba(59,_130,_246,_0.25)]">








            
            {/* Glow spots */}
            <div className="absolute top-[-40%] right-[-20%] w-[350px] h-[350px] bg-[radial-gradient(circle,_rgba(255,255,255,0.12)_0%,_transparent_70%)] pointer-events-[none]" />

            {/* Popular badge */}
            <div className="absolute top-[1.5rem] right-[1.5rem] bg-[rgba(251,191,36,0.2)] border-[1px_solid_rgba(251,191,36,0.4)] text-[#fbbf24] p-[0.25rem_0.8rem] rounded-[100px] text-[0.72rem] font-[800] letter-spacing-[1px] uppercase">




              
              Más popular ✦
            </div>

            <div className="relative z-[1]">
              <div className="text-[0.8rem] font-[800] uppercase letter-spacing-[1px] text-[rgba(255,255,255,0.6)] mb-[0.8rem]">Plan PRO</div>
              <div className="flex items-baseline gap-[0.4rem] mb-[0.5rem]">
                <span className="text-[3rem] font-[900] text-[white] line-height-[1]">USD $2</span>
                <span className="text-[rgba(255,255,255,0.6)] text-[0.9rem]">/ mes</span>
              </div>
              <p className="text-[rgba(255,255,255,0.75)] text-[0.9rem] line-height-[1.5] m-[0]">
                Todo del plan gratuito, más historial en nube, PDF profesionales y herramientas avanzadas.
              </p>
            </div>

            <div className="border-top-[1px_solid_rgba(255,255,255,0.15)] pt-[1.5rem] flex flex-col gap-[0.9rem] flex-[1] relative z-[1]">
              {[
              { label: 'Exportación a PDF Profesional', desc: 'Documentos listos con tu logo para el cliente' },
              { label: 'Compartir por WhatsApp y QR', desc: 'Envío instantáneo de registros para firmas' },
              { label: 'Sincronización en la Nube', desc: 'Recuperá tus datos desde cualquier dispositivo' },
              { label: 'Exportación a Excel / CSV', desc: 'Generación de planillas de historial rápidas' },
              { label: 'Módulos Críticos y Gestión', desc: 'LOTO, Altura, CAPA, Auditorías y Accidentes' },
              { label: 'Capacitación y Charlas', desc: 'Registro de firmas y actas de instrucción' },
              { label: 'KPIs y Estadísticas PRO', desc: 'Dashboards avanzados de seguridad (LFITR/TRIFR)' },
              { label: 'Asesor IA Premium', desc: 'Sin límites de consultas técnicas de seguridad' }].
              map((f, i) =>
              <div key={i} className="flex gap-[0.8rem] items-start">
                  <CheckCircle2 size={17} color="#86efac" className="mt-[2px] flex-shrink-[0]" />
                  <div>
                    <div className="text-[0.9rem] font-[700] text-[white]">{f.label}</div>
                    <div className="text-[0.78rem] text-[rgba(255,255,255,0.6)] line-height-[1.4]">{f.desc}</div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onStart}
              className="hover-lift w-[100%] p-[1rem] rounded-[14px] border-none bg-[white] text-[#1e3a8a] font-[900] text-[1rem] cursor-pointer box-shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-[all_0.2s] relative z-[1] flex items-center justify-center gap-[0.6rem]">









              
              <Sparkles size={18} /> Crear cuenta y ver planes PRO
            </button>
          </div>
        </div>
      </section>

      {/* 5. Massive CTA Banner */}
      <section className="stagger-item p-[6rem_2rem] text-center text-[white] rounded-[32px] m-[2rem_0_6rem] relative overflow-[hidden]">







        
        {/* Animated gradient background */}
        <div className="absolute inset-[0] bg-[linear-gradient(135deg,_#1e3a8a_0%,_#3b82f6_25%,_#8b5cf6_50%,_#3b82f6_75%,_#1e40af_100%)] background-size-[300%_300%] animation-[gradient-shift_8s_ease_infinite] rounded-[32px]" />






        
        {/* Glow orbs */}
        <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(255,255,255,0.12)_0%,_transparent_70%)] pointer-events-[none] z-[1]" />
        <div className="absolute bottom-[-20%] right-[-5%] w-[400px] h-[400px] bg-[radial-gradient(circle,_rgba(16,185,129,0.2)_0%,_transparent_70%)] pointer-events-[none] z-[1]" />
        {/* Particle dots */}
        {[...Array(6)].map((_, i) =>
        <div key={i} style={{

          width: `${6 + i * 3}px`,
          height: `${6 + i * 3}px`,


          top: `${15 + i * 12}%`,
          left: `${10 + i * 14}%`,
          animation: `particle-float ${3 + i * 0.8}s ease-in-out infinite`,
          animationDelay: `${i * 0.5}s`


        }} className="absolute rounded-[50%] bg-[rgba(255,255,255,0.15)] pointer-events-[none] z-[1]" />
        )}
        
        <div className="relative z-[2]">
          <div className="display-[inline-flex] items-center gap-[0.5rem] p-[0.4rem_1rem] bg-[rgba(255,255,255,0.15)] border-[1px_solid_rgba(255,255,255,0.25)] rounded-[100px] mb-[2rem]">








            
            <span className="w-[6px] h-[6px] rounded-[50%] bg-[#34d399] inline-block animation-[pulse-soft_2s_ease_infinite]" />
            <span className="text-[rgba(255,255,255,0.9)] text-[0.8rem] font-[700]">
              Más de 50 profesionales se registraron esta semana
            </span>
          </div>

          <Sparkles size={48} className="mb-[1.5rem] opacity-[0.9] text-[#fcd34d]" />
          <h2 className="text-[clamp(2.2rem,_5vw,_3.5rem)] font-[900] mb-[1.5rem] font-family-[var(--font-heading)]">
            Llevá tu gestión al próximo nivel
          </h2>
          <p className="text-[1.2rem] mb-[3rem] opacity-[0.9] max-w-[600px] m-[0_auto_3rem] line-height-[1.6]">
            Miles de profesionales ya están ahorrando horas de trabajo diario. Creá tu cuenta gratuita y comprobá el poder de la IA.
          </p>
          <button
            onClick={onStart}
            className="hover-lift btn-shimmer p-[1.4rem_3.5rem] rounded-[100px] border-none bg-[white] text-[#1e3a8a] font-[900] text-[1.2rem] cursor-pointer box-shadow-[0_20px_40px_rgba(0,0,0,0.25)] display-[inline-flex] items-center gap-[1rem] transition-[all_0.3s_ease] relative overflow-[hidden]">

















            
            Crear mi cuenta gratis <ArrowRight size={22} />
          </button>
          <p className="mt-[1.5rem] opacity-[0.6] text-[0.85rem]">
            Sin tarjeta de crédito · Sin contratos · Sin cargos ocultos
          </p>
        </div>
      </section>

    </div>);

}