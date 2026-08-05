import React from 'react';
import { ShieldCheck, HeartPulse, LifeBuoy, User, MapPin, Calendar, Ruler, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

const WORK_TYPE_NAMES: Record<string, string> = {
  scaffolding: 'Andamios',
  ladder: 'Escalera',
  roof: 'Techos',
  platform: 'Plataforma Elevadora',
  lift: 'Elevador / Grúa',
  structure: 'Estructura Metálica'
};

const PRIORITY_NAMES: Record<string, string> = {
  critical: 'CRÍTICA',
  high: 'ALTA',
  medium: 'MEDIA',
  low: 'BAJA'
};

export default function WorkingAtHeightPdf({ data }: { data: any }): React.ReactElement | null {
  if (!data) return null;

  const workTypeName = WORK_TYPE_NAMES[data.workType] || data.workType || 'No especificado';
  const priorityName = PRIORITY_NAMES[data.priority] || data.priority || 'MEDIA';

  return (
    <div className="w-full flex justify-center">
      <div
        id="pdf-content"
        className="pdf-container card print-area w-full max-w-[210mm] min-h-0 h-auto p-[6mm_10mm] bg-white text-slate-900 shadow-xl rounded-xl box-border mx-auto font-sans"
      >
        <style type="text/css">
          {`
            @page { size: A4 portrait; margin: 5mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
            .no-print { display: none !important; }
            .print-area {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 5mm 8mm !important;
              width: 100% !important;
              max-width: none !important;
              border-top: 6px solid #d97706 !important;
              border-radius: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
            }
            .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          `}
        </style>

        {/* Encabezado Principal Premium */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #d97706 100%)',
            color: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)'
          }}
          className="avoid-break"
        >
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px', borderRadius: '8px', backdropFilter: 'blur(8px)' }}>
              <ShieldCheck size={26} color="#fbbf24" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ color: '#ffffff', margin: 0, fontSize: '16pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                PERMISO DE TRABAJO EN ALTURA
              </h1>
              <p style={{ color: '#fde68a', margin: '4px 0 0 0', fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                SEGURIDAD Y SALUD EN EL TRABAJO • RES. SRT 61/23 (OSHA 1926.501)
              </p>
            </div>
          </div>

          <div className="ml-4 shrink-0 text-right flex flex-col items-end gap-1">
            <CompanyLogo style={{ maxHeight: '40px', maxWidth: '130px', objectFit: 'contain' }} className="bg-white p-1.5 rounded-md shadow-sm" />
            <div style={{ color: '#e2e8f0', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              DOCUMENTO CONTROLADO
            </div>
          </div>
        </div>

        {/* Grilla Principal de Datos Generales */}
        <div className="grid grid-cols-4 gap-2.5 mb-4 avoid-break">
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
            <span className="text-[7pt] font-extrabold text-slate-500 block uppercase tracking-wider mb-0.5">TRABAJADOR</span>
            <span className="text-[9.5pt] font-black text-slate-900 block truncate">{data.workerName || 'N/A'}</span>
          </div>
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
            <span className="text-[7pt] font-extrabold text-slate-500 block uppercase tracking-wider mb-0.5">TIPO DE TRABAJO</span>
            <span className="text-[9.5pt] font-black text-amber-700 block truncate">{workTypeName}</span>
          </div>
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
            <span className="text-[7pt] font-extrabold text-slate-500 block uppercase tracking-wider mb-0.5">UBICACIÓN / SECTOR</span>
            <span className="text-[9.5pt] font-black text-slate-900 block truncate">{data.location || 'Planta General'}</span>
          </div>
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
            <span className="text-[7pt] font-extrabold text-slate-500 block uppercase tracking-wider mb-0.5">FECHA Y ALTURA</span>
            <span className="text-[9.5pt] font-black text-slate-900 block">
              {data.height ? `${data.height}m` : '3.5m'} • {data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>

        {/* Sección Seguridad y Salud: Apto Médico, Supervisor y Prioridad */}
        <div className="grid grid-cols-3 gap-2.5 mb-4 avoid-break">
          <div style={{ background: data.medicalFitness ? '#f0fdf4' : '#fff5f5', border: `1px solid ${data.medicalFitness ? '#86efac' : '#fca5a5'}` }} className="rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[7pt] font-extrabold block text-slate-500 uppercase tracking-wider">APTO MÉDICO VIGENTE</span>
              <span style={{ color: data.medicalFitness ? '#166534' : '#991b1b' }} className="text-[9pt] font-black uppercase">
                {data.medicalFitness ? '✓ HABILITADO' : '✕ NO HABILITADO'}
              </span>
            </div>
            <div style={{ background: data.medicalFitness ? '#16a34a' : '#dc2626' }} className="w-6 h-6 rounded-md flex items-center justify-center text-white font-black text-xs">
              {data.medicalFitness ? '✓' : '✕'}
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
            <span className="text-[7pt] font-extrabold text-slate-500 block uppercase tracking-wider mb-0.5">SUPERVISOR A CARGO</span>
            <span className="text-[9pt] font-black text-slate-900 block truncate">{data.supervisor || 'No designado'}</span>
          </div>

          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
            <span className="text-[7pt] font-extrabold text-slate-500 block uppercase tracking-wider mb-0.5">NIVEL DE RIESGO</span>
            <span className="text-[9pt] font-black text-amber-600 block uppercase">{priorityName}</span>
          </div>
        </div>

        {/* Análisis de Equipos de Protección Personal (EPP) e Inspección */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 avoid-break">
          <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff' }} className="px-3 py-2">
            <h3 style={{ color: '#ffffff', margin: 0 }} className="text-[8.5pt] font-black uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={16} color="#fbbf24" /> INSPECCIÓN DE EQUIPOS Y EPP REQUERIDOS
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/50">
            {/* Inspección de Equipos */}
            <div>
              <span className="text-[7.5pt] font-extrabold block text-slate-500 mb-1.5 uppercase tracking-wide">ESTADO DE EQUIPOS DE SEGURIDAD</span>
              <div className="space-y-1">
                {[
                  { label: 'Arnés de Seguridad', status: data.equipmentCheck?.harness || 'good' },
                  { label: 'Cola de Amarre / Amortiguador', status: data.equipmentCheck?.lanyard || 'good' },
                  { label: 'Punto de Anclaje Certificado', status: data.equipmentCheck?.anchor || 'good' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1 rounded border border-slate-200 text-[8pt]">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className={`font-black text-[7.5pt] px-2 py-0.5 rounded ${item.status === 'good' ? 'bg-emerald-100 text-emerald-800' : item.status === 'bad' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
                      {item.status === 'good' ? '✓ BUENO' : item.status === 'bad' ? '✕ MALO' : '— N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* EPP Requeridos */}
            <div>
              <span className="text-[7.5pt] font-extrabold block text-slate-500 mb-1.5 uppercase tracking-wide">EQUIPOS DE PROTECCIÓN (EPP)</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'harness', label: 'Arnés Completo' },
                  { key: 'lanyard', label: 'Cola de Amarre' },
                  { key: 'helmet', label: 'Casco c/ Barbijo' },
                  { key: 'lifeline', label: 'Línea de Vida' }
                ].map(({ key, label }) => {
                  const req = data.ppe && data.ppe[key];
                  return (
                    <div key={key} style={{ background: req ? '#f0fdf4' : '#fff5f5', border: `1px solid ${req ? '#86efac' : '#fca5a5'}` }} className="flex items-center justify-between px-2 py-1 rounded">
                      <span style={{ color: req ? '#166534' : '#991b1b' }} className="text-[7.5pt] font-bold truncate">{label}</span>
                      <span style={{ background: req ? '#16a34a' : '#dc2626' }} className="text-white text-[7pt] font-black px-1.5 py-0.2 rounded">
                        {req ? '✓' : '✕'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Observaciones si existen */}
        {data.observations && (
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 mb-4 avoid-break">
            <span className="text-[7pt] font-extrabold text-slate-500 block uppercase tracking-wider mb-0.5">OBSERVACIONES Y DETALLES OPERATIVOS</span>
            <p className="m-0 text-[8.5pt] font-medium text-slate-800 leading-snug">{data.observations}</p>
          </div>
        )}

        {/* Firmas Digitales Oficiales */}
        <div className="avoid-break mt-2">
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
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}