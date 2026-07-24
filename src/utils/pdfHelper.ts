import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Genera un PDF desde un elemento HTML por su ID y lo devuelve como Blob.
 *
 * TÉCNICA: Clonado off-screen segmentado con timeout de seguridad y optimización de renderizado
 */
export async function generatePdfBlob(elementId: string, isLandscape: boolean = false): Promise<Blob> {
    const TIMEOUT_MS = 35000; // Hard timeout: 35 segundos máximo para evitar spinner infinito

    const generatePromise = (async (): Promise<Blob> => {
        const elements = document.querySelectorAll(`[id="${elementId}"]`);
        let originalElement: HTMLElement | null = null;
        
        if (elements.length > 0) {
            // Si hay múltiples IDs duplicados por transiciones de página, tomamos el del portal activo o el último renderizado
            for (let i = elements.length - 1; i >= 0; i--) {
                const el = elements[i] as HTMLElement;
                if (el.closest('.active-portal-print') || el.closest('.ats-pdf-offscreen') || i === 0) {
                    originalElement = el;
                    break;
                }
            }
        }

        if (!originalElement) {
            throw new Error(`Elemento con id '${elementId}' no encontrado.`);
        }

        // Permite que la UI del navegador dibuje el spinner/toast antes de bloquear el hilo principal con Canvas
        await new Promise(resolve => setTimeout(resolve, 50));

        // ─── Dimensiones A4 exactas ───────────────────────────────────────────────
        const MARGIN_MM = 10;
        const MM_TO_PX = 3.7795275591; // 96dpi
        const BASE_SCALE = 2;

        const portraitUsableMM  = 210 - MARGIN_MM * 2;  // 190mm
        const landscapeUsableMM = 297 - MARGIN_MM * 2;  // 277mm

        const targetWidth = isLandscape
            ? Math.round(landscapeUsableMM * MM_TO_PX * BASE_SCALE)  // ≈2094px
            : Math.round(portraitUsableMM  * MM_TO_PX * BASE_SCALE); // ≈1436px

        // Contenedor off-screen: visible para html2canvas pero fuera del viewport del usuario
        const offscreenContainer = document.createElement('div');
        offscreenContainer.setAttribute('data-pdf-offscreen', 'true');
        offscreenContainer.classList.add('ats-pdf-offscreen');
        offscreenContainer.style.cssText = [
            'position: absolute',
            'left: -9999px',
            'top: -99999px',
            'z-index: -9999',
            `width: ${targetWidth}px`,
            'height: auto',
            'overflow: visible',
            'visibility: visible',
            'opacity: 1',
            'pointer-events: none',
            'touch-action: none',
            'background: #ffffff'
        ].join('; ');

        // Clonar el elemento original con todos sus hijos
        const clone = originalElement.cloneNode(true) as HTMLElement;
        
        clone.classList.add('force-pdf-print');
        clone.classList.remove('ats-pdf-offscreen');
        clone.classList.remove('active-portal-print');

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
            'margin: 0 !important',
            'padding: 0 !important',
            'opacity: 1 !important',
            'visibility: visible !important'
        ].join('; ');

        offscreenContainer.appendChild(clone);
        document.body.appendChild(offscreenContainer);

        // Pre-sanitizar estilos inline con oklch en el clon para evitar llamadas excesivas a getComputedStyle
        const colorCache = new Map<string, string>();
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = 1;
        colorCanvas.height = 1;
        const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

        function convertColor(val: string): string {
            if (!val || typeof val !== 'string') return val;
            if (!val.includes('oklch') && !val.includes('color(srgb')) return val;
            
            if (colorCache.has(val)) return colorCache.get(val)!;

            let finalVal = val;
            if (colorCtx) {
                try {
                    colorCtx.fillStyle = '#000000';
                    colorCtx.fillStyle = finalVal;
                    const res = colorCtx.fillStyle;
                    if (res && res !== '#000000' && !res.includes('oklch')) {
                        finalVal = res;
                    }
                } catch (e) {}
            }

            if (finalVal.includes('color(srgb')) {
                const match = finalVal.match(/color\(srgb\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\)/);
                if (match) {
                    const r = Math.round(parseFloat(match[1]) * 255);
                    const g = Math.round(parseFloat(match[2]) * 255);
                    const b = Math.round(parseFloat(match[3]) * 255);
                    const a = match[4] ? parseFloat(match[4]) : 1;
                    finalVal = `rgba(${r}, ${g}, ${b}, ${a})`;
                }
            }

            if (finalVal.includes('oklch')) {
                const match = finalVal.match(/oklch\(\s*([0-9.]+)/);
                if (match) {
                    const l = parseFloat(match[1]);
                    finalVal = l > 0.8 ? 'rgb(255, 255, 255)' : l < 0.4 ? 'rgb(0, 0, 0)' : 'rgb(128, 128, 128)';
                } else {
                    finalVal = 'rgb(0, 0, 0)';
                }
            }

            colorCache.set(val, finalVal);
            return finalVal;
        }

        // Eliminar restricciones de altura y overflow en todos los elementos del clon
        const allChildren = clone.querySelectorAll('*');
        allChildren.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style && htmlEl.style.cssText && (htmlEl.style.cssText.includes('oklch') || htmlEl.style.cssText.includes('color(srgb'))) {
                htmlEl.style.cssText = htmlEl.style.cssText.replace(/oklch\([^)]+\)|color\(srgb[^)]+\)/g, (m) => convertColor(m));
            }
            const style = window.getComputedStyle(htmlEl);
            if (style.overflow === 'hidden' || style.overflow === 'auto' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
                if (htmlEl.clientHeight > 150) {
                    htmlEl.style.setProperty('overflow', 'visible', 'important');
                    htmlEl.style.setProperty('overflow-y', 'visible', 'important');
                    htmlEl.style.setProperty('overflow-x', 'hidden', 'important');
                }
            }
            if (style.maxHeight !== 'none' && htmlEl.clientHeight > 150) {
                htmlEl.style.setProperty('max-height', 'none', 'important');
            }
            if (htmlEl.classList.contains('h-screen') || htmlEl.classList.contains('max-h-screen') || htmlEl.classList.contains('overflow-y-auto') || htmlEl.classList.contains('overflow-hidden')) {
                htmlEl.classList.remove('h-screen', 'max-h-screen', 'overflow-y-auto');
                if (htmlEl.clientHeight > 150) {
                    htmlEl.classList.remove('overflow-hidden');
                }
            }
        });

        document.documentElement.classList.add('pdf-export-mode');
        document.body.classList.add('pdf-export-mode');

        const injectStyle = document.createElement('style');
        injectStyle.textContent = `
            tr, .row-unit { page-break-inside: avoid !important; break-inside: avoid !important; }
            thead { display: table-header-group !important; }
            tfoot { display: table-footer-group !important; }
            table { page-break-inside: auto !important; break-inside: auto !important; }
            tbody { page-break-inside: auto !important; break-inside: auto !important; }
            .pdf-section { page-break-inside: auto !important; break-inside: auto !important; }
        `;
        clone.insertBefore(injectStyle, clone.firstChild);

        clone.querySelectorAll('div, section, article').forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            const cs = window.getComputedStyle(htmlEl);
            if (cs.pageBreakInside === 'avoid' || cs.breakInside === 'avoid') {
                if (htmlEl.offsetHeight > 200) {
                    htmlEl.style.setProperty('page-break-inside', 'auto', 'important');
                    htmlEl.style.setProperty('break-inside', 'auto', 'important');
                }
            }
        });

        // Patch getComputedStyle eficientemente
        const originalGetComputedStyle = window.getComputedStyle;
        window.getComputedStyle = function(el: Element, pseudoElt?: string | null) {
            const style = originalGetComputedStyle(el, pseudoElt);
            const getProp = (propName: string) => convertColor(style.getPropertyValue(propName));
            return new Proxy(style, {
                get(target: any, prop: string) {
                    if (prop === 'getPropertyValue') return getProp;
                    const val = target[prop];
                    if (typeof val === 'string' && (val.includes('oklch') || val.includes('color(srgb'))) {
                        return convertColor(val);
                    }
                    return typeof val === 'function' ? val.bind(target) : val;
                }
            });
        };

        try {
            await waitForImages(clone);
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const renderWait = (window.innerWidth < 768 || ('ontouchstart' in window)) ? 400 : 150;
            await new Promise(resolve => setTimeout(resolve, renderWait));
            
            offscreenContainer.getBoundingClientRect();
            clone.getBoundingClientRect();

            const isMobileCanvas = window.innerWidth < 768 || ('ontouchstart' in window);
            const MAX_CANVAS_AREA = 12000000; // 12M píxeles máx para evitar crashes de GPU
            const totalHeight = Math.max(clone.scrollHeight, clone.clientHeight);
            const totalArea = targetWidth * totalHeight;
            
            const maxSafeScale = Math.sqrt(MAX_CANVAS_AREA / totalArea);
            
            let dynamicScale = isMobileCanvas ? Math.min(0.75, maxSafeScale) : Math.min(1, maxSafeScale);
            dynamicScale = Math.max(0.25, Math.min(dynamicScale, maxSafeScale));

            const opt = {
                margin: MARGIN_MM,
                filename: 'documento.pdf',
                image: { type: 'jpeg', quality: 0.98 },
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
                    scrollY: 0
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait' },
                pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.avoid-break', '.page-break-inside-avoid'] }
            };

            const worker = html2pdf().set(opt as any).from(clone).toPdf();
            
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
                        pageHeight - 6, 
                        { align: 'center' }
                    );
                    pdf.text(
                        `Página ${i} de ${totalPages}`,
                        pageWidth - 10,
                        pageHeight - 6,
                        { align: 'right' }
                    );
                }
            });
            
            const pdfBlob = await worker.output('blob');
            return pdfBlob;
        } finally {
            window.getComputedStyle = originalGetComputedStyle;
        }

    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
            reject(new Error("La generación del PDF excedió el tiempo límite (35s). Por favor, intente con menos registros o reintente."));
        }, TIMEOUT_MS);
        generatePromise.finally(() => clearTimeout(timer)).catch(() => {});
    });

    try {
        return await Promise.race([generatePromise, timeoutPromise]);
    } finally {
        const offscreenContainer = document.querySelector('[data-pdf-offscreen="true"]');
        if (offscreenContainer && offscreenContainer.parentNode) {
            offscreenContainer.parentNode.removeChild(offscreenContainer);
        }
        document.documentElement.classList.remove('pdf-export-mode');
        document.body.classList.remove('pdf-export-mode');
    }
}

/**
 * Espera a que todas las imágenes dentro de un elemento estén completamente cargadas.
 * Incluye imágenes base64 (firmas, logos) que pueden tardar en decodificarse en móvil.
 */
function waitForImages(element: HTMLElement): Promise<void> {
    const images = Array.from(element.querySelectorAll('img'));

    if (images.length === 0) {
        return Promise.resolve();
    }

    const imagePromises = images.map(img => {
        if (img.complete && img.naturalWidth > 0) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 2000); // timeout máximo por imagen: 2s

            img.onload = () => {
                clearTimeout(timeout);
                resolve();
            };

            img.onerror = () => {
                clearTimeout(timeout);
                resolve();
            };

            if (img.src && !img.complete) {
                const currentSrc = img.src;
                img.src = '';
                img.src = currentSrc;
            }
        });
    });

    return Promise.all(imagePromises).then(() => undefined);
}

