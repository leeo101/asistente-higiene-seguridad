import React, { useEffect } from 'react';
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
    iconEmoji?: string; // e.g. "🗑️", "⚠️"
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
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    let themeColor = '#ef4444'; // default danger
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)', padding: '1rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            background: 'var(--color-surface, #ffffff)', 
                            borderRadius: '24px', 
                            padding: '2.5rem 2rem',
                            maxWidth: '400px', 
                            width: '100%', 
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                            textAlign: 'center',
                            position: 'relative'
                        }}
                    >
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: `${themeColor}15`, color: themeColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            {iconEmoji ? (
                                <span style={{ fontSize: '3rem', lineHeight: 1 }}>{iconEmoji}</span>
                            ) : (
                                <IconComponent size={40} strokeWidth={1.5} />
                            )}
                        </div>

                        <h3 style={{ margin: '0 0 0.8rem', fontWeight: 900, color: 'var(--color-text, #1e293b)', fontSize: '1.5rem' }}>
                            {title}
                        </h3>
                        <p style={{ margin: '0 0 2rem', color: 'var(--color-text-muted, #64748b)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            {message}
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={onClose} 
                                style={{
                                    flex: 1, padding: '0.9rem', borderRadius: '14px',
                                    background: 'var(--color-background, #f1f5f9)', border: 'none', cursor: 'pointer',
                                    fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text, #334155)',
                                    transition: 'all 0.2s',
                                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-background, #f1f5f9)'}
                            >
                                {cancelText}
                            </button>
                            <button 
                                onClick={onConfirm} 
                                style={{
                                    flex: 1, padding: '0.9rem', borderRadius: '14px',
                                    background: gradient,
                                    border: 'none', cursor: 'pointer',
                                    fontWeight: 800, fontSize: '0.95rem', color: '#ffffff',
                                    boxShadow: `0 8px 16px ${themeColor}40`,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = `0 12px 20px ${themeColor}50`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = `0 8px 16px ${themeColor}40`;
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
