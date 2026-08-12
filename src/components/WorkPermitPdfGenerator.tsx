import React from 'react';
import { permitTypes } from '../data/workPermits';
import { ShieldCheck, Users } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function WorkPermitPdfGenerator({ data, id = "pdf-content" }: { data: any; id?: string; }): React.ReactElement | null {
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
      } else if (legacySig) {
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

  const checklist = data.checklist || [];
  const personal = data.personal || [];

  return (
    <div className="w-full flex justify-center py-4 bg-slate-100 print:bg-white print:py-0">
      <div
        id={id}
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 bg-white text-slate-900 shadow-xl rounded-2xl box-border mx-auto text-sm font-sans print:shadow-none print:p-4 print:max-w-none print:rounded-none"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 8mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area { 
              box-shadow: none !important; 
              margin: 0 !important; 
              padding: 0 !important; 
              width: 100% !important; 
              max-width: none !important; 
              border: none !important;
              border-radius: 0 !important; 
            }
          `}
        </style>

        {/* Top Accent Line */}
        <div className="w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 rounded-t-lg mb-6"></div>

        {/* Document Header */}
        <div className="flex justify-between items-center border-b-2 border-slate-800 pb-5 mb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-900 text-white font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                SISTEMA DE GESTIÓN HYS
              </span>
              <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded border border-slate-300 uppercase">
                CONTROL DE RIESGOS
              </span>
            </div>
            <h1 className="m-0 text-2xl font-black text-slate-900 tracking-tight uppercase">
              PERMISO DE TRABAJO ESPECIAL
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-blue-700 uppercase">
                {selectedTypeLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <CompanyLogo style={{ maxHeight: '50px', maxWidth: '160px', objectFit: 'contain' }} />
            <div className="text-right bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">N° PERMISO</div>
              <div className="text-base font-black text-blue-700">{data.numeroPermiso || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Datos Principales Box */}
        <div className="border-2 border-slate-800 rounded-xl overflow-hidden mb-6 bg-white page-break-inside-avoid shadow-xs">
          <div className="bg-slate-900 text-white font-black text-[11px] px-4 py-1.5 uppercase tracking-wider">
            DATOS GENERALES DEL TRABAJO Y UBICACIÓN
          </div>
          <div className="grid grid-cols-2 border-b border-slate-200">
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">CLIENTE / EMPRESA</span>
              <span className="font-extrabold text-sm text-slate-900">{data.empresa || '-'}</span>
            </div>
            <div className="p-3 flex flex-col gap-0.5 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">OBRA / UBICACIÓN EXACTA</span>
              <span className="font-extrabold text-sm text-slate-900">{data.obra || '-'}</span>
            </div>
          </div>
          <div className="grid grid-cols-4">
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">FECHA</span>
              <span className="font-extrabold text-sm text-slate-900">
                {data.fecha ? new Date(data.fecha).toLocaleDateString('es-AR') : '-'}
              </span>
            </div>
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">HORA INICIO</span>
              <span className="font-extrabold text-sm text-slate-900">{data.validezDesde || '-'} HS</span>
            </div>
            <div className="p-3 border-r border-slate-200 flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">HORA FIN</span>
              <span className="font-extrabold text-sm text-slate-900">{data.validezHasta || '-'} HS</span>
            </div>
            <div className="p-3 flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">TIPO DE TRABAJO</span>
              <span className="font-extrabold text-sm text-blue-700">{selectedTypeLabel}</span>
            </div>
          </div>
        </div>

        {/* Checklist Section */}
        {checklist.length > 0 && (
          <div className="mb-6 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <ShieldCheck size={20} className="text-blue-700" />
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                VERIFICACIÓN PREVENTIVA Y CONTROLES (CHECKLIST)
              </h3>
            </div>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[3fr_110px_2fr] bg-slate-100 p-2.5 border-b-2 border-slate-300 font-black text-[11px] text-slate-700 uppercase tracking-wider">
                <div>PREGUNTA / ITEM DE CONTROL</div>
                <div className="text-center">ESTADO</div>
                <div>OBSERVACIONES</div>
              </div>
              {checklist.map((item: any, idx: number) => {
                const isSI = item.estado === 'Cumple' || item.estado === 'SI';
                return (
                  <div
                    key={item.id || idx}
                    className={`grid grid-cols-[3fr_110px_2fr] gap-3 items-center p-2.5 border-b border-slate-200 page-break-inside-avoid ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 leading-snug">{item.pregunta}</div>
                    <div className="flex justify-center">
                      {isSI ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-lg text-xs font-black">
                          ✓ SI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-lg text-xs font-black">
                          ✗ NO
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-600">{item.observaciones || '-'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Personnel Section */}
        {personal.length > 0 && (
          <div className="mb-6 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-800">
              <Users size={20} className="text-blue-700" />
              <h3 className="text-xs font-black text-slate-900 m-0 uppercase tracking-wider">
                PERSONAL AUTORIZADO Y NOTIFICADO
              </h3>
            </div>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[40px_2fr_1.2fr_1.5fr] bg-slate-100 p-2.5 border-b-2 border-slate-300 font-black text-[11px] text-slate-700 uppercase tracking-wider">
                <div className="text-center">#</div>
                <div>NOMBRE Y APELLIDO</div>
                <div>DNI / LEGAJO</div>
                <div>FIRMA OPERADOR</div>
              </div>
              {personal.map((p: any, idx: number) => (
                <div
                  key={p.id || idx}
                  className={`grid grid-cols-[40px_2fr_1.2fr_1.5fr] gap-3 items-center p-2.5 border-b border-slate-200 page-break-inside-avoid ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                  }`}
                >
                  <div className="text-center font-black text-xs text-slate-400">{idx + 1}</div>
                  <div className="font-extrabold text-xs text-slate-900">{p.nombre || '-'}</div>
                  <div className="font-bold text-xs text-slate-700">{p.dni || '-'}</div>
                  <div className="flex items-center justify-center">
                    <div className="w-full h-8 border-b border-dashed border-slate-400 flex items-center justify-center">
                      <span className="text-[10px] text-slate-400 font-medium italic">Firma registrante</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Firmas y Aprobaciones */}
        <div className="mt-6 page-break-inside-avoid">
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
            } : null}
          />
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}