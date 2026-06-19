import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    ArrowLeft, Moon, Sun, Smartphone, Bell,
    Shield, Info, ChevronRight, Cloud, RefreshCw,
    CheckCircle, Lock, Download, Upload, TriangleAlert
} from 'lucide-react';
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
        BACKUP_KEYS.forEach(k => {
            const val = localStorage.getItem(k);
            if (val !== null) { try { backup.data[k] = JSON.parse(val); } catch { backup.data[k] = val; } }
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
        <div className="container animate-fade-in" style={{ maxWidth: '600px', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <></>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Configuración</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Personalización y sincronización</p>
                </div>
            </div>

            {/* ── CLOUD SYNC PANEL ── */}
            <div style={{ 
                marginBottom: '1.5rem',
                background: currentUser ? 'rgba(16, 185, 129, 0.05)' : 'rgba(var(--color-surface-rgb), 0.5)',
                backdropFilter: 'blur(12px)',
                border: currentUser ? '1px solid rgba(16,185,129,0.25)' : '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: currentUser ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Cloud size={26} color={currentUser ? '#10b981' : 'var(--color-text-secondary)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>
                            {currentUser ? 'Tus datos están en la nube ☁️' : 'Sincronización en la nube'}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                            {currentUser
                                ? lastSync
                                    ? `Última sincronización: ${lastSync.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
                                    : 'Sincronización automática activa'
                                : 'Iniciá sesión para guardar tus datos automáticamente'}
                        </div>
                    </div>
                    {currentUser && (
                        <CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} />
                    )}
                </div>

                {currentUser ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                        {/* What is stored */}
                        <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: '10px', padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                            🔒 Se guardan automáticamente: <strong>ATS, Checklists, Informes, Matriz de Riesgos, Asesor IA, Calendarios, Permisos</strong> y tu perfil. Sin que tengas que hacer nada.
                        </div>

                        <button
                            onClick={handleManualSync}
                            disabled={manualSyncing || syncing}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                padding: '0.8rem', borderRadius: '12px',
                                background: (manualSyncing || syncing) ? 'rgba(16,185,129,0.1)' : 'linear-gradient(135deg,#059669,#10b981)',
                                color: (manualSyncing || syncing) ? '#10b981' : 'white',
                                border: (manualSyncing || syncing) ? '1.5px solid rgba(16,185,129,0.3)' : 'none',
                                cursor: (manualSyncing || syncing) ? 'default' : 'pointer',
                                fontWeight: 800, fontSize: '0.9rem',
                                boxShadow: (manualSyncing || syncing) ? 'none' : '0 4px 14px rgba(16,185,129,0.3)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <RefreshCw size={17} style={{ animation: (manualSyncing || syncing) ? 'spin 1s linear infinite' : 'none' }} />
                            {(manualSyncing || syncing) ? 'Sincronizando...' : 'Sincronizar ahora'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                            padding: '0.8rem', borderRadius: '12px', width: '100%',
                            background: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
                            color: '#ffffff', border: 'none', cursor: 'pointer',
                            fontWeight: 800, fontSize: '0.9rem',
                            boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
                        }}
                    >
                        <Lock size={16} /> Iniciar sesión para activar la nube
                    </button>
                )}

                {/* Advanced toggle */}
                {currentUser && (
                    <button
                        onClick={() => setShowAdvanced(v => !v)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.5rem', padding: '0.2rem 0', textDecoration: 'underline', textAlign: 'left' }}
                    >
                        {showAdvanced ? 'Ocultar opciones avanzadas' : 'Opciones avanzadas (exportar archivo)'}
                    </button>
                )}

                {showAdvanced && (
                    <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleExport}
                            style={{ flex: 1, minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem', borderRadius: '10px', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                        >
                            <Download size={15} /> Exportar JSON
                        </button>
                        <button
                            onClick={() => importRef.current?.click()}
                            style={{ flex: 1, minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem', borderRadius: '10px', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                        >
                            <Upload size={15} /> Importar JSON
                        </button>
                        <input ref={importRef} type="file" accept=".json" hidden onChange={handleImport} />
                        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', padding: '0.5rem 0.7rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px' }}>
                            <TriangleAlert size={12} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
                            Importar reemplaza los datos actuales del dispositivo.
                        </div>
                    </div>
                )}
            </div>

            {/* ── PREFERENCIAS ── */}
            <div style={{ 
                marginBottom: '1.5rem',
                background: 'rgba(var(--color-surface-rgb), 0.5)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '1.5rem'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.2rem', fontSize: '1.05rem', fontWeight: 900 }}>Preferencias</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {[{ icon: <Bell size={20} />, title: 'Notificaciones', desc: 'Alertas de inspecciones pendientes' },
                      { icon: <Smartphone size={20} />, title: 'Modo Offline', desc: 'Sincronizar datos al recuperar señal' }
                    ].map(({ icon, title, desc }, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div style={{ color: 'var(--color-text-secondary)', display: 'flex' }}>{icon}</div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{title}</p>
                                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{desc}</p>
                                </div>
                            </div>
                            <input type="checkbox" defaultChecked style={{ width: 'auto', margin: 0, accentColor: 'var(--color-primary)', transform: 'scale(1.2)', cursor: 'pointer' }} />
                        </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ color: 'var(--color-text-secondary)', display: 'flex' }}>
                                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Tema</p>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Modo {theme === 'dark' ? 'oscuro' : 'claro'} activo</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['light', 'dark'].map(t => (
                                <button key={t} onClick={() => toggleTheme(t)} style={{ padding: '0.5rem 0.8rem', borderRadius: '10px', cursor: 'pointer', border: theme === t ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: theme === t ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-background)', color: theme === t ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: theme === t ? 800 : 600, fontSize: '0.82rem', transition: 'all 0.2s' }}>
                                    {t === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SEGURIDAD ── */}
            <div
                onClick={() => navigate('/security')}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.1rem 1.5rem', borderRadius: '16px',
                    background: 'rgba(56, 189, 248, 0.06)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    cursor: 'pointer', marginTop: '1rem',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.06)';
                    e.currentTarget.style.transform = 'none';
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Shield size={22} color="var(--color-primary)" />
                    <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Privacidad y Seguridad</span>
                </div>
                <ChevronRight size={20} color="var(--color-text-secondary)" />
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem', padding: '0.8rem', color: 'var(--color-text-secondary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Info size={14} /> Versión 1.3.0
            </div>
        </div>
    );
}
