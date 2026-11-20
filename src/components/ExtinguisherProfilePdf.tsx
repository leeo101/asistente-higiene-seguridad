import React, { useRef, useState } from 'react';
import { Calendar, Flame, MapPin, Hash, ShieldCheck, ArrowLeft, Printer, Share2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import ShareModal from './ShareModal';
import { printElementAsDocument } from '../utils/pdfHelper';

const getRecargaExpirationStatus = (dateStr: any) => {
  if (!dateStr) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', expirationDate: null };
  const d = new Date(dateStr + 'T12:00:00Z');
  if (isNaN(d.getTime())) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', expirationDate: null };
  d.setFullYear(d.getFullYear() + 1);
  const today = new Date();
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const expDate = d.toLocaleDateString('es-AR');
  if (diffDays < 0) return { text: 'Vencido', color: '#dc2626', bg: '#fef2f2', expirationDate: expDate };
  if (diffDays <= 30) return { text: 'Por vencer', color: '#d97706', bg: '#fffbeb', expirationDate: expDate };
  return { text: 'Vigente', color: '#059669', bg: '#ecfdf5', expirationDate: expDate };
};

const getPHExpirationStatus = (dateStr: string) => {
  if (!dateStr) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', expirationDate: null };
  const d = new Date(dateStr + 'T12:00:00Z');
  if (isNaN(d.getTime())) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', expirationDate: null };
  d.setFullYear(d.getFullYear() + 5);
  const today = new Date();
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const expDate = d.toLocaleDateString('es-AR');
  if (diffDays < 0) return { text: 'Vencido', color: '#dc2626', bg: '#fef2f2', expirationDate: expDate };
  if (diffDays <= 30) return { text: 'Por vencer', color: '#d97706', bg: '#fffbeb', expirationDate: expDate };
  return { text: 'Vigente', color: '#059669', bg: '#ecfdf5', expirationDate: expDate };
};

const getLifespanStatus = (fechaFab: string) => {
  if (!fechaFab) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', expirationDate: null };
  const d = new Date(fechaFab + 'T12:00:00Z');
  if (isNaN(d.getTime())) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', expirationDate: null };
  const limitDate = new Date(d);
  limitDate.setFullYear(limitDate.getFullYear() + 20);
  const today = new Date();
  const diffDays = Math.ceil((limitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const expDate = limitDate.toLocaleDateString('es-AR');
  if (diffDays < 0) return { text: 'DAR DE BAJA', color: '#dc2626', bg: '#fef2f2', expirationDate: expDate };
  if (diffDays <= 180) return { text: 'Por vencer', color: '#d97706', bg: '#fffbeb', expirationDate: expDate };
  return { text: 'Vigente', color: '#059669', bg: '#ecfdf5', expirationDate: expDate };
};

const formatType = (tipo: string) => {
  if (!tipo) return 'N/A';
  const t = String(tipo).toUpperCase();
  if (t === 'ABC') return 'HCFC';
  if (t === 'BC') return 'CO2';
  return tipo;
};

export default function ExtinguisherProfilePdf({
  data,
  onBack = () => window.history.back(),
  isHeadless = false,
  pdfElementId = 'pdf-content'
}: {
  data: any;
  onBack?: () => void;
  isHeadless?: boolean;
  pdfElementId?: string;
}): React.ReactElement | null {
  const componentRef = useRef<HTMLDivElement>(null);
  const [showShare, setShowShare] = useState(false);

  if (!data) return null;

  const handlePrint = async () => {
    try {
      await printElementAsDocument(pdfElementId, `Ficha Técnica - Extintor #${data.numero || 'Reporte'}`, false);
    } catch {
      window.print();
    }
  };

  const recargaStatus = getRecargaExpirationStatus(data.vencimientoRecarga);
  const phStatus = getPHExpirationStatus(data.vencimientoPH);
  const lifespanStatus = getLifespanStatus(data.fechaFabricacion);

  let actSignature = data?.professionalSignature || null;
  let actStamp = data?.professionalStamp || null;
  let actName = data?.professionalName || null;
  let actLic = data?.professionalLicense || null;
  let actTitle = data?.professionalTitle || null;

  try {
    const lsPersonal = localStorage.getItem('personalData');
    const lsStamp = localStorage.getItem('signatureStampData');
    const legacySig = localStorage.getItem('capturedSignature');
    if (lsStamp) {
      const parsed = JSON.parse(lsStamp);
      if (!actSignature) actSignature = parsed.signature;
      if (!actStamp) actStamp = parsed.stamp;
    } else if (!actSignature && legacySig) {
      actSignature = legacySig;
    }
    if (lsPersonal) {
      const pd = JSON.parse(lsPersonal);
      actName = actName || pd.name || pd.fullName;
      actLic = actLic || pd.license || pd.matricula;
      actTitle = actTitle || pd.profession || pd.profesion || pd.title;
    }
  } catch (e) {}

  let latestInspection = data?.selectedInspection || null;
  if (!latestInspection) {
    try {
      const historyRaw = localStorage.getItem('extintores_history');
      if (historyRaw) {
        const history = JSON.parse(historyRaw);
        const matches = history.filter(
          (h: any) =>
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

  return (
    <div id="extinguisher-profile-wrap" className={isHeadless ? 'w-full min-h-0 block p-0 m-0' : 'container pb-[3rem] min-h-[100vh] flex flex-col'}>
      {!isHeadless && (
        <div className="no-print flex items-center justify-between mb-6 z-10 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] cursor-pointer rounded-full text-[var(--color-text)]"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="m-0 text-2xl font-extrabold">Previsualización de Ficha</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowShare(true)}
              className="px-4 py-2 flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg cursor-pointer font-semibold text-[var(--color-text)]"
            >
              <Share2 size={18} /> Compartir Ficha
            </button>
            <button onClick={handlePrint} className="btn-primary m-0 flex items-center gap-2">
              <Printer size={18} /> Imprimir / Exportar PDF
            </button>
          </div>
        </div>
      )}

      <ShareModal
        isOpen={showShare}
        open={showShare}
        onClose={() => setShowShare(false)}
        title={`Ficha Técnica - Extintor #${data.numero}`}
        text={`📋 Ficha de Extintor\n🔥 Chapa: ${data.numero}\n📍 Ubicación: ${data.ubicacion}`}
        rawMessage={''}
        elementIdToPrint={pdfElementId}
        fileName={`Ficha_Extintor_${data.numero || 'Reporte'}.pdf`}
      />

      <div className={isHeadless ? 'w-full block' : 'flex-1 flex justify-center'}>
        <div
          id={pdfElementId}
          className={`pdf-container card print-area w-full max-w-[210mm] block bg-white text-slate-900 rounded-lg box-border ${
            isHeadless ? 'shadow-none' : 'shadow-2xl'
          }`}
          style={{ padding: isHeadless ? '0' : '4mm 10mm 10mm 10mm' }}
          ref={componentRef}
        >
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
              #extinguisher-profile-wrap, #${pdfElementId} {
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
              #${pdfElementId} td, #${pdfElementId} th {
                padding: 6px 10px !important;
                font-size: 9.5pt !important;
                line-height: 1.35 !important;
                box-sizing: border-box !important;
                color: #0f172a !important;
              }
              tr, .avoid-break, .avoid-break-strictly, .pdf-signatures-wrapper, .pdf-brand-container {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            `}
          </style>

          {/* Barra superior tricolor ejecutiva */}
          <div className="w-full h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 rounded-t-lg mb-2.5"></div>

          <div className="border-b-2 border-slate-900 pb-2 mb-3 flex justify-between items-center avoid-break">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="bg-slate-900 text-white font-black text-[7.5pt] px-2 py-0.5 rounded uppercase tracking-wider">
                  CHAPA #{data.numero || '-'}
                </span>
                <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[7.5pt] px-2 py-0.5 rounded uppercase">
                  CONTROL DE MATAFUEGOS
                </span>
              </div>
              <h1 style={{ color: '#0f172a' }} className="m-0 text-[16pt] font-black uppercase tracking-tight">
                Ficha Técnica de Extintor
              </h1>
              <p style={{ color: '#475569' }} className="m-0 text-[9pt] font-bold">
                Documento de Trazabilidad e Inventario
              </p>
            </div>
            <CompanyLogo style={{ maxHeight: '38px', maxWidth: '130px', objectFit: 'contain' }} />
          </div>

          <div className="flex gap-3 mb-3 avoid-break">
            <div className="w-[125px] shrink-0">
              {data.foto ? (
                <img
                  src={data.foto}
                  alt="Extintor"
                  className="w-full h-[135px] object-cover rounded-xl border-2 border-solid border-slate-300 shadow-xs"
                />
              ) : (
                <div className="w-full h-[135px] bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1">
                  <Flame size={38} color="#f59e0b" />
                  <span className="text-[7.5pt] font-bold text-slate-400 uppercase">Sin Foto</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-3">
                <h3 className="m-[0_0_8px_0] text-[10.5pt] text-slate-900 flex items-center gap-1.5 border-b border-slate-300 pb-1 font-black uppercase tracking-wide">
                  <Hash size={15} color="#2563eb" /> Identificación del Equipo
                </h3>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 break-words">
                  <div>
                    <div className="text-[8pt] text-slate-500 font-extrabold uppercase tracking-wider">Nº Chapa / Interno</div>
                    <div className="text-[10.5pt] font-black text-slate-900">#{data.numero || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[8pt] text-slate-500 font-extrabold uppercase tracking-wider">Tipo de Agente</div>
                    <div className="text-[10.5pt] font-black text-slate-900">{formatType(data.tipo)}</div>
                  </div>
                  <div>
                    <div className="text-[8pt] text-slate-500 font-extrabold uppercase tracking-wider">Ubicación</div>
                    <div className="text-[10pt] font-extrabold text-slate-900 flex items-center gap-1">
                      <MapPin size={12} color="#dc2626" /> {data.ubicacion || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8pt] text-slate-500 font-extrabold uppercase tracking-wider">Empresa / Cliente</div>
                    <div className="text-[10pt] font-extrabold text-slate-900">{data.empresa || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[8pt] text-slate-500 font-extrabold uppercase tracking-wider">Marca / Fabricante</div>
                    <div className="text-[10pt] font-extrabold text-slate-900">{data.marca || 'Sin especificar'}</div>
                  </div>
                  <div>
                    <div className="text-[8pt] text-slate-500 font-extrabold uppercase tracking-wider">Sello IRAM / OPDS</div>
                    <div className="text-[10pt] font-extrabold text-slate-900">{data.selloIRAM || '-'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[8pt] text-slate-500 font-extrabold uppercase tracking-wider">Nº Serie (Fabricante)</div>
                    <div className="text-[10pt] font-extrabold text-slate-900">{data.numeroSerie || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3 avoid-break">
            <h3 className="m-[0_0_6px_0] text-[10.5pt] text-slate-900 flex items-center gap-1.5 border-b-2 border-slate-900 pb-1 font-black uppercase tracking-wide">
              <Calendar size={15} color="#d97706" /> Control de Vencimientos
            </h3>

            <table className="w-full border-collapse table-fixed break-words text-[9.5pt] font-sans rounded-lg overflow-hidden">
              <thead>
                <tr className="avoid-break avoid-break-strictly break-inside-avoid bg-slate-100">
                  <th className="border border-slate-300 p-2 text-left w-[25%] font-black text-slate-900">Vencimiento Recarga</th>
                  <th className="border border-slate-300 p-2 text-left w-[25%] font-black text-slate-900">Vencimiento P.H. (5 Años)</th>
                  <th className="border border-slate-300 p-2 text-left w-[25%] font-black text-slate-900">Fecha Fabricación</th>
                  <th className="border border-slate-300 p-2 text-left w-[25%] font-black text-slate-900">Vida Útil (20 Años)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="avoid-break avoid-break-strictly break-inside-avoid">
                  <td className="border border-slate-300 p-2" style={{ backgroundColor: recargaStatus.bg }}>
                    <div className="text-[10pt] font-black text-slate-900">{recargaStatus.expirationDate || '-'}</div>
                    <div style={{ color: recargaStatus.color }} className="font-black mt-0.5 text-[8.5pt] uppercase">
                      {recargaStatus.text}
                    </div>
                  </td>
                  <td className="border border-slate-300 p-2" style={{ backgroundColor: phStatus.bg }}>
                    <div className="text-[10pt] font-black text-slate-900">{phStatus.expirationDate || '-'}</div>
                    <div style={{ color: phStatus.color }} className="font-black mt-0.5 text-[8.5pt] uppercase">
                      {phStatus.text}
                    </div>
                  </td>
                  <td className="border border-slate-300 p-2">
                    <div className="text-[10pt] font-black text-slate-900">
                      {data.fechaFabricacion ? new Date(data.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}
                    </div>
                  </td>
                  <td className="border border-slate-300 p-2" style={{ backgroundColor: lifespanStatus.bg }}>
                    <div className="text-[10pt] font-black text-slate-900">{lifespanStatus.expirationDate || '-'}</div>
                    {lifespanStatus && (
                      <div style={{ color: lifespanStatus.color }} className="font-black mt-0.5 text-[8.5pt] uppercase">
                        {lifespanStatus.text}
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-3">
            <h3 className="m-[0_0_6px_0] text-[10.5pt] text-slate-900 flex items-center gap-1.5 border-b-2 border-slate-900 pb-1 font-black uppercase tracking-wide avoid-break">
              <ShieldCheck size={15} color="#059669" /> Registro de Control e Inspección
            </h3>

            <div>
              {latestInspection ? (
                <div>
                  <div className="flex justify-between mb-2 text-[9.5pt] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 avoid-break">
                    <div>
                      <strong className="text-slate-600">Fecha:</strong>{' '}
                      <span className="font-black text-slate-900">{new Date(latestInspection.fecha).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div>
                      <strong className="text-slate-600">Inspector:</strong>{' '}
                      <span className="font-black text-slate-900">{latestInspection.inspector || '-'}</span>
                    </div>
                    <div>
                      <strong className="text-slate-600">Resultado:</strong>{' '}
                      <span
                        className={`font-black ml-1 ${
                          latestInspection.resultado === 'APROBADO' || latestInspection.resultado === 'C'
                            ? 'text-emerald-700'
                            : 'text-red-700'
                        }`}
                      >
                        {latestInspection.resultado || 'COMPLETADO'}
                      </span>
                    </div>
                  </div>

                  <table className="w-full border-collapse break-words text-[9.5pt] font-sans mt-1.5">
                    <thead>
                      <tr className="avoid-break break-inside-avoid bg-slate-100" style={{ pageBreakInside: 'avoid' }}>
                        <th className="border border-slate-300 p-2 text-left w-[46%] font-black text-slate-900">Ítem a Verificar</th>
                        <th className="border border-slate-300 p-2 text-center w-[24%] font-black text-slate-900">Estado</th>
                        <th className="border border-slate-300 p-2 text-left w-[30%] font-black text-slate-900">Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestInspection.items?.map((item: any, idx: number) => {
                        const isOk = item.status === 'C' || item.status === 'OK' || item.status === 'APROBADO';
                        const isFail = item.status === 'NC' || item.status === 'RECHAZADO';
                        const statusColor = isOk ? '#059669' : isFail ? '#dc2626' : '#475569';
                        const statusLabel = isOk ? 'CONFORME (C)' : isFail ? 'NO CONFORME (NC)' : item.status || 'N/A';
                        const obsText =
                          item.notes && item.notes.trim().length > 0
                            ? item.notes
                            : item.observacion && item.observacion.trim().length > 0
                            ? item.observacion
                            : 'Sin observación';

                        return (
                          <tr
                            key={idx}
                            className="avoid-break break-inside-avoid"
                            style={{
                              background: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                              pageBreakInside: 'avoid',
                              breakInside: 'avoid'
                            }}
                          >
                            <td className="border border-slate-300 p-2 text-slate-900 font-bold break-words whitespace-normal">
                              {item.text}
                            </td>
                            <td style={{ color: statusColor }} className="border border-slate-300 p-2 text-center font-black whitespace-nowrap">
                              {statusLabel}
                            </td>
                            <td className="border border-slate-300 p-2 text-slate-700 italic break-words whitespace-normal">{obsText}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {latestInspection.observaciones && (
                    <div
                      className="mt-2 text-[9.5pt] bg-[#fffbeb] p-2.5 rounded-lg border border-[#fde68a] text-[#78350f] avoid-break"
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      <strong className="block mb-0.5 font-black text-[#92400e]">Observaciones Generales:</strong>
                      {latestInspection.observaciones}
                    </div>
                  )}

                  {((latestInspection.fotos && latestInspection.fotos.length > 0) ||
                    (latestInspection.items && latestInspection.items.some((i: any) => i.photos && i.photos.length > 0))) && (
                    <div
                      className="mt-2.5 border-t border-dashed border-slate-300 pt-2 avoid-break"
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      <h4 className="m-[0_0_6px_0] text-[9.5pt] text-slate-900 font-black">📸 Evidencia Fotográfica</h4>

                      {latestInspection.fotos && latestInspection.fotos.length > 0 && (
                        <div className="mb-2 avoid-break">
                          <span className="text-[8.5pt] font-extrabold text-[#475569] block mb-1">General:</span>
                          <div className="flex gap-2 flex-wrap">
                            {latestInspection.fotos.map((foto: string, fIdx: number) => (
                              <img
                                key={`gen-f-${fIdx}`}
                                src={foto}
                                alt="Evidencia"
                                className="w-[70px] h-[70px] object-cover rounded-md border border-slate-300"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {latestInspection.items &&
                        latestInspection.items.some((i: any) => i.photos && i.photos.length > 0) && (
                          <div className="flex gap-2.5 flex-wrap">
                            {latestInspection.items
                              .filter((i: any) => i.photos && i.photos.length > 0)
                              .map((item: any, idx: number) => (
                                <div key={`item-f-${idx}`} className="flex flex-col gap-1 avoid-break">
                                  <span className="text-[8pt] font-extrabold text-slate-700 max-w-[110px] whitespace-nowrap overflow-hidden text-ellipsis">
                                    {item.text}
                                  </span>
                                  <div className="flex gap-1">
                                    {item.photos.map((foto: string, pIdx: number) => (
                                      <img
                                        key={`ip-${idx}-${pIdx}`}
                                        src={foto}
                                        alt="Evidencia Ítem"
                                        className="w-[55px] h-[55px] object-cover rounded border border-slate-300"
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: '14px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1.5px dashed #cbd5e1',
                    color: '#64748b'
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '9.5pt' }}>⚠️ Sin inspecciones registradas</p>
                  <p style={{ margin: '3px 0 0 0', fontSize: '8.5pt', fontStyle: 'italic' }}>
                    No se han realizado inspecciones para este equipo todavía.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            className="avoid-break avoid-break-strictly break-inside-avoid w-full block mt-3"
            data-avoid-break="true"
            data-orphan-threshold="260"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          >
            <PdfSignatures
              data={data}
              compact={true}
              hideFooter={true}
              box1={
                data.showSignatures?.operator
                  ? {
                      title: 'RESPONSABLE DE CONTROL',
                      subtitle: 'Inspección de Campo',
                      signatureUrl: data.operatorSignature || null,
                      isProfessional: false
                    }
                  : null
              }
              box2={
                data.showSignatures?.professional !== false
                  ? {
                      title: 'PROFESIONAL DE HIGIENE Y SEGURIDAD',
                      subtitle: (latestInspection?.inspector || actName || 'Firma y Sello H&S').toUpperCase(),
                      signatureUrl: actSignature || null,
                      stampUrl: actStamp || null,
                      isProfessional: true,
                      license: actLic || null,
                      profession: actTitle || null
                    }
                  : null
              }
              box3={
                data.showSignatures?.supervisor
                  ? {
                      title: 'RESPONSABLE DEL ESTABLECIMIENTO',
                      subtitle: 'Conformidad y Recepción',
                      signatureUrl: data.supervisorSignature || null,
                      isProfessional: false
                    }
                  : null
              }
            />
            <div className="mt-2">
              <PdfBrandingFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
