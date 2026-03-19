import { useState, useEffect } from 'react';
import { X, MessageCircle, Mail, Copy, Check, Share2, Loader2, Printer } from 'lucide-react';
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

    const handlePrint = () => {
        if (!elementIdToPrint) {
            toast.error("No se ha especificado el contenido a imprimir.");
            return;
        }

        const element = document.getElementById(elementIdToPrint);
        if (!element) return;

        // Store original styles
        const originalStyles = {
            position: element.style.position,
            left: element.style.left,
            top: element.style.top,
            zIndex: element.style.zIndex,
            opacity: element.style.opacity,
            visibility: element.style.visibility,
            display: element.style.display
        };

        // Prepare for print
        element.style.position = 'fixed';
        element.style.left = '0';
        element.style.top = '0';
        element.style.width = '100vw';
        element.style.height = '100vh';
        element.style.zIndex = '9999999';
        element.style.opacity = '1';
        element.style.visibility = 'visible';
        element.style.display = 'block';
        element.style.backgroundColor = 'white';

        setTimeout(() => {
            window.print();
            
            // Restore styles
            element.style.position = originalStyles.position;
            element.style.left = originalStyles.left;
            element.style.top = originalStyles.top;
            element.style.zIndex = originalStyles.zIndex;
            element.style.opacity = originalStyles.opacity;
            element.style.visibility = originalStyles.visibility;
            element.style.display = originalStyles.display;
        }, 300);
    };

    const handleNativeShare = async (optLabel) => {
        if (!elementIdToPrint) {
            toast.error("No se ha especificado el contenido a imprimir.");
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading(`Preparando PDF para ${optLabel}...`, { id: 'pdf-gen' });

        try {
            // Safety delay to ensure hidden generator has rendered
            await new Promise(resolve => setTimeout(resolve, 150));
            
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
            icon: (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
            ),
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
        },
        {
            label: 'Imprimir',
            icon: <Printer size={22} />,
            onClick: handlePrint,
            bg: '#1e293b',
            color: '#ffffff'
        }
    ];

    return createPortal(
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
            zIndex: 999999,
            padding: '1.5rem'
        }} onClick={onClose}>
            <div className="share-modal-container" style={{
                position: 'relative',
                width: '100%',
                maxWidth: 'min(440px, 100%)',
                boxSizing: 'border-box'
            }} onClick={e => e.stopPropagation()}>
                
                <div className="share-modal-content" style={{
                    background: 'var(--color-surface)',
                    borderRadius: isMobile ? '24px' : '28px',
                    width: '100%',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    padding: isMobile ? '1.25rem 1rem' : '2.5rem',
                    boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    position: 'relative',
                    boxSizing: 'border-box'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1.25rem',
                            right: '1.25rem',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '12px',
                            width: '36px',
                            height: '36px',
                            cursor: 'pointer',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Cerrar"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#ffffff',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.2)',
                            padding: '10px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <img 
                                src="/logo.png" 
                                alt="Logo" 
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'contain' 
                                }} 
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<div style="color:var(--color-primary)"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></div>';
                                }}
                            />
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
                                        href={opt.onClick ? '#' : (isHijacked ? '#' : opt.url)}
                                        target={isHijacked ? '_self' : '_blank'}
                                        rel="noreferrer"
                                        onClick={async (e) => {
                                            if (opt.onClick) {
                                                e.preventDefault();
                                                opt.onClick();
                                            } else if (isHijacked) {
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
        </div>,
        document.body
    );
};

export default ShareModal;
