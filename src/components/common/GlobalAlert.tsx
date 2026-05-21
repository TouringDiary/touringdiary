import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { AlertTriangle } from 'lucide-react';



export const GlobalAlert = () => {
    const [alerts, setAlerts] = useState<{ id: number, message: string }[]>([]);

    useEffect(() => {
        const handleAlert = (e: Event) => {
            const customEvent = e as CustomEvent<{ message: string }>;
            const id = Date.now();
            setAlerts(prev => [...prev, { id, message: customEvent.detail.message }]);
            setTimeout(() => {
                setAlerts(prev => prev.filter(a => a.id !== id));
            }, 5000);
        };

        window.addEventListener('global-alert', handleAlert);
        return () => window.removeEventListener('global-alert', handleAlert);
    }, []);

    if (alerts.length === 0) return null;

    return createPortal(
        <div 
            className="fixed top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 pointer-events-none"
            style={{ zIndex: Z_MODAL_NESTED }}
        >
            {alerts.map(alert => (
                <div key={alert.id} className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 pointer-events-auto max-w-sm w-full">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-sm font-medium flex-1">{alert.message}</p>
                    <CloseButton 
                        onClose={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))} 
                        variant="primary" 
                    />

                </div>
            ))}
        </div>,
        document.body
    );
};



