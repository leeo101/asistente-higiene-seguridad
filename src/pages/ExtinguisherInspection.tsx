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
  MapPin,
  Calendar,
  Pencil,
  Printer,
  Share2,
  AlertOctagon,
  XCircle,
  Eye,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { compressImage } from '../utils/imageCompressor';
import { safeJsonParse } from '../utils/storageHelper';
import PremiumHeader from '../components/PremiumHeader';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import ShareModal from '../components/ShareModal';
import ExtinguisherProfilePdf from '../components/ExtinguisherProfilePdf';
import { printElementAsDocument, generatePdfBlob } from '../utils/pdfHelper';

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
    NFPA10_CHECKLIST.map((item) => ({ ...item, status: 'C' as string | null, notes: '', photos: [] as string[] }))
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
    signature: null as string | null,
    stamp: null as string | null
  });
  const [generalPhotos, setGeneralPhotos] = useState<string[]>([]);
  const [generalObservations, setGeneralObservations] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const [shareItem, setShareItem] = useState<any | null>(null);
  const [printItem, setPrintItem] = useState<any | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

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
        capacidad: '5 kg',
        potencialExtintor: '3A 10B C',
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
    const savedSigData = localStorage.getItem('signatureStampData');
    const legacySignature = localStorage.getItem('capturedSignature');
    let sig = legacySignature || null;
    let stamp = null;
    if (savedSigData) {
      try {
        const parsedSig = JSON.parse(savedSigData);
        sig = parsedSig?.signature || sig;
        stamp = parsedSig?.stamp || null;
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
          signature: parsedP.signature || sig,
          stamp
        });
      } catch {
        setProfessional({ name: '', license: '', signature: sig, stamp });
      }
    } else if (sig) {
      setProfessional({ name: '', license: '', signature: sig, stamp });
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
    setChecklist([...checklist, { id: 'c' + Date.now(), text: '', status: 'C', notes: '', photos: [] }]);
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

  const buildCurrentPdfPayload = () => {
    const hasNC = checklist.some((c) => c.status === 'NC');
    const calculatedResult = hasNC ? 'RECHAZADO' : 'APROBADO';
    return {
      ...extintor,
      showSignatures,
      operatorSignature: inspectorSignature || extintor?.operatorSignature || '',
      supervisorSignature: supervisorSignature || extintor?.supervisorSignature || '',
      professionalSignature: professional.signature || extintor?.professionalSignature || '',
      professionalStamp: professional.stamp || undefined,
      professionalName: professional.name || inspectorName || '',
      professionalLicense: professional.license || '',
      selectedInspection: {
        id: 'insp-live',
        extintorId: extintor?.id,
        extintorNum: extintor?.numero || extintor?.chapa || extintor?.id || 'S-N',
        fecha: `${inspectionDate}T12:00:00.000Z`,
        inspector: (inspectorName || professional.name || '').trim() || 'Inspector HSE',
        inspectorSignature: inspectorSignature || undefined,
        supervisorSignature: supervisorSignature || undefined,
        professionalSignature: professional.signature || undefined,
        showSignatures,
        items: checklist,
        fotos: generalPhotos,
        observaciones: generalObservations,
        resultado: calculatedResult
      }
    };
  };

  const handlePrintPdf = async (payloadOverride?: any) => {
    const targetData = payloadOverride || buildCurrentPdfPayload();
    const title = `Acta de Inspección - Extintor #${targetData?.numero || 'S-N'}`;
    const toastId = toast.loading('Abriendo diálogo de impresión / guardar PDF...');

    try {
      setPrintItem(targetData);
      await new Promise((r) => setTimeout(r, 150));
      await printElementAsDocument('pdf-content-print-inspection', title, false);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('[ExtinguisherInspection] Error al imprimir:', err);
      toast.dismiss(toastId);
      window.print();
    } finally {
      setTimeout(() => setPrintItem(null), 1500);
    }
  };

  const handleDownloadPdf = async (payloadOverride?: any) => {
    const targetData = payloadOverride || buildCurrentPdfPayload();
    const toastId = toast.loading('Generando PDF A4...');
    try {
      setPrintItem(targetData);
      await new Promise((r) => setTimeout(r, 200));
      const pdfBlob = await generatePdfBlob('pdf-content-print-inspection', false);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Inspeccion_Matafuego_${targetData?.numero || 'Reporte'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success('¡PDF descargado con éxito!', { id: toastId });
    } catch (err) {
      console.error('[ExtinguisherInspection] Error al descargar PDF:', err);
      toast.error('Error al generar el PDF', { id: toastId });
    } finally {
      setTimeout(() => setPrintItem(null), 1000);
    }
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
          cilindro: checklist[9]?.status || checklist[6]?.status || 'C',
          senalizacion: checklist[8]?.status || checklist[5]?.status || 'C'
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
            checkManometro: pdfInspection.controles.manometro !== 'NC',
            checkPrecinto: (checklist[4]?.status || 'C') !== 'NC',
            checkSenalizacion: pdfInspection.controles.senalizacion !== 'NC',
            checkAcceso: pdfInspection.controles.acceso !== 'NC',
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
      }, 450);
    } catch (error: any) {
      console.error('[ExtinguisherInspection] Error al guardar inspección:', error);
      toast.error('Error al guardar la inspección. Intente nuevamente.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (!extintor) {
    return <div className="p-8 text-center text-slate-500">Cargando datos del equipo...</div>;
  }

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
              <span className="text-xs text-slate-500 block">Capacidad</span>
              <strong className="text-slate-900 dark:text-white">{extintor.capacidad || '5 kg'}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Ubicación / Sector</span>
              <strong className="text-slate-900 dark:text-white">{extintor.ubicacion || 'Planta Principal'}</strong>
            </div>
          </div>
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
  const conformCount = checklist.filter((c) => c.status === 'C').length;
  const ncCount = checklist.filter((c) => c.status === 'NC').length;
  const progressPercent = checklist.length > 0 ? Math.round((answeredCount / checklist.length) * 100) : 0;
  const hasNC = ncCount > 0;
  const allAnswered = checklist.length > 0 && answeredCount === checklist.length;
  const isRecargaVencida = Boolean(
    extintor.vencimientoRecarga &&
      (() => {
        const d = new Date(extintor.vencimientoRecarga + 'T12:00:00Z');
        d.setFullYear(d.getFullYear() + 1);
        return d < new Date();
      })()
  );
  const isPHVencida = Boolean(
    extintor.vencimientoPH &&
      (() => {
        const d = new Date(extintor.vencimientoPH + 'T12:00:00Z');
        d.setFullYear(d.getFullYear() + 5);
        return d < new Date();
      })()
  );

  const regAlerts: string[] = [];
  if (hasNC) {
    regAlerts.push(
      `Se detectaron ${ncCount} punto(s) NO CONFORME (NC) en el checklist NFPA 10. El equipo queda calificado como RECHAZADO hasta subsanar el desvío.`
    );
  }
  if (isRecargaVencida) {
    regAlerts.push('Recarga anual vencida. Según IRAM 3517-2 debe enviarse a taller habilitado y colocarse extintor sustituto.');
  }
  if (isPHVencida) {
    regAlerts.push('Prueba Hidráulica quinquenal (5 años) vencida. Prohibido recargar sin ensayo hidrostático previo.');
  }

  return (
    <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
      <PremiumHeader
        onBack={() => navigate('/extintores')}
        title={`Inspección de Matafuego #${extintor.numero || extintor.chapa || extintor.id}`}
        subtitle="Acta de Verificación Periódica NFPA 10 / IRAM 3517-2 · Ley 19.587 Dec. 351/79"
        icon={<ShieldCheck size={36} color="#ffffff" />}
        color="linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)"
      />

      {/* ─── TARJETAS KPI EN VIVO ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Equipo Auditado</span>
            <Flame size={20} />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white truncate">
            #{extintor.numero || extintor.chapa || extintor.id}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block truncate">
            {extintor.tipo || 'ABC (PQS)'} · {extintor.capacidad || '5 kg'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Avance Control</span>
            <ClipboardCheck size={20} />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {answeredCount}/{checklist.length} ({progressPercent}%)
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">Puntos NFPA 10 evaluados</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Conformidades</span>
            <CheckCircle2 size={20} />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {conformCount} OK · <span className={ncCount > 0 ? 'text-rose-600' : 'text-slate-400'}>{ncCount} NC</span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">Hallazgos del relevamiento</span>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs ${
            hasNC
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400'
              : allAnswered
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-400'
          }`}
        >
          <div
            className={`flex items-center justify-between mb-1.5 ${
              hasNC ? 'text-rose-600' : allAnswered ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider">Dictamen en Vivo</span>
            {hasNC ? <XCircle size={20} /> : <ShieldCheck size={20} />}
          </div>
          <div
            className={`text-xl font-black ${
              hasNC
                ? 'text-rose-600 dark:text-rose-400'
                : allAnswered
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {hasNC ? 'RECHAZADO' : allAnswered ? 'APROBADO' : 'EN PROGRESO'}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            {hasNC ? 'Requiere acción correctiva' : 'Habilitado en sector'}
          </span>
        </div>
      </div>

      {/* ─── TARJETA PRINCIPAL DE INSPECCIÓN REFACTORIZADA ─── */}
      <div className="glass-card p-6 sm:p-8 mt-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 animate-fade-in">
        {/* Encabezado del Formulario de Inspección */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/extintores')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer mr-1"
              title="Volver al Padrón de Matafuegos"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="m-0 text-xl font-extrabold text-slate-900 dark:text-white">
                Acta de Inspección NFPA 10 — Chapa #{extintor.numero || extintor.chapa || extintor.id}
              </h2>
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <MapPin size={13} className="text-rose-500" /> {extintor.ubicacion || 'Ubicación no especificada'} ·{' '}
                {extintor.empresa || 'Planta Principal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setPreviewItem(buildCurrentPdfPayload())}
              style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none' }}
              className="px-3.5 py-2 hover:opacity-90 text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
            >
              <Eye size={15} /> Vista Previa A4
            </button>

            <button
              type="button"
              onClick={setAllOk}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
              className="px-3.5 py-2 hover:opacity-90 text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} /> Marcar Todo OK
            </button>
          </div>
        </div>

        {/* Banner de Auditoría Regulatoria en Vivo */}
        {regAlerts.length > 0 ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs uppercase tracking-wider">
              <AlertOctagon size={16} /> Auditoría Regulatoria NFPA 10 &amp; Norma IRAM 3517-2
            </div>
            <ul className="m-0 pl-4 space-y-1 text-xs text-amber-900 dark:text-amber-200 font-semibold list-disc">
              {regAlerts.map((alert, idx) => (
                <li key={idx}>{alert}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/50 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              Todos los puntos evaluados del checklist NFPA 10 / IRAM 3517-2 se encuentran CONFORMES y vigentes.
            </span>
          </div>
        )}

        {/* ─── SECCIÓN 1: RESUMEN TÉCNICO DEL EQUIPO ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Nº Chapa / ID
            </span>
            <strong className="text-slate-900 dark:text-white font-black">
              #{extintor.numero || extintor.chapa || extintor.id}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Agente / Tipo
            </span>
            <strong className="text-slate-900 dark:text-white font-bold">{extintor.tipo || 'ABC (PQS)'}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Capacidad
            </span>
            <strong className="text-slate-900 dark:text-white font-bold">{extintor.capacidad || '5 kg'}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Ubicación
            </span>
            <strong className="text-slate-900 dark:text-white font-bold truncate block">
              {extintor.ubicacion || 'Planta Principal'}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Últ. Recarga
            </span>
            <strong
              className={`font-extrabold ${
                isRecargaVencida ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {extintor.vencimientoRecarga || 'Sin dato'}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Últ. P. Hidráulica
            </span>
            <strong
              className={`font-extrabold ${
                isPHVencida ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {extintor.vencimientoPH || 'Sin dato'}
            </strong>
          </div>
        </div>

        {/* ─── SECCIÓN 2: CHECKLIST INTERACTIVO NFPA 10 / IRAM 3517-2 ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="m-0 text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-blue-500" /> Puntos de Control Auditados (NFPA 10 / IRAM 3517-2)
            </h3>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              C = Conforme · NC = No Conforme · N/A = No Aplica
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {checklist.map((item, idx) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  item.status === 'NC'
                    ? 'bg-red-50/60 dark:bg-red-950/25 border-red-300 dark:border-red-900/60'
                    : item.status === 'C'
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/40'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="font-black text-white text-xs text-center bg-slate-800 dark:bg-slate-600 py-1 px-2 rounded-lg shadow-xs shrink-0 mt-0.5 min-w-[28px]">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleItemTextChange(idx, e.target.value)}
                    placeholder="Detalle del punto a inspeccionar..."
                    className="flex-1 p-1 text-sm font-bold text-slate-900 dark:text-slate-100 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg bg-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    title="Eliminar punto"
                    className="p-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg cursor-pointer transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
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
                        item.status === 'C' ? 'shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      ✓ CONFORME
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
                        item.status === 'NC' ? 'shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      ✕ NO CONFORME
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
                        item.status === 'NA' ? 'shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      N/A
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <label
                      title="Tomar Foto"
                      className="px-2.5 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 cursor-pointer flex items-center justify-center transition-colors"
                    >
                      <Camera size={15} />
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
                      className="px-2.5 h-8 rounded-lg bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center justify-center transition-colors"
                    >
                      <ImageIcon size={15} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhoto(idx, e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Observación de este punto (opcional)..."
                    value={item.notes}
                    onChange={(e) => handleNotes(idx, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                {item.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {item.photos.map((p: string, pIdx: number) => (
                      <div
                        key={pIdx}
                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                      >
                        <img src={p} alt="Evidencia" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx, pIdx)}
                          className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 text-[10px] flex items-center justify-center cursor-pointer border-none"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="px-4 py-2.5 mt-2 rounded-xl font-extrabold text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-2 border-dashed border-blue-200 dark:border-blue-800 cursor-pointer flex justify-center items-center gap-2 transition-colors mx-auto"
          >
            <Plus size={16} /> AGREGAR PUNTO PERSONALIZADO AL CHECKLIST
          </button>
        </div>

        {/* ─── SECCIÓN 3: EVIDENCIA GENERAL, OBSERVACIONES Y FECHA ─── */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="m-0 text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FileText size={18} className="text-emerald-500" /> 3. Observaciones Generales, Fecha y Evidencia Fotográfica
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Observaciones Generales de la Inspección
              </label>
              <textarea
                value={generalObservations}
                onChange={(e) => setGeneralObservations(e.target.value)}
                placeholder="Agregue comentarios adicionales, recomendaciones o acciones correctivas..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-semibold outline-none focus:border-blue-500 resize-y"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                  <Calendar size={13} /> Fecha de Inspección
                </label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                  Inspector Actuante
                </label>
                <input
                  type="text"
                  placeholder="Nombre y apellido / Matrícula"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                Fotografías Generales del Acta ({generalPhotos.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Adjunte fotos panorámicas de la ubicación, señalización o estado del equipo
              </span>
            </div>
            <div className="flex gap-2">
              <label className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-extrabold text-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                <Camera size={15} /> Cámara
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleGeneralPhoto(e.target.files)}
                  className="hidden"
                />
              </label>
              <label className="px-3.5 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                <ImageIcon size={15} /> Galería
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
            <div className="flex gap-3 flex-wrap">
              {generalPhotos.map((p, pIdx) => (
                <div
                  key={pIdx}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700"
                >
                  <img src={p} alt="Evidencia" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGeneralPhoto(pIdx)}
                    className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 text-xs flex items-center justify-center cursor-pointer border-none"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── SECCIÓN 4: FIRMAS DIGITALIZADAS Y VALIDACIÓN DOCUMENTAL ─── */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <Pencil size={20} />
            </div>
            <div>
              <h4 className="m-0 font-black text-sm uppercase text-slate-900 dark:text-white tracking-tight">
                4. Firmas Digitalizadas y Validación del Acta
              </h4>
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Seleccioná qué firmas incluir en el PDF de la inspección y firmá en pantalla si corresponde.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col gap-3 items-center justify-center">
            <div className="text-slate-800 dark:text-slate-200 font-extrabold text-xs uppercase tracking-wider">
              INCLUIR FIRMAS EN EL ACTA IMPRESA / PDF:
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              {[
                { id: 'operator', label: 'Inspector / Operador de Campo' },
                { id: 'supervisor', label: 'Supervisor / Cliente' },
                { id: 'professional', label: 'Profesional H&S (Digitalizada)' }
              ].map((sig) => {
                const isChecked = !!showSignatures[sig.id as keyof typeof showSignatures];
                return (
                  <label
                    key={sig.id}
                    className="flex items-center gap-2 cursor-pointer select-none px-3.5 py-2 rounded-full font-extrabold text-xs transition-all text-center"
                    style={{
                      border: isChecked ? '1.5px solid #059669' : '1px solid #cbd5e1',
                      background: isChecked ? 'rgba(5, 150, 105, 0.12)' : 'transparent',
                      color: isChecked ? '#059669' : '#64748b'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setShowSignatures((prev) => ({
                          ...prev,
                          [sig.id]: e.target.checked
                        }))
                      }
                      className="hidden"
                    />
                    <div
                      style={{
                        border: isChecked ? '2px solid #059669' : '2px solid #94a3b8',
                        background: isChecked ? '#059669' : 'transparent'
                      }}
                      className="w-4 h-4 rounded flex items-center justify-center transition-all"
                    >
                      {isChecked && <CheckCircle2 size={12} color="white" />}
                    </div>
                    {sig.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Vista Previa Visual en Vivo de las Firmas */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 text-center mb-1">
              VISTA PREVIA DE FIRMAS EN EL ACTA A4
            </div>
            <PdfSignatures
              data={{
                showSignatures,
                professionalSignature: professional.signature,
                professionalStamp: professional.stamp,
                professionalName: professional.name || inspectorName,
                professionalLicense: professional.license
              }}
              box1={
                showSignatures.operator
                  ? {
                      title: 'INSPECTOR / OPERADOR',
                      subtitle: (inspectorName || 'FIRMA Y ACLARACIÓN').toUpperCase(),
                      signatureUrl: inspectorSignature || null,
                      isProfessional: false
                    }
                  : null
              }
              box2={
                showSignatures.supervisor
                  ? {
                      title: 'SUPERVISOR / CLIENTE',
                      subtitle: (extintor.empresa || 'CONFORMIDAD DEL SECTOR').toUpperCase(),
                      signatureUrl: supervisorSignature || null,
                      isProfessional: false
                    }
                  : null
              }
              box3={
                showSignatures.professional
                  ? {
                      title: 'PROFESIONAL HIGIENE Y SEGURIDAD',
                      subtitle: (professional.name || inspectorName || 'FIRMA Y SELLO H&S').toUpperCase(),
                      signatureUrl: professional.signature || null,
                      stampUrl: professional.stamp || null,
                      isProfessional: true,
                      license: professional.license || null
                    }
                  : null
              }
            />
          </div>

          {/* Paneles Interactivos de Firma Digital */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {showSignatures.operator && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                <SignatureCanvas
                  onSave={(sig) => setInspectorSignature(sig || '')}
                  initialImage={inspectorSignature}
                  label="Firma del Inspector / Operador"
                />
              </div>
            )}

            {showSignatures.supervisor && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
                <SignatureCanvas
                  onSave={(sig) => setSupervisorSignature(sig || '')}
                  initialImage={supervisorSignature}
                  label="Firma del Supervisor / Cliente"
                />
              </div>
            )}

            {showSignatures.professional && (
              <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl shadow-xs">
                <SignatureCanvas
                  onSave={(sig) => setProfessional((prev) => ({ ...prev, signature: sig || '' }))}
                  initialImage={professional.signature || ''}
                  label={`Firma Profesional H&S (${professional.name || 'Actuante'})`}
                />
              </div>
            )}
          </div>
        </div>

        {/* ─── BARRA ÚNICA DE ACCIONES INFERIORES: CANCELAR, COMPARTIR, IMPRIMIR Y GUARDAR ─── */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => navigate('/extintores')}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '12px 22px',
              fontSize: '13px',
              fontWeight: '900',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            <ArrowLeft size={18} /> Cancelar
          </button>

          <button
            type="button"
            onClick={() => requirePro(() => setShareItem(buildCurrentPdfPayload()))}
            style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              padding: '12px 22px',
              fontSize: '13px',
              fontWeight: '900',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
            }}
          >
            <Share2 size={18} /> Compartir
          </button>

          <button
            type="button"
            onClick={() => requirePro(() => handlePrintPdf())}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '12px 22px',
              fontSize: '13px',
              fontWeight: '900',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Printer size={18} /> Imprimir
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => requirePro(handleSave)}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '12px 26px',
              fontSize: '13px',
              fontWeight: '900',
              borderRadius: '12px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            <Save size={18} />
            <span>{isSaving ? 'Guardando...' : 'Guardar Matafuego'}</span>
          </button>
        </div>
      </div>

      {/* Modal de Compartir / Descargar PDF */}
      <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`Acta de Inspección - Extintor #${extintor.numero || extintor.id}`}
        text={`📋 Inspección de Matafuego #${extintor.numero || extintor.id}\n📍 Ubicación: ${extintor.ubicacion || '-'}\n✅ Resultado: ${hasNC ? 'RECHAZADO' : 'APROBADO'}`}
        rawMessage=""
        elementIdToPrint="pdf-portal-inspection-share"
        fileName={`Inspeccion_Extintor_${extintor.numero || extintor.id || 'Reporte'}.pdf`}
      />

      {/* Portal Offscreen para Compartir / Descargar */}
      <div
        id="pdf-portal-inspection-share"
        className="ats-pdf-offscreen"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '210mm',
          height: 'auto',
          overflow: 'visible',
          opacity: 1,
          pointerEvents: 'none',
          zIndex: -9999,
          background: '#ffffff'
        }}
      >
        {shareItem && <ExtinguisherProfilePdf data={shareItem} isHeadless={true} />}
      </div>

      {/* Portal Offscreen para Impresión Directa */}
      <div
        id="pdf-content-print-inspection"
        className="ats-pdf-offscreen"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '210mm',
          height: 'auto',
          overflow: 'visible',
          opacity: 1,
          pointerEvents: 'none',
          zIndex: -9999,
          background: '#ffffff'
        }}
      >
        {printItem && <ExtinguisherProfilePdf data={printItem} isHeadless={true} />}
      </div>

      {/* Modal de Vista Previa A4 */}
      {previewItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print">
          <div className="relative w-full max-w-[920px] h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-700/80 bg-slate-800/90 select-none flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white leading-tight m-0">
                    Vista Previa del Acta de Inspección A4 (1 Hoja)
                  </h2>
                  <p className="text-xs text-slate-400 m-0">
                    Matafuego #{previewItem.numero || '-'} ({previewItem.tipo || 'ABC'} - {previewItem.capacidad || '5 kg'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => requirePro(() => handleDownloadPdf(previewItem))}
                  style={{
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '900',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={16} /> Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={() => requirePro(() => handlePrintPdf(previewItem))}
                  style={{
                    backgroundColor: '#f59e0b',
                    color: '#0f172a',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '900',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={16} /> Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer bg-transparent border-none"
                  title="Cerrar vista previa"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/70 flex justify-center">
              <div className="w-full max-w-[210mm] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
                <ExtinguisherProfilePdf
                  data={previewItem}
                  isHeadless={true}
                  pdfElementId="pdf-modal-preview-inspection"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
