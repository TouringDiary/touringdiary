import { Z_OVERLAY } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface DiaryHeaderInvalidDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    body: string;
}

export const DiaryHeaderInvalidDateModal: React.FC<DiaryHeaderInvalidDateModalProps> = ({
    isOpen, onClose, title, body
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in pointer-events-auto"
            style={{ zIndex: Z_OVERLAY }}
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 border-2 border-red-500 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 text-center flex flex-col items-center gap-6 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                    <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse"/>
                </div>
                <div>
                    <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-wider">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                        {body}
                    </p>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 uppercase tracking-widest shadow-lg"
                >
                    OK
                </button>
            </div>
        </div>,
        document.body
    );
};



