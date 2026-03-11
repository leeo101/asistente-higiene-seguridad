import { useState, useEffect } from 'react';
import { X, MessageCircle, Mail, Copy, Check, Share2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { generatePdfBlob } from '../utils/pdfHelper';

const ShareModal = ({ isOpen, open, onClose, title, rawMessage, text, elementIdToPrint }) => {
    const displayOpen = isOpen !== undefined ? isOpen : open;
    const message = rawMessage !== undefined ? rawMessage : text;

    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 450);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 450);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Also close on Escape key
    useEffect(() => {
        if (!displayOpen) return;
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [displayOpen, onClose]);

    if (!displayOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(message);

        setCopied(true);
        toast.success('Resumen copiado');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async (optLabel) => {
        if (!elementIdToPrint) {
            toast.error("No se ha especificado el contenido a imprimir.");
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading(`Preparando PDF para ${optLabel}...`, { id: 'pdf-gen' });

        try {
            const pdfBlob = await generatePdfBlob(elementIdToPrint);
            const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reporte'}.pdf`;

            const triggerDownload = () => {
                const url = window.URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast.success('¡PDF generado! Descargando...', { id: 'pdf-gen' });
            };

            if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                
                try {
                    await navigator.share({
                        title: title,
                        text: message,
                        files: [file]
                    });
                    toast.success('¡Compartido con éxito!', { id: 'pdf-gen' });
                } catch (shareErr) {
                    if (shareErr.name === 'AbortError') {
                        triggerDownload();
                    } else {
                        throw shareErr;
                    }
                }
            } else {
                triggerDownload();
            }
        } catch (error) {
            console.error("Error generating/sharing PDF:", error);
            toast.error('Hubo un error al procesar el PDF.', { id: 'pdf-gen' });
        } finally {
            setIsGenerating(false);
        }
    };

    const options = [
        {
            label: 'WhatsApp',
            icon: <MessageCircle size={22} />,
            url: `https://wa.me/?text=${encodeURIComponent(message)}`,
            bg: '#25D366',
            color: '#ffffff',
            hijack: true
        },
        {
            label: 'Correo',
            icon: <Mail size={22} />,
            url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`,
            bg: '#3b82f6',
            color: '#ffffff',
            hijack: true
        }
    ];

    const modalContent = (
        <div className="share-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999, // Absolute top
            padding: '1.5rem'
        }} onClick={onClose}>
            <div className="share-modal-content" style={{
                background: 'var(--color-surface)',
                borderRadius: '28px',
                width: '100%',
                maxWidth: '440px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: isMobile ? '1.5rem' : '2.5rem',
                position: 'relative',
                boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                marginTop: isMobile ? '3rem' : '0' // Extra margin to avoid top bar
            }} onClick={e => e.stopPropagation()}>
                
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.25rem',
                        right: '1.25rem',
                        background: 'rgba(0,0,0,0.05)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        zIndex: 100
                    }}
                    title="Cerrar"
                >
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                        boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.3)',
                        color: 'white'
                    }}>
                        <Share2 size={32} />
                    </div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        color: 'var(--color-text)',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.5px'
                    }}>
                        Compartir Reporte
                    </h2>
                    <p style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        margin: 0,
                        padding: '0 1rem'
                    }}>
                        {title}
                    </p>
                </div>

                <div style={{ margin: '1rem 0', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 0.8rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text)' }}>
                        {elementIdToPrint ? 'Selecciona una app para enviar (PDF):' : 'Compartir enlace:'}
                    </p>

                    <div className="share-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                        gap: '1rem' 
                    }}>
                        {options.map(opt => {
                            const isHijacked = opt.hijack && elementIdToPrint;
                            
                            return (
                                <a
                                    key={opt.label}
                                    href={isHijacked ? '#' : opt.url}
                                    target={isHijacked ? '_self' : '_blank'}
                                    rel="noreferrer"
                                    onClick={async (e) => {
                                        if (isHijacked) {
                                            e.preventDefault();
                                            if (isGenerating) return;
                                            await handleNativeShare(opt.label);
                                        }
                                    }}
                                    className="share-item-button"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.8rem',
                                        padding: '1rem', background: opt.bg,
                                        borderRadius: '16px', border: `1px solid ${opt.color}20`,
                                        textDecoration: 'none', color: opt.color,
                                        fontWeight: 800, fontSize: '0.9rem',
                                        transition: 'all 0.2s',
                                        justifyContent: 'center',
                                        opacity: (isGenerating && isHijacked) ? 0.7 : 1,
                                        pointerEvents: (isGenerating && isHijacked) ? 'none' : 'auto'
                                    }}
                                >
                                    <span style={{ display: 'flex' }}>
                                        {(isGenerating && isHijacked) ? <div className="spinner-mini" /> : opt.icon}
                                    </span>
                                    {(isGenerating && isHijacked) ? 'Generando...' : opt.label}
                                </a>
                            );
                        })}
                    </div>
                </div>

                <div style={{
                    padding: '1.25rem',
                    background: 'var(--color-background)',
                    borderRadius: '20px',
                    border: '1.5px dashed var(--color-border)',
                    position: 'relative',
                    marginTop: '1rem'
                }}>
                    <button
                        onClick={handleCopy}
                        style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: copied ? '#22c55e' : 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            padding: '0.6rem',
                            cursor: 'pointer',
                            color: copied ? 'white' : 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                    <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        margin: 0,
                        paddingRight: '3.5rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: 600
                    }}>
                        {message}
                    </p>
                </div>
            </div>

            <style>{`
                .share-item-button:hover {
                    filter: brightness(0.95);
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
                }
                .spinner-mini {
                    width: 20px;
                    height: 20px;
                    border: 2px solid currentColor;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );

    // Render into body to bypass any stacking context issues (navbar overlap)
    return createPortal(modalContent, document.body);
};

export default ShareModal;
