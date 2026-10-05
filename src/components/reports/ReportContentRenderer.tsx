import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface ReportContentRendererProps {
  content: string | undefined | null;
  className?: string;
  isPrint?: boolean;
}

/**
 * Convierte texto plano con saltos de línea a HTML con párrafos y saltos respetados,
 * o devuelve el HTML si ya viene formateado con tags del editor enriquecido.
 */
function prepareContentHtml(rawContent: string | undefined | null): string {
  if (!rawContent || rawContent.trim() === '') {
    return '<p class="text-slate-400 italic">Sin observaciones o contenido registrado.</p>';
  }

  const trimmed = rawContent.trim();
  // Comprobar si parece HTML (contiene etiquetas de bloque como <p>, <div>, <h1>, <table>, <ul>, etc.)
  const hasHtmlTags = /<\/?(p|div|h[1-6]|ul|ol|li|table|blockquote|br|hr|span|strong|em|b|i|u)[>\s]/i.test(trimmed);

  if (hasHtmlTags) {
    return trimmed;
  }

  // Si es texto plano heredado, convertir dobles saltos en párrafos y saltos simples en <br/>
  const paragraphs = trimmed.split(/\r?\n\r?\n/);
  return paragraphs
    .map(p => {
      const withLineBreaks = p.replace(/\r?\n/g, '<br />');
      return `<p>${withLineBreaks || '<br />'}</p>`;
    })
    .join('');
}

export default function ReportContentRenderer({ content, className = '', isPrint = false }: ReportContentRendererProps) {
  const sanitizedHtml = useMemo(() => {
    const rawHtml = prepareContentHtml(content);
    if (typeof window === 'undefined') return rawHtml;
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'blockquote', 'hr', 'div', 'span', 'code', 'pre'
      ],
      ALLOWED_ATTR: ['class', 'style', 'align', 'colspan', 'rowspan', 'border', 'width']
    });
  }, [content]);

  return (
    <div className={`report-content-renderer ${className}`}>
      <style>{`
        .report-content-renderer {
          font-family: inherit;
          color: inherit;
          line-height: 1.65;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        /* Párrafos y Renglones en blanco */
        .report-content-renderer p {
          margin-top: 0;
          margin-bottom: 0.85rem;
          min-height: 1.25em; /* Vital: asegura que los renglones vacíos no se colapsen */
          line-height: 1.65;
        }

        /* Cuando un párrafo está vacío o solo contiene un <br>, mantener su altura de renglón */
        .report-content-renderer p:empty,
        .report-content-renderer p > br:only-child {
          display: inline-block;
          min-height: 1.25em;
          width: 100%;
          content: "";
        }

        .report-content-renderer br {
          content: "";
          display: block;
          margin-top: 0.25rem;
        }

        /* Encabezados */
        .report-content-renderer h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-top: 1.4rem;
          margin-bottom: 0.6rem;
          color: #0f172a;
          page-break-after: avoid;
          break-after: avoid;
        }

        .report-content-renderer h2 {
          font-size: 1.25rem;
          font-weight: 750;
          margin-top: 1.2rem;
          margin-bottom: 0.5rem;
          color: #1e293b;
          page-break-after: avoid;
          break-after: avoid;
        }

        .report-content-renderer h3 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.4rem;
          color: #334155;
          page-break-after: avoid;
          break-after: avoid;
        }

        /* Listas */
        .report-content-renderer ul {
          list-style-type: disc;
          margin: 0.5rem 0 1rem 1.75rem;
          padding-left: 0.5rem;
        }

        .report-content-renderer ol {
          list-style-type: decimal;
          margin: 0.5rem 0 1rem 1.75rem;
          padding-left: 0.5rem;
        }

        .report-content-renderer li {
          margin-bottom: 0.35rem;
          line-height: 1.55;
        }

        /* Tablas tipo Word */
        .report-content-renderer table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.2rem 0;
          page-break-inside: avoid;
          break-inside: avoid;
          font-size: 0.92rem;
        }

        .report-content-renderer th,
        .report-content-renderer td {
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          text-align: left;
          vertical-align: top;
        }

        .report-content-renderer th {
          background-color: #f1f5f9;
          font-weight: 700;
          color: #0f172a;
        }

        /* Separador horizontal */
        .report-content-renderer hr {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 1.5rem 0;
          page-break-after: avoid;
        }

        /* Cajas de Aviso / Callouts Técnicos */
        .report-content-renderer .report-callout {
          padding: 0.85rem 1.2rem;
          margin: 1rem 0;
          border-radius: 8px;
          border-left: 4px solid;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .report-content-renderer .report-callout-info {
          background-color: #eff6ff;
          border-left-color: #3b82f6;
          color: #1e40af;
        }

        .report-content-renderer .report-callout-warning {
          background-color: #fffbeb;
          border-left-color: #f59e0b;
          color: #92400e;
        }

        .report-content-renderer .report-callout-danger {
          background-color: #fef2f2;
          border-left-color: #ef4444;
          color: #991b1b;
        }

        .report-content-renderer .report-callout-success {
          background-color: #f0fdf4;
          border-left-color: #10b981;
          color: #065f46;
        }

        /* Reglas estrictas para impresión */
        @media print {
          .report-content-renderer p {
            margin-bottom: 0.85rem !important;
            min-height: 1.25em !important;
            line-height: 1.6 !important;
          }
          .report-content-renderer p:empty,
          .report-content-renderer p > br:only-child {
            display: inline-block !important;
            min-height: 1.25em !important;
            content: "" !important;
          }
          .report-content-renderer table {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .report-content-renderer .report-callout {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div
        className="report-html-output"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
}
