import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Calendar, Buildings, ArrowLeft, Trash, Share2, Eye, QrCode, Plus, DownloadSimple } from '@phosphor-icons/react';
import ShareModal from '../components/ShareModal';
import WorkPermitPdfGenerator from '../components/WorkPermitPdfGenerator';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import { usePaywall } from '../hooks/usePaywall';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { permitTypes } from '../data/workPermits';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';

export default function WorkPermitHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    const { syncCollection } = useSync();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const [history, setHistory] = useState([]);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem('work_permits_history');
        if (saved) setHistory(JSON.parse(saved));
    }, []);

    const handleDelete = async (id) => {
        const toastId = toast(
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.9rem' }}>¿Eliminar este permiso?</span>
                <button
                    onClick={async () => {
                        toast.dismiss(toastId);
                        const updated = history.filter(h => h.id !== id);
                        setHistory(updated);
                        localStorage.setItem('work_permits_history', JSON.stringify(updated));
                        await syncCollection('work_permits_history', updated);
                        toast.success('Permiso eliminado');
                    }}
                    style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem' }}
                >Eliminar</button>
            </div>,
            { duration: 5000, icon: '🗑️' }
        );
    };

    const handleExportCSV = () => {
        downloadCSV(history.map(i => ({
            id: i.id, fecha: i.fecha, empresa: i.empresa, obra: i.obra,
            tipo: permitTypes.find(t => t.id === i.tipoPermiso)?.label || 'Permiso',
            desde: i.validezDesde, hasta: i.validezHasta
        })), 'permisos_de_trabajo', {
            id: 'ID Permiso', fecha: 'Fecha', empresa: 'Empresa', obra: 'Obra',
            tipo: 'Tipo de Tarea', desde: 'Hora Inicio', hasta: 'Hora Fin'
        }, 'Reporte de Permisos');
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
                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#3b82f6' }}>
                        <Key size={16} />
                    </div>
                    <span style={{ fontWeight: 700 }}>{item.empresa}</span>
                </div>
            )
        },
        {
            header: 'Obra',
            accessor: 'obra',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Buildings size={14} /> {item.obra}
                </span>
            )
        },
        {
            header: 'Tipo',
            accessor: 'tipoPermiso',
            sortable: true,
            render: (item: any) => (
                <span style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    {permitTypes.find(t => t.id === item.tipoPermiso)?.label || 'Permiso'}
                </span>
            )
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => navigate('/work-permit', { state: { editData: item } })} style={{ padding: '0.4rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', cursor: 'pointer' }} title="Ver"><Eye size={15} /></button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/permit/${item.id}?print=true`; setQrTarget({ text: url, title: `Permiso — ${item.empresa}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => handleDelete(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container" style={{ maxWidth: '900px', paddingBottom: '8rem' }}>
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Permiso de Trabajo - ${shareItem?.empresa || ''}`} text={shareItem ? `🔐 Permiso de Trabajo\n🏗️ Empresa: ${shareItem.empresa}\n🚧 Obra: ${shareItem.obra}\n📅 Fecha: ${shareItem.fecha}` : ''} rawMessage={``} elementIdToPrint="pdf-content" fileName={`Permiso_${shareItem?.empresa || 'Trabajo'}`} />
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    {shareItem && <WorkPermitPdfGenerator data={shareItem} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}><ArrowLeft size={22} /></button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, lineHeight: 1.2 }}>Permisos de Trabajo</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Tareas críticas</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {history.length > 0 && (
                            <button onClick={() => requirePro(handleExportCSV)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#36B37E', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff' }}>
                                <DownloadSimple size={14} /> EXCEL
                            </button>
                        )}
                        <button onClick={() => navigate('/work-permit')} className="btn-primary" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', width: 'auto', margin: 0 }}>
                            <Plus size={18} /> NUEVO
                        </button>
                    </div>
                </div>

                <DataTable
                    data={history}
                    columns={columns}
                    searchPlaceholder="Buscar por empresa, obra o tipo..."
                    searchFields={['empresa', 'obra']}
                    emptyMessage="No hay permisos registrados."
                    emptyIcon={<Key size={48} />}
                    onEmptyAction={() => navigate('/work-permit')}
                    emptyActionLabel="Crear nuevo Permiso"
                />

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
