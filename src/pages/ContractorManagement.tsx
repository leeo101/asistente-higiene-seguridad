import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Users, UserPlus, Buildings, Plus, X, MagnifyingGlass, 
  Trash, ArrowLeft, DownloadSimple, ShieldCheck, Warning, FileText, Camera, Cpu, Spinner
} from '@phosphor-icons/react';
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
  
  // Modals state
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  
  // Forms state
  const [contractorForm, setContractorForm] = useState<Partial<Contractor>>({});
  const [workerForm, setWorkerForm] = useState<Partial<Worker>>({});

  const [isMobile, setIsMobile] = useState(false);
  const [isAnalyzingContractor, setIsAnalyzingContractor] = useState(false);
  const [isAnalyzingWorker, setIsAnalyzingWorker] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, type: 'contractor' | 'worker', payload: string | null}>({isOpen: false, type: 'contractor', payload: null});

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
      case 'expired': return <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>VENCIDO</span>;
      case 'warning': return <span style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>PRÓXIMO A VENCER</span>;
      case 'ok': return <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>VIGENTE</span>;
      default: return <span style={{ background: 'rgba(255,255,255,0.1)', color: '#aaa', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>SIN DATO</span>;
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
      saveContractors(contractors.filter(c => c.id !== confirmModal.payload));
      saveWorkers(workers.filter(w => w.contractorId !== confirmModal.payload));
    } else if (confirmModal.type === 'worker' && confirmModal.payload) {
      saveWorkers(workers.filter(w => w.id !== confirmModal.payload));
    }
    setConfirmModal({ isOpen: false, type: 'contractor', payload: null });
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'contractor' | 'worker') => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (type === 'contractor') setIsAnalyzingContractor(true);
      else setIsAnalyzingWorker(true);

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
                  setContractorForm(prev => ({
                      ...prev,
                      name: data.name || prev.name,
                      cuit: data.idNumber || prev.cuit,
                      documentExpiresAt: data.expiryDate || prev.documentExpiresAt
                  }));
                  toast.success('✨ Datos de empresa extraídos con IA');
              } else {
                  setWorkerForm(prev => ({
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
          if (type === 'contractor') setIsAnalyzingContractor(false);
          else setIsAnalyzingWorker(false);
      }
  };

  return (
    <AnimatedPage>
      <div className="page-transition" style={{ padding: isMobile ? '7.5rem 0 2rem 0' : '6.5rem 0 2rem 0', minHeight: '100vh', background: 'var(--color-background)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Ambient Glows */}
        <div className="ambient-glow blue" style={{ top: '-10%', left: '-5%' }}></div>
        <div className="ambient-glow purple" style={{ top: '20%', right: '-10%', width: '400px', height: '400px' }}></div>
        <div className="ambient-glow primary" style={{ bottom: '-10%', left: '30%', opacity: 0.1 }}></div>

        {/* Header */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: isMobile ? '1rem' : '1.5rem', 
          borderBottom: '1px solid rgba(255,255,255,0.05)', 
          position: 'relative', 
          zIndex: 10
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center', 
            justifyContent: 'space-between',
            gap: isMobile ? '1rem' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
              <button onClick={() => navigate(-1)} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={20}  />
                        </button>
              <div style={{ flex: 1 }}>
                <h1 className="gradient-text" style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Contratistas</h1>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Control documental y personal</p>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              width: isMobile ? '100%' : 'auto',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              {!isPro && (
                <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
                  Límite Freemium: {workers.length}/5
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button className="primary-btn" onClick={() => setIsContractorModalOpen(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                  <Plus size={18} weight="bold" /> {isMobile ? 'Empresa' : 'Nuevo Contratista'}
                </button>
                <button onClick={() => {
                     if (contractors.length === 0) {
                         alert("Debes agregar un contratista primero.");
                         return;
                     }
                     setIsWorkerModalOpen(true);
                }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-primary)', background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                  <UserPlus size={18} /> {isMobile ? 'Trabajador' : 'Nuevo Trabajador'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: isMobile ? '1rem auto' : '2rem auto', padding: '0 1rem' }}>
          
          {/* Tabs & Search */}
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'stretch' : 'center', 
            marginBottom: '1.5rem', 
            gap: '1rem' 
          }}>
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem',
              width: isMobile ? '100%' : 'auto',
              background: 'rgba(255,255,255,0.05)',
              padding: '0.3rem',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <button 
                onClick={() => setActiveTab('contractors')}
                style={{
                  flex: isMobile ? 1 : 'none',
                  padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: activeTab === 'contractors' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'contractors' ? 'white' : 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  boxShadow: activeTab === 'contractors' ? '0 4px 15px rgba(59, 130, 246, 0.4)' : 'none'
                }}
              >
                Empresas ({contractors.length})
              </button>
              <button 
                onClick={() => setActiveTab('workers')}
                style={{
                  flex: isMobile ? 1 : 'none',
                  padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: activeTab === 'workers' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'workers' ? 'white' : 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  boxShadow: activeTab === 'workers' ? '0 4px 15px rgba(59, 130, 246, 0.4)' : 'none'
                }}
              >
                Trabajadores ({workers.length})
              </button>
            </div>
            
            <div style={{ position: 'relative', width: '100%', maxWidth: isMobile ? 'none' : '300px' }}>
              <MagnifyingGlass size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.8rem', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'white', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Contractors View */}
          {activeTab === 'contractors' && (
            <div className="bento-container" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', position: 'relative', zIndex: 10 }}>
              {contractors.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.cuit.includes(searchQuery)).map(contractor => (
                <div key={contractor.id} className="glass-card hover-lift" style={{ borderRadius: '24px', padding: '1.5rem', position: 'relative' }}>
                  <button onClick={() => handleDeleteContractor(contractor.id)} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}><Trash size={16} weight="bold" /></button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(255,255,255,0.1)', color: '#60a5fa', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)' }}>
                      <Buildings size={24} weight="duotone" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>{contractor.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700 }}>CUIT: {contractor.cuit}</p>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Contacto:</span> 
                        <strong style={{ fontWeight: 700 }}>{contractor.contactPhone}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Seguro Grales:</span> 
                      {getStatusBadge(checkExpiryStatus(contractor.documentExpiresAt))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Vencimiento:</span>
                        <strong style={{ fontWeight: 700 }}>{contractor.documentExpiresAt ? new Date(contractor.documentExpiresAt).toLocaleDateString() : 'N/A'}</strong>
                    </div>
                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', marginTop: '0.2rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Trabajadores asoc:</span> 
                      <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 800, color: 'white' }}>{workers.filter(w => w.contractorId === contractor.id).length}</span>
                    </div>
                  </div>
                </div>
              ))}
              {contractors.length === 0 && (
                <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)', borderRadius: '24px' }}>
                  <Buildings size={56} weight="duotone" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontWeight: 700 }}>No hay contratistas</h3>
                  <p style={{ margin: 0 }}>Registrá tu primera empresa para comenzar el seguimiento documental.</p>
                </div>
              )}
            </div>
          )}

          {/* Workers View (Bento Grid) */}
          {activeTab === 'workers' && (
            <div className="bento-container" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem', position: 'relative', zIndex: 10 }}>
                {workers.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.dni.includes(searchQuery)).map(worker => {
                const contractor = contractors.find(c => c.id === worker.contractorId);
                return (
                    <div key={worker.id} className="glass-card hover-lift" style={{ borderRadius: '24px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', position: 'relative' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.2))', border: '1px solid rgba(255,255,255,0.1)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                                <Users size={22} weight="duotone" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>{worker.name}</h3>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>DNI: {worker.dni} | {worker.position}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDeleteWorker(worker.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}><Trash size={16} weight="bold" /></button>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Buildings size={16} color="var(--color-primary)" weight="duotone" />
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 700 }}>{contractor?.name || 'Desconocida'}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vto. ART</span>
                            {getStatusBadge(checkExpiryStatus(worker.artExpiresAt))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vto. Seguro</span>
                            {getStatusBadge(checkExpiryStatus(worker.lifeInsuranceExpiresAt))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inducción</span>
                            {getStatusBadge(checkExpiryStatus(worker.inductionExpiresAt))}
                        </div>
                    </div>

                    </div>
                )
                })}
              
              {workers.length === 0 && (
                <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)', borderRadius: '24px' }}>
                  <Users size={56} weight="duotone" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontWeight: 700 }}>No hay trabajadores</h3>
                  <p style={{ margin: 0 }}>Registrá al primer trabajador para controlar sus documentos.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODALS */}
        {isContractorModalOpen && createPortal(
          <div 
            className="modal-portal-overlay"
            onClick={() => setIsContractorModalOpen(false)}
          >
            <div 
              className="glass-panel"
              style={{ 
                width: '100%', 
                maxWidth: '500px', 
                borderRadius: isMobile ? '24px 24px 0 0' : '24px', 
                padding: '2rem', 
                maxHeight: isMobile ? '90vh' : '85vh', 
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.7)'
              }} 
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-heading)', letterSpacing: '-0.5px' }}>Añadir Contratista</h2>
                <button 
                  onClick={() => setIsContractorModalOpen(false)} 
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: 'none', 
                    borderRadius: '10px', 
                    width: '36px', 
                    height: '36px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'var(--color-text-muted)', 
                    cursor: 'pointer',
                    transition: 'all 0.2s' 
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <X size={20} />
                </button>
              </div>

              {/* AI Button */}
              <div style={{ marginBottom: '1.5rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px dashed rgba(139, 92, 246, 0.5)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  {isAnalyzingContractor ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
                          <Loader2 className="animate-spin" size={20} />
                          <span style={{ fontWeight: 600 }}>Analizando documento...</span>
                      </div>
                  ) : (
                      <>
                          <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
                              <div style={{ background: '#8b5cf6', color: 'white', padding: '0.5rem', borderRadius: '50%' }}>
                                  <Cpu size={24} weight="duotone" />
                              </div>
                              <span style={{ fontWeight: 700 }}>Autocompletar con IA</span>
                              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Subí un Constancia AFIP o Seguro</span>
                              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleDocumentUpload(e, 'contractor')} style={{ display: 'none' }} />
                          </label>
                      </>
                  )}
              </div>

              <form onSubmit={handleAddContractor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div><label>Razón Social / Empresa</label><input required type="text" value={contractorForm.name || ''} onChange={e => setContractorForm({...contractorForm, name: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                <div><label>CUIT</label><input required type="text" value={contractorForm.cuit || ''} onChange={e => setContractorForm({...contractorForm, cuit: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  <div><label>Email Contacto</label><input type="email" value={contractorForm.contactEmail || ''} onChange={e => setContractorForm({...contractorForm, contactEmail: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                  <div><label>Teléfono</label><input type="tel" value={contractorForm.contactPhone || ''} onChange={e => setContractorForm({...contractorForm, contactPhone: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                </div>
                <div><label>Vencimiento Doc. Principal (ART/Cláusulas Grales)</label><input type="date" required value={contractorForm.documentExpiresAt || ''} onChange={e => setContractorForm({...contractorForm, documentExpiresAt: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                <button type="submit" className="primary-btn" style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Guardar Contratista</button>
              </form>
            </div>
          </div>,
          document.getElementById('modal-root') || document.body
        )}

        {isWorkerModalOpen && createPortal(
          <div 
            className="modal-portal-overlay"
            onClick={() => setIsWorkerModalOpen(false)}
          >
            <div 
              className="glass-panel"
              style={{ 
                width: '100%', 
                maxWidth: '500px', 
                borderRadius: isMobile ? '24px 24px 0 0' : '24px', 
                padding: '2rem', 
                maxHeight: isMobile ? '90vh' : '85vh', 
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.7)'
              }} 
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-heading)', letterSpacing: '-0.5px' }}>Añadir Trabajador</h2>
                <button 
                  onClick={() => setIsWorkerModalOpen(false)} 
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: 'none', 
                    borderRadius: '10px', 
                    width: '36px', 
                    height: '36px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'var(--color-text-muted)', 
                    cursor: 'pointer',
                    transition: 'all 0.2s' 
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <X size={20} />
                </button>
              </div>

              {/* AI Button */}
              <div style={{ marginBottom: '1.5rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px dashed rgba(139, 92, 246, 0.5)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  {isAnalyzingWorker ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
                          <Loader2 className="animate-spin" size={20} />
                          <span style={{ fontWeight: 600 }}>Analizando documento...</span>
                      </div>
                  ) : (
                      <>
                          <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
                              <div style={{ background: '#8b5cf6', color: 'white', padding: '0.5rem', borderRadius: '50%' }}>
                                  <Cpu size={24} weight="duotone" />
                              </div>
                              <span style={{ fontWeight: 700 }}>Escanear DNI o ART</span>
                              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Autocompleta nombre, DNI y fechas</span>
                              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleDocumentUpload(e, 'worker')} style={{ display: 'none' }} />
                          </label>
                      </>
                  )}
              </div>

              <form onSubmit={handleAddWorker} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label>Empresa Contratista</label>
                  <select required value={workerForm.contractorId || ''} onChange={e => setWorkerForm({...workerForm, contractorId: e.target.value})} className="form-input" style={{ width: '100%' }}>
                    <option value="" disabled>Seleccionar contratista...</option>
                    {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label>Nombre Completo</label><input required type="text" value={workerForm.name || ''} onChange={e => setWorkerForm({...workerForm, name: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  <div><label>DNI</label><input required type="text" value={workerForm.dni || ''} onChange={e => setWorkerForm({...workerForm, dni: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                  <div><label>Puesto</label><input required type="text" value={workerForm.position || ''} onChange={e => setWorkerForm({...workerForm, position: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                </div>
                <div><label>Vencimiento ART</label><input required type="date" value={workerForm.artExpiresAt || ''} onChange={e => setWorkerForm({...workerForm, artExpiresAt: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                <div><label>Vencimiento Seguro Vida</label><input required type="date" value={workerForm.lifeInsuranceExpiresAt || ''} onChange={e => setWorkerForm({...workerForm, lifeInsuranceExpiresAt: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                <div><label>Vencimiento Inducción/Capacitación</label><input type="date" value={workerForm.inductionExpiresAt || ''} onChange={e => setWorkerForm({...workerForm, inductionExpiresAt: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                <button type="submit" className="primary-btn" style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Guardar Trabajador</button>
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
          type="danger"
        />

      </div>
    </AnimatedPage>
  );
}
