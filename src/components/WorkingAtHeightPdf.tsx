import React from 'react';
import { Users, ShieldCheck, HeartPulse, LifeBuoy } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

const RISK_FACTORS_MAP = {
  weather: 'Condiciones climáticas adversas',
  height: 'Altura superior a 2 metros',
  electrical: 'Riesgo eléctrico cercano',
  unstable: 'Superficies inestables',
  load: 'Cargas suspendidas',
  confined: 'Espacios confinados',
  heat: 'Estrés térmico'
};

const EQUIPMENT_MAP = {
  harness: 'Arnés de Seguridad de cuerpo completo',
  lanyard: 'Cabo de vida simple/doble con amortiguador',
  helmet: 'Casco con barboquejo',
  carabiner: 'Mosquetones de seguridad con cierre automático',
  rope: 'Cuerda de seguridad / Línea de vida vertical',
  anchor: 'Punto de anclaje certificado',
  sling: 'Eslinga de anclaje de cinta'
};

export default function WorkingAtHeightPdf({ data }: { data: any }): React.ReactElement | null {
  if (!data) return null;

  const sections = [
    { id: 'description', title: 'Descripción del Trabajo', icon: <Users size={18} />, value: data.workDescription },
    { id: 'department', title: 'Departamento / Área', icon: <ShieldCheck size={18} />, value: data.department },
    { id: 'medical', title: 'Aptitud Médica', icon: <HeartPulse size={18} />, value: data.medicalFitness ? 'Vigente' : 'No verificada' },
    { id: 'rescue', title: 'Plan de Rescate', icon: <LifeBuoy size={18} />, value: data.rescuePlan }
  ];

  // Map risk factors and equipment if they are IDs
  const hazards = Array.isArray(data.riskFactors)
    ? data.riskFactors.map((h) => RISK_FACTORS_MAP[h as keyof typeof RISK_FACTORS_MAP] || h)
    : data.hazards || [];

  return (
    <div className="w-full flex justify-center">
      <div
        id="pdf-content"
        className="pdf-container card print-area w-full max-w-[210mm] min-h-0 h-auto p-[10mm_14mm] bg-white text-slate-900 shadow-2xl rounded-xl box-border mx-auto font-sans"
      >
        <style type="text/css">
          {`
            @page { size: A4 portrait; margin: 8mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #ffffff !important; }
            .no-print { display: none !important; }
            .print-area {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 8mm !important;
              width: 100% !important;
              max-width: none !important;
              border-top: 10px solid #2563eb !important;
              border-radius: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
            }
            .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
            .avoid-break-strictly { page-break-inside: avoid !important; break-inside: avoid !important; }
          `}
        </style>

        {/* Encabezado Principal — Fondo de Gradiente Azul Oscuro Nítido con Texto Blanco Brillante */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 15px rgba(37,99,235,0.2)'
          }}
          className="avoid-break"
        >
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '10px', backdropFilter: 'blur(10px)' }}>
              <ShieldCheck size={28} color="#38bdf8" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ color: '#ffffff', margin: 0, fontSize: '18pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', lineHeight: 1 }}>
                PERMISO TRABAJO EN ALTURA
              </h1>
              <p style={{ color: '#93c5fd', margin: '5px 0 0 0', fontSize: '8.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                SISTEMA DE GESTIÓN DE SEGURIDAD (RES. SRT 61/23)
              </p>
            </div>
          </div>

          <div className="ml-5 shrink-0 text-right flex flex-col items-end gap-1">
            <CompanyLogo style={{ maxHeight: '45px', maxWidth: '140px', objectFit: 'contain' }} className="bg-white p-2 rounded-lg shadow-sm" />
            <div style={{ color: '#cbd5e1', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Doc. Controlado
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 avoid-break">
          <div className="border border-slate-200 rounded-xl p-3 bg-gradient-to-br from-slate-50 to-slate-100/70">
            <span className="text-[7.5pt] font-extrabold text-slate-500 block uppercase tracking-wider mb-1">TRABAJADOR</span>
            <span className="text-[10.5pt] font-black text-slate-900 block truncate">{data.workerName || 'N/A'}</span>
          </div>
          <div className="border border-slate-200 rounded-xl p-3 bg-gradient-to-br from-slate-50 to-slate-100/70">
            <span className="text-[7.5pt] font-extrabold text-slate-500 block uppercase tracking-wider mb-1">UBICACIÓN / SECTOR</span>
            <span className="text-[10.5pt] font-black text-slate-900 block truncate">{data.location || 'Planta General'}</span>
          </div>
          <div className="border border-slate-200 rounded-xl p-3 bg-gradient-to-br from-slate-50 to-slate-100/70">
            <span className="text-[7.5pt] font-extrabold text-slate-500 block uppercase tracking-wider mb-1">FECHA</span>
            <span className="text-[10.5pt] font-black text-slate-900 block">{data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}</span>
          </div>
          <div className="border border-slate-200 rounded-xl p-3 bg-gradient-to-br from-slate-50 to-slate-100/70">
            <span className="text-[7.5pt] font-extrabold text-slate-500 block uppercase tracking-wider mb-1">ALTURA ESTIMADA</span>
            <span className="text-[10.5pt] font-black text-slate-900 block">{data.height ? `${data.height} metros` : 'No especificada'}</span>
          </div>
        </div>

        {/* Core Safety Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 avoid-break">
          {sections.map((section) => (
            <div key={section.id} className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="text-blue-600">{section.icon}</div>
                <span className="font-extrabold text-[9pt] text-slate-800 uppercase">{section.title}</span>
              </div>
              <div className="text-[9.5pt] text-slate-700 whitespace-pre-wrap leading-relaxed">{section.value || 'No especificado'}</div>
            </div>
          ))}
        </div>

        {/* Hazards & Mitigation — Protegido con avoid-break-strictly para que no se corte por la mitad */}
        <div
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          className="avoid-break avoid-break-strictly mb-5 border border-slate-200 rounded-xl overflow-hidden bg-white"
        >
          <div
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#ffffff' }}
            className="p-3"
          >
            <h3 style={{ color: '#ffffff', margin: 0 }} className="text-[10pt] font-black uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={18} color="#38bdf8" /> ANÁLISIS DE RIESGOS Y EPP REQUERIDO
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/70">
            <div>
              <span className="text-[8pt] font-extrabold block text-slate-500 mb-2 uppercase tracking-wide">RIESGOS DETECTADOS</span>
              <div className="flex flex-wrap gap-2">
                {hazards.length > 0 ? (
                  hazards.map((h: string, i: number) => (
                    <span key={i} className="bg-red-100 border border-red-300 text-red-700 px-2.5 py-1 rounded-lg text-[8.5pt] font-bold">
                      {h}
                    </span>
                  ))
                ) : (
                  <span className="text-[9pt] text-slate-600 font-semibold">Trabajo en altura estándar.</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[8pt] font-extrabold block text-slate-500 mb-2 uppercase tracking-wide">EQUIPOS DE PROTECCIÓN (EPP)</span>
              <div className="grid grid-cols-1 gap-2">
                {['harness', 'lanyard', 'helmet', 'lifeline'].map((key) => {
                  const hasIt = data.ppe && data.ppe[key];
                  const labels = { harness: 'Arnés de Seguridad', lanyard: 'Cola de Amarre', helmet: 'Casco con Barbijo', lifeline: 'Línea de Vida' };
                  return (
                    <div
                      key={key}
                      style={{ background: hasIt ? '#f0fdf4' : '#ffffff', border: `1px solid ${hasIt ? '#86efac' : '#e2e8f0'}` }}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg"
                    >
                      <div
                        style={{ border: `2px solid ${hasIt ? '#16a34a' : '#cbd5e1'}`, background: hasIt ? '#16a34a' : '#fff' }}
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      >
                        {hasIt && <span className="text-white text-[10px] font-black">✓</span>}
                      </div>
                      <span style={{ fontWeight: hasIt ? 700 : 500, color: hasIt ? '#166534' : '#64748b' }} className="text-[8.5pt]">
                        {labels[key as keyof typeof labels]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <PdfSignatures
          data={data}
          box1={
            data.showSignatures?.operator !== false
              ? {
                  title: 'OPERADOR / TRABAJADOR',
                  subtitle: (data.workerName || 'Firma del Operador').toUpperCase(),
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
                  title: 'SUPERVISOR / AUTORIZANTE',
                  subtitle: (data.supervisor || 'Firma del Supervisor').toUpperCase(),
                  signatureUrl: data.supervisorSignature || data.signature || null,
                  isProfessional: false
                }
              : null
          }
        />

        <PdfBrandingFooter />
      </div>
    </div>
  );
}