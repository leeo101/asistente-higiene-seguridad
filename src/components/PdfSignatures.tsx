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
        } catch(e) {}
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
        } catch(e) {}
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
    const showOp = box1 !== undefined ? (box1 !== null) : (data?.showSignatures?.operator !== false);
    const showPro = box2 !== undefined ? (box2 !== null) : (data?.showSignatures?.professional !== false);
    const showSup = box3 !== undefined ? (box3 !== null) : (data?.showSignatures?.supervisor !== false);

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
        <div className="avoid-break" style={{
            width: '100%',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            display: 'block',
            marginTop: '1.5rem',
            borderTop: '2px dashed #cbd5e1',
            paddingTop: '1.5rem',
            paddingBottom: '1rem',
            overflowX: 'auto'
        }}>
            <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end', // Alinear a la derecha
                width: '100%'
            }}>
                {boxes.map((box, idx) => {
                    const isPro = box.isProfessional;
                    const borderCol = isPro ? '#bbf7d0' : '#e2e8f0';
                    const bgCol = isPro ? '#f0fdf4' : '#f8fafc';
                    const textCol = isPro ? '#166534' : '#334155';
                    const subTextCol = isPro ? '#15803d' : '#64748b';
                    const lineCol = isPro ? '#86efac' : '#cbd5e1';

                    return (
                        <div key={idx} style={{
                            border: `1px solid ${borderCol}`,
                            background: bgCol,
                            borderRadius: '6px',
                            padding: '0.8rem',
                            textAlign: 'center',
                            flex: '0 0 calc(33.333% - 0.66rem)', // Exactamente el mismo tamaño que si hubieran 3
                            maxWidth: '280px', // Evitar que crezca demasiado en pantallas/hojas grandes
                            boxSizing: 'border-box'
                        }}>
                            {/* Signature / Stamp image row */}
                                    <div style={{
                                        minHeight: '60px',
                                        height: 'auto',
                                        width: '100%',
                                        display: 'block',
                                        textAlign: 'center',
                                        borderBottom: `1px solid ${lineCol}`,
                                        paddingBottom: '0.5rem',
                                        marginBottom: '0.5rem',
                                        boxSizing: 'border-box',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {box.signatureUrl && box.signatureUrl.length > 500 && (
                                            <img
                                                src={box.signatureUrl}
                                                alt="Firma"
                                                style={{
                                                    height: '45px',
                                                    width: 'auto',
                                                    maxWidth: (box.stampUrl && box.stampUrl.length > 500) ? '48%' : '100%',
                                                    objectFit: 'contain',
                                                    background: 'transparent',
                                                    margin: '0 4px',
                                                    display: 'inline-block',
                                                    verticalAlign: 'bottom',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        )}
                                        {box.stampUrl && box.stampUrl.length > 500 && (
                                            <img
                                                src={box.stampUrl}
                                                alt="Sello"
                                                style={{
                                                    height: '45px',
                                                    width: 'auto',
                                                    maxWidth: (box.signatureUrl && box.signatureUrl.length > 500) ? '48%' : '100%',
                                                    objectFit: 'contain',
                                                    background: 'transparent',
                                                    margin: '0 4px',
                                                    display: 'inline-block',
                                                    verticalAlign: 'bottom',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        )}
                                        {!box.signatureUrl && !box.stampUrl && (
                                            <div style={{ height: '60px', width: '100%' }}></div>
                                        )}
                                    </div>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.7rem', color: textCol, textTransform: 'uppercase', wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: 1.2 }}>{box.title}</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.6rem', color: subTextCol, fontWeight: isPro ? 600 : 400, wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: 1.2 }}>{box.subtitle}</p>
                                    {box.license && (
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.55rem', color: '#16a34a', wordBreak: 'break-word' }}>Mat.: {box.license}</p>
                                    )}
                                    {box.customContent}
                                </div>
                            );
                        })}
            </div>
        </div>
    );
}
