import React from 'react';
import { ShieldCheck, Wind, Droplets, AlertTriangle, Activity, Thermometer, Clock } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function ConfinedSpacePdf({ data }) {
    if (!data) return null;

    const gasReadings = data.gasMonitoring || { o2: '', lel: '', co: '', h2s: '', time: '' };

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
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
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>PERMISO INGRESO A ESPACIO CONFINADO</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#666' }}>SEGÚN RESOLUCIÓN SRT 95/03</p>
                    </div>
                    <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0', border: '1.5px solid #000', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>IDENTIFICACIÓN DEL ESPACIO</span>
                        <span style={{ fontWeight: 700 }}>{data.spaceName || 'No especificado'}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>FECHA</span>
                        <span style={{ fontWeight: 700 }}>{data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>UBICACIÓN / SECTOR</span>
                        <span style={{ fontWeight: 700 }}>{data.location || 'No especificada'}</span>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>DURACIÓN ESTIMADA</span>
                        <span style={{ fontWeight: 700 }}>{data.duration || 'N/A'}</span>
                    </div>
                </div>

                {/* Gas Monitoring Table */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 900, background: '#1e293b', color: '#fff', padding: '0.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={18} /> MONITOREO ATMOSFÉRICO (OBLIGATORIO)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0', border: '1.5px solid #000', textAlign: 'center' }}>
                        <div style={{ padding: '0.5rem', borderRight: '1px solid #000', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block' }}>O2 (%)</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{gasReadings.o2 || '--'}</span>
                        </div>
                        <div style={{ padding: '0.5rem', borderRight: '1px solid #000', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block' }}>LEL (%)</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{gasReadings.lel || '--'}</span>
                        </div>
                        <div style={{ padding: '0.5rem', borderRight: '1px solid #000', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block' }}>CO (ppm)</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{gasReadings.co || '--'}</span>
                        </div>
                        <div style={{ padding: '0.5rem', borderRight: '1px solid #000', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block' }}>H2S (ppm)</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{gasReadings.h2s || '--'}</span>
                        </div>
                        <div style={{ padding: '0.5rem', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block' }}>HORA</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{gasReadings.time || '--'}</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '0.3rem', fontSize: '0.65rem', color: '#666', fontStyle: 'italic' }}>
                        * Valores aceptables: O2 (19.5% - 23.5%), LEL (&lt; 10%), CO (&lt; 25ppm), H2S (&lt; 10ppm).
                    </div>
                </div>

                {/* Ventilation & Hazard Mitigation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#0369a1' }}>
                            <Wind size={18} />
                            <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>VENTILACIÓN</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'capitalize' }}>
                            {typeof data.ventilation === 'object' 
                                ? Object.entries(data.ventilation)
                                    .filter(([_, value]) => value)
                                    .map(([key]) => key === 'forced' ? 'Forzada' : key === 'natural' ? 'Natural' : 'Extractiva')
                                    .join(', ') || 'No especificada'
                                : data.ventilation || 'No especificada'}
                        </div>
                    </div>
                    <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#b91c1c' }}>
                            <AlertTriangle size={18} />
                            <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>PELIGROS DETECTADOS</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {data.hazards?.length > 0 ? data.hazards.map((p, i) => (
                                <span key={i} style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '2px 4px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 600 }}>{p}</span>
                            )) : <span style={{ fontSize: '0.8rem', color: '#666' }}>Ninguno identificado</span>}
                        </div>
                    </div>
                </div>

                {/* Observations */}
                <div style={{ marginBottom: '1.5rem', border: '1px solid #eee', borderRadius: '6px', padding: '0.8rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>OBSERVACIONES Y CONCLUSIONES</span>
                    <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{data.observations || 'Sin observaciones'}</div>
                </div>

                {/* Signatures */}
                <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', paddingTop: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '50px', borderBottom: '1px solid #000', marginBottom: '0.3rem' }}></div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block' }}>VIGÍA DE SEGURIDAD</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '50px', borderBottom: '1px solid #000', marginBottom: '0.3rem' }}></div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block' }}>TRABAJADOR ENTRANTE</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #000', marginBottom: '0.3rem' }}>
                             {data.signature && <img src={data.signature} alt="Firma" style={{ height: '100%', objectFit: 'contain' }} />}
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block' }}>AUTORIZANTE (PROFESIONAL)</span>
                        <span style={{ fontSize: '0.6rem', color: '#666' }}>{data.license ? `Mat.: ${data.license}` : ''}</span>
                    </div>
                </div>

                <PdfBrandingFooter />
            </div>
        </div>
    );
}
