import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, Calendar, Search, Download, Trash2, Share2, QrCode, 
  Crosshair, Plus, CheckCircle2, AlertTriangle, Layers, BarChart2, 
  FileSpreadsheet, Eye, Gauge, Package, Check, RefreshCw, X, ShieldAlert,
  ArrowLeft, Clock
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import ShareModal from '../components/ShareModal';
import ExtinguisherAIPdfGenerator from '../components/ExtinguisherAIPdfGenerator';
import SignatureCanvas from '../components/SignatureCanvas';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import AnimatedPage from '../components/AnimatedPage';
import { useAuth } from '../contexts/AuthContext';
import ExtinguisherManometerAnalyzer, { ManometerAnalysisResult } from '../components/ExtinguisherManometerAnalyzer';
import { printElementAsDocument } from '../utils/pdfHelper';
import { compressImage } from '../utils/imageCompressor';
import { captureFromNativeCamera, isMobileDevice } from '../utils/nativeCamera';

const EXTINTOR_INFO: Record<string, { name: string; fires: string; color: string; icon: string; usage: string }> = {
  'ABC': {
    name: 'Polvo ABC / HCFC',
    fires: 'Clase A (sólidos), B (líquidos), C (eléctricos)',
    color: '#0284c7',
    icon: '🧯',
    usage: 'Tirar del pasador, apuntar a la base de las llamas y descargar en abanico'
  },
  'CO2': {
    name: 'CO2 (Anhídrido Carbónico)',
    fires: 'Clase B (líquidos), C (equipos eléctricos)',
    color: '#2563eb',
    icon: '❄️',
    usage: 'Sujetar por tobera aislada y barrer sobre equipos eléctricos energizados'
  },
  'Agua': {
    name: 'Agua Bajo Presión',
    fires: 'Clase A (sólidos ordinarios: madera, papel, tela)',
    color: '#059669',
    icon: '💧',
    usage: 'Apuntar a las brasas. NO usar en líquidos ni en instalaciones eléctricas'
  },
  'Espuma': {
    name: 'Espuma AFFF',
    fires: 'Clase A y B (solventes e hidrocarburos)',
    color: '#d97706',
    icon: '🫧',
    usage: 'Formar película flotante sobre el líquido inflamable'
  },
  'K': {
    name: 'Acetato de Potasio (Clase K)',
    fires: 'Aceites y grasas de freidoras comerciales',
    color: '#7c3aed',
    icon: '🍳',
    usage: 'Descarga suave con efecto niebla en cocinas industriales'
  }
};

const formatType = (tipo: string) => {
  if (!tipo) return 'Extintor';
  const t = String(tipo).toUpperCase();
  if (t === 'ABC') return 'Polvo ABC';
  if (t === 'BC') return 'CO2';
  return tipo;
};

