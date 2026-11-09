import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  FileText,
  Calendar,
  TrendingUp,
  ShieldCheck,
  ClipboardList,
  Users,
  Siren,
  Flame,
  Target,
  FileSignature,
  ChevronRight,
  ChevronLeft,
  TriangleAlert,
  Building2,
  CheckSquare,
  Square,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Share2,
  FileSpreadsheet,
  Award,
  Wrench,
  HardHat,
  ArrowUpRight,
  RotateCcw,
  Eye
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';

type ReportScope = 'month' | 'year' | 'all';

interface IncludedSectionsState {
  summary: boolean;
  ats: boolean;
  permits: boolean;
  inspections: boolean;
  srtProtocols: boolean;
  ppeAndAssets: boolean;
  training: boolean;
  talks: boolean;
  drills: boolean;
  fireload: boolean;
  accidents: boolean;
  capa: boolean;
}

export default function ManagementReport(): React.ReactElement | null {
  const navigate = useNavigate();
  useDocumentTitle('Reporte Mensual y Dossier Ejecutivo H&S');

  const { activeCompany, isAllCompanies } = useCompany();
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [reportScope, setReportScope] = useState<ReportScope>('month');
  const [showPreview, setShowPreview] = useState(false);

  const [includedSections, setIncludedSections] = useState<IncludedSectionsState>({
    summary: true,
    ats: true,
    permits: true,
    inspections: true,
    srtProtocols: true,
    ppeAndAssets: true,
    training: true,
    talks: true,
    drills: true,
    fireload: true,
    accidents: true,
    capa: true
  });

  const [metrics, setMetrics] = useState({
    ats: { total: 0 },
    permits: { total: 0 },
    inspections: { total: 0, critical: 0 },
    riskAssessments: { total: 0, highRisk: 0 },
    srtProtocols: { total: 0 },
    ppeAndAssets: { total: 0 },
    training: { total: 0, attendees: 0 },
    talks: { total: 0, attendees: 0 },
    drills: { total: 0 },
    accidents: { total: 0 },
    fireload: { total: 0 },
    audits: { total: 0 },
    capa: { total: 0, pending: 0, completed: 0 }
  });

  const targetPeriod = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);

    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay =
      reportScope === 'month'
        ? new Date(year, month, 1, 0, 0, 0)
        : reportScope === 'year'
        ? new Date(year, 0, 1, 0, 0, 0)
        : new Date(2000, 0, 1, 0, 0, 0);

    const lastDay =
      reportScope === 'month'
        ? new Date(year, month + 1, 0, 23, 59, 59)
        : reportScope === 'year'
        ? new Date(year, 11, 31, 23, 59, 59)
        : new Date(2100, 11, 31, 23, 59, 59);

    const monthLabel = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const periodLabel =
      reportScope === 'month'
        ? monthLabel
        : reportScope === 'year'
        ? `Año ${year} (Acumulado Anual)`
        : 'Historial Global Acumulado';

    const storageKey = `ehs_monthly_notes_${year}_${month}_${reportScope}`;

    return {
      firstDay,
      lastDay,
      monthName: periodLabel,
      shortMonthName: monthLabel,
      year,
      storageKey
    };
  }, [monthOffset, reportScope]);

  const [customNotes, setCustomNotes] = useState<string>('');

  // Cargar notas guardadas por período
  useEffect(() => {
    try {
      const saved = localStorage.getItem(targetPeriod.storageKey);
      if (saved !== null) {
        setCustomNotes(saved);
      } else {
        setCustomNotes('');
      }
    } catch {
      setCustomNotes('');
    }
  }, [targetPeriod.storageKey]);

  const handleNotesChange = (val: string) => {
    setCustomNotes(val);
    try {
      localStorage.setItem(targetPeriod.storageKey, val);
    } catch {
      // ignore
    }
  };

  const loadMetrics = () => {
    setLoading(true);
    const { firstDay, lastDay } = targetPeriod;

    const isWithinPeriod = (dateString: string | number | undefined) => {
      if (reportScope === 'all') return true;
      if (!dateString) return false;
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return false;
      return d >= firstDay && d <= lastDay;
    };

    const matchesCompany = (item: any) => {
      if (isAllCompanies || !activeCompany) return true;
      const emp =
        item?.empresa ||
        item?.cliente ||
        item?.razonSocial ||
        item?.company ||
        item?.companyName ||
        '';
      if (!emp) return true;
      return (
        String(emp).toLowerCase().includes(activeCompany.name.toLowerCase()) ||
        activeCompany.name.toLowerCase().includes(String(emp).toLowerCase())
      );
    };

    const safeParseArray = (key: string): any[] => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const ats = safeParseArray('ats_history').filter(
      (i: any) => isWithinPeriod(i.fecha || i.createdAt || i.date) && matchesCompany(i)
    );
    const permits = safeParseArray('work_permits_history').filter(
      (i: any) => isWithinPeriod(i.createdAt || i.date || i.fecha) && matchesCompany(i)
    );
    const inspections = [
      ...safeParseArray('inspections_history'),
      ...safeParseArray('tool_checklists_history'),
      ...safeParseArray('observations_history'),
      ...safeParseArray('stop_cards_history')
    ].filter((i: any) => isWithinPeriod(i.date || i.createdAt || i.fecha) && matchesCompany(i));

    const risks = [
      ...safeParseArray('risk_assessment_history'),
      ...safeParseArray('risk_matrices_history')
    ].filter((i: any) => isWithinPeriod(i.date || i.createdAt || i.fecha) && matchesCompany(i));

    const srtProtocols = [
      ...safeParseArray('grounding_protocols_db'),
      ...safeParseArray('lighting_reports_db'),
      ...safeParseArray('lighting_history'),
      ...safeParseArray('noise_assessments_db'),
      ...safeParseArray('rgrl_history'),
      ...safeParseArray('rar_history'),
      ...safeParseArray('ergonomics_history')
    ].filter((i: any) => isWithinPeriod(i.date || i.createdAt || i.fecha) && matchesCompany(i));

    const ppeAndAssets = [
      ...safeParseArray('ppe_deliveries'),
      ...safeParseArray('ppe_history'),
      ...safeParseArray('extinguishers_inventory'),
      ...safeParseArray('qr_assets_inventory')
    ].filter(
      (i: any) =>
        isWithinPeriod(i.date || i.createdAt || i.fecha || i.lastInspection || i.updatedAt) &&
        matchesCompany(i)
    );

    const training = safeParseArray('training_history').filter(
      (i: any) => isWithinPeriod(i.date || i.createdAt || i.fecha) && matchesCompany(i)
    );
    const talks = safeParseArray('toolbox_talks_history').filter(
      (i: any) => isWithinPeriod(i.date || i.fecha || i.createdAt) && matchesCompany(i)
    );
    const drills = safeParseArray('drills_history').filter(
      (i: any) => isWithinPeriod(i.date || i.createdAt || i.fecha) && matchesCompany(i)
    );
    const accidents = safeParseArray('accident_history').filter(
      (i: any) => isWithinPeriod(i.date || i.createdAt || i.fecha) && matchesCompany(i)
    );
    const fireload = safeParseArray('fireload_history').filter(
      (i: any) => isWithinPeriod(i.createdAt || i.date || i.fecha) && matchesCompany(i)
    );
    const audits = safeParseArray('ehs_audits_db').filter(
      (i: any) => isWithinPeriod(i.date || i.createdAt || i.fecha) && matchesCompany(i)
    );
    const capas = safeParseArray('capas_db').filter(
      (i: any) => isWithinPeriod(i.createdAt || i.targetDate || i.date) && matchesCompany(i)
    );

    const pendingCapas = capas.filter(
      (c: any) => c.status !== 'completed' && c.status !== 'closed'
    ).length;

    setMetrics({
      ats: { total: ats.length },
      permits: { total: permits.length },
      inspections: {
        total: inspections.length,
        critical: inspections.filter((i: any) => (i.score !== undefined && i.score < 50) || i.status === 'NC').length
      },
      riskAssessments: {
        total: risks.length,
        highRisk: risks.filter(
          (r: any) =>
            (r.riskLevel || '').toLowerCase().includes('crítico') ||
            (r.riskLevel || '').toLowerCase().includes('alto')
        ).length
      },
      srtProtocols: { total: srtProtocols.length },
      ppeAndAssets: { total: ppeAndAssets.length },
      training: {
        total: training.length,
        attendees: training.reduce(
          (acc: number, curr: any) =>
            acc + (curr.attendees?.length || curr.participants?.length || Number(curr.attendeesCount) || 1),
          0
        )
      },
      talks: {
        total: talks.length,
        attendees: talks.reduce(
          (acc: number, curr: any) => acc + (curr.attendees?.length || Number(curr.participantsCount) || 1),
          0
        )
      },
      drills: { total: drills.length },
      accidents: { total: accidents.length },
      fireload: { total: fireload.length },
      audits: { total: audits.length },
      capa: {
        total: capas.length,
        pending: pendingCapas,
        completed: Math.max(0, capas.length - pendingCapas)
      }
    });

    setTimeout(() => setLoading(false), 180);
  };

  useEffect(() => {
    loadMetrics();
  }, [monthOffset, reportScope, activeCompany]);

  const { monthName } = targetPeriod;

  const totalActions =
    metrics.ats.total +
    metrics.permits.total +
    metrics.inspections.total +
    metrics.riskAssessments.total +
    metrics.srtProtocols.total +
    metrics.ppeAndAssets.total +
    metrics.training.total +
    metrics.talks.total +
    metrics.drills.total +
    metrics.accidents.total +
    metrics.fireload.total +
    metrics.audits.total +
    metrics.capa.total;

  const totalTrainedWorkers = metrics.training.attendees + metrics.talks.attendees;

  const complianceScore = useMemo(() => {
    if (totalActions === 0) return 100;
    const issues = metrics.inspections.critical + metrics.capa.pending + metrics.accidents.total * 2;
    const raw = Math.round(Math.max(65, Math.min(100, 100 - (issues / Math.max(totalActions, 4)) * 35)));
    return raw;
  }, [totalActions, metrics]);

  const chartData = useMemo(() => {
    const data = [
      { name: 'ATS / IPERC', value: metrics.ats.total + metrics.riskAssessments.total, color: '#10b981' },
      { name: 'Permisos PTAR', value: metrics.permits.total, color: '#2563eb' },
      { name: 'Inspecciones', value: metrics.inspections.total, color: '#7c3aed' },
      { name: 'Protocolos SRT', value: metrics.srtProtocols.total, color: '#0ea5e9' },
      { name: 'EPP y Activos', value: metrics.ppeAndAssets.total, color: '#eab308' },
      { name: 'Charlas 5 Min', value: metrics.talks.total, color: '#0284c7' },
      { name: 'Capacitaciones', value: metrics.training.total, color: '#ec4899' },
      { name: 'Simulacros', value: metrics.drills.total, color: '#14b8a6' },
      { name: 'Planes CAPA', value: metrics.capa.total, color: '#ef4444' },
      { name: 'Carga de Fuego', value: metrics.fireload.total, color: '#f97316' }
    ];
    return data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  }, [metrics]);

  const personalInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('personalData') || '{}');
    } catch {
      return {};
    }
  }, []);

  const companyLogo = useMemo(() => {
    try {
      return localStorage.getItem('companyLogo') || null;
    } catch {
      return null;
    }
  }, []);

  const companyDisplayName = activeCompany
    ? activeCompany.name
    : personalInfo.company || 'Establecimiento General';

  const profDisplayName =
    personalInfo.fullName || personalInfo.name || 'Especialista en Higiene y Seguridad';

  const generateTemplateNote = (type: 'executive' | 'art' | 'board') => {
    if (type === 'executive') {
      const text = `DICTAMEN TÉCNICO MENSUAL (${monthName.toUpperCase()}):
Durante el período evaluado en ${companyDisplayName}, el Servicio de Higiene y Seguridad en el Trabajo ejecutó un total de ${totalActions} actuaciones preventivas y documentales bajo el marco de la Ley Nacional N° 19.587 y el Decreto Reglamentario 351/79. Se registraron ${metrics.inspections.total} inspecciones operativas, ${metrics.ats.total + metrics.permits.total} controles de tareas críticas (ATS/PTAR) y la participación acumulada de ${totalTrainedWorkers} asistentes en instancias de formación y charlas de 5 minutos. El período cierra con ${metrics.accidents.total} siniestros laborales reportados y un índice de cumplimiento preventivo del ${complianceScore}%. Se recomienda mantener la frecuencia de relevamientos en campo y dar cierre prioritario a las ${metrics.capa.pending} acciones correctivas (CAPA) en seguimiento.`;
      handleNotesChange(text);
      toast.success('Dictamen Ejecutivo generado');
    } else if (type === 'art') {
      const text = `CONSTANCIA DE GESTIÓN PARA AUDITORÍA ART / SRT (${monthName.toUpperCase()}):
Se deja constancia que el establecimiento ${companyDisplayName} mantiene vigentes sus programas de prevención, control de contratistas, mediciones reglamentarias (${metrics.srtProtocols.total} protocolos SRT procesados) y registro de entrega de EPP / control de activos (${metrics.ppeAndAssets.total} registros). Las evidencias documentales firmadas obran en el legajo técnico digital del Servicio de Higiene y Seguridad a disposición de la Aseguradora de Riesgos del Trabajo (ART) y la Superintendencia de Riesgos del Trabajo.`;
      handleNotesChange(text);
      toast.success('Plantilla para ART / SRT aplicada');
    } else {
      const text = `RESUMEN PARA DIRECTORIO Y GERENCIA DE PLANTA (${monthName.toUpperCase()}):
1. Desempeño de Seguridad: ${metrics.accidents.total === 0 ? 'Cero accidentes con baja laboral durante el período.' : `${metrics.accidents.total} evento(s) bajo investigación y seguimiento.`}
2. Productividad Preventiva: ${totalActions} documentos técnicos emitidos y ${totalTrainedWorkers} trabajadores alcanzados por capacitaciones.
3. Próximos Pasos: Continuar con el cronograma anual de simulacros (${metrics.drills.total} ejecutados), actualización de estudios de carga de fuego (${metrics.fireload.total}) y cierre de hallazgos operativos.`;
      handleNotesChange(text);
      toast.success('Resumen para Directorio aplicado');
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Modulo / Indicador', 'Cantidad Registrada', 'Detalle Operativo', 'Periodo', 'Empresa'],
      ['ATS y Evaluaciones de Riesgo', String(metrics.ats.total + metrics.riskAssessments.total), `${metrics.riskAssessments.highRisk} riesgo alto`, monthName, companyDisplayName],
      ['Permisos de Trabajo (PTAR)', String(metrics.permits.total), 'Altura, Caliente, Confinados, LOTO', monthName, companyDisplayName],
      ['Inspecciones y Checklists', String(metrics.inspections.total), `${metrics.inspections.critical} desvios criticos`, monthName, companyDisplayName],
      ['Protocolos Oficiales SRT', String(metrics.srtProtocols.total), 'PAT 900/15, Iluminacion 84/12, Ruido 85/12, RGRL', monthName, companyDisplayName],
      ['EPP y Activos / Extintores', String(metrics.ppeAndAssets.total), 'Entregas EPP y control de equipos', monthName, companyDisplayName],
      ['Charlas de 5 Minutos', String(metrics.talks.total), `${metrics.talks.attendees} asistentes`, monthName, companyDisplayName],
      ['Capacitaciones Formales', String(metrics.training.total), `${metrics.training.attendees} capacitados`, monthName, companyDisplayName],
      ['Simulacros de Emergencia', String(metrics.drills.total), 'Evacuacion y respuesta', monthName, companyDisplayName],
      ['Estudios Carga de Fuego', String(metrics.fireload.total), 'Dec. 351/79 Anexo VII', monthName, companyDisplayName],
      ['Siniestralidad / Accidentes', String(metrics.accidents.total), 'Investigacion de incidentes', monthName, companyDisplayName],
      ['Planes de Accion (CAPA)', String(metrics.capa.total), `${metrics.capa.pending} pendientes`, monthName, companyDisplayName]
    ];

    const csvContent =
      '\uFEFF' +
      rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Mensual_HyS_${companyDisplayName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Planilla CSV descargada para Excel');
  };

  const handleShareWhatsApp = () => {
    const text = [
      `📊 *REPORTE EJECUTIVO H&S — ${monthName.toUpperCase()}*`,
      `🏢 *Empresa:* ${companyDisplayName}`,
      `👷 *Profesional:* ${profDisplayName}`,
      `────────────────────`,
      `✅ *Total Actuaciones:* ${totalActions} registros`,
      `🛡️ *Cumplimiento Preventivo:* ${complianceScore}%`,
      `📋 *ATS + Permisos PTAR:* ${metrics.ats.total + metrics.permits.total}`,
      `🔍 *Inspecciones y Protocolos SRT:* ${metrics.inspections.total + metrics.srtProtocols.total}`,
      `🎓 *Personal Capacitado:* ${totalTrainedWorkers} asistentes`,
      `🚨 *Accidentes en el Período:* ${metrics.accidents.total}`,
      customNotes.trim() ? `\n📝 *Conclusión:* ${customNotes.trim().slice(0, 240)}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleExportPDF = async () => {
    try {
      const toastId = toast.loading('Compilando Dossier Mensual de Gestión A4...');
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const html2canvas = (await import('html2canvas')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const primaryColor: [number, number, number] = [15, 23, 42];
      const accentColor: [number, number, number] = [37, 99, 235];
      const textDark: [number, number, number] = [30, 41, 59];
      const textGray: [number, number, number] = [100, 116, 139];

      // --- PORTADA INSTITUCIONAL ---
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 55, 'F');
      doc.setFillColor(...accentColor);
      doc.rect(0, 55, pageWidth, 5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('DOSSIER EJECUTIVO DE GESTIÓN H&S', 15, 26);

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'normal');
      doc.text('INFORME DE HIGIENE, SEGURIDAD Y MEDIO AMBIENTE LABORAL', 15, 36);
      doc.setFontSize(10);
      doc.text(`PERÍODO EVALUADO: ${monthName.toUpperCase()}`, 15, 46);

      if (companyLogo && (companyLogo.startsWith('data:image/') || companyLogo.startsWith('http'))) {
        try {
          doc.addImage(companyLogo, 'PNG', pageWidth - 52, 12, 36, 28);
        } catch {
          // ignore
        }
      }

      // --- CAJA DE DATOS DE EMPRESA Y PROFESIONAL ---
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 67, pageWidth - 30, 30, 3, 3, 'FD');

      doc.setTextColor(...textDark);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPRESA / COMITENTE:', 20, 76);
      doc.text('PROFESIONAL ACTUANTE:', 20, 84);
      doc.text('MATRÍCULA / CUIT:', 20, 92);

      doc.setFont('helvetica', 'normal');
      doc.text(companyDisplayName, 74, 76);
      doc.text(profDisplayName, 74, 84);
      doc.text(
        `Mat. ${personalInfo.license || personalInfo.matricula || 'Vigente'} — CUIT: ${
          activeCompany?.cuit || personalInfo.cuit || 'S/D'
        }`,
        74,
        92
      );
      doc.text(`Emisión: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - 65, 76);
      doc.text(`Cumplimiento: ${complianceScore}%`, pageWidth - 65, 84);

      // --- 1. RESUMEN EJECUTIVO ---
      let currentY = 107;
      if (includedSections.summary) {
        doc.setFontSize(12.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accentColor);
        doc.text('1. Resumen Ejecutivo de Gestión Preventiva', 15, currentY);

        const mainFocus =
          chartData.length > 0
            ? `la gestión de ${chartData[0].name} (${chartData[0].value} actuaciones)`
            : 'el mantenimiento preventivo y control documental de planta';

        const executiveSummary = `Durante el período ${monthName}, el Servicio de Higiene y Seguridad en el Trabajo registró y certificó ${totalActions} actuaciones técnicas para ${companyDisplayName}, con foco principal en ${mainFocus}. Se capacitó a un total de ${totalTrainedWorkers} participantes y se mantuvo un índice de cumplimiento preventivo del ${complianceScore}% bajo los lineamientos de la Ley Nacional N° 19.587, Ley 24.557 y Decreto 351/79.`;

        doc.setTextColor(...textDark);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        const splitSummary = doc.splitTextToSize(executiveSummary, pageWidth - 30);
        doc.text(splitSummary, 15, currentY + 7);
        currentY += 12 + splitSummary.length * 4.5;
      }

      // --- GRÁFICO SI EXISTE ---
      const chartEl = document.getElementById('chart-container-pdf');
      if (chartEl && chartData.length > 0 && includedSections.summary) {
        try {
          const canvas = await html2canvas(chartEl, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const pdfWidth = pageWidth - 30;
          const pdfHeight = Math.min(68, (canvas.height * pdfWidth) / canvas.width);

          if (currentY + pdfHeight > pageHeight - 25) {
            doc.addPage();
            currentY = 20;
          }

          doc.addImage(imgData, 'PNG', 15, currentY, pdfWidth, pdfHeight);
          currentY += pdfHeight + 9;
        } catch (err) {
          console.error('Error capturing chart', err);
        }
      }

      // --- 2. TABLA DETALLADA DE INDICADORES ---
      if (currentY > pageHeight - 55) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accentColor);
      doc.text('2. Desglose de Indicadores y Actuaciones Técnicas', 15, currentY);

      const tableData: string[][] = [];

      if (includedSections.ats) {
        tableData.push([
          'Análisis de Trabajo Seguro (ATS) e IPERC',
          `${metrics.ats.total + metrics.riskAssessments.total} registros`,
          `Identificación de peligros y evaluación de riesgos (${metrics.riskAssessments.highRisk} críticos)`
        ]);
      }
      if (includedSections.permits) {
        tableData.push([
          'Permisos de Trabajo de Alto Riesgo (PTAR)',
          `${metrics.permits.total} emitidos`,
          'Control de tareas en altura, trabajo en caliente, espacios confinados y LOTO'
        ]);
      }
      if (includedSections.inspections) {
        tableData.push([
          'Inspecciones Operativas y Tarjetas STOP',
          `${metrics.inspections.total} efectuadas`,
          `${metrics.inspections.critical} hallazgos críticos detectados en recorrida`
        ]);
      }
      if (includedSections.srtProtocols) {
        tableData.push([
          'Protocolos Oficiales SRT (PAT, Luz, Ruido, RGRL, Ergo)',
          `${metrics.srtProtocols.total} protocolos`,
          'Res. SRT 900/15, 84/12, 85/12, 463/09 y 886/15'
        ]);
      }
      if (includedSections.ppeAndAssets) {
        tableData.push([
          'Entregas de EPP (Res. 299/11) y Activos QR / Extintores',
          `${metrics.ppeAndAssets.total} controles`,
          'Trazabilidad de elementos de protección personal y equipos de planta'
        ]);
      }
      if (includedSections.talks) {
        tableData.push([
          'Charlas Operativas de 5 Minutos',
          `${metrics.talks.total} charlas`,
          `${metrics.talks.attendees} firmas de trabajadores registradas`
        ]);
      }
      if (includedSections.training) {
        tableData.push([
          'Capacitaciones Anuales en Planta',
          `${metrics.training.total} sesiones`,
          `${metrics.training.attendees} trabajadores capacitados según Plan Anual`
        ]);
      }
      if (includedSections.drills) {
        tableData.push([
          'Simulacros de Evacuación y Emergencia',
          `${metrics.drills.total} realizados`,
          'Entrenamiento de brigadas, tiempos de evacuación y rol de emergencia'
        ]);
      }
      if (includedSections.fireload) {
        tableData.push([
          'Estudios de Carga de Fuego y Protección Contra Incendio',
          `${metrics.fireload.total} estudios`,
          'Cálculo de resistencia al fuego y potencial extintor (Dec. 351/79 Anexo VII)'
        ]);
      }
      if (includedSections.accidents) {
        tableData.push([
          'Registro e Investigación de Siniestralidad',
          `${metrics.accidents.total} eventos`,
          metrics.accidents.total === 0
            ? 'Período sin accidentes laborales registrados (0 siniestros)'
            : 'Investigación mediante método de Árbol de Causas y medidas correctivas'
        ]);
      }
      if (includedSections.capa) {
        tableData.push([
          'Plan de Acciones Correctivas y Preventivas (CAPA)',
          `${metrics.capa.total} acciones`,
          `${metrics.capa.completed} cerradas / ${metrics.capa.pending} en seguimiento activo`
        ]);
      }

      if (tableData.length === 0) {
        tableData.push(['Sin bloques seleccionados', '0', 'Seleccione al menos un bloque para detallar.']);
      }

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Módulo / Actuación Técnica', 'Volumen', 'Alcance y Respaldo Normativo']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9, cellPadding: 4.5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 68, textColor: [30, 41, 59] },
          1: { cellWidth: 34, textColor: [37, 99, 235], fontStyle: 'bold' }
        }
      });

      // --- 3. CONCLUSIONES Y RECOMENDACIONES ---
      const finalY = (doc as any).lastAutoTable.finalY || currentY + 60;
      let notesY = finalY + 11;

      const effectiveNotes =
        customNotes.trim() ||
        `Se certifica el cumplimiento de las actividades preventivas detalladas durante ${monthName} en ${companyDisplayName}, recomendándose sostener las recorridas periódicas de seguridad y la actualización continua del legajo técnico.`;

      if (notesY > pageHeight - 65) {
        doc.addPage();
        notesY = 25;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accentColor);
      doc.text('3. Dictamen, Conclusiones y Recomendaciones del Especialista', 15, notesY);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textDark);
      const splitNotes = doc.splitTextToSize(effectiveNotes, pageWidth - 30);
      doc.text(splitNotes, 15, notesY + 7);
      notesY += 10 + splitNotes.length * 4.5;

      // --- BLOQUE DE FIRMAS ---
      if (notesY > pageHeight - 50) {
        doc.addPage();
        notesY = 30;
      }

      const sigY = notesY + 25;
      doc.setDrawColor(203, 213, 225);

      doc.line(20, sigY, 90, sigY);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('RECIBIDO POR LA EMPRESA / GERENCIA', 24, sigY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      doc.text(`Conformidad ${companyDisplayName}`, 28, sigY + 10);

      if (personalInfo.signature) {
        try {
          doc.addImage(personalInfo.signature, 'PNG', 125, sigY - 21, 36, 18);
        } catch {
          // ignore
        }
      }
      if (personalInfo.stamp) {
        try {
          doc.addImage(personalInfo.stamp, 'PNG', 162, sigY - 21, 26, 18);
        } catch {
          // ignore
        }
      }

      doc.line(120, sigY, 192, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('PROFESIONAL HIGIENE Y SEGURIDAD', 126, sigY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      doc.text(
        `${profDisplayName} — Mat. ${personalInfo.license || personalInfo.matricula || 'Vigente'}`,
        124,
        sigY + 10
      );

      // --- NUMERACIÓN DE PÁGINAS ---
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...textGray);
        doc.text(
          `Dossier Ejecutivo H&S — ${companyDisplayName} (${monthName}) — Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(
        `Dossier_Ejecutivo_HyS_${companyDisplayName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName.replace(/\s+/g, '_')}.pdf`
      );
      toast.success('Dossier Ejecutivo PDF generado con éxito ✅', { id: toastId });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast.error('Error al compilar el dossier en PDF');
    }
  };

  const toggleSection = (key: keyof IncludedSectionsState) => {
    setIncludedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllSections = (value: boolean) => {
    setIncludedSections({
      summary: value,
      ats: value,
      permits: value,
      inspections: value,
      srtProtocols: value,
      ppeAndAssets: value,
      training: value,
      talks: value,
      drills: value,
      fireload: value,
      accidents: value,
      capa: value
    });
  };

  const moduleCards = [
    {
      key: 'ats',
      label: 'ATS y Matrices de Riesgo',
      value: metrics.ats.total + metrics.riskAssessments.total,
      sub: `${metrics.riskAssessments.highRisk} de riesgo alto/crítico`,
      route: '/ats',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      icon: <ShieldCheck size={20} color="#10b981" />
    },
    {
      key: 'permits',
      label: 'Permisos de Trabajo (PTAR)',
      value: metrics.permits.total,
      sub: 'Altura, Caliente, Confinados, LOTO',
      route: '/work-permit',
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      icon: <FileSignature size={20} color="#2563eb" />
    },
    {
      key: 'inspections',
      label: 'Inspecciones y Checklists',
      value: metrics.inspections.total,
      sub: `${metrics.inspections.critical} con desvíos críticos`,
      route: '/checklists',
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.12)',
      icon: <ClipboardList size={20} color="#7c3aed" />
    },
    {
      key: 'srtProtocols',
      label: 'Protocolos Oficiales SRT',
      value: metrics.srtProtocols.total,
      sub: 'PAT 900/15, Luz, Ruido, RGRL, Ergo',
      route: '/grounding',
      color: '#0ea5e9',
      bg: 'rgba(14, 165, 233, 0.12)',
      icon: <Award size={20} color="#0ea5e9" />
    },
    {
      key: 'ppeAndAssets',
      label: 'EPP y Equipos / Extintores',
      value: metrics.ppeAndAssets.total,
      sub: 'Res. 299/11 + Control de activos QR',
      route: '/ppe-tracker',
      color: '#d97706',
      bg: 'rgba(245, 158, 11, 0.12)',
      icon: <HardHat size={20} color="#d97706" />
    },
    {
      key: 'talks',
      label: 'Charlas de 5 Minutos',
      value: metrics.talks.total,
      sub: `${metrics.talks.attendees} firmas registradas`,
      route: '/toolbox-talk',
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.12)',
      icon: <Users size={20} color="#0284c7" />
    },
    {
      key: 'training',
      label: 'Capacitaciones Dictadas',
      value: metrics.training.total,
      sub: `${metrics.training.attendees} trabajadores formados`,
      route: '/training-management',
      color: '#db2777',
      bg: 'rgba(219, 39, 119, 0.12)',
      icon: <Users size={20} color="#db2777" />
    },
    {
      key: 'capa',
      label: 'Planes de Acción (CAPA)',
      value: metrics.capa.total,
      sub: `${metrics.capa.pending} pendientes / ${metrics.capa.completed} cerrados`,
      route: '/capa',
      color: '#dc2626',
      bg: 'rgba(239, 68, 68, 0.12)',
      icon: <Wrench size={20} color="#dc2626" />
    },
    {
      key: 'drills',
      label: 'Simulacros de Emergencia',
      value: metrics.drills.total,
      sub: 'Evacuación y tiempos de respuesta',
      route: '/drills',
      color: '#0d9488',
      bg: 'rgba(13, 148, 136, 0.12)',
      icon: <Siren size={20} color="#0d9488" />
    },
    {
      key: 'fireload',
      label: 'Carga de Fuego (Dec. 351)',
      value: metrics.fireload.total,
      sub: 'Estudios de potencial extintor',
      route: '/fire-load',
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.12)',
      icon: <Flame size={20} color="#ea580c" />
    },
    {
      key: 'accidents',
      label: 'Siniestralidad e Incidentes',
      value: metrics.accidents.total,
      sub: metrics.accidents.total === 0 ? 'Período sin accidentes ✓' : 'Eventos investigados',
      route: '/accident-history',
      color: metrics.accidents.total === 0 ? '#059669' : '#e11d48',
      bg: metrics.accidents.total === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(225, 29, 72, 0.12)',
      icon: <AlertCircle size={20} color={metrics.accidents.total === 0 ? '#059669' : '#e11d48'} />
    }
  ];

  return (
    <div
      className="container max-w-6xl mx-auto px-3 sm:px-6 animate-fade-in"
      style={{
        paddingTop: '7.25rem',
        paddingBottom: '6.5rem',
        margin: '0 auto',
        width: '100%'
      }}
    >
      {/* Premium Header */}
      <div className="mb-5 sm:mb-6">
        <PremiumHeader
          title="Reporte Mensual y Dossier Ejecutivo"
          subtitle="Compilador 1-Click de gestión preventiva, protocolos SRT y estadísticas para Gerencia, Clientes y Auditorías ART."
          icon={<TrendingUp className="w-7 h-7" />}
          gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)"
          badge={activeCompany ? activeCompany.name : 'Dossier Ejecutivo A4'}
        />
      </div>

      {/* Barra de Control de Período y Exportación */}
      <div
        className="rounded-3xl p-4 sm:p-5 mb-6 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)'
        }}
      >
        {/* Selector de Alcance + Mes */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
          {/* Tabs Mes / Año / Todo */}
          <div
            className="grid grid-cols-3 gap-1 p-1 rounded-2xl"
            style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)'
            }}
          >
            {[
              { id: 'month', label: 'Por Mes' },
              { id: 'year', label: 'Anual' },
              { id: 'all', label: 'Histórico' }
            ].map((tab) => {
              const active = reportScope === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReportScope(tab.id as ReportScope)}
                  style={{
                    marginBottom: 0,
                    padding: '0.45rem 0.75rem',
                    borderRadius: '0.75rem',
                    backgroundColor: active ? '#4f46e5' : 'transparent',
                    color: active ? '#ffffff' : 'var(--color-text)',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Navegador de Mes */}
          {reportScope === 'month' && (
            <div
              className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-2xl"
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)'
              }}
            >
              <button
                type="button"
                onClick={() => setMonthOffset((p) => p - 1)}
                title="Mes anterior"
                style={{
                  marginBottom: 0,
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1.5 px-2.5 min-w-[145px] justify-center">
                <Calendar size={14} color="#4f46e5" />
                <span
                  className="text-xs sm:text-sm font-black capitalize"
                  style={{ color: 'var(--color-text)' }}
                >
                  {monthName}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMonthOffset((p) => p + 1)}
                disabled={monthOffset >= 0}
                title="Mes siguiente"
                style={{
                  marginBottom: 0,
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: monthOffset >= 0 ? 'not-allowed' : 'pointer',
                  opacity: monthOffset >= 0 ? 0.35 : 1
                }}
              >
                <ChevronRight size={16} />
              </button>

              {monthOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setMonthOffset(0)}
                  title="Volver al mes actual"
                  style={{
                    marginBottom: 0,
                    padding: '0.35rem 0.6rem',
                    borderRadius: '9px',
                    backgroundColor: 'rgba(79, 70, 229, 0.12)',
                    color: '#4f46e5',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={12} /> Hoy
                </button>
              )}
            </div>
          )}
        </div>

        {/* Botones de Acción Ejecutiva */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            style={{
              marginBottom: 0,
              padding: '0.7rem 0.95rem',
              borderRadius: '0.9rem',
              backgroundColor: showPreview ? 'rgba(79, 70, 229, 0.12)' : 'var(--color-background)',
              color: showPreview ? '#4f46e5' : 'var(--color-text)',
              border: `1px solid ${showPreview ? '#4f46e5' : 'var(--color-border)'}`,
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <Eye size={15} /> {showPreview ? 'Ocultar Vista A4' : 'Vista Previa A4'}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              marginBottom: 0,
              padding: '0.7rem 0.95rem',
              borderRadius: '0.9rem',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={15} color="#059669" /> Exportar CSV
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            style={{
              marginBottom: 0,
              padding: '0.7rem 0.95rem',
              borderRadius: '0.9rem',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <Share2 size={15} /> WhatsApp
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={loading}
            className="sm:col-span-3 lg:col-auto"
            style={{
              marginBottom: 0,
              padding: '0.75rem 1.2rem',
              borderRadius: '0.95rem',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 900,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Download size={16} /> Compilar Dossier PDF
          </button>
        </div>
      </div>

      {/* 4 KPIs Ejecutivos Superiores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div
          className="rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="min-w-0">
            <p
              className="text-[11px] font-bold uppercase tracking-wider m-0"
              style={{ color: 'var(--color-text-light)' }}
            >
              Actuaciones Técnicas
            </p>
            <p className="text-xl sm:text-2xl font-black m-0 mt-1" style={{ color: '#2563eb' }}>
              {totalActions}
            </p>
            <span className="text-[11px] block mt-0.5 capitalize truncate" style={{ color: 'var(--color-text-light)' }}>
              {monthName}
            </span>
          </div>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div
          className="rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="min-w-0">
            <p
              className="text-[11px] font-bold uppercase tracking-wider m-0"
              style={{ color: 'var(--color-text-light)' }}
            >
              Cumplimiento H&S
            </p>
            <p className="text-xl sm:text-2xl font-black m-0 mt-1" style={{ color: '#059669' }}>
              {complianceScore}%
            </p>
            <span className="text-[11px] block mt-0.5 truncate" style={{ color: 'var(--color-text-light)' }}>
              {metrics.capa.pending} CAPAs en curso
            </span>
          </div>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div
          className="rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="min-w-0">
            <p
              className="text-[11px] font-bold uppercase tracking-wider m-0"
              style={{ color: 'var(--color-text-light)' }}
            >
              Personal Capacitado
            </p>
            <p className="text-xl sm:text-2xl font-black m-0 mt-1" style={{ color: '#7c3aed' }}>
              {totalTrainedWorkers}
            </p>
            <span className="text-[11px] block mt-0.5 truncate" style={{ color: 'var(--color-text-light)' }}>
              {metrics.training.total + metrics.talks.total} sesiones dictadas
            </span>
          </div>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed' }}
          >
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div
          className="rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="min-w-0">
            <p
              className="text-[11px] font-bold uppercase tracking-wider m-0"
              style={{ color: 'var(--color-text-light)' }}
            >
              Siniestralidad
            </p>
            <p
              className="text-lg sm:text-xl font-black m-0 mt-1 truncate"
              style={{ color: metrics.accidents.total === 0 ? '#059669' : '#dc2626' }}
            >
              {metrics.accidents.total === 0 ? '0 Accidentes ✓' : `${metrics.accidents.total} Eventos`}
            </p>
            <span className="text-[11px] block mt-0.5 truncate" style={{ color: 'var(--color-text-light)' }}>
              {metrics.accidents.total === 0 ? 'Período Seguro' : 'Con investigación'}
            </span>
          </div>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor:
                metrics.accidents.total === 0
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(239, 68, 68, 0.12)',
              color: metrics.accidents.total === 0 ? '#059669' : '#dc2626'
            }}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Vista Previa en Vivo del Dossier A4 (Desplegable) */}
      {showPreview && (
        <div
          className="rounded-3xl p-4 sm:p-6 mb-6 shadow-md"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid rgba(79, 70, 229, 0.35)'
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText size={18} color="#4f46e5" />
              <span className="text-sm font-black" style={{ color: 'var(--color-text)' }}>
                Vista Previa de Portada y Estructura del Dossier A4
              </span>
            </div>
            <span
              className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5' }}
            >
              Simulación A4 en Tiempo Real
            </span>
          </div>

          <div
            className="rounded-2xl overflow-hidden mx-auto"
            style={{
              maxWidth: '780px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)'
            }}
          >
            {/* Cabecera Institucional A4 */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderBottom: '4px solid #2563eb',
                padding: '1.25rem 1.5rem',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#93c5fd', letterSpacing: '0.08em' }}>
                  INFORME EJECUTIVO DE HIGIENE Y SEGURIDAD LABORAL
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, marginTop: '0.2rem' }}>
                  DOSSIER DE GESTIÓN H&S — {monthName.toUpperCase()}
                </div>
              </div>
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Logo"
                  style={{ maxHeight: '42px', maxWidth: '110px', objectFit: 'contain', backgroundColor: '#fff', padding: '4px', borderRadius: '6px' }}
                />
              ) : (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.12)'
                  }}
                >
                  {companyDisplayName}
                </span>
              )}
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl text-xs"
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <div>
                  <span style={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: '0.68rem' }}>
                    COMITENTE / EMPRESA
                  </span>
                  <strong style={{ color: '#0f172a' }}>{companyDisplayName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: '0.68rem' }}>
                    PROFESIONAL RESPONSABLE
                  </span>
                  <strong style={{ color: '#0f172a' }}>{profDisplayName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: '0.68rem' }}>
                    ACTUACIONES / CUMPLIMIENTO
                  </span>
                  <strong style={{ color: '#2563eb' }}>
                    {totalActions} registros ({complianceScore}%)
                  </strong>
                </div>
              </div>

              <div className="text-xs leading-relaxed" style={{ color: '#334155' }}>
                <strong style={{ color: '#1d4ed8', display: 'block', marginBottom: '0.25rem' }}>
                  Dictamen / Observaciones incluidas:
                </strong>
                {customNotes.trim() ||
                  `Se certifica el cumplimiento de las actividades preventivas detalladas durante ${monthName} en ${companyDisplayName}, bajo Ley Nac. 19.587 y Dec. 351/79.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Bloques del Informe Ejecutivo */}
      <div
        className="rounded-3xl p-4 sm:p-6 mb-6 shadow-sm"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.14)', color: '#d97706' }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                Bloques a Incluir en el Dossier PDF
              </h2>
              <p className="text-xs m-0" style={{ color: 'var(--color-text-light)' }}>
                Marcá o desmarcá qué capítulos se imprimirán en la tabla técnica del informe A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selectAllSections(true)}
              style={{
                marginBottom: 0,
                padding: '0.4rem 0.75rem',
                borderRadius: '0.7rem',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                fontWeight: 800,
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              Marcar Todos
            </button>
            <button
              type="button"
              onClick={() => selectAllSections(false)}
              style={{
                marginBottom: 0,
                padding: '0.4rem 0.75rem',
                borderRadius: '0.7rem',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-light)',
                border: '1px solid var(--color-border)',
                fontWeight: 700,
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { key: 'summary', label: 'Resumen Ejecutivo', count: null },
            { key: 'ats', label: 'ATS / IPERC', count: metrics.ats.total + metrics.riskAssessments.total },
            { key: 'permits', label: 'Permisos PTAR', count: metrics.permits.total },
            { key: 'inspections', label: 'Checklists / STOP', count: metrics.inspections.total },
            { key: 'srtProtocols', label: 'Protocolos SRT', count: metrics.srtProtocols.total },
            { key: 'ppeAndAssets', label: 'EPP y Equipos', count: metrics.ppeAndAssets.total },
            { key: 'talks', label: 'Charlas 5 Min', count: metrics.talks.total },
            { key: 'training', label: 'Capacitaciones', count: metrics.training.total },
            { key: 'drills', label: 'Simulacros', count: metrics.drills.total },
            { key: 'fireload', label: 'Carga de Fuego', count: metrics.fireload.total },
            { key: 'accidents', label: 'Siniestralidad', count: metrics.accidents.total },
            { key: 'capa', label: 'Plan CAPA', count: metrics.capa.total }
          ].map((block) => {
            const isChecked = includedSections[block.key as keyof IncludedSectionsState];
            return (
              <button
                key={block.key}
                type="button"
                onClick={() => toggleSection(block.key as keyof IncludedSectionsState)}
                style={{
                  marginBottom: 0,
                  padding: '0.65rem 0.75rem',
                  borderRadius: '0.9rem',
                  backgroundColor: isChecked
                    ? 'rgba(37, 99, 235, 0.09)'
                    : 'var(--color-background)',
                  border: `1.5px solid ${isChecked ? '#2563eb' : 'var(--color-border)'}`,
                  color: isChecked ? '#2563eb' : 'var(--color-text-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isChecked ? <CheckSquare size={15} /> : <Square size={15} />}
                  <span
                    className="text-xs font-extrabold truncate"
                    style={{ color: isChecked ? 'var(--color-text)' : 'var(--color-text-light)' }}
                  >
                    {block.label}
                  </span>
                </div>
                {block.count !== null && (
                  <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0"
                    style={{
                      backgroundColor: isChecked ? '#2563eb' : 'var(--color-surface)',
                      color: isChecked ? '#ffffff' : 'var(--color-text-light)'
                    }}
                  >
                    {block.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resumen Gráfico + Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Tarjeta Resumen Principal */}
        <div
          className="lg:col-span-5 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between"
          style={{
            background: 'linear-gradient(145deg, #1e1b4b 0%, #1d4ed8 100%)',
            color: '#ffffff'
          }}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.16)',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#ffffff'
                }}
              >
                ✦ Balance Operativo
              </span>
              {activeCompany && (
                <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#bfdbfe' }}>
                  <Building2 size={13} /> {activeCompany.name}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2.5 my-2">
              <span style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1, color: '#ffffff' }}>
                {totalActions}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#bfdbfe' }}>
                registros auditables
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.5, margin: '0.5rem 0 1rem' }}>
              {totalActions > 0
                ? `Volumen documentado durante ${monthName}. Podés compilar el Dossier PDF oficial con membrete y firma en cualquier momento.`
                : `Aún no se registraron documentos en ${monthName}. Podés cambiar a vista "Anual" o "Histórico" arriba, o emitir un certificado mensual sin siniestralidad.`}
            </p>
          </div>

          <div
            className="pt-3.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs"
            style={{ borderColor: 'rgba(255, 255, 255, 0.18)', color: '#dbeafe' }}
          >
            <span>Marco Legal: Ley 19.587 / Dec. 351/79</span>
            {totalActions === 0 && reportScope === 'month' && (
              <button
                type="button"
                onClick={() => setReportScope('all')}
                style={{
                  marginBottom: 0,
                  padding: '0.35rem 0.7rem',
                  borderRadius: '0.6rem',
                  backgroundColor: '#ffffff',
                  color: '#1e3a8a',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
              >
                Ver Historial Completo →
              </button>
            )}
          </div>
        </div>

        {/* Gráfico de Distribución o Guía de Carga */}
        <div
          id="chart-container-pdf"
          className="lg:col-span-7 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Target size={18} color="#2563eb" />
              <h3 className="text-sm sm:text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                Distribución del Esfuerzo Preventivo
              </h3>
            </div>
            <span className="text-xs font-bold capitalize" style={{ color: 'var(--color-text-light)' }}>
              {monthName}
            </span>
          </div>

          {chartData.length > 0 ? (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="45%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="rounded-2xl p-6 text-center my-auto"
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px dashed var(--color-border)'
              }}
            >
              <p className="text-sm font-black m-0 mb-1" style={{ color: 'var(--color-text)' }}>
                Sin gráfico de distribución en {monthName}
              </p>
              <p className="text-xs m-0 mb-3" style={{ color: 'var(--color-text-light)' }}>
                Cargá inspecciones, ATS, protocolos o cambiá el filtro superior a "Anual" / "Histórico" para graficar el acumulado.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setReportScope('all')}
                  style={{
                    marginBottom: 0,
                    padding: '0.5rem 0.9rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    cursor: 'pointer'
                  }}
                >
                  Cargar Acumulado Histórico
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/ats')}
                  style={{
                    marginBottom: 0,
                    padding: '0.5rem 0.9rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    cursor: 'pointer'
                  }}
                >
                  Ir a Crear ATS
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grilla de Módulos con Acceso Directo */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
            Desglose por Módulo Operativo
          </h2>
          <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>
            Tocá cualquier tarjeta para abrir su módulo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {moduleCards.map((card) => (
            <div
              key={card.key}
              onClick={() => navigate(card.route)}
              className="rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-md"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: card.bg }}
                >
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <span
                    className="text-xs font-black block truncate"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {card.label}
                  </span>
                  <span
                    className="text-[11px] block truncate mt-0.5"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    {card.sub}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xl font-black" style={{ color: card.color }}>
                  {card.value}
                </span>
                <ArrowUpRight size={16} color="var(--color-text-light)" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conclusiones y Recomendaciones con Redacción Inteligente 1-Click */}
      <div
        className="rounded-3xl p-4 sm:p-6 shadow-sm"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black m-0" style={{ color: 'var(--color-text)' }}>
                Dictamen, Conclusiones y Recomendaciones del Especialista
              </h3>
              <p className="text-xs m-0" style={{ color: 'var(--color-text-light)' }}>
                Se guarda automáticamente y se imprime en el capítulo 3 del Dossier PDF
              </p>
            </div>
          </div>

          {/* Botones de Plantillas 1-Click */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => generateTemplateNote('executive')}
              style={{
                marginBottom: 0,
                padding: '0.45rem 0.8rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.73rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={13} /> Autocompletar Dictamen
            </button>

            <button
              type="button"
              onClick={() => generateTemplateNote('art')}
              style={{
                marginBottom: 0,
                padding: '0.45rem 0.75rem',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                fontWeight: 800,
                fontSize: '0.73rem',
                cursor: 'pointer'
              }}
            >
              Plantilla ART / SRT
            </button>

            <button
              type="button"
              onClick={() => generateTemplateNote('board')}
              style={{
                marginBottom: 0,
                padding: '0.45rem 0.75rem',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                fontWeight: 800,
                fontSize: '0.73rem',
                cursor: 'pointer'
              }}
            >
              Plantilla Directorio
            </button>
          </div>
        </div>

        <textarea
          rows={4}
          value={customNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Ingresá observaciones técnicas, recomendaciones de mejora o tocá 'Autocompletar Dictamen' para redactar una conclusión formal basada en las estadísticas del período..."
          style={{
            width: '100%',
            padding: '0.9rem 1rem',
            borderRadius: '1rem',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            fontSize: '0.85rem',
            lineHeight: 1.55,
            outline: 'none'
          }}
        />
      </div>
    </div>
  );
}
