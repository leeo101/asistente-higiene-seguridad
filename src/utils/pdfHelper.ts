import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';

/**
 * Convierte un color oklch(L C H) / oklab a un valor rgb() sRGB compatible con Canvas.
 * Usamos una conversión matemática real para no depender del contexto 2D del navegador.
 */
function oklchToRgb(l: number, c: number, h: number): string {
  // oklch → oklab
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // oklab → XYZ (D65)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L3 = l_ ** 3;
  const M3 = m_ ** 3;
  const S3 = s_ ** 3;

  const X = 1.2270138511 * L3 - 0.5577999807 * M3 + 0.2812561490 * S3;
  const Y = -0.0405801784 * L3 + 1.1122568696 * M3 - 0.0716766787 * S3;
  const Z = -0.0763812845 * L3 - 0.4214819784 * M3 + 1.5861632204 * S3;

  // XYZ D65 → linear sRGB
  const rLin =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  const gLin = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
  const bLin =  0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;

  // Linear sRGB → gamma-corrected sRGB
  const toSrgb = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    return clamped <= 0.0031308
      ? Math.round(clamped * 12.92 * 255)
      : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
  };

  return `rgb(${toSrgb(rLin)}, ${toSrgb(gLin)}, ${toSrgb(bLin)})`;
}

/**
 * Convierte color(srgb R G B / A) → rgba()
 */
function colorSrgbToRgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

/**
 * Parsea y convierte cualquier color CSS moderno a un valor compatible con html2canvas.
 */
