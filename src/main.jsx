// ROLLBACK TO STABLE VERSION (MARCH 17TH) - TRIGGER VERCEL BUILD
import React from 'react';
import { createRoot } from 'react-dom/client';
console.log('[DEBUG] Vercel Build ID: 2026-03-22-v3');
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
