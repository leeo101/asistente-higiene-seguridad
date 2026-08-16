import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, HelpCircle, HeartPulse, 
  ExternalLink, UserCheck, Search, Building2, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  validateWorkerMedicalStatus, 
  getAvailableWorkers, 
  MedicalValidationResult, 
  WorkerOption 
} from '../utils/workerValidation';

interface WorkerMedicalCheckerProps {
  value: string;
  onChange: (workerName: string, validation: MedicalValidationResult) => void;
  riskType?: 'height' | 'confined' | 'machinery' | 'electrical' | 'general';
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const WorkerMedicalChecker: React.FC<WorkerMedicalCheckerProps> = ({
  value,
  onChange,
  riskType = 'general',
  label = 'Nombre o DNI del Trabajador *',
  placeholder = 'Nombre completo o DNI...',
  required = false,
  className = ''
}) => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<WorkerOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState<WorkerOption[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const workers = getAvailableWorkers();
    setAvailableWorkers(workers);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (val: string) => {
    const validation = validateWorkerMedicalStatus(val, riskType);
    onChange(val, validation);

    if (val.trim().length > 0) {
      const filtered = availableWorkers.filter(w => 
        w.name.toLowerCase().includes(val.toLowerCase()) || 
        (w.dni && w.dni.toLowerCase().includes(val.toLowerCase()))
      );
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelectWorker = (worker: WorkerOption) => {
    const selectedName = worker.name;
    const validation = validateWorkerMedicalStatus(selectedName, riskType);
    onChange(selectedName, validation);
    setShowDropdown(false);
  };

  const validation = value && value.trim().length > 1 
    ? validateWorkerMedicalStatus(value, riskType) 
    : null;

  return (
    <div ref={wrapperRef} className={`relative space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-300 flex items-center justify-between">
          <span>{label}</span>
          <button
            type="button"
            onClick={() => navigate('/medical')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40"
          >
            <HeartPulse size={12} /> Gestionar Aptitudes Médicas <ExternalLink size={10} />
          </button>
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (value.trim().length > 0 && suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
        />

        {/* Desplegable Autocompletado */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-700/60">
            {suggestions.map((w, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectWorker(w)}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-700/70 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
                    {w.name}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    {w.dni && <span>DNI: {w.dni}</span>}
                    {w.jobTitle && <span>• {w.jobTitle}</span>}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    w.medicalStatus === 'apto' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {w.medicalStatus === 'apto' ? '✓ Apto' : '⚠️ Vencido/No Apto'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Badge Interactivo de Estado de Aptitud Médica */}
      {validation && (
        <div className={`p-3.5 rounded-xl border transition-all text-xs font-semibold flex items-start gap-3 shadow-md ${
          validation.status === 'apto'
            ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
            : validation.status === 'vencido' || validation.status === 'no_apto'
            ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
            : validation.status === 'sin_permiso_especifico'
            ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
            : 'bg-slate-800/80 border-slate-700 text-slate-300'
        }`}>
          <div className="mt-0.5 shrink-0">
            {validation.status === 'apto' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {(validation.status === 'vencido' || validation.status === 'no_apto') && <XCircle className="w-5 h-5 text-rose-400" />}
            {validation.status === 'sin_permiso_especifico' && <ShieldAlert className="w-5 h-5 text-amber-400" />}
            {validation.status === 'no_registrado' && <HelpCircle className="w-5 h-5 text-slate-400" />}
          </div>

          <div className="flex-1 space-y-1">
            <div className="font-bold text-sm">
              {validation.message}
            </div>

            {validation.clinic && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Building2 size={12} /> Clínica / Centro Evaluador: <span className="text-slate-300 font-semibold">{validation.clinic}</span>
              </div>
            )}

            {validation.status !== 'apto' && (
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/medical')}
                  className="text-xs underline font-bold hover:opacity-80 transition-opacity"
                >
                  Abrir Módulo de Aptitudes Médicas para actualizar registro →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerMedicalChecker;
