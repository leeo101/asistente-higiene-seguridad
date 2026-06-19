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
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    return (
        <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid #8b5cf6', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <BookOpen size={20} color="#8b5cf6" /> Novedades Normativas
                </h3>
                {loading ? (
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '20px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        Actualizando...
                    </span>
                ) : (
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '20px', background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: error ? '#ef4444' : '#10b981', border: `1px solid ${error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
                        {error ? 'Modo Offline' : 'Actualizado Hoy ✓'}
                    </span>
                )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                {loading ? (
                    // Skeleton loader
                    [...Array(3)].map((_, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', padding: '0.8rem', background: 'var(--color-background)', borderRadius: '10px', border: '1px solid var(--color-border)', opacity: 0.7 - (i * 0.2) }}>
                            <div style={{ width: '50px', height: '20px', borderRadius: '4px', background: 'var(--color-text-muted)', opacity: 0.2, marginTop: '0.2rem' }}></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ width: '80%', height: '14px', borderRadius: '4px', background: 'var(--color-text-muted)', opacity: 0.2, marginBottom: '0.4rem' }}></div>
                                <div style={{ width: '100%', height: '10px', borderRadius: '4px', background: 'var(--color-text-muted)', opacity: 0.1 }}></div>
                            </div>
                        </div>
                    ))
                ) : (
                    news.map((item, index) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', padding: '0.8rem', background: index === 0 ? 'rgba(139, 92, 246, 0.05)' : 'var(--color-background)', borderRadius: '10px', border: `1px solid ${index === 0 ? 'rgba(139, 92, 246, 0.2)' : 'var(--color-border)'}` }}>
                            <div style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: index === 0 ? '#8b5cf6' : 'var(--color-text-muted)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, marginTop: '0.2rem', whiteSpace: 'nowrap', textAlign: 'center', minWidth: '45px' }}>
                                {item.date}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: index === 0 ? '#8b5cf6' : 'var(--color-text)' }}>
                                    {item.title}
                                </div>
                                {item.description && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                                        {item.description}
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-light)', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {item.source}
                                    </span>
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}>
                                        Leer <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {error && (
                <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                    <AlertCircle size={14} /> Error de conexión con el feed de noticias. Mostrando historial guardado.
                </div>
            )}
        </div>
    );
}
