import React, { useEffect, useState } from 'react';
import { X, Mail, Copy, Check, Printer, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { useMemo } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { generatePdfBlob } from '../utils/pdfHelper';

interface ShareModalProps {
    isOpen?: boolean;
    open?: boolean;
    onClose: () => void;
    title: string;
    rawMessage?: string;
    text?: string;
    elementIdToPrint?: string;
    fileName?: string;
}

export default function ShareModal({ 
    isOpen, 
    open, 
    onClose, 
    title, 
    rawMessage, 
    text, 
    elementIdToPrint, 
    fileName: propFileName 
}: ShareModalProps) {
    const { isPro } = usePaywall();
    const displayOpen = isOpen !== undefined ? isOpen : open;
    const message = rawMessage !== undefined ? rawMessage : text || '';

    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [pendingShareFile, setPendingShareFile] = useState<File | null>(null);

    useEffect(() => {
        if (!displayOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [displayOpen, onClose]);

    if (!displayOpen) return null;

    const handleCopy = () => {
        if (!message) return;
        navigator.clipboard.writeText(message);
        setCopied(true);
        toast.success('Resumen copiado');
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        if (!isPro) {
            toast.error('La impresión de reportes es exclusiva para miembros PRO 💎', { duration: 4000 });
            return;
        }

        if (!elementIdToPrint) {
            toast.error("No se ha especificado el contenido a imprimir.");
            return;
        }

        const element = document.getElementById(elementIdToPrint);
        if (!element) return;

        document.body.classList.add('printing-isolated');
        element.classList.add('isolated-print-target');

        setTimeout(() => {
            window.print();
            document.body.classList.remove('printing-isolated');
            element.classList.remove('isolated-print-target');
        }, 300);
    };

    const handleNativeShare = async (optLabel: string) => {
        if (!isPro) {
            toast.error('La exportación en PDF es exclusiva para miembros PRO 💎', { duration: 4000 });
            return;
        }

        if (!elementIdToPrint) {
            toast.error("No se ha especificado el contenido a imprimir.");
            return;
        }

        setIsGenerating(true);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 150));
            const pdfBlob = await generatePdfBlob(elementIdToPrint);
            const safeName = propFileName ? (propFileName.endsWith('.pdf') ? propFileName : `${propFileName}.pdf`) : `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reporte'}.pdf`;
            const fileName = safeName;

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

            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            const shareData = {
                files: [file]
            };

            const fallbackShare = () => {
                triggerDownload();
                // Specific fallback for WhatsApp/Mail on desktop
                if (!isMobile) {
                    const opt = options.find(o => o.label === optLabel);
                    if (opt && opt.url && optLabel !== 'Imprimir') {
                        setTimeout(() => {
                            window.open(opt.url, '_blank');
                            toast.success(`PDF listo. Adjúntalo en ${optLabel}.`);
                        }, 1000);
                    }
                }
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                try {
                    await navigator.share(shareData);
                    toast.success('¡Compartido con éxito!', { id: 'pdf-gen' });
                } catch (shareErr: any) {
                    console.warn("Native share failed, falling back to download/link:", shareErr);
                    // If it's a user gesture error due to async timeout, offer a retry button
                    if (shareErr.name === 'NotAllowedError' || shareErr.message?.toLowerCase().includes('user gesture')) {
                        setPendingShareFile(file);
                        toast.success('PDF listo. Toca el botón para enviar.', { id: 'pdf-gen', duration: 4000 });
                    } else {
                        fallbackShare();
                    }
                }
            } else {
                fallbackShare();
            }
        } catch (error) {
            console.error("Error generating/sharing PDF:", error);
            toast.error('Hubo un error al procesar el PDF.', { id: 'pdf-gen' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDirectDownload = async () => {
        if (!isPro) {
            toast.error('La descarga de PDFs es exclusiva para miembros PRO 💎', { duration: 4000 });
            return;
        }

        if (!elementIdToPrint) return;
        
        // Trigger native print for true vector PDF quality instead of html2canvas screenshots
        toast.success('Para obtener la mejor calidad (sin capturas), selecciona "Guardar como PDF" en la siguiente ventana.', { duration: 5000 });
        setTimeout(() => {
            handlePrint();
        }, 1500);
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
            label: 'Descargar',
            icon: <Download size={22} />,
            onClick: handleDirectDownload,
            bg: '#8b5cf6',
            color: '#ffffff',
            hijack: false
        },
        {
            label: 'Imprimir',
            icon: <Printer size={22} />,
            onClick: handlePrint,
            bg: '#1e293b',
            color: '#ffffff',
            hijack: false
        }
    ];

    return createPortal(
        <div className="share-modal-overlay" style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: isMobile ? '0' : '1.5rem'
        }} onClick={onClose}>
            <div className="share-modal-container" style={{
                position: 'relative',
                width: '100%',
                maxWidth: isMobile ? '100%' : 'min(440px, 100%)',
                boxSizing: 'border-box'
            }} onClick={e => e.stopPropagation()}>
                
                <div className="share-modal-content" style={{
                    background: 'var(--color-surface)',
                    borderRadius: isMobile ? '24px 24px 0 0' : '28px',
                    width: '100%',
                    maxHeight: isMobile ? '90vh' : '85vh',
                    overflowY: 'auto',
                    padding: isMobile ? '1rem' : '2rem',
                    boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    position: 'relative',
                    boxSizing: 'border-box'
                }}>
                    {/* Drag handle indicator for mobile */}
                    {isMobile && (
                        <div style={{
                            width: '40px',
                            height: '4px',
                            background: 'var(--color-border)',
                            borderRadius: '9999px',
                            margin: '0 auto 1rem',
                            opacity: 0.6
                        }} />
                    )}

                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: isMobile ? '0.75rem' : '1.25rem',
                            right: isMobile ? '0.75rem' : '1.25rem',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '12px',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                            transition: 'all 0.2s',
                        }}
                        title="Cerrar"
                    >
                        <X size={16} strokeWidth={3} />
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: isMobile ? '1rem' : '1.5rem' }}>
                        <div style={{
                            width: isMobile ? '52px' : '72px',
                            height: isMobile ? '52px' : '72px',
                            background: '#ffffff',
                            borderRadius: isMobile ? '16px' : '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 0.75rem',
                            boxShadow: '0 6px 20px -4px rgba(0, 0, 0, 0.2)',
                            padding: '8px',
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
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) parent.innerHTML = '<div style="color:var(--color-primary)"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></div>';
                                }}
                            />
                        </div>
                        <h2 style={{
                            fontSize: isMobile ? '1.1rem' : '1.4rem',
                            fontWeight: 900,
                            color: 'var(--color-text)',
                            marginBottom: '0.3rem',
                            letterSpacing: '-0.3px'
                        }}>
                            Compartir Reporte
                        </h2>
                        <p style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '0.78rem',
                            fontWeight: '500',
                            margin: 0,
                            padding: '0 0.5rem',
                            overflow: 'hidden',
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                try {
                    await navigator.share(shareData);
                    toast.success('¡Compartido con éxito!', { id: 'pdf-gen' });
                } catch (shareErr: any) {
                    console.warn("Native share failed, falling back to download/link:", shareErr);
                    // If it's a user gesture error due to async timeout, offer a retry button
                    if (shareErr.name === 'NotAllowedError' || shareErr.message?.toLowerCase().includes('user gesture')) {
                        setPendingShareFile(file);
                        toast.success('PDF listo. Toca el botón para enviar.', { id: 'pdf-gen', duration: 4000 });
                    } else {
                        fallbackShare();
                    }
                }
            } else {
                fallbackShare();
            }
        } catch (error) {
            console.error("Error generating/sharing PDF:", error);
            toast.error('Hubo un error al procesar el PDF.', { id: 'pdf-gen' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDirectDownload = async () => {
        if (!isPro) {
            toast.error('La descarga de PDFs es exclusiva para miembros PRO 💎', { duration: 4000 });
            return;
        }

        if (!elementIdToPrint) return;
        
        // Trigger native print for true vector PDF quality instead of html2canvas screenshots
        toast.success('Para obtener la mejor calidad (sin capturas), selecciona "Guardar como PDF" en la siguiente ventana.', { duration: 5000 });
        setTimeout(() => {
            handlePrint();
        }, 1500);
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
            label: 'Descargar',
            icon: <Download size={22} />,
            onClick: handleDirectDownload,
            bg: '#8b5cf6',
            color: '#ffffff',
            hijack: false
        },
        {
            label: 'Imprimir',
            icon: <Printer size={22} />,
            onClick: handlePrint,
            bg: '#1e293b',
            color: '#ffffff',
            hijack: false
        }
    ];

    return createPortal(
        <div className="share-modal-overlay">
            <div className="share-modal-container" onClick={e => e.stopPropagation()}>
                <div className="share-modal-content">
                    <div className="share-drag-handle" />

                    <button className="share-close-btn" onClick={onClose} title="Cerrar">
                        <X size={16} strokeWidth={3} />
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div className="share-logo-box">
                            <img 
                                src="/logo.png" 
                                alt="Logo" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) parent.innerHTML = '<div style="color:var(--color-primary)"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></div>';
                                }}
                            />
                        </div>
                        <h2 className="share-title">Compartir Reporte</h2>
                        <p style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '0.78rem',
                            fontWeight: '500',
                            margin: 0,
                            padding: '0 0.5rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {title}
                        </p>
                    </div>

                    <div style={{ margin: '0.75rem 0', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 0.6rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text)' }}>
                            {elementIdToPrint ? 'Enviá el PDF por:' : 'Compartir enlace:'}
                        </p>

                        <div className="share-grid" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '0.6rem' 
                        }}>
                            {pendingShareFile ? (
                                <button
                                    onClick={async () => {
                                        try {
                                            await navigator.share({ files: [pendingShareFile] });
                                            setPendingShareFile(null);
                                        } catch (e) {
                                            console.warn(e);
                                        }
                                    }}
                                    className="share-item-button"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.9rem', background: '#22c55e',
                                        borderRadius: '14px', border: `1px solid rgba(255,255,255,0.2)`,
                                        color: '#ffffff', fontWeight: 800, fontSize: '0.9rem',
                                        gridColumn: '1 / -1', justifyContent: 'center',
                                        cursor: 'pointer', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
                                    }}
                                >
                                    ¡Compartir Ahora! 🚀
                                </button>
                            ) : options.map(opt => {
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
                                        className="share-item-button share-opt-btn"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                                            background: opt.bg,
                                            borderRadius: '14px', border: `1px solid ${opt.color}20`,
                                            textDecoration: 'none', color: opt.color,
                                            fontWeight: 800,
                                            transition: 'all 0.2s',
                                            justifyContent: 'center',
                                            opacity: (isGenerating && isHijacked) ? 0.7 : 1,
                                            pointerEvents: (isGenerating && isHijacked) ? 'none' : 'auto'
                                        }}
                                    >
                                        <span style={{ display: 'flex', flexShrink: 0 }}>
                                            {(isGenerating && isHijacked) ? <div className="spinner-mini" /> : opt.icon}
                                        </span>
                                        {(isGenerating && isHijacked) ? 'Generando...' : opt.label}
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {message ? (
                        <div style={{
                            padding: '0.85rem 1rem',
                            background: 'var(--color-background)',
                            borderRadius: '14px',
                            border: '1.5px dashed var(--color-border)',
                            position: 'relative',
                            marginTop: '0.75rem'
                        }}>
                            <button
                                onClick={handleCopy}
                                style={{
                                    position: 'absolute',
                                    right: '0.6rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: copied ? '#22c55e' : 'var(--color-surface)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '10px',
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    color: copied ? 'white' : 'var(--color-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                            <p style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                                margin: 0,
                                paddingRight: '3rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontWeight: 600
                            }}>
                                {message}
                            </p>
                        </div>
                    ) : null}

                    <div className="mobile-safe-area" />
                </div>

                <style>{`
                    .share-modal-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background-color: rgba(15, 23, 42, 0.85);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 999999;
                        padding: 1.5rem;
                    }
                    .share-modal-container {
                        position: relative;
                        width: 100%;
                        max-width: min(440px, 100%);
                        box-sizing: border-box;
                    }
                    .share-modal-content {
                        background: var(--color-surface);
                        border-radius: 28px;
                        width: 100%;
                        max-height: 85vh;
                        overflow-y: auto;
                        padding: 2rem;
                        box-shadow: 0 25px 70px -10px rgba(0, 0, 0, 0.5);
                        border: 1px solid rgba(255,255,255,0.1);
                        position: relative;
                        box-sizing: border-box;
                    }
                    .share-drag-handle {
                        display: none;
                        width: 40px;
                        height: 4px;
                        background: var(--color-border);
                        border-radius: 9999px;
                        margin: 0 auto 1rem;
                        opacity: 0.6;
                    }
                    .share-close-btn {
                        position: absolute;
                        top: 1.25rem;
                        right: 1.25rem;
                        background: #ef4444;
                        border: none;
                        border-radius: 12px;
                        width: 32px;
                        height: 32px;
                        cursor: pointer;
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10;
                        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                        transition: all 0.2s;
                    }
                    .share-logo-box {
                        width: 72px;
                        height: 72px;
                        background: #ffffff;
                        border-radius: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 0.75rem;
                        box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.2);
                        padding: 8px;
                        border: 1px solid var(--color-border);
                    }
                    .share-title {
                        font-size: 1.4rem;
                        font-weight: 900;
                        color: var(--color-text);
                        margin-bottom: 0.3rem;
                        letter-spacing: -0.3px;
                    }
                    .share-opt-btn {
                        padding: 0.9rem;
                        font-size: 0.9rem;
                    }
                    .mobile-safe-area {
                        display: none;
                    }
                    .share-item-button:hover {
                        filter: brightness(0.92);
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(0,0,0,0.18);
                    }
                    .share-item-button:active {
                        transform: translateY(0px);
                        filter: brightness(0.85);
                    }
                    .spinner-mini {
                        width: 18px;
                        height: 18px;
                        border: 2px solid currentColor;
                        border-radius: 50%;
                        border-top-color: transparent;
                        animation: spin 0.8s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    /* ── Mobile Layout (< 768px) ── */
                    @media (max-width: 767px) {
                        .share-modal-overlay {
                            align-items: flex-end;
                            padding: 0;
                        }
                        .share-modal-container {
                            max-width: 100%;
                        }
                        .share-modal-content {
                            border-radius: 24px 24px 0 0;
                            max-height: 90vh;
                            padding: 1.25rem 1rem 1.5rem;
                        }
                        .share-drag-handle {
                            display: block;
                        }
                        .share-close-btn {
                            top: 1rem;
                            right: 1rem;
                        }
                        .share-logo-box {
                            width: 52px;
                            height: 52px;
                            border-radius: 16px;
                        }
                        .share-title {
                            font-size: 1.15rem;
                        }
                        .share-opt-btn {
                            padding: 0.85rem 0.6rem;
                            font-size: 0.82rem;
                        }
                        .mobile-safe-area {
                            display: block;
                            height: env(safe-area-inset-bottom, 16px);
                        }
                    }
                `}</style>
            </div>
        </div>,
        document.body
    );
};
