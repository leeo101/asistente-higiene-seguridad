import React, { useState } from 'react';
import { X, Copy, Check, FileDown, Share2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { generatePdfBlob } from '../utils/pdfHelper';

/**
 * ShareModal – redes sociales, portapapeles y [NUEVO] Compartir PDF Nativo.
 *
 * Props:
 *   open             {boolean}  – mostrar/ocultar
 *   onClose          {function} – callback para cerrar
 *   title            {string}   – título del documento
 *   text             {string}   – texto a compartir (resumen del reporte)
 *   elementIdToPrint {string}   - ID del div que contiene el reporte a convertir en PDF
 */
export default function ShareModal({ open, onClose, title = '', text = '', elementIdToPrint = null }) {
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    if (!open) return null;

    const appUrl = 'https://asistentehs.com';
    // Remove duplicate "Generado con Asistente H&S" from the incoming text, if present.
    const cleanText = text.replace(/\n*Generado con Asistente H(&|Y)S/gi, '').trim();

    const rawMessage = `📄 *${title}*\n\n${cleanText}\n\n━━━━━━━━━━━━━━━━━━━━━━\n📱 *Generado con Asistente H&S*\nLa plataforma gratuita de Higiene y Seguridad con IA.\n🔗 Conocé más en: ${appUrl}`;

    const inviteMessage = encodeURIComponent(rawMessage);
    const encoded = encodeURIComponent(cleanText);
    const subject = encodeURIComponent(`Documento: ${title}`);
    const url = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');

    const options = [
        { label: 'WhatsApp', icon: '📱', color: '#25D366', bg: '#dcfce7', url: `https://wa.me/?text=${inviteMessage}`, hijack: true },
        { label: 'LinkedIn', icon: '🔗', color: '#0077b5', bg: '#e0f2fe', url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, hijack: false },
        { label: 'Facebook', icon: '👥', color: '#1877f2', bg: '#e7f3ff', url: `https://www.facebook.com/sharer/sharer.php?u=${url}`, hijack: false },
        { label: 'Telegram', icon: '✈️', color: '#229ED9', bg: '#e0f2fe', url: `https://t.me/share/url?url=${url}&text=${inviteMessage}`, hijack: true },
        { label: 'Twitter / X', icon: '𝕏', color: 'var(--color-text)', bg: 'var(--color-background)', url: `https://twitter.com/intent/tweet?text=${inviteMessage}`, hijack: false },
        { label: 'Email', icon: '📧', color: '#6366f1', bg: '#eef2ff', url: `mailto:?subject=${subject}&body=${inviteMessage}`, hijack: true },
    ];

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(rawMessage);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch { /* fallback silencioso */ }
    };

    const handleNativeShare = async () => {
        if (!elementIdToPrint) {
            toast.error("No se ha especificado el contenido a imprimir.");
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading('Generando documento PDF...', { id: 'pdf-gen' });

        try {
            // Generate the PDF
            const pdfBlob = await generatePdfBlob(elementIdToPrint);
            const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reporte'}.pdf`;

            // Test if native sharing with files is supported
            if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

                toast.success('Abriendo opciones de compartir...', { id: toastId });
                await navigator.share({
                    title: title,
                    text: rawMessage,
                    files: [file]
                });
            } else {
                // Fallback: Download the file automatically if sharing is not supported (usually Desktop)
                toast.success('Descargando archivo PDF...', { id: toastId });
                const url = window.URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast.success('¡PDF descargado! Puedes adjuntarlo manualmente.', { id: 'pdf-gen-done' });
            }
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error('Hubo un error al generar el PDF.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--color-surface)', borderRadius: '24px', padding: '2rem',
                    maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    position: 'relative', maxHeight: '90vh', overflowY: 'auto'
                }}
                onClick={e => e.stopPropagation()}
                className="hide-scrollbar"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'var(--color-background)', border: 'none', borderRadius: '50%',
                        width: '32px', height: '32px', cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <X size={16} />
                </button>

                <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.2rem', fontWeight: 900 }}>
                    Compartir Reporte
                </h2>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', wordBreak: 'break-word', paddingRight: '1rem' }}>
                    {title}
                </p>

                <p style={{ margin: '0 0 0.8rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text)' }}>{elementIdToPrint ? 'Selecciona una app para enviar el informe (PDF adjunto):' : 'Compartir enlace:'}</p>

                {/* Social buttons grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
                    {options.map(opt => (
                        <a
                            key={opt.label}
                            href={opt.hijack && elementIdToPrint ? '#' : opt.url}
                            target={opt.hijack && elementIdToPrint ? '_self' : '_blank'}
                            rel="noreferrer"
                            onClick={async (e) => {
                                if (opt.hijack && elementIdToPrint) {
                                    e.preventDefault();
                                    toast(`Elige tu app de ${opt.label} para poder adjuntar el PDF automáticamente.`, { icon: opt.icon, duration: 4500 });
                                    await handleNativeShare();
                                }
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.7rem',
                                padding: '0.7rem 1rem', background: opt.bg,
                                borderRadius: '12px', border: `1px solid ${opt.color}30`,
                                textDecoration: 'none', color: opt.color,
                                fontWeight: 800, fontSize: '0.8rem',
                                transition: 'transform 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <span style={{ fontSize: '1.1rem' }}>{opt.icon}</span>
                            {opt.label}
                        </a>
                    ))}
                </div>

                {/* Clipboard button */}
                <button
                    onClick={handleCopy}
                    style={{
                        width: '100%', padding: '0.8rem',
                        background: copied ? '#dcfce7' : 'var(--color-background)',
                        border: `1.5px solid ${copied ? '#86efac' : 'var(--color-border)'}`,
                        borderRadius: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.6rem', fontWeight: 800, fontSize: '0.8rem',
                        color: copied ? '#16a34a' : 'var(--color-text-muted)', transition: 'all 0.2s'
                    }}
                >
                    {copied
                        ? <><Check size={16} /> ¡Copiado al portapapeles!</>
                        : <><Copy size={16} /> Copiar texto de resumen</>
                    }
                </button>
            </div>
        </div>
    );
}

