import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Buildings, Plus, X, MagnifyingGlass, 
  Trash, ArrowLeft, DownloadSimple, ShieldCheck, Warning, FileText, Camera, Sparkle, Spinner
} from '@phosphor-icons/react';
import { Loader2 } from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';

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

  // AI State
  const [isAnalyzingContractor, setIsAnalyzingContractor] = useState(false);
  const [isAnalyzingWorker, setIsAnalyzingWorker] = useState(false);

  useEffect(() => {
    // Load data from localStorage initially and listen to cloud updates
    try {
      const savedContractors = localStorage.getItem('contractors_data');
      if (savedContractors) setContractors(JSON.parse(savedContractors));
      
      const savedWorkers = localStorage.getItem('workers_data');
      if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
    } catch (e) {
      console.error('Error loading contractor data', e);
    }
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
    if (window.confirm('¿Eliminar contratista y todos sus trabajadores asociados?')) {
      saveContractors(contractors.filter(c => c.id !== id));
      saveWorkers(workers.filter(w => w.contractorId !== id));
    }
  };

  const handleDeleteWorker = (id: string) => {
    if (window.confirm('¿Eliminar trabajador?')) {
      saveWorkers(workers.filter(w => w.id !== id));
    }
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
                  headers: { 'Content-Type': 'application/json' },
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
      <div className="page-transition" style={{ padding: '0 0 2rem 0', minHeight: '100vh', background: 'var(--color-background)' }}>
        
        {/* Header */}
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => navigate(-1)} className="icon-btn" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-heading)' }}>Gestión de Contratistas</h1>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Control documental y vencimientos</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              {!isPro && (
                <div style={{ padding: '0.5rem 1rem', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  Límite Freemium: {workers.length}/5 Trabajadores
                </div>
              )}
              <button className="primary-btn" onClick={() => setIsContractorModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                <Plus size={18} weight="bold" /> Nuevo Contratista
              </button>
              <button onClick={() => {
                   if (contractors.length === 0) {
                       alert("Debes agregar un contratista primero.");
                       return;
                   }
                   setIsWorkerModalOpen(true);
              }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--color-primary)', background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>
                <UserPlus size={18} /> Nuevo Trabajador
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
          
          {/* Tabs & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setActiveTab('contractors')}
                style={{
                  padding: '0.5rem 1.2rem', borderRadius: '20px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === 'contractors' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === 'contractors' ? 'white' : 'var(--color-text-muted)'
                }}
              >
                Empresas ({contractors.length})
              </button>
              <button 
                onClick={() => setActiveTab('workers')}
                style={{
                  padding: '0.5rem 1.2rem', borderRadius: '20px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === 'workers' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === 'workers' ? 'white' : 'var(--color-text-muted)'
                }}
              >
                Trabajadores ({workers.length})
              </button>
            </div>
            
            <div style={{ position: 'relative', minWidth: '250px' }}>
              <MagnifyingGlass size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'white', outline: 'none' }}
              />
            </div>
          </div>

          {/* Contractors View */}
          {activeTab === 'contractors' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {contractors.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.cuit.includes(searchQuery)).map(contractor => (
                <div key={contractor.id} className="card hover-lift" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.2rem', position: 'relative' }}>
                  <button onClick={() => handleDeleteContractor(contractor.id)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><Trash size={18} /></button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Buildings size={24} weight="duotone" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{contractor.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>CUIT: {contractor.cuit}</p>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Contacto:</span> <strong>{contractor.contactPhone}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Seguro/Cláusulas:</span> 
                      {getStatusBadge(checkExpiryStatus(contractor.documentExpiresAt))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Vencimiento:</span>
                        <strong>{contractor.documentExpiresAt ? new Date(contractor.documentExpiresAt).toLocaleDateString() : 'N/A'}</strong>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Trabajadores asoc:</span> <strong>{workers.filter(w => w.contractorId === contractor.id).length}</strong>
                    </div>
                  </div>
                </div>
              ))}
              {contractors.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  <Buildings size={48} weight="duotone" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                  <p>No hay contratistas registrados.</p>
                </div>
              )}
            </div>
          )}

          {/* Workers View */}
          {activeTab === 'workers' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '1rem' }}>Trabajador</th>
                    <th style={{ padding: '1rem' }}>Empresa</th>
                    <th style={{ padding: '1rem' }}>Vto. ART</th>
                    <th style={{ padding: '1rem' }}>Vto. Seguro Vida</th>
                    <th style={{ padding: '1rem' }}>Inducción</th>
                    <th style={{ padding: '1rem', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {workers.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.dni.includes(searchQuery)).map(worker => {
                    const contractor = contractors.find(c => c.id === worker.contractorId);
                    return (
                      <tr key={worker.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 700, color: 'white' }}>{worker.name}</div>
                          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>DNI: {worker.dni} | {worker.position}</div>
                        </td>
                        <td style={{ padding: '1rem', color: 'white' }}>{contractor?.name || 'Desconocida'}</td>
                        <td style={{ padding: '1rem' }}>{getStatusBadge(checkExpiryStatus(worker.artExpiresAt))} <div style={{fontSize:'0.7rem', color:'#aaa', marginTop:'2px'}}>{worker.artExpiresAt}</div></td>
                        <td style={{ padding: '1rem' }}>{getStatusBadge(checkExpiryStatus(worker.lifeInsuranceExpiresAt))}</td>
                        <td style={{ padding: '1rem' }}>{getStatusBadge(checkExpiryStatus(worker.inductionExpiresAt))}</td>
                        <td style={{ padding: '1rem' }}>
                          <button onClick={() => handleDeleteWorker(worker.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash size={18} /></button>
                        </td>
                      </tr>
                    )
                  })}
                  {workers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <Users size={48} weight="duotone" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                        <p>No hay trabajadores registrados.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODALS */}
        {isContractorModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Añadir Contratista</h2>
                <button onClick={() => setIsContractorModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
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
                                  <Sparkle size={24} weight="fill" />
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><label>Email Contacto</label><input type="email" value={contractorForm.contactEmail || ''} onChange={e => setContractorForm({...contractorForm, contactEmail: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                  <div><label>Teléfono</label><input type="tel" value={contractorForm.contactPhone || ''} onChange={e => setContractorForm({...contractorForm, contactPhone: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                </div>
                <div><label>Vencimiento Doc. Principal (ART/Cláusulas Grales)</label><input type="date" required value={contractorForm.documentExpiresAt || ''} onChange={e => setContractorForm({...contractorForm, documentExpiresAt: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                <button type="submit" className="primary-btn" style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Guardar Contratista</button>
              </form>
            </div>
          </div>
        )}

        {isWorkerModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--color-border)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Añadir Trabajador</h2>
                <button onClick={() => setIsWorkerModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
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
                                  <Sparkle size={24} weight="fill" />
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><label>DNI</label><input required type="text" value={workerForm.dni || ''} onChange={e => setWorkerForm({...workerForm, dni: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                  <div><label>Puesto</label><input required type="text" value={workerForm.position || ''} onChange={e => setWorkerForm({...workerForm, position: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                </div>
                <div><label>Vencimiento ART</label><input required type="date" value={workerForm.artExpiresAt || ''} onChange={e => setWorkerForm({...workerForm, artExpiresAt: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                <div><label>Vencimiento Seguro Vida</label><input required type="date" value={workerForm.lifeInsuranceExpiresAt || ''} onChange={e => setWorkerForm({...workerForm, lifeInsuranceExpiresAt: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                <div><label>Vencimiento Inducción/Capacitación</label><input type="date" value={workerForm.inductionExpiresAt || ''} onChange={e => setWorkerForm({...workerForm, inductionExpiresAt: e.target.value})} className="form-input" style={{ width: '100%' }} /></div>
                <button type="submit" className="primary-btn" style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Guardar Trabajador</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </AnimatedPage>
  );
}
