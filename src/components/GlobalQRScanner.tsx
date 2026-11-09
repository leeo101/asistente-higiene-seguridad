import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function GlobalQRScanner({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'global-qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    );

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        scanner.clear().catch(() => {});
        if (decodedText.startsWith('app://asset/extinguisher/')) {
          const extId = decodedText.split('/').pop();
          navigate('/extintores?edit=' + extId);
          onClose();
        } else if (decodedText.startsWith(window.location.origin)) {
          const path = decodedText.replace(window.location.origin, '');
          navigate(path);
          onClose();
        } else if (decodedText.startsWith('http')) {
          window.location.href = decodedText;
        } else {
          toast.success(`Código detectado: ${decodedText}`);
          navigate('/asset-scanner');
          onClose();
        }
      },
      () => {
        // ignore frame errors
      }
    );

    return () => {
      scanner.clear().catch((error) => {
        console.error('Failed to clear html5QrcodeScanner. ', error);
      });
    };
  }, [navigate, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
    >
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={22} color="#ffffff" />
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem', color: '#ffffff', textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #059669, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem',
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)'
          }}
        >
          <QrCode size={30} color="#ffffff" />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
          Escáner QR de Activos
        </h2>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.78)', fontWeight: 600 }}>
          Apuntá al código QR de la etiqueta del equipo
        </p>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '3px solid #10b981',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div id="global-qr-reader" style={{ width: '100%', border: 'none' }} />
      </div>
    </div>
  );
}
