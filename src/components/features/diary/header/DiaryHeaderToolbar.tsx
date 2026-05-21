import React from 'react';
import { Briefcase, Map, Sparkles, Globe } from 'lucide-react';

interface DiaryHeaderToolbarProps {
    onOpenPackingList?: () => void;
    onOpenRoadbook?: () => void;
    onOpenAiPlanner?: () => void;
    onPublish: () => void;
    canPublish: boolean;
    isGuest: boolean;
    shouldFlashSuitcase: boolean;
    shouldFlashRoadbook: boolean;
    itineraryItemsLength: number;
    openModal: (type: string) => void;
}

export const DiaryHeaderToolbar: React.FC<DiaryHeaderToolbarProps> = ({
    onOpenPackingList, onOpenRoadbook, onOpenAiPlanner, onPublish, canPublish, isGuest, shouldFlashSuitcase, shouldFlashRoadbook, itineraryItemsLength, openModal
}) => {
    return (
        <div className="flex items-center gap-1 shrink-0">

            {onOpenPackingList && (
                 <button onClick={onOpenPackingList} className={`text-white p-1.5 rounded-lg transition-all shadow-md ${shouldFlashSuitcase ? 'bg-amber-500 animate-pulse ring-2 ring-amber-300' : 'bg-indigo-600 hover:bg-indigo-500 border border-transparent'}`} title="Lista Bagaglio">
                     <Briefcase className="w-5 h-5" />
                 </button>
            )}
            {onOpenRoadbook && itineraryItemsLength > 0 && (
                <button onClick={onOpenRoadbook} className={`text-white p-1.5 rounded-lg transition-all shadow-md ${shouldFlashRoadbook ? 'bg-amber-500 animate-pulse ring-2 ring-amber-300' : 'bg-indigo-600 hover:bg-indigo-500'}`} title="Roadbook">
                    <Map className="w-5 h-5" />
                </button>
            )}
            {onOpenAiPlanner && (
                <button onClick={onOpenAiPlanner} className="text-white bg-indigo-600 hover:bg-indigo-500 p-1.5 rounded-lg shadow-md" title="Magic Planner AI">
                    <Sparkles className="w-5 h-5" />
                </button>
            )}
            <button 
                onClick={() => { if(canPublish) onPublish(); else if(isGuest) openModal('auth'); }} 
                disabled={!canPublish && !isGuest} 
                className={`p-1.5 rounded-lg shadow-md flex items-center justify-center ${canPublish || isGuest ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed border border-slate-700'}`} 
                title="Condividi con la Community"
            >
                <Globe className="w-5 h-5" />
            </button>
        </div>
    );
};
