import type { jsPDF } from 'jspdf';
import { formatProfessionTitle } from '../data/professionOptions';

export interface JsPdfSignatureBox {
  title: string;
  subtitle?: string;
  secondarySubtitle?: string;
  signatureUrl?: string | null;
  stampUrl?: string | null;
  isProfessional?: boolean;
  license?: string | null;
  profession?: string | null;
}

export interface DrawJsPdfSignaturesOptions {
  box1?: JsPdfSignatureBox | null;
  box2?: JsPdfSignatureBox | null;
  box3?: JsPdfSignatureBox | null;
  /** Y position to draw signatures. If omitted or overflowing, will adapt */
  startY?: number;
  /** Maximum Y allowed on page before triggering a new page */
  maxY?: number;
}

/**
 * Recupera de forma segura los datos del profesional logueado desde localStorage
 */
export function getSavedProfessionalData() {
  let name = '';
  let license = '';
  let profession = '';
  let signature: string | null = null;
  let stamp: string | null = null;

  try {
    const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
    if (lsPersonal) {
      const pd = JSON.parse(lsPersonal);
      name = pd.name || pd.fullName || '';
      license = pd.license || pd.matricula || '';
      profession = pd.profession || pd.profesion || pd.title || pd.titulo || '';
    }
  } catch (e) {
    console.warn('Error reading personalData from localStorage', e);
  }

  try {
    const lsSig = typeof window !== 'undefined' ? localStorage.getItem('signatureStampData') : null;
    const legacySig = typeof window !== 'undefined' ? localStorage.getItem('capturedSignature') : null;
    if (lsSig) {
      const parsed = JSON.parse(lsSig);
      signature = parsed.signature || null;
      stamp = parsed.stamp || null;
    } else if (legacySig) {
      signature = legacySig;
    }
  } catch (e) {
    console.warn('Error reading signatureStampData from localStorage', e);
  }

  return {
    name: name.trim(),
    license: license.trim(),
    profession: formatProfessionTitle(profession),
    signature,
    stamp
  };
}

/**
 * Dibuja los recuadros estandarizados de firma (digital o convencional) en un documento jsPDF
 * con la misma estética profesional, bordes, badges y tipografías que el componente PdfSignatures.
 */
