import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Download, CheckSquare } from 'lucide-react';

export default function Report() {
    const navigate = useNavigate();
    const [signature, setSignature] = useState(null);

    useEffect(() => {
        const savedData = localStorage.getItem('signatureStampData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setSignature(parsed.signature);
        }

        // Persistir inspección en historial
        const current = localStorage.getItem('current_inspection');
        if (current) {
            const inspection = JSON.parse(current);
            const historyRaw = localStorage.getItem('inspections_history');
            const history = historyRaw ? JSON.parse(historyRaw) : [];

            if (!history.find(item => item.id === inspection.id)) {
                const updatedHistory = [{ ...inspection, status: 'Finalizada' }, ...history];
                localStorage.setItem('inspections_history', JSON.stringify(updatedHistory));
            }
        }
    }, []);

    const handleFinish = () => {
        alert('Informe generado y enviado correctamente.');
        navigate('/');
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Generar Informe</h1>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '1rem', border: '1px solid var(--color-border)' }}>
                <div style={{ width: '60px', height: '80px', background: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>PDF</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>Informe_Alvear_180226.pdf</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>3.2 MB</p>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0 }}>Firmas</h3>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label>Profesional H&S</label>
                    <div style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', minHeight: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {signature ? (
                            <img src={signature} alt="Firma Profesional" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                        ) : (
                            <>
                                <CheckSquare size={16} color="var(--color-secondary)" />
                                <span>Firmado digitalmente</span>
                            </>
                        )}
                    </div>
                </div>

                <div>
                    <label>Responsable de Obra</label>
                    <div style={{ height: '100px', background: 'var(--color-background)', border: '1px dashed var(--color-border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        Tocar para firmar
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
                    <Share2 />
                    Compartir
                </button>
                <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
                    <Download />
                    Descargar
                </button>
            </div>

            <button className="btn-primary" onClick={handleFinish} style={{ marginTop: '2rem' }}>
                Finalizar y Volver al Inicio
            </button>
        </div>
    );
}
