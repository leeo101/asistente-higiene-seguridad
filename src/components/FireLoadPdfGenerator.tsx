import React, { useRef } from 'react';
import { Flame, ShieldCheck, Info, FileText } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import { getCountryNormativa } from '../data/legislationData';

export default function FireLoadPdfGenerator({ data }: { data: any }): React.ReactElement | null {

    if (!data) return null;

    const countryNorms = getCountryNormativa(data.pais || 'Argentina');
    const { empresa, obra, fecha, sector, superficie, riesgo, materiales, results, conclusion } = data;

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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>ESTUDIO DE CARGA DE FUEGO</h1>
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f97316' }}>CÁLCULO Y RESULTADOS</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <CompanyLogo
                            style={{
                                height: '50px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '150px'
                            }}
                        />
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>SISTEMA DE GESTIÓN HYS</div>
                            <div style={{ fontWeight: 800, color: '#1e293b' }}>{countryNorms.fire}</div>
                        </div>
                    </div>
                </div>

                <div style={{ border: '2px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', borderBottom: '2px solid #e2e8f0' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>EMPRESA / CLIENTE</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{empresa || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>OBRA / UBICACIÓN</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{obra || '-'}</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>FECHA DE ESTUDIO</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{new Date(fecha).toLocaleDateString('es-AR')}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>SECTOR EVALUADO</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{sector || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>SUPERFICIE</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{superficie || 0} m²</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Flame size={20} color="#f97316" /> Inventario de Materiales Combustibles
                    </h3>
                    <div style={{ border: '2px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr', background: '#f8fafc', padding: '0.8rem', borderBottom: '2px solid #e2e8f0', fontWeight: 800, fontSize: '0.75rem', color: '#64748b' }}>
                            <div>Material</div>
                            <div>Peso (Kg)</div>
                            <div>Calor (Mcal/Kg)</div>
                            <div>Total Kcal</div>
                        </div>
                        {(!materiales || materiales.length === 0) ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>No hay materiales registrados</div>
                        ) : (
                            materiales.map((m, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr', gap: '0.8rem', padding: '0.8rem', borderBottom: idx === materiales.length - 1 ? 'none' : '1px solid #f1f5f9', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontWeight: 700, color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{m.nombre || '-'}</div>
                                    <div>{m.peso} Kg</div>
                                    <div>{m.poderCalorifico} Mcal/Kg</div>
                                    <div style={{ fontWeight: 700 }}>{Math.round(m.totalKcal || 0).toLocaleString()} Kcal</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={20} color="#2563eb" /> Resultados Finales del Cálculo
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1, background: '#2563eb', color: '#ffffff', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>Carga de Fuego (Qf)</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{(results?.cargaDeFuego || 0).toFixed(2)}</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Kg de Madera Eq. / m²</div>
                        </div>
                        <div style={{ flex: 1, border: '2px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', paddingBottom: '0.8rem', borderBottom: '1px dotted #cbd5e1' }}>
                                <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Riesgo Dominante:</span>
                                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>{riesgo || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Resistencia (RF):</span>
                                <span style={{ fontWeight: 900, color: '#f97316', fontSize: '0.9rem' }}>{results?.rfRequerida || '-'} minutos</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: '0 1 32%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: '#1e293b', fontWeight: 800, fontSize: '0.85rem' }}>
                                <Info size={16} /> Data Técnica
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: '#475569' }}>
                                <span>Poder Calorífico Total:</span>
                                <span style={{ fontWeight: 700 }}>{Math.round(results?.cargaTermicaTotal || 0).toLocaleString()} Kcal</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569' }}>
                                <span>Madera Equivalente:</span>
                                <span style={{ fontWeight: 700 }}>{(results?.maderaEquivalente || 0).toFixed(2)} Kg</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, border: '2px solid #bfdbfe', borderRadius: '8px', padding: '1rem', background: '#eff6ff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: '#1d4ed8', fontWeight: 800, fontSize: '0.85rem' }}>
                                <ShieldCheck size={16} /> Requisitos Extinción
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#1e40af', pageBreakInside: 'avoid' }}>
                                <span>Min. Matafuegos:</span>
                                <span style={{ fontWeight: 900 }}>{results?.minMatafuegos || 0} u. (ABC)</span>
                            </div>
                            <div style={{ fontSize: '0.65rem', marginTop: '0.5rem', opacity: 0.8, fontStyle: 'italic', color: '#1e3a8a' }}>
                                * Cálculo base 1 unidad c/200m², mín. 2
                            </div>
                        </div>
                    </div>
                </div>

                {conclusion && (
                    <div style={{ pageBreakInside: 'avoid', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.2rem', background: '#fafafa', marginBottom: '2rem' }}>
                        <h3 style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: '#1e293b', fontWeight: 800 }}>
                            <FileText size={18} color="#2563eb" /> Conclusión Profesional
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.5 }}>
                            {conclusion}
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid', borderTop: '2px solid #e2e8f0' }}>
                    <div style={{ textAlign: 'center', width: '35%' }}>
                        <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {data.professionalSignature && <img src={data.professionalSignature} alt="Firma Profesional" style={{ height: '100%', objectFit: 'contain' }} />}
                        </div>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>{(data.professionalName || 'PROFESIONAL HYS').toUpperCase()}</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Mat.: {data.professionalLicense || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
