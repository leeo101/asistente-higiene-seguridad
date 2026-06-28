import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Camera, Calendar, Building2, Share2, Info, FileText, QrCode, Download, BarChart2, TriangleAlert, ShieldAlert } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import ShareModal from '../components/ShareModal';
import AiReportPdfGenerator from '../components/AiReportPdfGenerator';
import PremiumHeader from '../components/PremiumHeader';

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar registro?"
      message="Esta acción no se puede deshacer."
      iconEmoji="🗑️" />);


}

export default function AIGeneralCameraManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const { syncCollection, syncPulse } = useSync();
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);
  const [shareItem, setShareItem] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const raw = localStorage.getItem('ai_camera_history');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const valid = parsed.filter((item) => {
        if (!item || !item.id) return false;
        if (!item.date) return false;
        if (item.type !== 'general_risks') return false; // Solo Riesgos Generales
        return true;
      });
      setHistory(valid);
    } catch {
      setHistory([]);
    }
  }, [syncPulse]);

  const confirmDelete = () => {
    const raw = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');
    const updated = raw.filter((item) => item.id !== deleteTarget);

    localStorage.setItem('ai_camera_history', JSON.stringify(updated));
    localStorage.removeItem(`ai_report_full_${deleteTarget}`);
    syncCollection('ai_camera_history', updated);

    setHistory(history.filter((item) => item.id !== deleteTarget));
    setDeleteTarget(null);
    toast.success("Análisis eliminado");
  };

  const filtered = history.filter((item) =>
  item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const total = history.length;
  const hasRisks = history.filter((i) => (i.findingsCount || 0) > 0).length;
  const compliance = total > 0 ? Math.round(((total - hasRisks) / total) * 100) : 100;

  const handleExportCSV = () => {
    downloadCSV(filtered.map((i) => ({
      empresa: i.company, ubicacion: i.location,
      fecha: i.date ? new Date(i.date).toLocaleDateString('es-AR') : '',
      hallazgos: i.findingsCount || 0
    })), 'camara_riesgos_historial', {
      empresa: 'Empresa', ubicacion: 'Ubicación', fecha: 'Fecha', hallazgos: 'Hallazgos IA'
    });
  };

  return (
    <div className="container max-w-[900px] pb-[5rem]">
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
            {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

            <ShareModal
        isOpen={!!shareItem && !document.body.classList.contains('printing-isolated')}
        open={!!shareItem && !document.body.classList.contains('printing-isolated')}
        onClose={() => setShareItem(null)}
        title={`Análisis de Riesgos IA - ${shareItem?.company || ''}`}
        text={shareItem ? `📸 Análisis de Entorno con IA\n🏗️ Empresa: ${shareItem.company || 'Local'}\n⚠️ Riesgos detectados: ${shareItem.findingsCount || 0}` : ''}
        rawMessage={shareItem ? `📸 Análisis de Entorno con IA\n🏗️ Empresa: ${shareItem.company || 'Local'}\n⚠️ Riesgos detectados: ${shareItem.findingsCount || 0}` : ''}
        elementIdToPrint="pdf-content"
        fileName={`Riesgos_IA_${shareItem?.company || 'Sin_Nombre'}.pdf`} />
      

            {typeof document !== 'undefined' && createPortal(
        <div className="ats-pdf-offscreen">
                    {shareItem && <AiReportPdfGenerator item={shareItem} />}
                </div>,
        document.body
      )}

            <PremiumHeader
        title="Riesgos IA"
        subtitle="Análisis de entorno y hallazgos"
        icon={<ShieldAlert size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
      

            <div className="flex gap-[1rem] mb-[1.5rem] mt-[1.5rem] flex-wrap">
                <></>
            </div>

            <div className="flex items-center justify-space-between gap-[1rem] mt-[1.5rem] mb-[2rem] flex-wrap relative z-[10]">
                

                <div className="flex gap-[1rem] flex-wrap">
                    <Link
            to="/ai-general-camera" className="flex items-center gap-[0.8rem] p-[0.8rem_1.5rem] bg-[linear-gradient(135deg,_#36B37E_0%,_#2A9365_100%)] text-[#020617] border-none rounded-[12px] font-[800] text-[0.95rem] cursor-pointer box-shadow-[0_4px_15px_rgba(54,_179,_126,_0.4)] text-decoration-[none]">
                        <Camera size={20} className="pointer-events-none text-[#020617]" /> NUEVA DETECCIÓN
                    </Link>
                    {history.length > 0 &&
          <button type="button" onClick={handleExportCSV} className="flex items-center gap-[0.8rem] p-[0.8rem_1.5rem] bg-[linear-gradient(135deg,_#6366f1_0%,_#4f46e5_100%)] text-[white] border-none rounded-[12px] font-[800] text-[0.95rem] cursor-pointer box-shadow-[0_4px_15px_rgba(99,102,241,0.4)]">



            
                            <Download size={20} className="pointer-events-none" /> EXPORTAR CSV
                        </button>
          }
                </div>
            </div>

            {total > 0 &&
      <div className="mb-8">
                    <div className="grid grid-cols-3 gap-[0.7rem] mb-[1rem]">
                        <div className="bg-[rgba(6,182,212,0.08)] border-[1px_solid_rgba(6,182,212,0.2)] rounded-[12px] p-[0.8rem] text-center">
                            <div className="text-[1.5rem] font-[900] text-[#06b6d4]">{total}</div>
                            <div className="text-[0.65rem] text-[var(--color-text-muted)] font-[700]">ESCANEO RIESGOS</div>
                        </div>
                        <div className="bg-[rgba(16,185,129,0.08)] border-[1px_solid_rgba(16,185,129,0.2)] rounded-[12px] p-[0.8rem] text-center">
                            <div className="text-[1.5rem] font-[900] text-[#10b981]">{compliance}%</div>
                            <div className="text-[0.65rem] text-[var(--color-text-muted)] font-[700]">COMPLIANCE</div>
                        </div>
                        <div style={{ background: hasRisks > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${hasRisks > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }} className="rounded-[12px] p-[0.8rem] text-center">
                            <div style={{ color: hasRisks > 0 ? '#ef4444' : '#10b981' }} className="text-[1.5rem] font-[900]">{hasRisks}</div>
                            <div className="text-[0.65rem] text-[var(--color-text-muted)] font-[700]">RIESGOS</div>
                        </div>
                    </div>
                </div>
      }

            <div className="relative mb-[1.5rem]">
                <Search size={18} className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] text-[var(--color-text-muted)]" />
                <input
          type="text"
          placeholder="Buscar por empresa o ubicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[1rem_1rem_1rem_2.8rem] rounded-[16px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[0.95rem]" />





        
            </div>

            <div className="flex flex-col gap-4">
                {filtered.length > 0 ?
        filtered.map((item) =>
        <div key={item.id} className="card p-[1.5rem] rounded-[16px]">
                            <div className="flex justify-space-between items-start mb-[1rem] flex-wrap gap-[1rem]">
                                <div className="flex items-center gap-[1rem] flex-[1] min-width-[0]">
                                    <div className="w-[48px] h-[48px] bg-[rgba(59,130,246,0.1)] rounded-[12px] flex items-center justify-center text-[#3b82f6]">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h3 className="m-[0] text-[1.1rem] font-[800] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">{item.company || 'Empresa sin nombre'}</h3>
                                        <div className="flex items-center gap-[0.4rem] text-[0.85rem] text-[var(--color-text-muted)] mt-[0.3rem]">
                                            <Calendar size={14} /> {new Date(item.date).toLocaleDateString('es-AR')} — <Building2 size={14} /> {item.location}
                                        </div>
                                    </div>
                                </div>
                                <div style={{



              background: item.findingsCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              color: item.findingsCount > 0 ? '#ef4444' : '#10b981'

            }} className="flex items-center gap-[0.4rem] text-[0.8rem] font-[800] p-[0.4rem_0.8rem] rounded-[100px] flex-shrink-[0]">
                                    <Info size={16} />
                                    {item.findingsCount > 0 ? `${item.findingsCount} Hallazgos` : 'Limpio'}
                                </div>
                            </div>

                            <div className="flex gap-[0.8rem] mt-[1.5rem] border-top-[1px_solid_var(--color-border)] pt-[1.5rem] flex-wrap">
                                <button
              onClick={() => {
                const fullReportKey = `ai_report_full_${item.id}`;
                const savedFull = localStorage.getItem(fullReportKey);
                const reportToLoad = savedFull ? JSON.parse(savedFull) : item;
                localStorage.setItem('current_ai_inspection', JSON.stringify(reportToLoad));
                navigate('/ai-report');
              }}
              className="btn-primary flex-[2] p-[0.8rem] text-[0.9rem] flex items-center gap-[0.4rem] justify-center rounded-[12px]">

              
                                    <FileText size={18} /> Ver Reporte Completo
                                </button>
                                <button
              onClick={() => {
                const fullReportKey = `ai_report_full_${item.id}`;
                const savedFull = localStorage.getItem(fullReportKey);
                const reportToLoad = savedFull ? JSON.parse(savedFull) : item;
                setShareItem(reportToLoad);
              }}

              title="Compartir Reporte" className="flex-[1] p-[0.8rem] bg-[#dcfce7] border-[1px_solid_#86efac] rounded-[12px] text-[#16a34a] flex items-center justify-center text-decoration-[none] font-[800]">
              
                                    <Share2 size={18} /> <span className="ml-[0.3rem]">Compartir</span>
                                </button>
                                <button
              onClick={() => {
                const url = `${window.location.origin}/v/${currentUser?.uid}/camera/${item.id}?print=true`;
                setQrTarget({ text: url, title: `Análisis de Entorno — ${item.company || 'IA'}` });
              }}

              title="Generar QR" className="p-[0.8rem] bg-[rgba(139,92,246,0.06)] border-[1px_solid_rgba(139,92,246,0.18)] rounded-[12px] text-[#8b5cf6] cursor-pointer flex items-center justify-center">
              
                                    <QrCode size={18} />
                        </button>
                                <button
              onClick={() => setDeleteTarget(item.id)} className="p-[0.8rem] bg-[rgba(239,68,68,0.05)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[12px] text-[#ef4444] cursor-pointer flex items-center justify-center">

              
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
        ) :

        <div className="text-center p-[4rem_1rem] text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-[16px] border-[1px_dashed_var(--color-border)]">
                        <ShieldAlert size={48} className="opacity-[0.2] mb-[1rem]" />
                        <h3 className="m-[0_0_0.5rem] font-[800] text-[var(--color-text)]">No hay análisis de riesgos</h3>
                        <p>No se registraron análisis de entorno con IA todavía.</p>
                    </div>
        }
            </div>
        </div>);

}