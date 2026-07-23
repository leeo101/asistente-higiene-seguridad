
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
    title: "Informes en 30 Segundos",
    desc: "Redactá ATS, evaluaciones de riesgo e informes ejecutivos 10 veces más rápido con Inteligencia Artificial."
  },
  {
    icon: <Shield size={24} />,
    title: "100% Cumplimiento Legal",
    desc: "Validado para Ley 19.587, Dec 351/79, Resoluciones SRT e ISO 45001 en Argentina y LatAm."
  },
  {
    icon: <Globe size={24} />,
    title: "Funciona 100% Offline",
    desc: "Usalo en el campo, obra o planta sin necesidad de señal. Se sincroniza solo cuando volvés a tener red."
  },
  {
    icon: <BarChart3 size={24} />,
    title: "PDFs con TU LOGO",
    desc: "Generá documentos profesionales con la marca de tu consultora o empresa, listos para firmar y enviar."
  }
];

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
      <section className="stagger-item p-[1.5rem_0] mt-[1rem] border-b border-[var(--color-border)]">
        <p className="text-center text-[0.8rem] font-[800] uppercase letter-spacing-[1px] text-[var(--color-text-muted)] mb-[1rem]">
          Utilizado por profesionales en
        </p>
        
        <div className="marquee-container m-[0_auto] max-w-[1000px]">
          <div className="marquee-content gap-[2rem]">
            {['🏢 Constructoras', '🏗️ Obras & Minería', '🏭 Industria', '👔 Consultores H&S', '🦺 Servicios EHS', '🚚 Logística', '⚡ Energía', '🚜 Agroindustria'].map((tag, i) => (
              <span key={i} className="text-[0.95rem] font-[700] text-[var(--color-text)] opacity-[0.85] whitespace-nowrap flex items-center gap-[0.4rem] p-[0.4rem_0.8rem] bg-[rgba(255,255,255,0.04)] rounded-[100px] border border-[var(--color-border)]">
                {tag}
              </span>
            ))}
          </div>
          <div className="marquee-content gap-[2rem]">
            {['🏢 Constructoras', '🏗️ Obras & Minería', '🏭 Industria', '👔 Consultores H&S', '🦺 Servicios EHS', '🚚 Logística', '⚡ Energía', '🚜 Agroindustria'].map((tag, i) => (
              <span key={i} className="text-[0.95rem] font-[700] text-[var(--color-text)] opacity-[0.85] whitespace-nowrap flex items-center gap-[0.4rem] p-[0.4rem_0.8rem] bg-[rgba(255,255,255,0.04)] rounded-[100px] border border-[var(--color-border)]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 1. Value Props */}
      <section className="stagger-item p-[4rem_0_2rem]">
        <div className="text-center mb-[3rem]">
          <h2 className="text-[clamp(1.8rem,_4vw,_2.3rem)] font-[900] mb-[0.8rem] font-family-[var(--font-heading)]">
            Potenciá tu trabajo diario de HyS
          </h2>
          <p className="text-[var(--color-text-muted)] text-[1.05rem] max-w-[580px] m-[0_auto] line-height-[1.5]">
            Ahorrá horas de tipeo y documentación. Resultados técnicos impecables al instante.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1.2rem]">
          {valueProps.map((prop, i) => (
            <div key={i} className="glass-card-premium stagger-up p-[1.8rem_1.4rem] relative overflow-hidden transition-all hover:translate-y-[-2px]">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[var(--gradient-premium)]" />
              <div className="w-[48px] h-[48px] rounded-[14px] bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] text-[var(--color-primary)] flex items-center justify-center mb-[1.2rem] shadow-sm">
                {prop.icon}
              </div>
              <h3 className="text-[1.1rem] font-[800] mb-[0.6rem] text-[var(--color-text)]">{prop.title}</h3>
              <p className="text-[0.85rem] text-[var(--color-text-muted)] leading-relaxed">{prop.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. How it Works */}
      <section className="stagger-item p-[3.5rem_0_2rem]">
        <div className="text-center mb-[3rem]">
          <h2 className="text-[clamp(1.8rem,_4vw,_2.3rem)] font-[900] mb-[0.5rem] font-family-[var(--font-heading)]">
            Tu informe en 3 simples pasos
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1.5rem]">
          {[
            { step: "01", title: "Carga o Foto", desc: "Ingresá la tarea o sacá una foto con la Cámara IA." },
            { step: "02", title: "Diagnóstico IA", desc: "La IA analiza riesgos y genera controles normativos." },
            { step: "03", title: "PDF & Firma", desc: "Descargá el documento con tu logo listo para enviar." }
          ].map((s, i) => (
            <div key={i} className="glass-card-premium stagger-up p-[1.8rem] relative rounded-[20px]">
              <div className="absolute top-[-16px] left-[1.8rem] w-[34px] h-[34px] rounded-full bg-[var(--gradient-premium)] text-white flex items-center justify-center font-[900] text-[0.9rem] shadow-md">
                {s.step}
              </div>
              <h3 className="text-[1.15rem] font-[800] mt-[0.6rem] mb-[0.6rem]">{s.title}</h3>
              <p className="text-[var(--color-text-muted)] text-[0.85rem] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

       {/* 4. Plans / Pricing */}
      <section className="stagger-item p-[4rem_0_3rem]">
        <div className="text-center mb-[3rem]">
          <div className="display-[inline-flex] items-center gap-[0.5rem] p-[0.4rem_1rem] bg-[rgba(59,130,246,0.1)] border-[1px_solid_rgba(59,130,246,0.2)] rounded-[100px] mb-[1.5rem]">
            <Sparkles size={14} color="#60a5fa" />
            <span className="text-[#60a5fa] text-[0.8rem] font-[800] letter-spacing-[1px] uppercase">Planes a tu medida · Sin cargos ocultos</span>
          </div>
          <h2 className="text-[clamp(2rem,_5vw,_2.5rem)] font-[900] mb-[1rem] font-family-[var(--font-heading)]">
            Elegí tu plan y empezá hoy
          </h2>
          <p className="text-[var(--color-text-muted)] text-[1.1rem] max-w-[650px] m-[0_auto] line-height-[1.6]">
            Desde estudiantes hasta grandes consultoras de HyS. Cambiá o cancelá en cualquier momento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1.5rem] max-w-[1240px] m-[0_auto]">

          {/* PLAN 1: GRATUITO ($0) */}
          <div className="glass-card rounded-[24px] p-[2rem_1.5rem] border-[1px_solid_var(--color-border)] flex flex-col gap-[1.2rem] relative shadow-sm">
            <div>
              <div className="text-[0.75rem] font-[900] uppercase letter-spacing-[1px] text-[var(--color-text-muted)] mb-[0.5rem]">Plan 1: Gratuito</div>
              <div className="flex items-baseline gap-[0.3rem] mb-[0.4rem]">
                <span className="text-[2.5rem] font-[900] text-[var(--color-text)] leading-none">USD $0</span>
                <span className="text-[var(--color-text-muted)] text-[0.85rem]">/ siempre</span>
              </div>
              <p className="text-[var(--color-text-muted)] text-[0.82rem] line-height-[1.4] m-[0]">
                Ideal para explorar la herramienta y realizar inspecciones iniciales.
              </p>
            </div>

            <div className="border-t border-[var(--color-border)] pt-[1.2rem] flex flex-col gap-[0.75rem] flex-1">
              {[
                { label: 'Uso Ilimitado Base', desc: 'Cargá registros sin costo alguno' },
                { label: 'Módulos Esenciales', desc: 'ATS, Matrices y Carga de Fuego' },
                { label: 'Asesor IA Inicial', desc: 'Consultas normativas básicas' },
                { label: 'Guardado Local', desc: 'Guardá registros en tu dispositivo' }
              ].map((f, i) => (
                <div key={i} className="flex gap-[0.6rem] items-start">
                  <CheckCircle2 size={16} color="#10b981" className="mt-[2px] flex-shrink-0" />
                  <div>
                    <div className="text-[0.85rem] font-[700] text-[var(--color-text)]">{f.label}</div>
                    <div className="text-[0.75rem] text-[var(--color-text-muted)] line-height-[1.3]">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              className="w-full p-[0.85rem] rounded-[12px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[var(--color-text)] font-[800] text-[0.9rem] cursor-pointer transition-all">
              Probar Gratis
            </button>
          </div>

          {/* PLAN 2: ESTUDIANTE ($2 USD) */}
          <div className="glass-card rounded-[24px] p-[2rem_1.5rem] border-[1.5px_solid_rgba(16,185,129,0.4)] bg-gradient-to-b from-emerald-950/20 to-transparent flex flex-col gap-[1.2rem] relative shadow-md">
            <div className="absolute top-[1.2rem] right-[1.2rem] bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-2.5 py-0.5 rounded-full text-[0.68rem] font-extrabold uppercase tracking-wider">
              Estudiantes
            </div>
            <div>
              <div className="text-[0.75rem] font-[900] uppercase letter-spacing-[1px] text-emerald-400 mb-[0.5rem]">Plan 2: Estudiante</div>
              <div className="flex items-baseline gap-[0.3rem] mb-[0.4rem]">
                <span className="text-[2.5rem] font-[900] text-white leading-none">USD $2</span>
                <span className="text-emerald-300/70 text-[0.85rem]">/ mes</span>
              </div>
              <p className="text-[var(--color-text-muted)] text-[0.82rem] line-height-[1.4] m-[0]">
                Perfecto para alumnos, practicantes y técnicos que están dando sus primeros pasos.
              </p>
            </div>

            <div className="border-t border-[var(--color-border)] pt-[1.2rem] flex flex-col gap-[0.75rem] flex-1">
              {[
                { label: 'Todo lo del Plan Gratuito', desc: 'Más funciones de formación' },
                { label: 'Exportación en PDF', desc: 'Documentos oficiales con formato limpio' },
                { label: 'Cámara IA y Visión', desc: 'Detección automática de EPP y riesgos' },
                { label: 'Sincronización en la Nube', desc: 'Respaldo seguro de tus trabajos' }
              ].map((f, i) => (
                <div key={i} className="flex gap-[0.6rem] items-start">
                  <CheckCircle2 size={16} color="#10b981" className="mt-[2px] flex-shrink-0" />
                  <div>
                    <div className="text-[0.85rem] font-[700] text-[var(--color-text)]">{f.label}</div>
                    <div className="text-[0.75rem] text-[var(--color-text-muted)] line-height-[1.3]">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              className="w-full p-[0.85rem] rounded-[12px] border-none bg-emerald-600 hover:bg-emerald-700 text-white font-[900] text-[0.9rem] cursor-pointer shadow-md transition-all">
              Elegir Estudiante
            </button>
          </div>

          {/* PLAN 3: PROFESIONAL ($6 USD) - MÁS POPULAR */}
          <div className="rounded-[24px] p-[2rem_1.5rem] bg-[var(--gradient-premium)] border-[1.5px_solid_rgba(99,102,241,0.5)] flex flex-col gap-[1.2rem] relative overflow-hidden shadow-xl shadow-blue-500/20 scale-[1.02]">
            <div className="absolute top-[-30%] right-[-20%] w-[250px] h-[250px] bg-[radial-gradient(circle,_rgba(255,255,255,0.15)_0%,_transparent_70%)] pointer-events-none" />
            <div className="absolute top-[1.2rem] right-[1.2rem] bg-amber-400/20 border border-amber-400/40 text-amber-300 px-2.5 py-0.5 rounded-full text-[0.68rem] font-black uppercase tracking-wider">
              Más Popular ✦
            </div>

            <div className="relative z-10">
              <div className="text-[0.75rem] font-[900] uppercase letter-spacing-[1px] text-blue-200 mb-[0.5rem]">Plan 3: Profesional</div>
              <div className="flex items-baseline gap-[0.3rem] mb-[0.4rem]">
                <span className="text-[2.5rem] font-[900] text-white leading-none">USD $6</span>
                <span className="text-blue-200/80 text-[0.85rem]">/ mes</span>
              </div>
              <p className="text-blue-100/80 text-[0.82rem] line-height-[1.4] m-[0]">
                Para Licenciados, Técnicos e Ingenieros que asesoran empresas activamente.
              </p>
            </div>

            <div className="border-t border-white/15 pt-[1.2rem] flex flex-col gap-[0.75rem] flex-1 relative z-10">
              {[
                { label: 'PDFs Personalizados', desc: 'Tu logo institucional en reportes' },
                { label: 'Asesor IA Ilimitado', desc: 'Consultas normativas sin restricciones' },
                { label: 'Módulos Críticos Avanzados', desc: 'LOTO, Altura, Confinados y Auditorías' },
                { label: 'Firma Digital y QR', desc: 'Envío directo por WhatsApp al cliente' },
                { label: 'Exportación a Excel / CSV', desc: 'Generación de historial rápido' }
              ].map((f, i) => (
                <div key={i} className="flex gap-[0.6rem] items-start">
                  <CheckCircle2 size={16} color="#86efac" className="mt-[2px] flex-shrink-0" />
                  <div>
                    <div className="text-[0.85rem] font-[700] text-white">{f.label}</div>
                    <div className="text-[0.75rem] text-blue-100/70 line-height-[1.3]">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              className="w-full p-[0.85rem] rounded-[12px] border-none bg-white text-blue-900 font-[900] text-[0.9rem] cursor-pointer shadow-lg hover:bg-blue-50 transition-all relative z-10 flex items-center justify-center gap-1.5">
              <Sparkles size={16} /> Probar Profesional
            </button>
          </div>

          {/* PLAN 4: EMPRESA / CONSULTORA ($25 USD) */}
          <div className="glass-card rounded-[24px] p-[2rem_1.5rem] border-[1.5px_solid_rgba(168,85,247,0.4)] bg-gradient-to-b from-purple-950/20 to-transparent flex flex-col gap-[1.2rem] relative shadow-lg">
            <div className="absolute top-[1.2rem] right-[1.2rem] bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2.5 py-0.5 rounded-full text-[0.68rem] font-extrabold uppercase tracking-wider">
              Empresas 🏢
            </div>
            <div>
              <div className="text-[0.75rem] font-[900] uppercase letter-spacing-[1px] text-purple-300 mb-[0.5rem]">Plan 4: Empresa / Consultora</div>
              <div className="flex items-baseline gap-[0.3rem] mb-[0.4rem]">
                <span className="text-[2.5rem] font-[900] text-white leading-none">USD $25</span>
                <span className="text-purple-300/70 text-[0.85rem]">/ mes</span>
              </div>
              <p className="text-[var(--color-text-muted)] text-[0.82rem] line-height-[1.4] m-[0]">
                Para Servicios de HyS externos, consultoras y gestión de múltiples establecimientos.
              </p>
            </div>

            <div className="border-t border-[var(--color-border)] pt-[1.2rem] flex flex-col gap-[0.75rem] flex-1">
              {[
                { label: 'Multi-Usuario y Equipo', desc: 'Acceso para todo tu personal técnico' },
                { label: 'Gestión Multi-Cliente', desc: 'Carpetas separadas por empresa' },
                { label: 'Dashboards KPIs (LFITR/TRIFR)', desc: 'Métricas de seguridad ejecutivas' },
                { label: 'Soporte Prioritario 24/7', desc: 'Atención directa para tu consultora' }
              ].map((f, i) => (
                <div key={i} className="flex gap-[0.6rem] items-start">
                  <CheckCircle2 size={16} color="#c084fc" className="mt-[2px] flex-shrink-0" />
                  <div>
                    <div className="text-[0.85rem] font-[700] text-[var(--color-text)]">{f.label}</div>
                    <div className="text-[0.75rem] text-[var(--color-text-muted)] line-height-[1.3]">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              className="w-full p-[0.85rem] rounded-[12px] border border-purple-500/50 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-[900] text-[0.9rem] cursor-pointer shadow-md transition-all">
              Elegir Empresa
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