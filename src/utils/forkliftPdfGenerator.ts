import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ForkliftVehicle,
  ForkliftDriver,
  ForkliftDailyCheck,
  DAILY_INSPECTION_ITEMS
} from '../data/forkliftSrt960Data';

/**
 * Genera la Credencial / Carnet Habilitante Oficial Anexo I Res. SRT 960/15
 * Formato credencial doble faz (Frente y Dorso) de bolsillo reglamentario
 */
export function generateForkliftCredentialPdf(
  driver: ForkliftDriver,
  companyName: string = 'Establecimiento Industrial',
  companyCuit: string = '30-XXXXXXXX-X'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] }); // Medida tarjeta ISO estándar CR80

  // ─── FRENTE DEL CARNET ───────────────────────────────────────────
  // Fondo de tarjeta con diseño profesional
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 85.6, 54, 'F');

  // Barra superior naranja de maquinaria industrial
  doc.setFillColor(217, 119, 6); // Amber 600
  doc.rect(0, 0, 85.6, 12, 'F');

  // Franja decorativa negra/amarilla de precaución
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 11, 85.6, 1.2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CREDENCIAL HABILITANTE DE CONDUCTOR', 42.8, 5.5, { align: 'center' });
  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'normal');
  doc.text('RES. S.R.T. N° 960/15 — VEHÍCULOS AUTOPROPULSADOS', 42.8, 9.2, { align: 'center' });

  // Cuadro de Foto
  doc.setFillColor(226, 232, 240);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(4, 15, 19, 24, 1.5, 1.5, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('FOTO 4x4', 13.5, 27, { align: 'center' });
  doc.setFontSize(4.5);
  doc.text('CONDUCTOR', 13.5, 30, { align: 'center' });

  // Datos del Conductor
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(driver.fullName.toUpperCase(), 26, 18);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`DNI: ${driver.dni} | CUIL: ${driver.cuil}`, 26, 22);
  doc.text(`N° Habilitación: ${driver.licenseNumber}`, 26, 25.5);
  doc.text(`Empresa: ${companyName}`, 26, 29);

  // Semáforo de vigencia
  const isExpired = new Date(driver.expiryDate) < new Date();
  doc.setFillColor(isExpired ? 239 : 16, isExpired ? 68 : 185, isExpired ? 68 : 129);
  doc.roundedRect(26, 31.5, 55, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text(`VIGENCIA: ${driver.issueDate} AL ${driver.expiryDate} (RENOVACIÓN ANUAL)`, 53.5, 35.5, { align: 'center' });

  // Grupo Sanguíneo y Aptitud
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Gr. Sanguíneo: ${driver.bloodType || '0 Rh+'} | Apto Médico: CONFORME RES. 960`, 4, 42);

  // Footer frente
  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('Esta credencial es personal e intransferible. Obligatoria para operar en planta.', 42.8, 50.5, { align: 'center' });

  // ─── DORSO DEL CARNET ───────────────────────────────────────────
  doc.addPage([85.6, 54], 'landscape');
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 85.6, 54, 'F');

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 85.6, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('REGISTRO OFICIAL DE CAPACITACIÓN Y EQUIPOS AUTORIZADOS', 42.8, 5.2, { align: 'center' });

  // Capacitación
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Capacitación Teórico-Práctica (Mínimo 10 hs - Art. 4):', 4, 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Entidad: ${driver.courseEntity}`, 4, 15.5);
  doc.text(`• Carga Horaria: ${driver.courseHours} horas | Certificado N°: ${driver.courseCertificateNumber}`, 4, 19);

  // Equipos autorizados
  doc.setFont('helvetica', 'bold');
  doc.text('Maquinaria / Equipos Habilitados:', 4, 23.5);
  doc.setFont('helvetica', 'normal');
  const typesText = driver.authorizedVehicleTypes.join(', ');
  doc.text(typesText.length > 55 ? typesText.substring(0, 52) + '...' : typesText, 4, 27);

  // Firmas obligatorias
  doc.setDrawColor(148, 163, 184);
  doc.line(6, 44, 38, 44);
  doc.line(47, 44, 79, 44);

  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('FIRMA CONDUCTOR HABILITADO', 22, 47, { align: 'center' });
  doc.text('FIRMA SERV. HIGIENE Y SEGURIDAD', 63, 47, { align: 'center' });

  doc.setFontSize(4);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(`Emisión del sistema HyS | CUIT Empleador: ${companyCuit}`, 42.8, 51.5, { align: 'center' });

  doc.save(`Credencial_Res960_${driver.cuil.replace(/[^0-9]/g, '')}.pdf`);
}

