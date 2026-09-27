import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, ArrowLeft, Save, ShieldCheck, AlertTriangle,
  Activity, CheckCircle2, User, Calendar, ShieldAlert, Check,
  Printer, Award, Download
} from 'lucide-react';
import SignatureCanvas from '../components/SignatureCanvas';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import {
  ArcFlashPermitData, calculateArcFlash, PPE_CATEGORY_DESCRIPTIONS
} from '../data/arcFlashData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function ArcFlashPermitForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const [permitNumber] = useState('ELEC-' + Date.now().toString().slice(-6));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [panelOrEquipmentTag, setPanelOrEquipmentTag] = useState('');
  const [substationOrLocation, setSubstationOrLocation] = useState(activeCompany?.name || '');
  const [nominalVoltageV, setNominalVoltageV] = useState<number>(380);
  const [isLiveWork, setIsLiveWork] = useState(true);

  // Parámetros de arco
  const [shortCircuitKa, setShortCircuitKa] = useState<number>(15);
  const [clearingTimeSeconds, setClearingTimeSeconds] = useState<number>(0.1);
  const [workingDistanceCm, setWorkingDistanceCm] = useState<number>(45);

  // Verificaciones Res. SRT 3068/14
  const [checklist, setChecklist] = useState({
    justificationLiveWorkDocumented: true,
    electricallySafeWorkConditionEvaluated: true,
    insulatedTools1000vInspected: true,
    dielectricGlovesClassVerified: true,
    voltageDetectorCalibrated: true,
    arcFlashSuitCertified: true,
    rescueHookAvailable: true,
    trainedPersonnelCertified: true
  });

  const [gloveClass, setGloveClass] = useState<any>('0');
  const [gloveLastTestDate, setGloveLastTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [leadElectrician, setLeadElectrician] = useState('');
  const [electricianLicense, setElectricianLicense] = useState('');
  const [safetySupervisor, setSafetySupervisor] = useState('');
  const [supervisorLicense, setSupervisorLicense] = useState('');
  const [plantManager, setPlantManager] = useState('');
  const [notes, setNotes] = useState('');
  const [electricianSig, setElectricianSig] = useState<string | null>(null);
  const [supervisorSig, setSupervisorSig] = useState<string | null>(null);
  const [plantManagerSig, setPlantManagerSig] = useState<string | null>(null);

  // Cálculo en tiempo real
  const calcResult = useMemo(() => {
    return calculateArcFlash(nominalVoltageV, shortCircuitKa, clearingTimeSeconds, workingDistanceCm);
  }, [nominalVoltageV, shortCircuitKa, clearingTimeSeconds, workingDistanceCm]);

  const checklistItems = [
    { k: 'justificationLiveWorkDocumented', label: 'Justificación formal de imposibilidad de desenergizar documentada', law: 'Res. SRT 3068/14 Art. 3' },
    { k: 'electricallySafeWorkConditionEvaluated', label: 'Evaluación de condición de trabajo eléctricamente segura completada', law: 'NFPA 70E Art. 120' },
    { k: 'insulatedTools1000vInspected', label: 'Herramientas de mano aisladas 1000V certificadas IRAM/IEC 60900', law: 'IRAM 2404 / IEC 60900' },
    { k: 'dielectricGlovesClassVerified', label: 'Guantes dieléctricos ensayados con protectores de cuero en uso', law: 'IRAM 3604 / ASTM D120' },
    { k: 'voltageDetectorCalibrated', label: 'Detector de tensión acústico/óptico verificado antes de iniciar', law: 'IEC 61243-1' },
    { k: 'arcFlashSuitCertified', label: 'Ropa y careta resistente al arco certificada según valor cal/cm²', law: 'NFPA 70E Tabla 130.7' },
    { k: 'rescueHookAvailable', label: 'Pértiga de rescate y salvamento dieléctrica accesible al pie', law: 'Res. SRT 3068/14 Art. 8' },
    { k: 'trainedPersonnelCertified', label: 'Personal electricista habilitado formalmente según Res. SRT 3068/14', law: 'Res. SRT 3068/14 Art. 4' }
  ];

  const totalChecks = checklistItems.length;
  const completedChecks = checklistItems.filter(item => (checklist as any)[item.k]).length;
  const allCompleted = completedChecks === totalChecks;

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !(prev as any)[key] }));
  };

  const ppeDesc = (PPE_CATEGORY_DESCRIPTIONS as any)[calcResult.category];

  // Función de impresión directa o descarga en PDF oficial
  const handlePrintPDF = (downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Encabezado Superior (Banner Cálido de Seguridad)
      doc.setFillColor(180, 83, 9); // Amber 700
      doc.rect(0, 0, pageWidth, 28, 'F');

      // Título y Normativa
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('PERMISO DE TRABAJO CON TENSIÓN Y RIESGO DE ARCO ELÉCTRICO', 14, 11);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Conforme a Normas NFPA 70E, IEEE 1584, Res. S.R.T. N° 3068/14 y Ley N° 19.587 (Dec. 351/79 Cap. 14)', 14, 18);
      doc.setFontSize(7.5);
      const companyHeader = activeCompany ? activeCompany.name + ' (CUIT: ' + activeCompany.cuit + ')' : 'Establecimiento Industrial';
      doc.text('Empresa: ' + companyHeader + ' | Fecha de Emisión: ' + date, 14, 24);

      // Datos de Control del Permiso
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('N° Permiso: ' + permitNumber, 14, 34);
      doc.text('Horario Autorizado: ' + startTime + ' a ' + endTime + ' hs', 120, 34);

      // Tabla 1: Parámetros del Tablero y Análisis de Energía Incidente
      const voltType = nominalVoltageV > 1000 ? 'Media Tensión' : 'Baja Tensión';
      const energyRisk = calcResult.incidentEnergy <= 1.2 ? 'Bajo Umbral 2° Grado' : 'Riesgo Térmico de Quemadura';
      const catLabel = calcResult.category === 'prohibited' ? 'TRABAJO PROHIBIDO (>40 cal/cm²)' : 'CATEGORÍA ' + calcResult.category;

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Parámetros Técnicos y del Circuito Eléctrico', 'Especificación y Valores Verificados']],
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: [
          ['Tablero / Celda / Equipo a Intervenir', panelOrEquipmentTag || 'No especificado'],
          ['Ubicación / Subestación / Nave', substationOrLocation || 'No especificado'],
          ['Tensión Nominal del Circuito', nominalVoltageV + ' V (' + voltType + ')'],
          ['Corriente de Cortocircuito Presunta (Icc)', shortCircuitKa + ' kA'],
          ['Tiempo de Despeje de Protecciones', clearingTimeSeconds + ' segundos'],
          ['Distancia de Trabajo Estimada', workingDistanceCm + ' cm'],
          ['ENERGÍA INCIDENTE CALCULADA', calcResult.incidentEnergy + ' cal/cm² (' + energyRisk + ')'],
          ['FRONTERA DE ARCO ELÉCTRICO (AFB)', calcResult.boundaryMeters + ' metros'],
          ['NIVEL DE EPP REQUERIDO', catLabel],
          ['Equipamiento de Protección Obligatorio', ppeDesc ? ppeDesc.desc : 'EPP ignífugo'],
          ['Guantes Dieléctricos Reglamentarios', 'Clase ' + gloveClass + ' | Último Ensayo Rigidez: ' + gloveLastTestDate + ' (< 6 meses)']
        ],
        bodyStyles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 112 }
        }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 6;

      // Tabla 2: Verificaciones Preventivas Res. SRT 3068/14
      autoTable(doc, {
        startY: currentY,
        theme: 'striped',
        head: [['Verificaciones Obligatorias Res. SRT 3068/14 y NFPA 70E', 'Norma Legal', 'Estado']],
        headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: checklistItems.map(item => [
          item.label,
          item.law,
          (checklist as any)[item.k] ? 'CUMPLE' : 'NO CUMPLE'
        ]),
        bodyStyles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 38, fontStyle: 'italic', textColor: [100, 116, 139] },
          2: { cellWidth: 24, fontStyle: 'bold', halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.column.index === 2 && data.cell.section === 'body') {
            if (data.cell.raw === 'CUMPLE') {
              data.cell.styles.textColor = [5, 150, 105];
            } else {
              data.cell.styles.textColor = [220, 38, 38];
            }
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;

      if (notes.trim()) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Instrucciones Particulares y Secuencia de Maniobra:', 14, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(notes.trim(), 14, currentY + 4, { maxWidth: 182 });
        currentY += 12;
      }

      // ==========================================
      // BLOQUE DE 3 FIRMAS REGLAMENTARIAS
      // ==========================================
      const sigY = Math.min(currentY + 16, pageHeight - 38);

      // Renderizar firmas digitales si están dibujadas
      if (electricianSig) {
        try {
          doc.addImage(electricianSig, 'PNG', 14, sigY - 14, 46, 13);
        } catch (e) {
          console.error('Error dibujando firma electricista en PDF:', e);
        }
      }
      if (supervisorSig) {
        try {
          doc.addImage(supervisorSig, 'PNG', 80, sigY - 14, 46, 13);
        } catch (e) {
          console.error('Error dibujando firma supervisor en PDF:', e);
        }
      }
      if (plantManagerSig) {
        try {
          doc.addImage(plantManagerSig, 'PNG', 146, sigY - 14, 46, 13);
        } catch (e) {
          console.error('Error dibujando firma emisor planta en PDF:', e);
        }
      }

      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      // Firma 1: Electricista Habilitado
      doc.line(14, sigY, 64, sigY);
      doc.setFont('helvetica', 'bold');
      doc.text(leadElectrician || 'Firma Electricista Habilitado', 14, sigY + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Electricista Habilitado Responsable', 14, sigY + 7.5);
      doc.text('Mat. / DNI: ' + (electricianLicense || '................................'), 14, sigY + 10.5);

      // Firma 2: Supervisor HyS
      doc.setFontSize(7.5);
      doc.line(80, sigY, 130, sigY);
      doc.setFont('helvetica', 'bold');
      doc.text(safetySupervisor || 'Firma Responsable HyS', 80, sigY + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Servicio de Higiene y Seguridad', 80, sigY + 7.5);
      doc.text('Mat. Prof. HyS: ' + (supervisorLicense || '................................'), 80, sigY + 10.5);

      // Firma 3: Autorizante de Planta
      doc.setFontSize(7.5);
      doc.line(146, sigY, 196, sigY);
      doc.setFont('helvetica', 'bold');
      doc.text(plantManager || 'Firma Emisor de Planta', 146, sigY + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Autorizante de Planta / Mantenimiento', 146, sigY + 7.5);
      doc.text('Operaciones / Producción', 146, sigY + 10.5);

      // ==========================================
      // PIE DE PÁGINA OFICIAL Y LEGAL
      // ==========================================
      const footerY = pageHeight - 8;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, footerY - 3, pageWidth - 14, footerY - 3);

      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Documento operacional oficial según Res. SRT N° 3068/14, NFPA 70E y Dec. 351/79 Cap. 14. Prohibida la maniobra sin las 3 firmas autorizantes.',
        14,
        footerY
      );
      doc.text(
        'Pág. 1 de 1 • Emitido: ' + new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR'),
        pageWidth - 14,
        footerY,
        { align: 'right' }
      );

      const sanitizedTag = (panelOrEquipmentTag || 'Equipo').replace(/\s+/g, '_');
      const fileName = 'Permiso_Arco_Electrico_' + permitNumber + '_' + sanitizedTag + '.pdf';

      if (downloadOnly) {
        doc.save(fileName);
        toast.success('Permiso descargado en PDF correctamente');
      } else {
        // Direct print dialog: trigger browser native print preview without downloading
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
            } catch (err) {
              console.error('Error al imprimir iframe, abriendo pestaña de impresión:', err);
              const win = window.open(blobUrl, '_blank');
              if (win) win.focus();
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

    if (!panelOrEquipmentTag.trim() || !leadElectrician.trim() || !safetySupervisor.trim()) {
      toast.error('Completa los campos requeridos (Tablero, Electricista y Supervisor HyS).');
      return;
    }

    if (calcResult.category === 'prohibited') {
      toast.error('¡Peligro extremo! La energía excede 40 cal/cm². La norma prohíbe el trabajo con tensión.');
      return;
    }

    const newPermit: ArcFlashPermitData = {
      id: 'af_' + Date.now(),
      companyId: activeCompany?.id,
      permitNumber,
      date,
      startTime,
      endTime,
      panelOrEquipmentTag,
      substationOrLocation,
      nominalVoltageV,
      isLiveWork,
      shortCircuitKa,
      clearingTimeSeconds,
      workingDistanceCm,
      calculatedIncidentEnergyCalCm2: calcResult.incidentEnergy,
      arcFlashBoundaryMeters: calcResult.boundaryMeters,
      ppeCategory: calcResult.category,
      checklist,
      gloveClass,
      gloveLastTestDate,
      leadElectrician,
      safetySupervisor,
      electricianLicense: electricianLicense.trim() || undefined,
      supervisorLicense: supervisorLicense.trim() || undefined,
      plantManager: plantManager.trim() || undefined,
      electricianSignature: electricianSig,
      supervisorSignature: supervisorSig,
      plantManagerSignature: plantManagerSig,
      status: 'active',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem('arc_flash_permits_db');
    let list: ArcFlashPermitData[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (err) {}
    }
    list.unshift(newPermit);
    localStorage.setItem('arc_flash_permits_db', JSON.stringify(list));

    toast.success('Permiso eléctrico emitido exitosamente');
    navigate('/arc-flash');
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Nuevo Permiso con Tensión / Arc Flash"
          subtitle="Evaluación de energía incidente, frontera de arco eléctrico y categoría de EPP bajo NFPA 70E"
          badge="NFPA 70E & Res. SRT 3068/14"
          icon={<Zap size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)"
          onBack={() => navigate('/arc-flash')}
        />

        <div className="max-w-4xl mx-auto w-full px-2 sm:px-4 mt-6">
          {/* Barra Superior con botón Volver y botón Imprimir PDF Rápido */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/arc-flash')}
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
              <ArrowLeft size={16} /> Volver a permisos de arco eléctrico
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
                BLOQUE 1: Identificación del Equipo Eléctrico y Horario
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Zap size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    1. Identificación del Equipo Eléctrico y Horario
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Datos del tablero o celda a intervenir y horario habilitado
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

                <div className="sm:col-span-2 md:col-span-1">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Tablero / Celda / Equipo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. TGBT-01, Celda C-3 MT"
                    value={panelOrEquipmentTag}
                    onChange={e => setPanelOrEquipmentTag(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-2">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Subestación / Sector de Planta
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Subestación Transformadora N° 2 - Nave Principal"
                    value={substationOrLocation}
                    onChange={e => setSubstationOrLocation(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 2: Calculadora Arc Flash IEEE 1584 / NFPA 70E
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Activity size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    2. Calculadora de Energía Incidente de Arco Eléctrico (NFPA 70E / IEEE 1584)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Parámetros del cortocircuito y tiempo de despeje para determinar el nivel de protección
                  </p>
                </div>
              </div>

              {/* 4 Inputs de la fórmula */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Tensión (V)
                  </label>
                  <input
                    type="number"
                    value={nominalVoltageV}
                    onChange={e => setNominalVoltageV(Number(e.target.value))}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-extrabold px-3 py-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Ej. 380V (BT) ó 13200V</span>
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Cortocircuito (kA)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={shortCircuitKa}
                    onChange={e => setShortCircuitKa(parseFloat(e.target.value) || 0)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-extrabold px-3 py-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Icc presunta en barras</span>
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Apertura (seg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={clearingTimeSeconds}
                    onChange={e => setClearingTimeSeconds(parseFloat(e.target.value) || 0)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-extrabold px-3 py-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Tiempo disparo relé/fusible</span>
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Distancia (cm)
                  </label>
                  <input
                    type="number"
                    value={workingDistanceCm}
                    onChange={e => setWorkingDistanceCm(Number(e.target.value))}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-extrabold px-3 py-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">45 cm (BT) / 90 cm (MT)</span>
                </div>
              </div>

              {/* Tarjeta de Resultados de Alta Legibilidad */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #f59e0b',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.12)'
                }}
                className="p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span style={{ color: '#92400e' }} className="text-xs font-extrabold uppercase tracking-wider">
                      Resultado del Análisis de Arco Eléctrico (IEEE 1584 / NFPA 70E)
                    </span>
                  </div>
                  <span
                    style={{
                      backgroundColor: calcResult.category === 'prohibited' ? '#fee2e2' : '#fef3c7',
                      color: calcResult.category === 'prohibited' ? '#991b1b' : '#92400e',
                      border: '1px solid currentColor'
                    }}
                    className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                  >
                    {calcResult.category === 'prohibited' ? '⛔ TRABAJO PROHIBIDO' : 'CATEGORÍA ' + calcResult.category}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Energía Incidente */}
                  <div
                    style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
                    className="p-4 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span style={{ color: '#78350f' }} className="block text-[11px] font-bold uppercase tracking-wider">
                        Energía Incidente Calculada
                      </span>
                      <div style={{ color: '#b45309' }} className="text-3xl font-black mt-1">
                        {calcResult.incidentEnergy} <span className="text-base font-bold">cal/cm²</span>
                      </div>
                      <span style={{ color: '#92400e' }} className="text-[11px] font-medium block mt-0.5">
                        {calcResult.incidentEnergy <= 1.2 ? 'Por debajo del umbral de quemadura de 2° grado' : 'Requiere protección térmica ignífuga'}
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-lg">
                      🔥
                    </div>
                  </div>

                  {/* Frontera de Arco */}
                  <div
                    style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                    className="p-4 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span style={{ color: '#14532d' }} className="block text-[11px] font-bold uppercase tracking-wider">
                        Frontera de Arco (Límite 1.2 cal/cm²)
                      </span>
                      <div style={{ color: '#15803d' }} className="text-3xl font-black mt-1">
                        {calcResult.boundaryMeters} <span className="text-base font-bold">metros</span>
                      </div>
                      <span style={{ color: '#166534' }} className="text-[11px] font-medium block mt-0.5">
                        Distancia mínima sin EPP ignífugo
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      🛡️
                    </div>
                  </div>
                </div>

                {/* Especificación de EPP requerida */}
                <div
                  style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                  className="p-4 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#0f172a' }} className="text-xs font-black uppercase tracking-wider">
                      Equipamiento de Protección Personal (EPP) Requerido:
                    </span>
                  </div>
                  <p style={{ color: '#1e293b' }} className="text-xs font-semibold leading-relaxed m-0">
                    {ppeDesc?.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 3: Medidas Obligatorias Res. SRT 3068/14 y NFPA 70E
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                      3. Medidas Obligatorias Res. SRT 3068/14 y NFPA 70E
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                      Verificación obligatoria de las 8 condiciones de seguridad previas a la maniobra
                    </p>
                  </div>
                </div>

                {/* Live Verification Counter Badge */}
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

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: ((completedChecks / totalChecks) * 100) + '%',
                    backgroundColor: allCompleted ? '#10b981' : '#f59e0b'
                  }}
                />
              </div>

              {/* Lista Interactiva de Checklist Res. 3068/14 */}
              <div className="space-y-3">
                {checklistItems.map(item => {
                  const isChecked = Boolean((checklist as any)[item.k]);

                  return (
                    <div
                      key={item.k}
                      onClick={() => toggleCheck(item.k)}
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
                      {/* Check icon + text */}
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
                          <p
                            style={{
                              color: isChecked ? '#064e3b' : '#1e293b',
                              fontWeight: isChecked ? 800 : 600,
                              fontSize: '13px',
                              margin: 0,
                              lineHeight: 1.4
                            }}
                          >
                            {item.label}
                          </p>
                          <span
                            style={{ color: isChecked ? '#059669' : '#94a3b8', fontSize: '11px', fontWeight: 600 }}
                            className="block mt-0.5"
                          >
                            Norma aplicable: {item.law}
                          </span>
                        </div>
                      </div>

                      {/* Right Status Badge */}
                      <div className="flex-shrink-0">
                        <span
                          style={{
                            backgroundColor: isChecked ? '#d1fae5' : '#f1f5f9',
                            color: isChecked ? '#047857' : '#64748b',
                            border: isChecked ? '1px solid #86efac' : '1px solid #cbd5e1',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isChecked ? '✓ Cumple' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Guantes y ensayo de rigidez */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Clase de Guantes Dieléctricos
                  </label>
                  <select
                    value={gloveClass}
                    onChange={e => setGloveClass(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  >
                    <option value="00">Clase 00 (Hasta 500 V)</option>
                    <option value="0">Clase 0 (Hasta 1.000 V)</option>
                    <option value="1">Clase 1 (Hasta 7.500 V)</option>
                    <option value="2">Clase 2 (Hasta 17.000 V)</option>
                    <option value="3">Clase 3 (Hasta 26.500 V)</option>
                    <option value="4">Clase 4 (Hasta 36.000 V)</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Fecha Último Ensayo Rigidez Dieléctrica (&lt; 6 meses)
                  </label>
                  <input
                    type="date"
                    value={gloveLastTestDate}
                    onChange={e => setGloveLastTestDate(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 4: Personal Habilitado, Autorizaciones y Firmas
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Award size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    4. Personal Habilitado, Autorizaciones y Firmas
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Validación formal de los tres responsables obligatorios para el documento PDF
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Electricista */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <User size={16} className="text-blue-600" />
                    1. Electricista Habilitado
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={leadElectrician}
                      onChange={e => setLeadElectrician(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">Matrícula / DNI</label>
                    <input
                      type="text"
                      placeholder="Ej. Mat. COPIME 12345"
                      value={electricianLicense}
                      onChange={e => setElectricianLicense(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                </div>

                {/* Supervisor HyS */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    2. Responsable HyS
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">Nombre Profesional *</label>
                    <input
                      type="text"
                      placeholder="Ej. Ing. Carlos Gómez"
                      value={safetySupervisor}
                      onChange={e => setSafetySupervisor(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">Matrícula HyS (Ley 19.587)</label>
                    <input
                      type="text"
                      placeholder="Ej. MP HyS N° 9876"
                      value={supervisorLicense}
                      onChange={e => setSupervisorLicense(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                </div>

                {/* Autorizante de Planta */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <CheckCircle2 size={16} className="text-purple-600" />
                    3. Emisor de Planta
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">Jefe Mant. / Operaciones</label>
                    <input
                      type="text"
                      placeholder="Ej. Roberto Díaz"
                      value={plantManager}
                      onChange={e => setPlantManager(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">Sector / Área</label>
                    <input
                      type="text"
                      placeholder="Ej. Jefatura de Mantenimiento"
                      defaultValue="Mantenimiento Eléctrico"
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Instrucciones Particulares de Maniobra
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Secuencia de apertura de seccionadores, colocación de candados LOTO, uso de tapetes dieléctricos o precauciones con terceros..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Vista Previa del Pie de Página Legal y Firmas */}
              <div
                style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}
                className="p-4 rounded-xl space-y-3"
              >
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Vista Previa del Bloque de Firmas y Pie de Página en el Documento PDF:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600">
                  <div className="border-t border-slate-300 pt-2 flex flex-col items-center">
                    {electricianSig ? (
                      <img src={electricianSig} alt="Firma Electricista" className="h-9 object-contain mb-1" />
                    ) : (
                      <div className="h-9 flex items-center justify-center text-slate-300 italic text-[9px]">(Pendiente de firma)</div>
                    )}
                    <span className="font-bold block">{leadElectrician || 'Firma Electricista Habilitado'}</span>
                    <span className="text-slate-400">Responsable Ejecutante</span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex flex-col items-center">
                    {supervisorSig ? (
                      <img src={supervisorSig} alt="Firma HyS" className="h-9 object-contain mb-1" />
                    ) : (
                      <div className="h-9 flex items-center justify-center text-slate-300 italic text-[9px]">(Pendiente de firma)</div>
                    )}
                    <span className="font-bold block">{safetySupervisor || 'Firma Responsable HyS'}</span>
                    <span className="text-slate-400">Supervisión Técnica Res. 3068/14</span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex flex-col items-center">
                    {plantManagerSig ? (
                      <img src={plantManagerSig} alt="Firma Emisor" className="h-9 object-contain mb-1" />
                    ) : (
                      <div className="h-9 flex items-center justify-center text-slate-300 italic text-[9px]">(Pendiente de firma)</div>
                    )}
                    <span className="font-bold block">{plantManager || 'Firma Emisor de Planta'}</span>
                    <span className="text-slate-400">Autorización Operativa</span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 border-t border-slate-200 pt-2 flex justify-between">
                  <span>Resolución S.R.T. N° 3068/2014 • NFPA 70E • Dec. 351/79 Cap. 14</span>
                  <span>Pág. 1 de 1 • Validez 24 hs</span>
                </div>
              </div>
            </div>

            {/* ========================================================
                Botones de Envío y Botón de Imprimir PDF
               ======================================================== */}
            <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 dark:border-slate-700 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/arc-flash')}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  minHeight: 'unset'
                }}
              >
                Cancelar
              </button>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Botón Imprimir (Abre diálogo nativo del navegador) */}
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
                  <span>Emitir Permiso</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
}
