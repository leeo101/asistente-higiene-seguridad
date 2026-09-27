import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, ArrowLeft, Save, ShieldCheck, AlertTriangle,
  Clock, Calendar, User, ShieldAlert, CheckCircle2, Info,
  Printer, Download, Check
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import SignatureCanvas from '../components/SignatureCanvas';
import {
  HotWorkPermitData, HOT_WORK_ACTIVITIES, NFPA_51B_REQUIREMENTS
} from '../data/hotWorkData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function HotWorkPermitForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const [permitNumber] = useState(`HOT-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [location, setLocation] = useState(activeCompany?.name || '');
  const [area, setArea] = useState('');
  const [activityType, setActivityType] = useState('smaw');
  const [description, setDescription] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [operatorCuil, setOperatorCuil] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [fireWatchName, setFireWatchName] = useState('');
  const [fireWatchPostCheckTime, setFireWatchPostCheckTime] = useState<number>(30);

  // Atmósfera
  const [gasRequired, setGasRequired] = useState(false);
  const [oxygenPercent, setOxygenPercent] = useState<number>(20.9);
  const [lelPercent, setLelPercent] = useState<number>(0);
  const [coPpm, setCoPpm] = useState<number>(0);
  const [h2sPpm, setH2sPpm] = useState<number>(0);
  const [testerName, setTesterName] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');

  // Checklist NFPA 51B
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    combustiblesCleared11m: true,
    floorsProtected: true,
    wallHolesCovered: true,
    pipesPurgedInerted: true,
    extinguisherOnSite: true,
    fireScreensInstalled: true,
    ventilationActive: true,
    fireWatchAssigned: true,
    sprinklersProtected: false
  });
  const [extinguisherType, setExtinguisherType] = useState('ABC 5kg');

  // EPP
  const [ppe, setPpe] = useState({
    weldingHelmet: true,
    leatherGloves: true,
    leatherApron: true,
    safetyBoots: true,
    respiratorFumes: false,
    earProtection: true
  });

  const [notes, setNotes] = useState('');
  const [operatorSig, setOperatorSig] = useState<string | null>(null);
  const [supervisorSig, setSupervisorSig] = useState<string | null>(null);
  const [fireWatchSig, setFireWatchSig] = useState<string | null>(null);

  const totalChecks = NFPA_51B_REQUIREMENTS.length;
  const completedChecks = NFPA_51B_REQUIREMENTS.filter(item => checklist[item.id]).length;
  const allCompleted = completedChecks === totalChecks;

  const handleToggleCheck = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrintPDF = (downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Encabezado Superior Slate Ejecutivo
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('PERMISO DE TRABAJO EN CALIENTE Y CORTE/SOLDADURA', 14, 11);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Conforme a Normas NFPA 51B, IRAM 3517, Dec. 351/79 Cap. 18 y Ley 19.587 de Higiene y Seguridad', 14, 18);
      doc.setFontSize(7.5);
      const companyHeader = activeCompany ? activeCompany.name + ' (CUIT: ' + activeCompany.cuit + ')' : (location || 'Establecimiento Operativo');
      doc.text('Empresa / Establecimiento: ' + companyHeader + ' | Fecha de Emisión: ' + date, 14, 24);

      // Datos de Control
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('N° Permiso: ' + permitNumber, 14, 34);
      doc.text('Horario Habilitado: ' + startTime + ' a ' + endTime + ' hs', 80, 34);
      doc.text('Sector: ' + (area || 'General'), 145, 34);

      const activityObj = HOT_WORK_ACTIVITIES.find(a => a.id === activityType);

      // Tabla 1: Parámetros del Trabajo
      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Parámetros Operativos del Trabajo en Caliente', 'Detalles y Medidas de Control']],
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: [
          ['Tipo de Tarea Generadora de Calor', activityObj ? activityObj.name : activityType],
          ['Descripción de la Tarea', description || 'Corte / Soldadura / Amolado en caliente'],
          ['Extintor al Pie de Trabajo', extinguisherType + ' (Revisado y con manómetro en zona verde)'],
          ['Vigía de Incendio Designado (Fire Watch)', fireWatchName + ' (Guardia post-trabajo: ' + fireWatchPostCheckTime + ' min)'],
          ['Monitoreo de Atmósfera', gasRequired ? 'REQUERIDO: LEL ' + lelPercent + '%, O2 ' + oxygenPercent + '%' : 'No requerido (Área abierta y ventilada)']
        ],
        bodyStyles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 112 }
        }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 6;

      // Tabla 2: Verificaciones Críticas NFPA 51B
      const checkRows = NFPA_51B_REQUIREMENTS.map(item => [
        item.label,
        item.description,
        checklist[item.id] ? 'VERIFICADO CONFORME' : (item.critical ? '¡NO CUMPLE CRÍTICO!' : 'PENDIENTE')
      ]);

      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        head: [['Verificaciones Obligatorias (Radio de 11m NFPA 51B)', 'Detalle Técnico', 'Estado']],
        headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: checkRows,
        bodyStyles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 72 },
          2: { cellWidth: 30, fontStyle: 'bold' }
        },
        didParseCell: (data) => {
          if (data.column.index === 2) {
            if (data.cell.raw === 'VERIFICADO CONFORME') {
              data.cell.styles.textColor = [5, 150, 105];
            } else {
              data.cell.styles.textColor = [220, 38, 38];
            }
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 12;

      // Firmas
      const sigBoxWidth = 56;
      const sigHeight = 18;

      if (operatorSig) {
        try { doc.addImage(operatorSig, 'PNG', 14, currentY, sigBoxWidth, sigHeight); } catch {}
      }
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(14, currentY + sigHeight + 1, 14 + sigBoxWidth, currentY + sigHeight + 1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(operatorName || 'Operador / Soldador', 14, currentY + sigHeight + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('CUIL: ' + (operatorCuil || 'No informado'), 14, currentY + sigHeight + 8.5);

      if (supervisorSig) {
        try { doc.addImage(supervisorSig, 'PNG', 77, currentY, sigBoxWidth, sigHeight); } catch {}
      }
      doc.line(77, currentY + sigHeight + 1, 77 + sigBoxWidth, currentY + sigHeight + 1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(supervisorName || 'Supervisor HyS / Emisor', 77, currentY + sigHeight + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Autorizante del Permiso', 77, currentY + sigHeight + 8.5);

      if (fireWatchSig) {
        try { doc.addImage(fireWatchSig, 'PNG', 140, currentY, sigBoxWidth, sigHeight); } catch {}
      }
      doc.line(140, currentY + sigHeight + 1, 140 + sigBoxWidth, currentY + sigHeight + 1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(fireWatchName || 'Vigía de Incendio (Fire Watch)', 140, currentY + sigHeight + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Control post-trabajo ' + fireWatchPostCheckTime + ' min', 140, currentY + sigHeight + 8.5);

      // Pie de Página
      const footerY = pageHeight - 8;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, footerY - 3, pageWidth - 14, footerY - 3);

      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Documento operacional según NFPA 51B y Dec. 351/79 Cap. 18. Exige vigía y extintor al pie de obra.',
        14,
        footerY
      );
      doc.text(
        'Pág. 1 de 1 • Emitido: ' + new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR'),
        pageWidth - 14,
        footerY,
        { align: 'right' }
      );

      const fileName = 'Permiso_Trabajo_Caliente_' + permitNumber + '.pdf';

      if (downloadOnly) {
        doc.save(fileName);
        toast.success('Permiso en caliente descargado en PDF');
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

        toast.success('Abriendo ventana de impresión del permiso...');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el documento PDF');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!operatorName.trim() || !supervisorName.trim() || !fireWatchName.trim()) {
      toast.error('Completa los nombres del Operador, Supervisor y Vigía de Incendio.');
      return;
    }

    if (gasRequired && lelPercent >= 10) {
      toast.error('¡Peligro! El LEL medido supera el 10%. No se puede habilitar trabajo en caliente.');
      return;
    }

    const newPermit: HotWorkPermitData = {
      id: `hw_${Date.now()}`,
      companyId: activeCompany?.id,
      permitNumber,
      date,
      startTime,
      endTime,
      location,
      area,
      activityType,
      description,
      operatorName,
      operatorCuil,
      supervisorName,
      fireWatchName,
      fireWatchPostCheckTime,
      gasMeasurement: {
        required: gasRequired,
        oxygenPercent,
        lelPercent,
        coPpm,
        h2sPpm,
        testedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        testerName,
        equipmentModel
      },
      checklist: {
        combustiblesCleared11m: checklist.combustiblesCleared11m || false,
        floorsProtected: checklist.floorsProtected || false,
        wallHolesCovered: checklist.wallHolesCovered || false,
        pipesPurgedInerted: checklist.pipesPurgedInerted || false,
        extinguisherOnSite: checklist.extinguisherOnSite || false,
        extinguisherType,
        fireScreensInstalled: checklist.fireScreensInstalled || false,
        ventilationActive: checklist.ventilationActive || false,
        fireWatchAssigned: checklist.fireWatchAssigned || false,
        sprinklersProtected: checklist.sprinklersProtected || false
      },
      ppe,
      operatorSignature: operatorSig || undefined,
      supervisorSignature: supervisorSig || undefined,
      fireWatchSignature: fireWatchSig || undefined,
      status: 'active',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem('hot_work_permits_db');
    let list: HotWorkPermitData[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (err) {}
    }
    list.unshift(newPermit);
    localStorage.setItem('hot_work_permits_db', JSON.stringify(list));

    toast.success('Permiso de trabajo en caliente emitido exitosamente');
    navigate('/hot-work');
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Nuevo Permiso de Trabajo en Caliente"
          subtitle="Prevención de incendios en tareas de soldadura, oxicorte y amolado según Norma NFPA 51B"
          badge="NFPA 51B & Dec. 351/79 Cap. 18"
          icon={<Flame size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/hot-work')}
        />

        <div className="max-w-4xl mx-auto w-full px-2 sm:px-4 mt-6">
          {/* Barra Superior con botón Volver y botones Imprimir / Descargar PDF */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/hot-work')}
              style={{
                color: '#334155',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                minHeight: 'unset',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <ArrowLeft size={16} /> Volver a permisos en caliente
            </button>

            {/* Botones de Acción Superior: Imprimir y Descargar PDF */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePrintPDF(false)}
                title="Abrir cuadro de diálogo de impresión directa"
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '12px',
                  minHeight: 'unset',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Printer size={15} />
                <span>Imprimir Permiso</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintPDF(true)}
                title="Descargar archivo PDF directamente al dispositivo"
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '12px',
                  minHeight: 'unset',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                }}
              >
                <Download size={15} />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* ========================================================
                BLOQUE 1: Datos de la Tarea y Ubicación
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Flame size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    1. Identificación del Trabajo y Horario Habilitado
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Sector de trabajo, tipo de tarea generadora de calor y descripción
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    N° de Permiso
                  </label>
                  <input
                    type="text"
                    value={permitNumber}
                    readOnly
                    style={{ backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Fecha de Ejecución *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                      Inicio
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                      Fin
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Establecimiento / Obra
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Planta Central o Edificio Torre A"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Sector Específico *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Taller Mecánico, Tanque 4"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-3">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Tipo de Actividad Generadora de Calor
                  </label>
                  <select
                    value={activityType}
                    onChange={e => setActivityType(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  >
                    {HOT_WORK_ACTIVITIES.map(a => (
                      <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Descripción Detallada del Trabajo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describa piezas a cortar o unir, equipos a emplear y condiciones particulares..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs px-3 py-2 border rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 2: Personal Responsable Asignado
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <User size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    2. Personal Responsable Asignado
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Operador, supervisor de seguridad y vigía de incendio dedicado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Operador / Soldador Habilitado *
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre y Apellido"
                    value={operatorName}
                    onChange={e => setOperatorName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    CUIL / DNI Operador
                  </label>
                  <input
                    type="text"
                    placeholder="XX-XXXXXXXX-X"
                    value={operatorCuil}
                    onChange={e => setOperatorCuil(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Supervisor de HyS / Obra *
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre de quien autoriza"
                    value={supervisorName}
                    onChange={e => setSupervisorName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Vigía de Incendio (Fire Watch) Dedicado *
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del personal a cargo de la guardia de fuego"
                    value={fireWatchName}
                    onChange={e => setFireWatchName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Tiempo de Guardia Post-Trabajo
                  </label>
                  <select
                    value={fireWatchPostCheckTime}
                    onChange={e => setFireWatchPostCheckTime(Number(e.target.value))}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  >
                    <option value={30}>30 minutos (NFPA 51B estándar)</option>
                    <option value={60}>60 minutos (Riesgo alto/madera/aislaciones)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 3: Verificaciones NFPA 51B (Radio de 11 Metros)
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                      3. Verificaciones de Seguridad Obligatorias (Radio de 11m)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                      Control preventivo según Norma NFPA 51B y Decreto 351/79 Cap. 18
                    </p>
                  </div>
                </div>

                {/* Badge de progreso en vivo */}
                <div
                  style={{
                    backgroundColor: allCompleted ? '#dcfce7' : '#fef3c7',
                    color: allCompleted ? '#166534' : '#92400e',
                    border: allCompleted ? '1.5px solid #86efac' : '1.5px solid #fde68a',
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {allCompleted ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{completedChecks} de {totalChecks} Verificadas ({Math.round((completedChecks / totalChecks) * 100)}%)</span>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: ((completedChecks / totalChecks) * 100) + '%',
                    backgroundColor: allCompleted ? '#10b981' : '#f59e0b'
                  }}
                />
              </div>

              {/* Lista Interactiva de Puntos Críticos */}
              <div className="space-y-3">
                {NFPA_51B_REQUIREMENTS.map(item => {
                  const isChecked = Boolean(checklist[item.id]);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleCheck(item.id)}
                      style={{
                        backgroundColor: isChecked ? '#f0fdf4' : '#ffffff',
                        border: isChecked ? '2px solid #10b981' : '1.5px solid #e2e8f0',
                        boxShadow: isChecked ? '0 4px 12px rgba(16, 185, 129, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}
                      className="group hover:border-emerald-400"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Custom Checkbox Pill */}
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '8px',
                            backgroundColor: isChecked ? '#10b981' : '#ffffff',
                            border: isChecked ? 'none' : '2px solid #94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isChecked && <Check size={16} color="#ffffff" strokeWidth={3} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              style={{
                                color: isChecked ? '#064e3b' : '#0f172a',
                                fontWeight: isChecked ? 800 : 700,
                                fontSize: '13px',
                                margin: 0,
                                lineHeight: 1.4
                              }}
                            >
                              {item.label}
                            </p>
                            {item.critical && (
                              <span
                                style={{
                                  backgroundColor: '#fee2e2',
                                  color: '#b91c1c',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: '6px'
                                }}
                              >
                                CRÍTICO
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              color: isChecked ? '#047857' : '#475569',
                              fontSize: '11px',
                              margin: '2px 0 0 0',
                              lineHeight: 1.4
                            }}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Status Pill */}
                      <div className="flex-shrink-0">
                        <span
                          style={{
                            backgroundColor: isChecked ? '#d1fae5' : '#f1f5f9',
                            color: isChecked ? '#047857' : '#64748b',
                            border: isChecked ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 800
                          }}
                        >
                          {isChecked ? 'VERIFICADO' : 'PENDIENTE'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Extintor al pie */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <label style={{ color: '#0f172a' }} className="text-xs font-bold">
                  Tipo y Capacidad de Extintor Presente al Pie:
                </label>
                <input
                  type="text"
                  value={extinguisherType}
                  onChange={e => setExtinguisherType(e.target.value)}
                  placeholder="Ej. Polvo ABC 5kg o CO2 3.5kg"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                  className="text-xs font-semibold px-3 py-2 border rounded-lg outline-none w-full sm:w-64"
                />
              </div>
            </div>

            {/* ========================================================
                BLOQUE 4: Medición de Atmósfera Inflamable / Explosiva
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                      4. Medición de Atmósfera Inflamable / Explosiva
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                      Control con explosímetro calibrado en caso de tanques, tuberías o áreas con vapores
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={gasRequired}
                    onChange={e => setGasRequired(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  Requiere medición de atmósfera
                </label>
              </div>

              {gasRequired ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                      <label style={{ color: '#475569' }} className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                        LEL % (&lt; 10% permitido)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={lelPercent}
                        onChange={e => setLelPercent(parseFloat(e.target.value) || 0)}
                        style={{
                          backgroundColor: '#ffffff',
                          color: lelPercent < 10 ? '#047857' : '#b91c1c',
                          borderColor: lelPercent < 10 ? '#10b981' : '#ef4444'
                        }}
                        className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">Límite explosividad</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                      <label style={{ color: '#475569' }} className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                        Oxígeno % (19.5 - 23.5%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={oxygenPercent}
                        onChange={e => setOxygenPercent(parseFloat(e.target.value) || 0)}
                        style={{
                          backgroundColor: '#ffffff',
                          color: oxygenPercent >= 19.5 && oxygenPercent <= 23.5 ? '#047857' : '#b91c1c',
                          borderColor: oxygenPercent >= 19.5 && oxygenPercent <= 23.5 ? '#10b981' : '#ef4444'
                        }}
                        className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">Concentración de O2</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                      <label style={{ color: '#475569' }} className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                        CO ppm (&lt; 25 ppm)
                      </label>
                      <input
                        type="number"
                        value={coPpm}
                        onChange={e => setCoPpm(parseInt(e.target.value) || 0)}
                        style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                        className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">Monóxido de carbono</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                      <label style={{ color: '#475569' }} className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                        H2S ppm (&lt; 10 ppm)
                      </label>
                      <input
                        type="number"
                        value={h2sPpm}
                        onChange={e => setH2sPpm(parseInt(e.target.value) || 0)}
                        style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                        className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">Ácido sulfhídrico</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                        Responsable de la Medición
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre y cargo de quien midió"
                        value={testerName}
                        onChange={e => setTesterName(e.target.value)}
                        style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                        className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                        Modelo de Explosímetro / Calibración
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. MSA Altair 4XR (Vence: 20/12/2026)"
                        value={equipmentModel}
                        onChange={e => setEquipmentModel(e.target.value)}
                        style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                        className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#64748b' }} className="text-xs italic m-0">
                  Área abierta y exenta de atmósferas explosivas. No se requiere explosímetro continuo.
                </p>
              )}
            </div>

            {/* ========================================================
                BLOQUE 5: EPP Homologado Requerido (Res. SRT 299/11)
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    5. Equipamiento de Protección Personal (EPP) Homologado
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Constancia de entrega y uso obligatorio bajo Resolución SRT N° 299/11
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { k: 'weldingHelmet', label: 'Máscara fotosensible / Careta' },
                  { k: 'leatherGloves', label: 'Guantes de descarne caña larga' },
                  { k: 'leatherApron', label: 'Delantal y polainas de cuero' },
                  { k: 'safetyBoots', label: 'Calzado de seguridad con puntera' },
                  { k: 'respiratorFumes', label: 'Protección respiratoria p/humos' },
                  { k: 'earProtection', label: 'Protección auditiva de copa/tapón' }
                ].map(item => (
                  <label
                    key={item.k}
                    style={{
                      backgroundColor: (ppe as any)[item.k] ? '#f5f3ff' : '#ffffff',
                      border: (ppe as any)[item.k] ? '1.5px solid #8b5cf6' : '1px solid #cbd5e1'
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={(ppe as any)[item.k]}
                      onChange={() => setPpe(prev => ({ ...prev, [item.k]: !(prev as any)[item.k] }))}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span style={{ color: '#1e293b' }} className="text-xs font-bold">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ========================================================
                BLOQUE 6: Firmas Digitales y Autorización Final
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    6. Autorización Formal y Firmas Digitales
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Validación de las 3 partes requeridas por la Norma NFPA 51B
                  </p>
                </div>
              </div>

              <div>
                <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                  Observaciones Técnicas o Requisitos Especiales
                </label>
                <textarea
                  rows={2}
                  placeholder="Aclaraciones adicionales sobre permisos concurrentes, aislamiento LOTO previo o ventilación especial..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                  className="w-full text-xs px-3 py-2 border rounded-xl outline-none"
                />
              </div>

              {/* Firmas Digitales */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <span style={{ color: '#0f172a' }} className="block text-xs font-extrabold uppercase tracking-wider mb-4">
                  Firmas Digitales de Autorización (Pantalla Táctil / Mouse):
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SignatureCanvas
                    title="Firma Operador / Soldador"
                    onSave={setOperatorSig}
                    initialImage={operatorSig || undefined}
                  />
                  <SignatureCanvas
                    title="Firma Supervisor HyS / Emisor"
                    onSave={setSupervisorSig}
                    initialImage={supervisorSig || undefined}
                  />
                  <SignatureCanvas
                    title="Firma Vigía de Incendio (Fire Watch)"
                    onSave={setFireWatchSig}
                    initialImage={fireWatchSig || undefined}
                  />
                </div>
              </div>
            </div>

            {/* ========================================================
                BARRA DE BOTONES FINAL (Estilo Arco Eléctrico / Aptitudes)
               ======================================================== */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => navigate('/hot-work')}
                style={{
                  color: '#475569',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={16} />
                <span>Cancelar</span>
              </button>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Botón Imprimir */}
                <button
                  type="button"
                  onClick={() => handlePrintPDF(false)}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'unset',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  <Printer size={16} />
                  <span>Imprimir Permiso</span>
                </button>

                {/* Botón Descargar PDF */}
                <button
                  type="button"
                  onClick={() => handlePrintPDF(true)}
                  style={{
                    backgroundColor: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'unset',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)'
                  }}
                >
                  <Download size={16} />
                  <span>Descargar PDF</span>
                </button>

                {/* Botón Guardar / Emitir */}
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'unset',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
                  }}
                >
                  <Save size={16} />
                  <span>Emitir Permiso en Caliente</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
}
