import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generates a PDF from an HTML element id and returns it as a Blob.
 */
export async function generatePdfBlob(elementId, filename = 'reporte.pdf', isLandscape = false) {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with id '${elementId}' not found.`);
    }

    // Store original styles to restore later
    const originalStyles = {
        position: element.style.position,
        left: element.style.left,
        top: element.style.top,
        zIndex: element.style.zIndex,
        opacity: element.style.opacity,
        pointerEvents: element.style.pointerEvents,
        visibility: element.style.visibility
    };

    try {
        // Make element visible and positioned for capture
        element.style.position = 'fixed';
        element.style.left = '0';
        element.style.top = '0';
        element.style.zIndex = '9999';
        element.style.opacity = '1';
        element.style.pointerEvents = 'none';
        element.style.visibility = 'visible';

        // Wait for styles to apply
        await new Promise(resolve => setTimeout(resolve, 300));

        // Default configuration
        const A4_WIDTH_MM = 210;
        const A4_HEIGHT_MM = 297;

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            x: 0,
            y: 0,
            width: element.offsetWidth,
            height: element.offsetHeight,
            backgroundColor: '#ffffff'
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

        if (contentHeightMM <= (pdfHeight - marginY * 2)) {
            pdf.addImage(imgData, 'JPEG', marginX, marginY, contentWidthMM, contentHeightMM);
        } else {
            let heightLeft = contentHeightMM;
            let positionY = marginY;
            let pageNum = 1;

            pdf.addImage(imgData, 'JPEG', marginX, marginY, contentWidthMM, contentHeightMM);
            heightLeft -= (pdfHeight - marginY * 2);

            while (heightLeft > 0) {
                positionY = heightLeft - contentHeightMM + marginY;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', marginX, positionY, contentWidthMM, contentHeightMM);
                heightLeft -= (pdfHeight - marginY * 2);
                pageNum++;
            }
        }

        return pdf.output('blob');

    } finally {
        // Restore original styles
        element.style.position = originalStyles.position;
        element.style.left = originalStyles.left;
        element.style.top = originalStyles.top;
        element.style.zIndex = originalStyles.zIndex;
        element.style.opacity = originalStyles.opacity;
        element.style.pointerEvents = originalStyles.pointerEvents;
        element.style.visibility = originalStyles.visibility;
        element.classList.remove('pdf-render-in-progress');
    }
}
