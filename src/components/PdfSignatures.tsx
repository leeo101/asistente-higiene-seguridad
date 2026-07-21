import React from 'react';

export interface SignatureBoxProps {
  title: string;
  subtitle?: string;
  signatureUrl?: string | null;
  stampUrl?: string | null;
  isProfessional?: boolean;
  license?: string | null;
  customContent?: React.ReactNode;
}

export interface PdfSignaturesProps {
  data: any;
  box1?: SignatureBoxProps | null;
  box2?: SignatureBoxProps | null;
  box3?: SignatureBoxProps | null;
}

export default function PdfSignatures({ data, box1, box2, box3 }: PdfSignaturesProps) {
  // Helper to safely get nested values or fallbacks
  const getVal = (keys: string[]) => {
    for (const k of keys) {
      if (data && data[k]) return data[k];
    }
    return null;
  };

  // Auto-detect professional signature and stamp
  let actSignature = getVal(['professionalSignature', 'signature', 'auditorSignature', 'evaluadorFirma']);
  let actStamp = getVal(['professionalStamp', 'stamp', 'sello', 'profesionalSello']);
  let actName = getVal(['professionalName', 'leadAuditor', 'expositor', 'evaluador', 'profesionalNombre']);
  let actLic = getVal(['professionalLicense', 'license', 'matricula', 'profesionalMatricula']);
  let supervisorSignature = getVal(['capatazSignature', 'supervisorSignature', 'responsableFirma']);

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

  let operatorSignature = getVal(['operatorSignature', 'operadorFirma']);

  if (!actName || !actLic) {
    try {
      const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  const defaultBox1: SignatureBoxProps = {
    title: 'OPERADOR / RESPONSABLE',
    subtitle: 'Aclaración y Firma',
    signatureUrl: operatorSignature || null,
    isProfessional: false
  };

  const defaultBox2: SignatureBoxProps = {
    title: 'PROFESIONAL ACTUANTE',
    subtitle: (actName || 'Firma y Sello').toUpperCase(),
    signatureUrl: actSignature,
    stampUrl: actStamp,
    isProfessional: true,
    license: actLic
  };

  const defaultBox3: SignatureBoxProps = {
    title: 'SUPERVISIÓN / CIERRE',
    subtitle: 'Sello y Firma receptora',
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
    boxes.push(box2 || defaultBox2);
  }
  if (showSup) {
    boxes.push(box3 || defaultBox3);
  }

  if (boxes.length === 0) return null;

    return (
    <div className="avoid-break w-[100%] page-break-inside-[avoid] break-inside-[avoid] block mt-[0.5rem] border-top-[2px_dashed_#cbd5e1] pt-[1rem] pb-[1rem] text-center">









      
            <div className="flex justify-center items-start w-[100%] gap-[1rem]">





        
                {boxes.map((box, idx) => {
          const isPro = box.isProfessional;
          const borderCol = isPro ? '#bbf7d0' : '#e2e8f0';
          const bgCol = isPro ? '#f0fdf4' : '#f8fafc';
          const textCol = isPro ? '#166534' : '#334155';
          const subTextCol = isPro ? '#15803d' : '#64748b';
          const lineCol = isPro ? '#86efac' : '#cbd5e1';

          return (
            <div key={idx} style={{
              flex: boxes.length === 1 ? '0 0 280px' : '1 1 0',
              margin: boxes.length === 1 ? '0 auto' : '0',
              border: `1px solid ${borderCol}`,
              background: bgCol,
              boxShadow: isPro 
                ? '0 4px 12px -2px rgba(16,185,129,0.08), 0 2px 4px -1px rgba(16,185,129,0.03)'
                : '0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -1px rgba(0,0,0,0.02)',
              borderRadius: isPro ? '12px' : '8px',
              position: 'relative',
              overflow: 'hidden'
            }} className="p-[1rem] text-center min-width-[220px] max-w-[280px] box-sizing-[border-box]">
                            {isPro && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: '#10b981'
                                }} />
                            )}
                            {/* Signature / Stamp image row */}
                                    <div style={{
                                        borderBottom: `1px dashed ${lineCol}`
                                    }} className="min-h-[65px] h-[auto] w-[100%] text-center pb-[0.6rem] mb-[0.6rem] box-sizing-[border-box] overflow-[hidden] flex justify-center items-center">
                                        {box.signatureUrl && box.signatureUrl.length > 20 &&
                                            <img
                                              src={box.signatureUrl}
                                              alt="Firma"
                                              style={{
                                                maxWidth: box.stampUrl && box.stampUrl.length > 20 ? '48%' : '100%',
                                                objectPosition: 'center',
                                                objectFit: 'contain'
                                              }} className="h-[48px] w-[auto]" />
                                        }
                                        {box.stampUrl && box.stampUrl.length > 20 &&
                                            <img
                                              src={box.stampUrl}
                                              alt="Sello"
                                              style={{
                                                maxWidth: box.signatureUrl && box.signatureUrl.length > 20 ? '48%' : '100%',
                                                objectPosition: 'center',
                                                objectFit: 'contain'
                                              }} className="h-[48px] w-[auto]" />
                                        }
                                        {(!box.signatureUrl || box.signatureUrl.length <= 20) && (!box.stampUrl || box.stampUrl.length <= 20) &&
                                            <div className="h-[60px] w-[100%] flex items-center justify-center text-[0.55rem] text-slate-300 font-bold uppercase tracking-widest">
                                                Firma Pendiente
                                            </div>
                                        }
                                    </div>
                                    <p style={{ color: textCol, letterSpacing: '0.02em' }} className="m-[0] font-[800] text-[0.72rem] uppercase word-break-[break-word] overflow-wrap-[break-word] line-height-[1.2]">{box.title}</p>
                                    <p style={{ color: subTextCol, fontWeight: isPro ? 700 : 500 }} className="m-[4px_0_0_0] text-[0.62rem] word-break-[break-word] overflow-wrap-[break-word] line-height-[1.2]">{box.subtitle}</p>
                                    {box.license &&
                                        <p className="m-[4px_0_0_0] text-[0.58rem] text-[#16a34a] font-bold word-break-[break-word] tracking-wide">Mat. N° {box.license}</p>
                                    }
                                    {box.customContent}
                                </div>);

        })}
            </div>
        </div>);

}