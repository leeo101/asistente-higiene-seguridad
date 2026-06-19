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

if (Capacitor.isNativePlatform()) {
  const originalPrint = window.print;
  window.print = async () => {
    try {
      await Printer.printWebView();
    } catch (err) {
      console.error("Native print error:", err);
      originalPrint();
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
