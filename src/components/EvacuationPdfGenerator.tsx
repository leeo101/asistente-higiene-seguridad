import React from 'react';
import { Timer } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

const formatDateSafe = (dateVal: any): string => {
  if (!dateVal) return new Date().toLocaleDateString('es-AR');
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('es-AR');
    return d.toLocaleDateString('es-AR');
  } catch (e) {
    return new Date().toLocaleDateString('es-AR');
  }
};

export default function EvacuationPdfGenerator({ data }: { data: any }): React.ReactElement | null {
  if (!data) return null;

  // Safe fallback calculation so PDF content is NEVER blank or missing numbers
  const peopleCount = Number(data.peopleCount) || 1;
  const exitWidth = Number(data.exitWidth) || 1.2;
  const maxDistance = Number(data.maxDistance) || 30;
  const walkingSpeed = Number(data.walkingSpeed) || 1.2;
  const specificFlow = Number(data.specificFlow) || 1.3;

  const flowTime = data.flowTime || (exitWidth && specificFlow ? (peopleCount / (exitWidth * specificFlow)).toFixed(1) : '0');
  const travelTime = data.travelTime || (walkingSpeed ? (maxDistance / walkingSpeed).toFixed(1) : '0');
  const calculatedTime = data.calculatedTime || (Number(flowTime) + Number(travelTime)).toFixed(1);

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
              border-top: 8px solid #2563eb !important;
              border-radius: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
            }
            .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
            .avoid-break-strictly { page-break-inside: avoid !important; break-inside: avoid !important; }
          `}
        </style>

        {/* Encabezado Principal — Gradiente Azul Oscuro con Texto Blanco Nítido */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.15)'
          }}
          className="avoid-break"
        >
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>
              <Timer size={26} color="#38bdf8" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ color: '#ffffff', margin: 0, fontSize: '16pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', lineHeight: 1 }}>
                SIMULACIÓN DE EVACUACIÓN
              </h1>
              <p style={{ color: '#93c5fd', margin: '3px 0 0 0', fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                REPORTE TÉCNICO DE CÁLCULO DE TIEMPOS DE ESCAPE (NFPA 101)
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

        {/* Datos Principales */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex justify-between items-center mb-3 avoid-break shadow-xs">
          <div>
            <span className="text-[0.6rem] font-extrabold text-slate-500 block uppercase tracking-wider">SECTOR / EDIFICIO EVALUADO</span>
            <h2 className="m-0 text-[1.2rem] font-black text-slate-900 uppercase mt-0.5">{data.sector || 'Planta General'}</h2>
            {data.evaluator && (
              <span className="text-[0.7rem] font-semibold text-slate-600 block mt-0.5">
                Evaluador: <strong className="text-slate-900">{data.evaluator}</strong>
              </span>
            )}
          </div>
          <div className="text-right bg-white p-2 rounded border border-slate-200 shrink-0">
            <span className="text-[0.58rem] font-extrabold text-slate-500 block uppercase tracking-wider mb-0.5">FECHA DE EVALUACIÓN</span>
            <span className="font-extrabold text-slate-900 text-[0.95rem]">
              {formatDateSafe(data.date)}
            </span>
          </div>
        </div>

        {/* Parámetros de Cálculo */}
        <h3 className="m-0 text-[10pt] font-black border-b-2 border-slate-800 pb-0.5 text-slate-900 mb-2 uppercase tracking-tight avoid-break">
          1. PARÁMETROS DE CÁLCULO UTILIZADOS
        </h3>
        <div className="grid grid-cols-4 gap-2 mb-3 avoid-break">
          <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
            <span className="text-[0.58rem] font-extrabold block text-slate-500 mb-0.5 uppercase tracking-wider">POBLACIÓN (N)</span>
            <span className="font-black text-[1rem] text-slate-900">{peopleCount} <span className="text-[0.68rem] font-bold text-slate-500">pers.</span></span>
          </div>
          <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
            <span className="text-[0.58rem] font-extrabold block text-slate-500 mb-0.5 uppercase tracking-wider">ANCHO SALIDAS (A)</span>
            <span className="font-black text-[1rem] text-slate-900">{exitWidth} <span className="text-[0.68rem] font-bold text-slate-500">m</span></span>
          </div>
          <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
            <span className="text-[0.58rem] font-extrabold block text-slate-500 mb-0.5 uppercase tracking-wider">DISTANCIA MÁX. (D)</span>
            <span className="font-black text-[1rem] text-slate-900">{maxDistance} <span className="text-[0.68rem] font-bold text-slate-500">m</span></span>
          </div>
          <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
            <span className="text-[0.58rem] font-extrabold block text-slate-500 mb-0.5 uppercase tracking-wider">VELOCIDAD (V)</span>
            <span className="font-black text-[1rem] text-slate-900">{walkingSpeed} <span className="text-[0.68rem] font-bold text-slate-500">m/s</span></span>
          </div>
        </div>

        {/* Resultados del Cálculo — Protegido de saltos */}
        <h3 className="m-0 text-[10pt] font-black border-b-2 border-slate-800 pb-0.5 text-slate-900 mb-2 uppercase tracking-tight avoid-break">
          2. RESULTADOS DEL CÁLCULO TEÓRICO
        </h3>
        <div
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          className="avoid-break avoid-break-strictly bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3 flex flex-col gap-2"
        >
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-1.5">
            <span className="font-bold text-[8.5pt] text-slate-700">Tiempo de Desplazamiento Teórico (D / V)</span>
            <span className="font-black text-[9.5pt] text-slate-900">{travelTime} seg</span>
          </div>

          <div className="flex justify-between border-b border-dashed border-slate-300 pb-1.5">
            <span className="font-bold text-[8.5pt] text-slate-700">Tiempo de Paso por Puertas / Salidas (N / (A · k))</span>
            <span className="font-black text-[9.5pt] text-slate-900">{flowTime} seg</span>
          </div>

          <div className="flex justify-between items-center mt-0.5 p-2.5 bg-emerald-50 rounded-lg border border-emerald-300">
            <div>
              <span className="font-black text-[10pt] uppercase text-emerald-800 block">Tiempo Total de Evacuación Estimado</span>
              <span className="text-[0.68rem] text-emerald-700 font-bold block mt-0.5">
                (~{((Number(calculatedTime) || 0) / 60).toFixed(1)} minutos requeridos para vaciar el sector)
              </span>
            </div>
            <span className="font-black text-[1.5rem] text-emerald-600 shrink-0">
              {calculatedTime} <span className="text-xs font-bold">seg</span>
            </span>
          </div>
        </div>

        {/* Conclusiones y Observaciones — Protegido */}
        <h3 className="m-0 text-[10pt] font-black border-b-2 border-slate-800 pb-0.5 text-slate-900 mb-2 uppercase tracking-tight avoid-break">
          3. CONCLUSIONES Y RECOMENDACIONES
        </h3>
        <div
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          className="avoid-break avoid-break-strictly mb-3 border border-slate-200 rounded-lg p-2.5 min-h-[50px] bg-white"
        >
          <p className="m-0 text-[8.5pt] text-slate-700 leading-relaxed">
            {data.observations || 'El tiempo de evacuación teórico resultante cumple con los parámetros aceptables de dinámica de fluidos y movimiento peatonal según NFPA 101. Se recomienda realizar simulacros de evacuación prácticos periódicos para validar los tiempos en campo.'}
          </p>
        </div>

        {/* Bloque de Firmas y Pie de Página — Protegidos en Bloque sin cortes */}
        <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }} className="avoid-break avoid-break-strictly mt-2">
          <PdfSignatures
            data={data}
            box1={
              data.showSignatures?.operator !== false
                ? {
                    title: 'EVALUADOR TÉCNICO',
                    subtitle: (data.evaluator || 'Firma del Evaluador').toUpperCase(),
                    signatureUrl: data.evaluatorSignature || data.signatures?.evaluator || null,
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
                    title: 'RESPONSABLE SECTOR',
                    subtitle: 'Firma de Responsable',
                    signatureUrl: data.supervisorSignature || data.signatures?.manager || null,
                    isProfessional: false
                  }
                : null
            }
          />

          <PdfBrandingFooter />

          <div className="text-center mt-2 text-[0.6rem] text-slate-400 border-t border-slate-200 pt-1.5 font-medium">
            Documento elaborado por Asistente H&S | Simulador teórico de evacuación basado en la Guía NFPA 101 y normas técnicas de higiene y seguridad.
          </div>
        </div>
      </div>
    </div>
  );
}