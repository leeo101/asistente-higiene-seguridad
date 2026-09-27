import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pickaxe, Plus, Search, Calendar, FileText, Download,
  Trash2, AlertTriangle, CheckCircle2, Clock, Ruler, ShieldAlert,
  FileSpreadsheet, Eye, X, ShieldCheck, Layers, MapPin
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import { ExcavationPermitData, SOIL_TYPES_INFO } from '../data/excavationData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function ExcavationSafetyManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const [permits, setPermits] = useState<ExcavationPermitData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewPermit, setViewPermit] = useState<ExcavationPermitData | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const raw = localStorage.getItem('excavation_permits_db');
    if (raw) {
      try {
        setPermits(JSON.parse(raw));
      } catch (e) {
        console.error('Error loading excavation permits', e);
      }
    }
  }, []);

  // Métricas para las 4 KPI cards estilo Aptitudes Médicas
  const metrics = useMemo(() => {
    const total = permits.length;
    const active = permits.filter(p => p.status === 'active').length;
    const deep = permits.filter(p => p.depthMeters > 1.20).length;
    const completed = permits.filter(p => p.status === 'completed').length;

    return { total, active, deep, completed };
  }, [permits]);

  const filteredPermits = useMemo(() => {
    return permits.filter(p => {
      if (activeCompany && p.companyId && p.companyId !== activeCompany.id) return false;
      if (filterStatus === 'deep') {
        if (p.depthMeters <= 1.20) return false;
      } else if (filterStatus !== 'all') {
        if (p.status !== filterStatus) return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          p.permitNumber.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.projectOrSite.toLowerCase().includes(q) ||
          p.competentPersonName.toLowerCase().includes(q) ||
          p.supervisorName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [permits, activeCompany, filterStatus, searchTerm]);

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = permits.filter(p => p.id !== deleteId);
    setPermits(updated);
    localStorage.setItem('excavation_permits_db', JSON.stringify(updated));
    setDeleteId(null);
    toast.success('Permiso de excavación eliminado');
  };

  const exportToCsv = () => {
    if (permits.length === 0) {
      toast.error('No hay permisos de excavación para exportar.');
      return;
    }

    const headers = [
      'Nro Permiso',
      'Fecha',
      'Ubicacion',
      'Obra / Proyecto',
      'Profundidad (m)',
      'Ancho (m)',
      'Longitud (m)',
      'Tipo Suelo',
      'Entibado Requerido',
      'Tipo Entibado',
      'Persona Competente',
      'Supervisor',
      'Estado'
    ];

    const rows = permits.map(p => [
      `"${p.permitNumber || ''}"`,
      `"${p.date || ''}"`,
      `"${(p.location || '').replace(/"/g, '""')}"`,
      `"${(p.projectOrSite || '').replace(/"/g, '""')}"`,
      p.depthMeters,
      p.widthMeters,
      p.lengthMeters,
      `"Tipo ${p.soilType}"`,
      p.depthMeters > 1.20 ? 'SI' : 'NO',
      `"${p.shoringType || 'none'}"`,
      `"${(p.competentPersonName || '').replace(/"/g, '""')}"`,
      `"${(p.supervisorName || '').replace(/"/g, '""')}"`,
      `"${p.status || 'active'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Permisos_Excavacion_Dec911_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Padrón de permisos de excavación exportado en CSV.');
  };

  const exportPDF = (permit: ExcavationPermitData, downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(180, 83, 9);
      doc.rect(0, 0, 210, 26, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PERMISO Y HABILITACIÓN DE EXCAVACIÓN Y ZANJAS', 14, 12);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Decreto 911/96 Cap. 10, Res. SRT 550/11 y OSHA 1926 Subparte P', 14, 19);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`N° Permiso: ${permit.permitNumber}`, 14, 34);
      doc.text(`Fecha: ${permit.date}`, 145, 34);

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Parámetros Geotécnicos y Operativos', 'Detalle']],
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: [
          ['Empresa / Obra', activeCompany ? `${activeCompany.name} (CUIT: ${activeCompany.cuit})` : permit.projectOrSite],
          ['Ubicación Específica', permit.location],
          ['Dimensiones de la Excavación', `Profundidad: ${permit.depthMeters} m | Ancho: ${permit.widthMeters} m | Longitud: ${permit.lengthMeters} m`],
          ['Clasificación del Suelo', `Suelo Tipo ${permit.soilType} - ${SOIL_TYPES_INFO[permit.soilType].name}`],
          ['Talud Reglamentario Recomendado', SOIL_TYPES_INFO[permit.soilType].maxSlope],
          ['Sistema de Protección / Entibado', permit.depthMeters > 1.20 ? `OBLIGATORIO (${permit.shoringType})` : 'No obligatorio por profundidad (<1.20m)'],
          ['Persona Competente Designada', permit.competentPersonName],
          ['Supervisor / Capataz a Cargo', permit.supervisorName]
        ],
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 112 }
        }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 6;

      autoTable(doc, {
        startY: currentY,
        theme: 'striped',
        head: [['Puntos de Control de Seguridad en Excavación (Dec. 911/96)', 'Estado']],
        headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: [
          ['Interferencias subterráneas sondeadas (Gas, Luz, Agua)', permit.checklist.utilitiesLocated ? 'VERIFICADO / CONFORME' : 'NO CUMPLE'],
          ['Acopio de tierra a más de 1.00 metro del borde superior', permit.checklist.spoilDistance1m ? 'VERIFICADO / CONFORME' : 'NO CUMPLE'],
          ['Escaleras reglamentarias de acceso/egreso cada 7.50 metros', permit.checklist.safeAccessLadders7m ? 'VERIFICADO / CONFORME' : 'NO CUMPLE'],
          ['Distancia segura de maquinaria pesada / vibración', permit.checklist.machineryDistanceSafe ? 'VERIFICADO / CONFORME' : 'NO CUMPLE'],
          ['Vallado perimetral rígido y señalización nocturna', permit.checklist.perimeterBarricades ? 'VERIFICADO / CONFORME' : 'NO CUMPLE'],
          ['Monitoreo de atmósfera en zanja profunda (> 1.20m)', permit.checklist.atmosphereTested ? 'VERIFICADO / CONFORME' : 'NO CUMPLE'],
          ['Control y evacuación de agua/drenaje instalado', permit.checklist.waterControlInstalled ? 'VERIFICADO / CONFORME' : 'NO CUMPLE']
        ],
        styles: { fontSize: 7.5, cellPadding: 2 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 14;
      doc.setFontSize(7.5);
      doc.text('________________________________________', 25, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text('Firma Persona Competente en Suelos', 25, currentY + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(permit.competentPersonName || 'Persona Competente', 25, currentY + 8);

      doc.text('________________________________________', 125, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text('Firma Responsable Higiene y Seguridad', 125, currentY + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(permit.supervisorName || 'Servicio HyS', 125, currentY + 8);

      // Pie de página legal
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, 285, 196, 285);
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Documento oficial según Decreto 911/96 Cap. 10 y Res. SRT 550/11. Prohibido ingreso a zanja sin firma de Persona Competente.', 14, 289);
      doc.text('Pág. 1 de 1', 196, 289, { align: 'right' });

      const fileName = `Permiso_Excavacion_${permit.permitNumber}.pdf`;

      if (downloadOnly) {
        doc.save(fileName);
        toast.success('Permiso de excavación descargado en PDF');
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
          title="Seguridad en Excavaciones y Zanjas"
          subtitle="Habilitación geotécnica, taludes y entibados reglamentarios bajo Dec. 911/96 y Res. SRT 550/11"
          badge="Dec. 911/96 & Res. 550/11"
          icon={<Pickaxe size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/')}
        />

        {/* 4 Tarjetas KPI interactivas estilo Aptitudes Médicas */}
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
              <span className="text-xs font-bold uppercase tracking-wider">Total Permisos</span>
              <Layers size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Zanjas registradas</span>
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
              <span className="text-xs font-bold uppercase tracking-wider">Permisos Activos</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.active}</div>
            <span className="text-[11px] text-slate-500">Trabajos en curso</span>
          </div>

          <div
            onClick={() => setFilterStatus('deep')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'deep'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Profundas (&gt;1.20m)</span>
              <Ruler size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.deep}</div>
            <span className="text-[11px] text-slate-500">Entibado reglamentario</span>
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
            <span className="text-[11px] text-slate-500">Tapadas y concluidas</span>
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
                placeholder="Buscar por N°, lugar, obra o persona..."
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
                title="Exportar listado de permisos de excavación en CSV"
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

              {/* Botón Nuevo Permiso */}
              <button
                type="button"
                onClick={() => navigate('/excavations/new')}
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
                <span>Nuevo Permiso</span>
              </button>
            </div>
          </div>

          {/* Filter Pills estilo Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                backgroundColor: filterStatus === 'all' ? '#2563eb' : '#ffffff',
                color: filterStatus === 'all' ? '#ffffff' : '#334155',
                border: filterStatus === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Todos ({metrics.total})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              style={{
                backgroundColor: filterStatus === 'active' ? '#059669' : '#ffffff',
                color: filterStatus === 'active' ? '#ffffff' : '#334155',
                border: filterStatus === 'active' ? '1px solid #059669' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Activos ({metrics.active})
            </button>
            <button
              onClick={() => setFilterStatus('deep')}
              style={{
                backgroundColor: filterStatus === 'deep' ? '#d97706' : '#ffffff',
                color: filterStatus === 'deep' ? '#ffffff' : '#334155',
                border: filterStatus === 'deep' ? '1px solid #d97706' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Profundas &gt;1.20m ({metrics.deep})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              style={{
                backgroundColor: filterStatus === 'completed' ? '#475569' : '#ffffff',
                color: filterStatus === 'completed' ? '#ffffff' : '#334155',
                border: filterStatus === 'completed' ? '1px solid #475569' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Finalizados ({metrics.completed})
            </button>
          </div>

          {/* Listado de Permisos */}
          {filteredPermits.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
              <EmptyStateIllustrated
                title="No hay permisos de excavación registrados"
                description="Habilita nuevas excavaciones y zanjas verificando pendientes seguras, presencia de interferencias enterradas y sistemas de entibado reglamentario."
                actionLabel="Nuevo Permiso Excavación"
                onAction={() => navigate('/excavations/new')}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPermits.map(permit => {
                const soil = SOIL_TYPES_INFO[permit.soilType];
                const isDeep = permit.depthMeters > 1.20;

                return (
                  <div
                    key={permit.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                            <Pickaxe size={22} />
                          </span>
                          <div>
                            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm m-0">
                              {permit.permitNumber}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono m-0 mt-0.5 truncate max-w-[150px]">
                              {permit.location}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          permit.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {permit.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Ruler size={14} className="text-slate-400 shrink-0" />
                          <span>Profundidad: <strong className="text-slate-800 dark:text-slate-100">{permit.depthMeters} m</strong> ({permit.widthMeters}m x {permit.lengthMeters}m)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldAlert size={14} className="text-slate-400 shrink-0" />
                          <span>Suelo: <strong className="text-slate-800 dark:text-slate-100">Tipo {permit.soilType}</strong> (Talud máx: {soil?.maxSlope})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          <span>Habilitado: {permit.competentPersonName} ({permit.date})</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isDeep
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700'
                        }`}>
                          {isDeep ? 'Entibado Requerido (>1.2m)' : 'Zanja superficial'}
                        </span>
                        <span className="text-slate-500 text-[11px] font-medium">
                          {permit.shoringType !== 'none' ? permit.shoringType : 'Sin entibado'}
                        </span>
                      </div>
                    </div>

                    {/* Acciones con Botones Sólidos estilo Aptitudes Médicas */}
                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end items-center gap-2 flex-wrap">
                      {/* Botón PDF */}
                      <button
                        type="button"
                        onClick={() => exportPDF(permit, false)}
                        title="Imprimir / Exportar Permiso en PDF"
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
                        onClick={() => setViewPermit(permit)}
                        title="Ver Detalles del Permiso de Excavación"
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
                        onClick={() => setDeleteId(permit.id)}
                        title="Eliminar Permiso"
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
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Detalle / Ver Permiso de Excavación */}
        {viewPermit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Pickaxe size={22} />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 m-0">
                      Permiso: {viewPermit.permitNumber}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {viewPermit.location} • Fecha: {viewPermit.date}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewPermit(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Profundidad</span>
                  <span className="text-sm font-black text-amber-600">
                    {viewPermit.depthMeters} metros
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipo de Suelo</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Tipo {viewPermit.soilType}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Entibado</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {viewPermit.shoringType}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Persona Competente</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block">
                    {viewPermit.competentPersonName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Supervisor</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block">
                    {viewPermit.supervisorName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {viewPermit.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Checklist */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  Controles de Seguridad (Dec. 911/96)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${viewPermit.checklist?.utilitiesLocated ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>Interferencias sondeadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${viewPermit.checklist?.spoilDistance1m ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>Acopio tierra &gt; 1m del borde</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${viewPermit.checklist?.safeAccessLadders7m ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>Escaleras cada 7.5m</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${viewPermit.checklist?.perimeterBarricades ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>Vallado perimetral</span>
                  </div>
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => exportPDF(viewPermit, false)}
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
                  onClick={() => setViewPermit(null)}
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
          title="Eliminar Permiso de Excavación"
          message="¿Estás seguro de que deseas eliminar este registro de permiso de excavación? Esta acción no se puede deshacer."
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
