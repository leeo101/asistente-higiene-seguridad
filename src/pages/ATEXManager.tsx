import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Plus, Search, Calendar, FileText, Download,
  Trash2, AlertTriangle, CheckCircle2, ShieldAlert, Cpu, Activity,
  FileSpreadsheet, Eye, X, ShieldCheck, Layers
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import { ATEXZoneAssessment, ATEX_ZONES_GUIDE } from '../data/atexData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function ATEXManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const [assessments, setAssessments] = useState<ATEXZoneAssessment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewAssessment, setViewAssessment] = useState<ATEXZoneAssessment | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const raw = localStorage.getItem('atex_assessments_db');
    if (raw) {
      try {
        setAssessments(JSON.parse(raw));
      } catch (e) {
        console.error('Error loading ATEX assessments', e);
      }
    }
  }, []);

  // Métricas para las 4 KPI cards superiores estilo Aptitudes Médicas
  const metrics = useMemo(() => {
    const total = assessments.length;
    const gasZones = assessments.filter(a => ['0', '1', '2'].includes(String(a.assignedZone))).length;
    const dustZones = assessments.filter(a => ['20', '21', '22'].includes(String(a.assignedZone))).length;
    const totalExEquip = assessments.reduce((acc, a) => acc + (a.equipmentList?.length || 0), 0);

    return { total, gasZones, dustZones, totalExEquip };
  }, [assessments]);

  const filtered = useMemo(() => {
    return assessments.filter(a => {
      if (activeCompany && a.companyId && a.companyId !== activeCompany.id) return false;
      if (filterZone === 'gas') {
        if (!['0', '1', '2'].includes(String(a.assignedZone))) return false;
      } else if (filterZone === 'dust') {
        if (!['20', '21', '22'].includes(String(a.assignedZone))) return false;
      } else if (filterZone !== 'all') {
        if (String(a.assignedZone) !== filterZone) return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          a.assessmentNumber.toLowerCase().includes(q) ||
          a.areaName.toLowerCase().includes(q) ||
          a.substanceName.toLowerCase().includes(q) ||
          a.auditorName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assessments, activeCompany, filterZone, searchTerm]);

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = assessments.filter(a => a.id !== deleteId);
    setAssessments(updated);
    localStorage.setItem('atex_assessments_db', JSON.stringify(updated));
    setDeleteId(null);
    toast.success('Clasificación ATEX eliminada');
  };

  const exportToCsv = () => {
    if (assessments.length === 0) {
      toast.error('No hay evaluaciones ATEX registradas para exportar.');
      return;
    }

    const headers = [
      'Nro Evaluacion',
      'Fecha',
      'Sector / Instalacion',
      'Sustancia Inflamable',
      'Tipo Sustancia',
      'Punto Inflamacion (C)',
      'LEL (%)',
      'Zona Asignada',
      'Tipo Ventilacion',
      'Grado Ventilacion',
      'Auditor HyS',
      'Matricula Auditor',
      'Equipos Ex Cantidad'
    ];

    const rows = assessments.map(a => [
      `"${a.assessmentNumber || ''}"`,
      `"${a.date || ''}"`,
      `"${(a.areaName || '').replace(/"/g, '""')}"`,
      `"${(a.substanceName || '').replace(/"/g, '""')}"`,
      `"${a.substanceType || ''}"`,
      a.flashPointC ?? '',
      a.lelPercent ?? '',
      `"ZONA ${a.assignedZone}"`,
      `"${a.ventilationType || ''}"`,
      `"${a.ventilationDegree || ''}"`,
      `"${(a.auditorName || '').replace(/"/g, '""')}"`,
      `"${a.auditorEnrollment || ''}"`,
      a.equipmentList?.length || 0
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Clasificaciones_ATEX_IEC60079_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Padrón de clasificaciones ATEX exportado en CSV.');
  };

  const exportPDF = (item: ATEXZoneAssessment, downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(217, 119, 6);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTUDIO DE CLASIFICACIÓN DE ÁREAS PELIGROSAS (ATEX)', 14, 12);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Conforme a Normas IEC 60079-10-1/2, NFPA 70 y Decreto 351/79 Cap. 18', 14, 19);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Informe N°: ${item.assessmentNumber}`, 14, 34);
      doc.text(`Fecha: ${item.date}`, 145, 34);

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Parámetros de la Clasificación de Área', 'Detalle']],
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: [
          ['Establecimiento', activeCompany ? `${activeCompany.name} (CUIT: ${activeCompany.cuit})` : item.facilityName],
          ['Sector / Instalación Evaluada', item.areaName],
          ['Sustancia Inflamable / Combustible', `${item.substanceName} (${item.substanceType.toUpperCase()})`],
          ['Punto de Inflamación / LEL', `Flash point: ${item.flashPointC ?? 'N/D'} °C | LEL: ${item.lelPercent ?? 'N/D'} %`],
          ['Zona Asignada Reglamentaria', `ZONA ${item.assignedZone} (${(ATEX_ZONES_GUIDE as any)[item.assignedZone]?.label || 'Sin clasificar'})`],
          ['Tipo y Grado de Ventilación', `${item.ventilationType.toUpperCase()} (Grado: ${item.ventilationDegree.toUpperCase()})`],
          ['Especialista HyS Auditor', `${item.auditorName} (Mat. ${item.auditorEnrollment})`]
        ],
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 112 }
        }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 6;

      // Medidas de Control
      autoTable(doc, {
        startY: currentY,
        theme: 'striped',
        head: [['Medidas de Control de Ignición y Prevención Electrostática', 'Estado']],
        headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: [
          ['Puesta a tierra disipativa y vinculación equipotencial', item.safetyControls.groundingBonding ? 'INSTALADO Y CONFORME' : 'NO CUMPLE'],
          ['Sistema de detección fija de gas / explosímetro', item.safetyControls.gasDetectionSystem ? 'INSTALADO' : 'NO DISPONE'],
          ['Herramientas antichispa de bronce/berilio obligatorias', item.safetyControls.nonSparkingTools ? 'EXIGIDO' : 'NO'],
          ['Calzado de seguridad antiestático obligatorio', item.safetyControls.antistaticFootwearRequired ? 'EXIGIDO' : 'NO'],
          ['Permiso de trabajo en caliente obligatorio para toda tarea', item.safetyControls.hotWorkPermitMandatory ? 'OBLIGATORIO' : 'NO']
        ],
        styles: { fontSize: 7.5, cellPadding: 2 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;

      // Equipos Ex
      if (item.equipmentList && item.equipmentList.length > 0) {
        autoTable(doc, {
          startY: currentY,
          theme: 'grid',
          head: [['Tag', 'Equipo', 'Marcado Ex', 'Modo Protección', 'Grupo', 'Clase Temp', 'Certificado', 'Apto']],
          headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
          body: item.equipmentList.map(eq => [
            eq.tag,
            eq.description,
            eq.exMarking,
            eq.protectionMode,
            eq.gasGroup,
            eq.tempClass,
            eq.certificateNumber,
            eq.complianceStatus === 'compliant' ? 'APTO' : 'NO APTO'
          ]),
          styles: { fontSize: 7, cellPadding: 1.8 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 14;
      } else {
        currentY += 12;
      }

      doc.setFontSize(7.5);
      doc.text('________________________________________', 25, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text('Firma Especialista en Áreas Clasificadas', 25, currentY + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(item.auditorName || 'Especialista HyS', 25, currentY + 8);

      doc.text('________________________________________', 125, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text('Firma Responsable Higiene y Seguridad', 125, currentY + 4);
      doc.setFont('helvetica', 'normal');
      doc.text('Servicio de Seguridad y Medio Ambiente', 125, currentY + 8);

      // Pie de página legal
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, 285, 196, 285);
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Documento oficial según normas IEC 60079 y Dec. 351/79 Cap. 18. Validez legal ante inspecciones de ART y SRT.', 14, 289);
      doc.text('Pág. 1 de 1', 196, 289, { align: 'right' });

      const fileName = `Clasificacion_ATEX_${item.assessmentNumber}.pdf`;

      if (downloadOnly) {
        doc.save(fileName);
        toast.success('Informe ATEX descargado en PDF');
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
      toast.error('Error al generar PDF');
    }
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Atmósferas Explosivas (ATEX)"
          subtitle="Zonificación de riesgo por gases, vapores y polvos combustibles bajo IEC 60079 y Dec. 351/79"
          badge="IEC 60079 & Dec. 351/79"
          icon={<Zap size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)"
          onBack={() => navigate('/')}
        />

        {/* 4 Tarjetas KPI interactivas estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setFilterZone('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterZone === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Clasificaciones</span>
              <Layers size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Estudios registrados</span>
          </div>

          <div
            onClick={() => setFilterZone('gas')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterZone === 'gas'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Zonas de Gases</span>
              <AlertTriangle size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.gasZones}</div>
            <span className="text-[11px] text-slate-500">Zonas 0, 1 y 2 (Gases)</span>
          </div>

          <div
            onClick={() => setFilterZone('dust')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterZone === 'dust'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Zonas de Polvo</span>
              <Activity size={20} />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{metrics.dustZones}</div>
            <span className="text-[11px] text-slate-500">Zonas 20, 21 y 22 (Polvos)</span>
          </div>

          <div
            className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80"
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Equipos Ex Auditados</span>
              <Cpu size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.totalExEquip}</div>
            <span className="text-[11px] text-slate-500">Dispositivos certificados</span>
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
                placeholder="Buscar por N°, sector, sustancia..."
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
                title="Exportar listado de estudios ATEX en formato CSV"
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

              {/* Botón Nueva Evaluación ATEX */}
              <button
                type="button"
                onClick={() => navigate('/atex/new')}
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
                <span>Nueva Evaluación ATEX</span>
              </button>
            </div>
          </div>

          {/* Filter Pills estilo Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterZone('all')}
              style={{
                backgroundColor: filterZone === 'all' ? '#2563eb' : '#ffffff',
                color: filterZone === 'all' ? '#ffffff' : '#334155',
                border: filterZone === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Todas las Zonas ({metrics.total})
            </button>
            <button
              onClick={() => setFilterZone('gas')}
              style={{
                backgroundColor: filterZone === 'gas' ? '#d97706' : '#ffffff',
                color: filterZone === 'gas' ? '#ffffff' : '#334155',
                border: filterZone === 'gas' ? '1px solid #d97706' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Gases: Zonas 0, 1 y 2 ({metrics.gasZones})
            </button>
            <button
              onClick={() => setFilterZone('dust')}
              style={{
                backgroundColor: filterZone === 'dust' ? '#4f46e5' : '#ffffff',
                color: filterZone === 'dust' ? '#ffffff' : '#334155',
                border: filterZone === 'dust' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Polvos: Zonas 20, 21 y 22 ({metrics.dustZones})
            </button>
            <button
              onClick={() => setFilterZone('0')}
              style={{
                backgroundColor: filterZone === '0' ? '#dc2626' : '#ffffff',
                color: filterZone === '0' ? '#ffffff' : '#334155',
                border: filterZone === '0' ? '1px solid #dc2626' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Zona 0 (Continuo)
            </button>
            <button
              onClick={() => setFilterZone('1')}
              style={{
                backgroundColor: filterZone === '1' ? '#ea580c' : '#ffffff',
                color: filterZone === '1' ? '#ffffff' : '#334155',
                border: filterZone === '1' ? '1px solid #ea580c' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Zona 1 (Normal)
            </button>
            <button
              onClick={() => setFilterZone('2')}
              style={{
                backgroundColor: filterZone === '2' ? '#059669' : '#ffffff',
                color: filterZone === '2' ? '#ffffff' : '#334155',
                border: filterZone === '2' ? '1px solid #059669' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Zona 2 (Ocasional)
            </button>
          </div>

          {/* Listado de Evaluaciones */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
              <EmptyStateIllustrated
                title="No hay estudios de áreas clasificadas ATEX"
                description="Registra una nueva evaluación de zonificación (Zonas 0, 1, 2 o 20, 21, 22) e inventario de equipos eléctricos con protección Ex bajo norma IEC 60079."
                actionLabel="Nueva Evaluación ATEX"
                onAction={() => navigate('/atex/new')}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                          <Zap size={22} />
                        </span>
                        <div>
                          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm m-0">
                            {item.areaName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono m-0 mt-0.5">
                            {item.assessmentNumber}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-mono">
                        ZONA {item.assignedZone}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={14} className="text-slate-400 shrink-0" />
                        <span>Sustancia: <strong className="text-slate-800 dark:text-slate-100">{item.substanceName}</strong> ({item.substanceType})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-slate-400 shrink-0" />
                        <span>Ventilación: {item.ventilationType} ({item.ventilationDegree})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-slate-400 shrink-0" />
                        <span>Equipos Ex auditados: <strong className="text-slate-800 dark:text-slate-100">{item.equipmentList?.length || 0} dispositivos</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones con Botones Sólidos estilo Aptitudes Médicas */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end items-center gap-2 flex-wrap">
                    {/* Botón PDF */}
                    <button
                      type="button"
                      onClick={() => exportPDF(item, false)}
                      title="Imprimir / Exportar Ficha Oficial a PDF"
                      style={{
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        minHeight: 'unset',
                        boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                      }}
                    >
                      <FileText size={12} /> PDF
                    </button>

                    {/* Botón Ver */}
                    <button
                      type="button"
                      onClick={() => setViewAssessment(item)}
                      title="Ver Detalles de la Clasificación ATEX"
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        minHeight: 'unset',
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                      }}
                    >
                      <Eye size={12} /> Ver
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      title="Eliminar Estudio"
                      style={{
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        minHeight: 'unset',
                        boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                      }}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Detalle / Ver Estudio ATEX */}
        {viewAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Zap size={22} />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 m-0">
                      Estudio ATEX: {viewAssessment.areaName}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {viewAssessment.assessmentNumber} • Fecha: {viewAssessment.date}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewAssessment(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Zona Asignada</span>
                  <span className="text-sm font-black text-amber-600">
                    ZONA {viewAssessment.assignedZone}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sustancia</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {viewAssessment.substanceName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Punto Inflamación</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {viewAssessment.flashPointC ?? 'N/D'} °C
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Ventilación</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {viewAssessment.ventilationType} ({viewAssessment.ventilationDegree})
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Especialista HyS</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {viewAssessment.auditorName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Equipos Ex</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {viewAssessment.equipmentList?.length || 0} equipos
                  </span>
                </div>
              </div>

              {/* Medidas de Control */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  Medidas de Control de Ignición y Prevención
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${viewAssessment.safetyControls?.groundingBonding ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>Puesta a tierra disipativa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${viewAssessment.safetyControls?.gasDetectionSystem ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>Detección fija de gas / explosímetro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${viewAssessment.safetyControls?.nonSparkingTools ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>Herramientas antichispa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${viewAssessment.safetyControls?.antistaticFootwearRequired ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>Calzado antiestático</span>
                  </div>
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => exportPDF(viewAssessment, false)}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '800',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: 'unset',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <FileText size={14} /> Imprimir PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewAssessment(null)}
                  style={{
                    backgroundColor: '#475569',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '800',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    minHeight: 'unset'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="Eliminar Estudio ATEX"
          message="¿Estás seguro de que deseas eliminar esta evaluación de área clasificada? Esta acción no se puede deshacer."
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          type="danger"
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
      </div>
    </AnimatedPage>
  );
}
