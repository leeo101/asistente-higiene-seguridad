import html2pdf from 'html2pdf.js';

/**
 * Generates a PDF from an HTML element id and returns it as a Blob.
 * Utiliza html2pdf.js para evitar que los saltos de página corten el texto.
 */
export async function generatePdfBlob(elementId: string, isLandscape: boolean = false): Promise<Blob> {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with id '${elementId}' not found.`);
    }

    // Guardar estilos originales para restaurarlos luego
    const originalStyles = {
        position: element.style.position,
        left: element.style.left,
        top: element.style.top,
        width: element.style.width,
        maxWidth: element.style.maxWidth,
        height: element.style.height,
        minHeight: element.style.minHeight,
        display: element.style.display,
        flexDirection: element.style.flexDirection,
        transform: element.style.transform,
        zIndex: element.style.zIndex,
        opacity: element.style.opacity,
        pointerEvents: element.style.pointerEvents,
        visibility: element.style.visibility,
        backgroundColor: element.style.backgroundColor
    };

    try {
        const targetWidth = isLandscape ? '297mm' : '210mm';
        
        // Preparar el elemento para que html2pdf lo pueda renderizar bien
        element.style.position = 'absolute';
        element.style.left = '0px';
        element.style.top = '0px';
        element.style.width = targetWidth;
        element.style.maxWidth = 'none';

        element.style.display = 'block';
        element.style.flexDirection = 'unset';
        
        element.style.height = 'auto';
        element.style.minHeight = '0';
        element.style.overflow = 'visible';
        
        element.style.zIndex = '-9999';
        element.style.opacity = '1';
        element.style.pointerEvents = 'none';
        element.style.visibility = 'visible';
        element.style.backgroundColor = '#ffffff';
        element.style.color = '#000000';
        element.classList.add('force-pdf-print');

        // Espera para carga de imágenes y fuentes
        await new Promise(resolve => setTimeout(resolve, 300));
        element.getBoundingClientRect();
        document.body.offsetHeight; // trigger global reflow
        await new Promise(resolve => setTimeout(resolve, 700));

        const opt = {
            margin:       [10, 10, 10, 10] as [number, number, number, number], // top, left, bottom, right in mm
            filename:     'reporte.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait' },
            pagebreak:    { mode: ['css', 'avoid-all'] } // IMPORTANTE: evita cortar a la mitad de los elementos
        };

        // Generar el PDF y devolverlo como Blob
        const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
        return pdfBlob;

    } finally {
        // Restaurar estilos originales
        element.style.position = originalStyles.position;
        element.style.left = originalStyles.left;
        element.style.top = originalStyles.top;
        element.style.width = originalStyles.width;
        element.style.maxWidth = originalStyles.maxWidth;
        element.style.height = originalStyles.height;
        element.style.minHeight = originalStyles.minHeight;
        element.style.display = originalStyles.display;
        element.style.flexDirection = originalStyles.flexDirection;
        element.style.transform = originalStyles.transform;
        element.style.zIndex = originalStyles.zIndex;
        element.style.opacity = originalStyles.opacity;
        element.style.pointerEvents = originalStyles.pointerEvents;
        element.style.visibility = originalStyles.visibility;
        element.style.backgroundColor = originalStyles.backgroundColor;
        element.classList.remove('force-pdf-print');
        element.classList.remove('pdf-render-in-progress');
    }
}
