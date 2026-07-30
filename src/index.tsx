import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';
import { AppProviders } from '@/context/AppProviders';
import './index.css';

// Bootstrap: sostituiamo `window.alert` con il nostro toast non-blocking globale,
// instradando l'evento verso il sistema UI interno (`global-alert`) invece di bloccare l'utente.
window.alert = (message?: any) => {
    const event = new CustomEvent('global-alert', { detail: { message: String(message ?? '') } });
    window.dispatchEvent(event);
};

const container = document.getElementById('root');

if (!container) {
    console.error("CRITICAL: Root element not found");
} else {
    const root = createRoot(container);
    // StrictMode disabilitato per stabilità in ambienti cloud con risorse limitate
    root.render(
        <GlobalErrorBoundary variant="bootstrap">
            <BrowserRouter>
                <AppProviders />
            </BrowserRouter>
        </GlobalErrorBoundary>
    );
}
