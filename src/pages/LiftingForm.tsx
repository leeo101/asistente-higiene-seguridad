import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, ShieldCheck, Weight, ArrowDownToLine, Users, Printer, Share2, Pencil, Search, Plus, Trash2, Calendar, CheckCircle2, FileText, Building2, Download, ClipboardList, QrCode } from 'lucide-react';
import { Crane } from '@phosphor-icons/react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import LiftingPdfGenerator from '../components/LiftingPdfGenerator';
import ConfirmModal from '../components/ConfirmModal';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import QRModal from '../components/QRModal';
import { DataTable } from '../components/DataTable';
import { auth } from '../firebase';
import { downloadCSV } from '../services/exportCsv';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';

export default function LiftingForm(): React.ReactElement | null {
  const currentUser = auth.currentUser;
  const [qrTarget, setQrTarget] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

  useDocumentTitle(isEdit ? 'Editar Plan de Izaje' : 'Planes de Izaje');

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = JSON.parse(localStorage.getItem('lifting_plans_db') || '[]');
    setPlans(saved);
  }, [isFormVisible]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = plans.filter((p: any) => p.id !== confirmModal.payload);
      localStorage.setItem('lifting_plans_db', JSON.stringify(updated));
      setPlans(updated);
      toast.success('Registro eliminado');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredPlans = plans.filter((p: any) =>
  p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  p.personnel?.operator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  p.equipment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [plan, setPlan] = useState<any>({
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    equipment: 'Grua Movil',
    equipmentCapacity: '',
    loadWeight: '',
    maxRadius: '',
    windSpeed: '',
    riggingElements: {
      slings: false,
      shackles: false,
      spreaderBar: false,
      hooks: false
    },
    personnel: {
      operator: '',
      rigger: '',
      supervisor: ''
    },
    checklist: {
      groundStable: false,
      areaIsolated: false,
      weatherGood: false,
      powerLinesClear: false,
      elementsInspected: false
    },
    observations: '',
    signatures: {
      operator: '',
      supervisor: ''
    },
    operatorSignature: '',
    professionalSignature: '',
    supervisorSignature: '',
    showSignatures: { operator: true, professional: true, supervisor: true }
  });

  const [professional, setProfessional] = useState<any>({
    name: '',
    license: '',
    signature: null,
    stamp: null
  });

  const setShowSignatures = (updater: any) => {
    setPlan((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = plan.showSignatures || { operator: true, professional: true, supervisor: true };

  useEffect(() => {
    const savedData = localStorage.getItem('personalData');
    const savedSigData = localStorage.getItem('signatureStampData');
    const legacySignature = localStorage.getItem('capturedSignature');

    let signature = legacySignature || null;
    let stamp = null;
    if (savedSigData) {
      const parsed = JSON.parse(savedSigData);
      signature = parsed.signature || signature;
      stamp = parsed.stamp || null;
    }

    if (savedData) {
      const data = JSON.parse(savedData);
      setProfessional({
        name: data.name || '',
        license: data.license || '',
        signature: signature,
        stamp: stamp
      });
    } else {
      setProfessional((prev: any) => ({ ...prev, signature, stamp }));
    }
  }, []);

  useEffect(() => {
    if (location.state?.editData) {
      const editData = location.state.editData;
      setPlan({
        ...editData,
        operatorSignature: editData.operatorSignature || editData.signatures?.operator || '',
        professionalSignature: editData.professionalSignature || '',
        supervisorSignature: editData.supervisorSignature || editData.signatures?.supervisor || '',
        showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
      });
      setIsEdit(true);
      setIsFormVisible(true);
    }
  }, [location.state]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateLoadPercentage = () => {
    const load = parseFloat(plan.loadWeight);
    const capacity = parseFloat(plan.equipmentCapacity);
    if (isNaN(load) || isNaN(capacity) || capacity === 0) return 0;
    return (load / capacity * 100).toFixed(1);
  };

  const handleSave = () => {
    if (!plan.location || !plan.loadWeight || !plan.equipmentCapacity) {
      toast.error('Complete la Ubicación y los pesos de carga y capacidad');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('lifting_plans_db') || '[]');
    let updated;

    const planWithSignatures = {
      ...plan,
      professionalSignature: plan.professionalSignature || professional.signature,
      professionalName: plan.professionalName || professional.name,
      professionalLicense: plan.professionalLicense || professional.license,
      professionalStamp: plan.professionalStamp || professional.stamp,
      signatures: {
        operator: plan.operatorSignature,
        supervisor: plan.supervisorSignature
      }
    };

    if (isEdit) {
      updated = saved.map((p: any) => p.id === (plan as any).id ? planWithSignatures : p);
      toast.success('Plan de Izaje actualizado');
    } else {
      const newPlan = {
        ...planWithSignatures,
        id: `LIFT-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      updated = [newPlan, ...saved];
      toast.success('Plan de Izaje guardado');
    }

    localStorage.setItem('lifting_plans_db', JSON.stringify(updated));

    setIsFormVisible(false);
    setIsEdit(false);
    setPlan({
      location: '', date: new Date().toISOString().split('T')[0], time: '',
      equipment: 'Grua Movil', equipmentCapacity: '', loadWeight: '', maxRadius: '', windSpeed: '',
      riggingElements: { slings: false, shackles: false, spreaderBar: false, hooks: false },
      personnel: { operator: '', rigger: '', supervisor: '' },
      checklist: { groundStable: false, areaIsolated: false, weatherGood: false, powerLinesClear: false, elementsInspected: false },
      observations: '', signatures: { operator: '', supervisor: '' },
      operatorSignature: '', professionalSignature: '', supervisorSignature: '',
      showSignatures: { operator: true, professional: true, supervisor: true }
    });
    window.scrollTo(0, 0);
  };

  const toggleChecklist = (key: string) => {
    setPlan((prev) => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: !(prev.checklist as any)[key] }
    }));
  };

  const loadPercentage = calculateLoadPercentage();
  const isCritical = parseFloat(loadPercentage as string) >= 75;

  const handleExportCSV = () => {
    requirePro(() => {
      downloadCSV(plans.map((i: any) => ({
        ubicacion: i.location, fecha: i.date,
        equipo: i.equipment || '', capacidad: i.equipmentCapacity || '', carga: i.loadWeight || ''
      })), 'izaje_historial', {
        ubicacion: 'Ubicación/Maniobra', fecha: 'Fecha',
        equipo: 'Equipo', capacidad: 'Capacidad (kg)', carga: 'Carga (kg)'
      });
    });
  };

  const columns = [
  {
    header: 'Fecha',
    accessor: 'date',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)] white-space-[nowrap]">
                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
                </span>
  },
  {
    header: 'Maniobra / Ubicación',
    accessor: 'location',
    sortable: true,
    render: (item: any) =>
    <div className="flex items-center gap-[0.8rem]">
                    <div className="bg-[rgba(16,185,129,0.1)] p-[0.5rem] rounded-[8px] text-[var(--color-secondary)]">
                        <Weight size={16} />
                    </div>
                    <div className="font-[700]">{item.location || 'Sin ubicación'}</div>
                </div>
  },
  {
    header: 'Equipo',
    accessor: 'equipment',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem]">
                    <Building2 size={14} /> {item.equipment || '—'}
                </span>
  },
  {
    header: 'Criticidad',
    accessor: 'id',
    render: (item: any) => {
        const loadRatio = item.loadWeight && item.equipmentCapacity ? parseFloat(item.loadWeight) / parseFloat(item.equipmentCapacity) * 100 : 0;
        const isCritical = loadRatio >= 75;
        return (
            <span style={{ background: isCritical ? '#fef2f2' : '#f0fdf4', color: isCritical ? '#dc2626' : '#16a34a' }} className="p-[0.3rem_0.6rem] rounded-[6px] text-[0.75rem] font-[900] flex items-center gap-[0.25rem] max-w-max">
                {isCritical ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />} {isCritical ? 'CRÍTICO' : 'NORMAL'}
            </span>
        );
    }
  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <div className="flex items-center gap-1.5">
                    <button onClick={(e) => {e.stopPropagation();setPlan({...item, showSignatures: item.showSignatures || {operator: true, professional: true, supervisor: true}});setIsEdit(true);setIsFormVisible(true);}} title="Ver" style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><FileText size={16} /></button>
                    <button onClick={(e) => {e.stopPropagation();requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/lifting/${item.id}?print=true`;setQrTarget({ text: url, title: `Plan Izaje — ${item.location}` } as any);})}} title="QR" style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><QrCode size={16} /></button>
                    <button onClick={(e) => {e.stopPropagation();requirePro(() => setShareItem(item))}} title="Compartir" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><Share2 size={16} /></button>
                    <button onClick={(e) => {e.stopPropagation();handleDelete(item.id, e)}} title="Eliminar" style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><Trash2 size={16} /></button>
                </div>
  }];

  if (!isFormVisible && !isEdit) {
    return (
      <div className="container w-full max-w-[1200px] mx-auto pt-24 pb-32">
        <div className="no-print">
          <PremiumHeader
            title="Planes de Izaje"
            subtitle="Gestión e historial de planes de izaje seguro."
            icon={<Weight size={32} color="#ffffff" />}
          />
        </div>
        
                <main className="w-full">
                        {/* KPIs */}
                        <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-[1rem] mb-[2rem]">
                            <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)] flex items-center gap-[1rem]">
                                <div className="bg-blue-100 text-blue-600 p-[1rem] rounded-[12px]"><ClipboardList size={28} /></div>
                                <div>
                                    <div className="text-[0.8rem] font-[800] text-[var(--color-text-muted)] uppercase">Planes Generados</div>
                                    <div className="text-[1.8rem] font-[900] text-[var(--color-text)]">{plans.length}</div>
                                </div>
                            </div>
                            <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)] flex items-center gap-[1rem]">
                                <div className="bg-red-100 text-red-600 p-[1rem] rounded-[12px]"><AlertTriangle size={28} /></div>
                                <div>
                                    <div className="text-[0.8rem] font-[800] text-[var(--color-text-muted)] uppercase">Izajes Críticos</div>
                                    <div className="text-[1.8rem] font-[900] text-[var(--color-text)]">{plans.filter(p => {const load = parseFloat(p.loadWeight); const cap = parseFloat(p.equipmentCapacity); return (load/cap)*100 >= 75;}).length}</div>
                                </div>
                            </div>
                            <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)] flex items-center gap-[1rem]">
                                <div className="bg-green-100 text-green-600 p-[1rem] rounded-[12px]"><CheckCircle2 size={28} /></div>
                                <div>
                                    <div className="text-[0.8rem] font-[800] text-[var(--color-text-muted)] uppercase">Planes Última Semana</div>
                                    <div className="text-[1.8rem] font-[900] text-[var(--color-text)]">{plans.filter(h => new Date(h.createdAt || h.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-[1.5rem] flex gap-[1rem] flex-wrap items-stretch bg-[var(--color-surface,_#fff)] p-[1.5rem] rounded-[24px] box-shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-[1px_solid_rgba(0,0,0,0.05)]">
                            <div className="flex-[1_1_250px] relative">
                                <Search size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                type="text"
                placeholder="Buscar por ubicación o equipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => {e.currentTarget.style.border = '2px solid #3b82f6';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)';}}
                onBlur={(e) => {e.currentTarget.style.border = '2px solid transparent';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = 'none';}}
                style={{ width: '100%', height: '100%', minHeight: '3.5rem', padding: '0.75rem 1rem 0.75rem 3.5rem', borderRadius: '1rem', border: '2px solid transparent', backgroundColor: 'rgba(241, 245, 249, 0.5)', fontSize: '1rem', outline: 'none', transition: 'all 0.3s', fontWeight: 500, color: 'var(--color-text)' }} />
                            </div>
                            
                            <div className="flex gap-[0.5rem]">
                                <button
                  onClick={() => setIsFormVisible(true)}
                  onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 12px 25px rgba(16,185,129,0.4)';}}
                  onMouseOut={(e) => {e.currentTarget.style.transform = 'none';e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)';}}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0 1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', fontWeight: 800, borderRadius: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.3)', whiteSpace: 'nowrap', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', height: '100%', minHeight: '3.5rem' }}>
                                    <Plus size={22} strokeWidth={2.5} /> Nuevo Plan
                                </button>
                                
                                {plans.length > 0 &&
                                    <button
                                        onClick={handleExportCSV}
                                        onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 12px 25px rgba(59,130,246,0.4)';}}
                                        onMouseOut={(e) => {e.currentTarget.style.transform = 'none';e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.3)';}}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0 1.5rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#ffffff', fontWeight: 800, borderRadius: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(59,130,246,0.3)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', height: '100%', minHeight: '3.5rem' }}>
                                        <Download size={20} strokeWidth={2.5} /> Excel
                                    </button>
                                }
                            </div>
                        </div>

                        <DataTable
            data={filteredPlans}
            columns={columns}
            searchPlaceholder="Buscar..."
            hideHeader={true}
            emptyMessage="No se encontraron planes de izaje."
            emptyIcon={<Weight size={48} />} />
          
                        {qrTarget && <QRModal text={(qrTarget as any).text} title={(qrTarget as any).title} onClose={() => setQrTarget(null)} />}
                        
                        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar registro?"
          message="Esta acción no se puede deshacer."
          type="danger"
          iconEmoji="🗑️" />

                        <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Plan Izaje - ${(shareItem as any)?.location || ''}`} rawMessage={shareItem ? `📋 Plan de Izaje\n📍 Ubicación: ${(shareItem as any).location}\n🏗️ Equipo: ${(shareItem as any).equipment}\n📅 Fecha: ${(shareItem as any).date}` : ''} text={shareItem ? `📋 Plan de Izaje\n📍 Ubicación: ${(shareItem as any).location}\n🏗️ Equipo: ${(shareItem as any).equipment}\n📅 Fecha: ${(shareItem as any).date}` : ''} elementIdToPrint="pdf-content" fileName={`Izaje_${(shareItem as any)?.location?.replace(/\s+/g, '_') || 'Reporte'}.pdf`} />
                        <div className="ats-pdf-offscreen print-only opacity-[0.01] pointer-events-none fixed left-[-9999px]" id="pdf-content">
                            {shareItem && <LiftingPdfGenerator data={{
                              ...(shareItem as any),
                              professionalSignature: (shareItem as any).professionalSignature || professional.signature,
                              professionalName: (shareItem as any).professionalName || professional.name,
                              professionalLicense: (shareItem as any).professionalLicense || professional.license,
                              professionalStamp: (shareItem as any).professionalStamp || professional.stamp,
                              signatures: {
                                operator: (shareItem as any).operatorSignature || (shareItem as any).signatures?.operator || '',
                                supervisor: (shareItem as any).supervisorSignature || (shareItem as any).signatures?.supervisor || ''
                              }
                            }} />}
                        </div>
                </main>
      </div>);
  }

  return (
    <ModuleFormLayout className="pt-[100px] pb-32">
            <ModuleFormToolbar onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined}
      title={isEdit ? 'Editar Plan de Izaje' : 'Nuevo Plan de Izaje'}
      subtitle="Complete la información del plan de izaje."
      icon={<Crane size={32} color="#ffffff" />}
      />

        <ModuleFormDocument className="no-print">
            <ModuleFormSection title="Datos de la Maniobra" icon={<Crane />}>
                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1.5rem]">
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Ubicación de la Maniobra *</label>
                            <input type="text" value={plan.location} onChange={(e) => setPlan({ ...plan, location: e.target.value })} className="module-form-input" placeholder="Sector, Plataforma..." />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Fecha</label>
                            <input type="date" value={plan.date} onChange={(e) => setPlan({ ...plan, date: e.target.value })} className="module-form-input" />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Hora Estimada</label>
                            <input type="time" value={plan.time} onChange={(e) => setPlan({ ...plan, time: e.target.value })} className="module-form-input" />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Equipo a Utilizar</label>
                            <select value={plan.equipment} onChange={(e) => setPlan({ ...plan, equipment: e.target.value })} className="module-form-input">
                                <option value="Grua Movil">Grúa Móvil</option>
                                <option value="Grua Torre">Grúa Torre</option>
                                <option value="Puente Grua">Puente Grúa</option>
                                <option value="Autoelevador">Autoelevador</option>
                                <option value="Hidrogrúa">Hidrogrúa</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Velocidad Viento (km/h)</label>
                            <input type="number" value={plan.windSpeed} onChange={(e) => setPlan({ ...plan, windSpeed: e.target.value })} className="module-form-input" placeholder="Máx 32 km/h" />
                        </div>
                    </div>
            </ModuleFormSection>

            <ModuleFormSection title="Cálculos de Carga" icon={<Weight />}>
                    <div className="p-[1.5rem] rounded-[12px] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)]">
                        <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }} className="grid gap-[1rem]">
                            <div>
                                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Peso Total a Izar (kg) *</label>
                                <input type="number" value={plan.loadWeight} onChange={(e) => setPlan({ ...plan, loadWeight: e.target.value })} className="module-form-input" placeholder="Incluye accesorios" />
                            </div>
                            <div>
                                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Capacidad Bruta Grúa (kg) *</label>
                                <input type="number" value={plan.equipmentCapacity} onChange={(e) => setPlan({ ...plan, equipmentCapacity: e.target.value })} className="module-form-input" placeholder="Capacidad a radio max" />
                            </div>
                            <div>
                                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Porcentaje Capacidad</label>
                                <div style={{
                                    background: isCritical ? '#dc2626' : '#16a34a'
                                }} className="p-[0.75rem] rounded-[12px] text-[white] font-[900] text-[1.1rem] text-center mt-[0.2rem]">
                                    {loadPercentage}%
                                </div>
                            </div>
                        </div>
                    </div>
            </ModuleFormSection>

            <ModuleFormSection title="Personal y Seguridad" icon={<Users />}>
                <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[2rem]">
                        <div>
                            <h3 className="m-[0_0_1rem_0] text-[1.1rem] font-[800] text-[var(--color-primary)]">Personal Involucrado</h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Operador del Equipo</label>
                                    <input type="text" value={plan.personnel.operator} onChange={(e) => setPlan({ ...plan, personnel: { ...plan.personnel, operator: e.target.value } })} className="module-form-input" />
                                </div>
                                <div>
                                    <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Rigger / Señalero</label>
                                    <input type="text" value={plan.personnel.rigger} onChange={(e) => setPlan({ ...plan, personnel: { ...plan.personnel, rigger: e.target.value } })} className="module-form-input" />
                                </div>
                                <div>
                                    <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Supervisor a cargo</label>
                                    <input type="text" value={plan.personnel.supervisor} onChange={(e) => setPlan({ ...plan, personnel: { ...plan.personnel, supervisor: e.target.value } })} className="module-form-input" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="m-[0_0_1rem_0] text-[1.1rem] font-[800] text-[var(--color-primary)]">Condiciones de Seguridad</h3>
                            <div className="flex flex-col gap-3">
                                {[
                { key: 'groundStable', label: 'Terreno Firme y Nivelado' },
                { key: 'areaIsolated', label: 'Área Delimitada y Señalizada' },
                { key: 'weatherGood', label: 'Condiciones Climáticas Favorables' },
                { key: 'powerLinesClear', label: 'Distancia de Líneas Eléctricas' },
                { key: 'elementsInspected', label: 'Elementos de Izaje Inspeccionados' }].
                map((item) =>
                <button
                  key={item.key}
                  onClick={() => toggleChecklist(item.key)}
                  style={{
                    background: (plan.checklist as any)[item.key] ? 'rgba(22, 163, 74, 0.1)' : 'var(--color-surface)',
                    border: `2px solid ${(plan.checklist as any)[item.key] ? '#16a34a' : 'var(--color-border)'}`
                  }} className="p-[0.75rem] rounded-[var(--radius-lg)] cursor-pointer flex items-center gap-[0.75rem] text-left">
                  
                                        <div style={{ background: (plan.checklist as any)[item.key] ? '#16a34a' : 'transparent' }} className="w-[20px] h-[20px] rounded-[6px] border-[2px_solid_#16a34a] flex items-center justify-center flex-shrink-[0]">
                                            {(plan.checklist as any)[item.key] && <ShieldCheck size={14} color="#fff" />}
                                        </div>
                                        <span className="text-[0.9rem] font-[600]">{item.label}</span>
                                    </button>
                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Observaciones Adicionales</label>
                        <textarea
              value={plan.observations}
              onChange={(e) => setPlan({ ...plan, observations: e.target.value })}
              className="module-form-input min-h-[100px]"
              placeholder="Interferencias, maniobras complejas..." />
            
                    </div>
            </ModuleFormSection>

            <ModuleFormSection title="Firmas y Autorizaciones" icon={<Pencil />}>
                        {/* Signature Visibility Toggles (Pill style) */}
                        <div className="no-print mb-[2rem] p-[1.2rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[16px] flex flex-col gap-[1rem] box-shadow-[0_4px_6px_rgba(0,0,0,0.02)]">
                            <div className="text-[var(--color-text)] text-[0.85rem] font-[800] uppercase letter-spacing-[0.5px]">
                                INCLUIR FIRMAS EN EL DOCUMENTO:
                            </div>
                            <div className="flex gap-[1rem] flex-wrap">
                                {[
                { id: 'operator', label: 'Operador', checked: showSignatures.operator },
                { id: 'professional', label: 'Especialista H&S', checked: showSignatures.professional },
                { id: 'supervisor', label: 'Supervisor de Izaje', checked: showSignatures.supervisor }].
                map((sig) =>
                <label key={sig.id} style={{
                  background: sig.checked ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-background)',
                  border: `1px solid ${sig.checked ? '#38bdf8' : 'var(--color-border)'}`
                }} className="flex items-center gap-[0.5rem] cursor-pointer p-[0.5rem_1rem] rounded-[20px] transition-[all_0.2s_ease]">
                                        <div style={{
                    border: `2px solid ${sig.checked ? '#38bdf8' : 'var(--color-text-secondary)'}`,
                    background: sig.checked ? '#38bdf8' : 'transparent'
                  }} className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center">
                                            {sig.checked && <span className="text-[#fff] text-[12px] font-[bold]">✓</span>}
                                        </div>
                                        <input
                    type="checkbox"
                    checked={sig.checked}
                    onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))} className="hidden" />

                   
                                        <span style={{ fontWeight: sig.checked ? 700 : 500, color: sig.checked ? 'var(--color-text)' : 'var(--color-text-secondary)' }} className="text-[0.9rem]">
                                            {sig.label}
                                        </span>
                                    </label>
                )}
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <div className="mb-[2.5rem]">
                            <PdfSignatures
                data={{
                  ...plan,
                  professionalSignature: professional.signature,
                  professionalName: professional.name,
                  professionalLicense: professional.license,
                  professionalStamp: professional.stamp
                }}
                box1={showSignatures.operator ? {
                  title: 'OPERADOR DEL EQUIPO',
                  subtitle: (plan.personnel?.operator || 'Firma del Operador').toUpperCase(),
                  signatureUrl: plan.operatorSignature || null,
                  isProfessional: false
                } : null}
                box2={showSignatures.professional ? {
                  title: 'PROFESIONAL H&S',
                  subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                  signatureUrl: plan.professionalSignature || professional.signature || null,
                  stampUrl: plan.professionalStamp || professional.stamp || null,
                  isProfessional: true,
                  license: professional.license
                } : null}
                box3={showSignatures.supervisor ? {
                  title: 'SUPERVISOR DE IZAJE',
                  subtitle: (plan.personnel?.supervisor || 'Firma del Supervisor').toUpperCase(),
                  signatureUrl: plan.supervisorSignature || null,
                  isProfessional: false
                } : null} />
              
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads - Premium Glassmorphism */}
                        <div className="no-print grid grid-template-columns-[repeat(auto-fit,_minmax(300px,_1fr))] gap-[2rem] mt-[2rem]">
                            {showSignatures.operator &&
              <div className="animate-fade-in bg-[rgba(var(--color-surface-rgb),_0.3)] backdrop-filter-[blur(10px)] rounded-[16px] p-[1.5rem] border-[1px_solid_var(--glass-border)]">
                                    <div className="text-[0.85rem] font-[800] text-[var(--color-text-secondary)] mb-[1rem] uppercase letter-spacing-[0.5px]">
                                        Firma del Operador
                                    </div>
                                    <SignatureCanvas
                  onSave={(sig) => setPlan((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                  initialImage={plan.operatorSignature}
                  label="" />
                
                                </div>
              }
                            
                            {showSignatures.professional &&
              <div className="animate-fade-in bg-[rgba(var(--color-surface-rgb),_0.3)] backdrop-filter-[blur(10px)] rounded-[16px] p-[1.5rem] border-[1px_solid_var(--glass-border)]">
                                    <div className="text-[0.85rem] font-[800] text-[var(--color-text-secondary)] mb-[1rem] uppercase letter-spacing-[0.5px]">
                                        Firma de Especialista H&S
                                    </div>
                                    <SignatureCanvas
                  onSave={(sig) => setPlan((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                  initialImage={plan.professionalSignature || professional.signature}
                  label="" />
                
                                </div>
              }

                            {showSignatures.supervisor &&
              <div className="animate-fade-in bg-[rgba(var(--color-surface-rgb),_0.3)] backdrop-filter-[blur(10px)] rounded-[16px] p-[1.5rem] border-[1px_solid_var(--glass-border)]">
                                    <div className="text-[0.85rem] font-[800] text-[var(--color-text-secondary)] mb-[1rem] uppercase letter-spacing-[0.5px]">
                                        Firma del Supervisor
                                    </div>
                                    <SignatureCanvas
                  onSave={(sig) => setPlan((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                  initialImage={plan.supervisorSignature}
                  label="" />
                
                                </div>
              }
                        </div>
            </ModuleFormSection>
        </ModuleFormDocument>

        <ModuleActionBar
            actions={[
                { id: 'save', label: 'GUARDAR', icon: <Save />, variant: 'primary', onClick: () => requirePro(handleSave) },
                { id: 'share', label: 'COMPARTIR', icon: <Share2 />, variant: 'info', onClick: () => requirePro(() => setShowShareModal(true)) },
                { id: 'print', label: 'IMPRIMIR', icon: <Printer />, variant: 'secondary', onClick: () => requirePro(() => window.print()) }
            ]}
        />

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Plan de Izaje"
        text={`Plan de Izaje en ${plan.location}`}
        rawMessage={`Plan de Izaje en ${plan.location}`}
        fileName={`Izaje_${plan.location?.replace(/\s+/g, '_') || 'Nuevo'}.pdf`} />
      

            <div className="print-only fixed left-[-9999px] top-[0] opacity-[0.01] pointer-events-none" id="pdf-content">
                <LiftingPdfGenerator data={{
          ...plan,
          professionalSignature: plan.professionalSignature || professional.signature,
          professionalName: plan.professionalName || professional.name,
          professionalLicense: plan.professionalLicense || professional.license,
          professionalStamp: plan.professionalStamp || professional.stamp,
          signatures: {
            operator: plan.operatorSignature || plan.signatures?.operator || '',
            supervisor: plan.supervisorSignature || plan.signatures?.supervisor || ''
          }
        }} />
            </div>
    </ModuleFormLayout>);
}