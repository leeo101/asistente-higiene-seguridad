import ExcelJS from 'exceljs';

export interface ExtinguisherImportRow {
  code: string;
  type: string;
  capacity: string;
  location: string;
  expirationDate: string;
  status: 'Operativo' | 'Vencido' | 'Despresurizado' | 'En Mantenimiento';
  lastInspectionDate?: string;
  notes?: string;
}

export interface ImportResult<T> {
  success: boolean;
  importedRows: T[];
  errors: Array<{ line: number; message: string }>;
  totalRead: number;
}

/**
  Importa extintores desde un archivo Excel (.xlsx / .csv)
 */
export async function importExtinguishersFromExcel(file: File): Promise<ImportResult<ExtinguisherImportRow>> {
  const importedRows: ExtinguisherImportRow[] = [];
  const errors: Array<{ line: number; message: string }> = [];

  try {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { success: false, importedRows: [], errors: [{ line: 0, message: 'El archivo Excel no contiene hojas válidas' }], totalRead: 0 };
    }

    let totalRead = 0;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Omitir encabezado

      totalRead++;

      const code = row.getCell(1).text?.toString().trim();
      const type = row.getCell(2).text?.toString().trim() || 'ABC';
      const capacity = row.getCell(3).text?.toString().trim() || '5 kg';
      const location = row.getCell(4).text?.toString().trim() || 'Planta General';
      const expirationDate = row.getCell(5).text?.toString().trim();
      const rawStatus = row.getCell(6).text?.toString().trim().toLowerCase();
      const notes = row.getCell(7).text?.toString().trim() || '';

      if (!code) {
        errors.push({ line: rowNumber, message: 'Falta el código de identificación del extintor' });
        return;
      }

      let status: ExtinguisherImportRow['status'] = 'Operativo';
      if (rawStatus?.includes('vencid')) status = 'Vencido';
      else if (rawStatus?.includes('despres')) status = 'Despresurizado';
      else if (rawStatus?.includes('manten')) status = 'En Mantenimiento';

      importedRows.push({
        code,
        type,
        capacity,
        location,
        expirationDate: expirationDate || new Date().toISOString().split('T')[0],
        status,
        notes
      });
    });

    return {
      success: errors.length === 0,
      importedRows,
      errors,
      totalRead
    };
  } catch (err: any) {
    return {
      success: false,
      importedRows: [],
      errors: [{ line: 0, message: `Error al procesar el archivo Excel: ${err?.message || 'Formato no soportado'}` }],
      totalRead: 0
    };
  }
}

/**
  Exporta la lista de extintores a un archivo Excel con formato profesional
 */
export async function exportExtinguishersToExcel(
  extinguishers: ExtinguisherImportRow[],
  companyName: string = 'Mi Empresa'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventario Extintores');

  // Estilo de encabezado de título
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `INVENTARIO DE EXTINTORES Y EQUIPOS — ${companyName.toUpperCase()}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } }; // Azul oscuro corporativo
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 35;

  // Encabezados de tabla
  const headers = ['Código / N°', 'Tipo', 'Capacidad', 'Ubicación / Sector', 'Vencimiento', 'Estado', 'Notas'];
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 25;
  
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'CBD5E1' } },
      bottom: { style: 'medium', color: { argb: '1E3A8A' } },
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } }
    };
  });

  // Filas de datos
  extinguishers.forEach((item) => {
    const dataRow = worksheet.addRow([
      item.code,
      item.type,
      item.capacity,
      item.location,
      item.expirationDate,
      item.status,
      item.notes || ''
    ]);

    dataRow.height = 20;

    // Resaltado condicional según estado
    const statusCell = dataRow.getCell(6);
    statusCell.alignment = { horizontal: 'center' };

    if (item.status === 'Operativo') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } }; // Verde claro
      statusCell.font = { color: { argb: '15803D' }, bold: true };
    } else if (item.status === 'Vencido' || item.status === 'Despresurizado') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } }; // Rojo claro
      statusCell.font = { color: { argb: 'B91C1C' }, bold: true };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF9C3' } }; // Amarillo claro
      statusCell.font = { color: { argb: 'A16207' }, bold: true };
    }
  });

  // Ajustar ancho automático de columnas
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellLength = cell.value ? cell.value.toString().length : 10;
      if (cellLength > maxLength) maxLength = cellLength;
    });
    column.width = Math.max(maxLength + 4, 15);
  });

  // Generar buffer y descargar en navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Inventario_Extintores_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
  Genera una plantilla Excel vacía descargable para la carga masiva
 */
export async function downloadBulkImportTemplate(): Promise<void> {
  const dummyData: ExtinguisherImportRow[] = [
    { code: 'EXT-001', type: 'ABC Polvo', capacity: '5 kg', location: 'Depósito Central', expirationDate: '2027-06-30', status: 'Operativo', notes: 'Próximo a manómetro nuevo' },
    { code: 'EXT-002', type: 'CO2', capacity: '3.5 kg', location: 'Tablero Eléctrico Principal', expirationDate: '2026-12-15', status: 'Operativo', notes: '' },
  ];
  await exportExtinguishersToExcel(dummyData, 'Plantilla_Ejemplo');
}
