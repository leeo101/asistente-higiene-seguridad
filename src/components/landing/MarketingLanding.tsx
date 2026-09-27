import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ArrowRight, CheckCircle, Sparkle as Sparkles,
  HardHat, Fire, Lightning, FileText, Cpu, Activity,
  Users, Building, Eye, Download, Check, CaretDown,
  DeviceMobile, Clock, Star, Play
} from '@phosphor-icons/react';
import BeforeAndAfter from './BeforeAndAfter';
import PricingDark from './PricingDark';
import FaqAndCtaDark from './FaqAndCtaDark';

interface MarketingLandingProps {
  onStart: () => void;
  onLogin: () => void;
}

export default function MarketingLanding({ onStart, onLogin }: MarketingLandingProps) {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#020617] text-white min-h-screen selection:bg-blue-600 selection:text-white">
      {/* ── TOP NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/85 backdrop-blur-md border-b border-white/10 px-3 sm:px-8 py-2.5 sm:py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src="/logo.png"
              alt="Logo Asistente H&S"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg shadow-md border border-white/10"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1 sm:gap-1.5">
              Asistente H&S
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">PRO</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <button onClick={() => scrollToSection('soluciones')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">
              ¿Para qué sirve?
            </button>
            <button onClick={() => scrollToSection('industrias')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">
              Industrias
            </button>
            <button onClick={() => scrollToSection('comparativa')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">
              Antes vs Después
            </button>
            <button onClick={() => scrollToSection('precios')} className="hover:text-amber-400 transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1">
              <span>Precios</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">Desde $2</span>
            </button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">
              Preguntas
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onLogin}
              className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10"
            >
              Ingresar
            </button>
            <button
              onClick={onStart}
              className="text-xs sm:text-sm font-bold text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all cursor-pointer border-none flex items-center gap-1 sm:gap-1.5"
            >
              <span>Probar Gratis</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION CON IMÁGENES REALES ── */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-28 px-4 sm:px-8 overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Columna Texto */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={16} weight="bold" />
              <span>Software Integral para Profesionales de HyS</span>
            </div>

            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] sm:leading-[1.1]"
              style={{ color: '#ffffff' }}
            >
              Automatizá tus{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #fbbf24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: '#38bdf8',
                  display: 'inline-block',
                }}
              >
                Permisos, Protocolos SRT
              </span>{' '}
              e Informes en minutos.
            </h1>

            <p className="text-sm sm:text-lg max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed" style={{ color: '#cbd5e1' }}>
              Dejá atrás las carpetas mojadas y los Excels rotos. Emití ATS, Trabajos de Alto Riesgo, Protocolos Oficiales de Ruido, Iluminación y Puesta a Tierra con <strong style={{ color: '#ffffff' }}>tu logo, matrícula profesional y firmas remotas por QR o WhatsApp</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <button
                onClick={onStart}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <span>Crear Cuenta Gratis (Sin Tarjeta)</span>
                <ArrowRight size={18} weight="bold" />
              </button>
              <button
                onClick={() => scrollToSection('precios')}
                className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-sm sm:text-base transition-colors cursor-pointer text-center"
              >
                Ver Precios y Planes ($2/mes)
              </button>
            </div>

            {/* Social Proof */}
            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} weight="fill" />
                ))}
              </div>
              <span className="font-semibold text-slate-300">
                Más de <strong>1.200 técnicos y licenciados</strong> de Argentina y LatAm
              </span>
              <span className="hidden sm:inline">•</span>
              <span>100% conforme a Ley 19.587 y Dec. 351/79</span>
            </div>
          </div>

          {/* Columna Visual: Imagen de Obra + Card Flotante */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-slate-900 group">
              <img
                src="/landing/hero-construction.jpg"
                alt="Ingeniero en obra de construcción con casco de seguridad"
                className="w-full h-[380px] sm:h-[440px] object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-90" />

              {/* Card Flotante: Reporte Oficial Generado */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <ShieldCheck size={18} weight="bold" />
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-white">ATS & Permiso de Altura Habilitado</h4>
                      <p className="text-[10px] text-slate-400">Res. SRT 61/23 • Obra Edificio Torre A</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    Firmado QR
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/10 text-slate-300">
                  <span>Operador: Juan Pérez</span>
                  <span className="text-amber-400 font-semibold">DLC: 4.80 m (Apto)</span>
                </div>
              </div>
            </div>

            {/* Chip flotante superior */}
            <div className="absolute -top-4 -right-4 bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-blue-400/30 hidden sm:flex items-center gap-1.5 animate-bounce">
              <Sparkles size={14} weight="fill" />
              <span>Validez Oficial ante ART</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── BARRA DE RESPALDO NORMATIVO ── */}
      <section className="border-y border-white/10 bg-slate-950/60 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center md:text-left">
            Diseñado según las normativas y resoluciones oficiales:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'Ley 19.587', sub: 'Higiene y Seguridad' },
              { label: 'Dec. 351/79', sub: 'Industria' },
              { label: 'Dec. 911/96', sub: 'Construcción' },
              { label: 'Dec. 617/97', sub: 'Agro' },
              { label: 'Res. SRT 84/12 & 85/12', sub: 'Luz y Ruido' },
              { label: 'Res. SRT 900/15', sub: 'Puesta a Tierra' },
              { label: 'Res. SRT 463/09', sub: 'RGRL ART' },
              { label: 'NFPA 51B / 70E', sub: 'Caliente y Arco' }
            ].map((n, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <span>{n.label}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOQUE 2: ¿PARA QUÉ SIRVE? (3 PILARES CON FOTOS) ── */}
      <section id="soluciones" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-blue-400 text-xs font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            Solución Todo en Uno
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: '#ffffff' }}>
            ¿Para qué sirve el Asistente H&S?
          </h2>
          <p className="text-sm sm:text-base" style={{ color: '#94a3b8' }}>
            Diseñado por y para profesionales de terreno. Resolvemos las tres grandes cargas de trabajo que quitan tiempo todos los días.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pilar 1: Terreno y Permisos */}
          <div className="bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:border-amber-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="h-48 overflow-hidden relative">
                <img
                  src="/landing/card-field.jpg"
                  alt="Operarios en construcción con arnés y cascos"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-lg">
                  TRABAJO EN CAMPO
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#ffffff' }}>
                  <HardHat className="text-amber-400" size={22} weight="duotone" />
                  Permisos de Alto Riesgo y ATS
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
                  Generá en minutos permisos para <strong style={{ color: '#ffffff' }}>Trabajo en Altura (Res. 61/23)</strong>, <strong style={{ color: '#ffffff' }}>Trabajos en Caliente (NFPA 51B)</strong>, <strong style={{ color: '#ffffff' }}>Espacios Confinados</strong> y <strong style={{ color: '#ffffff' }}>Excavaciones</strong>.
                </p>
                <ul className="text-xs space-y-1.5 pt-2 border-t border-white/5" style={{ color: '#94a3b8' }}>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" weight="bold" />
                    <span>Firma remota por WhatsApp o código QR</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" weight="bold" />
                    <span>Calculadora de distancia libre de caída (DLC)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" weight="bold" />
                    <span>Control de vigías y explosimetría LEL</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button onClick={onStart} className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-colors cursor-pointer">
                Probar Módulo de Terreno →
              </button>
            </div>
          </div>

          {/* Pilar 2: Protocolos SRT y ART */}
          <div className="bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:border-blue-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="h-48 overflow-hidden relative">
                <img
                  src="/landing/card-industry.jpg"
                  alt="Medición técnica con instrumental en fábrica"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                  CUMPLIMIENTO LEGAL
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#ffffff' }}>
                  <FileText className="text-blue-400" size={22} weight="duotone" />
                  Protocolos Oficiales SRT y ART
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
                  Carga mediciones y el sistema valida automáticamente contra los límites legales. Generá los informes oficiales que te exige la ART o el Ministerio.
                </p>
                <ul className="text-xs space-y-1.5 pt-2 border-t border-white/5" style={{ color: '#94a3b8' }}>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" weight="bold" />
                    <span>Iluminación (84/12), Ruido (85/12) y PAT (900/15)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" weight="bold" />
                    <span>Exportación de RGRL (463/09) y RAR en Excel</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" weight="bold" />
                    <span>Constancia oficial de Entrega de EPP (Res. 299/11)</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button onClick={onStart} className="w-full py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold rounded-xl border border-blue-500/30 transition-colors cursor-pointer">
                Probar Protocolos SRT →
              </button>
            </div>
          </div>

          {/* Pilar 3: IA y Centro de Control */}
          <div className="bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:border-indigo-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="h-48 overflow-hidden relative">
                <img
                  src="/landing/card-logistics.jpg"
                  alt="Centro de control logístico e industrial"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                  GESTIÓN Y CONTROL
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#ffffff' }}>
                  <Cpu className="text-indigo-400" size={22} weight="duotone" />
                  IA y Semáforo de Vencimientos
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
                  Asistente virtual entrenado con las leyes argentinas y tablero ejecutivo para que no se te pase ningún vencimiento de clientes o plantas.
                </p>
                <ul className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-white/5">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" weight="bold" />
                    <span>Dossier Mensual de Gestión ejecutivo en 1 clic</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" weight="bold" />
                    <span>Control de Matafuegos, Aptitudes y Capacitaciones</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" weight="bold" />
                    <span>Modo Offline para áreas sin señal de internet</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button onClick={onStart} className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition-colors cursor-pointer">
                Probar Asistente IA →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOQUE 3: GALERÍA DE INDUSTRIAS ── */}
      <section id="industrias" className="py-20 bg-slate-950/80 border-y border-white/10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Adaptado a cada rubro
              </span>
              <h2 className="text-3xl font-black tracking-tight mt-1" style={{ color: '#ffffff' }}>
                Respaldado para todas las industrias
              </h2>
            </div>
            <p className="text-xs max-w-md" style={{ color: '#94a3b8' }}>
              Cada sector posee sus propios decretos reglamentarios y matrices de riesgo preconfiguradas para no empezar desde cero.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Construcción y Obras',
                norm: 'Decreto 911/96',
                img: '/landing/hero-construction.jpg',
                desc: 'Andamios, excavaciones, tableros provisorios y Programas de Seguridad ante ART.'
              },
              {
                title: 'Industria & Fábricas',
                norm: 'Decreto 351/79',
                img: '/landing/card-industry.jpg',
                desc: 'Carga de fuego, LOTO, puentes grúa, ruido, iluminación y seguridad química.'
              },
              {
                title: 'Logística & Almacenes',
                norm: 'Res. SRT 960/15',
                img: '/landing/card-logistics.jpg',
                desc: 'Autoelevadores, inspección de racks pesados, muelles y ergonomía en estibas.'
              },
              {
                title: 'Sector Agropecuario',
                norm: 'Decreto 617/97',
                img: '/landing/card-agro.jpg',
                desc: 'Silos, maquinaria móvil, manejo seguro de fitosanitarios y agroquímicos.'
              }
            ].map((ind, i) => (
              <div key={i} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-lg">
                <div className="h-44 overflow-hidden">
                  <img
                    src={ind.img}
                    alt={ind.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {ind.norm}
                    </span>
                  </div>
                  <h4 className="font-bold text-base" style={{ color: '#ffffff' }}>{ind.title}</h4>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{ind.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOQUE 4: ANTES VS DESPUÉS ── */}
      <section id="comparativa">
        <BeforeAndAfter />
      </section>

      {/* ── BLOQUE 5: TABLA DE PRECIOS ── */}
      <section id="precios">
        <PricingDark onStart={onStart} />
      </section>

      {/* ── BLOQUE 6: PREGUNTAS FRECUENTES Y CTA FINAL ── */}
      <section id="faq">
        <FaqAndCtaDark />
      </section>

      {/* ── FOOTER LIMPIO ── */}
      <footer className="border-t border-white/10 bg-[#01040f] py-12 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" onError={e => (e.target as HTMLElement).style.display = 'none'} />
            <span className="font-bold text-white">Asistente H&S Argentina</span>
            <span>•</span>
            <span>Plataforma Profesional de Higiene, Seguridad y Medio Ambiente</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/terms')} className="hover:text-white bg-transparent border-none cursor-pointer">
              Términos
            </button>
            <button onClick={() => navigate('/privacy-policy')} className="hover:text-white bg-transparent border-none cursor-pointer">
              Privacidad
            </button>
            <button onClick={onLogin} className="hover:text-white bg-transparent border-none cursor-pointer">
              Acceso Clientes
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
