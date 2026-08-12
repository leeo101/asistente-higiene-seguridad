import React, { useEffect, useState } from 'react';
import { QrCode, Smartphone, CheckCircle2, Copy, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface QRSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'operator' | 'professional' | 'supervisor';
  roleTitle: string;
  permitId: string | number;
  onSignatureReceived: (signatureData: string) => void;
}

export default function QRSignatureModal({
  isOpen,
  onClose,
  role,
  roleTitle,
  permitId,
  onSignatureReceived
}: QRSignatureModalProps): React.ReactElement | null {
  const [copied, setCopied] = useState(false);
  const [received, setReceived] = useState(false);

  const cleanPermitId = permitId || 'draft';
  const signingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/sign?permitId=${cleanPermitId}&role=${role}`
    : `https://asistentehs.web.app/sign?permitId=${cleanPermitId}&role=${role}`;

  useEffect(() => {
    if (!isOpen) {
      setReceived(false);
      return;
    }

    // 1. Escuchar eventos mediante BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('hys_signature_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.role === role && event.data.signature) {
          setReceived(true);
          onSignatureReceived(event.data.signature);
          toast.success(`¡Firma para ${roleTitle} recibida desde el celular!`);
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      };
    } catch {
      /* ignore */
    }

    // 2. Escuchar eventos de Storage Event (por si abren la URL en otra pestaña)
    const handleStorage = (e: StorageEvent) => {
      const storageKey = `mobile_sig_${cleanPermitId}_${role}`;
      if (e.key === storageKey && e.newValue) {
        setReceived(true);
        onSignatureReceived(e.newValue);
        toast.success(`¡Firma para ${roleTitle} recibida desde el celular!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Polling fallback por si se guarda en localStorage sin evento storage
    const interval = setInterval(() => {
      const storageKey = `mobile_sig_${cleanPermitId}_${role}`;
      const savedSig = localStorage.getItem(storageKey);
      if (savedSig && savedSig.length > 50) {
        setReceived(true);
        onSignatureReceived(savedSig);
        localStorage.removeItem(storageKey); // Consumir
        toast.success(`¡Firma para ${roleTitle} recibida desde el celular!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    }, 1500);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [isOpen, cleanPermitId, role, roleTitle, onSignatureReceived, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(signingUrl);
    setCopied(true);
    toast.success('Enlace de firma copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(signingUrl)}`;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 no-print animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl transition-all"
        >
          <X size={20} />
        </button>

        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Smartphone size={28} />
        </div>

        <div>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-[11px] font-black uppercase tracking-wider">
            Firma remota por celular
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 mb-1">
            Firma de {roleTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Escanea el código QR con la cámara del celular para firmar en vivo sin tocar la computadora.
          </p>
        </div>

        {received ? (
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl space-y-2">
            <CheckCircle2 size={42} className="text-emerald-600 mx-auto animate-bounce" />
            <div className="font-black text-sm text-emerald-900 dark:text-emerald-300">
              ¡FIRMADO CON ÉXITO!
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400">
              La firma se transfirió en tiempo real al documento.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-52 h-52 bg-white p-3 border-2 border-slate-200 dark:border-slate-700 rounded-2xl mx-auto shadow-md relative group">
              <img
                src={qrImageUrl}
                alt="Código QR para Firma Celular"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span>Esperando firma en vivo...</span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy size={15} /> {copied ? '¡COPIADO!' : 'COPIAR ENLACE'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                CERRAR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
