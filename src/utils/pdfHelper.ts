import html2pdf from 'html2pdf.js';

/**
 * Genera un PDF desde un elemento HTML por su ID y lo devuelve como Blob.
 *
 * TÉCNICA: Clonado off-screen
 * - NO modifica el elemento original (evita parpadeos y efectos secundarios)
 * - Inserta un clon en un contenedor invisible FUERA del viewport pero VISIBLE para html2canvas
 * - Espera que todas las imágenes (firmas base64, logos) carguen antes de capturar
 * - Compatible con iOS Safari, Android Chrome, y escritorio
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
        'left: 0',
        'top: 0',
        'width: ' + (isLandscape ? '297mm' : '210mm'),
        'height: auto',
        'overflow: visible',
        'visibility: visible',
        'opacity: 1',
        'pointer-events: none',
        'z-index: -9999',
        'background: #ffffff',
    ].join('; ');

    // Clonar el elemento original con todos sus hijos
    const clone = originalElement.cloneNode(true) as HTMLElement;

    // Forzar estilos en el clon para renderizado correcto
    clone.style.cssText += [
        '; width: 100%',
        'max-width: none',
        'height: auto',
        'min-height: 0',
        'overflow: visible',
        'display: block',
        'position: relative',
        'background: #ffffff',
        'color: #000000',
        'box-shadow: none',
        'border-radius: 0',
    ].join('');

    offscreenContainer.appendChild(clone);
    document.body.appendChild(offscreenContainer);

    try {
        // Esperar a que todas las imágenes del clon carguen
        await waitForImages(clone);

        // Pequeño delay adicional para que las fuentes y SVGs terminen de renderizarse
        await new Promise(resolve => setTimeout(resolve, 400));

        // Forzar un reflow del contenedor para que el navegador calcule los tamaños
        offscreenContainer.getBoundingClientRect();

        const opt = {
            margin:      [10, 10, 10, 10] as [number, number, number, number],
            filename:    'reporte.pdf',
            image:       { type: 'jpeg' as const, quality: 0.95 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,   // Necesario para imágenes base64 en iOS
                logging: false,
                scrollX: 0,         // Evita problemas de scroll en móvil
                scrollY: 0,
                windowWidth: isLandscape ? 1122 : 794, // Ancho equivalente a A4 a 96dpi
                backgroundColor: '#ffffff',
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: (isLandscape ? 'landscape' : 'portrait') as 'landscape' | 'portrait',
                compress: true,
            },
            pagebreak: { mode: ['css', 'avoid-all'] },
        };

        const pdfBlob = await html2pdf().set(opt).from(clone).outputPdf('blob');
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
