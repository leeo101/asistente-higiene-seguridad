import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft, Moon, Sun, Smartphone, Bell,
  Shield, Info, ChevronRight, Cloud, RefreshCw,
  CheckCircle, Lock, Download, Upload, TriangleAlert } from
'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { pushAllToCloud, pullAllFromCloud, SYNC_COLLECTIONS, SYNC_DOCUMENTS } from '../services/cloudSync';

const BACKUP_KEYS = [...SYNC_COLLECTIONS, ...SYNC_DOCUMENTS];

export default function AppSettings(): React.ReactElement | null {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncing, lastSync } = useSync();
  const [theme, setTheme] = useState('dark');
  const [manualSyncing, setManualSyncing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const importRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleManualSync = async () => {
    if (!currentUser) {
      toast.error('Iniciá sesión para sincronizar tus datos en la nube.');
      return;
    }
    setManualSyncing(true);
    try {
      await pushAllToCloud(currentUser.uid);
      await pullAllFromCloud(currentUser.uid);
      toast.success('✅ Datos sincronizados correctamente con la nube.');
    } catch {
      toast.error('Error al sincronizar. Verificá tu conexión a internet.');
    } finally {
      setManualSyncing(false);
    }
  };

  // Advanced: JSON export
  const handleExport = () => {
    const backup = { version: 2, exportedAt: new Date().toISOString(), data: {} };
    BACKUP_KEYS.forEach((k) => {
      const val = localStorage.getItem(k);
      if (val !== null) {try {backup.data[k] = JSON.parse(val);} catch {backup.data[k] = val;}}
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_hys_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exportado');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target!.result as string);
        if (!parsed.data) throw new Error('Formato inválido');
        let imported = 0;
        Object.entries(parsed.data).forEach(([k, v]) => {
          if (BACKUP_KEYS.includes(k)) {
            localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
            imported++;
          }
        });
        toast.success(`Backup importado (${imported} registros). Recargá la app.`);
      } catch {
        toast.error('El archivo no es un backup válido de Asistente HYS.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="container animate-fade-in max-w-[600px] pb-[4rem]">
            <div className="flex items-center gap-[1rem] mb-[2rem]">
                <></>
                <div>
                    <h1 className="m-[0] text-[1.6rem] font-[900] letter-spacing-[-0.5px]">Configuración</h1>
                    <p className="m-[0] text-[0.85rem] text-[var(--color-text-secondary)]">Personalización y sincronización</p>
                </div>
            </div>

            {/* ── CLOUD SYNC PANEL ── */}
            <div style={{

        background: currentUser ? 'rgba(16, 185, 129, 0.05)' : 'rgba(var(--color-surface-rgb), 0.5)',

        border: currentUser ? '1px solid rgba(16,185,129,0.25)' : '1px solid var(--glass-border)'


      }} className="mb-[1.5rem] backdrop-filter-[blur(12px)] rounded-[20px] p-[1.5rem]">
                <div className="flex items-center gap-[1rem] mb-[1.2rem]">
                    <div style={{ background: currentUser ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.1)' }} className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center flex-shrink-[0]">
                        <Cloud size={26} color={currentUser ? '#10b981' : 'var(--color-text-secondary)'} />
                    </div>
                    <div className="flex-[1]">
                        <div className="font-[900] text-[1.05rem]">
                            {currentUser ? 'Tus datos están en la nube ☁️' : 'Sincronización en la nube'}
                        </div>
                        <div className="text-[0.82rem] text-[var(--color-text-secondary)] mt-[0.15rem]">
                            {currentUser ?
              lastSync ?
              `Última sincronización: ${lastSync.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` :
              'Sincronización automática activa' :
              'Iniciá sesión para guardar tus datos automáticamente'}
                        </div>
                    </div>
                    {currentUser &&
          <CheckCircle size={22} color="#10b981" className="flex-shrink-[0]" />
          }
                </div>

                {currentUser ?
        <div className="flex flex-col gap-[0.7rem]">
                        {/* What is stored */}
                        <div className="bg-[rgba(0,0,0,0.04)] rounded-[10px] p-[0.8rem_1rem] text-[0.8rem] text-[var(--color-text-muted)] line-height-[1.6]">
                            🔒 Se guardan automáticamente: <strong>ATS, Checklists, Informes, Matriz de Riesgos, Asesor IA, Calendarios, Permisos</strong> y tu perfil. Sin que tengas que hacer nada.
                        </div>

                        <button
            onClick={handleManualSync}
            disabled={manualSyncing || syncing}
            style={{


              background: manualSyncing || syncing ? 'rgba(16,185,129,0.1)' : 'linear-gradient(135deg,#059669,#10b981)',
              color: manualSyncing || syncing ? '#10b981' : 'white',
              border: manualSyncing || syncing ? '1.5px solid rgba(16,185,129,0.3)' : 'none',
              cursor: manualSyncing || syncing ? 'default' : 'pointer',

              boxShadow: manualSyncing || syncing ? 'none' : '0 4px 14px rgba(16,185,129,0.3)'

            }} className="flex items-center justify-center gap-[0.6rem] p-[0.8rem] rounded-[12px] font-[800] text-[0.9rem] transition-[all_0.2s]">
            
                            <RefreshCw size={17} style={{ animation: manualSyncing || syncing ? 'spin 1s linear infinite' : 'none' }} />
                            {manualSyncing || syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
                        </button>
                    </div> :

        <button
          onClick={() => navigate('/login')} className="flex items-center justify-center gap-[0.6rem] p-[0.8rem] rounded-[12px] w-[100%] bg-[linear-gradient(135deg,#1e3a8a,#2563eb)] text-[#ffffff] border-none cursor-pointer font-[800] text-[0.9rem] box-shadow-[0_4px_14px_rgba(37,99,235,0.3)]">








          
                        <Lock size={16} /> Iniciar sesión para activar la nube
                    </button>
        }

                {/* Advanced toggle */}
                {currentUser &&
        <button
          onClick={() => setShowAdvanced((v) => !v)} className="bg-[none] border-none text-[var(--color-text-muted)] text-[0.75rem] cursor-pointer mt-[0.5rem] p-[0.2rem_0] text-decoration-[underline] text-left">

          
                        {showAdvanced ? 'Ocultar opciones avanzadas' : 'Opciones avanzadas (exportar archivo)'}
                    </button>
        }

                {showAdvanced &&
        <div className="mt-[0.8rem] flex gap-[0.8rem] flex-wrap">
                        <button
            onClick={handleExport} className="flex-[1] min-width-[130px] flex items-center justify-center gap-[0.5rem] p-[0.65rem] rounded-[10px] bg-[transparent] text-[var(--color-text-muted)] border-[1px_solid_var(--color-border)] cursor-pointer font-[700] text-[0.8rem]">

            
                            <Download size={15} /> Exportar JSON
                        </button>
                        <button
            onClick={() => importRef.current?.click()} className="flex-[1] min-width-[130px] flex items-center justify-center gap-[0.5rem] p-[0.65rem] rounded-[10px] bg-[transparent] text-[var(--color-text-muted)] border-[1px_solid_var(--color-border)] cursor-pointer font-[700] text-[0.8rem]">

            
                            <Upload size={15} /> Importar JSON
                        </button>
                        <input ref={importRef} type="file" accept=".json" hidden onChange={handleImport} />
                        <div className="w-[100%] flex items-start gap-[0.4rem] text-[0.7rem] text-[var(--color-text-muted)] p-[0.5rem_0.7rem] bg-[rgba(245,158,11,0.06)] border-[1px_solid_rgba(245,158,11,0.2)] rounded-[8px]">
                            <TriangleAlert size={12} color="#f59e0b" className="flex-shrink-[0] mt-[1px]" />
                            Importar reemplaza los datos actuales del dispositivo.
                        </div>
                    </div>
        }
            </div>

            {/* ── PREFERENCIAS ── */}
            <div className="mb-[1.5rem] bg-[rgba(var(--color-surface-rgb),_0.5)] backdrop-filter-[blur(12px)] border-[1px_solid_var(--glass-border)] rounded-[20px] p-[1.5rem]">






        
                <h3 className="mt-[0] mb-[1.2rem] text-[1.05rem] font-[900]">Preferencias</h3>
                <div className="flex flex-col gap-[0]">
                    {[{ icon: <Bell size={20} />, title: 'Notificaciones', desc: 'Alertas de inspecciones pendientes' },
          { icon: <Smartphone size={20} />, title: 'Modo Offline', desc: 'Sincronizar datos al recuperar señal' }].
          map(({ icon, title, desc }, idx) =>
          <div key={idx} className="flex justify-space-between items-center p-[1rem_0] border-bottom-[1px_solid_var(--color-border)]">
                            <div className="flex items-center gap-[0.8rem]">
                                <div className="text-[var(--color-text-secondary)] flex">{icon}</div>
                                <div>
                                    <p className="m-[0] text-[0.95rem] font-[700]">{title}</p>
                                    <p className="m-[0] text-[0.78rem] text-[var(--color-text-secondary)]">{desc}</p>
                                </div>
                            </div>
                            <input type="checkbox" defaultChecked className="w-[auto] m-[0] accent-color-[var(--color-primary)] transform-[scale(1.2)] cursor-pointer" />
                        </div>
          )}

                    <div className="flex justify-space-between items-center pt-[1rem]">
                        <div className="flex items-center gap-[0.8rem]">
                            <div className="text-[var(--color-text-secondary)] flex">
                                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            </div>
                            <div>
                                <p className="m-[0] text-[0.95rem] font-[700]">Tema</p>
                                <p className="m-[0] text-[0.78rem] text-[var(--color-text-secondary)]">Modo {theme === 'dark' ? 'oscuro' : 'claro'} activo</p>
                            </div>
                        </div>
                        <div className="flex gap-[0.5rem]">
                            {['light', 'dark'].map((t) =>
              <button key={t} onClick={() => toggleTheme(t)} style={{ border: theme === t ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: theme === t ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-background)', color: theme === t ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: theme === t ? 800 : 600 }} className="p-[0.5rem_0.8rem] rounded-[10px] cursor-pointer text-[0.82rem] transition-[all_0.2s]">
                                    {t === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
                                </button>
              )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SEGURIDAD ── */}
            <div
        onClick={() => navigate('/security')}








        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
          e.currentTarget.style.transform = 'translateX(4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(56, 189, 248, 0.06)';
          e.currentTarget.style.transform = 'none';
        }} className="flex items-center justify-space-between p-[1.1rem_1.5rem] rounded-[16px] bg-[rgba(56,_189,_248,_0.06)] border-[1px_solid_rgba(56,_189,_248,_0.2)] cursor-pointer mt-[1rem] transition-[all_0.2s]">
        
                <div className="flex items-center gap-[0.8rem]">
                    <Shield size={22} color="var(--color-primary)" />
                    <span className="font-[800] text-[1.05rem]">Privacidad y Seguridad</span>
                </div>
                <ChevronRight size={20} color="var(--color-text-secondary)" />
            </div>

            <div className="text-center mt-[2rem] p-[0.8rem] text-[var(--color-text-secondary)] text-[0.82rem] flex items-center justify-center gap-[0.4rem]">
                <Info size={14} /> Versión 1.3.0
            </div>
        </div>);

}