/**
 * Genera el Protocolo Oficial de Inspección Preoperacional Diaria Res. SRT 960/15 (Anexo III)
 */
export function generateForkliftInspectionPdf(
  check: ForkliftDailyCheck,
  vehicle?: ForkliftVehicle,
  companyName: string = 'Establecimiento Industrial',
  companyCuit: string = '30-XXXXXXXX-X'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Encabezado institucional
  doc.setFillColor(217, 119, 6); // Amber 600
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(15, 23, 42); // Navy bar
  doc.rect(0, 24, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CHECKLIST PRE-OPERACIONAL DIARIO DE AUTOELEVADOR', 14, 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('PLANILLA OFICIAL DE CONTROL ANTES DEL INICIO DEL TURNO — RES. S.R.T. N° 960/15 (ANEXO III)', 14, 16);
  doc.setFontSize(7.5);
  doc.text(`Empresa: ${companyName} | CUIT: ${companyCuit} | Fecha: ${check.date} | Turno: ${check.shift.toUpperCase()}`, 14, 21.5);

  // Cuadro informativo del Equipo y Operador
  const startY = 32;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, startY, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL EQUIPO Y DEL OPERADOR HABILITADO', 18, startY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Código Interno: ${check.vehicleCode}`, 18, startY + 12);
  doc.text(`Marca / Modelo: ${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Autoelevador Frontal'}`, 18, startY + 17);
  doc.text(`Capacidad Nominal: ${vehicle ? `${vehicle.capacityKg} kg` : '2500 kg'} | Horómetro Inicial: ${check.startHours} hs`, 18, startY + 22);

  doc.text(`Operador: ${check.driverName}`, 115, startY + 12);
  doc.text(`CUIL: ${check.driverCuil}`, 115, startY + 17);
  doc.text(`Estado del Check: ${check.hasCriticalFailure ? 'BLOQUEADO / FUERA DE SERVICIO' : 'APROBADO PARA OPERAR'}`, 115, startY + 22);

  // Alerta si tiene falla crítica
  let currentY = startY + 30;
  if (check.hasCriticalFailure) {
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(14, currentY, pageWidth - 28, 12, 1.5, 1.5, 'FD');
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('⚠ ATENCIÓN: DETECCIÓN DE NO CONFORMIDAD EN ÍTEM CRÍTICO', 18, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.text('Conforme Art. 6 Res. SRT 960/15, el equipo queda inmovilizado y con prohibición de circular hasta su reparación técnica.', 18, currentY + 9.5);
    currentY += 16;
  }

  // Tabla con los 15 ítems chequeados
  const tableData = DAILY_INSPECTION_ITEMS.map((item, idx) => {
    const val = check.responses[item.id] || 'conforme';
    const statusLabel = val === 'conforme' ? 'CONFORME' : val === 'no_conforme' ? 'NO CONFORME' : 'NO APLICA';
    return [
      String(idx + 1),
      item.title + (item.isCritical ? ' (* CRÍTICO)' : ''),
      item.description,
      statusLabel
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Punto de Control', 'Criterio de Aceptación Normativo', 'Estado']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 48, fontStyle: 'bold' },
      2: { cellWidth: 100 },
      3: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.6,
      overflow: 'linebreak'
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const text = String(data.cell.raw);
        if (text === 'CONFORME') {
          data.cell.styles.textColor = [22, 101, 52]; // Verde
        } else if (text === 'NO CONFORME') {
          data.cell.styles.textColor = [185, 28, 28]; // Rojo
          data.cell.styles.fillColor = [254, 226, 226];
        } else {
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
    }
  });

  // Observaciones y Firmas
  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Cuadro de observaciones
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, finalY, pageWidth - 28, 16, 1.5, 1.5, 'FD');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Observaciones del Turno / Acciones Correctivas Inmediatas:', 18, finalY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(check.observations || 'Sin observaciones adicionales. Equipo liberado para tareas operativas de carga y estiba.', 18, finalY + 11);

  // Bloque de Firmas
  const signY = finalY + 22;
  doc.setDrawColor(148, 163, 184);
  doc.line(20, signY + 12, 85, signY + 12);
  doc.line(125, signY + 12, 190, signY + 12);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(check.driverSignatureName || check.driverName, 52.5, signY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Firma y Aclaración del Conductor Habilitado', 52.5, signY + 19.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(check.supervisorSignatureName || 'Servicio de Higiene y Seguridad en el Trabajo', 157.5, signY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Firma y Sello Resp. Higiene y Seguridad / Supervisor', 157.5, signY + 19.5, { align: 'center' });

  // Pie de página legal
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('Registro reglamentario según Resolución S.R.T. N° 960/15 Art. 6. Debe conservarse archivado por un mínimo de 12 meses.', pageWidth / 2, 287, { align: 'center' });

  doc.save(`Checklist_Autoelevador_${check.vehicleCode}_${check.date}.pdf`);
}

/**
 * Genera la Ficha Técnica y Rótulo de Identificación para colocar en el equipo con QR
 */
export function generateForkliftEquipmentTagPdf(
  vehicle: ForkliftVehicle,
  companyName: string = 'Establecimiento Industrial'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Marco de seguridad industrial
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, 277);

  // Cabecera de advertencia
  doc.setFillColor(217, 119, 6);
  doc.rect(10, 10, pageWidth - 20, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VEHÍCULO AUTOPROPULSADO DE CARGA', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('IDENTIFICACIÓN REGLAMENTARIA — RESOLUCIÓN S.R.T. N° 960/15', pageWidth / 2, 29, { align: 'center' });

  // Código Gigante
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(44);
  doc.text(vehicle.internalCode, pageWidth / 2, 54, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(`${vehicle.brand} ${vehicle.model} (Año ${vehicle.year})`, pageWidth / 2, 63, { align: 'center' });

  // Datos Técnicos en Tabla
  autoTable(doc, {
    startY: 70,
    head: [['Parámetro Técnico', 'Especificación']],
    body: [
      ['Tipo de Propulsión', vehicle.type.replace('_', ' ').toUpperCase()],
      ['Capacidad Máxima de Carga', `${vehicle.capacityKg} kg`],
      ['Altura Máxima de Elevación', `${vehicle.maxLiftHeightMeters} metros`],
      ['Tipo de Mástil', vehicle.mastType.toUpperCase()],
      ['Rodado / Neumáticos', vehicle.tireType.replace('_', ' ').toUpperCase()],
      ['Sector Asignado', vehicle.sectorLocation],
      ['N° de Serie / Chasis', vehicle.serialNumber],
      ['Extintor Asignado', `${vehicle.fireExtinguisherNumber} (Vence: ${vehicle.fireExtinguisherExpiry})`],
      ['Horómetro Actual', `${vehicle.currentHours} horas`],
      ['Próximo Service Programado', `${vehicle.nextServiceHours} horas`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  const nextY = (doc as any).lastAutoTable.finalY + 12;

  // Cuadro de Seguridad y Prohibiciones
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(16, nextY, pageWidth - 32, 42, 2, 2, 'FD');

  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('NORMAS OBLIGATORIAS DE SEGURIDAD OPERATIVA (RES. 960/15)', 22, nextY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('1. PROHIBIDO conducir sin credencial habilitante anual vigente emitida por el empleador.', 22, nextY + 14);
  doc.text('2. OBLIGATORIO realizar el checklist pre-operacional diario antes de iniciar el turno.', 22, nextY + 19);
  doc.text('3. OBLIGATORIO el uso de cinturón de seguridad en todo momento durante la conducción.', 22, nextY + 24);
  doc.text('4. PROHIBIDO transportar pasajeros en el estribo, contrapeso o sobre las uñas.', 22, nextY + 29);
  doc.text('5. Velocidad máxima permitida en planta: 10 km/h. Prioridad absoluta al peatón.', 22, nextY + 34);
  doc.text('6. Carga siempre transportada a 15-20 cm del suelo con mástil inclinado hacia atrás.', 22, nextY + 39);

  // Espacio para QR
  const qrBoxY = nextY + 48;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(16, qrBoxY, pageWidth - 32, 44, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ESCANEE PARA REALIZAR EL CHECKLIST DIARIO O CONSULTAR HOJA DE VIDA', pageWidth / 2, qrBoxY + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Identificador Único del Equipo: ${vehicle.id}`, pageWidth / 2, qrBoxY + 18, { align: 'center' });
  doc.text(`Establecimiento: ${companyName}`, pageWidth / 2, qrBoxY + 23, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(Pegar este rótulo en lugar visible del chasis protegido con mica transparente)', pageWidth / 2, qrBoxY + 32, { align: 'center' });

  doc.save(`Rotulo_Autoelevador_${vehicle.internalCode}.pdf`);
}
