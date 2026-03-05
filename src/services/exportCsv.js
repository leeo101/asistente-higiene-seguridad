/**
 * exportCsv.js — Utilidad genérica para exportar datos a Excel (XLSX) con estilos y logo
 */
import ExcelJS from 'exceljs/dist/exceljs.min.js';

const ASISTENTE_HYS_LOGO_BASE66 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACH0lEQVR4nO3WMWrbQBgH8P+R2o1Qj9AruHQQOoTuwUN48BDWc4TQRUIP4MVD2A6hB3ClQyDqEBrcI1joECpdgr5D2+KqK510Z8l+H/iQEJKQ8/sO2ZLtAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKB1iQj3Gfcb9xQvGM96q9Q2iQhPGT9L2k14t0rdQ8ZdxiuF/I8Zb3qr3AR6Uci/xR/GfM6Vf0h4X8j/hLHEfM4Jjwr53zF+6a1yA2hHIf9Txl/GW0bTW+VqwS81v1PGa0bZW+WqwQs1v2P8YpS9Va4arNT8XhifGc/nXPntIqN/z1X2VrkqsNL9XhifFwzXq2wA/xnjE+Ntb5WrAj8y/ioY7A3jTW+VCwV7hj/B8GvGG8Yy1/w1hT9J2E1421vlQsH8uS/I06N1rOqT1mGf/u/a1Z+PzO11e+1bT6Xms1c2B8xnmZ/9+QkAcJ/Zz5vO95p922X2s7mJ/9QcMZ/T+fl2Pj7LPN+Y7zD7OdtxT822+Zy27/9g1rBv9/Z9t23M51R/PqfzmQv23/58p3H2VqnS4H739+0m/tPYrVKlz3B3v2UcxuHnU++VKinIfdntDq1hN1y/3120XqlSQdbzYtF6pUoFnfM9zS/M4bM2L6rVqxXyZq+98z2V95yL1T8o5H3M+/E91fdcStU/KP7R2uNzqtUvlX/9nWr1S1Vfv2davVLlX79nWr1S+EAAACwJf4Bntp6h83445oAAAAASUVORK5CYII=";

/**
 * Convierte un array de objetos a Excel (.xlsx) con estilos, logo, y lo descarga.
 * @param {Object[]} rows - Array de objetos planos
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {Object} [columnMap] - Mapa de clave → label de columna.
 * @param {string} [title] - Título grande para poner al principio.
 */
export async function downloadCSV(rows, filename, columnMap = null, title = "Reporte de Asistente HYS") {
    if (!rows || rows.length === 0) return;

    const keys = columnMap ? Object.keys(columnMap) : Object.keys(rows[0]);
    const headers = columnMap ? Object.values(columnMap) : keys;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reporte", {
        views: [{ showGridLines: false }]
    });

    // Añadir logo (ajustar coordenadas según cantidad de columnas para ponerlo arriba a la derecha)
    const logoId = workbook.addImage({
        base64: `data:image/png;base64,${ASISTENTE_HYS_LOGO_BASE66}`,
        extension: 'png',
    });

    // Lo ubicamos en la esquina superior derecha (última columna del header)
    sheet.addImage(logoId, {
        tl: { col: Math.max(2, headers.length - 1.5), row: 0.2 },
        ext: { width: 50, height: 50 },
        editAs: 'absolute'
    });

    // 1. Título principal
    sheet.mergeCells(1, 1, 1, headers.length);
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF172B4D" } };
    titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    // 2. Subtítulo (Fecha)
    sheet.mergeCells(2, 1, 2, headers.length);
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Fecha de generación: ${new Date().toLocaleDateString('es-AR')} - Generado por Asistente HYS`;
    subtitleCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FFFFFFFF" } };
    subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF172B4D" } };
    subtitleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    // Alturas de las filas de cabecera
    sheet.getRow(1).height = 30;
    sheet.getRow(2).height = 20;
    sheet.getRow(3).height = 10; // Fila vacía de separación

    // 3. Cabeceras de tabla (Fila 4)
    const headerRow = sheet.getRow(4);
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF36B37E" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
            top: { style: "thin", color: { argb: "FFCCCCCC" } },
            left: { style: "thin", color: { argb: "FFCCCCCC" } },
            bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
            right: { style: "thin", color: { argb: "FFCCCCCC" } }
        };
    });
    headerRow.height = 25;

    // 4. Datos (Fila 5+)
    rows.forEach((row, rowIndex) => {
        const dataRow = sheet.getRow(5 + rowIndex);
        keys.forEach((k, colIndex) => {
            const cell = dataRow.getCell(colIndex + 1);
            let val = row[k];
            cell.value = val === null || val === undefined ? '' : val;
            cell.font = { name: "Arial", size: 10, color: { argb: "FF333333" } };
            cell.alignment = { vertical: "middle", horizontal: colIndex === 0 ? "left" : "center", wrapText: true };
            cell.border = {
                top: { style: "thin", color: { argb: "FFEEEEEE" } },
                left: { style: "thin", color: { argb: "FFEEEEEE" } },
                bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
                right: { style: "thin", color: { argb: "FFEEEEEE" } }
            };
        });
        // Altura mínima para wrapear
        dataRow.height = 20;
    });

    // Autoajustar ancho de columnas
    sheet.columns.forEach((column, index) => {
        let max = headers[index].length;
        rows.forEach(row => {
            const val = row[keys[index]];
            if (val) {
                const len = String(val).length;
                if (len > max) max = len;
            }
        });
        column.width = Math.min(max + 4, 60); // Padding y máximo
    });

    // Escribir a Buffer y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}
