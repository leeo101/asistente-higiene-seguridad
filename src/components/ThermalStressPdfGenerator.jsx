import React, { useRef } from 'react';
import { ArrowLeft, Printer, MapPin, Calendar, ThermometerSun, Info } from 'lucide-react';
import { getCountryNormativa } from '../data/legislationData';

export default function ThermalStressPdfGenerator({ report, onBack }) {
    // Obtener logo de empresa
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';
    const componentRef = useRef();

    const safePuesto = (report?.puesto || 'Puesto').replace(/\s+/g, '_');
    const safeFecha = report?.fecha || new Date().toISOString().split('T')[0];

    const handlePrint = () => {
        window.print();
    };

    const isAdmisible = report?.resultados?.admisible;

    const savedData = localStorage.getItem('personalData');
    const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
    const countryNorms = getCountryNormativa(userCountry);

    // Formatting helpers
    const getRitmoName = (rtm) => {
        if (rtm === 'liviano') return 'Liviana (Ej. Trabajo en banco, sentado)';
        if (rtm === 'moderado') return 'Moderada (Ej. Trabajo de pie, caminar con peso)';
        if (rtm === 'pesado') return 'Pesada (Ej. Trabajo intenso con pico/pala)';
        return rtm;
    };

    const getCicloName = (ccl) => {
        if (ccl === 'continuo') return 'Continuo (Hasta 25% descanso/hr)';
        if (ccl === '75_25') return '75% Trabajo, 25% Descanso';
        if (ccl === '50_50') return '50% Trabajo, 50% Descanso';
        if (ccl === '25_75') return '25% Trabajo, 75% Descanso';
        return ccl;
    };

    const renderLegalBase = () => {
        return (
            <p style={{ fontSize: '10pt', color: '#334155', textAlign: 'justify', marginBottom: '20px' }}>
                El presente documento certifica la evaluación de las condiciones de carga térmica en el puesto de trabajo detallado a continuación,
                realizada conforme a la estimación del TGBH (Índice de Temperatura Globo Bulbo Húmedo) y contrastado con los límites permisibles
                establecidos en <strong>{countryNorms.thermal}</strong> ({countryNorms.general}).
            </p>
        );
    };

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
                                padding: 10mm !important; 
                                width: 100% !important; 
                                max-width: none !important; 
                                border: 1px solid #1e293b !important;
                                border-radius: 0 !important; 
                            }
                        `}
                </style>

                {/* Document Header */}
                <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '20pt', color: '#1e293b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                            Informe de Estrés Térmico (TGBH)
                        </h1>
                        <div style={{ display: 'flex', gap: '1.5rem', color: '#475569', fontSize: '10pt' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> Ref: {report?.sector || 'N/A'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> Fecha de Medición: {report?.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                    {companyLogo && showLogo && (
                        <img
                            src={companyLogo}
                            alt="Logo de empresa"
                            style={{
                                height: '45px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '140px',
                                marginLeft: '20px'
                            }}
                        />
                    )}
                </div>

                {renderLegalBase()}

                {/* Section 1: Puesto y Metadatos */}
                <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                    <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', fontWeight: 800, color: '#1e293b', fontSize: '11pt', borderLeft: '4px solid #3b82f6', marginBottom: '0.8rem' }}>
                        1. IDENTIFICACIÓN DEL PUESTO
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', background: '#f8fafc', fontWeight: 'bold', width: '30%' }}>Puesto Evaluado:</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: 'bold' }}>{report?.puesto || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', background: '#f8fafc', fontWeight: 'bold' }}>Sector / Área:</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>{report.sector || 'No especificado'}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', background: '#f8fafc', fontWeight: 'bold' }}>Tarea Principal:</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>{report.tarea || 'No especificada'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Section 2: Variables Ambientales */}
                <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                    <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', fontWeight: 800, color: '#1e293b', fontSize: '11pt', borderLeft: '4px solid #f97316', marginBottom: '0.8rem' }}>
                        2. VARIABLES AMBIENTALES MEDIDAS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>T° Bulbo Húmedo (Tbh)</div>
                            <div style={{ fontSize: '14pt', fontWeight: 900, color: '#1e293b', marginTop: '4px' }}>{report?.tbh || '0'}°C</div>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>T° Globo Térmico (Tg)</div>
                            <div style={{ fontSize: '14pt', fontWeight: 900, color: '#1e293b', marginTop: '4px' }}>{report?.tg || '0'}°C</div>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', textAlign: 'center', opacity: report?.cargaSolar ? 1 : 0.3 }}>
                            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>T° Bulbo Seco (Tbs)</div>
                            <div style={{ fontSize: '14pt', fontWeight: 900, color: '#1e293b', marginTop: '4px' }}>{report?.cargaSolar ? `${report?.tbs || '0'}°C` : 'N/A'}</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '9pt', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '8px', borderLeft: '3px solid #cbd5e1' }}>
                        <Info size={14} /> <strong>Exposición Solar Directa:</strong> {report.cargaSolar ? 'SÍ (Condición al aire libre con carga solar)' : 'NO (Condición interior o sin carga solar)'}
                    </div>
                </div>

                {/* Section 3: Carga de Trabajo y Límites */}
                <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                    <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', fontWeight: 800, color: '#1e293b', fontSize: '11pt', borderLeft: '4px solid #8b5cf6', marginBottom: '0.8rem' }}>
                        3. EVALUACIÓN DE LA CARGA DE TRABAJO
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', background: '#f8fafc', width: '40%' }}>Nivel Metabólico Estimado:</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: 'bold' }}>{getRitmoName(report?.ritmo)}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', background: '#f8fafc' }}>Régimen Trabajo / Descanso:</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: 'bold' }}>{getCicloName(report?.ciclo)}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', background: '#f8fafc' }}>Límite Máximo Permitido:</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: '900', color: '#1e293b' }}>{report?.resultados?.limite || '--'}°C</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Section 4: Resultados y Dictamen */}
                <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                    <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', fontWeight: 800, color: '#1e293b', fontSize: '11pt', borderLeft: '4px solid #1e293b', marginBottom: '0.8rem' }}>
                        4. DICTAMEN TGBH RESULTANTE
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
                        <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '9pt', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>ÍNDICE TGBH OBTENIDO</div>
                            <div style={{ fontSize: '24pt', fontWeight: 900, color: '#1e293b' }}>{report?.resultados?.tgbh || '--'}°C</div>
                            <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '4px' }}>
                                (Límite: {report?.resultados?.limite || '--'}°C)
                            </div>
                        </div>

                        <div style={{
                            flex: 2,
                            background: isAdmisible ? '#f0fdf4' : '#fef2f2',
                            border: `2px solid ${isAdmisible ? '#22c55e' : '#ef4444'}`,
                            borderRadius: '6px',
                            padding: '1rem',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center'
                        }}>
                            <div style={{ fontSize: '14pt', fontWeight: 900, color: isAdmisible ? '#166534' : '#991b1b', textTransform: 'uppercase', marginBottom: '5px' }}>
                                DICTAMEN: {isAdmisible ? 'SITUACIÓN ADMISIBLE' : 'RIESGO POR ESTRÉS TÉRMICO'}
                            </div>
                            <div style={{ fontSize: '9.5pt', color: isAdmisible ? '#15803d' : '#b91c1c' }}>
                                {isAdmisible
                                    ? 'El puesto de trabajo cumple con los valores límite umbral de estrés térmico vigentes. No se requiere de rotación obligatoria especial actual, pero se recomienda continuar con hidratación.'
                                    : 'El índice TGBH ha superado el límite admisible para el metabolismo y ciclo indicados. SE REQUIEREN MEDIDAS INMEDIATAS: Bajar intensidad física, aumentar descansos en zonas frescas, o métodos de refrigeración.'}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', fontSize: '8pt', color: '#64748b' }}>
                        *Fórmula aplicada: {report.cargaSolar ? 'TGBH = 0.7(Tbh) + 0.2(Tg) + 0.1(Tbs)' : 'TGBH = 0.7(Tbh) + 0.3(Tg)'}
                    </div>
                </div>

                {/* Signatures Area */}
                <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid' }}>
                    <div style={{ width: '250px', textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #1e293b', height: '40px', marginBottom: '5px' }}></div>
                        <div style={{ fontSize: '10pt', color: '#1e293b', fontWeight: 'bold' }}>{report?.evaluador || '-'}</div>
                        <div style={{ fontSize: '8pt', color: '#64748b' }}>Firma y Sello - Profesional H&S</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
