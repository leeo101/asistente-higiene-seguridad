import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Genera un PDF desde un elemento HTML por su ID y lo devuelve como Blob.
 *
 * TÉCNICA: Clonado off-screen segmentado
 * - Captura en bloques iterativos para evadir límites de RAM de Canvas en móviles
 */
export async function generatePdfBlob(elementId: string, isLandscape: boolean = false): Promise<Blob> {
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

    // Contenedor off-screen: visible para html2canvas pero fuera del viewport del usuario
    const offscreenContainer = document.createElement('div');
    offscreenContainer.setAttribute('data-pdf-offscreen', 'true');
    offscreenContainer.classList.add('ats-pdf-offscreen');
    offscreenContainer.style.cssText = [
        'position: absolute',
        'left: 0',
        'top: -99999px',   // Push far UP (vertical) — does NOT create horizontal scroll
        'z-index: -9999',
        'width: ' + (isLandscape ? '1600px' : '1200px'),
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
    
    // Agregamos esta clase para que los componentes que solo se muestran en impresión
    // (como el pie de página legal) se hagan visibles en el clon antes de tomar la foto.
    clone.classList.add('force-pdf-print');

    const targetWidth = isLandscape ? 1600 : 1200;

    // Forzar estilos en el clon para renderizado correcto (A4 width)
    clone.style.cssText += [
        '; width: ' + targetWidth + 'px !important',
        'max-width: ' + targetWidth + 'px !important',
        'height: auto !important', // Permitir que expanda todo lo necesario
        'min-height: 0 !important',
        'display: block',
        'position: relative',
        'background: #ffffff',
        'color: #000000',
        'box-shadow: none',
        'border-radius: 0',
        'box-sizing: border-box !important',
        'margin: 0',
        'padding: 10px 20px',
        'opacity: 1 !important',
        'visibility: visible !important'
    ].join('; ');

    offscreenContainer.appendChild(clone);
    document.body.appendChild(offscreenContainer);

    // Eliminar restricciones de altura y overflow en todos los elementos del clon
    // que puedan causar recortes en html2canvas
    const allChildren = clone.querySelectorAll('*');
    allChildren.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        const style = window.getComputedStyle(htmlEl);
        if (style.overflow === 'hidden' || style.overflow === 'auto' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
            // Evitar remover overflow:hidden de elementos pequeños que lo usan para border-radius (ej. avatares, progress bars)
            if (htmlEl.clientHeight > 150) {
                htmlEl.style.setProperty('overflow', 'visible', 'important');
                htmlEl.style.setProperty('overflow-y', 'visible', 'important');
                htmlEl.style.setProperty('overflow-x', 'hidden', 'important'); // previene overflow horizontal
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

    try {
        await waitForImages(clone);
        // Dar tiempo al navegador para pintar el clon antes de capturar
        // requestAnimationFrame + doble tick garantiza que el layout está listo
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const renderWait = (window.innerWidth < 768 || ('ontouchstart' in window)) ? 1500 : 600;
        await new Promise(resolve => setTimeout(resolve, renderWait));
        // Forzar reflow para que html2canvas tenga dimensiones correctas
        offscreenContainer.getBoundingClientRect();
        clone.getBoundingClientRect();
        await new Promise(resolve => setTimeout(resolve, 200));

        const isMobileCanvas = window.innerWidth < 768 || ('ontouchstart' in window);
        
        // El límite máximo seguro de área para un canvas en iOS/Safari móvil es ~16.777.216 píxeles.
        // Superar este límite causa recortes (canvas en blanco, solo 1 hoja) o crashes de memoria.
        const MAX_CANVAS_AREA = 15000000; // Un poco menos de 16M para margen de seguridad
        const widthPx = isLandscape ? 1600 : 1200;
        const totalHeight = Math.max(clone.scrollHeight, clone.clientHeight);
        const totalArea = widthPx * totalHeight;
        
        // Calculamos la escala máxima permitida matemáticamente para no exceder el límite
        const maxSafeScale = Math.sqrt(MAX_CANVAS_AREA / totalArea);
        
        // En desktop usamos scale 2 (máxima calidad). En móvil, empezamos con 1.5 o bajamos si es muy largo.
        let dynamicScale = isMobileCanvas ? Math.min(1.5, maxSafeScale) : Math.min(2, maxSafeScale);
        
        // NUNCA superar maxSafeScale o el canvas se cortará en iOS.
        // Si el reporte es kilométrico, el scale será < 1, perdiendo algo de nitidez pero asegurando que no se corte.
        dynamicScale = Math.min(dynamicScale, maxSafeScale);


        const opt = {
            margin: [10, 8, 15, 8], // Top: 10mm, Right: 8mm, Bottom: 15mm, Left: 8mm (márgenes agregados)
            filename: 'documento.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: dynamicScale, 
                useCORS: true, 
                allowTaint: false, // DESHABILITADO: Previene SecurityError al intentar capturar imágenes sin CORS (ej. Firebase)
                logging: false,
                windowWidth: isLandscape ? 1600 : 1200,
                width: isLandscape ? 1600 : 1200,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                windowHeight: totalHeight // ensure full height is captured
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait' },
            pagebreak: { mode: ['css', 'legacy'], avoid: '.avoid-break' }
        };

        // html2pdf procesa automáticamente las clases pageBreakInside: avoid y no corta los elementos por la mitad
        const worker = html2pdf().set(opt as any).from(clone).toPdf();
        
        await worker.get('pdf').then((pdf: any) => {
            const totalPages = pdf.internal.getNumberOfPages();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Agregar pie de página a todas las páginas para garantizar que siempre salga
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(7);
                pdf.setTextColor(150, 163, 184); // color slate-400
                pdf.text(
                    'Generado con Asistente HYS — La plataforma de Higiene y Seguridad con IA',
                    pageWidth / 2, 
                    pageHeight - 6, 
                    { align: 'center' }
                );
                // Número de página
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
        // Siempre limpiar el contenedor off-screen
        if (offscreenContainer.parentNode) {
            document.body.removeChild(offscreenContainer);
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
        // Si la imagen ya está cargada, resolver inmediatamente
        if (img.complete && img.naturalWidth > 0) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 3000); // timeout máximo por imagen: 3s

            img.onload = () => {
                clearTimeout(timeout);
                resolve();
            };

            img.onerror = () => {
                clearTimeout(timeout);
                resolve(); // No bloquear el PDF si una imagen falla (ej: logo no encontrado)
            };

            // Si la imagen tiene src, forzar recarga en el clon
            if (img.src && !img.complete) {
                const currentSrc = img.src;
                img.src = '';
                img.src = currentSrc;
            }
        });
    });

    return Promise.all(imagePromises).then(() => undefined);
}
