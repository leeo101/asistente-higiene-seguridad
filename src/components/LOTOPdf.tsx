import React from 'react';
import { Lock, Zap, AlertTriangle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

const ENERGY_MAP = {
    electrical: 'Eléctrica',
    mechanical: 'Mecánica',
    hydraulic: 'Hidráulica',
    pneumatic: 'Neumática',
    thermal: 'Térmica',
    chemical: 'Química',
    potential: 'Gravitatoria'
};

const DEVICE_MAP = {
    padlock: 'Candado de seguridad',
    hasp: 'Aldaba (Hasp)',
    valve_lock: 'Bloqueo de válvula',
    breaker_lock: 'Bloqueo de disyuntor',
    tag: 'Etiqueta de peligro'
};

export default function LOTOPdf({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

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
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>PROCEDIMIENTO LOTO (BLOQUEO Y ETIQUETADO)</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#666' }}>SEGÚN ESTÁNDAR OSHA 29 CFR 1910.147</p>
                    </div>
                    <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0', border: '1.5px solid #000', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>EQUIPO / MÁQUINA</span>
                        <span style={{ fontWeight: 700 }}>{data.equipmentName || 'N/A'}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>FECHA</span>
                        <span style={{ fontWeight: 700 }}>{data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>UBICACIÓN</span>
                        <span style={{ fontWeight: 700 }}>{data.location || 'No especificada'}</span>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>ID PROCEDIMIENTO</span>
                        <span style={{ fontWeight: 700 }}>#LOTO-{data.id?.slice(-6) || 'N/A'}</span>
                    </div>
                </div>

                {/* Energy Sources */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 900, background: '#1e293b', color: '#fff', padding: '0.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={18} /> FUENTES DE ENERGÍA Y BLOQUEO
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ border: '1px solid #ddd', padding: '0.8rem', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>ENERGÍAS A BLOQUEAR</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {data.energyTypes?.length > 0 ? data.energyTypes.map((t, i) => (
                                    <span key={i} style={{ background: '#eff6ff', border: '1px solid #dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>{ENERGY_MAP[t] || t}</span>
                                )) : <span style={{ fontSize: '0.8rem', color: '#666' }}>Ninguna especificada</span>}
                            </div>
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '0.8rem', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>DISPOSITIVOS REQUERIDOS</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {data.lotoDevices?.length > 0 ? data.lotoDevices.map((d, i) => (
                                    <span key={i} style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>{DEVICE_MAP[d] || d}</span>
                                )) : <span style={{ fontSize: '0.8rem', color: '#666' }}>Ninguno especificado</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Verification & Warnings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ border: '1px solid #fbd38d', background: '#fffaf0', borderRadius: '6px', padding: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#c05621' }}>
                            <Lock size={18} />
                            <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>VERIFICACIÓN DE ENERGÍA CERO</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>{data.verificationSteps || 'Se han verificado todos los puntos de aislamiento y se procedió al intento de arranque para confirmar ausencia de energía residual.'}</p>
                    </div>
                    <div style={{ border: '1px solid #feb2b2', background: '#fff5f5', borderRadius: '6px', padding: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#c53030' }}>
                            <AlertTriangle size={18} />
                            <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>ADVERTENCIA CRÍTICA</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>PROHIBIDO RETIRAR BLOQUEOS SIN AUTORIZACIÓN DEL RESPONSABLE DEL TRABAJO.</p>
                    </div>
                </div>

                {/* Final Signatures */}
                <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', borderTop: '2px solid #333', paddingTop: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '60px', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block' }}>PERSONAL AFECTADO</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '60px', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block' }}>ENCARGADO DE BLOQUEO</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>
                            {data.signature && <img src={data.signature} alt="Firma" style={{ maxHeight: '100%', objectFit: 'contain' }} />}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block' }}>SUPERVISOR / PROFESIONAL</span>
                        <span style={{ fontSize: '0.65rem' }}>{data.license ? `Licencia N°: ${data.license}` : ''}</span>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.6rem', color: '#666', textAlign: 'center' }}>
                    REGISTRO DE BLOQUEO CONFORME A NORMAS INTERNACIONALES DE SEGURIDAD INDUSTRIAL.
                </div>
            </div>
        </div>
    );
}
