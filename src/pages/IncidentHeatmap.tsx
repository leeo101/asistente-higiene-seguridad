import React, { useState, useRef, useEffect } from 'react';
import { Map, Upload, Save, Trash2, X, PlusCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

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
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapImage || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint: HeatPoint = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      severity: activeSeverity,
      description: 'Nuevo incidente'
    };
    
    setPoints([...points, newPoint]);
  };

  const handleRemovePoint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPoints(points.filter(p => p.id !== id));
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

  const loadMap = (m: HeatmapData) => {
    setMapImage(m.image);
    setPoints(m.points);
    setTitle(m.title);
  };

  const deleteSavedMap = (id: string) => {
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
    if (sev === 'alta') return 'rgba(239, 68, 68, 0.7)'; // Red
    if (sev === 'media') return 'rgba(245, 158, 11, 0.7)'; // Orange
    return 'rgba(59, 130, 246, 0.7)'; // Blue
  };
  
  const getSeverityShadow = (sev: string) => {
    if (sev === 'alta') return '0 0 30px 15px rgba(239, 68, 68, 0.5)';
    if (sev === 'media') return '0 0 30px 15px rgba(245, 158, 11, 0.5)';
    return '0 0 30px 15px rgba(59, 130, 246, 0.5)';
  };

  return (
    <div className="container pb-[4rem] animation-[fadeIn_0.4s_ease]">
      <div className="flex items-center gap-[1rem] mb-[2rem] mt-[1rem]">
        <AlertTriangle size={24} color="var(--color-primary)" />
        <h1 className="m-[0] text-[1.5rem] font-[800]">Mapa de Calor de Incidentes</h1>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-[1.5rem]">
        <div className="flex flex-col gap-[1rem]">
          {!mapImage ? (
            <div className="card p-[4rem_2rem] text-center border-[2px_dashed_var(--color-border)] flex flex-col items-center justify-center cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-all">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="upload-base-map" />
              <label htmlFor="upload-base-map" className="cursor-pointer flex flex-col items-center">
                <Upload size={48} className="text-[var(--color-primary)] opacity-50 mb-[1rem]" />
                <h3 className="text-[1.2rem] font-[800] mb-[0.5rem]">Subir Plano Base</h3>
                <p className="text-[var(--color-text-muted)] text-[0.9rem]">Selecciona una imagen JPG o PNG de la planta</p>
              </label>
            </div>
          ) : (
            <div className="card p-[1rem] flex flex-col gap-[1rem]">
              <div className="flex justify-between items-center gap-[1rem]">
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Título del Mapa (Ej: Planta Baja - Accidentes 2023)" 
                  className="input flex-1 font-[700] text-[1.1rem]"
                />
                <button onClick={() => setMapImage(null)} className="btn-secondary p-[0.6rem] text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] border-[#ef4444]">
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div 
                ref={containerRef}
                onClick={handleMapClick}
                className="relative w-full rounded-[12px] overflow-hidden border-[1px_solid_var(--color-border)] cursor-crosshair"
                style={{ minHeight: '400px', backgroundColor: '#1a1a1a' }}
              >
                <img src={mapImage} alt="Base map" className="w-full h-auto block select-none pointer-events-none" />
                
                {/* Heat points overlay */}
                {points.map((p) => (
                  <div
                    key={p.id}
                    className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: '40px',
                      height: '40px',
                      background: `radial-gradient(circle, ${getSeverityColor(p.severity)} 0%, transparent 70%)`,
                      boxShadow: getSeverityShadow(p.severity),
                      zIndex: 10
                    }}
                    onClick={(e) => handleRemovePoint(p.id, e)}
                  >
                    <div className="hidden group-hover:flex absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[var(--color-surface)] px-[8px] py-[4px] rounded-[6px] shadow-lg border-[1px_solid_var(--color-border)] text-[0.7rem] font-bold text-nowrap items-center gap-[4px]">
                      Remover <X size={12} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-[0.85rem] text-[var(--color-text-muted)]">
                <span>Total de puntos: <strong>{points.length}</strong></span>
                <span>Haz clic en el mapa para agregar un foco de incidencia.</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[1.5rem]">
          <div className="card p-[1.5rem]">
            <h3 className="m-[0_0_1rem_0] text-[1rem] font-[800] flex items-center gap-[0.5rem]">
              <PlusCircle size={18} color="var(--color-primary)" /> Herramientas
            </h3>
            
            <div className="mb-[1.5rem]">
              <label className="text-[0.8rem] font-[700] text-[var(--color-text-muted)] block mb-[0.5rem]">Intensidad del Foco (Próximo clic)</label>
              <div className="flex flex-col gap-[0.5rem]">
                <button 
                  onClick={() => setActiveSeverity('alta')} 
                  className={`p-[0.6rem] rounded-[8px] text-[0.85rem] font-[700] border-[1px_solid_rgba(239,68,68,0.3)] transition-all ${activeSeverity === 'alta' ? 'bg-[rgba(239,68,68,0.15)] text-[#ef4444]' : 'hover:bg-[rgba(239,68,68,0.05)] text-[var(--color-text)]'}`}
                >
                  🔴 Alta (Crítica)
                </button>
                <button 
                  onClick={() => setActiveSeverity('media')} 
                  className={`p-[0.6rem] rounded-[8px] text-[0.85rem] font-[700] border-[1px_solid_rgba(245,158,11,0.3)] transition-all ${activeSeverity === 'media' ? 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]' : 'hover:bg-[rgba(245,158,11,0.05)] text-[var(--color-text)]'}`}
                >
                  🟠 Media (Moderada)
                </button>
                <button 
                  onClick={() => setActiveSeverity('baja')} 
                  className={`p-[0.6rem] rounded-[8px] text-[0.85rem] font-[700] border-[1px_solid_rgba(59,130,246,0.3)] transition-all ${activeSeverity === 'baja' ? 'bg-[rgba(59,130,246,0.15)] text-[#3b82f6]' : 'hover:bg-[rgba(59,130,246,0.05)] text-[var(--color-text)]'}`}
                >
                  🔵 Baja (Leve)
                </button>
              </div>
            </div>

            <button onClick={handleSave} disabled={!mapImage} className="btn-primary w-full flex items-center justify-center gap-[0.5rem] py-[0.8rem]">
              <Save size={18} /> Guardar Mapa
            </button>
          </div>

          {savedMaps.length > 0 && (
            <div className="card p-[1.5rem]">
              <h3 className="m-[0_0_1rem_0] text-[1rem] font-[800] flex items-center gap-[0.5rem]">
                <Map size={18} color="var(--color-primary)" /> Mapas Guardados
              </h3>
              <div className="flex flex-col gap-[0.5rem]">
                {savedMaps.map((m) => (
                  <div key={m.id} className="p-[0.8rem] rounded-[10px] bg-[rgba(255,255,255,0.03)] border-[1px_solid_var(--color-border)] hover:bg-[rgba(255,255,255,0.06)] cursor-pointer transition-all group">
                    <div className="flex justify-between items-start mb-[0.3rem]">
                      <h4 onClick={() => loadMap(m)} className="m-[0] text-[0.85rem] font-[700] text-[var(--color-text)] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{m.title}</h4>
                      <button onClick={() => deleteSavedMap(m.id)} className="text-[var(--color-text-muted)] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div onClick={() => loadMap(m)} className="text-[0.7rem] text-[var(--color-text-muted)] flex justify-between">
                      <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                      <span>{m.points.length} focos</span>
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
