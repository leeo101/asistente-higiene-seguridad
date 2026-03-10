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

    // Add a temporary class to force print styles if needed
    element.classList.add('pdf-render-in-progress');

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better resolution
            useCORS: true, // Allow cross-origin images to be rendered
            logging: false,
            windowWidth: document.documentElement.offsetWidth,
            windowHeight: document.documentElement.offsetHeight,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        const orientation = isLandscape ? 'l' : 'p';
        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

        const destWidth = imgWidth * ratio;
        const destHeight = imgHeight * ratio;

        // Center the image if it doesn't take up the full height
        const marginX = (pdfWidth - destWidth) / 2;
        const marginY = 5; // Top margin

        pdf.addImage(imgData, 'JPEG', marginX, marginY, destWidth, destHeight);

        // Return the PDF as a Blob instead of downloading it directly
        return pdf.output('blob');

    } finally {
        element.classList.remove('pdf-render-in-progress');
    }
}
