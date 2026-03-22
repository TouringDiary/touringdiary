
import React from 'react';
import { Map, Users, BookOpen, Radar, Store } from 'lucide-react';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';
import { useUI } from '@/context/UIContext';

interface MobileNavBarProps {
    activeSection: string | null;
    onOpenDiary: () => void;
    onOpenGlobal: (section: 'itineraries' | 'community' | 'sponsors' | 'around_me') => void;
    onOpenRankings: () => void;
    isVisible?: boolean; 
    onExpandUi?: () => void; 
}

export const MobileNavBar = ({ activeSection, onOpenDiary, onOpenGlobal, onOpenRankings }: MobileNavBarProps) => {
    const labelStyle = useDynamicStyles('navbar_label', true);
    const { isUiVisible, setIsUiVisible } = useUI();

    return (
        <>
            {/* FULL BAR MODE - Navigazione Completa */}
            <div 
                id="tour-mobile-nav"
                className={`md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#020617]/95 backdrop-blur-xl border-t border-slate-800 grid grid-cols-5 items-end z-[1100] pb-1 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out will-change-transform ${isUiVisible ? 'translate-y-0' : 'translate-y-[200%]'}`}
            >
                {/* 1. ITINERARI */}
                <button 
                    onClick={() => onOpenGlobal('itineraries')} 
                    className={`flex flex-col items-center justify-center gap-1 p-1 transition-all h-full pb-2 rounded-t-xl ${activeSection === 'itineraries' ? 'text-indigo-400 bg-indigo-500/10 border-t-2 border-indigo-500' : 'text-slate-500 hover:text-indigo-400'}`}
                >
                    <Map className="w-5 h-5"/>
                    <span className={labelStyle}>Itinerari</span>
                </button>
                
                {/* 2. SOCIAL */}
                <button 
                    onClick={() => onOpenGlobal('community')} 
                    className={`flex flex-col items-center justify-center gap-1 p-1 transition-all h-full pb-2 rounded-t-xl ${activeSection === 'community' ? 'text-emerald-400 bg-emerald-500/10 border-t-2 border-emerald-500' : 'text-slate-500 hover:text-emerald-400'}`}
                >
                    <Users className="w-5 h-5"/>
                    <span className={labelStyle}>Social</span>
                </button>
                
                {/* 3. DIARIO (CENTRALE - FLOATING) */}
                <div className="flex justify-center h-full relative group">
                    <button 
                        id="tour-mobile-diary-btn"
                        onClick={onOpenDiary}
                        className="absolute -top-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 border-4 border-[#020617] active:scale-95 transition-transform z-10"
                    >
                        <BookOpen className="w-6 h-6 text-[#020617] fill-[#020617]"/>
                    </button>
                    <span className={`${labelStyle} text-amber-500 mt-auto mb-2`}>Diario</span>
                </div>
                
                {/* 4. AROUND ME */}
                <button 
                    onClick={() => onOpenGlobal('around_me')} 
                    className={`flex flex-col items-center justify-center gap-1 p-1 transition-all h-full pb-2 rounded-t-xl ${activeSection === 'around_me' ? 'text-blue-400 bg-blue-500/10 border-t-2 border-blue-500' : 'text-slate-500 hover:text-blue-400'}`}
                >
                    <Radar className="w-5 h-5"/>
                    <span className={labelStyle}>Around Me</span>
                </button>
                
                {/* 5. PARTNER (ATTIVITÀ COMMERCIALE) */}
                <button 
                    onClick={() => onOpenGlobal('sponsors')} 
                    className={`flex flex-col items-center justify-center gap-1 p-1 transition-all h-full pb-2 rounded-t-xl ${activeSection === 'sponsors' ? 'text-purple-400 bg-purple-500/10 border-t-2 border-purple-500' : 'text-slate-500 hover:text-purple-400'}`}
                >
                    <Store className="w-5 h-5"/>
                    <span className="text-[9px] font-black uppercase tracking-wide">Partner</span>
                </button>
            </div>

            {/* COMPRESSED FAB MODE - Tasto Giallo Rotondo DIARIO */}
            {/* Appare quando la barra scompare, posizione bottom-right per ergonomia */}
            <div 
                className={`md:hidden fixed bottom-6 right-6 z-[1200] transition-all duration-300 ease-out transform ${!isUiVisible ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto' : 'translate-y-20 opacity-0 scale-50 pointer-events-none'}`}
            >
                <button 
                    onClick={() => setIsUiVisible(true)}
                    className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(245,158,11,0.6)] border-4 border-[#020617] active:scale-95 transition-transform group animate-in zoom-in"
                    aria-label="Mostra Menu"
                >
                    <BookOpen className="w-6 h-6 text-[#020617] fill-[#020617] group-hover:scale-110 transition-transform"/>
                </button>
            </div>
        </>
    );
};
