/**
 * exportCsv.js — Utilidad genérica para exportar datos a CSV
 */

/**
 * Convierte un array de objetos a CSV y lo descarga.
 * @param {Object[]} rows - Array de objetos planos
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {Object} [columnMap] - Mapa de clave → label de columna. Si no se pasa, usa las claves del primer objeto.
 */
export function downloadCSV(rows, filename, columnMap = null) {
    if (!rows || rows.length === 0) return;

    const keys = columnMap ? Object.keys(columnMap) : Object.keys(rows[0]);
    const headers = columnMap ? Object.values(columnMap) : keys;

    const escape = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
    };

    const lines = [
        headers.map(escape).join(','),
        ...rows.map(row => keys.map(k => escape(row[k])).join(','))
    ];

    const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
