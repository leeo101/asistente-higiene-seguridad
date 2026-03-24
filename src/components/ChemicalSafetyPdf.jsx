import React from 'react';
import { ShieldCheck } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

const GHS_CONFIG = {
    explosive: { icon: '🧨', name: 'Explosivo' },
    flammable: { icon: '🔥', name: 'Inflamable' },
    oxidizing: { icon: '🔥', name: 'Comburente' },
    corrosive: { icon: '🧪', name: 'Corrosivo' },
    toxic: { icon: '💀', name: 'Tóxico' },
    harmful: { icon: '⚠️', name: 'Nocivo' },
    irritant: { icon: '⚠️', name: 'Irritante' },
    sensitizing: { icon: '🫁', name: 'Sensibilizante' },
    carcinogenic: { icon: '🫁', name: 'Carcinógeno' },
    environmental: { icon: '🌊', name: 'Ambiente' },
    pressure: { icon: '📦', name: 'Gas a Presión' }
};

export default function ChemicalSafetyPdf({ data }) {
    if (!data) return null;

    const formatFirstAid = (fa) => {
        if (!fa) return 'Sin especificar.';
        if (typeof fa === 'string') return fa;
        const parts = [];
        if (fa.inhalation) parts.push(`INHALACIÓN: ${fa.inhalation}`);
        if (fa.skin) parts.push(`PIEL: ${fa.skin}`);
        if (fa.eyes) parts.push(`OJOS: ${fa.eyes}`);
        if (fa.ingestion) parts.push(`INGESTIÓN: ${fa.ingestion}`);
        return parts.length > 0 ? parts.join(' | ') : 'Sin especificar.';
    };

    const formatPhrases = (phrases) => {
        if (!phrases) return 'Sin especificar.';
        if (Array.isArray(phrases)) return phrases.join(', ');
        return phrases;
    };

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm', background: '#ffffff', color: '#000000',
                    boxSizing: 'border-box', margin: '0 auto', fontSize: '10pt',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
            >
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area { box-shadow: none !important; margin: 0 !important; padding: 5mm !important; width: 100% !important; max-width: none !important; border: none !important; border-radius: 0 !important; }
                    `}
                </style>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>FICHA DE SEGURIDAD (SGA)</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#666' }}>SISTEMA GLOBALMENTE ARMONIZADO - LEY 19.587</p>
                    </div>
                    <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                </div>

                {/* Product Name Card */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', border: '2px solid #000', borderRadius: '8px', display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#475569', display: 'block' }}>PRODUCTO / NOMBRE COMERCIAL</span>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#1e293b' }}>{data.name || 'N/A'}</h2>
                        <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: 700 }}>CAS N°: {data.casNumber || 'N/A'}</span>
                    </div>
                    {data.pictograms?.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {data.pictograms.map((p, i) => (
                                <div key={i} title={GHS_CONFIG[p]?.name} style={{ border: '2px solid #de1c1c', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', transform: 'rotate(0deg)', background: '#fff' }}>
                                    {GHS_CONFIG[p]?.icon || '⚠️'}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Information Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ border: '1px solid #ddd', padding: '0.8rem', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block' }}>PROVEEDOR</span>
                        <div style={{ fontWeight: 700 }}>{data.supplier || 'No especificado'}</div>
                    </div>
                    <div style={{ border: '1px solid #ddd', padding: '0.8rem', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block' }}>STOCK / CANTIDAD</span>
                        <div style={{ fontWeight: 700 }}>{data.quantity || '0'} {data.unit || ''}</div>
                    </div>
                    <div style={{ border: '1px solid #ddd', padding: '0.8rem', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block' }}>UBICACIÓN EN PLANTA</span>
                        <div style={{ fontWeight: 700 }}>{data.location || 'Sin especificar'}</div>
                    </div>
                    <div style={{ border: '1px solid #ddd', padding: '0.8rem', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block' }}>FECHA DE CREACIÓN</span>
                        <div style={{ fontWeight: 700 }}>{data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}</div>
                    </div>
                </div>

                {/* Hazards & Precautionary */}
                <div style={{ border: '1.5px solid #000', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.6rem', background: '#dc2626', color: '#fff', fontWeight: 900, fontSize: '0.8rem', textAlign: 'center' }}>
                        INDICACIONES DE PELIGRO (FRASES H) Y CONSEJOS DE PRUDENCIA (FRASES P)
                    </div>
                    <div style={{ padding: '1rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                             <span style={{ fontWeight: 900, fontSize: '0.75rem', display: 'block', color: '#991b1b' }}>⚠️ INDICACIONES DE PELIGRO:</span>
                             <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>{formatPhrases(data.riskPhrases)}</p>
                        </div>
                        <div>
                             <span style={{ fontWeight: 900, fontSize: '0.75rem', display: 'block', color: '#111827' }}>🛡️ CONSEJOS DE PRUDENCIA:</span>
                             <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>{formatPhrases(data.safetyPhrases)}</p>
                        </div>
                    </div>
                </div>

                {/* First Aid */}
                <div style={{ border: '1px solid #16a34a', background: '#f0fdf4', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={18} /> PRIMEROS AUXILIOS
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>{formatFirstAid(data.firstAid)}</p>
                </div>

                {/* Signatures */}
                <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '2px solid #333', paddingTop: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '70px', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block' }}>PERSONAL QUE MANIPULA</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>
                             {data.signature && <img src={data.signature} alt="Firma Profesional" style={{ maxHeight: '100%', objectFit: 'contain' }} />}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block' }}>RESPONSABLE HIGIENE Y SEGURIDAD</span>
                        <span style={{ fontSize: '0.6rem' }}>{data.license ? `Licencia: ${data.license}` : ''}</span>
                    </div>
                </div>

                <PdfBrandingFooter />
            </div>
        </div>
    );
}
