import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Plus, Shield, ShieldAlert, Calendar, Trash2, Share2, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import RiskAssessmentPdfGenerator from '../components/RiskAssessmentPdfGenerator';
import { usePaywall } from '../hooks/usePaywall';
import { SkeletonList } from '../components/SkeletonLoader';

// ─── Reusable delete confirmation dialog ───────────────────────────
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

export default function RiskAssessmentHistory(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection, syncPulse } = useSync();
  const { currentUser } = useAuth();
  useDocumentTitle('Historial Evaluación de Riesgos');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);
  const [shareItem, setShareItem] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('risk_assessment_history');
    if (raw) {
      setData(JSON.parse(raw));
    }
    setLoading(false);
  }, [syncPulse]);

  const askDelete = (e, id) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    const current = JSON.parse(localStorage.getItem('risk_assessment_history') || '[]');
    const updated = current.filter((item) => String(item.id) !== String(deleteTarget));
    localStorage.setItem('risk_assessment_history', JSON.stringify(updated));
    syncCollection('risk_assessment_history', updated);
    setData(updated);
    setDeleteTarget(null);
  };

  const getRiskColor = (label) => {
    switch (label) {
      case 'Bajo':return '#10b981';
      case 'Moderado':return '#f59e0b';
      case 'Alto':return '#f97316';
      case 'Crítico':return '#ef4444';
      default:return 'var(--color-text-muted)';
    }
  };

  const getRiskBg = (label) => {
    switch (label) {
      case 'Bajo':return 'rgba(16, 185, 129, 0.1)';
      case 'Moderado':return 'rgba(245, 158, 11, 0.1)';
      case 'Alto':return 'rgba(249, 115, 22, 0.1)';
      case 'Crítico':return 'rgba(239, 68, 68, 0.1)';
      default:return 'var(--color-background)';
    }
  };

  return (
    <div className="container pb-[4rem]">
            {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

            <ShareModal
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`IPER - ${shareItem?.name || ''}`}
        text={shareItem ? `🛡️ Evaluación de Riesgo (IPER)\n📝 Tarea: ${shareItem.name}\n📍 Ubicación: ${shareItem.location || '-'}\n📅 Fecha: ${new Date(shareItem.date || shareItem.createdAt).toLocaleDateString('es-AR')}\n⚠️ Resultado: ${shareItem.score} (${shareItem.riskLabel})` : ''}
        elementIdToPrint="pdf-content" />
      

            <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                <RiskAssessmentPdfGenerator assessmentData={shareItem} />
            </div>

            <div className="flex items-center justify-space-between gap-[1rem] mb-[2rem] flex-wrap">
                <div className="flex items-center gap-[0.8rem] min-width-[200px]">
                    <></>
                    <div>
                        <h1 className="m-[0] text-[clamp(1.1rem,_4vw,_1.4rem)] font-[800] line-height-[1.2]">Evaluación de Riesgos</h1>
                        <p className="m-[0] text-[0.75rem] text-[var(--color-text-muted)] font-[600]">Historial IPER</p>
                    </div>
                </div>
                <button
          onClick={() => navigate('/risk')}
          className="btn-primary p-[0.6rem_1rem] flex items-center gap-[0.5rem] text-[0.85rem] w-[auto] m-[0] bg-[linear-gradient(135deg,_#ef4444,_#dc2626)] box-shadow-[0_4px_15px_rgba(239,_68,_68,_0.3)]">

          
                    <Plus size={18} /> <span className="hidden sm:inline">NUEV0</span>
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {loading ?
        <SkeletonList count={3} cardProps={{ hasAvatar: true, hasActions: true }} /> :
        data.length > 0 ? data.map((item) =>
        <div key={item.id} className="card flex items-center gap-4">
                        <div className="flex flex-col gap-[0.8rem] flex-[1]">
                            <div className="flex items-center gap-4">
                                <div className="bg-[rgba(239,68,68,0.1)] p-[0.8rem] rounded-[12px] text-[#ef4444]">
                                    <ShieldAlert />
                                </div>
                                <div className="flex-[1]">
                                    <h4 className="m-[0_0_0.3rem_0] font-[800]">{item.name}</h4>
                                    <div className="flex gap-[1rem] text-[0.8rem] text-[var(--color-text-muted)]">
                                        <span className="flex items-center gap-[0.3rem]">
                                            <Calendar size={14} /> {new Date(item.date || item.createdAt).toLocaleDateString('es-AR')}
                                        </span>
                                        {item.location && <span>📍 {item.location}</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div style={{



                  background: getRiskBg(item.riskLabel),
                  color: getRiskColor(item.riskLabel),



                  border: `1px solid ${getRiskColor(item.riskLabel)}40`
                }} className="inline-block p-[0.3rem_0.6rem] rounded-[8px] font-[800] text-[0.75rem] uppercase">
                                        Nivel {item.riskLabel} ({item.score})
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-[0.8rem] border-top-[1px_solid_var(--color-border)] pt-[0.8rem] flex-wrap">
                                <button
                onClick={() => navigate('/risk', { state: { editData: item } })}
                className="btn-secondary flex-[1] p-[0.6rem] text-[0.85rem] font-[700]">

                
                                    Editar Evaluación
                                </button>
                                <button
                onClick={() => requirePro(() => setShareItem(item))}













                title="Compartir Informe" className="p-[0.6rem_1rem] bg-[#dcfce7] border-[1px_solid_#86efac] rounded-[12px] text-[#16a34a] cursor-pointer flex items-center gap-[0.4rem] font-[800] text-[0.8rem]">
                
                                    <Share2 size={16} /> <span>WA</span>
                                </button>
                                <button
                onClick={() => {
                  requirePro(() => {
                    const url = `${window.location.origin}/v/${currentUser?.uid}/riskassessment/${item.id}?print=true`;
                    setQrTarget({ text: url, title: `IPER — ${item.name}` });
                  });
                }}

                title="Generar QR" className="p-[0.6rem] bg-[rgba(139,92,246,0.06)] border-[1px_solid_rgba(139,92,246,0.18)] rounded-[12px] text-[#8b5cf6] cursor-pointer flex items-center justify-center">
                
                                    <QrCode size={18} />
                                </button>
                                <button
                onClick={(e) => askDelete(e, item.id)}
                title="Eliminar"






                onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'} className="bg-[#fee2e2] border-none rounded-[12px] text-[#dc2626] cursor-pointer p-[0.6rem_0.8rem] flex items-center flex-shrink-[0] transition-[background_0.2s]">
                
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
        ) :
        <div className="text-center p-[3rem] text-[var(--color-text-muted)]">
                        <ShieldAlert size={48} className="opacity-[0.1] mb-[1rem]" />
                        <p className="m-[0_0_1.5rem] font-[600]">No hay evaluaciones de riesgo registradas</p>
                        <button onClick={() => navigate('/risk')} className="btn-primary m-[0_auto] bg-[linear-gradient(135deg,_#ef4444,_#dc2626)] border-none">Crear primera Evaluación</button>
                    </div>
        }
            </div>
            {qrTarget &&
      <QRModal
        text={qrTarget.text}
        title={qrTarget.title}
        onClose={() => setQrTarget(null)} />

      }
        </div>);

}