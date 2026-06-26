import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GlobalQRScanner({ onClose }: {onClose: () => void;}) {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    let scanner = new Html5QrcodeScanner(
      "global-qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
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
      });

    return () => {
      scanner.clear().catch((error) => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [navigate, onClose]);

  return (
    <div className="fixed inset-[0] z-[99999] bg-[rgba(0,0,0,0.85)] backdrop-filter-[blur(8px)] flex flex-col items-center justify-center">



      
            <div className="absolute top-[2rem] right-[2rem]">
                <button onClick={onClose} className="bg-[rgba(255,255,255,0.1)] border-[1px_solid_rgba(255,255,255,0.2)] text-[white] rounded-[50%] p-[0.8rem] cursor-pointer">


          
                    <X size={24} />
                </button>
            </div>
            
            <div className="mb-[2rem] text-[white] text-center">
                <QrCode size={48} className="mb-[1rem] opacity-[0.8]" />
                <h2 className="m-[0] text-[1.5rem] font-[800]">Escáner de Activos</h2>
                <p className="m-[0.5rem_0_0] text-[rgba(255,255,255,0.7)]">Apunta al código QR del equipo</p>
            </div>

            <div className="w-[100%] max-w-[400px] bg-[white] rounded-[16px] overflow-[hidden]">
                <div id="global-qr-reader" className="w-[100%] border-none"></div>
            </div>
        </div>);

}