import React from 'react';
import { formatProfessionTitle } from '../data/professionOptions';

export interface SignatureBoxProps {
  title: string;
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
}

export default function PdfSignatures({ data, box1, box2, box3 }: PdfSignaturesProps) {
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
    } else if (b.title && /SUPERVIS|JEFE|AUDIT|DIRECTOR/i.test(b.title)) {
      customSupBox = b;
    } else if (b.title && /OPERADOR|RESPONSABLE|TRABAJADOR|EMPLEADO/i.test(b.title)) {
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
  const showOp = box1 !== undefined ? box1 !== null : (data?.showSignatures?.operator !== false);
  const showPro = (box2 !== undefined || box3 !== undefined)
    ? (customProBox !== null || (box2 !== null && (box2?.isProfessional || !box2?.title?.includes('SUPERVIS'))))
    : (data?.showSignatures?.professional !== false);
  const showSup = box3 !== undefined 
    ? box3 !== null 
    : (box2 && /SUPERVIS/i.test(box2.title || '') ? true : data?.showSignatures?.supervisor !== false);

  const boxes: SignatureBoxProps[] = [];

  if (showOp) {
    boxes.push(customOpBox || (box1 !== undefined && box1 !== null ? box1 : defaultBox1));
  }

  if (showPro) {
    const pBox = customProBox || (box2 && box2.isProfessional ? box2 : defaultBox2);
    // Garantizar que el título sea el título profesional elegido y el subtítulo el nombre
    boxes.push({
      ...pBox,
      title: pBox.title && !/PROFESIONAL DE HIGIENE|PROFESIONAL ACTUANTE/i.test(pBox.title) 
        ? pBox.title.toUpperCase() 
        : professionalDisplayTitle,
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
    <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="pdf-signatures-wrapper avoid-break avoid-break-strictly break-inside-avoid w-full block mt-4 border-t-2 border-slate-300 pt-4 pb-2 text-center">
      <div 
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} 
        className="avoid-break avoid-break-strictly break-inside-avoid flex justify-center items-stretch w-full gap-4 flex-wrap sm:flex-nowrap mx-auto"
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
                flex: boxes.length === 1 ? '0 0 320px' : '1 1 0',
                margin: '0 auto',
                borderColor: borderCol,
                backgroundColor: bgCol,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start'
              }}
              className={`avoid-break avoid-break-strictly break-inside-avoid p-3.5 text-center rounded-xl border-2 shadow-sm relative min-w-[200px] max-w-[320px] box-border ${
                isPro ? 'ring-1 ring-emerald-400' : ''
              }`}
            >
              {isPro && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 rounded-t-xl" />
              )}
              
              {/* Contenedor centrado de firma e imagen de sello */}
              <div className="min-h-[60px] h-auto w-full text-center border-b border-dashed border-slate-300 pb-2 mb-2.5 flex items-center justify-center gap-2 mx-auto">
                {hasSig && (
                  <img
                    src={box.signatureUrl!}
                    alt="Firma"
                    className="max-h-[55px] w-auto max-w-[130px] object-contain mx-auto block"
                  />
                )}
                {hasStamp && (
                  <img
                    src={box.stampUrl!}
                    alt="Sello"
                    className="max-h-[55px] w-auto max-w-[110px] object-contain mx-auto block"
                  />
                )}
                {!hasSig && !hasStamp && (
                  <div className="h-[48px] w-full flex flex-col items-center justify-center border-b border-slate-400 border-dashed text-center">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none text-center">
                      Firma / Sello
                    </span>
                  </div>
                )}
              </div>

              {/* TÍTULO / RAMA PROFESIONAL EN CABECERA (CENTRADO) */}
              <p 
                style={{ color: textCol }} 
                className="m-0 font-black text-[11px] sm:text-xs uppercase tracking-tight leading-snug text-center w-full px-1"
              >
                {box.title}
              </p>

              {/* NOMBRE Y APELLIDO DEL FIRMANTE / PROFESIONAL (CENTRADO Y CLARO) */}
              <p 
                className="m-0 mt-1 font-extrabold text-[11px] sm:text-xs uppercase text-slate-900 tracking-tight leading-tight text-center w-full"
              >
                {box.subtitle}
              </p>

              {/* MATRÍCULA PROFESIONAL DESTACADA (CENTRADA) */}
              {isPro && box.license && (
                <div className="flex justify-center items-center w-full mt-2">
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    lineHeight: '1', 
                    padding: '4px 10px', 
                    backgroundColor: '#15803d', 
                    color: '#ffffff', 
                    borderRadius: '6px', 
                    fontWeight: 900, 
                    fontSize: '10px', 
                    letterSpacing: '0.06em', 
                    textTransform: 'uppercase' 
                  }}>
                    Mat. N° {box.license}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer de verificación QR centrado */}
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
    </div>
  );
}
