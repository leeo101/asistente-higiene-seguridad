import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft, FileText, Download, Search,
  ExternalLink, BookOpen, Shield, Gavel, Sparkles, Loader2, Info, AlertCircle,
  Star, MessageSquare } from
'lucide-react';
import { API_BASE_URL } from '../config';
import { legislationData, countryList, regionalData, municipalData } from '../data/legislationData';
import toast from 'react-hot-toast';
import { auth } from '../firebase';
import PremiumHeader from '../components/PremiumHeader';

export default function Legislation(): React.ReactElement | null {
  const navigate = useNavigate();

  // 1. Hooks de estado en la parte superior
  const [searchTerm, setSearchTerm] = useState('');
  const [userCountry, setUserCountry] = useState('argentina');
  const [selectedLevel, setSelectedLevel] = useState('all'); // all, national, regional, municipal
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [summaries, setSummaries] = useState({});
  const [loadingDocs, setLoadingDocs] = useState(new Set());

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('legislation_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('legislation_notes');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  // 2. Efecto para cargar país del perfil
  useEffect(() => {
    window.scrollTo(0, 0);
    const savedData = localStorage.getItem('personalData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.country) {
          const countryCode = parsed.country.toLowerCase();
          setUserCountry(countryCode);
        }
      } catch (err) {
        console.error('Error loading country from personalData:', err);
      }
    }
  }, []);

  // 3. Cálculos derivados (Filtrado y Ordenado)
  const countryInfo = countryList.find((c) => c.code === userCountry) || countryList[0];
  const docs = legislationData[userCountry] || [];
  const regions = regionalData[userCountry] || [];

  const filteredDocs = React.useMemo(() => {
    return docs.filter((doc) => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.subtitle && doc.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filtro por nivel (Ámbito) ESTRICTO
      if (selectedLevel === 'national') {
        if (doc.level !== 'national') return false;
      }

      if (selectedLevel === 'regional') {
        if (doc.level !== 'regional') return false;
        if (selectedRegion && doc.region && doc.region !== selectedRegion) return false;
      }

      if (selectedLevel === 'municipal') {
        if (doc.level !== 'municipal') return false;
        if (selectedRegion && doc.region && doc.region !== selectedRegion) return false;
        if (selectedMunicipality && doc.municipality && doc.municipality !== selectedMunicipality) return false;
      }

      return true;
    });
  }, [docs, searchTerm, selectedLevel, selectedRegion, selectedMunicipality]);

  const sortedDocs = React.useMemo(() => {
    return [...filteredDocs].sort((a, b) => {
      const aFav = (favorites || []).includes(a.id);
      const bFav = (favorites || []).includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [filteredDocs, favorites]);

  // 4. Manejadores de eventos
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem('legislation_favorites', JSON.stringify(next));
      toast.success(isFav ? 'Removido de favoritos' : 'Añadido a favoritos', { icon: '⭐' });
      return next;
    });
  };

  const handleNoteChange = (id: string, text: string) => {
    setNotes((prev: any) => {
      const next = { ...prev, [id]: text };
      localStorage.setItem('legislation_notes', JSON.stringify(next));
      return next;
    });
  };

  const handleSimplify = async (id: string, title: string, subtitle: string) => {
    if (loadingDocs.has(id)) return;

    setLoadingDocs((prev) => new Set(prev).add(id));
    const loadingToast = toast.loading(`Analizando ${title}...`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai-legal-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
        },
        body: JSON.stringify({ ley: `${title}: ${subtitle}`, country: userCountry })
      });

      if (!res.ok) throw new Error('Error al conectar con la IA');
      const data = await res.json();

      setSummaries((prev) => ({ ...prev, [id]: data.summary }));
      toast.success('Resumen generado ✨', { id: loadingToast });
    } catch (error) {
      toast.error('No se pudo resumir la norma', { id: loadingToast });
    } finally {
      setLoadingDocs((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="container pb-[3rem]">
            <PremiumHeader
        title="Legislación"
        subtitle="Biblioteca Legal y Normativa"
        icon={<Gavel size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
      

            <div className="flex justify-space-between items-center gap-[1rem] mb-[1.5rem] mt-[1.5rem] flex-wrap">
                <></>
                <div className="flex items-center gap-[0.5rem] bg-[var(--color-surface)] p-[0.5rem_1rem] rounded-[8px] border-[1px_solid_var(--color-border)]">
                    <span className="text-[0.85rem] font-[700] text-[var(--color-text-muted)]">País:</span>
                    <select
            value={userCountry}
            onChange={(e) => {
              setUserCountry(e.target.value);
              setSelectedLevel('all');
              setSelectedRegion('');
            }} className="bg-[transparent] border-none p-[0] text-[0.85rem] text-[var(--color-primary)] font-[700] cursor-pointer outline-[none]">










            
                        {countryList.map((c) =>
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            )}
                    </select>
                </div>
            </div>

            {/* Selectores de Nivel y Región */}
            <div className="card p-[1.2rem] mb-[1.5rem]">
                <div className="flex gap-[0.5rem] mb-[1rem] overflow-x-[auto] pb-[0.5rem]">
                    {[
          { id: 'all', label: 'Todo' },
          { id: 'national', label: 'Nacional' },
          { id: 'regional', label: countryInfo.regionsLabel },
          { id: 'municipal', label: 'Municipal' }].
          map((level) =>
          <button
            key={level.id}
            onClick={() => {
              setSelectedLevel(level.id);
              if (level.id === 'national' || level.id === 'all') setSelectedRegion('');
            }}
            style={{



              background: selectedLevel === level.id ? 'var(--color-primary)' : 'var(--color-background)',
              color: selectedLevel === level.id ? '#ffffff' : 'var(--color-text-muted)',





              boxShadow: selectedLevel === level.id ? '0 4px 10px rgba(59, 130, 246, 0.3)' : 'none'
            }} className="p-[0.5rem_1rem] rounded-[50px] border-none text-[0.8rem] font-[700] cursor-pointer white-space-[nowrap] transition-[all_0.2s]">
            
                            {level.label}
                        </button>
          )}
                </div>

                {(selectedLevel === 'regional' || selectedLevel === 'municipal') &&
        <div className="flex gap-[1rem] animation-[fadeIn_0.3s_ease-out]">
                        <div className="flex-[1]">
                            <label className="text-[0.65rem] font-[900] text-[var(--color-text-muted)] uppercase mb-[0.3rem] block">
                                Seleccionar {countryInfo.regionsLabel}
                            </label>
                            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)} className="w-[100%] p-[0.6rem] h-[auto] text-[0.9rem]">

              
                                <option value="">Todas las {countryInfo.regionsLabel}</option>
                                {regions.map((r) =>
              <option key={r} value={r}>{r}</option>
              )}
                            </select>
                        </div>

                        {selectedLevel === 'municipal' && selectedRegion && municipalData[userCountry]?.[selectedRegion] &&
          <div className="flex-[1] animation-[fadeIn_0.3s_ease-out]">
                                <label className="text-[0.65rem] font-[900] text-[var(--color-text-muted)] uppercase mb-[0.3rem] block">
                                    Municipio
                                </label>
                                <select
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)} className="w-[100%] p-[0.6rem] h-[auto] text-[0.9rem]">

              
                                    <option value="">Todos los Municipios</option>
                                    {(municipalData[userCountry][selectedRegion] || []).map((m) =>
              <option key={m} value={m}>{m}</option>
              )}
                                </select>
                            </div>
          }
                    </div>
        }
            </div>

            <div className="relative mb-[2rem]">
                <Search size={20} className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] text-[var(--color-text-muted)]" />
                <input
          type="text"
          placeholder="Buscar ley, decreto o palabra clave..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="pl-[3rem] m-[0]" />

        
            </div>

            <div className="flex flex-col gap-4">
                {sortedDocs.map((doc) =>
        <div key={doc.id} className="card p-[1.2rem]">
                        <div className="flex justify-space-between items-start mb-[0.8rem]">
                            <div>
                                <span style={{





                background: doc.category === 'Leyes' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: doc.category === 'Leyes' ? 'var(--color-primary)' : '#10b981'


              }} className="text-[0.7rem] font-[800] uppercase p-[0.2rem_0.6rem] rounded-[50px] mb-[0.5rem] inline-block">
                                    {doc.category}
                                </span>
                                <div className="flex items-center gap-[0.8rem]">
                                    <h3 className="m-[0] text-[1.1rem] font-[800]">{doc.title}</h3>
                                    {favorites.includes(doc.id) && <Star size={16} fill="#facc15" color="#facc15" className="filter-[drop-shadow(0_0_8px_rgba(250,_204,_21,_0.4))]" />}
                                </div>
                                <p className="m-[0.2rem_0_0] text-[0.9rem] text-[var(--color-primary)] font-[600]">{doc.subtitle}</p>
                            </div>
                            <div className="flex gap-[0.5rem]">
                                <button
                onClick={() => toggleFavorite(doc.id)}
                title={favorites.includes(doc.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
                style={{
                  background: favorites.includes(doc.id) ? 'rgba(250, 204, 21, 0.1)' : 'var(--color-background)',
                  border: `1px solid ${favorites.includes(doc.id) ? 'rgba(250, 204, 21, 0.3)' : 'transparent'}`


                }} className="p-[0.6rem] rounded-[10px] cursor-pointer transition-[all_0.2s]">
                
                                    <Star size={20} color={favorites.includes(doc.id) ? "#facc15" : "var(--color-text-muted)"} fill={favorites.includes(doc.id) ? "#facc15" : "none"} />
                                </button>
                                <button
                onClick={() => setExpandedNote(expandedNote === doc.id ? null : doc.id)}
                title="Notas privadas"
                style={{
                  background: notes[doc.id] ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-background)',
                  border: `1px solid ${notes[doc.id] ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`



                }} className="p-[0.6rem] rounded-[10px] cursor-pointer transition-[all_0.2s] relative">
                
                                    <MessageSquare size={20} color={notes[doc.id] ? "var(--color-primary)" : "var(--color-text-muted)"} />
                                    {notes[doc.id] && <div style={{ top: -2, right: -2 }} className="absolute w-[8] h-[8] bg-[#ef4444] rounded-[50%]" />}
                                </button>
                            </div>
                        </div>

                        <p className="m-[0_0_1.2rem_0] text-[0.85rem] text-[var(--color-text-muted)] line-height-[1.4]">
                            {doc.description}
                        </p>

                        {/* Notas Section */}
                        {expandedNote === doc.id &&
          <div className="mb-[1.2rem] p-[1rem] bg-[var(--color-background)] rounded-[12px] border-[1px_solid_var(--color-border)] animation-[fadeIn_0.2s_ease-out]">






            
                                <div className="flex items-center gap-[0.5rem] mb-[0.8rem] text-[var(--color-text-muted)]">
                                    <MessageSquare size={16} />
                                    <span className="text-[0.8rem] font-[700]">Anotaciones Privadas</span>
                                </div>
                                <textarea
              value={notes[doc.id] || ''}
              onChange={(e) => handleNoteChange(doc.id, e.target.value)}
              placeholder="Escribe aquí observaciones, aplicación en planta, modificaciones recientes..." className="w-[100%] min-h-[80px] p-[0.8rem] rounded-[8px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[0.9rem] resize-[vertical]" />











            
                                <div className="text-[0.7rem] text-[var(--color-text-muted)] mt-[0.5rem] text-right">
                                    Se guarda automáticamente en tu dispositivo
                                </div>
                            </div>
          }

                        <div className="flex gap-[0.8rem] flex-wrap">
                            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer" className="flex-[1] min-width-[120px] text-decoration-[none] flex items-center justify-center gap-[0.5rem] p-[0.7rem] bg-[var(--color-primary)] text-[#ffffff] rounded-[8px] text-[0.85rem] font-[700]">















              
                                <ExternalLink size={16} /> Ver Online
                            </a>
                            <button
              onClick={() => handleSimplify(doc.id, doc.title, doc.subtitle)}
              disabled={loadingDocs.has(doc.id)}
              style={{













                cursor: loadingDocs.has(doc.id) ? 'wait' : 'pointer'
              }} className="flex-[1] min-width-[120px] flex items-center justify-center gap-[0.5rem] p-[0.7rem] bg-[linear-gradient(135deg,_#a855f7,_#ec4899)] text-[#ffffff] border-none rounded-[8px] text-[0.85rem] font-[700]">
              
                                {loadingDocs.has(doc.id) ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {loadingDocs.has(doc.id) ? 'RESUMIENDO...' : 'SIMPLIFICAR CON IA'}
                            </button>
                        </div>

                        {summaries[doc.id] &&
          <div className="mt-[1.2rem] p-[1rem] bg-[rgba(168,_85,_247,_0.05)] border-[1px_solid_rgba(168,_85,_247,_0.2)] rounded-[12px] animation-[fadeIn_0.3s_ease-out]">






            
                                <div className="flex items-center gap-[0.5rem] mb-[0.5rem] text-[#a855f7]">
                                    <Info size={16} />
                                    <span className="text-[0.75rem] font-[800] uppercase">Resumen Simplificado</span>
                                </div>
                                <p className="m-[0] text-[0.85rem] text-[var(--color-text)] line-height-[1.5]">
                                    {summaries[doc.id]}
                                </p>
                            </div>
          }
                    </div>
        )}

                {filteredDocs.length === 0 &&
        <div className="text-center p-[3rem] opacity-[0.5]">
                        <Search size={48} className="mb-[1rem]" />
                        <p>No se encontraron documentos para "{searchTerm}"</p>
                    </div>
        }
            </div>

            <div className="card mt-[2rem] bg-[linear-gradient(135deg,_rgba(139,_92,_246,_0.1),_rgba(236,_72,_153,_0.1))] border-[1px_dashed_rgba(139,_92,_246,_0.3)]">
                <div className="flex gap-[1rem] items-center">
                    <BookOpen size={24} color="#8b5cf6" />
                    <div>
                        <h4 className="m-[0] text-[0.9rem] font-[800]">Biblioteca Completa</h4>
                        <p className="m-[0] text-[0.75rem] text-[var(--color-text-muted)]">Accede al portal oficial de InfoLeg para más normativas.</p>
                    </div>
                </div>
            </div>
        </div>);

}