
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

      {/* 1. Value Props */}
      <section className="stagger-item p-[2.5rem_0_1.5rem]">
        <div className="text-center mb-[2.5rem]">
          <div className="inline-flex items-center gap-[0.5rem] p-[0.35rem_1rem] bg-blue-500/10 border border-blue-500/20 rounded-full mb-[1rem]">
            <Sparkles size={14} color="#60a5fa" />
            <span className="text-[#60a5fa] text-[0.78rem] font-[800] uppercase tracking-wider">Potenciá tu trabajo diario</span>
          </div>
          <h2 className="text-[clamp(1.8rem,_4vw,_2.5rem)] font-[900] mb-[0.6rem] font-family-[var(--font-heading)]">
            Todo lo que necesitás para tu gestión de HyS
          </h2>
          <p className="text-[var(--color-text-muted)] text-[1rem] max-w-[580px] m-[0_auto] leading-relaxed">
            Ahorrá horas de tipeo. Generá documentos técnicos e informes normativos impecables al instante.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1.2rem]">
          {valueProps.map((prop, i) => (
            <div key={i} className="glass-card-premium stagger-up p-[1.6rem_1.3rem] relative overflow-hidden transition-all hover:translate-y-[-2px]">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[var(--gradient-premium)]" />
              <div className="w-[44px] h-[44px] rounded-[14px] bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] text-[var(--color-primary)] flex items-center justify-center mb-[1rem] shadow-sm">
                {prop.icon}
              </div>
              <h3 className="text-[1.05rem] font-[800] mb-[0.5rem] text-[var(--color-text)]">{prop.title}</h3>
              <p className="text-[0.82rem] text-[var(--color-text-muted)] leading-relaxed">{prop.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Plans / Pricing */}
      <section className="stagger-item p-[3rem_0_2rem]">
        <div className="text-center mb-[2.5rem]">
          <div className="inline-flex items-center gap-[0.5rem] p-[0.35rem_1rem] bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-[1rem]">
            <Sparkles size={14} color="#34d399" />
            <span className="text-[#34d399] text-[0.78rem] font-[800] uppercase tracking-wider">Planes a tu medida · Sin cargos ocultos</span>
          </div>
          <h2 className="text-[clamp(1.9rem,_5vw,_2.5rem)] font-[900] mb-[0.8rem] font-family-[var(--font-heading)]">
            Elegí tu plan y empezá hoy
          </h2>
          <p className="text-[var(--color-text-muted)] text-[1rem] max-w-[600px] m-[0_auto] leading-relaxed">
            Desde estudiantes hasta grandes consultoras de HyS. Cambiá o cancelá en cualquier momento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1.2rem] max-w-[1240px] m-[0_auto]">

          {/* PLAN 1: GRATUITO ($0) */}
          <div className="glass-card rounded-[24px] p-[1.8rem_1.4rem] border border-[var(--color-border)] flex flex-col justify-between relative shadow-sm">
            <div>
              <div className="text-[0.72rem] font-[900] uppercase tracking-wider text-[var(--color-text-muted)] mb-[0.4rem]">Plan 1: Gratuito</div>
              <div className="flex items-baseline gap-[0.3rem] mb-[0.3rem]">
                <span className="text-[2.2rem] font-[900] text-[var(--color-text)] leading-none">USD $0</span>
                <span className="text-[var(--color-text-muted)] text-[0.8rem]">/ siempre</span>
              </div>
              <p className="text-[var(--color-text-muted)] text-[0.8rem] leading-relaxed mb-4">
                Ideal para explorar la herramienta e inspecciones iniciales.
              </p>

              <div className="border-t border-[var(--color-border)] pt-[1rem] flex flex-col gap-[0.65rem]">
                {[
                  { label: 'Uso Ilimitado Base', desc: 'Cargá registros sin costo alguno' },
                  { label: 'Módulos Esenciales', desc: 'ATS, Matrices y Carga de Fuego' },
                  { label: 'Asesor IA Inicial', desc: 'Consultas normativas básicas' },
                  { label: 'Guardado Local', desc: 'Guardá registros en tu dispositivo' }
                ].map((f, i) => (
                  <div key={i} className="flex gap-[0.5rem] items-start">
                    <CheckCircle2 size={15} color="#10b981" className="mt-[2px] flex-shrink-0" />
                    <div>
                      <div className="text-[0.82rem] font-[700] text-[var(--color-text)]">{f.label}</div>
                      <div className="text-[0.72rem] text-[var(--color-text-muted)]">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onStart}
              className="w-full mt-5 p-[0.8rem] rounded-[12px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[var(--color-text)] font-[800] text-[0.85rem] cursor-pointer transition-all">
              Probar Gratis
            </button>
          </div>

          {/* PLAN 2: ESTUDIANTE ($2 USD) */}
          <div className="glass-card rounded-[24px] p-[1.8rem_1.4rem] border-[1.5px] border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 to-transparent flex flex-col justify-between relative shadow-md">
            <div className="absolute top-[1rem] right-[1rem] bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wider">
              Estudiantes 🎓
            </div>
            <div>
              <div className="text-[0.72rem] font-[900] uppercase tracking-wider text-emerald-400 mb-[0.4rem]">Plan 2: Estudiante</div>
              <div className="flex items-baseline gap-[0.3rem] mb-[0.3rem]">
                <span className="text-[2.2rem] font-[900] text-white leading-none">USD $2</span>
                <span className="text-emerald-300/70 text-[0.8rem]">/ mes</span>
              </div>
              <p className="text-[var(--color-text-muted)] text-[0.8rem] leading-relaxed mb-4">
                Perfecto para alumnos, practicantes y técnicos juniors.
              </p>

              <div className="border-t border-[var(--color-border)] pt-[1rem] flex flex-col gap-[0.65rem]">
                {[
                  { label: 'Todo del Plan Gratuito', desc: 'Más funciones de formación' },
                  { label: 'Exportación en PDF', desc: 'Formato limpio listo para entregar' },
                  { label: 'Cámara IA y Visión', desc: 'Detección de EPP y riesgos' },
                  { label: 'Sincronización Nube', desc: 'Respaldo seguro de tus trabajos' }
                ].map((f, i) => (
                  <div key={i} className="flex gap-[0.5rem] items-start">
                    <CheckCircle2 size={15} color="#10b981" className="mt-[2px] flex-shrink-0" />
                    <div>
                      <div className="text-[0.82rem] font-[700] text-[var(--color-text)]">{f.label}</div>
                      <div className="text-[0.72rem] text-[var(--color-text-muted)]">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onStart}
              className="w-full mt-5 p-[0.8rem] rounded-[12px] border-none bg-emerald-600 hover:bg-emerald-700 text-white font-[900] text-[0.85rem] cursor-pointer shadow-md transition-all">
              Elegir Estudiante
            </button>
          </div>

          {/* PLAN 3: PROFESIONAL ($6 USD) - MÁS POPULAR */}
          <div className="rounded-[24px] p-[1.8rem_1.4rem] bg-[var(--gradient-premium)] border-[1.5px] border-indigo-500/50 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-blue-500/20 scale-[1.02]">
            <div className="absolute top-[-30%] right-[-20%] w-[250px] h-[250px] bg-[radial-gradient(circle,_rgba(255,255,255,0.15)_0%,_transparent_70%)] pointer-events-none" />
            <div className="absolute top-[1rem] right-[1rem] bg-amber-400/20 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded-full text-[0.65rem] font-black uppercase tracking-wider">
              Más Popular ✦
            </div>

            <div className="relative z-10">
              <div className="text-[0.72rem] font-[900] uppercase tracking-wider text-blue-200 mb-[0.4rem]">Plan 3: Profesional</div>
              <div className="flex items-baseline gap-[0.3rem] mb-[0.3rem]">
                <span className="text-[2.2rem] font-[900] text-white leading-none">USD $6</span>
                <span className="text-blue-200/80 text-[0.8rem]">/ mes</span>
              </div>
              <p className="text-blue-100/80 text-[0.8rem] leading-relaxed mb-4">
                Para Licenciados, Técnicos e Ingenieros activos.
              </p>

              <div className="border-t border-white/15 pt-[1rem] flex flex-col gap-[0.65rem]">
                {[
                  { label: 'PDFs con TU LOGO', desc: 'Tu marca institucional en reportes' },
                  { label: 'Asesor IA Ilimitado', desc: 'Consultas normativas sin límites' },
                  { label: 'Módulos Críticos', desc: 'LOTO, Altura, Confinados y Auditorías' },
                  { label: 'Firma Digital y QR', desc: 'Envío directo por WhatsApp' },
                  { label: 'Exportación Excel', desc: 'Reportes ejecutivos inmediatos' }
                ].map((f, i) => (
                  <div key={i} className="flex gap-[0.5rem] items-start">
                    <CheckCircle2 size={15} color="#86efac" className="mt-[2px] flex-shrink-0" />
                    <div>
                      <div className="text-[0.82rem] font-[700] text-white">{f.label}</div>
                      <div className="text-[0.72rem] text-blue-100/70">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onStart}
              className="w-full mt-5 p-[0.8rem] rounded-[12px] border-none bg-white text-blue-900 font-[900] text-[0.85rem] cursor-pointer shadow-lg hover:bg-blue-50 transition-all relative z-10 flex items-center justify-center gap-1.5">
              <Sparkles size={15} /> Probar Profesional
            </button>
          </div>

          {/* PLAN 4: EMPRESA / CONSULTORA ($25 USD) */}
          <div className="glass-card rounded-[24px] p-[1.8rem_1.4rem] border-[1.5px] border-purple-500/40 bg-gradient-to-b from-purple-950/20 to-transparent flex flex-col justify-between relative shadow-lg">
            <div className="absolute top-[1rem] right-[1rem] bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wider">
              Empresas 🏢
            </div>
            <div>
              <div className="text-[0.72rem] font-[900] uppercase tracking-wider text-purple-300 mb-[0.4rem]">Plan 4: Empresa</div>
              <div className="flex items-baseline gap-[0.3rem] mb-[0.3rem]">
                <span className="text-[2.2rem] font-[900] text-white leading-none">USD $25</span>
                <span className="text-purple-300/70 text-[0.8rem]">/ mes</span>
              </div>
              <p className="text-[var(--color-text-muted)] text-[0.8rem] leading-relaxed mb-4">
                Para Servicios HyS externos y consultoras.
              </p>

              <div className="border-t border-[var(--color-border)] pt-[1rem] flex flex-col gap-[0.65rem]">
                {[
                  { label: 'Multi-Usuario', desc: 'Acceso para todo tu equipo técnico' },
                  { label: 'Gestión Multi-Cliente', desc: 'Carpetas separadas por empresa' },
                  { label: 'Dashboards KPIs EHS', desc: 'Métricas y estadísticas ejecutivas' },
                  { label: 'Soporte Prioritario 24/7', desc: 'Atención personalizada directa' }
                ].map((f, i) => (
                  <div key={i} className="flex gap-[0.5rem] items-start">
                    <CheckCircle2 size={15} color="#c084fc" className="mt-[2px] flex-shrink-0" />
                    <div>
                      <div className="text-[0.82rem] font-[700] text-[var(--color-text)]">{f.label}</div>
                      <div className="text-[0.72rem] text-[var(--color-text-muted)]">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onStart}
              className="w-full mt-5 p-[0.8rem] rounded-[12px] border border-purple-500/50 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-[900] text-[0.85rem] cursor-pointer shadow-md transition-all">
              Elegir Empresa
            </button>
          </div>

        </div>
      </section>

      {/* 3. Massive CTA Banner */}
      <section className="stagger-item p-[4rem_2rem] text-center text-white rounded-[28px] my-[3rem] relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-[28px]" />

        <div className="relative z-10 max-w-[650px] mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 text-xs font-bold">
              Unite a los profesionales que ya automatizan su HyS
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black mb-3 leading-tight">
            Impulsá tu Gestión de HyS Hoy
          </h2>
          <p className="text-sm sm:text-base mb-6 text-white/80 leading-relaxed">
            Ahorrá horas de trabajo diario. Creá tu cuenta gratuita y probá el poder de la Inteligencia Artificial.
          </p>
          <button
            onClick={onStart}
            className="px-8 py-3.5 rounded-full bg-white text-blue-950 font-black text-base cursor-pointer shadow-2xl inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border-none">
            Crear mi cuenta gratis <ArrowRight size={18} />
          </button>
        </div>
      </section>

    </div>);
}