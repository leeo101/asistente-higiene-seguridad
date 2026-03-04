import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Moon, Sun, Smartphone, Bell, Shield,
    Info, ChevronRight, Download, Upload, Database,
    CheckCircle, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Keys that form the user's data backup
const BACKUP_KEYS = [
    'personalData', 'signatureStampData',
    'ats_history', 'fireload_history', 'inspections_history',
    'risk_matrix_history', 'reports_history', 'tool_checklists_history',
    'lighting_history', 'work_permits_history', 'ai_advisor_history',
    'safety_events', 'subscriptionStatus', 'theme',
];

export default function AppSettings() {
    const navigate = useNavigate();
    const [theme, setTheme] = useState('dark');
    const [backupSize, setBackupSize] = useState('');
    const importRef = useRef(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        // Calc backup size estimate
        let bytes = 0;
        BACKUP_KEYS.forEach(k => { bytes += (localStorage.getItem(k) || '').length; });
        if (bytes < 1024) setBackupSize(`${bytes} B`);
        else if (bytes < 1024 * 1024) setBackupSize(`${(bytes / 1024).toFixed(1)} KB`);
        else setBackupSize(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
    }, []);

    const toggleTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleExport = () => {
        const backup = { version: 2, exportedAt: new Date().toISOString(), data: {} };
        BACKUP_KEYS.forEach(k => {
            const val = localStorage.getItem(k);
            if (val !== null) {
                try { backup.data[k] = JSON.parse(val); }
                catch { backup.data[k] = val; }
            }
        });
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_asistente_hys_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Backup exportado correctamente');
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (!parsed.data) throw new Error('Formato inválido');
                let imported = 0;
                Object.entries(parsed.data).forEach(([k, v]) => {
                    if (BACKUP_KEYS.includes(k)) {
                        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
                        imported++;
                    }
                });
                toast.success(`✅ Backup importado (${imported} registros). Recargá la app para ver los cambios.`);
                // Apply theme immediately if present
                if (parsed.data.theme) toggleTheme(parsed.data.theme);
            } catch {
                toast.error('El archivo no es un backup válido de Asistente HYS.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Configuración</h1>
            </div>

            {/* Preferences */}
            <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Preferencias</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <Bell size={20} color="var(--color-text-muted)" />
                            <div>
                                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Notificaciones</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Alertas de inspecciones pendientes</p>
                            </div>
                        </div>
                        <input type="checkbox" defaultChecked style={{ width: 'auto', margin: 0 }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <Smartphone size={20} color="var(--color-text-muted)" />
                            <div>
                                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Modo Offline</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sincronizar datos al recuperar señal</p>
                            </div>
                        </div>
                        <input type="checkbox" defaultChecked style={{ width: 'auto', margin: 0 }} />
                    </div>

                    {/* Theme toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            {theme === 'dark' ? <Moon size={20} color="var(--color-text-muted)" /> : <Sun size={20} color="var(--color-text-muted)" />}
                            <div>
                                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Tema de la app</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Modo {theme === 'dark' ? 'oscuro' : 'claro'} activo</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['light', 'dark'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => toggleTheme(t)}
                                    style={{
                                        padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer',
                                        border: theme === t ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        background: theme === t ? 'rgba(59,130,246,0.1)' : 'transparent',
                                        color: theme === t ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        fontWeight: theme === t ? 700 : 500, fontSize: '0.78rem'
                                    }}
                                >
                                    {t === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BACKUP & RESTORE --- */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.4rem' }}>
                    <Database size={20} color="var(--color-primary)" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Backup de Datos</h3>
                </div>
                <p style={{ margin: '0 0 1.2rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Exportá todos tus registros, historiales y configuración en un archivo JSON. Podés reimportarlo en cualquier dispositivo.
                </p>

                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleExport}
                        style={{
                            flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            padding: '0.85rem', borderRadius: '12px',
                            background: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
                            color: 'white', border: 'none', cursor: 'pointer',
                            fontWeight: 800, fontSize: '0.88rem',
                            boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                            transition: 'transform 0.15s, box-shadow 0.15s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
                    >
                        <Download size={18} /> Exportar Backup
                    </button>

                    <button
                        onClick={() => importRef.current?.click()}
                        style={{
                            flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            padding: '0.85rem', borderRadius: '12px',
                            background: 'transparent', color: 'var(--color-primary)',
                            border: '1.5px solid var(--color-primary)', cursor: 'pointer',
                            fontWeight: 800, fontSize: '0.88rem', transition: 'background 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <Upload size={18} /> Importar Backup
                    </button>
                </div>

                <input ref={importRef} type="file" accept=".json" hidden onChange={handleImport} />

                {backupSize && (
                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.04)', borderRadius: '8px' }}>
                        <CheckCircle size={13} color="#10b981" />
                        Datos locales: <strong>{backupSize}</strong> almacenados · {BACKUP_KEYS.filter(k => localStorage.getItem(k)).length} claves encontradas
                    </div>
                )}

                <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.73rem', color: 'var(--color-text-muted)', padding: '0.6rem 0.8rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px' }}>
                    <AlertTriangle size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
                    Importar un backup reemplaza los datos actuales del dispositivo. Asegurate de exportar primero si querés conservarlos.
                </div>
            </div>

            {/* Privacy */}
            <div
                onClick={() => navigate('/security')}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem', borderRadius: '12px',
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer', marginTop: '1rem'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Shield size={20} color="var(--color-primary)" />
                    <span style={{ fontWeight: 700 }}>Privacidad y Seguridad</span>
                </div>
                <ChevronRight size={18} color="var(--color-text-muted)" />
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    <Info size={14} /> Versión 1.3.0 (Build 20260304)
                </div>
            </div>
        </div>
    );
}
