// ROLLBACK TO STABLE VERSION (MARCH 17TH) - TRIGGER VERCEL BUILD
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
  });
}

// Fix BFCache issues when returning from external gateways (e.g. MercadoPago)
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

import { Capacitor } from '@capacitor/core';
import { Printer } from '@capgo/capacitor-printer';
import { generatePdfBlob } from './utils/pdfHelper';
import toast from 'react-hot-toast';

if (Capacitor.isNativePlatform()) {
  const originalPrint = window.print;
  window.print = async () => {
    const target = document.querySelector('.isolated-print-target') as HTMLElement;
    
    if (target && target.id) {
        toast.loading('Generando vista previa...', { id: 'pdf-global' });
        try {
            await new Promise(resolve => setTimeout(resolve, 80));
            const pdfBlob = await generatePdfBlob(target.id);
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = reject;
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(pdfBlob);
            });
            
            const base64String = base64Data.split(',')[1];
            toast.dismiss('pdf-global');
            
            await Printer.printBase64({
                data: base64String,
                mimeType: 'application/pdf',
                name: 'Documento.pdf'
            });
        } catch (err) {
            console.error("Global native print error:", err);
            toast.dismiss('pdf-global');
            toast.error("La vista previa falló.");
            originalPrint();
        }
    } else {
        // Fallback si no hay isolated-print-target
        try {
            await Printer.printWebView();
        } catch (err) {
            originalPrint();
        }
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
