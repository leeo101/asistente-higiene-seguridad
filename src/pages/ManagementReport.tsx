import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, FileText, Calendar, TrendingUp, ShieldCheck, Shield,
  ClipboardList, Users, Siren, Flame, Target, FileSignature, ChevronRight, ChevronLeft,
  HardHat, TriangleAlert, Building2, CheckSquare, Square, CheckCircle2,
  Sparkles, MessageSquare, AlertCircle, Check
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AdBanner from '../components/AdBanner';
import { useCompany } from '../contexts/CompanyContext';

export default function ManagementReport(): React.ReactElement | null {
  const navigate = useNavigate();
  useDocumentTitle('Dossier Mensual de Gestión HyS');

  const { activeCompany, isAllCompanies } = useCompany();
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

  // Selector de bloques del dossier
  const [includedSections, setIncludedSections] = useState({
    summary: true,
    ats: true,
    permits: true,
    inspections: true,
    riskAssessments: true,
    training: true,
    talks: true,
    drills: true,
    fireload: true,
    accidents: true,
    capa: true
  });

  const [customNotes, setCustomNotes] = useState('');

  const [metrics, setMetrics] = useState({
    ats: { total: 0 },
    permits: { total: 0 },
    inspections: { total: 0, critical: 0 },
    riskAssessments: { total: 0, highRisk: 0 },
    training: { total: 0, attendees: 0 },
    talks: { total: 0, attendees: 0 },
    drills: { total: 0 },
    accidents: { total: 0 },
    fireload: { total: 0 },
    audits: { total: 0 },
    capa: { total: 0, pending: 0 }
  });

  const getTargetDates = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);

    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    return {
      firstDay,
      lastDay,
      monthName: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    };
  };

  const loadMetrics = () => {
    setLoading(true);
    const { firstDay, lastDay } = getTargetDates();

    const isWithinMonth = (dateString: string | undefined) => {
      if (!dateString) return false;
      const d = new Date(dateString);
      return d >= firstDay && d <= lastDay;
    };

    const matchesCompany = (item: any) => {
      if (isAllCompanies || !activeCompany) return true;
      const emp = item.empresa || item.cliente || item.razonSocial || item.company || '';
      if (!emp) return true;
      return (
        emp.toLowerCase().includes(activeCompany.name.toLowerCase()) ||
        activeCompany.name.toLowerCase().includes(emp.toLowerCase())
      );
    };

    const safeParse = (key: string) => {
      try {
        return JSON.parse(localStorage.getItem(key) || '[]');
      } catch {
        return [];
      }
    };

    const ats = safeParse('ats_history').filter(
      (i: any) => isWithinMonth(i.fecha || i.createdAt || i.date) && matchesCompany(i)
    );
    const permits = safeParse('work_permits_history').filter(
      (i: any) => isWithinMonth(i.createdAt || i.date) && matchesCompany(i)
    );
    const inspections = [...safeParse('inspections_history'), ...safeParse('tool_checklists_history')].filter(
      (i: any) => isWithinMonth(i.date || i.createdAt || i.fecha) && matchesCompany(i)
    );
    const risks = safeParse('risk_assessment_history').filter(
      (i: any) => isWithinMonth(i.date || i.createdAt) && matchesCompany(i)
    );
    const training = safeParse('training_history').filter(
      (i: any) => isWithinMonth(i.date || i.createdAt) && matchesCompany(i)
    );
    const talks = safeParse('toolbox_talks_history').filter(
      (i: any) => isWithinMonth(i.date || i.fecha || i.createdAt) && matchesCompany(i)
    );
    const drills = safeParse('drills_history').filter(
      (i: any) => isWithinMonth(i.date || i.createdAt) && matchesCompany(i)
    );
    const accidents = safeParse('accident_history').filter(
      (i: any) => isWithinMonth(i.date || i.createdAt) && matchesCompany(i)
    );
    const fireload = safeParse('fireload_history').filter(
      (i: any) => isWithinMonth(i.createdAt || i.date) && matchesCompany(i)
    );
    const audits = safeParse('ehs_audits_db').filter(
      (i: any) => isWithinMonth(i.date || i.createdAt) && matchesCompany(i)
    );
    const capas = safeParse('capas_db').filter(
      (i: any) => isWithinMonth(i.createdAt || i.targetDate) && matchesCompany(i)
    );

    setMetrics({
      ats: { total: ats.length },
      permits: { total: permits.length },
      inspections: {
        total: inspections.length,
        critical: inspections.filter((i: any) => i.score < 50 || i.status === 'NC').length
      },
      riskAssessments: {
        total: risks.length,
        highRisk: risks.filter(
          (r: any) =>
            (r.riskLevel || '').toLowerCase().includes('crítico') ||
            (r.riskLevel || '').toLowerCase().includes('alto')
        ).length
      },
      training: {
        total: training.length,
        attendees: training.reduce(
          (acc: number, curr: any) => acc + (curr.attendees?.length || curr.participants?.length || 0),
          0
        )
      },
      talks: {
        total: talks.length,
        attendees: talks.reduce((acc: number, curr: any) => acc + (curr.attendees?.length || 0), 0)
      },
      drills: { total: drills.length },
      accidents: { total: accidents.length },
      fireload: { total: fireload.length },
      audits: { total: audits.length },
      capa: {
        total: capas.length,
        pending: capas.filter((c: any) => c.status !== 'completed').length
      }
    });

    setTimeout(() => setLoading(false), 300);
  };

  useEffect(() => {
    loadMetrics();
  }, [monthOffset, activeCompany]);

  const { monthName } = getTargetDates();
  const totalActions =
    metrics.ats.total +
    metrics.permits.total +
    metrics.inspections.total +
    metrics.riskAssessments.total +
    metrics.training.total +
    metrics.talks.total +
    metrics.drills.total +
    metrics.accidents.total +
    metrics.fireload.total +
    metrics.audits.total +
    metrics.capa.total;

  const getChartData = () => {
    const data = [
      { name: 'ATS', value: metrics.ats.total, color: '#10b981' },
      { name: 'Permisos', value: metrics.permits.total, color: '#3b82f6' },
      { name: 'Inspecciones', value: metrics.inspections.total, color: '#8b5cf6' },
      { name: 'Charlas 5 Min', value: metrics.talks.total, color: '#0052CC' },
      { name: 'Capacitaciones', value: metrics.training.total, color: '#ec4899' },
      { name: 'Riesgos', value: metrics.riskAssessments.total, color: '#f59e0b' },
      { name: 'Simulacros', value: metrics.drills.total, color: '#14b8a6' },
      { name: 'Planes CAPA', value: metrics.capa.total, color: '#ef4444' },
      { name: 'Carga de Fuego', value: metrics.fireload.total, color: '#f97316' }
    ];

    return data.filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  };

  const chartData = getChartData();

  const handleExportPDF = async () => {
    try {
      const toastId = toast.loading('Compilando Dossier Mensual de Gestión...');
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const html2canvas = (await import('html2canvas')).default;
      const personalData = JSON.parse(localStorage.getItem('personalData') || '{}');
      const profName = personalData.fullName || personalData.name || 'Especialista en Higiene y Seguridad';
      const company = activeCompany ? activeCompany.name : personalData.company || 'Establecimiento General';

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
      const accentColor: [number, number, number] = [37, 99, 235]; // Blue 600
      const textDark: [number, number, number] = [30, 41, 59];
      const textGray: [number, number, number] = [100, 116, 139];

      // --- PORTADA INSTITUCIONAL ---
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 55, 'F');
      doc.setFillColor(...accentColor);
      doc.rect(0, 55, pageWidth, 5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('DOSSIER MENSUAL DE GESTIÓN H&S', 15, 28);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`INFORME EJECUTIVO DE SEGURIDAD, HIGIENE Y MEDIO AMBIENTE`, 15, 38);
      doc.setFontSize(10);
      doc.text(`PERÍODO: ${monthName.toUpperCase()}`, 15, 48);

      // Logo si existe
      const companyLogo = localStorage.getItem('companyLogo');
      if (companyLogo && (companyLogo.startsWith('data:image/') || companyLogo.startsWith('http'))) {
        try {
          doc.addImage(companyLogo, 'PNG', pageWidth - 55, 12, 40, 30);
        } catch {}
      }

      // --- CAJA DE DATOS DE EMPRESA Y PROFESIONAL ---
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 68, pageWidth - 30, 28, 3, 3, 'FD');

      doc.setTextColor(...textDark);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPRESA / COMITENTE:', 20, 77);
      doc.text('PROFESIONAL RESPONSABLE:', 20, 85);
      doc.text('CUIT / ESTABLECIMIENTO:', 20, 93);

      doc.setFont('helvetica', 'normal');
      doc.text(company, 75, 77);
      doc.text(profName, 75, 85);
      doc.text(
        `${activeCompany?.cuit || personalData.cuit || 'N/A'} — ${activeCompany?.establishment || 'Planta Central'}`,
        75,
        93
      );
      doc.text(`Fecha Emisión: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - 70, 77);

      // --- RESUMEN EJECUTIVO ---
      let currentY = 106;
      if (includedSections.summary) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accentColor);
        doc.text('1. Resumen Ejecutivo de Gestión', 15, currentY);

        let mainFocus = 'actividades preventivas diversificadas';
        if (chartData.length > 0) {
          mainFocus = `la gestión de ${chartData[0].name.toLowerCase()} (${chartData[0].value} registros)`;
        }

        const executiveSummary = `Durante el período de ${monthName}, el Servicio de Higiene y Seguridad Laboral coordinó y documentó un volumen global de ${totalActions} actuaciones técnicas en ${company}. La mayor concentración operativa correspondió a ${mainFocus}. Las actividades se ejecutaron en estricto cumplimiento de la Ley Nac. 19.587, Ley 24.557 y sus decretos reglamentarios, asegurando la debida diligencia de la empresa y la protección psicofísica de los trabajadores.`;

        doc.setTextColor(...textDark);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        const splitSummary = doc.splitTextToSize(executiveSummary, pageWidth - 30);
        doc.text(splitSummary, 15, currentY + 7);
        currentY += 12 + splitSummary.length * 4.5;
      }

      // --- GRÁFICO DE DISTRIBUCIÓN ---
      const chartEl = document.getElementById('chart-container-pdf');
      if (chartEl && chartData.length > 0 && includedSections.summary) {
        try {
          const canvas = await html2canvas(chartEl, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const pdfWidth = pageWidth - 30;
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          if (currentY + pdfHeight > pageHeight - 25) {
            doc.addPage();
            currentY = 20;
          }

          doc.addImage(imgData, 'PNG', 15, currentY, pdfWidth, pdfHeight);
          currentY += pdfHeight + 10;
        } catch (err) {
          console.error('Error capturing chart', err);
        }
      }

      // --- TABLA DETALLADA DE MÓDULOS INCLUIDOS ---
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accentColor);
      doc.text('2. Desglose de Indicadores y Actuaciones', 15, currentY);

      const tableData: string[][] = [];

      if (includedSections.ats) {
        tableData.push([
          'Análisis de Trabajo Seguro (ATS)',
          `${metrics.ats.total} registros`,
          'Identificación de peligros y medidas preventivas por tarea'
        ]);
      }
      if (includedSections.permits) {
        tableData.push([
          'Permisos de Trabajo de Alto Riesgo (PTAR)',
          `${metrics.permits.total} emitidos`,
          'Control de trabajos en altura, caliente, confinados y LOTO'
        ]);
      }
      if (includedSections.inspections) {
        tableData.push([
          'Inspecciones y Checklists Industriales',
          `${metrics.inspections.total} efectuadas`,
          `${metrics.inspections.critical} con desvíos críticos señalados`
        ]);
      }
      if (includedSections.talks) {
        tableData.push([
          'Charlas de Seguridad de 5 Minutos',
          `${metrics.talks.total} charlas`,
          `${metrics.talks.attendees} firmas de asistentes registradas`
        ]);
      }
      if (includedSections.training) {
        tableData.push([
          'Capacitaciones Formales en Planta',
          `${metrics.training.total} sesiones`,
          `${metrics.training.attendees} trabajadores capacitados`
        ]);
      }
      if (includedSections.drills) {
        tableData.push([
          'Simulacros de Evacuación y Emergencia',
          `${metrics.drills.total} realizados`,
          'Evaluación de tiempos de respuesta y puntos de encuentro'
        ]);
      }
      if (includedSections.accidents) {
        tableData.push([
          'Registro de Siniestralidad Laboral',
          `${metrics.accidents.total} eventos`,
          'Investigaciones bajo árbol de causas y cálculo de índices'
        ]);
      }
      if (includedSections.capa) {
        tableData.push([
          'Plan de Acciones Correctivas (CAPA)',
          `${metrics.capa.total} medidas`,
          `${metrics.capa.pending} acciones en seguimiento de adecuación`
        ]);
      }
      if (includedSections.fireload) {
        tableData.push([
          'Instalaciones Contra Incendio',
          `${metrics.fireload.total} estudios`,
          'Estudios de Carga de Fuego y control del parque extintor'
        ]);
      }

      if (tableData.length === 0) {
        tableData.push(['Sin secciones seleccionadas', '0', 'Active casillas para incluir datos.']);
      }

      autoTable(doc, {
        startY: currentY + 6,
        head: [['Actuación / Módulo', 'Volumen Registrado', 'Alcance y Marco Normativo']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9.5, cellPadding: 5.5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70, textColor: [30, 41, 59] },
          1: { cellWidth: 40, textColor: [37, 99, 235], fontStyle: 'bold' }
        }
      });

      // --- CONCLUSIONES Y RECOMENDACIONES DEL PROFESIONAL ---
      const finalY = (doc as any).lastAutoTable.finalY || currentY + 60;
      let notesY = finalY + 12;

      if (customNotes.trim()) {
        if (notesY > pageHeight - 65) {
          doc.addPage();
          notesY = 25;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accentColor);
        doc.text('3. Conclusiones y Recomendaciones del Especialista', 15, notesY);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textDark);
        const splitNotes = doc.splitTextToSize(customNotes.trim(), pageWidth - 30);
        doc.text(splitNotes, 15, notesY + 7);
        notesY += 10 + splitNotes.length * 4.5;
      }

      // --- FIRMAS BLOCK ---
      if (notesY > pageHeight - 50) {
        doc.addPage();
        notesY = 30;
      }

      const sigY = notesY + 25;
      doc.setDrawColor(203, 213, 225);

      // Firma izquierda: Recibido Empresa
      doc.line(20, sigY, 90, sigY);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('RECIBIDO POR LA EMPRESA / GERENCIA', 25, sigY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      doc.text('Firma, Aclaración y Sello', 35, sigY + 10);

      // Firma derecha: Especialista HyS
      if (personalData.signature) {
        try {
          doc.addImage(personalData.signature, 'PNG', 135, sigY - 20, 40, 18);
        } catch {}
      }
      doc.line(120, sigY, 190, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('RESPONSABLE HIGIENE Y SEGURIDAD', 125, sigY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textGray);
      doc.text(`${profName} — Matrícula Profesional`, 123, sigY + 10);

      // --- NUMERACIÓN DE PÁGINAS ---
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...textGray);
        doc.text(
          `Dossier Mensual de Gestión HyS — ${company} — Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`Dossier_Gestion_${company.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName.replace(/ /g, '_')}.pdf`);
      toast.success('Dossier Ejecutivo generado exitosamente ✅', { id: toastId });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast.error('Error al compilar el dossier en PDF');
    }
  };

  const toggleSection = (key: keyof typeof includedSections) => {
    setIncludedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="container max-w-6xl pb-16 pt-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer border-none"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="m-0 text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={24} className="text-blue-600" />
                Dossier Mensual de Gestión HyS
              </h1>
              {activeCompany && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
                  <Building2 size={12} /> {activeCompany.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5 font-medium">
              Compilador ejecutivo 1-Click para Directorio, Gerencia General y Auditorías de ART
            </p>
          </div>
        </div>

        {/* Month Selector + Export Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              type="button"
              onClick={() => setMonthOffset(p => p - 1)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border-none bg-transparent"
              title="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold capitalize text-slate-800 dark:text-slate-200 min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              type="button"
              onClick={() => setMonthOffset(p => p + 1)}
              disabled={monthOffset >= 0}
              className={`p-1.5 rounded-lg transition-colors border-none bg-transparent ${
                monthOffset >= 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
              }`}
              title="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={loading || totalActions === 0}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer border-none disabled:opacity-50"
          >
            <Download size={16} /> Compilar Dossier PDF
          </button>
        </div>
      </div>

      {/* Dossier Section Selector */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-amber-500" />
            <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 dark:text-white m-0 tracking-wider">
              Bloques a Incluir en el Informe Ejecutivo
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">
            Selecciona qué módulos formarán parte del reporte
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
          {[
            { key: 'summary', label: 'Resumen Ejecutivo' },
            { key: 'ats', label: 'ATS / IPERC' },
            { key: 'permits', label: 'Permisos PTAR' },
            { key: 'inspections', label: 'Checklists' },
            { key: 'talks', label: 'Charlas 5 Min' },
            { key: 'training', label: 'Capacitaciones' },
            { key: 'drills', label: 'Simulacros' },
            { key: 'fireload', label: 'Carga de Fuego' },
            { key: 'accidents', label: 'Siniestralidad' },
            { key: 'capa', label: 'Plan CAPA' }
          ].map(block => {
            const isChecked = includedSections[block.key as keyof typeof includedSections];
            return (
              <button
                key={block.key}
                type="button"
                onClick={() => toggleSection(block.key as keyof typeof includedSections)}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                }`}
              >
                {isChecked ? <CheckSquare size={15} /> : <Square size={15} />}
                <span className="text-[11px] truncate">{block.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-3" />
          <p className="text-xs font-bold">Compilando estadísticas integrales...</p>
        </div>
      ) : totalActions === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-black text-slate-900 dark:text-white m-0">Sin Actividad en este Período</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            No se detectaron registros en {monthName} para la empresa seleccionada. Utilice los módulos de la plataforma para cargar inspecciones, charlas o permisos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Summary Banner & Pie Chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-lg flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
                  <TrendingUp size={14} /> Total Acumulado
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">{totalActions}</span>
                  <span className="text-sm font-semibold text-slate-300">actuaciones</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Volumen total de documentos técnicos generados y avalados durante {monthName}.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Empresa: {activeCompany ? activeCompany.name : 'Todas'}</span>
                <span>Mes: {monthName}</span>
              </div>
            </div>

            {chartData.length > 0 && (
              <div
                id="chart-container-pdf"
                className="md:col-span-7 p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
              >
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 m-0 mb-2 flex items-center gap-1.5">
                  <Target size={16} className="text-blue-500" /> Distribución del Esfuerzo Preventivo
                </h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
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
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: 'ATS Confeccionados', value: metrics.ats.total, icon: <ShieldCheck size={20} />, color: 'emerald' },
              { label: 'Permisos PTAR', value: metrics.permits.total, icon: <FileSignature size={20} />, color: 'blue' },
              { label: 'Inspecciones / Checklists', value: metrics.inspections.total, icon: <ClipboardList size={20} />, color: 'indigo' },
              { label: 'Charlas de 5 Min', value: metrics.talks.total, icon: <Users size={20} />, color: 'sky' },
              { label: 'Capacitaciones Dictadas', value: metrics.training.total, icon: <Users size={20} />, color: 'pink' },
              { label: 'Planes CAPA', value: metrics.capa.total, icon: <TriangleAlert size={20} />, color: 'rose' },
              { label: 'Simulacros Ejecutados', value: metrics.drills.total, icon: <Siren size={20} />, color: 'teal' },
              { label: 'Siniestralidad Registrada', value: metrics.accidents.total, icon: <AlertCircle size={20} />, color: 'amber' }
            ].map(card => (
              <div
                key={card.label}
                className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3"
              >
                <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200`}>
                  {card.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">
                    {card.label}
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {card.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Conclusiones & Recomendaciones Textarea */}
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare size={17} className="text-blue-500" />
              <label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 m-0">
                Conclusiones y Recomendaciones Profesionales para el Dossier
              </label>
            </div>
            <textarea
              rows={3}
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              placeholder="Ingrese observaciones técnicas, recomendaciones de mejora o comentarios para el Directorio / ART que se incluirán en el PDF..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}