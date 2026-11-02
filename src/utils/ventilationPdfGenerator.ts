import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VentilationStudy, ENVIRONMENT_AIR_CHANGES } from '../data/ventilationData';
import { drawJsPdfSignatures, getSavedProfessionalData } from './jsPdfSignatureHelper';
import toast from 'react-hot-toast';

export function generateVentilationProtocolPdf(
  study: VentilationStudy,
  companyName: string = 'Establecimiento Industrial',
  companyCuit: string = '30-XXXXXXXX-X',
  downloadOnly: boolean = false
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

  // Cuadro informativo del sector e instrumental
  const startY = 30;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, startY, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PARÁMETROS GEOMÉTRICOS, OCUPACIONALES E INSTRUMENTAL DE CAMPO', 18, startY + 5.5);

  doc.setFontSize(7.6);
  doc.setFont('helvetica', 'normal');
  const envLabel = ENVIRONMENT_AIR_CHANGES[study.environmentType]?.label || study.environmentType;
  doc.text(`Sector Evaluado: ${study.sectorName} (${envLabel})`, 18, startY + 11);
  doc.text(`Superficie: ${study.surfaceM2} m² | Altura Media: ${study.heightM} m | Volumen: ${study.volumeM3} m³`, 18, startY + 15.8);
  doc.text(`Instrumento: ${study.anemometerBrandModel || 'Termo-Anemómetro Digital Calibrado'} (SN: ${study.anemometerSerial || 'S/N'})`, 18, startY + 20.6);
  doc.text(`Contaminante / Agente: ${study.contaminantType || 'Calor metabólico / Vapores y partículas de proceso'}`, 18, startY + 25.4);

  doc.text(`Personal en Simultáneo: ${study.workersCount} operarios`, 118, startY + 11);
  doc.text(`Cubicaje por Trabajador: ${study.cubicMetersPerPerson} m³/persona`, 118, startY + 15.8);
  doc.text(`Actividad (Anexo III): ${study.activityType.toUpperCase()}`, 118, startY + 20.6);
  doc.text(`Cert. Calibración: ${study.anemometerCertNumber || 'Trazable INTI / SAC'}`, 118, startY + 25.4);

  // Cuadro Comparativo de Caudales (Tabla 1)
  const kpiY = startY + 34;
  const isOk = study.isCompliant;

  doc.setFillColor(isOk ? 240 : 254, isOk ? 253 : 226, isOk ? 244 : 226);
  doc.setDrawColor(isOk ? 34 : 239, isOk ? 197 : 68, isOk ? 94 : 68);
  doc.roundedRect(14, kpiY, pageWidth - 28, 25, 2, 2, 'FD');

  doc.setTextColor(isOk ? 21 : 185, isOk ? 128 : 28, isOk ? 61 : 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(`${study.coveragePercent}%`, 36, kpiY + 14.5, { align: 'center' });

  doc.setFontSize(7.2);
  doc.text(isOk ? 'SISTEMA DE VENTILACIÓN APTO' : 'SISTEMA DE VENTILACIÓN DEFICITARIO', 36, kpiY + 20.5, { align: 'center' });

  doc.setFontSize(8);
  doc.text('BALANCE DE CAUDAL Y RENOVACIONES HORARIAS:', 65, kpiY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Caudal Mínimo Exigido por Personas (Anexo III Dec. 351/79): ${study.requiredFlowRateByPersonsM3H.toLocaleString()} m³/h`, 65, kpiY + 11.5);
  doc.text(`• Caudal Mínimo Exigido por Renovaciones (${study.recommendedAirChangesPerHour} Ren/h): ${study.requiredFlowRateByVolumeM3H.toLocaleString()} m³/h`, 65, kpiY + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(`• Caudal Total Efectivo Instalado: ${study.totalActualFlowRateM3H.toLocaleString()} m³/h  (${study.actualAirChangesPerHour} Ren/h reales)`, 65, kpiY + 20.5);

  // Detalle de Equipos Instalados (Tabla AutoTable)
  const eqRows = study.equipments.map((eq, i) => [
    String(i + 1),
    eq.tag,
    eq.type.replace(/_/g, ' ').toUpperCase(),
    String(eq.quantity),
    `${eq.flowRateM3H.toLocaleString()} m³/h`,
    `${(eq.flowRateM3H * eq.quantity).toLocaleString()} m³/h`
  ]);

  if (study.naturalOpeningsAreaM2 > 0) {
    const naturalFlow = Math.round(study.naturalOpeningsAreaM2 * 0.5 * 3600);
    eqRows.push([
      String(eqRows.length + 1),
      'Aberturas Naturales',
      `Ventanas / Portones Permeables (${study.naturalOpeningsAreaM2} m²)`,
      '1',
      `${naturalFlow.toLocaleString()} m³/h`,
      `${naturalFlow.toLocaleString()} m³/h`
    ]);
  }

  autoTable(doc, {
    startY: kpiY + 29,
    head: [['#', 'Identificación', 'Tipo de Extracción / Inyección / Captura', 'Cant.', 'Caudal Unit.', 'Caudal Total']],
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
  let measY = (doc as any).lastAutoTable.finalY + 5;

  if (study.measurementPoints && study.measurementPoints.length > 0) {
    const pointRows = study.measurementPoints.map((p, idx) => [
      String(idx + 1),
      p.location,
      `${p.airVelocityMS} m/s`,
      p.co2Ppm ? `${p.co2Ppm} ppm` : 'N/A',
      p.temperatureC ? `${p.temperatureC} °C` : 'N/A',
      p.airVelocityMS >= 0.15 && p.airVelocityMS <= 1.5 ? 'CONFORME (Flujo Activo)' : 'REVISAR FLUJO'
    ]);

    autoTable(doc, {
      startY: measY,
      head: [['#', 'Punto de Muestreo / Puesto Operativo', 'Velocidad Aire', 'CO2 Ambiental', 'Temp.', 'Evaluación Instrumental']],
      body: pointRows,
      theme: 'grid',
      headStyles: {
        fillColor: [13, 148, 136],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold'
      },
      styles: { fontSize: 6.6, cellPadding: 1.8 }
    });

    measY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Verificaciones Legales (Arts. 64-70 Dec. 351/79)
  if (study.verificacionesLegales && study.verificacionesLegales.length > 0) {
    const checkRows = study.verificacionesLegales.map((chk, idx) => [
      `✓ ${idx + 1}`,
      chk,
      'CUMPLIDO'
    ]);

    autoTable(doc, {
      startY: measY,
      head: [['Ítem', 'Verificación Técnica Reglamentaria (Dec. 351/79 Cap. 11 Arts. 64 a 70)', 'Estado']],
      body: checkRows,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center' },
        2: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }
      },
      styles: { fontSize: 6.4, cellPadding: 1.5 }
    });

    measY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Conclusión Técnica y Recomendaciones
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, measY, pageWidth - 28, 19, 1.5, 1.5, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DICTAMEN TÉCNICO Y RECOMENDACIONES PREVENTIVAS:', 18, measY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.9);
  const recText = study.recommendations ||
    (isOk
      ? 'El ambiente cumple satisfactoriamente con los caudales y renovaciones mínimas exigidas por el Dec. 351/79 Cap. 11 y Anexo III. Se recomienda realizar mantenimiento preventivo semestral de correas, filtros y álabes de los extractores.'
      : `DÉFICIT DETECTADO: El local presenta un déficit de ${study.flowDeficitM3H} m³/h. Se requiere la incorporación urgente de extractores forzados adicionales o captación localizada para garantizar la dilución de contaminantes.`);

  doc.text(doc.splitTextToSize(recText, pageWidth - 36), 18, measY + 9.5);

  // Bloque de Firmas Digitales Formato ATS (con el Profesional H&S en el Centro - box2)
  const proData = getSavedProfessionalData();
  const proDisplayTitle = (study.evaluatorTitle || proData.profession || 'PROFESIONAL DE HIGIENE Y SEGURIDAD').toUpperCase();
  const proDisplayName = (study.evaluatorName || proData.name || 'PROFESIONAL ACTUANTE').toUpperCase();
  const proLicense = study.evaluatorLicense || proData.license || null;
  const proSig = study.evaluatorSignature || proData.signature;
  const proStamp = study.evaluatorStamp || proData.stamp;

  const flags = study.showSignatures || { operator: true, professional: true, supervisor: true };

  drawJsPdfSignatures(doc, {
    startY: measY + 23,
    maxY: 245,
    box1: flags.operator
      ? {
          title: 'REPRESENTANTE DEL ESTABLECIMIENTO',
          subtitle: (study.representativeName || companyName || 'EMPLEADOR / APODERADO').toUpperCase(),
          secondarySubtitle: companyCuit ? `CUIT ${companyCuit}` : 'Conformidad Legal',
          signatureUrl: study.representativeSignature || null,
          isProfessional: false
        }
      : null,
    box2: flags.professional
      ? {
          title: proDisplayTitle,
          subtitle: proDisplayName,
          license: proLicense,
          signatureUrl: proSig,
          stampUrl: proStamp,
          isProfessional: true
        }
      : null,
    box3: flags.supervisor
      ? {
          title: 'JEFE DE PLANTA / MANTENIMIENTO',
          subtitle: (study.supervisorName || `ENCARGADO ${study.sectorName}`).toUpperCase(),
          secondarySubtitle: 'Supervisión Operativa del Sector',
          signatureUrl: study.supervisorSignature || null,
          isProfessional: false
        }
      : null
  });

  // Pie de página legal
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Protocolo de Ventilación conforme a Dec. 351/79 Cap. 11 (Arts. 64 a 70) y Anexo III. Validez ante la SRT, ART y autoridades laborales.',
    pageWidth / 2,
    287,
    { align: 'center' }
  );

  const fileName = `Protocolo_Ventilacion_${study.sectorName.replace(/[^a-zA-Z0-9]/g, '_')}_${study.date}.pdf`;

  if (downloadOnly) {
    doc.save(fileName);
    toast.success(`PDF descargado: ${fileName}`);
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
    toast.success('Abriendo protocolo de ventilación para imprimir / guardar PDF...');
  }
}
