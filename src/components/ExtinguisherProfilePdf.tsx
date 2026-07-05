import React, { useRef, useState } from 'react';
import { Calendar, Flame, MapPin, Hash, ShieldCheck, AlertTriangle, ArrowLeft, Printer, Share2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import ShareModal from './ShareModal';

const getRecargaExpirationStatus = (dateStr) => {
  if (!dateStr) return { text: 'Sin Datos', color: '#64748b', expirationDate: null };
  const d = new Date(dateStr + 'T12:00:00Z');
  if (isNaN(d.getTime())) return { text: 'Sin Datos', color: '#64748b', expirationDate: null };
  d.setFullYear(d.getFullYear() + 1);
  const today = new Date();
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const expDate = d.toLocaleDateString('es-AR');
  if (diffDays < 0) return { text: 'Vencido', color: '#ef4444', expirationDate: expDate };
  if (diffDays <= 30) return { text: 'Por vencer', color: '#f59e0b', expirationDate: expDate };
  return { text: 'Vigente', color: '#10b981', expirationDate: expDate };
};

const getPHExpirationStatus = (dateStr: string) => {
  if (!dateStr) return { text: 'Sin Datos', color: '#64748b' };
  const d = new Date(dateStr + 'T12:00:00Z');
  if (isNaN(d.getTime())) return { text: 'Sin Datos', color: '#64748b' };
  d.setFullYear(d.getFullYear() + 5);
  const today = new Date();
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: 'Vencido', color: '#ef4444', expirationDate: d.toLocaleDateString('es-AR') };
  if (diffDays <= 30) return { text: 'Por vencer', color: '#f59e0b', expirationDate: d.toLocaleDateString('es-AR') };
  return { text: 'Vigente', color: '#10b981', expirationDate: d.toLocaleDateString('es-AR') };
};

