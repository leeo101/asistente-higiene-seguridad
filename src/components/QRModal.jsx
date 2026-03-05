import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download } from 'lucide-react';

/**
 * QRModal — muestra un código QR generado desde texto.
 * Props:
 *   text: string     — contenido del QR
 *   title: string    — título del modal
 *   onClose: fn
 */
export default function QRModal({ text, title = 'Código QR', onClose }) {
    const canvasRef = useRef(null);
    const [dataUrl, setDataUrl] = useState(null);

    useEffect(() => {
        if (!text || !canvasRef.current) return;
        QRCode.toCanvas(canvasRef.current, text, {
            width: 260,
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' }
        }, (err) => {
            if (!err) setDataUrl(canvasRef.current.toDataURL());
        });
    }, [text]);

    const handleDownload = () => {
        if (!dataUrl) return;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `qr_${title.replace(/\s+/g, '_').toLowerCase()}.png`;
        a.click();
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1.5rem', animation: 'fadeIn 0.2s ease'
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--color-surface)', borderRadius: '24px',
                    padding: '2rem', maxWidth: '320px', width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                    border: '1px solid var(--color-border)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.2rem', display: 'flex' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ background: '#fff', borderRadius: '16px', padding: '1rem', display: 'inline-block', marginBottom: '1rem' }}>
                    <canvas ref={canvasRef} />
                </div>

                <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    Escaneá este código para ver el detalle del registro
                </p>

                <button
                    onClick={handleDownload}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        width: '100%', padding: '0.75rem', borderRadius: '12px',
                        background: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
                        color: 'white', border: 'none', cursor: 'pointer',
                        fontWeight: 800, fontSize: '0.88rem'
                    }}
                >
                    <Download size={16} /> Guardar imagen
                </button>
            </div>
        </div>
    );
}
