import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Printer, Building2, User, Calendar, CheckCircle2, AlertCircle, Info, Pencil, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Report() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const handlePrint = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        const status = localStorage.getItem('subscriptionStatus');
        if (status !== 'active') {
            navigate('/subscribe');
            return;
        }
        window.print();
    };

    React.useEffect(() => {
        const current = localStorage.getItem('current_inspection');
        if (current) {
            const inspection = JSON.parse(current);
            const historyRaw = localStorage.getItem('inspections_history');
            const history = historyRaw ? JSON.parse(historyRaw) : [];

            // Evitar duplicados si se recarga la página
            if (!history.find(item => item.id === inspection.id)) {
                const updatedHistory = [{ ...inspection, status: 'Finalizada' }, ...history];
                localStorage.setItem('inspections_history', JSON.stringify(updatedHistory));
            }
            // No eliminamos current_inspection para poder seguir viendo este reporte
        }
    }, []);

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Resumen de Inspección</h1>
            </div>

            <div className="card" style={{ background: 'var(--color-primary)', color: 'white', textAlign: 'center', padding: '2rem' }}>
                <CheckCircle2 size={48} style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>Inspección Finalizada</h2>
                <p style={{ margin: 0, opacity: 0.9 }}>Obra: Edificio Alvear - 15/02/2024</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '2rem 0' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>95%</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Cumplimiento</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>2</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Hallazgos</div>
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Acciones</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Printer size={20} />
                        <span>Generar PDF Profesional</span>
                    </div>
                    <ChevronRight size={18} />
                </button>

                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Share2 size={20} />
                        <span>Compartir vía WhatsApp</span>
                    </div>
                    <ChevronRight size={18} />
                </button>

                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <FileText size={20} />
                        <span>Enviar por Email</span>
                    </div>
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="card" style={{ marginTop: '2rem', borderLeft: '4px solid #fbbf24' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <AlertTriangle size={24} color="#fbbf24" style={{ flexShrink: 0 }} />
                    <div>
                        <h4 style={{ margin: '0 0 0.3rem 0' }}>Pendiente</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Recuerde firmar digitalmente el reporte antes de enviarlo al cliente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
