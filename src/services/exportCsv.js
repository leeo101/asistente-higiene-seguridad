/**
 * exportCsv.js — Utilidad genérica para exportar datos a Excel (XLSX) estilizado
 */
import * as XLSX from 'xlsx-js-style';

const ASISTENTE_HYS_LOGO_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACH0lEQVR4nO3WMWrbQBgH8P+R2o1Qj9AruHQQOoTuwUN48BDWc4TQRUIP4MVD2A6hB3ClQyDqEBrcI1joECpdgr5D2+KqK510Z8l+H/iQEJKQ8/sO2ZLtAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKB1iQj3Gfcb9xQvGM96q9Q2iQhPGT9L2k14t0rdQ8ZdxiuF/I8Zb3qr3AR6Uci/xR/GfM6Vf0h4X8j/hLHEfM4Jjwr53zF+6a1yA2hHIf9Txl/GW0bTW+VqwS81v1PGa0bZW+WqwQs1v2P8YpS9Va4arNT8XhifGc/nXPntIqN/z1X2VrkqsNL9XhifFwzXq2wA/xnjE+Ntb5WrAj8y/ioY7A3jTW+VCwV7hj/B8GvGG8Yy1/w1hT9J2E1421vlQsH8uS/I06N1rOqT1mGf/u/a1Z+PzO11e+1bT6Xms1c2B8xnmZ/9+QkAcJ/Zz5vO95p922X2s7mJ/9QcMZ/T+fl2Pj7LPN+Y7zD7OdtxT822+Zy27/9g1rBv9/Z9t23M51R+PqfzmQv23/58p3H2VqnS4H739+0m/tPYrVKlz3B3v2UcxuHnU++VKinIfdntDq1hN1y/3120XqlSQdbzYtF6pUoFnfM9zS/M4bM2L6rVqxXyZq+98z2V95yL1T8o5H3M+/E91fdcStU/KP7R2uNzqtUvlX/9nWr1S1V8/Z1q9UtVfv2davVLlX79nWr1S+EAAACwJf4Bntp6h83445oAAAAASUVORK5CYII=";

/**
 * Convierte un array de objetos a Excel (.xlsx) con estilos y lo descarga.
 * @param {Object[]} rows - Array de objetos planos
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {Object} [columnMap] - Mapa de clave → label de columna.
 * @param {string} [title] - Título grande para poner al principio.
 */
export function downloadCSV(rows, filename, columnMap = null, title = "Reporte de Asistente HYS") {
    if (!rows || rows.length === 0) return;

    const keys = columnMap ? Object.keys(columnMap) : Object.keys(rows[0]);
    const headers = columnMap ? Object.values(columnMap) : keys;

    // Crear hoja en blanco
    const ws = XLSX.utils.aoa_to_sheet([]);

    // 1. FILA 1: Título Grande
    XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: "A1" });

    // 2. FILA 2: Subtítulo (Fecha de exportación)
    XLSX.utils.sheet_add_aoa(ws, [[`Fecha de generación: ${new Date().toLocaleDateString('es-AR')} - Generado por Asistente HYS`]], { origin: "A2" });

    // 3. FILA 4: Cabeceras de tabla
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A4" });

    // 4. FILA 5+: Datos
    const dataRows = rows.map(row => keys.map(k => {
        let val = row[k];
        if (val === null || val === undefined) return '';
        return val;
    }));
    XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: "A5" });

    // --- ESTILOS ---

    // Título principal (A1)
    if (!ws["A1"].s) ws["A1"].s = {};
    ws["A1"].s = {
        font: { name: "Arial", sz: 16, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "172B4D" } }, // Dark blue / navy
        alignment: { vertical: "center", horizontal: "left" }
    };
    // Merge cell para el título
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } });
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } });

    // Subtítulo (A2)
    if (!ws["A2"].s) ws["A2"].s = {};
    ws["A2"].s = {
        font: { name: "Arial", sz: 10, italic: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "172B4D" } }
    };

    // Estilo de las Cabeceras de Tabla (Fila 4)
    for (let i = 0; i < headers.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ c: i, r: 3 }); // r: 3 => Fila 4
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
            font: { name: "Arial", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "36B37E" } },
            alignment: { vertical: "center", horizontal: "center" },
            border: {
                top: { style: "thin", color: { rgb: "CCCCCC" } },
                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                left: { style: "thin", color: { rgb: "CCCCCC" } },
                right: { style: "thin", color: { rgb: "CCCCCC" } }
            }
        };
    }

    // Estilo de los Datos (Fila 5 en adelante)
    for (let r = 4; r < 4 + dataRows.length; r++) {
        for (let c = 0; c < headers.length; c++) {
            const cellRef = XLSX.utils.encode_cell({ c, r });
            if (!ws[cellRef]) continue;
            ws[cellRef].s = {
                font: { name: "Arial", sz: 10, color: { rgb: "333333" } },
                alignment: { vertical: "center", horizontal: c === 0 ? "left" : "center" },
                border: {
                    top: { style: "thin", color: { rgb: "EEEEEE" } },
                    bottom: { style: "thin", color: { rgb: "EEEEEE" } },
                    left: { style: "thin", color: { rgb: "EEEEEE" } },
                    right: { style: "thin", color: { rgb: "EEEEEE" } }
                }
            };
        }
    }

    // Autoajustar ancho de columnas
    const colWidths = headers.map((h, i) => {
        let max = h.length;
        dataRows.forEach(row => {
            if (row[i] && String(row[i]).length > max) {
                max = String(row[i]).length;
            }
        });
        return { wch: Math.min(max + 5, 50) }; // Padding de 5, máximo 50
    });
    ws['!cols'] = colWidths;
    ws['!rows'] = [{ hpt: 40 }]; // Make first row taller for the title/logo

    // Crear libro y añadir imagen base64
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");

    // Configurar imagen mediante la convención !images (Aunque xlsx-js-style puro a veces no lo renderiza en Google Sheets, funciona en Desktop Excel)
    if (!ws['!images']) ws['!images'] = [];
    ws['!images'].push({
        name: 'logo.png',
        data: ASISTENTE_HYS_LOGO_BASE64,
        opts: { base64: true },
        position: {
            type: 'twoCellAnchor',
            from: { col: headers.length - 1, row: 0 },
            to: { col: headers.length, row: 1 } // Ubicado arriba a la derecha
        }
    });

    // Usar write y blob para descargarlo
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}
