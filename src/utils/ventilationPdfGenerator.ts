import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VentilationStudy, ENVIRONMENT_AIR_CHANGES } from '../data/ventilationData';

export function generateVentilationProtocolPdf(
  study: VentilationStudy,
  companyName: string = 'Establecimiento Industrial',
  companyCuit: string = '30-XXXXXXXX-X'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Encabezado institucional azul petróleo / teal de ingeniería ambiental
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(15, 23, 42); // Barra inferior Navy
  doc.rect(0, 24, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PROTOCOLO Y MEMORIA TÉCNICA DE VENTILACIÓN INDUSTRIAL', 14, 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CÁLCULO DE CAUDALES DE AIRE Y RENOVACIONES — DECRETO 351/79 CAP. 11 Y ANEXO III', 14, 16);
  doc.setFontSize(7.5);
  doc.text(`Empresa: ${companyName} | CUIT: ${companyCuit} | Sector: ${study.sectorName} | Fecha: ${study.date}`, 14, 21.5);

  // Cuadro informativo del sector
  const startY = 32;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, startY, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PARÁMETROS GEOMÉTRICOS Y OCUPACIONALES DEL SECTOR', 18, startY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sector Evaluado: ${study.sectorName}`, 18, startY + 12);
  doc.text(`Superficie: ${study.surfaceM2} m² | Altura Media: ${study.heightM} m`, 18, startY + 17);
  doc.text(`Volumen Total del Local: ${study.volumeM3} m³`, 18, startY + 22);

  doc.text(`Personal en Simultáneo: ${study.workersCount} personas`, 115, startY + 12);
  doc.text(`Cubicaje por Trabajador: ${study.cubicMetersPerPerson} m³/persona`, 115, startY + 17);
  doc.text(`Tipo de Actividad: ${study.activityType.toUpperCase()}`, 115, startY + 22);

  // Cuadro Comparativo de Caudales (Tabla 1)
  const kpiY = startY + 30;
  const isOk = study.isCompliant;

  doc.setFillColor(isOk ? 240 : 254, isOk ? 253 : 226, isOk ? 244 : 226);
  doc.setDrawColor(isOk ? 34 : 239, isOk ? 197 : 68, isOk ? 94 : 68);
  doc.roundedRect(14, kpiY, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setTextColor(isOk ? 21 : 185, isOk ? 128 : 28, isOk ? 61 : 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(`${study.coveragePercent}%`, 36, kpiY + 16, { align: 'center' });

  doc.setFontSize(7.5);
  doc.text(isOk ? 'SISTEMA DE VENTILACIÓN APTO' : 'SISTEMA DE VENTILACIÓN DEFICITARIO', 36, kpiY + 22, { align: 'center' });

  doc.setFontSize(8);
  doc.text('BALANCE DE CAUDAL Y RENOVACIONES HORARIAS:', 65, kpiY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Caudal Mínimo Exigido por Personas (Anexo III): ${study.requiredFlowRateByPersonsM3H} m³/h`, 65, kpiY + 12);
  doc.text(`• Caudal Mínimo Exigido por Renovaciones (${study.recommendedAirChangesPerHour} Ren/h): ${study.requiredFlowRateByVolumeM3H} m³/h`, 65, kpiY + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`• Caudal Total Efectivo Instalado: ${study.totalActualFlowRateM3H} m³/h  (${study.actualAirChangesPerHour} Ren/h reales)`, 65, kpiY + 21);

  // Detalle de Equipos Instalados (Tabla AutoTable)
  const eqRows = study.equipments.map((eq, i) => [
    String(i + 1),
    eq.tag,
    eq.type.replace('_', ' ').toUpperCase(),
    String(eq.quantity),
    `${eq.flowRateM3H} m³/h`,
    `${eq.flowRateM3H * eq.quantity} m³/h`
  ]);

  if (study.naturalOpeningsAreaM2 > 0) {
    const naturalFlow = Math.round(study.naturalOpeningsAreaM2 * 0.5 * 3600);
    eqRows.push([
      String(eqRows.length + 1),
      'Aberturas Naturales',
      `Ventanas / Portones (${study.naturalOpeningsAreaM2} m²)`,
      '1',
      `${naturalFlow} m³/h`,
      `${naturalFlow} m³/h`
    ]);
  }

  autoTable(doc, {
    startY: kpiY + 30,
    head: [['#', 'Identificación', 'Tipo de Extracción / Inyección', 'Cant.', 'Caudal Unit.', 'Caudal Total']],
    body: eqRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: 'bold'
    },
    styles: { fontSize: 6.8, cellPadding: 2 }
  });

  // Mediciones Instrumentales de Campo
  let measY = (doc as any).lastAutoTable.finalY + 6;

  if (study.measurementPoints && study.measurementPoints.length > 0) {
    const pointRows = study.measurementPoints.map((p, idx) => [
      String(idx + 1),
      p.location,
      `${p.airVelocityMS} m/s`,
      p.co2Ppm ? `${p.co2Ppm} ppm` : 'N/A',
      p.temperatureC ? `${p.temperatureC} °C` : 'N/A',
      p.airVelocityMS >= 0.15 && p.airVelocityMS <= 0.5 ? 'Confortable (0.15-0.5 m/s)' : 'Fuera de rango'
    ]);

    autoTable(doc, {
      startY: measY,
      head: [['#', 'Punto de Muestreo / Operación', 'Velocidad Aire', 'CO2 Ambiental', 'Temp.', 'Criterio Confort']],
      body: pointRows,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold'
      },
      styles: { fontSize: 6.6, cellPadding: 1.8 }
    });

    measY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Conclusión Técnica y Recomendaciones
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, measY, pageWidth - 28, 20, 1.5, 1.5, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DICTAMEN TÉCNICO Y RECOMENDACIONES PREVENTIVAS:', 18, measY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const recText = study.recommendations ||
    (isOk
      ? 'El ambiente cumple satisfactoriamente con los caudales y renovaciones mínimas exigidas por el Dec. 351/79. Se recomienda realizar mantenimiento preventivo semestral de correas y rodamientos de los extractores.'
      : `DÉFICIT DETECTADO: El local presenta un déficit de ${study.flowDeficitM3H} m³/h. Se requiere la incorporación urgente de extractores forzados adicionales para garantizar la dilución de contaminantes.`);

  doc.text(doc.splitTextToSize(recText, pageWidth - 36), 18, measY + 10);

  // Firmas
  const signY = measY + 24;
  doc.setDrawColor(148, 163, 184);
  doc.line(20, signY + 12, 85, signY + 12);
  doc.line(125, signY + 12, 190, signY + 12);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(study.evaluatorName, 52.5, signY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Firma y Sello Profesional HyS (${study.evaluatorLicense})`, 52.5, signY + 19.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Representante Legal de la Empresa', 157.5, signY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Constancia de Recepción y Archivo en Legajo Técnico', 157.5, signY + 19.5, { align: 'center' });

  // Pie de página legal
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Protocolo de Ventilación conforme a Dec. 351/79 Cap. 11 y Anexo III. Validez ante la SRT, ART y autoridades laborales.',
    pageWidth / 2,
    287,
    { align: 'center' }
  );

  doc.save(`Protocolo_Ventilacion_${study.sectorName.replace(/[^a-zA-Z0-9]/g, '_')}_${study.date}.pdf`);
}
