import React, { useState, useRef, useEffect } from 'react';
import { Map, Upload, Save, Trash2, X, PlusCircle, AlertTriangle, Calendar, MapPin, Eye, CheckCircle2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import PremiumHeader from '../components/PremiumHeader';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';

interface HeatPoint {
  id: string;
  x: number;
  y: number;
  severity: 'baja' | 'media' | 'alta';
  description: string;
}

interface HeatmapData {
  id: string;
  title: string;
  image: string;
  points: HeatPoint[];
  createdAt: string;
}

export default function IncidentHeatmap() {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [title, setTitle] = useState('');
  const [savedMaps, setSavedMaps] = useState<HeatmapData[]>([]);
  const [activeSeverity, setActiveSeverity] = useState<'baja' | 'media' | 'alta'>('alta');
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = localStorage.getItem('incident_heatmap_db');
    if (saved) {
      try {
        setSavedMaps(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMapImage(event.target?.result as string);
        setPoints([]);
        setTitle('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapImage || !containerRef.current) return;
    
    // Prevent adding a new point if clicking on a hotspot itself
    if ((e.target as HTMLElement).closest('.hotspot-marker')) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint: HeatPoint = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      severity: activeSeverity,
      description: `Incidente de severidad ${activeSeverity}`
    };
    
    setPoints([...points, newPoint]);
    setEditingPointId(newPoint.id);
    toast.success('Punto agregado. Puedes editar su descripción en la barra lateral.');
  };

  const handleRemovePoint = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPoints(points.filter(p => p.id !== id));
    if (editingPointId === id) setEditingPointId(null);
  };

  const handleSave = () => {
    if (!mapImage) {
      toast.error('Sube un plano base primero');
      return;
    }
    if (!title.trim()) {
      toast.error('Agrega un título al mapa');
      return;
    }

    const newMap: HeatmapData = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      image: mapImage,
      points,
      createdAt: new Date().toISOString()
    };

    const updated = [newMap, ...savedMaps];
    setSavedMaps(updated);
    localStorage.setItem('incident_heatmap_db', JSON.stringify(updated));
    toast.success('Mapa de calor guardado correctamente');
  };

  const handleButtonClick = () => {
    if (!mapImage) {
      toast.error('Sube un plano base primero');
      return;
    }
    handleSave();
  };

  const loadMap = (m: HeatmapData) => {
    setMapImage(m.image);
    setPoints(m.points);
    setTitle(m.title);
    setEditingPointId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteSavedMap = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedMaps.filter(m => m.id !== id);
    setSavedMaps(updated);
    localStorage.setItem('incident_heatmap_db', JSON.stringify(updated));
    toast.success('Mapa eliminado');
    if (mapImage && !updated.find(m => m.image === mapImage)) {
      setMapImage(null);
      setPoints([]);
      setTitle('');
    }
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'alta') return '#ef4444'; // Red
    if (sev === 'media') return '#f59e0b'; // Amber
    return '#3b82f6'; // Blue
  };

  const getSeverityLabel = (sev: string) => {
    if (sev === 'alta') return 'Alta (Crítica)';
    if (sev === 'media') return 'Media (Moderada)';
    return 'Baja (Leve)';
  };

  return (
    <div className="container max-w-[1200px] mx-auto px-4 pb-32 animate-fade-in">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.85; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.35; }
          100% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.85; }
        }
        @keyframes pulse-center {
          0% { transform: translate(-50%, -50%) scale(0.9); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
          100% { transform: translate(-50%, -50%) scale(0.9); }
        }
        .ring-pulse {
          animation: pulse-ring 2s infinite ease-in-out;
        }
        .center-pulse {
          animation: pulse-center 1.5s infinite ease-in-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
      `}</style>

      <PremiumHeader 
        title="Mapa de Calor de Incidentes"
        subtitle="Identifica visualmente zonas críticas y focos de riesgo en tu planta"
        icon={<AlertTriangle size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 mt-6">
        {/* Left Panel: Map Editor */}
        <div className="flex flex-col gap-4">
          {!mapImage ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 md:p-16 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all hover:scale-[1.01] shadow-sm">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="upload-base-map" />
              <label htmlFor="upload-base-map" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                  <Upload size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Subir Plano Base</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
                  Sube una imagen (JPG, PNG) del croquis o planta para mapear los puntos calientes de accidentes.
                </p>
              </label>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 md:p-6 flex flex-col gap-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Título del Mapa (Ej: Planta Baja - Accidentes 2026)" 
                  className="w-full md:flex-1 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-extrabold text-base outline-none focus:border-orange-500 transition-colors"
                />
                <button 
                  onClick={() => {
                    if (window.confirm('¿Deseas descartar el mapa actual?')) {
                      setMapImage(null);
                      setPoints([]);
                      setTitle('');
                    }
                  }} 
                  style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none' }}
                  className="p-3 rounded-2xl cursor-pointer hover:bg-red-200 transition-colors flex items-center justify-center"
                  title="Borrar mapa actual"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              <div 
                ref={containerRef}
                onClick={handleMapClick}
                className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-crosshair bg-slate-950 shadow-inner"
              >
                <img 
                  src={mapImage} 
                  alt="Plano Base" 
                  className="w-full h-auto block select-none pointer-events-none" 
                />
                
                {/* Heat points overlay */}
                {points.map((p) => {
                  const color = getSeverityColor(p.severity);
                  const isHovered = hoveredPointId === p.id || editingPointId === p.id;
                  
                  return (
                    <div
                      key={p.id}
                      className="absolute hotspot-marker"
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        zIndex: isHovered ? 30 : 10,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto'
                      }}
                    >
                      {/* Animated outer ring */}
                      <div 
                        className="absolute rounded-full ring-pulse"
                        style={{
                          width: isHovered ? '70px' : '45px',
                          height: isHovered ? '70px' : '45px',
                          background: `radial-gradient(circle, ${color}35 0%, transparent 75%)`,
                          transform: 'translate(-50%, -50%)',
                          transition: 'all 0.2s'
                        }}
                      />

                      {/* Animated inner glow */}
                      <div 
                        className="absolute rounded-full ring-pulse"
                        style={{
                          width: isHovered ? '50px' : '30px',
                          height: isHovered ? '50px' : '30px',
                          background: `radial-gradient(circle, ${color}70 0%, transparent 70%)`,
                          transform: 'translate(-50%, -50%)',
                          animationDelay: '0.5s',
                          transition: 'all 0.2s'
                        }}
                      />

                      {/* Solid center pinpoint */}
                      <div 
                        className="absolute w-4 h-4 rounded-full bg-white border-2 shadow-md center-pulse cursor-pointer flex items-center justify-center hover:scale-125 transition-transform"
                        style={{
                          borderColor: color,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPointId(editingPointId === p.id ? null : p.id);
                        }}
                        onMouseEnter={() => setHoveredPointId(p.id)}
                        onMouseLeave={() => setHoveredPointId(null)}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-orange-500" /> Focos en plano: {points.length}</span>
                <span>Haz clic sobre el plano para posicionar un punto de incidentes.</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Side Tools */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
            <h3 className="m-0 text-base font-black flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <PlusCircle size={20} className="text-orange-500" /> Opciones de Foco
            </h3>
            
            <div>
              <label className="text-[0.7rem] font-extrabold text-slate-400 block mb-2 uppercase tracking-wider">Gravedad del Foco</label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'alta', label: 'Alta (Crítica)', color: '#ef4444', emoji: '🔴' },
                  { id: 'media', label: 'Media (Moderada)', color: '#f59e0b', emoji: '🟠' },
                  { id: 'baja', label: 'Baja (Leve)', color: '#3b82f6', emoji: '🔵' }
                ].map((s) => (
                  <button 
                    key={s.id}
                    onClick={() => setActiveSeverity(s.id as any)} 
                    style={{ 
                      borderColor: activeSeverity === s.id ? s.color : 'transparent',
                      background: activeSeverity === s.id ? `${s.color}15` : 'transparent',
                      color: activeSeverity === s.id ? s.color : 'var(--color-text)'
                    }}
                    className={`p-3 rounded-2xl text-sm font-extrabold text-left border-2 cursor-pointer transition-all flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900/50`}
                  >
                    <span>{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleButtonClick} 
              style={{ 
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
                color: '#ffffff', 
                opacity: mapImage ? 1 : 0.5, 
                border: 'none',
                marginTop: '0px'
              }}
              className="w-full p-3.5 rounded-2xl font-black text-sm cursor-pointer flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Save size={18} /> Guardar Mapa de Calor
            </button>
          </div>

          {/* Incident Points List Panel */}
          {mapImage && points.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
              <h3 className="m-0 text-base font-black flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <MapPin size={20} className="text-orange-500" /> Focos Registrados
              </h3>
              
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {points.map((p) => {
                  const color = getSeverityColor(p.severity);
                  const isEditing = editingPointId === p.id;
                  
                  return (
                    <div 
                      key={p.id}
                      className="p-3 rounded-2xl border-2 transition-all flex flex-col gap-2 relative bg-slate-50 dark:bg-slate-900"
                      style={{ 
                        borderColor: isEditing ? color : 'var(--color-input-border, #e2e8f0)',
                        boxShadow: isEditing ? `${color}15 0px 4px 12px` : 'none'
                      }}
                      onMouseEnter={() => setHoveredPointId(p.id)}
                      onMouseLeave={() => setHoveredPointId(null)}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span 
                          className="px-2 py-0.5 rounded-full text-[0.6rem] font-extrabold uppercase"
                          style={{ background: `${color}15`, color }}
                        >
                          {getSeverityLabel(p.severity)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setEditingPointId(isEditing ? null : p.id)}
                            style={{ color: isEditing ? '#10b981' : '#3b82f6', border: 'none', background: 'transparent' }}
                            className="p-1 cursor-pointer font-bold text-xs"
                          >
                            {isEditing ? 'Listo' : 'Editar'}
                          </button>
                          <button 
                            onClick={(e) => handleRemovePoint(p.id, e)}
                            style={{ color: '#ef4444', border: 'none', background: 'transparent' }}
                            className="p-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="flex flex-col gap-2 mt-1">
                          <textarea
                            value={p.description}
                            onChange={(e) => {
                              const updated = points.map(item => item.id === p.id ? { ...item, description: e.target.value } : item);
                              setPoints(updated);
                            }}
                            className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:border-orange-500 outline-none resize-none h-16"
                            placeholder="Describa el incidente..."
                          />
                          <div className="flex gap-1">
                            {['alta', 'media', 'baja'].map((s) => (
                              <button
                                key={s}
                                onClick={() => {
                                  const updated = points.map(item => item.id === p.id ? { ...item, severity: s as any } : item);
                                  setPoints(updated);
                                }}
                                className="flex-1 py-1 text-[0.65rem] font-bold rounded-lg cursor-pointer border"
                                style={{
                                  backgroundColor: p.severity === s ? getSeverityColor(s) : 'transparent',
                                  color: p.severity === s ? '#ffffff' : 'var(--color-text)',
                                  borderColor: getSeverityColor(s)
                                }}
                              >
                                {s === 'alta' ? 'Alta' : s === 'media' ? 'Media' : 'Baja'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="m-0 text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed truncate-2-lines">
                          {p.description || 'Sin descripción'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saved Maps Gallery */}
          {savedMaps.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
              <h3 className="m-0 text-base font-black flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Map size={20} className="text-orange-500" /> Mapas Guardados
              </h3>
              <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {savedMaps.map((m) => (
                  <div 
                    key={m.id} 
                    onClick={() => loadMap(m)}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-950 cursor-pointer transition-all flex flex-col gap-2 group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="m-0 text-sm font-black text-slate-800 dark:text-slate-100 flex-1 truncate pr-6">{m.title}</h4>
                      <button 
                        onClick={(e) => deleteSavedMap(m.id, e)} 
                        className="absolute right-3 top-3 text-slate-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-1"
                        title="Eliminar Mapa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="text-[0.7rem] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between mt-1">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(m.createdAt).toLocaleDateString()}</span>
                      <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md">{m.points.length} focos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
