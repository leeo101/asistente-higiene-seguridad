import React, { useRef, useState } from 'react';
import { Calendar, Flame, MapPin, Hash, ShieldCheck, AlertTriangle, ArrowLeft, Printer, Share2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import ShareModal from './ShareModal';

const getRecargaExpirationStatus = (dateStr) => {
    if (!dateStr) return { text: 'Sin Datos', color: '#64748b', expirationDate: null };
    const d = new Date(dateStr + 'T12:00:00Z');
    if (isNaN(d.getTime())) return { text: 'Sin Datos', color: '#64748b', expirationDate: null };
    d.setFullYear(d.getFullYear() + 1);
    const today = new Date();
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const expDate = d.toLocaleDateString('es-AR');
    if (diffDays < 0) return { text: 'Vencido', color: '#ef4444', expirationDate: expDate };
    if (diffDays <= 30) return { text: 'Por vencer', color: '#f59e0b', expirationDate: expDate };
    return { text: 'Vigente', color: '#10b981', expirationDate: expDate };
};

const getPHExpirationStatus = (dateStr: string) => {
    if (!dateStr) return { text: 'Sin Datos', color: '#64748b' };
    const d = new Date(dateStr + 'T12:00:00Z');
    if (isNaN(d.getTime())) return { text: 'Sin Datos', color: '#64748b' };
    d.setFullYear(d.getFullYear() + 5);
    const today = new Date();
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Vencido', color: '#ef4444', expirationDate: d.toLocaleDateString('es-AR') };
    if (diffDays <= 30) return { text: 'Por vencer', color: '#f59e0b', expirationDate: d.toLocaleDateString('es-AR') };
    return { text: 'Vigente', color: '#10b981', expirationDate: d.toLocaleDateString('es-AR') };
};

const getLifespanStatus = (fechaFab: string) => {
    if (!fechaFab) return { text: 'Sin Datos', color: '#64748b', expirationDate: null };
    const d = new Date(fechaFab);
    const limitDate = new Date(d);
    limitDate.setFullYear(limitDate.getFullYear() + 20);
    const today = new Date();
    const diffDays = Math.ceil((limitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const expDate = limitDate.toLocaleDateString('es-AR');
    if (diffDays < 0) return { text: 'DAR DE BAJA', color: '#dc2626', expirationDate: expDate };
    if (diffDays <= 180) return { text: 'Por vencer', color: '#f59e0b', expirationDate: expDate };
    return { text: 'Vigente', color: '#10b981', expirationDate: expDate };
};

const formatType = (tipo: string) => {
    if (!tipo) return 'N/A';
    const t = String(tipo).toUpperCase();
    if (t === 'ABC') return 'HCFC';
    if (t === 'BC') return 'CO2';
    return tipo;
};


export default function ExtinguisherProfilePdf({ data, onBack = () => window.history.back(), isHeadless = false }: { data: any, onBack?: () => void, isHeadless?: boolean }): React.ReactElement | null {
    const componentRef = useRef<HTMLDivElement>(null);
    const [showShare, setShowShare] = useState(false);

    if (!data) return null;

    const handlePrint = () => window.print();

    const recargaStatus = getRecargaExpirationStatus(data.vencimientoRecarga);
    const phStatus = getPHExpirationStatus(data.vencimientoPH);
    const lifespanStatus = getLifespanStatus(data.fechaFabricacion);

    let actSignature = null;
    let actStamp = null;
    let actName = null;
    let actLic = null;
    
    try {
        const lsPersonal = localStorage.getItem('personalData');
        const lsStamp = localStorage.getItem('signatureStampData');
        const legacySig = localStorage.getItem('capturedSignature');
        if (lsStamp) { 
            const parsed = JSON.parse(lsStamp);
            actSignature = parsed.signature; actStamp = parsed.stamp;
        } else if (legacySig) { 
            actSignature = legacySig; 
        }
        if (lsPersonal) {
            const pd = JSON.parse(lsPersonal);
            actName = pd.name; actLic = pd.license;
        }
    } catch(e) {}

    let latestInspection = null;
    try {
        const historyRaw = localStorage.getItem('extintores_history');
        if (historyRaw) {
            const history = JSON.parse(historyRaw);
            latestInspection = history.find(h => String(h.extintorId) === String(data.id)) || null;
        }
        if (!latestInspection && data.inspections && data.inspections.length > 0) {
            const last = data.inspections[data.inspections.length - 1];
            latestInspection = {
                fecha: last.fechaVisita ? last.fechaVisita + 'T12:00:00Z' : new Date().toISOString(),
                inspector: '-',
                resultado: last.resultado === 'C' ? 'APROBADO' : 'RECHAZADO',
                items: [
                    { text: 'Manómetro (presión operable)', status: last.controles?.manometro || 'C', observacion: '' },
                    { text: 'Acceso sin obstrucciones', status: last.controles?.acceso || 'C', observacion: '' },
                    { text: 'Señalización reglamentaria', status: last.controles?.senalizacion || 'C', observacion: '' },
                    { text: 'Manguera y boquilla', status: last.controles?.manguera || 'C', observacion: '' },
                    { text: 'Estado físico del cilindro', status: last.controles?.cilindro || 'C', observacion: '' },
                ],
                observaciones: last.observacion || ''
            };
        }
    } catch(e) {}

    return (
        <div id="extinguisher-profile-wrap" className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {!isHeadless && (
                <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={onBack} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Previsualización de Ficha</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button onClick={() => setShowShare(true)} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--color-text)' }}>
                            <Share2 size={18} /> Compartir Ficha
                        </button>
                        <button onClick={handlePrint} className="btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Printer size={18} /> Imprimir / Exportar PDF
                        </button>
                    </div>
                </div>
            )}
            
            <ShareModal 
                isOpen={showShare} 
                open={showShare} 
                onClose={() => setShowShare(false)} 
                title={`Ficha Técnica - Extintor #${data.numero}`} 
                text={`📋 Ficha de Extintor\n🔥 Chapa: ${data.numero}\n📍 Ubicación: ${data.ubicacion}`} 
                rawMessage={''} 
                elementIdToPrint="pdf-content" 
                fileName={`Ficha_Extintor_${data.numero || 'Reporte'}.pdf`} 
            />

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div
                    id="pdf-content"
                    className="pdf-container card print-area"
                    ref={componentRef}
                    style={{
                        width: '100%',
                        maxWidth: '210mm',
                        minHeight: '297mm',
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#ffffff', color: '#000000',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                        boxSizing: 'border-box'
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
                                border: none !important;
                                min-height: 0 !important;
                                height: auto !important;
                                display: block !important;
                            }
                            #extinguisher-profile-wrap {
                                padding: 0 !important;
                                padding-bottom: 0 !important;
                                min-height: 0 !important;
                                height: auto !important;
                                margin: 0 !important;
                                display: block !important;
                            }
                            #extinguisher-profile-wrap > div {
                                flex: none !important;
                                display: block !important;
                                min-height: 0 !important;
                            }
                            .ats-pdf-offscreen {
                                padding: 0 !important;
                                margin: 0 !important;
                            }
                        `}
                    </style>

                    <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ margin: '0 0 5px 0', fontSize: '18pt', color: '#1e293b', fontWeight: 900, textTransform: 'uppercase' }}>
                                Ficha Técnica de Extintor
                            </h1>
                            <p style={{ margin: 0, fontSize: '11pt', color: '#475569', fontWeight: 600 }}>
                                Documento de Trazabilidad e Inventario
                            </p>
                        </div>
                        <CompanyLogo
                            style={{
                                height: '50px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '150px'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                        <div style={{ width: '150px', flexShrink: 0 }}>
                            {data.foto ? (
                                <img src={data.foto} alt="Extintor" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #cbd5e1' }} />
                            ) : (
                                <div style={{ width: '100%', height: '160px', background: '#f1f5f9', borderRadius: '8px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Flame size={48} color="#94a3b8" />
                                </div>
                            )}
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '12pt', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                                    <Hash size={18} color="#3b82f6" /> Identificación del Equipo
                                </h3>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    <div>
                                        <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Nº Chapa / Interno</div>
                                        <div style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a' }}>{data.numero || '-'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tipo y Capacidad</div>
                                        <div style={{ fontSize: '11pt', fontWeight: 700, color: '#0f172a' }}>{formatType(data.tipo)} - {data.capacidad}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Ubicación</div>
                                        <div style={{ fontSize: '11pt', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={14} color="#dc2626" /> {data.ubicacion || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Empresa / Cliente</div>
                                        <div style={{ fontSize: '11pt', fontWeight: 700, color: '#0f172a' }}>{data.empresa || '-'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Marca / Fabricante</div>
                                        <div style={{ fontSize: '11pt', fontWeight: 700, color: '#0f172a' }}>{data.marca || 'Sin especificar'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Sello IRAM / OPDS</div>
                                        <div style={{ fontSize: '11pt', fontWeight: 700, color: '#0f172a' }}>{data.selloIRAM || '-'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Nº Serie (Tubo)</div>
                                        <div style={{ fontSize: '11pt', fontWeight: 700, color: '#0f172a' }}>{data.numeroSerie || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '12pt', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #1e293b', paddingBottom: '6px' }}>
                            <Calendar size={18} color="#f59e0b" /> Control de Vencimientos
                        </h3>
                        
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', fontFamily: 'sans-serif', tableLayout: 'fixed', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            <thead>
                                <tr className="avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid',  background: '#f1f5f9' }}>
                                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left', width: '25%', fontWeight: 800 }}>Vencimiento Recarga</th>
                                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left', width: '25%', fontWeight: 800 }}>Vencimiento P.H. (5 Años)</th>
                                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left', width: '25%', fontWeight: 800 }}>Fecha Fabricación</th>
                                    <th style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left', width: '25%', fontWeight: 800 }}>Vida Útil (20 Años)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>
                                        <div style={{ fontSize: '11pt', fontWeight: 900 }}>{recargaStatus.expirationDate || '-'}</div>
                                        <div style={{ color: recargaStatus.color, fontWeight: 800, marginTop: '4px', fontSize: '8pt' }}>{recargaStatus.text}</div>
                                    </td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>
                                        <div style={{ fontSize: '11pt', fontWeight: 900 }}>{phStatus.expirationDate ? phStatus.expirationDate : '-'}</div>
                                        <div style={{ color: phStatus.color, fontWeight: 800, marginTop: '4px', fontSize: '8pt' }}>{phStatus.text}</div>
                                    </td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>
                                        <div style={{ fontSize: '11pt', fontWeight: 900 }}>{data.fechaFabricacion ? new Date(data.fechaFabricacion).toLocaleDateString('es-AR') : '-'}</div>
                                    </td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>
                                        <div style={{ fontSize: '11pt', fontWeight: 900 }}>{lifespanStatus.expirationDate || '-'}</div>
                                        {lifespanStatus && (
                                            <div style={{ color: lifespanStatus.color, fontWeight: 800, marginTop: '4px', fontSize: '9pt' }}>{lifespanStatus.text}</div>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '12pt', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #1e293b', paddingBottom: '6px' }}>
                            <ShieldCheck size={18} color="#10b981" /> Última Inspección Registrada
                        </h3>
                        
                        {!latestInspection && !data.ultimaInspeccion ? (
                            <div style={{ padding: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <AlertTriangle size={18} color="#f59e0b" /> No hay registros de inspección para este equipo.
                            </div>
                        ) : null}

                        {!latestInspection && data.ultimaInspeccion ? (
                             <div style={{ padding: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <div>
                                     <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 700 }}>Fecha:</div>
                                     <div style={{ fontSize: '10pt', fontWeight: 900, color: '#0f172a' }}>{new Date(data.ultimaInspeccion).toLocaleDateString('es-AR')}</div>
                                 </div>
                                 <div style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '999px', fontWeight: 800, fontSize: '9pt', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                     <ShieldCheck size={14} /> INSPECCIÓN OK
                                 </div>
                             </div>
                        ) : null}
                        <div style={{ marginBottom: '10px' }}>
                        {latestInspection && (
                            <div style={{ marginTop: data.ultimaInspeccion && !latestInspection ? '10px' : '0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '9pt', background: '#f8fafc', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div><strong style={{ color: '#64748b' }}>Fecha:</strong> <span style={{ fontWeight: 800 }}>{new Date(latestInspection.fecha).toLocaleDateString('es-AR')}</span></div>
                                <div><strong style={{ color: '#64748b' }}>Inspector:</strong> <span style={{ fontWeight: 800 }}>{latestInspection.inspector || '-'}</span></div>
                                <div><strong style={{ color: '#64748b' }}>Resultado de inspección:</strong> <span style={{ display: 'inline-block', width: '100px', borderBottom: '1px solid #64748b', marginLeft: '5px' }}></span></div>
                            </div>
                            
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', fontFamily: 'sans-serif', tableLayout: 'fixed', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                <thead>
                                    <tr className="avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid',  background: '#f1f5f9' }}>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'left', width: '60%' }}>Ítem a Verificar</th>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', width: '15%' }}>Estado</th>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'left', width: '25%' }}>Observación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {latestInspection.items?.map((item, idx) => (
                                        <tr key={idx} className="avoid-break" style={{ background: idx % 2 === 1 ? '#f8fafc' : '#ffffff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                            <td style={{ border: '1px solid #cbd5e1', padding: '4px', color: '#334155', fontWeight: 600 }}>{item.text}</td>
                                            <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', fontWeight: 900, color: item.status === 'OK' ? '#10b981' : item.status === 'NC' ? '#ef4444' : '#64748b' }}>
                                                {item.status || 'N/A'}
                                            </td>
                                            <td style={{ border: '1px solid #cbd5e1', padding: '4px', color: '#64748b', fontStyle: 'italic' }}>{item.observacion || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {latestInspection.observaciones && (
                                <div style={{ marginTop: '10px', fontSize: '9pt', background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a', color: '#92400e' }}>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>Observaciones Generales:</strong>
                                    {latestInspection.observaciones}
                                </div>
                            )}

                            {/* FOTOS DE INSPECCIÓN */}
                            {((latestInspection.fotos && latestInspection.fotos.length > 0) || (latestInspection.items && latestInspection.items.some(i => i.photos && i.photos.length > 0))) && (
                                <div style={{ marginTop: '10px', borderTop: '2px dashed #cbd5e1', paddingTop: '10px', pageBreakInside: 'avoid' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '10pt', color: '#0f172a', fontWeight: 800 }}>📸 Evidencia Fotográfica</h4>
                                    
                                    {/* Fotos Generales */}
                                    {latestInspection.fotos && latestInspection.fotos.length > 0 && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <span style={{ fontSize: '9pt', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>General:</span>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                {latestInspection.fotos.map((foto, fIdx) => (
                                                    <img key={`gen-f-${fIdx}`} src={foto} alt="Evidencia" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fotos por Ítem */}
                                    {latestInspection.items && latestInspection.items.some(i => i.photos && i.photos.length > 0) && (
                                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                            {latestInspection.items.filter(i => i.photos && i.photos.length > 0).map((item, idx) => (
                                                <div key={`item-f-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <span style={{ fontSize: '8pt', fontWeight: 700, color: '#475569', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.text}</span>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        {item.photos.map((foto, pIdx) => (
                                                            <img key={`ip-${idx}-${pIdx}`} src={foto} alt="Evidencia Ítem" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            </div>
                        )}
                        </div>
                    </div>

                    {/* Firmas */}
                    <table style={{ tableLayout: 'fixed', wordBreak: 'break-word', overflowWrap: 'break-word',  width: '100%', marginTop: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <tbody>
                            <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <td>
                                    <div style={{ paddingTop: '10px' }}>
                                        <PdfSignatures 
                                            data={data}
                                            box1={data.showSignatures?.operator ? {
                                                title: 'OPERADOR',
                                                subtitle: 'Responsable de sector',
                                                signatureUrl: data.operatorSignature || null,
                                                isProfessional: false
                                            } : null}
                                            box2={data.showSignatures?.professional !== false ? {
                                                title: 'INSPECTOR / PROFESIONAL',
                                                subtitle: (actName || 'Profesional HSE').toUpperCase(),
                                                signatureUrl: actSignature || null,
                                                stampUrl: actStamp || null,
                                                isProfessional: true,
                                                license: actLic || null
                                            } : null}
                                            box3={data.showSignatures?.supervisor ? {
                                                title: 'SUPERVISOR',
                                                subtitle: 'Aprobación HSE',
                                                signatureUrl: data.supervisorSignature || null,
                                                isProfessional: false
                                            } : null}
                                        />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <PdfBrandingFooter />
                </div>
            </div>
        </div>
    );
}
