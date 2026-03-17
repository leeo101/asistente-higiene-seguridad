import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Check, X, AlertCircle, AlertTriangle, ShieldCheck, Calendar, User, TrendingUp } from 'lucide-react';

export default function ChecklistPdfGenerator({ checklistData }) {
    const [fullData, setFullData] = useState(null);
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';

    useEffect(() => {
        if (checklistData?.id) {
            const stored = localStorage.getItem(`checklist_${checklistData.id}`);
            if (stored) {
                try {
                    setFullData(JSON.parse(stored));
                } catch (e) {
                    console.error('Error parsing checklist data', e);
                }
            }
        }
    }, [checklistData]);

    if (!checklistData || !fullData) return null;

    const sections = fullData.activeSections || [];
    const compInfo = fullData.companyInfo || {};
    const inspInfo = fullData.inspectionInfo || {};
    const obs = fullData.observations || '';
    const actionPlan = fullData.actionPlan || [];
    const nextReview = fullData.nextReview || '';

    // Calcular estadísticas
    let totalItems = 0;
    let okCount = 0;
    let failCount = 0;
    let naCount = 0;

    sections.forEach(section => {
        section.items.forEach(item => {
            totalItems++;
            if (item.status === 'OK') okCount++;
            else if (item.status === 'FAIL') failCount++;
            else if (item.status === 'NA') naCount++;
        });
    });

    const okPercent = totalItems > 0 ? Math.round((okCount / totalItems) * 100) : 0;
    const failPercent = totalItems > 0 ? Math.round((failCount / totalItems) * 100) : 0;
    const naPercent = totalItems > 0 ? Math.round((naCount / totalItems) * 100) : 0;

    const getSeverityInfo = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critico': return { color: '#dc2626', bg: '#fef2f2', icon: '🔴', label: 'CRÍTICO' };
            case 'alto': return { color: '#ea580c', bg: '#fff7ed', icon: '🟠', label: 'ALTO' };
            case 'medio': return { color: '#ca8a04', bg: '#fefce8', icon: '🟡', label: 'MEDIO' };
            case 'bajo': return { color: '#16a34a', bg: '#f0fdf4', icon: '🟢', label: 'BAJO' };
            default: return { color: '#64748b', bg: '#f8fafc', icon: '⚪', label: 'N/A' };
        }
    };

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="stop-card-pdf-content"
                className="pdf-container card print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '12mm 18mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '12px',
                    boxSizing: 'border-box', margin: '0 auto',
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
                            padding: 8mm !important;
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
                        .gradient-header {
                            background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .gradient-ok {
                            background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%) !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .gradient-fail {
                            background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%) !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .section-header {
                            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    `}
                </style>

                {/* Header Profesional */}
                <div className="gradient-header" style={{ 
                    padding: '1.2rem',
                    borderRadius: '10px',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#ffffff'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <ClipboardCheck size={24} color="#fbbf24" />
                            <h1 style={{ 
                                margin: 0, 
                                fontSize: '18pt', 
                                fontWeight: 900, 
                                textTransform: 'uppercase', 
                                letterSpacing: '-0.5px',
                                lineHeight: 1
                            }}>
                                CHECK LIST
                            </h1>
                        </div>
                        <p style={{ 
                            margin: '4px 0 0 0', 
                            fontSize: '9pt', 
                            color: '#cbd5e1',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Inspección de Seguridad - Higiene y Seguridad
                        </p>
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

                {/* Dashboard de Estadísticas */}
                <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.8rem',
                    marginBottom: '1.2rem'
                }}>
                    {/* Cumple */}
                    <div className="gradient-ok" style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        color: '#ffffff',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', opacity: 0.95 }}>
                            ✅ CUMPLE
                        </div>
                        <div style={{ fontSize: '32pt', fontWeight: 900, lineHeight: 1 }}>
                            {okCount}
                        </div>
                        <div style={{ fontSize: '14pt', fontWeight: 800, opacity: 0.9 }}>
                            {okPercent}%
                        </div>
                    </div>

                    {/* No Cumple */}
                    <div className="gradient-fail" style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        color: '#ffffff',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', opacity: 0.95 }}>
                            ⚠️ NO CUMPLE
                        </div>
                        <div style={{ fontSize: '32pt', fontWeight: 900, lineHeight: 1 }}>
                            {failCount}
                        </div>
                        <div style={{ fontSize: '14pt', fontWeight: 800, opacity: 0.9 }}>
                            {failPercent}%
                        </div>
                    </div>

                    {/* N/A */}
                    <div style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                        color: '#ffffff',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', opacity: 0.95 }}>
                            ➖ N/A
                        </div>
                        <div style={{ fontSize: '32pt', fontWeight: 900, lineHeight: 1 }}>
                            {naCount}
                        </div>
                        <div style={{ fontSize: '14pt', fontWeight: 800, opacity: 0.9 }}>
                            {naPercent}%
                        </div>
                    </div>
                </div>

                {/* Información General */}
                <div style={{ 
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '1.2rem'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        borderBottom: '2px solid #e2e8f0'
                    }}>
                        <div style={{ padding: '0.7rem', background: '#f8fafc' }}>
                            <div style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>
                                🏢 EMPRESA
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '10pt', color: '#1e293b' }}>
                                {compInfo.name || checklistData.empresa || '-'}
                            </div>
                        </div>
                        <div style={{ padding: '0.7rem', borderLeft: '2px solid #e2e8f0' }}>
                            <div style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>
                                📍 UBICACIÓN
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '10pt', color: '#1e293b' }}>
                                {compInfo.location || '-'}
                            </div>
                        </div>
                        <div style={{ padding: '0.7rem', borderLeft: '2px solid #e2e8f0' }}>
                            <div style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>
                                📋 EQUIPO
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '10pt', color: '#2563eb' }}>
                                {inspInfo.item || checklistData.equipo || '-'}
                            </div>
                        </div>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)'
                    }}>
                        <div style={{ padding: '0.7rem', background: '#f8fafc' }}>
                            <div style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>
                                📅 FECHA
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '10pt', color: '#1e293b' }}>
                                {inspInfo.date ? new Date(inspInfo.date + 'T12:00:00Z').toLocaleDateString() : '-'}
                            </div>
                        </div>
                        <div style={{ padding: '0.7rem', borderLeft: '2px solid #e2e8f0' }}>
                            <div style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>
                                👷 INSPECTOR
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '10pt', color: '#1e293b' }}>
                                {compInfo.inspector || '-'}
                            </div>
                        </div>
                        <div style={{ padding: '0.7rem', borderLeft: '2px solid #e2e8f0', background: '#f8fafc' }}>
                            <div style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>
                                📊 TOTAL ÍTEMS
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '10pt', color: '#1e293b' }}>
                                {totalItems}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secciones del Checklist */}
                {sections.map((section, sectionIdx) => {
                    const sectionFails = section.items.filter(i => i.status === 'FAIL');
                    
                    return (
                        <div key={section.id} style={{ 
                            border: '2px solid #e2e8f0',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            marginBottom: '1rem',
                            pageBreakInside: 'avoid'
                        }}>
                            {/* Header de Sección */}
                            <div className="section-header" style={{
                                padding: '0.8rem 1rem',
                                borderBottom: '2px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ 
                                    margin: 0, 
                                    fontSize: '10.5pt', 
                                    fontWeight: 900,
                                    color: '#1e293b',
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span style={{ 
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '9pt',
                                        fontWeight: 900
                                    }}>
                                        {sectionIdx + 1}
                                    </span>
                                    {section.title}
                                </h3>
                                {sectionFails.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.4rem 0.8rem',
                                        background: '#fef2f2',
                                        borderRadius: '20px',
                                        border: '1px solid #fecaca',
                                        color: '#dc2626',
                                        fontSize: '8pt',
                                        fontWeight: 800
                                    }}>
                                        <AlertTriangle size={14} />
                                        {sectionFails.length} NO CONFORME{sectionFails.length > 1 ? 'S' : ''}
                                    </div>
                                )}
                            </div>

                            {/* Ítems */}
                            <div>
                                {section.items.map((item, idx) => {
                                    const severity = item.severity || 'medio';
                                    const sevInfo = getSeverityInfo(severity);
                                    
                                    return (
                                        <div key={idx} style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'auto 1fr auto',
                                            borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid #f1f5f9',
                                            alignItems: 'stretch',
                                            pageBreakInside: 'avoid',
                                            background: item.status === 'FAIL' ? '#fef2f2' : 'transparent'
                                        }}>
                                            {/* Número */}
                                            <div style={{ 
                                                padding: '0.7rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRight: '1px solid #f1f5f9',
                                                minWidth: '35px'
                                            }}>
                                                <div style={{
                                                    background: item.status === 'OK' ? '#16a34a' : 
                                                               item.status === 'FAIL' ? '#dc2626' : '#94a3b8',
                                                    color: '#ffffff',
                                                    width: '26px',
                                                    height: '26px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '7.5pt',
                                                    fontWeight: 900
                                                }}>
                                                    {idx + 1}
                                                </div>
                                            </div>

                                            {/* Texto */}
                                            <div style={{
                                                padding: '0.7rem 1rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.3rem'
                                            }}>
                                                <span style={{
                                                    fontWeight: 700,
                                                    fontSize: '9pt',
                                                    color: '#334155',
                                                    lineHeight: 1.4
                                                }}>
                                                    {item.text}
                                                </span>
                                                {item.observation && (
                                                    <div style={{
                                                        fontSize: '8pt',
                                                        color: '#64748b',
                                                        fontStyle: 'italic',
                                                        paddingLeft: '0.5rem',
                                                        borderLeft: '2px solid #e2e8f0'
                                                    }}>
                                                        💬 {item.observation}
                                                    </div>
                                                )}
                                                {item.status === 'FAIL' && (
                                                    <div style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        padding: '0.25rem 0.5rem',
                                                        background: sevInfo.bg,
                                                        borderRadius: '4px',
                                                        fontSize: '7pt',
                                                        fontWeight: 700,
                                                        color: sevInfo.color,
                                                        alignSelf: 'flex-start',
                                                        marginTop: '0.25rem'
                                                    }}>
                                                        <span>{sevInfo.icon}</span>
                                                        <span>Criticidad: {sevInfo.label}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Estado */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0.7rem',
                                                borderLeft: '1px dotted #e2e8f0',
                                                minWidth: '75px'
                                            }}>
                                                {item.status === 'OK' ? (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        padding: '0.35rem 0.7rem',
                                                        background: '#f0fdf4',
                                                        borderRadius: '6px',
                                                        color: '#16a34a',
                                                        fontWeight: 800,
                                                        fontSize: '7.5pt'
                                                    }}>
                                                        <Check size={16} strokeWidth={3} />
                                                        <span>CUMPLE</span>
                                                    </div>
                                                ) : item.status === 'FAIL' ? (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        padding: '0.35rem 0.7rem',
                                                        background: '#fef2f2',
                                                        borderRadius: '6px',
                                                        color: '#dc2626',
                                                        fontWeight: 800,
                                                        fontSize: '7.5pt'
                                                    }}>
                                                        <X size={16} strokeWidth={3} />
                                                        <span>NO CUMPLE</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '7.5pt', fontWeight: 700, color: '#94a3b8' }}>N/A</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Plan de Acción */}
                {actionPlan && actionPlan.length > 0 && (
                    <div style={{ 
                        border: '2px solid #f59e0b',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        marginBottom: '1rem',
                        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            padding: '0.7rem 1rem',
                            borderBottom: '2px solid #d97706',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertTriangle size={18} color="#ffffff" />
                            <h3 style={{ 
                                margin: 0, 
                                fontSize: '10pt', 
                                fontWeight: 900,
                                color: '#ffffff',
                                textTransform: 'uppercase'
                            }}>
                                🎯 PLAN DE ACCIÓN CORRECTIVAS
                            </h3>
                        </div>
                        
                        <div style={{ padding: '1rem' }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '0.7rem'
                            }}>
                                {actionPlan.map((action, idx) => (
                                    <div key={idx} style={{
                                        background: '#ffffff',
                                        border: '1px solid #fcd34d',
                                        borderRadius: '8px',
                                        padding: '0.8rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <div style={{
                                                minWidth: '22px',
                                                height: '22px',
                                                background: '#f59e0b',
                                                color: '#ffffff',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '7.5pt',
                                                fontWeight: 900,
                                                flexShrink: 0
                                            }}>
                                                {idx + 1}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{
                                                    margin: '0 0 0.4rem 0',
                                                    fontWeight: 700,
                                                    fontSize: '8.5pt',
                                                    color: '#1e293b',
                                                    lineHeight: 1.3
                                                }}>
                                                    {action.action || 'Acción correctiva'}
                                                </p>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '7.5pt' }}>
                                                    {action.responsible && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#475569' }}>
                                                            <User size={10} color="#2563eb" />
                                                            <span><strong>Resp.:</strong> {action.responsible}</span>
                                                        </div>
                                                    )}
                                                    {action.dueDate && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#475569' }}>
                                                            <Calendar size={10} color="#dc2626" />
                                                            <span><strong>Fecha:</strong> {new Date(action.dueDate).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Observaciones */}
                {obs && (
                    <div style={{ 
                        position: 'relative',
                        border: '2px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '1rem',
                        background: '#f8fafc',
                        marginBottom: '1rem',
                        pageBreakInside: 'avoid'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '-10px',
                            left: '1.2rem',
                            background: '#1e293b',
                            color: '#ffffff',
                            padding: '2px 10px',
                            fontSize: '7pt',
                            fontWeight: 900,
                            letterSpacing: '2px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                        }}>
                            OBSERVACIONES
                        </div>
                        <div style={{
                            fontSize: '9pt',
                            color: '#334155',
                            fontWeight: 600,
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6
                        }}>
                            {obs}
                        </div>
                    </div>
                )}

                {/* Firmas */}
                <div style={{
                    marginTop: 'auto',
                    paddingTop: '2.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    pageBreakInside: 'avoid',
                    flexWrap: 'wrap',
                    gap: '2rem'
                }}>
                    <div style={{ textAlign: 'center', width: 'calc(50% - 1rem)', minWidth: '150px' }}>
                        <div style={{ height: '60px' }}></div>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '8pt', color: '#1e293b' }}>
                                OPERADOR / RESPONSABLE
                            </p>
                            <p style={{ margin: 0, fontSize: '7pt', color: '#64748b' }}>
                                Firma y Aclaración
                            </p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', width: 'calc(50% - 1rem)', minWidth: '150px' }}>
                        <div style={{ height: '60px' }}></div>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '8pt', color: '#1e293b' }}>
                                SUPERVISOR H&S
                            </p>
                            <p style={{ margin: 0, fontSize: '7pt', color: '#64748b' }}>
                                Aprobación
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '2rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e2e8f0',
                    fontSize: '7.5pt',
                    color: '#94a3b8',
                    lineHeight: 1.6
                }}>
                    <div style={{
                        fontWeight: 800,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '4px'
                    }}>
                        🛡️ Informe generado electrónicamente
                    </div>
                    <div style={{ color: '#64748b' }}>
                        {new Date().toLocaleDateString('es-AR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric'
                        })} a las {new Date().toLocaleTimeString('es-AR')}
                    </div>
                    <div style={{
                        marginTop: '4px',
                        fontSize: '7pt',
                        color: '#cbd5e1'
                    }}>
                        Asistente H&S - Sistema de Gestión
                    </div>
                </div>

            </div>
        </div>
    );
}
