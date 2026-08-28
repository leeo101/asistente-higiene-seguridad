import React from 'react';
import { HeartPulse, CheckCircle2, XCircle, AlertTriangle, Building2, User, Calendar, Shield, ArrowUpRight, Truck, Zap, QrCode } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import { QRCodeSVG } from 'qrcode.react';

interface MedicalPdfGeneratorProps {
  medicalData: any;
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

  let resultLabel = 'APTO SIN RESTRICCIONES';
  let resultBg = 'bg-emerald-600';
  let resultTextColor = 'text-emerald-700';
  let resultBorderColor = 'border-emerald-300';
  let resultBoxBg = 'bg-emerald-50';

  if (data.result === 'no_apto') {
    resultLabel = 'NO APTO LABORAL';
    resultBg = 'bg-rose-600';
    resultTextColor = 'text-rose-700';
    resultBorderColor = 'border-rose-300';
    resultBoxBg = 'bg-rose-50';
  } else if (isExpired) {
    resultLabel = 'VENCIDO — REQUIERE RENOVACIÓN';
    resultBg = 'bg-rose-600';
    resultTextColor = 'text-rose-700';
    resultBorderColor = 'border-rose-300';
    resultBoxBg = 'bg-rose-50';
  } else if (data.result === 'preexistencias') {
    resultLabel = 'APTO CON PREEXISTENCIAS / RESTRICCIONES';
    resultBg = 'bg-amber-600';
    resultTextColor = 'text-amber-700';
    resultBorderColor = 'border-amber-300';
    resultBoxBg = 'bg-amber-50';
  }

  const examTypeLabels: Record<string, string> = {
    preocupacional: 'Preocupacional (Ingreso)',
    periodico: 'Periódico de Salud Ocupacional',
    egreso: 'De Egreso',
    cambio_tarea: 'Cambio de Tareas / Puesto',
    reincorporacion: 'Reincorporación Post-Licencia'
  };

  const docId = data.id ? String(data.id).slice(-8).toUpperCase() : 'S/N';
  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/worker-portal/${data.dni}` : `https://asistentehs.com/worker-portal/${data.dni}`;

