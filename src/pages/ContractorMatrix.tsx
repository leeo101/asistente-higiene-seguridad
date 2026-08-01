import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, 
  Search, Filter, Plus, Edit, Trash2, Download, Printer, ArrowLeft, Calendar, FileText, Check, X, RefreshCw
} from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

export interface ContractorDoc {
  id: string;
  name: string;
  required: boolean;
  expiresAt?: string;
  status: 'valid' | 'expiring' | 'expired' | 'missing' | 'na';
}

export interface WorkerItem {
  id: string;
  contractorId: string;
  contractorName: string;
  workerName: string;
  dni: string;
  position: string;
  // Documentos obligatorios trabajador
  altaAfipDate?: string;
  aptoMedicoDate?: string; // Res 37/10
  entregaEppDate?: string; // Res 299/11
  induccionDate?: string;
  certEspecialDate?: string; // Altura / Confinado / LOTO
  updatedAt?: string;
  docs?: ContractorDoc[];
}

export interface ContractorCompany {
  id: string;
  name: string;
  cuit: string;
  contactEmail?: string;
  contactPhone?: string;
  // Documentos obligatorios empresa
  cuitDocDate?: string;
  artDocDate?: string;
  seguroVidaDate?: string; // Dec 1567/79
  programaSeguridadDate?: string; // Res 51/97
  f931Date?: string;
  updatedAt?: string;
  docs?: ContractorDoc[];
}

