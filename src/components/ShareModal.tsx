import React, { useEffect, useState } from 'react';
import { X, Mail, Copy, Check, Printer, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [pendingShareFile, setPendingShareFile] = useState<File | null>(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const handlePrint = async () => {
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

        if (Capacitor.isNativePlatform()) {
            try {
                // @ts-ignore
                const { Printer } = await import('@capgo/capacitor-printer');
                await Printer.printWebView({ name: title || 'Reporte' });
                
                document.body.classList.remove('printing-isolated');
                element.classList.remove('isolated-print-target');
                onClose();
            } catch (err) {
                console.error("Error printing natively:", err);
                toast.error("La impresión directa falló. Generando PDF...");
                
                document.body.classList.remove('printing-isolated');
                element.classList.remove('isolated-print-target');
                
                // Fallback a compartir
                handleNativeShare('Imprimir');
            }
        } else {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('printing-isolated');
                if (element) element.classList.remove('isolated-print-target');
                onClose();
            }, 8000);
        }
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
        toast.loading('Generando PDF...', { id: 'pdf-gen' });
        
        try {
            // Pequeño delay para que el toast de "generando" se muestre antes de bloquear el hilo
            await new Promise(resolve => setTimeout(resolve, 80));

            const pdfBlob = await generatePdfBlob(elementIdToPrint);
            
            const safeName = propFileName
                ? (propFileName.endsWith('.pdf') ? propFileName : `${propFileName}.pdf`)
                : `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reporte'}.pdf`;
            const fileName = safeName;

            if (Capacitor.isNativePlatform()) {
                try {
                    // Convert blob to base64
                    const base64Data = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onerror = reject;
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(pdfBlob);
                    });
                    const base64String = base64Data.split(',')[1];
                    
                    const savedFile = await Filesystem.writeFile({
                        path: fileName,
                        data: base64String,
                        directory: Directory.Cache
                    });
                    
                    await Share.share({
                        title: title || 'Reporte de Seguridad',
                        text: message || 'Adjunto el reporte PDF.',
                        files: [savedFile.uri],
                        dialogTitle: 'Compartir PDF'
                    });
                    toast.success('¡Compartido con éxito!', { id: 'pdf-gen' });
                } catch (nativeErr) {
                    console.error("Error nativo al compartir:", nativeErr);
                    toast.error('Error al compartir en dispositivo móvil.', { id: 'pdf-gen' });
                }
                return;
            }

            const triggerDownload = () => {
                const url = window.URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                toast.success('¡PDF generado! Descargando...', { id: 'pdf-gen' });
            };

            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            const shareData = { files: [file] };

            const fallbackShare = () => {
                triggerDownload();
                if (!isMobile) {
                    const opt = options.find(o => o.label === optLabel);
                    if (opt && opt.url && optLabel !== 'Imprimir') {
                        setTimeout(() => {
                            window.open(opt.url, '_blank');
                            toast.success(`PDF listo. Adjúntalo en ${optLabel}.`, { id: 'pdf-gen' });
                        }, 1000);
                    }
                }
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                try {
                    await navigator.share(shareData);
                    toast.success('¡Compartido con éxito!', { id: 'pdf-gen' });
                } catch (shareErr: any) {
                    console.warn("Native share failed, falling back:", shareErr);
                    if (shareErr.name === 'NotAllowedError' || shareErr.message?.toLowerCase().includes('user gesture')) {
                        setPendingShareFile(file);
                        toast.success('PDF listo. Toca el botón para enviar.', { id: 'pdf-gen', duration: 4000 });
                    } else if (shareErr.name === 'AbortError') {
                        // El usuario canceló el selector de compartir — no es un error
                        toast.dismiss('pdf-gen');
                    } else {
                        fallbackShare();
                    }
                }
            } else {
                fallbackShare();
            }
        } catch (error) {
            console.error("Error generating/sharing PDF:", error);
            toast.error('Hubo un error al procesar el PDF. Intentá de nuevo.', { id: 'pdf-gen' });
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

        if (Capacitor.isNativePlatform()) {
            handleNativeShare('Descargar');
            return;
        }
        
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
        <div className="share-modal-overlay" onClick={onClose}>
            <div className="share-modal-container" onClick={e => e.stopPropagation()}>
                
                <div className="share-modal-content">
                    {/* Drag handle indicator for mobile - hidden by default, can be shown in CSS if needed but we want it centered now */}
                    <div className="share-drag-handle" />

                    <button
                        onClick={onClose}
                        className="share-close-btn"
                        title="Cerrar"
                    >
                        <X size={16} strokeWidth={3} />
                    </button>

                    <div className="share-header">
                        <div className="share-logo-box">
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
                        <h2 className="share-title">
                            Compartir Reporte
                        </h2>
                        <p className="share-subtitle">
                            {title}
                        </p>
                    </div>

                    <div style={{ margin: '0.75rem 0', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 0.6rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text)' }}>
                            {elementIdToPrint ? 'Enviá el PDF por:' : 'Compartir enlace:'}
                        </p>

                        <div className="share-grid">
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
                                    className="share-item-button share-btn-now"
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
                                            background: opt.bg,
                                            border: `1px solid ${opt.color}20`,
                                            color: opt.color,
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
                        <div className="share-message-box">
                            <button
                                onClick={handleCopy}
                                className="share-copy-btn"
                                style={{
                                    background: copied ? '#22c55e' : 'var(--color-surface)',
                                    color: copied ? 'white' : 'var(--color-primary)',
                                }}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                            <p className="share-message-text">
                                {message}
                            </p>
                        </div>
                    ) : null}

                    {/* Safe area padding for iOS home bar */}
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
                        box-sizing: border-box;
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
                    .share-header {
                        text-align: center;
                        margin-bottom: 1.5rem;
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
                        word-break: break-word;
                        overflow-wrap: break-word;
                        line-height: 1.2;
                    }
                    .share-subtitle {
                        color: var(--color-text-muted);
                        font-size: 0.78rem;
                        font-weight: 500;
                        margin: 0;
                        padding: 0 0.5rem;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        line-height: 1.3;
                    }
                    .share-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 0.6rem;
                    }
                    .share-item-button {
                        display: flex;
                        align-items: center;
                        gap: 0.6rem;
                        border-radius: 14px;
                        text-decoration: none;
                        font-weight: 800;
                        transition: all 0.2s;
                        justify-content: center;
                        cursor: pointer;
                    }
                    .share-btn-now {
                        padding: 0.9rem;
                        background: #22c55e;
                        border: 1px solid rgba(255,255,255,0.2);
                        color: #ffffff;
                        font-size: 0.9rem;
                        grid-column: 1 / -1;
                        box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
                    }
                    .share-opt-btn {
                        padding: 0.9rem;
                        font-size: 0.9rem;
                    }
                    .share-message-box {
                        padding: 0.85rem 1rem;
                        background: var(--color-background);
                        border-radius: 14px;
                        border: 1.5px dashed var(--color-border);
                        position: relative;
                        margin-top: 0.75rem;
                        min-width: 0;
                        overflow: hidden;
                    }
                    .share-copy-btn {
                        position: absolute;
                        right: 0.6rem;
                        top: 50%;
                        transform: translateY(-50%);
                        border: 1px solid var(--color-border);
                        border-radius: 10px;
                        padding: 0.5rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                        transition: all 0.2s;
                    }
                    .share-message-text {
                        font-size: 0.75rem;
                        color: var(--color-text-muted);
                        margin: 0;
                        padding-right: 3rem;
                        word-break: break-word;
                        white-space: pre-wrap;
                        font-weight: 600;
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
                    @keyframes slideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                    @media (max-width: 767px) {
                        .share-modal-overlay {
                            align-items: flex-end;
                            padding: 1rem;
                        }
                        .share-modal-container {
                            max-width: 100%;
                            width: 100%;
                        }
                        .share-modal-content {
                            border-radius: 28px;
                            max-height: 85vh;
                            padding: 1.5rem 1.25rem;
                            border-bottom: 1px solid rgba(255,255,255,0.1);
                            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                        }
                        .share-drag-handle {
                            display: none;
                        }
                        .share-close-btn {
                            top: 1rem;
                            right: 1rem;
                            width: 32px;
                            height: 32px;
                            background: #ef4444;
                            color: #ffffff;
                            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                        }
                        .share-header {
                            margin-bottom: 1rem;
                            margin-top: 0.5rem;
                        }
                        .share-logo-box {
                            display: none;
                        }
                        .share-title {
                            font-size: 1.15rem;
                        }
                        .share-subtitle {
                            font-size: 0.8rem;
                        }
                        .share-grid {
                            grid-template-columns: 1fr 1fr;
                            gap: 0.5rem;
                        }
                        .share-opt-btn {
                            padding: 0.75rem 0.5rem;
                            font-size: 0.8rem;
                            border-radius: 14px;
                        }
                        .mobile-safe-area {
                            display: block;
                            height: env(safe-area-inset-bottom, 15px);
                        }
                    }
                `}</style>
            </div>
        </div>,
        document.body
    );
};
