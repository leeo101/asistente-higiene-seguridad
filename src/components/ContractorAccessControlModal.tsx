import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, 
  Search, Building2, User, FileText, Calendar, X, Printer, Check, Ban
} from 'lucide-react';
import { ContractorCompany, WorkerItem } from '../pages/ContractorMatrix';

interface ContractorAccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: ContractorCompany[];
  workers: WorkerItem[];
}

export const ContractorAccessControlModal: React.FC<ContractorAccessControlModalProps> = ({
  isOpen,
  onClose,
  companies,
  workers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<WorkerItem | null>(null);

  if (!isOpen) return null;

  const filteredWorkers = workers.filter(w => 
    w.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.dni.includes(searchTerm) ||
    w.contractorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDocState = (dateStr?: string) => {
    if (!dateStr) return { status: 'missing', label: 'Sin Cargar', bg: 'bg-slate-800 text-slate-400 border-slate-700' };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(dateStr + 'T23:59:59Z');
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', label: 'VENCIDO', bg: 'bg-rose-950/60 text-rose-300 border-rose-600/50' };
    if (diffDays <= 15) return { status: 'expiring', label: `Vence en ${diffDays} días`, bg: 'bg-amber-950/60 text-amber-300 border-amber-600/50' };
    return { status: 'valid', label: 'Vigente', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50' };
  };

  const evaluateAccess = (worker: WorkerItem) => {
    const company = companies.find(c => c.id === worker.contractorId);

    const companyDocs = [
      { name: 'Cláusula de No Repetición (ART)', status: getDocState(company?.artDocDate) },
      { name: 'Seguro de Vida Obligatorio', status: getDocState(company?.seguroVidaDate) },
      { name: 'Programa de Seguridad Aprobado', status: getDocState(company?.programaSeguridadDate) },
      { name: 'Formulario AFIP F.931', status: getDocState(company?.f931Date) }
    ];

    const workerDocs = [
      { name: 'Apto Médico Laboral (Res. 37/10)', status: getDocState(worker.aptoMedicoDate) },
      { name: 'Constancia de Entrega EPP (Res. 299/11)', status: getDocState(worker.entregaEppDate) },
      { name: 'Inducción de Seguridad y Medio Ambiente', status: getDocState(worker.induccionDate) },
      { name: 'Alta AFIP del Trabajador', status: getDocState(worker.altaAfipDate) }
    ];

    const allDocs = [...companyDocs, ...workerDocs];
    const expiredCount = allDocs.filter(d => d.status.status === 'expired' || d.status.status === 'missing').length;
    const expiringCount = allDocs.filter(d => d.status.status === 'expiring').length;

    let overallAccess: 'authorized' | 'warning' | 'denied' = 'authorized';
    if (expiredCount > 0) overallAccess = 'denied';
    else if (expiringCount > 0) overallAccess = 'warning';

    return {
      company,
      companyDocs,
      workerDocs,
      expiredCount,
      expiringCount,
      overallAccess
    };
  };

  const currentEval = selectedWorker ? evaluateAccess(selectedWorker) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white m-0 flex items-center gap-2">
                Control de Acceso en Garita & Planta
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  Verificación 1-Clic
                </span>
              </h3>
              <p className="text-xs text-slate-400 m-0">
                Auditoría en tiempo real de habilitación legal para ingreso de contratistas y operarios.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Búsqueda por DNI o Nombre */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar trabajador por DNI, Nombre o Empresa Contratista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:border-emerald-500 focus:outline-none font-medium shadow-inner"
            />
          </div>

          {/* Selector de Trabajador si hay búsqueda */}
          {!selectedWorker && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Seleccionar Operario para Control ({filteredWorkers.length} encontrados)
              </span>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {filteredWorkers.map(w => {
                  const ev = evaluateAccess(w);
                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWorker(w)}
                      className="p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-300 text-sm shrink-0">
                          {w.workerName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-white">{w.workerName}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>DNI: {w.dni}</span> • <span className="text-emerald-400 font-bold">{w.contractorName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badge de Acceso Rápido */}
                      <div>
                        {ev.overallAccess === 'authorized' && (
                          <span className="px-3 py-1 rounded-full font-black text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 size={14} /> AUTORIZADO
                          </span>
                        )}
                        {ev.overallAccess === 'warning' && (
                          <span className="px-3 py-1 rounded-full font-black text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <AlertTriangle size={14} /> POR VENCER
                          </span>
                        )}
                        {ev.overallAccess === 'denied' && (
                          <span className="px-3 py-1 rounded-full font-black text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <XCircle size={14} /> DENEGADO
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resultado del Dictamen de Ingreso */}
          {selectedWorker && currentEval && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setSelectedWorker(null)}
                className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 underline cursor-pointer border-none bg-transparent"
              >
                ← Seleccionar otro trabajador
              </button>

              {/* Cartel Gigante de Dictamen de Acceso */}
              <div className={`p-6 rounded-3xl border-2 flex items-center justify-between shadow-2xl ${
                currentEval.overallAccess === 'authorized'
                  ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-100'
                  : currentEval.overallAccess === 'warning'
                  ? 'bg-amber-950/60 border-amber-500/80 text-amber-100'
                  : 'bg-rose-950/80 border-rose-500/90 text-rose-100'
              }`}>
                <div className="flex items-center gap-4">
                  {currentEval.overallAccess === 'authorized' && <ShieldCheck size={48} className="text-emerald-400 shrink-0" />}
                  {currentEval.overallAccess === 'warning' && <AlertTriangle size={48} className="text-amber-400 shrink-0" />}
                  {currentEval.overallAccess === 'denied' && <Ban size={48} className="text-rose-400 shrink-0" />}

                  <div>
                    <div className="text-xs uppercase font-black tracking-widest opacity-80 mb-1">Dictamen de Garita de Acceso</div>
                    <h2 className="text-xl font-black m-0 tracking-tight">
                      {currentEval.overallAccess === 'authorized' && '🟢 INGRESO PERMITIDO Y AUTORIZADO'}
                      {currentEval.overallAccess === 'warning' && '⚠️ INGRESO AUTORIZADO (DOCS POR VENCER)'}
                      {currentEval.overallAccess === 'denied' && '🔴 INGRESO DENEGADO / TRABAJADOR BLOQUEADO'}
                    </h2>
                    <p className="text-xs m-0 mt-1 opacity-90">
                      Operario: <strong>{selectedWorker.workerName}</strong> (DNI: {selectedWorker.dni}) • Empresa: <strong>{selectedWorker.contractorName}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalle de Documentación Empresa & Trabajador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Docs Empresa */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <span className="font-extrabold text-white flex items-center gap-1.5 text-xs mb-2">
                    <Building2 size={16} className="text-blue-400" />
                    Documentación de la Empresa Contratista
                  </span>
                  {currentEval.companyDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-300 font-medium">{doc.name}</span>
                      <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border ${doc.status.bg}`}>
                        {doc.status.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Docs Trabajador */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <span className="font-extrabold text-white flex items-center gap-1.5 text-xs mb-2">
                    <User size={16} className="text-purple-400" />
                    Documentación Personal del Operario
                  </span>
                  {currentEval.workerDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-300 font-medium">{doc.name}</span>
                      <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border ${doc.status.bg}`}>
                        {doc.status.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
          >
            Cerrar
          </button>

          {selectedWorker && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none"
            >
              <Printer size={16} /> Imprimir Pase Digital de Garita
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractorAccessControlModal;
