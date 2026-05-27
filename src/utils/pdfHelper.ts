import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generates a PDF from an HTML element id and returns it as a Blob.
 */
export async function generatePdfBlob(elementId: string, isLandscape: boolean = false): Promise<Blob> {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with id '${elementId}' not found.`);
    }

    // Store original styles to restore later
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
        // Make element visible and positioned for capture
        // Force element to A4 width so its layout does not wrap endlessly on mobile.
        // Use absolute positioning to allow its height to grow naturally to whatever
        // height is needed to fit the unwrapped content.
        const targetWidth = isLandscape ? '297mm' : '210mm';
        
        // Hide off-screen instead of overlapping the UI
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.top = '0px';
        element.style.width = targetWidth;
        element.style.maxWidth = 'none';

        // CRÍTICO: forzar display:block para que scrollHeight funcione bien.
        // display:flex con marginTop:auto en hijos colapsa scrollHeight en html2canvas.
        element.style.display = 'block';
        element.style.flexDirection = 'unset';
        
        // Remove height constraints so it can expand naturally to content height
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

        // Primera espera: estilos y reflow inicial
        await new Promise(resolve => setTimeout(resolve, 300));

        // Forzar recálculo de layout
        element.getBoundingClientRect();
        document.body.offsetHeight; // trigger global reflow

        // Segunda espera: imágenes y fuentes (firmas, logos)
        await new Promise(resolve => setTimeout(resolve, 700));

        // Segundo recálculo para capturar la altura real tras imágenes
        element.getBoundingClientRect();

        // Default configuration
        const A4_WIDTH_MM = 210;
        const A4_HEIGHT_MM = 297;

        // Medir DESPUÉS del doble reflow
        const captureWidth = Math.max(element.scrollWidth, element.offsetWidth);
        const captureHeight = Math.max(element.scrollHeight, element.offsetHeight);

        // Calculate dynamic scale to prevent iOS canvas truncation limits (e.g. > 4096px height)
        // Max desired scale is 2.5 for high quality, minimum is 1.0.
        let dynamicScale = 2.5;
        if (captureHeight * dynamicScale > 4000) {
            dynamicScale = Math.max(1.0, 4000 / captureHeight);
        }

        const canvas = await html2canvas(element, {
            scale: dynamicScale,
            useCORS: true,
            allowTaint: true,
            logging: false,
            windowWidth: captureWidth,
            windowHeight: captureHeight,
            x: 0,
            y: 0,
            width: captureWidth,
            height: captureHeight,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        const pdf = new jsPDF({
            orientation: isLandscape ? 'l' : 'p',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const pdfWidth = isLandscape ? A4_HEIGHT_MM : A4_WIDTH_MM;
        const pdfHeight = isLandscape ? A4_WIDTH_MM : A4_HEIGHT_MM;

        const marginX = 10;
        const marginY = 10;
        const contentWidthMM = pdfWidth - (marginX * 2);

        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;
        const ratioPxToMm = contentWidthMM / imgWidthPx;
        const contentHeightMM = imgHeightPx * ratioPxToMm;

        let finalRatio = ratioPxToMm;
        let finalContentHeightMM = contentHeightMM;

        // Auto-fit to 1 page if it slightly overflows (e.g., up to 25% overflow)
        // This prevents unnecessary multi-page PDFs for forms that just barely overflow
        const maxOnePageHeight = pdfHeight - (marginY * 2);
        if (contentHeightMM > maxOnePageHeight && contentHeightMM <= maxOnePageHeight * 1.25) {
            finalRatio = maxOnePageHeight / imgHeightPx;
            finalContentHeightMM = maxOnePageHeight;
        }

        const finalContentWidthMM = imgWidthPx * finalRatio;
        // Center horizontally if scaled down
        const finalMarginX = marginX + (contentWidthMM - finalContentWidthMM) / 2;

        if (finalContentHeightMM <= maxOnePageHeight) {
            // Single page
            pdf.addImage(imgData, 'JPEG', finalMarginX, marginY, finalContentWidthMM, finalContentHeightMM);
        } else {
            // Multi-page: slice the tall image across pages
            // The trick is: on page N, we shift the image UP by (N-1) * pageHeight
            // so that the correct slice appears in the printable area
            const pageContentHeight = maxOnePageHeight;
            let pageNumber = 0;
            let remainingHeight = finalContentHeightMM;

            // Use a small tolerance (e.g., 5mm) to avoid adding a whole blank page for a tiny overflow
            while (remainingHeight > 5) {
                if (pageNumber > 0) pdf.addPage();

                // Vertical offset: shift the image up so this page's slice is visible
                const yOffset = marginY - pageNumber * pageContentHeight;

                pdf.addImage(
                    imgData, 'JPEG',
                    finalMarginX,
                    yOffset,
                    finalContentWidthMM,
                    finalContentHeightMM
                );

                remainingHeight -= pageContentHeight;
                pageNumber++;
            }
        }

        return pdf.output('blob');

    } finally {
        // Restore original styles
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
