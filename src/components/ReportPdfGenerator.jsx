import React, { useEffect } from 'react';
import { TriangleAlert, CheckCircle2 } from 'lucide-react';

export default function ReportPdfGenerator({ initialData }) {
    if (!initialData) return null;

    const findings = initialData.observations || [];
    const findingCount = findings.length;

    // Obtener logo de empresa
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';

    // Debug: verificar si el logo existe
    useEffect(() => {
        if (companyLogo && showLogo) {
            console.log('[Report] Logo cargado:', companyLogo.substring(0, 50) + '...');
        } else if (!companyLogo) {
            console.log('[Report] No hay logo guardado - El usuario debe subirlo desde Perfil > Logo de Empresa');
        } else if (!showLogo) {
            console.log('[Report] Logo desactivado por el usuario');
        }
    }, [companyLogo, showLogo]);

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

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #3b82f6', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#3b82f6', fontWeight: 900 }}>ASISTENTE H&S</h2>
                        </div>
                        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>INFORME TÉCNICO DE INSPECCIÓN</h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Protocolo de Relevamiento General de Riesgos</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        {companyLogo && showLogo && (
                            <img
                                className="company-logo"
                                src={companyLogo}
                                alt="Logo de empresa"
                                style={{
                                    height: '45px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    maxWidth: '140px',
                                    WebkitPrintColorAdjust: 'exact',
                                    printColorAdjust: 'exact',
                                    colorAdjust: 'exact'
                                }}
                            />
                        )}
                        <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                            <p style={{ margin: '0 0 0.2rem 0' }}><strong>Fecha:</strong> {new Date(initialData.date).toLocaleDateString()}</p>
                            <p style={{ margin: '0 0 0.2rem 0' }}><strong>Referencia:</strong> {initialData.name}</p>
                            <p style={{ margin: 0 }}><strong>Ubicación:</strong> {initialData.location || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                    <div style={{ flex: 1, padding: '1rem', textAlign: 'center', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: '12px', pageBreakInside: 'avoid' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b' }}>{findingCount}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hallazgos</div>
                    </div>
                    <div style={{ flex: 1, padding: '1rem', textAlign: 'center', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: '12px', pageBreakInside: 'avoid' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b' }}>
                            {(() => {
                                const categories = [
                                    { items: ['e1', 'e2'] },
                                    { items: ['L1', 'L2'] },
                                    { items: ['p1', 'p2'] },
                                    { items: ['o1', 'o2'] },
                                    { items: ['s1', 's2'] }
                                ];
                                const allItems = categories.flatMap(c => c.items);
                                const total = allItems.length;
                                const okCount = allItems.filter(id => initialData.responses?.[id] === 'ok').length;
                                return Math.round((okCount / total) * 100) || 0;
                            })()}%
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cumplimiento</div>
                    </div>
                    <div style={{ flex: 2, padding: '1rem', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '0.2rem' }}>ESTADO GENERAL</div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: findingCount > 0 ? '#dc2626' : '#16a34a' }}>
                            {findingCount > 0 ? '⚠️ SE REQUIERAN ACCIONES' : '✅ CONDICIONES ÓPTIMAS'}
                        </div>
                    </div>
                </div>

                {/* Checklist Summary Section */}
                <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
                    📈 Resumen de Inspección por Áreas
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem', marginBottom: '2.5rem' }}>
                    {[
                        { name: 'Extintores y Protección', items: ['e1', 'e2'] },
                        { name: 'Riesgo Eléctrico', items: ['L1', 'L2'] },
                        { name: 'EPP', items: ['p1', 'p2'] },
                        { name: 'Orden y Limpieza', items: ['o1', 'o2'] },
                        { name: 'Señalización y Evacuación', items: ['s1', 's2'] }
                    ].map((cat, idx) => {
                        const total = cat.items.length;
                        const ok = cat.items.filter(id => initialData.responses?.[id] === 'ok').length;
                        const fail = cat.items.filter(id => {
                            const isResponseFail = initialData.responses?.[id] === 'fail';
                            const hasObservation = initialData.observations?.some(o => o.itemId === id);
                            return isResponseFail || hasObservation;
                        }).length;
                        const percent = Math.round((ok / total) * 100) || 0;

                        return (
                            <div key={idx} style={{ padding: '0.8rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', pageBreakInside: 'avoid' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>{cat.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                    <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? '#16a34a' : '#3b82f6' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>{percent}%</span>
                                </div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#16a34a' }}>✓ {ok} OK</span>
                                    <span style={{ color: fail > 0 ? '#dc2626' : '#64748b' }}>{fail > 0 ? '✕' : ''} {fail} Fallos</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Findings Table */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
                    <TriangleAlert size={20} color="#f59e0b" /> Detalle de Hallazgos y No Conformidades
                </h3>

                {findings.length > 0 ? (
                    <div style={{ marginBottom: '2.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9' }}>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', color: '#475569' }}>#</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', color: '#475569' }}>Categoría / Item</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', color: '#475569' }}>Descripción del Hallazgo</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'center', color: '#475569' }}>Severidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {findings.map((obs, i) => (
                                    <tr key={i} style={{ pageBreakInside: 'avoid' }}>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', fontWeight: 700, color: '#64748b' }}>{i + 1}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem' }}>
                                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{obs.category}</div>
                                        </td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
                                            {obs.description}
                                        </td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 900, padding: '0.2rem 0.5rem', borderRadius: '12px',
                                                background: obs.severity === 'Crítica' ? '#fee2e2' : '#fef9c3',
                                                color: obs.severity === 'Crítica' ? '#dc2626' : '#ca8a04',
                                                border: `1px solid ${obs.severity === 'Crítica' ? '#fca5a5' : '#fde047'}`
                                            }}>
                                                {obs.severity?.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Evidence Photos placed below to avoid table breakout issues */}
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {findings.map((obs, i) => obs.photo && (
                                <div key={`photo-${i}`} style={{ width: '45%', border: '1px solid #e2e8f0', padding: '0.5rem', borderRadius: '8px', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>EVIDENCIA #{i + 1}</div>
                                    <img src={obs.photo} alt={`Evidencia ${i + 1}`} style={{ width: '100%', height: 'auto', borderRadius: '4px' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', marginBottom: '2rem', borderRadius: '8px' }}>
                        <CheckCircle2 size={32} style={{ marginBottom: '0.5rem', opacity: 0.7, margin: '0 auto' }} />
                        <p style={{ margin: 0, fontWeight: 700 }}>No se detectaron hallazgos durante la inspección.</p>
                        <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>El sector cumple con las condiciones mínimas de seguridad.</p>
                    </div>
                )}

                {/* Signatures Section */}
                <div style={{ marginTop: '4rem', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ borderTop: '2px dashed #94a3b8', width: '80%', margin: '0 auto 10px auto' }}></div>
                            <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>OPERADOR</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>Aclaración y Firma</p>
                        </div>

                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ borderTop: '2px dashed #94a3b8', width: '80%', margin: '0 auto 10px auto' }}></div>
                            <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>SUPERVISOR / HYS</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>Validación de Inspección</p>
                        </div>
                    </div>
                </div>

                {/* Footer Print Info */}
                <div style={{ marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', textAlign: 'center', fontSize: '0.6rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    Este documento ha sido generado mediante el Asistente Digital H&S. La información contenida es de carácter confidencial y técnico.
                </div>
            </div>
        </div>
    );
}
