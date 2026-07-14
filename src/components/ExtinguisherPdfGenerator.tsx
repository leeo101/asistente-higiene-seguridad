import React, { useRef } from 'react';
import { Calendar, Flame, MapPin } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

const getStatus = (dueDateStr: string) => {
  if (!dueDateStr) return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
  try {
    const d = new Date(dueDateStr + 'T12:00:00Z');
    if (isNaN(d.getTime())) return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
    const base = d.toLocaleDateString('es-AR');
    d.setFullYear(d.getFullYear() + 1);
    const today = new Date();
    const diffDays = Math.ceil(((d as any) - (today as any)) / (1000 * 60 * 60 * 24));
    const formattedDate = d.toLocaleDateString('es-AR');

    if (diffDays < 0) return { text: 'Vencido', color: '#dc2626', vto: formattedDate, base };
    if (diffDays <= 30) return { text: 'Próximo', color: '#d97706', vto: formattedDate, base };
    return { text: 'Vigente', color: '#166534', vto: formattedDate, base };
  } catch (e) {
    return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
  }
};

const getPHStatus = (dueDateStr: string) => {
  if (!dueDateStr) return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
  try {
    const d = new Date(dueDateStr + 'T12:00:00Z');
    if (isNaN(d.getTime())) return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
    const base = d.toLocaleDateString('es-AR');
    d.setFullYear(d.getFullYear() + 5);

    const today = new Date();
    const diffDays = Math.ceil(((d as any) - (today as any)) / (1000 * 60 * 60 * 24));
    const formattedDate = d.toLocaleDateString('es-AR');

    if (diffDays < 0) return { text: 'Vencido', color: '#dc2626', vto: formattedDate, base };
    if (diffDays <= 30) return { text: 'Próximo', color: '#d97706', vto: formattedDate, base };
    return { text: 'Vigente', color: '#166534', vto: formattedDate, base };
  } catch (e) {
    return { text: 'Sin Dato', color: '#64748b', vto: '-', base: '-' };
  }
};

const formatType = (tipo: string) => {
  if (!tipo) return 'N/A';
  return tipo;
};

