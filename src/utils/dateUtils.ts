/**
 * dateUtils.ts
 * Utilidades para formateo de fechas localizadas en Argentina / América Latina (UTC-3).
 * Evita el desfase de 1 día provocado por la interpretación UTC en 'YYYY-MM-DD'.
 */

export function formatLocalDate(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '-';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Si es formato YYYY-MM-DD puro sin componente de hora
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day).toLocaleDateString('es-AR');
    }
  }

  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-AR');
}

export function formatLocalDateTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
