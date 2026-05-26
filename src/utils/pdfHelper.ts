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
        element.style.top = '-9999px';
        element.style.width = targetWidth;
        element.style.maxWidth = 'none';
        
        // Remove height constraints so it can expand naturally to content height
        element.style.height = 'max-content';
        element.style.minHeight = '0';
        element.style.overflow = 'visible';
        
        element.style.zIndex = '-9999';
        element.style.opacity = '1';
        element.style.pointerEvents = 'none';
        element.style.visibility = 'visible';
        element.style.backgroundColor = '#ffffff';
        element.style.color = '#000000';
        element.classList.add('force-pdf-print');

        // Wait for styles to apply and images to load
        await new Promise(resolve => setTimeout(resolve, 600));

        // Force layout recalc so scrollHeight is accurate
        element.getBoundingClientRect();

        // Default configuration
        const A4_WIDTH_MM = 210;
        const A4_HEIGHT_MM = 297;

        // Use scrollHeight to capture full content even if overflow was hidden
        const captureWidth = element.scrollWidth || element.offsetWidth;
        const captureHeight = element.scrollHeight || element.offsetHeight;

        const canvas = await html2canvas(element, {
            scale: 2.5, // Good quality without excessive memory
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

            while (remainingHeight > 0) {
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
