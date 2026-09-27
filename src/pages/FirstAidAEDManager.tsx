import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse, Plus, Search, Calendar, FileText, Download,
  Trash2, AlertTriangle, CheckCircle2, Battery, ShieldAlert,
  Cross, Activity, User, MapPin, Clock, ArrowRight,
  FileSpreadsheet, Eye, X, ShieldCheck, Printer, Check
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import {
  AEDDevice, FirstAidKit, MinorInjuryRecord, DEFAULT_KIT_ITEMS
} from '../data/firstAidData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function FirstAidAEDManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<'aed' | 'kits' | 'injuries'>('aed');
  const [searchTerm, setSearchTerm] = useState('');

  // DEAs
  const [aeds, setAeds] = useState<AEDDevice[]>([]);
  const [showAedModal, setShowAedModal] = useState(false);
  const [newAed, setNewAed] = useState<Partial<AEDDevice>>({
    code: 'DEA-01',
    location: 'Recepción Central / Hall Principal',
    brandModel: 'Zoll AED Plus',
    serialNumber: 'SN-9823412',
    batteryLevelPercent: 100,
    batteryExpiryDate: '2028-12-31',
    padsAdultExpiryDate: '2027-06-30',
    lastTestDate: new Date().toISOString().split('T')[0],
    status: 'operational',
    responsiblePerson: 'Lic. Seguridad / Enfermería'
  });

  // Botiquines
  const [kits, setKits] = useState<FirstAidKit[]>([]);
  const [showKitModal, setShowKitModal] = useState(false);
  const [newKit, setNewKit] = useState<Partial<FirstAidKit>>({
    code: 'BOT-01',
    location: 'Taller de Mantenimiento',
    type: 'type_b_medium',
    lastInspectionDate: new Date().toISOString().split('T')[0],
    inspectorName: 'Servicio HyS',
    status: 'complete'
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
    treatmentDescription: 'Lavado con solución fisiológica, desinfección con clorhexidina y colocación de apósito estéril.',
    itemsUsed: '1 sobre de gasa estéril, clorhexidina, 1 apósito',
    firstResponderName: 'Socorrista / Enfermero',
    outcome: 'returned_to_work'
  });

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'aed' | 'kit' | 'injury'; id: string } | null>(null);
  const [viewDetail, setViewDetail] = useState<{ type: 'aed' | 'kit' | 'injury'; data: any } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
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
        lastTestDate: new Date().toISOString().split('T')[0],
        status: 'operational',
        responsiblePerson: 'Servicio de Medicina Laboral'
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
        type: 'type_b_medium',
        lastInspectionDate: new Date().toISOString().split('T')[0],
        inspectorName: 'Téc. HyS',
        status: 'complete',
        items: DEFAULT_KIT_ITEMS.type_b_medium
      };
      setKits([initialKit]);
      localStorage.setItem('first_aid_kits_db', JSON.stringify([initialKit]));
    }

    const rawInjuries = localStorage.getItem('minor_injuries_db');
    if (rawInjuries) {
      try { setInjuries(JSON.parse(rawInjuries)); } catch (e) {}
    }
  }, [activeCompany]);

  // Métricas para las 4 KPI cards estilo Aptitudes Médicas
  const metrics = useMemo(() => {
    const totalAeds = aeds.length;
    const operationalAeds = aeds.filter(a => a.status === 'operational').length;
    const totalKits = kits.length;
    const totalInjuries = injuries.length;

    return { totalAeds, operationalAeds, totalKits, totalInjuries };
  }, [aeds, kits, injuries]);

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

  const handleSaveAed = (e: React.FormEvent) => {
    e.preventDefault();
    const item: AEDDevice = {
      id: `aed_${Date.now()}`,
      companyId: activeCompany?.id,
      code: newAed.code || 'DEA-01',
      location: newAed.location || '',
      brandModel: newAed.brandModel || '',
      serialNumber: newAed.serialNumber || '',
      batteryLevelPercent: Number(newAed.batteryLevelPercent) || 100,
      batteryExpiryDate: newAed.batteryExpiryDate || '',
      padsAdultExpiryDate: newAed.padsAdultExpiryDate || '',
      lastTestDate: newAed.lastTestDate || new Date().toISOString().split('T')[0],
      status: 'operational',
      responsiblePerson: newAed.responsiblePerson || '',
      notes: newAed.notes
    };
    const updated = [item, ...aeds];
    setAeds(updated);
    localStorage.setItem('aed_devices_db', JSON.stringify(updated));
    setShowAedModal(false);
    toast.success('Desfibrilador DEA registrado');
  };

  const handleSaveKit = (e: React.FormEvent) => {
    e.preventDefault();
    const item: FirstAidKit = {
      id: `kit_${Date.now()}`,
      companyId: activeCompany?.id,
      code: newKit.code || 'BOT-01',
      location: newKit.location || '',
      type: newKit.type || 'type_b_medium',
      lastInspectionDate: newKit.lastInspectionDate || new Date().toISOString().split('T')[0],
      inspectorName: newKit.inspectorName || '',
      status: 'complete',
      items: DEFAULT_KIT_ITEMS.type_b_medium
    };
    const updated = [item, ...kits];
    setKits(updated);
    localStorage.setItem('first_aid_kits_db', JSON.stringify(updated));
    setShowKitModal(false);
    toast.success('Botiquín de primeros auxilios registrado');
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
      treatmentDescription: newInjury.treatmentDescription || '',
      itemsUsed: newInjury.itemsUsed || '',
      firstResponderName: newInjury.firstResponderName || '',
      outcome: newInjury.outcome || 'returned_to_work'
    };
    const updated = [item, ...injuries];
    setInjuries(updated);
    localStorage.setItem('minor_injuries_db', JSON.stringify(updated));
    setShowInjuryModal(false);
    toast.success('Atención menor registrada en el libro oficial');
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
    } else {
      const u = injuries.filter(i => i.id !== deleteTarget.id);
      setInjuries(u);
      localStorage.setItem('minor_injuries_db', JSON.stringify(u));
    }
    setDeleteTarget(null);
    toast.success('Elemento eliminado correctamente');
  };

  // Exportar CSV
  const exportToCsv = () => {
    if (activeTab === 'aed') {
      if (aeds.length === 0) {
        toast.error('No hay DEAs registrados para exportar.');
        return;
      }
      const headers = ['Codigo', 'Ubicacion', 'Marca y Modelo', 'Nro Serie', 'Bateria %', 'Vto Bateria', 'Vto Parches', 'Ultimo Test', 'Estado', 'Responsable'];
      const rows = aeds.map(a => [
        `"${a.code}"`,
        `"${a.location}"`,
        `"${a.brandModel}"`,
        `"${a.serialNumber}"`,
        a.batteryLevelPercent,
        `"${a.batteryExpiryDate}"`,
        `"${a.padsAdultExpiryDate}"`,
        `"${a.lastTestDate}"`,
        `"${a.status}"`,
        `"${a.responsiblePerson}"`
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
      if (kits.length === 0) {
        toast.error('No hay botiquines para exportar.');
        return;
      }
      const headers = ['Codigo', 'Ubicacion', 'Tipo', 'Ultima Inspeccion', 'Inspector', 'Estado'];
      const rows = kits.map(k => [
        `"${k.code}"`,
        `"${k.location}"`,
        `"${k.type}"`,
        `"${k.lastInspectionDate}"`,
        `"${k.inspectorName}"`,
        `"${k.status}"`
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
    } else {
      if (injuries.length === 0) {
        toast.error('No hay atenciones registradas para exportar.');
        return;
      }
      const headers = ['Fecha', 'Hora', 'Trabajador', 'CUIL', 'Sector', 'Tipo Lesion', 'Tratamiento', 'Insumos', 'Socorrista', 'Resultado'];
      const rows = injuries.map(i => [
        `"${i.date}"`,
        `"${i.time}"`,
        `"${i.workerName}"`,
        `"${i.workerCuil}"`,
        `"${i.area}"`,
        `"${i.injuryType}"`,
        `"${i.treatmentDescription.replace(/"/g, '""')}"`,
        `"${i.itemsUsed.replace(/"/g, '""')}"`,
        `"${i.firstResponderName}"`,
        `"${i.outcome}"`
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
    }
  };

  const exportAEDReportPDF = (singleAed?: AEDDevice, downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSTANCIA DE CONTROL DE DESFIBRILADORES (DEA)', 14, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Ley Nacional 27.159 de Prevención Integral de Muerte Súbita - Espacio Cardioprotegido', 14, 19);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Establecimiento: ${activeCompany ? `${activeCompany.name} (CUIT: ${activeCompany.cuit})` : 'Establecimiento Principal'}`, 14, 34);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 140, 34);

      const itemsToPrint = singleAed ? [singleAed] : aeds;
      const rows = itemsToPrint.map(a => [
        a.code,
        a.location,
        `${a.brandModel}\n(SN: ${a.serialNumber})`,
        `${a.batteryLevelPercent}% (Vence: ${a.batteryExpiryDate})`,
        a.padsAdultExpiryDate,
        a.lastTestDate,
        a.status.toUpperCase(),
        a.responsiblePerson
      ]);

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Código', 'Ubicación', 'Marca y N° Serie', 'Batería', 'Vto. Parches', 'Último Test', 'Estado', 'Responsable']],
        body: rows,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [220, 38, 38] }
      });

      const currentY = (doc as any).lastAutoTable.finalY + 22;
      doc.setFontSize(8);
      doc.text('________________________________________', 25, currentY);
      doc.text('Firma Responsable Médico / HyS', 25, currentY + 5);

      doc.text('________________________________________', 125, currentY);
      doc.text('Firma Dirección del Establecimiento', 125, currentY + 5);

      // Pie de página legal
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, 285, 196, 285);
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Documento oficial según Ley Nacional 27.159 y Decreto 351/79.', 14, 289);
      doc.text('Pág. 1 de 1', 196, 289, { align: 'right' });

      const fileName = singleAed ? `Control_DEA_${singleAed.code}.pdf` : `Control_General_DEA_${Date.now()}.pdf`;

      if (downloadOnly) {
        doc.save(fileName);
        toast.success('Reporte de control DEA descargado');
      } else {
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
        toast.success('Abriendo diálogo de impresión...');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al generar PDF de DEA');
    }
  };

  const exportKitReportPDF = (kit: FirstAidKit, downloadOnly: boolean = false) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(5, 150, 105);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('PLANILLA DE INSPECCIÓN DE BOTIQUÍN DE PRIMEROS AUXILIOS', 14, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Cumplimiento Ley 19.587 / Dec. 351/79 Anexo VII - Medicina del Trabajo', 14, 19);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Establecimiento: ${activeCompany ? `${activeCompany.name} (CUIT: ${activeCompany.cuit})` : 'Establecimiento Principal'}`, 14, 34);
      doc.text(`Fecha de Inspección: ${kit.lastInspectionDate}`, 140, 34);

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Parámetro del Botiquín', 'Detalle']],
        body: [
          ['Código Identificador', kit.code],
          ['Ubicación en Planta', kit.location],
          ['Tipo de Botiquín', kit.type === 'type_a_small' ? 'Tipo A (Vehículo / hasta 10 personas)' : kit.type === 'type_b_medium' ? 'Tipo B (Taller / hasta 50 personas)' : 'Tipo C (Industrial >50 personas)'],
          ['Auditor / Inspector', kit.inspectorName],
          ['Estado General de Contenido', kit.status === 'complete' ? 'COMPLETO Y VIGENTE' : kit.status.toUpperCase()]
        ],
        styles: { fontSize: 8, cellPadding: 2 }
      });

      const nextY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalle de Insumos Auditados en el Botiquín:', 14, nextY);

      const itemRows = (kit.items || []).map((it, idx) => [
        (idx + 1).toString(),
        it.name,
        it.requiredQty.toString(),
        it.currentQty.toString(),
        it.unit,
        it.currentQty >= it.requiredQty ? 'CONFORME' : 'REPONER'
      ]);

      autoTable(doc, {
        startY: nextY + 3,
        theme: 'grid',
        head: [['#', 'Insumo Reglamentario', 'Cant. Exigida', 'Cant. Actual', 'Unidad', 'Evaluación']],
        body: itemRows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [5, 150, 105] }
      });

      const currentY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(8);
      doc.text('________________________________________', 25, currentY);
      doc.text('Firma Auditor / Servicio HyS', 25, currentY + 5);

      doc.text('________________________________________', 125, currentY);
      doc.text('Firma Encargado de Sector / Planta', 125, currentY + 5);

      const fileName = `Inspeccion_Botiquin_${kit.code}.pdf`;

      if (downloadOnly) {
        doc.save(fileName);
        toast.success('Reporte de botiquín descargado');
      } else {
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
        toast.success('Abriendo diálogo de impresión...');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al generar PDF de botiquín');
    }
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Primeros Auxilios, Botiquines y DEA"
          subtitle="Espacios cardioprotegidos bajo Ley Nacional 27.159, inspección de botiquines y registro de atenciones menores"
          badge="Ley Nac. 27.159 & Dec. 351/79"
          icon={<HeartPulse size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/')}
        />

        {/* 4 Tarjetas KPI interactivas estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setActiveTab('aed')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'aed'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total DEAs</span>
              <HeartPulse size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalAeds}</div>
            <span className="text-[11px] text-slate-500">Desfibriladores Ley 27.159</span>
          </div>

          <div
            onClick={() => setActiveTab('aed')}
            className="p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400"
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">DEAs Operativos</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.operationalAeds}</div>
            <span className="text-[11px] text-slate-500">Listos para emergencia</span>
          </div>

          <div
            onClick={() => setActiveTab('kits')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'kits'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Botiquines</span>
              <Cross size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalKits}</div>
            <span className="text-[11px] text-slate-500">Estaciones Dec. 351/79</span>
          </div>

          <div
            onClick={() => setActiveTab('injuries')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'injuries'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Atenciones Menores</span>
              <Activity size={20} />
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{metrics.totalInjuries}</div>
            <span className="text-[11px] text-slate-500">Registros de curaciones</span>
          </div>
        </div>

        {/* Toolbar de Búsqueda y Botones estilo Aptitudes Médicas */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-row items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs h-[38px]">
              <Search
                size={16}
                className="text-slate-400 pointer-events-none z-10"
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: 0,
                  bottom: 0,
                  marginTop: 'auto',
                  marginBottom: 'auto',
                  display: 'block'
                }}
              />
              <input
                type="text"
                placeholder={
                  activeTab === 'aed'
                    ? 'Buscar por código, lugar, serie o marca...'
                    : activeTab === 'kits'
                    ? 'Buscar por código, lugar o auditor...'
                    : 'Buscar por trabajador, área o tratamiento...'
                }
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Exportar CSV */}
              <button
                type="button"
                onClick={exportToCsv}
                title="Exportar listado actual a archivo CSV"
                style={{
                  backgroundColor: '#0284c7',
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
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                  minHeight: 'unset'
                }}
              >
                <FileSpreadsheet size={14} />
                <span>Exportar CSV</span>
              </button>

              {/* Botón Nuevo Registro */}
              {activeTab === 'aed' && (
                <button
                  type="button"
                  onClick={() => setShowAedModal(true)}
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
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                    minHeight: 'unset'
                  }}
                >
                  <Plus size={14} />
                  <span>Registrar DEA</span>
                </button>
              )}

              {activeTab === 'kits' && (
                <button
                  type="button"
                  onClick={() => setShowKitModal(true)}
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
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                    minHeight: 'unset'
                  }}
                >
                  <Plus size={14} />
                  <span>Registrar Botiquín</span>
                </button>
              )}

              {activeTab === 'injuries' && (
                <button
                  type="button"
                  onClick={() => setShowInjuryModal(true)}
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
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                    minHeight: 'unset'
                  }}
                >
                  <Plus size={14} />
                  <span>Registrar Atención</span>
                </button>
              )}
            </div>
          </div>

          {/* Pastillas de filtro estilo Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setActiveTab('aed')}
              style={{
                backgroundColor: activeTab === 'aed' ? '#e11d48' : '#ffffff',
                color: activeTab === 'aed' ? '#ffffff' : '#334155',
                border: activeTab === 'aed' ? 'none' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                minHeight: 'unset'
              }}
            >
              <HeartPulse size={14} />
              <span>Desfibriladores DEA ({aeds.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('kits')}
              style={{
                backgroundColor: activeTab === 'kits' ? '#059669' : '#ffffff',
                color: activeTab === 'kits' ? '#ffffff' : '#334155',
                border: activeTab === 'kits' ? 'none' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                minHeight: 'unset'
              }}
            >
              <Cross size={14} />
              <span>Control de Botiquines ({kits.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('injuries')}
              style={{
                backgroundColor: activeTab === 'injuries' ? '#2563eb' : '#ffffff',
                color: activeTab === 'injuries' ? '#ffffff' : '#334155',
                border: activeTab === 'injuries' ? 'none' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                minHeight: 'unset'
              }}
            >
              <Activity size={14} />
              <span>Libro de Atenciones Menores ({injuries.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DESFIBRILADORES DEA */}
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
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                            <HeartPulse size={22} />
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.code}</h4>
                            <span className="text-xs text-slate-500">{item.brandModel}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                          {item.status === 'operational' ? 'OPERATIVO' : item.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Battery size={14} className="text-emerald-600 shrink-0" />
                          <span>Batería: <strong>{item.batteryLevelPercent}%</strong> (Vence: {item.batteryExpiryDate})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          <span>Vto. Parches: <strong>{item.padsAdultExpiryDate}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">Custodio: {item.responsiblePerson}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Test: {item.lastTestDate}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {/* Imprimir PDF */}
                        <button
                          type="button"
                          onClick={() => exportAEDReportPDF(item, false)}
                          title="Imprimir Constancia Oficial DEA"
                          style={{
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            minHeight: 'unset'
                          }}
                        >
                          <FileText size={12} />
                          <span>PDF</span>
                        </button>

                        {/* Ver Detalle */}
                        <button
                          type="button"
                          onClick={() => setViewDetail({ type: 'aed', data: item })}
                          title="Ver Ficha Técnica del DEA"
                          style={{
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            minHeight: 'unset'
                          }}
                        >
                          <Eye size={12} />
                          <span>Ver</span>
                        </button>

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'aed', id: item.id })}
                          title="Eliminar DEA"
                          style={{
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            minHeight: 'unset'
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BOTIQUINES */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredKits.map(kit => (
                  <div key={kit.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                          <Cross size={20} />
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{kit.code}</h4>
                          <span className="text-xs text-slate-500">{kit.location}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {kit.status === 'complete' ? 'COMPLETO' : kit.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                      <span>Insumos Reglamentarios Auditados:</span>
                      <span className="text-slate-400 text-[11px]">Tipo: {kit.type === 'type_b_medium' ? 'Tipo B' : kit.type === 'type_a_small' ? 'Tipo A' : 'Tipo C'}</span>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {kit.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 dark:bg-slate-750 rounded">
                          <span className="text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-xs">{it.name}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] shrink-0">
                            {it.currentQty} / {it.requiredQty} {it.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                      <span className="text-slate-500 text-[11px]">
                        Auditor: {kit.inspectorName} ({kit.lastInspectionDate})
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Imprimir PDF */}
                        <button
                          type="button"
                          onClick={() => exportKitReportPDF(kit, false)}
                          title="Imprimir Planilla de Inspección"
                          style={{
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            minHeight: 'unset'
                          }}
                        >
                          <FileText size={12} />
                          <span>PDF</span>
                        </button>

                        {/* Ver Detalle */}
                        <button
                          type="button"
                          onClick={() => setViewDetail({ type: 'kit', data: kit })}
                          title="Ver Detalle Completo del Botiquín"
                          style={{
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            minHeight: 'unset'
                          }}
                        >
                          <Eye size={12} />
                          <span>Ver</span>
                        </button>

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'kit', id: kit.id })}
                          title="Eliminar Botiquín"
                          style={{
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            minHeight: 'unset'
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ATENCIONES MENORES */}
        {activeTab === 'injuries' && (
          <div className="mt-6">
            {filteredInjuries.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
                <EmptyStateIllustrated
                  title="No hay atenciones menores registradas aún"
                  description="Lleva el libro formal de curaciones leves, insumos aplicados y retorno laboral inmediato de los operarios."
                  actionLabel="Registrar Atención Menor"
                  onAction={() => setShowInjuryModal(true)}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="py-3 px-4">Fecha y Hora</th>
                        <th className="py-3 px-4">Trabajador</th>
                        <th className="py-3 px-4">Sector</th>
                        <th className="py-3 px-4">Tipo de Lesión</th>
                        <th className="py-3 px-4">Tratamiento e Insumos</th>
                        <th className="py-3 px-4">Resultado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                      {filteredInjuries.map(inj => (
                        <tr key={inj.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                          <td className="py-3 px-4 whitespace-nowrap">{inj.date} {inj.time} hs</td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                            {inj.workerName}
                            {inj.workerCuil && <div className="text-[10px] text-slate-400 font-normal">CUIL: {inj.workerCuil}</div>}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">{inj.area}</td>
                          <td className="py-3 px-4 whitespace-nowrap capitalize">{inj.injuryType.replace(/_/g, ' ')}</td>
                          <td className="py-3 px-4 max-w-xs truncate">{inj.treatmentDescription}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inj.outcome === 'returned_to_work'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {inj.outcome === 'returned_to_work' ? 'Reincorporado' : 'Derivado a ART'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Ver */}
                              <button
                                type="button"
                                onClick={() => setViewDetail({ type: 'injury', data: inj })}
                                title="Ver Detalle de Atención"
                                style={{
                                  backgroundColor: '#2563eb',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  minHeight: 'unset'
                                }}
                              >
                                <Eye size={12} />
                                <span>Ver</span>
                              </button>

                              {/* Eliminar */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ type: 'injury', id: inj.id })}
                                title="Eliminar Registro"
                                style={{
                                  backgroundColor: '#dc2626',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  minHeight: 'unset'
                                }}
                              >
                                <Trash2 size={12} />
                                <span>Eliminar</span>
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
      </div>

      {/* MODAL VER DETALLE */}
      {viewDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                {viewDetail.type === 'aed' && <HeartPulse className="text-rose-500" size={22} />}
                {viewDetail.type === 'kit' && <Cross className="text-emerald-500" size={22} />}
                {viewDetail.type === 'injury' && <Activity className="text-blue-500" size={22} />}
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  {viewDetail.type === 'aed' ? `Desfibrilador: ${viewDetail.data.code}` : viewDetail.type === 'kit' ? `Botiquín: ${viewDetail.data.code}` : `Atención: ${viewDetail.data.workerName}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {viewDetail.type === 'aed' && (
              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-750 rounded-xl">
                  <div><strong>Marca / Modelo:</strong> {viewDetail.data.brandModel}</div>
                  <div><strong>N° de Serie:</strong> {viewDetail.data.serialNumber}</div>
                  <div><strong>Ubicación:</strong> {viewDetail.data.location}</div>
                  <div><strong>Estado:</strong> {viewDetail.data.status.toUpperCase()}</div>
                  <div><strong>Batería:</strong> {viewDetail.data.batteryLevelPercent}% (Vence: {viewDetail.data.batteryExpiryDate})</div>
                  <div><strong>Parches Adulto:</strong> {viewDetail.data.padsAdultExpiryDate}</div>
                  <div><strong>Último Test:</strong> {viewDetail.data.lastTestDate}</div>
                  <div><strong>Responsable:</strong> {viewDetail.data.responsiblePerson}</div>
                </div>
                {viewDetail.data.notes && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl">
                    <strong>Notas:</strong> {viewDetail.data.notes}
                  </div>
                )}
              </div>
            )}

            {viewDetail.type === 'kit' && (
              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl space-y-1">
                  <div><strong>Ubicación:</strong> {viewDetail.data.location}</div>
                  <div><strong>Tipo:</strong> {viewDetail.data.type}</div>
                  <div><strong>Auditor:</strong> {viewDetail.data.inspectorName}</div>
                  <div><strong>Última Inspección:</strong> {viewDetail.data.lastInspectionDate}</div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Insumos y Stock Registrado:</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {(viewDetail.data.items || []).map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-750 rounded text-[11px]">
                        <span>{it.name}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{it.currentQty} / {it.requiredQty} {it.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {viewDetail.type === 'injury' && (
              <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-750 rounded-xl">
                  <div><strong>Trabajador:</strong> {viewDetail.data.workerName}</div>
                  <div><strong>CUIL:</strong> {viewDetail.data.workerCuil || 'No informado'}</div>
                  <div><strong>Fecha y Hora:</strong> {viewDetail.data.date} {viewDetail.data.time} hs</div>
                  <div><strong>Sector:</strong> {viewDetail.data.area}</div>
                  <div><strong>Tipo de Lesión:</strong> {viewDetail.data.injuryType}</div>
                  <div><strong>Resolución:</strong> {viewDetail.data.outcome === 'returned_to_work' ? 'Reincorporado' : 'Derivado a ART'}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl">
                  <strong>Tratamiento Aplicado:</strong>
                  <p className="mt-1">{viewDetail.data.treatmentDescription}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl">
                  <strong>Insumos Utilizados:</strong>
                  <p className="mt-1">{viewDetail.data.itemsUsed}</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setViewDetail(null)}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
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
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <HeartPulse className="text-rose-500" size={20} />
              Registrar Desfibrilador (DEA)
            </h3>
            <form onSubmit={handleSaveAed} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Código Identificador</label>
                <input
                  type="text"
                  value={newAed.code}
                  onChange={e => setNewAed({ ...newAed, code: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Ubicación Precisa</label>
                <input
                  type="text"
                  value={newAed.location}
                  onChange={e => setNewAed({ ...newAed, location: e.target.value })}
                  placeholder="Ej. Comedor Central frente a molinetes"
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
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
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">N° de Serie</label>
                  <input
                    type="text"
                    value={newAed.serialNumber}
                    onChange={e => setNewAed({ ...newAed, serialNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
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
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Vto. Parches Adulto</label>
                  <input
                    type="date"
                    value={newAed.padsAdultExpiryDate}
                    onChange={e => setNewAed({ ...newAed, padsAdultExpiryDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Responsable Custodio</label>
                <input
                  type="text"
                  value={newAed.responsiblePerson}
                  onChange={e => setNewAed({ ...newAed, responsiblePerson: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAedModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
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
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl">
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
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={newKit.location}
                  onChange={e => setNewKit({ ...newKit, location: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tipo de Botiquín</label>
                <select
                  value={newKit.type}
                  onChange={e => setNewKit({ ...newKit, type: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                >
                  <option value="type_a_small">Tipo A (Vehículo / hasta 10 pers)</option>
                  <option value="type_b_medium">Tipo B (Taller / hasta 50 pers)</option>
                  <option value="type_c_industrial">Tipo C (Planta Industrial &gt;50 pers)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Auditor / Inspector</label>
                <input
                  type="text"
                  value={newKit.inspectorName}
                  onChange={e => setNewKit({ ...newKit, inspectorName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowKitModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
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
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              Registro de Atención Menor
            </h3>
            <form onSubmit={handleSaveInjury} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={newInjury.date}
                    onChange={e => setNewInjury({ ...newInjury, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Hora</label>
                  <input
                    type="time"
                    value={newInjury.time}
                    onChange={e => setNewInjury({ ...newInjury, time: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
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
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Sector / Área</label>
                  <input
                    type="text"
                    value={newInjury.area}
                    onChange={e => setNewInjury({ ...newInjury, area: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tipo de Lesión Menor</label>
                <select
                  value={newInjury.injuryType}
                  onChange={e => setNewInjury({ ...newInjury, injuryType: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                >
                  <option value="corte_superficial">Corte Superficial / Herida Leve</option>
                  <option value="raspon_escoriacion">Raspón / Escoriación</option>
                  <option value="cuerpo_extrano_ocular">Cuerpo Extraño en Ojo (Lavado)</option>
                  <option value="quemadura_menor">Quemadura Grado 1 (Superficial)</option>
                  <option value="contusion_leve">Contusión Leve / Golpe</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tratamiento e Insumos Utilizados</label>
                <textarea
                  rows={2}
                  value={newInjury.treatmentDescription}
                  onChange={e => setNewInjury({ ...newInjury, treatmentDescription: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Resolución</label>
                <select
                  value={newInjury.outcome}
                  onChange={e => setNewInjury({ ...newInjury, outcome: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                >
                  <option value="returned_to_work">Reincorporado inmediatamente al puesto</option>
                  <option value="referred_to_art_clinic">Derivado preventivamente a clínica de ART</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInjuryModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Guardar Atención
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
