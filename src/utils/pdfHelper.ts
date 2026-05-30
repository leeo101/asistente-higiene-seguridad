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
        'position: absolute', // absolute allows element to grow indefinitely without viewport clipping
        'left: -9999px', // Mover lejos del viewport para que no se vea debajo del modal
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
    
    // Agregamos esta clase para que los componentes que solo se muestran en impresión
    // (como el pie de página legal) se hagan visibles en el clon antes de tomar la foto.
    clone.classList.add('force-pdf-print');

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
        await waitForImages(clone);
        await new Promise(resolve => setTimeout(resolve, 2500));
        offscreenContainer.getBoundingClientRect();
        clone.getBoundingClientRect();
        await new Promise(resolve => setTimeout(resolve, 500));

        const isMobileCanvas = window.innerWidth < 768 || ('ontouchstart' in window);
        const dynamicScale = isMobileCanvas ? 1.5 : 2;

        const opt = {
            margin: [10, 10, 10, 10], // top, left, bottom, right in mm
            filename: 'documento.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: dynamicScale, 
                useCORS: true, 
                allowTaint: true,
                logging: false,
                windowWidth: isLandscape ? 1122 : 794
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        // html2pdf procesa automáticamente las clases pageBreakInside: avoid y no corta los elementos por la mitad
        const pdfBlob = await html2pdf().set(opt as any).from(clone).output('blob');
        return pdfBlob;

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
