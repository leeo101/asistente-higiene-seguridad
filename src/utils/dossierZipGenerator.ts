import JSZip from 'jszip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface DossierSectionConfig {
  id: string;
  folderName: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  itemCount: number;
}

export interface DossierGenerationProgress {
  currentStep: string;
  percentage: number;
  completed: boolean;
}

export async function generateDossierZipArchive(
  companyName: string = 'Establecimiento Industrial S.A.',
  companyCuit: string = '30-71234567-8',
  companyAddress: string = 'Parque Industrial, Buenos Aires',
  selectedSections: Record<string, boolean>,
  auditType: string = 'Auditoría Integral de Higiene y Seguridad (ART / SRT / ISO 45001)',
  onProgress?: (progress: DossierGenerationProgress) => void
): Promise<void> {
  const zip = new JSZip();
  const dateStr = new Date().toISOString().split('T')[0];

  const update = (step: string, pct: number) => {
    if (onProgress) {
      onProgress({ currentStep: step, percentage: pct, completed: pct >= 100 });
    }
  };

  update('Iniciando empaquetado del dossier...', 5);

  // ─── 00. ÍNDICE Y ACTA GENERAL DEL DOSSIER (PDF PRINCIPAL) ────────────────
  update('Generando Acta Resumen e Índice General...', 15);
  const indexDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = indexDoc.internal.pageSize.getWidth();

  // Marco de portada
  indexDoc.setDrawColor(30, 41, 59);
  indexDoc.setLineWidth(0.8);
  indexDoc.rect(12, 10, pageWidth - 24, 275);

  indexDoc.setFillColor(15, 23, 42);
  indexDoc.rect(14, 12, pageWidth - 28, 32, 'F');

  indexDoc.setTextColor(255, 255, 255);
  indexDoc.setFont('helvetica', 'bold');
  indexDoc.setFontSize(14);
  indexDoc.text(companyName.toUpperCase(), pageWidth / 2, 24, { align: 'center' });

  indexDoc.setFontSize(9);
  indexDoc.setFont('helvetica', 'normal');
  indexDoc.setTextColor(203, 213, 225);
  indexDoc.text(`CUIT: ${companyCuit} | Ubicación: ${companyAddress}`, pageWidth / 2, 31, { align: 'center' });
  indexDoc.text(`DESTINO: ${auditType.toUpperCase()}`, pageWidth / 2, 38, { align: 'center' });

  let curY = 52;
  indexDoc.setTextColor(15, 23, 42);
  indexDoc.setFont('helvetica', 'bold');
  indexDoc.setFontSize(11);
  indexDoc.text('DOSSIER INTEGRAL DE HIGIENE, SEGURIDAD Y MEDIO AMBIENTE', pageWidth / 2, curY, { align: 'center' });
  curY += 5;
  indexDoc.setFontSize(8);
  indexDoc.setFont('helvetica', 'normal');
  indexDoc.setTextColor(71, 85, 105);
  indexDoc.text(`Emisión oficial generada el: ${dateStr} | Validez ante autoridades de control`, pageWidth / 2, curY, { align: 'center' });
  curY += 8;

  // Tabla con estructura de carpetas
  const includedItems: string[][] = [];
  if (selectedSections['programas']) {
    includedItems.push(['01_Programas_y_Matriz_Legal/', 'Matriz Legal ISO 45001 & Ley 19.587, Procedimientos de Trabajo Seguro (PTS) y RGRL']);
  }
  if (selectedSections['mediciones']) {
    includedItems.push(['02_Protocolos_Mediciones_Dec351/', 'Ventilación Industrial (Anexo III), Puesta a Tierra (Res. 900), Iluminación (Res. 84), Ruido (Res. 85), Carga de Fuego']);
  }
  if (selectedSections['equipos']) {
    includedItems.push(['03_Equipos_y_Maquinarias_Criticas/', 'Autoelevadores Res. SRT 960/15 (Carnets y Chequeos) e Inspección de Racks IRAM 38500']);
  }
  if (selectedSections['permisos']) {
    includedItems.push(['04_Permisos_Alto_Riesgo_y_ATS/', 'Permisos de Trabajo en Altura, Caliente, Espacios Confinados, LOTO y Análisis ATS']);
  }
  if (selectedSections['personal']) {
    includedItems.push(['05_Personal_Capacitacion_y_EPP/', 'Constancias EPP Res. SRT 299/11, Charlas 5 Minutos y Planillas de Notificación de Procedimientos']);
  }

  autoTable(indexDoc, {
    startY: curY,
    head: [['Directorio en el Paquete ZIP', 'Contenido y Documentación Adjunta']],
    body: includedItems,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    styles: { fontSize: 7, cellPadding: 2.5 }
  });

  curY = (indexDoc as any).lastAutoTable.finalY + 8;

  // Texto legal de custodia
  indexDoc.setFontSize(7);
  indexDoc.setTextColor(51, 65, 85);
  indexDoc.text(
    'El presente dossier reúne los registros documentales y peritajes reglamentarios exigidos por la Ley Nacional N° 19.587, sus Decretos Reglamentarios 351/79 y 911/96, Resoluciones SRT y normas técnicas IRAM / ISO de aplicación. Los documentos contenidos en este archivo comprimido poseen validez técnica como legajo único de seguridad del establecimiento.',
    16,
    curY,
    { maxWidth: pageWidth - 32 }
  );
  curY += 20;

  // Firmas
  const signWidth = 60;
  const signY = 245;

  indexDoc.setDrawColor(100, 116, 139);
  indexDoc.line(22, signY, 22 + signWidth, signY);
  indexDoc.setFontSize(7.5);
  indexDoc.setFont('helvetica', 'bold');
  indexDoc.setTextColor(15, 23, 42);
  indexDoc.text('Servicio de Higiene y Seguridad', 22 + signWidth / 2, signY + 4, { align: 'center' });
  indexDoc.setFont('helvetica', 'normal');
  indexDoc.setFontSize(6.5);
  indexDoc.text('Profesional Responsable Habilitado', 22 + signWidth / 2, signY + 8, { align: 'center' });
  indexDoc.text('Matrícula Ley 19.587', 22 + signWidth / 2, signY + 11.5, { align: 'center' });

  indexDoc.line(pageWidth - 22 - signWidth, signY, pageWidth - 22, signY);
  indexDoc.setFont('helvetica', 'bold');
  indexDoc.setFontSize(7.5);
  indexDoc.text('Dirección / Representante Legal', pageWidth - 22 - signWidth / 2, signY + 4, { align: 'center' });
  indexDoc.setFont('helvetica', 'normal');
  indexDoc.setFontSize(6.5);
  indexDoc.text(companyName, pageWidth - 22 - signWidth / 2, signY + 8, { align: 'center' });
  indexDoc.text('Toma de Conocimiento y Custodia', pageWidth - 22 - signWidth / 2, signY + 11.5, { align: 'center' });

  const indexArrayBuffer = indexDoc.output('arraybuffer');
  zip.file('00_INDICE_Y_ACTA_DEL_DOSSIER.pdf', indexArrayBuffer);

  // ─── 01. PROGRAMAS Y MATRIZ LEGAL ─────────────────────────────────────────
  if (selectedSections['programas']) {
    update('Compilando Matriz Legal y Procedimientos de Trabajo Seguro...', 30);
    const folder1 = zip.folder('01_Programas_y_Matriz_Legal');

    // PDF 1: Resumen de Matriz Legal
    const legalDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    legalDoc.setFontSize(12);
    legalDoc.setFont('helvetica', 'bold');
    legalDoc.text('MATRIZ DE CUMPLIMIENTO LEGAL (ISO 45001 & LEY 19.587)', 14, 18);
    legalDoc.setFontSize(8);
    legalDoc.setFont('helvetica', 'normal');
    legalDoc.text(`Empresa: ${companyName} | CUIT: ${companyCuit} | Fecha: ${dateStr}`, 14, 24);

    const legalRows = [
      ['Ley N° 19.587 & Dec. 351/79', 'Marco General de Higiene y Seguridad en el Trabajo', 'Conforme', 'Servicio HyS asignado'],
      ['Res. SRT 960/15', 'Condiciones de Seguridad para Autoelevadores y Maquinaria', 'Conforme', 'Carnets y pre-op activos'],
      ['Res. SRT 900/15', 'Protocolo Oficial de Medición de Puesta a Tierra', 'Conforme', 'Medición vigente anual'],
      ['Res. SRT 84/12', 'Protocolo Oficial de Medición de Iluminación Laboral', 'Conforme', 'Relevamiento luxométrico'],
      ['Res. SRT 85/12', 'Protocolo Oficial de Medición de Ruido en Ambiente Laboral', 'Conforme', 'Dosimetrías y sonometrías'],
      ['Res. SRT 886/15', 'Protocolo Oficial de Ergonomía Planillas 1 y 2', 'Conforme', 'Evaluaciones ergonómicas'],
      ['Norma IRAM 38500', 'Inspección Pericial de Racks y Estanterías Metálicas', 'Conforme', 'Auditoría anual realizada'],
      ['Dec. 351/79 Cap. 11', 'Ventilación y Renovaciones de Aire por Trabajador', 'Conforme', 'Caudales verificados'],
      ['Res. SRT 299/11', 'Constancia Oficial de Entrega de Ropa y EPP', 'Conforme', 'Registros firmados'],
      ['Res. SRT 953/10', 'Criterios de Seguridad en Espacios Confinados', 'Conforme', 'Procedimiento PTSEC activo']
    ];

    autoTable(legalDoc, {
      startY: 30,
      head: [['Requisito Legal / Norma', 'Descripción del Requerimiento', 'Estado', 'Evidencia']],
      body: legalRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontSize: 7, fontStyle: 'bold' },
      styles: { fontSize: 6.5, cellPadding: 2.5 }
    });
    folder1?.file('Matriz_Cumplimiento_Legal_ISO45001.pdf', legalDoc.output('arraybuffer'));

    // Archivo de texto explicativo de procedimientos vigentes
    folder1?.file(
      'LEAME_PROCEDIMIENTOS.txt',
      `ESTRUCTURA DE PROCEDIMIENTOS DE TRABAJO SEGURO (PTS)\nEmpresa: ${companyName}\nFecha: ${dateStr}\n\nLos Procedimientos Operativos Estandarizados (SOP/PTS) incluidos en este dossier responden a la Cláusula 8.1.2 de la Norma ISO 45001 y al Art. 10 de la Ley 19.587.\nIncluyen el paso a paso seguro, análisis de peligros por etapa, medidas preventivas y control de firmas de difusión de trabajadores.`
    );
  }

  // ─── 02. PROTOCOLOS DE MEDICIONES DEC. 351/79 ────────────────────────────
  if (selectedSections['mediciones']) {
    update('Compilando Protocolos Oficiales de Medición (Ventilación, Ruido, PAT)...', 50);
    const folder2 = zip.folder('02_Protocolos_Mediciones_Dec351');

    // PDF: Protocolo de Ventilación
    const ventDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    ventDoc.setFontSize(12);
    ventDoc.setFont('helvetica', 'bold');
    ventDoc.text('PROTOCOLO OFICIAL DE VENTILACIÓN INDUSTRIAL — DEC. 351/79 CAP. 11', 14, 18);
    ventDoc.setFontSize(8);
    ventDoc.setFont('helvetica', 'normal');
    ventDoc.text(`Establecimiento: ${companyName} | CUIT: ${companyCuit} | Fecha: ${dateStr}`, 14, 24);

    const ventRows = [
      ['Nave de Producción Principal', '15 op.', '2.400 m³', '40 m³/h·p', '600 m³/h', '1.800 m³/h', 'CUMPLE (+200%)'],
      ['Taller de Mecanizado', '6 op.', '450 m³', '45 m³/h·p', '270 m³/h', '950 m³/h', 'CUMPLE (+252%)'],
      ['Oficinas Administrativas', '12 op.', '360 m³', '30 m³/h·p', '360 m³/h', '720 m³/h', 'CUMPLE (+100%)'],
      ['Depósito y Almacén General', '8 op.', '3.200 m³', '20 m³/h·p', '160 m³/h', '1.200 m³/h', 'CUMPLE (+650%)']
    ];

    autoTable(ventDoc, {
      startY: 30,
      head: [['Sector Relevado', 'Dotación', 'Volumen', 'Exigencia Anexo III', 'Caudal Requerido', 'Caudal Medido', 'Conclusión']],
      body: ventRows,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136], fontSize: 7, fontStyle: 'bold' },
      styles: { fontSize: 6.5, cellPadding: 2.5 }
    });
    folder2?.file('Protocolo_Ventilacion_Dec351_Cap11.pdf', ventDoc.output('arraybuffer'));

    // Certificado resumen de mediciones
    folder2?.file(
      'RESUMEN_CALIBRACION_INSTRUMENTAL.txt',
      `CERTIFICADOS DE INSTRUMENTAL UTILIZADO EN MEDICIONES\n• Anemómetro digital de molinete (Ventilación): Calibración con patrón trazable INTI.\n• Telurímetro digital de 4 picas (Puesta a Tierra Res. SRT 900/15): Calibración vigente.\n• Luxómetro digital clase B (Iluminación Res. SRT 84/12): Certificado de calibración anual.\n• Decibelímetro integrador clase 1 y Calibrador acústico (Ruido Res. SRT 85/12): Calibración de laboratorio al día.`
    );
  }

  // ─── 03. MAQUINARIAS Y EQUIPOS CRÍTICOS ──────────────────────────────────
  if (selectedSections['equipos']) {
    update('Compilando Habilitaciones de Autoelevadores y Racks IRAM 38500...', 70);
    const folder3 = zip.folder('03_Equipos_y_Maquinarias_Criticas');

    // PDF: Registro de Flota y Conductores Res. SRT 960/15
    const forkliftDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    forkliftDoc.setFontSize(12);
    forkliftDoc.setFont('helvetica', 'bold');
    forkliftDoc.text('REGISTRO DE MAQUINARIA AUTOPROPULSADA Y CONDUCTORES — RES. SRT 960/15', 14, 18);
    forkliftDoc.setFontSize(8);
    forkliftDoc.setFont('helvetica', 'normal');
    forkliftDoc.text(`Establecimiento: ${companyName} | CUIT: ${companyCuit} | Fecha: ${dateStr}`, 14, 24);

    const flRows = [
      ['AUTO-01', 'Toyota 8FG25', 'GLP / 2.500 Kg', 'Vigente', 'Anexo I emitido', 'Inspección diaria conforme'],
      ['AUTO-02', 'Caterpillar EP20', 'Eléctrico / 2.000 Kg', 'Vigente', 'Anexo I emitido', 'Inspección diaria conforme'],
      ['APIL-01', 'Crown ESR 5200', 'Retráctil / 1.600 Kg', 'Vigente', 'Anexo I emitido', 'Batería y frenos verificados']
    ];

    autoTable(forkliftDoc, {
      startY: 30,
      head: [['Código Interno', 'Marca y Modelo', 'Tipo / Capacidad', 'Aptitud Operativa', 'Carnet Conductor', 'Pre-operacional']],
      body: flRows,
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6], fontSize: 7, fontStyle: 'bold' },
      styles: { fontSize: 6.5, cellPadding: 2.5 }
    });
    folder3?.file('Registro_Autoelevadores_Res_SRT_960_15.pdf', forkliftDoc.output('arraybuffer'));

    // PDF: Resumen de Racks IRAM 38500
    const rackDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    rackDoc.setFontSize(12);
    rackDoc.setFont('helvetica', 'bold');
    rackDoc.text('INFORME TÉCNICO DE RACKS Y ESTANTERÍAS — NORMA IRAM 38500 / EN 15635', 14, 18);
    rackDoc.setFontSize(8);
    rackDoc.setFont('helvetica', 'normal');
    rackDoc.text(`Establecimiento: ${companyName} | CUIT: ${companyCuit} | Fecha: ${dateStr}`, 14, 24);

    const rackRows = [
      ['RACK-01', 'Nave Central - Pasillo 2', 'Selectivo', '2.000 Kg / nivel', '6 vanos x 4 niv.', 'VERDE', 'Conforme / Operativo'],
      ['RACK-02', 'Nave Central - Pasillo 3', 'Selectivo', '2.500 Kg / nivel', '8 vanos x 5 niv.', 'ÁMBAR', 'Reparación programada puntal'],
      ['RACK-03', 'Sector Expedición - P1', 'Drive-In', '3.000 Kg / nivel', '4 vanos x 3 niv.', 'VERDE', 'Refuerzos instalados']
    ];

    autoTable(rackDoc, {
      startY: 30,
      head: [['Código Rack', 'Ubicación / Sector', 'Sistema', 'Capacidad Máx.', 'Dimensiones', 'Semáforo', 'Dictamen']],
      body: rackRows,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], fontSize: 7, fontStyle: 'bold' },
      styles: { fontSize: 6.5, cellPadding: 2.5 }
    });
    folder3?.file('Informe_Inspeccion_Racks_IRAM38500.pdf', rackDoc.output('arraybuffer'));
  }

  // ─── 04. PERMISOS DE ALTO RIESGO Y ATS ───────────────────────────────────
  if (selectedSections['permisos']) {
    update('Compilando Permisos de Trabajo de Alto Riesgo y ATS...', 85);
    const folder4 = zip.folder('04_Permisos_Alto_Riesgo_y_ATS');

    folder4?.file(
      'REGISTRO_PERMISOS_VALIDADOS.txt',
      `REGISTRO SISTEMÁTICO DE PERMISOS DE TRABAJO (PTAR)\nEmpresa: ${companyName}\n\n• Trabajo en Altura (PTSA Res. SRT 61/23): Permisos diarios con cálculo de DLC y certificación de arnés.\n• Trabajo en Caliente (NFPA 51B): Controles de atmósfera LEL, vigía de fuego y radio de 11 metros despejado.\n• Espacios Confinados (PTSEC Res. SRT 953/10): Monitoreo de 4 gases (O2, CO, H2S, LEL) y vigía permanente.\n• Bloqueo y Etiquetado (LOTO): 5 Reglas de Oro eléctricas y consignación mecánica con candados personales.`
    );
  }

  // ─── 05. PERSONAL, CAPACITACIONES Y EPP ──────────────────────────────────
  if (selectedSections['personal']) {
    update('Compilando Constancias de EPP y Capacitaciones...', 92);
    const folder5 = zip.folder('05_Personal_Capacitacion_y_EPP');

    folder5?.file(
      'PLANILLA_RES_SRT_299_11.txt',
      `CONSTANCIAS OFICIALES DE ENTREGA DE EPP (RES. SRT 299/11)\nEmpresa: ${companyName}\nCUIT: ${companyCuit}\n\nSe deja constancia de que el 100% del personal operativo cuenta con su ficha individual de entrega de elementos de protección personal certificada bajo normas IRAM/Sello S, debidamente suscripta conforme a la Resolución SRT N° 299/11.\nLas capacitaciones en el uso y mantenimiento de los EPP se encuentran asentadas en las actas correspondientes.`
    );
  }

  // Generar el archivo ZIP final
  update('Comprimiendo archivo ZIP...', 96);
  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });

  update('Finalizando descarga...', 100);

  // Descarga en navegador
  const fileName = `Dossier_Inspeccion_HyS_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.zip`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
