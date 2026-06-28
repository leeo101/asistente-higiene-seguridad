import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ArrowLeft, Send, ShieldAlert, HardHat,
  Lightbulb, Gavel, ClipboardList, Copy,
  Check, Download, Sparkles, Loader2,
  Mic, MicOff, History, ChevronDown, ChevronUp,
  RotateCcw, Clock, Database, Zap, Plus, Trash2, Calendar, FileText, QrCode, Share2, Search } from
'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';
import AdBanner from '../components/AdBanner';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { auth } from '../firebase';
import { useSync } from '../contexts/SyncContext';
import { DataTable } from '../components/DataTable';
import PremiumHeader from '../components/PremiumHeader';
import Breadcrumbs from '../components/Breadcrumbs';
import QRModal from '../components/QRModal';
import ShareModal from '../components/ShareModal';
import AiAdvisorPdfGenerator from '../components/AiAdvisorPdfGenerator';
import { downloadCSV } from '../services/exportCsv';
import { getErrorMessage } from '../utils/errorUtils';

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar registro?"
      message="Esta acción no se puede deshacer."
      iconEmoji="🗑️" />);


}

// ── Subcomponent for history panel ─────────────────────────────────────────
function HistoryPanel({ onLoad }) {
  const [open, setOpen] = useState(false);
  let history = [];
  try {
    const raw = localStorage.getItem('ai_advisor_history');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        history = parsed.filter((item) => item && item.id && item.task).slice(0, 5);
      }
    }
  } catch (err) {
    console.error("Error loading ai_advisor_history:", err);
  }

  if (history.length === 0) return null;

  return (
    <div className="mb-6">
            <button
        onClick={() => setOpen((o) => !o)}
        style={{


          borderRadius: open ? '14px 14px 0 0' : '14px'

        }} className="w-[100%] flex items-center justify-space-between bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] p-[0.85rem_1.2rem] cursor-pointer transition-[all_0.2s]">
        
                <span className="flex items-center gap-[0.6rem] font-[700] text-[0.9rem]">
                    <History size={16} color="var(--color-primary)" />
                    Consultas anteriores ({history.length})
                </span>
                {open ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
            </button>
            {open &&
      <div className="border-[1px_solid_var(--color-border)] border-top-[none] rounded-[0_0_14px_14px] overflow-[hidden]">


        
                    {history.map((item, i) =>
        <div
          key={item.id}
          style={{

            borderBottom: i < history.length - 1 ? '1px solid var(--color-border)' : 'none'



          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-surface)'} className="p-[0.9rem_1.2rem] flex items-center gap-[1rem] bg-[var(--color-surface)] transition-[background_0.15s]">
          
                            <div className="flex-[1] min-width-[0]">
                                <div className="font-[600] text-[0.88rem] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">
                                    {item.task}
                                </div>
                                <div className="text-[0.72rem] text-[var(--color-text-muted)] flex items-center gap-[0.3rem] mt-[0.2rem]">
                                    <Clock size={11} />
                                    {new Date(item.date).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <button
            onClick={() => onLoad(item)}
            title="Cargar esta consulta" className="bg-[rgba(59,130,246,0.1)] border-[1px_solid_rgba(59,130,246,0.2)] rounded-[8px] p-[0.4rem_0.7rem] text-[var(--color-primary)] cursor-pointer text-[0.75rem] font-[700] flex items-center gap-[0.3rem] white-space-[nowrap] flex-shrink-[0]">








            
                                <RotateCcw size={12} /> Cargar
                            </button>
                        </div>
        )}
                </div>
      }
        </div>);

}

const LOADING_MESSAGES = [
"Analizando contexto de la tarea...",
"Identificando riesgos potenciales...",
"Seleccionando Elementos de Protección Personal...",
"Redactando medidas preventivas...",
"Consultando la normativa local aplicable...",
"Dando los toques finales al reporte..."];


const QUICK_PROMPTS = [
"Trabajos en altura con andamios",
"Limpieza de tanque de combustible",
"Excavación manual en vía pública",
"Trabajos en caliente",
"Uso de amoladora angular"];


export default function AIChatAdvisor(): React.ReactElement | null {
  useDocumentTitle('Asesor IA - H&S');
  const navigate = useNavigate();
  const location = useLocation();
  const [showForm, setShowForm] = useState(location.pathname.includes('/nueva'));
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [userCountry, setUserCountry] = useState('argentina');

  const { syncCollection, syncPulse } = useSync();
  const [history, setHistory] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [shareItem, setShareItem] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const isNew = location.pathname.includes('/nueva');
    setShowForm(isNew);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai_advisor_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed.filter((item: any) => item && item.id && item.task));
        } else {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Error parsing AI history:", err);
      setHistory([]);
    }
  }, [showForm, syncPulse]);

  useEffect(() => {
    const savedData = localStorage.getItem('personalData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.country) setUserCountry(parsed.country);
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      setLoadingTextIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz. Prueba con Chrome.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    const langMap: Record<string, string> = {
      chile: 'es-CL', bolivia: 'es-BO', paraguay: 'es-PY', uruguay: 'es-UY', argentina: 'es-AR'
    };
    recognition.lang = langMap[userCountry] || 'es-AR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTask((prev) => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };

    recognition.start();
  };

  const getRecentContext = () => {
    const safeParse = (key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw || raw === 'undefined') return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error(`[Advisor IA] Error parsing ${key}:`, err);
        return [];
      }
    };

    try {
      const ats = safeParse('atsHistory').
      sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).
      slice(0, 3).
      map((a) => `- Fecha: ${a.fecha}, Tarea: ${a.tarea}, Ubicación: ${a.ubicacion}`);

      const insp = safeParse('inspections_history').
      sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).
      slice(0, 3).
      map((i) => `- Fecha: ${i.date}, Sector: ${i.sector}, Resultado: ${i.score}%`);

      const risk = safeParse('risk_assessment_history').
      sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()).
      slice(0, 3).
      map((r) => `- Fecha: ${r.date || r.createdAt && r.createdAt.split('T')[0]}, Tarea: ${r.name}, Nivel de Riesgo: ${r.riskLevel}`);

      let ctx = [];
      if (ats.length) ctx.push("ÚLTIMOS ATS CREADOS:\n" + ats.join("\n"));
      if (insp.length) ctx.push("ÚLTIMAS INSPECCIONES REALIZADAS:\n" + insp.join("\n"));
      if (risk.length) ctx.push("ÚLTIMAS EVALUACIONES DE RIESGO:\n" + risk.join("\n"));
      return ctx.join("\n\n");
    } catch (err) {
      console.error("[Advisor IA] Error getting context:", err);
      return "";
    }
  };

  const handleNewQuery = () => {
    setResult(null);
    setTask('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadHistory = (item) => {
    setTask(item.task);
    setResult(item);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    setLoading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Color Palette
      const colors = {
        primary: [37, 99, 235] as [number, number, number], // blue-600
        danger: [239, 68, 68] as [number, number, number], // red-500
        success: [16, 185, 129] as [number, number, number], // emerald-500
        warning: [249, 115, 22] as [number, number, number], // orange-500
        text: [31, 41, 55] as [number, number, number],
        muted: [107, 114, 128] as [number, number, number],
        border: [229, 231, 235] as [number, number, number]
      };

      // Enterprise Header
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Logo Placeholder or Text Left
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE IA H&S', 15, 18);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Análisis Estadístico y Preventivo Inteligente', 15, 25);

      // Right side details
      doc.setFontSize(9);
      const dateStr = `Generado: ${new Date().toLocaleDateString()}`;
      const timeStr = `Hora: ${new Date().toLocaleTimeString()}`;
      const countryStr = `Contexto legal: ${userCountry.toUpperCase()}`;

      doc.text(dateStr, pageWidth - 15, 15, { align: 'right' });
      doc.text(timeStr, pageWidth - 15, 21, { align: 'right' });
      doc.text(countryStr, pageWidth - 15, 27, { align: 'right' });

      // Beautiful Underline in Header (Light white/blue tint, mixed manually)
      doc.setDrawColor(Math.round(255 * 0.3 + 37 * 0.7), Math.round(255 * 0.3 + 99 * 0.7), Math.round(255 * 0.3 + 235 * 0.7));
      doc.line(15, 32, pageWidth - 15, 32);

      // Task Description Area
      let currentY = 50;
      doc.setFillColor(249, 250, 251); // gray-50
      doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, 'F');
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, 'S');

      doc.setTextColor(...colors.text);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Descripción de la Tarea/Situación:', 20, currentY + 8);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const taskLines = doc.splitTextToSize(result.task, pageWidth - 40);
      doc.text(taskLines, 20, currentY + 15);

      currentY += 35 + taskLines.length * 5 - 5;

      // Sections
      const createSection = (title, items, color, iconContext = '') => {
        // Section Title Box
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(15, currentY, 5, 8, 'F');
        // Calculate 10% tint mixed with 90% white background
        const bgR = Math.round(color[0] * 0.1 + 255 * 0.9);
        const bgG = Math.round(color[1] * 0.1 + 255 * 0.9);
        const bgB = Math.round(color[2] * 0.1 + 255 * 0.9);
        doc.setFillColor(bgR, bgG, bgB);
        doc.rect(20, currentY, pageWidth - 35, 8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(title.toUpperCase(), 23, currentY + 6);
        currentY += 12;

        if (!items || items.length === 0) {
          doc.setTextColor(...colors.muted);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          doc.text('No se detectaron elementos en esta sección.', 20, currentY + 2);
          currentY += 10;
          return;
        }

        autoTable(doc, {
          startY: currentY,
          body: items.map((item) => [item]),
          columns: [{ header: '', dataKey: 'item' }],
          theme: 'plain',
          styles: {
            fontSize: 9.5,
            cellPadding: { top: 2, right: 4, bottom: 2, left: 2 },
            textColor: colors.text
          },
          columnStyles: { 0: { cellWidth: pageWidth - 35 } },
          margin: { left: 20 },
          didDrawCell: (data) => {
            // Drawing a tiny bullet point for each item
            doc.setFillColor(color[0], color[1], color[2]);
            doc.circle(18, data.cell.y + data.cell.height / 2, 0.8, 'F');
          },
          didDrawPage: (data) => {currentY = data.cursor.y;}
        });
        currentY += 8;
      };

      createSection('Riesgos Detectados', result.riesgos, colors.danger);
      createSection('EPP Recomendado', result.epp, colors.primary);
      createSection('Medidas Preventivas', result.recomendaciones, colors.success);

      const countryLabel = userCountry.charAt(0).toUpperCase() + userCountry.slice(1);
      createSection(`Marco Legal (${countryLabel})`, result.normativa, [139, 92, 246]); // violet-500

      // Professional Signature Section
      const personalData = JSON.parse(localStorage.getItem('personalData') || '{}');
      const profName = personalData.fullName || 'Profesional de HyS';
      const profMat = personalData.matricula || '---';
      const profTitle = personalData.profesion || 'Higiene y Seguridad';
      const userSignature = localStorage.getItem('userSignature'); // Base64 image
      const userStamp = localStorage.getItem('userStamp'); // Optional stamp

      currentY += 25;
      if (currentY > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        currentY = 25;
      }

      const signBoxWidth = 80;
      const signX = pageWidth - signBoxWidth - 15;
      const signBoxHeight = 45;

      // Optional: Draw a subtle box for the signature
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(signX, currentY, signBoxWidth, signBoxHeight, 2, 2, 'S');

      // Insert Signature Image if available
      try {
        if (userSignature) {
          doc.addImage(userSignature, 'PNG', signX + 15, currentY + 2, 50, 20);
        } else {
          doc.setTextColor(...colors.muted);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.text('Firma Digital Pendiente', signX + signBoxWidth / 2, currentY + 15, { align: 'center' });
        }
      } catch (e) {
        console.warn('Could not insert signature image', e);
      }

      // Divider line for Name
      doc.setDrawColor(colors.muted[0], colors.muted[1], colors.muted[2]);
      doc.setLineWidth(0.4);
      doc.line(signX + 10, currentY + 26, signX + signBoxWidth - 10, currentY + 26);

      doc.setTextColor(...colors.text);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(profName, signX + signBoxWidth / 2, currentY + 31, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...colors.muted);
      doc.text(profTitle, signX + signBoxWidth / 2, currentY + 36, { align: 'center' });
      doc.text(`Mat: ${profMat}`, signX + signBoxWidth / 2, currentY + 41, { align: 'center' });

      // Add stamp text if needed (manually blended 20% blue over white background)
      if (!userStamp && profName !== 'Profesional de HyS') {
        const stampR = Math.round(37 * 0.2 + 255 * 0.8);
        const stampG = Math.round(99 * 0.2 + 255 * 0.8);
        const stampB = Math.round(235 * 0.2 + 255 * 0.8);
        doc.setTextColor(stampR, stampG, stampB);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bolditalic');
        doc.text('VALIDADO POR H&S', signX + 15, currentY + 12, { angle: -15 });
      }

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(...colors.muted);
      doc.text('Generado por Asistente de Higiene y Seguridad Profesional - Todos los derechos reservados', pageWidth / 2, pageHeight - 10, { align: 'center' });

      doc.save(`Analisis_HYS_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('[PDF ERROR]', error);
      toast.error('Error al generar el PDF. Revisa que el navegador no esté bloqueando las descargas.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.trim()) return;

    setLoading(true);
    setResult(null);
    setLoadingTextIndex(0);

    try {
      const contextData = getRecentContext();
      const response = await fetch(`${API_BASE_URL}/api/ai-advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
        },
        body: JSON.stringify({ taskDescription: task, contextData, country: userCountry })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor (${response.status})`);
      }

      const data = await response.json();
      setResult(data);

      let history = [];
      try {
        const raw = localStorage.getItem('ai_advisor_history');
        if (raw && raw !== 'undefined' && raw !== '') {
          const parsed = JSON.parse(raw);
          history = Array.isArray(parsed) ? parsed : [];
        }
      } catch (err) {
        console.error("[Advisor IA] Error parsing history for save:", err);
        history = [];
      }

      const newRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        ...data
      };
      try {
        const updatedHistory = [newRecord, ...history].slice(0, 50); // Keep more items now
        localStorage.setItem('ai_advisor_history', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
        syncCollection('ai_advisor_history', updatedHistory);
      } catch (err) {
        console.error("[Advisor IA] Error saving to history:", err);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error: ${getErrorMessage(error)}. Por favor, verifica tu conexión o intenta más tarde.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `ANÁLISIS DE SEGURIDAD IA\nTarea: ${result.task}\n\nRIESGOS:\n- ${result.riesgos.join('\n- ')}\n\nEPP RECOMENDADO:\n- ${result.epp.join('\n- ')}\n\nRECOMENDACIONES:\n- ${result.recomendaciones.join('\n- ')}\n\nNORMATIVA:\n- ${result.normativa.join('\n- ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmDelete = () => {
    const updated = history.filter((item: any) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('ai_advisor_history', JSON.stringify(updated));
    syncCollection('ai_advisor_history', updated);
    setDeleteTarget(null);
  };

  const handleExportCSV = () => {
    downloadCSV(history.map((i: any) => ({
      fecha: new Date(i.date).toLocaleDateString(),
      tarea: i.task || '',
      riesgos: (i.riesgos || []).join(', '),
      epp: (i.epp || []).join(', ')
    })), 'asesor_ia_historial', {
      fecha: 'Fecha', tarea: 'Tarea Consultada', riesgos: 'Riesgos Detectados', epp: 'EPP Recomendado'
    });
  };

  const columns = [
  {
    header: 'Fecha',
    accessor: 'date',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)] white-space-[nowrap]">
                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
                </span>

  },
  {
    header: 'Tarea Analizada',
    accessor: 'task',
    sortable: true,
    render: (item: any) =>
    <div className="flex items-center gap-[0.8rem]">
                    <div className="bg-[rgba(59,130,246,0.1)] p-[0.5rem] rounded-[8px] text-[var(--color-primary)]">
                        <Sparkles size={16} />
                    </div>
                    <div className="font-[700] max-w-[300px] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">{item.task || 'Sin nombre'}</div>
                </div>

  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <div className="flex gap-[0.4rem]">
                    <button onClick={() => {handleLoadHistory(item);}} className="p-[0.4rem_0.8rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[8px] cursor-pointer text-[0.75rem] font-[700] text-[var(--color-text)] flex items-center gap-[4px]"><FileText size={15} /> Ver</button>
                    <button onClick={() => {setShareItem(item);}} title="Compartir" className="p-[0.4rem] bg-[rgba(22,163,74,0.08)] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] text-[#16a34a] cursor-pointer"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} className="p-[0.4rem] bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[8px] text-[#ef4444] cursor-pointer"><Trash2 size={15} /></button>
                </div>

  }];


  const filteredHistory = history.filter((e: any) => {
    const query = searchTerm.toLowerCase();
    return (e.task || '').toLowerCase().includes(query);
  });

  return (
    <div className="container max-w-[1200px] pb-[12rem]">
            <Breadcrumbs />

            <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
      title="Asesor de Seguridad IA"
      subtitle="Análisis predictivo, normativo y preventivo con Inteligencia Artificial"
      icon={<Sparkles size={36} />} />
      

            {!showForm ?
      <>
                    <div className="mb-[1.5rem] flex gap-[1rem] flex-wrap items-center">
                        <button
            onClick={() => {
              handleNewQuery();
              setShowForm(true);
              navigate('/ai-advisor/nueva');
            }} className="flex-[0_1_auto] px-[1rem] py-[0.6rem] rounded-[10px] text-white border-none font-[700] text-[0.85rem] cursor-pointer flex items-center gap-[0.5rem] whitespace-nowrap transition-transform hover:scale-[1.02]" style={{ backgroundColor: '#10b981', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', zIndex: 10, position: 'relative' }}>

            
                            <Plus size={20} /> Nueva Consulta
                        </button>
                        <div className="flex-[1_1_300px] flex items-center border-[2px] border-slate-200 dark:border-slate-700 rounded-[12px] bg-white dark:bg-slate-900 px-[1rem] focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm" style={{ zIndex: 10, position: 'relative' }}>
                            <Search size={20} className="mr-[0.5rem] flex-shrink-0" style={{ color: '#64748b' }} />
                            <input
              type="text"
              placeholder="Buscar en consultas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-3 bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 m-0" />

            
                        </div>
                        {history.length > 0 &&
          <button onClick={handleExportCSV} className="flex-[0_1_auto] flex items-center gap-[0.4rem] bg-[var(--color-primary)] border-none rounded-[16px] p-[1rem_1.5rem] text-[1rem] font-[800] cursor-pointer text-[#ffffff] box-shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
                                <Download size={20} /> Excel
                            </button>
          }
                    </div>

                    <DataTable
          data={filteredHistory}
          columns={columns}
          searchPlaceholder="Buscar..."
          emptyMessage="No hay consultas registradas."
          emptyIcon={<Sparkles size={48} />} />
        

                    {qrTarget && <QRModal text={(qrTarget as any).text} title={(qrTarget as any).title} onClose={() => setQrTarget(null)} />}
                    {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                    
                    <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Análisis IA - ${(shareItem as any)?.task || ''}`}
          text={shareItem ? `✨ Análisis de Seguridad (IA)\n📋 Tarea: ${(shareItem as any).task}\n🚨 Riesgos: ${((shareItem as any).riesgos || []).slice(0, 2).join(', ')}...\n🛡️ EPP: ${((shareItem as any).epp || []).slice(0, 2).join(', ')}...\n📚 Normativa: ${((shareItem as any).normativa || []).join(', ')}` : ''}
          rawMessage={shareItem ? `✨ Análisis de Seguridad (IA)\n📋 Tarea: ${(shareItem as any).task}\n🚨 Riesgos: ${((shareItem as any).riesgos || []).slice(0, 2).join(', ')}...\n🛡️ EPP: ${((shareItem as any).epp || []).slice(0, 2).join(', ')}...\n📚 Normativa: ${((shareItem as any).normativa || []).join(', ')}` : ''}
          elementIdToPrint="pdf-content-ai"
          fileName={`Analisis_IA_${(shareItem as any)?.task?.replace(/\s+/g, '_') || 'Sin_Nombre'}.pdf`} />
        
                    <div className="absolute left-[0] opacity-[0.01] top-[-12000px] pointer-events-[none]">
                        {shareItem && <AiAdvisorPdfGenerator data={shareItem} />}
                    </div>
                </> :

      <>
                    <div className="no-print flex items-center gap-[0.5rem] mb-[1.5rem]">
                        <></>
                    </div>

            {/* History Panel */}
            <HistoryPanel onLoad={handleLoadHistory} />

            {/* Input Section */}
            <div className="p-[2rem] mb-[2rem] rounded-[16px] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] box-shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-[0.75rem] mb-[0.5rem]">
                    <div className="w-[40px] h-[40px] rounded-[12px] bg-[rgba(16,185,129,0.15)] flex items-center justify-center text-[#10b981]">
                        <Sparkles size={20} />
                    </div>
                    <h3 className="m-[0] text-[1.25rem] font-[800] text-[var(--color-text)]">¿Qué tarea vas a analizar hoy?</h3>
                </div>
                <p className="m-[0_0_1.5rem_0] text-[var(--color-text-muted)] text-[0.95rem] font-[500] pl-[3.25rem]">
                    Describe la tarea con detalle. La Inteligencia Artificial evaluará riesgos, EPP y normas aplicables.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-[1.2rem]">
                    <div className="relative group">
                        <textarea
                placeholder="Ej: Pintura de fachada con hidroelevador a 15 metros de altura cerca de tendido eléctrico..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
                className="w-[100%] min-h-[140px] p-[1.5rem] pr-[5rem] rounded-[16px] border-[2px] border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-[1.05rem] resize-y transition-all focus:border-[#10b981] focus:ring-[4px] focus:ring-[#10b981]/20 outline-none" />
              
                        <button
                type="button"
                onClick={toggleListening}
                disabled={loading}
                style={{
                  background: isListening ? '#ef4444' : 'rgba(16,185,129,0.15)',
                  color: isListening ? 'white' : '#047857',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 2px 8px rgba(0,0,0,0.05)',
                  animation: isListening ? 'pulse 1.5s infinite' : 'none'
                }}
                title={isListening ? 'Escuchando...' : 'Dictar por voz'} className="absolute right-[1rem] top-[1rem] border-[1px_solid_rgba(16,185,129,0.3)] rounded-[50%] w-[54px] h-[54px] flex items-center justify-center p-[0] transition-[all_0.3s_ease] z-[10] hover:scale-[1.05] hover:bg-[rgba(16,185,129,0.25)]">
                
                            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                        </button>
                    </div>

                    {/* Quick Prompts (Chips) */}
                    {!task && !loading &&
            <div className="flex flex-wrap gap-[0.6rem] mt-[-0.5rem]">
                            <span className="text-[0.8rem] text-[var(--color-text-muted)] flex items-center gap-[0.3rem] w-[100%]">
                                <Zap size={14} color="#eab308" /> Sugerencias rápidas:
                            </span>
                            {QUICK_PROMPTS.map((prompt, idx) =>
              <button
                key={idx}
                type="button"
                onClick={() => setTask(prompt)}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--color-primary-light)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'var(--color-background)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.color = 'var(--color-text)';
                }} className="bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[20px] p-[0.4rem_0.8rem] text-[0.8rem] text-[var(--color-text)] cursor-pointer transition-[all_0.2s]">
                
                                    {prompt}
                                </button>
              )}
                        </div>
            }

                    <div className="display-[inline-flex] items-center gap-[0.5rem] text-[#059669] text-[0.8rem] font-[700] bg-[rgba(5,150,105,0.1)] px-[1rem] py-[0.6rem] rounded-[8px] align-self-[center] border-[1px] border-[rgba(5,150,105,0.2)]">
                        <Database size={15} /> Optimizando con el contexto reciente de tu dispositivo
                    </div>

                    <button
              type="submit"
              disabled={loading || !task.trim()}
              className="flex items-center justify-center gap-[0.6rem] mt-[1rem] mx-[auto] py-[0.85rem] px-[2.5rem] text-[1.1rem] font-[800] rounded-[12px] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none w-[fit-content]"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', boxShadow: '0 6px 20px rgba(16,185,129,0.4)', color: '#ffffff' }}>
                        {loading ?
              <>
                                <Loader2 size={22} className="animate-spin" />
                                <span className="min-width-[220px] text-left">{LOADING_MESSAGES[loadingTextIndex]}</span>
                            </> :

              <>
                                <Send size={22} />
                                Generar Análisis IA
                            </>
              }
                    </button>
                </form>
            </div>

            {/* Results Section */}
            {result && !loading &&
        <div className="animation-[fadeIn_0.6s_ease-out]">
                    <div className="flex justify-space-between items-center mb-[1.8rem] flex-wrap gap-[1rem]">
                        <h2 className="m-[0] text-[1.4rem] font-[800]">Resultados del Análisis</h2>
                        <div className="flex gap-[0.8rem]">
                            <button
                onClick={handleDownloadPDF}
                className="btn-secondary flex items-center gap-[0.5rem] p-[0.6rem_1.2rem] rounded-[10px] mt-[0] w-[auto] bg-[linear-gradient(135deg,_#8b5cf6,_#7c3aed)] text-[#ffffff] border-none text-[0.9rem] font-[600] box-shadow-[0_4px_15px_rgba(139,_92,_246,_0.4)]">















                
                                <Download size={18} />
                                Exportar PDF
                            </button>
                            <button
                onClick={handleCopy}
                style={{



                  background: copied ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-surface)',
                  border: `1px solid ${copied ? '#10b981' : 'var(--color-border)'}`,


                  color: copied ? '#10b981' : 'var(--color-text)'




                }} className="flex items-center gap-[0.6rem] p-[0.6rem_1.2rem] rounded-[10px] cursor-pointer text-[0.9rem] font-[600] transition-[all_0.2s]">
                
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'Copiado al Portapapeles' : 'Copiar Todo'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(300px,_1fr))] gap-[1.5rem]">
                        {/* Risks */}
                        <div className="card hover-scale flex flex-col gap-[1rem] border-top-[4px_solid_#ef4444] transition-[transform_0.2s,_box-shadow_0.2s]">
                            <div className="flex items-center gap-[0.8rem] text-[#ef4444] bg-[rgba(239,68,68,0.1)] p-[0.8rem] rounded-[10px]">
                                <ShieldAlert size={22} />
                                <h4 className="m-[0] font-[700] text-[1.1rem]">Riesgos Detectados</h4>
                            </div>
                            <ul className="m-[0] pl-[1.2rem] text-[0.95rem] line-height-[1.6] text-[var(--color-text)]">
                                {(result.riesgos || []).map((item, i) => <li key={i} className="mb-[0.5rem]">{item}</li>)}
                                {(!result.riesgos || result.riesgos.length === 0) && <li>No hay riesgos detectados</li>}
                            </ul>
                        </div>

                        {/* PPE */}
                        <div className="card hover-scale flex flex-col gap-[1rem] border-top-[4px_solid_#3b82f6] transition-[transform_0.2s,_box-shadow_0.2s]">
                            <div className="flex items-center gap-[0.8rem] text-[#3b82f6] bg-[rgba(59,130,246,0.1)] p-[0.8rem] rounded-[10px]">
                                <HardHat size={22} />
                                <h4 className="m-[0] font-[700] text-[1.1rem]">EPP Recomendado</h4>
                            </div>
                            <ul className="m-[0] pl-[1.2rem] text-[0.95rem] line-height-[1.6] text-[var(--color-text)]">
                                {(result.epp || []).map((item, i) => <li key={i} className="mb-[0.5rem]">{item}</li>)}
                                {(!result.epp || result.epp.length === 0) && <li>No hay EPP recomendados</li>}
                            </ul>
                        </div>

                        {/* Recommendations */}
                        <div className="card hover-scale flex flex-col gap-[1rem] border-top-[4px_solid_#10b981] transition-[transform_0.2s,_box-shadow_0.2s]">
                            <div className="flex items-center gap-[0.8rem] text-[#10b981] bg-[rgba(16,185,129,0.1)] p-[0.8rem] rounded-[10px]">
                                <Lightbulb size={22} />
                                <h4 className="m-[0] font-[700] text-[1.1rem]">Medidas Preventivas</h4>
                            </div>
                            <ul className="m-[0] pl-[1.2rem] text-[0.95rem] line-height-[1.6] text-[var(--color-text)]">
                                {(result.recomendaciones || []).map((item, i) => <li key={i} className="mb-[0.5rem]">{item}</li>)}
                                {(!result.recomendaciones || result.recomendaciones.length === 0) && <li>No hay medidas preventivas</li>}
                            </ul>
                        </div>

                        {/* Legislation */}
                        <div className="card hover-scale flex flex-col gap-[1rem] border-top-[4px_solid_#8b5cf6] transition-[transform_0.2s,_box-shadow_0.2s]">
                            <div className="flex items-center gap-[0.8rem] text-[#8b5cf6] bg-[rgba(139,92,246,0.1)] p-[0.8rem] rounded-[10px]">
                                <Gavel size={22} />
                                <h4 className="m-[0] font-[700] text-[1.1rem]">Marco Legal ({userCountry.charAt(0).toUpperCase() + userCountry.slice(1)})</h4>
                            </div>
                            <ul className="m-[0] pl-[1.2rem] text-[0.95rem] line-height-[1.6] list-style-type-[disc] text-[var(--color-text)]">
                                {(result.normativa || []).map((item, i) => <li key={i} className="mb-[0.5rem] pl-[0.2rem]">{item}</li>)}
                                {(!result.normativa || result.normativa.length === 0) && <li>No hay normativa registrada</li>}
                            </ul>
                        </div>
                    </div>

                    {/* Nueva Consulta Button */}
                    <div className="mt-[3rem] text-center">
                        <button
              onClick={() => {
                handleNewQuery();
                navigate('/ai-advisor/nueva');
              }}









              onMouseOver={(e) => {e.currentTarget.style.background = 'var(--color-primary-light)';}}
              onMouseOut={(e) => {e.currentTarget.style.background = 'var(--color-surface)';}} className="display-[inline-flex] items-center gap-[0.8rem] p-[1rem_2.5rem] bg-[var(--color-surface)] text-[var(--color-primary)] border-[2px_solid_var(--color-primary)] rounded-[16px] font-[800] text-[1.05rem] cursor-pointer transition-[all_0.2s]">
              
                            <RotateCcw size={20} /> Realizar Nueva Consulta
                        </button>
                    </div>

                    <AdBanner />
                </div>
        }
                </>
      }
        </div>);

}