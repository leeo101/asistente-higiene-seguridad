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
    clinic: '',
    doctor: '',
    notes: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
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
      clinic: '',
      doctor: '',
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


  const filtered = exams.filter((e) => {
    const name = String(e?.workerName || '').toLowerCase();
    const term = String(searchTerm || '').toLowerCase();
    const dniStr = String(e?.dni || '');
    return name.includes(term) || dniStr.includes(term);
  });

  return (
    <AnimatedPage>
            <div className="container pb-[6rem] min-h-[100vh] flex flex-col">
                <PremiumHeader
          title="Aptitudes Médicas"
          subtitle="Gestión de exámenes preocupacionales y periódicos"
          icon={<HeartPulse size={36} color="#ffffff" />} />
        
                
                {showForm ?
        <div className="glass-card p-[2rem] mt-[2rem] rounded-[1rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] box-shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-[0.75rem] mb-[2rem] pb-[1rem] border-bottom-[1px_solid_var(--color-border)]">
                            <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(16,185,129,0.1)] flex items-center justify-center text-[#10b981]">
                                <FileText size={22} />
                            </div>
                            <div>
                                <h2 className="m-[0] text-[1.2rem] font-[900] text-[var(--color-text)]">
                                    {formData.id ? 'Editar Examen Médico' : 'Nuevo Registro de Examen'}
                                </h2>
                                <p className="m-[0] text-[0.8rem] text-[var(--color-text-muted)] font-[600]">Complete los datos clínicos del trabajador</p>
                            </div>
                        </div>
                        
                        <div style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))' }} className="grid gap-[1.5rem]">
                            <div>
                                <label className="block text-[0.85rem] font-[800] mb-[0.5rem] text-[var(--color-text)] uppercase letter-spacing-[0.5px]">Trabajador</label>
                                <input type="text" value={formData.workerName} onChange={(e) => setFormData({ ...formData, workerName: e.target.value })} className="w-[100%] p-[0.85rem] rounded-[10px] bg-[var(--color-background)] border-[2px_solid_var(--color-border)] focus:border-[#10b981] focus:ring-[3px] focus:ring-[rgba(16,185,129,0.2)] outline-none transition-all font-[600] text-[1rem]" placeholder="Ej. Juan Pérez" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[800] mb-[0.5rem] text-[var(--color-text)] uppercase letter-spacing-[0.5px]">DNI / CUIL</label>
                                <input type="text" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} className="w-[100%] p-[0.85rem] rounded-[10px] bg-[var(--color-background)] border-[2px_solid_var(--color-border)] focus:border-[#10b981] focus:ring-[3px] focus:ring-[rgba(16,185,129,0.2)] outline-none transition-all font-[600] text-[1rem]" placeholder="Sin puntos ni guiones" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[800] mb-[0.5rem] text-[var(--color-text)] uppercase letter-spacing-[0.5px]">Clínica / Institución</label>
                                <input type="text" value={formData.clinic} onChange={(e) => setFormData({ ...formData, clinic: e.target.value })} className="w-[100%] p-[0.85rem] rounded-[10px] bg-[var(--color-background)] border-[2px_solid_var(--color-border)] focus:border-[#10b981] focus:ring-[3px] focus:ring-[rgba(16,185,129,0.2)] outline-none transition-all font-[600] text-[1rem]" placeholder="Lugar de realización" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[800] mb-[0.5rem] text-[var(--color-text)] uppercase letter-spacing-[0.5px]">Médico / Matrícula</label>
                                <input type="text" value={formData.doctor} onChange={(e) => setFormData({ ...formData, doctor: e.target.value })} className="w-[100%] p-[0.85rem] rounded-[10px] bg-[var(--color-background)] border-[2px_solid_var(--color-border)] focus:border-[#10b981] focus:ring-[3px] focus:ring-[rgba(16,185,129,0.2)] outline-none transition-all font-[600] text-[1rem]" placeholder="Dr. Nombre Apellido (MP 123)" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[800] mb-[0.5rem] text-[var(--color-text)] uppercase letter-spacing-[0.5px]">Tipo de Examen</label>
                                <select value={formData.examType} onChange={(e) => setFormData({ ...formData, examType: e.target.value })} className="w-[100%] p-[0.85rem] rounded-[10px] bg-[var(--color-background)] border-[2px_solid_var(--color-border)] focus:border-[#10b981] focus:ring-[3px] focus:ring-[rgba(16,185,129,0.2)] outline-none transition-all font-[600] text-[1rem] cursor-pointer">
                                    <option value="preocupacional">Preocupacional</option>
                                    <option value="periodico">Periódico</option>
                                    <option value="egreso">De Egreso</option>
                                    <option value="cambio_tarea">Cambio de Tareas</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[800] mb-[0.5rem] text-[var(--color-text)] uppercase letter-spacing-[0.5px]">Resultado</label>
                                <select value={formData.result} onChange={(e) => setFormData({ ...formData, result: e.target.value })} className="w-[100%] p-[0.85rem] rounded-[10px] bg-[var(--color-background)] border-[2px_solid_var(--color-border)] focus:border-[#10b981] focus:ring-[3px] focus:ring-[rgba(16,185,129,0.2)] outline-none transition-all font-[600] text-[1rem] cursor-pointer" style={{ color: formData.result === 'apto' ? '#10b981' : formData.result === 'no_apto' ? '#ef4444' : '#f59e0b' }}>
                                    <option value="apto">Apto</option>
                                    <option value="preexistencias">Apto con Preexistencias</option>
                                    <option value="no_apto">No Apto</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[800] mb-[0.5rem] text-[var(--color-text)] uppercase letter-spacing-[0.5px]">Fecha Examen</label>
                                <input type="date" value={formData.examDate} onChange={(e) => setFormData({ ...formData, examDate: e.target.value })} className="w-[100%] p-[0.85rem] rounded-[10px] bg-[var(--color-background)] border-[2px_solid_var(--color-border)] focus:border-[#10b981] focus:ring-[3px] focus:ring-[rgba(16,185,129,0.2)] outline-none transition-all font-[600] text-[1rem]" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[800] mb-[0.5rem] text-[var(--color-text)] uppercase letter-spacing-[0.5px]">Vencimiento (Opcional)</label>
                                <input type="date" value={formData.expirationDate} onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} className="w-[100%] p-[0.85rem] rounded-[10px] bg-[var(--color-background)] border-[2px_solid_var(--color-border)] focus:border-[#10b981] focus:ring-[3px] focus:ring-[rgba(16,185,129,0.2)] outline-none transition-all font-[600] text-[1rem]" />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="block text-[0.85rem] font-[800] mb-[0.5rem] text-[var(--color-text)] uppercase letter-spacing-[0.5px]">Observaciones y Recomendaciones</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-[100%] p-[0.85rem] rounded-[10px] bg-[var(--color-background)] border-[2px_solid_var(--color-border)] focus:border-[#10b981] focus:ring-[3px] focus:ring-[rgba(16,185,129,0.2)] outline-none transition-all font-[600] text-[1rem]" placeholder="Ingrese cualquier detalle adicional relevante..." />
                            </div>
                        </div>
                        <div className="flex flex-col-reverse md:flex-row justify-end gap-[1rem] mt-[2.5rem] pt-[1.5rem] border-top-[1px_solid_var(--color-border)]">
                            <button onClick={() => setShowForm(false)} className="px-[1.5rem] py-[0.65rem] rounded-[8px] font-[700] text-[0.85rem] transition-all cursor-pointer" style={{ backgroundColor: 'rgba(100, 116, 139, 0.15)', border: '1px solid rgba(100, 116, 139, 0.3)', color: 'var(--color-text)' }}>Cancelar</button>
                            <button onClick={handleSave} className="px-[1.5rem] py-[0.65rem] rounded-[8px] font-[700] text-[0.85rem] text-white transition-all cursor-pointer flex items-center justify-center gap-[0.5rem]" style={{ backgroundColor: '#10b981', boxShadow: '0 4px 10px rgba(16,185,129,0.25)' }}>
                                <CheckCircle2 size={18} />
                                {formData.id ? 'Actualizar Examen' : 'Guardar Examen'}
                            </button>
                        </div>
                    </div> :

        <div className="mt-8 relative z-[50]">
                        <div className="flex justify-between items-center mb-[1.5rem] gap-[1rem] flex-wrap relative z-[50]">
                            <div style={{ width: isMobile ? '100%' : '450px' }} className="flex items-center border-[2px_solid_#10b981] rounded-[8px] bg-[rgba(16,185,129,0.02)] px-[1rem] focus-within:ring-[3px] focus-within:ring-[rgba(16,185,129,0.2)] transition-all">
                                <Search size={20} className="text-[#64748b] mr-[0.5rem] flex-shrink-0" />
                                <input type="text" placeholder="Buscar trabajador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] py-[0.85rem] bg-transparent border-none outline-none text-[1rem] font-[500] m-0" />
                            </div>
                            {!isMobile &&
            <button onClick={() => {
              setFormData({
                id: '',
                workerName: '',
                dni: '',
                examType: 'periodico',
                examDate: new Date().toISOString().split('T')[0],
                expirationDate: '',
                result: 'apto',
                clinic: '',
                doctor: '',
                notes: ''
              });
              setShowForm(true);
            }} className="flex items-center gap-[0.4rem] px-[0.9rem] py-[0.5rem] text-[0.85rem] text-white rounded-[8px] font-[700] transition-colors cursor-pointer" style={{ backgroundColor: '#10b981', boxShadow: '0 4px 10px rgba(16,185,129,0.2)' }}>
                                    <Plus size={16} /> Nuevo Examen
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
          <button onClick={() => {
              setFormData({
                id: '',
                workerName: '',
                dni: '',
                examType: 'periodico',
                examDate: new Date().toISOString().split('T')[0],
                expirationDate: '',
                result: 'apto',
                clinic: '',
                doctor: '',
                notes: ''
              });
              setShowForm(true);
            }} className="fixed bottom-[5rem] right-[1.5rem] w-[56px] h-[56px] rounded-[50%] bg-[var(--color-primary)] text-[white] border-none box-shadow-[0_4px_12px_rgba(0,0,0,0.2)] flex items-center justify-center z-[50]">
                                <Plus size={24} />
                            </button>
          }
                    </div>
        }
            </div>
        </AnimatedPage>);

}