import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Users, UserPlus, Buildings, Plus, X, MagnifyingGlass,
  Trash, ArrowLeft, DownloadSimple, ShieldCheck, Warning, FileText, Camera, Cpu, Spinner } from
'@phosphor-icons/react';
import { Loader2 } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { auth } from '../firebase';
import AnimatedPage from '../components/AnimatedPage';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import ConfirmModal from '../components/ConfirmModal';

// Interfaces
export interface Contractor {
  id: string;
  name: string;
  cuit: string;
  contactEmail: string;
  contactPhone: string;
  documentExpiresAt: string;
  createdAt?: string;
}

export interface Worker {
  id: string;
  contractorId: string;
  name: string;
  dni: string;
  position: string;
  artExpiresAt: string;
  lifeInsuranceExpiresAt: string;
  inductionExpiresAt: string;
}

export default function ContractorManagement() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isPro } = usePaywall();
  const { syncCollection, syncPulse } = useSync();

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [activeTab, setActiveTab] = useState<'contractors' | 'workers'>('contractors');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyExpired, setShowOnlyExpired] = useState(false);

  // Modals state
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);

  // Forms state
  const [contractorForm, setContractorForm] = useState<Partial<Contractor>>({});
  const [workerForm, setWorkerForm] = useState<Partial<Worker>>({});

  const [isMobile, setIsMobile] = useState(false);
  const [isAnalyzingContractor, setIsAnalyzingContractor] = useState(false);
  const [isAnalyzingWorker, setIsAnalyzingWorker] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean;type: 'contractor' | 'worker';payload: string | null;}>({ isOpen: false, type: 'contractor', payload: null });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    // Load data from localStorage initially and listen to cloud updates
    try {
      const savedContractors = localStorage.getItem('contractors_data');
      if (savedContractors) setContractors(JSON.parse(savedContractors));

      const savedWorkers = localStorage.getItem('workers_data');
      if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
    } catch (e) {
      console.error('Error loading contractor data', e);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [syncPulse]);

  const saveContractors = (data: Contractor[]) => {
    setContractors(data);
    localStorage.setItem('contractors_data', JSON.stringify(data));
    syncCollection('contractors_data', data);
  };

  const saveWorkers = (data: Worker[]) => {
    setWorkers(data);
    localStorage.setItem('workers_data', JSON.stringify(data));
    syncCollection('workers_data', data);
  };

  const checkExpiryStatus = (dateString: string) => {
    if (!dateString) return 'none';
    const now = new Date();
    const expiry = new Date(dateString);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'warning';
    return 'ok';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'expired':return <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md text-[0.7rem] font-extrabold uppercase tracking-wider">VENCIDO</span>;
      case 'warning':return <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-md text-[0.7rem] font-extrabold uppercase tracking-wider">PRÓXIMO A VENCER</span>;
      case 'ok':return <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[0.7rem] font-extrabold uppercase tracking-wider">VIGENTE</span>;
      default:return <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md text-[0.7rem] font-extrabold uppercase tracking-wider">SIN DATO</span>;
    }
  };

  const handleAddContractor = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = Date.now().toString();
    const newContractor = {
      ...contractorForm,
      id: newId,
      createdAt: new Date().toISOString()
    } as Contractor;

    saveContractors([...contractors, newContractor]);
    setContractorForm({});
    setIsContractorModalOpen(false);
  };

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro && workers.length >= 5) {
      alert("La versión Freemium permite hasta 5 trabajadores. Actualiza a Pro para carga ilimitada.");
      return;
    }

    const newWorker = {
      ...workerForm,
      id: Date.now().toString()
    } as Worker;

    saveWorkers([...workers, newWorker]);
    setWorkerForm({});
    setIsWorkerModalOpen(false);
  };

  const handleDeleteContractor = (id: string) => {
    setConfirmModal({ isOpen: true, type: 'contractor', payload: id });
  };

  const handleDeleteWorker = (id: string) => {
    setConfirmModal({ isOpen: true, type: 'worker', payload: id });
  };

  const executeConfirmAction = () => {
    if (confirmModal.type === 'contractor' && confirmModal.payload) {
      saveContractors(contractors.filter((c) => c.id !== confirmModal.payload));
      saveWorkers(workers.filter((w) => w.contractorId !== confirmModal.payload));
    } else if (confirmModal.type === 'worker' && confirmModal.payload) {
      saveWorkers(workers.filter((w) => w.id !== confirmModal.payload));
    }
    setConfirmModal({ isOpen: false, type: 'contractor', payload: null });
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'contractor' | 'worker') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'contractor') setIsAnalyzingContractor(true);else
    setIsAnalyzingWorker(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const response = await fetch(`${API_BASE_URL}/api/analyze-contractor-doc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
          },
          body: JSON.stringify({ image: base64Image })
        });

        if (!response.ok) {
          throw new Error('Error en el análisis de IA');
        }

        const data = await response.json();

        if (type === 'contractor') {
          setContractorForm((prev) => ({
            ...prev,
            name: data.name || prev.name,
            cuit: data.idNumber || prev.cuit,
            documentExpiresAt: data.expiryDate || prev.documentExpiresAt
          }));
          toast.success('✨ Datos de empresa extraídos con IA');
        } else {
          setWorkerForm((prev) => ({
            ...prev,
            name: data.name || prev.name,
            dni: data.idNumber || prev.dni,
            artExpiresAt: data.documentType === 'ART' ? data.expiryDate : prev.artExpiresAt,
            lifeInsuranceExpiresAt: data.documentType === 'SEGURO' ? data.expiryDate : prev.lifeInsuranceExpiresAt
          }));
          toast.success('✨ Datos de trabajador extraídos con IA');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error analyzing document:', err);
      toast.error('No se pudo analizar el documento');
    } finally {
      if (type === 'contractor') setIsAnalyzingContractor(false);else
      setIsAnalyzingWorker(false);
    }
  };

  return (
    <AnimatedPage>
      <div className={`page-transition min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-900 ${isMobile ? 'pt-[7.5rem] pb-8' : 'pt-[6.5rem] pb-8'}`}>
        
        {/* Ambient Glows */}
        <div className="ambient-glow blue top-[-10%] left-[-5%]"></div>
        <div className="ambient-glow purple top-[20%] right-[-10%] w-[400px] h-[400px]"></div>
        <div className="ambient-glow primary bottom-[-10%] left-[30%] opacity-[0.1]"></div>

        {/* Header */}
        <div className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 relative z-10 ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className={`max-w-[1200px] mx-auto flex justify-between ${isMobile ? 'flex-col items-start gap-4' : 'flex-row items-center gap-0'}`}>
            <div className="flex items-center gap-4 w-full">
              <></>
              <div className="flex-1">
                <h1 className={`gradient-text m-0 font-black tracking-tight ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Contratistas</h1>
                <p className="m-0 text-sm text-slate-500 dark:text-slate-400 font-medium">Control documental y personal</p>
              </div>
            </div>
            
            <div className={`flex gap-2 ${isMobile ? 'w-full flex-col' : 'w-auto flex-row'}`}>
              {!isPro &&
              <div className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30 rounded-lg text-xs font-bold text-center">
                  Límite Freemium: {workers.length}/5
                </div>
              }
              <div className="flex gap-2 w-full">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-none bg-blue-600 text-white font-bold cursor-pointer text-sm shadow-sm hover:bg-blue-700 transition-colors" onClick={() => setIsContractorModalOpen(true)}>
                  <Plus size={18} weight="bold" /> {isMobile ? 'Empresa' : 'Nuevo Contratista'}
                </button>
                <button onClick={() => {
                  if (contractors.length === 0) {
                    alert("Debes agregar un contratista primero.");
                    return;
                  }
                  setIsWorkerModalOpen(true);
                }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold cursor-pointer text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40">
                  <UserPlus size={18} /> {isMobile ? 'Trabajador' : 'Nuevo Trabajador'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`max-w-[1200px] px-4 ${isMobile ? 'mx-auto my-4' : 'mx-auto my-8'}`}>
          
          {/* Tabs & Search */}
          <div className={`flex justify-between mb-6 gap-4 ${isMobile ? 'flex-col items-stretch' : 'flex-row items-center'}`}>
            <div className={`flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm ${isMobile ? 'w-full flex-col' : 'w-auto flex-row'}`}>
              <button
                onClick={() => setActiveTab('contractors')}
                className={`${isMobile ? 'flex-1' : 'flex-none'} px-5 py-2.5 rounded-xl font-extrabold text-sm cursor-pointer transition-all border-none ${activeTab === 'contractors' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                
                Empresas ({contractors.length})
              </button>
              <button
                onClick={() => setActiveTab('workers')}
                className={`${isMobile ? 'flex-1' : 'flex-none'} px-5 py-2.5 rounded-xl font-extrabold text-sm cursor-pointer transition-all border-none ${activeTab === 'workers' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                
                Trabajadores ({workers.length})
              </button>
            </div>
            
            <div className={`flex gap-3 items-center w-full ${isMobile ? '' : 'max-w-md'}`}>
              <div className="relative flex-1">
              <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none text-sm shadow-sm" />
                
            </div>
              <button
                onClick={() => setShowOnlyExpired(!showOnlyExpired)}
                className={`flex-none px-4 py-3 rounded-xl border ${showOnlyExpired ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-400 font-bold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'} text-sm cursor-pointer transition-colors shadow-sm`}>
                
                Solo Vencidos
              </button>
            </div>
          </div>

          {/* Contractors View */}
          {activeTab === 'contractors' &&
          <div className={`grid gap-6 relative z-10 ${isMobile ? 'grid-cols-1' : 'grid-cols-[repeat(auto-fill,minmax(340px,1fr))]'}`}>
              {contractors.
            filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.cuit.includes(searchQuery)).
            filter((c) => showOnlyExpired ? checkExpiryStatus(c.documentExpiresAt) === 'expired' : true).
            map((contractor) =>
            <div key={contractor.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 relative shadow-sm hover:shadow-md transition-all group">
                  <button onClick={() => handleDeleteContractor(contractor.id)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-500 flex items-center justify-center cursor-pointer transition-colors hover:bg-red-100 dark:hover:bg-red-900/40 opacity-0 group-hover:opacity-100"><Trash size={16} weight="bold" /></button>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shadow-sm">
                      <Buildings size={24} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="m-0 text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{contractor.name}</h3>
                      <p className="m-0 text-xs font-bold text-blue-500">CUIT: {contractor.cuit}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Contacto:</span> 
                        <strong className="font-bold">{contractor.contactPhone}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Seguro Grales:</span> 
                      {getStatusBadge(checkExpiryStatus(contractor.documentExpiresAt))}
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Vencimiento:</span>
                        <strong className="font-bold">{contractor.documentExpiresAt ? new Date(contractor.documentExpiresAt).toLocaleDateString() : 'N/A'}</strong>
                    </div>
                    <div className="border-t border-dashed border-slate-300 dark:border-slate-700 mt-1 pt-3 flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Trabajadores asoc:</span> 
                      <span className="bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full font-bold text-slate-700 dark:text-slate-300 text-xs">{workers.filter((w) => w.contractorId === contractor.id).length}</span>
                    </div>
                  </div>
                </div>
            )}
              {contractors.length === 0 &&
            <div className="col-span-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-16 text-center text-slate-500 dark:text-slate-400">
                  <Buildings size={56} weight="duotone" className="opacity-50 mx-auto mb-4" />
                  <h3 className="m-0 mb-2 text-slate-800 dark:text-slate-100 font-bold">No hay contratistas</h3>
                  <p className="m-0 text-sm">Registrá tu primera empresa para comenzar el seguimiento documental.</p>
                </div>
            }
            </div>
          }

          {/* Workers View (Bento Grid) */}
          {activeTab === 'workers' &&
          <div className="bento-container gap-[1.5rem] relative z-[10]" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))' }}>
                {workers.
            filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.dni.includes(searchQuery)).
            filter((w) => showOnlyExpired ? checkExpiryStatus(w.artExpiresAt) === 'expired' || checkExpiryStatus(w.lifeInsuranceExpiresAt) === 'expired' : true).
            map((worker) => {
              const contractor = contractors.find((c) => c.id === worker.contractorId);
              return (
                <div key={worker.id} className="glass-card hover-lift rounded-[24px] p-[1.5rem] flex flex-col gap-[1.2rem] relative">
                    
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shadow-sm">
                                <Users size={22} weight="duotone" />
                            </div>
                            <div>
                                <h3 className="m-0 text-[1.15rem] font-black text-slate-800 dark:text-slate-100 tracking-tight">{worker.name}</h3>
                                <p className="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400">DNI: {worker.dni} | {worker.position}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDeleteWorker(worker.id)} className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-500 flex items-center justify-center cursor-pointer transition-colors hover:bg-red-100 dark:hover:bg-red-900/40 opacity-0 group-hover:opacity-100"><Trash size={16} weight="bold" /></button>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700/50 flex items-center gap-2">
                        <Buildings size={16} color="var(--color-primary)" weight="duotone" />
                        <span className="text-[0.85rem] text-blue-600 dark:text-blue-400 font-bold">{contractor?.name || 'Desconocida'}</span>
                    </div>

                    <div className={`grid gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                        <div className={`flex items-center gap-1.5 text-center ${isMobile ? 'flex-row justify-between' : 'flex-col justify-center'}`}>
                            <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">Vto. ART</span>
                            {getStatusBadge(checkExpiryStatus(worker.artExpiresAt))}
                        </div>
                        <div className={`flex items-center gap-1.5 text-center ${isMobile ? 'flex-row justify-between' : 'flex-col justify-center'}`}>
                            <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">Vto. Seguro</span>
                            {getStatusBadge(checkExpiryStatus(worker.lifeInsuranceExpiresAt))}
                        </div>
                        <div className={`flex items-center gap-1.5 text-center ${isMobile ? 'flex-row justify-between' : 'flex-col justify-center'}`}>
                            <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">Inducción</span>
                            {getStatusBadge(checkExpiryStatus(worker.inductionExpiresAt))}
                        </div>
                    </div>

                    </div>);

            })}
              
              {workers.length === 0 &&
            <div className="col-span-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-16 text-center text-slate-500 dark:text-slate-400">
                  <Users size={56} weight="duotone" className="opacity-[0.5] mb-[1rem]" />
                  <h3 className="m-0 mb-2 text-slate-800 dark:text-slate-100 font-bold">No hay trabajadores</h3>
                  <p className="m-0 text-sm">Registrá al primer trabajador para controlar sus documentos.</p>
                </div>
            }
            </div>
          }
        </div>

        {/* MODALS */}
        {isContractorModalOpen && createPortal(
          <div
            className="modal-portal-overlay"
            onClick={() => setIsContractorModalOpen(false)}>
            
            <div className={`bg-white dark:bg-slate-800 w-full max-w-lg p-8 relative overflow-y-auto shadow-[0_25px_70px_-10px_rgba(0,0,0,0.5)] ${isMobile ? 'rounded-t-3xl max-h-[90vh]' : 'rounded-3xl max-h-[85vh]'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-space-between items-center mb-[1.5rem]">
                <h2 className="m-0 text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Añadir Contratista</h2>
                <button onClick={() => setIsContractorModalOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* AI Button */}
              <div className="mb-6 bg-purple-50 dark:bg-purple-900/10 border border-dashed border-purple-300 dark:border-purple-500/50 p-4 rounded-xl text-center">
                  {isAnalyzingContractor ?
                <div className="flex items-center justify-center gap-[0.5rem] text-[#8b5cf6]">
                          <Loader2 className="animate-spin" size={20} />
                          <span className="font-[600]">Analizando documento...</span>
                      </div> :

                <>
                          <label className="cursor-pointer flex flex-col items-center gap-[0.5rem] text-[#8b5cf6]">
                              <div className="bg-[#8b5cf6] text-[white] p-[0.5rem] rounded-[50%]">
                                  <Cpu size={24} weight="duotone" />
                              </div>
                              <span className="font-[700]">Autocompletar con IA</span>
                              <span className="text-[0.8rem] opacity-[0.8]">Subí un Constancia AFIP o Seguro</span>
                              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleDocumentUpload(e, 'contractor')} className="none" />
                          </label>
                      </>
                }
              </div>

              <form onSubmit={handleAddContractor} className="flex flex-col gap-4">
                <div><label>Razón Social / Empresa</label><input required type="text" value={contractorForm.name || ''} onChange={(e) => setContractorForm({ ...contractorForm, name: e.target.value })} className="form-input w-[100%]" /></div>
                <div><label>CUIT</label><input required type="text" value={contractorForm.cuit || ''} onChange={(e) => setContractorForm({ ...contractorForm, cuit: e.target.value })} className="form-input w-[100%]" /></div>
                <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1rem]">
                  <div><label>Email Contacto</label><input type="email" value={contractorForm.contactEmail || ''} onChange={(e) => setContractorForm({ ...contractorForm, contactEmail: e.target.value })} className="form-input w-[100%]" /></div>
                  <div><label>Teléfono</label><input type="tel" value={contractorForm.contactPhone || ''} onChange={(e) => setContractorForm({ ...contractorForm, contactPhone: e.target.value })} className="form-input w-[100%]" /></div>
                </div>
                <div><label>Vencimiento Doc. Principal (ART/Cláusulas Grales)</label><input type="date" required value={contractorForm.documentExpiresAt || ''} onChange={(e) => setContractorForm({ ...contractorForm, documentExpiresAt: e.target.value })} className="form-input w-[100%]" /></div>
                <button type="submit" className="mt-4 px-4 py-3 rounded-xl border-none bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-sm w-full">Guardar Contratista</button>
              </form>
            </div>
          </div>,
          document.getElementById('modal-root') || document.body
        )}

        {isWorkerModalOpen && createPortal(
          <div
            className="modal-portal-overlay"
            onClick={() => setIsWorkerModalOpen(false)}>
            
            <div className={`bg-white dark:bg-slate-800 w-full max-w-lg p-8 relative overflow-y-auto shadow-[0_25px_70px_-10px_rgba(0,0,0,0.5)] ${isMobile ? 'rounded-t-3xl max-h-[90vh]' : 'rounded-3xl max-h-[85vh]'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-space-between items-center mb-[1.5rem]">
                <h2 className="m-0 text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Añadir Trabajador</h2>
                <button onClick={() => setIsWorkerModalOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* AI Button */}
              <div className="mb-6 bg-purple-50 dark:bg-purple-900/10 border border-dashed border-purple-300 dark:border-purple-500/50 p-4 rounded-xl text-center">
                  {isAnalyzingWorker ?
                <div className="flex items-center justify-center gap-[0.5rem] text-[#8b5cf6]">
                          <Loader2 className="animate-spin" size={20} />
                          <span className="font-[600]">Analizando documento...</span>
                      </div> :

                <>
                          <label className="cursor-pointer flex flex-col items-center gap-[0.5rem] text-[#8b5cf6]">
                              <div className="bg-[#8b5cf6] text-[white] p-[0.5rem] rounded-[50%]">
                                  <Cpu size={24} weight="duotone" />
                              </div>
                              <span className="font-[700]">Escanear DNI o ART</span>
                              <span className="text-[0.8rem] opacity-[0.8]">Autocompleta nombre, DNI y fechas</span>
                              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleDocumentUpload(e, 'worker')} className="none" />
                          </label>
                      </>
                }
              </div>

              <form onSubmit={handleAddWorker} className="flex flex-col gap-4">
                <div>
                  <label>Empresa Contratista</label>
                  <select required value={workerForm.contractorId || ''} onChange={(e) => setWorkerForm({ ...workerForm, contractorId: e.target.value })} className="form-input w-[100%]">
                    <option value="" disabled>Seleccionar contratista...</option>
                    {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label>Nombre Completo</label><input required type="text" value={workerForm.name || ''} onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })} className="form-input w-[100%]" /></div>
                <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1rem]">
                  <div><label>DNI</label><input required type="text" value={workerForm.dni || ''} onChange={(e) => setWorkerForm({ ...workerForm, dni: e.target.value })} className="form-input w-[100%]" /></div>
                  <div><label>Puesto</label><input required type="text" value={workerForm.position || ''} onChange={(e) => setWorkerForm({ ...workerForm, position: e.target.value })} className="form-input w-[100%]" /></div>
                </div>
                <div><label>Vencimiento ART</label><input required type="date" value={workerForm.artExpiresAt || ''} onChange={(e) => setWorkerForm({ ...workerForm, artExpiresAt: e.target.value })} className="form-input w-[100%]" /></div>
                <div><label>Vencimiento Seguro Vida</label><input required type="date" value={workerForm.lifeInsuranceExpiresAt || ''} onChange={(e) => setWorkerForm({ ...workerForm, lifeInsuranceExpiresAt: e.target.value })} className="form-input w-[100%]" /></div>
                <div><label>Vencimiento Inducción/Capacitación</label><input type="date" value={workerForm.inductionExpiresAt || ''} onChange={(e) => setWorkerForm({ ...workerForm, inductionExpiresAt: e.target.value })} className="form-input w-[100%]" /></div>
                <button type="submit" className="mt-4 px-4 py-3 rounded-xl border-none bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-sm w-full">Guardar Trabajador</button>
              </form>
            </div>
          </div>,
          document.getElementById('modal-root') || document.body
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, type: 'contractor', payload: null })}
          onConfirm={executeConfirmAction}
          title={confirmModal.type === 'contractor' ? '¿Eliminar contratista?' : '¿Eliminar trabajador?'}
          message={confirmModal.type === 'contractor' ? 'Se eliminará el contratista y todos sus trabajadores asociados. Esta acción no se puede deshacer.' : 'Esta acción no se puede deshacer.'}
          iconEmoji="🗑️"
          type="danger" />
        

      </div>
    </AnimatedPage>);

}