import React, { useRef, useState } from 'react';
import { Calendar, Flame, MapPin, Hash, ShieldCheck, ArrowLeft, Printer, Share2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import ShareModal from './ShareModal';
import { printElementAsDocument } from '../utils/pdfHelper';

const getRecargaExpirationStatus = (dateStr: any) => {
  if (!dateStr) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', expirationDate: null, baseDate: null };
  const d = new Date(dateStr + 'T12:00:00Z');
  if (isNaN(d.getTime())) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', expirationDate: null, baseDate: null };
  const baseDate = d.toLocaleDateString('es-AR');
  d.setFullYear(d.getFullYear() + 1);
  const today = new Date();
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const expDate = d.toLocaleDateString('es-AR');
  if (diffDays < 0) return { text: 'VENCIDO', color: '#dc2626', bg: '#fef2f2', border: '#fecdd3', expirationDate: expDate, baseDate };
  if (diffDays <= 30) return { text: 'POR VENCER', color: '#d97706', bg: '#fffbeb', border: '#fde68a', expirationDate: expDate, baseDate };
  return { text: 'VIGENTE', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', expirationDate: expDate, baseDate };
};

const getPHExpirationStatus = (dateStr: string) => {
  if (!dateStr) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', expirationDate: null, baseDate: null };
  const d = new Date(dateStr + 'T12:00:00Z');
  if (isNaN(d.getTime())) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', expirationDate: null, baseDate: null };
  const baseDate = d.toLocaleDateString('es-AR');
  d.setFullYear(d.getFullYear() + 5);
  const today = new Date();
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const expDate = d.toLocaleDateString('es-AR');
  if (diffDays < 0) return { text: 'VENCIDO', color: '#dc2626', bg: '#fef2f2', border: '#fecdd3', expirationDate: expDate, baseDate };
  if (diffDays <= 30) return { text: 'POR VENCER', color: '#d97706', bg: '#fffbeb', border: '#fde68a', expirationDate: expDate, baseDate };
  return { text: 'VIGENTE', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', expirationDate: expDate, baseDate };
};

const getLifespanStatus = (fechaFab: string) => {
  if (!fechaFab) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', expirationDate: null, baseDate: null };
  const d = new Date(fechaFab + 'T12:00:00Z');
  if (isNaN(d.getTime())) return { text: 'Sin Datos', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', expirationDate: null, baseDate: null };
  const baseDate = d.toLocaleDateString('es-AR');
  const limitDate = new Date(d);
  limitDate.setFullYear(limitDate.getFullYear() + 20);
  const today = new Date();
  const diffDays = Math.ceil((limitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const expDate = limitDate.toLocaleDateString('es-AR');
  if (diffDays < 0) return { text: 'DAR DE BAJA', color: '#dc2626', bg: '#fef2f2', border: '#fecdd3', expirationDate: expDate, baseDate };
  if (diffDays <= 180) return { text: 'POR VENCER', color: '#d97706', bg: '#fffbeb', border: '#fde68a', expirationDate: expDate, baseDate };
  return { text: 'VIGENTE', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', expirationDate: expDate, baseDate };
};

const formatType = (tipo: string) => {
  if (!tipo) return 'ABC (PQS)';
  const t = String(tipo).toUpperCase();
  if (t === 'ABC') return 'ABC (PQS)';
  if (t === 'BC') return 'BC (CO2)';
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
            { text: 'Manómetro en zona verde (presión operable)', status: last.controles?.manometro || 'C', notes: '' },
            { text: 'Visibilidad y acceso libre sin obstrucciones', status: last.controles?.acceso || 'C', notes: '' },
            { text: 'Cartelería y señalización reglamentaria (baliza/chapa)', status: last.controles?.senalizacion || 'C', notes: '' },
            { text: 'Manguera y boquilla libres de obstrucciones o grietas', status: last.controles?.manguera || 'C', notes: '' },
            { text: 'Estado físico general del cilindro (sin abolladuras ni óxido)', status: last.controles?.cilindro || 'C', notes: '' }
          ],
          observaciones: last.observacion || ''
        };
      }
    } catch (e) {}
  }

  // Determinar Dictamen General del Equipo
  const isBaja =
    lifespanStatus.text === 'DAR DE BAJA' ||
    data.estadoFisico === 'Fuera de Servicio' ||
    data.estadoFisico === 'Dado de Baja' ||
    recargaStatus.text === 'VENCIDO' ||
    phStatus.text === 'VENCIDO' ||
    latestInspection?.resultado === 'RECHAZADO' ||
    latestInspection?.resultado === 'NC';

  const isWarning =
    !isBaja &&
    (recargaStatus.text === 'POR VENCER' ||
      phStatus.text === 'POR VENCER' ||
      lifespanStatus.text === 'POR VENCER' ||
      data.estadoFisico === 'Revisión' ||
      data.estadoFisico === 'En Recarga' ||
      data.checkManometro === false ||
      data.checkPrecinto === false ||
      data.checkSenalizacion === false ||
      data.checkAcceso === false);

  const dictamenLabel = isBaja
    ? 'NO HABILITADO · VENCIDO / FUERA DE SERVICIO'
    : isWarning
    ? 'CON OBSERVACIONES · PRÓXIMO A VENCER / REVISIÓN'
    : 'OPERATIVO Y HABILITADO · EN REGLA (IRAM 3517-2)';

  const dictamenBadgeBg = isBaja ? '#dc2626' : isWarning ? '#d97706' : '#059669';
  const dictamenBoxBg = isBaja ? '#fef2f2' : isWarning ? '#fffbeb' : '#ecfdf5';
  const dictamenBorder = isBaja ? '#fca5a5' : isWarning ? '#fcd34d' : '#6ee7b7';

  const mOk = data.checkManometro !== false;
  const pOk = data.checkPrecinto !== false;
  const sOk = data.checkSenalizacion !== false;
  const aOk = data.checkAcceso !== false;

  return (
    <div id="extinguisher-profile-wrap" className={isHeadless ? 'w-full min-h-0 block p-0 m-0' : 'container pb-[3rem] min-h-[100vh] flex flex-col'}>
      {!isHeadless && (
        <div className="no-print flex items-center justify-between mb-[1.5rem] z-[10] flex-wrap gap-[1rem]">
          <div className="flex items-center gap-[1rem]">
            <button
              onClick={onBack}
              className="p-[0.5rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] cursor-pointer rounded-[50%] text-[var(--color-text)]"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="m-[0] text-[1.5rem] font-[800]">Previsualización de Ficha</h1>
          </div>
          <div className="flex gap-[0.8rem]">
            <button
              onClick={() => setShowShare(true)}
              className="p-[0.5rem_1rem] flex items-center gap-[0.5rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[8px] cursor-pointer font-[600] text-[var(--color-text)]"
            >
              <Share2 size={18} /> Compartir Ficha
            </button>
            <button onClick={handlePrint} className="btn-primary m-[0] flex items-center gap-[0.5rem]">
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
        elementIdToPrint="pdf-content"
        fileName={`Ficha_Extintor_${data.numero || 'Reporte'}.pdf`}
      />

      <div className={isHeadless ? 'w-full block' : 'flex-[1] flex justify-center'}>
        <div
          id={pdfElementId}
          className="pdf-container print-area bg-white text-slate-900 font-sans w-full max-w-[800px] mx-auto shadow-none print:shadow-none print:p-0"
          style={{ padding: '8px 12px', boxSizing: 'border-box' }}
          ref={componentRef}
        >
          <style type="text/css">
            {`
              @page { size: A4 portrait; margin: 7mm 8mm; }
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #ffffff !important; }
              .no-print { display: none !important; }
              .avoid-break, .avoid-break-strictly, .pdf-signatures-wrapper, .pdf-brand-container, tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            `}
          </style>

          {/* ─── ENCABEZADO MEMBRETADO OFICIAL ─── */}
          <div
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
            className="flex items-center justify-between pb-1.5 border-b-2 border-slate-900 mb-1.5 avoid-break"
          >
            <div className="flex items-center gap-2.5">
              <CompanyLogo className="h-9 w-auto max-w-[110px] object-contain" />
              <div>
                <div
                  style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[6pt] font-black uppercase tracking-wider mb-0.5"
                >
                  <Flame size={9} color="#d97706" /> Protección Contra Incendios · Ley 19.587 · Dec. 351/79 Anexo VII · IRAM 3517-2
                </div>
                <h1 style={{ color: '#0f172a' }} className="text-[12pt] font-black uppercase tracking-tight m-0 leading-none">
                  FICHA TÉCNICA Y ACTA DE INSPECCIÓN DE MATAFUEGO
                </h1>
                <p style={{ color: '#475569' }} className="text-[7pt] font-bold uppercase tracking-wide m-0 mt-0.5 leading-none">
                  Trazabilidad de Extintor, Vencimientos Reglamentarios y Control Periódico NFPA 10
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                className="inline-block text-[9px] font-mono font-black px-2 py-0.5 rounded"
              >
                CHAPA #{data.numero || data.chapa || 'S/N'}
              </span>
              <p style={{ color: '#475569' }} className="text-[7pt] font-extrabold m-0 mt-0.5">
                FECHA: {new Date().toLocaleDateString('es-AR')}
              </p>
            </div>
          </div>

          {/* ─── BANNER EJECUTIVO DE DICTAMEN Y VIGENCIA ─── */}
          <div
            style={{
              backgroundColor: dictamenBoxBg,
              border: `1.5px solid ${dictamenBorder}`,
              breakInside: 'avoid',
              pageBreakInside: 'avoid'
            }}
            className="px-2.5 py-1.5 rounded-lg mb-1.5 flex items-center justify-between gap-2 avoid-break"
          >
            <div>
              <span style={{ color: '#475569' }} className="text-[6.5pt] font-black uppercase tracking-widest block leading-none">
                DICTAMEN TÉCNICO Y CONDICIÓN OPERATIVA DEL EQUIPO
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  style={{ backgroundColor: dictamenBadgeBg, color: '#ffffff' }}
                  className="font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wide inline-block leading-tight"
                >
                  {dictamenLabel}
                </span>
                <span style={{ color: '#0f172a' }} className="text-[8pt] font-black">
                  {formatType(data.tipo)} ({data.capacidad || '5 kg'}) · Potencial {data.potencialExtintor || '3A 10B C'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right border-l border-slate-300 pl-2.5">
                <span style={{ color: '#475569' }} className="text-[6pt] font-extrabold block uppercase leading-none">
                  VTO. CARGA ANUAL
                </span>
                <span style={{ color: recargaStatus.color }} className="text-[8.5pt] font-black block leading-tight">
                  {recargaStatus.expirationDate || 'Sin fecha'}
                </span>
                <span style={{ color: recargaStatus.color }} className="text-[6pt] font-extrabold uppercase block leading-none">
                  {recargaStatus.text}
                </span>
              </div>
              <div className="text-right border-l border-slate-300 pl-2.5">
                <span style={{ color: '#475569' }} className="text-[6pt] font-extrabold block uppercase leading-none">
                  VTO. P. HIDRÁULICA
                </span>
                <span style={{ color: phStatus.color }} className="text-[8.5pt] font-black block leading-tight">
                  {phStatus.expirationDate || 'Sin fecha'}
                </span>
                <span style={{ color: phStatus.color }} className="text-[6pt] font-extrabold uppercase block leading-none">
                  {phStatus.text}
                </span>
              </div>
            </div>
          </div>

          {/* ─── SECCIÓN 1: DATOS TÉCNICOS DEL EQUIPO Y UBICACIÓN ─── */}
          <div
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
            className="mb-1.5 border border-slate-300 rounded-lg overflow-hidden avoid-break"
          >
            <div
              style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
              className="text-[8px] font-black px-2.5 py-1 uppercase tracking-wider flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <Hash size={9} /> 1. IDENTIFICACIÓN TÉCNICA DEL EQUIPO, UBICACIÓN Y ESTABLECIMIENTO
              </span>
              <span className="text-[7px] font-bold text-slate-300">ANEXO VII DEC. 351/79</span>
            </div>

            <div className="p-1.5 bg-slate-50/70 flex gap-2 items-stretch">
              {data.foto && (
                <div className="w-[70px] shrink-0 flex items-center justify-center">
                  <img
                    src={data.foto}
                    alt="Extintor"
                    className="w-[70px] h-[74px] object-cover rounded border border-slate-300"
                  />
                </div>
              )}

              <div className="flex-1 grid grid-cols-4 gap-x-2.5 gap-y-1 text-xs">
                <div>
                  <span className="text-[6.5pt] font-black text-slate-400 uppercase block leading-none">Nº Chapa / ID</span>
                  <span className="font-black text-slate-900 text-[10px]">#{data.numero || data.chapa || '-'}</span>
                </div>
                <div>
                  <span className="text-[6.5pt] font-black text-slate-400 uppercase block leading-none">Agente y Capacidad</span>
                  <span className="font-extrabold text-slate-900 text-[10px]">
                    {formatType(data.tipo)} — {data.capacidad || '5 kg'}
                  </span>
                </div>
                <div>
                  <span className="text-[6.5pt] font-black text-slate-400 uppercase block leading-none">Potencial Extintor</span>
                  <span className="font-extrabold text-slate-900 text-[10px]">{data.potencialExtintor || '3A 10B C'}</span>
                </div>
                <div>
                  <span className="text-[6.5pt] font-black text-slate-400 uppercase block leading-none">Estado Operativo</span>
                  <span className="font-extrabold text-slate-900 text-[10px]">{data.estadoFisico || 'Operativo'}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-[6.5pt] font-black text-slate-400 uppercase block leading-none">Ubicación / Sector Asignado</span>
                  <span className="font-extrabold text-slate-900 text-[10px] flex items-center gap-1">
                    <MapPin size={9} color="#dc2626" /> {data.ubicacion || 'Sin ubicación especificada'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[6.5pt] font-black text-slate-400 uppercase block leading-none">Razón Social / Establecimiento</span>
                  <span className="font-bold text-slate-800 text-[10px]">{data.empresa || 'Planta Principal'}</span>
                </div>

                <div className="border-t border-slate-200 pt-0.5">
                  <span className="text-[6pt] font-black text-slate-400 uppercase block leading-none">Marca / Fabricante</span>
                  <span className="font-bold text-slate-800 text-[9.5px]">{data.marca || 'Estándar IRAM'}</span>
                </div>
                <div className="border-t border-slate-200 pt-0.5">
                  <span className="text-[6pt] font-black text-slate-400 uppercase block leading-none">Nº de Serie Cilindro</span>
                  <span className="font-bold font-mono text-slate-800 text-[9.5px]">{data.numeroSerie || '-'}</span>
                </div>
                <div className="border-t border-slate-200 pt-0.5">
                  <span className="text-[6pt] font-black text-slate-400 uppercase block leading-none">Sello IRAM / OPDS</span>
                  <span className="font-bold text-slate-800 text-[9.5px]">{data.selloIRAM || '-'}</span>
                </div>
                <div className="border-t border-slate-200 pt-0.5">
                  <span className="text-[6pt] font-black text-slate-400 uppercase block leading-none">Soporte / Montaje</span>
                  <span className="font-bold text-slate-800 text-[9px] leading-tight block">
                    {data.tipoMontaje || 'Soporte mural (1.20m - 1.50m)'}
                  </span>
                </div>

                {(data.recargadora || data.observaciones) && (
                  <div className="col-span-4 border-t border-slate-200 pt-0.5 flex flex-wrap justify-between gap-2">
                    {data.recargadora && (
                      <div>
                        <span className="text-[6pt] font-black text-slate-400 uppercase mr-1">Taller Recargador:</span>
                        <span className="font-bold text-slate-800 text-[9px]">{data.recargadora}</span>
                      </div>
                    )}
                    {data.observaciones && (
                      <div className="flex-1">
                        <span className="text-[6pt] font-black text-slate-400 uppercase mr-1">Notas Técnicas:</span>
                        <span className="font-semibold text-slate-700 text-[9px] italic">{data.observaciones}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── SECCIÓN 2: CRONOGRAMA DE VENCIMIENTOS Y CONTROLES FÍSICOS DE CAMPO ─── */}
          <div
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
            className="mb-1.5 border border-slate-300 rounded-lg overflow-hidden avoid-break"
          >
            <div
              style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
              className="text-[8px] font-black px-2.5 py-1 uppercase tracking-wider flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <Calendar size={9} /> 2. CONTROL DE VENCIMIENTOS REGLAMENTARIOS Y VERIFICACIÓN FÍSICA RÁPIDA
              </span>
              <span className="text-[7px] font-bold text-slate-300">NORMA IRAM 3517-2</span>
            </div>

            <div className="p-1.5 bg-white space-y-1">
              <div className="grid grid-cols-3 gap-1.5">
                <div
                  style={{ backgroundColor: recargaStatus.bg, borderColor: recargaStatus.border }}
                  className="px-2 py-1 rounded border flex items-center justify-between"
                >
                  <div>
                    <span className="text-[6pt] font-black text-slate-500 uppercase block leading-none">
                      Recarga Anual (1 Año)
                    </span>
                    <span className="text-[8.5pt] font-black text-slate-900 block leading-tight">
                      Vto: {recargaStatus.expirationDate || '-'}
                    </span>
                    <span className="text-[6pt] text-slate-500 font-semibold block leading-none">
                      Últ. Carga: {recargaStatus.baseDate || '-'}
                    </span>
                  </div>
                  <span
                    style={{ backgroundColor: recargaStatus.color, color: '#ffffff' }}
                    className="text-[6pt] font-black px-1.5 py-0.5 rounded uppercase shrink-0"
                  >
                    {recargaStatus.text}
                  </span>
                </div>

                <div
                  style={{ backgroundColor: phStatus.bg, borderColor: phStatus.border }}
                  className="px-2 py-1 rounded border flex items-center justify-between"
                >
                  <div>
                    <span className="text-[6pt] font-black text-slate-500 uppercase block leading-none">
                      Prueba Hidráulica (5 Años)
                    </span>
                    <span className="text-[8.5pt] font-black text-slate-900 block leading-tight">
                      Vto: {phStatus.expirationDate || '-'}
                    </span>
                    <span className="text-[6pt] text-slate-500 font-semibold block leading-none">
                      Últ. P.H.: {phStatus.baseDate || '-'}
                    </span>
                  </div>
                  <span
                    style={{ backgroundColor: phStatus.color, color: '#ffffff' }}
                    className="text-[6pt] font-black px-1.5 py-0.5 rounded uppercase shrink-0"
                  >
                    {phStatus.text}
                  </span>
                </div>

                <div
                  style={{ backgroundColor: lifespanStatus.bg, borderColor: lifespanStatus.border }}
                  className="px-2 py-1 rounded border flex items-center justify-between"
                >
                  <div>
                    <span className="text-[6pt] font-black text-slate-500 uppercase block leading-none">
                      Vida Útil Cilindro (20 Años)
                    </span>
                    <span className="text-[8.5pt] font-black text-slate-900 block leading-tight">
                      Baja: {lifespanStatus.expirationDate || '-'}
                    </span>
                    <span className="text-[6pt] text-slate-500 font-semibold block leading-none">
                      Fabricación: {lifespanStatus.baseDate || '-'}
                    </span>
                  </div>
                  <span
                    style={{ backgroundColor: lifespanStatus.color, color: '#ffffff' }}
                    className="text-[6pt] font-black px-1.5 py-0.5 rounded uppercase shrink-0"
                  >
                    {lifespanStatus.text}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Manómetro (Presión)', ok: mOk },
                  { label: 'Precinto y Chaveta', ok: pOk },
                  { label: 'Chapa Baliza / Señal.', ok: sOk },
                  { label: 'Acceso Despejado', ok: aOk }
                ].map((chk, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: chk.ok ? '#f0fdf4' : '#fef2f2',
                      borderColor: chk.ok ? '#bbf7d0' : '#fecdd3'
                    }}
                    className="px-2 py-0.5 rounded border flex items-center justify-between"
                  >
                    <span className="text-[6.5pt] font-extrabold text-slate-800 truncate">{chk.label}</span>
                    <span
                      style={{ color: chk.ok ? '#15803d' : '#dc2626' }}
                      className="text-[6.5pt] font-black uppercase ml-1 shrink-0"
                    >
                      {chk.ok ? '✓ OK' : '✕ OBS'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── SECCIÓN 3: REGISTRO DE INSPECCIÓN PERIÓDICA (NFPA 10 / IRAM 3517-2) ─── */}
          <div className="mb-1.5 border border-slate-300 rounded-lg overflow-hidden avoid-break">
            <div
              style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
              className="text-[8px] font-black px-2.5 py-1 uppercase tracking-wider flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <ShieldCheck size={9} /> 3. LISTA DE VERIFICACIÓN E INSPECCIÓN PERIÓDICA (NORMA NFPA 10 / IRAM 3517-2)
              </span>
              {latestInspection && (
                <span className="text-[7px] font-bold text-slate-200">
                  FECHA: {new Date(latestInspection.fecha).toLocaleDateString('es-AR')} · INSPECTOR:{' '}
                  {(latestInspection.inspector || actName || 'HSE').toUpperCase()} · RESULTADO:{' '}
                  {latestInspection.resultado || 'APROBADO'}
                </span>
              )}
            </div>

            <div className="p-1.5 bg-white">
              {latestInspection ? (
                <div>
                  {/* Grilla de 2 columnas para los puntos de control NFPA 10 para máxima legibilidad en 1 sola hoja A4 */}
                  <div className="grid grid-cols-2 gap-1">
                    {latestInspection.items?.map((item: any, idx: number) => {
                      const isOk = item.status === 'C' || item.status === 'OK' || item.status === 'APROBADO';
                      const isFail = item.status === 'NC' || item.status === 'RECHAZADO';
                      const statusBg = isOk ? '#059669' : isFail ? '#dc2626' : '#475569';
                      const rowBg = isFail ? '#fef2f2' : idx % 2 === 0 ? '#f8fafc' : '#ffffff';
                      const rowBorder = isFail ? '#fecdd3' : '#e2e8f0';
                      const statusLabel = isOk ? 'CONFORME' : isFail ? 'NO CONFORME' : item.status || 'N/A';
                      const obsText =
                        item.notes && item.notes.trim().length > 0
                          ? item.notes
                          : item.observacion && item.observacion.trim().length > 0
                          ? item.observacion
                          : '';

                      return (
                        <div
                          key={idx}
                          style={{ backgroundColor: rowBg, border: `1px solid ${rowBorder}` }}
                          className="px-2 py-1 rounded flex items-center justify-between gap-1.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[6.8pt] font-black text-slate-500 shrink-0">{idx + 1}.</span>
                              <span className="text-[7pt] font-bold text-slate-900 leading-tight truncate">
                                {item.text}
                              </span>
                            </div>
                            {obsText && (
                              <div className="text-[6.3pt] text-slate-600 italic pl-3 leading-none mt-0.5 truncate">
                                Obs: {obsText}
                              </div>
                            )}
                          </div>
                          <span
                            style={{ backgroundColor: statusBg, color: '#ffffff' }}
                            className="text-[6pt] font-black px-1.5 py-0.5 rounded uppercase shrink-0 leading-none"
                          >
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {latestInspection.observaciones && (
                    <div
                      style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#78350f' }}
                      className="mt-1 text-[7.5pt] px-2 py-1 rounded"
                    >
                      <strong className="font-black text-[#92400e] mr-1">Observaciones Generales:</strong>
                      <span>{latestInspection.observaciones}</span>
                    </div>
                  )}

                  {((latestInspection.fotos && latestInspection.fotos.length > 0) ||
                    (latestInspection.items && latestInspection.items.some((i: any) => i.photos && i.photos.length > 0))) && (
                    <div className="mt-1 border-t border-dashed border-slate-300 pt-1">
                      <span className="text-[7pt] text-slate-800 font-black block mb-1">📸 Evidencia Fotográfica:</span>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        {latestInspection.fotos?.map((foto: string, fIdx: number) => (
                          <img
                            key={`gen-f-${fIdx}`}
                            src={foto}
                            alt="Evidencia"
                            className="w-[46px] h-[46px] object-cover rounded border border-slate-300"
                          />
                        ))}
                        {latestInspection.items
                          ?.filter((i: any) => i.photos && i.photos.length > 0)
                          .map((item: any, idx: number) =>
                            item.photos.map((foto: string, pIdx: number) => (
                              <img
                                key={`ip-${idx}-${pIdx}`}
                                src={foto}
                                alt="Evidencia Ítem"
                                className="w-[46px] h-[46px] object-cover rounded border border-slate-300"
                              />
                            ))
                          )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: '6px 10px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px dashed #cbd5e1',
                    color: '#64748b'
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '7.5pt' }}>
                    Equipo registrado en padrón — Controles físicos verificados en Sección 2
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ─── BLOQUE UNIFICADO DE FIRMAS Y PIE LEGAL ─── */}
          <div
            className="avoid-break avoid-break-strictly break-inside-avoid w-full block"
            data-avoid-break="true"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          >
            {(() => {
              const sigShow = latestInspection?.showSignatures || data.showSignatures || {
                operator: false,
                professional: true,
                supervisor: false
              };
              const opSig = latestInspection?.inspectorSignature || data.operatorSignature || null;
              const supSig = latestInspection?.supervisorSignature || data.supervisorSignature || null;
              const proSig = latestInspection?.professionalSignature || data.professionalSignature || actSignature || null;
              return (
                <PdfSignatures
                  data={{
                    ...data,
                    showSignatures: sigShow,
                    professionalSignature: proSig,
                    professionalStamp: actStamp,
                    professionalName: actName,
                    professionalLicense: actLic,
                    professionalTitle: actTitle
                  }}
                  compact={true}
                  hideFooter={true}
                  box1={
                    sigShow?.operator
                      ? {
                          title: 'RESPONSABLE DE CONTROL',
                          subtitle: 'INSPECCIÓN DE CAMPO',
                          signatureUrl: opSig,
                          isProfessional: false
                        }
                      : null
                  }
                  box2={
                    sigShow?.professional !== false
                      ? {
                          title: (actTitle || 'PROFESIONAL DE HIGIENE Y SEGURIDAD').toUpperCase(),
                          subtitle: (latestInspection?.inspector || actName || 'FIRMA Y SELLO H&S').toUpperCase(),
                          signatureUrl: proSig,
                          stampUrl: actStamp || null,
                          isProfessional: true,
                          license: actLic || null,
                          profession: actTitle || null
                        }
                      : null
                  }
                  box3={
                    sigShow?.supervisor
                      ? {
                          title: 'RESPONSABLE DEL ESTABLECIMIENTO',
                          subtitle: (data.empresa || 'CONFORMIDAD Y RECEPCIÓN').toUpperCase(),
                          signatureUrl: supSig,
                          isProfessional: false
                        }
                      : null
                  }
                />
              );
            })()}
            <div className="mt-1">
              <PdfBrandingFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
