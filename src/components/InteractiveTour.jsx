import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Flame, Camera, Bot, ClipboardCheck, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Tour Interactivo - Guía al usuario por la UI real resaltando elementos
 * Se superpone a la interfaz y muestra tooltips en cada paso
 */
export default function InteractiveTour({ onComplete }) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);

    // Pasos del tour - simplificados para no depender de elementos específicos
    const steps = [
        {
            id: 'welcome',
            title: '¡Bienvenido a Asistente H&S! 🎉',
            description: 'Te voy a mostrar las funciones principales para que empieces a sacar provecho de la app.',
            icon: <Sparkles size={32} color="#f59e0b" />,
            position: 'center',
            actionText: 'Comenzar tour',
            showNavButtons: true
        },
        {
            id: 'menu-principal',
            title: 'Menú Principal',
            description: 'Desde el menú lateral podés acceder a todas las herramientas: ATS, Carga de Fuego, Matrices, IA y más.',
            icon: <Sparkles size={32} color="#3b82f6" />,
            position: 'center',
            actionText: 'Entendido',
            showNavButtons: true
        },
        {
            id: 'ats',
            title: 'Análisis de Trabajo Seguro',
            description: 'Creá ATS por tarea con medidas de control. Listo para firma digital e impresión.',
            icon: <ClipboardCheck size={32} color="#10b981" />,
            position: 'center',
            actionText: 'Crear ATS',
            showNavButtons: false,
            onClick: () => {
                onComplete();
                navigate('/ats');
            }
        },
        {
            id: 'carga-fuego',
            title: 'Carga de Fuego',
            description: 'Calculá la carga de fuego según normativa. Genera el protocolo oficial automáticamente.',
            icon: <Flame size={32} color="#f97316" />,
            position: 'center',
            actionText: 'Calcular ahora',
            showNavButtons: false,
            onClick: () => {
                onComplete();
                navigate('/fire-load');
            }
        },
        {
            id: 'asesor-ia',
            title: 'Asesor IA',
            description: 'Consultá sobre normativa y recibí respuestas legales al instante con inteligencia artificial.',
            icon: <Bot size={32} color="#8b5cf6" />,
            position: 'center',
            actionText: 'Consultar IA',
            showNavButtons: false,
            onClick: () => {
                onComplete();
                navigate('/ai-advisor');
            }
        },
        {
            id: 'camara-ia',
            title: 'Cámara IA',
            description: 'Detectá automáticamente falta de EPP usando la cámara de tu celular.',
            icon: <Camera size={32} color="#06b6d4" />,
            position: 'center',
            actionText: 'Probar cámara',
            showNavButtons: false,
            onClick: () => {
                onComplete();
                navigate('/ai-camera');
            }
        },
        {
            id: 'final',
            title: '¡Listo para empezar! 🚀',
            description: 'Ya conocés lo básico. Explorá la app y recordá que podés volver a este tour cuando quieras desde Configuración.',
            icon: <Sparkles size={32} color="#10b981" />,
            position: 'center',
            actionText: 'Comenzar a usar',
            showNavButtons: true
        }
    ];

    const currentStepData = steps[currentStep];

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('interactive_tour_completed', 'true');
        if (onComplete) onComplete();
    };

    const skipTour = () => {
        localStorage.setItem('interactive_tour_completed', 'true');
        if (onComplete) onComplete();
    };

    return (
        <>
            {/* Overlay oscuro */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99998,
                    background: 'rgba(0,0,0,0.75)',
                    animation: 'fadeIn 0.3s ease'
                }}
            />

            {/* Tooltip del tour */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    pointerEvents: 'none'
                }}
            >
                <div style={{
                    background: 'var(--color-surface, #ffffff)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '2px solid var(--color-primary, #3b82f6)',
                    width: '100%',
                    maxWidth: '420px',
                    pointerEvents: 'auto',
                    animation: 'slideUp 0.3s ease',
                    position: 'relative'
                }}>
                    {/* Header con icono y botón de cerrar */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '1rem'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {currentStepData.icon}
                        </div>
                        <button
                            onClick={skipTour}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                color: 'var(--color-text-muted, #64748b)',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            aria-label="Saltar tour"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Contenido */}
                    <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: 'var(--color-text, #1e293b)'
                    }}>
                        {currentStepData.title}
                    </h3>
                    
                    <p style={{
                        margin: '0 0 1.5rem 0',
                        fontSize: '0.9rem',
                        color: 'var(--color-text-muted, #64748b)',
                        lineHeight: 1.5
                    }}>
                        {currentStepData.description}
                    </p>

                    {/* Botón de acción principal */}
                    <button
                        onClick={() => {
                            if (currentStepData.onClick) {
                                currentStepData.onClick();
                            } else {
                                nextStep();
                            }
                        }}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '0.9rem',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginBottom: currentStepData.showNavButtons ? '0.8rem' : '0'
                        }}
                    >
                        {currentStepData.actionText}
                        {currentStepData.showNavButtons && <ChevronRight size={18} />}
                    </button>

                    {/* Navegación */}
                    {currentStepData.showNavButtons && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                style={{
                                    padding: '0.7rem 1rem',
                                    background: currentStep === 0 ? 'rgba(0,0,0,0.05)' : 'transparent',
                                    border: '1px solid var(--color-border, #e2e8f0)',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                                    color: currentStep === 0 ? 'var(--color-text-muted, #94a3b8)' : 'var(--color-primary, #3b82f6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                }}
                            >
                                <ChevronLeft size={16} /> Atrás
                            </button>
                            
                            <div style={{ flex: 1 }} />
                            
                            {/* Indicador de pasos */}
                            <div style={{
                                display: 'flex',
                                gap: '0.3rem',
                                alignItems: 'center'
                            }}>
                                {steps.map((_, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            width: index === currentStep ? '24px' : '8px',
                                            height: '8px',
                                            borderRadius: '4px',
                                            background: index === currentStep ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e2e8f0)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Texto de progreso */}
                    <p style={{
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted, #94a3b8)',
                        marginTop: '0.8rem'
                    }}>
                        Paso {currentStep + 1} de {steps.length}
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translate(-50%, 20px);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                }
                @keyframes pulse-highlight {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
                    }
                }
            `}</style>
        </>
    );
}
