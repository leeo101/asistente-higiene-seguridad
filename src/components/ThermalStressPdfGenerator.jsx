import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Printer, MapPin, Calendar, ThermometerSun, Info, Droplets, Wind, Sun, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getCountryNormativa } from '../data/legislationData';

export default function ThermalStressPdfGenerator({ report, onBack }) {
    const [logoData, setLogoData] = useState({ companyLogo: null, showLogo: true });

    useEffect(() => {
        const companyLogo = localStorage.getItem('companyLogo');
        const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';
        setLogoData({ companyLogo, showLogo });
    }, []);

    const { companyLogo, showLogo } = logoData;

    const componentRef = useRef();

        
    const handlePrint = () => {
        window.print();
    };

    const isAdmisible = report?.resultados?.admisible;

    const savedData = localStorage.getItem('personalData');
    const userCountry = savedData ? (JSON.parse(savedData).country || 'argentina') : 'argentina';
    const countryNorms = getCountryNormativa(userCountry);

    // Formatting helpers
    const getRitmoName = (rtm) => {
        if (rtm === 'liviano') return { name: 'Liviana', desc: 'Trabajo en banco, sentado', icon: '🪑' };
        if (rtm === 'moderado') return { name: 'Moderada', desc: 'Trabajo de pie, caminar con peso', icon: '🚶' };
        if (rtm === 'pesado') return { name: 'Pesada', desc: 'Trabajo intenso con pico/pala', icon: '⛏️' };
        return { name: rtm, desc: '', icon: '❓' };
    };

    const getCicloName = (ccl) => {
        if (ccl === 'continuo') return 'Continuo (Hasta 25% descanso/hr)';
        if (ccl === '75_25') return '75% Trabajo, 25% Descanso';
        if (ccl === '50_50') return '50% Trabajo, 50% Descanso';
        if (ccl === '25_75') return '25% Trabajo, 75% Descanso';
        return ccl;
    };

    const ritmoInfo = getRitmoName(report?.ritmo);

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container card print-area"
                ref={componentRef}
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm 20mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                    boxSizing: 'border-box', margin: '0 auto',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
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
                            padding: 10mm !important;
                            width: 100% !important;
                            max-width: none !important;
                            border: 1px solid #1e293b !important;
                            border-radius: 0 !important;
                        }
                        .company-logo {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .gradient-header {
                            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                        }
                        .metric-card {
                            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                        }
                    `}
                </style>

                {/* Document Header - Mejorado visualmente */}
                <div className="gradient-header" style={{ 
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    color: '#ffffff'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <ThermometerSun size={24} color="#fbbf24" />
                            <h1 style={{ margin: 0, fontSize: '18pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                                Informe de Estrés Térmico
                            </h1>
                        </div>
                        <p style={{ margin: '0 0 1rem 0', fontSize: '9pt', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Índice TGBH (Temperatura Globo Bulbo Húmedo)
                        </p>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '9pt' }}>
                                <MapPin size={14} color="#94a3b8" /> 
                                <strong style={{ color: '#fbbf24' }}>Sector:</strong> {report?.sector || 'N/A'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '9pt' }}>
                                <Calendar size={14} color="#94a3b8" /> 
                                <strong style={{ color: '#fbbf24' }}>Fecha:</strong> {report?.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                    
                    {companyLogo && showLogo && (
                        <div style={{ marginLeft: '20px', flexShrink: 0 }}>
                            <img
                                className="company-logo"
                                src={companyLogo}
                                alt="Logo de empresa"
                                style={{
                                    height: '50px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    maxWidth: '150px',
                                    background: '#ffffff',
                                    padding: '8px',
                                    borderRadius: '8px'
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Base Legal */}
                <div style={{ 
                    marginBottom: '1.5rem', 
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '1px solid #bfdbfe',
                    borderLeft: '4px solid #2563eb',
                    borderRadius: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                        <Info size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ margin: 0, fontSize: '9.5pt', color: '#1e3a8a', lineHeight: '1.5', textAlign: 'justify' }}>
                            El presente documento certifica la evaluación de las condiciones de carga térmica en el puesto de trabajo detallado,
                            realizada conforme a la estimación del <strong>TGBH (Índice de Temperatura Globo Bulbo Húmedo)</strong> y contrastado 
                            con los límites permisibles establecidos en <strong>{countryNorms.thermal}</strong> ({countryNorms.general}).
                        </p>
                    </div>
                </div>

                {/* Section 1: Puesto y Metadatos */}
                <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        padding: '0.6rem 1rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        fontSize: '10.5pt',
                        borderRadius: '8px 8px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ background: '#fbbf24', color: '#1e293b', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9pt', fontWeight: 900 }}>1</span>
                        IDENTIFICACIÓN DEL PUESTO
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                            <tbody>
                                <tr>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', background: '#f8fafc', fontWeight: '700', width: '30%', color: '#475569' }}>🏭 Puesto Evaluado:</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', fontWeight: '800', color: '#1e293b' }}>{report?.puesto || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', background: '#f8fafc', fontWeight: '700', color: '#475569' }}>📍 Sector / Área:</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', color: '#334155' }}>{report.sector || 'No especificado'}</td>
                                </tr>
                                <tr>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', background: '#f8fafc', fontWeight: '700', color: '#475569' }}>📋 Tarea Principal:</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', color: '#334155' }}>{report.tarea || 'No especificada'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 2: Variables Ambientales - Mejorado visualmente */}
                <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        padding: '0.6rem 1rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        fontSize: '10.5pt',
                        borderRadius: '8px 8px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ background: '#ffffff', color: '#f97316', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9pt', fontWeight: 900 }}>2</span>
                        VARIABLES AMBIENTALES MEDIDAS
                    </div>
                    <div style={{ border: '1px solid #fdba74', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="metric-card" style={{ border: '2px solid #3b82f6', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginBottom: '6px' }}>
                                    <Droplets size={16} color="#3b82f6" />
                                    <div style={{ fontSize: '7.5pt', color: '#475569', fontWeight: '800', textTransform: 'uppercase' }}>T° Bulbo Húmedo</div>
                                </div>
                                <div style={{ fontSize: '28pt', fontWeight: 900, color: '#1e40af', lineHeight: 1 }}>{report?.tbh || '0'}°C</div>
                                <div style={{ fontSize: '7pt', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>(Tbh)</div>
                            </div>
                            <div className="metric-card" style={{ border: '2px solid #f97316', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginBottom: '6px' }}>
                                    <ThermometerSun size={16} color="#f97316" />
                                    <div style={{ fontSize: '7.5pt', color: '#475569', fontWeight: '800', textTransform: 'uppercase' }}>T° Globo Térmico</div>
                                </div>
                                <div style={{ fontSize: '28pt', fontWeight: 900, color: '#c2410c', lineHeight: 1 }}>{report?.tg || '0'}°C</div>
                                <div style={{ fontSize: '7pt', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>(Tg)</div>
                            </div>
                            <div className="metric-card" style={{ border: `2px solid ${report?.cargaSolar ? '#ef4444' : '#cbd5e1'}`, borderRadius: '10px', padding: '12px', textAlign: 'center', opacity: report?.cargaSolar ? 1 : 0.5 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginBottom: '6px' }}>
                                    <Sun size={16} color={report?.cargaSolar ? '#ef4444' : '#94a3b8'} />
                                    <div style={{ fontSize: '7.5pt', color: '#475569', fontWeight: '800', textTransform: 'uppercase' }}>T° Bulbo Seco</div>
                                </div>
                                <div style={{ fontSize: '28pt', fontWeight: 900, color: '#991b1b', lineHeight: 1 }}>{report?.cargaSolar ? `${report?.tbs || '0'}°C` : 'N/A'}</div>
                                <div style={{ fontSize: '7pt', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>(Tbs)</div>
                            </div>
                        </div>
                        <div style={{ 
                            fontSize: '9pt', 
                            color: '#475569', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            background: report.cargaSolar ? '#fef2f2' : '#f0f9ff',
                            padding: '10px 12px', 
                            borderRadius: '8px',
                            border: `1px solid ${report.cargaSolar ? '#fecaca' : '#bfdbfe'}`
                        }}>
                            {report.cargaSolar ? <Sun size={16} color="#dc2626" /> : <Droplets size={16} color="#2563eb" />}
                            <strong>Exposición Solar:</strong> {report.cargaSolar ? 'SÍ (Condición al aire libre con carga solar)' : 'NO (Condición interior o sin carga solar)'}
                        </div>
                    </div>
                </div>

                {/* Section 3: Carga de Trabajo */}
                <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        padding: '0.6rem 1rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        fontSize: '10.5pt',
                        borderRadius: '8px 8px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ background: '#ffffff', color: '#8b5cf6', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9pt', fontWeight: 900 }}>3</span>
                        CARGA DE TRABAJO Y LÍMITES
                    </div>
                    <div style={{ border: '1px solid #c4b5fd', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                            <tbody>
                                <tr>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', background: '#faf5ff', fontWeight: '700', width: '40%', color: '#475569' }}>
                                        {ritmoInfo.icon} Nivel Metabólico:
                                    </td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px' }}>
                                        <div style={{ fontWeight: '800', color: '#1e293b', marginBottom: '2px' }}>{ritmoInfo.name}</div>
                                        <div style={{ fontSize: '8.5pt', color: '#64748b' }}>{ritmoInfo.desc}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', background: '#faf5ff', fontWeight: '700', color: '#475569' }}>
                                        🔄 Régimen Trabajo/Descanso:
                                    </td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', fontWeight: '700', color: '#1e293b' }}>{getCicloName(report?.ciclo)}</td>
                                </tr>
                                <tr>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', background: '#faf5ff', fontWeight: '700', color: '#475569' }}>
                                        📊 Límite Máximo Permitido:
                                    </td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '8px 10px', fontWeight: '900', color: '#7c3aed', fontSize: '14pt' }}>{report?.resultados?.limite || '--'}°C</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 4: Resultados y Dictamen - Mejorado visualmente */}
                <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        padding: '0.6rem 1rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        fontSize: '10.5pt',
                        borderRadius: '8px 8px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ background: '#ffffff', color: '#1e293b', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9pt', fontWeight: 900 }}>4</span>
                        DICTAMEN TGBH RESULTANTE
                    </div>
                    <div style={{ border: '1px solid #334155', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
                            {/* TGBH Obtenido */}
                            <div style={{ 
                                flex: 1, 
                                minWidth: '200px',
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                border: '2px solid #cbd5e1',
                                borderRadius: '10px',
                                padding: '1.2rem',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '8.5pt', color: '#475569', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    📈 TGBH OBTENIDO
                                </div>
                                <div style={{ fontSize: '36pt', fontWeight: 900, color: '#1e293b', lineHeight: 1, marginBottom: '4px' }}>
                                    {report?.resultados?.tgbh || '--'}°C
                                </div>
                                <div style={{ 
                                    fontSize: '8.5pt', 
                                    color: '#64748b', 
                                    fontWeight: '600',
                                    background: '#e2e8f0',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    display: 'inline-block'
                                }}>
                                    Límite: {report?.resultados?.limite || '--'}°C
                                </div>
                            </div>

                            {/* Dictamen */}
                            <div style={{
                                flex: 2,
                                minWidth: '250px',
                                background: isAdmisible ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                border: `3px solid ${isAdmisible ? '#22c55e' : '#ef4444'}`,
                                borderRadius: '10px',
                                padding: '1.2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '8px' }}>
                                    {isAdmisible ? 
                                        <CheckCircle2 size={28} color="#16a34a" /> : 
                                        <AlertTriangle size={28} color="#dc2626" />
                                    }
                                    <div style={{ 
                                        fontSize: '13pt', 
                                        fontWeight: 900, 
                                        color: isAdmisible ? '#166534' : '#991b1b',
                                        textTransform: 'uppercase',
                                        lineHeight: 1.2
                                    }}>
                                        {isAdmisible ? 'SITUACIÓN ADMISIBLE' : 'RIESGO POR ESTRÉS TÉRMICO'}
                                    </div>
                                </div>
                                <div style={{ 
                                    fontSize: '9.5pt', 
                                    color: isAdmisible ? '#15803d' : '#b91c1c',
                                    lineHeight: 1.5
                                }}>
                                    {isAdmisible
                                        ? '✅ El puesto de trabajo cumple con los valores límite umbral de estrés térmico vigentes. No se requiere rotación obligatoria especial, pero se recomienda continuar con hidratación adecuada.'
                                        : '⚠️ El índice TGBH ha superado el límite admisible. SE REQUIEREN MEDIDAS INMEDIATAS: Reducir intensidad física, aumentar descansos en zonas frescas, implementar métodos de refrigeración, y garantizar hidratación constante.'}
                                </div>
                            </div>
                        </div>

                        <div style={{ 
                            marginTop: '1rem', 
                            fontSize: '8pt', 
                            color: '#64748b',
                            background: '#f8fafc',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px dashed #cbd5e1'
                        }}>
                            <strong>📐 Fórmula aplicada:</strong> {report.cargaSolar ? 'TGBH = 0.7(Tbh) + 0.2(Tg) + 0.1(Tbs)' : 'TGBH = 0.7(Tbh) + 0.3(Tg)'}
                        </div>
                    </div>
                </div>

                {/* Signatures Area */}
                <div style={{ marginTop: 'auto', paddingTop: '50px', display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid' }}>
                    <div style={{ width: '280px', textAlign: 'center' }}>
                        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                            {report?.signature && (
                                <img src={report.signature} alt="Firma" style={{ maxHeight: '60px', maxWidth: '150px' }} />
                            )}
                        </div>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '10px' }}>
                            <div style={{ fontSize: '10.5pt', color: '#1e293b', fontWeight: '800', marginBottom: '3px' }}>
                                {report?.evaluador || 'Profesional H&S'}
                            </div>
                            <div style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '600' }}>
                                Firma y Sello Profesional
                            </div>
                            {report?.matricula && (
                                <div style={{ fontSize: '8pt', color: '#94a3b8', marginTop: '3px' }}>
                                    Mat: {report.matricula}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '3rem', 
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    fontSize: '7.5pt', 
                    color: '#94a3b8',
                    lineHeight: '1.6'
                }}>
                    <div style={{ fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                        Informe generado electrónicamente
                    </div>
                    <div>
                        {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()} | 
                        Asistente H&S - Sistema de Gestión
                    </div>
                </div>

            </div>
        </div>
    );
}
