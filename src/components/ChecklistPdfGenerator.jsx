import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Check, X, AlertCircle, AlertTriangle, ShieldCheck, Calendar, User } from 'lucide-react';

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
                            border: none !important;
                            border-radius: 0 !important;
                        }
                        .company-logo {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        @media (max-width: 768px) {
                            .print-area { padding: 10mm !important; }
                            .responsive-grid { grid-template-columns: 1fr !important; }
                            .hide-mobile { display: none !important; }
                        }
                    `}
                </style>

                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '1.5rem', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e293b' }}>Control H&S</p>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minWidth: '150px' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#1e293b' }}>CHECK LIST</h1>
                        <p style={{ margin: 0, color: '#64748b', fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '0.25rem' }}>Higiene y Seguridad</p>
                    </div>

                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '150px' }}>
                        {companyLogo && showLogo && (
                            <img
                                className="company-logo"
                                src={companyLogo}
                                alt="Logo de empresa"
                                style={{
                                    height: '40px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    maxWidth: '120px'
                                }}
                            />
                        )}
                        <div>
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>DOCUMENTO N°</div>
                            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', borderBottom: '2px solid #e2e8f0', display: 'inline-block', paddingBottom: '2px' }}>{inspInfo.serial || checklistData.serial || 'S/N'}</div>
                        </div>
                    </div>
                </div>

                {/* Dashboard de Estadísticas - NUEVO */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        📊 RESUMEN DE INSPECCIÓN
                    </h2>
                    
                    {/* Barras de progreso */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>✅ CONFORMES</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#16a34a' }}>{okPercent}%</span>
                            </div>
                            <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${okPercent}%`, height: '100%', background: 'linear-gradient(90deg, #16a34a, #22c55e)', transition: 'width 0.3s' }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>⚠️ NO CONFORMES</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#dc2626' }}>{failPercent}%</span>
                            </div>
                            <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${failPercent}%`, height: '100%', background: 'linear-gradient(90deg, #dc2626, #ef4444)', transition: 'width 0.3s' }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>➖ N/A</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b' }}>{naPercent}%</span>
                            </div>
                            <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${naPercent}%`, height: '100%', background: 'linear-gradient(90deg, #64748b, #94a3b8)', transition: 'width 0.3s' }}></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Info adicional */}
                    <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap',
                        gap: '1rem', 
                        paddingTop: '1rem', 
                        borderTop: '1px solid #e2e8f0',
                        fontSize: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569' }}>
                            <ClipboardCheck size={16} color="#2563eb" />
                            <span><strong>Total Ítems:</strong> {totalItems}</span>
                        </div>
                        {nextReview && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569' }}>
                                <Calendar size={16} color="#f59e0b" />
                                <span><strong>Próxima Revisión:</strong> {new Date(nextReview).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Information Box - Responsive */}
                <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem', width: '100%', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', borderBottom: '2px solid #e2e8f0', width: '100%' }} className="responsive-grid">
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>CLIENTE / EMPRESA</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.name || checklistData.empresa || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>CUIT / CUIL</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.cuit || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>UBICACIÓN / OBRA</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.location || '-'}</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', width: '100%' }} className="responsive-grid">
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>EQUIPO REVISADO</span>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2563eb' }}>{inspInfo.item || checklistData.equipo || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>FECHA REVISIÓN</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{inspInfo.date || new Date().toLocaleDateString()}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>INSPECTOR</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.inspector || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Sections con items enriquecidos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    {sections.map((section, sectionIdx) => {
                        const sectionFails = section.items.filter(i => i.status === 'FAIL');
                        return (
                            <div key={section.id} style={{ border: '2px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                                <div style={{ 
                                    background: sectionFails.length > 0 ? 'linear-gradient(135deg, #fef2f2, #fee2e2)' : 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                                    padding: '1rem', 
                                    borderBottom: '2px solid #e2e8f0', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap'
                                }}>
                                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {sectionIdx === 0 ? <ShieldCheck size={20} color="#2563eb" /> : <AlertCircle size={20} color="#f59e0b" />}
                                        {section.title}
                                    </h3>
                                    {sectionFails.length > 0 && (
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem',
                                            padding: '0.4rem 0.8rem',
                                            background: '#dc2626',
                                            color: '#ffffff',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800
                                        }}>
                                            <AlertTriangle size={14} />
                                            {sectionFails.length} NO CONFORME{sectionFails.length > 1 ? 'S' : ''}
                                        </div>
                                    )}
                                </div>
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
                                                {/* Número de ítem */}
                                                <div style={{ 
                                                    padding: '0.8rem', 
                                                    display: 'flex', 
                                                    justifyContent: 'center', 
                                                    alignItems: 'center',
                                                    borderRight: '1px solid #f1f5f9',
                                                    minWidth: '40px'
                                                }}>
                                                    <div style={{ 
                                                        background: item.status === 'OK' ? '#16a34a' : item.status === 'FAIL' ? '#dc2626' : '#94a3b8',
                                                        color: '#ffffff',
                                                        width: '28px', 
                                                        height: '28px', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        borderRadius: '50%', 
                                                        fontSize: '0.7rem', 
                                                        fontWeight: 900
                                                    }}>
                                                        {idx + 1}
                                                    </div>
                                                </div>
                                                
                                                {/* Texto del ítem con observación */}
                                                <div style={{ 
                                                    padding: '0.8rem 1rem', 
                                                    display: 'flex', 
                                                    flexDirection: 'column',
                                                    gap: '0.3rem'
                                                }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                                                        {item.text}
                                                    </span>
                                                    {item.observation && (
                                                        <div style={{ 
                                                            fontSize: '0.75rem', 
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
                                                            padding: '0.3rem 0.6rem',
                                                            background: sevInfo.bg,
                                                            borderRadius: '4px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                            color: sevInfo.color,
                                                            alignSelf: 'flex-start',
                                                            marginTop: '0.3rem'
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
                                                    padding: '0.8rem',
                                                    borderLeft: '1px dotted #e2e8f0',
                                                    minWidth: '80px'
                                                }}>
                                                    {item.status === 'OK' ? (
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '0.3rem',
                                                            padding: '0.4rem 0.8rem',
                                                            background: '#f0fdf4',
                                                            borderRadius: '6px',
                                                            color: '#16a34a',
                                                            fontWeight: 800,
                                                            fontSize: '0.75rem'
                                                        }}>
                                                            <Check size={18} strokeWidth={3} />
                                                            <span className="hide-mobile">CUMPLE</span>
                                                        </div>
                                                    ) : item.status === 'FAIL' ? (
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '0.3rem',
                                                            padding: '0.4rem 0.8rem',
                                                            background: '#fef2f2',
                                                            borderRadius: '6px',
                                                            color: '#dc2626',
                                                            fontWeight: 800,
                                                            fontSize: '0.75rem'
                                                        }}>
                                                            <X size={18} strokeWidth={3} />
                                                            <span className="hide-mobile">NO CUMPLE</span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>N/A</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* PLAN DE ACCIÓN - NUEVO */}
                {actionPlan && actionPlan.length > 0 && (
                    <div style={{ 
                        border: '2px solid #f59e0b', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(135deg, #fffbeb, #fef3c7)'
                    }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            padding: '1rem', 
                            borderBottom: '2px solid #d97706',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertTriangle size={20} color="#ffffff" />
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem', color: '#ffffff', textTransform: 'uppercase' }}>
                                🎯 PLAN DE ACCIÓN CORRECTIVAS
                            </h3>
                        </div>
                        
                        <div style={{ padding: '1rem' }}>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '0.8rem'
                            }}>
                                {actionPlan.map((action, idx) => (
                                    <div key={idx} style={{
                                        background: '#ffffff',
                                        border: '1px solid #fcd34d',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <div style={{ 
                                                minWidth: '24px', 
                                                height: '24px', 
                                                background: '#f59e0b',
                                                color: '#ffffff',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 900,
                                                flexShrink: 0
                                            }}>
                                                {idx + 1}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ 
                                                    margin: '0 0 0.5rem 0', 
                                                    fontWeight: 700, 
                                                    fontSize: '0.85rem', 
                                                    color: '#1e293b',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {action.action || 'Acción correctiva'}
                                                </p>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem' }}>
                                                    {action.responsible && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#475569' }}>
                                                            <User size={12} color="#2563eb" />
                                                            <span><strong>Resp.:</strong> {action.responsible}</span>
                                                        </div>
                                                    )}
                                                    {action.dueDate && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#475569' }}>
                                                            <Calendar size={12} color="#dc2626" />
                                                            <span><strong>Fecha:</strong> {new Date(action.dueDate).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                    {action.priority && (
                                                        <div style={{ 
                                                            display: 'inline-block',
                                                            padding: '0.2rem 0.5rem',
                                                            background: getSeverityInfo(action.priority).bg,
                                                            color: getSeverityInfo(action.priority).color,
                                                            borderRadius: '4px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                            marginTop: '0.3rem'
                                                        }}>
                                                            {getSeverityInfo(action.priority).icon} {getSeverityInfo(action.priority).label}
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

                {/* Observations */}
                {obs && (
                    <div style={{ position: 'relative', border: '2px solid #cbd5e1', borderRadius: '12px', padding: '1.5rem', background: '#f8fafc', marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                        <div style={{ position: 'absolute', top: '-10px', left: '1.5rem', background: '#1e293b', color: '#ffffff', padding: '2px 10px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', borderRadius: '4px' }}>OBSERVACIONES</div>
                        <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600, whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {obs}
                        </div>
                    </div>
                )}

                {/* Signatures - Responsive */}
                <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid', flexWrap: 'wrap', gap: '2rem' }}>
                    <div style={{ textAlign: 'center', width: 'calc(50% - 1rem)', minWidth: '150px' }}>
                        <div style={{ height: '60px' }}></div>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>OPERADOR / RESPONSABLE</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Firma y Aclaración</p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', width: 'calc(50% - 1rem)', minWidth: '150px' }}>
                        <div style={{ height: '60px' }}></div>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>SUPERVISOR H&S</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Aprobación</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '2rem', 
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    fontSize: '0.65rem', 
                    color: '#64748b',
                    lineHeight: '1.6'
                }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Asistente H&S - Sistema de Gestión de Higiene y Seguridad
                    </p>
                    <p style={{ margin: 0 }}>
                        Documento generado electrónicamente el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
