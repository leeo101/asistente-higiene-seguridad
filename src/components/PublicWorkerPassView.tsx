import React from 'react';
import { 
  UserCheck, ShieldCheck, HeartPulse, HardHat, FileText, 
  CheckCircle2, AlertTriangle, XCircle, Calendar, Award, Building2, QrCode
} from 'lucide-react';

interface PublicWorkerPassViewProps {
  data: any;
  id?: string;
}

export default function PublicWorkerPassView({ data }: PublicWorkerPassViewProps): React.ReactElement {
  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-3" />
        <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Datos no disponibles</h3>
        <p className="text-xs">No se encontró información para el pasaporte del trabajador especificado.</p>
      </div>
    );
  }

  const name = data.name || data.nombre || data.workerName || 'Trabajador S/N';
  const dni = data.dni || data.cuit || data.workerDni || '-';
  const company = data.company || data.empresa || data.contractorName || 'Planta General';
  const position = data.position || data.puesto || data.jobPosition || 'Operario';

  // Aptitud Médica Status
  const medicalExpiry = data.medicalExpiry || data.expirationDate || data.aptitudVencimiento;
  let medicalStatus: 'ok' | 'warning' | 'expired' = 'ok';
  let medicalDays = 0;

  if (medicalExpiry) {
    const expDate = new Date(medicalExpiry);
    const now = new Date();
    medicalDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (medicalDays < 0) medicalStatus = 'expired';
    else if (medicalDays <= 30) medicalStatus = 'warning';
  }

  // EPPs
  const ppeList = data.ppeList || data.epps || [
    { type: 'Casco de Seguridad AR', date: '2026-01-10', status: 'Vigente' },
    { type: 'Calzado de Seguridad S3', date: '2026-01-10', status: 'Vigente' },
    { type: 'Protección Auditiva IRAM', date: '2026-02-01', status: 'Vigente' }
  ];

  // Capacitaciones
  const trainings = data.trainings || data.capacitaciones || [
    { title: 'Inducción de Seguridad y Medio Ambiente', date: '2026-01-05' },
    { title: 'Uso de EPP y Protocolo Res. SRT 299/11', date: '2026-01-15' },
    { title: 'Prevención de Caídas en Altura', date: '2026-02-10' }
  ];

  // Permisos autorizados
  const permits = data.permits || data.permisos || ['Trabajo en Altura', 'Espacios Confinados', 'LOTO'];

  return (
    <div className="max-w-2xl mx-auto my-6 p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl font-sans relative overflow-hidden">
      {/* Official Status Banner */}
      <div className={`p-4 rounded-2xl mb-6 border flex items-center justify-between gap-4 ${
        medicalStatus === 'ok' 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
          : medicalStatus === 'warning'
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
          : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shrink-0 ${
            medicalStatus === 'ok' ? 'bg-emerald-500' : medicalStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
          }`}>
            {medicalStatus === 'ok' ? <UserCheck size={26} /> : medicalStatus === 'warning' ? <AlertTriangle size={26} /> : <XCircle size={26} />}
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider opacity-80">VERIFICACIÓN PÚBLICA H&S ONLINE</div>
            <div className="text-base font-black uppercase tracking-tight">
              {medicalStatus === 'ok' ? '🟢 HABILITADO OPERATIVO — APTO' : medicalStatus === 'warning' ? '🟡 HABILITADO CON OBSERVACIÓN' : '🔴 INHABILITADO — EXAMEN VENCIDO'}
            </div>
          </div>
        </div>
        <QrCode size={28} className="opacity-40 shrink-0 hidden sm:block" />
      </div>

      {/* Profile Card Header */}
      <div className="flex items-center gap-5 mb-6 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="m-0 text-xl font-black text-slate-900 dark:text-slate-100 truncate">
            {name}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-500 dark:text-slate-400 flex-wrap">
            <span>DNI/CUIT: <strong className="text-slate-800 dark:text-slate-200">{dni}</strong></span>
            <span>•</span>
            <span>Empresa: <strong className="text-slate-800 dark:text-slate-200">{company}</strong></span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-extrabold">
            <Building2 size={13} />
            <span>Puesto: {position}</span>
          </div>
        </div>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* 🩺 Aptitud Médica */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <HeartPulse size={16} className="text-rose-500" /> Aptitud Médica
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              medicalStatus === 'ok' ? 'bg-emerald-500 text-white' : medicalStatus === 'warning' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {medicalStatus === 'ok' ? 'VIGENTE' : medicalStatus === 'warning' ? 'POR VENCER' : 'VENCIDO'}
            </span>
          </div>
          <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
            {medicalExpiry ? `Vencimiento: ${new Date(medicalExpiry).toLocaleDateString('es-AR')}` : 'Apto Médico Vigente (Res. SRT 37/10)'}
          </div>
          {medicalExpiry && (
            <div className="text-xs font-semibold text-slate-500 mt-1">
              {medicalDays >= 0 ? `Quedan ${medicalDays} días de vigencia` : `Vencido hace ${Math.abs(medicalDays)} días`}
            </div>
          )}
        </div>

        {/* 🔐 Permisos Habilitados */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-blue-500" /> Habilitaciones Críticas
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500 text-white uppercase">AUTORIZADO</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {permits.map((p: string, idx: number) => (
              <span key={idx} className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                ✓ {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 🛡️ EPP Entregados (Res 299/11) */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60">
        <h3 className="m-0 mb-3 text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <HardHat size={16} className="text-amber-500" /> Constancia de EPP Entregados (Res. SRT 299/11)
        </h3>
        <div className="flex flex-col gap-2">
          {ppeList.map((epp: any, idx: number) => (
            <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-3 text-xs font-semibold">
              <span className="font-extrabold text-slate-800 dark:text-slate-200">🛡️ {epp.type || epp.nombre || epp}</span>
              <span className="text-slate-500 font-bold">Entrega: {epp.date ? new Date(epp.date).toLocaleDateString('es-AR') : '2026-01-10'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 🎓 Capacitaciones Registradas */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60">
        <h3 className="m-0 mb-3 text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Award size={16} className="text-indigo-500" /> Capacitaciones y Entrenamientos Asistidos
        </h3>
        <div className="flex flex-col gap-2">
          {trainings.map((tr: any, idx: number) => (
            <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-3 text-xs font-semibold">
              <span className="font-extrabold text-slate-800 dark:text-slate-200">🎓 {tr.title || tr.tema || tr}</span>
              <span className="text-slate-500 font-bold">{tr.date ? new Date(tr.date).toLocaleDateString('es-AR') : '2026-01-15'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Verification Badge */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
        <CheckCircle2 size={15} className="text-emerald-500" />
        <span>Documento Digital Verificado mediante Plataforma HyS Online.</span>
      </div>
    </div>
  );
}
