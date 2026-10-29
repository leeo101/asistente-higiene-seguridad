import { Link } from 'react-router-dom';
import React from 'react';
import { ShieldCheck, Mail, Home, FileText, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();
  const { t, countryNorms, adaptText } = useLanguage();

  return (
    <footer className="mt-auto p-12 px-6 pb-8 bg-slate-950/80 border-t border-white/10 backdrop-blur-md text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand & Mission */}
        <div className="flex flex-col gap-3 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png?v=3" alt="Logo Asistente H&S" className="h-9 w-auto object-contain shrink-0 drop-shadow-md" />
            <span className="font-black text-base text-white tracking-tight">{t('app.short_name')}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('footer.description')}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold pt-1">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>
              {t('footer.official_validity')} {countryNorms.flag} {countryNorms.name} ({countryNorms.general} & {countryNorms.decree})
            </span>
          </div>
        </div>

        {/* Protocolos Oficiales */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            {t('footer.protocols')} ({countryNorms.authority})
          </h4>
          <div className="flex flex-col gap-2">
            <Link to="/grounding" className="hover:text-blue-400 transition-colors">
              {adaptText('Puesta a Tierra')} ({countryNorms.grounding})
            </Link>
            <Link to="/lighting" className="hover:text-blue-400 transition-colors">
              {adaptText('Iluminación')} ({countryNorms.lighting})
            </Link>
            <Link to="/noise-assessment" className="hover:text-blue-400 transition-colors">
              {adaptText('Ruido')} ({countryNorms.noise})
            </Link>
            <Link to="/forklifts" className="hover:text-blue-400 transition-colors">
              {adaptText('Autoelevadores (SRT 960)')} ({countryNorms.forklifts})
            </Link>
            <Link to="/rgrl" className="hover:text-blue-400 transition-colors">
              {adaptText('RGRL Anual')} ({countryNorms.rgrl})
            </Link>
            <Link to="/working-at-height" className="hover:text-blue-400 transition-colors">
              {adaptText('Trabajo en Altura')} ({countryNorms.height})
            </Link>
          </div>
        </div>

        {/* Herramientas de Gestión */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('footer.ehs_tools')}</h4>
          <div className="flex flex-col gap-2">
            <Link to="/ats" className="hover:text-blue-400 transition-colors">{t('nav.ats')}</Link>
            <Link to="/fire-load" className="hover:text-blue-400 transition-colors">
              {adaptText('Carga de Fuego')} ({countryNorms.fire})
            </Link>
            <Link to="/risk-maps-history" className="hover:text-blue-400 transition-colors">
              {adaptText('Mapas')}
            </Link>
            <Link to="/dossier" className="hover:text-blue-400 transition-colors">
              {adaptText('Dossier ZIP')} ({countryNorms.authority})
            </Link>
            <Link to="/legal-matrix" className="hover:text-blue-400 transition-colors">
              {adaptText('Matriz Legal (ISO 45001)')} ({countryNorms.general})
            </Link>
            <Link to="/ai-advisor" className="hover:text-blue-400 transition-colors">
              {t('nav.ai_advisor')} 24/7
            </Link>
          </div>
        </div>

        {/* Institucional & Contacto */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('footer.institutional')}</h4>
          <div className="flex flex-col gap-2">
            <Link to="/" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <Home size={13} /> {t('nav.home')}
            </Link>
            <Link to="/security-trust" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <ShieldCheck size={13} /> {t('nav.trust')}
            </Link>
            <Link to="/privacy" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <FileText size={13} /> {t('nav.privacy')}
            </Link>
            <a href="mailto:asistente.hs.soporte@gmail.com" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <Mail size={13} /> {t('nav.support')}
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500">
        <p className="m-0">
          © {currentYear} {t('app.short_name')} — {t('footer.rights')}
        </p>
        <p className="m-0">
          {t('footer.compliance')} {countryNorms.flag} {countryNorms.name} · {countryNorms.general} · {countryNorms.decree} · {countryNorms.authority}
        </p>
      </div>
    </footer>
  );
}
