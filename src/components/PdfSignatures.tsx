import React from 'react';

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
      if (data && data[k]) return data[k];
    }
    return null;
  };

  let actSignature = getVal(['professionalSignature', 'signature', 'auditorSignature', 'evaluadorFirma']);
  let actStamp = getVal(['professionalStamp', 'stamp', 'sello', 'profesionalSello']);
  let actName = getVal(['professionalName', 'leadAuditor', 'expositor', 'evaluador', 'profesionalNombre']);
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

  if (!actTitle || actTitle === 'Técnico' || actTitle === 'PROFESIONAL') {
    actTitle = 'Técnico Universitario en Higiene y Seguridad Laboral';
  }

  const defaultBox1: SignatureBoxProps = {
    title: 'SOLICITANTE / OPERADOR',
    subtitle: 'Aclaración y Firma',
    signatureUrl: operatorSignature || null,
    isProfessional: false
  };

  const defaultBox2: SignatureBoxProps = {
    title: 'GERENCIA EHS / EMISOR',
    subtitle: (actName || 'Firma y Sello H&S').toUpperCase(),
    signatureUrl: actSignature,
    stampUrl: actStamp,
    isProfessional: true,
    license: actLic,
    profession: actTitle
  };

  const defaultBox3: SignatureBoxProps = {
    title: 'SUPERVISOR DE TRABAJO',
    subtitle: 'Aprobación / Autorización',
    signatureUrl: supervisorSignature,
    isProfessional: false
  };

  const boxes: SignatureBoxProps[] = [];
  const showOp = box1 !== undefined ? box1 !== null : data?.showSignatures?.operator !== false;
  const showPro = box2 !== undefined ? box2 !== null : data?.showSignatures?.professional !== false;
  const showSup = box3 !== undefined ? box3 !== null : data?.showSignatures?.supervisor !== false;

  if (showOp) {
    boxes.push(box1 || defaultBox1);
  }
  if (showPro) {
    const pBox = box2 || defaultBox2;
    boxes.push({
      ...pBox,
      title: (pBox.title || 'GERENCIA EHS / EMISOR').replace(' / INSTRUCTOR', '').replace(' / INSTRUCTORA', ''),
      profession: pBox.profession || actTitle
    });
  }
  if (showSup) {
    boxes.push(box3 || defaultBox3);
  }

  if (boxes.length === 0) return null;

  return (
    <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="pdf-signatures-wrapper avoid-break break-inside-avoid w-full block mt-4 border-t-2 border-slate-300 pt-4 pb-2 text-center">
      <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="avoid-break break-inside-avoid flex justify-center items-stretch w-full gap-4 flex-wrap sm:flex-nowrap">
        {boxes.map((box, idx) => {
          const isPro = box.isProfessional;
          const borderCol = isPro ? '#86efac' : '#cbd5e1';
          const bgCol = isPro ? '#f0fdf4' : '#f8fafc';
          const textCol = isPro ? '#14532d' : '#0f172a';
          const subTextCol = isPro ? '#15803d' : '#475569';
          const hasSig = typeof box.signatureUrl === 'string' && box.signatureUrl.trim().length > 5;
          const hasStamp = typeof box.stampUrl === 'string' && box.stampUrl.trim().length > 5;

          return (
            <div
              key={idx}
              style={{
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                flex: boxes.length === 1 ? '0 0 280px' : '1 1 0',
                margin: boxes.length === 1 ? '0 auto' : '0',
                borderColor: borderCol,
                backgroundColor: bgCol,
              }}
              className={`avoid-break break-inside-avoid p-3 text-center rounded-xl border-2 shadow-xs relative min-w-[190px] max-w-[280px] box-border ${
                isPro ? 'ring-1 ring-emerald-400' : ''
              }`}
            >
              {isPro && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-t-xl" />
              )}
              
              {/* Contenedor de firma e imagen de sello */}
              <div className="min-h-[55px] h-auto w-full text-center border-b border-dashed border-slate-300 pb-2 mb-2 flex items-center justify-center gap-2">
                {hasSig && (
                  <img
                    src={box.signatureUrl!}
                    alt="Firma"
                    className="max-h-[50px] w-auto max-w-[130px] object-contain"
                  />
                )}
                {hasStamp && (
                  <img
                    src={box.stampUrl!}
                    alt="Sello"
                    className="max-h-[50px] w-auto max-w-[110px] object-contain"
                  />
                )}
                {!hasSig && !hasStamp && (
                  <div className="h-[45px] w-full flex flex-col items-center justify-center border-b border-slate-400 border-dashed">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                      Firma / Sello
                    </span>
                  </div>
                )}
              </div>

              <p style={{ color: textCol }} className="m-0 font-black text-xs uppercase tracking-tight leading-tight">
                {box.title}
              </p>
              <p style={{ color: subTextCol }} className="m-0.5 font-bold text-[10px] leading-tight">
                {box.subtitle}
              </p>
              {isPro && (box.profession || actTitle) && (
                <p className="m-0 text-[9px] font-extrabold text-emerald-800 uppercase tracking-tight">
                  {box.profession || actTitle}
                </p>
              )}
              {box.license && (
                <div className="mt-1 inline-block px-2.5 py-0.5 bg-emerald-700 text-white rounded font-black text-[10px] tracking-wider uppercase shadow-xs">
                  Mat. N° {box.license}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer de verificación QR */}
      <div className="mt-3 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between px-2 avoid-break break-inside-avoid">
        <div className="flex items-center gap-2 text-left">
          <div className="w-8 h-8 bg-slate-100 border border-slate-300 rounded p-0.5 flex items-center justify-center shrink-0">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/v/${data?.id || 'doc'}` : 'https://asistentehs.web.app')}`}
              alt="QR Validación"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
              🔒 VERIFICACIÓN DIGITAL H&amp;S
            </div>
            <div className="text-[9px] text-slate-500 font-bold">
              Escaneá el código QR para validar la autenticidad del documento.
            </div>
          </div>
        </div>
        <div className="text-right text-[9px] text-slate-500 font-extrabold">
          DOCUMENTO AUDITADO · NORMA ISO 45001
        </div>
      </div>
    </div>
  );
}