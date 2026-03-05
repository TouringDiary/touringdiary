
import React from 'react';
import { X, CheckCircle, Trophy, Loader2 } from 'lucide-react';
import { useSystemMessage } from '../../../hooks/useSystemMessage';

interface Props {
    onClose: () => void;
}

export const GallerySuccessModal = ({ onClose }: Props) => {
    // Recupera il messaggio dal DB usando la chiave
    const { getText, loading } = useSystemMessage('gallery_upload_success');
    const message = getText();

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"><X className="w-5 h-5"/></button>
                
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <CheckCircle className="w-10 h-10 text-emerald-500"/>
                </div>
                
                {loading ? (
                    <div className="py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500"/></div>
                ) : (
                    <>
                        {/* Titolo e Corpo presi dal DB */}
                        <h3 className="text-2xl font-display font-bold text-white mb-2">{message.title || 'Successo!'}</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            {message.body || 'Foto caricata correttamente.'}
                        </p>
                    </>
                )}

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 flex items-center justify-between">
                    <div className="text-left"><p className="text-[10px] text-slate-500 font-bold uppercase">Ricompensa</p><p className="text-white text-xs">Alla pubblicazione</p></div>
                    <div className="text-right"><div className="flex items-center gap-1 text-emerald-400 font-black text-xl">+20 <span className="text-xs self-end mb-1">XP</span></div><Trophy className="w-4 h-4 text-amber-500 ml-auto"/></div>
                </div>
                
                <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all border border-slate-700 hover:border-slate-600">Torna alla Galleria</button>
            </div>
        </div>
    );
};
