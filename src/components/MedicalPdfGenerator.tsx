import React from 'react';
import { HeartPulse, CheckCircle2, XCircle, AlertTriangle, Building2, User, Calendar, Shield, ArrowUpRight, Truck, Zap, QrCode, Stethoscope, AlertCircle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import { QRCodeSVG } from 'qrcode.react';
import type { MedicalRecord, MedicalExamType, MedicalFitnessVerdict } from '../types/medical';

interface MedicalPdfGeneratorProps {
  medicalData: Partial<MedicalRecord> | any;
  showSignatures?: { operator: boolean; supervisor: boolean; professional: boolean };
  pdfElementId?: string;
}

function resolveProfessional(data: any) {
  let actSignature = data?.professionalSignature || null;
  let actStamp = data?.professionalStamp || null;
  let actName = data?.professionalName || null;
  let actLic = data?.professionalLicense || null;
  let actTitle = data?.professionalTitle || null;

  if (!actSignature || !actName || !actStamp) {
    try {
      const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;
      const lsStamp = typeof window !== 'undefined' ? localStorage.getItem('signatureStampData') : null;
      const legacySig = typeof window !== 'undefined' ? localStorage.getItem('capturedSignature') : null;

      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        if (!actSignature && parsed.signature) actSignature = parsed.signature;
        if (!actStamp && parsed.stamp) actStamp = parsed.stamp;
      } else if (!actSignature && legacySig) {
        actSignature = legacySig;
      }

      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name || pd.fullName || null;
        actLic = actLic || pd.license || pd.matricula || null;
        actTitle = actTitle || pd.profession || pd.profesion || pd.title || null;
      }
    } catch {
      /* ignore */
    }
  }

  return { actSignature, actStamp, actName, actLic, actTitle };
}

