import React from 'react';
import { Briefcase, Globe, Layers, Map, Sparkles, Users } from 'lucide-react';

interface DiaryHeaderToolbarProps {
    onOpenPackingList?: () => void;
    onOpenRoadbook?: () => void;
    onOpenAiPlanner?: () => void;
    onOpenWorkspace?: () => void;
    showWorkspaceButton?: boolean;
    onPublish: () => void;
    onCollaborativeShare?: () => void;
    canPublish: boolean;
    isGuest: boolean;
    shouldFlashSuitcase: boolean;
    shouldFlashRoadbook: boolean;
    itineraryItemsLength: number;
    openModal: (type: string) => void;
}

export const DiaryHeaderToolbar: React.FC<DiaryHeaderToolbarProps> = ({
    onOpenPackingList,
    onOpenRoadbook,
    onOpenAiPlanner,
    onOpenWorkspace,
    showWorkspaceButton = false,
    onPublish,
    onCollaborativeShare,
    canPublish,
    isGuest,
    shouldFlashSuitcase,
    shouldFlashRoadbook,
    itineraryItemsLength,
    openModal,
}) => {
    const handleCommunityPublish = () => {
        if (canPublish) {
            onPublish();
            return;
        }
        if (isGuest) {
            openModal('auth');
        }
    };

    const handleCollaborativeShare = () => {
        if (onCollaborativeShare) {
            onCollaborativeShare();
        }
    };

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
                type="button"
                onClick={handleCollaborativeShare}
                className="p-1.5 rounded-lg shadow-md flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white"
                title="Condividi"
                aria-label="Condividi con altri utenti"
            >
                <Users className="w-5 h-5" />
            </button>

            {showWorkspaceButton && onOpenWorkspace && (
                <button
                    type="button"
                    onClick={onOpenWorkspace}
                    className="hidden lg:flex p-1.5 rounded-lg shadow-md items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white"
                    title="Workspace"
                    aria-label="Apri Workspace"
                >
                    <Layers className="w-5 h-5" />
                </button>
            )}

            <button 
                type="button"
                onClick={handleCommunityPublish}
                disabled={!canPublish && !isGuest} 
                className={`p-1.5 rounded-lg shadow-md flex items-center justify-center ${canPublish || isGuest ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600' : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed border border-slate-700'}`} 
                title="Pubblica nella Community"
                aria-label="Pubblica nella Community"
            >
                <Globe className="w-5 h-5" />
            </button>
        </div>
    );
};
