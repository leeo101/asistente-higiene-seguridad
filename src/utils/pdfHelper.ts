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
    const originalElement = document.getElementById(elementId);
    if (!originalElement) {
        throw new Error(`Elemento con id '${elementId}' no encontrado.`);
    }

    // Contenedor off-screen: visible para html2canvas pero fuera del viewport del usuario
    const offscreenContainer = document.createElement('div');
    offscreenContainer.setAttribute('data-pdf-offscreen', 'true');
    offscreenContainer.style.cssText = [
        'position: absolute',
        'left: -9999px', // Mover hacia la izquierda para no ensanchar el documento y evitar zoom/agrandamiento en móvil
        'top: 0',
        'width: ' + (isLandscape ? '1122px' : '794px'), // Ancho exacto en px para evitar recortes en móvil
        'height: auto',
        'overflow: visible',
        'visibility: visible',
        'opacity: 1',
        'pointer-events: none',
        'z-index: -9999',
        'background: #ffffff'
    ].join('; ');

    // Clonar el elemento original con todos sus hijos
    const clone = originalElement.cloneNode(true) as HTMLElement;

    // Forzar estilos en el clon para renderizado correcto (A4 width)
    clone.style.cssText += [
        '; width: 100%',
        'max-width: none',
        'height: auto', // Permitir que expanda todo lo necesario
        'min-height: 0',
        'display: block',
        'position: relative',
        'background: #ffffff',
        'color: #000000',
        'box-shadow: none',
        'border-radius: 0',
        'margin: 0',
        'padding: 1px 0' // Evita que los márgenes internos se salgan
    ].join('; ');

    offscreenContainer.appendChild(clone);
    document.body.appendChild(offscreenContainer);

    try {
        // Esperar a que todas las imágenes del clon carguen
        await waitForImages(clone);

        // Pequeño delay adicional para que las fuentes y SVGs terminen de renderizarse
        await new Promise(resolve => setTimeout(resolve, 400));

        // Forzar un reflow del contenedor para que el navegador calcule los tamaños
        offscreenContainer.getBoundingClientRect();

        // Evitar límite de memoria de Canvas en móviles (ej. 16MP en iOS Safari)
        const isMobileCanvas = window.innerWidth < 768 || ('ontouchstart' in window);
        const dynamicScale = isMobileCanvas ? 1 : 2;

        const margin = 10;

        const manualPdf = new jsPDF({
            unit: 'mm',
            format: 'a4',
            orientation: isLandscape ? 'landscape' : 'portrait',
            compress: true
        });

        const pdfWidthMm = manualPdf.internal.pageSize.getWidth();
        const pdfHeightMm = manualPdf.internal.pageSize.getHeight();
        const innerPdfWidthMm = pdfWidthMm - margin * 2;
        const innerPdfHeightMm = pdfHeightMm - margin * 2;

        const windowWidthPx = isLandscape ? 1122 : 794;
        
        // Calculamos la altura EXACTA en píxeles que equivale al área imprimible de la hoja A4
        const chunkHeightPx = Math.floor(windowWidthPx * (innerPdfHeightMm / innerPdfWidthMm));
        
        const totalHeightPx = clone.scrollHeight || clone.getBoundingClientRect().height;
        let currentY = 0;
        let isFirstPage = true;

        const optBase = {
            scale: dynamicScale,
            useCORS: true,
            allowTaint: true,
            logging: false,
            scrollX: 0,
            windowWidth: windowWidthPx,
            backgroundColor: '#ffffff',
        };

        // Iteramos tomando "fotos" del tamaño exacto de la hoja para no superar el límite de memoria en móviles
        while (currentY < totalHeightPx) {
            const remainingHeight = totalHeightPx - currentY;
            // Tolerancia: si queda un residuo muy chico (ej. menos de 20px de padding final) no generamos una hoja entera
            if (remainingHeight < 20 && currentY > 0) break;

            const currentChunkHeightPx = Math.min(chunkHeightPx, remainingHeight);

            // Capturar pedazo de DOM
            const canvas = await html2canvas(clone, {
                ...optBase,
                x: -9999, // Coordenada donde movimos el clon para que no afecte el width del dispositivo
                y: currentY,
                height: currentChunkHeightPx,
                windowHeight: totalHeightPx // Mantener altura total para no romper CSS flex/grids
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            const canvasRatio = canvas.height / canvas.width;
            const drawHeightMm = innerPdfWidthMm * canvasRatio;

            if (!isFirstPage) {
                manualPdf.addPage();
            } else {
                isFirstPage = false;
            }

            // Dibujar imagen exacta en la hoja
            manualPdf.addImage(imgData, 'JPEG', margin, margin, innerPdfWidthMm, drawHeightMm);

            currentY += currentChunkHeightPx;
            
            // Si el pedazo actual era el último, rompemos el ciclo (por seguridad de redondeo)
            if (currentChunkHeightPx < chunkHeightPx) break;
        }

        return manualPdf.output('blob');

    } finally {
        // Siempre limpiar el contenedor off-screen
        if (offscreenContainer.parentNode) {
            document.body.removeChild(offscreenContainer);
        }
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
