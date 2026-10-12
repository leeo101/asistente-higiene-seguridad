import { Link } from 'react-router-dom';
import React from 'react';
import { ShieldCheck, Mail, Home, FileText, CheckCircle2 } from 'lucide-react';

export default function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto p-12 px-6 pb-8 bg-slate-950/80 border-t border-white/10 backdrop-blur-md text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand & Mission */}
        <div className="flex flex-col gap-3 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo Asistente H&S" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
            <span className="font-black text-base text-white tracking-tight">Asistente H&S</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Software integral para profesionales de Higiene, Seguridad y Medio Ambiente en Argentina y Latinoamérica.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold pt-1">
            <CheckCircle2 size={14} />
            <span>Validez oficial Ley 19.587 & Resoluciones SRT</span>
          </div>
        </div>

        {/* Protocolos Oficiales SRT */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Protocolos SRT</h4>
          <div className="flex flex-col gap-2">
            <Link to="/grounding" className="hover:text-blue-400 transition-colors">Puesta a Tierra (Res. 900/15)</Link>
            <Link to="/lighting" className="hover:text-blue-400 transition-colors">Iluminación (Res. 84/12)</Link>
            <Link to="/noise-assessment" className="hover:text-blue-400 transition-colors">Ruido Laboral (Res. 85/12)</Link>
            <Link to="/forklifts" className="hover:text-blue-400 transition-colors">Autoelevadores (Res. 960/15)</Link>
            <Link to="/rgrl" className="hover:text-blue-400 transition-colors">RGRL ART (Res. 463/09)</Link>
            <Link to="/working-at-height" className="hover:text-blue-400 transition-colors">Trabajo en Altura (Res. 61/23)</Link>
          </div>
        </div>

        {/* Herramientas de Gestión */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Herramientas EHS</h4>
          <div className="flex flex-col gap-2">
            <Link to="/ats" className="hover:text-blue-400 transition-colors">ATS Digital con Firma QR</Link>
            <Link to="/fire-load" className="hover:text-blue-400 transition-colors">Carga de Fuego Dec. 351/79</Link>
            <Link to="/risk-maps" className="hover:text-blue-400 transition-colors">Planos de Evacuación CAD</Link>
            <Link to="/dossier" className="hover:text-blue-400 transition-colors">Dossier ZIP para ART</Link>
            <Link to="/legal-matrix" className="hover:text-blue-400 transition-colors">Matriz Legal ISO 45001</Link>
            <Link to="/ai-advisor" className="hover:text-blue-400 transition-colors">Asesor Normativo IA 24/7</Link>
          </div>
        </div>

        {/* Institucional & Contacto */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Institucional</h4>
          <div className="flex flex-col gap-2">
            <Link to="/" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <Home size={13} /> Inicio
            </Link>
            <Link to="/security-trust" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <ShieldCheck size={13} /> Seguridad & Trust
            </Link>
            <Link to="/privacy" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <FileText size={13} /> Privacidad y Términos
            </Link>
            <a href="mailto:asistente.hs.soporte@gmail.com" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <Mail size={13} /> Soporte Técnico
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500">
        <p className="m-0">
          © {currentYear} Asistente H&S - Plataforma de Higiene, Seguridad y Medio Ambiente. Todos los derechos reservados.
        </p>
        <p className="m-0">
          Cumplimiento Ley 19.587 · Decretos 351/79, 911/96 y Resoluciones SRT
        </p>
      </div>
    </footer>
  );
}