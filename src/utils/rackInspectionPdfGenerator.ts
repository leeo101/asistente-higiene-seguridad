import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  RackInspectionReport,
  RackSystem,
  RACK_TYPE_LABELS,
  RACK_RISK_INFO
} from '../data/rackInspectionData';

export function generateRackTechnicalReportPdf(
  report: RackInspectionReport,
  rack: RackSystem | undefined,
  companyName: string = 'Establecimiento Logístico S.A.',
  companyCuit: string = '30-XXXXXXXX-X'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ─── ENCABEZADO TÉCNICO OFICIAL ──────────────────────────────────────────
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.rect(14, 10, pageWidth - 28, 22);

  // Divisiones del encabezado
  doc.line(60, 10, 60, 32);
  doc.line(155, 10, 155, 32);
  doc.line(155, 17, pageWidth - 14, 17);
  doc.line(155, 24, pageWidth - 14, 24);

  // Empresa
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(companyName.toUpperCase(), 37, 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`CUIT: ${companyCuit}`, 37, 25, { align: 'center' });

  // Título Central
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('INFORME TÉCNICO PERICIAL DE RACKS Y ESTANTERÍAS', 107.5, 17, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('INSPECCIÓN TÉCNICA VISUAL ANUAL — NORMA IRAM 38500 / UNE-EN 15635', 107.5, 23, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Identificación: ${report.rackCode} | Sector: ${report.warehouseSector}`, 107.5, 28, { align: 'center' });

  // Control Documental Derecho
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(6.5);
  doc.text(`FECHA: ${report.inspectionDate}`, 158, 14.5);
  doc.text(`DICTAMEN: ${report.overallResult === 'peligro_rojo_descarga_inmediata' ? 'PELIGRO ROJO' : report.overallResult === 'riesgo_ambar' ? 'RIESGO ÁMBAR' : 'CONFORME'}`, 158, 21.5);
  doc.text(`ACTA: RACK-${report.id.substring(0, 6).toUpperCase()}`, 158, 28.5);

  let currentY = 38;

  // ─── 1. DATOS TÉCNICOS DE LA INSTALACIÓN ─────────────────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, pageWidth - 28, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('1. PARÁMETROS ESTRUCTURALES DEL EQUIPAMIENTO ALMACENERO', 18, currentY + 4.2);
  currentY += 8;

  const rackTypeStr = rack ? RACK_TYPE_LABELS[rack.rackType] || rack.rackType : 'Selectivo Convencional';
  const manufacturerStr = rack?.manufacturer || 'No especificado';
  const installYear = rack?.installationYear || '—';
  const totalBays = rack?.totalBays || '—';
  const totalLevels = rack?.totalLevels || '—';
  const maxBayKg = rack?.maxBayLoadKg ? `${rack.maxBayLoadKg.toLocaleString('es-AR')} Kg` : 'No informado';
  const maxLevelKg = rack?.maxLevelLoadKg ? `${rack.maxLevelLoadKg.toLocaleString('es-AR')} Kg` : 'No informado';

  autoTable(doc, {
    startY: currentY,
    head: [['Código Rack', 'Tipo de Sistema', 'Fabricante', 'Año Montaje', 'Vanos', 'Niveles', 'Carga Máx / Nivel', 'Carga Máx / Vano']],
    body: [[report.rackCode, rackTypeStr, manufacturerStr, String(installYear), String(totalBays), String(totalLevels), maxLevelKg, maxBayKg]],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 6.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { fontSize: 7, cellPadding: 2, halign: 'center' }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ─── 2. CHECKLIST GENERAL DE SEGURIDAD (IRAM 38500 / EN 15635) ─────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, pageWidth - 28, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('2. AUDITORÍA DE CONDICIONES GENERALES Y DISPOSITIVOS DE SEGURIDAD', 18, currentY + 4.2);
  currentY += 8;

  const generalRows = [
    [
      'Placas de Características de Carga Admisible',
      report.generalChecks.loadPlatesPresent ? 'CONFORME (Visibles en cabeceras)' : 'NO CONFORME (Faltante de señalización)',
      'Obligatorio según IRAM 38500 Art. 6. Indicar carga máx. por nivel y módulo.'
    ],
    [
      'Clavijas / Pasadores de Bloqueo de Largueros',
      report.generalChecks.safetyPinsPresent ? 'CONFORME (100% colocadas)' : 'CRÍTICO (Existen largueros sin pasador)',
      'Previene el desenganche accidental de los largueros por izaje involuntario.'
    ],
    [
      'Anclajes a Solera de Hormigón (Pisos)',
      report.generalChecks.groundAnchorsSecured ? 'CONFORME (Bulones ajustados y firmes)' : 'NO CONFORME (Anclajes flojos o arrancados)',
      'Deben contar con al menos 2 anclajes expansivos/químicos por placa base.'
    ],
    [
      'Protectores de Puntal en Cabeceras y Pasos',
      report.generalChecks.columnProtectorsPresent ? 'CONFORME (Protecciones instaladas)' : 'OBSERVACIÓN (Puntales de esquina expuestos)',
      'Exigidos en todos los puntales de esquina y accesos a túneles peatonales.'
    ],
    [
      'Aplomo y Verticalidad de Bastidores',
      report.generalChecks.verticalityCompliant ? 'CONFORME (Desplome dentro de H/200)' : 'NO CONFORME (Desplome superior a tolerancia)',
      'Tolerancia máxima de verticalidad no puede superar H / 200 en ningún sentido.'
    ],
    [
      'Ancho Libre de Pasillos de Circulación',
      report.generalChecks.clearAisles ? 'CONFORME (Sin acopios en suelo)' : 'OBSERVACIÓN (Obstáculos en zonas de maniobra)',
      'Respetar distancias mínimas para radio de giro de autoelevadores.'
    ],
    [
      'Estado Estructural de Pallets / Tarimas',
      report.generalChecks.palletConditionGood ? 'CONFORME (Pallets normalizados y sanos)' : 'OBSERVACIÓN (Pallets quebrados o fisurados)',
      'Pallets defectuosos transmiten esfuerzos asimétricos a los largueros.'
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Ítem de Control Normativo', 'Estado Verificado', 'Criterio IRAM 38500 / EN 15635']],
    body: generalRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 6.5,
      fontStyle: 'bold'
    },
    styles: { fontSize: 6.5, cellPadding: 2 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val.includes('CONFORME')) {
          data.cell.styles.textColor = [16, 149, 103];
          data.cell.styles.fontStyle = 'bold';
        } else if (val.includes('CRÍTICO') || val.includes('NO CONFORME')) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ─── 3. CLASIFICACIÓN DE DAÑOS Y SEMÁFORO DE RIESGO ───────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, pageWidth - 28, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('3. MATRIZ DE DAÑOS Y CLASIFICACIÓN POR SEMÁFORO DE RIESGO', 18, currentY + 4.2);
  currentY += 8;

  if (report.damages.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 149, 103);
    doc.text('No se detectaron deformaciones ni daños mecánicos. Estantería 100% OPERATIVA y CONFORME.', 18, currentY + 3);
    currentY += 10;
  } else {
    const damageRows = report.damages.map((dmg, idx) => {
      const riskBadge =
        dmg.damageLevel === 'rojo'
          ? 'ROJO (Peligro Crítico)'
          : dmg.damageLevel === 'ambar'
          ? 'ÁMBAR (Reparar < 4 sem)'
          : 'VERDE (Vigilancia)';

      const defStr =
        dmg.measuredDeformationMm > 0
          ? `${dmg.measuredDeformationMm} mm (Tol: ${dmg.allowableToleranceMm} mm)`
          : 'N/A';

      return [
        String(idx + 1),
        `Vano ${dmg.bayNumber} / Niv ${dmg.levelNumber}`,
        dmg.componentLabel,
        riskBadge,
        defStr,
        dmg.description,
        dmg.correctiveAction
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Ubicación', 'Elemento', 'Semáforo de Riesgo', 'Deformación', 'Descripción del Daño', 'Medida Correctiva Obligatoria']],
      body: damageRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 6.5,
        fontStyle: 'bold'
      },
      styles: { fontSize: 6.5, cellPadding: 2 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = String(data.cell.raw);
          if (val.includes('ROJO')) {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          } else if (val.includes('ÁMBAR')) {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.fillColor = [209, 250, 229];
            data.cell.styles.textColor = [4, 120, 87];
          }
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // ─── ALERTA DE DESCARGA INMEDIATA SI ES ROJO ──────────────────────────────
  if (report.immediateUnloadRequired || report.overallResult === 'peligro_rojo_descarga_inmediata') {
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.6);
    doc.rect(14, currentY, pageWidth - 28, 16, 'FD');

    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('⚠ ADVERTENCIA CRÍTICA: DESCARGA INMEDIATA OBLIGATORIA DEL RACK', pageWidth / 2, currentY + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(127, 29, 29);
    doc.text(
      'Se han detectado daños de Nivel ROJO según IRAM 38500 que comprometen la resistencia al colapso. Queda terminantemente PROHIBIDO operar, circular o manipular carga bajo o sobre los módulos señalados hasta su reemplazo estructural.',
      pageWidth / 2,
      currentY + 11.5,
      { align: 'center', maxWidth: pageWidth - 36 }
    );
    currentY += 21;
  }

  // ─── 4. CONCLUSIONES Y PLAN DE ACCIÓN ─────────────────────────────────────
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, pageWidth - 28, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('4. CONCLUSIONES PERICIALES Y PLAN DE ACCIÓN', 18, currentY + 4.2);
  currentY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  const conclusionsText = report.conclusions || 'Se recomienda continuar con las inspecciones visuales periódicas.';
  const splittedConc = doc.splitTextToSize(conclusionsText, pageWidth - 32);
  doc.text(splittedConc, 16, currentY);
  currentY += splittedConc.length * 3.5 + 4;

  if (report.actionPlan) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Plan de Acción Prioritario:', 16, currentY);
    currentY += 3.5;
    doc.setFont('helvetica', 'normal');
    const splittedPlan = doc.splitTextToSize(report.actionPlan, pageWidth - 32);
    doc.text(splittedPlan, 16, currentY);
    currentY += splittedPlan.length * 3.5 + 8;
  }

  // ─── 5. FIRMAS DE RESPONSABILIDAD TÉCNICA ─────────────────────────────────
  if (currentY > 250) {
    doc.addPage();
    currentY = 30;
  }

  const signWidth = 60;
  const signY = Math.max(currentY + 4, 255);

  // Inspector
  doc.setDrawColor(100, 116, 139);
  doc.line(25, signY, 25 + signWidth, signY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(report.inspectorName || 'Lic. en Higiene y Seguridad', 25 + signWidth / 2, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(report.inspectorRegistration || 'Especialista en Seguridad Laboral', 25 + signWidth / 2, signY + 7.5, { align: 'center' });
  doc.text('Inspector Técnico Autorizado IRAM 38500', 25 + signWidth / 2, signY + 11, { align: 'center' });

  // Responsable Almacén / Empresa
  doc.line(pageWidth - 25 - signWidth, signY, pageWidth - 25, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Responsable de Almacén / Logística', pageWidth - 25 - signWidth / 2, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(companyName, pageWidth - 25 - signWidth / 2, signY + 7.5, { align: 'center' });
  doc.text('Toma de Conocimiento y Bloqueo', pageWidth - 25 - signWidth / 2, signY + 11, { align: 'center' });

  doc.save(`Informe_Tecnico_IRAM38500_${report.rackCode}_${report.inspectionDate}.pdf`);
}

// ─── CARTEL A4 DE BLOQUEO / HABILITACIÓN PARA IMPRIMIR Y PEGAR EN EL RACK ──────
export function generateRackLockoutTagPdf(
  report: RackInspectionReport,
  rack: RackSystem | undefined,
  companyName: string = 'Establecimiento Logístico S.A.'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const isRed = report.overallResult === 'peligro_rojo_descarga_inmediata' || report.immediateUnloadRequired;
  const isAmber = report.overallResult === 'riesgo_ambar';

  // Franja de advertencia perimetral
  const mainColor: [number, number, number] = isRed ? [220, 38, 38] : isAmber ? [217, 119, 6] : [16, 185, 129];
  doc.setDrawColor(...mainColor);
  doc.setLineWidth(4);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Cabecera superior
  doc.setFillColor(...mainColor);
  doc.rect(10, 10, pageWidth - 20, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(companyName.toUpperCase(), pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(14);
  if (isRed) {
    doc.text('¡RACK CLAUSURADO — PELIGRO DE COLAPSO!', pageWidth / 2, 33, { align: 'center' });
  } else if (isAmber) {
    doc.text('¡ATENCIÓN: REPARACIÓN OBLIGATORIA PENDIENTE!', pageWidth / 2, 33, { align: 'center' });
  } else {
    doc.text('ESTANTERÍA HABILITADA Y CONFORME (IRAM 38500)', pageWidth / 2, 33, { align: 'center' });
  }

  // Código de Rack en gigante
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text('IDENTIFICACIÓN DEL EQUIPO:', pageWidth / 2, 58, { align: 'center' });

  doc.setFontSize(44);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mainColor);
  doc.text(report.rackCode, pageWidth / 2, 75, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Sector: ${report.warehouseSector}`, pageWidth / 2, 85, { align: 'center' });

  // Cuadro central de instrucciones
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.setFillColor(248, 250, 252);
  doc.rect(20, 95, pageWidth - 40, 80, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('DIRECTIVAS OPERATIVAS OBLIGATORIAS:', 25, 107);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  if (isRed) {
    doc.text('1. PROHIBIDO CARGAR O APOYAR MERCADERÍA en este sector.', 25, 120);
    doc.text('2. DESCARGA INMEDIATA y preventiva de los vanos señalados.', 25, 130);
    doc.text('3. MANTENER DISTANCIA DE SEGURIDAD. No circular por debajo.', 25, 140);
    doc.text('4. Esta clausura solo puede ser levantada por el Servicio HyS.', 25, 150);
    doc.text('5. Acta de Intervención pericial según Norma IRAM 38500.', 25, 160);
  } else if (isAmber) {
    doc.text('1. Vano con daño estructural nivel Ámbar en período de subsanación.', 25, 120);
    doc.text('2. NO volver a depositar pallets una vez desocupado el nivel.', 25, 130);
    doc.text('3. Operar autoelevadores a velocidad mínima extrema (< 5 km/h).', 25, 140);
    doc.text('4. Reemplazo del elemento dañado obligatorio en menos de 4 semanas.', 25, 150);
    doc.text('5. Notificar de inmediato cualquier golpe adicional al puntal.', 25, 160);
  } else {
    doc.text('1. Estructura auditada sin deformaciones críticas.', 25, 120);
    doc.text(`2. Carga máxima por nivel: ${rack?.maxLevelLoadKg ? `${rack.maxLevelLoadKg} Kg` : 'Según placa'}.`, 25, 130);
    doc.text(`3. Carga máxima por vano: ${rack?.maxBayLoadKg ? `${rack.maxBayLoadKg} Kg` : 'Según placa'}.`, 25, 140);
    doc.text('4. Verificar colocación obligatoria de clavijas de seguridad.', 25, 150);
    doc.text('5. Mantener los pasillos despejados de interferencias.', 25, 160);
  }

  // Capacidad de Carga Destacada
  if (rack) {
    doc.setFillColor(241, 245, 249);
    doc.rect(20, 185, pageWidth - 40, 30, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('CARGA MÁXIMA ADMISIBLE POR PAR DE LARGUEROS:', pageWidth / 2, 195, { align: 'center' });

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(`${rack.maxLevelLoadKg.toLocaleString('es-AR')} KG / NIVEL`, pageWidth / 2, 207, { align: 'center' });
  }

  // Pie de cartel con fecha e inspector
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Inspección Pericial realizada el: ${report.inspectionDate} | Inspector: ${report.inspectorName}`, pageWidth / 2, 245, { align: 'center' });
  doc.text(`Próxima Inspección Reglamentaria: ${rack?.nextInspectionDate || 'En 12 meses'} | Ley 19.587 Dec. 351/79`, pageWidth / 2, 252, { align: 'center' });

  doc.save(`Cartel_RACK_${report.rackCode}_${isRed ? 'CLAUSURA' : isAmber ? 'ALERTA' : 'HABILITADO'}.pdf`);
}
