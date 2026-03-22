import React from 'react';
import { ClipboardCheck, Check, X, AlertTriangle, Calendar, Info } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

export default function ChecklistPdfGenerator({ 
    checklistData, 
    showSignatures = { operator: true, supervisor: true, professional: true },
    isHeadless = false
}: { 
    checklistData: any, 
    showSignatures?: { operator: boolean, supervisor: boolean, professional: boolean },
    isHeadless?: boolean
}): React.ReactElement | null {
    if (!checklistData) return null;

    const fullData = checklistData;
    const sections = fullData.activeSections || [];
    const compInfo = fullData.companyInfo || {};
    const inspInfo = fullData.inspectionInfo || {};
    const obs = fullData.observations || '';
    const actionPlan = fullData.actionPlan || [];
    const nextReview = fullData.nextReview || '';
    const selectedNorms = fullData.selectedNorms || [];
        const availableNorms = fullData.availableNorms || [];

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
                    `}
                </style>

                {/* Header - Igual que ATS */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e293b' }}>Control H&S</p>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.5rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#1e293b' }}>CHECK LIST</h1>
                        <p style={{ margin: 0, color: '#64748b', fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '0.25rem' }}>Higiene y Seguridad</p>
                    </div>

                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <CompanyLogo
                            style={{
                                height: '40px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '120px'
                            }}
                        />
                        <div>
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>DOCUMENTO N°</div>
                            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b' }}>{inspInfo.serial || 'S/N'}</div>
                        </div>
                    </div>
                </div>

                {/* Primary Info Box - Igual que ATS */}
                <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: '2.5rem', width: '100%', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: '2px solid #e2e8f0', width: '100%' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>CLIENTE / EMPRESA</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.name || checklistData.empresa || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>CUIT / CUIL</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.cuit || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>UBICACIÓN / OBRA</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.location || '-'}</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', width: '100%' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>EQUIPO REVISADO</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{inspInfo.item || checklistData.equipo || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>FECHA REVISIÓN</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{inspInfo.date ? new Date(inspInfo.date + 'T12:00:00Z').toLocaleDateString() : '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>INSPECTOR</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{compInfo.inspector || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Resumen de Estadísticas */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '1rem', 
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        background: '#f0fdf4',
                        border: '2px solid #16a34a',
                        borderRadius: '8px',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginBottom: '0.5rem' }}>CUMPLE</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>{okCount}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>{okPercent}%</div>
                    </div>
                    
                    <div style={{
                        background: '#fef2f2',
                        border: '2px solid #dc2626',
                        borderRadius: '8px',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', marginBottom: '0.5rem' }}>NO CUMPLE</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>{failCount}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>{failPercent}%</div>
                    </div>
                    
                    <div style={{
                        background: '#f8fafc',
                        border: '2px solid #64748b',
                        borderRadius: '8px',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>N/A</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#64748b', lineHeight: 1 }}>{naCount}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#64748b' }}>{naPercent}%</div>
                    </div>
                </div>

                {/* Sections - Checklist Items */}
                {sections.map((section, sectionIdx) => {
                    const sectionFails = section.items.filter(item => item.status === 'FAIL');
                    return (
                        <div key={section.id} style={{ 
                            border: '2px solid #e2e8f0', 
                            borderRadius: '12px', 
                            overflow: 'hidden', 
                            marginBottom: '1.5rem',
                            pageBreakInside: 'avoid'
                        }}>
                            <div style={{ 
                                background: '#f8fafc', 
                                padding: '1rem', 
                                borderBottom: '2px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ 
                                    margin: 0, 
                                    fontWeight: 900, 
                                    fontSize: '1.1rem', 
                                    color: '#1e293b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {section.title}
                                </h3>
                                {sectionFails.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.4rem 0.8rem',
                                        background: '#fef2f2',
                                        borderRadius: '20px',
                                        border: '1px solid #fecaca',
                                        color: '#dc2626',
                                        fontSize: '0.75rem',
                                        fontWeight: 800
                                    }}>
                                        <AlertTriangle size={14} color="#dc2626" />
                                        {sectionFails.length} NO CONFORME{sectionFails.length > 1 ? 'S' : ''}
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                {section.items.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '40px 1fr 100px',
                                        borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid #f1f5f9',
                                        alignItems: 'stretch',
                                        pageBreakInside: 'avoid',
                                        background: item.status === 'FAIL' ? '#fef2f2' : 'transparent'
                                    }}>
                                        {/* Número */}
                                        <div style={{ 
                                            padding: '0.8rem', 
                                            display: 'flex', 
                                            justifyContent: 'center', 
                                            alignItems: 'center',
                                            borderRight: '1px solid #f1f5f9'
                                        }}>
                                            <div style={{ 
                                                background: '#f8fafc',
                                                color: '#94a3b8',
                                                border: '1px solid #e2e8f0',
                                                width: '24px', 
                                                height: '24px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                borderRadius: '6px',
                                                fontSize: '0.65rem', 
                                                fontWeight: 900 
                                            }}>
                                                {idx + 1}
                                            </div>
                                        </div>
                                        
                                        {/* Texto del item */}
                                        <div style={{ 
                                            padding: '0.8rem 1rem', 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            color: '#334155'
                                        }}>
                                            {item.text}
                                        </div>
                                        
                                        {/* Estado */}
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            padding: '0.8rem',
                                            borderLeft: '1px dotted #e2e8f0'
                                        }}>
                                            {item.status === 'OK' ? (
                                                <Check size={20} color="#16a34a" strokeWidth={3} />
                                            ) : item.status === 'FAIL' ? (
                                                <X size={20} color="#dc2626" strokeWidth={3} />
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8' }}>N/A</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Observations */}
                {obs && (
                    <div style={{
                        position: 'relative',
                        border: '2px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        background: '#f8fafc',
                        marginBottom: '2rem',
                        pageBreakInside: 'avoid'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '-10px',
                            left: '1.5rem',
                            background: '#1e293b',
                            color: '#ffffff',
                            padding: '2px 10px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            letterSpacing: '2px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                        }}>OBSERVACIONES</div>
                        <div style={{
                            fontSize: '0.9rem',
                            color: '#334155',
                            fontWeight: 700,
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.5
                        }}>
                            {obs}
                        </div>
                    </div>
                )}

                {/* PLAN DE ACCIÓN - PRINTABLE */}
                {actionPlan.length > 0 && (
                    <div style={{ border: '2px solid #f59e0b', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', background: '#fffbeb', pageBreakInside: 'avoid' }}>
                        <div style={{ background: '#f59e0b', padding: '0.8rem 1.2rem', color: '#fff', fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase' }}>🎯 Plan de Acción Correctiva</div>
                        <div style={{ padding: '1.2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            {actionPlan.map((action, idx) => (
                                <div key={action.id} style={{ background: '#fff', border: '1px solid #fcd34d', borderRadius: '8px', padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                                        <span style={{ background: '#f59e0b', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, flexShrink: 0 }}>{idx + 1}</span>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 0.4rem 0', fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{action.action}</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                                                {action.responsible && <span>👤 Resp: {action.responsible}</span>}
                                                {action.dueDate && <span>📅 Vence: {new Date(action.dueDate).toLocaleDateString()}</span>}
                                                <span style={{ color: action.priority === 'critico' ? '#dc2626' : action.priority === 'alto' ? '#ea580c' : '#ca8a04' }}>🔥 {action.priority.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PRÓXIMA REVISIÓN - PRINTABLE */}
                {nextReview && (
                    <div style={{ border: '2px solid #3b82f6', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', background: '#eff6ff', pageBreakInside: 'avoid' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <Calendar size={24} color="#2563eb" />
                            <div>
                                <p style={{ margin: 0, fontWeight: 900, fontSize: '0.85rem', color: '#1e3a8a', textTransform: 'uppercase' }}>Próxima Revisión Programada</p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 800, color: '#1e40af' }}>{new Date(nextReview).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* NORMATIVA - PRINTABLE */}
                {selectedNorms.length > 0 && (
                    <div style={{ border: '2px solid #a855f7', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', background: '#faf5ff', pageBreakInside: 'avoid' }}>
                        <div style={{ background: '#a855f7', padding: '0.8rem 1.2rem', color: '#fff', fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase' }}>📚 Normativa Legal Aplicable</div>
                        <div style={{ padding: '1.2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.6rem' }}>
                            {selectedNorms.map(normId => {
                                const norm = availableNorms.find(n => n.id === normId);
                                if (!norm) return null;
                                return (
                                    <div key={normId} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#fff', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                                        <div style={{ width: '18px', height: '18px', background: '#a855f7', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900 }}>✓</div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{norm.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Signatures - Igual que ATS */}
                <div style={{ marginTop: 'auto', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid', gap: '2rem' }}>
                    {showSignatures.operator && (
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                                <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>OPERADOR / RESPONSABLE</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b' }}>Firma y Aclaración</p>
                            </div>
                        </div>
                    )}

                    {showSignatures.supervisor && (
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                                <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>SUPERVISOR H&S</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b' }}>Aprobación</p>
                            </div>
                        </div>
                    )}

                    {showSignatures.professional && (
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                                <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>PROFESIONAL ACTUANTE</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b' }}>Sello y Firma</p>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    Documento certificado según normativas de seguridad industrial.
                </div>

            </div>
        </div>
    );
}
