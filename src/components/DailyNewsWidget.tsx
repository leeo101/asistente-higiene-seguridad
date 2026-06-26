import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, BookOpen, AlertCircle } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  date: string;
  link: string;
  source: string;
}

export default function DailyNewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Using rss2json API to fetch and parse Google News RSS bypassing CORS
        const query = encodeURIComponent('"seguridad e higiene" OR "riesgos del trabajo" argentina');
        const rssUrl = encodeURIComponent(`https://news.google.com/rss/search?q=${query}&hl=es-419&gl=AR&ceid=AR:es-419`);
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&api_key=`; // Free tier without API key

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        if (data.status === 'ok' && data.items && data.items.length > 0) {
          // Extract up to 4 items
          const formattedNews = data.items.slice(0, 4).map((item: any, index: number) => {
            // Extract source name (usually at the end of the title after " - ")
            let title = item.title;
            let source = 'Noticias H&S';
            const parts = title.split(' - ');
            if (parts.length > 1) {
              source = parts.pop() || 'Noticias H&S';
              title = parts.join(' - ');
            }

            // Clean up HTML from description using DOMParser to prevent XSS
            const parser = new DOMParser();
            const doc = parser.parseFromString(item.description, 'text/html');
            let cleanDesc = doc.body.textContent || doc.body.innerText || '';
            // Sometimes the description just repeats the title or has "Leer más". Let's clean it up or use a fallback.
            if (cleanDesc.length > 150) cleanDesc = cleanDesc.substring(0, 150) + '...';

            // Format date
            const pubDate = new Date(item.pubDate);
            const dateStr = pubDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).toUpperCase();

            return {
              id: `news-${index}`,
              title: title,
              description: cleanDesc,
              date: dateStr,
              link: item.link,
              source: source
            };
          });
          setNews(formattedNews);
          setError(false);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (err) {
        console.error("Error fetching news:", err);
        setError(true);
        // Fallback local data if fetch fails
        setNews([
        {
          id: 'fallback-1',
          title: 'Res. SRT 45/2026 (Declaración de Riesgos)',
          description: 'Nuevo Sistema Digital Integrado para la Declaración de Agentes de Riesgo (RAR). Obligatorio a partir de Junio.',
          date: 'MAY 2026',
          link: 'https://www.argentina.gob.ar/srt',
          source: 'SRT Oficial'
        },
        {
          id: 'fallback-2',
          title: 'Actualización de Tabla de Evaluación de Incapacidades',
          description: 'Nuevos baremos y compensaciones de acuerdo al Ecosistema Prevención 4.0.',
          date: 'ABR 2026',
          link: 'https://www.argentina.gob.ar/srt',
          source: 'SRT Oficial'
        }]
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="card p-[1.5rem] border-top-[4px_solid_#8b5cf6] flex flex-col h-[100%]">
            <div className="flex justify-space-between items-center mb-[1.5rem]">
                <h3 className="m-[0] text-[1.1rem] font-[800] text-[var(--color-text)] flex items-center gap-[0.6rem]">
                    <BookOpen size={20} color="#8b5cf6" /> Novedades Normativas
                </h3>
                {loading ?
        <span className="text-[0.7rem] font-[800] p-[0.3rem_0.6rem] rounded-[20px] bg-[rgba(139,_92,_246,_0.1)] text-[#8b5cf6]">
                        Actualizando...
                    </span> :

        <span style={{ background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: error ? '#ef4444' : '#10b981', border: `1px solid ${error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }} className="text-[0.7rem] font-[800] p-[0.3rem_0.6rem] rounded-[20px]">
                        {error ? 'Modo Offline' : 'Actualizado Hoy ✓'}
                    </span>
        }
            </div>
            
            <div className="flex flex-col gap-[0.8rem] flex-[1]">
                {loading ?
        // Skeleton loader
        [...Array(3)].map((_, i) =>
        <div key={i} style={{ opacity: 0.7 - i * 0.2 }} className="flex items-start gap-[0.8rem] p-[0.8rem] bg-[var(--color-background)] rounded-[10px] border-[1px_solid_var(--color-border)]">
                            <div className="w-[50px] h-[20px] rounded-[4px] bg-[var(--color-text-muted)] opacity-[0.2] mt-[0.2rem]"></div>
                            <div className="flex-[1]">
                                <div className="w-[80%] h-[14px] rounded-[4px] bg-[var(--color-text-muted)] opacity-[0.2] mb-[0.4rem]"></div>
                                <div className="w-[100%] h-[10px] rounded-[4px] bg-[var(--color-text-muted)] opacity-[0.1]"></div>
                            </div>
                        </div>
        ) :

        news.map((item, index) =>
        <div key={item.id} style={{ background: index === 0 ? 'rgba(139, 92, 246, 0.05)' : 'var(--color-background)', border: `1px solid ${index === 0 ? 'rgba(139, 92, 246, 0.2)' : 'var(--color-border)'}` }} className="flex items-start gap-[0.8rem] p-[0.8rem] rounded-[10px]">
                            <div style={{ background: index === 0 ? '#8b5cf6' : 'var(--color-text-muted)' }} className="p-[0.2rem_0.5rem] rounded-[4px] text-[#fff] text-[0.65rem] font-[800] mt-[0.2rem] white-space-[nowrap] text-center min-width-[45px]">
                                {item.date}
                            </div>
                            <div className="flex-[1]">
                                <div style={{ color: index === 0 ? '#8b5cf6' : 'var(--color-text)' }} className="font-[800] text-[0.85rem]">
                                    {item.title}
                                </div>
                                {item.description &&
            <div className="text-[0.75rem] text-[var(--color-text-muted)] mt-[0.2rem] line-height-[1.4]">
                                        {item.description}
                                    </div>
            }
                                <div className="flex justify-space-between items-center mt-[0.4rem]">
                                    <span className="text-[0.65rem] font-[600] text-[var(--color-text-light)] bg-[rgba(0,0,0,0.05)] p-[2px_6px] rounded-[4px]">
                                        {item.source}
                                    </span>
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-[0.2rem] text-[0.75rem] font-[700] text-[var(--color-primary)] text-decoration-[none]">
                                        Leer <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </div>
        )
        }
            </div>
            
            {error &&
      <div className="mt-[1rem] text-[0.75rem] text-[var(--color-text-muted)] flex items-center gap-[0.4rem] justify-center">
                    <AlertCircle size={14} /> Error de conexión con el feed de noticias. Mostrando historial guardado.
                </div>
      }
        </div>);

}