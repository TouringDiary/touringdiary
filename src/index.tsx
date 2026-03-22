
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || Buffer;
    (window as any).global = window;
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';
import { AppProviders } from '@/context/AppProviders';
import './index.css';

// Override window.alert to use our custom non-blocking toast
window.alert = (message?: any) => {
    const event = new CustomEvent('global-alert', { detail: { message: String(message) } });
    window.dispatchEvent(event);
};

const container = document.getElementById('root');

if (!container) {
    console.error("CRITICAL: Root element not found");
} else {
    const root = createRoot(container);
    // StrictMode disabilitato per stabilità in ambienti cloud con risorse limitate
    root.render(
        <GlobalErrorBoundary>
            <BrowserRouter>
                <AppProviders />
            </BrowserRouter>
        </GlobalErrorBoundary>
    );
}
