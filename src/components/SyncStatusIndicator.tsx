import React, { useState } from 'react';
import { CloudCheck, CloudSlash, ArrowsClockwise, WifiHigh } from '@phosphor-icons/react';
import { useSync } from '../contexts/SyncContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function SyncStatusIndicator() {
  const { syncing, lastSync, isOnline, pendingCount } = useSync();
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative inline-flex items-center"
    >
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all shadow-sm ${
          !isOnline
            ? 'bg-rose-950/80 border-rose-600/60 text-rose-300'
            : syncing
            ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
            : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
        }`}
      >
        {!isOnline ? (
          <>
            <CloudSlash size={14} className="text-rose-400" />
            <span className="hidden sm:inline font-mono">{t('status.offline')}</span>
          </>
        ) : syncing ? (
          <>
            <ArrowsClockwise size={14} className="text-amber-400 animate-spin" />
            <span className="hidden sm:inline font-mono">{t('status.syncing')}</span>
          </>
        ) : (
          <>
            <CloudCheck size={14} className="text-emerald-400" />
            <span className="hidden sm:inline font-mono">{t('status.online')}</span>
          </>
        )}

        {pendingCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
            {pendingCount}
          </span>
        )}
      </div>

      {/* Popover on hover */}
      {isHovered && (
        <div className="absolute right-0 top-full mt-2 w-56 p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs text-slate-300 z-50 space-y-1.5 backdrop-blur-md">
          <div className="flex items-center justify-between font-bold text-white border-b border-slate-800 pb-1">
            <span>Sincronización Nube</span>
            <WifiHigh size={14} className={isOnline ? 'text-emerald-400' : 'text-rose-400'} />
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Estado Conexión:</span>
            <span className={isOnline ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {isOnline ? 'Conectado' : 'Sin señal (Offline)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">En Cola Offline:</span>
            <span className="font-mono text-amber-400">{pendingCount} registro(s)</span>
          </div>
          {lastSync && (
            <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
              <span>Última Sincro:</span>
              <span>{new Date(lastSync).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
