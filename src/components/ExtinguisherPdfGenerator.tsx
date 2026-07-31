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
                    <div className="border-b-[3px] border-slate-800 pb-[8px] mb-[12px] flex justify-between items-start">
                        <div>
                            <h1 style={{ color: '#0f172a' }} className="m-[0_0_4px_0] text-[18pt] font-[900] uppercase">
                                Planilla de Control de Extintores
                            </h1>
                            <p style={{ color: '#475569' }} className="m-[0] text-[9.5pt] font-[700] flex items-center gap-[1rem]">
                                <span><Calendar size={14} className="inline align-middle mr-1" /> Fecha: {new Date().toLocaleDateString('es-AR')}</span>
                                <span><Flame size={14} className="inline align-middle mr-1" /> Equipos: {stats.total}</span>
                                {stats.vencidos > 0 && <span className="text-red-600 font-[bold]">({stats.vencidos} Vencidos)</span>}
                            </p>
                        </div>
                        <CompanyLogo style={{ maxHeight: '40px', maxWidth: '130px', objectFit: 'contain' }} />
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
                  <div key={empresa} className="block mb-[8px]">
                                        {chunks.map((chunk, chunkIdx) =>
                    <div key={`${empresa}-chunk-${chunkIdx}`} className="mb-[6px]">
                                                {/* Company Header */}
                                                <div style={{ color: '#0f172a', backgroundColor: '#f8fafc', borderColor: '#cbd5e1', pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }} className="p-[6px_10px] rounded-[6px] flex items-center gap-[8px] border-[1.5px] mb-[4px]">
                                                    <span style={{ color: '#0f172a' }} className="text-[10.5pt] font-[900]">
                                                        🏢 {empresa} {chunkIdx > 0 ? '(Continuación)' : ''}
                                                    </span>
                                                    {chunkIdx === 0 &&
                                                        <span style={{ backgroundColor: '#e2e8f0', color: '#334155' }} className="text-[8.5pt] p-[2px_8px] rounded-[10px] font-[700]">
                                                            {group.length} extintores
                                                        </span>
                                                    }
                                                </div>

                                                {/* Compact Table */}
                                                <table className="table-fixed w-full border-collapse break-words text-[9pt] mt-[0px]" style={{ pageBreakInside: 'auto', breakInside: 'auto' }}>
                                                    <thead>
                                                        <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid', backgroundColor: '#f1f5f9' }}>
                                                            <th style={{ color: '#0f172a' }} className="p-[6px_8px] text-center font-[900] w-[10%]">Nº / CHAPA</th>
                                                            <th style={{ color: '#0f172a' }} className="p-[6px_8px] text-left font-[900]">TIPO / CAP.</th>
                                                            <th style={{ color: '#0f172a' }} className="p-[6px_8px] text-left font-[900]">F. FABRICACIÓN</th>
                                                            <th style={{ color: '#0f172a' }} className="p-[6px_8px] text-left font-[900]">UBICACIÓN</th>
                                                            <th style={{ color: '#0f172a' }} className="p-[6px_8px] text-left font-[900]">VENC. CARGA</th>
                                                            <th style={{ color: '#0f172a' }} className="p-[6px_8px] text-left font-[900]">VENC. PH</th>
                                                            <th style={{ color: '#0f172a' }} className="p-[6px_8px] text-left font-[900]">ÚLTIMA INSP.</th>
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
                            <tbody key={`${empresa}-${globalIdx}`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                                    <tr style={{ background: rowBg, pageBreakInside: 'avoid', breakInside: 'avoid', borderTop: '1px solid #e2e8f0' }}>
                                                                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 900, color: '#0f172a', fontSize: '9.5pt' }}>
                                                                            <div style={{ fontSize: '7pt', color: '#94a3b8', marginBottom: '2px' }}>{globalIdx + 1}</div>
                                                                            <div>{ext?.numero || ext?.chapa || '-'}</div>
                                                                        </td>
                                                                        <td style={{ padding: '6px 8px', color: '#374151', fontWeight: 600, fontSize: '8.5pt' }}>{formatType(ext?.tipo)} {ext?.capacidad ? `- ${ext.capacidad}` : ''}</td>
                                                                        <td style={{ padding: '6px 8px', fontSize: '8pt' }}>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                                                <span style={{ color: '#475569' }}>Fab: <span style={{ fontWeight: 600 }}>{fabInfo.base}</span></span>
                                                                                <span style={{ color: fFabColor, fontWeight: fabInfo.expired ? 800 : 600 }}>Vto: {fabInfo.vto}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ padding: '6px 8px', color: '#475569', fontSize: '8.5pt' }}>{ext?.ubicacion || 'Sin ubicación'}</td>
                                                                        <td style={{ padding: '6px 8px', fontSize: '8pt' }}>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                                                <span style={{ color: '#475569' }}>Carga: <span style={{ fontWeight: 600 }}>{sCarga.base}</span></span>
                                                                                <span style={{ color: cargaColor, fontWeight: sCarga.text === 'Vencido' ? 800 : 600 }}>Vto: {sCarga.vto}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ padding: '6px 8px', fontSize: '8pt' }}>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                                                <span style={{ color: '#475569' }}>PH: <span style={{ fontWeight: 600 }}>{sPH.base}</span></span>
                                                                                <span style={{ color: phColor, fontWeight: sPH.text === 'Vencido' ? 800 : 600 }}>Vto: {sPH.vto}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ padding: '6px 8px' }}>
                                                                            {lastInspection ?
                                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '8pt' }}>
                                                                                        {new Date(lastInspection.fechaVisita + 'T12:00:00Z').toLocaleDateString('es-AR')}
                                                                                    </span> :
                                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '8pt' }}>Sin inspecciones</span>
                                  }
                                                                        </td>
                                                                    </tr>
                                                                    <tr style={{ background: rowBg, pageBreakInside: 'avoid', breakInside: 'avoid', borderBottom: '1px solid #e2e8f0' }}>
                                                                        <td colSpan={7} style={{ padding: '0 8px 5px 8px' }}>
                                                                            <div style={{ border: hasObs ? '1px dashed #dc2626' : '1px dashed #cbd5e1', color: hasObs ? '#dc2626' : '#475569', borderRadius: '4px', padding: '3px 6px', fontSize: '7.5pt', backgroundColor: '#ffffff', minHeight: '18px' }}>
                                                                                <strong style={{ color: '#334155' }}>Obs:</strong> <span style={{ color: hasObs ? '#dc2626' : '#64748b', fontWeight: hasObs ? 700 : 400 }}>{hasObs ? lastInspection.observacion : ''}</span>
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
                    {/* Signatures + Branding Footer */}
                    {showSignatures && (showSignatures.operator || showSignatures.professional || showSignatures.supervisor) ? (
                        <>
                            <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginTop: '12px' }}>
                                <PdfSignatures data={{ showSignatures, operatorSignature: globalSignatures?.operatorSignature, supervisorSignature: globalSignatures?.supervisorSignature }} />
                            </div>
                            <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginTop: '6px' }}>
                                <PdfBrandingFooter />
                            </div>
                        </>
                    ) : (
                        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginTop: '10px' }}>
                            <PdfBrandingFooter />
                        </div>
                    )}
                </div>
            </div>
        </div>);

}