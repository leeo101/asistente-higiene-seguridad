import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, Plus, Search, CheckCircle2, AlertTriangle, Clock,
  Calendar, User, Trash2, Eye, Download, ShieldCheck, Share2, ShieldAlert,
  FileSpreadsheet, FileText, X, Printer
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import { HotWorkPermitData, HOT_WORK_ACTIVITIES } from '../data/hotWorkData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function HotWorkPermit(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const [permits, setPermits] = useState<HotWorkPermitData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewPermit, setViewPermit] = useState<HotWorkPermitData | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const raw = localStorage.getItem('hot_work_permits_db');
    if (raw) {
      try {
        setPermits(JSON.parse(raw));
      } catch (e) {
        console.error('Error loading hot work permits', e);
      }
    }
  }, []);

  // Métricas para las 4 KPI cards estilo Aptitudes Médicas
  const metrics = useMemo(() => {
    const total = permits.length;
    const active = permits.filter(p => p.status === 'active').length;
    const gasRequired = permits.filter(p => p.gasMeasurement?.required).length;
    const completed = permits.filter(p => p.status === 'completed').length;

    return { total, active, gasRequired, completed };
  }, [permits]);

  const filteredPermits = useMemo(() => {
    return permits.filter(p => {
      if (activeCompany && p.companyId && p.companyId !== activeCompany.id) {
        return false;
      }
      if (filterStatus === 'gas') {
        if (!p.gasMeasurement?.required) return false;
      } else if (filterStatus !== 'all') {
        if (p.status !== filterStatus) return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          p.permitNumber.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.operatorName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [permits, activeCompany, filterStatus, searchTerm]);

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = permits.filter(p => p.id !== deleteId);
    setPermits(updated);
    localStorage.setItem('hot_work_permits_db', JSON.stringify(updated));
    setDeleteId(null);
    toast.success('Permiso de trabajo en caliente eliminado');
  };

  // Exportar CSV
  const exportToCsv = () => {
    if (permits.length === 0) {
      toast.error('No hay permisos en caliente para exportar.');
      return;
    }
    const headers = [
      'Nro Permiso',
      'Fecha',
      'Hora Inicio',
      'Hora Fin',
      'Ubicacion',
      'Area',
      'Tipo Actividad',
      'Operador',
      'CUIL Operador',
      'Supervisor',
      'Vigia Fuego',
      'Control Post (min)',
      'Medicion Gas Requerida',
      'LEL %',
      'Oxigeno %',
      'Estado'
    ];

    const rows = permits.map(p => {
      const act = HOT_WORK_ACTIVITIES.find(a => a.id === p.activityType)?.name || p.activityType;
      return [
        `"${p.permitNumber}"`,
        `"${p.date}"`,
        `"${p.startTime}"`,
        `"${p.endTime}"`,
        `"${p.location}"`,
        `"${p.area}"`,
        `"${act}"`,
        `"${p.operatorName}"`,
        `"${p.operatorCuil || ''}"`,
        `"${p.supervisorName}"`,
        `"${p.fireWatchName}"`,
        p.fireWatchPostCheckTime,
        p.gasMeasurement?.required ? 'SI' : 'NO',
        p.gasMeasurement?.required ? p.gasMeasurement.lelPercent : 'N/A',
        p.gasMeasurement?.required ? p.gasMeasurement.oxygenPercent : 'N/A',
        `"${p.status}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Permisos_Trabajo_Caliente_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV de Permisos en Caliente exportado con éxito');
  };

  const exportPDF = (permit: HotWorkPermitData, downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, 210, 24, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PERMISO DE TRABAJO EN CALIENTE (HOT WORK PERMIT)', 14, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Conforme a Norma NFPA 51B, OSHA 1910.252 y Dec. 351/79', 14, 18);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`N° Permiso: ${permit.permitNumber}`, 14, 32);
      doc.text(`Fecha: ${permit.date} | Horario: ${permit.startTime} a ${permit.endTime}`, 120, 32);
      
      const act = HOT_WORK_ACTIVITIES.find(a => a.id === permit.activityType)?.name || permit.activityType;

      autoTable(doc, {
        startY: 36,
        theme: 'grid',
        head: [['Datos Generales y Operativos', 'Detalle']],
        body: [
          ['Empresa / Establecimiento', activeCompany ? `${activeCompany.name} (CUIT: ${activeCompany.cuit})` : 'Establecimiento Principal'],
          ['Ubicación y Sector', `${permit.location} - ${permit.area}`],
          ['Tipo de Tarea', act],
          ['Descripción del Trabajo', permit.description],
          ['Operador / Soldador', `${permit.operatorName} ${permit.operatorCuil ? `(CUIL: ${permit.operatorCuil})` : ''}`],
          ['Supervisor a Cargo', permit.supervisorName],
          ['Vigía de Fuego (Fire Watch)', `${permit.fireWatchName} (Control post-trabajo: ${permit.fireWatchPostCheckTime} min)`],
          ['Estado del Permiso', permit.status.toUpperCase()]
        ],
        styles: { fontSize: 8 }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 6;

      // Atmósfera
      if (permit.gasMeasurement?.required) {
        autoTable(doc, {
          startY: currentY,
          theme: 'grid',
          head: [['Control de Atmósfera / Explosímetro', 'Valor Medido', 'Límite Admisible', 'Estado']],
          body: [
            ['LEL % (Límite Explosividad)', `${permit.gasMeasurement.lelPercent}%`, '< 10% LEL', permit.gasMeasurement.lelPercent < 10 ? 'SEGURO' : 'PELIGRO EXTREMO'],
            ['Oxígeno O2 %', `${permit.gasMeasurement.oxygenPercent}%`, '19.5% - 23.5%', permit.gasMeasurement.oxygenPercent >= 19.5 && permit.gasMeasurement.oxygenPercent <= 23.5 ? 'SEGURO' : 'DEFICIT/ENRIQUECIDO'],
            ['Monóxido de Carbono (CO)', `${permit.gasMeasurement.coPpm} ppm`, '< 25 ppm', permit.gasMeasurement.coPpm < 25 ? 'NORMAL' : 'ALTO'],
            ['Sulfhídrico (H2S)', `${permit.gasMeasurement.h2sPpm} ppm`, '< 10 ppm', permit.gasMeasurement.h2sPpm < 10 ? 'NORMAL' : 'ALTO']
          ],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [220, 38, 38] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 6;
      }

      // Checklist NFPA 51B
      const checkRows = [
        ['Radio de 11 metros (35 ft) libre de combustibles', permit.checklist.combustiblesCleared11m ? 'CUMPLE' : 'NO CUMPLE'],
        ['Pisos humedecidos o protegidos con mantas ignífugas', permit.checklist.floorsProtected ? 'CUMPLE' : 'NO CUMPLE'],
        ['Huecos en paredes/conductos sellados contra chispas', permit.checklist.wallHolesCovered ? 'CUMPLE' : 'NO CUMPLE'],
        ['Tuberías/tanques purgados, inertizados y libres de gas', permit.checklist.pipesPurgedInerted ? 'CUMPLE' : 'NO CUMPLE'],
        ['Extintor manual al pie (< 3m)', `${permit.checklist.extinguisherOnSite ? 'CUMPLE' : 'NO CUMPLE'} (${permit.checklist.extinguisherType})`],
        ['Mamparas o biombos ignífugos instalados', permit.checklist.fireScreensInstalled ? 'CUMPLE' : 'NO CUMPLE'],
        ['Ventilación forzada / extracción de humos activa', permit.checklist.ventilationActive ? 'CUMPLE' : 'NO CUMPLE'],
        ['Vigía de fuego exclusivo con control post-tarea', permit.checklist.fireWatchAssigned ? 'CUMPLE' : 'NO CUMPLE']
      ];

      autoTable(doc, {
        startY: currentY,
        theme: 'striped',
        head: [['Verificación de Seguridad Obligatoria (NFPA 51B)', 'Estado']],
        body: checkRows,
        styles: { fontSize: 8 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 14;

      // Signatures
      doc.setFontSize(8);
      doc.text('__________________________________', 20, currentY);
      doc.text('Firma y Aclaración Operador', 20, currentY + 5);

      doc.text('__________________________________', 85, currentY);
      doc.text('Firma Vigía de Incendio (Fire Watch)', 85, currentY + 5);

      doc.text('__________________________________', 150, currentY);
      doc.text('Firma Responsable HyS / Supervisor', 150, currentY + 5);

      // Pie de página legal
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, 285, 196, 285);
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Documento reglamentario de permiso de trabajo en caliente conforme a NFPA 51B y Ley 19.587 Dec. 351/79.', 14, 289);
      doc.text('Pág. 1 de 1', 196, 289, { align: 'right' });

      const fileName = `Permiso_Trabajo_Caliente_${permit.permitNumber}.pdf`;

      if (downloadOnly) {
        doc.save(fileName);
        toast.success('Permiso de trabajo en caliente descargado en PDF');
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
      toast.error('Error al generar PDF del permiso');
    }
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Permisos de Trabajos en Caliente"
          subtitle="Control de riesgos de incendio, corte y soldadura bajo normas NFPA 51B y OSHA 1910.252"
          badge="NFPA 51B / Dec. 351/79"
          icon={<Flame size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/')}
        />

        {/* 4 Tarjetas KPI interactivas estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setFilterStatus('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Permisos</span>
              <Flame size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Permisos registrados</span>
          </div>

          <div
            onClick={() => setFilterStatus('active')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Trabajos Activos</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.active}</div>
            <span className="text-[11px] text-slate-500">En curso con fuego/chispas</span>
          </div>

          <div
            onClick={() => setFilterStatus('gas')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'gas'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Control LEL Exigido</span>
              <ShieldAlert size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.gasRequired}</div>
            <span className="text-[11px] text-slate-500">Atmósfera explosiva</span>
          </div>

          <div
            onClick={() => setFilterStatus('completed')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-slate-100 dark:bg-slate-750 border-slate-400 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Finalizados</span>
              <Clock size={20} />
            </div>
            <div className="text-2xl font-black text-slate-700 dark:text-slate-300">{metrics.completed}</div>
            <span className="text-[11px] text-slate-500">Concluídos c/ vigía</span>
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
                placeholder="Buscar por N°, lugar, operador o tarea..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Exportar CSV */}
              <button
                type="button"
                onClick={exportToCsv}
                title="Exportar listado de permisos en caliente a CSV"
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

              {/* Botón Emitir Permiso */}
              <button
                type="button"
                onClick={() => navigate('/hot-work/new')}
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
                <span>Emitir Permiso en Caliente</span>
              </button>
            </div>
          </div>

          {/* Pastillas de filtro estilo Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                backgroundColor: filterStatus === 'all' ? '#dc2626' : '#ffffff',
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
              <span>Todos ({permits.length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('active')}
              style={{
                backgroundColor: filterStatus === 'active' ? '#059669' : '#ffffff',
                color: filterStatus === 'active' ? '#ffffff' : '#334155',
                border: filterStatus === 'active' ? 'none' : '1px solid #cbd5e1',
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
              <span>Activos ({metrics.active})</span>
            </button>

            <button
              onClick={() => setFilterStatus('gas')}
              style={{
                backgroundColor: filterStatus === 'gas' ? '#d97706' : '#ffffff',
                color: filterStatus === 'gas' ? '#ffffff' : '#334155',
                border: filterStatus === 'gas' ? 'none' : '1px solid #cbd5e1',
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
              <span>Con Atmósfera LEL ({metrics.gasRequired})</span>
            </button>

            <button
              onClick={() => setFilterStatus('completed')}
              style={{
                backgroundColor: filterStatus === 'completed' ? '#475569' : '#ffffff',
                color: filterStatus === 'completed' ? '#ffffff' : '#334155',
                border: filterStatus === 'completed' ? 'none' : '1px solid #cbd5e1',
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
              <span>Finalizados ({metrics.completed})</span>
            </button>
          </div>
        </div>

        {/* Permisos List */}
        {filteredPermits.length === 0 ? (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
            <EmptyStateIllustrated
              title="No hay permisos de trabajo en caliente"
              description="Crea un nuevo permiso para registrar actividades de soldadura, oxicorte, amolado o corte por plasma con verificación de radio de 11 metros y vigía de fuego."
              actionLabel="Nuevo Permiso en Caliente"
              onAction={() => navigate('/hot-work/new')}
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPermits.map(permit => {
              const act = HOT_WORK_ACTIVITIES.find(a => a.id === permit.activityType);
              const isSafeGas = !permit.gasMeasurement?.required || (permit.gasMeasurement.lelPercent < 10);

              return (
                <div
                  key={permit.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                          <Flame size={20} />
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                            {permit.permitNumber}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {act?.name || permit.activityType}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        permit.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : permit.status === 'completed'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}>
                        {permit.status === 'active' ? 'ACTIVO' : permit.status === 'completed' ? 'FINALIZADO' : permit.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        <span>{permit.date} ({permit.startTime} - {permit.endTime} hs)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">Op: <strong>{permit.operatorName}</strong> | Vigía: {permit.fireWatchName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">Sector: {permit.location} - {permit.area}</span>
                      </div>
                    </div>

                    {/* NFPA 51B badge checklist count */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                        {isSafeGas ? (
                          <CheckCircle2 size={14} className="text-emerald-600" />
                        ) : (
                          <AlertTriangle size={14} className="text-red-500" />
                        )}
                        Atmósfera: {permit.gasMeasurement?.required ? `${permit.gasMeasurement.lelPercent}% LEL` : 'No requerida'}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Post-control: {permit.fireWatchPostCheckTime} min
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                    {/* Botón Imprimir PDF */}
                    <button
                      type="button"
                      onClick={() => exportPDF(permit, false)}
                      title="Imprimir Permiso Oficial a PDF"
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
                      onClick={() => setViewPermit(permit)}
                      title="Ver Ficha Completa del Permiso"
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
                      onClick={() => setDeleteId(permit.id)}
                      title="Eliminar Permiso"
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
              );
            })}
          </div>
        )}

        {/* MODAL VER DETALLE COMPLETO DEL PERMISO EN CALIENTE */}
        {viewPermit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Flame className="text-red-500" size={22} />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    Permiso en Caliente: {viewPermit.permitNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewPermit(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-750 rounded-xl">
                  <div><strong>Fecha:</strong> {viewPermit.date}</div>
                  <div><strong>Horario:</strong> {viewPermit.startTime} a {viewPermit.endTime} hs</div>
                  <div><strong>Ubicación:</strong> {viewPermit.location}</div>
                  <div><strong>Sector:</strong> {viewPermit.area}</div>
                  <div><strong>Operador:</strong> {viewPermit.operatorName} {viewPermit.operatorCuil ? `(CUIL: ${viewPermit.operatorCuil})` : ''}</div>
                  <div><strong>Supervisor:</strong> {viewPermit.supervisorName}</div>
                  <div><strong>Vigía de Fuego:</strong> {viewPermit.fireWatchName}</div>
                  <div><strong>Control Post-Tarea:</strong> {viewPermit.fireWatchPostCheckTime} minutos</div>
                  <div><strong>Estado:</strong> {viewPermit.status.toUpperCase()}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl">
                  <strong>Descripción del Trabajo:</strong>
                  <p className="mt-1">{viewPermit.description}</p>
                </div>

                {viewPermit.gasMeasurement?.required && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Control de Atmósfera / Explosímetro:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div><strong>LEL%:</strong> {viewPermit.gasMeasurement.lelPercent}% ({viewPermit.gasMeasurement.lelPercent < 10 ? 'SEGURO' : 'PELIGRO'})</div>
                      <div><strong>Oxígeno O2%:</strong> {viewPermit.gasMeasurement.oxygenPercent}%</div>
                      <div><strong>CO:</strong> {viewPermit.gasMeasurement.coPpm} ppm</div>
                      <div><strong>H2S:</strong> {viewPermit.gasMeasurement.h2sPpm} ppm</div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Checklist de Seguridad NFPA 51B:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className={viewPermit.checklist.combustiblesCleared11m ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {viewPermit.checklist.combustiblesCleared11m ? '✓' : '✗'}
                      </span>
                      <span>Radio 11m libre de combustibles</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={viewPermit.checklist.floorsProtected ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {viewPermit.checklist.floorsProtected ? '✓' : '✗'}
                      </span>
                      <span>Pisos humedecidos / protegidos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={viewPermit.checklist.wallHolesCovered ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {viewPermit.checklist.wallHolesCovered ? '✓' : '✗'}
                      </span>
                      <span>Aberturas/huecos sellados</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={viewPermit.checklist.pipesPurgedInerted ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {viewPermit.checklist.pipesPurgedInerted ? '✓' : '✗'}
                      </span>
                      <span>Cañerías inertizadas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={viewPermit.checklist.extinguisherOnSite ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {viewPermit.checklist.extinguisherOnSite ? '✓' : '✗'}
                      </span>
                      <span>Extintor al pie ({viewPermit.checklist.extinguisherType})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={viewPermit.checklist.fireScreensInstalled ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {viewPermit.checklist.fireScreensInstalled ? '✓' : '✗'}
                      </span>
                      <span>Mamparas / biombos ignífugos</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => exportPDF(viewPermit, false)}
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
                  onClick={() => setViewPermit(null)}
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
          title="Eliminar Permiso en Caliente"
          message="¿Estás seguro de que deseas eliminar este registro de permiso en caliente? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
      </div>
    </AnimatedPage>
  );
}
