import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Camera, CheckCircle2, Save, X, Plus, Image as ImageIcon, ArrowLeft, Flame, ClipboardCheck, FileText, MapPin, Calendar, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { compressImage } from '../utils/imageCompressor';
import { safeJsonParse } from '../utils/storageHelper';
import { ModuleFormLayout } from '../components/module/ModuleFormLayout';
import { ModuleFormDocument } from '../components/module/ModuleFormDocument';
import { ModuleFormToolbar } from '../components/module/ModuleFormToolbar';
import { ModuleFormSection } from '../components/module/ModuleFormSection';
import { ModuleActionBar } from '../components/module/ModuleActionBar';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import CompanyLogo from '../components/CompanyLogo';

const NFPA10_CHECKLIST = [
  { id: 'c1', text: 'Ubicación correcta y asignada según plano' },
  { id: 'c2', text: 'Visibilidad y acceso libre sin obstrucciones' },
  { id: 'c3', text: 'Manómetro en zona verde (presión operable)' },
  { id: 'c4', text: 'Manguera y boquilla libres de obstrucciones, grietas o cortes' },
  { id: 'c5', text: 'Precinto de seguridad y pasador intactos' },
  { id: 'c6', text: 'Marbete / tarjeta de control legible y vigente' },
  { id: 'c7', text: 'Altura de montaje y soporte reglamentario firme' },
  { id: 'c8', text: 'Válvula, palanca de accionamiento y seguro sin daños ni corrosión' },
  { id: 'c9', text: 'Cartelería y señalización reglamentaria (baliza/chapa) en buen estado' },
  { id: 'c10', text: 'Estado físico general del cilindro (sin abolladuras, óxido ni fugas)' },
  { id: 'c11', text: 'Verificación de peso / tara conforme (aplica a equipos de CO₂)' }
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
  const [inspectorSignature, setInspectorSignature] = useState('');
  const [supervisorSignature, setSupervisorSignature] = useState('');
  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: false,
    professional: true
  });
  const [professional, setProfessional] = useState({
    name: '',
    license: '',
    signature: null as string | null
  });
  const [generalPhotos, setGeneralPhotos] = useState<string[]>([]);
  const [generalObservations, setGeneralObservations] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const { currentUser } = useAuth();
  const [isVisitorView, setIsVisitorView] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const tryLoad = (storageKey: string) => {
      const dataRaw = localStorage.getItem(storageKey);
      if (!dataRaw) return null;
      try {
        const inventory = JSON.parse(dataRaw);
        return inventory.find((e: any) => String(e.id) === String(id) || String(e.numero) === String(id) || String(e.chapa) === String(id)) || null;
      } catch { return null; }
    };

    let found = tryLoad('extinguishers_inventory') || tryLoad('extintores_inventory') || tryLoad('extintores_db');

    // Fallback: Si no está en localStorage local (ej: escaneado desde celular de un visitante externo)
    if (!found && id) {
      found = {
        id: id,
        numero: id,
        tipo: 'Matafuego PQS / Polvo ABC',
        capacidad: '5 kg',
        ubicacion: 'Planta Principal',
        marca: 'Registrado H&S',
        vencimientoRecarga: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vencimientoPH: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isSimulated: true
      };
    }

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
          }
        } catch (e) {}
      }
    }

    // Determinar si se muestra en modo visitante
    if (!currentUser) {
      setIsVisitorView(true);
    }

    // Cargar nombre y firma del profesional si está logueado
    const pData = localStorage.getItem('personalData');
    const savedSigData = localStorage.getItem('signatureStampData');
    const legacySignature = localStorage.getItem('capturedSignature');
    let sig = legacySignature || null;
    if (savedSigData) {
      try {
        const parsedSig = JSON.parse(savedSigData);
        sig = parsedSig?.signature || sig;
      } catch {
        if (savedSigData.startsWith('data:')) sig = savedSigData;
      }
    }
    if (pData) {
      try {
        const parsedP = JSON.parse(pData);
        setInspectorName(parsedP.name || '');
        setProfessional({
          name: parsedP.name || '',
          license: parsedP.license || '',
          signature: parsedP.signature || sig
        });
      } catch {
        setProfessional({ name: '', license: '', signature: sig });
      }
    } else if (sig) {
      setProfessional({ name: '', license: '', signature: sig });
    }
  }, [id, currentUser]);

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

  const handlePhoto = async (index, files) => {
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

  const removePhoto = (itemIndex, photoIndex) => {
    const newChecklist = [...checklist];
    newChecklist[itemIndex].photos.splice(photoIndex, 1);
    setChecklist(newChecklist);
  };

  const handleGeneralPhoto = async (files) => {
    if (!files || !files.length) return;
    try {
      const compressed = await compressImage(files[0]);
      setGeneralPhotos(prev => [...prev, compressed]);
    } catch (e) {
      console.warn('[ExtinguisherInspection] Error compressing general photo:', e);
    }
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
    const toastId = toast.loading('Guardando inspección...');

    try {
      const extNumero = extintor.numero || extintor.chapa || extintor.id || 'S-N';
      const report = {
        id: Date.now().toString(),
        extintorId: extintor.id,
        extintorNum: extNumero,
        fecha: `${inspectionDate}T12:00:00.000Z`,
        inspector: (inspectorName || '').trim() || 'Inspector HSE',
        inspectorSignature: inspectorSignature || undefined,
        supervisorSignature: supervisorSignature || undefined,
        professionalSignature: professional.signature || undefined,
        showSignatures,
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
        // Fallback: aligerar fotos si supera el límite de localStorage
        const sanitizedReport = {
          ...report,
          fotos: [],
          items: checklist.map(i => ({ ...i, photos: [] }))
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
          cilindro: checklist[9]?.status || checklist[6]?.status || 'C',
          senalizacion: checklist[8]?.status || checklist[5]?.status || 'C'
        },
        observacion: report.observaciones,
        fotos: report.fotos
      };

      const inventory = safeJsonParse<any[]>(localStorage.getItem('extinguishers_inventory'), []);

      // Buscar por ID, o por número/chapa
      let matchFound = false;
      let updatedInv = inventory.map((e: any) => {
        const isMatch = (e.id && String(e.id) === String(extintor.id)) ||
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

      // Si es un extintor escaneado o simulado que no estaba en el inventario local, incorporarlo
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
        // Aligerar fotos de inspección
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
          <p className="text-xs text-slate-400 font-mono mb-4">FICHA DE CONTROL PÚBLICA — AUDITADO H&S</p>
          
          <div className={`inline-block px-4 py-2 rounded-full font-black text-sm uppercase tracking-wider mb-2 ${isExpired ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
            {isExpired ? '⚠️ VENCIDO / REQUIERE INSPECCIÓN' : '🟢 APROBADO Y HABILITADO'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-6 space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">Ficha Técnica del Equipo</h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Nº Chapa / ID</span>
              <strong className="text-base text-slate-900 dark:text-white">{extintor.numero || extintor.chapa || extintor.id}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Tipo Agente</span>
              <strong className="text-slate-900 dark:text-white">{extintor.tipo || 'PQS ABC'}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Capacidad</span>
              <strong className="text-slate-900 dark:text-white">{extintor.capacidad || '5 kg'}</strong>
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
                <strong className={isExpired ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>{extintor.vencimientoRecarga}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Puntos de Control Auditados (NFPA 10)</h3>
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
  const progressPercent = checklist.length > 0 ? Math.round((answeredCount / checklist.length) * 100) : 0;
  const hasNC = checklist.some((c) => c.status === 'NC');
  const allAnswered = checklist.length > 0 && answeredCount === checklist.length;
  const isRecargaVencida = Boolean(extintor.vencimientoRecarga && new Date(extintor.vencimientoRecarga) < new Date());
  const isPHVencida = Boolean(extintor.vencimientoPH && new Date(extintor.vencimientoPH) < new Date());

  const sectionIds = ['insp-sec-equipo', 'insp-sec-checklist', 'insp-sec-evidencia'];
  const handleStepClick = (stepIdx: number) => {
    setActiveStep(stepIdx);
    const el = document.getElementById(sectionIds[stepIdx]);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <ModuleFormLayout maxWidth={850}>
      <ModuleFormToolbar
        title={`Inspección: ${extintor.numero || extintor.chapa || extintor.id}`}
        subtitle={`${extintor.tipo || 'Matafuego'} · ${extintor.ubicacion || 'Sin ubicación'}${extintor.marca ? ` (${extintor.marca})` : ''}`}
        icon={<ShieldCheck size={20} className="text-amber-500" />}
        onBack={() => navigate('/extintores')}
        progress={{
          percent: progressPercent,
          label: `${answeredCount}/${checklist.length} puntos`,
          color: hasNC ? '#ef4444' : progressPercent === 100 ? '#10b981' : '#f59e0b'
        }}
        steps={['Datos del Equipo', 'Checklist NFPA 10', 'Evidencia y Firma']}
        currentStep={activeStep}
        onStepClick={handleStepClick}
      />
      <ModuleFormDocument id="extinguisher-inspection-form">
        {/* Encabezado de Hoja estilo ATS */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center pb-5 mb-6 w-full gap-4"
          style={{ borderBottom: '3px solid var(--color-border)' }}
        >
          <div className="text-center sm:text-left">
            <p className="m-0 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sistema de Gestión Preventiva
            </p>
            <p className="m-0 font-black text-xs uppercase text-slate-800 dark:text-slate-100">
              Ley 19.587 • Dec. 351/79 • NFPA 10
            </p>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="m-0 font-black text-2xl sm:text-3xl tracking-tight uppercase leading-none text-slate-900 dark:text-white">
              INSPECCIÓN
            </h1>
            <p className="m-0 font-black text-[10px] uppercase tracking-widest mt-1 text-slate-500 dark:text-slate-400">
              Control Periódico de Matafuego
            </p>
          </div>

          <div className="text-center sm:text-right flex flex-col items-center sm:items-end gap-1.5">
            <CompanyLogo className="h-[38px] max-w-[120px]" />
            <span
              className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: hasNC ? 'rgba(239, 68, 68, 0.14)' : allAnswered ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                color: hasNC ? '#dc2626' : allAnswered ? '#059669' : '#d97706'
              }}
            >
              {hasNC ? 'RECHAZADO' : allAnswered ? 'APROBADO' : `CHAPA #${extintor.numero || extintor.chapa || extintor.id}`}
            </span>
          </div>
        </div>

      <div className="space-y-6 pb-8">
        {/* Sección 1: Datos del Equipo y Estado en Vivo */}
        <div id="insp-sec-equipo">
          <ModuleFormSection
            title="Datos del Equipo"
            icon={<Flame size={18} className="text-amber-500" />}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <MapPin size={14} className="text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">{extintor.ubicacion || 'Ubicación no especificada'}</span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                  hasNC
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : allAnswered
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                }`}
              >
                {hasNC ? 'Rechazado / Con NC' : allAnswered ? 'Aprobado (Listo para guardar)' : `En progreso (${answeredCount}/${checklist.length})`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Nº Chapa / ID</span>
                <strong className="text-slate-900 dark:text-white font-extrabold">{extintor.numero || extintor.chapa || extintor.id}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Agente / Tipo</span>
                <strong className="text-slate-900 dark:text-white font-bold">{extintor.tipo || 'PQS ABC'}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Capacidad</span>
                <strong className="text-slate-900 dark:text-white font-bold">{extintor.capacidad || '5 kg'}</strong>
              </div>
              {extintor.marca && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Marca</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{extintor.marca}</strong>
                </div>
              )}
              {extintor.vencimientoRecarga && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Venc. Recarga</span>
                  <strong className={`font-extrabold ${isRecargaVencida ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {extintor.vencimientoRecarga}
                  </strong>
                </div>
              )}
              {extintor.vencimientoPH && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Venc. Prueba Hidráulica</span>
                  <strong className={`font-extrabold ${isPHVencida ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {extintor.vencimientoPH}
                  </strong>
                </div>
              )}
            </div>
          </ModuleFormSection>
        </div>

        {/* Sección 2: Checklist NFPA 10 / IRAM 3517-2 */}
        <div id="insp-sec-checklist">
          <ModuleFormSection
            title="Checklist NFPA 10 / IRAM 3517-2"
            icon={<ClipboardCheck size={18} className="text-blue-500" />}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {answeredCount} de {checklist.length} puntos evaluados
              </span>
              <button
                type="button"
                onClick={setAllOk}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} /> MARCAR TODO OK
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              {checklist.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    item.status === 'NC'
                      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                      : item.status === 'C'
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-3">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 mt-1 text-sm">{idx + 1}.</span>
                    <textarea
                      value={item.text}
                      onChange={(e) => handleItemTextChange(idx, e.target.value)}
                      placeholder="Detalle a inspeccionar..."
                      rows={2}
                      className="flex-1 p-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg bg-transparent outline-none resize-none leading-snug"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      title="Eliminar punto"
                      className="p-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg cursor-pointer transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="inline-flex rounded-xl p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 gap-1">
                      <button
                        type="button"
                        onClick={() => handleStatus(idx, 'C')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                          item.status === 'C'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        C
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatus(idx, 'NC')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                          item.status === 'NC'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        NC
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatus(idx, 'NA')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                          item.status === 'NA'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        N/A
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <label
                        title="Tomar Foto"
                        className="px-3 h-9 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 cursor-pointer flex items-center justify-center transition-colors"
                      >
                        <Camera size={17} />
                        <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhoto(idx, e.target.files)} className="hidden" />
                      </label>
                      <label
                        title="Subir de Galería"
                        className="px-3 h-9 rounded-lg bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center justify-center transition-colors"
                      >
                        <ImageIcon size={17} />
                        <input type="file" accept="image/*" onChange={(e) => handlePhoto(idx, e.target.files)} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      placeholder="Observaciones / Detalles del punto..."
                      value={item.notes}
                      onChange={(e) => handleNotes(idx, e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>

                  {item.photos.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2.5">
                      {item.photos.map((p: string, pIdx: number) => (
                        <div key={pIdx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                          <img src={p} alt="Evidencia" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx, pIdx)}
                            className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 text-[10px] flex items-center justify-center cursor-pointer"
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
                className="px-4 py-2.5 mt-1 rounded-xl font-extrabold text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-2 border-dashed border-blue-200 dark:border-blue-800 cursor-pointer flex justify-center items-center gap-2 transition-colors mx-auto"
              >
                <Plus size={16} /> AGREGAR PUNTO AL CHECKLIST
              </button>
            </div>
          </ModuleFormSection>
        </div>

        {/* Sección 3: Evidencia General, Observaciones y Firma */}
        <div id="insp-sec-evidencia">
          <ModuleFormSection
            title="Evidencia General y Firma"
            icon={<FileText size={18} className="text-emerald-500" />}
          >
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
                  <label className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Evidencia Fotográfica General</label>
                  <div className="flex gap-2">
                    <label className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                      <Camera size={15} /> Cámara
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => handleGeneralPhoto(e.target.files)} className="hidden" />
                    </label>
                    <label className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                      <ImageIcon size={15} /> Galería
                      <input type="file" accept="image/*" onChange={(e) => handleGeneralPhoto(e.target.files)} className="hidden" />
                    </label>
                  </div>
                </div>

                {generalPhotos.length > 0 && (
                  <div className="flex gap-3 flex-wrap mt-3">
                    {generalPhotos.map((p, pIdx) => (
                      <div key={pIdx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                        <img src={p} alt="Evidencia" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGeneralPhoto(pIdx)}
                          className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 text-xs flex items-center justify-center cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Observaciones Generales
                </label>
                <textarea
                  value={generalObservations}
                  onChange={(e) => setGeneralObservations(e.target.value)}
                  placeholder="Agregue comentarios adicionales sobre la inspección..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-blue-500 resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    <Calendar size={13} /> Fecha de Inspección
                  </label>
                  <input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Nombre del Inspector
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre y apellido / Matrícula"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-bold outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <Pencil size={17} className="text-blue-500" />
                  <h4 className="m-0 font-black text-sm uppercase tracking-wide text-slate-800 dark:text-slate-100">
                    Firmas del Acta de Inspección
                  </h4>
                </div>

                <div
                  className="no-print mb-6 p-3.5 rounded-2xl flex flex-wrap gap-4 justify-center items-center"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span className="font-black text-xs uppercase text-slate-700 dark:text-slate-200">
                    Incluir Firmas en el Acta:
                  </span>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {[
                      { id: 'operator', label: 'Inspector / Operador' },
                      { id: 'supervisor', label: 'Supervisor / Responsable' },
                      { id: 'professional', label: 'Profesional H&S' }
                    ].map((sig) => {
                      const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                      return (
                        <button
                          key={sig.id}
                          type="button"
                          onClick={() =>
                            setShowSignatures((s) => ({
                              ...s,
                              [sig.id]: !s[sig.id as keyof typeof showSignatures]
                            }))
                          }
                          style={{
                            marginBottom: 0,
                            padding: '0.45rem 0.9rem',
                            borderRadius: '9999px',
                            backgroundColor: isChecked ? 'rgba(37, 99, 235, 0.12)' : 'var(--color-surface)',
                            color: isChecked ? '#2563eb' : 'var(--color-text-light)',
                            border: `1.5px solid ${isChecked ? '#2563eb' : 'var(--color-border)'}`,
                            fontWeight: 800,
                            fontSize: '0.76rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer'
                          }}
                        >
                          {isChecked && <CheckCircle2 size={14} />}
                          {sig.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <PdfSignatures
                  data={{
                    professionalSignature: professional.signature,
                    professionalName: professional.name,
                    professionalLicense: professional.license
                  }}
                  box1={
                    showSignatures.operator
                      ? {
                          title: 'INSPECTOR / OPERADOR',
                          subtitle: (inspectorName || 'Firma / Aclaración').toUpperCase(),
                          signatureUrl: inspectorSignature || null,
                          isProfessional: false
                        }
                      : null
                  }
                  box2={
                    showSignatures.supervisor
                      ? {
                          title: 'SUPERVISOR / RESPONSABLE',
                          subtitle: 'FIRMA DEL SUPERVISOR',
                          signatureUrl: supervisorSignature || null,
                          isProfessional: false
                        }
                      : null
                  }
                  box3={
                    showSignatures.professional
                      ? {
                          title: 'PROFESIONAL ACTUANTE',
                          subtitle: (professional.name || 'Firma y Sello').toUpperCase(),
                          signatureUrl: professional.signature || null,
                          isProfessional: true,
                          license: professional.license
                        }
                      : null
                  }
                />

                {(showSignatures.operator || showSignatures.supervisor) && (
                  <div className="no-print mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-5" style={{ borderColor: 'var(--color-border)' }}>
                    {showSignatures.operator && (
                      <div
                        className="p-4 rounded-2xl"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <SignatureCanvas
                          onSave={(sig) => setInspectorSignature(sig || '')}
                          initialImage={inspectorSignature}
                          label="Firma del Inspector / Operador"
                        />
                      </div>
                    )}
                    {showSignatures.supervisor && (
                      <div
                        className="p-4 rounded-2xl"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <SignatureCanvas
                          onSave={(sig) => setSupervisorSignature(sig || '')}
                          initialImage={supervisorSignature}
                          label="Firma del Supervisor / Responsable"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ModuleFormSection>
        </div>
      </div>
      </ModuleFormDocument>

      <ModuleActionBar
        className="bottom-20 md:bottom-6"
        actions={[
          {
            id: 'back',
            label: 'Volver',
            icon: <ArrowLeft size={16} />,
            variant: 'secondary',
            onClick: () => navigate('/extintores')
          },
          {
            id: 'all-ok',
            label: 'Todo OK',
            icon: <CheckCircle2 size={16} />,
            variant: 'info',
            onClick: setAllOk
          },
          {
            id: 'save',
            label: isSaving ? 'Guardando...' : 'Finalizar Inspección',
            icon: <Save size={16} />,
            variant: 'primary',
            loading: isSaving,
            disabled: isSaving,
            onClick: () => requirePro(handleSave)
          }
        ]}
      />
    </ModuleFormLayout>
  );
}