export default function MedicalPdfGenerator({
  medicalData,
  showSignatures: propShowSignatures,
  pdfElementId = 'pdf-content'
}: MedicalPdfGeneratorProps) {
  if (!medicalData) return null;

  const data = medicalData;
  const showSignatures = data.showSignatures || propShowSignatures || {
    operator: true,
    supervisor: true,
    professional: true
  };
  const { actSignature, actStamp, actName, actLic, actTitle } = resolveProfessional(data);

  const now = new Date();
  const isExpired = data.expirationDate && new Date(data.expirationDate) < now;

  let resultLabel = 'APTO (A) · SIN RESTRICCIONES';
  let resultBg = 'bg-emerald-600';
  let resultBorderColor = 'border-emerald-300';
  let resultBoxBg = 'bg-emerald-50';

  if (data.result === 'no_apto') {
    resultLabel = 'NO APTO (D) · NO REÚNE CONDICIONES PSICOFÍSICAS';
    resultBg = 'bg-rose-600';
    resultBorderColor = 'border-rose-300';
    resultBoxBg = 'bg-rose-50';
  } else if (data.result === 'no_apto_temporario') {
    resultLabel = 'NO APTO TEMPORARIO (E) · CUADRO AGUDO EN TRATAMIENTO';
    resultBg = 'bg-indigo-600';
    resultBorderColor = 'border-indigo-300';
    resultBoxBg = 'bg-indigo-50';
  } else if (isExpired) {
    resultLabel = 'VENCIDO · REQUIERE RENOVACIÓN CLÍNICA OBLIGATORIA';
    resultBg = 'bg-rose-600';
    resultBorderColor = 'border-rose-300';
    resultBoxBg = 'bg-rose-50';
  } else if (data.result === 'apto_con_restricciones') {
    resultLabel = 'APTO CON RESTRICCIONES (C) · LIMITACIONES OPERATIVAS';
    resultBg = 'bg-amber-600';
    resultBorderColor = 'border-amber-300';
    resultBoxBg = 'bg-amber-50';
  } else if (data.result === 'apto_con_preexistencias' || data.result === 'preexistencias') {
    resultLabel = 'APTO CON PREEXISTENCIAS (B) · ASENTADAS ANTE A.R.T.';
    resultBg = 'bg-amber-600';
    resultBorderColor = 'border-amber-300';
    resultBoxBg = 'bg-amber-50';
  }

  const examTypeLabels: Record<string, string> = {
    preocupacional: 'Preocupacional o de Ingreso (Art. 2° Res. SRT 37/10)',
    periodico: 'Periódico de Salud Ocupacional / ESOP (Art. 3° Res. SRT 37/10)',
    transferencia: 'Previo a Transferencia de Actividad (Art. 4° Res. SRT 37/10)',
    cambio_tarea: 'Previo a Transferencia de Actividad (Art. 4° Res. SRT 37/10)',
    ausencia_prolongada: 'Posterior a Ausencia Prolongada (Art. 5° Res. SRT 37/10)',
    reincorporacion: 'Posterior a Ausencia Prolongada (Art. 5° Res. SRT 37/10)',
    egreso: 'De Egreso o Terminación Laboral (Art. 6° Res. SRT 37/10)'
  };

  const docId = data.id ? String(data.id).slice(-8).toUpperCase() : 'S/N';

  return (
    <div
      id={pdfElementId}
      className="pdf-container print-area bg-white text-slate-900 font-sans p-4 max-w-[800px] mx-auto shadow-none print:shadow-none print:p-0"
      style={{ boxSizing: 'border-box' }}
    >
      <style type="text/css" media="print">{`
        @page { size: A4 portrait; margin: 7mm 9mm; }
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .avoid-break, .pdf-signatures-wrapper, .pdf-brand-container {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      `}</style>

      {/* Encabezado Membretado Oficial */}
      <div
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className="flex items-center justify-between pb-2 border-b-2 border-slate-900 mb-2 avoid-break"
      >
        <div className="flex items-center gap-2.5">
          <CompanyLogo className="h-10 w-auto object-contain" />
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[6.5pt] font-black uppercase tracking-wider mb-0.5">
              <Stethoscope size={10} className="text-emerald-700" /> Medicina Laboral · Ley 19.587 · Res. S.R.T. N° 37/2010
            </div>
            <h1 className="text-sm font-black uppercase text-slate-900 tracking-tight m-0 leading-tight">
              CERTIFICADO DE APTITUD MÉDICA LABORAL
            </h1>
            <p className="text-[8pt] font-bold text-slate-500 uppercase tracking-wide m-0 leading-tight">
              Evaluación Psicofísica en Salud Ocupacional
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block bg-slate-900 text-white text-[9.5px] font-mono font-black px-2 py-0.5 rounded">
            REGISTRO Nº {docId}
          </span>
          <p className="text-[8pt] font-extrabold text-slate-600 m-0 mt-0.5">
            FECHA: {data.examDate ? new Date(data.examDate).toLocaleDateString('es-AR') : '-'}
          </p>
        </div>
      </div>

      {/* Banner de Resultado Clínico Principal */}
      <div
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className={`p-2 rounded-xl border-2 ${resultBorderColor} ${resultBoxBg} mb-2 flex items-center justify-between avoid-break`}
      >
        <div>
          <span className="text-[7.5pt] font-black text-slate-500 uppercase tracking-widest block leading-tight">
            DICTAMEN Y APTITUD MÉDICO-LABORAL FINAL (RES. SRT 37/10)
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`${resultBg} text-white font-black text-[10.5px] px-2.5 py-0.5 rounded-lg uppercase tracking-wide shadow-2xs`}>
              {resultLabel}
            </span>
          </div>
        </div>
        <div className="text-right border-l border-slate-300/80 pl-3">
          <span className="text-[7.5pt] font-extrabold text-slate-500 block uppercase leading-tight">VENCIMIENTO DE APTITUD</span>
          <span className={`text-xs font-black ${isExpired ? 'text-rose-600' : 'text-slate-900'}`}>
            {data.expirationDate ? new Date(data.expirationDate).toLocaleDateString('es-AR') : 'Sin fecha'}
          </span>
          {isExpired && (
            <span className="text-[6.5pt] font-bold text-rose-600 block uppercase leading-none">No Habilitado</span>
          )}
        </div>
      </div>

      {/* Datos Filiatorios del Trabajador, Empresa y Médico */}
      <div
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className="mb-2 border border-slate-300 rounded-xl overflow-hidden avoid-break"
      >
        <div className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
          <User size={10} /> 1. DATOS DEL TRABAJADOR, EMPRESA EMPLEADORA Y SERVICIO MÉDICO
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 p-2 text-xs bg-slate-50/60">
          <div>
            <span className="text-[7.5pt] font-black text-slate-400 uppercase block leading-none">Nombre y Apellido</span>
            <span className="font-black text-slate-900 text-[11px]">{data.workerName || '-'}</span>
          </div>
          <div>
            <span className="text-[7.5pt] font-black text-slate-400 uppercase block leading-none">C.U.I.L. / D.N.I.</span>
            <span className="font-extrabold font-mono text-slate-900 text-[11px]">{data.dni || '-'}</span>
          </div>
          <div>
            <span className="text-[7.5pt] font-black text-slate-400 uppercase block leading-none">Puesto / Función</span>
            <span className="font-extrabold text-slate-900 text-[11px]">{data.jobTitle || '-'}</span>
          </div>
          <div>
            <span className="text-[7.5pt] font-black text-slate-400 uppercase block leading-none">Razón Social Empleador</span>
            <span className="font-bold text-slate-800 text-[11px]">
              {data.company || '-'} {data.cuitEmpresa ? `(CUIT: ${data.cuitEmpresa})` : ''}
            </span>
          </div>
          <div>
            <span className="text-[7.5pt] font-black text-slate-400 uppercase block leading-none">Aseguradora (A.R.T.)</span>
            <span className="font-bold text-emerald-800 text-[11px]">{data.artNombre || 'A.R.T. Designada'}</span>
          </div>
          <div>
            <span className="text-[7.5pt] font-black text-slate-400 uppercase block leading-none">Tipo de Examen Practicado</span>
            <span className="font-bold text-slate-800 text-[10.5px] leading-tight block">{examTypeLabels[data.examType] || data.examType || '-'}</span>
          </div>
          <div className="col-span-2 border-t border-slate-200 pt-1">
            <span className="text-[7pt] font-black text-slate-400 uppercase block leading-none">Centro Evaluador / Clínica Laboral</span>
            <span className="font-bold text-slate-700 text-[10.5px]">{data.clinic || 'Servicio de Medicina del Trabajo Acreditado'}</span>
          </div>
          <div className="border-t border-slate-200 pt-1">
            <span className="text-[7pt] font-black text-slate-400 uppercase block leading-none">Médico Evaluador Otorgante</span>
            <span className="font-bold text-slate-900 text-[10.5px]">
              {data.doctor || 'Dr. Médico Laboral'} {data.doctorLicense ? `(Mat: ${data.doctorLicense})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Matriz de Habilitaciones Especiales para Tareas de Alto Riesgo */}
      <div
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className="mb-2 border border-slate-300 rounded-xl overflow-hidden avoid-break"
      >
        <div className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
          <Shield size={10} /> 2. HABILITACIONES CLÍNICAS PARA TAREAS DE ALTO RIESGO
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-2 bg-white">
          
          {/* Altura */}
          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between ${data.allowHeight ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight size={13} className={data.allowHeight ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-[10.5px] font-black text-slate-900 block leading-tight">Trabajo en Altura (&gt; 2.00 m)</span>
                <span className="text-[7pt] text-slate-500 font-medium leading-tight block">Res. SRT 61/23 · ECG sin arritmias/vértigo</span>
              </div>
            </div>
            <span className={`text-[7.5pt] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${data.allowHeight ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowHeight ? 'HABILITADO' : 'NO APTO'}
            </span>
          </div>

          {/* Confinados */}
          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between ${data.allowConfined ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-1.5">
              <Shield size={13} className={data.allowConfined ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-[10.5px] font-black text-slate-900 block leading-tight">Espacios Confinados</span>
                <span className="text-[7pt] text-slate-500 font-medium leading-tight block">Res. SRT 953/10 · Espirometría / Sin claustrofobia</span>
              </div>
            </div>
            <span className={`text-[7.5pt] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${data.allowConfined ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowConfined ? 'HABILITADO' : 'NO APTO'}
            </span>
          </div>

          {/* Maquinaria */}
          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between ${data.allowMachinery ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-1.5">
              <Truck size={13} className={data.allowMachinery ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-[10.5px] font-black text-slate-900 block leading-tight">Autoelevador / Clark / Maquinaria</span>
                <span className="text-[7pt] text-slate-500 font-medium leading-tight block">Dec. 351/79 · Psicotécnico / Agudeza visual</span>
              </div>
            </div>
            <span className={`text-[7.5pt] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${data.allowMachinery ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowMachinery ? 'HABILITADO' : 'NO APTO'}
            </span>
          </div>

          {/* Riesgo Eléctrico */}
          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between ${data.allowElectrical ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-1.5">
              <Zap size={13} className={data.allowElectrical ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-[10.5px] font-black text-slate-900 block leading-tight">Trabajos con Tensión / Riesgo Eléctrico</span>
                <span className="text-[7pt] text-slate-500 font-medium leading-tight block">Dec. 351/79 Cap. 14 · Visión cromática (Ishihara)</span>
              </div>
            </div>
            <span className={`text-[7.5pt] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${data.allowElectrical ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowElectrical ? 'HABILITADO' : 'NO APTO'}
            </span>
          </div>

        </div>
      </div>

      {/* Preexistencias y Restricciones Clínicas */}
      <div
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className="mb-2 border border-slate-300 rounded-xl overflow-hidden avoid-break"
      >
        <div className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle size={10} /> 3. PREEXISTENCIAS, RESTRICCIONES Y OBSERVACIONES CLÍNICAS
        </div>
        <div className="p-2 text-xs bg-slate-50/60 space-y-1">
          {data.preexistencias && (
            <div className="p-1.5 rounded bg-amber-50 border border-amber-200">
              <span className="text-[7pt] font-black uppercase text-amber-800 block">Patologías Preexistentes Declaradas:</span>
              <p className="m-0 text-amber-950 font-medium text-[10.5px]">{data.preexistencias}</p>
            </div>
          )}
          {data.restricciones && (
            <div className="p-1.5 rounded bg-rose-50 border border-rose-200">
              <span className="text-[7pt] font-black uppercase text-rose-800 block">Restricciones Operativas Indicadas:</span>
              <p className="m-0 text-rose-950 font-medium text-[10.5px]">{data.restricciones}</p>
            </div>
          )}
          <div>
            <span className="text-[7pt] font-black uppercase text-slate-500 block">Observaciones Médicas Generales:</span>
            <p className="m-0 text-slate-700 leading-snug font-medium text-[10.5px]">
              {data.notes ? data.notes : 'Sin observaciones clínicas particulares. El postulante/trabajador reúne las condiciones psicofísicas compatibles con las tareas del puesto.'}
            </p>
          </div>
        </div>
      </div>

      {/* Firmas Digitalizadas */}
      <div
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        className="avoid-break avoid-break-strictly break-inside-avoid pdf-signatures-wrapper"
      >
        <p className="text-[6.8pt] text-slate-500 text-center italic m-0 mb-0.5">
          El presente dictamen tiene validez médico-legal conforme a la Ley N° 19.587 y la Resolución S.R.T. N° 37/2010. El trabajador declara haber sido notificado de los resultados.
        </p>

        <PdfSignatures
          compact={true}
          hideFooter={true}
          data={{
            ...data,
            showSignatures,
            professionalSignature: actSignature,
            professionalStamp: actStamp,
            professionalName: actName,
            professionalLicense: actLic,
            professionalTitle: actTitle
          }}
          box1={showSignatures?.operator !== false ? {
            title: 'NOTIFICACIÓN DEL TRABAJADOR',
            subtitle: (data.workerName || 'FIRMA EN LUGAR / ACLARACIÓN').toUpperCase(),
            signatureUrl: data.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={showSignatures?.supervisor !== false ? {
            title: 'MÉDICO EVALUADOR LABORAL',
            subtitle: (data.doctor || 'FIRMA Y SELLO MÉDICO').toUpperCase(),
            signatureUrl: data.supervisorSignature || null,
            license: data.doctorLicense || null,
            isProfessional: false
          } : null}
          box3={showSignatures?.professional !== false ? {
            title: (actTitle || 'PROFESIONAL HIGIENE Y SEGURIDAD').toUpperCase(),
            subtitle: (actName || 'FIRMA Y SELLO PROFESIONAL').toUpperCase(),
            signatureUrl: actSignature || null,
            stampUrl: actStamp || null,
            isProfessional: true,
            license: actLic || null,
            profession: actTitle || null
          } : null}
        />
      </div>

      {/* Pie de página de marca */}
      <PdfBrandingFooter />
    </div>
  );
}

