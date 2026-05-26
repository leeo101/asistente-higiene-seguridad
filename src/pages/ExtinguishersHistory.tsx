import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fire, MapPin, ArrowLeft, ShareNetwork as Share2, QrCode, Printer, PencilSimple, DownloadSimple } from '@phosphor-icons/react';
import ExcelJS from 'exceljs';
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
    try {
        const d = new Date(dateString + 'T12:00:00Z');
        if (isNaN(d.getTime())) return null;
        d.setMonth(d.getMonth() + months);
        return d;
    } catch (e) {
        return null;
    }
};

const getStatus = (lastDate, monthsValid) => {
    if (!lastDate) return { status: 'unknown', color: '#64748b', text: 'Sin Dato' };
    const dueDate = addMonths(lastDate, monthsValid);
    if (!dueDate || isNaN(dueDate.getTime())) return { status: 'unknown', color: '#64748b', text: 'Sin Dato' };
    const today = new Date();
    const diffDays = Math.ceil(((dueDate as any) - (today as any)) / (1000 * 60 * 60 * 24));
    if (isNaN(diffDays)) return { status: 'unknown', color: '#64748b', text: 'Sin Dato' };
    if (diffDays < 0) return { status: 'expired', color: '#ef4444', text: 'Vencido' };
    if (diffDays <= 30) return { status: 'warning', color: '#f59e0b', text: 'Próx. a Vencer' };
    return { status: 'valid', color: '#10b981', text: 'Vigente' };
};

