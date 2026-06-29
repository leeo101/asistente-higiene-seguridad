import React from 'react';
import { MessageSquare, Building2, MapPin, Calendar, User, Users, Briefcase, AlertCircle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

interface Attendee {
  id: string;
  nombre: string;
  dni: string;
  firma: boolean;
}

interface ToolboxTalkData {
  fecha: string;
  empresa: string;
  area: string;
  responsable: string;
  cargoResponsable: string;
  tema: string;
  desarrollo: string;
  observaciones: string;
  asistentes: Attendee[];
  operatorSignature?: string;
  signature?: string;
  supervisorSignature?: string;
  showSignatures?: {operator: boolean;professional: boolean;supervisor: boolean;};
}

interface ProfessionalData {
  name: string;
  license: string;
  signature: string | null;
  stamp: string | null;
}

interface Props {
  data: ToolboxTalkData;
  professional: ProfessionalData;
}

export default function ToolboxTalkPdfGenerator({ data, professional }: Props) {
  if (!data) return null;

  // Obtención segura de firma profesional desde localStorage
  let actSignature = (data as any).professionalSignature || (data as any).signature || (data as any).auditorSignature || null;
  let actStamp = (data as any).professionalStamp || null;
  let actName = (data as any).professionalName || (data as any).leadAuditor || (data as any).expositor || null;
  let actLic = (data as any).professionalLicense || (data as any).license || null;

  // Si no trae firmas directas, intentar heredar de localStorage (fallback global pro)
  if (!actSignature) {
    try {
      const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
      const lsStamp = typeof window !== 'undefined' ? localStorage.getItem('signatureStampData') : null;
      const legacySig = typeof window !== 'undefined' ? localStorage.getItem('capturedSignature') : null;

      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        actSignature = parsed.signature;
        actStamp = parsed.stamp;
      } else
      if (legacySig) {actSignature = legacySig;}

      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }


  const validAttendees = data.asistentes.filter((a) => a.nombre);
  const signedCount = data.asistentes.filter((a) => a.firma).length;

  // Fill empty rows to minimum 8
  const filledAttendees = [
  ...validAttendees,
  ...Array(Math.max(0, 8 - validAttendees.length)).fill({ id: '', nombre: '', dni: '', firma: false })].
  slice(0, 30);

  return (
    <div
      id="pdf-content"
      className="pdf-container print-area p-[12mm_15mm] font-family-[Helvetica,_Arial,_sans-serif] bg-[#ffffff] text-[#1e293b] w-[210mm] box-sizing-[border-box] relative border-top-[12px_solid_#0052CC] text-[9pt]">











      
            <style type="text/css" media="print">
                {`
                    @page { size: A4 portrait; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                    .no-print { display: none !important; }
                    .print-area {
                        box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                        width: 100% !important; max-width: none !important;
                        border-top: 12px solid #0052CC !important; border-radius: 0 !important;
                        min-height: auto !important; height: auto !important;
                    }
                `}
            </style>

            {/* Header Tripartito */}
            <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1.2rem] mb-[1.5rem] w-[100%]">
                <div className="flex-[1] text-left">
                    <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
                    <p className="m-[0] font-[900] text-[0.8rem] uppercase text-[#0052CC]">Doc. Inducción / Entrenamiento</p>
                </div>

                <div className="flex-[2] flex flex-col items-center justify-center text-center">
                    <h1 className="m-[0] font-[900] text-[2rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">CHARLA 5'</h1>
                    <div className="mt-[0.3rem] bg-[#0052CC] text-[white] p-[0.2rem_0.8rem] rounded-[12px] text-[0.6rem] font-[800] letter-spacing-[0.1em]">
                        REGISTRO DE SEGURIDAD — CHARLA DE 5 MINUTOS
                    </div>
                </div>

                <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
                    <CompanyLogo className="h-[38px] w-[auto] object-fit-[contain] max-w-[120px]" />
                </div>
            </div>

            {/* Tema + Metadatos */}
            <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1.2rem] w-[100%]">
                <div className="p-[0.9rem_1.2rem] bg-[#eff6ff] border-bottom-[1px_solid_#bfdbfe]">
                    <span className="text-[0.6rem] font-[800] text-[#0052CC] uppercase letter-spacing-[0.05em] flex items-center gap-[0.4rem]">
                        <MessageSquare size={13} /> TEMA DE LA CHARLA
                    </span>
                    <div className="font-[900] text-[1.25rem] text-[#0f172a] mt-[0.3rem]">{data.tema || '-'}</div>
                </div>

                <div className="grid grid-template-columns-[repeat(3,_1fr)] bg-[#ffffff]">
                    <div className="p-[0.7rem_1rem] border-right-[1px_solid_#e2e8f0]">
                        <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Calendar size={11} /> FECHA</span>
                        <div className="font-[700] text-[0.85rem] text-[#1e293b] mt-[0.15rem]">{data.fecha ? new Date(data.fecha + 'T12:00').toLocaleDateString('es-AR') : '-'}</div>
                    </div>
                    <div className="p-[0.7rem_1rem] border-right-[1px_solid_#e2e8f0]">
                        <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Building2 size={11} /> EMPRESA</span>
                        <div className="font-[700] text-[0.85rem] text-[#1e293b] mt-[0.15rem]">{data.empresa || '-'}</div>
                    </div>
                    <div className="p-[0.7rem_1rem]">
                        <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={11} /> ÁREA / SECTOR</span>
                        <div className="font-[700] text-[0.85rem] text-[#1e293b] mt-[0.15rem]">{data.area || '-'}</div>
                    </div>
                </div>
                <div className="grid grid-template-columns-[2fr_1fr_1fr] border-top-[1px_solid_#e2e8f0] bg-[#f8fafc]">
                    <div className="p-[0.7rem_1rem] border-right-[1px_solid_#e2e8f0]">
                        <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><User size={11} /> RESPONSABLE DE LA CHARLA</span>
                        <div className="font-[700] text-[0.85rem] text-[#1e293b] mt-[0.15rem]">{data.responsable || '-'}</div>
                    </div>
                    <div className="p-[0.7rem_1rem] border-right-[1px_solid_#e2e8f0]">
                        <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Briefcase size={11} /> CARGO</span>
                        <div className="font-[700] text-[0.85rem] text-[#1e293b] mt-[0.15rem]">{data.cargoResponsable || '-'}</div>
                    </div>
                    <div className="p-[0.7rem_1rem]">
                        <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Users size={11} /> ASISTENTES</span>
                        <div className="font-[900] text-[0.85rem] text-[#0052CC] mt-[0.15rem]">{validAttendees.length} personas | {signedCount} firmaron</div>
                    </div>
                </div>
            </div>

            {/* Desarrollo */}
            {data.desarrollo &&
      <div className="mb-[1rem] border-[1px_solid_#cbd5e1] rounded-[6px]">
                    <div className="p-[0.5rem_1rem] bg-[#f1f5f9] border-bottom-[1px_solid_#cbd5e1]">
                        <span className="text-[0.6rem] font-[900] text-[#334155] uppercase">DESARROLLO / PUNTOS TRATADOS</span>
                    </div>
                    <div className="p-[0.8rem_1rem] text-[0.8rem] text-[#334155] line-height-[1.6] white-space-[pre-wrap] bg-[#ffffff]">
                        {data.desarrollo}
                    </div>
                </div>
      }

            {/* Tabla de Asistentes */}
            <div className="mb-[1rem]">
                <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] text-[8pt]">
                    <thead>
                        <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid] bg-[#0052CC] text-[#ffffff]">
                            <th className="p-[0.5rem_0.4rem] w-[5%] text-center font-[800] border-[1px_solid_#003d99]">N°</th>
                            <th className="p-[0.5rem_0.8rem] w-[48%] text-left font-[800] border-[1px_solid_#003d99]">Nombre y Apellido</th>
                            <th className="p-[0.5rem_0.8rem] w-[22%] text-center font-[800] border-[1px_solid_#003d99]">DNI / CUIL</th>
                            <th className="p-[0.5rem_0.8rem] w-[25%] text-center font-[800] border-[1px_solid_#003d99]">Firma del Participante</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filledAttendees.map((att, idx) =>
            <tr className="avoid-break page-break-inside-[avoid]" key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                <td className="border-[1px_solid_#cbd5e1] p-[0.55rem_0.4rem] text-center text-[#94a3b8] font-[700]">{idx + 1}</td>
                                <td className="border-[1px_solid_#cbd5e1] p-[0.55rem_0.8rem] font-[700] text-[#1e293b]">{att.nombre}</td>
                                <td className="border-[1px_solid_#cbd5e1] p-[0.55rem_0.8rem] text-center text-[#334155]">{att.dni}</td>
                                <td className="border-[1px_solid_#cbd5e1] p-[0.9rem_0.8rem] text-center">
                                    {att.firma ? <span className="text-[#10b981] font-[900] text-[0.75rem]">✓ FIRMÓ</span> : ''}
                                </td>
                            </tr>
            )}
                    </tbody>
                </table>
            </div>

            {/* Observaciones */}
            {data.observaciones &&
      <div className="mb-[1rem] bg-[#fffbeb] border-[1px_solid_#fde68a] rounded-[6px]">
                    <div className="p-[0.5rem_1rem] bg-[#fef3c7] border-bottom-[1px_solid_#fde68a] flex items-center gap-[0.4rem]">
                        <AlertCircle size={13} color="#92400e" />
                        <span className="text-[0.6rem] font-[900] text-[#92400e] uppercase">OBSERVACIONES Y COMPROMISOS</span>
                    </div>
                    <div className="p-[0.8rem_1rem] text-[0.8rem] text-[#78350f] white-space-[pre-wrap] line-height-[1.5]">
                        {data.observaciones}
                    </div>
                </div>
      }

            {/* Firmas */}
            <PdfSignatures
        data={data}
        box1={(data as any).showSignatures?.operator ? {
          title: 'DELEGADO / OPERADOR',
          subtitle: 'En representación de asistentes',
          signatureUrl: (data as any).operatorSignature || null,
          isProfessional: false
        } : null}
        box2={(data as any).showSignatures?.professional ? {
          title: 'RESPONSABLE / EXPOSITOR',
          subtitle: (actName || 'Firma de Especialista').toUpperCase(),
          signatureUrl: (data as any).signature || actSignature || null,
          stampUrl: (data as any).professionalStamp || actStamp || null,
          isProfessional: true,
          license: (data as any).professionalLicense || actLic || null
        } : null}
        box3={(data as any).showSignatures?.supervisor ? {
          title: 'SUPERVISIÓN / VERIFICADOR',
          subtitle: 'Cierre / Control de Charla',
          signatureUrl: (data as any).supervisorSignature || null,
          isProfessional: false
        } : null} />
      

                <PdfBrandingFooter />
        </div>);

}