const getLifespanStatus = (fechaFab: string) => {
  if (!fechaFab) return { text: 'Sin Datos', color: '#64748b', expirationDate: null };
  const d = new Date(fechaFab);
  const limitDate = new Date(d);
  limitDate.setFullYear(limitDate.getFullYear() + 20);
  const today = new Date();
  const diffDays = Math.ceil((limitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const expDate = limitDate.toLocaleDateString('es-AR');
  if (diffDays < 0) return { text: 'DAR DE BAJA', color: '#dc2626', expirationDate: expDate };
  if (diffDays <= 180) return { text: 'Por vencer', color: '#f59e0b', expirationDate: expDate };
  return { text: 'Vigente', color: '#10b981', expirationDate: expDate };
};

const formatType = (tipo: string) => {
  if (!tipo) return 'N/A';
  const t = String(tipo).toUpperCase();
  if (t === 'ABC') return 'HCFC';
  if (t === 'BC') return 'CO2';
  return tipo;
};


export default function ExtinguisherProfilePdf({ data, onBack = () => window.history.back(), isHeadless = false }: {data: any;onBack?: () => void;isHeadless?: boolean;}): React.ReactElement | null {
  const componentRef = useRef<HTMLDivElement>(null);
  const [showShare, setShowShare] = useState(false);

  if (!data) return null;

  const handlePrint = () => window.print();

  const recargaStatus = getRecargaExpirationStatus(data.vencimientoRecarga);
  const phStatus = getPHExpirationStatus(data.vencimientoPH);
  const lifespanStatus = getLifespanStatus(data.fechaFabricacion);

  let actSignature = null;
  let actStamp = null;
  let actName = null;
  let actLic = null;

  try {
    const lsPersonal = localStorage.getItem('personalData');
    const lsStamp = localStorage.getItem('signatureStampData');
    const legacySig = localStorage.getItem('capturedSignature');
    if (lsStamp) {
      const parsed = JSON.parse(lsStamp);
      actSignature = parsed.signature;actStamp = parsed.stamp;
    } else if (legacySig) {
      actSignature = legacySig;
    }
    if (lsPersonal) {
      const pd = JSON.parse(lsPersonal);
      actName = pd.name;actLic = pd.license;
    }
  } catch (e) {}

  let latestInspection = null;
  try {
    const historyRaw = localStorage.getItem('extintores_history');
    if (historyRaw) {
      const history = JSON.parse(historyRaw);
      latestInspection = history.find((h) => String(h.extintorId) === String(data.id)) || null;
    }
    if (!latestInspection && data.inspections && data.inspections.length > 0) {
      const last = data.inspections[data.inspections.length - 1];
      latestInspection = {
        fecha: last.fechaVisita ? last.fechaVisita + 'T12:00:00Z' : new Date().toISOString(),
        inspector: '-',
        resultado: last.resultado === 'C' ? 'APROBADO' : 'RECHAZADO',
        items: [
        { text: 'Manómetro (presión operable)', status: last.controles?.manometro || 'C', observacion: '' },
        { text: 'Acceso sin obstrucciones', status: last.controles?.acceso || 'C', observacion: '' },
        { text: 'Señalización reglamentaria', status: last.controles?.senalizacion || 'C', observacion: '' },
        { text: 'Manguera y boquilla', status: last.controles?.manguera || 'C', observacion: '' },
        { text: 'Estado físico del cilindro', status: last.controles?.cilindro || 'C', observacion: '' }],

        observaciones: last.observacion || ''
      };
    }
  } catch (e) {}

  return (
    <div id="extinguisher-profile-wrap" className="container pb-[3rem] min-h-[100vh] flex flex-col">
            {!isHeadless &&
      <div className="no-print flex items-center justify-space-between mb-[1.5rem] z-[10] flex-wrap gap-[1rem]">
                    <div className="flex items-center gap-[1rem]">
                        <button onClick={onBack} className="p-[0.5rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] cursor-pointer rounded-[50%] text-[var(--color-text)]">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="m-[0] text-[1.5rem] font-[800]">Previsualización de Ficha</h1>
                    </div>
                    <div className="flex gap-[0.8rem]">
                        <button onClick={() => setShowShare(true)} className="p-[0.5rem_1rem] flex items-center gap-[0.5rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[8px] cursor-pointer font-[600] text-[var(--color-text)]">
                            <Share2 size={18} /> Compartir Ficha
                        </button>
                        <button onClick={handlePrint} className="btn-primary m-[0] flex items-center gap-[0.5rem]">
                            <Printer size={18} /> Imprimir / Exportar PDF
                        </button>
                    </div>
                </div>
      }
            
            <ShareModal
        isOpen={showShare}
        open={showShare}
        onClose={() => setShowShare(false)}
        title={`Ficha Técnica - Extintor #${data.numero}`}
        text={`📋 Ficha de Extintor\n🔥 Chapa: ${data.numero}\n📍 Ubicación: ${data.ubicacion}`}
        rawMessage={''}
        elementIdToPrint="pdf-content"
        fileName={`Ficha_Extintor_${data.numero || 'Reporte'}.pdf`} />
      

            <div className="flex-[1] flex justify-center">
                <div
          id="pdf-content"
          className="pdf-container card print-area w-[100%] max-w-[210mm] flex flex-col bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box]"
          ref={componentRef}>









                    <style type="text/css" media="print">
                        {`
                            @page { size: A4 portrait; margin: 10mm; }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            .no-print { display: none !important; }
                            .print-area { 
                                box-shadow: none !important; 
                                margin: 0 !important; 
                                padding: 10mm !important; 
                                width: 100% !important; 
                                max-width: none !important; /* Vital para que llene el ancho virtual de html2canvas */
                                border: none !important;
                                min-height: 0 !important;
                                height: auto !important;
                                display: block !important;
                            }
                            #extinguisher-profile-wrap, #pdf-content {
                                font-size: 0.75rem !important; /* Usamos tamaño de fuente menor puro en vez de scale para no romper el PDF */
                                width: 100% !important;
                                padding: 0 !important;
                                padding-bottom: 0 !important;
                                min-height: 0 !important;
                                height: auto !important;
                                margin: 0 !important;
                                display: block !important;
                            }
                            #extinguisher-profile-wrap > div {
                                flex: none !important;
                                display: block !important;
                                min-height: 0 !important;
                            }
                            /* Forzar page breaks limpios */
                            .avoid-break {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }
                            .page-break-before {
                                page-break-before: always !important;
                                break-before: page !important;
                            }
                        `}
                    </style>

                    <div className="border-b-[3px] border-slate-800 pb-[10px] mb-[15px] flex justify-between items-center avoid-break">
                        <div>
                            <h1 className="m-[0_0_5px_0] text-[18pt] text-slate-800 dark:text-slate-200 font-[900] uppercase">
                                Ficha Técnica de Extintor
                            </h1>
                            <p className="m-[0] text-[11pt] text-slate-600 dark:text-slate-400 font-[600]">
                                Documento de Trazabilidad e Inventario
                            </p>
                        </div>
                        <CompanyLogo className="h-[50px] w-auto object-contain max-w-[150px]" />
                    </div>

                    <div className="flex gap-[20px] mb-[15px] avoid-break">
                        <div className="w-[150px] shrink-0">
                            {data.foto ?
              <img src={data.foto} alt="Extintor" className="w-[100%] h-[160px] object-cover rounded-[8px] border-[2px] border-solid border-[#cbd5e1]" /> :

              <div className="w-[100%] h-[160px] bg-slate-100 dark:bg-slate-800/50 rounded-[8px] border-[2px] border-dashed border-[#cbd5e1] flex items-center justify-center">
                                    <Flame size={48} color="#94a3b8" />
                                </div>
              }
                        </div>

                        <div className="flex-1">
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 rounded-[8px] p-[8px]">
                                <h3 className="m-[0_0_8px_0] text-[11pt] text-slate-800 dark:text-slate-200 flex items-center gap-[8px] border-b border-slate-300 pb-[4px]">
                                    <Hash size={16} color="#3b82f6" /> Identificación del Equipo
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-[6px] break-words">
                                    <div>
                                        <div className="text-[8pt] text-[#64748b] font-[700] uppercase">Nº Chapa / Interno</div>
                                        <div className="text-[10pt] font-[900] text-slate-800 dark:text-slate-200">{data.numero || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8pt] text-[#64748b] font-[700] uppercase">Tipo y Capacidad</div>
                                        <div className="text-[10pt] font-[700] text-slate-800 dark:text-slate-200">{formatType(data.tipo)} - {data.capacidad}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8pt] text-[#64748b] font-[700] uppercase">Ubicación</div>
                                        <div className="text-[10pt] font-[700] text-slate-800 dark:text-slate-200 flex items-center gap-[4px]">
                                            <MapPin size={14} color="#dc2626" /> {data.ubicacion || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[8pt] text-[#64748b] font-[700] uppercase">Empresa / Cliente</div>
                                        <div className="text-[10pt] font-[700] text-slate-800 dark:text-slate-200">{data.empresa || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8pt] text-[#64748b] font-[700] uppercase">Marca / Fabricante</div>
                                        <div className="text-[10pt] font-[700] text-slate-800 dark:text-slate-200">{data.marca || 'Sin especificar'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8pt] text-[#64748b] font-[700] uppercase">Sello IRAM / OPDS</div>
                                        <div className="text-[10pt] font-[700] text-slate-800 dark:text-slate-200">{data.selloIRAM || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8pt] text-[#64748b] font-[700] uppercase">Nº Serie (Tubo)</div>
                                        <div className="text-[10pt] font-[700] text-slate-800 dark:text-slate-200">{data.numeroSerie || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-[12px] avoid-break">
                        <h3 className="m-[0_0_8px_0] text-[11pt] text-slate-800 dark:text-slate-200 flex items-center gap-[8px] border-b-[2px] border-slate-800 pb-[4px]">
                            <Calendar size={16} color="#f59e0b" /> Control de Vencimientos
                        </h3>
                        
                        <table className="w-full border-collapse table-fixed break-words text-[9pt] font-sans">
                            <thead>
                                <tr className="avoid-break break-inside-avoid bg-slate-100 dark:bg-slate-800/50">
                                    <th className="border border-slate-300 p-1 text-left w-[25%] font-extrabold">Vencimiento Recarga</th>
                                    <th className="border border-slate-300 p-1 text-left w-[25%] font-extrabold">Vencimiento P.H. (5 Años)</th>
                                    <th className="border border-slate-300 p-1 text-left w-[25%] font-extrabold">Fecha Fabricación</th>
                                    <th className="border border-slate-300 p-1 text-left w-[25%] font-extrabold">Vida Útil (20 Años)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="avoid-break break-inside-avoid">
                                    <td className="border border-slate-300 p-1">
                                        <div className="text-[10pt] font-[900]">{recargaStatus.expirationDate || '-'}</div>
                                        <div style={{ color: recargaStatus.color }} className="font-[800] mt-[2px] text-[8pt]">{recargaStatus.text}</div>
                                    </td>
                                    <td className="border border-slate-300 p-1">
                                        <div className="text-[10pt] font-black">{phStatus.expirationDate ? phStatus.expirationDate : '-'}</div>
                                        <div style={{ color: phStatus.color }} className="font-extrabold mt-0.5 text-[8pt]">{phStatus.text}</div>
                                    </td>
                                    <td className="border border-slate-300 p-1">
                                        <div className="text-[10pt] font-black">{data.fechaFabricacion ? new Date(data.fechaFabricacion).toLocaleDateString('es-AR') : '-'}</div>
                                    </td>
                                    <td className="border border-slate-300 p-1">
                                        <div className="text-[10pt] font-black">{lifespanStatus.expirationDate || '-'}</div>
                                        {lifespanStatus &&
                                        <div style={{ color: lifespanStatus.color }} className="font-extrabold mt-0.5 text-[8pt]">{lifespanStatus.text}</div>
                    }
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-[10px]">
                        <h3 className="m-[0_0_8px_0] text-[11pt] text-slate-800 dark:text-slate-200 flex items-center gap-[8px] border-b-[2px] border-slate-800 pb-[4px] avoid-break">
                            <ShieldCheck size={16} color="#10b981" /> Última Inspección Registrada
                        </h3>
                        
                        {!latestInspection && !data.ultimaInspeccion ?
            <div className="p-[15px] bg-slate-50 dark:bg-slate-800/50 border-[1px_solid_#e2e8f0] rounded-[8px] text-center text-[#64748b] font-style-[italic] flex items-center justify-center gap-[8px]">
                                <AlertTriangle size={18} color="#f59e0b" /> No hay registros de inspección para este equipo.
                            </div> :
            null}

                        {!latestInspection && data.ultimaInspeccion ?
            <div className="p-[15px] bg-slate-50 dark:bg-slate-800/50 border-[1px_solid_#e2e8f0] rounded-[8px] flex justify-space-between items-center">
                                 <div>
                                     <div className="text-[8pt] text-[#64748b] font-[700]">Fecha:</div>
                                     <div className="text-[10pt] font-[900] text-slate-800 dark:text-slate-200">{new Date(data.ultimaInspeccion).toLocaleDateString('es-AR')}</div>
                                 </div>
                                 <div className="bg-green-100 dark:bg-green-900/30 text-[#166534] p-[4px_8px] rounded-[999px] font-[800] text-[9pt] flex items-center gap-[4px]">
                                     <ShieldCheck size={14} /> INSPECCIÓN OK
                                 </div>
                             </div> :
            null}
                        <div className="mb-[10px]">
                        {latestInspection &&
              <div style={{ marginTop: data.ultimaInspeccion && !latestInspection ? '10px' : '0' }}>
                            <div className="flex justify-between mb-[6px] text-[9pt] bg-slate-50 dark:bg-slate-800/50 p-[6px] rounded-[8px] border border-slate-200">
                                <div><strong className="text-slate-500">Fecha:</strong> <span className="font-extrabold">{new Date(latestInspection.fecha).toLocaleDateString('es-AR')}</span></div>
                                <div><strong className="text-slate-500">Inspector:</strong> <span className="font-extrabold">{latestInspection.inspector || '-'}</span></div>
                                <div><strong className="text-slate-500">Resultado de inspección:</strong> <span className="inline-block w-[100px] border-b border-slate-500 ml-[5px]"></span></div>
                            </div>
                            
                            <table className="w-full border-collapse table-fixed break-words text-[8.5pt] font-sans mt-2">
                                <thead>
                                    <tr className="avoid-break break-inside-avoid bg-slate-100 dark:bg-slate-800/50">
                                        <th className="border border-slate-300 p-1 text-left w-[60%]">Ítem a Verificar</th>
                                        <th className="border border-slate-300 p-1 text-center w-[15%]">Estado</th>
                                        <th className="border border-slate-300 p-1 text-left w-[25%]">Observación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {latestInspection.items?.map((item, idx) =>
                                        <tr key={idx} className="avoid-break break-inside-avoid" style={{ background: idx % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                                            <td className="border border-slate-300 p-1 text-slate-700 dark:text-slate-300 font-semibold">
                                                {item.text}
                                            </td>
                                            <td style={{ color: item.status === 'OK' ? '#10b981' : item.status === 'NC' ? '#ef4444' : '#64748b' }} className="border border-slate-300 p-1 text-center font-black">
                                                {item.status || 'N/A'}
                                            </td>
                                            <td className="border border-slate-300 p-1 text-slate-500 italic">
                                                {item.observacion && item.observacion.trim().length > 0 ? item.observacion : 'Sin observación'}
                                            </td>
                                        </tr>
                    )}
                                </tbody>
                            </table>
                            {latestInspection.observaciones &&
                <div className="mt-[10px] text-[9pt] bg-[#fffbeb] p-[10px] rounded-[8px] border-[1px_solid_#fde68a] text-[#92400e] avoid-break">
                                    <strong className="block mb-[4px]">Observaciones Generales:</strong>
                                    {latestInspection.observaciones}
                                </div>
                }

                            {/* FOTOS DE INSPECCIÓN */}
                            {(latestInspection.fotos && latestInspection.fotos.length > 0 || latestInspection.items && latestInspection.items.some((i) => i.photos && i.photos.length > 0)) &&
                <div className="mt-[10px] border-t-[2px] border-dashed border-slate-300 pt-[10px] avoid-break">
                                    <h4 className="m-[0_0_10px_0] text-[10pt] text-slate-800 dark:text-slate-200 font-[800]">📸 Evidencia Fotográfica</h4>
                                    
                                    {/* Fotos Generales */}
                                    {latestInspection.fotos && latestInspection.fotos.length > 0 &&
                  <div className="mb-[10px] avoid-break">
                                            <span className="text-[9pt] font-[700] text-[#64748b] block mb-[6px]">General:</span>
                                            <div className="flex gap-[10px] flex-wrap">
                                                {latestInspection.fotos.map((foto, fIdx) =>
                      <img key={`gen-f-${fIdx}`} src={foto} alt="Evidencia" className="w-[80px] h-[80px] object-cover rounded-[8px] border border-slate-300" />
                      )}
                                            </div>
                                        </div>
                  }

                                    {/* Fotos por Ítem */}
                                    {latestInspection.items && latestInspection.items.some((i) => i.photos && i.photos.length > 0) &&
                  <div className="flex gap-[15px] flex-wrap">
                                            {latestInspection.items.filter((i) => i.photos && i.photos.length > 0).map((item, idx) =>
                    <div key={`item-f-${idx}`} className="flex flex-col gap-[6px] avoid-break">
                                                    <span className="text-[8pt] font-[700] text-slate-600 dark:text-slate-400 max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis">{item.text}</span>
                                                    <div className="flex gap-[5px]">
                                                        {item.photos.map((foto, pIdx) =>
                        <img key={`ip-${idx}-${pIdx}`} src={foto} alt="Evidencia Ítem" className="w-[60px] h-[60px] object-cover rounded-[6px] border border-slate-300" />
                        )}
                                                    </div>
                                                </div>
                    )}
                                        </div>
                  }
                                </div>
                }

                            </div>
              }
                        </div>
                    </div>

                    {/* Firmas */}
                    <div className="avoid-break w-[100%] mt-[15px] pt-[10px] block">
                        <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator ? {
            title: 'OPERADOR',
            subtitle: 'Responsable de sector',
            signatureUrl: data.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={data.showSignatures?.professional !== false ? {
            title: 'INSPECTOR / PROFESIONAL',
            subtitle: (actName || 'Profesional HSE').toUpperCase(),
            signatureUrl: actSignature || null,
            stampUrl: actStamp || null,
            isProfessional: true,
            license: actLic || null
          } : null}
          box3={data.showSignatures?.supervisor ? {
            title: 'SUPERVISOR',
            subtitle: 'Aprobación HSE',
            signatureUrl: data.supervisorSignature || null,
            isProfessional: false
          } : null} />
                    </div>
                    
                    <PdfBrandingFooter />
                </div>
            </div>
        </div>);

}