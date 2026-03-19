import React, { useRef } from 'react';
import { MapPin, Calendar, Clock, User, AlertCircle, AlertTriangle, ShieldCheck, Camera, FileText, CheckCircle2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import { getCountryNormativa } from '../data/legislationData';

export default function StopCardPdfGenerator({ card }) {
    const componentRef = useRef();
    
    if (!card) return null;

    const savedData = localStorage.getItem('personalData');
    const userCountry = savedData ? (JSON.parse(savedData).country || 'argentina') : 'argentina';
    const countryNorms = getCountryNormativa(userCountry);

    const getTypeConfig = (type) => {
        switch (type) {
            case 'Condición Insegura': 
                return { 
                    color: '#f59e0b', 
                    bg: '#fef3c7', 
                    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: '#f59e0b',
                    icon: <AlertCircle size={32} strokeWidth={2.5} />,
                    label: 'CONDICIÓN INSEGURA',
                    iconBg: '#fef3c7'
                };
            case 'Acto Inseguro': 
                return { 
                    color: '#ef4444', 
                    bg: '#fee2e2',
                    bgGradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    border: '#ef4444',
                    icon: <AlertTriangle size={32} strokeWidth={2.5} />,
                    label: 'ACTO INSEGURO',
                    iconBg: '#fee2e2'
                };
            case 'Casi Accidente': 
                return { 
                    color: '#dc2626', 
                    bg: '#fef2f2',
                    bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    border: '#dc2626',
                    icon: <AlertTriangle size={32} strokeWidth={2.5} />,
                    label: 'CASI ACCIDENTE',
                    iconBg: '#fef2f2'
                };
            case 'Acto Seguro': 
                return { 
                    color: '#10b981', 
                    bg: '#d1fae5',
                    bgGradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    border: '#10b981',
                    icon: <ShieldCheck size={32} strokeWidth={2.5} />,
                    label: 'ACTO SEGURO',
                    iconBg: '#d1fae5'
                };
            default: 
                return { 
                    color: '#3b82f6', 
                    bg: '#dbeafe',
                    bgGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    border: '#3b82f6',
                    icon: <AlertCircle size={32} strokeWidth={2.5} />,
                    label: 'OBSERVACIÓN',
                    iconBg: '#dbeafe'
                };
        }
    };

    const typeConfig = getTypeConfig(card.type);

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="stop-card-pdf-content"
                className="pdf-container card print-area"
                ref={componentRef}
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm 20mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '12px',
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
                            border: none !important;
                            border-radius: 0 !important;
                        }
                        .company-logo {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .gradient-header {
                            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                        }
                    `}
                </style>

                {/* Header - Mejorado visualmente */}
                <div className="gradient-header" style={{ 
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
                            <div style={{ 
                                background: 'rgba(255,255,255,0.2)', 
                                padding: '8px', 
                                borderRadius: '8px',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <AlertCircle size={28} color="#fbbf24" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 style={{ 
                                    margin: 0, 
                                    fontSize: '20pt', 
                                    fontWeight: 900, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '-0.5px',
                                    lineHeight: 1
                                }}>
                                    TARJETA STOP
                                </h1>
                                <p style={{ 
                                    margin: '4px 0 0 0', 
                                    fontSize: '9pt', 
                                    color: '#cbd5e1',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    Programa de Seguridad Basada en el Comportamiento
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ marginLeft: '20px', flexShrink: 0 }}>
                        <CompanyLogo 
                            style={{
                                height: '55px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '160px',
                                background: '#ffffff',
                                padding: '10px',
                                borderRadius: '10px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                        />
                    </div>
                </div>

                {/* Classification Box - Mejorado visualmente */}
                <div style={{ 
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: '1.5rem',
                    padding: '1.5rem',
                    background: typeConfig.bgGradient,
                    borderRadius: '12px',
                    border: `2px solid ${typeConfig.border}`,
                    marginBottom: '2rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '1rem',
                        minWidth: '80px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ color: typeConfig.color }}>
                            {typeConfig.icon}
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ 
                            fontSize: '9pt', 
                            color: '#64748b', 
                            fontWeight: 700, 
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '6px'
                        }}>
                            📋 Clasificación del Hallazgo
                        </div>
                        <div style={{ 
                            fontSize: '22pt', 
                            fontWeight: 900, 
                            color: typeConfig.color,
                            margin: 0,
                            lineHeight: 1.2,
                            textTransform: 'uppercase'
                        }}>
                            {card.type}
                        </div>
                    </div>
                </div>

                {/* Details Grid - Mejorado visualmente */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ 
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.8rem',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                    }}>
                        <div style={{ 
                            background: '#3b82f6',
                            color: '#ffffff',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <MapPin size={20} strokeWidth={2.5} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ 
                                fontSize: '8.5pt', 
                                color: '#64748b', 
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                            }}>
                                📍 Ubicación / Área
                            </div>
                            <div style={{ 
                                fontSize: '11pt', 
                                color: '#0f172a', 
                                fontWeight: 700,
                                lineHeight: 1.3
                            }}>
                                {card.location}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ 
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.8rem',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                    }}>
                        <div style={{ 
                            background: '#10b981',
                            color: '#ffffff',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Calendar size={20} strokeWidth={2.5} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ 
                                fontSize: '8.5pt', 
                                color: '#64748b', 
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                            }}>
                                📅 Fecha y Hora
                            </div>
                            <div style={{ 
                                fontSize: '11pt', 
                                color: '#0f172a', 
                                fontWeight: 700,
                                lineHeight: 1.3
                            }}>
                                {new Date(card.date).toLocaleDateString('es-AR', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                                <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                                    ⏰ {card.time}hs
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description - Mejorado visualmente */}
                <div style={{ 
                    marginBottom: '2rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        padding: '0.8rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#ffffff'
                    }}>
                        <FileText size={18} strokeWidth={2.5} />
                        <h3 style={{ 
                            margin: 0, 
                            fontSize: '10.5pt', 
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Descripción de la Observación
                        </h3>
                    </div>
                    <div style={{ 
                        padding: '1.2rem',
                        background: '#ffffff',
                        color: '#334155',
                        fontSize: '10.5pt',
                        lineHeight: 1.7,
                        border: '1px solid #e2e8f0',
                        borderTop: 'none',
                        borderRadius: '0 0 10px 10px'
                    }}>
                        {card.description}
                    </div>
                </div>

                {/* Immediate Action - Mejorado visualmente */}
                {card.actionTaken && (
                    <div style={{ 
                        marginBottom: '2rem',
                        border: '1px solid #86efac',
                        borderRadius: '10px',
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                            padding: '0.8rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#ffffff'
                        }}>
                            <CheckCircle2 size={18} strokeWidth={2.5} />
                            <h3 style={{ 
                                margin: 0, 
                                fontSize: '10.5pt', 
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                ✅ Acción Inmediata Tomada
                            </h3>
                        </div>
                        <div style={{ 
                            padding: '1.2rem',
                            background: '#f0fdf4',
                            color: '#166534',
                            fontSize: '10.5pt',
                            lineHeight: 1.7,
                            border: '1px solid #86efac',
                            borderTop: 'none',
                            borderRadius: '0 0 10px 10px'
                        }}>
                            {card.actionTaken}
                        </div>
                    </div>
                )}

                {/* Photographic Evidence - Mejorado visualmente */}
                {card.photoBase64 && (
                    <div style={{ 
                        marginBottom: '2rem',
                        pageBreakInside: 'avoid',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                            padding: '0.8rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#ffffff'
                        }}>
                            <Camera size={18} strokeWidth={2.5} />
                            <h3 style={{ 
                                margin: 0, 
                                fontSize: '10.5pt', 
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                📸 Evidencia Fotográfica
                            </h3>
                        </div>
                        <div style={{ 
                            padding: '1rem',
                            background: '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            borderRadius: '0 0 10px 10px'
                        }}>
                            <div style={{ 
                                width: '100%',
                                maxWidth: '450px',
                                height: '320px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '2px solid #cbd5e1',
                                margin: '0 auto',
                                background: '#f1f5f9',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <img 
                                    src={card.photoBase64} 
                                    alt="Evidencia" 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'contain',
                                        background: '#ffffff'
                                    }} 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Signature - Mejorado visualmente */}
                <div style={{ 
                    marginTop: 'auto', 
                    paddingTop: '50px', 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    pageBreakInside: 'avoid'
                }}>
                    <div style={{ 
                        width: '300px', 
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '2px solid #e2e8f0'
                    }}>
                        <div style={{ 
                            height: '80px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            marginBottom: '12px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px dashed #cbd5e1'
                        }}>
                            {card.signature && (
                                <img 
                                    src={card.signature} 
                                    alt="Firma" 
                                    style={{ 
                                        maxHeight: '70px', 
                                        maxWidth: '200px',
                                        objectFit: 'contain'
                                    }} 
                                />
                            )}
                        </div>
                        <div style={{ 
                            borderTop: '2px solid #1e293b', 
                            paddingTop: '12px'
                        }}>
                            <div style={{ 
                                fontSize: '11pt', 
                                color: '#1e293b', 
                                fontWeight: 800,
                                marginBottom: '4px'
                            }}>
                                👷 Observador / Prevencionista
                            </div>
                            <div style={{ 
                                fontSize: '8.5pt', 
                                color: '#64748b',
                                fontWeight: 600
                            }}>
                                Firma Digitalizada - Asistente H&S
                            </div>
                            {card.observador && (
                                <div style={{ 
                                    fontSize: '9pt', 
                                    color: '#475569',
                                    fontWeight: 700,
                                    marginTop: '6px'
                                }}>
                                    {card.observador}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '2.5rem', 
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    fontSize: '8pt', 
                    color: '#94a3b8',
                    lineHeight: '1.6'
                }}>
                    <div style={{ 
                        fontWeight: 800, 
                        color: '#64748b', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px', 
                        marginBottom: '6px'
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
                        fontSize: '7.5pt',
                        color: '#cbd5e1'
                    }}>
                        {countryNorms.general} - {countryNorms.thermal}
                    </div>
                </div>

            </div>
        </div>
    );
}
