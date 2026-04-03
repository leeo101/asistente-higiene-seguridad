import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Volume2, AlertTriangle, CheckCircle2, Share2, Printer, Trash2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import NoiseAssessmentPdf from '../components/NoiseAssessmentPdf';

export default function NoiseAssessmentHistory(): React.ReactElement | null {
    const navigate = useNavigate();
    useDocumentTitle('Evaluación de Ruido');
    
    const [measurements, setMeasurements] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('noise_assessments_db') || '[]');
        setMeasurements(stored);
    }, []);

    const filteredMeasurements = measurements.filter(m => {
        const matchesSearch = m.workerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.task?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const stats = {
        total: measurements.length,
        altos: measurements.filter(m => parseFloat(m.levels?.lavg) > 85).length,
        normales: measurements.filter(m => parseFloat(m.levels?.lavg) <= 85).length
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Protocolo Ruido - ${shareItem?.workerName || ''}`}
                text={shareItem ? `🔊 Protocolo de Medición de Ruido (Res. 85/12)\n👤 Trabajador: ${shareItem.workerName}\n📈 Nivel: ${shareItem.levels?.lavg} dB(A)\n📅 Fecha: ${new Date(shareItem.date).toLocaleDateString('es-AR')}` : ''}
                rawMessage={shareItem ? `🔊 Protocolo de Medición de Ruido (Res. 85/12)\n👤 Trabajador: ${shareItem.workerName}\n📈 Nivel: ${shareItem.levels?.lavg} dB(A)\n📅 Fecha: ${new Date(shareItem.date).toLocaleDateString('es-AR')}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Ruido_${shareItem?.workerName || 'Protocolo'}.pdf`}
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                {shareItem && <NoiseAssessmentPdf data={shareItem} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/noise-assessment')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 'var(--radius-full)', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Evaluación de Ruido</h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{stats.total} mediciones • {stats.altos} peligrosos</p>
                    </div>
                </div>
                <button onClick={() => navigate('/noise-assessment/new')} className="btn-primary" style={{ margin: 0, padding: '0.75rem 1.25rem' }}>
                    Nueva Medición
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<Volume2 size={20} />} />
                <StatCard label=">85 dB" value={stats.altos} color="#dc2626" icon={<AlertTriangle size={20} />} />
                <StatCard label="≤85 dB" value={stats.normales} color="#16a34a" icon={<CheckCircle2 size={20} />} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" placeholder="Buscar por ubicación, área..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none' }} />
                </div>
            </div>

            {filteredMeasurements.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Volume2 size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>No hay mediciones de ruido</p>
                    <button onClick={() => navigate('/noise-assessment/new')} className="btn-primary" style={{ marginTop: '1rem' }}>Primera Medición</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredMeasurements.map(m => (
                        <MeasurementCard 
                            key={m.id} 
                            measurement={m} 
                            onEdit={() => navigate(`/noise-assessment/new`, { state: { editData: m } })}
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
    const isDangerous = parseFloat(measurement.levels?.lavg) > 85;
    return (
        <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ width: '48px', height: '48px', background: isDangerous ? '#dc262620' : '#16a34a20', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDangerous ? '#dc2626' : '#16a34a' }}><Volume2 size={24} /></div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>{measurement.workerName || 'Sin trabajador'}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{measurement.location || 'Sin ubicación'} • {measurement.date ? new Date(measurement.date).toLocaleDateString('es-AR') : 'Sin fecha'}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isDangerous ? '#dc2626' : 'var(--color-text)' }}>{measurement.levels?.lavg || '0'} <span style={{ fontSize: '0.7rem' }}>dB(A)</span></div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isDangerous ? '#dc2626' : '#16a34a' }}>{isDangerous ? 'EXCEDE LÍMITE' : 'DENTRO DE NORMA'}</span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <button onClick={onEdit} className="btn-secondary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>Ver / Editar</button>
                <button onClick={onShare} style={{ padding: '0.6rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Share2 size={16} />
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>PDF</span>
                </button>
            </div>
        </div>
    );
}