export default function ExtinguisherAI() {
  const { isPro, loading, requirePro } = usePaywall();
  const navigate = useNavigate();
  useDocumentTitle('Matafuegos IA — Reconocimiento y Manómetro');
  const { syncCollection, syncPulse } = useSync();
  const { currentUser } = useAuth();

  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'vigente' | 'vencido'>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<{ text: string; title: string } | null>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);

  // Modo captura / formulario
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [inspectorName, setInspectorName] = useState('');
  const [formCompany, setFormCompany] = useState('Planta Principal');
  const [formLocation, setFormLocation] = useState('Sector Operativo');
  const [formExtinguisherNumber, setFormExtinguisherNumber] = useState('EXT-001');
  const [formCapacity, setFormCapacity] = useState('5 kg');
  const [formSignageStatus, setFormSignageStatus] = useState<'conforme' | 'faltante' | 'deteriorada'>('conforme');
  const [formAccessStatus, setFormAccessStatus] = useState<'libre' | 'obstruido'>('libre');
  const [formNextCheck, setFormNextCheck] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formPhDate, setFormPhDate] = useState(
    new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formNotes, setFormNotes] = useState('');

  // Limpieza y poda de historial para proteger la cuota de localStorage (5 MB)
  const sanitizeAndPruneHistory = (items: any[]): any[] => {
    return items.slice(0, 50).map((item, idx) => {
      // Conservar imagen solo en las 6 inspecciones más recientes
      if (idx >= 6 && item.image) {
        return { ...item, image: null };
      }
      // Purgar imágenes excesivamente pesadas (> 250 KB) en registros anteriores
      if (idx >= 3 && item.image && item.image.length > 250000) {
        return { ...item, image: null };
      }
      return item;
    });
  };

  // Persistencia multi-nivel anti QuotaExceededError
  const persistHistory = (list: any[]): any[] => {
    let sanitized = sanitizeAndPruneHistory(list);

    const tryWrite = (data: any[]): boolean => {
      try {
        const serialized = JSON.stringify(data);
        localStorage.setItem('extinguisher_checks', serialized);
        localStorage.setItem('extinguisher_ai_history', serialized);
        return true;
      } catch (e) {
        console.warn('[ExtinguisherAI] Cuota de almacenamiento alcanzada, reduciendo datos...', e);
        return false;
      }
    };

    // Nivel 1: Guardado normal saneado (hasta 6 miniaturas livianas)
    if (!tryWrite(sanitized)) {
      // Nivel 2: Conservar sólo las 2 imágenes más recientes
      sanitized = sanitized.map((item, idx) => (idx >= 2 ? { ...item, image: null } : item));
      if (!tryWrite(sanitized)) {
        // Nivel 3: Eliminar imágenes del historial completo pero salvaguardar todos los metadatos técnicos
        sanitized = sanitized.map((item) => ({ ...item, image: null }));
        if (!tryWrite(sanitized)) {
          // Nivel 4: Conservar las 20 inspecciones más recientes sin imágenes
          sanitized = sanitized.slice(0, 20);
          tryWrite(sanitized);
        }
      }
    }

    // Sincronización en la nube segura
    try {
      syncCollection('extinguisher_checks', sanitized);
      syncCollection('extinguisher_ai_history', sanitized);
    } catch (e) {
      console.warn('[ExtinguisherAI] Cloud sync fallback:', e);
    }

    return sanitized;
  };

  // Carga inicial y reactiva del historial
  const loadHistory = () => {
    const raw1 = localStorage.getItem('extinguisher_checks');
    const raw2 = localStorage.getItem('extinguisher_ai_history');
    let list1: any[] = [];
    let list2: any[] = [];
    try { if (raw1) list1 = JSON.parse(raw1); } catch {}
    try { if (raw2) list2 = JSON.parse(raw2); } catch {}

    const map = new Map<string, any>();
    [...list1, ...list2].forEach((item: any) => {
      if (item && item.id) {
        map.set(String(item.id), { ...map.get(String(item.id)), ...item });
      }
    });

    const merged = Array.from(map.values()).sort((a, b) => {
      const da = new Date(a.date || a.savedAt || 0).getTime();
      const db = new Date(b.date || b.savedAt || 0).getTime();
      return db - da;
    });

    const sanitized = sanitizeAndPruneHistory(merged);
    setHistory(sanitized);

    // Si había imágenes históricas gigantescas que ocupaban cuota innecesaria, compactarlas
    const hasBloat = merged.some((item, idx) => (idx >= 6 && item.image) || (item.image && item.image.length > 250000));
    if (hasBloat) {
      try {
        const serialized = JSON.stringify(sanitized);
        localStorage.setItem('extinguisher_checks', serialized);
        localStorage.setItem('extinguisher_ai_history', serialized);
      } catch (e) {
        console.warn('[ExtinguisherAI] Error al compactar cuota en loadHistory:', e);
      }
    }
  };

  useEffect(() => {
    loadHistory();
  }, [syncPulse]);

  // Borrado seguro
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = history.filter((item) => item.id !== deleteTarget);
    const saved = persistHistory(updated);
    setHistory(saved);
    setDeleteTarget(null);
    toast.success('Inspección eliminada');
  };

  // Exportar CSV
  const handleExportCSV = () => {
    if (history.length === 0) {
      toast.error('No hay inspecciones para exportar');
      return;
    }

    const filteredData = history.filter((item) => {
      const matchesSearch =
        (item.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.status || '').toLowerCase().includes(searchTerm.toLowerCase());
      const isVig = item.status === 'vigente' || item.expirationStatus === 'vigente';
      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'vigente' && isVig) ||
        (filterStatus === 'vencido' && !isVig);
      return matchesSearch && matchesFilter;
    });

    downloadCSV(
      filteredData.map((i) => ({
        fecha: i.date ? new Date(i.date).toLocaleDateString('es-AR') : i.savedAt ? new Date(i.savedAt).toLocaleDateString('es-AR') : '',
        tipo: formatType(i.type),
        estado: i.status === 'vigente' || i.expirationStatus === 'vigente' ? 'Vigente' : 'Vencido/Revisión',
        manometro: i.manometerStatus === 'zona_verde' ? 'Zona Verde (OK)' : i.manometerStatus === 'no_aplica' ? 'No Aplica (CO2)' : 'Fuera de Rango',
        capacidad: i.capacity || 'N/A',
        confianza: i.confidence ? `${Math.round(i.confidence * 100)}%` : '95%',
        proxima_revision: i.nextCheck ? new Date(i.nextCheck).toLocaleDateString('es-AR') : '30 días',
        inspector: i.inspectorName || 'Técnico H&S'
      })),
      'inspecciones_matafuegos_ia',
      {
        fecha: 'Fecha',
        tipo: 'Tipo Extintor',
        estado: 'Estado General',
        manometro: 'Estado Manómetro',
        capacidad: 'Capacidad',
        confianza: 'Confianza IA',
        proxima_revision: 'Próxima Revisión',
        inspector: 'Inspector'
      }
    );
    toast.success('Historial exportado a CSV');
  };

  const [isOpeningCamera, setIsOpeningCamera] = useState(false);

  const handleNewInspection = async () => {
    if (isMobileDevice()) {
      setIsOpeningCamera(true);
      const toastId = toast.loading('Abriendo cámara de alta resolución...');
      try {
        const photo = await captureFromNativeCamera({ maxDimension: 1600, quality: 0.85 });
        toast.dismiss(toastId);
        setIsOpeningCamera(false);
        if (photo) {
          setCapturedImage(photo);
          setIsCameraVisible(true);
          return;
        }
      } catch (err) {
        toast.dismiss(toastId);
        setIsOpeningCamera(false);
      }
    }
    setIsCameraVisible(true);
  };

  // Guardar nueva inspección desde la cámara
  const handleSaveInspection = async () => {
    if (!analysisResult) return;

    // Generar miniatura ultraliviana para almacenamiento permanente (~20-35 KB)
    let storageThumbnail: string | null = null;
    if (capturedImage) {
      try {
        storageThumbnail = await compressImage(capturedImage, {
          maxDimension: 400,
          quality: 0.65,
          force: true
        });
      } catch {
        storageThumbnail = capturedImage.length < 250000 ? capturedImage : null;
      }
    }

    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      savedAt: new Date().toISOString(),
      image: storageThumbnail,
      type: analysisResult.type || 'ABC',
      status: analysisResult.status || analysisResult.expirationStatus || 'vigente',
      manometerStatus: analysisResult.manometerStatus || 'zona_verde',
      manometerMessage: analysisResult.manometerMessage || 'Manómetro en cuadrante verde operativo.',
      sealStatus: analysisResult.sealStatus || 'intacto',
      pinStatus: analysisResult.pinStatus || 'presente',
      hoseStatus: analysisResult.hoseStatus || 'bueno',
      confidence: analysisResult.confidence || 0.95,
      capacity: formCapacity || analysisResult.capacity || '5 kg',
      lastCheck: analysisResult.lastCheck || new Date().toISOString().split('T')[0],
      lastCharge: analysisResult.lastCheck || new Date().toISOString().split('T')[0],
      nextCheck: formNextCheck || analysisResult.nextCheck || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      phDate: formPhDate || analysisResult.phDate || new Date(Date.now() + 365 * 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      hydraulicTestExpiry: formPhDate || analysisResult.phDate || new Date(Date.now() + 365 * 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recommendations: analysisResult.recommendations || [
        'Verificar presión mensual en manómetro (Norma IRAM 3517-2)',
        'Mantener chapa baliza y señalización IRAM 10005 visible',
        'Controlar acceso libre sin obstáculos a 1.20 m - 1.50 m de altura'
      ],
      inspectorName: inspectorName.trim() || 'Inspector Técnico H&S',
      signature: signature || null,
      company: formCompany.trim() || 'Planta Principal',
      location: formLocation.trim() || 'Sector General',
      extinguisherNumber: formExtinguisherNumber.trim() || `EXT-${String(history.length + 1).padStart(3, '0')}`,
      signageStatus: formSignageStatus,
      accessStatus: formAccessStatus,
      notes: formNotes.trim()
    };

    const updated = [newRecord, ...history];
    const saved = persistHistory(updated);
    setHistory(saved);

    toast.success('✅ Inspección guardada en el historial');
    setIsCameraVisible(false);
    setCapturedImage(null);
    setAnalysisResult(null);
    setSignature(null);
    setInspectorName('');
    setFormNotes('');
  };

  // Métricas KPI
  const metrics = {
    total: history.length,
    vigente: history.filter((i) => i.status === 'vigente' || i.expirationStatus === 'vigente').length,
    vencido: history.filter((i) => i.status !== 'vigente' && i.expirationStatus !== 'vigente').length,
    compliance: history.length > 0
      ? Math.round((history.filter((i) => i.status === 'vigente' || i.expirationStatus === 'vigente').length / history.length) * 100)
      : 100
  };

  // Filtrado de elementos
  const filtered = history.filter((item) => {
    const matchesSearch =
      (item.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.status || '').toLowerCase().includes(searchTerm.toLowerCase());
    const isVig = item.status === 'vigente' || item.expirationStatus === 'vigente';
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'vigente' && isVig) ||
      (filterStatus === 'vencido' && !isVig);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 font-bold">Cargando módulo de extintores...</div>
      </div>
    );
  }

  if (!isPro) return null;

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto pb-24 md:pb-16 px-4 sm:px-6 lg:px-8">
        {/* Modales de Confirmación y Compartir */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Eliminar Inspección de Extintor"
          message="¿Estás seguro de que deseas eliminar este registro de inspección? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />

        {qrTarget && (
          <QRModal
            text={qrTarget.text}
            title={qrTarget.title}
            onClose={() => setQrTarget(null)}
          />
        )}

        <ShareModal
          isOpen={!!shareItem && !document.body.classList.contains('printing-isolated')}
          open={!!shareItem && !document.body.classList.contains('printing-isolated')}
          onClose={() => setShareItem(null)}
          title={`Inspección IA — Extintor ${formatType(shareItem?.type) || ''}`}
          text={
            shareItem
              ? `🧯 INFORME DE EXTINTOR IA

📌 Tipo: ${formatType(shareItem.type)}
⚙️ Manómetro: ${shareItem.manometerStatus === 'zona_verde' ? '🟢 Zona Verde (OK)' : '⚠️ Revisión'}
🛡️ Estado: ${shareItem.status === 'vigente' || shareItem.expirationStatus === 'vigente' ? '✅ Vigente / Operativo' : '⚠️ Vencido / Requiere Recarga'}
📅 Fecha: ${new Date(shareItem.date || shareItem.savedAt).toLocaleDateString('es-AR')}

Generado con Asistente HYS`
              : ''
          }
          rawMessage={
            shareItem
              ? `🧯 INFORME DE EXTINTOR IA

📌 Tipo: ${formatType(shareItem.type)}
⚙️ Manómetro: ${shareItem.manometerStatus === 'zona_verde' ? '🟢 Zona Verde (OK)' : '⚠️ Revisión'}
🛡️ Estado: ${shareItem.status === 'vigente' || shareItem.expirationStatus === 'vigente' ? '✅ Vigente / Operativo' : '⚠️ Vencido / Requiere Recarga'}
📅 Fecha: ${new Date(shareItem.date || shareItem.savedAt).toLocaleDateString('es-AR')}

Generado con Asistente HYS`
              : ''
          }
          elementIdToPrint="pdf-content-ext-ai"
          fileName={`Inspeccion_Extintor_IA_${(shareItem?.type || 'General').replace(/\s+/g, '_')}.pdf`}
        />

        {/* Portal fuera de pantalla para impresión limpia y exportación */}
        {typeof document !== 'undefined' &&
          createPortal(
            <div className="ats-pdf-offscreen">
              {shareItem && <ExtinguisherAIPdfGenerator item={shareItem} />}
            </div>,
            document.body
          )}

        {/* Modal de Detalle Completo de la Inspección */}
        {selectedInspection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <Flame size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white m-0">
                      Extintor {formatType(selectedInspection.type)}
                    </h3>
                    <p className="text-xs text-slate-500 m-0">
                      Fecha: {new Date(selectedInspection.date || selectedInspection.savedAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInspection(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Contenido del Detalle */}
              <div className="space-y-4">
                {selectedInspection.image && (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-[280px] flex items-center justify-center">
                    <img
                      src={selectedInspection.image}
                      alt="Extintor"
                      className="max-h-[280px] w-auto object-contain mx-auto"
                    />
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white shadow ${
                          selectedInspection.status === 'vigente' || selectedInspection.expirationStatus === 'vigente'
                            ? 'bg-emerald-600'
                            : 'bg-rose-600'
                        }`}
                      >
                        {selectedInspection.status === 'vigente' || selectedInspection.expirationStatus === 'vigente'
                          ? 'VIGENTE'
                          : 'REVISIÓN'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Manómetro y Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1 flex items-center gap-1.5">
                      <Gauge size={14} className="text-blue-500" /> Manómetro (Presión)
                    </div>
                    <div className="text-sm font-black text-slate-800 dark:text-white">
                      {selectedInspection.manometerStatus === 'zona_verde'
                        ? '🟢 Zona Verde (Presión Correcta)'
                        : selectedInspection.manometerStatus === 'no_aplica'
                        ? '🔵 Sin Manómetro (CO2 Alta Presión)'
                        : '🔴 Despresurizado / Requiere Carga'}
                    </div>
                    {selectedInspection.manometerMessage && (
                      <p className="text-xs text-slate-500 mt-1 mb-0">{selectedInspection.manometerMessage}</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1 flex items-center gap-1.5">
                      <Package size={14} className="text-blue-500" /> Capacidad & Clases
                    </div>
                    <div className="text-sm font-black text-slate-800 dark:text-white">
                      {selectedInspection.capacity || '5 kg'} — {EXTINTOR_INFO[selectedInspection.type]?.fires || 'Clase A, B, C'}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 mb-0">
                      Confianza IA: {Math.round((selectedInspection.confidence || 0.95) * 100)}%
                    </p>
                  </div>
                </div>

                {/* Recomendaciones */}
                {selectedInspection.recommendations?.length > 0 && (
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                    <div className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase mb-2">
                      Recomendaciones Preventivas
                    </div>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 pl-4 m-0">
                      {selectedInspection.recommendations.map((rec: string, i: number) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Firma */}
                {selectedInspection.signature && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-2">Firma del Inspector</div>
                    <img
                      src={selectedInspection.signature}
                      alt="Firma"
                      className="h-16 mx-auto object-contain border-b border-slate-300 dark:border-slate-600 pb-1"
                    />
                    <div className="text-xs font-bold text-slate-800 dark:text-white mt-1">
                      {selectedInspection.inspectorName || 'Inspector Técnico'}
                    </div>
                  </div>
                )}
              </div>

              {/* Botones del Modal */}
              <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedInspection;
                    setSelectedInspection(null);
                    setShareItem(item);
                  }}
                  style={{ margin: 0, padding: '0 14px', height: '40px', fontSize: '0.78rem' }}
                  className="rounded-xl font-extrabold bg-[#059669] text-white flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors cursor-pointer"
                >
                  <Share2 size={14} className="shrink-0" />
                  <span>Compartir / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInspection(null)}
                  style={{ margin: 0, padding: '0 14px', height: '40px', fontSize: '0.78rem' }}
                  className="rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer flex items-center justify-center"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Encabezado Premium Sobrio y Profesional */}
        <PremiumHeader
          title="Matafuegos IA — Reconocimiento y Manómetro"
          subtitle="Inspección visual de extintores, verificación de manómetro (presión) y control de marbete"
          badge="IRAM 3517 & Dec. 351/79"
          icon={<Flame size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/')}
        />

        {/* MODO CÁMARA / NUEVA INSPECCIÓN */}
        {isCameraVisible ? (
          <div className="mt-6 space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCameraVisible(false);
                  setCapturedImage(null);
                  setAnalysisResult(null);
                }}
                style={{ margin: 0, padding: '0 14px', height: '40px', fontSize: '0.78rem' }}
                className="flex items-center justify-center gap-2 font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
              >
                <ArrowLeft size={16} className="shrink-0" />
                <span>Volver al Historial</span>
              </button>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nueva Inspección Asistida por IA
              </span>
            </div>

            {/* Escáner de Visión Inteligente */}
            {!analysisResult ? (
              <ExtinguisherManometerAnalyzer
                initialImage={capturedImage || undefined}
                onCancel={() => {
                  setIsCameraVisible(false);
                  setCapturedImage(null);
                }}
                onAnalysisComplete={(res, img) => {
                  setCapturedImage(img);
                  setFormNextCheck(
                    res.expirationDate ||
                      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  );
                  setFormExtinguisherNumber(`EXT-${String(history.length + 1).padStart(3, '0')}`);
                  setAnalysisResult({
                    extinguisherDetected: true,
                    type: res.type,
                    status: res.expirationStatus,
                    expirationStatus: res.expirationStatus,
                    manometerStatus: res.manometerStatus,
                    manometerMessage: res.manometerMessage,
                    sealStatus: res.sealStatus,
                    pinStatus: res.pinStatus,
                    hoseStatus: res.hoseStatus,
                    confidence: (res.confidenceScore || 95) / 100,
                    recommendations: res.recommendations
                  });
                }}
              />
            ) : (
              /* Panel de Revisión Técnica y Firma antes de Guardar */
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 sm:p-8 shadow-xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl shrink-0">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0">
                        Diagnóstico IA Completado — Ficha Técnica IRAM 3517-2
                      </h3>
                      <p className="text-xs text-slate-500 m-0">
                        Revisá o completá los datos técnicos del extintor antes de guardar el acta oficial.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAnalysisResult(null);
                      setCapturedImage(null);
                    }}
                    style={{ margin: 0, padding: '0 14px', height: '38px', fontSize: '0.78rem' }}
                    className="flex items-center justify-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} className="shrink-0" />
                    <span>Reintentar Foto</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna Izquierda: Foto + Datos de Identificación */}
                  <div className="space-y-4">
                    {capturedImage && (
                      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center min-h-[240px]">
                        <img
                          src={capturedImage}
                          alt="Captura"
                          className="max-h-[240px] w-auto object-contain mx-auto"
                        />
                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase text-white shadow ${
                              analysisResult.status === 'vigente' ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          >
                            {analysisResult.status === 'vigente' ? 'VIGENTE' : 'REVISIÓN'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }} className="text-slate-600 dark:text-slate-300 uppercase block">
                          Empresa / Establecimiento
                        </label>
                        <input
                          type="text"
                          value={formCompany}
                          onChange={(e) => setFormCompany(e.target.value)}
                          placeholder="Ej: Planta Principal"
                          style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.82rem' }}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                        />
                      </div>

                      <div>
                        <label style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }} className="text-slate-600 dark:text-slate-300 uppercase block">
                          Sector / Ubicación Física
                        </label>
                        <input
                          type="text"
                          value={formLocation}
                          onChange={(e) => setFormLocation(e.target.value)}
                          placeholder="Ej: Nave 1 / Tablero General"
                          style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.82rem' }}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                        />
                      </div>

                      <div>
                        <label style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }} className="text-slate-600 dark:text-slate-300 uppercase block">
                          N° Extintor / Marbete
                        </label>
                        <input
                          type="text"
                          value={formExtinguisherNumber}
                          onChange={(e) => setFormExtinguisherNumber(e.target.value)}
                          placeholder="Ej: EXT-001"
                          style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.82rem' }}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                        />
                      </div>

                      <div>
                        <label style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }} className="text-slate-600 dark:text-slate-300 uppercase block">
                          Capacidad Nominal
                        </label>
                        <select
                          value={formCapacity}
                          onChange={(e) => setFormCapacity(e.target.value)}
                          style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.82rem' }}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                        >
                          <option value="1 kg">1 kg</option>
                          <option value="2.5 kg">2.5 kg</option>
                          <option value="3.5 kg">3.5 kg (CO2)</option>
                          <option value="5 kg">5 kg</option>
                          <option value="10 kg">10 kg</option>
                          <option value="25 kg">25 kg (Carro)</option>
                          <option value="50 kg">50 kg (Carro)</option>
                          <option value="6 Lts">6 Litros (Clase K)</option>
                          <option value="10 Lts">10 Litros (Agua/Espuma)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Parámetros Técnicos IRAM 3517-2 + Firma */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }} className="text-slate-600 dark:text-slate-300 uppercase block">
                          Tipo de Agente Extintor
                        </label>
                        <select
                          value={analysisResult.type || 'ABC'}
                          onChange={(e) => setAnalysisResult({ ...analysisResult, type: e.target.value })}
                          style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.82rem' }}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                        >
                          <option value="ABC">Polvo Químico ABC</option>
                          <option value="CO2">Dióxido de Carbono (CO2)</option>
                          <option value="Agua">Agua Bajo Presión</option>
                          <option value="Espuma">Espuma Mecánica AFFF</option>
                          <option value="K">Acetato de Potasio (Clase K)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }} className="text-slate-600 dark:text-slate-300 uppercase block">
                          Estado Vigencia Marbete
                        </label>
                        <select
                          value={analysisResult.status || 'vigente'}
                          onChange={(e) =>
                            setAnalysisResult({
                              ...analysisResult,
                              status: e.target.value,
                              expirationStatus: e.target.value
                            })
                          }
                          style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.82rem' }}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                        >
                          <option value="vigente">✓ Carga Vigente</option>
                          <option value="por_vencer">⚠️ Próximo a Vencer</option>
                          <option value="vencido">✕ Vencido (Recargar)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }} className="text-slate-600 dark:text-slate-300 uppercase block">
                          Lectura Manómetro
                        </label>
                        <select
                          value={analysisResult.manometerStatus || 'zona_verde'}
                          onChange={(e) =>
                            setAnalysisResult({
                              ...analysisResult,
                              manometerStatus: e.target.value,
                              manometerMessage:
                                e.target.value === 'zona_verde'
                                  ? 'Manómetro en Rango Operativo (Zona Verde: 1.2-1.4 MPa).'
                                  : e.target.value === 'descargado'
                                    ? 'Manómetro en Zona Roja (Descargado / Baja Presión).'
                                    : e.target.value === 'sobrepresionado'
                                      ? 'Manómetro Sobrepresionado (Verificar válvula).'
                                      : 'Sin manómetro (CO2 Alta Presión — Control por peso).'
                            })
                          }
                          style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.82rem' }}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                        >
                          <option value="zona_verde">🟢 Zona Verde (1.2-1.4 MPa)</option>
                          <option value="descargado">🔴 Descargado / Baja Presión</option>
                          <option value="sobrepresionado">🟠 Sobrepresionado</option>
                          <option value="no_aplica">🔵 No Aplica (CO2)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }} className="text-slate-600 dark:text-slate-300 uppercase block">
                          Vto. Recarga Anual
                        </label>
                        <input
                          type="date"
                          value={formNextCheck}
                          onChange={(e) => setFormNextCheck(e.target.value)}
                          style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.82rem' }}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                        />
                      </div>

                      <div>
                        <label style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }} className="text-slate-600 dark:text-slate-300 uppercase block">
                          Chapa Baliza IRAM 10005
                        </label>
                        <select
                          value={formSignageStatus}
                          onChange={(e) => setFormSignageStatus(e.target.value as any)}
                          style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.82rem' }}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                        >
                          <option value="conforme">✓ Chapa Baliza Conforme</option>
                          <option value="faltante">✕ Sin Chapa Baliza</option>
                          <option value="deteriorada">⚠️ Señalización Deteriorada</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }} className="text-slate-600 dark:text-slate-300 uppercase block">
                          Acceso y Altura (1.20-1.50m)
                        </label>
                        <select
                          value={formAccessStatus}
                          onChange={(e) => setFormAccessStatus(e.target.value as any)}
                          style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.82rem' }}
                          className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                        >
                          <option value="libre">✓ Acceso Libre y Altura OK</option>
                          <option value="obstruido">✕ Acceso Obstruido / Fuera Altura</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 800 }} className="text-slate-600 dark:text-slate-300 uppercase block">
                        Observaciones Técnicas del Profesional
                      </label>
                      <input
                        type="text"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Observaciones adicionales (estado soporte, manguera, precinto...)"
                        style={{ margin: 0, padding: '0.45rem 0.75rem', height: '38px', fontSize: '0.82rem' }}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Firma Digital del Responsable de Sector (Opcional, la firma del Profesional sale automática del perfil) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="text-xs text-slate-500 font-bold uppercase">
                        Firma Conformidad Responsable del Sector (Opcional)
                      </div>
                      <input
                        type="text"
                        placeholder="Nombre y Apellido del Responsable del Sector"
                        value={inspectorName}
                        onChange={(e) => setInspectorName(e.target.value)}
                        style={{ margin: 0, padding: '0.45rem 0.75rem', height: '36px', fontSize: '0.8rem' }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                      <SignatureCanvas onSave={(sig) => setSignature(sig)} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCameraVisible(false);
                      setAnalysisResult(null);
                      setCapturedImage(null);
                    }}
                    style={{ margin: 0, padding: '0 18px', height: '42px', fontSize: '0.8rem' }}
                    className="rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInspection}
                    style={{ margin: 0, padding: '0 20px', height: '42px', fontSize: '0.82rem' }}
                    className="rounded-xl font-extrabold bg-[#059669] hover:bg-emerald-600 text-white flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>GUARDAR ACTA</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MODO HISTORIAL / TABLERO ESTILO APTITUDES MÉDICAS */
          <>
            {/* 4 Tarjetas KPI interactivas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div
                onClick={() => setFilterStatus('all')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Inspecciones</span>
                  <Layers size={20} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
                <span className="text-[11px] text-slate-500">Matafuegos escaneados</span>
              </div>

              <div
                onClick={() => setFilterStatus('vigente')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  filterStatus === 'vigente'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Operativos / Vigentes</span>
                  <CheckCircle2 size={20} />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.vigente}</div>
                <span className="text-[11px] text-slate-500">Presión y marbete OK</span>
              </div>

              <div
                onClick={() => setFilterStatus('vencido')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  filterStatus === 'vencido'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Con Desvíos</span>
                  <AlertTriangle size={20} />
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.vencido}</div>
                <span className="text-[11px] text-slate-500">Requieren recarga o prueba</span>
              </div>

              <div
                onClick={() => setFilterStatus('all')}
                className="p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-400"
              >
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Cumplimiento Global</span>
                  <BarChart2 size={20} />
                </div>
                <div className="text-2xl font-black text-slate-700 dark:text-slate-300">{metrics.compliance}%</div>
                <span className="text-[11px] text-slate-500">Aptitud según IRAM 3517</span>
              </div>
            </div>

            {/* Toolbar de Búsqueda y Botones de Acción Responsiva */}
            <div className="mt-8 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-xs h-[40px]">
                  <Search
                    size={16}
                    className="text-slate-400 pointer-events-none z-10"
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'block'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Buscar por tipo, estado o sector..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      margin: 0,
                      marginBottom: 0,
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      paddingLeft: '2.4rem',
                      paddingRight: '0.85rem',
                      height: '40px',
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
                  {/* Botón Exportar CSV */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    title="Exportar historial de inspecciones a CSV"
                    style={{
                      margin: 0,
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0 14px',
                      fontSize: '12px',
                      fontWeight: '800',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      height: '40px',
                      width: '100%',
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                      minHeight: 'unset'
                    }}
                  >
                    <FileSpreadsheet size={15} className="shrink-0" />
                    <span>Exportar CSV</span>
                  </button>

                  {/* Botón Nueva Inspección */}
                  <button
                    type="button"
                    onClick={handleNewInspection}
                    disabled={isOpeningCamera}
                    style={{
                      margin: 0,
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0 14px',
                      fontSize: '12px',
                      fontWeight: '800',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      height: '40px',
                      width: '100%',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                      minHeight: 'unset'
                    }}
                  >
                    <Plus size={15} className="shrink-0" />
                    <span>Nueva Inspección</span>
                  </button>
                </div>
              </div>

              {/* Pastillas de Filtro Responsivas */}
              <div className="grid grid-cols-3 sm:flex items-center gap-2 pb-1 max-w-full">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  style={{
                    margin: 0,
                    backgroundColor: filterStatus === 'all' ? '#0284c7' : undefined,
                    color: filterStatus === 'all' ? '#ffffff' : undefined,
                    border: filterStatus === 'all' ? '1px solid #0284c7' : undefined,
                    padding: '0 12px',
                    height: '36px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    minHeight: 'unset'
                  }}
                  className={filterStatus === 'all' ? '' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'}
                >
                  <span>Todos ({metrics.total})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus('vigente')}
                  style={{
                    margin: 0,
                    backgroundColor: filterStatus === 'vigente' ? '#059669' : undefined,
                    color: filterStatus === 'vigente' ? '#ffffff' : undefined,
                    border: filterStatus === 'vigente' ? '1px solid #059669' : undefined,
                    padding: '0 12px',
                    height: '36px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    minHeight: 'unset'
                  }}
                  className={filterStatus === 'vigente' ? '' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'}
                >
                  <span>Vigentes ({metrics.vigente})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus('vencido')}
                  style={{
                    margin: 0,
                    backgroundColor: filterStatus === 'vencido' ? '#d97706' : undefined,
                    color: filterStatus === 'vencido' ? '#ffffff' : undefined,
                    border: filterStatus === 'vencido' ? '1px solid #d97706' : undefined,
                    padding: '0 12px',
                    height: '36px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    minHeight: 'unset'
                  }}
                  className={filterStatus === 'vencido' ? '' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'}
                >
                  <span>Desvíos ({metrics.vencido})</span>
                </button>
              </div>
            </div>

            {/* Listado de Tarjetas */}
            {filtered.length === 0 ? (
              <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
                <EmptyStateIllustrated
                  title="No hay inspecciones de extintores"
                  description="Apunta la cámara al extintor para analizar automáticamente su manómetro de presión, etiqueta, vigencia y precinto de seguridad."
                  actionLabel="Nueva Inspección IA"
                  onAction={handleNewInspection}
                />
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((item: any) => {
                  const isVig = item.status === 'vigente' || item.expirationStatus === 'vigente';

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                              <Flame size={20} />
                            </span>
                            <div>
                              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[180px]">
                                {formatType(item.type)} {item.extinguisherNumber ? `· ${item.extinguisherNumber}` : ''}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                                {item.company ? `${item.company} — ` : ''}{item.location || 'Planta Operativa'}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isVig
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {isVig ? 'VIGENTE' : 'REVISIÓN'}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400 shrink-0" />
                            <span>
                              Fecha: {new Date(item.date || item.savedAt).toLocaleDateString('es-AR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Gauge size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate">
                              Manómetro:{' '}
                              <strong
                                className={
                                  item.manometerStatus === 'zona_verde'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }
                              >
                                {item.manometerStatus === 'zona_verde'
                                  ? 'Zona Verde (OK)'
                                  : item.manometerStatus === 'no_aplica'
                                  ? 'No aplica (CO2)'
                                  : 'Fuera de rango'}
                              </strong>
                            </span>
                          </div>
                          {item.capacity && (
                            <div className="flex items-center gap-2">
                              <Package size={14} className="text-slate-400 shrink-0" />
                              <span>Capacidad: <strong>{item.capacity}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-4 sm:flex sm:justify-end gap-1.5">
                        {/* Botón Ver */}
                        <button
                          type="button"
                          onClick={() => setSelectedInspection(item)}
                          title="Ver Diagnóstico Completo"
                          style={{
                            margin: 0,
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            minHeight: 'unset'
                          }}
                        >
                          <Eye size={12} className="shrink-0" />
                          <span>Ver</span>
                        </button>

                        {/* Botón Compartir */}
                        <button
                          type="button"
                          onClick={() => setShareItem(item)}
                          title="Compartir / PDF"
                          style={{
                            margin: 0,
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            minHeight: 'unset'
                          }}
                        >
                          <Share2 size={12} className="shrink-0" />
                          <span>PDF</span>
                        </button>

                        {/* Botón QR */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/v/${currentUser?.uid}/extinguisher/${item.id}?print=true`;
                            setQrTarget({ text: url, title: `Inspección Extintor ${formatType(item.type)}` });
                          }}
                          title="Código QR"
                          style={{
                            margin: 0,
                            backgroundColor: '#475569',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            minHeight: 'unset'
                          }}
                        >
                          <QrCode size={12} className="shrink-0" />
                          <span>QR</span>
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item.id)}
                          title="Eliminar Registro"
                          style={{
                            margin: 0,
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            minHeight: 'unset'
                          }}
                        >
                          <Trash2 size={12} className="shrink-0" />
                          <span>Borrar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AnimatedPage>
  );
}
