import React from 'react';
import { ShieldCheck, Pencil, Info } from 'lucide-react';

export default function ATSPdfGenerator({ atsData }) {
    if (!atsData) return null;

    const data = atsData;
    const tareas = data.tareas || [];
    const checklist = data.checklist || [];

    // Extract unique categories from checklist
    const categories = [...new Set(checklist.map(item => item.categoria))];

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
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
                    `}
                </style>

                {/* Header Sequence */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e293b' }}>Control HYS</p>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.5rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#1e293b' }}>A.T.S.</h1>
                        <p style={{ margin: 0, color: '#64748b', fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '0.25rem' }}>Análisis de Trabajo Seguro</p>
                    </div>

                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>PÁGINA</div>
                        <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b' }}>01 / 01</div>
                    </div>
                </div>

                {/* Primary Info Box */}
                <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: '2.5rem', width: '100%', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: '2px solid #e2e8f0', width: '100%' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>CLIENTE / EMPRESA</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.empresa || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>CUIT / CUIL</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.cuit || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>UBICACIÓN / OBRA</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.obra || '-'}</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', width: '100%' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>FECHA</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{new Date(data.fecha).toLocaleDateString()}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>RESPONSABLE</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.capatazNombre || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>PROFESIONAL HYS</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{data.professionalName || 'PROFESIONAL'}</span>
                        </div>
                    </div>
                </div>

                {/* Secuencia de Tareas */}
                {tareas.length > 0 && (
                    <div style={{ marginTop: '2rem', marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#2563eb', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <Pencil size={20} /> Secuencia de Tareas (Análisis)
                        </h3>

                        <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>
                                <div style={{ padding: '0.8rem', borderRight: '1px solid #e2e8f0' }}>Paso</div>
                                <div style={{ padding: '0.8rem', borderRight: '1px solid #e2e8f0' }}>Riesgos</div>
                                <div style={{ padding: '0.8rem' }}>Controles</div>
                            </div>
                            
                            {tareas.map((t, idx) => (
                                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', borderBottom: idx === tareas.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                                    <div style={{ padding: '0.8rem', borderRight: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{t.paso}</div>
                                    <div style={{ padding: '0.8rem', borderRight: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{t.riesgo}</div>
                                    <div style={{ padding: '0.8rem', fontSize: '0.8rem', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{t.control}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Checklist Verification */}
                {categories.length > 0 && (
                    <div style={{ marginTop: '2rem', pageBreakInside: 'avoid' }}>
                        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#2563eb', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <ShieldCheck size={20} /> Verificación de Seguridad
                        </h3>

                        {categories.map(cat => {
                            const catItems = checklist.filter(i => i.categoria === cat);
                            if (catItems.length === 0) return null;

                            return (
                                <div key={cat} style={{ border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                                    <div style={{ background: '#f8fafc', padding: '0.8rem 1.2rem', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Info size={16} color="#2563eb" />
                                        <span style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#1e293b' }}>{cat}</span>
                                    </div>
                                    <div>
                                        {catItems.map((item, idx) => (
                                            <div key={item.id} style={{ padding: '0.8rem 1.2rem', borderBottom: idx === catItems.length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.2rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item.pregunta}</div>
                                                    {item.observaciones && <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item.observaciones}</div>}
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                    {['SI', 'NO', 'NA'].map((label) => {
                                                        const isSelected = (label === 'SI' && (item.estado === 'Cumple' || item.estado === 'SI')) ||
                                                                         (label === 'NO' && (item.estado === 'No Cumple' || item.estado === 'NO')) ||
                                                                         (label === 'NA' && (item.estado === 'N/A' || item.estado === 'NA'));
                                                        
                                                        return (
                                                            <div key={label} style={{
                                                                width: '35px',
                                                                height: '24px',
                                                                border: isSelected ? '2.5px solid #000000' : '1px solid #cbd5e1',
                                                                borderRadius: '4px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.65rem',
                                                                fontWeight: isSelected ? 900 : 400,
                                                                color: isSelected ? '#000000' : '#cbd5e1',
                                                                background: 'transparent'
                                                            }}>
                                                                {isSelected ? 'X' : ''}
                                                                <span style={{ fontSize: '0.55rem', marginLeft: '2px', opacity: isSelected ? 1 : 0.6 }}>{label === 'NA' ? 'NA' : label}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Signatures */}
                <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid' }}>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                        <div style={{ height: '60px' }}></div>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>RESPONSABLE DE TAREA</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Firma y Aclaración</p>
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', width: '35%' }}>
                        <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {data.professionalSignature && <img src={data.professionalSignature} alt="Firma Profesional" style={{ height: '100%', objectFit: 'contain' }} />}
                        </div>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>{(data.professionalName || 'PROFESIONAL HYS').toUpperCase()}</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Mat.: {data.professionalLicense || '-'}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
