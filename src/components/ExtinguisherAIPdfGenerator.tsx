import React from 'react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import { Flame, Calendar, Info, CheckCircle2, AlertTriangle, Crosshair, Package } from 'lucide-react';

const EXTINTOR_INFO: Record<string, { name: string; fires: string; color: string; icon: string; usage: string }> = {
    'ABC': {
        name: 'Extintor HCFC',
        fires: 'Clase A (sólidos), B (líquidos), C (eléctricos)',
        color: '#ef4444',
        icon: '🧯',
        usage: 'Presionar palanca, apuntar a la base del fuego'
    },
    'CO2': {
        name: 'Extintor CO2 (Anhídrido Carbónico)',
        fires: 'Clase B (líquidos), C (eléctricos)',
        color: '#3b82f6',
        icon: '❄️',
        usage: 'Ideal para equipos eléctricos y electrónicos'
    },
    'Agua': {
        name: 'Extintor de Agua',
        fires: 'Clase A (sólidos: madera, papel, tela)',
        color: '#10b981',
        icon: '💧',
        usage: 'NO usar en fuegos eléctricos o líquidos'
    },
    'Espuma': {
        name: 'Extintor de Espuma',
        fires: 'Clase A y B (líquidos inflamables)',
        color: '#f59e0b',
        icon: '🫧',
        usage: 'Forma capa sobre líquidos inflamables'
    },
    'K': {
        name: 'Extintor Clase K',
        fires: 'Aceites y grasas de cocina',
        color: '#8b5cf6',
        icon: '🍳',
        usage: 'Específico para cocinas industriales'
    }
};

export default function ExtinguisherAIPdfGenerator({ item }: { item: any }): React.ReactElement | null {
    if (!item) return null;

    const info = item.type && EXTINTOR_INFO[item.type] ? EXTINTOR_INFO[item.type] : {
        name: item.type || 'Extintor Desconocido',
        fires: 'Clase no especificada',
        color: '#64748b',
        icon: '🧯',
        usage: 'Verificar especificaciones'
    };

    const isVigente = item.status === 'vigente';
    const confidencePercent = item.confidence ? Math.round(item.confidence * 100) : 0;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container card print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm 20mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                    boxSizing: 'border-box', margin: '0 auto',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
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

                {/* Header */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    color: '#ffffff'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Flame size={24} color="#ef4444" />
                            <h1 style={{ margin: 0, fontSize: '18pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                                Inspección IA de Extintor
                            </h1>
                        </div>
                        <p style={{ margin: '0 0 1rem 0', fontSize: '9pt', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Análisis visual automatizado
                        </p>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '9pt' }}>
                                <Calendar size={14} color="#94a3b8" /> 
                                <strong style={{ color: '#ef4444' }}>Fecha:</strong> {item.date ? new Date(item.date).toLocaleDateString('es-AR') : 'N/A'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '9pt' }}>
                                <Crosshair size={14} color="#94a3b8" /> 
                                <strong style={{ color: '#ef4444' }}>Confianza IA:</strong> {confidencePercent}%
                            </span>
                        </div>
                    </div>
                    
                    <div style={{ marginLeft: '20px', flexShrink: 0 }}>
                        <CompanyLogo style={{ height: '50px', maxWidth: '150px', background: '#ffffff', padding: '8px', borderRadius: '8px' }} />
                    </div>
                </div>

                <div className="grid-2-cols" style={{ gap: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '1.5rem' }}>
                    {/* Columna Izquierda: Foto */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ 
                            background: '#f8fafc', 
                            border: '2px dashed #cbd5e1', 
                            borderRadius: '12px',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '300px',
                            
                        }}>
                            {item.image ? (
                                <img src={item.image} alt="Extintor Capturado" style={{ width: '100%', height: 'auto', borderRadius: '8px', objectFit: 'contain', maxHeight: '400px' }} />
                            ) : (
                                <div style={{ color: '#94a3b8', fontSize: '9pt', textAlign: 'center' }}>Sin imagen disponible</div>
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha: Resultados */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        
                        {/* Tipo de Extintor */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            border: `2px solid ${info.color}`,
                            borderRadius: '10px',
                            padding: '1.2rem'
                        }}>
                            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Tipo Identificado</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                <span style={{ fontSize: '18pt' }}>{info.icon}</span>
                                <div style={{ fontSize: '14pt', fontWeight: 900, color: '#1e293b' }}>{info.name}</div>
                            </div>
                            <div style={{ fontSize: '9pt', color: '#475569', fontWeight: 600 }}>Clases: {info.fires}</div>
                            {item.capacity && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '9pt', color: '#475569', fontWeight: 600, marginTop: '8px' }}>
                                    <Package size={14} color="#94a3b8" /> Capacidad Estimada: {item.capacity}
                                </div>
                            )}
                        </div>

                        {/* Estado */}
                        <div style={{ 
                            background: isVigente ? '#f0fdf4' : '#fef2f2',
                            border: `2px solid ${isVigente ? '#22c55e' : '#ef4444'}`,
                            borderRadius: '10px',
                            padding: '1.2rem'
                        }}>
                            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Estado Operativo</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '8px' }}>
                                {isVigente ? <CheckCircle2 size={24} color="#16a34a" /> : <AlertTriangle size={24} color="#dc2626" />}
                                <div style={{ fontSize: '14pt', fontWeight: 900, color: isVigente ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>
                                    {isVigente ? 'VIGENTE' : 'VENCIDO / REVISIÓN'}
                                </div>
                            </div>
                            {item.lastCheck && (
                                <div style={{ fontSize: '8.5pt', color: '#475569', marginTop: '4px' }}><strong>Último control:</strong> {new Date(item.lastCheck).toLocaleDateString('es-AR')}</div>
                            )}
                            {item.nextCheck && (
                                <div style={{ fontSize: '8.5pt', color: '#475569', marginTop: '4px' }}><strong>Próximo control:</strong> {new Date(item.nextCheck).toLocaleDateString('es-AR')}</div>
                            )}
                            {item.phDate && (
                                <div style={{ fontSize: '8.5pt', color: '#3b82f6', marginTop: '4px' }}><strong>Vencimiento P.H.:</strong> {new Date(item.phDate).toLocaleDateString('es-AR')}</div>
                            )}
                        </div>

                        {/* Recomendaciones */}
                        {item.recommendations && item.recommendations.length > 0 && (
                            <div style={{ 
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '10px',
                                padding: '1rem'
                            }}>
                                <div style={{ fontSize: '8pt', color: '#1d4ed8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Info size={14} /> Recomendaciones
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '8.5pt', color: '#1e3a8a', lineHeight: '1.5' }}>
                                    {item.recommendations.map((rec: string, i: number) => (
                                        <li key={i}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
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
                    lineHeight: '1.6'
                }}>
                    <div style={{ fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                        Informe IA generado electrónicamente
                    </div>
                    <div>
                        {new Date().toLocaleDateString('es-AR')} a las {new Date().toLocaleTimeString()} | 
                        Asistente H&S - Sistema de Gestión
                    </div>
                </div>

                <PdfBrandingFooter />
            </div>
        </div>
    );
}
