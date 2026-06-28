import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Camera, CheckCircle2, Save, X, Flame, Plus, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import PremiumHeader from '../components/PremiumHeader';

const NFPA10_CHECKLIST = [
{ id: 'c1', text: 'Ubicación correcta y asignada' },
{ id: 'c2', text: 'Visibilidad y acceso sin obstrucciones' },
{ id: 'c3', text: 'Manómetro en zona verde (presión operable)' },
{ id: 'c4', text: 'Manguera y boquilla libres de obstrucciones / cortes' },
{ id: 'c5', text: 'Precinto de seguridad y pasador intactos' },
{ id: 'c6', text: 'Cartelería y señalización reglamentaria en buen estado' },
{ id: 'c7', text: 'Estado físico general (sin abolladuras ni corrosión)' }];


export default function ExtinguisherInspection() {
  const { requirePro } = usePaywall();
  const { id } = useParams();
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  const [extintor, setExtintor] = useState(null);
  const [checklist, setChecklist] = useState(
    NFPA10_CHECKLIST.map((item) => ({ ...item, status: null, notes: '', photos: [] }))
  );
  const [inspectorName, setInspectorName] = useState('');
  const [generalPhotos, setGeneralPhotos] = useState([]);
  const [generalObservations, setGeneralObservations] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Cargar inventario y buscar el extintor
    // Se compara tanto como string como número para compatibilidad con IDs viejos y nuevos
    const tryLoad = (storageKey: string) => {
      const dataRaw = localStorage.getItem(storageKey);
      if (!dataRaw) return null;
      try {
        const inventory = JSON.parse(dataRaw);
        return inventory.find((e: any) => String(e.id) === String(id)) || null;
      } catch {return null;}
    };

    // Primero busca en la BD unificada, luego en la vieja por si no migró
    const found = tryLoad('extinguishers_inventory') || tryLoad('extintores_inventory');

    if (found) {
      setExtintor(found);

      // Cargar checklist de la inspección anterior si existe
      const historyRaw = localStorage.getItem('extintores_history');
      if (historyRaw) {
        try {
          const history = JSON.parse(historyRaw);
          const extHistory = history.filter((h: any) => String(h.extintorId) === String(id) || String(h.extintorNum) === String(found.numero || found.chapa));
          if (extHistory.length > 0) {
            extHistory.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            const lastInsp = extHistory[0];
            if (lastInsp.items && Array.isArray(lastInsp.items) && lastInsp.items.length > 0) {
              setChecklist(lastInsp.items);
            }
            if (lastInsp.observaciones) {
              setGeneralObservations(lastInsp.observaciones);
            }
            // Opcionalmente podemos cargar las fotos generales también, pero suele ser mejor que sean nuevas en cada inspección
          }
        } catch (e) {}
      }
    } else {
      toast.error('Extintor no encontrado. Puede que no esté sincronizado.');
      navigate('/extintores');
    }

    // Cargar nombre del inspector
    const pData = localStorage.getItem('personalData');
    if (pData) {
      try {setInspectorName(JSON.parse(pData).name || '');} catch {}
    }
  }, [id, navigate]);

  const handleStatus = (index, status) => {
    const newChecklist = [...checklist];
    newChecklist[index].status = status;
    setChecklist(newChecklist);
  };

  const handleNotes = (index, text) => {
    const newChecklist = [...checklist];
    newChecklist[index].notes = text;
    setChecklist(newChecklist);
  };

  const handleItemTextChange = (index, text) => {
    const newChecklist = [...checklist];
    newChecklist[index].text = text;
    setChecklist(newChecklist);
  };

  const handleAddItem = () => {
    setChecklist([...checklist, { id: 'c' + Date.now(), text: '', status: null, notes: '', photos: [] }]);
  };

  const handleRemoveItem = (index) => {
    const newChecklist = [...checklist];
    newChecklist.splice(index, 1);
    setChecklist(newChecklist);
  };

  const handlePhoto = (index, files) => {
    if (!files.length) return;
    const newChecklist = [...checklist];
    const reader = new FileReader();
    reader.onloadend = () => {
      newChecklist[index].photos.push(reader.result);
      setChecklist(newChecklist);
    };
    reader.readAsDataURL(files[0]);
  };

  const removePhoto = (itemIndex, photoIndex) => {
    const newChecklist = [...checklist];
    newChecklist[itemIndex].photos.splice(photoIndex, 1);
    setChecklist(newChecklist);
  };

  const handleGeneralPhoto = (files) => {
    if (!files.length) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setGeneralPhotos([...generalPhotos, reader.result]);
    };
    reader.readAsDataURL(files[0]);
  };

  const removeGeneralPhoto = (index) => {
    const newPhotos = [...generalPhotos];
    newPhotos.splice(index, 1);
    setGeneralPhotos(newPhotos);
  };

  const setAllOk = () => {
    setChecklist(checklist.map((c) => ({ ...c, status: 'C' })));
  };

  const handleSave = async () => {
    if (checklist.some((c) => !c.status)) {
      toast.error('Por favor, completa todos los puntos del checklist.');
      return;
    }

    const calculatedResult = checklist.every((c) => c.status === 'C' || c.status === 'NA') ? 'APROBADO' : 'RECHAZADO';

    setIsSaving(true);
    const report = {
      id: Date.now().toString(),
      extintorId: extintor.id,
      extintorNum: extintor.numero || extintor.chapa || '',
      fecha: `${inspectionDate}T12:00:00.000Z`,
      inspector: inspectorName,
      items: checklist,
      fotos: generalPhotos,
      observaciones: generalObservations,
      resultado: calculatedResult
    };

    const historyRaw = localStorage.getItem('extintores_history');
    const history = historyRaw ? JSON.parse(historyRaw) : [];
    const newHistory = [report, ...history];

    localStorage.setItem('extintores_history', JSON.stringify(newHistory));
    await syncCollection('extintores_history', newHistory);

    // Update inventory date and add inspection for PDF
    const pdfInspection = {
      fechaVisita: report.fecha.split('T')[0],
      resultado: report.resultado === 'APROBADO' ? 'C' : 'NC',
      controles: {
        acceso: checklist[1]?.status || 'C',
        manometro: checklist[2]?.status || 'C',
        manguera: checklist[3]?.status || 'C',
        cilindro: checklist[6]?.status || 'C',
        senalizacion: checklist[5]?.status || 'C'
      },
      observacion: report.observaciones,
      fotos: report.fotos
    };

    const inventoryRaw = localStorage.getItem('extinguishers_inventory');
    const inventory = inventoryRaw ? JSON.parse(inventoryRaw) : [];
    const updatedInv = inventory.map((e: any) => {
      if (e.id === extintor.id) {
        const insps = e.inspections || [];
        return {
          ...e,
          ultimaInspeccion: report.resultado === 'APROBADO' ? report.fecha : e.ultimaInspeccion,
          inspections: [...insps, pdfInspection]
        };
      }
      return e;
    });
    localStorage.setItem('extinguishers_inventory', JSON.stringify(updatedInv));
    await syncCollection('extinguishers_inventory', updatedInv);

    setIsSaving(false);
    toast.success(`Inspección guardada: ${report.resultado}`);
    navigate('/extintores');
  };

  if (!extintor) return <div className="p-8 text-center text-slate-500">Cargando datos del equipo...</div>;

  return (
    <div className="container max-w-[600px] pb-[6rem]">
            <PremiumHeader
        title={`Inspección: ${extintor.numero}`}
        subtitle={`${extintor.tipo} - ${extintor.ubicacion} ${extintor.marca ? `(${extintor.marca})` : ''}`}
        icon={<ShieldCheck size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
      

            <div className="flex gap-[1rem] mb-[1.5rem] mt-[1.5rem] flex-wrap">
                <></>
            </div>

            <div className="card p-[1.2rem] mb-[1.5rem] bg-[var(--color-surface)] border-[2px_solid_var(--color-border)]">
                <div className="flex justify-space-between items-center mb-[1rem]">
                    <h3 className="m-[0] text-[0.9rem] font-[900] uppercase text-[var(--color-primary)]">Inspección NFPA 10</h3>
                    <button onClick={setAllOk} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }} className="p-[0.5rem_0.8rem] text-[0.75rem] font-[800] rounded-[8px] cursor-pointer shadow-sm transition-transform hover:-translate-y-0.5 flex items-center gap-1">
                        <CheckCircle2 size={16} /> MARCAR TODO OK
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    {checklist.map((item, idx) =>
                        <div key={item.id} className="p-[1rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[12px]">
                            <div className="flex items-start gap-[0.5rem] mb-[0.8rem]">
                                <span className="font-[800] text-[var(--color-primary)] mt-[0.4rem]">{idx + 1}.</span>
                                <textarea
                value={item.text}
                onChange={(e) => handleItemTextChange(idx, e.target.value)}
                placeholder="Detalle a inspeccionar..."

                className="hover:border-slate-300 focus:border-blue-500 focus:bg-white flex-[1] p-[0.4rem] text-[0.85rem] font-[600] border-[1px_solid_transparent] rounded-[8px] bg-[transparent] outline-[none] resize-[none] min-h-[40px] line-height-[1.4]" />
              
                                <button onClick={() => handleRemoveItem(idx)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none' }} className="p-[0.4rem] cursor-pointer rounded-[8px] transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className="ats-status-group mb-[0.8rem]">
                                <button className={`ats-status-btn ${item.status === 'C' ? 'active-ok' : ''}`} onClick={() => handleStatus(idx, 'C')}>C</button>
                                <button className={`ats-status-btn ${item.status === 'NC' ? 'active-fail' : ''}`} onClick={() => handleStatus(idx, 'NC')}>NC</button>
                                <button className={`ats-status-btn ${item.status === 'NA' ? 'active-na' : ''}`} onClick={() => handleStatus(idx, 'NA')}>N/A</button>
                                
                                <div className="flex gap-2 ml-auto">
                                    <label title="Tomar Foto" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '0.5rem', height: '36px' }} className="px-3 cursor-pointer flex items-center justify-center transition-transform hover:-translate-y-0.5">
                                        <Camera size={18} />
                                        <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhoto(idx, e.target.files)} style={{ display: 'none' }} />
                                    </label>
                                    <label title="Subir de Galería" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.5rem', height: '36px' }} className="px-3 cursor-pointer flex items-center justify-center transition-transform hover:-translate-y-0.5">
                                        <ImageIcon size={18} />
                                        <input type="file" accept="image/*" onChange={(e) => handlePhoto(idx, e.target.files)} style={{ display: 'none' }} />
                                    </label>
                                </div>
                            </div>

                            <div className="animate-fade-in flex flex-col gap-[0.5rem] mt-[0.5rem] pt-[0.5rem] border-top-[1px_dashed_var(--color-border)]">
                                <div className="flex gap-[0.5rem]">
                                    <input
                  type="text"
                  placeholder="Observaciones / Detalles..."
                  value={item.notes}
                  onChange={(e) => handleNotes(idx, e.target.value)} className="flex-[1] p-[0.6rem] text-[0.8rem] border-[1px_solid_var(--color-border)] rounded-[8px] bg-[var(--color-surface)] outline-[none]" />

                
                                </div>
                            </div>
                            
                            {item.photos.length > 0 &&
            <div className="animate-fade-in flex gap-[0.4rem] flex-wrap mt-[0.5rem]">
                                    {item.photos.map((p, pIdx) =>
              <div key={pIdx} className="relative w-[45px] h-[45px] rounded-[6px] overflow-[hidden]">
                                            <img src={p} alt="Evidencia" className="w-[100%] h-[100%] object-fit-[cover]" />
                                            <button onClick={() => removePhoto(idx, pIdx)} className="absolute top-[0] right-[0] bg-[#ef4444] text-[#fff] border-none w-[16px] h-[16px] text-[10px] flex items-center justify-center cursor-pointer">✕</button>
                                        </div>
              )}
                                </div>
            }
                        </div>
          )}
                    
                    <button onClick={handleAddItem} style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '2px dashed #bfdbfe' }} className="p-[0.5rem_1rem] mt-2 rounded-[10px] font-[800] text-[0.8rem] cursor-pointer flex justify-center items-center gap-[0.5rem] transition-colors hover:bg-blue-100 mx-auto">
                        <Plus size={16} /> AGREGAR PREGUNTA AL CHECKLIST
                    </button>
                </div>
            </div>

            <div className="card p-[1.2rem] mb-[1.5rem] bg-[var(--color-surface)] border-[2px_solid_var(--color-border)]">
                <div className="flex justify-space-between items-center">
                    <label className="block text-[0.85rem] font-[800] text-[var(--color-text)] uppercase">Evidencia General</label>
                    <div className="flex gap-2">
                        <label style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '0.5rem', fontWeight: 700 }} className="p-[0.5rem_1rem] cursor-pointer flex items-center gap-[0.5rem] text-[0.8rem] transition-transform hover:-translate-y-0.5">
                            <Camera size={16} /> Cámara
                            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleGeneralPhoto(e.target.files)} style={{ display: 'none' }} />
                        </label>
                        <label style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.5rem', fontWeight: 700 }} className="p-[0.5rem_1rem] cursor-pointer flex items-center gap-[0.5rem] text-[0.8rem] transition-transform hover:-translate-y-0.5">
                            <ImageIcon size={16} /> Galería
                            <input type="file" accept="image/*" onChange={(e) => handleGeneralPhoto(e.target.files)} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>
                {generalPhotos.length > 0 &&
        <div className="flex gap-[0.8rem] flex-wrap mt-[1rem]">
                        {generalPhotos.map((p, pIdx) =>
          <div key={pIdx} className="relative w-[80px] h-[80px] rounded-[10px] overflow-[hidden] border-[2px_solid_var(--color-border)]">
                                <img src={p} alt="Evidencia" className="w-[100%] h-[100%] object-fit-[cover]" />
                                <button onClick={() => removeGeneralPhoto(pIdx)} className="absolute top-[0] right-[0] bg-[#ef4444] text-[#fff] border-none w-[22px] h-[22px] text-[12px] flex items-center justify-center cursor-pointer">✕</button>
                            </div>
          )}
                    </div>
        }
            </div>

            <div className="card p-[1.2rem] mb-[1.5rem] bg-[var(--color-surface)] border-[2px_solid_var(--color-border)]">
                <label className="block text-[0.85rem] font-[800] text-[var(--color-text)] uppercase mb-[0.8rem]">Observaciones Generales</label>
                <textarea
          value={generalObservations}
          onChange={(e) => setGeneralObservations(e.target.value)}
          placeholder="Agregue comentarios adicionales sobre la inspección..." className="w-[100%] p-[0.8rem] rounded-[10px] border-[1px_solid_var(--color-border)] outline-[none] min-h-[80px] resize-[vertical]" />

        
            </div>

            <div className="card p-[1.2rem] bg-[var(--color-surface)] border-[2px_solid_var(--color-border)] mb-[4rem]">
                <div className="mb-[1rem]">
                    <label className="block text-[0.75rem] font-[800] text-[var(--color-text-muted)] mb-[0.5rem] uppercase">Fecha de Inspección</label>
                    <input
            type="date"
            value={inspectionDate}
            onChange={(e) => setInspectionDate(e.target.value)} className="w-[100%] p-[0.8rem] rounded-[10px] border-[1px_solid_var(--color-border)] outline-[none] font-[700] font-family-[inherit]" />

          
                </div>
                <div>
                    <label className="block text-[0.75rem] font-[800] text-[var(--color-text-muted)] mb-[0.5rem] uppercase">Firma del Inspector</label>
                    <input
            type="text"
            placeholder="Nombre completo"
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)} className="w-[100%] p-[0.8rem] rounded-[10px] border-[1px_solid_var(--color-border)] outline-[none] font-[700]" />

          
                </div>
            </div>

            {/* Mobile Floating Save Button */}
            <div style={{ position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '400px', zIndex: 10, padding: '0 1rem' }}>
                <button
          onClick={(e) => {e.preventDefault();requirePro(handleSave);}}
          disabled={isSaving} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }} className="w-[100%] p-[0.8rem] rounded-[12px] font-[900] text-[0.9rem] cursor-pointer flex justify-center items-center gap-[0.5rem] shadow-[0_8px_25px_rgba(16,185,129,0.4)] transition-transform hover:-translate-y-1">

          
                    <Save size={20} /> {isSaving ? 'GUARDANDO...' : 'FINALIZAR INSPECCIÓN'}
                </button>
            </div>
        </div>);

}