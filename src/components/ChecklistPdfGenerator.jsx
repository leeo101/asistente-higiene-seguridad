import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Check, X, AlertCircle, AlertTriangle, ShieldCheck, Calendar, User } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

export default function ChecklistPdfGenerator({ checklistData }) {
    const [fullData, setFullData] = useState(null);

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
    const selectedNorms = fullData.selectedNorms || [];

    // Obtener país para filtrar normativas
    const savedPersonalData = localStorage.getItem('personalData');
    const userCountry = savedPersonalData ? JSON.parse(savedPersonalData).country || 'argentina' : 'argentina';

    // Normativas por país (Mercosur + Chile)
    const NORMS_BY_COUNTRY = {
        argentina: [
            { id: 'ley19587', name: 'Ley 19.587 - Higiene y Seguridad en el Trabajo' },
            { id: 'dec351', name: 'Decreto 351/79 - Reglamento General' },
            { id: 'res481', name: 'Res. SRT 481/16 - Estiba y Desestiba' },
            { id: 'res299', name: 'Res. SRT 299/11 - Trabajo en Altura' },
            { id: 'res295', name: 'Res. SRT 295/11 - Espacios Confinados' },
            { id: 'res101', name: 'Res. SRT 101/17 - Soldadura' },
            { id: 'res594', name: 'Res. SRT 594/15 - Agentes Químicos' },
            { id: 'art_reglamento', name: 'Reglamento Interno de ART' }
        ],
        chile: [
            { id: 'dl109', name: 'D.L. 109/1970 - Código del Trabajo' },
            { id: 'dec594', name: 'Decreto 594/1999 - Condiciones Sanitarias' },
            { id: 'dec40', name: 'Decreto 40/1969 - Reglamento Higiene y Seguridad' },
            { id: 'dec32', name: 'Decreto 32/2014 - Elementos Protección Personal' },
            { id: 'ley16744', name: 'Ley 16.744 - Accidentes del Trabajo' },
            { id: 'dec109', name: 'Decreto 109/2012 - Trabajo en Altura' },
            { id: 'dec118', name: 'Decreto 118/2020 - Espacios Confinados' },
            { id: 'mutual', name: 'Reglamento Mutual de Seguridad' }
        ],
        uruguay: [
            { id: 'dec351', name: 'Decreto 351/007 - Reglamento de Higiene y Seguridad' },
            { id: 'ley18320', name: 'Ley 18.320 - Accidentes de Trabajo' },
            { id: 'dec488', name: 'Decreto 488/013 - Trabajo en Altura' },
            { id: 'dec182', name: 'Decreto 182/018 - Espacios Confinados' },
            { id: 'bps', name: 'Normativa BPS - Seguros de Accidentes' }
        ],
        bolivia: [
            { id: 'ley548', name: 'Ley 548 - Código Niña, Niño y Adolescente' },
            { id: 'dec16998', name: 'Decreto Supremo 16998 - Seguridad Industrial' },
            { id: 'dec24266', name: 'Decreto Supremo 24266 - Reglamento Higiene y Seguridad' },
            { id: 'res068', name: 'Res. Min. 068/94 - Salud Ocupacional' },
            { id: 'cnss', name: 'Reglamento CNSS - Seguridad Social' }
        ],
        paraguay: [
            { id: 'ley213', name: 'Ley 213/93 - Seguridad y Salud en el Trabajo' },
            { id: 'dec4234', name: 'Decreto 4.234 - Reglamento General' },
            { id: 'res616', name: 'Res. MTES 616/14 - Trabajo en Altura' },
            { id: 'ips', name: 'Reglamento IPS - Instituto de Previsión Social' }
        ],
        internacional: [
            { id: 'iso45001', name: 'ISO 45001:2018 - Sistema de Gestión SST' },
            { id: 'iso14001', name: 'ISO 14001 - Gestión Ambiental' },
            { id: 'iso9001', name: 'ISO 9001 - Gestión de Calidad' },
            { id: 'nfpa10', name: 'NFPA 10 - Extintores Portátiles' },
            { id: 'nfpa70e', name: 'NFPA 70E - Seguridad Eléctrica' },
            { id: 'oshact', name: 'OSHA Act - Seguridad y Salud Ocupacional' }
        ]
    };

    // Obtener normativas disponibles según el país + internacionales
    const countryNorms = NORMS_BY_COUNTRY[userCountry] || [];
    const internationalNorms = NORMS_BY_COUNTRY.internacional || [];
    const allAvailableNorms = [...countryNorms, ...internationalNorms];

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

                {/* Header - Fixed Grid for Alignment */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 2fr 1fr', 
                    alignItems: 'center', 
                    borderBottom: '4px solid #e2e8f0', 
                    paddingBottom: '1.5rem', 
                    marginBottom: '1.5rem', 
                    width: '100%', 
                    gap: '1.5rem' 
                }}>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e293b' }}>Control H&S</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ 
                            margin: 0, 
                            fontWeight: 900, 
                            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', 
                            letterSpacing: '-0.02em', 
                            textTransform: 'uppercase', 
                            lineHeight: 1, 
                            color: '#1e293b' 
                        }}>CHECK LIST</h1>
                        <p style={{ 
                            margin: 0, 
                            color: '#64748b', 
                            fontWeight: 900, 
                            fontSize: '0.6rem', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.4em', 
                            marginTop: '0.25rem' 
                        }}>Higiene y Seguridad</p>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
                        <CompanyLogo
                            style={{
                                height: '45px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '130px'
                            }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div style={{ 
                                fontSize: '0.6rem', 
                                fontWeight: 900, 
                                color: '#cbd5e1', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.1em', 
                                marginBottom: '0.1rem' 
                            }}>DOCUMENTO N°</div>
                            <div style={{ 
                                fontWeight: 900, 
                                fontSize: '1.5rem', 
                                color: '#1e293b', 
                                borderBottom: '2px solid #e2e8f0', 
                                display: 'inline-block', 
                                paddingBottom: '2px',
                                minWidth: '100px'
                            }}>
                                {inspInfo.serial || checklistData.serial || 'S/N'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard de Estadísticas */}
                <div style={{ 
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    breakInside: 'avoid'
                }}>
                    <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📊 Resumen de Inspección
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#16a34a' }}>CUMPLE: {okPercent}%</span>
                            </div>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${okPercent}%`, height: '100%', background: '#16a34a', transition: 'width 0.3s' }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#dc2626' }}>NO CUMPLE: {failPercent}%</span>
                            </div>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${failPercent}%`, height: '100%', background: '#dc2626', transition: 'width 0.3s' }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>N/A: {naPercent}%</span>
                            </div>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${naPercent}%`, height: '100%', background: '#64748b', transition: 'width 0.3s' }}></div>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap',
                        gap: '1rem', 
                        paddingTop: '0.75rem', 
                        marginTop: '0.75rem',
                        borderTop: '1px solid #f1f5f9',
                        fontSize: '0.7rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontWeight: 700 }}>
                            <span>Total Ítems: {totalItems}</span>
                        </div>
                        {nextReview && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontWeight: 700 }}>
                                <span>Próxima Revisión: {new Date(nextReview).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Information Box */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1.5rem', width: '100%', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', borderBottom: '1px solid #e2e8f0', width: '100%' }}>
                        <div style={{ padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>CLIENTE / EMPRESA</span>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>{compInfo.name || checklistData.empresa || '-'}</span>
                        </div>
                        <div style={{ padding: '0.6rem 0.8rem', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>CUIT / CUIL</span>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>{compInfo.cuit || '-'}</span>
                        </div>
                        <div style={{ padding: '0.6rem 0.8rem', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>UBICACIÓN / OBRA</span>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>{compInfo.location || '-'}</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', width: '100%' }}>
                        <div style={{ padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '2px', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>EQUIPO REVISADO</span>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#2563eb' }}>{inspInfo.item || checklistData.equipo || '-'}</span>
                        </div>
                        <div style={{ padding: '0.6rem 0.8rem', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>FECHA REVISIÓN</span>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>{inspInfo.date || new Date().toLocaleDateString()}</span>
                        </div>
                        <div style={{ padding: '0.6rem 0.8rem', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>INSPECTOR</span>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>{compInfo.inspector || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Sections con items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {sections.map((section) => (
                        <div key={section.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', breakInside: 'auto' }}>
                            <div style={{ 
                                background: '#f8fafc', 
                                padding: '0.6rem 1rem', 
                                borderBottom: '1px solid #e2e8f0', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                breakInside: 'avoid' 
                            }}>
                                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', color: '#1e293b' }}>
                                    {section.title}
                                </h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {section.items.map((item, idx) => {
                                    const sevInfo = getSeverityInfo(item.severity || 'medio');
                                    return (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid #f1f5f9',
                                            alignItems: 'center',
                                            breakInside: 'avoid',
                                            background: item.status === 'FAIL' ? '#fff1f2' : 'transparent',
                                            padding: '0.6rem 1rem'
                                        }}>
                                            <div style={{ 
                                                fontSize: '0.65rem', 
                                                fontWeight: 800, 
                                                color: '#cbd5e1',
                                                width: '24px',
                                                flexShrink: 0
                                            }}>{idx + 1}</div>
                                            
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>
                                                    {item.text}
                                                </span>
                                                {item.status === 'FAIL' && (
                                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: sevInfo.color, textTransform: 'uppercase' }}>
                                                        {sevInfo.icon} CRITICIDAD: {sevInfo.label}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div style={{ 
                                                minWidth: '80px', 
                                                textAlign: 'center', 
                                                fontSize: '0.7rem', 
                                                fontWeight: 800,
                                                color: item.status === 'OK' ? '#16a34a' : item.status === 'FAIL' ? '#dc2626' : '#94a3b8'
                                            }}>
                                                {item.status === 'OK' ? 'CUMPLE' : item.status === 'FAIL' ? 'NO CUMPLE' : 'N/A'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* PLAN DE ACCIÓN */}
                {actionPlan.length > 0 && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '2rem', background: '#fff', breakInside: 'auto' }}>
                        <div style={{ background: '#f8fafc', padding: '0.6rem 1rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 Plan de Acción Correctiva</div>
                        <div style={{ padding: '0.8rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.6rem' }}>
                            {actionPlan.map((action, idx) => (
                                <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem', breakInside: 'avoid' }}>
                                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                                        <span style={{ background: '#1e293b', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>{idx + 1}</span>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 0.3rem 0', fontWeight: 700, fontSize: '0.75rem', color: '#334155' }}>{action.action}</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>
                                                {action.responsible && <span>👤 {action.responsible}</span>}
                                                {action.dueDate && <span style={{ color: '#dc2626' }}>📅 {new Date(action.dueDate).toLocaleDateString()}</span>}
                                                <span style={{ color: getSeverityInfo(action.priority).color }}>{getSeverityInfo(action.priority).icon} {action.priority.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* NORMATIVA */}
                {selectedNorms.length > 0 && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '2rem', background: '#fff', breakInside: 'auto' }}>
                        <div style={{ background: '#f8fafc', padding: '0.6rem 1rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📚 Normativa Legal Aplicable</div>
                        <div style={{ padding: '0.8rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.4rem' }}>
                            {selectedNorms.map(normId => {
                                const norm = allAvailableNorms.find(n => n.id === normId);
                                if (!norm) return null;
                                return (
                                    <div key={normId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #e2e8f0', breakInside: 'avoid' }}>
                                        <div style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 900 }}>✓</div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>{norm.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Observations */}
                {obs && (
                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#f8fafc', marginBottom: '2rem', breakInside: 'avoid' }}>
                        <div style={{ position: 'absolute', top: '-10px', left: '1rem', background: '#1e293b', color: '#ffffff', padding: '2px 8px', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '1px', borderRadius: '4px' }}>OBSERVACIONES</div>
                        <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                            {obs}
                        </div>
                    </div>
                )}

                {/* Signatures */}
                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-around', breakInside: 'avoid', gap: '2rem' }}>
                    <div style={{ textAlign: 'center', flex: 1, maxWidth: '200px' }}>
                        <div style={{ height: '40px' }}></div>
                        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '4px' }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', color: '#1e293b' }}>OPERADOR / RESPONSABLE</p>
                            <p style={{ margin: 0, fontSize: '0.55rem', color: '#94a3b8', fontWeight: 700 }}>{compInfo.inspector || ' '}</p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', flex: 1, maxWidth: '200px' }}>
                        <div style={{ height: '40px' }}></div>
                        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '4px' }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', color: '#1e293b' }}>SUPERVISOR H&S</p>
                            <p style={{ margin: 0, fontSize: '0.55rem', color: '#94a3b8', fontWeight: 700 }}>Firma y Aclaración</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '4rem', 
                    paddingTop: '1rem',
                    borderTop: '1px solid #f1f5f9',
                    fontSize: '0.6rem', 
                    color: '#94a3b8',
                    fontWeight: 700
                }}>
                    <p style={{ margin: '0 0 0.3rem 0', color: '#64748b' }}>
                        Generado por Asistente H&S - Gestión Profesional de Seguridad e Higiene
                    </p>
                    <p style={{ margin: 0 }}>
                        {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
