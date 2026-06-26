import React, { useState, useEffect, useRef } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, Camera, Trash2, CheckCircle2, RefreshCw, Upload } from 'lucide-react';

export default function Photos(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { fromObservation, itemId } = location.state || {};
  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);

  // Load existing photos if any
  useEffect(() => {
    const current = localStorage.getItem('current_inspection');
    if (current) {
      const inspection = JSON.parse(current);
      if (fromObservation && itemId) {
        const obs = inspection.observations?.find((o) => o.itemId === itemId);
        if (obs && obs.photos) {
          setPhotos(obs.photos);
        }
      } else if (inspection.photos) {
        setPhotos(inspection.photos);
      }
    }
  }, [fromObservation, itemId]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files as FileList) as File[];
    let loadedCount = 0;
    const newPhotos = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push(reader.result as any);
        loadedCount++;
        if (loadedCount === files.length) {
          setPhotos((prev: any) => [...prev, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const triggerCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSave = () => {
    const current = localStorage.getItem('current_inspection');
    if (current) {
      const inspection = JSON.parse(current);

      if (fromObservation && itemId) {
        // Attach to specific observation
        if (!inspection.observations) inspection.observations = [];
        const obsIdx = inspection.observations.findIndex((o) => o.itemId === itemId);
        if (obsIdx >= 0) {
          inspection.observations[obsIdx].photos = photos;
          // Also set the first one as primary for old compatibility
          inspection.observations[obsIdx].photo = photos[0] || null;
        }
      } else {
        // General evidence
        inspection.photos = photos;
      }

      localStorage.setItem('current_inspection', JSON.stringify(inspection));
      console.log('[Photos] Saved to current_inspection. Observations:', inspection.observations?.length);
    }
    navigate('/checklist');
  };

  return (
    <div className="container pb-[5rem]">
            <div className="flex items-center gap-[1rem] mb-[2rem]">
                <></>
                <div>
                    <h1 className="m-[0] text-[1.5rem] font-[800]">Registro Fotográfico</h1>
                    <p className="m-[0] text-[0.85rem] text-[var(--color-text-muted)]">
                        {fromObservation ? `Evidencia para Hallazgo #${itemId}` : 'Evidencia general del relevamiento'}
                    </p>
                </div>
            </div>

            <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        multiple className="none" />

      

            <div












        onClick={triggerCapture} className="border-[2px_dashed_var(--color-primary)] rounded-[24px] min-h-[220px] flex flex-col items-center justify-center bg-[rgba(37,_99,_235,_0.03)] mb-[2rem] cursor-pointer p-[2rem] transition-[all_0.3s_ease]">
                <div className="bg-[var(--color-primary)] p-[1rem] rounded-[50%] mb-[1rem] box-shadow-[0_8px_16px_rgba(37,_99,_235,_0.2)]">
                    <Camera size={32} color="white" />
                </div>
                <p className="font-[800] text-center text-[var(--color-primary)] text-[1.1rem]">Toca para capturar fotos</p>
                <p className="text-[0.85rem] text-[var(--color-text-muted)] text-center mt-[0.5rem]">Podés subir múltiples imágenes de evidencia</p>
            </div>

            {photos.length > 0 &&
      <div className="grid grid-template-columns-[repeat(auto-fill,_minmax(140px,_1fr))] gap-[1rem] mb-[2rem]">
                    {photos.map((photo, index) =>
        <div key={index} className="relative rounded-[16px] overflow-[hidden] box-shadow-[0_4px_20px_rgba(0,0,0,0.15)] h-[140px]">
                            <img src={photo} alt={`Captura ${index}`} className="w-[100%] h-[100%] object-fit-[cover]" />
                            <button















            onClick={(e) => {e.stopPropagation();setPhotos(photos.filter((_, i) => i !== index));}} className="absolute top-[8px] right-[8px] w-[32px] h-[32px] bg-[#ef4444] text-[#ffffff] rounded-[10px] border-none cursor-pointer flex items-center justify-center box-shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            
                                <Trash2 size={16} />
                            </button>
                        </div>
        )}
                </div>
      }

            <div className="fixed bottom-[0] left-[0] right-[0] p-[1.5rem] bg-[var(--color-background)] border-top-[1px_solid_var(--color-border)] flex gap-[1rem] z-[100]">
                <button
          className="btn-outline flex-[1] flex items-center justify-center gap-[0.5rem] p-[1rem] rounded-[12px] font-[700]"
          onClick={triggerCapture}>

          
                    <Upload size={20} /> AGREGAR MÁS
                </button>
                <button
          className="btn-primary flex-[1] flex items-center justify-center gap-[0.5rem] p-[1rem] rounded-[12px] font-[800]"
          onClick={(e) => {e.preventDefault();requirePro(handleSave);}}>

          
                    <CheckCircle2 size={20} /> GUARDAR Y VOLVER
                </button>
            </div>
        </div>);

}