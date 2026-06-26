import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Download, FileText, Calendar, TrendingUp, ShieldCheck, Shield, ClipboardList, Users, Siren, Flame, Target, FileSignature, ChevronRight, HardHat, TriangleAlert, Building } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AdBanner from '../components/AdBanner';

export default function ManagementReport(): React.ReactElement | null {
  const navigate = useNavigate();
  useDocumentTitle('Informe Mensual de Gestión');

  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

  const [metrics, setMetrics] = useState({
    ats: { total: 0 },
    permits: { total: 0 },
    inspections: { total: 0, critical: 0 },
    riskAssessments: { total: 0, highRisk: 0 },
    training: { total: 0, attendees: 0 },
    drills: { total: 0 },
    accidents: { total: 0 },
    fireload: { total: 0 },
    audits: { total: 0 }
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

    const safeParse = (key: string) => {
      try {return JSON.parse(localStorage.getItem(key) || '[]');}
      catch (e) {return [];}
    };

    const ats = safeParse('ats_history').filter((i: any) => isWithinMonth(i.fecha || i.createdAt || i.date));
    const permits = safeParse('work_permits_history').filter((i: any) => isWithinMonth(i.createdAt || i.date));
    const inspections = [...safeParse('inspections_history'), ...safeParse('tool_checklists_history')].filter((i: any) => isWithinMonth(i.date || i.createdAt || i.fecha));
    const risks = safeParse('risk_assessment_history').filter((i: any) => isWithinMonth(i.date || i.createdAt));
    const training = safeParse('training_history').filter((i: any) => isWithinMonth(i.date || i.createdAt));
    const drills = safeParse('drills_history').filter((i: any) => isWithinMonth(i.date || i.createdAt));
    const accidents = safeParse('accident_history').filter((i: any) => isWithinMonth(i.date || i.createdAt));
    const fireload = safeParse('fireload_history').filter((i: any) => isWithinMonth(i.createdAt || i.date));
    const audits = safeParse('ehs_audits_db').filter((i: any) => isWithinMonth(i.date || i.createdAt));

    setMetrics({
      ats: { total: ats.length },
      permits: { total: permits.length },
      inspections: {
        total: inspections.length,
        critical: inspections.filter((i) => i.score < 50 || i.status === 'NC').length
      },
      riskAssessments: {
        total: risks.length,
        highRisk: risks.filter((r) => (r.riskLevel || '').toLowerCase().includes('crítico') || (r.riskLevel || '').toLowerCase().includes('alto')).length
      },
      training: {
        total: training.length,
        attendees: training.reduce((acc: number, curr: any) => acc + (curr.attendees?.length || curr.participants?.length || 0), 0)
      },
      drills: { total: drills.length },
      accidents: { total: accidents.length },
      fireload: { total: fireload.length },
      audits: { total: audits.length }
    });

    setTimeout(() => setLoading(false), 500);
  };

  useEffect(() => {
    loadMetrics();
  }, [monthOffset]);

  const { monthName } = getTargetDates();
  const totalActions = Object.values(metrics).reduce((acc, curr) => acc + curr.total, 0);

  const getChartData = () => {
    const data = [
    { name: 'ATS', value: metrics.ats.total, color: '#10b981' },
    { name: 'Permisos', value: metrics.permits.total, color: '#3b82f6' },
    { name: 'Inspecciones', value: metrics.inspections.total, color: '#8b5cf6' },
    { name: 'Riesgos', value: metrics.riskAssessments.total, color: '#f59e0b' },
    { name: 'Capacitaciones', value: metrics.training.total, color: '#ec4899' },
    { name: 'Simulacros', value: metrics.drills.total, color: '#14b8a6' },
    { name: 'Auditorías', value: metrics.audits.total, color: '#6366f1' },
    { name: 'Carga de Fuego', value: metrics.fireload.total, color: '#f97316' }];

    return data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  };

  const chartData = getChartData();

  const handleExportPDF = async () => {
    try {
      const toastId = toast.loading('Generando reporte en PDF...');
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const personalData = JSON.parse(localStorage.getItem('personalData') || '{}');
      const profName = personalData.fullName || personalData.name || 'Profesional de HyS';
      const company = personalData.company || 'Empresa No Definida';

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Colors
      const primaryColor: [number, number, number] = [30, 58, 138]; // Dark Blue
      const secondaryColor: [number, number, number] = [59, 130, 246]; // Light Blue
      const textDark: [number, number, number] = [31, 41, 55];
      const textGray: [number, number, number] = [107, 114, 128];

      // --- HEADER ---
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setFillColor(...secondaryColor);
      doc.rect(0, 45, pageWidth, 5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORME MENSUAL DE GESTIÓN H&S', 15, 25);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`PERÍODO: ${monthName.toUpperCase()}`, 15, 35);

      // --- LOGO ---
      const companyLogo = localStorage.getItem('companyLogo');
      if (companyLogo && (companyLogo.startsWith('data:image/') || companyLogo.startsWith('http'))) {
        try {
          doc.addImage(companyLogo, 'PNG', pageWidth - 55, 8, 40, 25);
        } catch (err) {}
      }

      // --- INFO BOX ---
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(15, 60, pageWidth - 30, 25, 3, 3, 'F');

      doc.setTextColor(...textDark);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Empresa/Proyecto:', 20, 70);
      doc.text('Elaborado por:', 20, 78);

      doc.setFont('helvetica', 'normal');
      doc.text(company, 60, 70);
      doc.text(profName, 60, 78);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - 70, 70);

      // --- EJECUTIVO (SMART SUMMARY) ---
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Resumen Ejecutivo', 15, 100);

      let mainFocus = 'diversas actividades preventivas';
      if (chartData.length > 0) {
        mainFocus = `la gestión de ${chartData[0].name.toLowerCase()} (con ${chartData[0].value} registros conformados)`;
      }

      const executiveSummary = `Durante el mes de ${monthName}, el servicio de Higiene y Seguridad completó un volumen total de ${totalActions} registros documentales a través de la plataforma. El mayor foco operativo estuvo centralizado en ${mainFocus}. Este seguimiento sistemático asegura el cumplimiento del marco legal vigente y fomenta la mejora continua en la cultura preventiva de la organización, mitigando activamente los riesgos laborales detectados.`;

      doc.setTextColor(...textDark);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitSummary = doc.splitTextToSize(executiveSummary, pageWidth - 30);
      doc.text(splitSummary, 15, 110);

      // --- TABLA DETALLADA ---
      const startY = 115 + splitSummary.length * 5 + 5;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Desglose de Gestión Documental', 15, startY);

      const tableData = [
      ['Análisis de Trabajo Seguro (ATS)', `${metrics.ats.total} confeccionados`, 'Evaluación de tareas rutinarias y no rutinarias.'],
      ['Permisos de Trabajo Especial', `${metrics.permits.total} emitidos`, 'Gestión de trabajos en altura, caliente, etc.'],
      ['Inspecciones y Checklists', `${metrics.inspections.total} realizadas`, `${metrics.inspections.critical} con observaciones críticas (NC).`],
      ['Identificación de Riesgos', `${metrics.riskAssessments.total} tareas`, `${metrics.riskAssessments.highRisk} mapeadas como riesgo crítico/alto.`],
      ['Capacitaciones (In Situ/Sala)', `${metrics.training.total} dictadas`, `${metrics.training.attendees} trabajadores entrenados en total.`],
      ['Simulacros de Emergencia', `${metrics.drills.total} ejecutados`, 'Cumplimiento de plan anual de evacuación.'],
      ['Auditorías EHS', `${metrics.audits.total} realizadas`, 'Verificación de estándares normativos.'],
      ['Estudios de Carga de Fuego', `${metrics.fireload.total} estudios`, 'Decreto 351/79 Anexo VII.'],
      ['Registro de Siniestralidad', `${metrics.accidents.total} reportes`, 'Investigación de accidentes/incidentes.']].
      filter((row) => parseInt(row[1].split(' ')[0]) > 0); // Solo muestra modulos con actividad

      if (tableData.length === 0) {
        tableData.push(['Sin actividad', '0', 'No se registraron documentos en este período.']);
      }

      autoTable(doc, {
        startY: startY + 5,
        head: [['Módulo / Actividad', 'Volumen', 'Detalle Técnico']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        styles: { fontSize: 10, cellPadding: 6 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 65, textColor: [31, 41, 55] },
          1: { cellWidth: 35, textColor: [59, 130, 246], fontStyle: 'bold' }
        }
      });

      // --- FOOTER AND SIGNATURE ---
      const finalY = (doc as any).lastAutoTable.finalY || startY + 50;

      // Check page break for signature
      if (finalY > pageHeight - 60) {
        doc.addPage();
        doc.setDrawColor(156, 163, 175);
        doc.line(130, 50, 190, 50);
        doc.setFontSize(9);
        doc.setTextColor(...textGray);
        doc.text('Firma del Profesional / Responsable', 135, 55);
      } else {
        doc.setDrawColor(156, 163, 175);
        doc.line(130, finalY + 40, 190, finalY + 40);
        doc.setFontSize(9);
        doc.setTextColor(...textGray);
        doc.text('Firma del Profesional / Responsable', 135, finalY + 45);
      }

      // Page numbers on all pages
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...textGray);
        doc.text(`Generado por Asistente de Higiene y Seguridad - Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      doc.save(`Informe_Gestion_${monthName.replace(/ /g, '_')}.pdf`);
      toast.success('Reporte exportado exitosamente', { id: toastId });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  return (
    <div className="container pb-[4rem]">
            <div className="flex items-center gap-[1rem] mb-[2rem] mt-[1rem]">
                <></>
                <div className="flex items-center gap-[0.6rem]">
                    <TrendingUp size={24} color="var(--color-primary)" />
                    <h1 className="m-[0] text-[1.5rem] font-[800]">Informe de Gestión</h1>
                </div>
            </div>

            <div className="card p-[1.2rem] mb-[2rem] flex justify-space-between items-center flex-wrap gap-[1rem]">
                <div className="flex items-center gap-4">
                    <></>
                    <div className="flex items-center gap-[0.5rem] font-[700] text-[1.1rem] text-[var(--color-primary)] capitalize w-[140px] justify-center">
                        <Calendar size={18} />
                        {monthName.split(' ')[0]}
                    </div>
                    <button
            onClick={() => setMonthOffset((prev) => prev + 1)}
            disabled={monthOffset >= 0}
            style={{ cursor: monthOffset >= 0 ? 'not-allowed' : 'pointer', opacity: monthOffset >= 0 ? 0.5 : 1 }} className="p-[0.6rem] border-[1px_solid_var(--color-border)] rounded-[10px] bg-[var(--color-surface)] text-[var(--color-text)] transition-[all_0.2s]">
            
                        <ChevronRight size={16} />
                    </button>
                </div>

                <button
          onClick={handleExportPDF}
          disabled={loading || totalActions === 0}
          className="btn-primary m-[0] flex items-center gap-[0.5rem] p-[0.8rem_1.5rem] rounded-[12px] box-shadow-[0_4px_15px_rgba(59,_130,_246,_0.3)]">

          
                    <Download size={18} /> Exportar Mensual PDF
                </button>
            </div>

            {loading ?
      <div className="flex flex-col items-center justify-center p-[4rem_0] opacity-[0.5]">
                    <div className="spinner border-top-color-[var(--color-primary)] mb-[1rem]"></div>
                    <p className="font-[600]">Compilando estadísticas integrales...</p>
                </div> :
      totalActions === 0 ?
      <div className="card p-[4rem_2rem] text-center bg-[rgba(59,_130,_246,_0.05)] border-[1px_dashed_var(--color-primary)]">
                    <FileText size={48} color="var(--color-primary)" className="opacity-[0.3] mb-[1rem]" />
                    <h3 className="m-[0_0_0.5rem_0] text-[1.2rem] font-[800]">Sin Actividad Registrada</h3>
                    <p className="m-[0] text-[var(--color-text-muted)] text-[0.9rem]">No hay reportes ni documentos guardados durante {monthName}.</p>
                </div> :

      <div className="flex flex-col gap-[1.5rem] animation-[fadeIn_0.4s_ease]">

                    {/* Resumen Superior */}
                    <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(min(100%,_300px),_1fr))] gap-[1.5rem]">
                        {/* Volumen General */}
                        <div className="card p-[2rem] bg-[linear-gradient(135deg,_var(--color-primary),_#1e40af)] text-[white] border-none flex flex-col justify-center">
                            <h2 className="m-[0_0_1rem_0] text-[1.1rem] font-[700] opacity-[0.9] flex items-center gap-[0.5rem]">
                                <TrendingUp size={20} /> Volumen de Gestión Integral
                            </h2>
                            <div className="flex items-baseline gap-[0.5rem]">
                                <span className="text-[4rem] font-[900] line-height-[1] text-shadow-[0_4px_10px_rgba(0,0,0,0.2)]">{totalActions}</span>
                                <span className="text-[1.1rem] font-[600] opacity-[0.8]">documentos generados</span>
                            </div>
                            <p className="m-[1rem_0_0] text-[0.9rem] opacity-[0.7] line-height-[1.5]">
                                Incluye todos los registros conformados y avalados dentro de la plataforma durante el período.
                            </p>
                        </div>

                        {/* Gráfico de Distribución */}
                        {chartData.length > 0 &&
          <div className="card p-[1.5rem] flex flex-col">
                                <h3 className="m-[0_0_1rem] text-[1rem] font-[700] text-[var(--color-text)] flex items-center gap-[0.5rem]">
                                    <Target size={18} color="var(--color-primary)" /> Distribución del Esfuerzo
                                </h3>
                                <div className="flex-[1] min-h-[200px] w-[100%]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value">
                    
                                                {chartData.map((entry, index) =>
                    <Cell key={`cell-${index}`} fill={entry.color} />
                    )}
                                            </Pie>
                                            <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 800 }} />
                  
                                            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '0.8rem', fontWeight: 600 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
          }
                    </div>

                    {/* Grilla de Métricas Detalladas */}
                    <div className="grid grid-template-columns-[repeat(auto-fill,_minmax(min(100%,_240px),_1fr))] gap-[1rem]">
                        
                        <div className="card hover-lift p-[1.2rem] flex gap-[1rem] items-center">
                            <div className="w-[48px] h-[48px] rounded-[12px] bg-[rgba(16,_185,_129,_0.1)] text-[#10b981] flex items-center justify-center">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[600] uppercase">ATS Realizados</h4>
                                <span className="text-[1.5rem] font-[900] text-[var(--color-text)]">{metrics.ats.total}</span>
                            </div>
                        </div>

                        <div className="card hover-lift p-[1.2rem] flex gap-[1rem] items-center">
                            <div className="w-[48px] h-[48px] rounded-[12px] bg-[rgba(59,_130,_246,_0.1)] text-[#3b82f6] flex items-center justify-center">
                                <FileSignature size={24} />
                            </div>
                            <div>
                                <h4 className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[600] uppercase">Permisos Trabajo</h4>
                                <span className="text-[1.5rem] font-[900] text-[var(--color-text)]">{metrics.permits.total}</span>
                            </div>
                        </div>

                        <div className="card hover-lift p-[1.2rem] flex gap-[1rem] items-center">
                            <div className="w-[48px] h-[48px] rounded-[12px] bg-[rgba(139,_92,_246,_0.1)] text-[#8b5cf6] flex items-center justify-center">
                                <ClipboardList size={24} />
                            </div>
                            <div className="flex-[1]">
                                <h4 className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[600] uppercase">Inspecciones</h4>
                                <div className="flex items-baseline gap-[0.5rem]">
                                    <span className="text-[1.5rem] font-[900] text-[var(--color-text)]">{metrics.inspections.total}</span>
                                    {metrics.inspections.critical > 0 && <span className="text-[0.8rem] text-[#ef4444] font-[800] bg-[rgba(239,_68,_68,_0.1)] p-[2px_6px] rounded-[4px]">{metrics.inspections.critical} CRIT</span>}
                                </div>
                            </div>
                        </div>

                        <div className="card hover-lift p-[1.2rem] flex gap-[1rem] items-center">
                            <div className="w-[48px] h-[48px] rounded-[12px] bg-[rgba(245,_158,_11,_0.1)] text-[#f59e0b] flex items-center justify-center">
                                <TriangleAlert size={24} />
                            </div>
                            <div className="flex-[1]">
                                <h4 className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[600] uppercase">Eval. Riesgos</h4>
                                <div className="flex items-baseline gap-[0.5rem]">
                                    <span className="text-[1.5rem] font-[900] text-[var(--color-text)]">{metrics.riskAssessments.total}</span>
                                    {metrics.riskAssessments.highRisk > 0 && <span className="text-[0.8rem] text-[#ef4444] font-[800] bg-[rgba(239,_68,_68,_0.1)] p-[2px_6px] rounded-[4px]">{metrics.riskAssessments.highRisk} ALTO</span>}
                                </div>
                            </div>
                        </div>

                        <div className="card hover-lift p-[1.2rem] flex gap-[1rem] items-center">
                            <div className="w-[48px] h-[48px] rounded-[12px] bg-[rgba(236,_72,_153,_0.1)] text-[#ec4899] flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <div className="flex-[1]">
                                <h4 className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[600] uppercase">Capacitaciones</h4>
                                <div className="flex items-baseline gap-[0.5rem]">
                                    <span className="text-[1.5rem] font-[900] text-[var(--color-text)]">{metrics.training.total}</span>
                                    <span className="text-[0.85rem] text-[var(--color-text-muted)] font-[600]">({metrics.training.attendees} pers)</span>
                                </div>
                            </div>
                        </div>

                        <div className="card hover-lift p-[1.2rem] flex gap-[1rem] items-center">
                            <div className="w-[48px] h-[48px] rounded-[12px] bg-[rgba(20,_184,_166,_0.1)] text-[#14b8a6] flex items-center justify-center">
                                <Siren size={24} />
                            </div>
                            <div>
                                <h4 className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[600] uppercase">Simulacros</h4>
                                <span className="text-[1.5rem] font-[900] text-[var(--color-text)]">{metrics.drills.total}</span>
                            </div>
                        </div>
                        
                        <div className="card hover-lift p-[1.2rem] flex gap-[1rem] items-center">
                            <div className="w-[48px] h-[48px] rounded-[12px] bg-[rgba(99,_102,_241,_0.1)] text-[#6366f1] flex items-center justify-center">
                                <Building size={24} />
                            </div>
                            <div>
                                <h4 className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[600] uppercase">Auditorías</h4>
                                <span className="text-[1.5rem] font-[900] text-[var(--color-text)]">{metrics.audits.total}</span>
                            </div>
                        </div>

                        <div className="card hover-lift p-[1.2rem] flex gap-[1rem] items-center">
                            <div className="w-[48px] h-[48px] rounded-[12px] bg-[rgba(249,_115,_22,_0.1)] text-[#f97316] flex items-center justify-center">
                                <Flame size={24} />
                            </div>
                            <div>
                                <h4 className="m-[0] text-[0.85rem] text-[var(--color-text-muted)] font-[600] uppercase">Carga de Fuego</h4>
                                <span className="text-[1.5rem] font-[900] text-[var(--color-text)]">{metrics.fireload.total}</span>
                            </div>
                        </div>

                    </div>
                </div>
      }

            <div className="mt-[3rem]">
                <AdBanner />
            </div>
        </div>);

}