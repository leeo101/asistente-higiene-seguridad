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
    <div className="avoid-break w-[100%] page-break-inside-[avoid] break-inside-[avoid] block mt-[1.5rem] border-top-[2px_dashed_#cbd5e1] pt-[1.5rem] pb-[1rem] text-center">









      
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
              background: bgCol






            }} className="rounded-[6px] p-[0.8rem] text-center min-width-[220px] max-w-[280px] box-sizing-[border-box]">
                            {/* Signature / Stamp image row */}
                                    <div style={{




                borderBottom: `1px solid ${lineCol}`







              }} className="min-h-[60px] h-[auto] w-[100%] text-center pb-[0.5rem] mb-[0.5rem] box-sizing-[border-box] overflow-[hidden] flex justify-center items-center">
                                        {box.signatureUrl && box.signatureUrl.length > 20 &&
                <img
                  src={box.signatureUrl}
                  alt="Firma"
                  style={{
                    maxWidth: box.stampUrl && box.stampUrl.length > 20 ? '48%' : '100%',
                    objectPosition: 'center',
                    objectFit: 'contain'
                  }} className="h-[45px] w-[auto]" />
                }
                                        {box.stampUrl && box.stampUrl.length > 20 &&
                <img
                  src={box.stampUrl}
                  alt="Sello"
                  style={{
                    maxWidth: box.signatureUrl && box.signatureUrl.length > 20 ? '48%' : '100%',
                    objectPosition: 'center',
                    objectFit: 'contain'
                  }} className="h-[45px] w-[auto]" />
                }
                                        {(!box.signatureUrl || box.signatureUrl.length <= 20) && (!box.stampUrl || box.stampUrl.length <= 20) &&
                <div className="h-[60px] w-[100%]"></div>
                }
                                    </div>
                                    <p style={{ color: textCol }} className="m-[0] font-[700] text-[0.7rem] uppercase word-break-[break-word] overflow-wrap-[break-word] line-height-[1.2]">{box.title}</p>
                                    <p style={{ color: subTextCol, fontWeight: isPro ? 600 : 400 }} className="m-[4px_0_0_0] text-[0.6rem] word-break-[break-word] overflow-wrap-[break-word] line-height-[1.2]">{box.subtitle}</p>
                                    {box.license &&
              <p className="m-[4px_0_0_0] text-[0.55rem] text-[#16a34a] word-break-[break-word]">Mat.: {box.license}</p>
              }
                                    {box.customContent}
                                </div>);

        })}
            </div>
        </div>);

}