function convertModernColor(val: string): string {
  if (!val || typeof val !== 'string') return val;

  // oklch(L% C H) o oklch(L C H / A)
  if (val.includes('oklch')) {
    const m = val.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/);
    if (m) {
      const L = val.includes('%') && m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
      const C = parseFloat(m[2]);
      const H = parseFloat(m[3]);
      // Normalise L si viene en rango 0-100 como porcentaje
      const Ln = L > 1 ? L / 100 : L;
      return oklchToRgb(Ln, C, H);
    }
  }

  // color(srgb R G B) o color(srgb R G B / A)
  if (val.includes('color(srgb')) {
    const m = val.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
    if (m) {
      return colorSrgbToRgba(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), m[4] ? parseFloat(m[4]) : 1);
    }
  }

  // oklab(L A B / alpha) — fallback
  if (val.includes('oklab')) {
    const m = val.match(/oklab\(\s*([\d.]+)%?\s+([\d.-]+)\s+([\d.-]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/);
    if (m) {
      const L = parseFloat(m[1]) > 1 ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
      const a = parseFloat(m[2]);
      const b = parseFloat(m[3]);
      // oklab → oklch para reutilizar la función
      const C = Math.sqrt(a * a + b * b);
      const H = (Math.atan2(b, a) * 180) / Math.PI;
      return oklchToRgb(L, C, H < 0 ? H + 360 : H);
    }
  }

  return val;
}

const NEEDS_CONVERSION = (v: string) =>
  v.includes('oklch') || v.includes('oklab') || v.includes('color(srgb');

/**
 * Imprime un elemento HTML en una ventana aislada usando el motor nativo del navegador.
 * Produce calidad vectorial idéntica a Ctrl+P — fuentes, colores y diseño perfectos.
 */
export async function printElementAsDocument(
  elementId: string,
  title: string = 'Documento',
  isLandscape: boolean = false
): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Elemento "${elementId}" no encontrado`);

  // Recopilar CSS de la página (sin CORS restrictions para same-origin)
  let pageCss = '';
  try {
    pageCss = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(r => r.cssText)
            .join('\n');
        } catch {
          // Hojas cross-origin: omitir (no accesibles)
          return '';
        }
      })
      .join('\n');
  } catch {
    pageCss = '';
  }

  const printHtml = el.outerHTML;
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    // Popup bloqueado — intentar window.print() directo
    window.print();
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    @media print {
      @page {
        size: A4 ${isLandscape ? 'landscape' : 'portrait'};
        margin: 10mm 10mm 10mm 10mm;
      }
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    }
    ${pageCss}
  </style>
</head>
<body>
  ${printHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        setTimeout(function() { window.close(); }, 800);
      }, 600);
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}

/**
 * Genera un PDF desde un elemento HTML por su ID y lo devuelve como Blob.
 * Motor: html2canvas (rasterizado local) → jsPDF. Sin llamada a servidores externos.
 *
 * Mejoras v2:
 *  - Conversión matemática real de oklch/oklab/color(srgb) → rgb()
 *  - Patch de getComputedStyle para interceptar todos los valores de color al vuelo
 *  - Escala dinámica inteligente para no exceder el límite de Canvas (~16.8K × 16.8K px)
 *  - Timeout de 35s con limpieza garantizada del DOM
 */
export async function generatePdfBlob(elementId: string, isLandscape: boolean = false): Promise<Blob> {
  const TIMEOUT_MS = 35000;

  const generatePromise = (async (): Promise<Blob> => {
    // ── Encontrar el elemento ──────────────────────────────────────────────────
    const elements = document.querySelectorAll(`[id="${elementId}"]`);
    let originalElement: HTMLElement | null = null;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i] as HTMLElement;
      if (el.closest('.active-portal-print') || el.closest('.ats-pdf-offscreen') || i === 0) {
        originalElement = el;
        break;
      }
    }
    if (!originalElement) throw new Error(`Elemento con id '${elementId}' no encontrado.`);

    await new Promise(r => setTimeout(r, 50));

    // ── Dimensiones A4 exactas @ 96 DPI ───────────────────────────────────────
    const MM_TO_PX = 96 / 25.4; // 3.7795…
    const targetWidth = Math.round((isLandscape ? 297 : 210) * MM_TO_PX);

    // ── Contenedor off-screen ─────────────────────────────────────────────────
    const offscreenContainer = document.createElement('div');
    offscreenContainer.setAttribute('data-pdf-offscreen', 'true');
    offscreenContainer.style.cssText = [
      'position: fixed',
      'left: 0',
      'top: 0',
      'z-index: -99999',
      `width: ${targetWidth}px`,
      'height: auto',
      'overflow: hidden',
      'visibility: visible',
      'opacity: 1',
      'pointer-events: none',
      'background: #ffffff',
      'margin: 0',
      'padding: 0'
    ].join('; ');

    const clone = originalElement.cloneNode(true) as HTMLElement;
    clone.style.cssText += [
      `; width: ${targetWidth}px !important`,
      `max-width: ${targetWidth}px !important`,
      'height: auto !important',
      'min-height: 0 !important',
      'display: block !important',
      'position: relative !important',
      'top: 0 !important',
      'left: 0 !important',
      'transform: none !important',
      'background: #ffffff !important',
      'color: #000000',
      'box-shadow: none !important',
      'border-radius: 0',
      'box-sizing: border-box !important',
      'margin: 0 auto !important',
      'opacity: 1 !important',
      'visibility: visible !important'
    ].join('; ');

    offscreenContainer.appendChild(clone);
    document.body.appendChild(offscreenContainer);

    // ── Patch 1: Convertir colores modernos en los estilos inline del clon ────
    const colorCache = new Map<string, string>();
    const cachedConvert = (val: string): string => {
      if (!NEEDS_CONVERSION(val)) return val;
      if (colorCache.has(val)) return colorCache.get(val)!;
      const result = convertModernColor(val);
      colorCache.set(val, result);
      return result;
    };

    clone.querySelectorAll('*').forEach((el: Element) => {
      const htmlEl = el as HTMLElement;

      // Convertir inline styles
      if (htmlEl.style?.cssText && NEEDS_CONVERSION(htmlEl.style.cssText)) {
        htmlEl.style.cssText = htmlEl.style.cssText.replace(
          /oklch\([^)]+\)|oklab\([^)]+\)|color\(srgb[^)]+\)/g,
          m => cachedConvert(m)
        );
      }

      // Expandir overflow/maxHeight para que el clon sea completamente visible
      const style = window.getComputedStyle(htmlEl);
      if (
        (style.overflow === 'hidden' || style.overflowY === 'hidden' || style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        htmlEl.clientHeight > 150
      ) {
        htmlEl.style.setProperty('overflow', 'visible', 'important');
        htmlEl.style.setProperty('overflow-y', 'visible', 'important');
        htmlEl.style.setProperty('overflow-x', 'hidden', 'important');
      }
      if (style.maxHeight !== 'none' && htmlEl.clientHeight > 150) {
        htmlEl.style.setProperty('max-height', 'none', 'important');
      }
      htmlEl.classList.remove('h-screen', 'max-h-screen', 'overflow-y-auto');
      if (htmlEl.clientHeight > 150) htmlEl.classList.remove('overflow-hidden');
    });

    // ── Patch 2: Interceptar getComputedStyle al vuelo durante html2canvas ────
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (el: Element, pseudo?: string | null) {
      const style = originalGetComputedStyle(el, pseudo);
      return new Proxy(style, {
        get(target: any, prop: string) {
          if (prop === 'getPropertyValue') {
            return (p: string) => cachedConvert(target.getPropertyValue(p));
          }
          const val = target[prop];
          if (typeof val === 'string' && NEEDS_CONVERSION(val)) return cachedConvert(val);
          return typeof val === 'function' ? val.bind(target) : val;
        }
      });
    };

    // ── Inyectar CSS de soporte para saltos de página ─────────────────────────
    const injectStyle = document.createElement('style');
    injectStyle.textContent = `
      tr, .avoid-break-strictly { page-break-inside: avoid !important; break-inside: avoid !important; }
      thead { display: table-header-group !important; }
      tfoot { display: table-footer-group !important; }
      table { page-break-inside: auto !important; }
      .pdf-signatures-wrapper { page-break-inside: avoid !important; break-inside: avoid !important; }
    `;
    clone.insertBefore(injectStyle, clone.firstChild);

    // ── Detectar y ajustar saltos de página ───────────────────────────────────
    const PX_PER_MM = 96 / 25.4;
    const pdfContentHeightMM = (isLandscape ? 210 : 297) - 20; // margen top+bottom 10mm × 2
    const pageContentHeightPx = pdfContentHeightMM * PX_PER_MM;

    const cloneRect = clone.getBoundingClientRect();
    const avoidEls = Array.from(clone.querySelectorAll(
      '.pdf-signatures-wrapper, .pdf-signatures-container, .pdf-brand-container, .signature-block, .avoid-break-strictly, .ext-row'
    )).filter(el => {
      let p = el.parentElement;
      while (p && p !== clone) {
        if (p.matches('.pdf-signatures-wrapper, .pdf-signatures-container, .pdf-brand-container, .signature-block, .avoid-break-strictly, .ext-row')) return false;
        p = p.parentElement;
      }
      return true;
    });

    if (cloneRect.height > pageContentHeightPx + 20) {
      for (const el of avoidEls) {
        const htmlEl = el as HTMLElement;
        const rect = htmlEl.getBoundingClientRect();
        const topPx = rect.top - cloneRect.top;
        const heightPx = rect.height;
        if (topPx > 0 && heightPx > 0 && heightPx < pageContentHeightPx) {
          const pageAtTop = Math.floor(topPx / pageContentHeightPx);
          const pageAtBottom = Math.floor((topPx + heightPx - 1) / pageContentHeightPx);
          if (pageAtBottom > pageAtTop) {
            const spaceLeft = (pageAtTop + 1) * pageContentHeightPx - topPx;
            const spacerHeight = Math.min(spaceLeft + 8, pageContentHeightPx - 20);
            const spacer = document.createElement('div');
            spacer.style.cssText = `height: ${Math.round(spacerHeight)}px; display: block; visibility: hidden; width: 100%; flex-shrink: 0; clear: both;`;
            htmlEl.parentNode?.insertBefore(spacer, htmlEl);
            await new Promise(r => requestAnimationFrame(r));
          }
        }
      }
    }

    try {
      await waitForImages(clone);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const renderWait = ('ontouchstart' in window || window.innerWidth < 768) ? 500 : 200;
      await new Promise(r => setTimeout(r, renderWait));

      offscreenContainer.getBoundingClientRect();
      clone.getBoundingClientRect();

      // ── Escala dinámica inteligente ───────────────────────────────────────────
      // Límite de área de Canvas ≈ 268M px en Chrome desktop, pero usamos 25M para compatibilidad móvil
      const MAX_CANVAS_AREA = 25_000_000;
      const totalHeight = Math.max(clone.scrollHeight, clone.clientHeight, 1);
      const totalArea = targetWidth * totalHeight;
      const maxSafeScale = Math.sqrt(MAX_CANVAS_AREA / totalArea);
      const isMob = 'ontouchstart' in window || window.innerWidth < 768;
      const targetScale = isMob ? 2.2 : 3.0;
      const dynamicScale = Math.max(1.5, Math.min(targetScale, maxSafeScale));

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: 'documento.pdf',
        image: { type: 'png' as const, quality: 1.0 },
        html2canvas: {
          scale: dynamicScale,
          useCORS: true,
          allowTaint: false,
          logging: false,
          windowWidth: targetWidth,
          width: targetWidth,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: (isLandscape ? 'landscape' : 'portrait') as 'landscape' | 'portrait'
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          before: ['.page-break-before', '.force-page-break'],
          avoid: ['tr', '.avoid-break', '.avoid-break-strictly', '.pdf-signatures-wrapper']
        }
      };

      const worker = html2pdf().set(opt).from(clone).toPdf();

      // Agregar número de página + pie de página
      await worker.get('pdf').then((pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(7);
          pdf.setTextColor(150, 163, 184);
          pdf.text(
            'Generado con Asistente HYS — La plataforma de Higiene y Seguridad con IA',
            pageWidth / 2,
            pageHeight - 5,
            { align: 'center' }
          );
          pdf.text(
            `Página ${i} de ${totalPages}`,
            pageWidth - 10,
            pageHeight - 5,
            { align: 'right' }
          );
        }
      });

      const pdfBlob: Blob = await worker.output('blob');
      return pdfBlob;
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
    }
  })();

  // Timeout de seguridad
  const timeoutPromise = new Promise<never>((_, reject) => {
    const t = setTimeout(
      () => reject(new Error('La generación del PDF excedió el límite de tiempo (35s). Intentá con menos datos.')),
      TIMEOUT_MS
    );
    generatePromise.finally(() => clearTimeout(t)).catch(() => {});
  });

  try {
    return await Promise.race([generatePromise, timeoutPromise]);
  } finally {
    // Limpieza garantizada del DOM
    const container = document.querySelector('[data-pdf-offscreen="true"]');
    if (container?.parentNode) container.parentNode.removeChild(container);
  }
}

/**
 * Espera a que todas las <img> del clon estén completamente cargadas.
 * Incluye imágenes base64 (firmas, logos) que pueden tardar en decodificarse.
 */
function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();

  const promises = images.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>(resolve => {
      const timeout = setTimeout(() => resolve(), 3000);
      img.onload = () => { clearTimeout(timeout); resolve(); };
      img.onerror = () => { clearTimeout(timeout); resolve(); };
      if (img.src && !img.complete) {
        const src = img.src;
        img.src = '';
        img.src = src;
      }
    });
  });

  return Promise.all(promises).then(() => undefined);
}
