import React, { useState, useEffect } from 'react';
import { Shield, Plus, Search, Calendar, AlertTriangle, FileText, CheckCircle2, Siren, Users, Map } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import PremiumHeader from '../components/PremiumHeader';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import toast from 'react-hot-toast';

export default function EmergencyPlan() {
  const { currentUser } = useAuth();
  const { syncCollection } = useSync();
  const [plans, setPlans] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    facility: '',
    lastUpdate: new Date().toISOString().split('T')[0],
    nextDrill: '',
    brigadeLeader: '',
    status: 'active',
    emergencyContacts: ''
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const data = localStorage.getItem('ehs_emergency_plans');
    if (data) {
      setPlans(JSON.parse(data));
    }
  }, []);

  const handleSave = () => {
    if (!formData.title || !formData.facility) {
      toast.error('Complete el título y la instalación.');
      return;
    }

    const newRecord = {
      ...formData,
      id: formData.id || `EMP-${Date.now()}`
    };

    let updated;
    if (formData.id) {
      updated = plans.map((p) => p.id === formData.id ? newRecord : p);
      toast.success('Plan de Emergencia actualizado.');
    } else {
      updated = [newRecord, ...plans];
      toast.success('Plan de Emergencia registrado exitosamente.');
    }

    setPlans(updated);
    localStorage.setItem('ehs_emergency_plans', JSON.stringify(updated));
    syncCollection('ehs_emergency_plans', updated);
    setShowForm(false);
    setFormData({
      id: '',
      title: '',
      facility: '',
      lastUpdate: new Date().toISOString().split('T')[0],
      nextDrill: '',
      brigadeLeader: '',
      status: 'active',
      emergencyContacts: ''
    });
  };

  const columns = [
  {
    header: 'Título / Instalación',
    accessor: 'title',
    render: (item: any) => <div className="font-[700]">{item.title} <br /><span className="text-[0.8rem] text-[#64748b] font-[500]">{item.facility}</span></div>
  },
  {
    header: 'Última Revisión',
    accessor: 'lastUpdate',
    render: (item: any) => new Date(item.lastUpdate).toLocaleDateString('es-AR')
  },
  {
    header: 'Líder de Brigada',
    accessor: 'brigadeLeader'
  },
  {
    header: 'Próximo Simulacro',
    accessor: 'nextDrill',
    render: (item: any) => {
      if (!item.nextDrill) return '-';
      return new Date(item.nextDrill).toLocaleDateString('es-AR');
    }
  },
  {
    header: 'Estado',
    accessor: 'status',
    render: (item: any) =>
    <span style={{
      color: item.status === 'active' ? '#16a34a' : '#d97706',
      background: item.status === 'active' ? '#f0fdf4' : '#fffbeb'

    }} className="p-[4px_8px] rounded-[4px] font-[700] text-[0.8rem]">
                    {item.status === 'active' ? 'Vigente' : 'En Revisión'}
                </span>

  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <button onClick={() => {setFormData(item);setShowForm(true);}} className="p-[4px_8px] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[4px] cursor-pointer">
                    Editar
                </button>

  }];


  const filtered = plans.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.facility.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AnimatedPage>
            <div className="container pb-[6rem] min-h-[100vh] flex flex-col">
                <PremiumHeader
          title="Planes de Emergencia"
          subtitle="Gestión de roles, brigadas y simulacros"
          icon={<Siren size={36} color="#ffffff" />} />
        
                
                {showForm ?
        <div className="glass-card p-[2rem] mt-[2rem] rounded-[1rem] bg-[var(--color-surface)]">
                        <h2 className="m-[0_0_1.5rem_0] flex items-center gap-[0.5rem] text-[1.2rem] font-[800]">
                            <Map size={20} /> {formData.id ? 'Editar Plan' : 'Nuevo Plan'}
                        </h2>
                        
                        <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1rem]">
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Título del Plan</label>
                                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ej: Plan Evacuación Sede Central" className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Instalación / Sector</label>
                                <input type="text" value={formData.facility} onChange={(e) => setFormData({ ...formData, facility: e.target.value })} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Líder de Brigada</label>
                                <input type="text" value={formData.brigadeLeader} onChange={(e) => setFormData({ ...formData, brigadeLeader: e.target.value })} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Estado</label>
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]">
                                    <option value="active">Vigente</option>
                                    <option value="review">En Revisión</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Fecha de Última Revisión</label>
                                <input type="date" value={formData.lastUpdate} onChange={(e) => setFormData({ ...formData, lastUpdate: e.target.value })} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                            <div>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Próximo Simulacro</label>
                                <input type="date" value={formData.nextDrill} onChange={(e) => setFormData({ ...formData, nextDrill: e.target.value })} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                <label className="block text-[0.85rem] font-[700] mb-[0.5rem] text-[var(--color-text-muted)]">Contactos de Emergencia (Bomberos, Ambulancia, etc.)</label>
                                <textarea value={formData.emergencyContacts} onChange={(e) => setFormData({ ...formData, emergencyContacts: e.target.value })} rows={3} className="w-[100%] p-[0.75rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
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
                                <input type="text" placeholder="Buscar plan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.75rem_1rem_0.75rem_2.5rem] rounded-[8px] border-[1px_solid_var(--color-border)]" />
                            </div>
                            {!isMobile &&
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-[0.5rem]">
                                    <Plus size={18} /> Nuevo Plan
                                </button>
            }
                        </div>
                        
                        <div className="glass-card p-[1rem] rounded-[1rem] bg-[var(--color-surface)]">
                            <DataTable
              data={filtered}
              columns={columns}
              emptyMessage="No hay planes de emergencia cargados."
              emptyIcon={<Siren size={48} />} />
            
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