import React from 'react';
import { Activity, Wind, Clipboard } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

const MONITORING_TYPES = [
    { id: 'air', name: 'Calidad de Aire', icon: '💨' },
    { id: 'water', name: 'Calidad de Agua', icon: '💧' },
    { id: 'noise', name: 'Ruido Ambiental', icon: '🔊' },
    { id: 'waste', name: 'Gestión de Residuos', icon: '♻️' },
    { id: 'emissions', name: 'Emisiones', icon: '🏭' },
    { id: 'soil', name: 'Calidad de Suelo', icon: '🌱' },
    { id: 'radiation', name: 'Radiación', icon: '☢️' },
    { id: 'vibration', name: 'Vibraciones', icon: '📳' }
];

const PARAMETERS_MAP = {
    air: { pm25: 'PM2.5', pm10: 'PM10', co: 'CO', no2: 'NO₂', so2: 'SO₂', o3: 'Ozono' },
    water: { ph: 'pH', turbidity: 'Turbidez', bod: 'DBO₅', cod: 'DQO', tss: 'SST', oil: 'Aceites y Grasas' },
    noise: { leq: 'Leq', lmax: 'Lmax', lmin: 'Lmin' },
    emissions: { co2: 'CO₂', nox: 'NOx', sox: 'SOx', particulates: 'Particulados' }
};

const UNITS_MAP = {
    pm25: 'μg/m³', pm10: 'μg/m³', co: 'ppm', no2: 'ppb', so2: 'ppb', o3: 'ppb',
    ph: 'pH', turbidity: 'NTU', bod: 'mg/L', cod: 'mg/L', tss: 'mg/L', oil: 'mg/L',
    leq: 'dB(A)', lmax: 'dB(A)', lmin: 'dB(A)',
    co2: 'ton/año', nox: 'mg/Nm³', sox: 'mg/Nm³', particulates: 'mg/Nm³'
};

