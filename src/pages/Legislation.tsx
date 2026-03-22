import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    ArrowLeft, FileText, Download, Search,
    ExternalLink, BookOpen, Shield, Gavel, Sparkles, Loader2, Info, AlertCircle,
    Star, MessageSquare
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { legislationData, countryList } from '../data/legislationData';
import toast from 'react-hot-toast';

export default function Legislation(): React.ReactElement | null {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [userCountry, setUserCountry] = useState('argentina');

    React.useEffect(() => {
        const savedData = localStorage.getItem('personalData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.country) setUserCountry(parsed.country);
            } catch (err) {
                console.error('Error loading country from personalData:', err);
            }
        }
    }, []);

    const countryInfo = countryList.find(c => c.code === userCountry) || countryList[0];
    const docs = legislationData[userCountry] || [];

    const [summaries, setSummaries] = useState({});
    const [loadingDocs, setLoadingDocs] = useState(new Set());
    const [favorites, setFavorites] = useState(() => {
        return JSON.parse(localStorage.getItem('legislation_favorites') || '[]');
    });
    const [notes, setNotes] = useState(() => {
        return JSON.parse(localStorage.getItem('legislation_notes') || '{}');
    });
    const [expandedNote, setExpandedNote] = useState(null);

    const toggleFavorite = (id) => {
        setFavorites(prev => {
            const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
            localStorage.setItem('legislation_favorites', JSON.stringify(next));
            return next;
        });
        toast.success(favorites.includes(id) ? 'Removido de favoritos' : 'Añadido a favoritos', { icon: '⭐' });
    };

    const handleNoteChange = (id, text) => {
        setNotes(prev => {
            const next = { ...prev, [id]: text };
            localStorage.setItem('legislation_notes', JSON.stringify(next));
            return next;
        });
    };

    const handleSimplify = async (id, title, subtitle) => {
        if (loadingDocs.has(id)) return;

        setLoadingDocs(prev => new Set(prev).add(id));
        const loadingToast = toast.loading(`Analizando ${title}...`);

        try {
            const res = await fetch(`${API_BASE_URL}/api/ai-legal-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ley: `${title}: ${subtitle}`, country: userCountry })
            });

            if (!res.ok) throw new Error('Error al conectar con la IA');
            const data = await res.json();

            setSummaries(prev => ({ ...prev, [id]: data.summary }));
            toast.success('Resumen generado ✨', { id: loadingToast });
        } catch (error) {
            toast.error('No se pudo resumir la norma', { id: loadingToast });
        } finally {
            setLoadingDocs(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    // Sort: favorites first, then by title
    const sortedDocs = [...docs].sort((a, b) => {
        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0; // maintain original order for non-favorites
    });

    const filteredDocs = sortedDocs.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '1rem' }}>
                <button
                    onClick={() => navigate('/#tools')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Leyes y Normas</h1>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{countryInfo.flag}</span> Región: <strong>{countryInfo.name}</strong>
                    </p>
                </div>
            </div>

            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar ley, decreto o palabra clave..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '3rem', margin: 0 }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredDocs.map(doc => (
                    <div key={doc.id} className="card" style={{ padding: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                            <div>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '50px',
                                    background: doc.category === 'Leyes' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: doc.category === 'Leyes' ? 'var(--color-primary)' : '#10b981',
                                    marginBottom: '0.5rem',
                                    display: 'inline-block'
                                }}>
                                    {doc.category}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{doc.title}</h3>
                                    {favorites.includes(doc.id) && <Star size={16} fill="#facc15" color="#facc15" style={{ filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.4))' }} />}
                                </div>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 600 }}>{doc.subtitle}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => toggleFavorite(doc.id)}
                                    title={favorites.includes(doc.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
                                    style={{
                                        background: favorites.includes(doc.id) ? 'rgba(250, 204, 21, 0.1)' : 'var(--color-background)',
                                        border: `1px solid ${favorites.includes(doc.id) ? 'rgba(250, 204, 21, 0.3)' : 'transparent'}`,
                                        padding: '0.6rem', borderRadius: '10px', cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Star size={20} color={favorites.includes(doc.id) ? "#facc15" : "var(--color-text-muted)"} fill={favorites.includes(doc.id) ? "#facc15" : "none"} />
                                </button>
                                <button
                                    onClick={() => setExpandedNote(expandedNote === doc.id ? null : doc.id)}
                                    title="Notas privadas"
                                    style={{
                                        background: notes[doc.id] ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-background)',
                                        border: `1px solid ${notes[doc.id] ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
                                        padding: '0.6rem', borderRadius: '10px', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    <MessageSquare size={20} color={notes[doc.id] ? "var(--color-primary)" : "var(--color-text-muted)"} />
                                    {notes[doc.id] && <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />}
                                </button>
                            </div>
                        </div>

                        <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                            {doc.description}
                        </p>

                        {/* Notas Section */}
                        {expandedNote === doc.id && (
                            <div style={{
                                marginBottom: '1.2rem',
                                padding: '1rem',
                                background: 'var(--color-background)',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                animation: 'fadeIn 0.2s ease-out'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    <MessageSquare size={16} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Anotaciones Privadas</span>
                                </div>
                                <textarea
                                    value={notes[doc.id] || ''}
                                    onChange={(e) => handleNoteChange(doc.id, e.target.value)}
                                    placeholder="Escribe aquí observaciones, aplicación en planta, modificaciones recientes..."
                                    style={{
                                        width: '100%',
                                        minHeight: '80px',
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface)',
                                        color: 'var(--color-text)',
                                        fontSize: '0.9rem',
                                        resize: 'vertical'
                                    }}
                                />
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
                                    Se guarda automáticamente en tu dispositivo
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                            <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    flex: 1,
                                    minWidth: '120px',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.7rem',
                                    background: 'var(--color-primary)',
                                    color: '#ffffff',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700
                                }}
                            >
                                <ExternalLink size={16} /> Ver Online
                            </a>
                            <button
                                onClick={() => handleSimplify(doc.id, doc.title, doc.subtitle)}
                                disabled={loadingDocs.has(doc.id)}
                                style={{
                                    flex: 1,
                                    minWidth: '120px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.7rem',
                                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: loadingDocs.has(doc.id) ? 'wait' : 'pointer'
                                }}
                            >
                                {loadingDocs.has(doc.id) ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {loadingDocs.has(doc.id) ? 'RESUMIENDO...' : 'SIMPLIFICAR CON IA'}
                            </button>
                        </div>

                        {summaries[doc.id] && (
                            <div style={{
                                marginTop: '1.2rem',
                                padding: '1rem',
                                background: 'rgba(168, 85, 247, 0.05)',
                                border: '1px solid rgba(168, 85, 247, 0.2)',
                                borderRadius: '12px',
                                animation: 'fadeIn 0.3s ease-out'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#a855f7' }}>
                                    <Info size={16} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Resumen Simplificado</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: '1.5' }}>
                                    {summaries[doc.id]}
                                </p>
                            </div>
                        )}
                    </div>
                ))}

                {filteredDocs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                        <Search size={48} style={{ marginBottom: '1rem' }} />
                        <p>No se encontraron documentos para "{searchTerm}"</p>
                    </div>
                )}
            </div>

            <div className="card" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))', border: '1px dashed rgba(139, 92, 246, 0.3)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <BookOpen size={24} color="#8b5cf6" />
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Biblioteca Completa</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Accede al portal oficial de InfoLeg para más normativas.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
