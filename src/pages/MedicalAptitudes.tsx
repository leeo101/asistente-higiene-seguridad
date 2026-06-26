import React, { useState, useEffect } from 'react';
import { Shield, Plus, Search, Calendar, HeartPulse, UserCheck, AlertTriangle, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import PremiumHeader from '../components/PremiumHeader';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import toast from 'react-hot-toast';

export default function MedicalAptitudes() {
  const { currentUser } = useAuth();
  const { syncCollection } = useSync();
  const [exams, setExams] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    workerName: '',
    dni: '',
    examType: 'periodico',
    examDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    result: 'apto',
    notes: ''
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const data = localStorage.getItem('ehs_medical_db');
    if (data) {
      setExams(JSON.parse(data));
    }
  }, []);

  const handleSave = () => {
    if (!formData.workerName || !formData.dni) {
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
      toast.success('Examen actualizado.');
    } else {
      updated = [newRecord, ...exams];
      toast.success('Examen registrado exitosamente.');
    }

    setExams(updated);
    localStorage.setItem('ehs_medical_db', JSON.stringify(updated));
    syncCollection('ehs_medical_db', updated);
    setShowForm(false);
    setFormData({
      id: '',
      workerName: '',
      dni: '',
      examType: 'periodico',
      examDate: new Date().toISOString().split('T')[0],
      expirationDate: '',
      result: 'apto',
      notes: ''
    });
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'apto':return <span className="text-[#16a34a] bg-[#f0fdf4] p-[4px_8px] rounded-[4px] font-[700] text-[0.8rem] flex items-center gap-[4px] w-[fit-content]"><CheckCircle2 size={14} /> Apto</span>;
      case 'preexistencias':return <span className="text-[#d97706] bg-[#fffbeb] p-[4px_8px] rounded-[4px] font-[700] text-[0.8rem] flex items-center gap-[4px] w-[fit-content]"><AlertTriangle size={14} /> Apto c/ Preexistencias</span>;
      case 'no_apto':return <span className="text-[#dc2626] bg-[#fef2f2] p-[4px_8px] rounded-[4px] font-[700] text-[0.8rem] flex items-center gap-[4px] w-[fit-content]"><XCircle size={14} /> No Apto</span>;
      default:return null;
    }
  };

  const columns = [
  {
    header: 'Fecha',
    accessor: 'examDate',
    render: (item: any) => new Date(item.examDate).toLocaleDateString('es-AR')
  },
  {
    header: 'Trabajador',
    accessor: 'workerName',
    render: (item: any) => <div className="font-[700]">{item.workerName} <br /><span className="text-[0.8rem] text-[#64748b] font-[500]">DNI: {item.dni}</span></div>
  },
  {
    header: 'Tipo de Examen',
    accessor: 'examType',
    render: (item: any) => <span className="capitalize">{item.examType.replace('_', ' ')}</span>
  },
  {
    header: 'Vencimiento',
    accessor: 'expirationDate',
    render: (item: any) => {
      if (!item.expirationDate) return '-';
      const exp = new Date(item.expirationDate);
      const isExpired = exp < new Date();
      return <span style={{ color: isExpired ? '#dc2626' : 'inherit', fontWeight: isExpired ? 800 : 'normal' }}>{exp.toLocaleDateString('es-AR')} {isExpired && ' (Vencido)'}</span>;
    }
  },
  {
    header: 'Resultado',
    accessor: 'result',
    render: (item: any) => getResultBadge(item.result)
  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <button onClick={() => {setFormData(item);setShowForm(true);}} className="p-[4px_8px] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[4px] cursor-pointer">
                    Editar
                </button>

  }];


  const filtered = exams.filter((e) => e.workerName.toLowerCase().includes(searchTerm.toLowerCase()) || e.dni.includes(searchTerm));

  return (
    <AnimatedPage>
            <div className="container pb-[6rem] min-h-[100vh] flex flex-col">
                <PremiumHeader
          title="Aptitudes Médicas"
          subtitle="Gestión de exámenes preocupacionales y periódicos"
          icon={<HeartPulse size={36} color="#ffffff" />} />
        
                
                {showForm ?
        <div className="glass-card p-[2rem] mt-[2rem] rounded-[1rem] bg-[var(--color-surface)]">
                        <h2 className="m-[0_0_1.5rem_0] flex items-center gap-[0.5rem] text-[1.2rem] font-[800]">
                            <FileText size={20} /> {formData.id ? 'Editar Examen' : 'Nuevo Registro'}
                        </h2>
                        
                        <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1rem]">
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Trabajador</label>
                                <input type="text" value={formData.workerName} onChange={(e) => setFormData({ ...formData, workerName: e.target.value })} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">DNI / CUIL</label>
                                <input type="text" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Tipo de Examen</label>
                                <select value={formData.examType} onChange={(e) => setFormData({ ...formData, examType: e.target.value })} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]">
                                    <option value="preocupacional">Preocupacional</option>
                                    <option value="periodico">Periódico</option>
                                    <option value="egreso">De Egreso</option>
                                    <option value="cambio_tarea">Cambio de Tareas</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Resultado</label>
                                <select value={formData.result} onChange={(e) => setFormData({ ...formData, result: e.target.value })} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]">
                                    <option value="apto">Apto</option>
                                    <option value="preexistencias">Apto con Preexistencias</option>
                                    <option value="no_apto">No Apto</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Fecha Examen</label>
                                <input type="date" value={formData.examDate} onChange={(e) => setFormData({ ...formData, examDate: e.target.value })} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Vencimiento (Opcional)</label>
                                <input type="date" value={formData.expirationDate} onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Observaciones</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                        </div>
                        <div className="flex gap-[1rem] mt-[2rem]">
                            <button onClick={() => setShowForm(false)} className="btn-secondary flex-[1]">Cancelar</button>
                            <button onClick={handleSave} className="btn-primary flex-[1] bg-[#10b981]">Guardar</button>
                        </div>
                    </div> :

        <div className="mt-8">
                        <div className="flex justify-space-between mb-[1.5rem]">
                            <div style={{ width: isMobile ? '100%' : '300px' }} className="relative">
                                <Search size={18} className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] text-[#64748b]" />
                                <input type="text" placeholder="Buscar trabajador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.75rem_1rem_0.75rem_2.5rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                            {!isMobile &&
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-[0.5rem]">
                                    <Plus size={18} /> Nuevo Examen
                                </button>
            }
                        </div>
                        
                        <div className="glass-card p-[1rem] rounded-[1rem] bg-[var(--color-surface)]">
                            <DataTable
              data={filtered}
              columns={columns}
              emptyMessage="No hay registros médicos cargados."
              emptyIcon={<HeartPulse size={48} />} />
            
                        </div>

                        {isMobile &&
          <button onClick={() => setShowForm(true)} className="fixed bottom-[5rem] right-[1.5rem] w-[56px] h-[56px] rounded-[50%] bg-[var(--color-primary)] text-[white] border-none box-shadow-[0_4px_12px_rgba(0,0,0,0.2)] flex items-center justify-center z-[10]">
                                <Plus size={24} />
                            </button>
          }
                    </div>
        }
            </div>
        </AnimatedPage>);

}