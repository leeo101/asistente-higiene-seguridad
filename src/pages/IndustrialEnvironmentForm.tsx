import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory, ArrowLeft, Save, Wind, Droplets,
  AlertTriangle, CheckCircle2, FileText, Info,
  Printer, Download, ShieldCheck
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import SignatureCanvas from '../components/SignatureCanvas';
import {
  EmissionSampleRecord, LEGAL_LIMITS
} from '../data/industrialEnvironmentData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function IndustrialEnvironmentForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const [reportNumber] = useState(`AMB-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sampleType, setSampleType] = useState<'gas_emission' | 'liquid_effluent'>('gas_emission');
  const [pointName, setPointName] = useState('');
  const [laboratoryName, setLaboratoryName] = useState('');
  const [sampleProtocolNumber, setSampleProtocolNumber] = useState('');
  const [responsibleAuditor, setResponsibleAuditor] = useState('');
  const [notes, setNotes] = useState('');
  const [auditorSig, setAuditorSig] = useState<string | null>(null);

  // Parámetros Gases
  const [particulateMatter, setParticulateMatter] = useState<number>(45);
  const [coPpm, setCoPpm] = useState<number>(120);
  const [noxMgNm3, setNoxMgNm3] = useState<number>(180);
  const [so2MgNm3, setSo2MgNm3] = useState<number>(65);
  const [gasFlowM3H, setGasFlowM3H] = useState<number>(3500);
  const [gasTempC, setGasTempC] = useState<number>(140);

  // Parámetros Líquidos
  const [ph, setPh] = useState<number>(7.2);
  const [tempC, setTempC] = useState<number>(24);
  const [dbo5MgL, setDbo5MgL] = useState<number>(85);
  const [dqoMgL, setDqoMgL] = useState<number>(220);
  const [oilsAndGreaseMgL, setOilsAndGreaseMgL] = useState<number>(18);
  const [settleableSolidsMlL, setSettleableSolidsMlL] = useState<number>(0.4);
  const [dailyFlowM3Day, setDailyFlowM3Day] = useState<number>(45);
  const [dischargeDestination, setDischargeDestination] = useState<any>('cloaca');

  // Evaluación de cumplimiento
  let isCompliant = true;
  if (sampleType === 'gas_emission') {
    if (
      particulateMatter > LEGAL_LIMITS.gas.pmMax ||
      coPpm > LEGAL_LIMITS.gas.coMax ||
      noxMgNm3 > LEGAL_LIMITS.gas.noxMax ||
      so2MgNm3 > LEGAL_LIMITS.gas.so2Max
    ) {
      isCompliant = false;
    }
  } else {
    if (
      ph < LEGAL_LIMITS.liquid.phMin ||
      ph > LEGAL_LIMITS.liquid.phMax ||
      tempC > LEGAL_LIMITS.liquid.tempMax ||
      dbo5MgL > LEGAL_LIMITS.liquid.dbo5Max ||
      dqoMgL > LEGAL_LIMITS.liquid.dqoMax ||
      oilsAndGreaseMgL > LEGAL_LIMITS.liquid.oilsMax ||
      settleableSolidsMlL > LEGAL_LIMITS.liquid.settleableMax
    ) {
      isCompliant = false;
    }
  }

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
      doc.text('PROTOCOLO DE MONITOREO AMBIENTAL INDUSTRIAL', 14, 11);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Conforme a Ley General del Ambiente 25.675, Ley 20.284 de Aire y Dec. Reglamentarios de Efluentes', 14, 18);
      doc.setFontSize(7.5);
      const companyHeader = activeCompany ? activeCompany.name + ' (CUIT: ' + activeCompany.cuit + ')' : 'Establecimiento Industrial';
      doc.text('Empresa: ' + companyHeader + ' | Fecha de Monitoreo: ' + date, 14, 24);

      // Metadatos
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('N° Protocolo: ' + reportNumber, 14, 34);
      doc.text('Laboratorio: ' + (laboratoryName || 'Interno / Homologado'), 90, 34);
      doc.text('Punto de Muestreo: ' + (pointName || 'Planta Principal'), 145, 34);

      // Tabla de Parámetros
      const isGas = sampleType === 'gas_emission';
      const tableRows = isGas ? [
        ['Material Particulado (MP)', particulateMatter + ' mg/Nm³', LEGAL_LIMITS.gas.pmMax + ' mg/Nm³', particulateMatter <= LEGAL_LIMITS.gas.pmMax ? 'CONFORME' : 'EXCEDIDO'],
        ['Monóxido de Carbono (CO)', coPpm + ' ppm', LEGAL_LIMITS.gas.coMax + ' ppm', coPpm <= LEGAL_LIMITS.gas.coMax ? 'CONFORME' : 'EXCEDIDO'],
        ['Óxidos de Nitrógeno (NOx)', noxMgNm3 + ' mg/Nm³', LEGAL_LIMITS.gas.noxMax + ' mg/Nm³', noxMgNm3 <= LEGAL_LIMITS.gas.noxMax ? 'CONFORME' : 'EXCEDIDO'],
        ['Dióxido de Azufre (SO2)', so2MgNm3 + ' mg/Nm³', LEGAL_LIMITS.gas.so2Max + ' mg/Nm³', so2MgNm3 <= LEGAL_LIMITS.gas.so2Max ? 'CONFORME' : 'EXCEDIDO'],
        ['Caudal y Temperatura de Emisión', gasFlowM3H + ' m³/h', gasTempC + ' °C', 'PARÁMETRO OPERATIVO']
      ] : [
        ['Potencial Hidrógeno (pH)', String(ph), LEGAL_LIMITS.liquid.phMin + ' - ' + LEGAL_LIMITS.liquid.phMax, (ph >= LEGAL_LIMITS.liquid.phMin && ph <= LEGAL_LIMITS.liquid.phMax) ? 'CONFORME' : 'EXCEDIDO'],
        ['Demanda Bioquímica Oxígeno (DBO5)', dbo5MgL + ' mg/L', '< ' + LEGAL_LIMITS.liquid.dbo5Max + ' mg/L', dbo5MgL <= LEGAL_LIMITS.liquid.dbo5Max ? 'CONFORME' : 'EXCEDIDO'],
        ['Demanda Química Oxígeno (DQO)', dqoMgL + ' mg/L', '< ' + LEGAL_LIMITS.liquid.dqoMax + ' mg/L', dqoMgL <= LEGAL_LIMITS.liquid.dqoMax ? 'CONFORME' : 'EXCEDIDO'],
        ['Sustancias Solubles en Éter (Grasas/Aceites)', oilsAndGreaseMgL + ' mg/L', '< ' + LEGAL_LIMITS.liquid.oilsMax + ' mg/L', oilsAndGreaseMgL <= LEGAL_LIMITS.liquid.oilsMax ? 'CONFORME' : 'EXCEDIDO'],
        ['Sólidos Sedimentables (2 horas)', settleableSolidsMlL + ' ml/L', '< ' + LEGAL_LIMITS.liquid.settleableMax + ' ml/L', settleableSolidsMlL <= LEGAL_LIMITS.liquid.settleableMax ? 'CONFORME' : 'EXCEDIDO']
      ];

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Parámetro Físico-Químico', 'Valor Obtenido en Ensayo', 'Límite Normativo Máximo', 'Dictamen']],
        headStyles: { fillColor: isGas ? [13, 148, 136] : [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        body: tableRows,
        bodyStyles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 42 },
          2: { cellWidth: 40 },
          3: { cellWidth: 30, fontStyle: 'bold' }
        },
        didParseCell: (data) => {
          if (data.column.index === 3) {
            if (data.cell.raw === 'CONFORME') {
              data.cell.styles.textColor = [5, 150, 105];
            } else if (data.cell.raw === 'EXCEDIDO') {
              data.cell.styles.textColor = [220, 38, 38];
            }
          }
        }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 8;

      // Resumen del Dictamen
      doc.setFillColor(isCompliant ? 240 : 254, isCompliant ? 253 : 242, isCompliant ? 244 : 242);
      doc.roundedRect(14, currentY, pageWidth - 28, 18, 2, 2, 'F');
      doc.setTextColor(isCompliant ? 21 : 185, isCompliant ? 128 : 28, isCompliant ? 61 : 28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(
        isCompliant
          ? 'DICTAMEN AMBIENTAL: CONFORME - DENTRO DE LOS LÍMITES REGLAMENTARIOS'
          : 'DICTAMEN AMBIENTAL: NO CONFORME - SE DETECTAN EXCESOS EN LÍMITES NORMATIVOS',
        20,
        currentY + 7
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        isCompliant
          ? 'El efluente o emisión analizado cumple plenamente con los parámetros legales de vuelco o descarga a la atmósfera.'
          : 'Requiere adecuación inmediata del sistema de tratamiento o plan de contingencia ambiental.',
        20,
        currentY + 13
      );

      currentY += 26;

      // Firma Auditor
      const sigBoxWidth = 70;
      const sigHeight = 20;

      if (auditorSig) {
        try { doc.addImage(auditorSig, 'PNG', 14, currentY, sigBoxWidth, sigHeight); } catch {}
      }
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(14, currentY + sigHeight + 1, 14 + sigBoxWidth, currentY + sigHeight + 1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(responsibleAuditor || 'Profesional Ambiental / Responsable HyS', 14, currentY + sigHeight + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Auditor Ambiental Matriculado', 14, currentY + sigHeight + 9);

      // Pie de Página
      const footerY = pageHeight - 8;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, footerY - 3, pageWidth - 14, footerY - 3);

      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Documento oficial según Ley 25.675 y Ley 20.284. Conservar protocolo de laboratorio adjunto.',
        14,
        footerY
      );
      doc.text(
        'Pág. 1 de 1 • Emitido: ' + new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR'),
        pageWidth - 14,
        footerY,
        { align: 'right' }
      );

      const fileName = 'Protocolo_Ambiental_' + reportNumber + '.pdf';

      if (downloadOnly) {
        doc.save(fileName);
        toast.success('Protocolo ambiental descargado en PDF');
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

        toast.success('Abriendo ventana de impresión del protocolo...');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el documento PDF');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pointName.trim() || !laboratoryName.trim() || !responsibleAuditor.trim()) {
      toast.error('Completa los campos requeridos (Punto de toma, Laboratorio y Profesional Auditor).');
      return;
    }

    const newRecord: EmissionSampleRecord = {
      id: `amb_${Date.now()}`,
      companyId: activeCompany?.id,
      reportNumber,
      date,
      sampleType,
      pointName,
      laboratoryName,
      sampleProtocolNumber,
      responsibleAuditor,
      gasParameters: sampleType === 'gas_emission' ? {
        particulateMatterMgNm3: particulateMatter,
        coPpm,
        noxMgNm3,
        so2MgNm3,
        gasFlowM3H,
        gasTempC
      } : undefined,
      liquidParameters: sampleType === 'liquid_effluent' ? {
        ph,
        tempC,
        dbo5MgL,
        dqoMgL,
        oilsAndGreaseMgL,
        settleableSolidsMlL,
        dailyFlowM3Day
      } : undefined,
      complianceOverall: isCompliant ? 'compliant' : 'exceeded_limits',
      dischargeDestination: sampleType === 'liquid_effluent' ? dischargeDestination : undefined,
      auditorSignature: auditorSig || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem('industrial_environment_db');
    let list: EmissionSampleRecord[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (err) {}
    }
    list.unshift(newRecord);
    localStorage.setItem('industrial_environment_db', JSON.stringify(list));

    toast.success('Monitoreo ambiental registrado con éxito');
    navigate('/industrial-environment');
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Registrar Monitoreo Ambiental"
          subtitle="Carga de resultados de laboratorio para chimeneas o efluentes con control normativo instantáneo"
          badge="Ley 25.675 & Ley 20.284"
          icon={<Factory size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/industrial-environment')}
        />

        <div className="max-w-4xl mx-auto w-full px-2 sm:px-4 mt-6">
          {/* Barra Superior */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/industrial-environment')}
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
              <ArrowLeft size={16} /> Volver a monitoreo ambiental
            </button>

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
                <span>Imprimir Informe</span>
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
                BLOQUE 1: Identificación del Monitoreo y Tipo
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <Factory size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    1. Identificación del Monitoreo y Tipo de Muestra
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Datos del protocolo, laboratorio certificador y matriz ambiental
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    N° de Informe
                  </label>
                  <input
                    type="text"
                    value={reportNumber}
                    readOnly
                    style={{ backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Fecha de Muestreo *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-teal-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Matriz Ambiental a Controlar *
                  </label>
                  <select
                    value={sampleType}
                    onChange={e => setSampleType(e.target.value as any)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-bold px-3 py-2.5 border rounded-xl outline-none"
                  >
                    <option value="gas_emission">💨 Emisiones Gaseosas (Chimeneas / Calderas)</option>
                    <option value="liquid_effluent">💧 Efluentes Líquidos Industriales</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Punto de Toma / Chimenea / Cámara *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Chimenea Caldera 1 o Cámara de Toma Final"
                    value={pointName}
                    onChange={e => setPointName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Laboratorio Analítico Habilitado *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. CIQUIMIA S.A. (Cert. ISO 17025)"
                    value={laboratoryName}
                    onChange={e => setLaboratoryName(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    N° Protocolo de Laboratorio
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. PROT-2026-889"
                    value={sampleProtocolNumber}
                    onChange={e => setSampleProtocolNumber(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 2: Parámetros del Ensayo
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                  {sampleType === 'gas_emission' ? <Wind size={22} /> : <Droplets size={22} />}
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    2. Parámetros Físico-Químicos Medidos y Límites Legales
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    {sampleType === 'gas_emission' ? 'Límites según Ley 20.284 y normas provinciales de aire' : 'Límites admisibles de vuelco según Dec. 674/89'}
                  </p>
                </div>
              </div>

              {sampleType === 'gas_emission' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1">
                      Material Particulado (MP)
                    </label>
                    <span className="text-[10px] text-slate-500 block mb-1.5 font-mono">Máx: {LEGAL_LIMITS.gas.pmMax} mg/Nm³</span>
                    <input
                      type="number"
                      value={particulateMatter}
                      onChange={e => setParticulateMatter(parseFloat(e.target.value) || 0)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: particulateMatter <= LEGAL_LIMITS.gas.pmMax ? '#047857' : '#b91c1c',
                        borderColor: particulateMatter <= LEGAL_LIMITS.gas.pmMax ? '#10b981' : '#ef4444'
                      }}
                      className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1">
                      Monóxido Carbono (CO)
                    </label>
                    <span className="text-[10px] text-slate-500 block mb-1.5 font-mono">Máx: {LEGAL_LIMITS.gas.coMax} ppm</span>
                    <input
                      type="number"
                      value={coPpm}
                      onChange={e => setCoPpm(parseFloat(e.target.value) || 0)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: coPpm <= LEGAL_LIMITS.gas.coMax ? '#047857' : '#b91c1c',
                        borderColor: coPpm <= LEGAL_LIMITS.gas.coMax ? '#10b981' : '#ef4444'
                      }}
                      className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1">
                      Óxidos Nitrógeno (NOx)
                    </label>
                    <span className="text-[10px] text-slate-500 block mb-1.5 font-mono">Máx: {LEGAL_LIMITS.gas.noxMax} mg/Nm³</span>
                    <input
                      type="number"
                      value={noxMgNm3}
                      onChange={e => setNoxMgNm3(parseFloat(e.target.value) || 0)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: noxMgNm3 <= LEGAL_LIMITS.gas.noxMax ? '#047857' : '#b91c1c',
                        borderColor: noxMgNm3 <= LEGAL_LIMITS.gas.noxMax ? '#10b981' : '#ef4444'
                      }}
                      className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1">
                      Dióxido Azufre (SO2)
                    </label>
                    <span className="text-[10px] text-slate-500 block mb-1.5 font-mono">Máx: {LEGAL_LIMITS.gas.so2Max} mg/Nm³</span>
                    <input
                      type="number"
                      value={so2MgNm3}
                      onChange={e => setSo2MgNm3(parseFloat(e.target.value) || 0)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: so2MgNm3 <= LEGAL_LIMITS.gas.so2Max ? '#047857' : '#b91c1c',
                        borderColor: so2MgNm3 <= LEGAL_LIMITS.gas.so2Max ? '#10b981' : '#ef4444'
                      }}
                      className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1">
                      Potencial pH (6.5 - 8.5)
                    </label>
                    <span className="text-[10px] text-slate-500 block mb-1.5 font-mono">Rango admisible</span>
                    <input
                      type="number"
                      step="0.1"
                      value={ph}
                      onChange={e => setPh(parseFloat(e.target.value) || 0)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: (ph >= LEGAL_LIMITS.liquid.phMin && ph <= LEGAL_LIMITS.liquid.phMax) ? '#047857' : '#b91c1c',
                        borderColor: (ph >= LEGAL_LIMITS.liquid.phMin && ph <= LEGAL_LIMITS.liquid.phMax) ? '#10b981' : '#ef4444'
                      }}
                      className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1">
                      DBO5 (mg/L)
                    </label>
                    <span className="text-[10px] text-slate-500 block mb-1.5 font-mono">Máx: {LEGAL_LIMITS.liquid.dbo5Max} mg/L</span>
                    <input
                      type="number"
                      value={dbo5MgL}
                      onChange={e => setDbo5MgL(parseFloat(e.target.value) || 0)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: dbo5MgL <= LEGAL_LIMITS.liquid.dbo5Max ? '#047857' : '#b91c1c',
                        borderColor: dbo5MgL <= LEGAL_LIMITS.liquid.dbo5Max ? '#10b981' : '#ef4444'
                      }}
                      className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1">
                      DQO (mg/L)
                    </label>
                    <span className="text-[10px] text-slate-500 block mb-1.5 font-mono">Máx: {LEGAL_LIMITS.liquid.dqoMax} mg/L</span>
                    <input
                      type="number"
                      value={dqoMgL}
                      onChange={e => setDqoMgL(parseFloat(e.target.value) || 0)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: dqoMgL <= LEGAL_LIMITS.liquid.dqoMax ? '#047857' : '#b91c1c',
                        borderColor: dqoMgL <= LEGAL_LIMITS.liquid.dqoMax ? '#10b981' : '#ef4444'
                      }}
                      className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1">
                      Grasas y Aceites (mg/L)
                    </label>
                    <span className="text-[10px] text-slate-500 block mb-1.5 font-mono">Máx: {LEGAL_LIMITS.liquid.oilsMax} mg/L</span>
                    <input
                      type="number"
                      value={oilsAndGreaseMgL}
                      onChange={e => setOilsAndGreaseMgL(parseFloat(e.target.value) || 0)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: oilsAndGreaseMgL <= LEGAL_LIMITS.liquid.oilsMax ? '#047857' : '#b91c1c',
                        borderColor: oilsAndGreaseMgL <= LEGAL_LIMITS.liquid.oilsMax ? '#10b981' : '#ef4444'
                      }}
                      className="w-full text-base font-black px-2.5 py-1.5 rounded-lg border outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Tarjeta de Dictamen Inmediato de Cumplimiento */}
              <div
                style={{
                  backgroundColor: isCompliant ? '#f0fdf4' : '#fef2f2',
                  border: isCompliant ? '2px solid #10b981' : '2px solid #ef4444',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div className="flex items-center gap-3">
                  {isCompliant ? (
                    <CheckCircle2 style={{ color: '#047857', flexShrink: 0 }} size={24} />
                  ) : (
                    <AlertTriangle style={{ color: '#b91c1c', flexShrink: 0 }} size={24} />
                  )}
                  <div>
                    <strong style={{ color: isCompliant ? '#064e3b' : '#7f1d1d', fontSize: '13px', display: 'block' }}>
                      {isCompliant ? 'Resultado Conforme: Dentro de Límites Legales' : 'Resultado Excedido: Desvío Normativo Detectado'}
                    </strong>
                    <p style={{ color: isCompliant ? '#047857' : '#991b1b', fontSize: '11.5px', margin: '2px 0 0 0' }}>
                      {isCompliant
                        ? 'Todos los parámetros analizados se encuentran dentro del rango de descarga o emisión autorizado.'
                        : 'Uno o más parámetros superan el límite reglamentario. Requiere plan de adecuación ambiental.'}
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    backgroundColor: isCompliant ? '#10b981' : '#dc2626',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '11px',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    textTransform: 'uppercase'
                  }}
                >
                  {isCompliant ? 'CONFORME' : 'EXCEDIDO'}
                </span>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 3: Profesional Auditor y Firmas Digitales
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    3. Profesional Auditor y Firma de Certificación
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Datos del profesional interviniente y firma digital del reporte
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Profesional Auditor / Responsable HyS *
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre, Apellido y Matrícula Profesional"
                    value={responsibleAuditor}
                    onChange={e => setResponsibleAuditor(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Destino Final de Descarga
                  </label>
                  <select
                    value={dischargeDestination}
                    onChange={e => setDischargeDestination(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  >
                    <option value="cloaca">Red Cloacal Colectora</option>
                    <option value="pluvial">Conducto Pluvial</option>
                    <option value="curso_agua">Curso de Agua Superficial / Río</option>
                    <option value="suelo">Absorción por Suelo / Riego Forestal</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Observaciones Técnicas o Recomendaciones
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalle sobre estado del tratamiento de efluentes, limpieza de filtros o calibraciones..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs px-3 py-2 border rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Firma Digital */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <span style={{ color: '#0f172a' }} className="block text-xs font-extrabold uppercase tracking-wider mb-4">
                  Firma Digital del Profesional Auditor:
                </span>
                <div className="max-w-md">
                  <SignatureCanvas
                    title="Firma del Profesional Auditor Ambiental"
                    onSave={setAuditorSig}
                    initialImage={auditorSig || undefined}
                  />
                </div>
              </div>
            </div>

            {/* ========================================================
                BARRA DE BOTONES FINAL
               ======================================================== */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => navigate('/industrial-environment')}
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
                  <span>Imprimir Informe</span>
                </button>

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
                  <span>Guardar Monitoreo</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
}
