import type { jsPDF } from 'jspdf';
import { formatProfessionTitle, DEFAULT_PROFESSION } from '../data/professionOptions';

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
 * Verifica si un dataURL corresponde a un lienzo vacío transparente (ej. 3058 bytes)
 */
function isValidImageDataUrl(val: any): boolean {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed.startsWith('data:image/')) return false;
  // Un canvas vacío de 600x165 genera exactamente 3058 caracteres en base64
  if (trimmed.length === 3058 || trimmed.length < 150) return false;
  return true;
}

/**
 * Extrae firma y sello reales guardados por el profesional en su perfil,
 * con recuperación automática desde el historial si se borró accidentalmente del almacenamiento local.
 */
function parseStoredSignatureAndStamp(): { signature: string | null; stamp: string | null } {
  let signature: string | null = null;
  let stamp: string | null = null;

  if (typeof window === 'undefined') return { signature, stamp };

  const candidateJsonKeys = ['signatureStampData', 'signature_stamp_data'];
  for (const key of candidateJsonKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const trimmed = raw.trim();
      if (isValidImageDataUrl(trimmed)) {
        signature = signature || trimmed;
        continue;
      }
      if (trimmed.startsWith('"data:image/')) {
        const unquoted = trimmed.slice(1, -1);
        if (isValidImageDataUrl(unquoted)) {
          signature = signature || unquoted;
        }
        continue;
      }
      const parsed = JSON.parse(trimmed);
      if (!parsed) continue;
      if (isValidImageDataUrl(parsed)) {
        signature = signature || parsed;
      } else if (typeof parsed === 'object') {
        const inner =
          typeof parsed.value === 'string' && parsed.value.trim().startsWith('{')
            ? JSON.parse(parsed.value)
            : typeof parsed.value === 'object' && parsed.value !== null
            ? parsed.value
            : parsed;

        if (isValidImageDataUrl(inner.value)) {
          signature = signature || inner.value;
        }
        if (isValidImageDataUrl(inner.signature)) {
          signature = signature || inner.signature;
        }
        if (isValidImageDataUrl(inner.signatureImage)) {
          signature = signature || inner.signatureImage;
        }
        if (isValidImageDataUrl(inner.stamp)) {
          stamp = stamp || inner.stamp;
        }
        if (isValidImageDataUrl(inner.stampImage)) {
          stamp = stamp || inner.stampImage;
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // Fallback a claves directas de firma
  if (!signature) {
    const fallbackKeys = [
      'capturedSignature',
      'digital_signature',
      'userSignature',
      'signatureData',
      'professionalSignature'
    ];
    for (const k of fallbackKeys) {
      try {
        const val = localStorage.getItem(k);
        if (isValidImageDataUrl(val)) {
          signature = val.trim();
          break;
        }
      } catch {
        // ignore
      }
    }
  }

  // Recuperación automática desde documentos previos del propio profesional si se borró de signatureStampData
  if (!signature) {
    const historyKeys = [
      'extinguishers_inventory',
      'ats_history',
      'drills_history',
      'accident_history',
      'thermal_history',
      'reports_history',
      'ehs_audits_db',
      'fireload_history',
      'lighting_history'
    ];
    for (const hKey of historyKeys) {
      try {
        const rawHist = localStorage.getItem(hKey);
        if (!rawHist) continue;
        const items = JSON.parse(rawHist);
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          const candidateSig =
            item?.professionalSignature ||
            item?.signature ||
            item?.auditorSignature ||
            item?.evaluadorFirma;
          if (isValidImageDataUrl(candidateSig) && candidateSig.length > 3500) {
            signature = candidateSig;
            // Restaurar inmediatamente en signatureStampData y capturedSignature
            try {
              localStorage.setItem(
                'signatureStampData',
                JSON.stringify({ signature, stamp: stamp || null })
              );
              localStorage.setItem('capturedSignature', signature);
            } catch {
              // ignore
            }
            break;
          }
        }
        if (signature) break;
      } catch {
        // ignore
      }
    }
  }

  return { signature, stamp };
}

/**
 * Recupera de forma segura y unificada los datos del profesional logueado desde localStorage,
 * devolviendo la firma ológrafa real que el profesional dibujó en su perfil (sin generar sellos artificiales).
 */
export function getSavedProfessionalData() {
  let name = '';
  let license = '';
  let profession = '';
  let college = '';
  let dni = '';
  let signatureFromPersonal: string | null = null;
  let stampFromPersonal: string | null = null;

  try {
    const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
    if (lsPersonal) {
      const rawParsed = JSON.parse(lsPersonal);
      const pd =
        rawParsed && typeof rawParsed.value === 'object' && rawParsed.value !== null
          ? rawParsed.value
          : rawParsed;
      if (pd && typeof pd === 'object') {
        name = pd.name || pd.fullName || '';
        license = pd.license || pd.matricula || '';
        profession = pd.profession || pd.profesion || pd.title || pd.titulo || '';
        college = pd.college || '';
        dni = pd.dni || '';
        if (isValidImageDataUrl(pd.signature)) {
          signatureFromPersonal = pd.signature;
        }
        if (isValidImageDataUrl(pd.stamp)) {
          stampFromPersonal = pd.stamp;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading personalData from localStorage', e);
  }

  const { signature: storedSig, stamp: storedStamp } = parseStoredSignatureAndStamp();
  const normalizedProfession = formatProfessionTitle(profession);
  const finalSignature = storedSig || signatureFromPersonal || null;
  const finalStamp = storedStamp || stampFromPersonal || null;

  return {
    name: name.trim(),
    license: license.trim(),
    profession: normalizedProfession,
    college: college.trim(),
    dni: dni.trim(),
    signature: finalSignature,
    stamp: finalStamp
  };
}

/**
 * Dibuja los recuadros estandarizados de firma en un documento jsPDF
 * con la misma estética profesional que el componente PdfSignatures.
 */
export function drawJsPdfSignatures(
  doc: jsPDF,
  options: DrawJsPdfSignaturesOptions
): number {
  const { box1, box2, box3, startY, maxY } = options;
  const proData = getSavedProfessionalData();

  const rawBoxes = [box1, box2, box3].filter((b): b is JsPdfSignatureBox => Boolean(b));
  const boxes = rawBoxes.map((b) => {
    if (!b.isProfessional) return b;
    return {
      ...b,
      title: (proData.profession || DEFAULT_PROFESSION).toUpperCase(),
      subtitle: (
        (b.subtitle &&
        b.subtitle !== 'Firma / Aclaración' &&
        b.subtitle !== 'FIRMA Y SELLO' &&
        b.subtitle !== 'FIRMA Y SELLO PROFESIONAL'
          ? b.subtitle
          : proData.name) || 'FIRMA Y SELLO PROFESIONAL'
      ).toUpperCase(),
      signatureUrl: isValidImageDataUrl(b.signatureUrl)
        ? b.signatureUrl
        : proData.signature,
      stampUrl: isValidImageDataUrl(b.stampUrl) ? b.stampUrl : proData.stamp,
      license: b.license || proData.license,
      profession: proData.profession
    };
  });

  if (boxes.length === 0) {
    return startY || 20;
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const boxHeight = 36;
  const maxAllowedY = maxY || pageHeight - 20;

  let currentY = startY !== undefined ? startY : pageHeight - boxHeight - 20;

  if (currentY + boxHeight > maxAllowedY) {
    doc.addPage();
    currentY = 25;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(16, currentY - 4, pageWidth - 16, currentY - 4);

  let boxWidth: number;
  let gap: number;
  let startX: number;

  if (boxes.length === 1) {
    boxWidth = Math.min(85, pageWidth - 32);
    gap = 0;
    startX = (pageWidth - boxWidth) / 2;
  } else if (boxes.length === 2) {
    boxWidth = Math.min(82, (pageWidth - 32 - 12) / 2);
    gap = 12;
    startX = (pageWidth - (boxWidth * 2 + gap)) / 2;
  } else {
    boxWidth = Math.min(58, (pageWidth - 24 - 12) / 3);
    gap = 6;
    startX = (pageWidth - (boxWidth * 3 + gap * 2)) / 2;
  }

  boxes.forEach((box, index) => {
    const x = startX + index * (boxWidth + gap);
    const y = currentY;
    const isPro = Boolean(box.isProfessional);

    if (isPro) {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.4);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
    }
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'FD');

    if (isPro) {
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(x, y, boxWidth, 1.2, 0.5, 0.5, 'F');
    }

    const sigAreaY = y + 2.5;
    const sigAreaHeight = 15;
    const hasSig = isValidImageDataUrl(box.signatureUrl);
    const hasStamp = isValidImageDataUrl(box.stampUrl);

    let renderedImage = false;

    if (hasSig && hasStamp) {
      try {
        const halfWidth = (boxWidth - 6) / 2;
        doc.addImage(
          box.signatureUrl!,
          'PNG',
          x + 2,
          sigAreaY,
          halfWidth,
          sigAreaHeight - 1,
          undefined,
          'FAST'
        );
        doc.addImage(
          box.stampUrl!,
          'PNG',
          x + 3 + halfWidth,
          sigAreaY,
          halfWidth,
          sigAreaHeight - 1,
          undefined,
          'FAST'
        );
        renderedImage = true;
      } catch (err) {
        console.warn('Error embedding signatures in jsPDF', err);
      }
    } else if (hasSig) {
      try {
        const imgW = Math.min(boxWidth - 8, 42);
        const imgX = x + (boxWidth - imgW) / 2;
        doc.addImage(
          box.signatureUrl!,
          'PNG',
          imgX,
          sigAreaY,
          imgW,
          sigAreaHeight - 1,
          undefined,
          'FAST'
        );
        renderedImage = true;
      } catch (err) {
        console.warn('Error embedding signature in jsPDF', err);
      }
    } else if (hasStamp) {
      try {
        const imgW = Math.min(boxWidth - 8, 36);
        const imgX = x + (boxWidth - imgW) / 2;
        doc.addImage(
          box.stampUrl!,
          'PNG',
          imgX,
          sigAreaY,
          imgW,
          sigAreaHeight - 1,
          undefined,
          'FAST'
        );
        renderedImage = true;
      } catch (err) {
        console.warn('Error embedding stamp in jsPDF', err);
      }
    }

    if (!renderedImage) {
      const lineY = sigAreaY + 11.5;
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.25);
      doc.line(x + 6, lineY, x + boxWidth - 6, lineY);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        isPro ? 'FIRMA / SELLO' : 'FIRMA Y ACLARACIÓN',
        x + boxWidth / 2,
        lineY + 3.2,
        { align: 'center' }
      );
    }

    const dividerY = sigAreaY + sigAreaHeight;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(x + 4, dividerY, x + boxWidth - 4, dividerY);

    const titleY = dividerY + 3.8;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    if (isPro) {
      doc.setTextColor(6, 95, 70);
    } else {
      doc.setTextColor(30, 41, 59);
    }
    const cleanTitle = (box.title || '').toUpperCase();
    const truncatedTitle =
      cleanTitle.length > 48 ? cleanTitle.substring(0, 46) + '...' : cleanTitle;
    doc.text(truncatedTitle, x + boxWidth / 2, titleY, { align: 'center' });

    const subY = titleY + 3.6;
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const cleanSubtitle = (box.subtitle || '').toUpperCase();
    const truncatedSubtitle =
      cleanSubtitle.length > 36 ? cleanSubtitle.substring(0, 34) + '...' : cleanSubtitle;
    doc.text(truncatedSubtitle, x + boxWidth / 2, subY, { align: 'center' });

    const badgeY = subY + 2.6;
    if (isPro && box.license) {
      const badgeText = `MAT. N° ${box.license
        .replace(/mat(ricula)?[:.°nN\s]*/i, '')
        .trim()}`.toUpperCase();
      const badgeW = Math.min(boxWidth - 10, doc.getTextWidth(badgeText) + 6);
      const badgeH = 3.6;
      const badgeX = x + (boxWidth - badgeW) / 2;

      doc.setFillColor(21, 128, 61);
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'F');

      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(badgeText, x + boxWidth / 2, badgeY + 2.6, { align: 'center' });
    } else if (box.secondarySubtitle) {
      doc.setFontSize(5.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const cleanSec =
        box.secondarySubtitle.length > 34
          ? box.secondarySubtitle.substring(0, 32) + '...'
          : box.secondarySubtitle;
      doc.text(cleanSec, x + boxWidth / 2, badgeY + 2.2, { align: 'center' });
    }
  });

  return currentY + boxHeight + 4;
}
