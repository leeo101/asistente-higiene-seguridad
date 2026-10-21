/**
 * Helpers para manejo exacto de fechas locales sin desfasaje por zona horaria UTC.
 * Evita el problema clásico de JavaScript donde new Date("YYYY-MM-DD") se interpreta
 * como UTC a medianoche y en husos horarios negativos (ej: Argentina GMT-3) resta 3 horas,
 * mostrando el día anterior.
 */

/**
 * Devuelve la fecha local de HOY en formato YYYY-MM-DD para inputs type="date".
 * Respeta el reloj y zona horaria de la computadora / teléfono del usuario.
 */
export function getLocalTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha para mostrar en pantalla o en PDFs en formato DD/MM/AAAA.
 * Es completamente inmune a saltos de día por zona horaria.
 */
export function formatDisplayDate(dateVal?: string | number | Date | null): string {
  if (!dateVal) {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  }

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // Si viene en formato ISO o fecha corta YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    // Si ya viene formateada como DD/MM/AAAA
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) {
      return trimmed;
    }
  }

  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';

  // Usar los métodos locales (getDate, getMonth, getFullYear) en lugar de UTC
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
