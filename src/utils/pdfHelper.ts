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
    offscreenContainer.classList.add('ats-pdf-offscreen'); // Add class to trigger CSS height fixes
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

    // Prevent html2canvas from clipping on mobile due to overflow-x: hidden
    document.documentElement.classList.add('pdf-export-mode');
    document.body.classList.add('pdf-export-mode');

    try {
        await waitForImages(clone);
        await new Promise(resolve => setTimeout(resolve, 2500));
        offscreenContainer.getBoundingClientRect();
        clone.getBoundingClientRect();
        await new Promise(resolve => setTimeout(resolve, 500));

        const isMobileCanvas = window.innerWidth < 768 || ('ontouchstart' in window);
        
        // El límite máximo seguro de área para un canvas en iOS/Safari móvil es ~16.777.216 píxeles.
        // Superar este límite causa recortes (canvas en blanco) o crashes de memoria.
        const MAX_CANVAS_AREA = 16000000;
        const widthPx = isLandscape ? 1122 : 794;
        const totalHeight = clone.scrollHeight;
        const totalArea = widthPx * totalHeight;
        
        // Calculamos la escala máxima permitida matemáticamente para no exceder los 16 millones de píxeles
        const maxSafeScale = Math.sqrt(MAX_CANVAS_AREA / totalArea);
        
        // En desktop usamos scale 2 (máxima calidad). En móvil, empezamos con 1.5 o bajamos si es muy largo.
        let dynamicScale = isMobileCanvas ? Math.min(1.5, maxSafeScale) : Math.min(2, maxSafeScale);
        
        // Evitamos que baje de 0.8 para no perder legibilidad
        dynamicScale = Math.max(0.8, dynamicScale);

        const opt = {
            margin: [10, 0, 15, 0], // Top: 10mm, Right: 0, Bottom: 15mm (espacio para el pie), Left: 0
            filename: 'documento.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: dynamicScale, 
                useCORS: true, 
                allowTaint: true,
                logging: false,
                windowWidth: isLandscape ? 1122 : 794,
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
