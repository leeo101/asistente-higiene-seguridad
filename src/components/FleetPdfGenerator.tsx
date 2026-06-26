import React from 'react';
import { CarFront, ClipboardList, ShieldCheck } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function FleetPdfGenerator({ data, checklistItems }: {data: any;checklistItems: any[];}): React.ReactElement | null {
  if (!data) return null;

  const isApto = data.status === 'Apto';

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

                {/* Modern Gradient Header */}
                <div className="bg-[linear-gradient(135deg,_#0f172a_0%,_#1e293b_100%)] m-[-15mm_-15mm_15mm_-15mm] p-[15mm] text-[white] flex justify-space-between items-center border-bottom-[4px_solid_#38bdf8]">








          
                    <div className="flex items-center gap-[15px]">
                        <div className="bg-[rgba(56,_189,_248,_0.2)] p-[12px] rounded-[12px]">
                            <CarFront size={32} color="#38bdf8" />
                        </div>
                        <div>
                            <h1 className="m-[0] text-[1.8rem] font-[900] letter-spacing-[-0.5px]">INSPECCIÓN PRE-OPERACIONAL</h1>
                            <p className="m-[4px_0_0_0] text-[1rem] text-[#94a3b8] font-[600]">VEHÍCULOS Y FLOTA</p>
                        </div>
                    </div>
                    <div className="bg-[white] p-[10px] rounded-[8px]">
                        <CompanyLogo className="h-[50px] max-w-[150px] object-fit-[contain]" />
                    </div>
                </div>

                {/* Main Info */}
                <div style={{ border: `2px solid ${isApto ? '#16a34a' : '#dc2626'}` }} className="bg-[#f8fafc] p-[1.2rem] rounded-[12px] flex justify-space-between items-center mb-[1.5rem] box-shadow-[0_4px_6px_rgba(0,0,0,0.02)]">
                    <div>
                        <span className="text-[0.65rem] font-[900] text-[#64748b] block letter-spacing-[1px]">DOMINIO / PATENTE</span>
                        <h2 className="m-[4px_0] text-[1.8rem] font-[900] text-[#1e293b] uppercase">{data.plate || 'N/A'}</h2>
                        <span className="text-[0.9rem] font-[700] text-[#475569] flex items-center gap-[6px]">
                            <CarFront size={16} /> {data.vehicleType} | {data.brandModel}
                        </span>
                    </div>
                    <div className="text-right">
                        <span style={{ background: isApto ? '#dcfce7' : '#fee2e2', color: isApto ? '#15803d' : '#b91c1c', border: `2px solid ${isApto ? '#86efac' : '#fca5a5'}` }} className="p-[0.6rem_2rem] rounded-[30px] font-[900] text-[1.2rem] inline-block box-shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                            {data.status?.toUpperCase() || 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-template-columns-[repeat(4,_1fr)] gap-[1rem] mb-[2rem]">
                    <div className="bg-[#f1f5f9] p-[1rem] rounded-[10px] border-[1px_solid_#e2e8f0]">
                        <span className="text-[0.65rem] font-[800] block text-[#64748b] mb-[4px]">FECHA DE INSPECCIÓN</span>
                        <span className="font-[800] text-[#0f172a] text-[0.95rem]">{data.date ? new Date(data.date).toLocaleDateString('es-AR') : '-'}</span>
                    </div>
                    <div className="bg-[#f1f5f9] p-[1rem] rounded-[10px] border-[1px_solid_#e2e8f0]">
                        <span className="text-[0.65rem] font-[800] block text-[#64748b] mb-[4px]">KILOMETRAJE / HORÓMETRO</span>
                        <span className="font-[800] text-[#0f172a] text-[0.95rem]">{data.mileage || '-'}</span>
                    </div>
                    <div className="bg-[#f1f5f9] p-[1rem] rounded-[10px] border-[1px_solid_#e2e8f0]">
                        <span className="text-[0.65rem] font-[800] block text-[#64748b] mb-[4px]">CONDUCTOR ASIGNADO</span>
                        <span className="font-[800] text-[#0f172a] text-[0.95rem]">{data.driver || '-'}</span>
                    </div>
                    <div className="bg-[#f1f5f9] p-[1rem] rounded-[10px] border-[1px_solid_#e2e8f0]">
                        <span className="text-[0.65rem] font-[800] block text-[#64748b] mb-[4px]">INSPECTOR</span>
                        <span className="font-[800] text-[#0f172a] text-[0.95rem]">{data.inspector || 'Mismo conductor'}</span>
                    </div>
                </div>

                {/* Checklist Section */}
                <div className="mb-[2rem]">
                    <h3 className="m-[0_0_1rem_0] text-[1.1rem] font-[900] flex items-center gap-[0.5rem] border-bottom-[2px_solid_#e2e8f0] pb-[0.5rem] text-[#0f172a]">









            
                        <ClipboardList size={20} color="#38bdf8" /> PUNTOS DE INSPECCIÓN
                    </h3>
                    
                    <div className="grid grid-template-columns-[repeat(2,_1fr)] gap-[0.8rem] bg-[#f8fafc] p-[1rem] rounded-[12px] border-[1px_solid_#e2e8f0]">







            
                        {checklistItems.map((item, index) => {
              const val = data.checklist?.[item.id];
              const isOk = val === 'ok';
              const isFail = val === 'fail';

              let bgColor = '#f1f5f9';
              let icon = '-';
              let color = '#64748b';

              if (isOk) {
                bgColor = '#dcfce7';
                icon = '✓';
                color = '#16a34a';
              } else if (isFail) {
                bgColor = '#fee2e2';
                icon = '✗';
                color = '#dc2626';
              } else if (val === 'na') {
                bgColor = '#e2e8f0';
                icon = '-';
                color = '#64748b';
              }

              return (
                <div key={index} className="flex items-center justify-space-between bg-[white] p-[0.6rem_0.8rem] rounded-[8px] border-[1px_solid_#e2e8f0] box-shadow-[0_1px_2px_rgba(0,0,0,0.05)]">








                  
                                    <div className="pr-[10px]">
                                        <span className="font-[800] text-[#94a3b8] text-[0.65rem] block uppercase mb-[2px]">
                                            {item.category}
                                        </span>
                                        <span className="text-[0.8rem] font-[600] text-[#334155]">
                                            {item.label}
                                        </span>
                                    </div>
                                    <div style={{



                    background: bgColor,
                    color: color






                  }} className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center font-[900] text-[1rem] flex-shrink-[0]">
                                        {icon}
                                    </div>
                                </div>);

            })}
                    </div>
                </div>

                <div className="mb-[1.5rem] border-[1.5px_solid_#000] p-[0.8rem]">
                    <span className="text-[0.7rem] font-[900] block mb-[0.3rem]">OBSERVACIONES Y NOVEDADES</span>
                    <p className="m-[0] text-[0.85rem]">{data.observations || 'Sin novedades registradas.'}</p>
                </div>

                {/* Signatures */}
                <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator !== false ? {
            title: 'CONDUCTOR ASIGNADO',
            subtitle: (data.driver || 'Firma del Conductor').toUpperCase(),
            signatureUrl: data.driverSignature || data.signatures?.driver || null,
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
            title: 'INSPECTOR / CONTROL',
            subtitle: (data.inspector || 'Firma del Inspector').toUpperCase(),
            signatureUrl: data.supervisorSignature || data.signatures?.inspector || null,
            isProfessional: false
          } : null} />
        
            <PdfBrandingFooter />


            </div>
        </div>);

}