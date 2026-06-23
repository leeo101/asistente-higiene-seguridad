import React from 'react';
import { ClipboardCheck, Check, X, AlertTriangle, Calendar, MapPin, User, Building2, Hash, Activity } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function ChecklistPdfGenerator({
    checklistData,
    showSignatures = { operator: true, supervisor: true, professional: true },
    isHeadless = false,
    pdfElementId = 'pdf-content'
}: {
    checklistData: any,
    showSignatures?: { operator: boolean, supervisor: boolean, professional: boolean },
    isHeadless?: boolean,
    pdfElementId?: string
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

    // Firmas desde localStorage (fallback pro)
    let actSignature = fullData.professionalSignature || null;
    let actName = fullData.professionalName || null;
    let actLic = fullData.professionalLicense || null;
    let actStamp = fullData.professionalStamp || null;

    if (!actSignature) {
        try {
            const lsPersonal = localStorage.getItem('personalData');
            const lsStamp = localStorage.getItem('signatureStampData');
            const legacySig = localStorage.getItem('capturedSignature');
            if (lsStamp) {
                const parsed = JSON.parse(lsStamp);
                actSignature = parsed.signature;
                actStamp = parsed.stamp;
            }
            else if (legacySig) { actSignature = legacySig; }
            if (lsPersonal) {
                const pd = JSON.parse(lsPersonal);
                actName = actName || pd.name;
                actLic = actLic || pd.license;
            }
        } catch (e) { }
    }

    // Calcular estadísticas
    let totalItems = 0, okCount = 0, failCount = 0, naCount = 0;
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
    const hasCritical = failCount > 0;

    const activeIds = sections.map((s: any) => s.id);
    const hasTools = activeIds.some((id: string) => ['manual_tools', 'electric_tools', 'circular_saw', 'grinder'].includes(id));
    const hasVehicles = activeIds.includes('autoelevadores');
    const hasPermits = activeIds.some((id: string) => ['espacios_confinados', 'trabajos_caliente', 'trabajos_altura'].includes(id));
    const hasHeavy = activeIds.some((id: string) => ['scaffolding', 'izaje_gruas'].includes(id));
    const hasExtinguishers = activeIds.includes('extintores_checklist');
    return (
        <div
            id={pdfElementId}
            className="pdf-container print-area"
            style={{
                width: '100%', maxWidth: '210mm', minHeight: '297mm',
                padding: '8mm 12mm', background: '#ffffff', color: '#1e293b',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                boxSizing: 'border-box', margin: '0 auto', fontSize: '8pt',
                fontFamily: 'Helvetica, Arial, sans-serif',
                borderTop: hasCritical ? '12px solid #dc2626' : '12px solid #2563eb'
            }}
        >
            <style type="text/css" media="print">
                {`
                    @page { size: A4 portrait; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                    .no-print { display: none !important; }
                    .print-area {
                        box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                        width: 100% !important; max-width: none !important;
                        border-top: ${hasCritical ? '12px solid #dc2626' : '12px solid #2563eb'} !important;
                        border-radius: 0 !important; min-height: 0 !important; height: auto !important;
                    }
                `}
            </style>

            {/* Header Tripartito */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '0.8rem', marginBottom: '1rem', width: '100%' }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de Gestión HSE</p>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: hasCritical ? '#dc2626' : '#2563eb' }}>Doc. Inspección de Seguridad</p>
                </div>

                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.4rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>{checklistData.checklistTitle || 'CHECK LIST'}</h1>
                    <div style={{ marginTop: '0.3rem', background: hasCritical ? '#dc2626' : '#3b82f6', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                        {hasCritical ? `⚠ ${failCount} NO CONFORMIDAD${failCount > 1 ? 'ES' : ''} DETECTADA${failCount > 1 ? 'S' : ''}` : 'INSPECCIÓN DE HIGIENE Y SEGURIDAD'}
                    </div>
                </div>

                <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <CompanyLogo style={{ height: '38px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }} />
                    {inspInfo.serial && (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>DOC N°</div>
                            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1e293b' }}>{inspInfo.serial}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Datos del Relevamiento */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1rem', width: '100%',  }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <div style={{ padding: '0.4rem 0.6rem', borderRight: '1px solid #cbd5e1' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Building2 size={12}/> CLIENTE / EMPRESA</span>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.2rem' }}>{compInfo.name || checklistData.empresa || '-'}</div>
                    </div>
                    <div style={{ padding: '0.4rem 0.6rem', borderRight: '1px solid #cbd5e1' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Hash size={12}/> CUIT / CUIL</span>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginTop: '0.2rem' }}>{compInfo.cuit || '-'}</div>
                    </div>
                    <div style={{ padding: '0.4rem 0.6rem' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={12}/> UBICACIÓN / OBRA</span>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginTop: '0.2rem' }}>{compInfo.location || '-'}</div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
                    {!(hasVehicles && !hasTools && !hasPermits && !hasHeavy && !hasExtinguishers) && (
                        <div style={{ padding: '0.4rem 0.6rem', borderRight: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><ClipboardCheck size={12}/> {hasPermits ? "SECTOR / ÁREA" : "EQUIPO / ÁREA REVISADA"}</span>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.2rem' }}>{inspInfo.item || checklistData.equipo || '-'}</div>
                        </div>
                    )}
                    <div style={{ padding: '0.4rem 0.6rem', borderRight: '1px solid #cbd5e1' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12}/> FECHA DE REVISIÓN</span>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginTop: '0.2rem' }}>{inspInfo.date ? new Date(inspInfo.date + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}</div>
                    </div>
                    <div style={{ padding: '0.4rem 0.6rem' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={12}/> INSPECTOR</span>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', marginTop: '0.2rem' }}>{compInfo.inspector || '-'}</div>
                    </div>
                </div>
                
                {hasVehicles && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                        <div style={{ padding: '0.4rem 0.6rem', borderRight: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><ClipboardCheck size={12}/> MARCA / MODELO</span>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.2rem' }}>{inspInfo.marca || '-'}</div>
                        </div>
                        <div style={{ padding: '0.4rem 0.6rem', borderRight: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Hash size={12}/> DOMINIO (PATENTE)</span>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.2rem' }}>{inspInfo.patente || '-'}</div>
                        </div>
                        <div style={{ padding: '0.4rem 0.6rem' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Activity size={12}/> HORÓMETRO / KM</span>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.2rem' }}>{inspInfo.horometro || '-'}</div>
                        </div>
                    </div>
                )}

                {(hasTools || hasHeavy) && !hasVehicles && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                        <div style={{ padding: '0.4rem 0.6rem', borderRight: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><ClipboardCheck size={12}/> MARCA / MODELO</span>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.2rem' }}>{inspInfo.marca || '-'}</div>
                        </div>
                        <div style={{ padding: '0.4rem 0.6rem' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Hash size={12}/> {hasExtinguishers ? "CHAPA / NÚMERO" : "Nº IDENTIFICACIÓN (SERIAL)"}</span>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.2rem' }}>{inspInfo.serial || '-'}</div>
                        </div>
                    </div>
                )}

                {(!hasTools && !hasHeavy && !hasVehicles && !hasPermits) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                        <div style={{ padding: '0.4rem 0.6rem' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Hash size={12}/> {hasExtinguishers ? "CHAPA / NÚMERO" : "Nº IDENTIFICACIÓN (SERIAL)"}</span>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.2rem' }}>{inspInfo.serial || '-'}</div>
                        </div>
                    </div>
                )}

                {hasPermits && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                        <div style={{ padding: '0.4rem 0.6rem', borderRight: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><ClipboardCheck size={12}/> Nº PERMISO DE TRABAJO (PT)</span>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.2rem' }}>{inspInfo.pt || '-'}</div>
                        </div>
                        <div style={{ padding: '0.4rem 0.6rem' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={12}/> RESPONSABLE DEL ÁREA</span>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.2rem' }}>{inspInfo.responsableArea || '-'}</div>
                        </div>
                    </div>
                )}

                {hasExtinguishers && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', background: '#fef2f2', borderTop: '1px solid #cbd5e1' }}>
                        <div style={{ padding: '0.4rem 0.6rem', borderRight: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12}/> VENCIMIENTO CARGA (EXTINTOR)</span>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#7f1d1d', marginTop: '0.2rem' }}>{inspInfo.expirationDate ? new Date(inspInfo.expirationDate + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}</div>
                        </div>
                        <div style={{ padding: '0.4rem 0.6rem' }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={12}/> OBSERVACIONES EXTINTOR</span>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#7f1d1d', marginTop: '0.2rem' }}>{inspInfo.extinguisherObs || '-'}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Resumen Estadístico - Cards modernas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1rem' }}>
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>✓ CUMPLE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d', lineHeight: 1 }}>{okCount}</div>
                    <div style={{ marginTop: '0.2rem', background: '#16a34a', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900, display: 'inline-block' }}>{okPercent}%</div>
                </div>
                <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>✗ NO CUMPLE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#b91c1c', lineHeight: 1 }}>{failCount}</div>
                    <div style={{ marginTop: '0.2rem', background: '#dc2626', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900, display: 'inline-block' }}>{failPercent}%</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>— N / A</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#475569', lineHeight: 1 }}>{naCount}</div>
                    <div style={{ marginTop: '0.2rem', background: '#64748b', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900, display: 'inline-block' }}>{naPercent}%</div>
                </div>
            </div>

            {/* Secciones del Checklist */}
            {sections.map((section, sectionIdx) => {
                const sectionFails = section.items.filter(item => item.status === 'FAIL');
                return (
                    <div key={section.id} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '0.8rem' }}>
                        <div style={{ background: '#e2e8f0', padding: '0.4rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #cbd5e1' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {section.title}
                            </h3>
                            {sectionFails.length > 0 ? (
                                <span style={{ padding: '0.1rem 0.5rem', background: '#ef4444', color: '#fff', borderRadius: '12px', fontSize: '0.55rem', fontWeight: 800 }}>
                                    ⚠ {sectionFails.length} NO CONFORME{sectionFails.length > 1 ? 'S' : ''}
                                </span>
                            ) : (
                                <span style={{ padding: '0.1rem 0.5rem', background: '#166534', color: '#dcfce7', borderRadius: '12px', fontSize: '0.55rem', fontWeight: 800 }}>
                                    ✓ SIN DESVÍOS
                                </span>
                            )}
                        </div>

                        <div>
                            {section.items.map((item, idx) => (
                                <div key={idx} className="avoid-break" style={{
                                    borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid #f1f5f9',
                                    pageBreakInside: 'avoid',
                                    background: item.status === 'FAIL' ? '#fef2f2' : idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                                }}>
                                    {/* Fila principal: número | texto | estado */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr 60px', alignItems: 'stretch' }}>
                                        <div style={{ padding: '0.4rem 0.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid #e2e8f0' }}>
                                            <span style={{ background: '#e2e8f0', color: '#64748b', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 900 }}>
                                                {idx + 1}
                                            </span>
                                        </div>

                                        <div style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '0.75rem', color: item.status === 'FAIL' ? '#7f1d1d' : '#334155' }}>
                                            {item.text}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', borderLeft: '1px solid #e2e8f0' }}>
                                            {item.status === 'OK' ? (
                                                <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 900, fontSize: '0.6rem' }}>C</span>
                                            ) : item.status === 'FAIL' ? (
                                                <span style={{ background: '#fecaca', color: '#dc2626', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 900, fontSize: '0.6rem' }}>NC</span>
                                            ) : (
                                                <span style={{ background: '#f1f5f9', color: '#94a3b8', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 900, fontSize: '0.6rem' }}>N/A</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Observación e imágenes del ítem */}
                                    {(item.observation || (item.photos && item.photos.length > 0)) && (
                                        <div style={{ padding: '0.2rem 0.6rem 0.4rem 2rem', borderTop: '1px dashed #e2e8f0', background: item.status === 'FAIL' ? '#fef9f9' : '#f8fafc' }}>
                                            {item.observation && (
                                                <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.65rem', color: item.status === 'FAIL' ? '#991b1b' : '#475569', fontStyle: 'italic', fontWeight: 600 }}>
                                                    📝 {item.observation}
                                                </p>
                                            )}
                                            {item.photos && item.photos.length > 0 && (
                                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                    {item.photos.map((photo: string, pIdx: number) => (
                                                        <img
                                                            key={pIdx}
                                                            src={photo}
                                                            alt={`Evidencia ${pIdx + 1}`}
                                                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Observaciones */}
            {obs && (
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1rem' }}>
                    <div style={{ background: '#334155', color: '#fff', padding: '0.4rem 0.8rem', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        OBSERVACIONES Y COMENTARIOS DEL INSPECTOR
                    </div>
                    <div style={{ padding: '0.8rem', fontSize: '0.75rem', color: '#334155', fontWeight: 600, whiteSpace: 'pre-wrap', lineHeight: 1.4, background: '#f8fafc' }}>
                        {obs}
                    </div>
                </div>
            )}

            {/* Plan de Acción */}
            {actionPlan.length > 0 && (
                <div style={{ border: '1px solid #fcd34d', borderRadius: '6px', marginBottom: '1rem' }}>
                    <div style={{ background: '#f59e0b', padding: '0.4rem 0.8rem', color: '#fff', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🎯 PLAN DE ACCIÓN CORRECTIVA — {actionPlan.length} ACCIÓN{actionPlan.length > 1 ? 'ES' : ''}
                    </div>
                    <div style={{ padding: '0.8rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.6rem', background: '#fffbeb' }}>
                        {actionPlan.map((action, idx) => (
                            <div key={action.id} className="avoid-break" style={{ background: '#ffffff', border: '1px solid #fcd34d', borderRadius: '6px', padding: '0.6rem', pageBreakInside: 'avoid' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                                    <span style={{ background: '#f59e0b', color: '#fff', minWidth: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 900 }}>{idx + 1}</span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0 0 0.2rem 0', fontWeight: 800, fontSize: '0.7rem', color: '#1e293b' }}>{action.action}</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>
                                            {action.responsible && <span>👤 {action.responsible}</span>}
                                            {action.dueDate && <span>📅 {new Date(action.dueDate).toLocaleDateString('es-AR')}</span>}
                                            <span style={{ color: action.priority === 'critico' ? '#dc2626' : action.priority === 'alto' ? '#ea580c' : '#ca8a04', fontWeight: 900 }}>
                                                🔥 {action.priority?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Próxima Revisión */}
            {nextReview && (
                <div className="avoid-break" style={{ border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.6rem 1rem', marginBottom: '1rem', background: '#eff6ff', display: 'flex', alignItems: 'center', gap: '0.8rem', pageBreakInside: 'avoid' }}>
                    <Calendar size={18} color="#2563eb" />
                    <div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.65rem', color: '#1e3a8a', textTransform: 'uppercase' }}>PRÓXIMA REVISIÓN PROGRAMADA</p>
                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.85rem', fontWeight: 800, color: '#1e40af' }}>{new Date(nextReview).toLocaleDateString('es-AR')}</p>
                    </div>
                </div>
            )}

            {/* Normativa aplicable */}
            {selectedNorms.length > 0 && (
                <>
                    <div style={{ border: '1px solid #d8b4fe', borderRadius: '6px', marginBottom: '1rem' }}>
                    <div style={{ background: '#7c3aed', padding: '0.6rem 1rem', color: '#fff', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📚 NORMATIVA LEGAL APLICABLE
                    </div>
                    <div style={{ padding: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: '#faf5ff' }}>
                        {selectedNorms.map(normId => {
                            const norm = availableNorms.find(n => n.id === normId);
                            if (!norm) return null;
                            return (
                                <div key={normId} style={{ flex: '1 1 260px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', padding: '0.5rem 0.7rem', borderRadius: '6px', border: '1px solid #e9d5ff' }}>
                                    <span style={{ width: '16px', height: '16px', background: '#7c3aed', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 900, flexShrink: 0 }}>✓</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{norm.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                </>
            )}
            {/* Firmas */}
            <PdfSignatures
                data={fullData}
                box1={fullData.showSignatures?.operator ? {
                    title: 'RESPONSABLE / OPERADOR',
                    subtitle: 'Control Operativo',
                    signatureUrl: fullData.operatorSignature || null,
                    isProfessional: false
                } : null}
                box2={fullData.showSignatures?.professional ? {
                    title: 'PROFESIONAL / INSTRUCTOR',
                    subtitle: (actName || 'Firma de Especialista').toUpperCase(),
                    signatureUrl: fullData.signature || actSignature || null,
                    stampUrl: fullData.professionalStamp || actStamp || null,
                    isProfessional: true,
                    license: fullData.professionalLicense || actLic || null
                } : null}
                box3={fullData.showSignatures?.supervisor ? {
                    title: 'SUPERVISIÓN / VERIFICADOR',
                    subtitle: 'Cierre de Inspección',
                    signatureUrl: fullData.supervisorSignature || null,
                    isProfessional: false
                } : null}
            />

            <PdfBrandingFooter />
        </div>
    );
}
