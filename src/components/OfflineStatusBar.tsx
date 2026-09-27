import React, { useState } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, CloudUpload, X } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import { processSyncQueue } from '../services/cloudSync';
import toast from 'react-hot-toast';

export default function OfflineStatusBar(): React.ReactElement | null {
  const { isOnline, pendingCount, syncing } = useSync();
  const { currentUser } = useAuth();
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If online and no pending changes, don't show anything
  if (isOnline && pendingCount === 0) return null;
  if (isDismissed && isOnline) return null;

  const handleManualSync = async () => {
    if (!currentUser) return;
    if (!isOnline) {
      toast.error('No hay conexión a internet disponible en este momento');
      return;
    }

    setIsManualSyncing(true);
    const toastId = toast.loading('Sincronizando cambios con la nube...');
    try {
      await processSyncQueue(currentUser.uid);
      toast.success('¡Todos los datos han sido sincronizados correctamente! ☁️', { id: toastId });
    } catch (e) {
      console.error('Error during manual sync:', e);
      toast.error('Hubo un error al sincronizar. Se reintentará automáticamente.', { id: toastId });
    } finally {
      setIsManualSyncing(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300"
    >
      <div
        className={`p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center justify-between gap-3 text-xs ${
          !isOnline
            ? 'bg-amber-950/90 text-amber-200 border-amber-600/50 shadow-amber-950/40'
            : 'bg-blue-950/90 text-blue-200 border-blue-600/50 shadow-blue-950/40'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              !isOnline ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {!isOnline ? (
              <WifiOff size={18} className="animate-pulse" />
            ) : (
              <CloudUpload size={18} className={isManualSyncing || syncing ? 'animate-bounce' : ''} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-xs">
                {!isOnline ? 'Modo Fuera de Línea' : 'Sincronización Pendiente'}
              </span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-white/10 text-white">
                  {pendingCount} en cola
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 m-0 mt-0.5 truncate">
              {!isOnline
                ? 'Tus mediciones se guardan en el dispositivo'
                : 'Conexión lista. Puedes sincronizar ahora.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOnline && pendingCount > 0 && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isManualSyncing || syncing}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer border-none shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={12} className={isManualSyncing || syncing ? 'animate-spin' : ''} />
              Subir
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
            aria-label="Ocultar aviso"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
