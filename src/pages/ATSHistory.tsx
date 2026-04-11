import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardText as ClipboardList, Calendar, Buildings, QrCode, ShareNetwork as Share2, Trash as Trash2, DownloadSimple } from '@phosphor-icons/react';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import ShareModal from '../components/ShareModal';
import ATSPdfGenerator from '../components/ATSPdfGenerator';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';

function DeleteConfirm({ onConfirm, onCancel }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '2rem', maxWidth: '360px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--color-text)' }}>¿Eliminar ATS?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)' }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function ATSHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    const { syncCollection, syncPulse } = useSync();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const [history, setHistory] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const historyRaw = localStorage.getItem('ats_history');
        if (historyRaw) setHistory(JSON.parse(historyRaw));
    }, [syncPulse]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('ats_history', JSON.stringify(updated));
        syncCollection('ats_history', updated);
        setDeleteTarget(null);
    };

    const handleExportCSV = () => {
        requirePro(() => {
            downloadCSV(history.map(i => ({
                empresa: i.empresa, obra: i.obra, fecha: i.fecha,
                responsable: i.capatazNombre || '', tarea: i.tarea || ''
            })), 'ats_historial', {
                empresa: 'Empresa', obra: 'Obra/Proyecto', fecha: 'Fecha',
                responsable: 'Responsable', tarea: 'Tarea'
            });
        });
    };

    const columns = [
        {
            header: 'Fecha',
            accessor: 'fecha',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} /> {item.fecha}
                </span>
            )
        },
        {
            header: 'Empresa',
            accessor: 'empresa',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--color-secondary)' }}>
                        <ClipboardList size={16} />
                    </div>
                    <div style={{ fontWeight: 700 }}>{item.empresa || 'Sin nombre'}</div>
                </div>
            )
        },
        {
            header: 'Obra / Proyecto',
            accessor: 'obra',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Buildings size={14} /> {item.obra || '—'}
                </span>
            )
        },
        {
            header: 'Responsable',
            accessor: 'capatazNombre',
            render: (item: any) => <span style={{ color: 'var(--color-text-muted)' }}>{item.capatazNombre || '—'}</span>
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => navigate('/ats', { state: { editData: item } })} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>Ver</button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/ats/${item.id}?print=true`; setQrTarget({ text: url, title: `ATS — ${item.empresa}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><ShareNetwork as Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container" style={{ maxWidth: '900px', paddingBottom: '5rem' }}>
                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`ATS - ${shareItem?.obra || ''}`} rawMessage={shareItem ? `📋 ATS\n🏗️ Empresa: ${shareItem.empresa}\n🚧 Obra: ${shareItem.obra}\n📅 Fecha: ${shareItem.fecha}` : ''} text={shareItem ? `📋 ATS\n🏗️ Empresa: ${shareItem.empresa}\n🚧 Obra: ${shareItem.obra}\n📅 Fecha: ${shareItem.fecha}` : ''} elementIdToPrint="pdf-content" fileName={`ATS_${shareItem?.empresa?.replace(/\s+/g, '_') || 'Reporte'}.pdf`} />
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    <ATSPdfGenerator atsData={shareItem} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}><ArrowLeft size={22} /></button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Historial de ATS</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Análisis guardados</p>
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
                    searchPlaceholder="Buscar por empresa u obra..."
                    searchFields={['empresa', 'obra', 'capatazNombre']}
                    emptyMessage="No hay registros de ATS guardados."
                    emptyIcon={<ClipboardList size={48} />}
                    onEmptyAction={() => navigate('/ats')}
                    emptyActionLabel="Crear mi primer ATS"
                />

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
