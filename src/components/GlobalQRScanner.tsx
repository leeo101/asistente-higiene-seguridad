import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GlobalQRScanner({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState<string | null>(null);

    useEffect(() => {
        let scanner = new Html5QrcodeScanner(
            "global-qr-reader",
            { fps: 10, qrbox: {width: 250, height: 250}, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
            false
        );

        scanner.render(
            (decodedText) => {
                setScanResult(decodedText);
                scanner.clear();
                // Handle the routing here based on payload. Example payload: app://asset/extinguisher/123
                if (decodedText.startsWith('app://asset/extinguisher/')) {
                    const extId = decodedText.split('/').pop();
                    // Just an example action: we could route it to the extinguisher detail, but the main page is /extinguishers
                    // Wait, currently extinguisher doesn't have a detail page by ID, it lives in a modal. Let's just navigate to /extinguishers for now, and ideally search it.
                    navigate('/extinguishers?search=' + extId);
                    onClose();
                } else {
                    // Navigate if it's a URL or log it
                    if (decodedText.startsWith('http')) {
                        window.location.href = decodedText;
                    } else {
                        alert('Código QR no reconocido: ' + decodedText);
                        onClose();
                    }
                }
            },
            (err) => {
                // ignore
            }
        );

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, [navigate, onClose]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
                <button onClick={onClose} style={{ 
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
                    color: 'white', borderRadius: '50%', padding: '0.8rem', cursor: 'pointer' 
                }}>
                    <X size={24} />
                </button>
            </div>
            
            <div style={{ marginBottom: '2rem', color: 'white', textAlign: 'center' }}>
                <QrCode size={48} style={{ marginBottom: '1rem', opacity: 0.8 }} />
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Escáner de Activos</h2>
                <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.7)' }}>Apunta al código QR del equipo</p>
            </div>

            <div style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '16px', overflow: 'hidden' }}>
                <div id="global-qr-reader" style={{ width: '100%', border: 'none' }}></div>
            </div>
        </div>
    );
}
