import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory, Plus, Search, Calendar, FileText, Download,
  Trash2, AlertTriangle, CheckCircle2, Wind, Droplets, ShieldAlert,
  FileSpreadsheet, Eye, X, ShieldCheck, Activity
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import { EmissionSampleRecord, LEGAL_LIMITS } from '../data/industrialEnvironmentData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function IndustrialEnvironmentManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const [records, setRecords] = useState<EmissionSampleRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewRecord, setViewRecord] = useState<EmissionSampleRecord | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const raw = localStorage.getItem('industrial_environment_db');
    if (raw) {
      try {
        setRecords(JSON.parse(raw));
      } catch (e) {
        console.error('Error loading environmental samples', e);
      }
    }
  }, []);

  // Métricas para las 4 KPI cards estilo Aptitudes Médicas
  const metrics = useMemo(() => {
    const total = records.length;
    const compliant = records.filter(r => r.complianceOverall === 'compliant').length;
    const exceeded = records.filter(r => r.complianceOverall === 'exceeded_limits').length;
    const liquid = records.filter(r => r.sampleType === 'liquid_effluent').length;
    const gas = records.filter(r => r.sampleType === 'gas_emission').length;

    return { total, compliant, exceeded, liquid, gas };
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (activeCompany && r.companyId && r.companyId !== activeCompany.id) return false;
      if (filterType === 'compliant') {
        if (r.complianceOverall !== 'compliant') return false;
      } else if (filterType === 'exceeded') {
        if (r.complianceOverall !== 'exceeded_limits') return false;
      } else if (filterType !== 'all') {
        if (r.sampleType !== filterType) return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          r.reportNumber.toLowerCase().includes(q) ||
          r.pointName.toLowerCase().includes(q) ||
          r.laboratoryName.toLowerCase().includes(q) ||
          r.responsibleAuditor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, activeCompany, filterType, searchTerm]);

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = records.filter(r => r.id !== deleteId);
    setRecords(updated);
    localStorage.setItem('industrial_environment_db', JSON.stringify(updated));
    setDeleteId(null);
    toast.success('Monitoreo ambiental eliminado');
  };

  const exportToCsv = () => {
    if (records.length === 0) {
      toast.error('No hay registros de monitoreo ambiental para exportar.');
      return;
    }

    const headers = [
      'Nro Informe',
      'Fecha',
      'Tipo Muestreo',
      'Punto de Muestreo',
      'Laboratorio',
      'Nro Protocolo',
      'Auditor Responsable',
      'Estado General'
    ];

    const rows = records.map(r => [
      `"${r.reportNumber || ''}"`,
      `"${r.date || ''}"`,
      `"${r.sampleType === 'gas_emission' ? 'Emision Gaseosa' : 'Efluente Liquido'}"`,
      `"${(r.pointName || '').replace(/"/g, '""')}"`,
      `"${(r.laboratoryName || '').replace(/"/g, '""')}"`,
      `"${r.sampleProtocolNumber || ''}"`,
      `"${(r.responsibleAuditor || '').replace(/"/g, '""')}"`,
      `"${r.complianceOverall === 'compliant' ? 'CONFORME' : 'EXCEDIDO'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Monitoreo_Efluentes_Emisiones_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Padrón de monitoreos ambientales exportado en CSV.');
  };

  const exportPDF = (record: EmissionSampleRecord, downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(13, 148, 136);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORME TÉCNICO DE MONITOREO AMBIENTAL INDUSTRIAL', 14, 12);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Ley General del Ambiente 25.675 - Registro de Emisiones y Efluentes Líquidos', 14, 19);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Informe N°: ${record.reportNumber}`, 14, 34);
      doc.text(`Fecha Muestreo: ${record.date}`, 145, 34);

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Parámetros Generales del Monitoreo', 'Detalle']],
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: [
          ['Empresa / Establecimiento', activeCompany ? `${activeCompany.name} (CUIT: ${activeCompany.cuit})` : 'Planta Industrial'],
          ['Tipo de Monitoreo', record.sampleType === 'gas_emission' ? 'Emisiones Gaseosas en Chimenea' : 'Efluentes Líquidos Industriales'],
          ['Punto de Muestreo', record.pointName],
          ['Laboratorio Acreditado', `${record.laboratoryName} (Protocolo N° ${record.sampleProtocolNumber})`],
          ['Responsable Técnico', record.responsibleAuditor],
          ['Resultado Global', record.complianceOverall === 'compliant' ? 'CONFORME (DENTRO DE LÍMITES)' : 'EXCEDIDO (DESVÍO REGISTRADO)']
        ],
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 112 }
        }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 6;

      if (record.sampleType === 'gas_emission' && record.gasParameters) {
        const p = record.gasParameters;
        autoTable(doc, {
          startY: currentY,
          theme: 'striped',
          head: [['Parámetro Gaseoso', 'Valor Medido', 'Límite Máximo', 'Estado']],
          headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          body: [
            ['Material Particulado', `${p.particulateMatterMgNm3} mg/Nm³`, `${LEGAL_LIMITS.gas.pmMax} mg/Nm³`, p.particulateMatterMgNm3 <= LEGAL_LIMITS.gas.pmMax ? 'CONFORME' : 'EXCEDIDO'],
            ['Monóxido de Carbono (CO)', `${p.coPpm} ppm`, `${LEGAL_LIMITS.gas.coMax} ppm`, p.coPpm <= LEGAL_LIMITS.gas.coMax ? 'CONFORME' : 'EXCEDIDO'],
            ['Óxidos de Nitrógeno (NOx)', `${p.noxMgNm3} mg/Nm³`, `${LEGAL_LIMITS.gas.noxMax} mg/Nm³`, p.noxMgNm3 <= LEGAL_LIMITS.gas.noxMax ? 'CONFORME' : 'EXCEDIDO'],
            ['Dióxido de Azufre (SO2)', `${p.so2MgNm3} mg/Nm³`, `${LEGAL_LIMITS.gas.so2Max} mg/Nm³`, p.so2MgNm3 <= LEGAL_LIMITS.gas.so2Max ? 'CONFORME' : 'EXCEDIDO'],
            ['Caudal de Emisión', `${p.gasFlowM3H} m³/h`, 'Referencia Operativa', 'NORMAL'],
            ['Temperatura de Gases', `${p.gasTempC} °C`, 'Referencia Operativa', 'NORMAL']
          ],
          styles: { fontSize: 7.5, cellPadding: 2 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 12;
      } else if (record.liquidParameters) {
        const l = record.liquidParameters;
        autoTable(doc, {
          startY: currentY,
          theme: 'striped',
          head: [['Parámetro Físico-Químico', 'Valor Medido', 'Límite Admisible', 'Estado']],
          headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          body: [
            ['pH', `${l.ph}`, `${LEGAL_LIMITS.liquid.phMin} - ${LEGAL_LIMITS.liquid.phMax}`, l.ph >= LEGAL_LIMITS.liquid.phMin && l.ph <= LEGAL_LIMITS.liquid.phMax ? 'CONFORME' : 'EXCEDIDO'],
            ['Temperatura', `${l.tempC} °C`, `< ${LEGAL_LIMITS.liquid.tempMax} °C`, l.tempC <= LEGAL_LIMITS.liquid.tempMax ? 'CONFORME' : 'EXCEDIDO'],
            ['Demanda Bioquímica Oxígeno (DBO5)', `${l.dbo5MgL} mg/L`, `${LEGAL_LIMITS.liquid.dbo5Max} mg/L`, l.dbo5MgL <= LEGAL_LIMITS.liquid.dbo5Max ? 'CONFORME' : 'EXCEDIDO'],
            ['Demanda Química Oxígeno (DQO)', `${l.dqoMgL} mg/L`, `${LEGAL_LIMITS.liquid.dqoMax} mg/L`, l.dqoMgL <= LEGAL_LIMITS.liquid.dqoMax ? 'CONFORME' : 'EXCEDIDO'],
            ['Sólidos Sedimentables 2h', `${l.settleableSolidsMlL} ml/L`, `${LEGAL_LIMITS.liquid.settleableMax} ml/L`, l.settleableSolidsMlL <= LEGAL_LIMITS.liquid.settleableMax ? 'CONFORME' : 'EXCEDIDO'],
            ['Aceites y Grasas', `${l.oilsAndGreaseMgL} mg/L`, `${LEGAL_LIMITS.liquid.oilsMax} mg/L`, l.oilsAndGreaseMgL <= LEGAL_LIMITS.liquid.oilsMax ? 'CONFORME' : 'EXCEDIDO']
          ],
          styles: { fontSize: 7.5, cellPadding: 2 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 12;
      }

      doc.setFontSize(7.5);
      doc.text('________________________________________', 25, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text('Firma Responsable Ambiental / Laboratorio', 25, currentY + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(record.laboratoryName, 25, currentY + 8);

      doc.text('________________________________________', 125, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text('Firma Responsable Higiene y Seguridad', 125, currentY + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(record.responsibleAuditor || 'Servicio HyS', 125, currentY + 8);

      // Pie de página legal
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, 285, 196, 285);
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Documento oficial según Ley 25.675 y Res. Ambientales provinciales. Validez legal ante inspecciones de OPDS/ADA/DPA.', 14, 289);
      doc.text('Pág. 1 de 1', 196, 289, { align: 'right' });

      const fileName = `Monitoreo_Ambiental_${record.reportNumber}.pdf`;

      if (downloadOnly) {
        doc.save(fileName);
        toast.success('Informe de monitoreo descargado en PDF');
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
          title="Efluentes y Emisiones Industriales"
          subtitle="Monitoreo y cotejo automático de descargas líquidas y chimeneas de gases bajo Ley 25.675"
          badge="Ley 25.675 & Dec. 351/79"
          icon={<Factory size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/')}
        />

        {/* 4 Tarjetas KPI interactivas estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setFilterType('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Monitoreos</span>
              <Activity size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Muestras registradas</span>
          </div>

          <div
            onClick={() => setFilterType('compliant')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'compliant'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Muestras Conformes</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.compliant}</div>
            <span className="text-[11px] text-slate-500">Dentro de límites legales</span>
          </div>

          <div
            onClick={() => setFilterType('exceeded')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'exceeded'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Desvíos / Excedidos</span>
              <AlertTriangle size={20} />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.exceeded}</div>
            <span className="text-[11px] text-slate-500">Requiere adecuación</span>
          </div>

          <div
            onClick={() => setFilterType('liquid_effluent')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'liquid_effluent'
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-teal-400'
            }`}
          >
            <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Efluentes Líquidos</span>
              <Droplets size={20} />
            </div>
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400">{metrics.liquid}</div>
            <span className="text-[11px] text-slate-500">Descargas industriales</span>
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
                placeholder="Buscar por N°, punto o laboratorio..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Exportar CSV */}
              <button
                type="button"
                onClick={exportToCsv}
                title="Exportar listado de monitoreos ambientales en CSV"
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

              {/* Botón Registrar Nuevo Monitoreo */}
              <button
                type="button"
                onClick={() => navigate('/industrial-environment/new')}
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
                <span>Nuevo Monitoreo</span>
              </button>
            </div>
          </div>

          {/* Filter Pills estilo Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              style={{
                backgroundColor: filterType === 'all' ? '#2563eb' : '#ffffff',
                color: filterType === 'all' ? '#ffffff' : '#334155',
                border: filterType === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
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
              onClick={() => setFilterType('compliant')}
              style={{
                backgroundColor: filterType === 'compliant' ? '#059669' : '#ffffff',
                color: filterType === 'compliant' ? '#ffffff' : '#334155',
                border: filterType === 'compliant' ? '1px solid #059669' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Conformes ({metrics.compliant})
            </button>
            <button
              onClick={() => setFilterType('exceeded')}
              style={{
                backgroundColor: filterType === 'exceeded' ? '#dc2626' : '#ffffff',
                color: filterType === 'exceeded' ? '#ffffff' : '#334155',
                border: filterType === 'exceeded' ? '1px solid #dc2626' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Excedidos ({metrics.exceeded})
            </button>
            <button
              onClick={() => setFilterType('liquid_effluent')}
              style={{
                backgroundColor: filterType === 'liquid_effluent' ? '#0d9488' : '#ffffff',
                color: filterType === 'liquid_effluent' ? '#ffffff' : '#334155',
                border: filterType === 'liquid_effluent' ? '1px solid #0d9488' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Efluentes Líquidos ({metrics.liquid})
            </button>
            <button
              onClick={() => setFilterType('gas_emission')}
              style={{
                backgroundColor: filterType === 'gas_emission' ? '#0284c7' : '#ffffff',
                color: filterType === 'gas_emission' ? '#ffffff' : '#334155',
                border: filterType === 'gas_emission' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Emisiones Gaseosas ({metrics.gas})
            </button>
          </div>

          {/* Listado de Monitoreos */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
              <EmptyStateIllustrated
                title="No hay registros de monitoreo ambiental"
                description="Registra tomas de muestras en chimeneas (gases/humos) o efluentes industriales para cotejar automáticamente contra los límites admisibles legales."
                actionLabel="Nuevo Monitoreo Ambiental"
                onAction={() => navigate('/industrial-environment/new')}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(r => (
                <div
                  key={r.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-2.5 rounded-xl ${
                          r.sampleType === 'gas_emission'
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600'
                            : 'bg-teal-50 dark:bg-teal-950/40 text-teal-600'
                        }`}>
                          {r.sampleType === 'gas_emission' ? <Wind size={22} /> : <Droplets size={22} />}
                        </span>
                        <div>
                          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm m-0">
                            {r.pointName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono m-0 mt-0.5">
                            {r.reportNumber}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                        r.complianceOverall === 'compliant'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {r.complianceOverall === 'compliant' ? 'CONFORME' : 'EXCEDIDO'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Factory size={14} className="text-slate-400 shrink-0" />
                        <span>Tipo: <strong className="text-slate-800 dark:text-slate-100">{r.sampleType === 'gas_emission' ? 'Emisión Gaseosa' : 'Efluente Líquido'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-400 shrink-0" />
                        <span>Lab: {r.laboratoryName} (Prot: {r.sampleProtocolNumber})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        <span>Fecha: {r.date} | Auditor: {r.responsibleAuditor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones con Botones Sólidos estilo Aptitudes Médicas */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end items-center gap-2 flex-wrap">
                    {/* Botón PDF */}
                    <button
                      type="button"
                      onClick={() => exportPDF(r, false)}
                      title="Imprimir / Exportar Informe Técnico a PDF"
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
                      onClick={() => setViewRecord(r)}
                      title="Ver Detalles del Monitoreo"
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
                      onClick={() => setDeleteId(r.id)}
                      title="Eliminar Registro"
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

        {/* Modal de Detalle / Ver Monitoreo Ambiental */}
        {viewRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                    <Factory size={22} />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 m-0">
                      Monitoreo: {viewRecord.pointName}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {viewRecord.reportNumber} • Fecha: {viewRecord.date}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipo Muestreo</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {viewRecord.sampleType === 'gas_emission' ? 'Emisión Gaseosa' : 'Efluente Líquido'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado Legal</span>
                  <span className={`text-sm font-black ${viewRecord.complianceOverall === 'compliant' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {viewRecord.complianceOverall === 'compliant' ? 'CONFORME' : 'EXCEDIDO'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Laboratorio</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block">
                    {viewRecord.laboratoryName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">N° Protocolo</span>
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">
                    {viewRecord.sampleProtocolNumber}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Auditor HyS</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {viewRecord.responsibleAuditor}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Establecimiento</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block">
                    {activeCompany?.name || 'Planta Industrial'}
                  </span>
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => exportPDF(viewRecord, false)}
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
                  onClick={() => setViewRecord(null)}
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
          title="Eliminar Monitoreo Ambiental"
          message="¿Estás seguro de que deseas eliminar este registro de monitoreo de efluentes o emisiones? Esta acción no se puede deshacer."
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
