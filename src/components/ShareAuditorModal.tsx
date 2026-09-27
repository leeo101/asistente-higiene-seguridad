import React, { useState } from 'react';
import {
  ShieldCheck, X, Copy, QrCode, Share2, Check, Clock, Building2, ExternalLink
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import toast from 'react-hot-toast';

interface ShareAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareAuditorModal({
  isOpen,
  onClose
}: ShareAuditorModalProps): React.ReactElement | null {
  const { activeCompany } = useCompany();
  const [durationDays, setDurationDays] = useState<number>(30);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate or retrieve token
  const token = `aud_${activeCompany?.id || 'all'}_${Math.random().toString(36).substring(2, 10)}`;
  const shareUrl = `${window.location.origin}/auditor/${token}`;

  const handleCopyLink = () => {
    // Store token in localStorage
    const existing = JSON.parse(localStorage.getItem('hys_auditor_tokens') || '[]');
    const tokenObj = {
      token,
      companyId: activeCompany?.id || 'all',
      companyName: activeCompany?.name || 'Todas las Empresas',
      createdAt: new Date().toISOString(),
      expiresAt: durationDays > 0 ? new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString() : null
    };
    existing.push(tokenObj);
    localStorage.setItem('hys_auditor_tokens', JSON.stringify(existing));

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Enlace de auditoría copiado al portapapeles 📋');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    handleCopyLink();
    const msg = `Estimado auditor/cliente,\nComparto el acceso de solo lectura al Portal de Conformidad y Protocolos de Higiene y Seguridad Laboral (${activeCompany?.name || 'Establecimiento'}):\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white m-0">
                Generar Enlace para Auditor / Cliente
              </h3>
              <p className="text-xs text-slate-400 m-0 mt-0.5">
                Acceso seguro de solo lectura sin necesidad de login
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
              <Building2 size={15} className="text-blue-500" />
              <span>Empresa objetivo: {activeCompany ? activeCompany.name : 'Todas las empresas'}</span>
            </div>
            El auditor o comitente podrá visualizar y descargar protocolos de puesta a tierra, iluminación, checklists aprobados y constancias de entrega de EPP vigentes.
          </div>

          <div>
            <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1.5">
              Validez del Enlace
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { days: 7, label: '7 días' },
                { days: 30, label: '30 días' },
                { days: 90, label: '90 días' }
              ].map(opt => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setDurationDays(opt.days)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    durationDays === opt.days
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block mb-1.5">
              Enlace Seguro Generado
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 select-all outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer border-none shadow-xs transition-all active:scale-95 shrink-0"
                title="Copiar enlace"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => window.open(shareUrl, '_blank')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
            >
              <ExternalLink size={14} /> Abrir vista previa
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer border-none"
            >
              <Share2 size={15} /> Compartir por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