export default function ContractorMatrix() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncCollection, syncPulse } = useSync();
  
  const [contractors, setContractors] = useState<ContractorCompany[]>([]);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  
  const [activeTab, setActiveTab] = useState<'matrix' | 'contractors' | 'workers'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContractorId, setSelectedContractorId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'apto' | 'expiring' | 'blocked'>('all');

  // Modals
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isDocUpdateModalOpen, setIsDocUpdateModalOpen] = useState(false);

  const [editingContractor, setEditingContractor] = useState<Partial<ContractorCompany>>({});
  const [editingWorker, setEditingWorker] = useState<Partial<WorkerItem>>({});
  const [editingDocTarget, setEditingDocTarget] = useState<{
    type: 'company' | 'worker';
    targetId: string;
    docKey: string;
    docLabel: string;
    currentValue?: string;
  } | null>(null);

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    type: 'company' | 'worker';
    id: string | null;
  }>({ isOpen: false, type: 'company', id: null });

  // Cargar datos iniciales con migración automática del módulo anterior
  useEffect(() => {
    try {
      let companyList: ContractorCompany[] = [];
      const savedC = localStorage.getItem('contractors_matrix_companies');
      if (savedC) {
        companyList = JSON.parse(savedC);
      } else {
        // Intentar migrar del viejo contractors_data
        const legacyC = localStorage.getItem('contractors_data');
        if (legacyC) {
          const parsedLegacy = JSON.parse(legacyC);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            companyList = parsedLegacy.map((item: any) => ({
              id: item.id || 'c_' + Math.random().toString(36).substring(2, 9),
              name: item.name || 'Empresa',
              cuit: item.cuit || 'Sin CUIT',
              contactEmail: item.contactEmail || '',
              contactPhone: item.contactPhone || '',
              artDocDate: item.documentExpiresAt || ''
            }));
          }
        }
      }

      if (companyList.length === 0) {
        companyList = [
          {
            id: 'c1',
            name: 'Construcciones Norte S.A.',
            cuit: '30-71123456-8',
            contactEmail: 'obras@norte.com',
            contactPhone: '011-4555-1234',
            cuitDocDate: '2027-12-31',
            artDocDate: '2026-08-30',
            seguroVidaDate: '2026-09-15',
            programaSeguridadDate: '2026-11-01',
            f931Date: '2026-08-15'
          },
          {
            id: 'c2',
            name: 'Electromecánica Sur SRL',
            cuit: '30-68987654-2',
            contactEmail: 'contacto@electrosur.com',
            contactPhone: '011-4888-9900',
            cuitDocDate: '2027-12-31',
            artDocDate: '2026-07-01',
            seguroVidaDate: '2026-08-10',
            programaSeguridadDate: '2026-10-20',
            f931Date: '2026-07-31'
          }
        ];
      }

      setContractors(companyList);
      localStorage.setItem('contractors_matrix_companies', JSON.stringify(companyList));

      let workerList: WorkerItem[] = [];
      const savedW = localStorage.getItem('contractors_matrix_workers');
      if (savedW) {
        workerList = JSON.parse(savedW);
      } else {
        const legacyW = localStorage.getItem('workers_data');
        if (legacyW) {
          const parsedLegacyW = JSON.parse(legacyW);
          if (Array.isArray(parsedLegacyW) && parsedLegacyW.length > 0) {
            workerList = parsedLegacyW.map((w: any) => {
              const comp = companyList.find(c => c.id === w.contractorId);
              return {
                id: w.id || 'w_' + Math.random().toString(36).substring(2, 9),
                contractorId: w.contractorId || companyList[0]?.id || 'c1',
                contractorName: comp?.name || w.contractorName || 'Contratista',
                workerName: w.name || w.workerName || 'Trabajador',
                dni: w.dni || '-',
                position: w.position || 'Operario',
                aptoMedicoDate: w.artExpiresAt || '',
                entregaEppDate: w.lifeInsuranceExpiresAt || '',
                induccionDate: w.inductionExpiresAt || ''
              };
            });
          }
        }
      }

      if (workerList.length === 0) {
        workerList = [
          {
            id: 'w1',
            contractorId: 'c1',
            contractorName: 'Construcciones Norte S.A.',
            workerName: 'Juan Carlos Gómez',
            dni: '32.456.789',
            position: 'Oficial Armador',
            altaAfipDate: '2027-01-01',
            aptoMedicoDate: '2026-12-10',
            entregaEppDate: '2026-10-05',
            induccionDate: '2026-06-01',
            certEspecialDate: '2026-09-30'
          },
          {
            id: 'w2',
            contractorId: 'c1',
            contractorName: 'Construcciones Norte S.A.',
            workerName: 'Roberto Martínez',
            dni: '28.912.345',
            position: 'Soldador Especializado',
            altaAfipDate: '2027-01-01',
            aptoMedicoDate: '2026-07-15',
            entregaEppDate: '2026-11-20',
            induccionDate: '2026-06-01',
            certEspecialDate: '2026-08-10'
          },
          {
            id: 'w3',
            contractorId: 'c2',
            contractorName: 'Electromecánica Sur SRL',
            workerName: 'Esteban Paredes',
            dni: '35.678.901',
            position: 'Electricista Industrial',
            altaAfipDate: '2027-01-01',
            aptoMedicoDate: '2026-11-30',
            entregaEppDate: '2026-09-01',
            induccionDate: '2026-07-01',
            certEspecialDate: '2026-08-05'
          }
        ];
      }

      setWorkers(workerList);
      localStorage.setItem('contractors_matrix_workers', JSON.stringify(workerList));
    } catch (e) {
      console.error('Error al inicializar la matriz de contratistas', e);
    }
  }, [syncPulse]);

  const saveContractorsData = (data: ContractorCompany[]) => {
    setContractors(data);
    localStorage.setItem('contractors_matrix_companies', JSON.stringify(data));
    syncCollection('contractors_matrix_companies', data);
  };

  const saveWorkersData = (data: WorkerItem[]) => {
    setWorkers(data);
    localStorage.setItem('contractors_matrix_workers', JSON.stringify(data));
    syncCollection('contractors_matrix_workers', data);
  };

  // Helper para verificar estado de fechas
  const getDocStatus = (dateStr?: string) => {
    if (!dateStr) return { status: 'missing', label: 'SIN CARGAR', bgStyle: { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: 600 } };
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(dateStr + 'T23:59:59Z');
    
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: 'VENCIDO', bgStyle: { backgroundColor: '#ffe4e6', color: '#e11d48', border: '1px solid #f43f5e', fontWeight: 900 } };
    }
    if (diffDays <= 15) {
      return { status: 'expiring', label: `${diffDays}d`, bgStyle: { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #f59e0b', fontWeight: 900 } };
    }
    return { status: 'valid', label: 'VIGENTE', bgStyle: { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 800 } };
  };

  // Evaluar estado general de un trabajador para ingreso
  const getWorkerAccessStatus = (w: WorkerItem) => {
    const company = contractors.find(c => c.id === w.contractorId);
    
    const companyDocs = [company?.cuitDocDate, company?.artDocDate, company?.seguroVidaDate, company?.programaSeguridadDate];
    const workerDocs = [w.altaAfipDate, w.aptoMedicoDate, w.entregaEppDate, w.induccionDate];

    const allDocs = [...companyDocs, ...workerDocs];
    
    let hasExpired = false;
    let hasExpiring = false;
    let hasMissing = false;

    allDocs.forEach(d => {
      const st = getDocStatus(d).status;
      if (st === 'expired') hasExpired = true;
      if (st === 'expiring') hasExpiring = true;
      if (st === 'missing') hasMissing = true;
    });

    if (hasExpired || hasMissing) {
      return { access: 'blocked', label: 'ACCESO BLOQUEADO', badgeStyle: { backgroundColor: '#dc2626', color: '#ffffff' }, icon: ShieldAlert };
    }
    if (hasExpiring) {
      return { access: 'expiring', label: 'POR VENCER', badgeStyle: { backgroundColor: '#d97706', color: '#ffffff' }, icon: AlertTriangle };
    }
    return { access: 'apto', label: 'APTO PARA INGRESO', badgeStyle: { backgroundColor: '#16a34a', color: '#ffffff' }, icon: ShieldCheck };
  };

  // Filtrado de la matriz
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      if (selectedContractorId !== 'all' && w.contractorId !== selectedContractorId) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = w.workerName.toLowerCase().includes(q);
        const matchDni = w.dni.toLowerCase().includes(q);
        const matchCompany = w.contractorName.toLowerCase().includes(q);
        if (!matchName && !matchDni && !matchCompany) return false;
      }

      if (statusFilter !== 'all') {
        const acc = getWorkerAccessStatus(w).access;
        if (statusFilter === 'apto' && acc !== 'apto') return false;
        if (statusFilter === 'blocked' && acc !== 'blocked') return false;
        if (statusFilter === 'expiring' && acc !== 'expiring') return false;
      }

      return true;
    });
  }, [workers, contractors, selectedContractorId, searchQuery, statusFilter]);

  // Estadísticas rápidas
  const stats = useMemo(() => {
    let aptos = 0;
    let blocked = 0;
    let expiring = 0;

    workers.forEach(w => {
      const st = getWorkerAccessStatus(w).access;
      if (st === 'apto') aptos++;
      else if (st === 'blocked') blocked++;
      else if (st === 'expiring') expiring++;
    });

    return {
      totalContractors: contractors.length,
      totalWorkers: workers.length,
      aptos,
      blocked,
      expiring
    };
  }, [contractors, workers]);

  // Guardar Contratista
  const handleSaveContractor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContractor.name || !editingContractor.cuit) {
      toast.error('Nombre y CUIT son obligatorios');
      return;
    }

    if (editingContractor.id) {
      const updated = contractors.map(c => c.id === editingContractor.id ? { ...c, ...editingContractor } as ContractorCompany : c);
      saveContractorsData(updated);
      toast.success('Contratista actualizado');
    } else {
      const newC: ContractorCompany = {
        id: 'c_' + Date.now(),
        name: editingContractor.name,
        cuit: editingContractor.cuit,
        contactEmail: editingContractor.contactEmail || '',
        contactPhone: editingContractor.contactPhone || '',
        cuitDocDate: editingContractor.cuitDocDate || '',
        artDocDate: editingContractor.artDocDate || '',
        seguroVidaDate: editingContractor.seguroVidaDate || '',
        programaSeguridadDate: editingContractor.programaSeguridadDate || '',
        f931Date: editingContractor.f931Date || ''
      };
      saveContractorsData([...contractors, newC]);
      toast.success('Contratista registrado');
    }

    setIsContractorModalOpen(false);
    setEditingContractor({});
  };

  // Guardar Trabajador
  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker.workerName || !editingWorker.dni || !editingWorker.contractorId) {
      toast.error('Nombre, DNI y Contratista son obligatorios');
      return;
    }

    const company = contractors.find(c => c.id === editingWorker.contractorId);

    if (editingWorker.id) {
      const updated = workers.map(w => w.id === editingWorker.id ? {
        ...w,
        ...editingWorker,
        contractorName: company?.name || w.contractorName
      } as WorkerItem : w);
      saveWorkersData(updated);
      toast.success('Trabajador actualizado');
    } else {
      const newW: WorkerItem = {
        id: 'w_' + Date.now(),
        contractorId: editingWorker.contractorId,
        contractorName: company?.name || 'Contratista',
        workerName: editingWorker.workerName,
        dni: editingWorker.dni,
        position: editingWorker.position || 'Operario',
        altaAfipDate: editingWorker.altaAfipDate || '',
        aptoMedicoDate: editingWorker.aptoMedicoDate || '',
        entregaEppDate: editingWorker.entregaEppDate || '',
        induccionDate: editingWorker.induccionDate || '',
        certEspecialDate: editingWorker.certEspecialDate || ''
      };
      saveWorkersData([...workers, newW]);
      toast.success('Trabajador registrado');
    }

    setIsWorkerModalOpen(false);
    setEditingWorker({});
  };

  // Actualizar fecha rápida de un documento desde la matriz
  const handleUpdateDocDate = (dateVal: string) => {
    if (!editingDocTarget) return;

    const { type, targetId, docKey } = editingDocTarget;

    if (type === 'company') {
      const updated = contractors.map(c => {
        if (c.id === targetId) {
          return { ...c, [docKey]: dateVal };
        }
        return c;
      });
      saveContractorsData(updated);
      toast.success('Fecha de documento actualizada');
    } else {
      const updated = workers.map(w => {
        if (w.id === targetId) {
          return { ...w, [docKey]: dateVal };
        }
        return w;
      });
      saveWorkersData(updated);
      toast.success('Fecha de documento de trabajador actualizada');
    }

    setIsDocUpdateModalOpen(false);
    setEditingDocTarget(null);
  };

  // Eliminar
  const handleDeleteConfirm = () => {
    if (!confirmDeleteModal.id) return;
    if (confirmDeleteModal.type === 'company') {
      const newC = contractors.filter(c => c.id !== confirmDeleteModal.id);
      const newW = workers.filter(w => w.contractorId !== confirmDeleteModal.id);
      saveContractorsData(newC);
      saveWorkersData(newW);
      toast.success('Contratista y sus operarios eliminados');
    } else {
      const newW = workers.filter(w => w.id !== confirmDeleteModal.id);
      saveWorkersData(newW);
      toast.success('Trabajador eliminado');
    }
    setConfirmDeleteModal({ isOpen: false, type: 'company', id: null });
  };

  // Exportar Excel
  const handleExportExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Matriz de Contratistas');

      sheet.columns = [
        { header: 'Contratista', key: 'contractor', width: 25 },
        { header: 'Trabajador', key: 'worker', width: 25 },
        { header: 'DNI', key: 'dni', width: 15 },
        { header: 'Puesto', key: 'position', width: 20 },
        { header: 'Estado Acceso', key: 'status', width: 22 },
        { header: 'ART Empresa', key: 'art', width: 15 },
        { header: 'Seguro Vida', key: 'seguro', width: 15 },
        { header: 'Apto Médico', key: 'apto', width: 15 },
        { header: 'EPPs (Res 299)', key: 'epp', width: 15 },
        { header: 'Inducción', key: 'induc', width: 15 }
      ];

      filteredWorkers.forEach(w => {
        const c = contractors.find(item => item.id === w.contractorId);
        const acc = getWorkerAccessStatus(w);
        sheet.addRow({
          contractor: w.contractorName,
          worker: w.workerName,
          dni: w.dni,
          position: w.position,
          status: acc.label,
          art: c?.artDocDate || 'Sin Cargar',
          seguro: c?.seguroVidaDate || 'Sin Cargar',
          apto: w.aptoMedicoDate || 'Sin Cargar',
          epp: w.entregaEppDate || 'Sin Cargar',
          induc: w.induccionDate || 'Sin Cargar'
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Matriz_Contratistas_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      toast.success('Matriz exportada a Excel');
    } catch (e) {
      console.error(e);
      toast.error('Error al exportar a Excel');
    }
  };

  return (
    <AnimatedPage className="min-h-screen bg-slate-50 text-slate-800 p-3 sm:p-4 md:p-6 pb-24" style={{ paddingTop: '85px' }}>
      {/* Estilos forzados de impresión limpios para Garita (sin cuadros negros) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .garita-print-sheet, .garita-print-sheet * {
            visibility: visible !important;
          }
          .garita-print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            display: block !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-sizing: border-box !important;
          }
          .garita-print-sheet table {
            width: 100% !important;
            border-collapse: collapse !important;
            background: #ffffff !important;
          }
          .garita-print-sheet th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            border: 1px solid #cbd5e1 !important;
            font-weight: 800 !important;
          }
          .garita-print-sheet td {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      {/* VISTA IMPRESA EXCLUSIVA PARA LA GARITA DE CONTROL CON PIE DE PÁGINA PROFESIONAL Y QR */}
      <div className="garita-print-sheet print-area hidden print:block bg-white text-slate-900 p-4">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '14px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            LISTADO DE CONTROL DE ACCESO A GARITA / PLANTA
          </h1>
          <p style={{ fontSize: '10px', color: '#475569', margin: '3px 0 0 0', fontWeight: 600 }}>
            Asistente de Higiene y Seguridad | Control Documental de Contratistas
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#334155', marginTop: '8px', fontWeight: 700, padding: '4px 8px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <span>FECHA DE EMISIÓN: {new Date().toLocaleDateString('es-AR')}</span>
            <span>TOTAL OPERARIOS: {filteredWorkers.length}</span>
            <span>🟢 APTOS: {stats.aptos} | 🔴 BLOQUEADOS: {stats.blocked}</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '16px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 800 }}>OPERARIO / DNI</th>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 800 }}>CONTRATISTA</th>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800 }}>ESTADO ACCESO</th>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800 }}>ART</th>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800 }}>SEGURO VIDA</th>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800 }}>APTO MÉDICO</th>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800 }}>EPP (RES 299)</th>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800 }}>INDUCCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.map(w => {
              const company = contractors.find(c => c.id === w.contractorId);
              const access = getWorkerAccessStatus(w);
              const artSt = getDocStatus(company?.artDocDate);
              const seguroSt = getDocStatus(company?.seguroVidaDate);
              const aptoSt = getDocStatus(w.aptoMedicoDate);
              const eppSt = getDocStatus(w.entregaEppDate);
              const inducSt = getDocStatus(w.induccionDate);

              return (
                <tr key={'p_' + w.id} style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
                    {w.workerName}<br />
                    <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 500 }}>DNI: {w.dni}</span>
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', fontWeight: 600, color: '#334155' }}>{w.contractorName}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 900 }}>
                    <span style={{
                      color: access.access === 'apto' ? '#15803d' : access.access === 'expiring' ? '#b45309' : '#b91c1c',
                      backgroundColor: access.access === 'apto' ? '#dcfce7' : access.access === 'expiring' ? '#fef3c7' : '#fee2e2',
                      border: `1px solid ${access.access === 'apto' ? '#86efac' : access.access === 'expiring' ? '#fde68a' : '#fca5a5'}`,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '8px',
                      display: 'inline-block',
                      fontWeight: 900
                    }}>
                      {access.label}
                    </span>
                  </td>
                  <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', fontWeight: 700, color: artSt.status === 'valid' ? '#15803d' : artSt.status === 'expiring' ? '#b45309' : '#b91c1c' }}>{artSt.label}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', fontWeight: 700, color: seguroSt.status === 'valid' ? '#15803d' : seguroSt.status === 'expiring' ? '#b45309' : '#b91c1c' }}>{seguroSt.label}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', fontWeight: 700, color: aptoSt.status === 'valid' ? '#15803d' : aptoSt.status === 'expiring' ? '#b45309' : '#b91c1c' }}>{aptoSt.label}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', fontWeight: 700, color: eppSt.status === 'valid' ? '#15803d' : eppSt.status === 'expiring' ? '#b45309' : '#b91c1c' }}>{eppSt.label}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', fontWeight: 700, color: inducSt.status === 'valid' ? '#15803d' : inducSt.status === 'expiring' ? '#b45309' : '#b91c1c' }}>{inducSt.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#475569', paddingTop: '12px' }}>
          <div style={{ width: '42%', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #94a3b8' }}>
            Firma y Aclaración - Control de Garita
          </div>
          <div style={{ width: '42%', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #94a3b8' }}>
            Firma y Aclaración - Responsable HyS / Planta
          </div>
        </div>

        {/* PIE DE PÁGINA CON BRANDING Y CÓDIGO QR */}
        <PdfBrandingFooter
          documentType="MATRIZ DE LEGAJO DE CONTRATISTAS"
          documentId="GARITA-MATRIX-CONTROL"
          signedBy="Asistente de Higiene y Seguridad (H&S Digital System)"
        />
      </div>

      {/* Contenedor bajado con suficiente margen para despejar el header sticky de arriba */}
      <div className="no-print" style={{ marginTop: '20px', marginBottom: '24px' }}>
        <PremiumHeader
          title="MATRIZ DE LEGAJO DE CONTRATISTAS"
          subtitle="Control de cumplimiento documental y semáforo de acceso a obra/planta"
          icon={<Building2 className="text-white" size={28} />}
          onBack={() => navigate('/')}
        >
          {/* Estilos inline forzados para los botones del header */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <button
              onClick={() => window.print()}
              style={{
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
              }}
            >
              <Printer size={16} /> Imprimir Garita
            </button>
            <button
              onClick={handleExportExcel}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
              }}
            >
              <Download size={16} /> Exportar a Excel
            </button>
          </div>
        </PremiumHeader>
      </div>

      {/* Tarjetas KPI en blanco con bordes limpios y responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3 mb-6 no-print">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center shadow-sm">
          <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">Empresas</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1 block">{stats.totalContractors}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center shadow-sm">
          <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">Trabajadores</span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 mt-1 block">{stats.totalWorkers}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 sm:p-4 text-center shadow-sm">
          <span className="text-emerald-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">Aptos Ingreso</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 block">{stats.aptos}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-4 text-center shadow-sm">
          <span className="text-amber-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">Por Vencer</span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 mt-1 block">{stats.expiring}</span>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 sm:p-4 text-center col-span-2 sm:col-span-1 shadow-sm">
          <span className="text-rose-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">Acceso Bloqueado</span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 mt-1 block">{stats.blocked}</span>
        </div>
      </div>

      {/* Tabs y Botones de Acción con colores forzados por inline styles */}
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Pestañas de navegación con estilos vivos */}
        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '6px', borderRadius: '16px', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('matrix')}
            style={activeTab === 'matrix' ? {
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            } : {
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <ShieldCheck size={16} /> Matriz General
          </button>

          <button
            onClick={() => setActiveTab('contractors')}
            style={activeTab === 'contractors' ? {
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            } : {
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Building2 size={16} /> Empresas ({contractors.length})
          </button>

          <button
            onClick={() => setActiveTab('workers')}
            style={activeTab === 'workers' ? {
              backgroundColor: '#9333ea',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)'
            } : {
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Users size={16} /> Operarios ({workers.length})
          </button>
        </div>

        {/* Botones de Registrar (sin duplicado el signo mas) */}
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={() => { setEditingContractor({}); setIsContractorModalOpen(true); }}
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}
          >
            <Plus size={16} /> Registrar Empresa
          </button>

          <button
            onClick={() => { setEditingWorker({}); setIsWorkerModalOpen(true); }}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Plus size={16} /> Registrar Operario
          </button>
        </div>
      </div>

      {/* Filtros de la Matriz en contenedor blanco con espacio correcto para la lupa */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar por operario, DNI o empresa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '42px',
              paddingRight: '14px',
              paddingTop: '9px',
              paddingBottom: '9px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              fontSize: '0.8rem',
              color: '#0f172a',
              outline: 'none'
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={selectedContractorId}
            onChange={e => setSelectedContractorId(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-700 font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">🏢 Todas las Empresas</option>
            {contractors.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-700 font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">🚦 Todos los Estados</option>
            <option value="apto">🟢 Solo Aptos para Ingreso</option>
            <option value="expiring">🟡 Por Vencer (&lt;15 días)</option>
            <option value="blocked">🔴 Acceso Bloqueado / Vencidos</option>
          </select>
        </div>
      </div>

      {/* CONTENIDO SEGÚN TAB */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-800 text-slate-100 uppercase font-black tracking-wider border-b border-slate-700 text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 min-w-[180px]">OPERARIO / TRABAJADOR</th>
                  <th className="py-3.5 px-3 min-w-[160px]">EMPRESA CONTRATISTA</th>
                  <th className="py-3.5 px-3 text-center min-w-[140px]">ESTADO INGRESO</th>
                  <th className="py-3.5 px-3 text-center min-w-[100px]">ART EMPRESA</th>
                  <th className="py-3.5 px-3 text-center min-w-[100px]">SEGURO VIDA</th>
                  <th className="py-3.5 px-3 text-center min-w-[100px]">APTO MÉDICO</th>
                  <th className="py-3.5 px-3 text-center min-w-[100px]">EPP (RES 299)</th>
                  <th className="py-3.5 px-3 text-center min-w-[100px]">INDUCCIÓN</th>
                  <th className="py-3.5 px-3 text-center min-w-[100px]">ESPECIAL (ALTURA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      No se encontraron registros de contratistas para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map(w => {
                    const company = contractors.find(c => c.id === w.contractorId);
                    const access = getWorkerAccessStatus(w);
                    const AccessIcon = access.icon;

                    const artSt = getDocStatus(company?.artDocDate);
                    const seguroSt = getDocStatus(company?.seguroVidaDate);
                    const aptoSt = getDocStatus(w.aptoMedicoDate);
                    const eppSt = getDocStatus(w.entregaEppDate);
                    const inducSt = getDocStatus(w.induccionDate);
                    const espSt = getDocStatus(w.certEspecialDate);

                    return (
                      <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">{w.workerName}</div>
                          <div className="text-[11px] text-slate-500">DNI: {w.dni} | {w.position}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">{w.contractorName}</div>
                          <div className="text-[10px] text-slate-500">{company?.cuit || '-'}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span style={{ ...access.badgeStyle, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <AccessIcon size={12} /> {access.label}
                          </span>
                        </td>
                        
                        <td className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-all" onClick={() => {
                          if (company) {
                            setEditingDocTarget({ type: 'company', targetId: company.id, docKey: 'artDocDate', docLabel: 'Constancia de ART', currentValue: company.artDocDate });
                            setIsDocUpdateModalOpen(true);
                          }
                        }}>
                          <span style={{ ...artSt.bgStyle, display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                            {artSt.label}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-all" onClick={() => {
                          if (company) {
                            setEditingDocTarget({ type: 'company', targetId: company.id, docKey: 'seguroVidaDate', docLabel: 'Seguro de Vida (Dec 1567/79)', currentValue: company.seguroVidaDate });
                            setIsDocUpdateModalOpen(true);
                          }
                        }}>
                          <span style={{ ...seguroSt.bgStyle, display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                            {seguroSt.label}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-all" onClick={() => {
                          setEditingDocTarget({ type: 'worker', targetId: w.id, docKey: 'aptoMedicoDate', docLabel: 'Apto Médico Laboral (Res 37/10)', currentValue: w.aptoMedicoDate });
                          setIsDocUpdateModalOpen(true);
                        }}>
                          <span style={{ ...aptoSt.bgStyle, display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                            {aptoSt.label}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-all" onClick={() => {
                          setEditingDocTarget({ type: 'worker', targetId: w.id, docKey: 'entregaEppDate', docLabel: 'Constancia EPP (Res 299/11)', currentValue: w.entregaEppDate });
                          setIsDocUpdateModalOpen(true);
                        }}>
                          <span style={{ ...eppSt.bgStyle, display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                            {eppSt.label}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-all" onClick={() => {
                          setEditingDocTarget({ type: 'worker', targetId: w.id, docKey: 'induccionDate', docLabel: 'Inducción de Seguridad', currentValue: w.induccionDate });
                          setIsDocUpdateModalOpen(true);
                        }}>
                          <span style={{ ...inducSt.bgStyle, display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                            {inducSt.label}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-all" onClick={() => {
                          setEditingDocTarget({ type: 'worker', targetId: w.id, docKey: 'certEspecialDate', docLabel: 'Permiso / Cert. Trabajo Especial', currentValue: w.certEspecialDate });
                          setIsDocUpdateModalOpen(true);
                        }}>
                          <span style={{ ...espSt.bgStyle, display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                            {espSt.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: EMPRESAS CONTRATISTAS CON BOTONES VISIBLES DE EDITAR Y ELIMINAR */}
      {activeTab === 'contractors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contractors.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Building2 className="text-indigo-600" size={18} /> {c.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">CUIT: {c.cuit}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => { setEditingContractor(c); setIsContractorModalOpen(true); }}
                    style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                  >
                    <Edit size={14} /> Editar
                  </button>
                  <button
                    onClick={() => setConfirmDeleteModal({ isOpen: true, type: 'company', id: c.id })}
                    style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs text-slate-700 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Contacto:</span>
                  <span className="font-medium">{c.contactEmail || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Teléfono:</span>
                  <span className="font-medium">{c.contactPhone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Vencimiento ART:</span>
                  <span style={getDocStatus(c.artDocDate).bgStyle}>{c.artDocDate || 'Sin Cargar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Seguro de Vida:</span>
                  <span style={getDocStatus(c.seguroVidaDate).bgStyle}>{c.seguroVidaDate || 'Sin Cargar'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: TRABAJADORES CON BOTONES VISIBLES DE EDITAR Y ELIMINAR */}
      {activeTab === 'workers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workers.map(w => (
            <div key={w.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Users className="text-purple-600" size={18} /> {w.workerName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">DNI: {w.dni} | {w.position}</p>
                  <p className="text-xs text-indigo-600 font-bold mt-0.5">{w.contractorName}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => { setEditingWorker(w); setIsWorkerModalOpen(true); }}
                    style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                  >
                    <Edit size={14} /> Editar
                  </button>
                  <button
                    onClick={() => setConfirmDeleteModal({ isOpen: true, type: 'worker', id: w.id })}
                    style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs text-slate-700 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Apto Médico:</span>
                  <span style={getDocStatus(w.aptoMedicoDate).bgStyle}>{w.aptoMedicoDate || 'Sin Cargar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Constancia EPP:</span>
                  <span style={getDocStatus(w.entregaEppDate).bgStyle}>{w.entregaEppDate || 'Sin Cargar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Inducción:</span>
                  <span style={getDocStatus(w.induccionDate).bgStyle}>{w.induccionDate || 'Sin Cargar'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CONTRATISTA */}
      {isContractorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingContractor.id ? 'Editar Empresa Contratista' : 'Registrar Empresa Contratista'}
              </h3>
              <button onClick={() => setIsContractorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveContractor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Razón Social / Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Construcciones del Sur S.A."
                  value={editingContractor.name || ''}
                  onChange={e => setEditingContractor({ ...editingContractor, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">CUIT *</label>
                <input
                  type="text"
                  required
                  placeholder="30-12345678-9"
                  value={editingContractor.cuit || ''}
                  onChange={e => setEditingContractor({ ...editingContractor, cuit: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Contacto</label>
                  <input
                    type="email"
                    value={editingContractor.contactEmail || ''}
                    onChange={e => setEditingContractor({ ...editingContractor, contactEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingContractor.contactPhone || ''}
                    onChange={e => setEditingContractor({ ...editingContractor, contactPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Vencimiento ART</label>
                  <input
                    type="date"
                    value={editingContractor.artDocDate || ''}
                    onChange={e => setEditingContractor({ ...editingContractor, artDocDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Vencimiento Seguro Vida</label>
                  <input
                    type="date"
                    value={editingContractor.seguroVidaDate || ''}
                    onChange={e => setEditingContractor({ ...editingContractor, seguroVidaDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsContractorModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: 800, borderRadius: '12px', border: 'none' }}
                  className="w-1/2 py-2.5 transition-all shadow-md cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OPERARIO */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingWorker.id ? 'Editar Operario' : 'Registrar Operario'}
              </h3>
              <button onClick={() => setIsWorkerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveWorker} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Empresa Contratista *</label>
                <select
                  required
                  value={editingWorker.contractorId || ''}
                  onChange={e => setEditingWorker({ ...editingWorker, contractorId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="">-- Seleccionar Empresa --</option>
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Alberto Rossi"
                  value={editingWorker.workerName || ''}
                  onChange={e => setEditingWorker({ ...editingWorker, workerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">DNI *</label>
                  <input
                    type="text"
                    required
                    placeholder="12.345.678"
                    value={editingWorker.dni || ''}
                    onChange={e => setEditingWorker({ ...editingWorker, dni: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Puesto / Función</label>
                  <input
                    type="text"
                    placeholder="Ej. Electricista"
                    value={editingWorker.position || ''}
                    onChange={e => setEditingWorker({ ...editingWorker, position: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Apto Médico (Res 37/10)</label>
                  <input
                    type="date"
                    value={editingWorker.aptoMedicoDate || ''}
                    onChange={e => setEditingWorker({ ...editingWorker, aptoMedicoDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Constancia EPP (Res 299/11)</label>
                  <input
                    type="date"
                    value={editingWorker.entregaEppDate || ''}
                    onChange={e => setEditingWorker({ ...editingWorker, entregaEppDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 800, borderRadius: '12px', border: 'none' }}
                  className="w-1/2 py-2.5 transition-all shadow-md cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ACTUALIZACIÓN RÁPIDA DOCUMENTO DESDE MATRIZ */}
      {isDocUpdateModalOpen && editingDocTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" /> Actualizar Vencimiento
              </h4>
              <button onClick={() => setIsDocUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Documento: <strong className="text-slate-900">{editingDocTarget.docLabel}</strong>
            </p>

            <input
              type="date"
              defaultValue={editingDocTarget.currentValue || ''}
              id="quick-doc-date-input"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs mb-4 focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setIsDocUpdateModalOpen(false)}
                className="w-1/2 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const val = (document.getElementById('quick-doc-date-input') as HTMLInputElement)?.value;
                  handleUpdateDocDate(val);
                }}
                style={{ backgroundColor: '#16a34a', color: '#ffffff', fontWeight: 800, borderRadius: '12px', border: 'none' }}
                className="w-1/2 py-2 text-xs transition-all shadow-md cursor-pointer"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        title="¿Confirmar eliminación?"
        message="Esta acción no se puede deshacer y borrará el registro seleccionado."
        onConfirm={handleDeleteConfirm}
        onClose={() => setConfirmDeleteModal({ isOpen: false, type: 'company', id: null })}
      />
    </AnimatedPage>
  );
}
