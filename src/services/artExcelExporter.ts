import ExcelJS from 'exceljs';
import type { RGRLSurvey } from '../types/rgrl';
import type { RARSurvey } from '../types/rar';
import { getAgentByCode } from '../utils/rarCatalog';

/**
 * Descarga en el navegador un buffer de ExcelJS como archivo .xlsx
 */
async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

/**
 * Exporta el Relevamiento General de Riesgos Laborales (RGRL)
 * según formato oficial de la Superintendencia de Riesgos del Trabajo (Res. SRT 463/09, 529/09 y 74/10)
 */
export async function exportRGRLToOfficialExcel(survey: RGRLSurvey): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asistente H&S - Sistema de Gestión EHS';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('RGRL Oficial SRT');

  // Configuración de anchos de columna
  sheet.columns = [
    { key: 'item', width: 12 },
    { key: 'seccion', width: 26 },
    { key: 'pregunta', width: 55 },
    { key: 'normativa', width: 22 },
    { key: 'estado', width: 16 },
    { key: 'plazo', width: 18 },
    { key: 'responsable', width: 22 },
    { key: 'observaciones', width: 35 }
  ];

  // 1. TÍTULO OFICIAL
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'SUPERINTENDENCIA DE RIESGOS DEL TRABAJO — RELEVAMIENTO GENERAL DE RIESGOS LABORALES (RGRL)';
  titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  sheet.mergeCells('A2:H2');
  const subCell = sheet.getCell('A2');
  const anexoName = survey.anexo === 'anexo2_911'
    ? 'ANEXO II — INDUSTRIA DE LA CONSTRUCCIÓN (Dec. 911/96)'
    : survey.anexo === 'anexo3_617'
    ? 'ANEXO III — ACTIVIDAD AGRARIA (Dec. 617/97)'
    : 'ANEXO I — INDUSTRIA GENERAL Y COMERCIO (Dec. 351/79)';
  subCell.value = `${anexoName} — Resoluciones S.R.T. N° 463/09, 529/09 y 74/10`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFF' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 22;

  // 2. DATOS DE CABECERA
  const addInfoRow = (rNum: number, label1: string, val1: string, label2: string, val2: string) => {
    sheet.mergeCells(`A${rNum}:B${rNum}`);
    sheet.getCell(`A${rNum}`).value = label1;
    sheet.getCell(`A${rNum}`).font = { name: 'Arial', size: 9, bold: true, color: { argb: '334155' } };
    sheet.getCell(`A${rNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };

    sheet.mergeCells(`C${rNum}:D${rNum}`);
    sheet.getCell(`C${rNum}`).value = val1 || '-';
    sheet.getCell(`C${rNum}`).font = { name: 'Arial', size: 9, bold: true };

    sheet.mergeCells(`E${rNum}:F${rNum}`);
    sheet.getCell(`E${rNum}`).value = label2;
    sheet.getCell(`E${rNum}`).font = { name: 'Arial', size: 9, bold: true, color: { argb: '334155' } };
    sheet.getCell(`E${rNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };

    sheet.mergeCells(`G${rNum}:H${rNum}`);
    sheet.getCell(`G${rNum}`).value = val2 || '-';
    sheet.getCell(`G${rNum}`).font = { name: 'Arial', size: 9, bold: true };
    sheet.getRow(rNum).height = 20;
  };

  addInfoRow(4, 'Razón Social:', survey.razonSocial, 'C.U.I.T. N°:', survey.cuit);
  addInfoRow(5, 'Establecimiento:', survey.establecimientoNombre, 'Dirección / Localidad:', `${survey.direccion || ''} - ${survey.localidad || ''}`);
  addInfoRow(6, 'Aseguradora (ART):', survey.artNombre, 'Póliza N°:', survey.nroPoliza || 'S/N');
  addInfoRow(7, 'Fecha Relevamiento:', survey.fechaRelevamiento, 'Trabajadores Ocupados:', `${survey.cantidadTrabajadores || 0} personas`);
  addInfoRow(8, 'Profesional actuante:', survey.profesionalHySNombre, 'Matrícula H&S:', survey.profesionalHySMatricula);

  // 3. ENCABEZADOS DE TABLA
  const headerRowIndex = 10;
  const headers = [
    'Ítem', 'Sección / Capítulo', 'Pregunta / Requisito Legal Exigible',
    'Normativa Legal', 'Estado', 'Plazo Regularización', 'Responsable', 'Observaciones Técnicas'
  ];
  const hRow = sheet.getRow(headerRowIndex);
  hRow.values = headers;
  hRow.height = 26;

  hRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '94A3B8' } },
      bottom: { style: 'medium', color: { argb: '0F172A' } },
      left: { style: 'thin', color: { argb: '94A3B8' } },
      right: { style: 'thin', color: { argb: '94A3B8' } }
    };
  });

  // 4. DATOS
  let curRow = headerRowIndex + 1;
  const items = survey.items || [];

  items.forEach((item) => {
    const r = sheet.getRow(curRow);
    const estadoText = item.estado === 'CUMPLE' ? 'CUMPLE' : item.estado === 'NO_CUMPLE' ? 'NO CUMPLE' : 'NO APLICA';

    r.values = [
      item.codigo || `Item ${curRow - headerRowIndex}`,
      item.seccion || 'General',
      item.pregunta,
      item.normativa || 'Dec. 351/79',
      estadoText,
      item.plazoRegularizacion || (item.estado === 'NO_CUMPLE' ? 'Inmediato (30 días)' : '-'),
      item.responsable || survey.profesionalHySNombre || '-',
      item.observacion || ''
    ];

    r.height = 28;

    // Alineación
    r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(2).alignment = { vertical: 'middle', wrapText: true };
    r.getCell(3).alignment = { vertical: 'middle', wrapText: true };
    r.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(7).alignment = { vertical: 'middle' };
    r.getCell(8).alignment = { vertical: 'middle', wrapText: true };

    // Colores condicionales según cumplimiento
    const estadoCell = r.getCell(5);
    if (item.estado === 'CUMPLE') {
      estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } }; // Verde suave
      estadoCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '166534' } };
    } else if (item.estado === 'NO_CUMPLE') {
      estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } }; // Rojo suave
      estadoCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '991B1B' } };
    } else {
      estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } }; // Gris neutro
      estadoCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '475569' } };
    }

    curRow++;
  });

  const filename = `RGRL_Oficial_${(survey.razonSocial || 'Empresa').replace(/[^a-zA-Z0-9]/g, '_')}_${survey.fechaRelevamiento || '2026'}.xlsx`;
  await downloadWorkbook(workbook, filename);
}

