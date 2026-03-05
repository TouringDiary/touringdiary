
import React from 'react';
import { Trophy, X } from 'lucide-react';
import { StaticPage } from '../StaticPage';

// Lazy Imports per Core
const AuthModal = React.lazy(() => import('../../modals/AuthModal').then(module => ({ default: module.AuthModal })));
const GpsAlertModal = React.lazy(() => import('../../modals/GpsAlertModal').then(module => ({ default: module.GpsAlertModal })));
const GpsErrorModal = React.lazy(() => import('../../modals/GpsErrorModal').then(module => ({ default: module.GpsErrorModal })));

interface CoreModalsProps {
    activeModal: string | null;
    modalProps: any;
    closeModal: () => void;
    onConfirmGps: () => void;
    onAuthSuccess: (user: any) => void;
    onCloseAuth: () => void;
    activeStaticPage: any; // Router hook logic passed down if needed, but static pages handle internal nav often
}

export const CoreModals = ({ 
    activeModal, modalProps, closeModal, 
    onConfirmGps, onAuthSuccess, onCloseAuth 
}: CoreModalsProps) => {

    if (!activeModal) return null;

    return (
        <>
            {activeModal === 'auth' && (
                <AuthModal 
                    isOpen={true} 
                    onClose={onCloseAuth} 
                    onAuthSuccess={onAuthSuccess} 
                />
            )}
            
            {activeModal === 'gpsAlert' && (
                <GpsAlertModal 
                    isOpen={true} 
                    onClose={closeModal} 
                    onConfirm={onConfirmGps} 
                />
            )}
            
            {activeModal === 'gpsError' && (
                <GpsErrorModal 
                    isOpen={true} 
                    onClose={closeModal} 
                    error={modalProps.message || "Segnale GPS assente"} 
                    onRetry={onConfirmGps} 
                />
            )}

            {activeModal === 'reviewSuccess' && (
                <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                    <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600"></div>
                        <button onClick={closeModal} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2"><X className="w-5 h-5"/></button>
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <Trophy className="w-10 h-10 text-emerald-500 animate-bounce"/>
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white mb-2">Recensione Inviata!</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">Grazie per il tuo contributo prezioso.<br/><strong className="text-white block mt-2 text-lg">+20 XP <span className="text-xs font-normal opacity-70">(in attesa di approvazione)</span></strong></p>
                        <button onClick={closeModal} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95">Fantastico!</button>
                    </div>
                </div>
            )}
        </>
    );
};
