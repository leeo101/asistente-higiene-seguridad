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
    const [highlightedElement, setHighlightedElement] = useState(null);
    const tourContainerRef = useRef(null);

    // Pasos del tour con referencias a elementos reales
    const steps = [
        {
            id: 'welcome',
            title: '¡Bienvenido a Asistente H&S! 🎉',
            description: 'Te voy a mostrar las funciones principales para que empieces a sacar provecho de la app.',
            icon: <Sparkles size={32} color="#f59e0b" />,
            position: 'center',
            highlightSelector: null, // No resalta nada específico
            actionText: 'Comenzar tour',
            showNavButtons: true
        },
        {
            id: 'menu-principal',
            title: 'Menú Principal',
            description: 'Desde acá podés acceder a todas las herramientas. Hacé click en el ícono de menú para explorar.',
            icon: <Sparkles size={32} color="#3b82f6" />,
            position: 'bottom-right',
            highlightSelector: '.sidebar-toggle, [aria-label="Abrir menú"], .glass-panel button:first-of-type',
            actionText: 'Explorar menú',
            showNavButtons: true,
            onClick: () => {
                const menuButton = document.querySelector('.sidebar-toggle, .glass-panel button:first-of-type');
                if (menuButton) menuButton.click();
            }
        },
        {
            id: 'ats',
            title: 'Análisis de Trabajo Seguro',
            description: 'Creá ATS por tarea con medidas de control. Listo para firma digital e impresión.',
            icon: <ClipboardCheck size={32} color="#10b981" />,
            position: 'bottom',
            highlightSelector: 'a[href="/ats"], .card:contains("ATS")',
            actionText: 'Crear ATS',
            showNavButtons: true,
            onClick: () => navigate('/ats')
        },
        {
            id: 'carga-fuego',
            title: 'Carga de Fuego',
            description: 'Calculá la carga de fuego según normativa. Genera el protocolo oficial automáticamente.',
            icon: <Flame size={32} color="#f97316" />,
            position: 'bottom',
            highlightSelector: 'a[href="/fire-load"], .card:contains("Carga")',
            actionText: 'Calcular ahora',
            showNavButtons: true,
            onClick: () => navigate('/fire-load')
        },
        {
            id: 'asesor-ia',
            title: 'Asesor IA',
            description: 'Consultá sobre normativa y recibí respuestas legales al instante con inteligencia artificial.',
            icon: <Bot size={32} color="#8b5cf6" />,
            position: 'top',
            highlightSelector: 'a[href="/ai-advisor"], .card:contains("Asesor")',
            actionText: 'Consultar IA',
            showNavButtons: true,
            onClick: () => navigate('/ai-advisor')
        },
        {
            id: 'camara-ia',
            title: 'Cámara IA',
            description: 'Detectá automáticamente falta de EPP usando la cámara de tu celular.',
            icon: <Camera size={32} color="#06b6d4" />,
            position: 'top',
            highlightSelector: 'a[href="/ai-camera"], .card:contains("Cámara")',
            actionText: 'Probar cámara',
            showNavButtons: true,
            onClick: () => navigate('/ai-camera')
        },
        {
            id: 'informes',
            title: 'Informes Técnicos',
            description: 'Generá reportes profesionales en PDF listos para presentar con tu firma digital.',
            icon: <FileText size={32} color="#ec4899" />,
            position: 'top',
            highlightSelector: 'a[href="/reports"], .card:contains("Informes")',
            actionText: 'Ver informes',
            showNavButtons: true,
            onClick: () => navigate('/reports')
        },
        {
            id: 'final',
            title: '¡Listo para empezar! 🚀',
            description: 'Ya conocés lo básico. Explorá la app y recordá que podés volver a este tour cuando quieras desde Configuración.',
            icon: <Sparkles size={32} color="#10b981" />,
            position: 'center',
            highlightSelector: null,
            actionText: 'Comenzar a usar',
            showNavButtons: false
        }
    ];

    const currentStepData = steps[currentStep];

    // Efecto para resaltar elemento cuando cambia el paso
    useEffect(() => {
        if (currentStepData.highlightSelector) {
            // Buscar el elemento con múltiples selectores
            const selectors = currentStepData.highlightSelector.split(',');
            let element = null;
            
            for (const selector of selectors) {
                element = document.querySelector(selector.trim());
                if (element) break;
            }
            
            if (element) {
                setHighlightedElement(element);
                // Scroll suave hacia el elemento
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            setHighlightedElement(null);
        }
    }, [currentStep, currentStepData]);

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

    // Calcular posición del tooltip
    const getTooltipPosition = () => {
        if (!highlightedElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        
        const rect = highlightedElement.getBoundingClientRect();
        const tooltipWidth = 380;
        const tooltipHeight = 200;
        
        let top, left;
        
        switch (currentStepData.position) {
            case 'bottom':
                top = rect.bottom + 10;
                left = rect.left + (rect.width / 2);
                break;
            case 'bottom-right':
                top = rect.bottom + 10;
                left = rect.right - tooltipWidth;
                break;
            case 'top':
                top = rect.top - tooltipHeight - 10;
                left = rect.left + (rect.width / 2);
                break;
            case 'left':
                top = rect.top + (rect.height / 2);
                left = rect.left - tooltipWidth - 10;
                break;
            default:
                top = window.innerHeight / 2;
                left = window.innerWidth / 2;
        }
        
        return {
            top: `${Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20))}px`,
            left: `${Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20))}px`,
            transform: 'translate(-50%, 0)'
        };
    };

    return (
        <>
            {/* Overlay oscuro con agujero para el elemento resaltado */}
            <div
                ref={tourContainerRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99998,
                    pointerEvents: highlightedElement ? 'none' : 'auto',
                    background: highlightedElement ? createOverlayBackground(highlightedElement) : 'rgba(0,0,0,0.75)',
                    transition: 'background 0.3s ease',
                    animation: 'fadeIn 0.3s ease'
                }}
            />

            {/* Tooltip del tour */}
            <div
                style={{
                    position: 'fixed',
                    zIndex: 99999,
                    ...getTooltipPosition(),
                    width: '380px',
                    maxWidth: 'calc(100vw - 40px)',
                    animation: 'slideUp 0.3s ease',
                    transition: 'all 0.3s ease'
                }}
            >
                <div style={{
                    background: 'var(--color-surface, #ffffff)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '2px solid var(--color-primary, #3b82f6)'
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

// Función auxiliar para crear overlay con agujero
function createOverlayBackground(element) {
    if (!element) return 'rgba(0,0,0,0.75)';
    
    const rect = element.getBoundingClientRect();
    const padding = 10;
    
    return `radial-gradient(circle at ${rect.left + rect.width/2}px ${rect.top + rect.height/2}px, transparent ${Math.min(rect.width, rect.height)/2 + padding}px, rgba(0,0,0,0.75) ${Math.min(rect.width, rect.height)/2 + padding + 10}px)`;
}
