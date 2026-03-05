
import React, { useEffect } from 'react';
import { X, Book } from 'lucide-react';
import { useSystemMessage } from '../../../hooks/useSystemMessage';

interface Props {
    guideKey: string;
    onClose: () => void;
}

export const AdminGuideModal = ({ guideKey, onClose }: Props) => {
    const { getText, loading } = useSystemMessage(guideKey);
    const content = getText();

    // Gestione ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#0b0f1a] w-full max-w-3xl h-[85vh] rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* HEADER */}
                <div className="p-6 border-b border-slate-800 bg-[#020617] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                            <Book className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-display uppercase tracking-wide leading-none">
                                {loading ? 'Caricamento...' : content.title}
                            </h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manuale Operativo</p>
                        </div>
                    </div>
                    {/* STANDARD RED CLOSE BUTTON */}
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                        <X className="w-6 h-6"/>
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#0b0f1a]">
                    {loading ? (
                        <div className="flex justify-center py-20 text-slate-500">Caricamento guida...</div>
                    ) : (
                        // Il div prose è mantenuto per sicurezza, ma lo stile inline del SQL ha la precedenza
                        <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white" dangerouslySetInnerHTML={{ __html: content.body }} />
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-5 border-t border-slate-800 bg-[#020617] shrink-0 text-center">
                    <button onClick={onClose} className="w-full md:w-auto px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">
                        Ho Capito
                    </button>
                </div>
            </div>
        </div>
    );
};
