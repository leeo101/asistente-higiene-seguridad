import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Camera,
  CheckCircle2,
  Save,
  X,
  Plus,
  Image as ImageIcon,
  ArrowLeft,
  Flame,
  ClipboardCheck,
  FileText,
  Calendar,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import PremiumHeader from '../components/PremiumHeader';
import { compressImage } from '../utils/imageCompressor';
import { safeJsonParse } from '../utils/storageHelper';

const NFPA10_CHECKLIST = [
  { id: 'c1', text: 'Ubicación correcta y asignada' },
  { id: 'c2', text: 'Visibilidad y acceso sin obstrucciones' },
  { id: 'c3', text: 'Manómetro en zona verde (presión operable)' },
  { id: 'c4', text: 'Manguera y boquilla libres de obstrucciones / cortes' },
  { id: 'c5', text: 'Precinto de seguridad y pasador intactos' },
  { id: 'c6', text: 'Cartelería y señalización reglamentaria en buen estado' },
  { id: 'c7', text: 'Estado físico general (sin abolladuras ni corrosión)' }
];

export default function ExtinguisherInspection() {
  const { requirePro } = usePaywall();
  const { id } = useParams();
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  const [extintor, setExtintor] = useState<any>(null);
  const [checklist, setChecklist] = useState(
    NFPA10_CHECKLIST.map((item) => ({ ...item, status: null as string | null, notes: '', photos: [] as string[] }))
  );
  const [inspectorName, setInspectorName] = useState('');
  const [generalPhotos, setGeneralPhotos] = useState<string[]>([]);
  const [generalObservations, setGeneralObservations] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const { currentUser } = useAuth();
  const [isVisitorView, setIsVisitorView] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const tryLoad = (storageKey: string) => {
      const dataRaw = localStorage.getItem(storageKey);
      if (!dataRaw) return null;
      try {
        const inventory = JSON.parse(dataRaw);
        return (
          inventory.find(
            (e: any) =>
              String(e.id) === String(id) ||
              String(e.numero) === String(id) ||
              String(e.chapa) === String(id)
          ) || null
        );
      } catch {
        return null;
      }
    };

    let found =
      tryLoad('extinguishers_inventory') ||
      tryLoad('extintores_inventory') ||
      tryLoad('extintores_db');

    if (!found && id) {
      found = {
        id: id,
        numero: id,
        tipo: 'ABC (PQS)',
        ubicacion: 'Planta Principal',
        marca: 'Registrado H&S',
        vencimientoRecarga: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vencimientoPH: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isSimulated: true
      };
    }

    if (found) {
      setExtintor(found);

      const historyRaw = localStorage.getItem('extintores_history');
      if (historyRaw) {
        try {
          const history = JSON.parse(historyRaw);
          const extHistory = history.filter(
            (h: any) =>
              String(h.extintorId) === String(id) ||
              String(h.extintorNum) === String(found.numero || found.chapa)
          );
          if (extHistory.length > 0) {
            extHistory.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            const lastInsp = extHistory[0];
            if (lastInsp.items && Array.isArray(lastInsp.items) && lastInsp.items.length > 0) {
              setChecklist(lastInsp.items);
            }
            if (lastInsp.observaciones) {
              setGeneralObservations(lastInsp.observaciones);
            }
          }
        } catch (e) {}
      }
    }

    if (!currentUser) {
      setIsVisitorView(true);
    }

    const pData = localStorage.getItem('personalData');
    if (pData) {
      try {
        setInspectorName(JSON.parse(pData).name || '');
      } catch {}
    }
  }, [id, currentUser]);

  const handleStatus = (index: number, status: string) => {
    const newChecklist = [...checklist];
    newChecklist[index].status = status;
    setChecklist(newChecklist);
  };

  const handleNotes = (index: number, text: string) => {
    const newChecklist = [...checklist];
    newChecklist[index].notes = text;
    setChecklist(newChecklist);
  };

  const handleItemTextChange = (index: number, text: string) => {
    const newChecklist = [...checklist];
    newChecklist[index].text = text;
    setChecklist(newChecklist);
  };

  const handleAddItem = () => {
    setChecklist([...checklist, { id: 'c' + Date.now(), text: '', status: null, notes: '', photos: [] }]);
  };

  const handleRemoveItem = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist.splice(index, 1);
    setChecklist(newChecklist);
  };

  const handlePhoto = async (index: number, files: FileList | null) => {
    if (!files || !files.length) return;
    try {
      const compressed = await compressImage(files[0]);
      const newChecklist = [...checklist];
      newChecklist[index].photos.push(compressed);
      setChecklist(newChecklist);
    } catch (e) {
      console.warn('[ExtinguisherInspection] Error compressing photo:', e);
    }
  };

  const removePhoto = (itemIndex: number, photoIndex: number) => {
    const newChecklist = [...checklist];
    newChecklist[itemIndex].photos.splice(photoIndex, 1);
    setChecklist(newChecklist);
  };

  const handleGeneralPhoto = async (files: FileList | null) => {
    if (!files || !files.length) return;
    try {
      const compressed = await compressImage(files[0]);
      setGeneralPhotos((prev) => [...prev, compressed]);
    } catch (e) {
      console.warn('[ExtinguisherInspection] Error compressing general photo:', e);
    }
  };

  const removeGeneralPhoto = (index: number) => {
    const newPhotos = [...generalPhotos];
    newPhotos.splice(index, 1);
    setGeneralPhotos(newPhotos);
  };

  const setAllOk = () => {
    setChecklist(checklist.map((c) => ({ ...c, status: 'C' })));
    toast.success('Todos los puntos marcados como CONFORME');
  };

  const handleSave = async () => {
    if (checklist.some((c) => !c.status)) {
      toast.error('Por favor, completa todos los puntos del checklist.');
      return;
    }

    const calculatedResult = checklist.every((c) => c.status === 'C' || c.status === 'NA')
      ? 'APROBADO'
      : 'RECHAZADO';

    setIsSaving(true);
    const toastId = toast.loading('Guardando inspección...');

    try {
      const extNumero = extintor.numero || extintor.chapa || extintor.id || 'S-N';
      const report = {
        id: Date.now().toString(),
        extintorId: extintor.id,
        extintorNum: extNumero,
        fecha: `${inspectionDate}T12:00:00.000Z`,
        inspector: (inspectorName || '').trim() || 'Inspector HSE',
        items: checklist,
        fotos: generalPhotos,
        observaciones: generalObservations,
        resultado: calculatedResult
      };

      // 1. Guardar en extintores_history
      let newHistory: any[] = [];
      try {
        const history = safeJsonParse<any[]>(localStorage.getItem('extintores_history'), []);
        newHistory = [report, ...history];
        localStorage.setItem('extintores_history', JSON.stringify(newHistory));
      } catch (quotaErr) {
        console.warn('[ExtinguisherInspection] Quota error on history, sanitizing photos:', quotaErr);
        const sanitizedReport = {
          ...report,
          fotos: [],
          items: checklist.map((i) => ({ ...i, photos: [] }))
        };
        const history = safeJsonParse<any[]>(localStorage.getItem('extintores_history'), []);
        newHistory = [sanitizedReport, ...history.slice(0, 30)];
        localStorage.setItem('extintores_history', JSON.stringify(newHistory));
      }

      try {
        await syncCollection('extintores_history', newHistory);
      } catch (syncErr) {
        console.warn('[ExtinguisherInspection] syncCollection history warning:', syncErr);
      }

      // 2. Actualizar o insertar en extinguishers_inventory
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

      const inventory = safeJsonParse<any[]>(localStorage.getItem('extinguishers_inventory'), []);

      let matchFound = false;
      let updatedInv = inventory.map((e: any) => {
        const isMatch =
          (e.id && String(e.id) === String(extintor.id)) ||
          (e.numero && String(e.numero) === String(extNumero)) ||
          (e.chapa && String(e.chapa) === String(extNumero));
        if (isMatch) {
          matchFound = true;
          const insps = e.inspections || [];
          return {
            ...e,
            ultimaInspeccion: report.resultado === 'APROBADO' ? report.fecha : e.ultimaInspeccion,
            inspections: [...insps, pdfInspection]
          };
        }
        return e;
      });

      if (!matchFound) {
        const newExtEntry = {
          ...extintor,
          id: extintor.id || Date.now().toString(),
          numero: extNumero,
          ultimaInspeccion: report.resultado === 'APROBADO' ? report.fecha : undefined,
          inspections: [pdfInspection]
        };
        updatedInv = [newExtEntry, ...inventory];
      }

      try {
        localStorage.setItem('extinguishers_inventory', JSON.stringify(updatedInv));
      } catch (invQuotaErr) {
        console.warn('[ExtinguisherInspection] Quota error on inventory, optimizing:', invQuotaErr);
        const cleanInv = updatedInv.map((item: any, idx: number) => {
          if (idx > 5 && item.inspections) {
            return {
              ...item,
              inspections: item.inspections.map((i: any) => ({ ...i, fotos: [] }))
            };
          }
          return item;
        });
        localStorage.setItem('extinguishers_inventory', JSON.stringify(cleanInv));
      }

      try {
        await syncCollection('extinguishers_inventory', updatedInv);
      } catch (syncInvErr) {
        console.warn('[ExtinguisherInspection] syncCollection inventory warning:', syncInvErr);
      }

      toast.success(`Inspección guardada: ${report.resultado}`, { id: toastId });
      setTimeout(() => {
        navigate('/extintores');
      }, 500);
    } catch (error: any) {
      console.error('[ExtinguisherInspection] Error al guardar inspección:', error);
      toast.error('Error al guardar la inspección. Intente nuevamente.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (!extintor) return <div className="p-8 text-center text-slate-500">Cargando datos del equipo...</div>;

  if (isVisitorView) {
    const isExpired = extintor.vencimientoRecarga && new Date(extintor.vencimientoRecarga) < new Date();
    return (
      <div className="container max-w-[600px] py-8 px-4 mx-auto animate-fade-in">
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 text-center relative overflow-hidden mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-3">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-2xl font-black mb-1">Verificación de Extintor</h1>
          <p className="text-xs text-slate-400 font-mono mb-4">FICHA DE CONTROL PÚBLICA — AUDITADO H&amp;S</p>

          <div
            className={`inline-block px-4 py-2 rounded-full font-black text-sm uppercase tracking-wider mb-2 ${
              isExpired
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {isExpired ? '⚠️ VENCIDO / REQUIERE INSPECCIÓN' : '🟢 APROBADO Y HABILITADO'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-6 space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            Ficha Técnica del Equipo
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Nº Chapa / ID</span>
              <strong className="text-base text-slate-900 dark:text-white">
                {extintor.numero || extintor.chapa || extintor.id}
              </strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Tipo Agente</span>
              <strong className="text-slate-900 dark:text-white">{extintor.tipo || 'PQS ABC'}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Ubicación / Sector</span>
              <strong className="text-slate-900 dark:text-white">{extintor.ubicacion || 'Planta Principal'}</strong>
            </div>
            {extintor.marca && (
              <div>
                <span className="text-xs text-slate-500 block">Marca</span>
                <strong className="text-slate-900 dark:text-white">{extintor.marca}</strong>
              </div>
            )}
            {extintor.vencimientoRecarga && (
              <div>
                <span className="text-xs text-slate-500 block">Vencimiento Recarga</span>
                <strong className={isExpired ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>
                  {extintor.vencimientoRecarga}
                </strong>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Puntos de Control Auditados (NFPA 10)
          </h3>
          <ul className="space-y-2 text-xs">
            {checklist.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="font-medium text-slate-700 dark:text-slate-300">{item.text}</span>
                <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">CONFORME</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center pt-2 space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>🔑 Acceso para Inspectores EHS (Registrar Control)</span>
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = checklist.filter((c) => c.status !== null && c.status !== undefined).length;
  const hasNC = checklist.some((c) => c.status === 'NC');
  const allAnswered = checklist.length > 0 && answeredCount === checklist.length;

  return (
    <div className="container max-w-[820px] mx-auto px-4 pb-28 pt-4">
      <PremiumHeader
        onBack={() => navigate('/extintores')}
        title={`Inspección: #${extintor.numero}`}
        subtitle={`${extintor.tipo} · ${extintor.ubicacion}${extintor.marca ? ` (${extintor.marca})` : ''}`}
        icon={<ShieldCheck size={34} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
      />

      {/* Tarjeta Principal de Inspección NFPA 10 */}
      <div className="glass-card mt-6 bg-white dark:bg-slate-800 p-5 sm:p-7 mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-200 dark:border-slate-700 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ClipboardCheck size={22} />
            </div>
            <div>
              <h3 className="m-0 text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Inspección NFPA 10
              </h3>
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <MapPin size={12} className="text-rose-500" /> {extintor.ubicacion || 'Planta Principal'} ·{' '}
                <span
                  className={
                    hasNC
                      ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                      : allAnswered
                      ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                      : 'text-amber-600 dark:text-amber-400 font-extrabold'
                  }
                >
                  {answeredCount}/{checklist.length} puntos evaluados
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={setAllOk}
            style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
            className="px-4 py-2.5 text-xs font-extrabold rounded-xl cursor-pointer shadow-sm transition-all hover:opacity-90 hover:-translate-y-0.5 flex items-center gap-1.5"
          >
            <CheckCircle2 size={16} /> MARCAR TODO OK
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {checklist.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                item.status === 'NC'
                  ? 'bg-red-50/60 dark:bg-red-950/25 border-red-300 dark:border-red-900/60 shadow-xs'
                  : item.status === 'C'
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/40 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-2.5 mb-3">
                <div className="font-black text-white text-xs text-center bg-slate-800 dark:bg-slate-600 py-1 px-2 rounded-lg shadow-xs shrink-0 mt-0.5 min-w-[28px]">
                  {idx + 1}
                </div>
                <textarea
                  value={item.text}
                  onChange={(e) => handleItemTextChange(idx, e.target.value)}
                  placeholder="Detalle a inspeccionar..."
                  rows={1}
                  className="flex-1 p-1 text-sm font-bold text-slate-900 dark:text-slate-100 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg bg-transparent outline-none resize-none leading-snug"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none' }}
                  className="p-1.5 cursor-pointer rounded-lg transition-colors shrink-0 hover:opacity-80"
                  title="Eliminar pregunta"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="inline-flex rounded-xl p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 gap-1">
                  <button
                    type="button"
                    onClick={() => handleStatus(idx, 'C')}
                    style={{
                      backgroundColor: item.status === 'C' ? '#059669' : 'transparent',
                      color: item.status === 'C' ? '#ffffff' : undefined,
                      border: 'none'
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                      item.status === 'C'
                        ? 'shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    ✓ C (Conforme)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatus(idx, 'NC')}
                    style={{
                      backgroundColor: item.status === 'NC' ? '#dc2626' : 'transparent',
                      color: item.status === 'NC' ? '#ffffff' : undefined,
                      border: 'none'
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                      item.status === 'NC'
                        ? 'shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    ✕ NC (No Conforme)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatus(idx, 'NA')}
                    style={{
                      backgroundColor: item.status === 'NA' ? '#475569' : 'transparent',
                      color: item.status === 'NA' ? '#ffffff' : undefined,
                      border: 'none'
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                      item.status === 'NA'
                        ? 'shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    N/A
                  </button>
                </div>

                <div className="flex gap-1.5 ml-auto">
                  <label
                    title="Tomar Foto"
                    style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', border: 'none' }}
                    className="px-3 h-9 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs font-extrabold transition-transform hover:-translate-y-0.5"
                  >
                    <Camera size={16} /> Foto
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePhoto(idx, e.target.files)}
                      className="hidden"
                    />
                  </label>
                  <label
                    title="Subir de Galería"
                    style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none' }}
                    className="px-3 h-9 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs font-extrabold transition-transform hover:-translate-y-0.5"
                  >
                    <ImageIcon size={16} /> Galería
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhoto(idx, e.target.files)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                <input
                  type="text"
                  placeholder="Observaciones / Detalles de este punto..."
                  value={item.notes}
                  onChange={(e) => handleNotes(idx, e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {item.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2.5">
                  {item.photos.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs"
                    >
                      <img src={p} alt="Evidencia" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx, pIdx)}
                        className="absolute top-0 right-0 bg-red-500 text-white border-none w-5 h-5 text-[10px] flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddItem}
            style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '2px dashed #bfdbfe' }}
            className="px-4 py-2.5 mt-1 rounded-xl font-extrabold text-xs cursor-pointer flex justify-center items-center gap-2 transition-colors hover:bg-blue-100 mx-auto"
          >
            <Plus size={16} /> AGREGAR PREGUNTA AL CHECKLIST
          </button>
        </div>
      </div>

      {/* Evidencia General */}
      <div className="glass-card bg-white dark:bg-slate-800 p-5 sm:p-6 mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Camera size={18} />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase">
                Evidencia General
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Fotografías generales del matafuego y su ubicación ({generalPhotos.length})
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <label
              style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', border: 'none' }}
              className="px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs font-extrabold transition-transform hover:-translate-y-0.5"
            >
              <Camera size={16} /> Cámara
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleGeneralPhoto(e.target.files)}
                className="hidden"
              />
            </label>
            <label
              style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none' }}
              className="px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs font-extrabold transition-transform hover:-translate-y-0.5"
            >
              <ImageIcon size={16} /> Galería
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleGeneralPhoto(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
        </div>
        {generalPhotos.length > 0 && (
          <div className="flex gap-3 flex-wrap mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            {generalPhotos.map((p, pIdx) => (
              <div
                key={pIdx}
                className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <img src={p} alt="Evidencia" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGeneralPhoto(pIdx)}
                  className="absolute top-0 right-0 bg-red-500 text-white border-none w-5 h-5 text-xs flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observaciones Generales + Fecha y Firma del Inspector */}
      <div className="glass-card bg-white dark:bg-slate-800 p-5 sm:p-6 mb-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
        <div>
          <label className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase mb-2">
            <FileText size={16} className="text-amber-500" /> Observaciones Generales
          </label>
          <textarea
            value={generalObservations}
            onChange={(e) => setGeneralObservations(e.target.value)}
            placeholder="Agregue comentarios adicionales sobre la inspección..."
            className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 min-h-[85px] resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-2 uppercase">
              <Calendar size={14} className="text-blue-500" /> Fecha de Inspección
            </label>
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-blue-500 font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-2 uppercase">
              Firma / Nombre del Inspector
            </label>
            <input
              type="text"
              placeholder="Nombre completo"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-blue-500 font-bold"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => navigate('/extintores')}
            style={{
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '12px 22px',
              fontSize: '13px',
              fontWeight: '800',
              borderRadius: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeft size={18} /> Cancelar
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              requirePro(handleSave);
            }}
            disabled={isSaving}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '12px 26px',
              fontSize: '13px',
              fontWeight: '900',
              borderRadius: '14px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)'
            }}
          >
            <Save size={18} /> {isSaving ? 'GUARDANDO...' : 'FINALIZAR INSPECCIÓN'}
          </button>
        </div>
      </div>
    </div>
  );
}
