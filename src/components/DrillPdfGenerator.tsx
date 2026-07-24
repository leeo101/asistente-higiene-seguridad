import React, { useRef } from 'react';
import { ArrowLeft, Printer, Calendar, Clock, Users, Flame, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function DrillPdfGenerator({ report, onBack, isHeadless = false }: { report: any; onBack?: any; isHeadless?: boolean; }): React.ReactElement | null {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = document.getElementById('pdf-content');
    if (el) {
      document.body.classList.add('printing-isolated');
      el.classList.add('isolated-print-target');
    }
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-isolated');
      if (el) el.classList.remove('isolated-print-target');
    }, 1000);
  };

  return (
    <div className="container max-w-5xl mx-auto pb-12 min-h-screen flex flex-col pt-4">
      {/* Header controls (not printed) */}
      {!isHeadless && (
        <div className="no-print flex items-center justify-between mb-6 z-10 flex-wrap gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack} 
              className="p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 cursor-pointer rounded-2xl text-slate-700 dark:text-slate-200 hover:scale-105 transition-all shadow-xs"
              title="Volver"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="m-0 text-xl font-black text-slate-900 dark:text-slate-100">Previsualización del Acta de Simulacro</h1>
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400 font-medium">Documento oficial de trazabilidad EHS</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handlePrint} 
              className="flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-red-600 via-amber-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white border-none rounded-2xl font-black cursor-pointer shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all text-sm"
            >
              <Printer size={18} /> Imprimir / Exportar PDF
            </button>
          </div>
        </div>
      )}

      {/* Printable Document Area */}
      <div className="flex-1 flex justify-center">
        <div
          id="pdf-content"
          className="pdf-container card print-area w-full max-w-[210mm] min-h-[297mm] p-[15mm_20mm] bg-white text-slate-900 shadow-2xl rounded-2xl box-border font-sans"
          ref={componentRef}
        >
          <style type="text/css" media="print">
            {`
              @page { size: A4 portrait; margin: 10mm; }
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #ffffff !important; }
              .no-print { display: none !important; }
              .print-area {
                box-shadow: none !important;
                margin: 0 !important;
                padding: 10mm !important;
                width: 100% !important;
                max-width: none !important;
                border: none !important;
                border-radius: 0 !important;
                background: #ffffff !important;
                color: #0f172a !important;
              }
              .avoid-break, .break-inside-avoid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            `}
          </style>

          {/* Document Header */}
          <div className="border-b-[3px] border-slate-800 pb-4 mb-6 flex justify-between items-start">
            <div className="flex-1">
              <h1 className="m-0 mb-1 text-[20pt] text-slate-900 font-black uppercase tracking-tight">
                ACTA DE SIMULACRO DE EVACUACIÓN
              </h1>
              <div className="flex gap-4 text-slate-600 text-[10pt] font-semibold">
                <span className="flex items-center gap-1"><strong>Empresa:</strong> {report?.empresa || 'N/A'}</span>
                <span className="flex items-center gap-1"><strong>Fecha:</strong> {report?.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : 'N/A'}</span>
              </div>
            </div>
            <CompanyLogo style={{ maxHeight: '48px', maxWidth: '140px', objectFit: 'contain' }} />
          </div>

          <p className="text-[10pt] text-slate-700 text-justify mb-6 leading-relaxed">
            En cumplimiento con la legislación vigente en materia de Higiene y Seguridad Laboral (Ley 19.587 / Res. 343/11) 
            y el Plan de Contingencias de la organización, se certifica la realización práctica del simulacro de evacuación, 
            registrándose los siguientes parámetros operativos y de respuesta humana.
          </p>

          {/* Hipótesis and Timing Grid */}
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="avoid-break break-inside-avoid flex gap-4 mb-6">
            <div className="flex-1 border border-slate-300 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="bg-slate-100 p-2.5 px-3 font-bold border-b border-slate-300 text-[10pt] flex items-center gap-2 text-slate-900 uppercase tracking-wide">
                <Flame size={16} className="text-amber-600" /> Hipótesis del Evento
              </div>
              <div className="p-3 text-[10pt] text-slate-800">
                <div className="mb-2"><strong>Tipo de Emergencia:</strong> {report?.hipotesis || 'N/A'}</div>
                <div className="mb-2"><strong>Sector / Foco:</strong> {report?.origen || 'N/A'}</div>
                <div><strong>Hora de Alarma:</strong> {report?.hora || '--:--'} hs</div>
              </div>
            </div>

            <div className="flex-1 border border-slate-300 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="bg-slate-100 p-2.5 px-3 font-bold border-b border-slate-300 text-[10pt] flex items-center gap-2 text-slate-900 uppercase tracking-wide">
                <Clock size={16} className="text-blue-600" /> Despliegue Temporal
              </div>
              <div className="p-3 text-center">
                <div className="text-[8.5pt] text-slate-500 uppercase font-bold tracking-wider">Tiempo Total Evacuación</div>
                <div className="text-[28pt] font-black text-rose-600 leading-none my-1">
                  {report?.tiempoVisual || '00:00'}
                </div>
                <div className="text-[8.5pt] text-slate-600 font-semibold">Minutos : Segundos</div>
              </div>
            </div>
          </div>

          {/* Población y Estadísticas */}
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="avoid-break break-inside-avoid mb-6 border border-slate-300 rounded-xl overflow-hidden bg-slate-50/50">
            <div className="bg-slate-100 p-2.5 px-3 font-bold border-b border-slate-300 text-[10pt] text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <Users size={16} className="text-purple-600" /> Población y Estadísticas
            </div>
            <div className="p-3 grid grid-cols-2 gap-3 text-[10pt]">
              <div><strong>Personas Evacuadas:</strong> <span className="text-[12pt] font-black text-slate-900">{report?.evacuados || '-'}</span></div>
              <div><strong>Heridos Simulados:</strong> <span style={{ color: (report?.heridosSimulados || 0) > 0 ? '#dc2626' : '#0f172a' }} className="text-[12pt] font-black">{report?.heridosSimulados || '0'}</span></div>
              <div className="col-span-2 mt-1">
                <strong>Puntos de Encuentro Utilizados:</strong>
                <p className="m-0 mt-1 bg-white p-2.5 border-l-4 border-slate-400 rounded-r-lg text-slate-700 min-h-[30px] font-medium">
                  {report?.puntosEncuentro || 'No registrados'}
                </p>
              </div>
            </div>
          </div>

          {/* Evaluación Checklist */}
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="avoid-break break-inside-avoid mb-6">
            <div className="font-bold text-[11pt] text-slate-900 border-b-2 border-slate-300 pb-1 mb-3 uppercase tracking-wide">
              EVALUACIÓN DEL DESEMPEÑO
            </div>
            <table className="w-full border-collapse text-[10pt]">
              <tbody>
                <tr className="border border-slate-300">
                  <td className="p-2.5 bg-slate-50 font-medium w-[65%] border-r border-slate-300">¿La alarma fue perfectamente audible en todos los sectores afectados?</td>
                  <td className="p-2.5 font-black text-center text-slate-900">
                    {report?.alarmaSonó === 'Sí' ? 'SÍ, Audible' : report?.alarmaSonó || '-'}
                  </td>
                </tr>
                <tr className="border border-slate-300">
                  <td className="p-2.5 bg-slate-50 font-medium w-[65%] border-r border-slate-300">¿Se cumplieron los roles de emergencia (guías, líderes de encuentro)?</td>
                  <td className="p-2.5 font-black text-center text-slate-900">
                    {report?.rolCumplido || '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Observaciones */}
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="avoid-break break-inside-avoid mb-8">
            <div className="font-bold text-[11pt] text-slate-900 border-b-2 border-slate-300 pb-1 mb-3 uppercase tracking-wide">
              OBSERVACIONES Y OPORTUNIDADES DE MEJORA
            </div>
            <div className="border border-amber-300 rounded-xl p-3.5 min-h-[90px] text-[10pt] bg-amber-50/60 text-amber-950 leading-relaxed font-medium">
              {report?.observaciones ? report.observaciones : 'No se registraron observaciones o desvíos técnicos durante el ejercicio.'}
            </div>
          </div>

          {/* Signatures Area (Anti-Cut Protected) */}
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="avoid-break break-inside-avoid mt-6">
            <PdfSignatures
              data={report}
              box1={report?.showSignatures?.operator !== false ? {
                title: 'RESPONSABLE EVACUACIÓN',
                subtitle: 'Brigada / Responsable',
                signatureUrl: report?.operatorSignature || null,
                isProfessional: false
              } : null}
              box2={report?.showSignatures?.professional !== false ? {
                title: 'PROFESIONAL H&S',
                subtitle: (report?.professionalName || 'Firma de Especialista').toUpperCase(),
                signatureUrl: report?.professionalSignature || null,
                stampUrl: report?.professionalStamp || null,
                isProfessional: true,
                license: report?.professionalLicense || null
              } : null}
              box3={report?.showSignatures?.supervisor !== false ? {
                title: 'SUPERVISIÓN / CIERRE',
                subtitle: 'Aprobación de Simulacro',
                signatureUrl: report?.supervisorSignature || report?.signature || null,
                isProfessional: false
              } : null} 
            />
            <PdfBrandingFooter />
          </div>

        </div>
      </div>
    </div>
  );
}