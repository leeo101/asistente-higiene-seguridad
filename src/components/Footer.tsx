import { Link } from 'react-router-dom';
import React from 'react';
import { ShieldCheck, Mail, Home, ExternalLink, LucideProps } from 'lucide-react';

export default function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-[auto] p-[3rem_1.5rem_2rem] bg-[rgba(15,_23,_42,_0.02)] border-top-[1px_solid_var(--color-border)] backdrop-filter-[blur(10px)] webkit-backdrop-filter-[blur(10px)]">






      
      <div className="max-w-[1200px] m-[0_auto] grid grid-template-columns-[repeat(auto-fit,_minmax(250px,_1fr))] gap-[2.5rem] mb-[3rem]">






        
        {/* Brand & Mission */}
        <div className="flex flex-col gap-[1rem]">
          <div className="flex items-center gap-[0.8rem]">
            <img src="/logo.png" alt="Logo" className="w-[30px] h-[30px] object-fit-[contain]" />
            <span className="font-[900] text-[1.2rem] text-[var(--color-text)] letter-spacing-[-0.5px]">Asistente H&S</span>
          </div>
          <p className="text-[0.9rem] text-[var(--color-text-muted)] line-height-[1.6] m-[0]">
            Potenciando la labor de los profesionales de Higiene y Seguridad con herramientas inteligentes y cálculos normativos precisos.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-[1.2rem]">
          <h4 className="m-[0] text-[1rem] font-[800] text-[var(--color-text)]">Accesos Rápidos</h4>
          <div className="flex flex-col gap-[0.8rem]">
            <Link to="/" className="text-[var(--color-text-muted)] text-decoration-[none] text-[0.9rem] flex items-center gap-[0.5rem]">
              <Home size={14} /> Inicio
            </Link>
            <Link to="/privacy" className="text-[var(--color-text-muted)] text-decoration-[none] text-[0.9rem] flex items-center gap-[0.5rem]">
              <ShieldCheck size={14} /> Privacidad
            </Link>
            <a href="mailto:asistente.hs.soporte@gmail.com" className="text-[var(--color-text-muted)] text-decoration-[none] text-[0.9rem] flex items-center gap-[0.5rem]">
              <Mail size={14} /> Soporte Técnico
            </a>
          </div>
        </div>

        {/* Legal & Standards */}
        <div className="flex flex-col gap-[1.2rem]">
          <h4 className="m-[0] text-[1rem] font-[800] text-[var(--color-text)]">Marco Legal</h4>
          <p className="text-[0.85rem] text-[var(--color-text-muted)] line-height-[1.6] m-[0]">
            Adaptado a la normativa de Higiene y Seguridad del país seleccionado por el profesional.
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1200px] m-[2rem_auto_0] pt-[1.5rem] border-top-[1px_solid_rgba(0,0,0,0.05)] flex justify-center text-center">







        
        <p className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[600]">
          © {currentYear} Asistente H&S - Todos los derechos reservados.
        </p>
      </div>
    </footer>);

}