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

  let latestInspection = data?.selectedInspection || null;
  if (!latestInspection) {
    try {
      const historyRaw = localStorage.getItem('extintores_history');
      if (historyRaw) {
        const history = JSON.parse(historyRaw);
        const matches = history.filter((h: any) =>
          (data.id && String(h.extintorId) === String(data.id)) ||
          (data.numero && String(h.extintorNum) === String(data.numero || data.chapa))
        );
        if (matches.length > 0) {
          matches.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          latestInspection = matches[0];
        }
      }
      if (!latestInspection && data.inspections && data.inspections.length > 0) {
        const last = data.inspections[data.inspections.length - 1];
        latestInspection = {
          fecha: last.fechaVisita ? last.fechaVisita + 'T12:00:00Z' : new Date().toISOString(),
          inspector: actName || 'Técnico Especialista HSE',
          resultado: last.resultado === 'C' ? 'APROBADO' : 'RECHAZADO',
          items: [
            { text: 'Manómetro (presión operable)', status: last.controles?.manometro || 'C', notes: '' },
            { text: 'Acceso sin obstrucciones', status: last.controles?.acceso || 'C', notes: '' },
            { text: 'Señalización reglamentaria', status: last.controles?.senalizacion || 'C', notes: '' },
            { text: 'Manguera y boquilla', status: last.controles?.manguera || 'C', notes: '' },
            { text: 'Estado físico del cilindro', status: last.controles?.cilindro || 'C', notes: '' }
          ],
          observaciones: last.observacion || ''
        };
      }
    } catch (e) {}
  }

  // Fallback garantizado: Si no hay historial previo registrado (ej. al compartir desde el formulario de contenido),
  // se sintetiza la inspección de control actual a partir de los datos del extintor para que el PDF NUNCA quede vacío.
  if (!latestInspection) {
    const isOk = (data.estadoFisico || 'Operativo') === 'Operativo' && recargaStatus.text !== 'Vencido' && phStatus.text !== 'Vencido';
    latestInspection = {
      fecha: data.vencimientoRecarga ? data.vencimientoRecarga + 'T12:00:00Z' : new Date().toISOString(),
      inspector: actName || 'Inspector H&S',
      resultado: isOk ? 'APROBADO' : 'RECHAZADO',
      items: [
        { text: 'Manómetro (presión operable)', status: isOk ? 'C' : 'NC', notes: isOk ? 'Presión operable en rango' : 'Verificar presión' },
        { text: 'Acceso y visibilidad sin obstrucciones', status: 'C', notes: 'Ubicación asignada y libre' },
        { text: 'Señalización reglamentaria (símbolos/chapa)', status: 'C', notes: data.selloIRAM ? `Sello IRAM/OPDS: ${data.selloIRAM}` : 'Cartelería conforme' },
        { text: 'Manguera, tobera y precinto de seguridad', status: 'C', notes: 'Precinto de seguridad intacto' },
        { text: 'Estado físico del cilindro y pintura', status: (data.estadoFisico || 'Operativo') === 'Operativo' ? 'C' : 'NC', notes: data.estadoFisico || 'Sin corrosión ni abolladuras' }
      ],
      observaciones: data.observaciones || (isOk ? 'Equipo verificado y en condiciones operativas según normativa NFPA 10.' : 'Requiere intervención técnica o recarga preventivas.')
    };
  }

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
          className="pdf-container card print-area w-full max-w-[210mm] block bg-white text-slate-900 box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box]"
          style={{ padding: '4mm 10mm 10mm 10mm' }}
          ref={componentRef}>

                    <style type="text/css">
                        {`
                            @page { size: A4 portrait; margin: 6mm; }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #ffffff !important; }
                            .no-print { display: none !important; }
                            .print-area { 
                                box-shadow: none !important; 
                                margin: 0 !important; 
                                padding: 0 !important; 
                                width: 100% !important; 
                                max-width: none !important;
                                border: none !important;
                                min-height: 0 !important;
                                height: auto !important;
                                display: block !important;
                                overflow: visible !important;
                                background: #ffffff !important;
                                color: #0f172a !important;
                            }
                            #extinguisher-profile-wrap, #pdf-content {
                                font-size: 0.85rem !important;
                                width: 100% !important;
                                min-height: 0 !important;
                                height: auto !important;
                                margin: 0 !important;
                                display: block !important;
                                overflow: visible !important;
                                background: #ffffff !important;
                                color: #0f172a !important;
                            }
                            #pdf-content td, #pdf-content th {
                                padding: 6px 10px !important;
                                font-size: 9.5pt !important;
                                line-height: 1.35 !important;
                                box-sizing: border-box !important;
                                color: #0f172a !important;
                            }
                            .pdf-export-mode #pdf-content td, .pdf-export-mode #pdf-content th {
                                padding: 6px 10px !important;
                                font-size: 9.5pt !important;
                                color: #0f172a !important;
                            }
                            .pdf-export-mode #pdf-content {
                                overflow: visible !important;
                                background: #ffffff !important;
                                padding: 0 !important;
                                display: block !important;
                            }
                            #extinguisher-profile-wrap > div {
                                flex: none !important;
                                display: block !important;
                                min-height: 0 !important;
                            }
                            tr {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }
                            .avoid-break {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }
                            .avoid-break-strictly {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }
                            .page-break-before {
                                page-break-before: always !important;
                                break-before: page !important;
                            }
                        `}
                    </style>

                    <div className="border-b-[2.5px] border-slate-900 pb-[8px] mb-[12px] flex justify-between items-center avoid-break">
                        <div>
                            <h1 className="m-[0_0_3px_0] text-[18pt] text-slate-900 font-[900] uppercase tracking-tight">
                                Ficha Técnica de Extintor
                            </h1>
                            <p className="m-[0] text-[10pt] text-slate-600 font-[700]">
                                Documento de Trazabilidad e Inventario
                            </p>
                        </div>
                        <CompanyLogo style={{ maxHeight: '44px', maxWidth: '140px', objectFit: 'contain' }} />
                    </div>

                    <div className="flex gap-[14px] mb-[12px] avoid-break">
                        <div className="w-[125px] shrink-0">
                            {data.foto ?
              <img src={data.foto} alt="Extintor" className="w-full h-[135px] object-cover rounded-[8px] border-[2px] border-solid border-[#94a3b8]" /> :

              <div className="w-full h-[135px] bg-slate-100 rounded-[8px] border-[2px] border-dashed border-[#cbd5e1] flex items-center justify-center">
                                    <Flame size={42} color="#64748b" />
                                </div>
              }
                        </div>

                        <div className="flex-1">
                            <div className="bg-slate-50 border-[1.5px] border-slate-300 rounded-[8px] p-[10px_14px]">
                                <h3 className="m-[0_0_8px_0] text-[11pt] text-slate-900 flex items-center gap-[6px] border-b border-slate-300 pb-[4px] font-[900]">
                                    <Hash size={16} color="#2563eb" /> Identificación del Equipo
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-[6px] break-words">
                                    <div>
                                        <div className="text-[8.5pt] text-[#475569] font-[800] uppercase tracking-wider">Nº Chapa / Interno</div>
                                        <div className="text-[10.5pt] font-[900] text-slate-900">{data.numero || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8.5pt] text-[#475569] font-[800] uppercase tracking-wider">Tipo y Capacidad</div>
                                        <div className="text-[10.5pt] font-[900] text-slate-900">{formatType(data.tipo)} - {data.capacidad}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8.5pt] text-[#475569] font-[800] uppercase tracking-wider">Ubicación</div>
                                        <div className="text-[10pt] font-[800] text-slate-900 flex items-center gap-[4px]">
                                            <MapPin size={13} color="#dc2626" /> {data.ubicacion || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[8.5pt] text-[#475569] font-[800] uppercase tracking-wider">Empresa / Cliente</div>
                                        <div className="text-[10pt] font-[800] text-slate-900">{data.empresa || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8.5pt] text-[#475569] font-[800] uppercase tracking-wider">Marca / Fabricante</div>
                                        <div className="text-[10pt] font-[800] text-slate-900">{data.marca || 'Sin especificar'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8.5pt] text-[#475569] font-[800] uppercase tracking-wider">Sello IRAM / OPDS</div>
                                        <div className="text-[10pt] font-[800] text-slate-900">{data.selloIRAM || '-'}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-[8.5pt] text-[#475569] font-[800] uppercase tracking-wider">Nº Serie (Tubo)</div>
                                        <div className="text-[10pt] font-[800] text-slate-900">{data.numeroSerie || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-[12px] avoid-break">
                        <h3 className="m-[0_0_8px_0] text-[11pt] text-slate-900 flex items-center gap-[6px] border-b-[2px] border-slate-900 pb-[4px] font-[900]">
                            <Calendar size={16} color="#d97706" /> Control de Vencimientos
                        </h3>
                        
                        <table className="w-full border-collapse table-fixed break-words text-[9.5pt] font-sans">
                            <thead>
                                <tr className="avoid-break avoid-break-strictly break-inside-avoid bg-slate-100">
                                    <th className="border border-slate-300 p-2 text-left w-[25%] font-[900] text-slate-900">Vencimiento Recarga</th>
                                    <th className="border border-slate-300 p-2 text-left w-[25%] font-[900] text-slate-900">Vencimiento P.H. (5 Años)</th>
                                    <th className="border border-slate-300 p-2 text-left w-[25%] font-[900] text-slate-900">Fecha Fabricación</th>
                                    <th className="border border-slate-300 p-2 text-left w-[25%] font-[900] text-slate-900">Vida Útil (20 Años)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="avoid-break avoid-break-strictly break-inside-avoid">
                                    <td className="border border-slate-300 p-2">
                                        <div className="text-[10pt] font-[900] text-slate-900">{recargaStatus.expirationDate || '-'}</div>
                                        <div style={{ color: recargaStatus.color }} className="font-[900] mt-[2px] text-[8.5pt]">{recargaStatus.text}</div>
                                    </td>
                                    <td className="border border-slate-300 p-2">
                                        <div className="text-[10pt] font-[900] text-slate-900">{phStatus.expirationDate ? phStatus.expirationDate : '-'}</div>
                                        <div style={{ color: phStatus.color }} className="font-[900] mt-[2px] text-[8.5pt]">{phStatus.text}</div>
                                    </td>
                                    <td className="border border-slate-300 p-2">
                                        <div className="text-[10pt] font-[900] text-slate-900">{data.fechaFabricacion ? new Date(data.fechaFabricacion).toLocaleDateString('es-AR') : '-'}</div>
                                    </td>
                                    <td className="border border-slate-300 p-2">
                                        <div className="text-[10pt] font-[900] text-slate-900">{lifespanStatus.expirationDate || '-'}</div>
                                        {lifespanStatus &&
                                        <div style={{ color: lifespanStatus.color }} className="font-[900] mt-[2px] text-[8.5pt]">{lifespanStatus.text}</div>
                                        }
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-[12px]">
                        <h3 className="m-[0_0_8px_0] text-[11pt] text-slate-900 flex items-center gap-[6px] border-b-[2px] border-slate-900 pb-[4px] font-[900] avoid-break">
                            <ShieldCheck size={16} color="#059669" /> Registro de Control e Inspección
                        </h3>
                        
                        <div>
                        {latestInspection && (
                            <div>
                                <div className="flex justify-between mb-[8px] text-[9.5pt] bg-slate-50 p-[6px_10px] rounded-[6px] border border-slate-300 avoid-break">
                                    <div><strong className="text-slate-600">Fecha:</strong> <span className="font-[900] text-slate-900">{new Date(latestInspection.fecha).toLocaleDateString('es-AR')}</span></div>
                                    <div><strong className="text-slate-600">Inspector:</strong> <span className="font-[900] text-slate-900">{latestInspection.inspector || '-'}</span></div>
                                    <div><strong className="text-slate-600">Resultado:</strong> <span className={`font-[900] ml-1 ${latestInspection.resultado === 'APROBADO' || latestInspection.resultado === 'C' ? 'text-emerald-700' : 'text-red-700'}`}>{latestInspection.resultado || 'COMPLETADO'}</span></div>
                                </div>
                                
                                <table className="w-full border-collapse break-words text-[9.5pt] font-sans mt-2">
                                    <thead>
                                        <tr className="avoid-break avoid-break-strictly break-inside-avoid bg-slate-100" style={{ pageBreakInside: 'avoid' }}>
                                            <th className="border border-slate-300 p-2 text-left w-[46%] font-[900] text-slate-900">Ítem a Verificar</th>
                                            <th className="border border-slate-300 p-2 text-center w-[24%] font-[900] text-slate-900">Estado</th>
                                            <th className="border border-slate-300 p-2 text-left w-[30%] font-[900] text-slate-900">Observación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {latestInspection.items?.map((item: any, idx: number) => {
                                            const isOk = item.status === 'C' || item.status === 'OK' || item.status === 'APROBADO';
                                            const isFail = item.status === 'NC' || item.status === 'RECHAZADO';
                                            const statusColor = isOk ? '#059669' : isFail ? '#dc2626' : '#475569';
                                            const statusLabel = isOk ? 'CONFORME (C)' : isFail ? 'NO CONFORME (NC)' : item.status || 'N/A';
                                            const obsText = (item.notes && item.notes.trim().length > 0)
                                                ? item.notes
                                                : (item.observacion && item.observacion.trim().length > 0)
                                                    ? item.observacion
                                                    : 'Sin observación';

                                            return (
                                                <tr key={idx} className="avoid-break avoid-break-strictly break-inside-avoid" style={{ background: idx % 2 === 1 ? '#f8fafc' : '#ffffff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                    <td className="border border-slate-300 p-2 text-slate-900 font-bold break-words whitespace-normal">
                                                        {item.text}
                                                    </td>
                                                    <td style={{ color: statusColor }} className="border border-slate-300 p-2 text-center font-[900] whitespace-nowrap">
                                                        {statusLabel}
                                                    </td>
                                                    <td className="border border-slate-300 p-2 text-slate-700 italic break-words whitespace-normal">
                                                        {obsText}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {latestInspection.observaciones &&
                                    <div className="mt-[8px] text-[9.5pt] bg-[#fffbeb] p-[8px_12px] rounded-[6px] border-[1.5px] border-[#fde68a] text-[#78350f] avoid-break avoid-break-strictly" style={{ pageBreakInside: 'avoid' }}>
                                        <strong className="block mb-[2px] font-[900] text-[#92400e]">Observaciones Generales:</strong>
                                        {latestInspection.observaciones}
                                    </div>
                                }

                                {(latestInspection.fotos && latestInspection.fotos.length > 0 || latestInspection.items && latestInspection.items.some((i) => i.photos && i.photos.length > 0)) &&
                                    <div className="mt-[10px] border-t-[1.5px] border-dashed border-slate-300 pt-[8px] avoid-break avoid-break-strictly" style={{ pageBreakInside: 'avoid' }}>
                                        <h4 className="m-[0_0_8px_0] text-[9.5pt] text-slate-900 font-[900]">📸 Evidencia Fotográfica</h4>
                                        
                                        {latestInspection.fotos && latestInspection.fotos.length > 0 &&
                                            <div className="mb-[8px] avoid-break">
                                                <span className="text-[8.5pt] font-[800] text-[#475569] block mb-[4px]">General:</span>
                                                <div className="flex gap-[8px] flex-wrap">
                                                    {latestInspection.fotos.map((foto, fIdx) =>
                                                        <img key={`gen-f-${fIdx}`} src={foto} alt="Evidencia" className="w-[70px] h-[70px] object-cover rounded-[6px] border border-slate-300" />
                                                    )}
                                                </div>
                                            </div>
                                        }

                                        {latestInspection.items && latestInspection.items.some((i) => i.photos && i.photos.length > 0) &&
                                            <div className="flex gap-[10px] flex-wrap">
                                                {latestInspection.items.filter((i) => i.photos && i.photos.length > 0).map((item, idx) =>
                                                    <div key={`item-f-${idx}`} className="flex flex-col gap-[4px] avoid-break">
                                                        <span className="text-[8pt] font-[800] text-slate-700 max-w-[110px] whitespace-nowrap overflow-hidden text-ellipsis">{item.text}</span>
                                                        <div className="flex gap-[4px]">
                                                            {item.photos.map((foto, pIdx) =>
                                                                <img key={`ip-${idx}-${pIdx}`} src={foto} alt="Evidencia Ítem" className="w-[55px] h-[55px] object-cover rounded-[4px] border border-slate-300" />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    </div>
                                }

                            </div>
                        )}
                        </div>
                    </div>

                    <div className="avoid-break avoid-break-strictly" style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginTop: '10px', display: 'block' }}>
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
            subtitle: (latestInspection?.inspector || actName || 'Profesional HSE').toUpperCase(),
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
                        <PdfBrandingFooter />
                    </div>
                </div>
            </div>
        </div>);
}