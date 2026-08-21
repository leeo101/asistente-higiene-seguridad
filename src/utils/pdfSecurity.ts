import QRCode from 'qrcode';

export interface DocumentSecuritySeal {
  documentId: string;
  hash: string;
  shortHash: string;
  timestamp: string;
  qrDataUrl: string;
  verificationUrl: string;
}

/**
  Genera un hash SHA-256 usando la Web Crypto API nativa del navegador.
 */
export async function generateDocumentHash(payload: string | object): Promise<string> {
  const contentString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(contentString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
  Genera el sello completo de seguridad de integridad con Hash SHA-256 y QR Code de verificación.
 */
export async function generatePDFSecuritySeal(
  documentId: string,
  payloadData: object,
  baseUrl: string = window.location.origin
): Promise<DocumentSecuritySeal> {
  const timestamp = new Date().toISOString();
  const rawPayload = { documentId, timestamp, data: payloadData };
  const hash = await generateDocumentHash(rawPayload);
  const shortHash = hash.substring(0, 16).toUpperCase();
  const verificationUrl = `${baseUrl}/verify?doc=${encodeURIComponent(documentId)}&hash=${hash}`;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 120,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('[PDF SECURITY] Error generando código QR:', err);
  }

  return {
    documentId,
    hash,
    shortHash,
    timestamp,
    qrDataUrl,
    verificationUrl
  };
}

/**
  Dibuja el sello de seguridad en el pie de página de un documento jsPDF
 */
export function drawPDFSecurityFooter(
  doc: any, // instancia de jsPDF
  seal: DocumentSecuritySeal,
  pageNumber: number,
  totalPages: number
) {
  const pageSize = doc.internal.pageSize;
  const pageWidth = pageSize.width || pageSize.getWidth();
  const pageHeight = pageSize.height || pageSize.getHeight();

  const footerY = pageHeight - 14;

  doc.saveGraphicsState && doc.saveGraphicsState();
  
  // Línea divisoria
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.5);
  doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

  // Texto del Sello Digital
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // #64748b

  const textLeft = `DOCUMENTO OFICIAL VERIFICADO | HASH SHA-256: ${seal.shortHash}...`;
  const textSub = `ID: ${seal.documentId} | Emisión: ${new Date(seal.timestamp).toLocaleDateString('es-AR')} ${new Date(seal.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  
  doc.text(textLeft, 14, footerY);
  doc.text(textSub, 14, footerY + 4);

  // Código QR (si existe data URL)
  if (seal.qrDataUrl) {
    try {
      doc.addImage(seal.qrDataUrl, 'PNG', pageWidth - 26, footerY - 4, 12, 12);
    } catch (e) {}
  }

  // Número de página
  const pageStr = `Página ${pageNumber} de ${totalPages}`;
  doc.text(pageStr, pageWidth - 30, footerY + 4, { align: 'right' });

  doc.restoreGraphicsState && doc.restoreGraphicsState();
}
