import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Plus, Search, Calendar, HeartPulse, UserCheck, AlertTriangle, 
  FileText, CheckCircle2, XCircle, QrCode, ExternalLink, Trash2, Filter, 
  Building2, User, HardHat, FileSpreadsheet, Sparkles, Zap, Truck, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import PremiumHeader from '../components/PremiumHeader';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function MedicalAptitudes() {
  const { currentUser } = useAuth();
  const { syncCollection } = useSync();
  const navigate = useNavigate();
  
  const [exams, setExams] = useState<any[]>([]);
  const [legajos, setLegajos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'preexistencia' | 'expired' | 'no_apto'>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [qrModal, setQrModal] = useState<any>(null);

  const defaultExamDate = new Date().toISOString().split('T')[0];
  const defaultExpDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    id: '',
    workerName: '',
    dni: '',
    jobTitle: '',
    company: '',
    examType: 'periodico',
    examDate: defaultExamDate,
    expirationDate: defaultExpDate,
    result: 'apto',
    clinic: '',
    doctor: '',
    notes: '',
    allowHeight: false,
    allowConfined: false,
    allowMachinery: false,
    allowElectrical: false
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Load Medical DB
    const data = localStorage.getItem('ehs_medical_db');
    if (data) {
      try {
        setExams(JSON.parse(data));
      } catch (e) {
        console.error("Error parsing medical DB", e);
      }
    }

    // Load Legajos for autocomplete
    const legajosCache = localStorage.getItem('legajos_cache');
    if (legajosCache) {
      try {
        setLegajos(JSON.parse(legajosCache));
      } catch (e) {}
    }
  }, []);

  // Auto-calculate 1 year expiration when examDate changes
  const handleExamDateChange = (newDate: string) => {
    if (!newDate) {
      setFormData(prev => ({ ...prev, examDate: newDate }));
      return;
    }
    const exp = new Date(new Date(newDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      examDate: newDate,
      expirationDate: prev.expirationDate ? prev.expirationDate : exp
    }));
  };

  // Autocomplete worker details when selecting from legajos
  const handleSelectWorkerFromLegajo = (workerDni: string) => {
    const found = legajos.find(l => String(l.dni) === String(workerDni));
    if (found) {
      setFormData(prev => ({
        ...prev,
        workerName: found.name || prev.workerName,
        dni: found.dni || prev.dni,
        jobTitle: found.jobTitle || found.puesto || prev.jobTitle,
        company: found.company || found.empresa || prev.company
      }));
      toast.success(`Datos cargados para ${found.name}`);
    }
  };

  const handleSave = () => {
    if (!formData.workerName.trim() || !formData.dni.trim()) {
      toast.error('Complete el nombre y DNI del trabajador.');
      return;
    }

    const newRecord = {
      ...formData,
      id: formData.id || `MED-${Date.now()}`
    };

    let updated;
    if (formData.id) {
      updated = exams.map((e) => e.id === formData.id ? newRecord : e);
      toast.success('Examen actualizado correctamente.');
    } else {
      updated = [newRecord, ...exams];
      toast.success('Examen registrado exitosamente.');
    }

    setExams(updated);
    localStorage.setItem('ehs_medical_db', JSON.stringify(updated));
    syncCollection('ehs_medical_db', updated);
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro de examen médico?')) {
      const updated = exams.filter(e => e.id !== id);
      setExams(updated);
      localStorage.setItem('ehs_medical_db', JSON.stringify(updated));
      syncCollection('ehs_medical_db', updated);
      toast.success('Registro eliminado.');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      workerName: '',
      dni: '',
      jobTitle: '',
      company: '',
      examType: 'periodico',
      examDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      result: 'apto',
      clinic: '',
      doctor: '',
      notes: '',
      allowHeight: false,
      allowConfined: false,
      allowMachinery: false,
      allowElectrical: false
    });
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = exams.length;
    const now = new Date();
    
    let valid = 0;
    let preexistencia = 0;
    let expired = 0;
    let noApto = 0;

    exams.forEach(e => {
      const isExp = e.expirationDate && new Date(e.expirationDate) < now;
      if (e.result === 'no_apto') {
        noApto++;
      } else if (isExp) {
        expired++;
      } else if (e.result === 'preexistencias') {
        preexistencia++;
      } else {
        valid++;
      }
    });

    return { total, valid, preexistencia, expired, noApto };
  }, [exams]);

  const getResultBadge = (result: string, expirationDate?: string) => {
    const isExpired = expirationDate && new Date(expirationDate) < new Date();
    if (isExpired && result !== 'no_apto') {
      return (
        <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecdd3', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <XCircle size={14} /> Vencido
        </span>
      );
    }

    switch (result) {
      case 'apto':
        return (
          <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} /> Apto
          </span>
        );
      case 'preexistencias':
        return (
          <span style={{ backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={14} /> Apto c/ Preexistencias
          </span>
        );
      case 'no_apto':
        return (
          <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecdd3', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={14} /> No Apto
          </span>
        );
      default:
        return null;
    }
  };

  const columns = [
    {
      header: 'Fecha',
      accessor: 'examDate',
      render: (item: any) => (
        <span style={{ color: '#000000', fontWeight: '900', fontSize: '13px', display: 'block' }}>
          {new Date(item.examDate).toLocaleDateString('es-AR')}
        </span>
      )
    },
    {
      header: 'Trabajador',
      accessor: 'workerName',
      render: (item: any) => (
        <div>
          <div style={{ color: '#000000', fontWeight: '900', fontSize: '14px', lineHeight: '1.2' }}>{item.workerName}</div>
          <div style={{ color: '#1e293b', fontWeight: '800', fontSize: '12px', marginTop: '2px' }}>DNI: {item.dni} {item.jobTitle ? `• ${item.jobTitle}` : ''}</div>
        </div>
      )
    },
    {
      header: 'Tipo Examen',
      accessor: 'examType',
      render: (item: any) => (
        <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '12px', textTransform: 'capitalize' }}>
          {item.examType.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Vencimiento',
      accessor: 'expirationDate',
      render: (item: any) => {
        if (!item.expirationDate) return <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>;
        const exp = new Date(item.expirationDate);
        const isExpired = exp < new Date();
        return (
          <span style={{ color: isExpired ? '#dc2626' : '#000000', fontWeight: '900', fontSize: '13px' }}>
            {exp.toLocaleDateString('es-AR')} {isExpired && '(Vencido)'}
          </span>
        );
      }
    },
    {
      header: 'Resultado',
      accessor: 'result',
      render: (item: any) => getResultBadge(item.result, item.expirationDate)
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Botón Editar con fondo Amarillo/Ámbar sólido */}
          <button 
            onClick={() => { setFormData(item); setShowForm(true); }} 
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={12} /> Editar
          </button>
          
          {/* Botón QR con fondo Azul sólido */}
          <button 
            onClick={() => setQrModal(item)} 
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <QrCode size={12} /> QR
          </button>

          {/* Botón Portal con fondo Índigo sólido */}
          <button 
            onClick={() => navigate(`/worker-portal/${item.dni}`)} 
            title="Ver en Portal del Trabajador"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ExternalLink size={12} /> Portal
          </button>

          {/* Botón Eliminar con fondo Rojo sólido */}
          <button 
            onClick={() => handleDelete(item.id)} 
            title="Eliminar registro"
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  const filtered = exams.filter((e) => {
    const name = String(e?.workerName || '').toLowerCase();
    const term = String(searchTerm || '').toLowerCase();
    const dniStr = String(e?.dni || '');
    const matchesSearch = name.includes(term) || dniStr.includes(term);

    if (!matchesSearch) return false;

    const isExp = e.expirationDate && new Date(e.expirationDate) < new Date();
    if (statusFilter === 'valid') return !isExp && e.result === 'apto';
    if (statusFilter === 'preexistencia') return !isExp && e.result === 'preexistencias';
    if (statusFilter === 'expired') return isExp && e.result !== 'no_apto';
    if (statusFilter === 'no_apto') return e.result === 'no_apto';

    return true;
  });

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Aptitudes Médicas"
          subtitle="Gestión de exámenes preocupacionales, periódicos y vencimientos clínicos"
          icon={<HeartPulse size={36} color="#ffffff" />} 
        />

        {/* Top Summary Cards (KPIs) */}
        {!showForm && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div 
              onClick={() => setStatusFilter('all')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
              }`}>
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Registrados</span>
                <HeartPulse size={20} />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
              <span className="text-[11px] text-slate-500">Exámenes cargados</span>
            </div>

            <div 
              onClick={() => setStatusFilter('valid')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'valid' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
              }`}>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Aptos Vigentes</span>
                <CheckCircle2 size={20} />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.valid}</div>
              <span className="text-[11px] text-slate-500">Personal habilitado</span>
            </div>

            <div 
              onClick={() => setStatusFilter('preexistencia')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'preexistencia' 
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
              }`}>
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Con Preexistencia</span>
                <AlertTriangle size={20} />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.preexistencia}</div>
              <span className="text-[11px] text-slate-500">Habilitados con observación</span>
            </div>

            <div 
              onClick={() => setStatusFilter('expired')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'expired' || statusFilter === 'no_apto'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
              }`}>
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Vencidos / No Aptos</span>
                <XCircle size={20} />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.expired + metrics.noApto}</div>
              <span className="text-[11px] text-slate-500">Requiere renovación</span>
            </div>
          </div>
        )}

        {/* Form View */}
        {showForm ? (
          <div className="glass-card p-6 sm:p-8 mt-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <FileText size={22} />
                </div>
                <div>
                  <h2 className="m-0 text-xl font-extrabold text-slate-900 dark:text-white">
                    {formData.id ? 'Editar Examen Médico' : 'Nuevo Registro de Examen Médico'}
                  </h2>
                  <p className="m-0 text-xs text-slate-500 dark:text-slate-400 font-medium">Complete los datos clínicos del trabajador</p>
                </div>
              </div>

              {/* Autocomplete Selector from Legajos */}
              {legajos.length > 0 && !formData.id && (
                <div className="hidden sm:block">
                  <select 
                    onChange={(e) => handleSelectWorkerFromLegajo(e.target.value)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                    <option value="">-- Cargar datos desde Legajo --</option>
                    {legajos.map((l: any, i: number) => (
                      <option key={i} value={l.dni}>{l.name} (DNI: {l.dni})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nombre del Trabajador *</label>
                <input 
                  type="text" 
                  value={formData.workerName} 
                  onChange={(e) => setFormData({ ...formData, workerName: e.target.value })} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 outline-none font-semibold text-sm text-slate-900 dark:text-white" 
                  placeholder="Ej. Juan Pérez" 
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">DNI / CUIL *</label>
                <input 
                  type="text" 
                  value={formData.dni} 
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 outline-none font-semibold text-sm text-slate-900 dark:text-white" 
                  placeholder="Sin puntos ni guiones" 
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Puesto / Tarea</label>
                <input 
                  type="text" 
                  value={formData.jobTitle} 
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 outline-none font-semibold text-sm text-slate-900 dark:text-white" 
                  placeholder="Ej. Operador de Montacargas" 
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tipo de Examen</label>
                <select 
                  value={formData.examType} 
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value })} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 outline-none font-semibold text-sm text-slate-900 dark:text-white cursor-pointer">
                  <option value="preocupacional">Preocupacional (Ingreso)</option>
                  <option value="periodico">Periódico de Salud</option>
                  <option value="egreso">De Egreso</option>
                  <option value="cambio_tarea">Cambio de Tareas</option>
                  <option value="reincorporacion">Reincorporación Post-Licencia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Resultado Clínico</label>
                <select 
                  value={formData.result} 
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 outline-none font-extrabold text-sm cursor-pointer"
                  style={{ color: formData.result === 'apto' ? '#10b981' : formData.result === 'no_apto' ? '#ef4444' : '#f59e0b' }}>
                  <option value="apto">APTO SIN RESTRICCIONES</option>
                  <option value="preexistencias">APTO CON PREEXISTENCIAS / RESTRICCIONES</option>
                  <option value="no_apto">NO APTO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Fecha del Examen</label>
                <input 
                  type="date" 
                  value={formData.examDate} 
                  onChange={(e) => handleExamDateChange(e.target.value)} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 outline-none font-semibold text-sm text-slate-900 dark:text-white" 
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Fecha Vencimiento (1 Año auto)</label>
                <input 
                  type="date" 
                  value={formData.expirationDate} 
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 outline-none font-semibold text-sm text-slate-900 dark:text-white" 
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Clínica / Centro Médico</label>
                <input 
                  type="text" 
                  value={formData.clinic} 
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 outline-none font-semibold text-sm text-slate-900 dark:text-white" 
                  placeholder="Lugar de realización" 
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Médico / Matrícula</label>
                <input 
                  type="text" 
                  value={formData.doctor} 
                  onChange={(e) => setFormData({ ...formData, doctor: e.target.value })} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 outline-none font-semibold text-sm text-slate-900 dark:text-white" 
                  placeholder="Dr. Nombre Apellido (MP 12345)" 
                />
              </div>
            </div>

            {/* Rediseño de Habilitaciones Clínicas Especiales con tarjetas activas redondeadas e iconos */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Habilitaciones Clínicas Especiales para Tareas de Alto Riesgo
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Altura */}
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, allowHeight: !prev.allowHeight }))}
                  style={{
                    backgroundColor: formData.allowHeight ? '#dcfce7' : '#ffffff',
                    border: formData.allowHeight ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    color: formData.allowHeight ? '#15803d' : '#334155',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}>
                  <div className="flex items-center gap-2.5">
                    <ArrowUpRight size={18} style={{ color: formData.allowHeight ? '#16a34a' : '#94a3b8' }} />
                    <span style={{ fontSize: '12px', fontWeight: formData.allowHeight ? '900' : '600' }}>Trabajo en Altura</span>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    backgroundColor: formData.allowHeight ? '#16a34a' : '#f1f5f9',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '900',
                    border: formData.allowHeight ? 'none' : '1px solid #cbd5e1'
                  }}>
                    {formData.allowHeight ? '✓' : ''}
                  </div>
                </div>

                {/* Confinados */}
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, allowConfined: !prev.allowConfined }))}
                  style={{
                    backgroundColor: formData.allowConfined ? '#dcfce7' : '#ffffff',
                    border: formData.allowConfined ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    color: formData.allowConfined ? '#15803d' : '#334155',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}>
                  <div className="flex items-center gap-2.5">
                    <Shield size={18} style={{ color: formData.allowConfined ? '#16a34a' : '#94a3b8' }} />
                    <span style={{ fontSize: '12px', fontWeight: formData.allowConfined ? '900' : '600' }}>Espacios Confinados</span>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    backgroundColor: formData.allowConfined ? '#16a34a' : '#f1f5f9',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '900',
                    border: formData.allowConfined ? 'none' : '1px solid #cbd5e1'
                  }}>
                    {formData.allowConfined ? '✓' : ''}
                  </div>
                </div>

                {/* Maquinaria */}
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, allowMachinery: !prev.allowMachinery }))}
                  style={{
                    backgroundColor: formData.allowMachinery ? '#dcfce7' : '#ffffff',
                    border: formData.allowMachinery ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    color: formData.allowMachinery ? '#15803d' : '#334155',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}>
                  <div className="flex items-center gap-2.5">
                    <Truck size={18} style={{ color: formData.allowMachinery ? '#16a34a' : '#94a3b8' }} />
                    <span style={{ fontSize: '12px', fontWeight: formData.allowMachinery ? '900' : '600' }}>Maquinaria / Flota</span>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    backgroundColor: formData.allowMachinery ? '#16a34a' : '#f1f5f9',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '900',
                    border: formData.allowMachinery ? 'none' : '1px solid #cbd5e1'
                  }}>
                    {formData.allowMachinery ? '✓' : ''}
                  </div>
                </div>

                {/* Eléctrico */}
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, allowElectrical: !prev.allowElectrical }))}
                  style={{
                    backgroundColor: formData.allowElectrical ? '#dcfce7' : '#ffffff',
                    border: formData.allowElectrical ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    color: formData.allowElectrical ? '#15803d' : '#334155',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}>
                  <div className="flex items-center gap-2.5">
                    <Zap size={18} style={{ color: formData.allowElectrical ? '#16a34a' : '#94a3b8' }} />
                    <span style={{ fontSize: '12px', fontWeight: formData.allowElectrical ? '900' : '600' }}>Riesgo Eléctrico</span>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    backgroundColor: formData.allowElectrical ? '#16a34a' : '#f1f5f9',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '900',
                    border: formData.allowElectrical ? 'none' : '1px solid #cbd5e1'
                  }}>
                    {formData.allowElectrical ? '✓' : ''}
                  </div>
                </div>

              </div>
            </div>

            {/* Observaciones y Restricciones */}
            <div>
              <label className="block text-xs font-extrabold mb-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Observaciones, Diagnósticos o Restricciones Médicas</label>
              <textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                rows={3} 
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 outline-none font-semibold text-sm text-slate-900 dark:text-white" 
                placeholder="Ej. Uso de lentes recetados obligatorio durante la jornada laboral..." 
              />
            </div>

            {/* Form Actions - Botones Cancelar y Guardar con estilos e inline forzados */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button 
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }} 
                style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '8px 18px', fontSize: '12px', fontWeight: '800', borderRadius: '8px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSave} 
                style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '8px 22px', fontSize: '12px', fontWeight: '900', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}>
                <CheckCircle2 size={16} />
                <span>{formData.id ? 'Actualizar Examen' : 'Guardar Examen'}</span>
              </button>
            </div>
          </div>
        ) : (

          /* Table & Search History Section */
          <div className="mt-8 space-y-4">
            <div className="flex flex-row items-center justify-between gap-3">
              {/* Input de Busqueda */}
              <div className="relative flex-1 max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Buscar trabajador o DNI..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full h-9 pl-9 pr-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none text-xs font-semibold text-slate-900 dark:text-white shadow-sm" 
                />
              </div>

              {/* Botón Nuevo Examen SUPER COMPACTO FORZADO INLINE */}
              <button 
                onClick={() => { resetForm(); setShowForm(true); }} 
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  height: '34px',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                }}>
                <Plus size={14} />
                <span>Nuevo Examen Médico</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  backgroundColor: statusFilter === 'all' ? '#2563eb' : '#ffffff',
                  color: statusFilter === 'all' ? '#ffffff' : '#334155',
                  border: statusFilter === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}>
                Todos ({metrics.total})
              </button>
              <button
                onClick={() => setStatusFilter('valid')}
                style={{
                  backgroundColor: statusFilter === 'valid' ? '#059669' : '#ffffff',
                  color: statusFilter === 'valid' ? '#ffffff' : '#334155',
                  border: statusFilter === 'valid' ? '1px solid #059669' : '1px solid #cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}>
                Aptos ({metrics.valid})
              </button>
              <button
                onClick={() => setStatusFilter('preexistencia')}
                style={{
                  backgroundColor: statusFilter === 'preexistencia' ? '#d97706' : '#ffffff',
                  color: statusFilter === 'preexistencia' ? '#ffffff' : '#334155',
                  border: statusFilter === 'preexistencia' ? '1px solid #d97706' : '1px solid #cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}>
                Preexistencias ({metrics.preexistencia})
              </button>
              <button
                onClick={() => setStatusFilter('expired')}
                style={{
                  backgroundColor: statusFilter === 'expired' ? '#dc2626' : '#ffffff',
                  color: statusFilter === 'expired' ? '#ffffff' : '#334155',
                  border: statusFilter === 'expired' ? '1px solid #dc2626' : '1px solid #cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}>
                Vencidos ({metrics.expired})
              </button>
            </div>

            {/* Data Table with hideHeader to avoid duplications */}
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <DataTable
                data={filtered}
                columns={columns}
                hideHeader={true}
                emptyMessage="No hay registros médicos cargados."
                emptyIcon={<HeartPulse size={48} />} 
              />
            </div>
          </div>
        )}

        {/* QR Modal */}
        {qrModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative border border-slate-200 dark:border-slate-800 space-y-4">
              <button 
                onClick={() => setQrModal(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent border-none cursor-pointer">
                <XCircle size={24} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <QrCode size={28} />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0">Credencial del Trabajador</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">{qrModal.workerName} (DNI: {qrModal.dni})</p>
              </div>
              
              <div className="bg-white p-4 rounded-2xl inline-block border border-slate-200 shadow-sm">
                <QRCodeSVG value={`${window.location.origin}/worker-portal/${qrModal.dni}`} size={180} />
              </div>

              <p className="text-xs text-slate-400">
                Escaneá este código QR para verificar la habilitación clínica y capacitaciones de este trabajador en tiempo real.
              </p>

              <div className="flex gap-2">
                <button 
                  onClick={() => { setQrModal(null); navigate(`/worker-portal/${qrModal.dni}`); }} 
                  style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ExternalLink size={14} /> Portal
                </button>
                <button 
                  onClick={() => setQrModal(null)} 
                  style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AnimatedPage>
  );
}