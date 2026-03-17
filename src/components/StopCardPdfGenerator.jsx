import { MapPin, Calendar, Clock, User, AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

export default function StopCardPdfGenerator({ card }) {
// logo code removed


    const componentRef = useRef();
    if (!card) return null;

    const getTypeColor = (type) => {
        switch (type) {
            case 'Condición Insegura': return { color: '#f59e0b', bg: '#fef3c7', icon: <AlertCircle size={24} /> };
            case 'Acto Inseguro': return { color: '#ef4444', bg: '#fee2e2', icon: <AlertTriangle size={24} /> };
            case 'Casi Accidente': return { color: '#dc2626', bg: '#fef2f2', icon: <AlertTriangle size={24} /> };
            case 'Acto Seguro': return { color: '#10b981', bg: '#d1fae5', icon: <ShieldCheck size={24} /> };
            default: return { color: '#3b82f6', bg: '#dbeafe', icon: <AlertCircle size={24} /> };
        }
    };

    const tColor = getTypeColor(card.type);

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container card print-area"
                ref={componentRef}
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '20mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                    boxSizing: 'border-box', margin: '0 auto'
                }}
            >
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 15mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area { 
                            box-shadow: none !important; 
                            margin: 0 !important; 
                            padding: 5mm !important; 
                            width: 100% !important; 
                            max-width: none !important; 
                            border: none !important;
                            border-radius: 0 !important; 
                        }
                        .company-logo {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    `}
                </style>

                {/* Header */}
                <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '24pt', color: '#1e293b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                            Tarjeta STOP
                        </h1>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12pt', fontWeight: 600 }}>Programa de Seguridad Basada en el Comportamiento</p>
                    </div>
                        <CompanyLogo
                            style={{
                                height: '45px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '140px'
                            }}
                        />
                </div>

                {/* Classification Box */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: tColor.bg, borderRadius: '12px', borderLeft: `6px solid ${tColor.color}`, marginBottom: '2rem' }}>
                    <div style={{ color: tColor.color }}>{tColor.icon}</div>
                    <div>
                        <div style={{ fontSize: '10pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Clasificación del Hallazgo</div>
                        <div style={{ fontSize: '18pt', fontWeight: 900, color: tColor.color, margin: 0 }}>{card.type}</div>
                    </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                        <MapPin style={{ color: '#3b82f6', marginTop: '2px' }} size={18} />
                        <div>
                            <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 700 }}>Ubicación / Área</div>
                            <div style={{ fontSize: '12pt', color: '#0f172a', fontWeight: 600 }}>{card.location}</div>
                        </div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                        <Calendar style={{ color: '#3b82f6', marginTop: '2px' }} size={18} />
                        <div>
                            <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 700 }}>Fecha y Hora</div>
                            <div style={{ fontSize: '12pt', color: '#0f172a', fontWeight: 600 }}>{new Date(card.date).toLocaleDateString()} - {card.time}hs</div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '12pt', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        Descripción de la Observación
                    </h3>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', color: '#334155', fontSize: '11pt', lineHeight: 1.6, border: '1px solid #e2e8f0' }}>
                        {card.description}
                    </div>
                </div>

                {/* Immediate Action */}
                {card.actionTaken && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '12pt', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            Acción Inmediata Tomada
                        </h3>
                        <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', color: '#166534', fontSize: '11pt', lineHeight: 1.6, borderLeft: '4px solid #10b981' }}>
                            {card.actionTaken}
                        </div>
                    </div>
                )}

                {/* Photographic Evidence */}
                {card.photoBase64 && (
                    <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                        <h3 style={{ fontSize: '12pt', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            Evidencia Fotográfica
                        </h3>
                        <div style={{ width: '100%', maxWidth: '400px', height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', margin: '0 auto' }}>
                            <img src={card.photoBase64} alt="Evidencia" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f1f5f9' }} />
                        </div>
                    </div>
                )}

                {/* Footer Signature */}
                <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid' }}>
                    <div style={{ width: '250px', textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #1e293b', height: '40px', marginBottom: '5px' }}></div>
                        <div style={{ fontSize: '10pt', color: '#1e293b', fontWeight: 'bold' }}>Observador Prevencionista</div>
                        <div style={{ fontSize: '8pt', color: '#64748b' }}>Firma Digitalizada AsistenteHYS</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
