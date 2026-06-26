import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  iconEmoji?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  iconEmoji
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  let themeColor = '#ef4444';
  let gradient = 'linear-gradient(135deg, #ef4444, #dc2626)';
  let IconComponent = Trash2;

  if (type === 'warning') {
    themeColor = '#f59e0b';
    gradient = 'linear-gradient(135deg, #fbbf24, #d97706)';
    IconComponent = AlertTriangle;
  } else if (type === 'info') {
    themeColor = '#3b82f6';
    gradient = 'linear-gradient(135deg, #60a5fa, #2563eb)';
    IconComponent = AlertCircle;
  }

  const modal =
  <AnimatePresence>
            {isOpen &&
    <motion.div
      key="confirm-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{













        WebkitBackdropFilter: 'blur(8px)' as any


      }}
      onClick={onClose} className="fixed top-[0] left-[0] right-[0] bottom-[0] w-[100vw] h-[100vh] bg-[rgba(0,0,0,0.55)] z-[2147483647] flex items-center justify-center backdrop-filter-[blur(8px)] p-[1rem] box-sizing-[border-box]">
      
                    <motion.div
        key="confirm-card"
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 24 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()} className="bg-[var(--color-surface,_#ffffff)] rounded-[28px] p-[2.5rem_2rem] max-w-[400px] w-[100%] box-shadow-[0_32px_64px_-12px_rgba(0,0,0,0.35),_0_0_0_1px_rgba(255,255,255,0.08)] text-center relative">










        
                        {/* Icon */}
                        <div style={{

          background: `${themeColor}18`, color: themeColor,


          border: `2px solid ${themeColor}22`
        }} className="w-[80px] h-[80px] rounded-[50%] flex items-center justify-center m-[0_auto_1.5rem_auto]">
                            {iconEmoji ?
          <span className="text-[2.8rem] line-height-[1]">{iconEmoji}</span> :

          <IconComponent size={38} strokeWidth={1.5} />
          }
                        </div>

                        <h3 className="m-[0_0_0.75rem] font-[900] text-[var(--color-text,_#1e293b)] text-[1.4rem] line-height-[1.2]">





          
                            {title}
                        </h3>
                        <p className="m-[0_0_2rem] text-[var(--color-text-muted,_#64748b)] text-[0.95rem] line-height-[1.55]">




          
                            {message}
                        </p>

                        <div className="flex gap-[0.85rem]">
                            <button
            onClick={onClose}









            onMouseEnter={(e) => {e.currentTarget.style.background = 'var(--color-border, #e2e8f0)';}}
            onMouseLeave={(e) => {e.currentTarget.style.background = 'var(--color-background, #f1f5f9)';}} className="flex-[1] p-[0.9rem] rounded-[14px] bg-[var(--color-background,_#f1f5f9)] border-[1.5px_solid_var(--color-border,_#e2e8f0)] cursor-pointer font-[800] text-[0.95rem] text-[var(--color-text,_#334155)] transition-[all_0.18s]">
            
                                {cancelText}
                            </button>
                            <button
            onClick={onConfirm}
            style={{

              background: gradient,


              boxShadow: `0 8px 20px ${themeColor}45`

            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 14px 28px ${themeColor}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = `0 8px 20px ${themeColor}45`;
            }} className="flex-[1] p-[0.9rem] rounded-[14px] border-none cursor-pointer font-[800] text-[0.95rem] text-[#ffffff] transition-[all_0.18s]">
            
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
    }
        </AnimatePresence>;


  // Render into document.body via portal so NO parent transform/z-index/filter affects it
  return createPortal(modal, document.body);
}