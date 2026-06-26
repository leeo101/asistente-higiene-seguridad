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
  color = '#3B82F6'
}: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center p-[4rem_2rem] text-center relative overflow-[hidden]">








      
            {/* Decorative background circles */}
            <div style={{







        background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`

      }} className="absolute top-[50%] left-[50%] transform-[translate(-50%,_-50%)] w-[280px] h-[280px] rounded-[50%] pointer-events-[none]" />
            <div style={{







        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`

      }} className="absolute top-[50%] left-[50%] transform-[translate(-50%,_-50%)] w-[180px] h-[180px] rounded-[50%] pointer-events-[none]" />

            {/* SVG Illustration */}
            <div className="relative mb-[1.75rem] z-[1]">



        
                {/* Outer ring */}
                <div style={{



          background: `${color}12`,
          border: `2px dashed ${color}40`




        }} className="w-[100px] h-[100px] rounded-[50%] flex items-center justify-center animation-[pulse-soft_3s_ease-in-out_infinite]">
                    {/* Inner icon circle */}
                    <div style={{



            background: `linear-gradient(135deg, ${color}25, ${color}15)`,



            border: `1.5px solid ${color}30`
          }} className="w-[68px] h-[68px] rounded-[50%] flex items-center justify-center">
                        {icon ?
            React.isValidElement(icon) ?
            React.cloneElement(icon as React.ReactElement<any>, {
              size: 32,
              color: color,
              strokeWidth: 1.5
            }) :
            icon :

            // Default: generic document SVG
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
            }
                    </div>
                </div>

                {/* Small decorative dots */}
                {[
        { top: -6, right: 8 },
        { bottom: 4, left: -4 },
        { top: 20, left: -12 }].
        map((pos, i) =>
        <div key={i} style={{

          width: i === 0 ? 10 : i === 1 ? 7 : 5,
          height: i === 0 ? 10 : i === 1 ? 7 : 5,

          background: `${color}${i === 0 ? '50' : i === 1 ? '35' : '25'}`,
          ...pos
        }} className="absolute rounded-[50%]" />
        )}
            </div>

            {/* Text */}
            <h3 className="m-[0_0_0.6rem_0] text-[1.15rem] font-[800] text-[var(--color-text)] letter-spacing-[-0.3px] z-[1] relative">







        
                {title}
            </h3>
            <p className="m-[0_0_2rem_0] text-[0.9rem] text-[var(--color-text-muted)] max-w-[320px] line-height-[1.6] z-[1] relative">







        
                {description}
            </p>

            {/* CTA Button */}
            {onAction &&
      <button
        onClick={onAction}
        style={{




          background: `linear-gradient(135deg, ${color}, ${color}cc)`,






          boxShadow: `0 4px 20px ${color}40`



        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 30px ${color}50`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${color}40`;
        }} className="display-[inline-flex] items-center gap-[0.5rem] p-[0.85rem_1.75rem] text-[#fff] border-none rounded-[var(--radius-lg)] font-[700] text-[0.9rem] cursor-pointer transition-[all_var(--transition-base)] z-[1] relative">
        
                    <Plus size={18} strokeWidth={2.5} />
                    {actionLabel}
                </button>
      }
        </div>);

}