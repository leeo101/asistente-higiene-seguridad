import React from 'react';
import { Building2, MapPin, Calendar } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import { getCountryNormativa } from '../data/legislationData';

export default function ProfessionalReportPdfGenerator({ currentReport }: { currentReport: any }): React.ReactElement | null {
// logo code removed


    if (!currentReport) return null;

    const report = currentReport;

    const savedData = localStorage.getItem('personalData');
    const userCountry = savedData ? (JSON.parse(savedData).country || 'argentina') : 'argentina';
    const countryNorms = getCountryNormativa(userCountry);

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area border-none shadow-none"
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

                {/* Header with Professional Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #3b82f6', paddingBottom: '2rem', marginBottom: '2.5rem', gap: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6', fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px' }}>INFORME</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                            {report.title || 'Informe Técnico'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '60px' }}>
                        <CompanyLogo
                            style={{
                                maxHeight: '100%',
                                maxWidth: '150px',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                    <div style={{ textAlign: 'right', borderLeft: '1px solid #e2e8f0', paddingLeft: '2rem' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', color: '#1e293b' }}>PROFESIONAL HYS</p>
                    </div>
                </div>

                {/* Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Building2 size={20} color="#3b82f6" />
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Empresa</p>
                            <p style={{ margin: 0, fontWeight: 700 }}>{report.company || '-'}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <MapPin size={20} color="#3b82f6" />
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Ubicación</p>
                            <p style={{ margin: 0, fontWeight: 700 }}>{report.location || 'N/A'}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Calendar size={20} color="#3b82f6" />
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Fecha</p>
                            <p style={{ margin: 0, fontWeight: 700 }}>{report.date ? new Date(report.date).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area / Observations */}
                <div style={{ marginBottom: '1rem', color: '#3b82f6', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>DETALLE / OBSERVACIONES</div>
                <div style={{ marginBottom: '4rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: '1.6', fontSize: '1.05rem', color: '#1e293b', borderTop: '2px solid #f1f5f9', paddingTop: '1rem' }}>
                    {report.content || 'Sin observaciones registradas.'}
                </div>

                {/* Personnel List Table if applicable */}
                {(report.template === 'training' || report.template === 'epp') && report.personnel && report.personnel.length > 0 && (
                    <div style={{ marginBottom: '4rem', pageBreakInside: 'auto' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#3b82f6', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', fontWeight: 800 }}>
                            Personal Interviniente / Firmas
                        </h4>
                        <div style={{ width: '100%' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ background: '#f1f5f9' }}>
                                        <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', color: '#475569' }}>Nombre y Apellido</th>
                                        <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', color: '#475569' }}>DNI / CUIL</th>
                                        <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', width: '35%', color: '#475569' }}>Firma</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.personnel.map((p, idx) => (
                                        <tr key={p.id || idx} style={{ pageBreakInside: 'avoid' }}>
                                            <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', color: '#1e293b', fontWeight: 600 }}>{p.name}</td>
                                            <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', color: '#1e293b' }}>{p.dni}</td>
                                            <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', height: '65px', verticalAlign: 'bottom', textAlign: 'center' }}>
                                                <div style={{ borderTop: '1px dotted #000', width: '80%', margin: '0 auto', fontSize: '0.7rem', color: '#64748b' }}>
                                                    Firma del Trabajador
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Firmas */}
                <div style={{ paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1', pageBreakInside: 'avoid', display: 'flex', gap: '1rem', paddingBottom: '1rem', justifyContent: 'center' }}>
                    <div style={{ flex: '0 1 32%', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Firma original</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.7rem', color: '#334155' }}>REPRESENTANTE EMPRESA</p>
                        <p style={{ margin: 0, fontSize: '0.6rem', color: '#64748b' }}>Firma y Aclaración</p>
                    </div>

                    <div style={{ flex: '0 1 32%', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Firma original</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.7rem', color: '#334155' }}>PROFESIONAL HYS</p>
                        <p style={{ margin: 0, fontSize: '0.6rem', color: '#64748b' }}>Validación Profesional</p>
                    </div>
                </div>

                {/* Footer Legal */}
                <div style={{ width: '100%', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: '3rem', fontStyle: 'italic', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    Documento generado por Asistente de Higiene y Seguridad - Conforme a {countryNorms.general}
                </div>
            </div>
        </div>
    );
}
