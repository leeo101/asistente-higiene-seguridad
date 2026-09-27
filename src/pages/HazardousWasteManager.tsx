import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Plus, Search, Calendar, FileText, Download,
  Trash2, AlertTriangle, CheckCircle2, Clock, Truck, ShieldAlert
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import { HazardousWasteRecord, HAZARDOUS_Y_STREAMS } from '../data/hazardousWasteData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function HazardousWasteManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const [records, setRecords] = useState<HazardousWasteRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('hazardous_waste_db');
    if (raw) {
      try {
        setRecords(JSON.parse(raw));
      } catch (e) {
        console.error('Error loading waste records', e);
      }
    }
  }, []);

  const filteredRecords = records.filter(r => {
    if (activeCompany && r.companyId && r.companyId !== activeCompany.id) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.currentY.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.generatorArea.toLowerCase().includes(q) ||
        (r.manifestNumber && r.manifestNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Métricas
  const totalKgStored = filteredRecords
    .filter(r => r.status === 'stored')
    .reduce((sum, r) => sum + (r.quantityKg || 0), 0);

  const totalKgDisposed = filteredRecords
    .filter(r => r.status === 'disposed')
    .reduce((sum, r) => sum + (r.quantityKg || 0), 0);

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = records.filter(r => r.id !== deleteId);
    setRecords(updated);
    localStorage.setItem('hazardous_waste_db', JSON.stringify(updated));
    setDeleteId(null);
    toast.success('Registro de residuo eliminado');
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 118, 110);
      doc.rect(0, 0, 210, 26, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('LIBRO DE REGISTRO DE GENERACIÓN DE RESIDUOS PELIGROSOS', 14, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Ley Nacional 24.051 / Ley Prov. 11.720 - Registro y Manifiestos de Trazabilidad', 14, 19);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Generador: ${activeCompany ? `${activeCompany.name} (CUIT: ${activeCompany.cuit})` : 'Establecimiento Industrial'}`, 14, 34);
      doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`, 150, 34);

      const tableData = filteredRecords.map(r => [
        r.entryDate,
        r.currentY,
        r.description,
        `${r.quantityKg} kg`,
        r.physicalState.toUpperCase(),
        r.generatorArea,
        r.status === 'stored' ? 'ACOPIADO' : r.status === 'in_transit' ? 'EN TRANSPORTE' : 'DISPUESTO',
        r.manifestNumber || 'S/D',
        r.disposalCertificateNumber || 'Pendiente'
      ]);

      autoTable(doc, {
        startY: 38,
        theme: 'grid',
        head: [['Fecha', 'Corriente', 'Descripción Residuo', 'Cant (kg)', 'Estado', 'Sector', 'Condición', 'Manifiesto', 'Cert. Disp.']],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [15, 118, 110] }
      });

      const currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(8);
      doc.text('________________________________________', 25, currentY);
      doc.text('Firma y Aclaración Responsable Ambiental / HyS', 25, currentY + 5);

      doc.text('________________________________________', 125, currentY);
      doc.text('Firma y Sello Representante Legal de la Empresa', 125, currentY + 5);

      doc.save(`Libro_Residuos_Peligrosos_${Date.now()}.pdf`);
      toast.success('Libro de residuos exportado en PDF');
    } catch (e) {
      console.error(e);
      toast.error('Error al generar PDF');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
      <PremiumHeader
        title="Gestión de Residuos Peligrosos y Especiales"
        subtitle="Control de acopio transitorio, Manifiestos de transporte y Certificados de Disposición Final bajo Ley 24.051"
        badge="Ley Nac. 24.051 / 11.720"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">En Acopio Transitorio</span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totalKgStored.toLocaleString()} kg</p>
              <span className="text-[11px] text-slate-400">Límite legal: &lt; 1 año de acopio</span>
            </div>
            <span className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
              <Clock size={24} />
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Total Tratado / Dispuesto</span>
              <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{totalKgDisposed.toLocaleString()} kg</p>
              <span className="text-[11px] text-slate-400">Con certificado ambiental oficial</span>
            </div>
            <span className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-xl">
              <CheckCircle2 size={24} />
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Partidas Registradas</span>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{filteredRecords.length}</p>
              <span className="text-[11px] text-slate-400">Historial completo auditable</span>
            </div>
            <span className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 rounded-xl">
              <FileText size={24} />
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por corriente (Y8, Y9...), descripción, sector..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="all">Todos los Estados</option>
              <option value="stored">En Acopio</option>
              <option value="in_transit">En Transporte</option>
              <option value="disposed">Tratado / Finalizado</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportPDF}
              disabled={filteredRecords.length === 0}
              className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={16} /> Exportar Libro PDF
            </button>
            <button
              onClick={() => navigate('/hazardous-waste/new')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
            >
              <Plus size={18} />
              <span>Registrar Generación / Despacho</span>
            </button>
          </div>
        </div>

        {/* Records Table */}
        {filteredRecords.length === 0 ? (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
            <EmptyStateIllustrated
              title="No hay registros de residuos peligrosos"
              description="Registra una nueva generación de residuos para llevar el libro digital con corrientes Y, acopio transitorio, manifiestos y certificados."
              actionLabel="Nuevo Registro de Residuo"
              onAction={() => navigate('/hazardous-waste/new')}
            />
          </div>
        ) : (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Corriente Y / Riesgo</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4">Cantidad</th>
                    <th className="py-3 px-4">Sector Generador</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Trazabilidad Manifiesto</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredRecords.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">{item.entryDate}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded mr-1">
                          {item.currentY}
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {item.hazardR}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">{item.description}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                        {item.quantityKg} kg
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {item.containerQuantity} x {item.containerType}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.generatorArea}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.status === 'stored'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : item.status === 'in_transit'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {item.status === 'stored' ? 'En Acopio' : item.status === 'in_transit' ? 'En Transporte' : 'Tratado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {item.manifestNumber ? (
                          <div>
                            <span className="font-mono text-slate-700 dark:text-slate-300">N° {item.manifestNumber}</span>
                            <span className="block text-[10px] text-slate-400">Tr: {item.transporterName || 'Asignado'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin despacho aún</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setDeleteId(item.id)}
                          title="Eliminar partida"
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Eliminar Registro de Residuo"
        message="¿Estás seguro de que deseas eliminar este registro de residuo peligroso? Se quitará del libro oficial."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
