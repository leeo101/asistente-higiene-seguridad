import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Warning, Calendar, MapPin, Trash, ShareNetwork as Share2, PencilSimple, ArrowLeft, FileText, QrCode, DownloadSimple } from '@phosphor-icons/react';
import { downloadCSV } from '../services/exportCsv';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePaywall } from '../hooks/usePaywall';
import AccidentPdfGenerator from '../components/AccidentPdfGenerator';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';

const severityConfig = {
  'Leve': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  'Moderado': { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  'Grave': { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  'Mortal': { color: '#dc2626', bg: 'rgba(220,38,38,0.14)' }
};

export default function AccidentHistory(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  useDocumentTitle('Historial de Accidentes');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncing, syncCollection } = useSync();
  const [history, setHistory] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const h = JSON.parse(localStorage.getItem('accident_history') || '[]');
    setHistory(h.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [syncing]);

  const confirmDelete = () => {
    const updated = history.filter((item) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('accident_history', JSON.stringify(updated));
    syncCollection('accident_history', updated);
    setDeleteTarget(null);
  };

  const handleExportCSV = () => {
    requirePro(() => downloadCSV(history.map((i) => ({
      victima: i.victimaNombre, empresa: i.empresa, fecha: i.date,
      lesion: i.lesionTipo || '', sector: i.sector || '', gravedad: i.gravedad || ''
    })), 'historial_accidentes', {
      victima: 'Víctima', empresa: 'Empresa', fecha: 'Fecha',
      lesion: 'Tipo de Lesión', sector: 'Sector/Área', gravedad: 'Gravedad'
    }));
  };

  if (selectedReport) {
    return <AccidentPdfGenerator report={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  const columns = [
  {
    header: 'Fecha',
    accessor: 'date',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)] white-space-[nowrap]">
                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString('es-AR')}
                </span>

  },
  {
    header: 'Accidentado',
    accessor: 'victimaNombre',
    sortable: true,
    render: (item: any) =>
    <div className="flex items-center gap-[0.8rem]">
                    <div className="bg-[rgba(239,68,68,0.1)] p-[0.5rem] rounded-[8px] text-[#ef4444]">
                        <Warning size={16} weight="fill" />
                    </div>
                    <span className="font-[700]">{item.victimaNombre}</span>
                </div>

  },
  {
    header: 'Empresa',
    accessor: 'empresa',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem]">
                    <MapPin size={14} /> {item.empresa}
                </span>

  },
  {
    header: 'Gravedad',
    accessor: 'gravedad',
    sortable: true,
    render: (item: any) => {
      const cfg = severityConfig[item.gravedad] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
      return (
        <span style={{ background: cfg.bg, color: cfg.color }} className="p-[0.25rem_0.7rem] rounded-[999px] text-[0.72rem] font-[800]">
                        {item.gravedad || '—'}
                    </span>);

    }
  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <div className="flex gap-[0.4rem]">
                    <button onClick={() => setSelectedReport(item)} className="p-[0.4rem_0.8rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[8px] cursor-pointer text-[0.75rem] font-[700] text-[var(--color-text)]">Ver</button>
                    <button onClick={() => navigate('/accident-investigation', { state: { editData: item } })} title="Editar" className="p-[0.4rem] bg-[rgba(59,130,246,0.08)] border-[1px_solid_rgba(59,130,246,0.2)] rounded-[8px] text-[#3b82f6] cursor-pointer"><PencilSimple size={15} /></button>
                    <button onClick={() => requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/accident/${item.id}?print=true`;setQrTarget({ text: url, title: `Accidente — ${item.victimaNombre}` });})} title="QR" className="p-[0.4rem] bg-[rgba(139,92,246,0.08)] border-[1px_solid_rgba(139,92,246,0.2)] rounded-[8px] text-[#8b5cf6] cursor-pointer"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} title="Compartir" className="p-[0.4rem] bg-[rgba(22,163,74,0.08)] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] text-[#16a34a] cursor-pointer"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} className="p-[0.4rem] bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[8px] text-[#ef4444] cursor-pointer"><Trash size={15} /></button>
                </div>

  }];


  return (
    <AnimatedPage>
            <div className="container pb-[3rem]">
                {deleteTarget &&
        <div className="fixed inset-[0] bg-[rgba(0,0,0,0.5)] z-[1000] flex items-center justify-center backdrop-filter-[blur(4px)]">
                        <div className="card max-w-[320px] text-center p-[2rem]">
                            <Trash size={48} className="text-[#ef4444] mb-[1rem]" />
                            <h3>¿Eliminar reporte?</h3>
                            <p className="text-[0.9rem] text-[var(--color-text-muted)]">Esta acción no se puede deshacer.</p>
                            <div className="flex gap-[1rem] mt-[1.5rem]">
                                <button onClick={() => setDeleteTarget(null)} className="flex-[1] p-[0.8rem] rounded-[12px] bg-[var(--color-background)] border-none cursor-pointer">Cancelar</button>
                                <button onClick={confirmDelete} className="flex-[1] p-[0.8rem] rounded-[12px] bg-[#ef4444] text-[white] border-none cursor-pointer">Eliminar</button>
                            </div>
                        </div>
                    </div>
        }
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Investigación de Accidente - ${shareItem?.victimaNombre || ''}`} text={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⚠️ Gravedad: ${shareItem.gravedad}` : ''} rawMessage={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}` : ''} elementIdToPrint="pdf-content" fileName={`Accidente_${shareItem?.victimaNombre || 'Reporte'}.pdf`} />
                <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                    {shareItem && <AccidentPdfGenerator report={shareItem} isHeadless={true} />}
                </div>

                <div className="flex items-center justify-space-between mb-[2rem] flex-wrap gap-[1rem]">
                    <div className="flex items-center gap-4">
                        <></>
                        <div>
                            <h1 className="m-[0] text-[clamp(1.1rem,_4vw,_1.4rem)] font-[800]">Investigaciones de Accidentes</h1>
                            <p className="m-[0] text-[0.75rem] text-[var(--color-text-muted)] font-[600]">Registros de siniestros</p>
                        </div>
                    </div>
                    {history.length > 0 &&
          <button onClick={handleExportCSV} className="flex items-center gap-[0.5rem] bg-[#36B37E] border-none rounded-[10px] p-[0.6rem_1rem] text-[0.8rem] font-[800] cursor-pointer text-[#ffffff]">
                            <DownloadSimple size={16} /> EXCEL
                        </button>
          }
                </div>

                <DataTable
          data={history}
          columns={columns}
          searchPlaceholder="Buscar por empleado, empresa o gravedad..."
          searchFields={['victimaNombre', 'empresa', 'gravedad', 'lesionTipo']}
          emptyMessage="No hay investigaciones registradas."
          emptyIcon={<FileText size={48} />}
          onEmptyAction={() => navigate('/accident-investigation')}
          emptyActionLabel="Registrar Accidente" />
        

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>);

}