import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardText, Trash, FileText, Calendar, Buildings, Share2, DownloadSimple, QrCode } from '@phosphor-icons/react';
import { downloadCSV } from '../services/exportCsv';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import ChecklistPdfGenerator from '../components/ChecklistPdfGenerator';
import { usePaywall } from '../hooks/usePaywall';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';

function DeleteConfirm({ onConfirm, onCancel }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '2rem', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900 }}>¿Eliminar checklist?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800 }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#fff' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

const getChecklistStatus = (id) => {
    const stored = localStorage.getItem(`checklist_${id}`);
    if (!stored) return { label: 'Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    try {
        const parsed = JSON.parse(stored);
        const items = parsed.items || parsed.checks || parsed || [];
        const arr = Array.isArray(items) ? items : Object.values(items);
        const nok = arr.filter((c: any) => c.value === 'NO' || c.estado === 'NO' || c.checked === false || c.result === 'no').length;
        const obs = arr.filter((c: any) => c.observation || c.observacion).length;
        if (arr.length === 0) return { label: 'Vacío', color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
        if (nok > 0) return { label: 'Rechazado', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
        if (obs > 0) return { label: 'Con Obs.', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
        return { label: 'Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    } catch {
        return { label: 'Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    }
};

export default function ChecklistsHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const [history, setHistory] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const historyRaw = localStorage.getItem('tool_checklists_history');
        if (historyRaw) setHistory(JSON.parse(historyRaw));
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('tool_checklists_history', JSON.stringify(updated));
        syncCollection('tool_checklists_history', updated);
        localStorage.removeItem(`checklist_${deleteTarget}`);
        setDeleteTarget(null);
    };

    const handleExportCSV = () => {
        requirePro(() => downloadCSV(history.map(i => {
            const st = getChecklistStatus(i.id);
            return { fecha: new Date(i.fecha).toLocaleDateString('es-AR'), equipo: i.equipo, marca: i.marca, serial: i.serial, empresa: i.empresa, estado: st.label };
        }), 'checklists_herramientas', { fecha: 'Fecha', equipo: 'Equipo', marca: 'Marca', serial: 'Número Serie', empresa: 'Empresa', estado: 'Estado' }, 'Reporte de Checklists'));
    };

    const columns = [
        {
            header: 'Fecha',
            accessor: 'fecha',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} /> {new Date(item.fecha).toLocaleDateString('es-AR')}
                </span>
            )
        },
        {
            header: 'Equipo',
            accessor: 'equipo',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#3b82f6' }}>
                        <ClipboardText size={16} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700 }}>{item.equipo || 'Sin nombre'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>#{item.serial}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Empresa',
            accessor: 'empresa',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Buildings size={14} /> {item.empresa}
                </span>
            )
        },
        {
            header: 'Estado',
            accessor: 'id',
            render: (item: any) => {
                const st = getChecklistStatus(item.id);
                return (
                    <span style={{ background: st.bg, color: st.color, padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                        {st.label}
                    </span>
                );
            }
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => navigate(`/checklists?id=${item.id}`)} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={15} /> Ver</button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/checklist/${item.id}?print=true`; setQrTarget({ text: url, title: `Checklist — ${item.equipo}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container" style={{ maxWidth: '900px', paddingBottom: '5rem' }}>
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Checklist - ${shareItem?.equipo || ''}`} text={shareItem ? `📋 Checklist de Seguridad\n🔧 Equipo: ${shareItem.equipo}\n🏗️ Empresa: ${shareItem.empresa}\n📅 Fecha: ${new Date(shareItem.fecha).toLocaleDateString('es-AR')}` : ''} rawMessage={``} elementIdToPrint="pdf-content" fileName={`Checklist_${shareItem?.equipo || 'Reporte'}.pdf`} />
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    {shareItem && <ChecklistPdfGenerator checklistData={shareItem} isHeadless={true} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}><ArrowLeft size={22} /></button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Checklists</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Controles técnicos</p>
                        </div>
                    </div>
                    {history.length > 0 && (
                        <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff' }}>
                            <DownloadSimple size={14} /> EXCEL
                        </button>
                    )}
                </div>

                <DataTable
                    data={history}
                    columns={columns}
                    searchPlaceholder="Buscar por equipo, empresa o serial..."
                    searchFields={['equipo', 'empresa', 'serial', 'marca']}
                    emptyMessage="No se encontraron registros de Checklists."
                    emptyIcon={<ClipboardText size={48} />}
                    onEmptyAction={() => navigate('/checklists')}
                    emptyActionLabel="Realizar Control Nuevo"
                />

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
