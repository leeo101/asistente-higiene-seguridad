import React from 'react';
import { Lock, Zap, AlertTriangle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

const ENERGY_MAP = {
    electrical: { name: 'Eléctrica', icon: '⚡', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
    mechanical: { name: 'Mecánica', icon: '🔧', color: '#334155', bg: '#f1f5f9', border: '#e2e8f0' },
    hydraulic: { name: 'Hidráulica', icon: '💧', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
    pneumatic: { name: 'Neumática', icon: '💨', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
    thermal: { name: 'Térmica', icon: '🔥', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
    chemical: { name: 'Química', icon: '🧪', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
    potential: { name: 'Gravitatoria', icon: '⬇️', color: '#5b21b6', bg: '#ede9fe', border: '#ddd6fe' }
};

const DEVICE_MAP = {
    padlock: { name: 'Candado de seguridad', icon: '🔒' },
    hasp: { name: 'Aldaba (Hasp)', icon: '📎' },
    valve_lock: { name: 'Bloqueo de válvula', icon: '🔩' },
    breaker_lock: { name: 'Bloqueo de disyuntor', icon: '⚡' },
    tag: { name: 'Etiqueta de peligro', icon: '🏷️' }
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
                        .print-area { box-shadow: none !important; margin: 0 !important; padding: 5mm !important; width: 100% !important; max-width: none !important; border: none !important; border-radius: 0 !important; min-height: auto !important; height: auto !important; }
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
                        <span style={{ fontWeight: 700 }}>{data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : 'N/A'}</span>
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
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {data.energyTypes?.length > 0 ? data.energyTypes.map((t, i) => {
                                    const e = ENERGY_MAP[t as keyof typeof ENERGY_MAP] || { name: t, icon: '⚠️', color: '#1e40af', bg: '#eff6ff', border: '#dbeafe' };
                                    return (
                                        <span key={i} style={{ background: e.bg, border: `1px solid ${e.border}`, color: e.color, padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>{e.icon}</span> {e.name}
                                        </span>
                                    );
                                }) : <span style={{ fontSize: '0.8rem', color: '#666' }}>Ninguna especificada</span>}
                            </div>
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '0.8rem', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>DISPOSITIVOS REQUERIDOS</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {data.lotoDevices?.length > 0 ? data.lotoDevices.map((d, i) => {
                                    const dev = DEVICE_MAP[d as keyof typeof DEVICE_MAP] || { name: d, icon: '🔒' };
                                    return (
                                        <span key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>{dev.icon}</span> {dev.name}
                                        </span>
                                    );
                                }) : <span style={{ fontSize: '0.8rem', color: '#666' }}>Ninguno especificado</span>}
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
                <div className="signature-container-row" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1', pageBreakInside: 'avoid' }}>
                    <div className="signature-item-box">
                        <div className="signature-line" />
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.65rem', color: '#1e293b' }}>PERSONAL AFECTADO</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.55rem', color: '#64748b' }}>Firma y Aclaración</p>
                    </div>

                    <div className="signature-item-box">
                        <div className="signature-line" />
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.65rem', color: '#1e293b' }}>ENCARGADO BLOQUEO</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.55rem', color: '#64748b' }}>Aprobación</p>
                    </div>

                    <div className="signature-item-box">
                        {data.signature ? (
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
                                <img src={data.signature} alt="Firma Profesional" style={{ maxHeight: "50px", maxWidth: "100%", objectFit: "contain" }} />
                            </div>
                        ) : null}
                        <div className="signature-line" />
                        <p style={{ margin: "0.3rem 0 0", fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.08em" }}>SUPERVISOR / PROFESIONAL</p>
                        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "#0f172a" }}>
                            {data.professionalName ? data.professionalName : "Sello y Firma"}
                        </p>
                        {data.license && (
                            <p style={{ margin: 0, fontSize: "0.65rem", color: "#64748b" }}>Mat: {data.license}</p>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.6rem', color: '#64748b', textAlign: 'center', fontWeight: 900, letterSpacing: '0.1em' }}>
                    REGISTRO DE BLOQUEO CONFORME A NORMAS INTERNACIONALES DE SEGURIDAD INDUSTRIAL.
                </div>
            </div>
        </div>
    );
}

