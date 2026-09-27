import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardHat, Plus, Search, Building, Calendar, Users, FileText,
  Download, Trash2, CheckCircle2, Clock, AlertCircle, MapPin,
  FileSpreadsheet, Eye, X, ShieldCheck, Printer, AlertTriangle
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import { ConstructionProgramData } from '../data/constructionSafetyData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function ConstructionSafetyProgram(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const [programs, setPrograms] = useState<ConstructionProgramData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewProgram, setViewProgram] = useState<ConstructionProgramData | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const raw = localStorage.getItem('construction_safety_programs_db');
    if (raw) {
      try {
        setPrograms(JSON.parse(raw));
      } catch (e) {
        console.error('Error loading construction programs', e);
      }
    }
  }, []);

  // Métricas para las 4 KPI cards estilo Aptitudes Médicas
  const metrics = useMemo(() => {
    const total = programs.length;
    const approved = programs.filter(p => p.status === 'approved_by_art').length;
    const submitted = programs.filter(p => p.status === 'submitted_to_art').length;
    const draft = programs.filter(p => p.status === 'draft').length;

    return { total, approved, submitted, draft };
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      if (activeCompany && p.companyId && p.companyId !== activeCompany.id) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          p.programNumber.toLowerCase().includes(q) ||
          p.contractorName.toLowerCase().includes(q) ||
          p.siteAddress.toLowerCase().includes(q) ||
          p.comitenteName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [programs, activeCompany, filterStatus, searchTerm]);

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = programs.filter(p => p.id !== deleteId);
    setPrograms(updated);
    localStorage.setItem('construction_safety_programs_db', JSON.stringify(updated));
    setDeleteId(null);
    toast.success('Programa de seguridad eliminado');
  };

  // Exportar CSV
  const exportToCsv = () => {
    if (programs.length === 0) {
      toast.error('No hay programas de seguridad para exportar.');
      return;
    }
    const headers = [
      'Nro Programa',
      'Contratista',
      'CUIT Contratista',
      'ART',
      'Comitente',
      'Direccion Obra',
      'Ciudad',
      'Provincia',
      'Tipo de Obra',
      'Superficie (m2)',
      'Personal Pico',
      'Fecha Inicio',
      'Duracion (Meses)',
      'Profesional HyS',
      'Matricula HyS',
      'Clinica ART',
      'Estado',
      'Fecha Confeccion'
    ];

    const rows = programs.map(p => [
      `"${p.programNumber}"`,
      `"${p.contractorName}"`,
      `"${p.contractorCuit}"`,
      `"${p.artName || ''}"`,
      `"${p.comitenteName}"`,
      `"${p.siteAddress}"`,
      `"${p.city}"`,
      `"${p.province}"`,
      `"${p.workType}"`,
      p.siteSurfaceM2,
      p.estimatedWorkers,
      `"${p.startDate}"`,
      p.estimatedDurationMonths,
      `"${p.hygieneService.professionalName}"`,
      `"${p.hygieneService.enrollmentNumber}"`,
      `"${p.hygieneService.emergencyClinic}"`,
      `"${p.status}"`,
      `"${p.createdAt}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Programas_Seguridad_Obra_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV de Programas de Seguridad exportado con éxito');
  };

  const exportPDF = (prog: ConstructionProgramData, downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF();
      
      // Portada / Encabezado
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PROGRAMA DE SEGURIDAD PARA CONSTRUCCIÓN', 14, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Presentación ante ART conforme a Decretos 911/96, 351/79 y Resoluciones SRT 51/97, 35/98 y 319/99', 14, 22);

      // Metadatos
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`N° Expediente / Programa: ${prog.programNumber}`, 14, 40);
      doc.text(`Fecha de Confección: ${new Date(prog.createdAt).toLocaleDateString()}`, 130, 40);

      autoTable(doc, {
        startY: 45,
        theme: 'grid',
        head: [['1. Datos Generales de la Obra y Sujetos Intervinientes', 'Información']],
        body: [
          ['Empresa Constructora / Contratista', `${prog.contractorName} (CUIT: ${prog.contractorCuit})`],
          ['Aseguradora de Riesgos del Trabajo (ART)', prog.artName || 'A designar'],
          ['Comitente / Propietario', prog.comitenteName],
          ['Ubicación de la Obra', `${prog.siteAddress}, ${prog.city}, ${prog.province}`],
          ['Tipo de Obra', prog.workType.toUpperCase()],
          ['Superficie Cubierta Estimada', `${prog.siteSurfaceM2} m²`],
          ['Personal Estimado en Pico de Obra', `${prog.estimatedWorkers} trabajadores`],
          ['Fecha Inicio y Plazo Estimado', `${prog.startDate} (${prog.estimatedDurationMonths} meses)`]
        ],
        styles: { fontSize: 8 }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 8;

      // Causales de Aviso de Obra
      const reasonsList = [];
      if (prog.reasons.excavationDeep) reasonsList.push('Excavación a profundidad mayor a 1.20 metros');
      if (prog.reasons.heightWork) reasonsList.push('Trabajos en altura superiores a 4.00 metros');
      if (prog.reasons.demolition) reasonsList.push('Tareas de demolición previa');
      if (prog.reasons.largeSurface) reasonsList.push('Superficie de obra mayor a 1.000 m²');
      if (prog.reasons.highVoltage) reasonsList.push('Proximidad a líneas o instalaciones de media/alta tensión');
      if (prog.reasons.confinedSpacesOrTunnels) reasonsList.push('Túneles, galerías o espacios confinados');

      autoTable(doc, {
        startY: currentY,
        theme: 'plain',
        head: [['2. Causales de Exigibilidad de Programa de Seguridad (Res. SRT 51/97)']],
        body: reasonsList.length > 0 ? reasonsList.map(r => [`• ${r}`]) : [['• Obra civil comprendida bajo Decreto 911/96']],
        styles: { fontSize: 8 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // Servicio de Higiene y Seguridad
      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        head: [['3. Servicio de Higiene y Seguridad Laboral en Obra (Dec. 911/96 Art. 16)', 'Detalle']],
        body: [
          ['Profesional Responsable Asignado', prog.hygieneService.professionalName],
          ['Matrícula Profesional / Registro', prog.hygieneService.enrollmentNumber],
          ['Horas Profesionales Asignadas Semanales', `${prog.hygieneService.weeklyVisitHours} horas/semana`],
          ['Centro Médico de Emergencias ART', prog.hygieneService.emergencyClinic],
          ['Teléfono de Urgencias', prog.hygieneService.emergencyPhone]
        ],
        styles: { fontSize: 8 }
      });

      // Nueva página para las etapas
      doc.addPage();
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Análisis de Riesgos y Medidas Preventivas por Etapas Constructivas', 14, 16);

      const stageRows: any[] = [];
      prog.stages.filter(s => s.included).forEach(st => {
        stageRows.push([
          st.name,
          st.risks.join('\n• '),
          st.preventiveMeasures.join('\n• '),
          st.applicableStandards
        ]);
      });

      autoTable(doc, {
        startY: 22,
        theme: 'grid',
        head: [['Etapa Constructiva', 'Riesgos Identificados', 'Medidas Preventivas Obligatorias', 'Marco Legal']],
        body: stageRows,
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 45 },
          2: { cellWidth: 70 },
          3: { cellWidth: 25 }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
      if (currentY > 250) {
        doc.addPage();
        currentY = 30;
      }

      // Firmas formales
      doc.setFontSize(8);
      doc.text('____________________________________', 20, currentY);
      doc.text('Firma Responsable Higiene y Seguridad', 20, currentY + 5);
      doc.text(`Mat.: ${prog.hygieneService.enrollmentNumber}`, 20, currentY + 9);

      doc.text('____________________________________', 85, currentY);
      doc.text('Firma Dirección de Obra / Constructor', 85, currentY + 5);
      doc.text(prog.contractorName, 85, currentY + 9);

      doc.text('____________________________________', 150, currentY);
      doc.text('Recepción y Aprobación ART', 150, currentY + 5);
      doc.text(prog.artName || 'Sello Oficial ART', 150, currentY + 9);

      // Pie de página legal
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, 285, 196, 285);
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Documento reglamentario según Decreto 911/96 y Resoluciones SRT 51/97, 35/98 y 319/99.', 14, 289);
      doc.text('Pág. 1 de 2', 196, 289, { align: 'right' });

      const fileName = `Programa_Seguridad_Obra_${prog.programNumber}.pdf`;

      if (downloadOnly) {
        doc.save(fileName);
        toast.success('Programa de Seguridad descargado en PDF');
      } else {
        doc.autoPrint();
        const blob = doc.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch {
              window.open(blobUrl, '_blank');
            }
            setTimeout(() => {
              try {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(blobUrl);
              } catch {}
            }, 60000);
          }, 300);
        };
        toast.success('Abriendo diálogo de impresión...');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al generar PDF del programa');
    }
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Programas de Seguridad para Construcción"
          subtitle="Confección y presentación formal ante la ART conforme a Dec. 911/96 y Res. SRT 51/97, 35/98 y 319/99"
          badge="Dec. 911/96 & Res. 51/97"
          icon={<HardHat size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)"
          onBack={() => navigate('/')}
        />

        {/* 4 Tarjetas KPI interactivas estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setFilterStatus('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Programas</span>
              <HardHat size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Planes de obra</span>
          </div>

          <div
            onClick={() => setFilterStatus('approved_by_art')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'approved_by_art'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Aprobados por ART</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.approved}</div>
            <span className="text-[11px] text-slate-500">Validados oficialmente</span>
          </div>

          <div
            onClick={() => setFilterStatus('submitted_to_art')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'submitted_to_art'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Presentados</span>
              <Clock size={20} />
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{metrics.submitted}</div>
            <span className="text-[11px] text-slate-500">En revisión ART</span>
          </div>

          <div
            onClick={() => setFilterStatus('draft')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'draft'
                ? 'bg-slate-100 dark:bg-slate-750 border-slate-400 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Borradores</span>
              <AlertCircle size={20} />
            </div>
            <div className="text-2xl font-black text-slate-700 dark:text-slate-300">{metrics.draft}</div>
            <span className="text-[11px] text-slate-500">En confección</span>
          </div>
        </div>

        {/* Toolbar de Búsqueda y Botones estilo Aptitudes Médicas */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-row items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs h-[38px]">
              <Search
                size={16}
                className="text-slate-400 pointer-events-none z-10"
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: 0,
                  bottom: 0,
                  marginTop: 'auto',
                  marginBottom: 'auto',
                  display: 'block'
                }}
              />
              <input
                type="text"
                placeholder="Buscar por N°, constructor, obra o comitente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Exportar CSV */}
              <button
                type="button"
                onClick={exportToCsv}
                title="Exportar listado de programas de seguridad a CSV"
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  height: '34px',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                  minHeight: 'unset'
                }}
              >
                <FileSpreadsheet size={14} />
                <span>Exportar CSV</span>
              </button>

              {/* Botón Confeccionar Programa */}
              <button
                type="button"
                onClick={() => navigate('/construction-safety-program/new')}
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  height: '34px',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                  minHeight: 'unset'
                }}
              >
                <Plus size={14} />
                <span>Nuevo Programa de Obra</span>
              </button>
            </div>
          </div>

          {/* Pastillas de filtro estilo Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                backgroundColor: filterStatus === 'all' ? '#d97706' : '#ffffff',
                color: filterStatus === 'all' ? '#ffffff' : '#334155',
                border: filterStatus === 'all' ? 'none' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                minHeight: 'unset'
              }}
            >
              <span>Todos ({programs.length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('approved_by_art')}
              style={{
                backgroundColor: filterStatus === 'approved_by_art' ? '#059669' : '#ffffff',
                color: filterStatus === 'approved_by_art' ? '#ffffff' : '#334155',
                border: filterStatus === 'approved_by_art' ? 'none' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                minHeight: 'unset'
              }}
            >
              <span>Aprobados ART ({metrics.approved})</span>
            </button>

            <button
              onClick={() => setFilterStatus('submitted_to_art')}
              style={{
                backgroundColor: filterStatus === 'submitted_to_art' ? '#2563eb' : '#ffffff',
                color: filterStatus === 'submitted_to_art' ? '#ffffff' : '#334155',
                border: filterStatus === 'submitted_to_art' ? 'none' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                minHeight: 'unset'
              }}
            >
              <span>Presentados ({metrics.submitted})</span>
            </button>

            <button
              onClick={() => setFilterStatus('draft')}
              style={{
                backgroundColor: filterStatus === 'draft' ? '#475569' : '#ffffff',
                color: filterStatus === 'draft' ? '#ffffff' : '#334155',
                border: filterStatus === 'draft' ? 'none' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                minHeight: 'unset'
              }}
            >
              <span>Borradores ({metrics.draft})</span>
            </button>
          </div>
        </div>

        {/* Listado de Programas */}
        {filteredPrograms.length === 0 ? (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
            <EmptyStateIllustrated
              title="No hay programas de seguridad de obra registrados"
              description="Inicia el asistente para confeccionar el Programa de Seguridad reglamentario con matriz de riesgos por etapas constructivas y horas profesionales de HyS."
              actionLabel="Confeccionar Programa"
              onAction={() => navigate('/construction-safety-program/new')}
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPrograms.map(prog => (
              <div
                key={prog.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                        <HardHat size={20} />
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {prog.programNumber}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {prog.contractorName}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      prog.status === 'approved_by_art'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : prog.status === 'submitted_to_art'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {prog.status === 'approved_by_art' ? 'Aprobado ART' : prog.status === 'submitted_to_art' ? 'Presentado' : 'Borrador'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{prog.siteAddress} ({prog.city})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building size={14} className="text-slate-400 shrink-0" />
                      <span>Comitente: {prog.comitenteName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <span>Inicio: {prog.startDate} ({prog.estimatedDurationMonths} meses)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400 shrink-0" />
                      <span>{prog.estimatedWorkers} trabajadores | Sup: {prog.siteSurfaceM2} m²</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Etapas activas:
                    </span>{' '}
                    <span className="text-slate-500">
                      {prog.stages.filter(s => s.included).length} de {prog.stages.length} incluidas
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                  {/* Botón Imprimir PDF */}
                  <button
                    type="button"
                    onClick={() => exportPDF(prog, false)}
                    title="Imprimir Programa Oficial a PDF"
                    style={{
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      minHeight: 'unset'
                    }}
                  >
                    <FileText size={12} />
                    <span>PDF</span>
                  </button>

                  {/* Botón Ver Detalle */}
                  <button
                    type="button"
                    onClick={() => setViewProgram(prog)}
                    title="Ver Detalle Completo del Programa"
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      minHeight: 'unset'
                    }}
                  >
                    <Eye size={12} />
                    <span>Ver</span>
                  </button>

                  {/* Botón Eliminar */}
                  <button
                    type="button"
                    onClick={() => setDeleteId(prog.id)}
                    title="Eliminar Programa"
                    style={{
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      minHeight: 'unset'
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL VER DETALLE COMPLETO DEL PROGRAMA */}
        {viewProgram && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <HardHat className="text-amber-500" size={22} />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    Programa: {viewProgram.programNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewProgram(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-750 rounded-xl">
                  <div><strong>Contratista:</strong> {viewProgram.contractorName}</div>
                  <div><strong>CUIT:</strong> {viewProgram.contractorCuit}</div>
                  <div><strong>ART:</strong> {viewProgram.artName || 'A designar'}</div>
                  <div><strong>Comitente:</strong> {viewProgram.comitenteName}</div>
                  <div><strong>Ubicación:</strong> {viewProgram.siteAddress}, {viewProgram.city}</div>
                  <div><strong>Tipo de Obra:</strong> {viewProgram.workType}</div>
                  <div><strong>Superficie:</strong> {viewProgram.siteSurfaceM2} m²</div>
                  <div><strong>Personal Estimado:</strong> {viewProgram.estimatedWorkers} operarios</div>
                  <div><strong>Inicio:</strong> {viewProgram.startDate}</div>
                  <div><strong>Plazo:</strong> {viewProgram.estimatedDurationMonths} meses</div>
                  <div><strong>Estado:</strong> {viewProgram.status.toUpperCase()}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Servicio de Higiene y Seguridad:</h4>
                  <div><strong>Profesional:</strong> {viewProgram.hygieneService.professionalName}</div>
                  <div><strong>Matrícula:</strong> {viewProgram.hygieneService.enrollmentNumber}</div>
                  <div><strong>Horas Asignadas:</strong> {viewProgram.hygieneService.weeklyVisitHours} hs/semana</div>
                  <div><strong>Clínica ART de Urgencia:</strong> {viewProgram.hygieneService.emergencyClinic} ({viewProgram.hygieneService.emergencyPhone})</div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Etapas Constructivas Incluidas ({viewProgram.stages.filter(s => s.included).length}):</h4>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {viewProgram.stages.filter(s => s.included).map((st, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-750 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs mb-1">{st.name}</div>
                        <div className="text-[11px] text-slate-500 mb-1"><strong>Normativa:</strong> {st.applicableStandards}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300"><strong>Riesgos:</strong> {st.risks.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => exportPDF(viewProgram, false)}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText size={14} />
                  <span>Imprimir PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewProgram(null)}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={!!deleteId}
          title="Eliminar Programa de Seguridad"
          message="¿Estás seguro de que deseas eliminar este programa de seguridad de obra? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
      </div>
    </AnimatedPage>
  );
}