const getLifespanStatus = (fechaFab) => {
    if (!fechaFab) return null;
    const d = new Date(fechaFab);
    const limitDate = new Date(d);
    limitDate.setFullYear(limitDate.getFullYear() + 20);
    const today = new Date();
    const diffDays = Math.ceil(((limitDate as any) - (today as any)) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { color: '#ef4444', text: 'Vencida' };
    if (diffDays <= 180) return { color: '#f59e0b', text: 'Por vencer' };
    return { color: '#10b981', text: 'Vigente' };
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
    const [companyFilter, setCompanyFilter] = useState('');

    useEffect(() => {
        const oldDataStr = localStorage.getItem('extinguishers_inventory');
        const newDataStr = localStorage.getItem('extintores_inventory');
        let combined = [];
        
        if (oldDataStr) {
            try { combined = [...combined, ...JSON.parse(oldDataStr)]; } catch(e) {}
        }
        
        if (newDataStr) {
            try {
                const newData = JSON.parse(newDataStr);
                const existingIds = new Set(combined.map((e: any) => e.id));
                const uniqueNew = newData.filter((e: any) => !existingIds.has(e.id));
                combined = [...combined, ...uniqueNew];
                // Persist the merge immediately and clear the old new-format storage to avoid duplicates later
                localStorage.setItem('extinguishers_inventory', JSON.stringify(combined));
                localStorage.removeItem('extintores_inventory');
            } catch(e) {}
        }

        const migrated = combined.map((ext: any) => ({
            ...ext,
            chapa: ext.chapa || ext.numero || '',
            ultimaCarga: ext.ultimaCarga || ext.vencimientoRecarga || '',
            ultimaPH: ext.ultimaPH || ext.vencimientoPH || ''
        }));
        setInventory(migrated);
    }, [syncPulse]);

    const handleExportExcel = async () => {
        const dataToExport = companyFilter ? inventory.filter((e: any) => e.empresa === companyFilter) : inventory;
        if (dataToExport.length === 0) return;
        
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Inventario Extintores');

            worksheet.columns = [
                { header: 'Empresa', key: 'empresa', width: 25 },
                { header: 'Chapa/Número', key: 'chapa', width: 15 },
                { header: 'Tipo', key: 'tipo', width: 20 },
                { header: 'Capacidad', key: 'capacidad', width: 15 },
                { header: 'Ubicación', key: 'ubicacion', width: 30 },
                { header: 'Fecha Fabric.', key: 'fechaFabricacion', width: 15 },
                { header: 'Vto. Recarga', key: 'vencimientoRecarga', width: 15 },
                { header: 'Vto. P.H.', key: 'vencimientoPH', width: 15 },
                { header: 'Estado', key: 'estadoFisico', width: 15 }
            ];

            // Premium header styling
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0F766E' } // Teal background
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

            dataToExport.forEach((item: any) => {
                worksheet.addRow({
                    empresa: item.empresa || 'Sin empresa',
                    chapa: item.chapa || item.numero || '',
                    tipo: item.tipo || '',
                    capacidad: item.capacidad || '',
                    ubicacion: item.ubicacion || '',
                    fechaFabricacion: item.fechaFabricacion || '',
                    vencimientoRecarga: item.ultimaCarga || item.vencimientoRecarga || '',
                    vencimientoPH: item.ultimaPH || item.vencimientoPH || '',
                    estadoFisico: item.estadoFisico || item.estado || ''
                });
            });

            // Alternate row colors for premium look
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: rowNumber % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' } // Slate-50 alternating
                    };
                    row.border = {
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                    };
                }
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Inventario_Extintores_${companyFilter || 'Todas'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Excel generado correctamente');
        } catch (error) {
            console.error('Error generando Excel:', error);
            toast.error('Hubo un error al generar el Excel');
        }
    };

    const handlePrintPdf = () => {
        const dataToExport = companyFilter ? inventory.filter((e: any) => e.empresa === companyFilter) : inventory;
        setShareItem(dataToExport as any);
        
        setTimeout(() => {
            const element = document.getElementById('pdf-content');
            if (!element) return;
            document.body.classList.add('printing-isolated');
            element.classList.add('isolated-print-target');
            window.print();
            document.body.classList.remove('printing-isolated');
            element.classList.remove('isolated-print-target');
            setShareItem(null);
        }, 500);
    };

    const columns = [
        {
            header: 'Chapa',
            accessor: 'chapa',
            sortable: true,
            render: (item: any) => {
                const stCarga = getStatus(item.ultimaCarga, 12);
                const isExpired = stCarga.status === 'expired' || getStatus(item.ultimaPH, 60).status === 'expired';
                const lastInspection = item.inspections && item.inspections.length > 0 ? item.inspections[item.inspections.length - 1] : null;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ background: isExpired ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', padding: '0.3rem', borderRadius: '6px', color: isExpired ? '#ef4444' : '#10b981' }}>
                                <Fire size={14} weight="fill" />
                            </div>
                            <span style={{ fontWeight: 800 }}>#{item.chapa}</span>
                        </div>
                        {lastInspection && (
                            <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.1rem', 
                                fontSize: '0.6rem', 
                                fontWeight: 900, 
                                padding: '0.05rem 0.2rem',
                                borderRadius: '4px',
                                background: lastInspection.resultado === 'C' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                color: lastInspection.resultado === 'C' ? '#10b981' : '#ef4444',
                                width: 'fit-content'
                            }}>
                                INSP: {lastInspection.resultado}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Tipo',
            accessor: 'tipo',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', background: 'var(--color-background)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, width: 'fit-content' }}>
                        {item.tipo} — {item.capacidad}
                    </span>
                    {item.fechaFabricacion && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            Fab: {new Date(item.fechaFabricacion + 'T12:00:00Z').toLocaleDateString('es-AR')}
                        </span>
                    )}
                </div>
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
            header: 'Vida Útil',
            accessor: 'fechaFabricacion',
            sortable: true,
            render: (item: any) => {
                const st = getLifespanStatus(item.fechaFabricacion);
                if (!st) return <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>Sin Dato</span>;
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
                    <button onClick={() => navigate(`/extintores?edit=${item.id}`)} style={{ padding: '0.4rem', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '8px', color: '#2563eb', cursor: 'pointer' }} title="Editar"><PencilSimple size={15} /></button>
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
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800 }}>Control de Matafuegos</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Inventario y Vencimientos</p>
                        </div>
                    </div>
                    
                    {(() => {
                        const companies = [...new Set(inventory.map((e: any) => e.empresa).filter(Boolean))];
                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', width: '100%', flex: '1 1 300px', justifyContent: 'flex-end' }}>
                                <select
                                    value={companyFilter}
                                    onChange={e => setCompanyFilter(e.target.value)}
                                    style={{ padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', outline: 'none', flex: '1 1 200px', maxWidth: '100%' }}
                                >
                                    <option value="">Todas las Empresas</option>
                                    {companies.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                                </select>
                                <button onClick={() => navigate('/extintores')} className="btn-primary" style={{ margin: 0, padding: '0.6rem 1rem', flex: '1 1 200px', maxWidth: '100%', whiteSpace: 'nowrap' }}>Gestionar / Nuevo</button>
                            </div>
                        );
                    })()}
                </div>

                <DataTable
                    data={companyFilter ? inventory.filter((e: any) => e.empresa === companyFilter) : inventory}
                    columns={columns}
                    searchPlaceholder="Buscar por chapa, ubicación o empresa..."
                    searchFields={['chapa', 'ubicacion', 'empresa', 'tipo']}
                    emptyMessage="No hay extintores en el inventario."
                    emptyIcon={<Fire size={48} />}
                    onEmptyAction={() => navigate('/extintores')}
                    emptyActionLabel="Registrar Extintor"
                />

                {inventory.length > 0 && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                        <button onClick={() => requirePro(handlePrintPdf)} className="btn-outline" style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', margin: 0, padding: '0.8rem' }}>
                            <Printer size={18} /> Imprimir PDF
                        </button>
                        <button onClick={() => requirePro(handleExportExcel)} className="btn-outline" style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', margin: 0, borderColor: '#10b981', color: '#10b981', padding: '0.8rem' }}>
                            <DownloadSimple size={18} /> Exportar Excel
                        </button>
                        <button onClick={() => requirePro(() => setShareItem(inventory))} className="btn-primary" style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', margin: 0, background: '#16a34a', border: 'none', padding: '0.8rem' }}>
                            <Share2 size={18} /> Compartir (WA)
                        </button>
                    </div>
                )}

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
            </div>
        </AnimatedPage>
    );
}
