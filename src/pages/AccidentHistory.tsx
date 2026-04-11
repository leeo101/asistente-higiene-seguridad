import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Warning, Calendar, MapPin, Trash, ShareNetwork as Share2, PencilSimple, ArrowLeft, FileText, QrCode, DownloadSimple } from '@phosphor-icons/react';
import { downloadCSV } from '../services/exportCsv';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePaywall } from '../hooks/usePaywall';
import AccidentPdfGenerator from '../components/AccidentPdfGenerator';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';

const severityConfig = {
    'Leve':     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    'Moderado': { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    'Grave':    { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    'Mortal':   { color: '#dc2626', bg: 'rgba(220,38,38,0.14)' },
};

export default function AccidentHistory(): React.ReactElement | null {
    useDocumentTitle('Historial de Accidentes');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncing, syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const [history, setHistory] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        const h = JSON.parse(localStorage.getItem('accident_history') || '[]');
        setHistory(h.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, [syncing]);

    const confirmDelete = () => {
        const updated = history.filter(item => item.id !== deleteTarget);
        setHistory(updated);
        localStorage.setItem('accident_history', JSON.stringify(updated));
        syncCollection('accident_history', updated);
        setDeleteTarget(null);
    };

    const handleExportCSV = () => {
        requirePro(() => downloadCSV(history.map(i => ({
            victima: i.victimaNombre, empresa: i.empresa, fecha: i.date,
            lesion: i.lesionTipo || '', sector: i.sector || '', gravedad: i.gravedad || ''
        })), 'historial_accidentes', {
            victima: 'Víctima', empresa: 'Empresa', fecha: 'Fecha',
            lesion: 'Tipo de Lesión', sector: 'Sector/Área', gravedad: 'Gravedad'
        }));
    };

    if (selectedReport) {
        return <AccidentPdfGenerator report={selectedReport} onBack={() => setSelectedReport(null)} />;
    }

    const columns = [
        {
            header: 'Fecha',
            accessor: 'date',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString('es-AR')}
                </span>
            )
        },
        {
            header: 'Accidentado',
            accessor: 'victimaNombre',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#ef4444' }}>
                        <Warning size={16} weight="fill" />
                    </div>
                    <span style={{ fontWeight: 700 }}>{item.victimaNombre}</span>
                </div>
            )
        },
        {
            header: 'Empresa',
            accessor: 'empresa',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} /> {item.empresa}
                </span>
            )
        },
        {
            header: 'Gravedad',
            accessor: 'gravedad',
            sortable: true,
            render: (item: any) => {
                const cfg = severityConfig[item.gravedad] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
                return (
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                        {item.gravedad || '—'}
                    </span>
                );
            }
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => setSelectedReport(item)} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>Ver</button>
                    <button onClick={() => navigate('/accident-investigation', { state: { editData: item } })} style={{ padding: '0.4rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer' }} title="Editar"><PencilSimple size={15} /></button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/accident/${item.id}?print=true`; setQrTarget({ text: url, title: `Accidente — ${item.victimaNombre}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container" style={{ paddingBottom: '3rem' }}>
                {deleteTarget && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <div className="card" style={{ maxWidth: '320px', textAlign: 'center', padding: '2rem' }}>
                            <Trash size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                            <h3>¿Eliminar reporte?</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Esta acción no se puede deshacer.</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={confirmDelete} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                )}
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Investigación de Accidente - ${shareItem?.victimaNombre || ''}`} text={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⚠️ Gravedad: ${shareItem.gravedad}` : ''} rawMessage={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}` : ''} elementIdToPrint="pdf-content" fileName={`Accidente_${shareItem?.victimaNombre || 'Reporte'}.pdf`} />
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    {shareItem && <AccidentPdfGenerator report={shareItem} isHeadless={true} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}><ArrowLeft size={20} /></button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800 }}>Investigaciones de Accidentes</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Registros de siniestros</p>
                        </div>
                    </div>
                    {history.length > 0 && (
                        <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#36B37E', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff' }}>
                            <DownloadSimple size={16} /> EXCEL
                        </button>
                    )}
                </div>

                <DataTable
                    data={history}
                    columns={columns}
                    searchPlaceholder="Buscar por empleado, empresa o gravedad..."
                    searchFields={['victimaNombre', 'empresa', 'gravedad', 'lesionTipo']}
                    emptyMessage="No hay investigaciones registradas."
                    emptyIcon={<FileText size={48} />}
                    onEmptyAction={() => navigate('/accident-investigation')}
                    emptyActionLabel="Registrar Accidente"
                />

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
