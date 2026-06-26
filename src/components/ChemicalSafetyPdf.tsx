import React from 'react';
import { ShieldCheck } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

const GHS_CONFIG = {
  explosive: { icon: '🧨', name: 'Explosivo' },
  flammable: { icon: '🔥', name: 'Inflamable' },
  oxidizing: { icon: '🔥', name: 'Comburente' },
  corrosive: { icon: '🧪', name: 'Corrosivo' },
  toxic: { icon: '💀', name: 'Tóxico' },
  harmful: { icon: '⚠️', name: 'Nocivo' },
  irritant: { icon: '⚠️', name: 'Irritante' },
  sensitizing: { icon: '🫁', name: 'Sensibilizante' },
  carcinogenic: { icon: '🫁', name: 'Carcinógeno' },
  environmental: { icon: '🌊', name: 'Ambiente' },
  pressure: { icon: '📦', name: 'Gas a Presión' }
};

export default function ChemicalSafetyPdf({ data }: {data: any;}): React.ReactElement | null {
  if (!data) return null;

  const formatFirstAid = (fa) => {
    if (!fa) return 'Sin especificar.';
    if (typeof fa === 'string') return fa;
    const parts = [];
    if (fa.inhalation) parts.push(`INHALACIÓN: ${fa.inhalation}`);
    if (fa.skin) parts.push(`PIEL: ${fa.skin}`);
    if (fa.eyes) parts.push(`OJOS: ${fa.eyes}`);
    if (fa.ingestion) parts.push(`INGESTIÓN: ${fa.ingestion}`);
    return parts.length > 0 ? parts.join(' | ') : 'Sin especificar.';
  };

  const formatPhrases = (phrases) => {
    if (!phrases) return 'Sin especificar.';
    if (Array.isArray(phrases)) return phrases.join(', ');
    return phrases;
  };

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm] bg-[#ffffff] text-[#000000] box-sizing-[border-box] m-[0_auto] text-[10pt] font-family-[system-ui,_-apple-system,_sans-serif]">






        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area { box-shadow: none !important; margin: 0 !important; padding: 5mm !important; width: 100% !important; max-width: none !important; border: none !important; border-radius: 0 !important; min-height: auto !important; height: auto !important; }
                    `}
                </style>

                {/* Header */}
                <div className="flex justify-space-between items-center border-bottom-[3px_solid_#333] pb-[1rem] mb-[1.5rem]">
                    <div>
                        <h1 className="m-[0] text-[1.6rem] font-[900]">FICHA DE SEGURIDAD (SGA)</h1>
                        <p className="m-[0] text-[0.9rem] font-[700] text-[#666]">SISTEMA GLOBALMENTE ARMONIZADO - LEY 19.587</p>
                    </div>
                    <CompanyLogo className="h-[50px] max-w-[150px] object-fit-[contain]" />
                </div>

                {/* Product Name Card */}
                <div className="bg-[#f8fafc] p-[1.5rem] border-[2px_solid_#000] rounded-[8px] flex gap-[2rem] mb-[1.5rem]">
                    <div className="flex-[1]">
                        <span className="text-[0.7rem] font-[900] text-[#475569] block">PRODUCTO / NOMBRE COMERCIAL</span>
                        <h2 className="m-[0] text-[1.8rem] font-[900] text-[#1e293b]">{data.name || 'N/A'}</h2>
                        <span className="block mt-[0.5rem] font-[700]">CAS N°: {data.casNumber || 'N/A'}</span>
                    </div>
                    {data.pictograms?.length > 0 &&
          <div className="flex gap-[4px] items-center">
                            {data.pictograms.map((p, i) =>
            <div key={i} title={GHS_CONFIG[p]?.name} className="border-[2px_solid_#de1c1c] w-[50px] h-[50px] flex items-center justify-center text-[2.2rem] transform-[rotate(0deg)] bg-[#fff]">
                                    {GHS_CONFIG[p]?.icon || '⚠️'}
                                </div>
            )}
                        </div>
          }
                </div>

                {/* Information Grid */}
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[1.5rem]">
                    <div className="border-[1px_solid_#ddd] p-[0.8rem] rounded-[6px]">
                        <span className="text-[0.65rem] font-[900] text-[#64748b] block">PROVEEDOR</span>
                        <div className="font-[700]">{data.supplier || 'No especificado'}</div>
                    </div>
                    <div className="border-[1px_solid_#ddd] p-[0.8rem] rounded-[6px]">
                        <span className="text-[0.65rem] font-[900] text-[#64748b] block">STOCK / CANTIDAD</span>
                        <div className="font-[700]">{data.quantity || '0'} {data.unit || ''}</div>
                    </div>
                    <div className="border-[1px_solid_#ddd] p-[0.8rem] rounded-[6px]">
                        <span className="text-[0.65rem] font-[900] text-[#64748b] block">UBICACIÓN EN PLANTA</span>
                        <div className="font-[700]">{data.location || 'Sin especificar'}</div>
                    </div>
                    <div className="border-[1px_solid_#ddd] p-[0.8rem] rounded-[6px]">
                        <span className="text-[0.65rem] font-[900] text-[#64748b] block">FECHA DE CREACIÓN</span>
                        <div className="font-[700]">{data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : 'N/A'}</div>
                    </div>
                </div>

                {/* Hazards & Precautionary */}
                <div className="border-[1.5px_solid_#000] mb-[1.5rem]">
                    <div className="p-[0.6rem] bg-[#dc2626] text-[#fff] font-[900] text-[0.8rem] text-center">
                        INDICACIONES DE PELIGRO (FRASES H) Y CONSEJOS DE PRUDENCIA (FRASES P)
                    </div>
                    <div className="p-[1rem]">
                        <div className="mb-[1rem]">
                             <span className="font-[900] text-[0.75rem] block text-[#991b1b]">⚠️ INDICACIONES DE PELIGRO:</span>
                             <p className="m-[0.2rem_0_0_0] text-[0.85rem]">{formatPhrases(data.riskPhrases || data.hazardStatements)}</p>
                        </div>
                        <div>
                             <span className="font-[900] text-[0.75rem] block text-[#111827]">🛡️ CONSEJOS DE PRUDENCIA:</span>
                             <p className="m-[0.2rem_0_0_0] text-[0.85rem]">{formatPhrases(data.safetyPhrases || data.precautionaryStatements)}</p>
                        </div>
                    </div>
                </div>

                {/* First Aid */}
                <div className="border-[1px_solid_#16a34a] bg-[#f0fdf4] rounded-[8px] p-[1rem] mb-[1.5rem]">
                    <h3 className="m-[0_0_0.5rem_0] text-[0.9rem] font-[900] text-[#166534] flex items-center gap-[0.5rem]">
                        <ShieldCheck size={18} /> PRIMEROS AUXILIOS
                    </h3>
                    <p className="m-[0] text-[0.85rem] line-height-[1.4]">{formatFirstAid(data.firstAid)}</p>
                </div>

                {/* Signatures */}
                <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator !== false ? {
            title: 'PERSONAL AFECTADO',
            subtitle: 'Firma y Aclaración',
            signatureUrl: data.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={data.showSignatures?.professional !== false ? {
            title: 'PROFESIONAL H&S',
            subtitle: (data.professionalName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: data.professionalSignature || null,
            stampUrl: data.professionalStamp || null,
            isProfessional: true,
            license: data.professionalLicense || null
          } : null}
          box3={data.showSignatures?.supervisor !== false ? {
            title: 'SUPERVISIÓN / CIERRE',
            subtitle: 'Sello y Firma receptora',
            signatureUrl: data.supervisorSignature || data.signature || null,
            isProfessional: false
          } : null} />
        
            <PdfBrandingFooter />

                <div className="mt-[1.5rem] text-[0.6rem] text-[#666] text-center">
                    DOCUMENTO OBLIGATORIO SEGÚN RES. SRT 801/15 (SGA). DEBE ESTAR DISPONIBLE EN EL ÁREA DE TRABAJO.
                </div>
            </div>
        </div>);

}