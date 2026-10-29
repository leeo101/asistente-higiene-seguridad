import React, { useState, useEffect } from 'react';
import { formatProfessionTitle } from '../data/professionOptions';

const croppedCache = new Map<string, string>();

function AutoCroppedImg({
  src,
  alt,
  maxHeight = 52,
  maxWidth = 140
}: {
  src: string;
  alt: string;
  maxHeight?: number;
  maxWidth?: number;
}) {
  const [croppedSrc, setCroppedSrc] = useState<string>(() => croppedCache.get(src) || src);

  useEffect(() => {
    if (!src) return;
    if (croppedCache.has(src)) {
      setCroppedSrc(croppedCache.get(src)!);
      return;
    }
    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) return;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, w, h);

        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        let found = false;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            // Pixel visible y no blanco puro de fondo
            if (a > 20 && !(r > 245 && g > 245 && b > 245)) {
              found = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (!found) {
          croppedCache.set(src, '__EMPTY__');
          if (active) setCroppedSrc('__EMPTY__');
          return;
        }

        if (maxX >= minX && maxY >= minY) {
          const pad = 6;
          minX = Math.max(0, minX - pad);
          minY = Math.max(0, minY - pad);
          maxX = Math.min(w, maxX + pad);
          maxY = Math.min(h, maxY + pad);
          const trimW = Math.max(1, maxX - minX);
          const trimH = Math.max(1, maxY - minY);

          const out = document.createElement('canvas');
          out.width = trimW;
          out.height = trimH;
          const outCtx = out.getContext('2d');
          if (outCtx) {
            outCtx.drawImage(canvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
            const resultUrl = out.toDataURL('image/png');
            croppedCache.set(src, resultUrl);
            if (active) setCroppedSrc(resultUrl);
          }
        }
      } catch {
        // Fallback to original src
      }
    };
    img.src = src;
    return () => {
      active = false;
    };
  }, [src]);

  if (!croppedSrc || croppedSrc === '__EMPTY__') return null;

  return (
    <img
      src={croppedSrc}
      alt={alt}
      style={{
        maxHeight: `${maxHeight}px`,
        maxWidth: `${maxWidth}px`,
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        display: 'block',
        margin: 0
      }}
    />
  );
}

export interface SignatureBoxProps {
  title?: string;
  subtitle?: string;
  signatureUrl?: string | null;
  stampUrl?: string | null;
  isProfessional?: boolean;
  license?: string | null;
  profession?: string | null;
  customContent?: React.ReactNode;
}

export interface PdfSignaturesProps {
  data: any;
  box1?: SignatureBoxProps | null;
  box2?: SignatureBoxProps | null;
  box3?: SignatureBoxProps | null;
  hideFooter?: boolean;
  compact?: boolean;
}