export default function ExtinguisherPdfGenerator({ extinguishers, showSignatures, globalSignatures }: {extinguishers: any[];showSignatures?: {operator: boolean;professional: boolean;supervisor: boolean;};globalSignatures?: {operatorSignature?: string;supervisorSignature?: string;};}): React.ReactElement | null {
  const componentRef = useRef<HTMLDivElement>(null);
  const isLandscape = (extinguishers || []).length > 15; // Auto rotate if many

  const stats = {
    total: extinguishers.length,
    vencidos: extinguishers.filter((e) => {
      const cargaStatus = getStatus(e.vencimientoRecarga || e.ultimaCarga).text;
      const phStatus = getPHStatus(e.vencimientoPH || e.ultimaPH).text;
      return cargaStatus === 'Vencido' || phStatus === 'Vencido';
    }).length
  };

  return (
    <div id="extinguisher-pdf-wrap" className="pb-[0]">
            <div className="overflow-x-[visible]">
                <div
          id="pdf-content"
          className="pdf-container card print-area p-[15mm] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box]"
          ref={componentRef}
          style={{
            width: isLandscape ? '297mm' : '210mm'



          }}>
          
                    <style type="text/css" media="print">
                        {`
                            @page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 15mm; }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            .no-print { display: none !important; }
                            .print-area { 
                                box-shadow: none !important; 
                                margin: 0 !important; 
                                padding: 10mm !important; 
                                width: 100% !important; 
                                max-width: none !important; 
                                border: 1px solid #1e293b !important;
                                border-radius: 0 !important;
                                height: auto !important;
                            }
                            #extinguisher-pdf-wrap {
                                padding-top: 0 !important;
                                padding-bottom: 0 !important;
                                min-height: 0 !important;
                                margin: 0 !important;
                                display: block !important;
                            }
                            #extinguisher-pdf-wrap > div {
                                display: block !important;
                            }
                            .company-logo {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                            .text-vencido {
                                color: #dc2626 !important;
                                -webkit-text-fill-color: #dc2626 !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                        `}
                    </style>

                    {/* Header */}
                    <div className="border-b-[3px] border-slate-800 pb-[10px] mb-[20px] flex justify-between items-start">
                        <div>
                            <h1 className="m-[0_0_5px_0] text-[18pt] text-slate-800 dark:text-slate-200 font-[900] uppercase">
                                Planilla de Control de Extintores
                            </h1>
                            <p className="m-[0] text-[10pt] text-slate-600 dark:text-slate-400 flex items-center gap-[1rem]">
                                <span><Calendar size={14} className="display-[inline] vertical-align-[middle]" /> Fecha: {new Date().toLocaleDateString('es-AR')}</span>
                                <span><Flame size={14} className="display-[inline] vertical-align-[middle]" /> Equipos: {stats.total}</span>
                                {stats.vencidos > 0 && <span className="text-red-600 dark:text-red-400 font-[bold]">({stats.vencidos} Vencidos)</span>}
                            </p>
                        </div>
                        <CompanyLogo className="h-[45px] w-[auto] object-fit-[contain] max-w-[140px]" />


            
                    </div>

                    <div className="block">
                        {(() => {
              if (!extinguishers || extinguishers.length === 0) {
                return (
                  <div className="p-[20px] text-center text-[#64748b]">
                                        No hay extintores registrados.
                                    </div>);

              }

              const grouped = extinguishers.reduce((acc, ext) => {
                const key = (ext.empresa || '').trim().toUpperCase() || 'SIN EMPRESA ESPECIFICADA';
                if (!acc[key]) acc[key] = [];
                acc[key].push(ext);
                return acc;
              }, {});

              const sortedCompanies = Object.keys(grouped).sort();

              return sortedCompanies.map((empresa) => {
                const group = grouped[empresa].sort((a: any, b: any) => {
                  const valA = String(a.chapa || a.numero || '');
                  const valB = String(b.chapa || b.numero || '');
                  return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                });

                const CHUNK_SIZE = 12; // Número seguro de filas por tabla para evitar recortes
                const chunks = [];
                for (let i = 0; i < group.length; i += CHUNK_SIZE) {
                  chunks.push(group.slice(i, i + CHUNK_SIZE));
                }

                return (
                  <div key={empresa} className="block mb-[25px]">
                                        {chunks.map((chunk, chunkIdx) =>
                    <div key={`${empresa}-chunk-${chunkIdx}`} className="mb-[20px] page-break-inside-[auto]">
                                                {/* Company Header */}
                                                <div className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 p-[10px_15px] rounded-[8px] flex items-center gap-[10px] border-[2px_solid_#cbd5e1] mb-[15px]">



                        
                                                    <span className="text-[12pt] font-[900]">
                                                        🏢 {empresa} {chunkIdx > 0 ? '(Continuación)' : ''}
                                                    </span>
                                                    {chunkIdx === 0 &&
                        <span className="text-[9pt] bg-[#e2e8f0] text-slate-700 dark:text-slate-300 p-[2px_8px] rounded-[12px] font-[700]">
                                                            {group.length} extintores
                                                        </span>
                        }
                                                </div>

                                                {/* Compact Table */}
                                                <table className="table-fixed w-full border-collapse break-words text-[9pt] mt-[5px]">
                                                    <thead>
                                                        <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid] bg-slate-100 dark:bg-slate-800/50 border-b-2 border-slate-300">
                                                            <th className="p-[8px] text-center font-[900] text-slate-800 dark:text-slate-200 w-[10%]">Nº / CHAPA</th>
                                                            <th className="p-[8px] text-left font-[900] text-slate-800 dark:text-slate-200">TIPO / CAP.</th>
                                                            <th className="p-[8px] text-left font-[900] text-slate-800 dark:text-slate-200">F. FABRICACIÓN</th>
                                                            <th className="p-[8px] text-left font-[900] text-slate-800 dark:text-slate-200">UBICACIÓN</th>
                                                            <th className="p-[8px] text-left font-[900] text-slate-800 dark:text-slate-200">VENC. CARGA</th>
                                                            <th className="p-[8px] text-left font-[900] text-slate-800 dark:text-slate-200">VENC. PH</th>
                                                            <th className="p-[8px] text-left font-[900] text-slate-800 dark:text-slate-200">ÚLTIMA INSP.</th>
                                                        </tr>
                                                    </thead>
                                                    {chunk.map((ext: any, idx: number) => {
                          const globalIdx = chunkIdx * CHUNK_SIZE + idx;
                          const sCarga = getStatus(ext?.vencimientoRecarga || ext?.ultimaCarga);
                          const sPH = getPHStatus(ext?.vencimientoPH || ext?.ultimaPH);
                          const lastInspection = ext?.inspections && ext.inspections.length > 0 ? ext.inspections[ext.inspections.length - 1] : null;

                          const getFabInfo = () => {
                            if (!ext?.fechaFabricacion) return { base: '-', vto: '-', expired: false };
                            try {
                              const d = new Date(ext.fechaFabricacion + 'T12:00:00Z');
                              if (isNaN(d.getTime())) return { base: '-', vto: '-', expired: false };
                              const base = d.toLocaleDateString('es-AR');
                              d.setFullYear(d.getFullYear() + 20);
                              const vto = d.toLocaleDateString('es-AR');
                              return { base, vto, expired: d.getTime() < new Date().getTime() };
                            } catch {return { base: '-', vto: '-', expired: false };}
                          };
                          const fabInfo = getFabInfo();
                          const fFabBg = 'transparent';
                          const fFabColor = fabInfo.expired ? '#dc2626' : '#475569';

                          const cargaBg = 'transparent';
                          const cargaColor = sCarga.text === 'Vencido' ? '#dc2626' : sCarga.color;

                          const phBg = 'transparent';
                          const phColor = sPH.text === 'Vencido' ? '#dc2626' : sPH.color;

                          const hasObs = !!(lastInspection && lastInspection.observacion);

                          const rowBg = globalIdx % 2 === 0 ? '#ffffff' : '#f8fafc';

                          return (
                            <tbody key={`${empresa}-${globalIdx}`} className="avoid-break page-break-inside-[avoid]">
                                                                    <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid] border-top-[1px_solid_#e2e8f0]" style={{ background: rowBg }}>
                                                                        <td className="p-[8px] text-center font-[900] text-slate-800 dark:text-slate-200 text-[10pt]">
                                                                            <div className="text-[7pt] text-[#94a3b8] mb-[2px]">{globalIdx + 1}</div>
                                                                            <div>{ext?.numero || ext?.chapa || '-'}</div>
                                                                        </td>
                                                                        <td className="p-[8px] text-slate-700 dark:text-slate-300 font-[600]">{formatType(ext?.tipo)} {ext?.capacidad ? `- ${ext.capacidad}` : ''}</td>
                                                                        <td style={{ backgroundColor: fFabBg }} className="p-[8px] text-slate-600 dark:text-slate-400 webkit-print-color-adjust-[exact] print-color-adjust-[exact]">
                                                                            <div className="flex flex-col gap-[2px] text-[8pt]">
                                                                                <span>Fab: <span className="font-[600]">{fabInfo.base}</span></span>
                                                                                <span className={fabInfo.expired ? 'text-vencido' : ''} style={{ color: fFabColor, fontWeight: fabInfo.expired ? 800 : 600 }}>Vto: {fabInfo.vto}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-[8px] text-slate-600 dark:text-slate-400">{ext?.ubicacion || 'Sin ubicación'}</td>
                                                                        <td style={{ backgroundColor: cargaBg }} className="p-[8px] text-slate-600 dark:text-slate-400 webkit-print-color-adjust-[exact] print-color-adjust-[exact]">
                                                                            <div className="flex flex-col gap-[2px] text-[8pt]">
                                                                                <span>Carga: <span className="font-[600]">{sCarga.base}</span></span>
                                                                                <span className={sCarga.text === 'Vencido' ? 'text-vencido' : ''} style={{ color: cargaColor, fontWeight: sCarga.text === 'Vencido' ? 800 : 600 }}>Vto: {sCarga.vto}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ backgroundColor: phBg }} className="p-[8px] text-slate-600 dark:text-slate-400 webkit-print-color-adjust-[exact] print-color-adjust-[exact]">
                                                                            <div className="flex flex-col gap-[2px] text-[8pt]">
                                                                                <span>PH: <span className="font-[600]">{sPH.base}</span></span>
                                                                                <span className={sPH.text === 'Vencido' ? 'text-vencido' : ''} style={{ color: phColor, fontWeight: sPH.text === 'Vencido' ? 800 : 600 }}>Vto: {sPH.vto}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-[8px]">
                                                                            {lastInspection ?
                                  <div className="flex flex-col gap-[2px]">
                                                                                    <span className="font-[800] text-slate-800 dark:text-slate-200 webkit-print-color-adjust-[exact] print-color-adjust-[exact]">
                                                                                        {new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR')} - Res: <span className="inline-block w-[30px] border-bottom-[1px_solid_#1e293b] vertical-align-[bottom] relative top-[-1px]"></span>
                                                                                    </span>
                                                                                </div> :

                                  <span className="text-[#94a3b8] font-style-[italic]">Sin inspecciones</span>
                                  }
                                                                        </td>
                                                                    </tr>
                                                                    <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid] border-bottom-[2px_solid_#cbd5e1] h-[auto]" style={{ background: rowBg }}>
                                                                        <td colSpan={7} className="p-[0_8px_6px_8px] h-[1px]">
                                                                            <div style={{ border: hasObs ? '1px dashed #dc2626' : '1px dashed #94a3b8', color: hasObs ? '#dc2626' : '#334155' }} className="rounded-[4px] p-[4px_6px] text-[7.5pt] bg-white dark:bg-slate-800 webkit-print-color-adjust-[exact] print-color-adjust-[exact] min-h-[20px] h-[100%]">
                                                                                <strong className="text-slate-800 dark:text-slate-200">Observación:</strong> <span style={{ color: hasObs ? '#dc2626' : 'inherit', WebkitTextFillColor: hasObs ? '#dc2626' : 'inherit' }} className="font-[700]">{hasObs ? lastInspection.observacion : ''}</span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>);

                        })}
                                                </table>
                                            </div>
                    )}
                                    </div>);

              });
            })()}
                    </div>
                    {/* Add Signatures here */}
                    {showSignatures && (showSignatures.operator || showSignatures.professional || showSignatures.supervisor) &&
          <div className="mt-[20px] page-break-inside-[avoid]">
                            <PdfSignatures data={{ showSignatures, operatorSignature: globalSignatures?.operatorSignature, supervisorSignature: globalSignatures?.supervisorSignature }} />
            <PdfBrandingFooter />
                        </div>
          }
                </div>
            </div>
        </div>);

}