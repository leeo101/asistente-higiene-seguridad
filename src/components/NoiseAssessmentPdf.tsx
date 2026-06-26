import React from 'react';
import { AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

const TYPE_MAP = {
  personal: 'Dosimetría Personal',
  area: 'Medición de Área',
  peak: 'Ruido de Impacto',
  octave: 'Análisis Octavas'
};

export default function NoiseAssessmentPdf({ data }: {data: any;}): React.ReactElement | null {
  if (!data) return null;

  // Obtener firma profesional desde data o localStorage
  let actSignature: string | null = data?.professionalSignature || null;
  let actStamp: string | null = data?.professionalStamp || null;
  let actName: string | null = data?.professionalName || null;
  let actLic: string | null = data?.professionalLicense || data?.license || null;

  if (!actSignature) {
    try {
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');
      const lsPersonal = localStorage.getItem('personalData');
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        actSignature = parsed.signature;
        actStamp = parsed.stamp;
      } else
      if (legacySig) {
        actSignature = legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  const level = parseFloat(data.levels?.lavg || 0);
  const isCritical = level > 85;

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
                        <h1 className="m-[0] text-[1.6rem] font-[900]">PLANILLA DE MEDICIÓN DE RUIDO</h1>
                        <p className="m-[0] text-[0.9rem] font-[700] text-[#666]">CONFORME A RES. SRT 85/12</p>
                    </div>
                    <CompanyLogo className="h-[50px] max-w-[150px] object-fit-[contain]" />
                </div>

                {/* Main Results */}
                <div style={{ background: isCritical ? '#fff5f5' : '#f0fdf4' }} className="flex gap-[2rem] mb-[1.5rem] p-[1.5rem] border-[2px_solid_#000] rounded-[8px]">
                    <div className="flex-[1]">
                        <span className="text-[0.8rem] font-[900] text-[#666] block">NIVEL SONORO CONTINUO EQUIVALENTE (NSCE)</span>
                        <div style={{ color: isCritical ? '#c53030' : '#166534' }} className="text-[3rem] font-[900]">{level} dBA</div>
                    </div>
                    <div className="flex-[1] flex flex-col justify-center">
                         <div style={{ color: isCritical ? '#c53030' : '#166534' }} className="flex items-center gap-[0.5rem]">
                            {isCritical ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                            <span className="font-[900] text-[1.2rem]">{isCritical ? 'SUPERA LMPE' : 'CONFORME'}</span>
                         </div>
                         <p className="m-[0.5rem_0_0_0] text-[0.75rem]">* Límite Máximo Permitido para 8hs: 85 dBA</p>
                    </div>
                </div>

                {/* Location & Conditions */}
                <div className="grid grid-template-columns-[1fr_1fr] gap-[0] border-[1.5px_solid_#000] mb-[1.5rem]">
                    <div className="p-[0.5rem] border-right-[1.5px_solid_#000] border-bottom-[1px_solid_#000]">
                        <span className="text-[0.6rem] font-[900] block">TRABAJADOR / PUESTO</span>
                        <span className="font-[700]">{data.workerName || 'N/A'}</span>
                    </div>
                    <div className="p-[0.5rem] border-bottom-[1px_solid_#000]">
                        <span className="text-[0.6rem] font-[900] block">FECHA</span>
                        <span className="font-[700]">{data.date ? new Date(data.date).toLocaleDateString('es-AR') : 'N/A'}</span>
                    </div>
                    <div className="p-[0.5rem] border-right-[1.5px_solid_#000]">
                        <span className="text-[0.6rem] font-[900] block">UBICACIÓN / SECTOR</span>
                        <span className="font-[700]">{data.location || 'No especificada'}</span>
                    </div>
                    <div className="p-[0.5rem]">
                        <span className="text-[0.6rem] font-[900] block">RUIDO TIPO</span>
                        <span className="font-[700]">{TYPE_MAP[data.type] || 'Continuo'}</span>
                    </div>
                </div>

                {/* Equipment Check */}
                <div className="mb-[1.5rem] border-[1px_solid_#ddd] p-[0.8rem] rounded-[6px]">
                    <h4 className="m-[0_0_0.5rem_0] text-[0.8rem] font-[900] flex items-center gap-[0.5rem]">
                        <Activity size={16} /> DATOS DEL INSTRUMENTAL
                    </h4>
                    <div className="grid grid-template-columns-[1fr_1fr_1fr] gap-[1rem] text-[0.8rem]">
                        <div><span className="text-[#666]">Decibelímetro:</span> <strong>{data.equipment || 'No especificado'}</strong></div>
                        <div><span className="text-[#666]">Tarea Evaluada:</span> <strong>{data.task || 'N/A'}</strong></div>
                        <div><span className="text-[#666]">Duración:</span> <strong>{data.duration || '0'} hs</strong></div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="mb-[1.5rem] border-[1px_solid_#000] p-[0.8rem]">
                    <span className="text-[0.7rem] font-[900] block mb-[0.4rem]">OBSERVACIONES / MEDIDAS DE CONTROL</span>
                    <div className="text-[0.85rem]">{data.observations || 'Se recomienda el uso obligatorio de protección auditiva y realizar rotación de personal para limitar exposición.'}</div>
                </div>

                {/* Signatures */}
                <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator !== false ? {
            title: 'TRABAJADOR EVALUADO',
            subtitle: 'Firma y Aclaración',
            signatureUrl: data.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={data.showSignatures?.professional !== false ? {
            title: 'ESPECIALISTA H&S',
            subtitle: (actName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: actSignature || null,
            stampUrl: data.professionalStamp || actStamp || null,
            isProfessional: true,
            license: actLic || null
          } : null}
          box3={data.showSignatures?.supervisor !== false ? {
            title: 'RESPONSABLE / AUDITOR',
            subtitle: 'Aprobación / Autoridad',
            signatureUrl: data.supervisorSignature || data.signature || null,
            isProfessional: false
          } : null} />
        
            <PdfBrandingFooter />
        </div>
                </div>);

}