export function drawJsPdfSignatures(
  doc: jsPDF,
  options: DrawJsPdfSignaturesOptions
): number {
  const { box1, box2, box3, startY, maxY } = options;
  const boxes = [box1, box2, box3].filter((b): b is JsPdfSignatureBox => Boolean(b));

  if (boxes.length === 0) {
    return startY || 20;
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const boxHeight = 36;
  const maxAllowedY = maxY || (pageHeight - 20);

  let currentY = startY !== undefined ? startY : pageHeight - boxHeight - 20;

  // Si desborda la página, crear una nueva página
  if (currentY + boxHeight > maxAllowedY) {
    doc.addPage();
    currentY = 25;
  }

  // Línea divisoria superior sutil
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.4);
  doc.line(16, currentY - 4, pageWidth - 16, currentY - 4);

  // Calcular anchos y posiciones según la cantidad de cajas
  let boxWidth: number;
  let gap: number;
  let startX: number;

  if (boxes.length === 1) {
    boxWidth = Math.min(85, pageWidth - 32);
    gap = 0;
    startX = (pageWidth - boxWidth) / 2;
  } else if (boxes.length === 2) {
    boxWidth = Math.min(78, (pageWidth - 32 - 14) / 2);
    gap = 14;
    startX = (pageWidth - (boxWidth * 2 + gap)) / 2;
  } else {
    // 3 cajas
    boxWidth = Math.min(56, (pageWidth - 28 - 14) / 3);
    gap = 7;
    startX = (pageWidth - (boxWidth * 3 + gap * 2)) / 2;
  }

  boxes.forEach((box, index) => {
    const x = startX + index * (boxWidth + gap);
    const y = currentY;
    const isPro = Boolean(box.isProfessional);

    // Fondo y borde del recuadro
    if (isPro) {
      doc.setFillColor(240, 253, 244); // Emerald 50
      doc.setDrawColor(16, 185, 129); // Emerald 500
      doc.setLineWidth(0.4);
    } else {
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.3);
    }
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'FD');

    // Barra de acento superior
    if (isPro) {
      doc.setFillColor(16, 185, 129); // Emerald 500
      doc.roundedRect(x, y, boxWidth, 1.2, 0.5, 0.5, 'F');
    }

    // Área para Firma / Sello (altura: 16mm)
    const sigAreaY = y + 2.5;
    const sigAreaHeight = 15;
    const hasSig = typeof box.signatureUrl === 'string' && box.signatureUrl.startsWith('data:image/');
    const hasStamp = typeof box.stampUrl === 'string' && box.stampUrl.startsWith('data:image/');

    let renderedImage = false;

    if (hasSig && hasStamp) {
      // Ambas imágenes: firma a la izquierda, sello a la derecha
      try {
        const halfWidth = (boxWidth - 6) / 2;
        doc.addImage(box.signatureUrl!, 'PNG', x + 2, sigAreaY, halfWidth, sigAreaHeight - 1, undefined, 'FAST');
        doc.addImage(box.stampUrl!, 'PNG', x + 3 + halfWidth, sigAreaY, halfWidth, sigAreaHeight - 1, undefined, 'FAST');
        renderedImage = true;
      } catch (err) {
        console.warn('Error embedding signatures in jsPDF', err);
      }
    } else if (hasSig) {
      try {
        const imgW = Math.min(boxWidth - 8, 38);
        const imgX = x + (boxWidth - imgW) / 2;
        doc.addImage(box.signatureUrl!, 'PNG', imgX, sigAreaY, imgW, sigAreaHeight - 1, undefined, 'FAST');
        renderedImage = true;
      } catch (err) {
        console.warn('Error embedding signature in jsPDF', err);
      }
    } else if (hasStamp) {
      try {
        const imgW = Math.min(boxWidth - 8, 34);
        const imgX = x + (boxWidth - imgW) / 2;
        doc.addImage(box.stampUrl!, 'PNG', imgX, sigAreaY, imgW, sigAreaHeight - 1, undefined, 'FAST');
        renderedImage = true;
      } catch (err) {
        console.warn('Error embedding stamp in jsPDF', err);
      }
    }

    // Si no hay imagen (o falló), renderizar la línea de firma convencional con etiqueta
    if (!renderedImage) {
      const lineY = sigAreaY + 11.5;
      doc.setDrawColor(148, 163, 184); // Slate 400
      doc.setLineWidth(0.25);
      doc.line(x + 6, lineY, x + boxWidth - 6, lineY);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(isPro ? 'FIRMA / SELLO' : 'FIRMA Y ACLARACIÓN', x + boxWidth / 2, lineY + 3.2, { align: 'center' });
    }

    // Línea divisoria horizontal sutil debajo de la firma
    const dividerY = sigAreaY + sigAreaHeight;
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.2);
    doc.line(x + 4, dividerY, x + boxWidth - 4, dividerY);

    // Título (Profesión o Rol)
    const titleY = dividerY + 3.8;
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'bold');
    if (isPro) {
      doc.setTextColor(6, 95, 70); // Emerald 800
    } else {
      doc.setTextColor(30, 41, 59); // Slate 800
    }
    const cleanTitle = (box.title || '').toUpperCase();
    const truncatedTitle = cleanTitle.length > 32 ? cleanTitle.substring(0, 30) + '...' : cleanTitle;
    doc.text(truncatedTitle, x + boxWidth / 2, titleY, { align: 'center' });

    // Subtítulo / Nombre del firmante
    const subY = titleY + 3.6;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // Slate 900
    const cleanSubtitle = (box.subtitle || '').toUpperCase();
    const truncatedSubtitle = cleanSubtitle.length > 32 ? cleanSubtitle.substring(0, 30) + '...' : cleanSubtitle;
    doc.text(truncatedSubtitle, x + boxWidth / 2, subY, { align: 'center' });

    // Badge de matrícula o subtítulo secundario
    const badgeY = subY + 2.8;
    if (isPro && box.license) {
      const badgeText = `MAT. ${box.license.replace(/mat(ricula)?[:.]?\s*/i, '').trim()}`.toUpperCase();
      const badgeW = Math.min(boxWidth - 10, doc.getTextWidth(badgeText) + 6);
      const badgeH = 3.6;
      const badgeX = x + (boxWidth - badgeW) / 2;

      doc.setFillColor(21, 128, 61); // Green 700
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'F');

      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(badgeText, x + boxWidth / 2, badgeY + 2.6, { align: 'center' });
    } else if (box.secondarySubtitle) {
      doc.setFontSize(5.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // Slate 500
      const cleanSec = box.secondarySubtitle.length > 34 ? box.secondarySubtitle.substring(0, 32) + '...' : box.secondarySubtitle;
      doc.text(cleanSec, x + boxWidth / 2, badgeY + 2.2, { align: 'center' });
    }
  });

  return currentY + boxHeight + 4;
}
