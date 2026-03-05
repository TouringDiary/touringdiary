
import React, { useEffect } from 'react';
import { X, Trophy, Crown, Gift, ArrowRight } from 'lucide-react';
import { getCurrentLevel } from '../../services/gamificationService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    xp: number;
    onOpenRewards: () => void;
}

export const LevelUpModal = ({ isOpen, onClose, xp, onOpenRewards }: Props) => {
    
    // ESC Key Listener
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const currentLevel = getCurrentLevel(xp);

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 bg-slate-900 border border-slate-700">
                
                {/* CONFETTI/CELEBRATION BACKGROUND */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-slate-900/0 to-transparent"></div>
                    <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-[-50px] right-[-50px] w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
                </div>

                {/* CONTENT */}
                <div className="relative z-10 p-8 flex flex-col items-center text-center">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5"/>
                    </button>

                    <div className="mb-6 relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 border-4 border-slate-900 text-5xl">
                            {currentLevel.icon}
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-amber-500/30 shadow-sm whitespace-nowrap">
                            Level Up!
                        </div>
                    </div>

                    <h2 className="text-3xl font-display font-bold text-white mb-2 leading-tight">
                        Congratulazioni!
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Hai raggiunto il <strong className="text-white">Livello {currentLevel.level}</strong>. <br/>
                        Sei ufficialmente un <span className={`font-bold ${currentLevel.color}`}>{currentLevel.name}</span>!
                    </p>

                    <div className="w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-6 flex items-center gap-4 text-left">
                        <div className="bg-indigo-600/20 p-3 rounded-lg text-indigo-400">
                            <Gift className="w-6 h-6"/>
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Nuovi Premi Sbloccati</h4>
                            <p className="text-xs text-slate-400">Controlla subito il tuo profilo.</p>
                        </div>
                    </div>

                    <button 
                        onClick={onOpenRewards}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95"
                    >
                        Vedi Ricompense <ArrowRight className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};
