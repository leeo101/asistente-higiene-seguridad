import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PTSProcedure } from '../data/ptsProcedureData';

export function generatePTSDocumentPdf(
  procedure: PTSProcedure,
  companyName: string = 'Establecimiento Industrial',
  companyCuit: string = '30-XXXXXXXX-X'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ─── PÁGINA 1: PROCEDIMIENTO DE TRABAJO SEGURO ──────────────────────────
  // Encabezado ISO 45001 / ISO 9001
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.4);
  doc.rect(14, 10, pageWidth - 28, 22);

  // Cuadrícula del encabezado
  doc.line(60, 10, 60, 32);
  doc.line(155, 10, 155, 32);
  doc.line(155, 17, pageWidth - 14, 17);
  doc.line(155, 24, pageWidth - 14, 24);

  // Nombre de Empresa
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(companyName.toUpperCase(), 37, 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`CUIT: ${companyCuit}`, 37, 25, { align: 'center' });

  // Título Central
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('PROCEDIMIENTO DE TRABAJO SEGURO (PTS)', 107.5, 17, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(procedure.title.length > 50 ? procedure.title.substring(0, 48) + '...' : procedure.title, 107.5, 23, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO — ISO 45001', 107.5, 28, { align: 'center' });

  // Control Documental Derecho
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(6.5);
  doc.text(`CÓDIGO: ${procedure.code}`, 158, 14.5);
  doc.text(`VERSIÓN: ${procedure.version}`, 158, 21.5);
  doc.text(`VIGENCIA: ${procedure.effectiveDate}`, 158, 28.5);

  let currentY = 38;

  // 1. OBJETIVO Y ALCANCE
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, pageWidth - 28, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('1. OBJETIVO Y ALCANCE', 18, currentY + 4.2);

  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Objetivo:', 16, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(procedure.objective, pageWidth - 32), 16, currentY + 3.5);

  currentY += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Alcance:', 16, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(procedure.scope, pageWidth - 32), 16, currentY + 3.5);

  currentY += 14;

  // 2. EPP OBLIGATORIO
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, pageWidth - 28, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('2. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP) OBLIGATORIOS (RES. SRT 299/11)', 18, currentY + 4.2);

  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  procedure.requiredPPE.forEach((ppe) => {
    doc.text(`• ${ppe}`, 18, currentY);
    currentY += 4;
  });

  currentY += 2;

  // 3. VERIFICACIONES PREVIAS
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, pageWidth - 28, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('3. VERIFICACIONES Y CONDICIONES PREVIAS DE SEGURIDAD', 18, currentY + 4.2);

  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(doc.splitTextToSize(procedure.preliminaryChecks, pageWidth - 32), 16, currentY);

  currentY += 16;

  // 4. PASO A PASO OPERATIVO SEGURO (Tabla con AutoTable)
  const stepRows = procedure.steps.map((st) => [
    String(st.stepNumber),
    st.activityTitle,
    st.hazardRisk,
    st.controlMeasure
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Etapa Operativa', 'Peligro / Riesgo Asociado', 'Medida Preventiva Obligatoria']],
    body: stepRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 40, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 84 }
    },
    styles: {
      fontSize: 6.5,
      cellPadding: 2,
      overflow: 'linebreak'
    }
  });

  let afterTableY = (doc as any).lastAutoTable.finalY + 6;

  // Si queda poco espacio, añadir página
  if (afterTableY > 215) {
    doc.addPage();
    afterTableY = 20;
  }

  // 5. PROHIBICIONES EXPRESAS
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(14, afterTableY, pageWidth - 28, 6 + procedure.prohibitions.length * 4.5, 1, 1, 'FD');

  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('5. PROHIBICIONES EXPRESAS DE SEGURIDAD', 18, afterTableY + 4.5);

  let probY = afterTableY + 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.6);
  doc.setTextColor(15, 23, 42);
  procedure.prohibitions.forEach((p) => {
    doc.text(`✗ ${p}`, 18, probY);
    probY += 4.2;
  });

  afterTableY = probY + 4;

  // 6. ACTUACIÓN ANTE EMERGENCIAS
  if (afterTableY > 230) {
    doc.addPage();
    afterTableY = 20;
  }

  doc.setFillColor(241, 245, 249);
  doc.rect(14, afterTableY, pageWidth - 28, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('6. PROTOCOLO DE ACTUACIÓN ANTE EMERGENCIAS Y ACCIDENTES', 18, afterTableY + 4.2);

  afterTableY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(doc.splitTextToSize(procedure.emergencyProtocol, pageWidth - 32), 16, afterTableY);

  afterTableY += 16;

  // 7. CUADRO DE FIRMAS DE CONTROL DOCUMENTAL
  if (afterTableY > 240) {
    doc.addPage();
    afterTableY = 20;
  }

  doc.setDrawColor(148, 163, 184);
  doc.line(16, afterTableY + 12, 65, afterTableY + 12);
  doc.line(75, afterTableY + 12, 130, afterTableY + 12);
  doc.line(140, afterTableY + 12, 195, afterTableY + 12);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(procedure.preparedBy || 'Servicio HyS', 40.5, afterTableY + 15.5, { align: 'center' });
  doc.text(procedure.reviewedBy || 'Jefe de Planta / Supervisor', 102.5, afterTableY + 15.5, { align: 'center' });
  doc.text(procedure.approvedBy || 'Gerencia de Operaciones', 167.5, afterTableY + 15.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('ELABORÓ (SERVICIO HYS)', 40.5, afterTableY + 18.5, { align: 'center' });
  doc.text('REVISÓ (PRODUCCIÓN / PLANTA)', 102.5, afterTableY + 18.5, { align: 'center' });
  doc.text('APROBÓ (DIRECCIÓN)', 167.5, afterTableY + 18.5, { align: 'center' });

  // ─── PÁGINA 2 / ANEXO: PLANILLA DE DIFUSIÓN Y TOMA DE CONOCIMIENTO ──────
  doc.addPage();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('REGISTRO DE DIFUSIÓN Y TOMA DE CONOCIMIENTO', 14, 10);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Constancia de notificación y capacitación del procedimiento: ${procedure.code} — ${procedure.title}`, 14, 16);

  const ackRows = procedure.acknowledgements && procedure.acknowledgements.length > 0
    ? procedure.acknowledgements.map((ack, i) => [
        String(i + 1),
        ack.workerName,
        ack.workerDni,
        ack.sector,
        ack.acknowledgedDate,
        ack.signed ? 'FIRMA REGISTRADA (DIGITAL)' : 'PENDIENTE'
      ])
    : [
        ['1', 'Operario Asignado 1', 'DNI: XX.XXX.XXX', 'Sector Operativo', 'Fecha de difusión', 'Firma física / digital'],
        ['2', 'Operario Asignado 2', 'DNI: XX.XXX.XXX', 'Sector Operativo', 'Fecha de difusión', 'Firma física / digital'],
        ['3', 'Operario Asignado 3', 'DNI: XX.XXX.XXX', 'Sector Operativo', 'Fecha de difusión', 'Firma física / digital']
      ];

  autoTable(doc, {
    startY: 28,
    head: [['#', 'Nombre y Apellido del Trabajador', 'DNI / CUIL', 'Puesto / Sector', 'Fecha Notificación', 'Acuse de Recibo / Firma']],
    body: ackRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { fontSize: 7, cellPadding: 2.5 }
  });

  const legalFinalY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Declaro haber recibido copia, leído y comprendido en su totalidad las directivas del presente Procedimiento de Trabajo Seguro, comprometiéndome a cumplir estrictamente con las medidas de prevención aquí establecidas conforme al Art. 10 de la Ley N° 19.587.',
    14,
    legalFinalY,
    { maxWidth: pageWidth - 28 }
  );

  doc.save(`Procedimiento_PTS_${procedure.code}_${procedure.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
