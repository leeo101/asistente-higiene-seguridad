import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pickaxe, ArrowLeft, Save, AlertTriangle,
  ShieldCheck, CheckCircle2, Check, Printer, Download
} from 'lucide-react';
import SignatureCanvas from '../components/SignatureCanvas';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import {
  ExcavationPermitData, SOIL_TYPES_INFO
} from '../data/excavationData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function ExcavationSafetyForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const [permitNumber] = useState(`EXC-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [projectOrSite, setProjectOrSite] = useState(activeCompany?.name || '');
  const [depthMeters, setDepthMeters] = useState<number>(1.5);
  const [widthMeters, setWidthMeters] = useState<number>(1.0);
  const [lengthMeters, setLengthMeters] = useState<number>(10.0);
  const [soilType, setSoilType] = useState<'A' | 'B' | 'C'>('B');
  const [shoringType, setShoringType] = useState<any>('trench_box');

  const [checklist, setChecklist] = useState({
    soilClassificationVerified: true,
    utilitiesLocated: true,
    spoilDistance1m: true,
    safeAccessLadders7m: true,
    machineryDistanceSafe: true,
    perimeterBarricades: true,
    atmosphereTested: false,
    waterControlInstalled: false
  });

  const [competentPersonName, setCompetentPersonName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [notes, setNotes] = useState('');

  const [competentSig, setCompetentSig] = useState<string | null>(null);
  const [supervisorSig, setSupervisorSig] = useState<string | null>(null);
  const [operatorSig, setOperatorSig] = useState<string | null>(null);

  const isDeep = depthMeters > 1.20;
  const soilInfo = SOIL_TYPES_INFO[soilType];

  const checklistItems = [
    { key: 'utilitiesLocated', label: 'Interferencias subterráneas sondeadas (Gas, Luz, Agua)', desc: 'Planos consultados y cateos manuales realizados antes de ingresar retroexcavadora.', law: 'Dec. 911/96 Art. 140' },
    { key: 'spoilDistance1m', label: 'Acopio de tierra a más de 1.00 metro del borde superior', desc: 'Previene sobrecarga en la cresta del talud y caída de piedras al fondo de la zanja.', law: 'Dec. 911/96 Art. 143' },
    { key: 'safeAccessLadders7m', label: 'Escaleras reglamentarias de egreso rápido cada 7.50 metros', desc: 'Sobresaliendo 1.00 m por encima del nivel del terreno y firmemente sujetas.', law: 'Dec. 911/96 Art. 147' },
    { key: 'machineryDistanceSafe', label: 'Distancia de seguridad para maquinaria pesada / camiones', desc: 'Evita colapso por peso o vibración en cercanías del borde de excavación.', law: 'Res. SRT 550/11' },
    { key: 'perimeterBarricades', label: 'Vallado perimetral rígido y señalización reflectiva', desc: 'Protección perimetral continua contra caídas de personas y vehículos al pozo.', law: 'Dec. 911/96 Art. 145' },
    { key: 'atmosphereTested', label: 'Monitoreo de atmósfera en zanja profunda (> 1.20m)', desc: 'Verificación de O2, gases explosivos y monóxido en caso de tuberías subterráneas.', law: 'Dec. 911/96 Art. 150' }
  ];

  const totalChecks = checklistItems.length;
  const completedChecks = checklistItems.filter(item => (checklist as any)[item.key]).length;
  const allCompleted = completedChecks === totalChecks;

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !(prev as any)[key] }));
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
      doc.text('PERMISO DE EXCAVACIONES Y ZANJAS SEGURAS', 14, 11);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Conforme a Decreto 911/96 Cap. 10, Res. S.R.T. 550/11 y Ley 19.587 de Higiene y Seguridad', 14, 18);
      doc.setFontSize(7.5);
      const companyHeader = activeCompany ? activeCompany.name + ' (CUIT: ' + activeCompany.cuit + ')' : (projectOrSite || 'Obra en Construcción');
      doc.text('Empresa / Obra: ' + companyHeader + ' | Fecha de Habilitación: ' + date, 14, 24);

      // Metadatos
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('N° Permiso: ' + permitNumber, 14, 34);
      doc.text('Ubicación: ' + (location || 'Frente de obra principal'), 120, 34);

      // Tabla de Parámetros Geotécnicos
      const shoringNames: Record<string, string> = {
        trench_box: 'Caja Metálica Blindada (Trench Box)',
        timber_shoring: 'Entibado de Madera Continuo con Puntales',
        sheet_piling: 'Tablestacado Metálico Hincado',
        hydraulic: 'Entibado Hidráulico de Aluminio',
        sloped_only: 'Talud a 45° / 34° sin entibado'
      };

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Parámetros Geotécnicos y Dimensiones', 'Especificación y Controles en Terreno']],
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: [
          ['Profundidad Máxima de Excavación', depthMeters + ' metros (' + (isDeep ? 'Profunda: Requiere entibado obligatorio' : 'Superficial') + ')'],
          ['Ancho de Zanja / Longitud Estimada', widthMeters + ' m ancho x ' + lengthMeters + ' m longitud'],
          ['Tipo de Suelo Clasificado', 'Tipo ' + soilType + ' (' + soilInfo.name + ' - Talud máximo: ' + soilInfo.maxSlope + ')'],
          ['Sistema de Protección de Zanja', shoringNames[shoringType] || shoringType],
          ['Exigencia Legal de Entibado', isDeep ? 'EXIGIDO POR RES. SRT 550/11 Y DEC. 911/96 ART. 142' : 'Exento por profundidad < 1.20m']
        ],
        bodyStyles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 112 }
        }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 6;

      // Tabla de Verificaciones Críticas
      const checkRows = checklistItems.map(item => [
        item.label,
        item.law,
        (checklist as any)[item.key] ? 'VERIFICADO CONFORME' : 'NO CUMPLE / PENDIENTE'
      ]);

      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        head: [['Puntos Críticos de Verificación en Terreno', 'Normativa Aplicable', 'Estado']],
        headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: checkRows,
        bodyStyles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          0: { cellWidth: 105 },
          1: { cellWidth: 42, fontStyle: 'italic' },
          2: { cellWidth: 35, fontStyle: 'bold' }
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

      if (competentSig) {
        try { doc.addImage(competentSig, 'PNG', 14, currentY, sigBoxWidth, sigHeight); } catch {}
      }
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(14, currentY + sigHeight + 1, 14 + sigBoxWidth, currentY + sigHeight + 1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(competentPersonName || 'Persona Competente Suelos', 14, currentY + sigHeight + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Especialista Geotécnico / HyS', 14, currentY + sigHeight + 8.5);

      if (supervisorSig) {
        try { doc.addImage(supervisorSig, 'PNG', 77, currentY, sigBoxWidth, sigHeight); } catch {}
      }
      doc.line(77, currentY + sigHeight + 1, 77 + sigBoxWidth, currentY + sigHeight + 1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(supervisorName || 'Supervisor / Capataz de Obra', 77, currentY + sigHeight + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Supervisión de Obra y Excavación', 77, currentY + sigHeight + 8.5);

      if (operatorSig) {
        try { doc.addImage(operatorSig, 'PNG', 140, currentY, sigBoxWidth, sigHeight); } catch {}
      }
      doc.line(140, currentY + sigHeight + 1, 140 + sigBoxWidth, currentY + sigHeight + 1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(operatorName || 'Operador de Maquinaria', 140, currentY + sigHeight + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Maquinista Retroexcavadora', 140, currentY + sigHeight + 8.5);

      // Pie de Página
      const footerY = pageHeight - 8;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, footerY - 3, pageWidth - 14, footerY - 3);

      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Documento operacional según Dec. 911/96 Cap. 10 y Res. SRT 550/11. Prohibido iniciar sin verificación de entibado.',
        14,
        footerY
      );
      doc.text(
        'Pág. 1 de 1 • Emitido: ' + new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR'),
        pageWidth - 14,
        footerY,
        { align: 'right' }
      );

      const fileName = 'Permiso_Excavacion_' + permitNumber + '.pdf';

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

        toast.success('Abriendo ventana de impresión del permiso...');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el documento PDF');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.trim() || !competentPersonName.trim() || !supervisorName.trim()) {
      toast.error('Completa los campos obligatorios (Ubicación, Persona Competente y Supervisor).');
      return;
    }

    if (isDeep && shoringType === 'sloped_only' && (soilType === 'C')) {
      toast.error('En suelo Tipo C y excavaciones profundas no se permite talud sin entibado.');
      return;
    }

    const newPermit: ExcavationPermitData = {
      id: `exc_${Date.now()}`,
      companyId: activeCompany?.id,
      permitNumber,
      date,
      location,
      projectOrSite,
      depthMeters,
      widthMeters,
      lengthMeters,
      soilType,
      slopeRatio: soilInfo.maxSlope,
      shoringType,
      requiresShoring: isDeep,
      checklist,
      operatorName,
      supervisorName,
      competentPersonName,
      competentPersonSignature: competentSig || undefined,
      supervisorSignature: supervisorSig || undefined,
      operatorSignature: operatorSig || undefined,
      status: 'active',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem('excavation_permits_db');
    let list: ExcavationPermitData[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (err) {}
    }
    list.unshift(newPermit);
    localStorage.setItem('excavation_permits_db', JSON.stringify(list));

    toast.success('Permiso de excavación emitido exitosamente');
    navigate('/excavations');
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Nuevo Permiso de Excavación y Zanjas"
          subtitle="Habilitación diaria de seguridad, cálculo geotécnico de talud y entibados reglamentarios"
          badge="Dec. 911/96 Cap. 10 & Res. SRT 550/11"
          icon={<Pickaxe size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/excavations')}
        />

        <div className="max-w-4xl mx-auto w-full px-2 sm:px-4 mt-6">
          {/* Barra Superior con botón Volver y botones Imprimir / Descargar PDF */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/excavations')}
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
              <ArrowLeft size={16} /> Volver a permisos de excavación
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
                BLOQUE 1: Datos de la Excavación y Localización
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Pickaxe size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    1. Datos de la Excavación y Localización
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Identificación de la zanja o pozo, fecha de habilitación y obra
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
                    Fecha de Habilitación *
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

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Obra / Proyecto
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre de la obra o planta"
                    value={projectOrSite}
                    onChange={e => setProjectOrSite(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Ubicación Exacta de la Zanja / Pozo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Frente de obra manzana 4, traza de cañería de gas sector Este"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 2: Dimensiones y Clasificación de Suelo
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    2. Dimensiones y Clasificación Geotécnica de Suelo
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Cálculo de estabilidad, ángulo de reposo y exigencia reglamentaria de entibado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Profundidad Máxima (metros) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    value={depthMeters}
                    onChange={e => setDepthMeters(parseFloat(e.target.value) || 0)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-bold px-3 py-2.5 border rounded-xl focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Ancho de la Zanja (metros)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    value={widthMeters}
                    onChange={e => setWidthMeters(parseFloat(e.target.value) || 0)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-bold px-3 py-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Longitud Estimada (metros)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={lengthMeters}
                    onChange={e => setLengthMeters(parseFloat(e.target.value) || 0)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-bold px-3 py-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-2 uppercase tracking-wider dark:text-slate-300">
                    Tipo de Suelo (Clasificación Geotécnica OSHA / Dec. 911/96)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(['A', 'B', 'C'] as const).map(t => {
                      const isSelected = soilType === t;
                      return (
                        <div
                          key={t}
                          onClick={() => setSoilType(t)}
                          style={{
                            backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                            border: isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span style={{ color: isSelected ? '#1e3a8a' : '#0f172a', fontWeight: 800 }} className="text-xs">
                              Suelo Tipo {t}
                            </span>
                            <span
                              style={{
                                backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9',
                                color: isSelected ? '#1d4ed8' : '#475569',
                                fontWeight: 800,
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '6px'
                              }}
                            >
                              Talud: {SOIL_TYPES_INFO[t].maxSlope}
                            </span>
                          </div>
                          <p style={{ color: '#475569', fontSize: '11px', lineHeight: 1.4, margin: 0 }}>
                            {SOIL_TYPES_INFO[t].description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Alerta de exigencia normativa con alto contraste */}
              <div
                style={{
                  backgroundColor: isDeep ? '#fef3c7' : '#ecfdf5',
                  border: isDeep ? '2px solid #f59e0b' : '2px solid #10b981',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                {isDeep ? (
                  <AlertTriangle style={{ color: '#b45309', flexShrink: 0, marginTop: '2px' }} size={22} />
                ) : (
                  <CheckCircle2 style={{ color: '#047857', flexShrink: 0, marginTop: '2px' }} size={22} />
                )}
                <div>
                  <strong style={{ color: isDeep ? '#78350f' : '#064e3b', fontSize: '13px', display: 'block' }}>
                    {isDeep
                      ? 'Exigencia Reglamentaria: Profundidad > 1.20 metros'
                      : 'Profundidad Menor a 1.20 metros (Superficial)'}
                  </strong>
                  <p style={{ color: isDeep ? '#92400e' : '#047857', fontSize: '12px', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                    {isDeep
                      ? `Bajo el Decreto 911/96 Art. 142 y Res. SRT 550/11, toda excavación superior a 1.20 m exige entibamiento continuo, tablestacado, caja metálica blindada o un talud con pendiente máxima de ${soilInfo.maxSlope}.`
                      : 'Zanja superficial exenta de entibado obligatorio salvo que existan vibraciones de tránsito pesado o falta de cohesión en las paredes.'}
                  </p>
                </div>
              </div>

              {isDeep && (
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Sistema de Protección o Entibado a Utilizar *
                  </label>
                  <select
                    value={shoringType}
                    onChange={e => setShoringType(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  >
                    <option value="trench_box">Caja de Zanja Metálica Blindada (Trench Box)</option>
                    <option value="timber_shoring">Entibado de Madera Continuo con Puntales</option>
                    <option value="sheet_piling">Tablestacado Metálico Hincado</option>
                    <option value="hydraulic">Entibado Hidráulico de Aluminio</option>
                    <option value="sloped_only">Talud a 45° / 34° sin entibado</option>
                  </select>
                </div>
              )}
            </div>

            {/* ========================================================
                BLOQUE 3: Verificaciones de Seguridad Críticas en Terreno
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                      3. Verificaciones de Seguridad Críticas en Terreno
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                      Control operativo preventivo según Decreto 911/96 y Res. SRT 550/11
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

              {/* Lista Interactiva de Puntos Críticos (Estilo Arco Eléctrico) */}
              <div className="space-y-3">
                {checklistItems.map(item => {
                  const isChecked = Boolean((checklist as any)[item.key]);

                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleCheck(item.key)}
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
                          <p
                            style={{
                              color: isChecked ? '#047857' : '#475569',
                              fontSize: '11px',
                              margin: '2px 0 0 0',
                              lineHeight: 1.4
                            }}
                          >
                            {item.desc}
                          </p>
                          <span
                            style={{ color: isChecked ? '#059669' : '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}
                            className="block mt-1 font-mono"
                          >
                            Norma: {item.law}
                          </span>
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
            </div>

            {/* ========================================================
                BLOQUE 4: Personal Responsable y Firmas Digitales
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    4. Personal Responsable y Firmas de Habilitación
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Autorización de la maniobra y firmas digitales de los 3 responsables
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Persona Competente en Suelos *
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre y Apellido"
                    value={competentPersonName}
                    onChange={e => setCompetentPersonName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Supervisor de Obra / Capataz *
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del supervisor"
                    value={supervisorName}
                    onChange={e => setSupervisorName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Operador Maquinista
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del maquinista"
                    value={operatorName}
                    onChange={e => setOperatorName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Observaciones Técnicas Adicionales
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Condiciones climáticas, proximidad de lluvias, vibraciones cercanas o turnos especiales..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs px-3 py-2 border rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Firmas Digitales en Pantalla */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <span style={{ color: '#0f172a' }} className="block text-xs font-extrabold uppercase tracking-wider mb-4">
                  Firmas Digitales de Autorización (Pantalla Táctil / Mouse):
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SignatureCanvas
                    title="Firma Persona Competente"
                    onSave={setCompetentSig}
                    initialImage={competentSig || undefined}
                  />
                  <SignatureCanvas
                    title="Firma Supervisor de Obra"
                    onSave={setSupervisorSig}
                    initialImage={supervisorSig || undefined}
                  />
                  <SignatureCanvas
                    title="Firma Operador Maquinista"
                    onSave={setOperatorSig}
                    initialImage={operatorSig || undefined}
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
                onClick={() => navigate('/excavations')}
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
