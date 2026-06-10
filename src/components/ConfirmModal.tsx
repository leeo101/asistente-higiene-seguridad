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

    const modal = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="confirm-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.55)',
                        zIndex: 2147483647,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)' as any,
                        padding: '1rem',
                        boxSizing: 'border-box',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        key="confirm-card"
                        initial={{ opacity: 0, scale: 0.88, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 24 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--color-surface, #ffffff)',
                            borderRadius: '28px',
                            padding: '2.5rem 2rem',
                            maxWidth: '400px',
                            width: '100%',
                            boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
                            textAlign: 'center',
                            position: 'relative',
                        }}
                    >
                        {/* Icon */}
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: `${themeColor}18`, color: themeColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem auto',
                            border: `2px solid ${themeColor}22`,
                        }}>
                            {iconEmoji ? (
                                <span style={{ fontSize: '2.8rem', lineHeight: 1 }}>{iconEmoji}</span>
                            ) : (
                                <IconComponent size={38} strokeWidth={1.5} />
                            )}
                        </div>

                        <h3 style={{
                            margin: '0 0 0.75rem',
                            fontWeight: 900,
                            color: 'var(--color-text, #1e293b)',
                            fontSize: '1.4rem',
                            lineHeight: 1.2,
                        }}>
                            {title}
                        </h3>
                        <p style={{
                            margin: '0 0 2rem',
                            color: 'var(--color-text-muted, #64748b)',
                            fontSize: '0.95rem',
                            lineHeight: 1.55,
                        }}>
                            {message}
                        </p>

                        <div style={{ display: 'flex', gap: '0.85rem' }}>
                            <button
                                onClick={onClose}
                                style={{
                                    flex: 1, padding: '0.9rem', borderRadius: '14px',
                                    background: 'var(--color-background, #f1f5f9)',
                                    border: '1.5px solid var(--color-border, #e2e8f0)',
                                    cursor: 'pointer',
                                    fontWeight: 800, fontSize: '0.95rem',
                                    color: 'var(--color-text, #334155)',
                                    transition: 'all 0.18s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-border, #e2e8f0)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-background, #f1f5f9)'; }}
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
                                    boxShadow: `0 8px 20px ${themeColor}45`,
                                    transition: 'all 0.18s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = `0 14px 28px ${themeColor}55`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.boxShadow = `0 8px 20px ${themeColor}45`;
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Render into document.body via portal so NO parent transform/z-index/filter affects it
    return createPortal(modal, document.body);
}
