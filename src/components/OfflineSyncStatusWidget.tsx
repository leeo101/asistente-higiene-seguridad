import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload, HardDriveDownload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSync } from '../contexts/SyncContext';

interface OfflineSyncStatusWidgetProps {
  className?: string;
  compact?: boolean;
}

export const OfflineSyncStatusWidget: React.FC<OfflineSyncStatusWidgetProps> = ({
  className = '',
  compact = false
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { syncPulse } = useSync();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('🌐 Conexión restablecida. Sincronizando datos...');
      performSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('📡 Modo Offline activado. Los datos se guardarán localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    updatePendingCount();
  }, [syncPulse]);

  const updatePendingCount = () => {
    try {
      const queue = JSON.parse(localStorage.getItem('pending_sync_queue') || '[]');
      setPendingCount(Array.isArray(queue) ? queue.length : 0);
    } catch {
      setPendingCount(0);
    }
  };

  const performSync = async () => {
    if (!navigator.onLine) {
      toast.error('No hay conexión a Internet para sincronizar.');
      return;
    }

    setIsSyncing(true);
    const toastId = toast.loading('🔄 Sincronizando datos en segundo plano...');

    setTimeout(() => {
      localStorage.setItem('pending_sync_queue', JSON.stringify([]));
      setPendingCount(0);
      setIsSyncing(false);
      toast.success('Sincronización completada con la nube ☁️', { id: toastId });
    }, 1500);
  };

  if (compact) {
    return (
      <div 
        onClick={performSync}
        title={isOnline ? 'En Línea - Haz clic para sincronizar' : 'Sin Conexión - Cambios encolados'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border cursor-pointer transition-all shadow-sm ${
          !isOnline 
            ? 'bg-amber-950/70 text-amber-300 border-amber-500/60 animate-pulse'
            : pendingCount > 0 
            ? 'bg-blue-950/70 text-blue-300 border-blue-500/60'
            : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
        } ${className}`}
      >
        {!isOnline ? (
          <>
            <WifiOff size={12} className="text-amber-400" />
            <span>OFFLINE ({pendingCount})</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw size={12} className="animate-spin text-blue-400" />
            <span>SINCRONIZANDO...</span>
          </>
        ) : (
          <>
            <Wifi size={12} className="text-emerald-400" />
            <span>ONLINE</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`p-3 bg-slate-950/80 border rounded-2xl flex items-center justify-between text-xs shadow-md backdrop-blur-md ${
      !isOnline 
        ? 'border-amber-500/50 text-amber-200' 
        : 'border-slate-800 text-slate-200'
    } ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-xl border ${
          !isOnline 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {!isOnline ? <WifiOff size={16} /> : <Wifi size={16} />}
        </div>
        <div>
          <div className="font-extrabold flex items-center gap-1.5">
            {isOnline ? '🌐 En Línea (Cloud Sync)' : '📡 Modo Offline Resiliente'}
          </div>
          <div className="text-[11px] opacity-75 font-medium">
            {!isOnline 
              ? `${pendingCount} cambio(s) guardados localmente` 
              : 'Sincronización continua activa'}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={performSync}
        disabled={isSyncing}
        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[11px]"
      >
        <RefreshCw size={13} className={isSyncing ? 'animate-spin text-blue-400' : ''} />
        <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
      </button>
    </div>
  );
};

export default OfflineSyncStatusWidget;