export default function EnvironmentalPdf({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    const typeConfig = MONITORING_TYPES.find(t => t.id === data.monitoringType) || MONITORING_TYPES[0];
    const statusColor = data.status === 'critical' ? '#dc2626' : data.status === 'warning' ? '#f59e0b' : '#16a34a';

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
                        .print-area { 
                            box-shadow: none !important; 
                            margin: 0 !important; 
                            padding: 5mm !important; 
                            width: 100% !important; 
                            max-width: none !important; 
                            border-top: 12px solid #2563eb !important; 
                            border-radius: 0 !important; 
                            min-height: auto !important; 
                            height: auto !important; 
                        }
                        .signature-container-row {
                            display: flex !important;
                            flex-direction: row !important;
                            justify-content: space-between !important;
                            align-items: flex-start !important;
                            gap: 1rem !important;
                            width: 100% !important;
                            margin-top: 2rem !important;
                        }
                        .signature-item-box {
                            flex: 1 !important;
                            max-width: none !important;
                            padding: 0.8rem !important;
                            margin-top: 0 !important;
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: center !important;
                            border-radius: 8px !important;
                            text-align: center !important;
                        }
                        .signature-line {
                            width: 100% !important;
                            border-bottom: 1.5px solid #cbd5e1 !important;
                            margin-bottom: 0.5rem !important;
                            margin-top: 0.5rem !important;
                        }
                    `}
                </style>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #f1f5f9', paddingBottom: '1.2rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>PROTOCOLO DE MONITOREO AMBIENTAL</h1>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SISTEMA DE GESTIÓN ISO 14001 • LEY 19.587</p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                        <CompanyLogo style={{ height: '40px', maxWidth: '140px' }} />
                        <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Doc. Controlado</div>
                    </div>
                </div>

                {/* Main Identity */}
                <div style={{ background: '#f8fafc', padding: '1.2rem', border: `2px solid ${statusColor}`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block' }}>ESTACIÓN DE MONITOREO</span>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#1e293b' }}>{data.stationName || 'N/A'}</h2>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tipo: {typeConfig.icon} {typeConfig.name}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>ID: {data.id || 'N/A'}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ background: `${statusColor}15`, color: statusColor, padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 900, fontSize: '0.9rem', border: `1px solid ${statusColor}` }}>
                            ESTADO: {data.status?.toUpperCase() || 'NORMAL'}
                        </span>
                    </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0', border: '1.5px solid #000', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>UBICACIÓN / PUNTO DE MEDICIÓN</span>
                        <span style={{ fontWeight: 700 }}>{data.location || 'Sin especificar'}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>FECHA Y HORA</span>
                        <span style={{ fontWeight: 700 }}>{data.measurementDate ? new Date(data.measurementDate).toLocaleDateString('es-AR') : 'N/A'} {data.measurementTime || ''}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>COORDENADAS (LAT/LONG)</span>
                        <span style={{ fontWeight: 700 }}>{data.latitude || '-'}{data.longitude ? ` / ${data.longitude}` : ''}</span>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>NORMATIVA APLICABLE</span>
                        <span style={{ fontWeight: 700 }}>{data.regulation || 'ISO 14001:2015'}</span>
                    </div>
                </div>

                {/* Dynamic Parameters Table */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #000', paddingBottom: '0.3rem' }}>
                        <Activity size={18} /> RESULTADOS DE LAS MEDICIONES
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ border: '1px solid #ddd', padding: '0.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900 }}>PARÁMETRO</th>
                                <th style={{ border: '1px solid #ddd', padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 900 }}>VALOR HALLADO</th>
                                <th style={{ border: '1px solid #ddd', padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 900 }}>UNIDAD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.parameters && data.parameters.length > 0 ? data.parameters.map((p, i) => (
                                <tr key={i}>
                                    <td style={{ border: '1px solid #ddd', padding: '0.5rem', fontWeight: 700 }}>{PARAMETERS_MAP[data.monitoringType]?.[p.parameterId] || p.parameterId}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '0.5rem', textAlign: 'center', fontWeight: 900, color: statusColor }}>{p.value}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '0.5rem', textAlign: 'center' }}>{UNITS_MAP[p.parameterId] || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} style={{ border: '1px solid #ddd', padding: '1rem', textAlign: 'center', color: '#666' }}>No se registraron parámetros específicos</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Weather & Equipment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ border: '1px solid #ddd', padding: '0.8rem', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Wind size={14} /> CONDICIONES METEOROLÓGICAS
                        </h4>
                        <div style={{ fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                            <span>Temp: <b>{data.weather?.temperature || '-'}°C</b></span>
                            <span>Hum: <b>{data.weather?.humidity || '-'}%</b></span>
                            <span>Viento: <b>{data.weather?.windSpeed || '-'} km/h</b></span>
                            <span>Dir: <b>{data.weather?.windDirection || '-'}</b></span>
                        </div>
                    </div>
                    <div style={{ border: '1px solid #ddd', padding: '0.8rem', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clipboard size={14} /> EQUIPO UTILIZADO
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>{data.equipment || 'No especificado'}</p>
                    </div>
                </div>

                {/* Observations */}
                <div style={{ marginBottom: '1.5rem', border: '1.5px solid #000', padding: '0.8rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block', marginBottom: '0.3rem' }}>OBSERVACIONES Y CONCLUSIÓN</span>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{data.observations || 'Se han realizado las mediciones ambientales siguiendo los protocolos establecidos. El estado general del punto monitoreado se considera aceptable bajo los criterios de gestión ambiental vigentes.'}</p>
                </div>

                {/* Signatures */}
                <div className="signature-container-row" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px solid #f1f5f9', pageBreakInside: 'avoid' }}>
                    <div className="signature-item-box" style={{ border: '1.5px solid #f1f5f9', background: '#fcfdfe' }}>
                        <div className="signature-line" style={{ borderBottomColor: '#e2e8f0' }} />
                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.1em' }}>RESPONSABLE ÁREA</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, color: '#0f172a' }}>Firma y Aclaración</p>
                        <p style={{ margin: 0, fontSize: '0.5rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Validación Interna</p>
                    </div>

                    <div className="signature-item-box" style={{ border: '1.5px solid #f1f5f9', background: '#fcfdfe' }}>
                        {data.capatazSignature ? (
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.3rem' }}>
                                <img src={data.capatazSignature} alt="Firma Supervisor" style={{ maxHeight: '45px', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                        ) : (
                            <div style={{ height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '0.65rem' }}>Firma digital / original</div>
                        )}
                        <div className="signature-line" style={{ borderBottomColor: '#e2e8f0' }} />
                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.1em' }}>SUPERVISOR H&S</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, color: '#0f172a' }}>Aprobación y Control</p>
                        <p style={{ margin: 0, fontSize: '0.5rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Higiene y Seguridad</p>
                    </div>

                    <div className="signature-item-box" style={{ border: '1.5px solid #dcfce7', background: '#f0fdf4' }}>
                        {data.professionalSignature || data.signature ? (
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.3rem' }}>
                                <img src={data.professionalSignature || data.signature} alt="Firma Profesional" style={{ maxHeight: '45px', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                        ) : (
                            <div style={{ height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86efac', fontSize: '0.65rem' }}>Sello y Firma Digital</div>
                        )}
                        <div className="signature-line" style={{ borderBottomColor: '#86efac' }} />
                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', color: '#16a34a', letterSpacing: '0.1em' }}>TÉCNICO INTERVINIENTE</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, color: '#0f172a' }}>
                            {data.professionalName || data.technician || 'Firma y Sello'}
                        </p>
                        {(data.professionalLicense || data.license) && (
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#16a34a', fontWeight: 700 }}>Mat: {data.professionalLicense || data.license}</p>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', fontSize: '0.6rem', color: '#64748b', textAlign: 'center' }}>
                    DOCUMENTO OBLIGATORIO PARA EL SEGUIMIENTO AMBIENTAL SEGÚN ISO 14001:2015.
                </div>
            </div>
        </div>
    );
}

