import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LegalRequirement, CATEGORY_LABELS } from '../data/legalMatrixData';

export interface LegalReportData {
  companyName: string;
  companyCuit: string;
  establishmentName: string;
  auditorName: string;
  auditorLicense: string;
  auditDate: string;
  requirements: LegalRequirement[];
}

export function generateLegalCompliancePdf(data: LegalReportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cálculo de estadísticas
  const applicableReqs = data.requirements.filter(r => r.status !== 'no_aplica');
  const conformes = applicableReqs.filter(r => r.status === 'conforme').length;
  const noConformes = applicableReqs.filter(r => r.status === 'no_conforme').length;
  const enProceso = applicableReqs.filter(r => r.status === 'en_proceso').length;
  const noAplica = data.requirements.filter(r => r.status === 'no_aplica').length;

  const compliancePercent = applicableReqs.length > 0
    ? Math.round((conformes / applicableReqs.length) * 100)
    : 100;

  // ─── PÁGINA 1: CARÁTULA Y RESUMEN EJECUTIVO ─────────────────────────────
  // Encabezado institucional azul noche y dorado
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(59, 130, 246); // Blue 500
  doc.rect(0, 26, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('EVALUACIÓN DE CONFORMIDAD Y CUMPLIMIENTO LEGAL', 14, 11);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('NORMA ISO 45001:2018 (CLÁUSULA 9.1.2) & LEY DE HIGIENE Y SEGURIDAD N° 19.587', 14, 17);
  doc.setFontSize(7.5);
  doc.text(`Empresa: ${data.companyName} | CUIT: ${data.companyCuit} | Fecha: ${data.auditDate}`, 14, 23);

  // Cuadro informativo de la Auditoría
  const startY = 34;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, startY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA EVALUACIÓN Y DEL AUDITOR TÉCNICO', 18, startY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Razón Social: ${data.companyName}`, 18, startY + 12);
  doc.text(`Establecimiento: ${data.establishmentName || 'Planta Principal'}`, 18, startY + 17);
  doc.text(`Norma de Referencia: ISO 45001:2018 / Dec. 351/79`, 18, startY + 22);

  doc.text(`Auditor Responsable: ${data.auditorName}`, 115, startY + 12);
  doc.text(`Matrícula Profesional: ${data.auditorLicense}`, 115, startY + 17);
  doc.text(`Fecha del Relevamiento: ${data.auditDate}`, 115, startY + 22);

  // Cuadro destacado de % de Cumplimiento
  const kpiY = startY + 28;
  const isHighRisk = compliancePercent < 65;
  const isModerateRisk = compliancePercent >= 65 && compliancePercent < 85;

  const boxFillColor = isHighRisk ? [254, 226, 226] : isModerateRisk ? [254, 243, 199] : [220, 252, 231];
  const boxBorderColor = isHighRisk ? [239, 68, 68] : isModerateRisk ? [245, 158, 11] : [34, 197, 94];
  const textColor = isHighRisk ? [185, 28, 28] : isModerateRisk ? [180, 83, 9] : [21, 128, 61];

  doc.setFillColor(boxFillColor[0], boxFillColor[1], boxFillColor[2]);
  doc.setDrawColor(boxBorderColor[0], boxBorderColor[1], boxBorderColor[2]);
  doc.roundedRect(14, kpiY, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(`${compliancePercent}%`, 36, kpiY + 18, { align: 'center' });

  doc.setFontSize(8);
  doc.text('ÍNDICE GLOBAL DE CONFORMIDAD LEGAL', 65, kpiY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Requisitos Aplicables Evaluados: ${applicableReqs.length} | Conformes: ${conformes} | En Proceso: ${enProceso} | No Conformes: ${noConformes} | No Aplica: ${noAplica}`,
    65,
    kpiY + 14
  );

  const statusVerdict = isHighRisk
    ? 'DICTAMEN: RIESGO LEGAL CRÍTICO — Incumplimientos con potencial de sanción o clausura de la autoridad laboral.'
    : isModerateRisk
    ? 'DICTAMEN: CONFORMIDAD CONDICIONADA — Requiere ejecución prioritaria de los planes de adecuación en curso.'
    : 'DICTAMEN: CONFORMIDAD SATISFACTORIA — Nivel adecuado de cumplimiento para certificación ISO 45001 y auditorías ART.';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(statusVerdict, 65, kpiY + 21);

  // Tabla detallada de requisitos
  const tableRows = data.requirements.map((req, idx) => {
    const statusLabel =
      req.status === 'conforme'
        ? 'CONFORME'
        : req.status === 'no_conforme'
        ? 'NO CONFORME'
        : req.status === 'en_proceso'
        ? 'EN PROCESO'
        : 'NO APLICA';

    let evidenceOrAction = req.evidenceNotes || 'Sin evidencia cargada';
    if (req.status === 'no_conforme' || req.status === 'en_proceso') {
      if (req.actionPlan) {
        evidenceOrAction += `\n[PLAN]: ${req.actionPlan} (Plazo: ${req.deadlineDate || 'A definir'})`;
      }
    }

    return [
      String(idx + 1),
      req.normative,
      req.title,
      req.periodicity.toUpperCase(),
      statusLabel,
      evidenceOrAction
    ];
  });

  autoTable(doc, {
    startY: kpiY + 33,
    head: [['#', 'Normativa / Art.', 'Requisito Legal Auditado', 'Frecuencia', 'Estado', 'Evidencia Objetiva / Plan de Acción']],
    body: tableRows,
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
      1: { cellWidth: 34, fontStyle: 'bold' },
      2: { cellWidth: 46 },
      3: { cellWidth: 20, halign: 'center', fontSize: 6.2 },
      4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 50, fontSize: 6.2 }
    },
    styles: {
      fontSize: 6.6,
      cellPadding: 1.6,
      overflow: 'linebreak'
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === 'body' && dataCell.column.index === 4) {
        const val = String(dataCell.cell.raw);
        if (val === 'CONFORME') {
          dataCell.cell.styles.textColor = [22, 101, 52];
          dataCell.cell.styles.fillColor = [240, 253, 244];
        } else if (val === 'NO CONFORME') {
          dataCell.cell.styles.textColor = [185, 28, 28];
          dataCell.cell.styles.fillColor = [254, 226, 226];
        } else if (val === 'EN PROCESO') {
          dataCell.cell.styles.textColor = [180, 83, 9];
          dataCell.cell.styles.fillColor = [254, 243, 199];
        } else {
          dataCell.cell.styles.textColor = [100, 116, 139];
        }
      }
    }
  });

  // Bloque de Firmas al final
  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Si no cabe en la página, agregar una página nueva
  if (finalY > 240) {
    doc.addPage();
    renderSignatureBlock(doc, 30, data);
  } else {
    renderSignatureBlock(doc, finalY, data);
  }

  doc.save(`Matriz_Cumplimiento_Legal_${data.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.auditDate}.pdf`);
}

function renderSignatureBlock(doc: jsPDF, y: number, data: LegalReportData) {
  doc.setDrawColor(148, 163, 184);
  doc.line(20, y + 16, 85, y + 16);
  doc.line(125, y + 16, 190, y + 16);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.auditorName || 'Auditor Técnico HyS', 52.5, y + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Firma y Sello Resp. Higiene y Seguridad (Mat. ${data.auditorLicense || 'Vigente'})`, 52.5, y + 23.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Dirección / Representante Legal de la Empresa', 157.5, y + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Toma de Conocimiento y Aprobación de Planes de Acción', 157.5, y + 23.5, { align: 'center' });

  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Documento confidencial emitido conforme a la Cláusula 9.1.2 de la Norma ISO 45001:2018. Validez legal ante inspecciones de la SRT y ART.',
    105,
    y + 35,
    { align: 'center' }
  );
}
