import React from 'react';
import { permitTypes } from '../data/workPermits';
import { ShieldCheck, Users } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function WorkPermitPdfGenerator({ data, id = "pdf-content" }: {data: any;id?: string;}): React.ReactElement | null {
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

  const selectedTypeLabel = permitTypes.find((t) => t.id === data.tipoPermiso)?.label || 'Permiso de Trabajo';

  // Ensure all arrays exist
  const checklist = data.checklist || [];
  const personal = data.personal || [];

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id={id}
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm] bg-[#ffffff] text-[#000000] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[10pt] font-family-[system-ui,_-apple-system,_sans-serif]">







        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area { 
                            box-shadow: none !important; 
                            margin: 0 !important; 
                            padding: 5mm !important; 
                            width: 100% !important; 
                            max-width: none !important; 
                            border: none !important;
                            border-radius: 0 !important; 
                        }
                        .company-logo {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    `}
                </style>

                {/* Header */}
                <div className="flex justify-space-between items-center border-bottom-[3px_solid_#333] pb-[1rem] mb-[2rem]">
                    <div>
                        <h1 className="m-[0] text-[1.8rem] font-[900] text-[#1e293b]">PERMISO DE TRABAJO</h1>
                        <p className="m-[0] text-[1.1rem] font-[700] text-[#666]">{selectedTypeLabel.toUpperCase()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-[0.5rem]">
                        <CompanyLogo className="h-[45px] w-[auto] object-fit-[contain] max-w-[140px]" />






            
                        <div className="text-right">
                            <div className="text-[0.75rem] font-[800] text-[#64748b]">SISTEMA DE GESTIÓN HYS</div>
                            <div className="flex items-center justify-end gap-[5px]">
                                <span className="text-[1.2rem] font-[900] text-[#1e293b]">N°</span>
                                <span className="text-[1.2rem] font-[900] text-[#1e293b]">{data.numeroPermiso || 'S/N'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Grid */}
                <div className="border-[2px_solid_#ddd] rounded-[10px] mb-[2rem] page-break-inside-[avoid]">
                    <div className="grid grid-template-columns-[1fr_1fr] border-bottom-[2px_solid_#ddd]">
                        <div className="p-[0.8rem] flex flex-col gap-[4px]">
                            <span className="text-[0.65rem] font-[900] text-[#64748b] uppercase">CLIENTE / EMPRESA</span>
                            <span className="font-[800] text-[0.95rem]">{data.empresa}</span>
                        </div>
                        <div className="p-[0.8rem] border-left-[2px_solid_#ddd] flex flex-col gap-[4px]">
                            <span className="text-[0.65rem] font-[900] text-[#64748b] uppercase">OBRA / UBICACIÓN</span>
                            <span className="font-[800] text-[0.95rem]">{data.obra}</span>
                        </div>
                    </div>
                    <div className="grid grid-template-columns-[1fr_1fr_1fr_1fr]">
                        <div className="p-[0.8rem] flex flex-col gap-[4px]">
                            <span className="text-[0.65rem] font-[900] text-[#64748b] uppercase">FECHA</span>
                            <span className="font-[800] text-[0.95rem]">{new Date(data.fecha).toLocaleDateString('es-AR')}</span>
                        </div>
                        <div className="p-[0.8rem] border-left-[2px_solid_#ddd] flex flex-col gap-[4px]">
                            <span className="text-[0.65rem] font-[900] text-[#64748b] uppercase">HORA INICIO</span>
                            <span className="font-[800] text-[0.95rem]">{data.validezDesde}</span>
                        </div>
                        <div className="p-[0.8rem] border-left-[2px_solid_#ddd] flex flex-col gap-[4px]">
                            <span className="text-[0.65rem] font-[900] text-[#64748b] uppercase">HORA FIN</span>
                            <span className="font-[800] text-[0.95rem]">{data.validezHasta}</span>
                        </div>
                        <div className="p-[0.8rem] border-left-[2px_solid_#ddd] flex flex-col gap-[4px]">
                            <span className="text-[0.65rem] font-[900] text-[#64748b] uppercase">TIPO DE TRABAJO</span>
                            <span className="font-[800] text-[0.95rem]">{selectedTypeLabel}</span>
                        </div>
                    </div>
                </div>

                {/* Checklist Section */}
                {checklist.length > 0 &&
        <div className="mb-[2rem]">
                        <h3 className="text-[1rem] font-[900] m-[0_0_1rem_0] text-[#1e293b] flex items-center gap-[0.5rem]">
                            <ShieldCheck size={20} /> VERIFICACIÓN PREVENTIVA (CHECKLIST)
                        </h3>
                        <div className="border-[1px_solid_#eee] rounded-[10px]">
                            <div className="grid grid-template-columns-[2.5fr_80px_1.5fr] bg-[#f8fafc] p-[0.6rem_1rem] border-bottom-[2px_solid_#ddd] font-[800] text-[0.75rem] text-[#64748b]">
                                <div>PREGUNTA / ITEM</div>
                                <div className="text-center">ESTADO</div>
                                <div>OBSERVACIONES</div>
                            </div>
                            {checklist.map((item: any, idx: number) =>
            <div key={item.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }} className="grid grid-template-columns-[2.5fr_80px_1.5fr] gap-[1rem] items-center p-[0.8rem_1rem] border-bottom-[1px_solid_#f1f5f9] page-break-inside-[avoid]">
                                    <div className="font-[600] text-[0.85rem] text-[#334155] white-space-[pre-wrap] word-break-[break-word] overflow-wrap-[anywhere]">{item.pregunta}</div>
                                    <div className="flex gap-[4px] flex-shrink-[0] justify-center">
                                        {['SI', 'NO'].map((label) => {
                  const isSelected = label === 'SI' && (item.estado === 'Cumple' || item.estado === 'SI') ||
                  label === 'NO' && (item.estado === 'No Cumple' || item.estado === 'NO');

                  return (
                    <div key={label} style={{


                      border: isSelected ? '2.5px solid #000' : '1px solid #94a3b8',





                      fontWeight: isSelected ? 900 : 400,
                      color: isSelected ? label === 'SI' ? '#166534' : '#dc2626' : '#94a3b8',
                      background: isSelected ? label === 'SI' ? '#f0fdf4' : '#fef2f2' : 'transparent'
                    }} className="w-[35px] h-[24px] rounded-[4px] flex items-center justify-center text-[0.9rem]">
                                                    {isSelected ? label === 'SI' ? '✓' : '✗' : ''}
                                                    <span style={{ opacity: isSelected ? 1 : 0.6 }} className="text-[0.5rem] ml-[2px]">{label}</span>
                                                </div>);

                })}
                                    </div>
                                    <div className="text-[0.8rem] text-[#64748b] white-space-[pre-wrap] word-break-[break-word] overflow-wrap-[anywhere]">{item.observaciones || '-'}</div>
                                </div>
            )}
                        </div>
                    </div>
        }

                {/* Personnel Section */}
                {checklist.length > 0 && personal.length > 0 &&
        <div className="mb-[2rem]">
                        <h3 className="text-[1rem] font-[900] m-[0_0_1rem_0] text-[#1e293b] flex items-center gap-[0.5rem]">
                            <Users size={20} /> PERSONAL AUTORIZADO
                        </h3>
                        <div className="border-[1px_solid_#ddd] rounded-[10px]">
                            <div className="grid grid-template-columns-[2fr_1fr_1fr] bg-[#f8fafc] p-[0.6rem_1rem] border-bottom-[2px_solid_#ddd] font-[800] text-[0.75rem] text-[#64748b]">
                                <div>NOMBRE Y APELLIDO</div>
                                <div>DNI</div>
                                <div>FIRMA</div>
                            </div>
                            {personal.map((p: any) =>
            <div key={p.id} className="grid grid-template-columns-[2fr_1fr_1fr] gap-[1rem] p-[1rem] border-bottom-[1px_solid_#f1f5f9] page-break-inside-[avoid]">
                                    <div className="font-[600] text-[0.9rem] text-[#334155]">{p.nombre}</div>
                                    <div className="text-[0.9rem] text-[#64748b]">{p.dni}</div>
                                    <div className="flex items-center">
                                        <div className="w-[100%] h-[1px] bg-[#cbd5e1]"></div>
                                    </div>
                                </div>
            )}
                        </div>
                    </div>
        }

                {/* Firmas */}
                <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator !== false ? {
            title: 'SOLICITANTE / OPERADOR',
            subtitle: 'Aclaración y Firma',
            signatureUrl: data.operatorSignature || data.firmas?.solicitante?.sign || null,
            isProfessional: false
          } : null}
          box2={data.showSignatures?.professional !== false ? {
            title: 'GERENCIA EHS / EMISOR',
            subtitle: (actName || 'Firma y Sello H&S').toUpperCase(),
            signatureUrl: actSignature || data.professionalSignature || data.firmas?.ehs?.sign || null,
            stampUrl: data.professionalStamp || actStamp || null,
            isProfessional: true,
            license: actLic || null
          } : null}
          box3={data.showSignatures?.supervisor !== false ? {
            title: 'SUPERVISOR DE TRABAJO',
            subtitle: 'Aprobación / Autorización',
            signatureUrl: data.supervisorSignature || data.firmas?.supervisor?.sign || null,
            isProfessional: false
          } : null} />
        

                <PdfBrandingFooter />
            </div>
        </div>);

}