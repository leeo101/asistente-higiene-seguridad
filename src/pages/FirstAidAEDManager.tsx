import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse, Plus, Search, Calendar, FileText,
  Trash2, AlertTriangle, CheckCircle2, Battery,
  Cross, Activity, User, MapPin,
  FileSpreadsheet, Eye, X, ShieldCheck, Printer,
  Sparkles, PenTool, BookOpen, PhoneCall, Users, Minus
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import {
  AEDDevice,
  FirstAidKit,
  FirstAidKitItem,
  MinorInjuryRecord,
  FirstAidBrigadier,
  DEFAULT_KIT_ITEMS,
  EMERGENCY_PROTOCOLS_DATA
} from '../data/firstAidData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { drawJsPdfSignatures, getSavedProfessionalData } from '../utils/jsPdfSignatureHelper';

export default function FirstAidAEDManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<'aed' | 'kits' | 'injuries' | 'brigade'>('aed');
  const [searchTerm, setSearchTerm] = useState('');

  // DEAs
  const [aeds, setAeds] = useState<AEDDevice[]>([]);
  const [showAedModal, setShowAedModal] = useState(false);
  const [newAed, setNewAed] = useState<Partial<AEDDevice>>({
    code: 'DEA-01',
    location: 'Recepción Central / Hall Principal',
    brandModel: 'Zoll AED Plus / Philips HeartStart',
    serialNumber: 'SN-9823412',
    batteryLevelPercent: 100,
    batteryExpiryDate: '2028-12-31',
    padsAdultExpiryDate: '2027-06-30',
    padsPediatricExpiryDate: '2027-06-30',
    lastTestDate: new Date().toISOString().split('T')[0],
    status: 'operational',
    responsiblePerson: 'Servicio Médico / Lic. HyS',
    hasCabinetAlarm: true,
    hasIlcorSignage: true,
    hasRescueKit: true
  });

  // Botiquines
  const [kits, setKits] = useState<FirstAidKit[]>([]);
  const [showKitModal, setShowKitModal] = useState(false);
  const [newKit, setNewKit] = useState<Partial<FirstAidKit>>({
    code: 'BOT-01',
    location: 'Taller de Mantenimiento',
    sector: 'Planta Industrial',
    type: 'type_b_medium',
    lastInspectionDate: new Date().toISOString().split('T')[0],
    inspectorName: 'Servicio HyS',
    status: 'complete',
    notes: 'Gabinete señalizado con cruz verde reglamentaria, sin llave ni candado.'
  });
  const [customItemText, setCustomItemText] = useState<{ kitId: string; name: string; qty: number; unit: string }>({
    kitId: '',
    name: '',
    qty: 1,
    unit: 'unidades'
  });

  // Atenciones Menores
  const [injuries, setInjuries] = useState<MinorInjuryRecord[]>([]);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [newInjury, setNewInjury] = useState<Partial<MinorInjuryRecord>>({
    date: new Date().toISOString().split('T')[0],
    time: '10:30',
    workerName: '',
    workerCuil: '',
    area: '',
    injuryType: 'corte_superficial',
    vitalSigns: 'TA 120/80 mmHg · FC 74 lpm · Lúcido y ubicado',
    treatmentDescription: 'Lavado con solución fisiológica estéril, antisepsia con clorhexidina 2% y oclusión con apósito estéril.',
    itemsUsed: '2 sobres de gasa estéril, clorhexidina, 1 apósito adhesivo, 1 par de guantes nitrilo',
    kitCodeUsed: 'BOT-01',
    firstResponderName: 'Socorrista / Enfermero Laboral',
    outcome: 'returned_to_work'
  });

  // Brigadistas Certificados RCP / DEA (Ley 27.159 Art. 5)
  const [brigadiers, setBrigadiers] = useState<FirstAidBrigadier[]>([]);
  const [showBrigadierModal, setShowBrigadierModal] = useState(false);
  const [newBrigadier, setNewBrigadier] = useState<Partial<FirstAidBrigadier>>({
    fullName: '',
    roleSector: 'Jefe de Turno / Producción',
    shift: 'Mañana',
    phone: 'Int. 104 / Cel. Corporativo',
    certificationEntity: 'Cruz Roja Argentina / Servicio HyS & ART',
    certificationDate: new Date().toISOString().split('T')[0],
    expiryDate: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    })(),
    status: 'vigente'
  });

  // Firmas Digitales Formato ATS (con Firma del Profesional en el Medio)
  const [employerName, setEmployerName] = useState('');
  const [professionalName, setProfessionalName] = useState('');
  const [professionalLicense, setProfessionalLicense] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('Lic. en Higiene y Seguridad / Servicio Médico');
  const [supervisorName, setSupervisorName] = useState('Jefe de Brigada / Encargado de Sector');
  const [operatorSignature, setOperatorSignature] = useState('');
  const [professionalSignature, setProfessionalSignature] = useState('');
  const [professionalStamp, setProfessionalStamp] = useState('');
  const [supervisorSignature, setSupervisorSignature] = useState('');
  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    professional: true,
    supervisor: true
  });

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'aed' | 'kit' | 'injury' | 'brigadier'; id: string } | null>(null);
  const [viewDetail, setViewDetail] = useState<{ type: 'aed' | 'kit' | 'injury'; data: any } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Cargar datos del profesional y firmas guardadas
    try {
      const pro = getSavedProfessionalData();
      if (pro.name) setProfessionalName(pro.name);
      if (pro.license) setProfessionalLicense(pro.license);
      if (pro.profession) setProfessionalTitle(pro.profession);
      if (pro.signature) setProfessionalSignature(pro.signature);
      if (pro.stamp) setProfessionalStamp(pro.stamp);

      const savedSigs = localStorage.getItem('first_aid_ats_signatures');
      if (savedSigs) {
        const parsed = JSON.parse(savedSigs);
        if (parsed.employerName) setEmployerName(parsed.employerName);
        if (parsed.supervisorName) setSupervisorName(parsed.supervisorName);
        if (parsed.operatorSignature) setOperatorSignature(parsed.operatorSignature);
        if (parsed.supervisorSignature) setSupervisorSignature(parsed.supervisorSignature);
        if (parsed.professionalSignature) setProfessionalSignature(parsed.professionalSignature);
        if (parsed.showSignatures) setShowSignatures(parsed.showSignatures);
      }
    } catch {}

    const rawAeds = localStorage.getItem('aed_devices_db');
    if (rawAeds) {
      try { setAeds(JSON.parse(rawAeds)); } catch (e) {}
    } else {
      const initialAed: AEDDevice = {
        id: 'aed_1',
        companyId: activeCompany?.id,
        code: 'DEA-01',
        location: 'Recepción y Guardia Principal',
        brandModel: 'Philips HeartStart FRx',
        serialNumber: 'PH-442198',
        batteryLevelPercent: 95,
        batteryExpiryDate: '2028-05-20',
        padsAdultExpiryDate: '2027-04-15',
        padsPediatricExpiryDate: '2027-04-15',
        lastTestDate: new Date().toISOString().split('T')[0],
        status: 'operational',
        responsiblePerson: 'Servicio de Medicina Laboral / HyS',
        hasCabinetAlarm: true,
        hasIlcorSignage: true,
        hasRescueKit: true
      };
      setAeds([initialAed]);
      localStorage.setItem('aed_devices_db', JSON.stringify([initialAed]));
    }

    const rawKits = localStorage.getItem('first_aid_kits_db');
    if (rawKits) {
      try { setKits(JSON.parse(rawKits)); } catch (e) {}
    } else {
      const initialKit: FirstAidKit = {
        id: 'kit_1',
        companyId: activeCompany?.id,
        code: 'BOT-01',
        location: 'Taller de Producción y Mantenimiento',
        sector: 'Nave Principal',
        type: 'type_b_medium',
        lastInspectionDate: new Date().toISOString().split('T')[0],
        inspectorName: 'Servicio HyS',
        status: 'complete',
        items: DEFAULT_KIT_ITEMS.type_b_medium.map(i => ({ ...i })),
        notes: 'Botiquín señalizado y accesible sin llave.'
      };
      setKits([initialKit]);
      localStorage.setItem('first_aid_kits_db', JSON.stringify([initialKit]));
    }

    const rawInjuries = localStorage.getItem('minor_injuries_db');
    if (rawInjuries) {
      try { setInjuries(JSON.parse(rawInjuries)); } catch (e) {}
    } else {
      const initialInjury: MinorInjuryRecord = {
        id: 'inj_1',
        companyId: activeCompany?.id,
        date: new Date().toISOString().split('T')[0],
        time: '09:45',
        workerName: 'Carlos Alberto Gómez',
        workerCuil: '20-31456789-4',
        area: 'Sector Mecanizado / Taller',
        injuryType: 'corte_superficial',
        vitalSigns: 'TA 120/80 mmHg · FC 72 lpm · Lúcido',
        treatmentDescription: 'Lavado con solución fisiológica estéril, antisepsia con clorhexidina digluconato 2% y colocación de apósito protector.',
        itemsUsed: '2 gasas estériles, clorhexidina, 1 apósito adhesivo',
        kitCodeUsed: 'BOT-01',
        firstResponderName: 'Brigadista Turno Mañana',
        outcome: 'returned_to_work'
      };
      setInjuries([initialInjury]);
      localStorage.setItem('minor_injuries_db', JSON.stringify([initialInjury]));
    }

    const rawBrigadiers = localStorage.getItem('first_aid_brigadiers_db');
    if (rawBrigadiers) {
      try { setBrigadiers(JSON.parse(rawBrigadiers)); } catch (e) {}
    } else {
      const initialBrigadiers: FirstAidBrigadier[] = [
        {
          id: 'brig_1',
          companyId: activeCompany?.id,
          fullName: 'Martín Alejandro Sosa',
          roleSector: 'Supervisor de Planta / Brigada de Emergencia',
          shift: 'Mañana',
          phone: 'Int. 112 / Guardia',
          certificationEntity: 'Cruz Roja Argentina · RCP + DEA Ley 27.159',
          certificationDate: '2026-03-15',
          expiryDate: '2027-03-15',
          status: 'vigente'
        },
        {
          id: 'brig_2',
          companyId: activeCompany?.id,
          fullName: 'Lucía Fernanda Quiroga',
          roleSector: 'Encargada de Calidad / Socorrista',
          shift: 'Tarde',
          phone: 'Int. 118 / Portería',
          certificationEntity: 'Servicio de Higiene y Seguridad & ART',
          certificationDate: '2026-05-10',
          expiryDate: '2027-05-10',
          status: 'vigente'
        }
      ];
      setBrigadiers(initialBrigadiers);
      localStorage.setItem('first_aid_brigadiers_db', JSON.stringify(initialBrigadiers));
    }
  }, [activeCompany]);

  // Persistir firmas digitales cuando cambian
  useEffect(() => {
    try {
      localStorage.setItem(
        'first_aid_ats_signatures',
        JSON.stringify({
          employerName,
          supervisorName,
          operatorSignature,
          professionalSignature,
          supervisorSignature,
          showSignatures
        })
      );
    } catch {}
  }, [employerName, supervisorName, operatorSignature, professionalSignature, supervisorSignature, showSignatures]);

  // Métricas para las 4 KPI cards
  const metrics = useMemo(() => {
    const totalAeds = aeds.length;
    const operationalAeds = aeds.filter(a => a.status === 'operational').length;
    const totalKits = kits.length;
    const completeKits = kits.filter(k => k.status === 'complete').length;
    const totalInjuries = injuries.length;
    const totalBrigadiers = brigadiers.length;

    return { totalAeds, operationalAeds, totalKits, completeKits, totalInjuries, totalBrigadiers };
  }, [aeds, kits, injuries, brigadiers]);

  // Filtros por tab y término de búsqueda
  const filteredAeds = useMemo(() => {
    return aeds.filter(a => {
      if (activeCompany && a.companyId && a.companyId !== activeCompany.id) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        a.code.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.brandModel.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q) ||
        a.responsiblePerson.toLowerCase().includes(q)
      );
    });
  }, [aeds, activeCompany, searchTerm]);

  const filteredKits = useMemo(() => {
    return kits.filter(k => {
      if (activeCompany && k.companyId && k.companyId !== activeCompany.id) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        k.code.toLowerCase().includes(q) ||
        k.location.toLowerCase().includes(q) ||
        k.inspectorName.toLowerCase().includes(q)
      );
    });
  }, [kits, activeCompany, searchTerm]);

  const filteredInjuries = useMemo(() => {
    return injuries.filter(i => {
      if (activeCompany && i.companyId && i.companyId !== activeCompany.id) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        i.workerName.toLowerCase().includes(q) ||
        i.workerCuil.toLowerCase().includes(q) ||
        i.area.toLowerCase().includes(q) ||
        i.treatmentDescription.toLowerCase().includes(q) ||
        i.firstResponderName.toLowerCase().includes(q)
      );
    });
  }, [injuries, activeCompany, searchTerm]);

  const filteredBrigadiers = useMemo(() => {
    return brigadiers.filter(b => {
      if (activeCompany && b.companyId && b.companyId !== activeCompany.id) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        b.fullName.toLowerCase().includes(q) ||
        b.roleSector.toLowerCase().includes(q) ||
        b.shift.toLowerCase().includes(q) ||
        b.certificationEntity.toLowerCase().includes(q)
      );
    });
  }, [brigadiers, activeCompany, searchTerm]);

  const handleSaveAed = (e: React.FormEvent) => {
    e.preventDefault();
    const item: AEDDevice = {
      id: `aed_${Date.now()}`,
      companyId: activeCompany?.id,
      code: newAed.code || `DEA-0${aeds.length + 1}`,
      location: newAed.location || '',
      brandModel: newAed.brandModel || '',
      serialNumber: newAed.serialNumber || '',
      batteryLevelPercent: Number(newAed.batteryLevelPercent) || 100,
      batteryExpiryDate: newAed.batteryExpiryDate || '',
      padsAdultExpiryDate: newAed.padsAdultExpiryDate || '',
      padsPediatricExpiryDate: newAed.padsPediatricExpiryDate || '',
      lastTestDate: newAed.lastTestDate || new Date().toISOString().split('T')[0],
      status: 'operational',
      responsiblePerson: newAed.responsiblePerson || '',
      hasCabinetAlarm: newAed.hasCabinetAlarm ?? true,
      hasIlcorSignage: newAed.hasIlcorSignage ?? true,
      hasRescueKit: newAed.hasRescueKit ?? true,
      notes: newAed.notes
    };
    const updated = [item, ...aeds];
    setAeds(updated);
    localStorage.setItem('aed_devices_db', JSON.stringify(updated));
    setShowAedModal(false);
    toast.success('Desfibrilador DEA registrado correctamente');
  };

  const handleQuickTestAed = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = aeds.map(a => (a.id === id ? { ...a, lastTestDate: today, status: 'operational' as const } : a));
    setAeds(updated);
    localStorage.setItem('aed_devices_db', JSON.stringify(updated));
    toast.success(`Autotest verificado OK (${today})`);
  };

  const handleSaveKit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedType = (newKit.type || 'type_b_medium') as 'type_a_small' | 'type_b_medium' | 'type_c_industrial';
    const baseItems = (DEFAULT_KIT_ITEMS[selectedType] || DEFAULT_KIT_ITEMS.type_b_medium).map(i => ({ ...i }));
    const item: FirstAidKit = {
      id: `kit_${Date.now()}`,
      companyId: activeCompany?.id,
      code: newKit.code || `BOT-0${kits.length + 1}`,
      location: newKit.location || '',
      sector: newKit.sector || '',
      type: selectedType,
      lastInspectionDate: newKit.lastInspectionDate || new Date().toISOString().split('T')[0],
      inspectorName: newKit.inspectorName || professionalName || 'Servicio HyS',
      status: 'complete',
      items: baseItems,
      notes: newKit.notes
    };
    const updated = [item, ...kits];
    setKits(updated);
    localStorage.setItem('first_aid_kits_db', JSON.stringify(updated));
    setShowKitModal(false);
    toast.success('Botiquín reglamentario registrado');
  };

  // Actualizar cantidad de un insumo en tiempo real y recalcular estado del botiquín
  const handleUpdateKitItemQty = (kitId: string, itemIdx: number, delta: number) => {
    const updated = kits.map(k => {
      if (k.id !== kitId) return k;
      const newItems = k.items.map((it, idx) => {
        if (idx !== itemIdx) return it;
        return { ...it, currentQty: Math.max(0, it.currentQty + delta) };
      });
      const allComplete = newItems.every(it => it.currentQty >= it.requiredQty);
      return {
        ...k,
        items: newItems,
        status: allComplete ? ('complete' as const) : ('restock_needed' as const),
        lastInspectionDate: new Date().toISOString().split('T')[0]
      };
    });
    setKits(updated);
    localStorage.setItem('first_aid_kits_db', JSON.stringify(updated));
  };

  // Reponer todo el botiquín al 100%
  const handleRestockAllKit = (kitId: string) => {
    const updated = kits.map(k => {
      if (k.id !== kitId) return k;
      const fullItems = k.items.map(it => ({ ...it, currentQty: Math.max(it.currentQty, it.requiredQty) }));
      return {
        ...k,
        items: fullItems,
        status: 'complete' as const,
        lastInspectionDate: new Date().toISOString().split('T')[0]
      };
    });
    setKits(updated);
    localStorage.setItem('first_aid_kits_db', JSON.stringify(updated));
    toast.success('Stock del botiquín repuesto al 100%');
  };

  const handleAddCustomKitItem = (kitId: string) => {
    if (!customItemText.name.trim()) {
      toast.error('Ingrese el nombre del insumo a agregar');
      return;
    }
    const updated = kits.map(k => {
      if (k.id !== kitId) return k;
      const added: FirstAidKitItem = {
        name: customItemText.name.trim(),
        requiredQty: Math.max(1, Number(customItemText.qty) || 1),
        currentQty: Math.max(1, Number(customItemText.qty) || 1),
        unit: customItemText.unit || 'unidades'
      };
      return {
        ...k,
        items: [...k.items, added]
      };
    });
    setKits(updated);
    localStorage.setItem('first_aid_kits_db', JSON.stringify(updated));
    setCustomItemText({ kitId: '', name: '', qty: 1, unit: 'unidades' });
    toast.success('Insumo agregado al botiquín');
  };

  const handleSaveInjury = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInjury.workerName?.trim()) {
      toast.error('Indica el nombre del trabajador atendido.');
      return;
    }
    const item: MinorInjuryRecord = {
      id: `inj_${Date.now()}`,
      companyId: activeCompany?.id,
      date: newInjury.date || new Date().toISOString().split('T')[0],
      time: newInjury.time || '00:00',
      workerName: newInjury.workerName || '',
      workerCuil: newInjury.workerCuil || '',
      area: newInjury.area || '',
      injuryType: newInjury.injuryType || 'corte_superficial',
      vitalSigns: newInjury.vitalSigns || 'Estable / Lúcido',
      treatmentDescription: newInjury.treatmentDescription || '',
      itemsUsed: newInjury.itemsUsed || '',
      kitCodeUsed: newInjury.kitCodeUsed || 'BOT-01',
      firstResponderName: newInjury.firstResponderName || '',
      outcome: newInjury.outcome || 'returned_to_work'
    };
    const updated = [item, ...injuries];
    setInjuries(updated);
    localStorage.setItem('minor_injuries_db', JSON.stringify(updated));
    setShowInjuryModal(false);
    toast.success('Atención menor registrada en el libro oficial');
  };

  const handleSaveBrigadier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrigadier.fullName?.trim()) {
      toast.error('Ingrese el nombre y apellido del brigadista');
      return;
    }
    const item: FirstAidBrigadier = {
      id: `brig_${Date.now()}`,
      companyId: activeCompany?.id,
      fullName: newBrigadier.fullName.trim(),
      roleSector: newBrigadier.roleSector || 'Sector Operativo',
      shift: (newBrigadier.shift as any) || 'Mañana',
      phone: newBrigadier.phone || '',
      certificationEntity: newBrigadier.certificationEntity || 'Cruz Roja / Servicio HyS',
      certificationDate: newBrigadier.certificationDate || new Date().toISOString().split('T')[0],
      expiryDate: newBrigadier.expiryDate || '',
      status: 'vigente'
    };
    const updated = [item, ...brigadiers];
    setBrigadiers(updated);
    localStorage.setItem('first_aid_brigadiers_db', JSON.stringify(updated));
    setShowBrigadierModal(false);
    toast.success('Brigadista certificado en RCP/DEA registrado');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'aed') {
      const u = aeds.filter(a => a.id !== deleteTarget.id);
      setAeds(u);
      localStorage.setItem('aed_devices_db', JSON.stringify(u));
    } else if (deleteTarget.type === 'kit') {
      const u = kits.filter(k => k.id !== deleteTarget.id);
      setKits(u);
      localStorage.setItem('first_aid_kits_db', JSON.stringify(u));
    } else if (deleteTarget.type === 'injury') {
      const u = injuries.filter(i => i.id !== deleteTarget.id);
      setInjuries(u);
      localStorage.setItem('minor_injuries_db', JSON.stringify(u));
    } else if (deleteTarget.type === 'brigadier') {
      const u = brigadiers.filter(b => b.id !== deleteTarget.id);
      setBrigadiers(u);
      localStorage.setItem('first_aid_brigadiers_db', JSON.stringify(u));
    }
    setDeleteTarget(null);
    toast.success('Elemento eliminado correctamente');
  };

  // Helper para dibujar las 3 cajas de firmas Formato ATS (con el Profesional en el Centro) en jsPDF
  const appendAtsThreeSignaturesToPdf = (doc: jsPDF, startY: number, rightSubtitle?: string) => {
    const proData = getSavedProfessionalData();
    const finalProName = (professionalName || proData.name || 'PROFESIONAL ACTUANTE').toUpperCase();
    const finalProTitle = (professionalTitle || proData.profession || 'SERVICIO DE HIGIENE Y SEGURIDAD / MEDICINA').toUpperCase();
    const finalProLic = professionalLicense || proData.license || 'En trámite';
    const finalProSig = professionalSignature || proData.signature;
    const finalProStamp = professionalStamp || proData.stamp;

    drawJsPdfSignatures(doc, {
      startY,
      maxY: 245,
      box1: showSignatures.operator
        ? {
            title: 'RESPONSABLE ESTABLECIMIENTO / EMPLEADOR',
            subtitle: (employerName || activeCompany?.name || 'TITULAR / APODERADO').toUpperCase(),
            secondarySubtitle: activeCompany?.cuit ? `CUIT ${activeCompany.cuit}` : 'Representante Legal',
            signatureUrl: operatorSignature || null,
            isProfessional: false
          }
        : null,
      box2: showSignatures.professional
        ? {
            title: finalProTitle,
            subtitle: finalProName,
            license: finalProLic,
            signatureUrl: finalProSig,
            stampUrl: finalProStamp,
            isProfessional: true
          }
        : null,
      box3: showSignatures.supervisor
        ? {
            title: 'BRIGADISTA / ENCARGADO DE SECTOR',
            subtitle: (rightSubtitle || supervisorName || 'CONFORMIDAD OPERATIVA').toUpperCase(),
            secondarySubtitle: 'Verificación en Planta',
            signatureUrl: supervisorSignature || null,
            isProfessional: false
          }
        : null
    });
  };

  const openOrDownloadJsPdf = (doc: jsPDF, fileName: string, downloadOnly: boolean) => {
    if (downloadOnly) {
      doc.save(fileName);
      toast.success(`PDF descargado: ${fileName}`);
      return;
    }
    doc.autoPrint();
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.open(blobUrl, '_blank');
        }
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(blobUrl);
          } catch {}
        }, 60000);
      }, 300);
    };
    toast.success('Abriendo vista de impresión PDF...');
  };

  // Exportar CSV
  const exportToCsv = () => {
    if (activeTab === 'aed') {
      if (aeds.length === 0) return toast.error('No hay DEAs registrados para exportar.');
      const headers = ['Codigo', 'Ubicacion', 'Marca y Modelo', 'Nro Serie', 'Bateria %', 'Vto Bateria', 'Vto Parches Adulto', 'Ultimo Test', 'Estado', 'Responsable'];
      const rows = aeds.map(a => [
        `"${a.code}"`, `"${a.location}"`, `"${a.brandModel}"`, `"${a.serialNumber}"`,
        a.batteryLevelPercent, `"${a.batteryExpiryDate}"`, `"${a.padsAdultExpiryDate}"`,
        `"${a.lastTestDate}"`, `"${a.status}"`, `"${a.responsiblePerson}"`
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DEAs_Ley27159_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV de DEAs exportado con éxito');
    } else if (activeTab === 'kits') {
      if (kits.length === 0) return toast.error('No hay botiquines para exportar.');
      const headers = ['Codigo', 'Ubicacion', 'Tipo', 'Ultima Inspeccion', 'Inspector', 'Estado'];
      const rows = kits.map(k => [
        `"${k.code}"`, `"${k.location}"`, `"${k.type}"`, `"${k.lastInspectionDate}"`, `"${k.inspectorName}"`, `"${k.status}"`
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Botiquines_Dec351_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV de Botiquines exportado con éxito');
    } else if (activeTab === 'injuries') {
      if (injuries.length === 0) return toast.error('No hay atenciones registradas para exportar.');
      const headers = ['Fecha', 'Hora', 'Trabajador', 'CUIL', 'Sector', 'Tipo Lesion', 'Signos Vitales', 'Tratamiento', 'Insumos', 'Socorrista', 'Resultado'];
      const rows = injuries.map(i => [
        `"${i.date}"`, `"${i.time}"`, `"${i.workerName}"`, `"${i.workerCuil}"`, `"${i.area}"`,
        `"${i.injuryType}"`, `"${i.vitalSigns || ''}"`, `"${i.treatmentDescription.replace(/"/g, '""')}"`,
        `"${i.itemsUsed.replace(/"/g, '""')}"`, `"${i.firstResponderName}"`, `"${i.outcome}"`
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Libro_Atenciones_Menores_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV de Atenciones exportado con éxito');
    } else {
      if (brigadiers.length === 0) return toast.error('No hay brigadistas registrados.');
      const headers = ['Nombre y Apellido', 'Sector / Rol', 'Turno', 'Telefono', 'Entidad Certificadora', 'Fecha Certificacion', 'Vencimiento'];
      const rows = brigadiers.map(b => [
        `"${b.fullName}"`, `"${b.roleSector}"`, `"${b.shift}"`, `"${b.phone}"`,
        `"${b.certificationEntity}"`, `"${b.certificationDate}"`, `"${b.expiryDate}"`
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Brigadistas_RCP_Ley27159_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV de Brigadistas RCP exportado');
    }
  };

  // PDF 1: Constancia de Control de Desfibriladores (DEA)
  const exportAEDReportPDF = (singleAed?: AEDDevice, downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(225, 29, 72);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSTANCIA DE CONTROL DE DESFIBRILADORES EXTERNOS (DEA)', 14, 12);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Ley Nacional 27.159 de Prevención Integral de Muerte Súbita · Espacio Cardioprotegido', 14, 19);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Establecimiento: ${activeCompany ? `${activeCompany.name} (CUIT: ${activeCompany.cuit})` : employerName || 'Establecimiento Principal'}`, 14, 34);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}`, 145, 34);

      const itemsToPrint = singleAed ? [singleAed] : aeds;
      const rows = itemsToPrint.map(a => [
        a.code,
        a.location,
        `${a.brandModel}\n(SN: ${a.serialNumber})`,
        `${a.batteryLevelPercent}% (Vto: ${a.batteryExpiryDate})`,
        `Adulto: ${a.padsAdultExpiryDate}\nPed: ${a.padsPediatricExpiryDate || 'S/D'}`,
        `${a.hasIlcorSignage !== false ? '✓ Señal ILCOR\n' : ''}${a.hasRescueKit !== false ? '✓ Kit RCP' : ''}`,
        a.lastTestDate,
        a.status === 'operational' ? 'OPERATIVO' : a.status.toUpperCase(),
        a.responsiblePerson
      ]);

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Código', 'Ubicación', 'Marca / Serie', 'Batería', 'Vto. Parches', 'Equipamiento', 'Últ. Test', 'Estado', 'Custodio']],
        body: rows,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [225, 29, 72] }
      });

      appendAtsThreeSignaturesToPdf(
        doc,
        (doc as any).lastAutoTable.finalY + 12,
        singleAed?.responsiblePerson || supervisorName
      );

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, 285, 196, 285);
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Documento oficial conforme Ley Nacional 27.159 (Dec. Reglamentario 402/22) y Ley 19.587 / Dec. 351/79.', 14, 289);
      doc.text('Pág. 1 de 1', 196, 289, { align: 'right' });

      const fileName = singleAed ? `Control_DEA_${singleAed.code}.pdf` : `Control_General_DEA_${Date.now()}.pdf`;
      openOrDownloadJsPdf(doc, fileName, downloadOnly);
    } catch (e) {
      console.error(e);
      toast.error('Error al generar PDF de DEA');
    }
  };

  // PDF 2: Planilla de Inspección de Botiquín
  const exportKitReportPDF = (kit: FirstAidKit, downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(5, 150, 105);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PLANILLA DE AUDITORÍA DE BOTIQUÍN DE PRIMEROS AUXILIOS', 14, 12);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Cumplimiento Ley 19.587 · Decreto 351/79 Anexo VII y Decreto 911/96', 14, 19);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Establecimiento: ${activeCompany ? `${activeCompany.name} (CUIT: ${activeCompany.cuit})` : employerName || 'Establecimiento Principal'}`, 14, 34);
      doc.text(`Fecha de Inspección: ${kit.lastInspectionDate}`, 142, 34);

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Parámetro del Botiquín Auditado', 'Detalle Reglamentario']],
        body: [
          ['Código Identificador', kit.code],
          ['Ubicación / Sector en Planta', `${kit.location}${kit.sector ? ` (${kit.sector})` : ''}`],
          [
            'Categoría de Botiquín',
            kit.type === 'type_a_small'
              ? 'Tipo A (Vehicular / Móvil / Hasta 10 personas)'
              : kit.type === 'type_b_medium'
              ? 'Tipo B (Taller / Oficinas / Hasta 50 personas)'
              : 'Tipo C (Planta Industrial >50 personas / Obra Dec. 911/96)'
          ],
          ['Inspector Actuante', kit.inspectorName || professionalName || 'Servicio HyS'],
          ['Dictamen de Stock', kit.status === 'complete' ? 'COMPLETO Y OPERATIVO (100%)' : 'REQUIERE REPOSICIÓN DE INSUMOS']
        ],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42] }
      });

      const nextY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Inventario Detallado de Insumos Sanitarios:', 14, nextY);

      const itemRows = (kit.items || []).map((it, idx) => [
        (idx + 1).toString(),
        it.name,
        it.requiredQty.toString(),
        it.currentQty.toString(),
        it.unit,
        it.currentQty >= it.requiredQty ? 'CONFORME' : `REPONER (${it.requiredQty - it.currentQty})`
      ]);

      autoTable(doc, {
        startY: nextY + 2.5,
        theme: 'grid',
        head: [['#', 'Insumo Reglamentario', 'Exigido', 'Actual', 'Unidad', 'Estado']],
        body: itemRows,
        styles: { fontSize: 7.8, cellPadding: 1.8 },
        headStyles: { fillColor: [5, 150, 105] }
      });

      appendAtsThreeSignaturesToPdf(
        doc,
        (doc as any).lastAutoTable.finalY + 10,
        kit.inspectorName || supervisorName
      );

      const fileName = `Inspeccion_Botiquin_${kit.code}.pdf`;
      openOrDownloadJsPdf(doc, fileName, downloadOnly);
    } catch (e) {
      console.error(e);
      toast.error('Error al generar PDF de botiquín');
    }
  };

  // PDF 3: Libro Oficial de Atenciones Menores / Constancia Individual
  const exportInjuriesReportPDF = (singleInjury?: MinorInjuryRecord, downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(
        singleInjury
          ? 'CONSTANCIA DE ATENCIÓN PRIMARIA DE PRIMEROS AUXILIOS'
          : 'LIBRO OFICIAL DE ATENCIONES MENORES Y CURACIONES',
        14,
        12
      );
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Servicio de Higiene, Seguridad y Medicina del Trabajo · Ley 19.587 / Dec. 1338/96', 14, 19);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Establecimiento: ${activeCompany ? `${activeCompany.name} (CUIT: ${activeCompany.cuit})` : employerName || 'Establecimiento Principal'}`, 14, 34);
      doc.text(`Fecha Emisión: ${new Date().toLocaleDateString('es-AR')}`, 145, 34);

      const list = singleInjury ? [singleInjury] : injuries;
      const rows = list.map(i => [
        `${i.date}\n${i.time} hs`,
        `${i.workerName}\n${i.workerCuil ? `CUIL: ${i.workerCuil}` : ''}`,
        i.area || '-',
        i.injuryType.replace(/_/g, ' ').toUpperCase(),
        i.vitalSigns || 'Estable',
        `${i.treatmentDescription}\n(Insumos: ${i.itemsUsed})`,
        i.firstResponderName || '-',
        i.outcome === 'returned_to_work'
          ? 'REINCORPORADO'
          : i.outcome === 'referred_to_art_clinic'
          ? 'DERIVADO ART'
          : 'REPOSO MÉDICO'
      ]);

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Fecha/Hora', 'Trabajador', 'Sector', 'Lesión', 'Signos Vitales', 'Curación e Insumos Aplicados', 'Socorrista', 'Resolución']],
        body: rows,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235] }
      });

      appendAtsThreeSignaturesToPdf(
        doc,
        (doc as any).lastAutoTable.finalY + 12,
        singleInjury?.firstResponderName || supervisorName
      );

      const fileName = singleInjury
        ? `Atencion_Primaria_${singleInjury.workerName.replace(/\s+/g, '_')}.pdf`
        : `Libro_Atenciones_Menores_${Date.now()}.pdf`;
      openOrDownloadJsPdf(doc, fileName, downloadOnly);
    } catch (e) {
      console.error(e);
      toast.error('Error al generar PDF de atenciones');
    }
  };

  // PDF 4: Nómina de Brigadistas RCP + Cartilla de Protocolos PAS
  const exportBrigadeAndProtocolsPDF = (downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13.5);
      doc.setFont('helvetica', 'bold');
      doc.text('NÓMINA DE BRIGADISTAS RCP/DEA Y PROTOCOLOS DE EMERGENCIA', 14, 12);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Ley Nacional 27.159 Art. 5 (Espacios Cardioprotegidos) · Protocolo PAS de Primeros Auxilios', 14, 19);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Establecimiento: ${activeCompany ? `${activeCompany.name} (CUIT: ${activeCompany.cuit})` : employerName || 'Establecimiento Principal'}`, 14, 34);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 155, 34);

      const brigRows = brigadiers.map(b => [
        b.fullName,
        b.roleSector,
        b.shift,
        b.phone,
        b.certificationEntity,
        `${b.certificationDate} al ${b.expiryDate}`,
        b.status.toUpperCase()
      ]);

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Brigadista / Socorrista', 'Sector / Rol', 'Turno', 'Contacto', 'Certificación RCP/DEA', 'Vigencia', 'Estado']],
        body: brigRows.length > 0 ? brigRows : [['Sin brigadistas cargados', '-', '-', '-', '-', '-', '-']],
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [225, 29, 72] }
      });

      const protoY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Guía Operativa de Actuación Inmediata ante Emergencias Médicas:', 14, protoY);

      const protoRows = EMERGENCY_PROTOCOLS_DATA.map(p => [
        `${p.title}\n(${p.normative})`,
        p.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n'),
        p.warnings.map(w => `• ${w}`).join('\n')
      ]);

      autoTable(doc, {
        startY: protoY + 2.5,
        theme: 'grid',
        head: [['Escenario de Emergencia', 'Secuencia de Actuación Reglamentaria (PAS)', 'Prohibiciones / Alertas']],
        body: protoRows,
        styles: { fontSize: 7.2, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42] },
        columnStyles: {
          0: { cellWidth: 42, fontStyle: 'bold' },
          1: { cellWidth: 96 },
          2: { cellWidth: 44 }
        }
      });

      appendAtsThreeSignaturesToPdf(doc, (doc as any).lastAutoTable.finalY + 10, supervisorName);

      openOrDownloadJsPdf(doc, `Brigada_RCP_y_Protocolos_PAS_${Date.now()}.pdf`, downloadOnly);
    } catch (e) {
      console.error(e);
      toast.error('Error al generar PDF de Brigada y Protocolos');
    }
  };

  return (
    <AnimatedPage>
      <div
        className="container pb-[6rem] min-h-[100vh] flex flex-col"
        style={{ paddingTop: '7rem' }}
      >
        <PremiumHeader
          title="Primeros Auxilios, Botiquines y DEA"
          subtitle="Espacios cardioprotegidos bajo Ley Nacional 27.159, auditoría interactiva de botiquines, brigadistas RCP y libro de atenciones"
          badge="Ley Nac. 27.159 & Dec. 351/79"
          icon={<HeartPulse size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #881337 0%, #be123c 50%, #0f172a 100%)"
          onBack={() => navigate('/')}
        />

        {/* 4 Tarjetas KPI interactivas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setActiveTab('aed')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              activeTab === 'aed'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider">Desfibriladores DEA</span>
              <HeartPulse size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.operationalAeds} / {metrics.totalAeds}
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">Operativos · Ley 27.159</span>
          </div>

          <div
            onClick={() => setActiveTab('kits')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              activeTab === 'kits'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider">Botiquines Planta</span>
              <Cross size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.completeKits} / {metrics.totalKits}
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">Completos · Dec. 351/79</span>
          </div>

          <div
            onClick={() => setActiveTab('injuries')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              activeTab === 'injuries'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider">Atenciones Menores</span>
              <Activity size={20} />
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{metrics.totalInjuries}</div>
            <span className="text-[11px] text-slate-500 font-semibold">Libro de curaciones</span>
          </div>

          <div
            onClick={() => setActiveTab('brigade')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              activeTab === 'brigade'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider">Brigadistas RCP</span>
              <Users size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.totalBrigadiers}</div>
            <span className="text-[11px] text-slate-500 font-semibold">Certificados + Guías PAS</span>
          </div>
        </div>

        {/* Barra de Búsqueda + Botones de Acción Coloridos */}
        <div className="mt-6 bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md h-[40px]">
              <Search
                size={16}
                className="text-slate-400 pointer-events-none z-10"
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              />
              <input
                type="text"
                placeholder={
                  activeTab === 'aed'
                    ? 'Buscar DEA por código, ubicación, serie o marca...'
                    : activeTab === 'kits'
                    ? 'Buscar botiquín por código, sector o inspector...'
                    : activeTab === 'injuries'
                    ? 'Buscar por trabajador, CUIL, sector o curación...'
                    : 'Buscar brigadista por nombre, turno o entidad...'
                }
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '2.5rem',
                  paddingRight: '0.85rem',
                  height: '40px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:border-rose-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportToCsv}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: '1px solid #38bdf8'
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>Exportar CSV</span>
              </button>

              {activeTab === 'aed' && (
                <>
                  <button
                    type="button"
                    onClick={() => exportAEDReportPDF(undefined, false)}
                    style={{
                      background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                      color: '#ffffff',
                      border: '1px solid #94a3b8'
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer"
                  >
                    <Printer size={15} />
                    <span>Imprimir Acta General DEA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAedModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                      color: '#ffffff',
                      border: '1px solid #fb7185'
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:opacity-95 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Registrar DEA</span>
                  </button>
                </>
              )}

              {activeTab === 'kits' && (
                <button
                  type="button"
                  onClick={() => setShowKitModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: '1px solid #34d399'
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:opacity-95 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Registrar Botiquín</span>
                </button>
              )}

              {activeTab === 'injuries' && (
                <>
                  <button
                    type="button"
                    onClick={() => exportInjuriesReportPDF(undefined, false)}
                    style={{
                      background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                      color: '#ffffff',
                      border: '1px solid #94a3b8'
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer"
                  >
                    <Printer size={15} />
                    <span>Imprimir Libro Oficial PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInjuryModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      border: '1px solid #60a5fa'
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:opacity-95 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Registrar Atención</span>
                  </button>
                </>
              )}

              {activeTab === 'brigade' && (
                <>
                  <button
                    type="button"
                    onClick={() => exportBrigadeAndProtocolsPDF(false)}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      border: '1px solid #34d399'
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer"
                  >
                    <Printer size={15} />
                    <span>Imprimir Cartilla PAS + Brigada PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBrigadierModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                      color: '#ffffff',
                      border: '1px solid #fbbf24'
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:opacity-95 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Agregar Brigadista RCP</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 4 Pestañas de Navegación con Color */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('aed')}
              style={{
                backgroundColor: activeTab === 'aed' ? '#e11d48' : 'transparent',
                color: activeTab === 'aed' ? '#ffffff' : undefined,
                border: activeTab === 'aed' ? '1px solid #fb7185' : '1px solid #cbd5e1'
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all"
            >
              <HeartPulse size={15} />
              <span>1. Desfibriladores DEA ({aeds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kits')}
              style={{
                backgroundColor: activeTab === 'kits' ? '#059669' : 'transparent',
                color: activeTab === 'kits' ? '#ffffff' : undefined,
                border: activeTab === 'kits' ? '1px solid #34d399' : '1px solid #cbd5e1'
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all"
            >
              <Cross size={15} />
              <span>2. Control de Botiquines ({kits.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('injuries')}
              style={{
                backgroundColor: activeTab === 'injuries' ? '#2563eb' : 'transparent',
                color: activeTab === 'injuries' ? '#ffffff' : undefined,
                border: activeTab === 'injuries' ? '1px solid #60a5fa' : '1px solid #cbd5e1'
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all"
            >
              <Activity size={15} />
              <span>3. Libro de Atenciones Menores ({injuries.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('brigade')}
              style={{
                backgroundColor: activeTab === 'brigade' ? '#d97706' : 'transparent',
                color: activeTab === 'brigade' ? '#ffffff' : undefined,
                border: activeTab === 'brigade' ? '1px solid #fbbf24' : '1px solid #cbd5e1'
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all"
            >
              <BookOpen size={15} />
              <span>4. Brigadistas RCP y Guías PAS ({brigadiers.length})</span>
            </button>
          </div>
        </div>

        {/* ==================== TAB 1: DESFIBRILADORES DEA ==================== */}
        {activeTab === 'aed' && (
          <div className="mt-6">
            {filteredAeds.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
                <EmptyStateIllustrated
                  title="No hay desfibriladores DEA registrados"
                  description="Registra los equipos DEA de tu establecimiento para cumplir con la Ley Nacional 27.159 y mantener la vigencia de parches y baterías."
                  actionLabel="Registrar DEA"
                  onAction={() => setShowAedModal(true)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAeds.map(item => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-between hover:border-rose-400 transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <HeartPulse size={22} />
                          </span>
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{item.code}</h4>
                            <span className="text-xs text-slate-500 font-semibold">{item.brandModel}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                          {item.status === 'operational' ? '● OPERATIVO' : item.status}
                        </span>
                      </div>

                      {/* Barra visual de nivel de batería */}
                      <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Battery size={14} className="text-emerald-500" /> Carga de Batería Litio
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">{item.batteryLevelPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(0, item.batteryLevelPercent))}%`,
                              background: item.batteryLevelPercent > 30 ? '#10b981' : '#ef4444'
                            }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-rose-500 shrink-0" />
                          <span className="font-semibold">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          <span>Vto. Batería: <strong>{item.batteryExpiryDate}</strong> · Parches: <strong>{item.padsAdultExpiryDate}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">Custodio: <strong>{item.responsiblePerson}</strong></span>
                        </div>

                        {/* Badges de equipamiento Ley 27.159 */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            ✓ Señalética ILCOR
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                            ✓ Gabinete con Alarma
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            ✓ Kit Tijera + Rasuradora + Pocket Mask
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Último autotest: <strong>{item.lastTestDate}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleQuickTestAed(item.id)}
                          className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          ✓ Marcar Test Hoy
                        </button>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => exportAEDReportPDF(item, false)}
                          style={{ backgroundColor: '#059669', color: '#ffffff' }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <FileText size={13} />
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewDetail({ type: 'aed', data: item })}
                          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Ficha</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'aed', id: item.id })}
                          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: CONTROL INTERACTIVO DE BOTIQUINES ==================== */}
        {activeTab === 'kits' && (
          <div className="mt-6">
            {filteredKits.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
                <EmptyStateIllustrated
                  title="No hay botiquines registrados"
                  description="Registra los botiquines reglamentarios del establecimiento conforme al Decreto 351/79 Anexo VII."
                  actionLabel="Registrar Botiquín"
                  onAction={() => setShowKitModal(true)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredKits.map(kit => {
                  const missingCount = kit.items.filter(it => it.currentQty < it.requiredQty).length;
                  return (
                    <div
                      key={kit.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <Cross size={20} />
                            </span>
                            <div>
                              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                                <span>{kit.code}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {kit.type === 'type_a_small' ? 'Tipo A (Vehicular)' : kit.type === 'type_b_medium' ? 'Tipo B (Taller ≤50p)' : 'Tipo C (Industrial >50p)'}
                                </span>
                              </h4>
                              <span className="text-xs text-slate-500 font-semibold">{kit.location}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                                missingCount === 0
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {missingCount === 0 ? '✓ COMPLETO 100%' : `⚠️ ${missingCount} EN FALTA`}
                            </span>
                            {missingCount > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRestockAllKit(kit.id)}
                                style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Sparkles size={11} /> Reponer 100%
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                          <span>Control Interactivo de Stock (Use - / + para auditar):</span>
                          <span className="text-[11px] text-slate-400">{kit.items.length} ítems</span>
                        </div>

                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {kit.items.map((it, idx) => {
                            const isOk = it.currentQty >= it.requiredQty;
                            return (
                              <div
                                key={idx}
                                className={`flex justify-between items-center text-xs p-2 rounded-xl border ${
                                  isOk
                                    ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                                    : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400/60'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="text-slate-800 dark:text-slate-200 text-[11px] font-semibold block truncate">
                                    {it.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Exigido: {it.requiredQty} {it.unit}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateKitItemQty(kit.id, idx, -1)}
                                    className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold cursor-pointer transition-colors"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span
                                    className={`min-w-[46px] text-center font-black text-xs px-1.5 py-0.5 rounded ${
                                      isOk ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                                    }`}
                                  >
                                    {it.currentQty}/{it.requiredQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateKitItemQty(kit.id, idx, 1)}
                                    className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold cursor-pointer transition-colors"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Agregar insumo extra rápido */}
                        <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Agregar otro insumo al botiquín..."
                            value={customItemText.kitId === kit.id ? customItemText.name : ''}
                            onChange={e => setCustomItemText({ ...customItemText, kitId: kit.id, name: e.target.value })}
                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomKitItem(kit.id)}
                            style={{ backgroundColor: '#0284c7', color: '#ffffff' }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Plus size={13} /> Insumo
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2 text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Inspector: <strong>{kit.inspectorName}</strong> ({kit.lastInspectionDate})
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => exportKitReportPDF(kit, false)}
                            style={{ backgroundColor: '#059669', color: '#ffffff' }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Printer size={13} />
                            <span>Imprimir Acta PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewDetail({ type: 'kit', data: kit })}
                            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: 'kit', id: kit.id })}
                            style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: LIBRO DE ATENCIONES MENORES ==================== */}
        {activeTab === 'injuries' && (
          <div className="mt-6">
            {filteredInjuries.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
                <EmptyStateIllustrated
                  title="No hay atenciones menores registradas aún"
                  description="Lleva el libro formal de curaciones leves, signos vitales, insumos aplicados y retorno laboral inmediato de los operarios."
                  actionLabel="Registrar Atención Menor"
                  onAction={() => setShowInjuryModal(true)}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase font-extrabold">
                      <tr>
                        <th className="py-3.5 px-4">Fecha y Hora</th>
                        <th className="py-3.5 px-4">Trabajador</th>
                        <th className="py-3.5 px-4">Sector</th>
                        <th className="py-3.5 px-4">Motivo / Lesión</th>
                        <th className="py-3.5 px-4">Curación e Insumos</th>
                        <th className="py-3.5 px-4">Resolución</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                      {filteredInjuries.map(inj => (
                        <tr key={inj.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-bold">
                            {inj.date} · {inj.time} hs
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                            {inj.workerName}
                            {inj.workerCuil && <div className="text-[10px] text-slate-400 font-mono">CUIL: {inj.workerCuil}</div>}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">{inj.area}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold capitalize block">{inj.injuryType.replace(/_/g, ' ')}</span>
                            {inj.vitalSigns && <span className="text-[10px] text-slate-500">{inj.vitalSigns}</span>}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="truncate font-medium">{inj.treatmentDescription}</div>
                            <div className="text-[10px] text-slate-400 truncate">Insumos: {inj.itemsUsed}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                inj.outcome === 'returned_to_work'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {inj.outcome === 'returned_to_work'
                                ? '✓ Reincorporado'
                                : inj.outcome === 'referred_to_art_clinic'
                                ? '⚠️ Derivado a ART'
                                : 'Reposo Médico'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => exportInjuriesReportPDF(inj, false)}
                                style={{ backgroundColor: '#059669', color: '#ffffff' }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Printer size={12} />
                                <span>PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setViewDetail({ type: 'injury', data: inj })}
                                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye size={12} />
                                <span>Ver</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ type: 'injury', id: inj.id })}
                                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: BRIGADISTAS RCP/DEA Y GUÍAS DE EMERGENCIA PAS ==================== */}
        {activeTab === 'brigade' && (
          <div className="mt-6 space-y-6">
            {/* Nómina de Brigadistas Certificados en RCP y Uso de DEA */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users size={20} className="text-amber-500" />
                    Nómina de Brigadistas y Socorristas Certificados en RCP + Uso de DEA (Ley Nac. 27.159 Art. 5)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Todo espacio cardioprotegido debe contar durante toda su franja horaria con personal entrenado en técnicas de reanimación cardiopulmonar y manejo de DEA.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBrigadierModal(true)}
                  style={{ backgroundColor: '#d97706', color: '#ffffff' }}
                  className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Agregar Brigadista
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBrigadiers.map(b => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">{b.fullName}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                          ✓ VIGENTE
                        </span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-semibold">
                        {b.roleSector} · Turno: <strong>{b.shift}</strong>
                      </div>
                      <div className="text-slate-500 flex items-center gap-1.5">
                        <PhoneCall size={12} className="text-emerald-500" /> {b.phone}
                      </div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                        📜 {b.certificationEntity} (Vence: {b.expiryDate})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'brigadier', id: b.id })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Guías Rápidas de Actuación en Emergencias (Protocolo PAS) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={20} className="text-rose-500" />
                  Protocolos Operativos de Actuación en Emergencias Médicas (Conducta PAS)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EMERGENCY_PROTOCOLS_DATA.map(proto => (
                  <div
                    key={proto.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{proto.title}</h4>
                          <span className="text-[11px] font-mono text-slate-500">{proto.normative}</span>
                        </div>
                        <span
                          style={{ backgroundColor: proto.color, color: '#ffffff' }}
                          className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0"
                        >
                          {proto.severity}
                        </span>
                      </div>

                      <ol className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-200 list-decimal pl-4">
                        {proto.steps.map((st, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {st}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-900 dark:text-rose-200 space-y-1">
                      <div className="font-black uppercase flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <AlertTriangle size={13} /> Precauciones Críticas:
                      </div>
                      {proto.warnings.map((w, idx) => (
                        <div key={idx}>• {w}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== BLOQUE DE FIRMAS DIGITALES FORMATO ATS (SIEMPRE DISPONIBLE PARA LOS REPORTES PDF) ==================== */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <PenTool size={19} className="text-emerald-500" />
                Firmas Digitales para Actas y Reportes PDF (Formato ATS con Profesional en el Medio)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Las firmas configuradas aquí se incrustan automáticamente en las Actas de DEA, Planillas de Botiquines, Libro de Atenciones y Nómina de Brigadistas:
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'operator' as const, label: 'Empleador / Establecimiento (Izq.)' },
                { key: 'professional' as const, label: 'Profesional HyS / Médico (Centro ⭐)' },
                { key: 'supervisor' as const, label: 'Brigadista / Sector (Der.)' }
              ].map(({ key, label }) => {
                const active = showSignatures[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setShowSignatures(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 size={14} className={active ? 'text-emerald-500' : 'text-slate-400'} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aclaraciones de los 3 firmantes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Aclaración Empleador / Establecimiento (Izquierda)
              </label>
              <input
                type="text"
                value={employerName}
                onChange={e => setEmployerName(e.target.value)}
                placeholder={activeCompany?.name || 'Nombre del Titular / Apoderado'}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Profesional HyS / Médico Laboral (Centro ⭐)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={professionalName}
                  onChange={e => setProfessionalName(e.target.value)}
                  placeholder="Nombre del Profesional"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={professionalLicense}
                  onChange={e => setProfessionalLicense(e.target.value)}
                  placeholder="Matrícula N°"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Aclaración Brigadista / Encargado de Sector (Derecha)
              </label>
              <input
                type="text"
                value={supervisorName}
                onChange={e => setSupervisorName(e.target.value)}
                placeholder="Jefe de Brigada / Encargado de Planta"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* 3 Pizarras de Firma Digital */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {showSignatures.operator && (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col justify-between">
                <SignatureCanvas
                  label={`Firma Empleador (${employerName || activeCompany?.name || 'Establecimiento'})`}
                  initialImage={operatorSignature || null}
                  onSave={sig => setOperatorSignature(sig || '')}
                />
              </div>
            )}

            {showSignatures.professional && (
              <div className="p-3 rounded-xl border-2 border-emerald-500/70 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-md flex flex-col justify-between relative">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white self-center mb-2">
                  ⭐ Firma Central • Profesional H&S / Médico
                </span>
                <SignatureCanvas
                  label={`Firma Profesional (${professionalName || 'Servicio HyS / Médico'})`}
                  initialImage={professionalSignature || null}
                  onSave={sig => setProfessionalSignature(sig || '')}
                />
              </div>
            )}

            {showSignatures.supervisor && (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col justify-between">
                <SignatureCanvas
                  label={`Firma Brigadista / Sector (${supervisorName || 'Encargado'})`}
                  initialImage={supervisorSignature || null}
                  onSave={sig => setSupervisorSignature(sig || '')}
                />
              </div>
            )}
          </div>

          {/* Cuadro de Vista Previa en Vivo del Bloque de Firmas ATS */}
          <div className="p-4 rounded-2xl bg-white text-slate-900 border-2 border-slate-300 shadow-inner">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-center mb-1">
              Vista Previa del Cuadro de Firmas en los Documentos PDF (Con la Firma del Profesional en el Medio)
            </div>
            <PdfSignatures
              data={{ showSignatures }}
              compact={true}
              hideFooter={true}
              box1={{
                title: 'RESPONSABLE ESTABLECIMIENTO / EMPLEADOR',
                subtitle: (employerName || activeCompany?.name || 'Titular / Apoderado').toUpperCase(),
                signatureUrl: operatorSignature || null,
                isProfessional: false,
                license: activeCompany?.cuit ? `CUIT ${activeCompany.cuit}` : undefined
              }}
              box2={{
                title: (professionalTitle || 'SERVICIO DE HIGIENE Y SEGURIDAD / MEDICINA').toUpperCase(),
                subtitle: (professionalName || 'Firma y Sello Profesional').toUpperCase(),
                signatureUrl: professionalSignature || null,
                stampUrl: professionalStamp || null,
                isProfessional: true,
                license: professionalLicense || 'En trámite'
              }}
              box3={{
                title: 'BRIGADISTA / ENCARGADO DE SECTOR',
                subtitle: (supervisorName || 'Conformidad Operativa').toUpperCase(),
                signatureUrl: supervisorSignature || null,
                isProfessional: false
              }}
            />
          </div>
        </div>
      </div>

      {/* MODAL VER DETALLE */}
      {viewDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                {viewDetail.type === 'aed' && <HeartPulse className="text-rose-500" size={22} />}
                {viewDetail.type === 'kit' && <Cross className="text-emerald-500" size={22} />}
                {viewDetail.type === 'injury' && <Activity className="text-blue-500" size={22} />}
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  {viewDetail.type === 'aed'
                    ? `Desfibrilador: ${viewDetail.data.code}`
                    : viewDetail.type === 'kit'
                    ? `Botiquín: ${viewDetail.data.code}`
                    : `Atención: ${viewDetail.data.workerName}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {viewDetail.type === 'aed' && (
              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <div><strong>Marca / Modelo:</strong> {viewDetail.data.brandModel}</div>
                  <div><strong>N° de Serie:</strong> {viewDetail.data.serialNumber}</div>
                  <div><strong>Ubicación:</strong> {viewDetail.data.location}</div>
                  <div><strong>Estado:</strong> {viewDetail.data.status.toUpperCase()}</div>
                  <div><strong>Batería:</strong> {viewDetail.data.batteryLevelPercent}% (Vence: {viewDetail.data.batteryExpiryDate})</div>
                  <div><strong>Parches Adulto:</strong> {viewDetail.data.padsAdultExpiryDate}</div>
                  <div><strong>Último Test:</strong> {viewDetail.data.lastTestDate}</div>
                  <div><strong>Responsable:</strong> {viewDetail.data.responsiblePerson}</div>
                </div>
              </div>
            )}

            {viewDetail.type === 'kit' && (
              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                  <div><strong>Ubicación:</strong> {viewDetail.data.location}</div>
                  <div><strong>Inspector:</strong> {viewDetail.data.inspectorName}</div>
                  <div><strong>Última Inspección:</strong> {viewDetail.data.lastInspectionDate}</div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Insumos y Stock Registrado:</h4>
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {(viewDetail.data.items || []).map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded text-[11px]">
                        <span>{it.name}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {it.currentQty} / {it.requiredQty} {it.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {viewDetail.type === 'injury' && (
              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <div><strong>Trabajador:</strong> {viewDetail.data.workerName}</div>
                  <div><strong>CUIL:</strong> {viewDetail.data.workerCuil || 'No informado'}</div>
                  <div><strong>Fecha y Hora:</strong> {viewDetail.data.date} {viewDetail.data.time} hs</div>
                  <div><strong>Sector:</strong> {viewDetail.data.area}</div>
                  <div><strong>Signos Vitales:</strong> {viewDetail.data.vitalSigns || 'Estable'}</div>
                  <div><strong>Resolución:</strong> {viewDetail.data.outcome === 'returned_to_work' ? 'Reincorporado' : 'Derivado a ART'}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <strong>Tratamiento Aplicado:</strong>
                  <p className="mt-1">{viewDetail.data.treatmentDescription}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <strong>Insumos Utilizados:</strong>
                  <p className="mt-1">{viewDetail.data.itemsUsed}</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setViewDetail(null)}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO DEA */}
      {showAedModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <HeartPulse className="text-rose-500" size={20} />
              Registrar Desfibrilador (DEA · Ley 27.159)
            </h3>
            <form onSubmit={handleSaveAed} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Código Identificador</label>
                  <input
                    type="text"
                    value={newAed.code}
                    onChange={e => setNewAed({ ...newAed, code: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nivel Batería (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newAed.batteryLevelPercent}
                    onChange={e => setNewAed({ ...newAed, batteryLevelPercent: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Ubicación Precisa en Planta</label>
                <input
                  type="text"
                  value={newAed.location}
                  onChange={e => setNewAed({ ...newAed, location: e.target.value })}
                  placeholder="Ej. Recepción Central frente a molinetes (acceso < 3 min)"
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Marca / Modelo</label>
                  <input
                    type="text"
                    value={newAed.brandModel}
                    onChange={e => setNewAed({ ...newAed, brandModel: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">N° de Serie</label>
                  <input
                    type="text"
                    value={newAed.serialNumber}
                    onChange={e => setNewAed({ ...newAed, serialNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Vto. Batería</label>
                  <input
                    type="date"
                    value={newAed.batteryExpiryDate}
                    onChange={e => setNewAed({ ...newAed, batteryExpiryDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Vto. Parches Adulto</label>
                  <input
                    type="date"
                    value={newAed.padsAdultExpiryDate}
                    onChange={e => setNewAed({ ...newAed, padsAdultExpiryDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Responsable Custodio</label>
                <input
                  type="text"
                  value={newAed.responsiblePerson}
                  onChange={e => setNewAed({ ...newAed, responsiblePerson: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAedModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#e11d48', color: '#ffffff' }}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Guardar DEA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO BOTIQUÍN */}
      {showKitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Cross className="text-emerald-600" size={20} />
              Registrar Botiquín de Primeros Auxilios
            </h3>
            <form onSubmit={handleSaveKit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Código</label>
                <input
                  type="text"
                  value={newKit.code}
                  onChange={e => setNewKit({ ...newKit, code: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Ubicación / Sector</label>
                <input
                  type="text"
                  value={newKit.location}
                  onChange={e => setNewKit({ ...newKit, location: e.target.value })}
                  placeholder="Ej. Nave de Producción 2 / Comedor"
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Categoría Reglamentaria (Carga automática de insumos)
                </label>
                <select
                  value={newKit.type}
                  onChange={e => setNewKit({ ...newKit, type: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="type_a_small">Tipo A · Vehicular / Móvil / Hasta 10 pers. (9 insumos)</option>
                  <option value="type_b_medium">Tipo B · Taller / Oficinas / Hasta 50 pers. (13 insumos)</option>
                  <option value="type_c_industrial">Tipo C · Planta Industrial &gt;50 pers. / Obra Dec. 911 (16 insumos)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Auditor / Inspector</label>
                <input
                  type="text"
                  value={newKit.inspectorName}
                  onChange={e => setNewKit({ ...newKit, inspectorName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowKitModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#059669', color: '#ffffff' }}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Guardar Botiquín
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA ATENCIÓN MENOR */}
      {showInjuryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              Registro en Libro de Atenciones Menores y Curaciones
            </h3>
            <form onSubmit={handleSaveInjury} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={newInjury.date}
                    onChange={e => setNewInjury({ ...newInjury, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Hora</label>
                  <input
                    type="time"
                    value={newInjury.time}
                    onChange={e => setNewInjury({ ...newInjury, time: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Trabajador *</label>
                  <input
                    type="text"
                    placeholder="Nombre y Apellido"
                    value={newInjury.workerName}
                    onChange={e => setNewInjury({ ...newInjury, workerName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">CUIL / Legajo</label>
                  <input
                    type="text"
                    placeholder="20-12345678-9"
                    value={newInjury.workerCuil}
                    onChange={e => setNewInjury({ ...newInjury, workerCuil: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Sector / Área</label>
                  <input
                    type="text"
                    placeholder="Ej. Mantenimiento / Logística"
                    value={newInjury.area}
                    onChange={e => setNewInjury({ ...newInjury, area: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Signos Vitales Controlados</label>
                  <input
                    type="text"
                    placeholder="TA 120/80 · FC 75 lpm"
                    value={newInjury.vitalSigns}
                    onChange={e => setNewInjury({ ...newInjury, vitalSigns: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tipo de Lesión / Motivo de Atención</label>
                <select
                  value={newInjury.injuryType}
                  onChange={e => setNewInjury({ ...newInjury, injuryType: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                >
                  <option value="corte_superficial">Corte Superficial / Herida Leve</option>
                  <option value="raspon_escoriacion">Raspón / Escoriación</option>
                  <option value="cuerpo_extrano_ocular">Cuerpo Extraño en Ojo (Lavado Ocular)</option>
                  <option value="quemadura_menor">Quemadura Grado 1 (Superficial)</option>
                  <option value="contusion_leve">Contusión Leve / Golpe</option>
                  <option value="esguince_torcedura">Esguince Leve / Torcedura</option>
                  <option value="malestar_presion_arterial">Control de Tensión Arterial / Cefalea / Mareo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Procedimiento de Curación Aplicado</label>
                <textarea
                  rows={2}
                  value={newInjury.treatmentDescription}
                  onChange={e => setNewInjury({ ...newInjury, treatmentDescription: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Insumos Utilizados</label>
                  <input
                    type="text"
                    value={newInjury.itemsUsed}
                    onChange={e => setNewInjury({ ...newInjury, itemsUsed: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Socorrista Actuante</label>
                  <input
                    type="text"
                    value={newInjury.firstResponderName}
                    onChange={e => setNewInjury({ ...newInjury, firstResponderName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Resolución</label>
                <select
                  value={newInjury.outcome}
                  onChange={e => setNewInjury({ ...newInjury, outcome: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                >
                  <option value="returned_to_work">Reincorporado inmediatamente al puesto habitual</option>
                  <option value="referred_to_art_clinic">Derivado preventivamente a centro médico de ART</option>
                  <option value="medical_rest">Derivado a control médico particular / Reposo</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInjuryModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Guardar Atención
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO BRIGADISTA RCP / DEA */}
      {showBrigadierModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Users className="text-amber-500" size={20} />
              Registrar Brigadista Certificado en RCP y DEA
            </h3>
            <form onSubmit={handleSaveBrigadier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre y Apellido *</label>
                <input
                  type="text"
                  value={newBrigadier.fullName}
                  onChange={e => setNewBrigadier({ ...newBrigadier, fullName: e.target.value })}
                  placeholder="Ej. Roberto Carlos Gómez"
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Sector / Puesto</label>
                  <input
                    type="text"
                    value={newBrigadier.roleSector}
                    onChange={e => setNewBrigadier({ ...newBrigadier, roleSector: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Turno Cubierto</label>
                  <select
                    value={newBrigadier.shift}
                    onChange={e => setNewBrigadier({ ...newBrigadier, shift: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  >
                    <option value="Mañana">Turno Mañana</option>
                    <option value="Tarde">Turno Tarde</option>
                    <option value="Noche">Turno Noche</option>
                    <option value="Rotativo / Central">Rotativo / Central</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Teléfono / Interno de Emergencia</label>
                <input
                  type="text"
                  value={newBrigadier.phone}
                  onChange={e => setNewBrigadier({ ...newBrigadier, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Entidad Certificadora RCP / DEA</label>
                <input
                  type="text"
                  value={newBrigadier.certificationEntity}
                  onChange={e => setNewBrigadier({ ...newBrigadier, certificationEntity: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Fecha Capacitación</label>
                  <input
                    type="date"
                    value={newBrigadier.certificationDate}
                    onChange={e => setNewBrigadier({ ...newBrigadier, certificationDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Vencimiento Anual</label>
                  <input
                    type="date"
                    value={newBrigadier.expiryDate}
                    onChange={e => setNewBrigadier({ ...newBrigadier, expiryDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBrigadierModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#d97706', color: '#ffffff' }}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Guardar Brigadista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Eliminar Registro"
        message="¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </AnimatedPage>
  );
}
