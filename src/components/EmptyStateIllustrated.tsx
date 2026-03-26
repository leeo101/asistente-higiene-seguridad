import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    /** Icon background color (CSS color string). Default: var(--color-primary) */
    color?: string;
}

/**
 * EmptyStateIllustrated — muestra un SVG de fondo + mensaje + CTA cuando no hay datos.
 * Se puede usar en cualquier módulo reemplazando el EmptyState inline.
 */
export default function EmptyStateIllustrated({
    icon,
    title = 'Sin registros',
    description = 'Todavía no hay datos para mostrar. ¡Empezá creando el primero!',
    actionLabel = 'Crear nuevo',
    onAction,
    color = '#3B82F6',
}: EmptyStateProps): React.ReactElement {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Decorative background circles */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            {/* SVG Illustration */}
            <div style={{
                position: 'relative',
                marginBottom: '1.75rem',
                zIndex: 1,
            }}>
                {/* Outer ring */}
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: `${color}12`,
                    border: `2px dashed ${color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse-soft 3s ease-in-out infinite',
                }}>
                    {/* Inner icon circle */}
                    <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${color}25, ${color}15)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1.5px solid ${color}30`,
                    }}>
                        {icon ? (
                            React.isValidElement(icon)
                                ? React.cloneElement(icon as React.ReactElement<any>, {
                                    size: 32,
                                    color: color,
                                    strokeWidth: 1.5,
                                })
                                : icon
                        ) : (
                            // Default: generic document SVG
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Small decorative dots */}
                {[
                    { top: -6, right: 8 },
                    { bottom: 4, left: -4 },
                    { top: 20, left: -12 },
                ].map((pos, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: i === 0 ? 10 : i === 1 ? 7 : 5,
                        height: i === 0 ? 10 : i === 1 ? 7 : 5,
                        borderRadius: '50%',
                        background: `${color}${i === 0 ? '50' : i === 1 ? '35' : '25'}`,
                        ...pos,
                    }} />
                ))}
            </div>

            {/* Text */}
            <h3 style={{
                margin: '0 0 0.6rem 0',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--color-text)',
                letterSpacing: '-0.3px',
                zIndex: 1,
                position: 'relative',
            }}>
                {title}
            </h3>
            <p style={{
                margin: '0 0 2rem 0',
                fontSize: '0.9rem',
                color: 'var(--color-text-muted)',
                maxWidth: '320px',
                lineHeight: 1.6,
                zIndex: 1,
                position: 'relative',
            }}>
                {description}
            </p>

            {/* CTA Button */}
            {onAction && (
                <button
                    onClick={onAction}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.85rem 1.75rem',
                        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: `0 4px 20px ${color}40`,
                        transition: 'all var(--transition-base)',
                        zIndex: 1,
                        position: 'relative',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 30px ${color}50`;
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${color}40`;
                    }}
                >
                    <Plus size={18} strokeWidth={2.5} />
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
