import React from 'react';
import { ShieldCheck, FlaskConical } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

const GHS_CONFIG: Record<string, { icon: string; name: string }> = {
  explosive: { icon: '🧨', name: 'Explosivo' },
  flammable: { icon: '🔥', name: 'Inflamable' },
  oxidizing: { icon: '🔥', name: 'Comburente' },
  corrosive: { icon: '🧪', name: 'Corrosivo' },
  toxic: { icon: '💀', name: 'Tóxico' },
  harmful: { icon: '⚠️', name: 'Nocivo' },
  irritant: { icon: '⚠️', name: 'Irritante' },
  sensitizing: { icon: '🫁', name: 'Sensibilizante' },
  carcinogenic: { icon: '🫁', name: 'Carcinógeno' },
  environmental: { icon: '🌊', name: 'Ambiente' },
  pressure: { icon: '📦', name: 'Gas a Presión' }
};

const formatDateSafe = (dateVal: any): string => {
  if (!dateVal) return 'Sin especificar';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('es-AR');
  } catch (e) {
    return String(dateVal || 'Sin especificar');
  }
};

export default function ChemicalSafetyPdf({ data }: { data: any }): React.ReactElement | null {
  if (!data) return null;

  const formatFirstAid = (fa: any) => {
    if (!fa) return 'Sin especificar.';
    if (typeof fa === 'string') return fa;
    const parts = [];
    if (fa.inhalation) parts.push(`INHALACIÓN: ${fa.inhalation}`);
    if (fa.skin) parts.push(`PIEL: ${fa.skin}`);
    if (fa.eyes) parts.push(`OJOS: ${fa.eyes}`);
    if (fa.ingestion) parts.push(`INGESTIÓN: ${fa.ingestion}`);
    return parts.length > 0 ? parts.join(' | ') : 'Sin especificar.';
  };

  const formatPhrases = (phrases: any) => {
    if (!phrases) return 'Sin especificar.';
    if (Array.isArray(phrases)) return phrases.join(', ');
    return phrases;
  };

  return (
    <div className="w-full flex justify-center bg-white text-slate-900">
      <div
        id="pdf-content"
        className="pdf-container print-area w-full max-w-[210mm] min-h-0 h-auto p-[6mm_10mm] bg-white text-slate-900 box-border mx-auto font-sans"
        style={{ background: '#ffffff', color: '#0f172a' }}
      >
        <style type="text/css">
          {`
            @page { size: A4 portrait; margin: 4mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #ffffff !important; color: #0f172a !important; margin: 0 !important; padding: 0 !important; }
            .no-print { display: none !important; }
            .print-area {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 4mm 6mm !important;
              width: 100% !important;
              max-width: none !important;
              border-top: 8px solid #4338ca !important;
              border-radius: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
            }
            .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
            .avoid-break-strictly { page-break-inside: avoid !important; break-inside: avoid !important; }
          `}
        </style>

        {/* Encabezado Principal — Gradiente Azul/Púrpura Oscuro con Texto Blanco */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4338ca 100%)',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(67,56,202,0.15)'
          }}
          className="avoid-break"
        >
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>
              <FlaskConical size={26} color="#818cf8" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ color: '#ffffff', margin: 0, fontSize: '15pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', lineHeight: 1 }}>
                FICHA DE SEGURIDAD (SGA / GHS)
              </h1>
              <p style={{ color: '#c7d2fe', margin: '3px 0 0 0', fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                SISTEMA GLOBALMENTE ARMONIZADO — RES. SRT 801/15 & LEY 19.587
              </p>
            </div>
          </div>

          <div className="ml-4 shrink-0 text-right flex flex-col items-end gap-1">
            <CompanyLogo style={{ maxHeight: '38px', maxWidth: '120px', objectFit: 'contain' }} className="bg-white p-1.5 rounded-lg shadow-sm" />
            <div style={{ color: '#cbd5e1', fontSize: '0.5rem', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Doc. Controlado
            </div>
          </div>
        </div>

        {/* Producto Químico & Pictogramas GHS */}
        <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg flex justify-between items-center mb-3 avoid-break shadow-xs">
          <div className="flex-1">
            <span className="text-[0.58rem] font-black text-indigo-700 block uppercase tracking-wider">PRODUCTO / NOMBRE COMERCIAL</span>
            <h2 className="m-0 text-[1.3rem] font-black text-slate-900 uppercase mt-0.5">{data.name || 'Sin Especificar'}</h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[0.7rem] font-extrabold text-slate-700">CAS N°: <strong className="text-slate-900">{data.casNumber || 'N/A'}</strong></span>
              {data.unNumber && (
                <span className="text-[0.7rem] font-extrabold text-slate-700">UN N°: <strong className="text-slate-900">{data.unNumber}</strong></span>
              )}
            </div>
          </div>

          {data.pictograms && data.pictograms.length > 0 && (
            <div className="flex gap-2 items-center shrink-0 ml-3">
              {data.pictograms.map((p: string, idx: number) => {
                const picInfo = GHS_CONFIG[p] || { icon: '⚠️', name: p };
                return (
                  <div
                    key={idx}
                    title={picInfo.name}
                    style={{
                      border: '2.5px solid #dc2626',
                      width: '42px',
                      height: '42px',
                      transform: 'rotate(45deg)',
                      background: '#ffffff'
                    }}
                    className="flex items-center justify-center shadow-xs"
                  >
                    <span style={{ transform: 'rotate(-45deg)', fontSize: '1.4rem' }}>
                      {picInfo.icon}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Información Técnica en Grilla */}
        <div className="grid grid-cols-4 gap-2 mb-3 avoid-break">
          <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
            <span className="text-[0.58rem] font-extrabold block text-slate-500 mb-0.5 uppercase tracking-wider">PROVEEDOR</span>
            <span className="font-black text-[0.85rem] text-slate-900 block truncate">{data.supplier || 'No especificado'}</span>
          </div>

          <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
            <span className="text-[0.58rem] font-extrabold block text-slate-500 mb-0.5 uppercase tracking-wider">STOCK / CANTIDAD</span>
            <span className="font-black text-[0.85rem] text-slate-900 block">{data.quantity || '0'} {data.unit || 'L'}</span>
          </div>

          <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
            <span className="text-[0.58rem] font-extrabold block text-slate-500 mb-0.5 uppercase tracking-wider">UBICACIÓN EN PLANTA</span>
            <span className="font-black text-[0.85rem] text-slate-900 block truncate">{data.location || 'Sin especificar'}</span>
          </div>

          <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
            <span className="text-[0.58rem] font-extrabold block text-slate-500 mb-0.5 uppercase tracking-wider">VENCIMIENTO SDS</span>
            <span className="font-black text-[0.85rem] text-slate-900 block">{formatDateSafe(data.expiryDate || data.sdsDate)}</span>
          </div>
        </div>

        {/* Frases H y P */}
        <div className="border border-red-300 rounded-lg overflow-hidden mb-3 avoid-break">
          <div className="p-1.5 bg-red-700 text-white font-black text-[8pt] text-center uppercase tracking-wide">
            INDICACIONES DE PELIGRO (FRASES H) Y CONSEJOS DE PRUDENCIA (FRASES P)
          </div>
          <div className="p-2.5 bg-red-50/40 space-y-2">
            <div>
              <span className="font-black text-[7.5pt] block text-red-900 uppercase">⚠️ Indicaciones de Peligro (Frases H):</span>
              <p className="m-0 text-[8.5pt] text-slate-800 font-medium">
                {formatPhrases(data.hazardStatements || data.riskPhrases)}
              </p>
            </div>
            <div>
              <span className="font-black text-[7.5pt] block text-indigo-900 uppercase">🛡️ Consejos de Prudencia (Frases P):</span>
              <p className="m-0 text-[8.5pt] text-slate-800 font-medium">
                {formatPhrases(data.precautionaryStatements || data.safetyPhrases)}
              </p>
            </div>
          </div>
        </div>

        {/* Primeros Auxilios */}
        <div className="border border-emerald-300 bg-emerald-50 rounded-lg p-2.5 mb-3 avoid-break">
          <h3 className="m-0 text-[8.5pt] font-black text-emerald-900 flex items-center gap-1.5 uppercase tracking-tight mb-1">
            <ShieldCheck size={16} className="text-emerald-700" /> MEDIDAS DE PRIMEROS AUXILIOS
          </h3>
          <p className="m-0 text-[8.5pt] text-emerald-950 font-medium leading-relaxed">
            {formatFirstAid(data.firstAid)}
          </p>
        </div>

        {/* Bloque de Firmas y Pie de Página sin saltos de hoja */}
        <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="avoid-break avoid-break-strictly mt-2">
          <PdfSignatures
            data={data}
            box1={
              data.showSignatures?.operator !== false
                ? {
                    title: 'PERSONAL AFECTADO',
                    subtitle: 'Firma y Aclaración',
                    signatureUrl: data.operatorSignature || null,
                    isProfessional: false
                  }
                : null
            }
            box2={
              data.showSignatures?.professional !== false
                ? {
                    title: 'PROFESIONAL H&S',
                    subtitle: (data.professionalName || 'Firma de Especialista').toUpperCase(),
                    signatureUrl: data.professionalSignature || null,
                    stampUrl: data.professionalStamp || null,
                    isProfessional: true,
                    license: data.professionalLicense || null
                  }
                : null
            }
            box3={
              data.showSignatures?.supervisor !== false
                ? {
                    title: 'SUPERVISIÓN / CIERRE',
                    subtitle: 'Sello y Firma receptora',
                    signatureUrl: data.supervisorSignature || data.signature || null,
                    isProfessional: false
                  }
                : null
            }
          />

          <PdfBrandingFooter />

          <div className="text-center mt-2 text-[0.58rem] text-slate-400 border-t border-slate-200 pt-1.5 font-medium">
            FICHA TÉCNICA DE SEGURIDAD ELABORADA BAJO RESOLUCIÓN SRT 801/15 (SGA/GHS) | DEBE PERMANECER VISIBLE Y ACCESIBLE EN EL ÁREA DE TRABAJO.
          </div>
        </div>
      </div>
    </div>
  );
}