import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fire, MapPin, ArrowLeft, ShareNetwork as Share2, QrCode, Printer } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import ExtinguisherPdfGenerator from '../components/ExtinguisherPdfGenerator';
import { usePaywall } from '../hooks/usePaywall';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';

const addMonths = (dateString, months) => {
    if (!dateString) return null;
    const d = new Date(dateString + 'T12:00:00Z');
    d.setMonth(d.getMonth() + months);
    return d;
};

const getStatus = (lastDate, monthsValid) => {
    if (!lastDate) return { status: 'unknown', color: '#64748b', text: 'Sin Dato' };
    const dueDate = addMonths(lastDate, monthsValid);
    const today = new Date();
    const diffDays = Math.ceil(((dueDate as any) - (today as any)) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: 'expired', color: '#ef4444', text: 'Vencido' };
    if (diffDays <= 30) return { status: 'warning', color: '#f59e0b', text: 'Próx. a Vencer' };
    return { status: 'valid', color: '#10b981', text: 'Vigente' };
};

export default function ExtinguishersHistory(): React.ReactElement | null {
    useDocumentTitle('Historial de Extintores');
    const navigate = useNavigate();
    const { syncPulse } = useSync();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const [inventory, setInventory] = useState([]);
    const [qrTarget, setQrTarget] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('extinguishers_inventory') || '[]');
        setInventory(stored);
    }, [syncPulse]);

    const columns = [
        {
            header: 'Chapa',
            accessor: 'chapa',
            sortable: true,
            render: (item: any) => {
                const stCarga = getStatus(item.ultimaCarga, 12);
                const isExpired = stCarga.status === 'expired' || getStatus(item.ultimaPH, 60).status === 'expired';
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ background: isExpired ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', padding: '0.5rem', borderRadius: '8px', color: isExpired ? '#ef4444' : '#10b981' }}>
                            <Fire size={16} weight="fill" />
                        </div>
                        <span style={{ fontWeight: 800 }}>#{item.chapa}</span>
                    </div>
                );
            }
        },
        {
            header: 'Tipo',
            accessor: 'tipo',
            sortable: true,
            render: (item: any) => (
                <span style={{ padding: '0.2rem 0.6rem', background: 'var(--color-background)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {item.tipo} — {item.capacidad}
                </span>
            )
        },
        {
            header: 'Ubicación',
            accessor: 'ubicacion',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                    <MapPin size={14} /> {item.ubicacion}
                </span>
            )
        },
        {
            header: 'Carga',
            accessor: 'ultimaCarga',
            sortable: true,
            render: (item: any) => {
                const st = getStatus(item.ultimaCarga, 12);
                return (
                    <span style={{ color: st.color, fontWeight: 700, fontSize: '0.8rem' }}>{st.text}</span>
                );
            }
        },
        {
            header: 'P.H.',
            accessor: 'ultimaPH',
            sortable: true,
            render: (item: any) => {
                const st = getStatus(item.ultimaPH, 60);
                return (
                    <span style={{ color: st.color, fontWeight: 700, fontSize: '0.8rem' }}>{st.text}</span>
                );
            }
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/extinguisher/${item.id}?print=true`; setQrTarget({ text: url, title: `Extintor — ${item.chapa}` }); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                </div>
            )
        }
    ];

    return (
        <AnimatedPage>
            <div className="container" style={{ paddingBottom: '3rem' }}>
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={Array.isArray(shareItem) ? "Inventario de Extintores" : `Extintor #${shareItem?.chapa}`} text={shareItem ? (Array.isArray(shareItem) ? `🧯 Inventario de Extintores\n📊 Total: ${shareItem.length}` : `🧯 Extintor #${shareItem.chapa}\n📍 Ubicación: ${shareItem.ubicacion}`) : ''} rawMessage={''} elementIdToPrint="pdf-content" fileName={Array.isArray(shareItem) ? "Inventario_Extintores.pdf" : `Extintor_${shareItem?.chapa || 'Reporte'}.pdf`} />
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    <ExtinguisherPdfGenerator extinguishers={Array.isArray(shareItem) ? shareItem : (shareItem ? [shareItem] : [])} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/#activity')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}><ArrowLeft size={20} /></button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800 }}>Inventario de Extintores</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Control de vencimientos</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/extinguishers')} className="btn-primary" style={{ margin: 0, padding: '0.5rem 1rem' }}>Gestionar / Nuevo</button>
                </div>

                <DataTable
                    data={inventory}
                    columns={columns}
                    searchPlaceholder="Buscar por chapa, ubicación o empresa..."
                    searchFields={['chapa', 'ubicacion', 'empresa', 'tipo']}
                    emptyMessage="No hay extintores en el inventario."
                    emptyIcon={<Fire size={48} />}
                    onEmptyAction={() => navigate('/extinguishers')}
                    emptyActionLabel="Registrar Extintor"
                />

                {inventory.length > 0 && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button onClick={() => requirePro(() => navigate('/extinguishers-report'))} className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', margin: 0 }}>
                            <Printer size={18} /> Imprimir Vista Previa
                        </button>
                        <button onClick={() => requirePro(() => setShareItem(inventory))} className="btn-primary" style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', margin: 0, background: '#16a34a', border: 'none' }}>
                            <Share2 size={18} /> Compartir Inventario (WA)
                        </button>
                    </div>
                )}

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
