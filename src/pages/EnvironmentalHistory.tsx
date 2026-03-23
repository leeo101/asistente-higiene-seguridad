import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, AlertTriangle, Wind, Droplets, Search, Share2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import EnvironmentalPdf from '../components/EnvironmentalPdf';

const MONITORING_TYPES = [
    { id: 'air', name: 'Calidad de Aire', icon: '💨', color: '#3b82f6' },
    { id: 'water', name: 'Calidad de Agua', icon: '💧', color: '#06b6d4' },
    { id: 'noise', name: 'Ruido Ambiental', icon: '🔊', color: '#f59e0b' },
    { id: 'waste', name: 'Gestión de Residuos', icon: '♻️', color: '#10b981' },
    { id: 'emissions', name: 'Emisiones', icon: '🏭', color: '#6b7280' },
    { id: 'soil', name: 'Calidad de Suelo', icon: '🌱', color: '#84cc16' },
    { id: 'radiation', name: 'Radiación', icon: '☢️', color: '#f97316' },
    { id: 'vibration', name: 'Vibraciones', icon: '📳', color: '#8b5cf6' }
];

export default function EnvironmentalHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    useDocumentTitle('Monitoreo Ambiental');
    
    const [measurements, setMeasurements] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [shareItem, setShareItem] = useState<any>(null);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('environmental_measurements_db') || '[]');
        setMeasurements(stored);
    }, []);

    const filteredMeasurements = measurements.filter((m: any) => {
        const matchesSearch = (m.stationName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (m.location || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || m.monitoringType === filterType;
        return matchesSearch && matchesType;
    });

    const stats = {
        total: measurements.length,
        criticos: measurements.filter((m: any) => m.status === 'critical').length,
        aire: measurements.filter((m: any) => m.monitoringType === 'air').length,
        agua: measurements.filter((m: any) => m.monitoringType === 'water').length
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Monitoreo Ambiental - ${shareItem?.stationName || ''}`}
                text={shareItem ? `🌿 Monitoreo Ambiental (Ley 19.587)\n📍 Estación: ${shareItem.stationName}\n📅 Fecha: ${new Date(shareItem.measurementDate).toLocaleDateString()}\n👷 Responsable: ${shareItem.technician || '-'}` : ''}
                rawMessage={shareItem ? `🌿 Monitoreo Ambiental (Ley 19.587)\n📍 Estación: ${shareItem.stationName}\n📅 Fecha: ${new Date(shareItem.measurementDate).toLocaleDateString()}\n👷 Responsable: ${shareItem.technician || '-'}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Monitoreo_${shareItem?.stationName || 'Ambiental'}.pdf`}
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <EnvironmentalPdf data={shareItem} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/environmental')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 'var(--radius-full)', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Monitoreo Ambiental</h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{stats.total} mediciones registradas</p>
                    </div>
                </div>
                <button onClick={() => navigate('/environmental')} className="btn-primary" style={{ margin: 0, padding: '0.75rem 1.25rem' }}>
                    Nueva MediciÃ³n
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<Activity size={20} />} />
                <StatCard label="CrÃ­ticos" value={stats.criticos} color="#dc2626" icon={<AlertTriangle size={20} />} />
                <StatCard label="Calidad Aire" value={stats.aire} color="#16a34a" icon={<Wind size={20} />} />
                <StatCard label="Calidad Agua" value={stats.agua} color="#06b6d4" icon={<Droplets size={20} />} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" placeholder="Buscar por estaciÃ³n, ubicaciÃ³n..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                    <option value="all">Todos los Tipos</option>
                    {MONITORING_TYPES.map(type => (<option key={type.id} value={type.id}>{type.icon} {type.name}</option>))}
                </select>
            </div>

            {filteredMeasurements.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Activity size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>No hay mediciones ambientales registradas</p>
                    <button onClick={() => navigate('/environmental')} className="btn-primary" style={{ marginTop: '1rem' }}>Configurar EstaciÃ³n</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredMeasurements.map(m => (
                        <MeasurementCard 
                            key={m.id} 
                            measurement={m} 
                            onEdit={() => navigate(`/environmental`, { state: { editData: m } })}
                            onShare={() => setShareItem(m)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color, icon }) {
    return (<div className="card" style={{ padding: '1.25rem', background: 'var(--gradient-card)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}><span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</span><div style={{ color }}>{icon}</div></div><div style={{ fontSize: '2rem', fontWeight: 900, color }}>{value}</div></div>);
}

function MeasurementCard({ measurement, onEdit, onShare }) {
    const typeConfig = MONITORING_TYPES.find(t => t.id === measurement.monitoringType) || MONITORING_TYPES[0];
    const statusColor = measurement.status === 'critical' ? '#dc2626' : measurement.status === 'warning' ? '#f59e0b' : '#16a34a';

    return (
        <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${statusColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ width: '48px', height: '48px', background: `${statusColor}15`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: statusColor }}>{typeConfig.icon}</div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>{measurement.stationName}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{measurement.location || 'Sin ubicaciÃ³n'} â€¢ {new Date(measurement.measurementDate).toLocaleDateString()}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ padding: '0.35rem 0.75rem', background: `${statusColor}15`, color: statusColor, borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800 }}>
                        {measurement.status?.toUpperCase() || 'NORMAL'}
                    </span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <button onClick={onEdit} className="btn-secondary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>Ver EstaciÃ³n</button>
                <button onClick={onShare} style={{ padding: '0.6rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Share2 size={16} />
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>PDF</span>
                </button>
            </div>
        </div>
    );
}
