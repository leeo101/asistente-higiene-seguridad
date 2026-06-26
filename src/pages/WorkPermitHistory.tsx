import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Calendar, Buildings, ArrowLeft, Trash, ShareNetwork as Share2, Eye, QrCode, Plus, DownloadSimple } from '@phosphor-icons/react';
import ShareModal from '../components/ShareModal';
import WorkPermitPdfGenerator from '../components/WorkPermitPdfGenerator';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { permitTypes } from '../data/workPermits';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';

export default function WorkPermitHistory(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [qrTarget, setQrTarget] = useState(null);
  const [shareItem, setShareItem] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('work_permits_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleDelete = async (id) => {
    const toastId = toast(
      <div className="flex items-center gap-[0.8rem]">
                <span className="text-[0.9rem]">¿Eliminar este permiso?</span>
                <button onClick={async () => {
          toast.dismiss(toastId);
          const updated = history.filter((h) => h.id !== id);
          setHistory(updated);
          localStorage.setItem('work_permits_history', JSON.stringify(updated));
          await syncCollection('work_permits_history', updated);
          toast.success('Permiso eliminado');
        }} className="bg-[#ef4444] text-[#ffffff] border-none rounded-[8px] p-[0.3rem_0.7rem] cursor-pointer font-[800] text-[0.8rem]">

          Eliminar</button>
            </div>,
      { duration: 5000, icon: '🗑️' }
    );
  };

  const handleExportCSV = () => {
    downloadCSV(history.map((i) => ({
      id: i.id, fecha: i.fecha, empresa: i.empresa, obra: i.obra,
      tipo: permitTypes.find((t) => t.id === i.tipoPermiso)?.label || 'Permiso',
      desde: i.validezDesde, hasta: i.validezHasta
    })), 'permisos_de_trabajo', {
      id: 'ID Permiso', fecha: 'Fecha', empresa: 'Empresa', obra: 'Obra',
      tipo: 'Tipo de Tarea', desde: 'Hora Inicio', hasta: 'Hora Fin'
    }, 'Reporte de Permisos');
  };

  const columns = [
  {
    header: 'Fecha',
    accessor: 'fecha',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)] white-space-[nowrap]">
                    <Calendar size={14} /> {item.fecha}
                </span>

  },
  {
    header: 'Empresa',
    accessor: 'empresa',
    sortable: true,
    render: (item: any) =>
    <div className="flex items-center gap-[0.8rem]">
                    <div className="bg-[rgba(59,130,246,0.1)] p-[0.5rem] rounded-[8px] text-[#3b82f6]">
                        <Key size={16} />
                    </div>
                    <span className="font-[700]">{item.empresa}</span>
                </div>

  },
  {
    header: 'Obra',
    accessor: 'obra',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem]">
                    <Buildings size={14} /> {item.obra}
                </span>

  },
  {
    header: 'Tipo',
    accessor: 'tipoPermiso',
    sortable: true,
    render: (item: any) =>
    <span className="bg-[rgba(59,130,246,0.1)] text-[var(--color-primary)] p-[0.2rem_0.6rem] rounded-[6px] text-[0.7rem] font-[800] uppercase">
                    {permitTypes.find((t) => t.id === item.tipoPermiso)?.label || 'Permiso'}
                </span>

  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <div className="flex gap-[0.4rem]">
                    <button onClick={() => navigate('/work-permit', { state: { editData: item } })} title="Ver" className="p-[0.4rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[8px] text-[var(--color-text)] cursor-pointer"><Eye size={15} /></button>
                    <button onClick={() => requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/permit/${item.id}?print=true`;setQrTarget({ text: url, title: `Permiso — ${item.empresa}` });})} title="QR" className="p-[0.4rem] bg-[rgba(139,92,246,0.08)] border-[1px_solid_rgba(139,92,246,0.2)] rounded-[8px] text-[#8b5cf6] cursor-pointer"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} title="Compartir" className="p-[0.4rem] bg-[rgba(22,163,74,0.08)] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] text-[#16a34a] cursor-pointer"><Share2 size={15} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-[0.4rem] bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[8px] text-[#ef4444] cursor-pointer"><Trash size={15} /></button>
                </div>

  }];


  return (
    <AnimatedPage>
            <div className="container max-w-[900px] pb-[8rem]">
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Permiso de Trabajo - ${shareItem?.empresa || ''}`} text={shareItem ? `🔐 Permiso de Trabajo\n🏗️ Empresa: ${shareItem.empresa}\n🚧 Obra: ${shareItem.obra}\n📅 Fecha: ${shareItem.fecha}` : ''} rawMessage={``} elementIdToPrint="pdf-content" fileName={`Permiso_${shareItem?.empresa || 'Trabajo'}`} />
                <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                    {shareItem && <WorkPermitPdfGenerator data={shareItem} />}
                </div>

                <div className="flex items-center justify-space-between gap-[1rem] mb-[2rem] flex-wrap">
                    <div className="flex items-center gap-[0.8rem]">
                        <></>
                        <div>
                            <h1 className="m-[0] text-[clamp(1.1rem,_4vw,_1.4rem)] font-[800] line-height-[1.2]">Permisos de Trabajo</h1>
                            <p className="m-[0] text-[0.75rem] text-[var(--color-text-muted)] font-[600]">Tareas críticas</p>
                        </div>
                    </div>
                    <div className="flex gap-[0.5rem]">
                        {history.length > 0 &&
            <button onClick={() => requirePro(handleExportCSV)} className="flex items-center gap-[0.4rem] bg-[#36B37E] border-none rounded-[8px] p-[0.5rem_0.8rem] text-[0.75rem] font-[800] cursor-pointer text-[#ffffff]">
                                <DownloadSimple size={14} /> EXCEL
                            </button>
            }
                        <button onClick={() => navigate('/work-permit')} className="btn-primary p-[0.6rem_1rem] flex items-center gap-[0.5rem] text-[0.85rem] w-[auto] m-[0]">
                            <Plus size={18} /> NUEVO
                        </button>
                    </div>
                </div>

                <DataTable
          data={history}
          columns={columns}
          searchPlaceholder="Buscar por empresa, obra o tipo..."
          searchFields={['empresa', 'obra']}
          emptyMessage="No hay permisos registrados."
          emptyIcon={<Key size={48} />} />
        

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>);

}