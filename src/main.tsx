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
    enabled: import.meta.env.PROD,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
    ignoreErrors: [
      'int64',
      /int64/i,
      'QuotaExceededError',
      'DOMException: QuotaExceededError',
      /QuotaExceededError/i,
      /excedió la cuota/i,
      /quota.*exceeded/i,
      'NS_ERROR_DOM_QUOTA_REACHED',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /Script error/i,
    ],
    denyUrls: [
      /googlesyndication\.com/i,
      /pagead2?\.googlesyndication\.com/i,
      /pagead/i,
      /doubleclick\.net/i,
      /clarity\.ms/i,
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
    ],
    beforeSend(event, hint) {
      const error = hint?.originalException;
      const errorMsg =
        (typeof error === 'string'
          ? error
          : (error as any)?.message || (error as any)?.name) ||
        event?.message ||
        '';

      if (
        typeof errorMsg === 'string' &&
        (/int64/i.test(errorMsg) ||
         /quota/i.test(errorMsg) ||
         /excedió la cuota/i.test(errorMsg))
      ) {
        return null;
      }

      // Filtrar errores causados por scripts externos (AdSense, Clarity, extensiones)
      const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
      const isThirdParty = frames.some((f) => {
        const file = f.filename || '';
        return /googlesyndication|doubleclick|clarity|pagead|rum___|chrome-extension|moz-extension/i.test(file);
      });

      if (isThirdParty) {
        return null;
      }

      return event;
    },
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
    let target = document.querySelector('.isolated-print-target') as HTMLElement;
    
    // Si no hay target aislado, buscar por ID típico de reportes
    if (!target) {
        target = document.getElementById('pdf-content') as HTMLElement;
    }
    
    const targetId = target ? target.id : null;
    
    // Inmediatamente remover las clases visuales feas para que el usuario no vea el "pantallazo"
    // (los componentes agregan esto, nosotros lo sacamos al instante y usamos el clon en background)
    document.body.classList.remove('printing-isolated');
    if (target) {
        target.classList.remove('isolated-print-target');
    }
    
    if (targetId) {
        toast.loading('Generando vista previa...', { id: 'pdf-global' });
        try {
            await new Promise(resolve => setTimeout(resolve, 80));
            const pdfBlob = await generatePdfBlob(targetId);
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
