
import React, { useState, useEffect } from 'react';
import { Newspaper, ChevronRight, ExternalLink, BellRing } from 'lucide-react';

const NEWS_BY_COUNTRY = {
  argentina: [
  {
    id: 1,
    title: "Nuevo Protocolo de Valoración del Daño (Res. 7/2026)",
    description: "La SRT oficializó el protocolo para estandarizar la evidencia médica ante Comisiones Médicas, derogando la Res. 886/17.",
    date: "Urgente",
    tag: "SRT 2026",
    link: "https://www.argentina.gob.ar/srt"
  },
  {
    id: 2,
    title: "Ley 6.912: Colegiatura CABA",
    description: "Es oficial la matriculación obligatoria para ejercer Higiene y Seguridad en la Ciudad Autónoma de Buenos Aires.",
    date: "Nuevo",
    tag: "Normativa",
    link: "https://boletinoficial.buenosaires.gob.ar"
  },
  {
    id: 3,
    title: "Reformas en Comisiones Médicas (Res. 5/2026)",
    description: "Cambios en los plazos y estrategia probatoria, que ahora debe presentarse íntegramente en la primera audiencia.",
    date: "Actualidad",
    tag: "Laboral",
    link: "https://www.argentina.gob.ar/srt"
  }],

  chile: [
  {
    id: 1,
    title: "Plena entrada en vigor del D.S. N° 44",
    description: "A un año de su inicio, la Dirección del Trabajo intensifica la fiscalización del Sistema de Gestión (SG-SST) en empresas.",
    date: "Urgente",
    tag: "Fiscalización",
    link: "https://www.suseso.gob.cl/"
  },
  {
    id: 2,
    title: "Circular 3.914 SUSESO: Lugares Compartidos",
    description: "Nuevas directivas obligatorias para coordinar matrices de riesgos entre contratistas y principales que compartan recinto.",
    date: "Nuevo",
    tag: "SUSESO 2026",
    link: "https://www.suseso.gob.cl/"
  },
  {
    id: 3,
    title: "Actualización Compendio de Normas",
    description: "La SUSESO publicó la versión 111 de su compendio del Seguro de Accidentes incorporando las últimas directrices.",
    date: "Actualidad",
    tag: "Seguro",
    link: "https://www.suseso.gob.cl/"
  }],

  bolivia: [
  {
    id: 1,
    title: "Campaña Nacional de Seguridad",
    description: "El Ministerio de Trabajo lanza campaña para reducir accidentes en el sector construcción.",
    date: "Hace 2 días",
    tag: "MIN TRABAJO",
    link: "https://www.mintrabajo.gob.bo/"
  },
  {
    id: 2,
    title: "Inspecciones en Santa Cruz",
    description: "Autoridades intensifican controles preventivos en establecimientos industriales de la región.",
    date: "Hace 1 semana",
    tag: "Prevención",
    link: "https://www.mintrabajo.gob.bo/"
  }],

  paraguay: [
  {
    id: 1,
    title: "Avances en Salud Laboral",
    description: "MTESS presenta avances en la protección de la salud y seguridad de los trabajadores paraguayos.",
    date: "Hace 4 días",
    tag: "MTESS",
    link: "https://www.mtess.gov.py/"
  },
  {
    id: 2,
    title: "Capacitación de Seguridad",
    description: "Jornadas técnicas para empresas del sector servicios sobre prevención de incendios.",
    date: "Hace 1 semana",
    tag: "Técnico",
    link: "https://www.mtess.gov.py/"
  }],

  uruguay: [
  {
    id: 1,
    title: "Nuevos lineamientos en Altura",
    description: "La IGTSS actualiza criterios de seguridad para el uso de andamios y plataformas elevadoras.",
    date: "Hace 3 días",
    tag: "IGTSS",
    link: "https://www.gub.uy/ministerio-trabajo-seguridad-social/"
  },
  {
    id: 2,
    title: "Semana de la Seguridad",
    description: "Actividades de sensibilización nacional bajo el marco del Decreto 406/88.",
    date: "Hace 1 semana",
    tag: "MTSS",
    link: "https://www.gub.uy/ministerio-trabajo-seguridad-social/"
  }],

  generic: [
  {
    id: 1,
    title: "Tendencias Globales en Seguridad 4.0",
    description: "Cómo la IA y el IoT están transformando la gestión de riesgos en la industria moderna.",
    date: "Hace 2 días",
    tag: "Innovación",
    link: "#"
  },
  {
    id: 2,
    title: "Importancia de la Salud Mental en el Trabajo",
    description: "Nuevos estudios destacan el impacto de la prevención de riesgos psicosociales en la productividad.",
    date: "Hace 1 semana",
    tag: "Salud",
    link: "#"
  }]

};

export default function NewsWidget() {
  const savedData = localStorage.getItem('personalData');
  const userCountry = (savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina').toLowerCase().trim();
  const NEWS_ITEMS = NEWS_BY_COUNTRY[userCountry] || NEWS_BY_COUNTRY.generic;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
    }, 8000); // Rotates every 8 seconds
    return () => clearInterval(timer);
  }, []);

  const currentNews = NEWS_ITEMS[currentIndex];

  return (
    <div className="mt-[2rem]">
            <div className="flex justify-between items-center mb-[1rem] px-2">
                <h3 className="text-[1.1rem] font-[900] m-[0] letter-spacing-[-0.5px] flex items-center gap-[0.5rem]">
                    <BellRing size={20} color="#f59e0b" /> Novedades Normativas
                </h3>
            </div>

            <div className="card p-[1.5rem] bg-[linear-gradient(135deg,_var(--color-surface)_0%,_rgba(245,158,11,0.05)_100%)] border-[1.5px_solid_rgba(245,158,11,0.2)] relative overflow-[hidden]">





        
                <div className="flex gap-[1rem] items-start">
                    <div className="bg-[rgba(245,158,11,0.15)] text-[#f59e0b] p-[0.8rem] rounded-[12px] flex-shrink-[0]">





            
                        <Newspaper size={24} />
                    </div>

                    <div className="flex-[1]">
                        <div className="flex items-center gap-[0.8rem] mb-[0.3rem] flex-wrap">
                            <span className="bg-[#f59e0b] text-[#fff] text-[0.65rem] font-[800] p-[0.2rem_0.6rem] rounded-[20px] uppercase">







                
                                {currentNews.tag}
                            </span>
                            <span className="text-[0.75rem] text-[var(--color-text-muted)] font-[600]">
                                {currentNews.date}
                            </span>
                        </div>

                        <h4 className="m-[0_0_0.5rem] text-[1.05rem] font-[800] text-[var(--color-text)]">
                            {currentNews.title}
                        </h4>

                        <p className="m-[0_0_1rem] text-[0.9rem] text-[var(--color-text-muted)] line-height-[1.4]">
                            {currentNews.description}
                        </p>

                        <a
              href={currentNews.link}
              target="_blank"
              rel="noreferrer" className="display-[inline-flex] items-center gap-[0.3rem] text-[0.85rem] font-[700] text-[var(--color-primary)] text-decoration-[none]">









              
                            Leer más <ExternalLink size={14} />
                        </a>
                    </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-[0.4rem] justify-center mt-[1.2rem]">
                    {NEWS_ITEMS.map((_, idx) =>
          <div
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: idx === currentIndex ? '16px' : '6px',


              background: idx === currentIndex ? '#f59e0b' : 'rgba(245,158,11,0.2)'


            }} className="h-[6px] rounded-[4px] transition-[all_0.3s_ease] cursor-pointer" />

          )}
                </div>
            </div>
        </div>);

}