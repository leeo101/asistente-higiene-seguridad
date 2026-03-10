import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generates a PDF from an HTML element id and returns it as a Blob.
 * 
 * @param {string} elementId - The ID of the HTML element to render (e.g., 'pdf-content').
 * @param {string} filename - The desired filename (used internally or for fallbacks).
 * @param {boolean} isLandscape - Whether the PDF should be in landscape mode.
 * @returns {Promise<Blob>} A Promise that resolves to the PDF Blob.
 */
export async function generatePdfBlob(elementId, filename = 'reporte.pdf', isLandscape = false) {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with id '${elementId}' not found.`);
    }

    try {
        // Default configuration
        const A4_WIDTH_MM = 210;
        const A4_HEIGHT_MM = 297;
        
        // Wait a tiny bit for any re-renders triggered by the 'pdf-render-in-progress' class
        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(element, {
            scale: 2, // 2x resolution is a good balance of quality/size
            useCORS: true,
            logging: false,
            // Ensure we capture the full height of the element, not just the viewport
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            // Add some padding to the sides to simulate print margins
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

        // Dimensions of the page in mm depending on orientation
        const pdfWidth = isLandscape ? A4_HEIGHT_MM : A4_WIDTH_MM;
        const pdfHeight = isLandscape ? A4_WIDTH_MM : A4_HEIGHT_MM;

        // Calculate the image width in mm, keeping it within the PDF width
        // We use a small margin (e.g. 10mm on each side)
        const marginX = 10;
        const marginY = 10;
        const contentWidthMM = pdfWidth - (marginX * 2);

        // Calculate the height of the image in mm while maintaining aspect ratio
        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;
        const ratioPxToMm = contentWidthMM / imgWidthPx;
        const contentHeightMM = imgHeightPx * ratioPxToMm;

        // If the content fits on one page
        if (contentHeightMM <= (pdfHeight - marginY * 2)) {
            pdf.addImage(imgData, 'JPEG', marginX, marginY, contentWidthMM, contentHeightMM);
        } else {
            // The content is taller than a single A4 page, so we split it into multiple pages
            let heightLeft = contentHeightMM;
            let positionY = marginY;
            let pageNum = 1;

            // First page
            pdf.addImage(imgData, 'JPEG', marginX, positionY, contentWidthMM, contentHeightMM);
            heightLeft -= (pdfHeight - marginY * 2);

            // Subsequent pages
            while (heightLeft > 0) {
                positionY = heightLeft - contentHeightMM + marginY; // Move the image UP to show the next chunk
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', marginX, positionY, contentWidthMM, contentHeightMM);
                heightLeft -= (pdfHeight - marginY * 2);
                pageNum++;
            }
        }

        // Return the PDF as a Blob
        return pdf.output('blob');

    } finally {
        element.classList.remove('pdf-render-in-progress');
    }
}