/**
 * Exporta el Relevamiento de Agentes de Riesgo (RAR) y Nómina de Trabajadores Expuestos
 * según formato oficial para Aseguradoras de Riesgos del Trabajo (Res. SRT 37/10 y 81/19)
 */
export async function exportRARToOfficialExcel(survey: RARSurvey): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asistente H&S - Sistema de Gestión EHS';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Nómina RAR Oficial SRT');

  // Configuración de anchos de columna
  sheet.columns = [
    { key: 'nro', width: 6 },
    { key: 'cuil', width: 18 },
    { key: 'nombre', width: 32 },
    { key: 'ingreso', width: 14 },
    { key: 'puesto', width: 24 },
    { key: 'sector', width: 22 },
    { key: 'codAgente', width: 14 },
    { key: 'descAgente', width: 30 },
    { key: 'horasExp', width: 14 },
    { key: 'diasSem', width: 12 },
    { key: 'epp', width: 12 },
    { key: 'examen', width: 28 }
  ];

  // 1. TÍTULO OFICIAL
  sheet.mergeCells('A1:L1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'SUPERINTENDENCIA DE RIESGOS DEL TRABAJO — NÓMINA DE TRABAJADORES EXPUESTOS (RAR)';
  titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  sheet.mergeCells('A2:L2');
  const subCell = sheet.getCell('A2');
  subCell.value = 'Resolución S.R.T. N° 37/10 • Decreto 658/96 (Enfermedades Profesionales) • Res. S.R.T. 81/19 (Cancerígenos)';
  subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFFFFF' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 20;

  // 2. METADATOS DE EMPRESA
  const addInfoRow = (rNum: number, label1: string, val1: string, label2: string, val2: string) => {
    sheet.mergeCells(`A${rNum}:B${rNum}`);
    sheet.getCell(`A${rNum}`).value = label1;
    sheet.getCell(`A${rNum}`).font = { name: 'Arial', size: 9, bold: true, color: { argb: '334155' } };
    sheet.getCell(`A${rNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };

    sheet.mergeCells(`C${rNum}:F${rNum}`);
    sheet.getCell(`C${rNum}`).value = val1 || '-';
    sheet.getCell(`C${rNum}`).font = { name: 'Arial', size: 9, bold: true };

    sheet.mergeCells(`G${rNum}:H${rNum}`);
    sheet.getCell(`G${rNum}`).value = label2;
    sheet.getCell(`G${rNum}`).font = { name: 'Arial', size: 9, bold: true, color: { argb: '334155' } };
    sheet.getCell(`G${rNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };

    sheet.mergeCells(`I${rNum}:L${rNum}`);
    sheet.getCell(`I${rNum}`).value = val2 || '-';
    sheet.getCell(`I${rNum}`).font = { name: 'Arial', size: 9, bold: true };
    sheet.getRow(rNum).height = 20;
  };

  addInfoRow(4, 'Razón Social:', survey.razonSocial, 'C.U.I.T. N°:', survey.cuit);
  addInfoRow(5, 'Establecimiento:', `${survey.establecimientoNombre} (N° ${survey.establecimientoNumero || '01'})`, 'Dirección / Localidad:', `${survey.direccion || ''} - ${survey.localidad || ''}`);
  addInfoRow(6, 'Aseguradora (ART):', survey.artNombre, 'Contrato / Póliza N°:', survey.nroPoliza || 'S/N');
  addInfoRow(7, 'Fecha Relevamiento:', survey.fechaRelevamiento, 'CIIU Actividad:', survey.ciiuActividad || 'Actividad Industrial');
  addInfoRow(8, 'Profesional H&S:', `${survey.profesionalNombre || ''} (Mat. ${survey.profesionalMatricula || ''})`, 'Empleador / Responsable:', survey.empleadorResponsable || 'Representante Legal');

  // 3. ENCABEZADOS DE TABLA
  const headerRowIndex = 10;
  const headers = [
    'N°', 'C.U.I.L.', 'Apellido y Nombre', 'Fecha Ingreso',
    'Puesto de Trabajo', 'Sector / Área', 'Cód. SRT', 'Agente de Riesgo',
    'Hs/Día', 'Días/Sem', 'EPP Adecuado', 'Exámenes Periódicos Exigidos'
  ];
  const hRow = sheet.getRow(headerRowIndex);
  hRow.values = headers;
  hRow.height = 26;

  hRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F766E' } }; // Verde azulado institucional
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '94A3B8' } },
      bottom: { style: 'medium', color: { argb: '134E4A' } },
      left: { style: 'thin', color: { argb: '94A3B8' } },
      right: { style: 'thin', color: { argb: '94A3B8' } }
    };
  });

  // 4. DATOS
  let curRow = headerRowIndex + 1;
  let counter = 1;
  const trabajadores = survey.trabajadores || [];

  trabajadores.forEach((w) => {
    const agentes = w.agentesCodigos && w.agentesCodigos.length > 0 ? w.agentesCodigos : ['80001'];

    agentes.forEach((agCodigo) => {
      const agentObj = getAgentByCode(agCodigo);
      const r = sheet.getRow(curRow);

      r.values = [
        counter,
        w.cuil,
        w.nombre,
        w.fechaIngreso || '-',
        w.puesto || 'Operario',
        w.sector || 'Planta',
        agCodigo,
        agentObj ? agentObj.nombre : `Agente SRT ${agCodigo}`,
        w.horasExposicionDiaria || 8,
        w.diasExposicionSemanal || 5,
        w.eppAdecuado ? 'SÍ' : 'NO',
        agentObj && agentObj.estudiosRequeridos ? agentObj.estudiosRequeridos.join(', ') : 'Examen Clínico Periódico'
      ];

      r.height = 22;

      // Alineación
      r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(3).alignment = { vertical: 'middle' };
      r.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(5).alignment = { vertical: 'middle' };
      r.getCell(6).alignment = { vertical: 'middle' };
      r.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(8).alignment = { vertical: 'middle' };
      r.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(12).alignment = { vertical: 'middle', wrapText: true };

      // Resaltado de código de agente y EPP
      r.getCell(7).font = { name: 'Arial', size: 9, bold: true, color: { argb: '0F766E' } };
      const eppCell = r.getCell(11);
      eppCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: w.eppAdecuado ? '166534' : '991B1B' } };

      curRow++;
      counter++;
    });
  });

  const filename = `Nomina_RAR_Oficial_${(survey.razonSocial || 'Empresa').replace(/[^a-zA-Z0-9]/g, '_')}_${survey.fechaRelevamiento || '2026'}.xlsx`;
  await downloadWorkbook(workbook, filename);
}
