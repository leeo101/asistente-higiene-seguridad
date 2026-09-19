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
}

export default function MedicalPdfGenerator({
  medicalData,
  showSignatures = { operator: true, supervisor: true, professional: true }
}: MedicalPdfGeneratorProps) {
  if (!medicalData) return null;

  const data = medicalData;
  const now = new Date();
  const isExpired = data.expirationDate && new Date(data.expirationDate) < now;

  let resultLabel = 'APTO (A) · SIN RESTRICCIONES';
  let resultBg = 'bg-emerald-600';
  let resultTextColor = 'text-emerald-700';
  let resultBorderColor = 'border-emerald-300';
  let resultBoxBg = 'bg-emerald-50';

  if (data.result === 'no_apto') {
    resultLabel = 'NO APTO (D) · NO REÚNE CONDICIONES PSICOFÍSICAS';
    resultBg = 'bg-rose-600';
    resultTextColor = 'text-rose-700';
    resultBorderColor = 'border-rose-300';
    resultBoxBg = 'bg-rose-50';
  } else if (data.result === 'no_apto_temporario') {
    resultLabel = 'NO APTO TEMPORARIO (E) · CUADRO AGUDO EN TRATAMIENTO';
    resultBg = 'bg-indigo-600';
    resultTextColor = 'text-indigo-700';
    resultBorderColor = 'border-indigo-300';
    resultBoxBg = 'bg-indigo-50';
  } else if (isExpired) {
    resultLabel = 'VENCIDO · REQUIERE RENOVACIÓN CLÍNICA OBLIGATORIA';
    resultBg = 'bg-rose-600';
    resultTextColor = 'text-rose-700';
    resultBorderColor = 'border-rose-300';
    resultBoxBg = 'bg-rose-50';
  } else if (data.result === 'apto_con_restricciones') {
    resultLabel = 'APTO CON RESTRICCIONES (C) · LIMITACIONES OPERATIVAS';
    resultBg = 'bg-amber-600';
    resultTextColor = 'text-amber-700';
    resultBorderColor = 'border-amber-300';
    resultBoxBg = 'bg-amber-50';
  } else if (data.result === 'apto_con_preexistencias' || data.result === 'preexistencias') {
    resultLabel = 'APTO CON PREEXISTENCIAS (B) · ASENTADAS ANTE A.R.T.';
    resultBg = 'bg-amber-600';
    resultTextColor = 'text-amber-700';
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
  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/worker-portal/${data.dni}` : `https://asistentehs.com/worker-portal/${data.dni}`;

  return (
    <div
      id="pdf-content"
      className="bg-white text-slate-900 font-sans p-8 max-w-[800px] mx-auto shadow-none print:shadow-none print:p-0"
      style={{ minHeight: '1050px', boxSizing: 'border-box' }}
    >
      {/* Encabezado Membretado Oficial */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-4">
        <div className="flex items-center gap-3">
          <CompanyLogo className="h-12 w-auto object-contain" />
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[7pt] font-black uppercase tracking-wider mb-0.5">
              <Stethoscope size={11} className="text-emerald-700" /> Medicina Laboral · Ley 19.587 · Res. S.R.T. N° 37/2010
            </div>
            <h1 className="text-base font-black uppercase text-slate-900 tracking-tight m-0">
              CERTIFICADO DE APTITUD MÉDICA LABORAL
            </h1>
            <p className="text-[9.5pt] font-bold text-slate-500 uppercase tracking-wide m-0">
              Evaluación Psicofísica en Salud Ocupacional
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block bg-slate-900 text-white text-[10px] font-mono font-black px-2.5 py-1 rounded">
            REGISTRO Nº {docId}
          </span>
          <p className="text-[9pt] font-extrabold text-slate-600 m-0 mt-1">
            FECHA: {data.examDate ? new Date(data.examDate).toLocaleDateString('es-AR') : '-'}
          </p>
        </div>
      </div>

      {/* Banner de Resultado Clínico Principal */}
      <div className={`p-4 rounded-xl border-2 ${resultBorderColor} ${resultBoxBg} mb-4 flex items-center justify-between`}>
        <div>
          <span className="text-[9pt] font-black text-slate-500 uppercase tracking-widest block">
            DICTAMEN Y APTITUD MÉDICO-LABORAL FINAL (RES. SRT 37/10)
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`${resultBg} text-white font-black text-xs px-3 py-1 rounded-lg uppercase tracking-wide shadow-2xs`}>
              {resultLabel}
            </span>
          </div>
        </div>
        <div className="text-right border-l border-slate-300/80 pl-4">
          <span className="text-[9pt] font-extrabold text-slate-500 block uppercase">VENCIMIENTO DE APTITUD</span>
          <span className={`text-sm font-black ${isExpired ? 'text-rose-600' : 'text-slate-900'}`}>
            {data.expirationDate ? new Date(data.expirationDate).toLocaleDateString('es-AR') : 'Sin fecha'}
          </span>
          {isExpired && (
            <span className="text-[7.5pt] font-bold text-rose-600 block uppercase">No Habilitado</span>
          )}
        </div>
      </div>

      {/* Datos Filiatorios del Trabajador y Empresa */}
      <div className="mb-4 border border-slate-300 rounded-xl overflow-hidden">
        <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-wider flex items-center gap-2">
          <User size={12} /> 1. DATOS DEL TRABAJADOR Y EMPRESA EMPLEADORA
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 text-xs bg-slate-50/60">
          <div>
            <span className="text-[9pt] font-black text-slate-400 uppercase block">Nombre y Apellido</span>
            <span className="font-black text-slate-900 text-sm">{data.workerName || '-'}</span>
          </div>
          <div>
            <span className="text-[9pt] font-black text-slate-400 uppercase block">C.U.I.L. / D.N.I.</span>
            <span className="font-extrabold font-mono text-slate-900">{data.dni || '-'}</span>
          </div>
          <div>
            <span className="text-[9pt] font-black text-slate-400 uppercase block">Puesto / Función</span>
            <span className="font-extrabold text-slate-900">{data.jobTitle || '-'}</span>
          </div>
          <div>
            <span className="text-[9pt] font-black text-slate-400 uppercase block">Razón Social Empleador</span>
            <span className="font-bold text-slate-800">{data.company || '-'}</span>
          </div>
          <div>
            <span className="text-[9pt] font-black text-slate-400 uppercase block">Aseguradora (A.R.T.)</span>
            <span className="font-bold text-emerald-800">{data.artNombre || 'A.R.T. Designada'}</span>
          </div>
          <div>
            <span className="text-[9pt] font-black text-slate-400 uppercase block">Tipo de Examen Practicado</span>
            <span className="font-bold text-slate-800">{examTypeLabels[data.examType] || data.examType || '-'}</span>
          </div>
          <div className="sm:col-span-3 border-t border-slate-200 pt-1.5">
            <span className="text-[8pt] font-black text-slate-400 uppercase block">Centro Evaluador / Clínica Laboral</span>
            <span className="font-medium text-slate-700">{data.clinic || 'Servicio de Medicina del Trabajo Acreditado'}</span>
          </div>
        </div>
      </div>

      {/* Matriz de Habilitaciones Especiales para Tareas de Alto Riesgo */}
      <div className="mb-4 border border-slate-300 rounded-xl overflow-hidden page-break-inside-avoid">
        <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-wider flex items-center gap-2">
          <Shield size={12} /> 2. HABILITACIONES CLÍNICAS PARA TAREAS DE ALTO RIESGO
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 bg-white">
          
          {/* Altura */}
          <div className={`p-2 rounded-lg border flex items-center justify-between ${data.allowHeight ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-2">
              <ArrowUpRight size={16} className={data.allowHeight ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-xs font-black text-slate-900 block">Trabajo en Altura (&gt; 2.00 m)</span>
                <span className="text-[8.5pt] text-slate-500 font-medium">Res. SRT 61/23 · ECG sin arritmias/vértigo</span>
              </div>
            </div>
            <span className={`text-[9pt] font-black px-2 py-0.5 rounded uppercase ${data.allowHeight ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowHeight ? 'HABILITADO' : 'NO APTO'}
            </span>
          </div>

          {/* Confinados */}
          <div className={`p-2 rounded-lg border flex items-center justify-between ${data.allowConfined ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-2">
              <Shield size={16} className={data.allowConfined ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-xs font-black text-slate-900 block">Espacios Confinados</span>
                <span className="text-[8.5pt] text-slate-500 font-medium">Res. SRT 953/10 · Espirometría / Sin claustrofobia</span>
              </div>
            </div>
            <span className={`text-[9pt] font-black px-2 py-0.5 rounded uppercase ${data.allowConfined ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowConfined ? 'HABILITADO' : 'NO APTO'}
            </span>
          </div>

          {/* Maquinaria */}
          <div className={`p-2 rounded-lg border flex items-center justify-between ${data.allowMachinery ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-2">
              <Truck size={16} className={data.allowMachinery ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-xs font-black text-slate-900 block">Autoelevador / Clark / Maquinaria</span>
                <span className="text-[8.5pt] text-slate-500 font-medium">Dec. 351/79 · Psicotécnico / Agudeza visual</span>
              </div>
            </div>
            <span className={`text-[9pt] font-black px-2 py-0.5 rounded uppercase ${data.allowMachinery ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowMachinery ? 'HABILITADO' : 'NO APTO'}
            </span>
          </div>

          {/* Riesgo Eléctrico */}
          <div className={`p-2 rounded-lg border flex items-center justify-between ${data.allowElectrical ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-2">
              <Zap size={16} className={data.allowElectrical ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-xs font-black text-slate-900 block">Trabajos con Tensión / Riesgo Eléctrico</span>
                <span className="text-[8.5pt] text-slate-500 font-medium">Dec. 351/79 Cap. 14 · Visión cromática (Ishihara)</span>
              </div>
            </div>
            <span className={`text-[9pt] font-black px-2 py-0.5 rounded uppercase ${data.allowElectrical ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowElectrical ? 'HABILITADO' : 'NO APTO'}
            </span>
          </div>

        </div>
      </div>

      {/* Preexistencias y Restricciones Clínicas */}
      <div className="mb-4 border border-slate-300 rounded-xl overflow-hidden page-break-inside-avoid">
        <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-wider flex items-center gap-2">
          <AlertCircle size={12} /> 3. PREEXISTENCIAS, RESTRICCIONES Y OBSERVACIONES CLÍNICAS
        </div>
        <div className="p-3 text-xs bg-slate-50/60 space-y-2">
          {data.preexistencias && (
            <div className="p-2 rounded bg-amber-50 border border-amber-200">
              <span className="text-[8pt] font-black uppercase text-amber-800 block">Patologías Preexistentes Declaradas:</span>
              <p className="m-0 text-amber-950 font-medium">{data.preexistencias}</p>
            </div>
          )}
          {data.restricciones && (
            <div className="p-2 rounded bg-rose-50 border border-rose-200">
              <span className="text-[8pt] font-black uppercase text-rose-800 block">Restricciones Operativas Indicadas:</span>
              <p className="m-0 text-rose-950 font-medium">{data.restricciones}</p>
            </div>
          )}
          <div>
            <span className="text-[8pt] font-black uppercase text-slate-500 block">Observaciones Médicas Generales:</span>
            <p className="m-0 text-slate-700 leading-relaxed font-medium">
              {data.notes ? data.notes : 'Sin observaciones clínicas particulares. El postulante/trabajador reúne las condiciones psicofísicas compatibles con las tareas del puesto.'}
            </p>
          </div>
        </div>
      </div>

      {/* Médico Otorgante y Validación QR */}
      <div className="grid grid-cols-[1fr_150px] gap-3 mb-4 items-center page-break-inside-avoid">
        <div className="p-3 bg-slate-100/90 border border-slate-300 rounded-xl text-xs">
          <span className="text-[9pt] font-black text-slate-500 uppercase block mb-0.5">MÉDICO EVALUADOR OTORGANTE</span>
          <p className="font-black text-slate-900 text-sm m-0">{data.doctor || 'Dr. Médico Laboral Registrado'}</p>
          <p className="text-[9pt] text-slate-600 m-0">
            Especialista en Medicina del Trabajo · Mat: {data.doctorLicense || 'M.N. / M.P. Oficial'}
          </p>
        </div>
        <div className="text-center p-2 bg-white border border-slate-300 rounded-xl">
          <QRCodeSVG value={qrUrl} size={80} className="mx-auto" />
          <span className="text-[7.5pt] font-bold text-slate-500 block mt-1 uppercase">Validación QR en Obra</span>
        </div>
      </div>

      {/* Firmas Bipartitas: Médico y Trabajador Notificado */}
      <div className="border border-slate-300 rounded-xl p-3 bg-white mb-3 text-xs page-break-inside-avoid">
        <p className="text-[7.5pt] text-slate-500 text-center italic mb-3">
          El presente dictamen tiene validez médico-legal conforme a la Ley N° 19.587 y la Resolución S.R.T. N° 37/2010. El trabajador declara haber sido notificado de los resultados en cumplimiento de la normativa vigente.
        </p>
        <div className="grid grid-cols-2 gap-6">
          <div className="border border-slate-300 rounded p-2 text-center flex flex-col justify-between min-h-[80px]">
            <span className="text-[8pt] font-bold text-slate-600 uppercase block">FIRMA Y SELLO DEL MÉDICO LABORAL</span>
            <div className="border-b border-dashed border-slate-300 w-32 mx-auto my-2 text-slate-400 text-[7pt] italic">Firma y Sello</div>
            <span className="text-[8pt] font-bold text-slate-800">{data.doctor || 'Médico Laboral'}</span>
          </div>

          <div className="border border-slate-300 rounded p-2 text-center flex flex-col justify-between min-h-[80px]">
            <span className="text-[8pt] font-bold text-slate-600 uppercase block">NOTIFICACIÓN DEL TRABAJADOR</span>
            <div className="border-b border-dashed border-slate-300 w-32 mx-auto my-2 text-slate-400 text-[7pt] italic">Firma y Aclaración</div>
            <span className="text-[8pt] font-bold text-slate-800">{data.workerName || 'Trabajador'}</span>
          </div>
        </div>
      </div>

      {/* Pie de página de marca */}
      <PdfBrandingFooter />
    </div>
  );
}