  return (
    <div
      id="pdf-content"
      className="bg-white text-slate-900 font-sans p-8 max-w-[800px] mx-auto shadow-none print:shadow-none print:p-0"
      style={{ minHeight: '1050px', boxSizing: 'border-box' }}
    >
      {/* Encabezado Membretado */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-5">
        <div className="flex items-center gap-3">
          <CompanyLogo className="h-12 w-auto object-contain" />
          <div>
            <h1 className="text-base font-black uppercase text-slate-900 tracking-tight m-0">
              DECLARACIÓN DE APTITUD MÉDICA LABORAL
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider m-0">
              Medicina del Trabajo • Ley 19.587 • Res. SRT 37/10
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded">
            REGISTRO Nº {docId}
          </span>
          <p className="text-[10px] font-extrabold text-slate-500 m-0 mt-1">
            FECHA: {data.examDate ? new Date(data.examDate).toLocaleDateString('es-AR') : '-'}
          </p>
        </div>
      </div>

      {/* Banner de Resultado Clínico Principal */}
      <div className={`p-4 rounded-xl border-2 ${resultBorderColor} ${resultBoxBg} mb-5 flex items-center justify-between`}>
        <div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
            DIAGNÓSTICO Y DICTAMEN MÉDICO FINAL
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`${resultBg} text-white font-black text-xs px-3 py-1 rounded-lg uppercase tracking-wide shadow-2xs`}>
              {resultLabel}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-extrabold text-slate-500 block uppercase">VENCIMIENTO DE APTITUD</span>
          <span className={`text-xs font-black ${isExpired ? 'text-rose-600' : 'text-slate-900'}`}>
            {data.expirationDate ? new Date(data.expirationDate).toLocaleDateString('es-AR') : 'Sin fecha'}
          </span>
        </div>
      </div>

      {/* Datos Filiatorios del Trabajador */}
      <div className="mb-5 border border-slate-300 rounded-xl overflow-hidden">
        <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-wider flex items-center gap-2">
          <User size={12} /> DATOS DEL TRABAJADOR Y PUESTO DE TRABAJO
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 text-xs bg-slate-50/60">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase block">Nombre y Apellido</span>
            <span className="font-black text-slate-900">{data.workerName || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase block">DNI / CUIL</span>
            <span className="font-extrabold text-slate-900">{data.dni || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase block">Puesto / Tarea</span>
            <span className="font-extrabold text-slate-900">{data.jobTitle || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase block">Empresa / Contratista</span>
            <span className="font-bold text-slate-700">{data.company || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase block">Tipo de Examen</span>
            <span className="font-bold text-slate-700">{examTypeLabels[data.examType] || data.examType || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase block">Centro Evaluador</span>
            <span className="font-bold text-slate-700">{data.clinic || 'Clínica Laboral Acreditada'}</span>
          </div>
        </div>
      </div>

      {/* Matriz de Habilitaciones Especiales para Tareas de Alto Riesgo */}
      <div className="mb-5 border border-slate-300 rounded-xl overflow-hidden page-break-inside-avoid">
        <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-wider flex items-center gap-2">
          <Shield size={12} /> HABILITACIONES CLÍNICAS PARA TAREAS DE ALTO RIESGO
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 bg-white">
          
          {/* Altura */}
          <div className={`p-2.5 rounded-lg border flex items-center justify-between ${data.allowHeight ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-2">
              <ArrowUpRight size={16} className={data.allowHeight ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-xs font-black text-slate-900 block">Trabajo en Altura</span>
                <span className="text-[9px] text-slate-500 font-medium">Estudios EEG/ECG/Audiometría</span>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${data.allowHeight ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowHeight ? 'HABILITADO' : 'NO AUTORIZADO'}
            </span>
          </div>

          {/* Confinados */}
          <div className={`p-2.5 rounded-lg border flex items-center justify-between ${data.allowConfined ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-2">
              <Shield size={16} className={data.allowConfined ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-xs font-black text-slate-900 block">Espacios Confinados</span>
                <span className="text-[9px] text-slate-500 font-medium">Evaluación Respiratoria/Clínica</span>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${data.allowConfined ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowConfined ? 'HABILITADO' : 'NO AUTORIZADO'}
            </span>
          </div>

          {/* Maquinaria */}
          <div className={`p-2.5 rounded-lg border flex items-center justify-between ${data.allowMachinery ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-2">
              <Truck size={16} className={data.allowMachinery ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-xs font-black text-slate-900 block">Maquinaria / Flota / Clark</span>
                <span className="text-[9px] text-slate-500 font-medium">Psicotécnico / Agudeza Visual</span>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${data.allowMachinery ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowMachinery ? 'HABILITADO' : 'NO AUTORIZADO'}
            </span>
          </div>

          {/* Riesgo Eléctrico */}
          <div className={`p-2.5 rounded-lg border flex items-center justify-between ${data.allowElectrical ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/60 border-rose-200'}`}>
            <div className="flex items-center gap-2">
              <Zap size={16} className={data.allowElectrical ? 'text-emerald-700' : 'text-rose-600'} />
              <div>
                <span className="text-xs font-black text-slate-900 block">Riesgo Eléctrico</span>
                <span className="text-[9px] text-slate-500 font-medium">Evaluación Electrocardiógrafa</span>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${data.allowElectrical ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {data.allowElectrical ? 'HABILITADO' : 'NO AUTORIZADO'}
            </span>
          </div>

        </div>
      </div>

      {/* Observaciones y Restricciones Clínicas */}
      <div className="mb-5 border border-slate-300 rounded-xl overflow-hidden page-break-inside-avoid">
        <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-wider">
          OBSERVACIONES, PREEXISTENCIAS Y RESTRICCIONES MÉDICAS
        </div>
        <div className="p-3 text-xs text-slate-800 bg-slate-50/50 min-h-[60px] font-medium leading-relaxed">
          {data.notes ? data.notes : 'Sin observaciones ni restricciones clínicas indicadas. Trabajador apto para el desempeño de sus tareas habituales.'}
        </div>
      </div>

      {/* Médico Otorgante y Validación QR */}
      <div className="grid grid-cols-[1fr_160px] gap-4 mb-6 items-center page-break-inside-avoid">
        <div className="p-3 bg-slate-100/80 border border-slate-300 rounded-xl text-xs">
          <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">MÉDICO EVALUADOR OTORGANTE</span>
          <p className="font-extrabold text-slate-900 m-0">{data.doctor || 'Dr. Médico Laboral Registrado'}</p>
          <p className="text-[11px] text-slate-600 m-0">Especialista en Medicina del Trabajo • Matrícula Nacional/Provincial</p>
        </div>
        <div className="text-center p-2 bg-white border border-slate-300 rounded-xl">
          <QRCodeSVG value={qrUrl} size={90} className="mx-auto" />
          <span className="text-[8px] font-bold text-slate-500 block mt-1 uppercase">Verificación QR en Obra</span>
        </div>
      </div>

      {/* Firmas Oficiales */}
      <PdfSignatures data={data} />

      {/* Pie de página de marca */}
      <PdfBrandingFooter />
    </div>
  );
}