export default function PdfSignatures({
  data,
  box1,
  box2,
  box3,
  hideFooter = false,
  compact = false
}: PdfSignaturesProps) {
  const getVal = (keys: string[]) => {
    for (const k of keys) {
      if (data && data[k] !== undefined && data[k] !== null && String(data[k]).trim() !== '') {
        return data[k];
      }
    }
    return null;
  };

  let actSignature = getVal(['professionalSignature', 'signature', 'auditorSignature', 'evaluadorFirma']);
  let actStamp = getVal(['professionalStamp', 'stamp', 'sello', 'profesionalSello']);
  let actName = getVal(['professionalName', 'responsable', 'leadAuditor', 'expositor', 'evaluador', 'profesionalNombre', 'name', 'nombre']);
  let actLic = getVal(['professionalLicense', 'license', 'matricula', 'profesionalMatricula']);
  let actTitle = getVal(['professionalTitle', 'profesion', 'profession', 'titulo', 'title', 'profesionalTitulo']);
  let supervisorSignature = getVal(['capatazSignature', 'supervisorSignature', 'responsableFirma']);
  let operatorSignature = getVal(['operatorSignature', 'operadorFirma']);

  if (!actSignature || !actStamp) {
    try {
      const lsStamp = typeof window !== 'undefined' ? localStorage.getItem('signatureStampData') : null;
      const legacySig = typeof window !== 'undefined' ? localStorage.getItem('capturedSignature') : null;
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        if (!actSignature) actSignature = parsed.signature;
        if (!actStamp) actStamp = parsed.stamp;
      } else if (legacySig && !actSignature) {
        actSignature = legacySig;
      }
    } catch (e) {}
  }

  if (!actName || !actLic || !actTitle) {
    try {
      const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name || pd.fullName;
        actLic = actLic || pd.license || pd.matricula;
        actTitle = actTitle || pd.profession || pd.profesion || pd.title || pd.titulo;
      }
    } catch (e) {}
  }

  actTitle = formatProfessionTitle(actTitle);
  const professionalDisplayTitle = (actTitle || 'PROFESIONAL DE HIGIENE Y SEGURIDAD').toUpperCase();
  const professionalDisplayName = (actName || 'FIRMA Y SELLO PROFESIONAL').toUpperCase();

  // Detección inteligente de cajas pasadas por props para evitar cruces
  let customOpBox: SignatureBoxProps | null = null;
  let customSupBox: SignatureBoxProps | null = null;
  let customProBox: SignatureBoxProps | null = null;

  const passedBoxes = [box1, box2, box3];
  passedBoxes.forEach((b) => {
    if (!b) return;
    if (b.isProfessional) {
      customProBox = b;
    } else if (b.title && /SUPERVIS|JEFE|AUDIT|DIRECTOR|MÉDICO|MEDICO|EVALUADOR|EMISOR|AUTORIZANTE|PLANTA/i.test(b.title)) {
      customSupBox = b;
    } else if (b.title && /OPERADOR|RESPONSABLE|TRABAJADOR|EMPLEADO|ELECTRICISTA|EJECUTANTE|SOLICITANTE/i.test(b.title)) {
      customOpBox = b;
    }
  });

  const defaultBox1: SignatureBoxProps = {
    title: 'RESPONSABLE / OPERADOR',
    subtitle: 'Aclaración y Firma',
    signatureUrl: operatorSignature || null,
    isProfessional: false
  };

  const defaultBox2: SignatureBoxProps = {
    title: professionalDisplayTitle,
    subtitle: professionalDisplayName,
    signatureUrl: actSignature,
    stampUrl: actStamp,
    isProfessional: true,
    license: actLic,
    profession: actTitle
  };

  const defaultBox3: SignatureBoxProps = {
    title: 'SUPERVISIÓN / RESPONSABLE',
    subtitle: 'Aprobación y Conformidad',
    signatureUrl: supervisorSignature,
    isProfessional: false
  };

  // Determinar visibilidad de cada rol
  const showOp = data?.showSignatures?.operator !== undefined
    ? Boolean(data.showSignatures.operator)
    : (box1 !== undefined ? box1 !== null : true);
  const showPro = data?.showSignatures?.professional !== undefined
    ? Boolean(data.showSignatures.professional)
    : ((box2 !== undefined || box3 !== undefined)
      ? (customProBox !== null || (box2 !== null && (box2?.isProfessional || !box2?.title?.includes('SUPERVIS'))))
      : true);
  const showSup = data?.showSignatures?.supervisor !== undefined
    ? Boolean(data.showSignatures.supervisor)
    : (customSupBox !== null || (box3 !== undefined ? box3 !== null : true));

  const boxes: SignatureBoxProps[] = [];

  if (showOp) {
    boxes.push(customOpBox || (box1 !== undefined && box1 !== null ? box1 : defaultBox1));
  }

  if (showPro) {
    const pBox = customProBox || (box2 && box2.isProfessional ? box2 : defaultBox2);
    // Garantizar que el título sea el título profesional elegido y el subtítulo el nombre
    boxes.push({
      ...pBox,
      title: pBox.title ? pBox.title.toUpperCase() : professionalDisplayTitle,
      subtitle: (pBox.subtitle && pBox.subtitle !== 'Firma / Aclaración' && pBox.subtitle !== 'FIRMA Y SELLO') 
        ? pBox.subtitle.toUpperCase() 
        : professionalDisplayName,
      isProfessional: true,
      license: pBox.license || actLic,
      profession: pBox.profession || actTitle
    });
  }

  if (showSup) {
    boxes.push(customSupBox || (box3 !== undefined && box3 !== null && !box3.isProfessional ? box3 : defaultBox3));
  }

  if (boxes.length === 0) return null;

  return (
    <div
      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      className={`pdf-signatures-wrapper avoid-break avoid-break-strictly break-inside-avoid w-full block ${
        compact ? 'mt-1.5 pt-2 pb-1' : 'mt-4 pt-4 pb-2'
      } border-t-2 border-slate-300 text-center mx-auto`}
    >
      <div 
        style={{
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch'
        }} 
        className={`avoid-break avoid-break-strictly break-inside-avoid flex justify-center items-stretch w-full ${
          compact ? 'gap-2.5' : 'gap-4'
        } flex-wrap mx-auto text-center`}
      >
        {boxes.map((box, idx) => {
          const isPro = box.isProfessional;
          const borderCol = isPro ? '#10b981' : '#cbd5e1';
          const bgCol = isPro ? '#f0fdf4' : '#f8fafc';
          const textCol = isPro ? '#065f46' : '#0f172a';
          const hasSig = typeof box.signatureUrl === 'string' && box.signatureUrl.trim().length > 5;
          const hasStamp = typeof box.stampUrl === 'string' && box.stampUrl.trim().length > 5;

          return (
            <div
              key={idx}
              style={{
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                flex: boxes.length === 1 ? '0 1 340px' : '1 1 0',
                margin: '0 auto',
                borderColor: borderCol,
                backgroundColor: bgCol,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              className={`avoid-break avoid-break-strictly break-inside-avoid ${
                compact ? 'p-2.5' : 'p-3.5'
              } text-center rounded-xl border-2 shadow-sm relative min-w-[200px] max-w-[340px] box-border ${
                isPro ? 'ring-1 ring-emerald-400' : ''
              }`}
            >
              {isPro && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 rounded-t-xl" />
              )}
              
              {/* Contenedor centrado de firma e imagen de sello */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  minHeight: compact ? '48px' : '56px'
                }}
                className="w-full text-center border-b border-dashed border-slate-300 pb-1.5 mb-1.5 flex items-center justify-center gap-2 mx-auto"
              >
                {hasSig && (
                  <AutoCroppedImg
                    src={box.signatureUrl!}
                    alt="Firma"
                    maxHeight={compact ? 46 : 54}
                    maxWidth={145}
                  />
                )}
                {hasStamp && (
                  <AutoCroppedImg
                    src={box.stampUrl!}
                    alt="Sello"
                    maxHeight={compact ? 46 : 54}
                    maxWidth={115}
                  />
                )}
                {!hasSig && !hasStamp && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: compact ? '42px' : '48px',
                      width: '100%'
                    }}
                  >
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none text-center">
                      Firma / Sello
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  textAlign: 'center',
                  flex: 1
                }}
              >
                {/* TÍTULO / RAMA PROFESIONAL EN CABECERA (CENTRADO) */}
                <div
                  style={{
                    color: textCol,
                    fontWeight: 900,
                    fontSize: '10.5px',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.25,
                    textAlign: 'center',
                    width: '100%',
                    padding: '0 4px'
                  }}
                >
                  {box.title}
                </div>

                {/* NOMBRE Y APELLIDO DEL FIRMANTE / PROFESIONAL (CENTRADO Y CLARO) */}
                <div
                  style={{
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '11.5px',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    textAlign: 'center',
                    width: '100%',
                    marginTop: '2px'
                  }}
                >
                  {box.subtitle}
                </div>

                {/* MATRÍCULA PROFESIONAL DESTACADA Y CENTRADA */}
                {box.license && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: '4px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1.2',
                        padding: '2px 9px',
                        backgroundColor: isPro ? '#15803d' : '#334155',
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontWeight: 900,
                        fontSize: '9.5px',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                      }}
                    >
                      Mat. N° {box.license}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer de verificación QR centrado */}
      {!hideFooter && (
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="mt-3 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between px-2 avoid-break avoid-break-strictly break-inside-avoid">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 bg-slate-100 border border-slate-300 rounded p-0.5 flex items-center justify-center shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/v/${data?.id || 'doc'}` : 'https://asistentehs.web.app')}`}
                alt="QR Validación"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-[10px] font-black text-slate-800 uppercase tracking-wider leading-tight flex items-center gap-1">
                <span>🔒</span> <span>VERIFICACIÓN DIGITAL H&amp;S</span>
              </div>
              <div className="text-[9px] text-slate-500 font-bold leading-tight">
                Escaneá el código QR para validar la autenticidad del documento.
              </div>
            </div>
          </div>
          <div className="text-right text-[9px] text-slate-500 font-extrabold flex items-center">
            DOCUMENTO AUDITADO · NORMA ISO 45001
          </div>
        </div>
      )}
    </div>
  );
}
