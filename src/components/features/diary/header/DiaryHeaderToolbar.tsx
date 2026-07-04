import React from 'react';
import { Briefcase, Layers, Map, Sparkles } from 'lucide-react';

interface DiaryHeaderToolbarProps {
    onOpenPackingList?: () => void;
    onOpenRoadbook?: () => void;
    onOpenAiPlanner?: () => void;
    onOpenWorkspace?: () => void;
    showWorkspaceButton?: boolean;
    shouldFlashSuitcase: boolean;
    shouldFlashRoadbook: boolean;
    itineraryItemsLength: number;
}

export const DiaryHeaderToolbar: React.FC<DiaryHeaderToolbarProps> = ({
    onOpenPackingList,
    onOpenRoadbook,
    onOpenAiPlanner,
    onOpenWorkspace,
    showWorkspaceButton = false,
    shouldFlashSuitcase,
    shouldFlashRoadbook,
    itineraryItemsLength,
}) => (
    <div className="flex items-center gap-1 shrink-0">
        {onOpenPackingList && (
            <button
                type="button"
                onClick={onOpenPackingList}
                className={`text-white p-1.5 rounded-lg transition-all shadow-md ${shouldFlashSuitcase ? 'bg-amber-500 animate-pulse ring-2 ring-amber-300' : 'bg-indigo-600 hover:bg-indigo-500 border border-transparent'}`}
                title="Lista Bagaglio"
            >
                <Briefcase className="w-5 h-5" />
            </button>
        )}
        {onOpenRoadbook && itineraryItemsLength > 0 && (
            <button
                type="button"
                onClick={onOpenRoadbook}
                className={`text-white p-1.5 rounded-lg transition-all shadow-md ${shouldFlashRoadbook ? 'bg-amber-500 animate-pulse ring-2 ring-amber-300' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                title="Roadbook"
            >
                <Map className="w-5 h-5" />
            </button>
        )}
        {onOpenAiPlanner && (
            <button
                type="button"
                onClick={onOpenAiPlanner}
                className="text-white bg-indigo-600 hover:bg-indigo-500 p-1.5 rounded-lg shadow-md"
                title="Magic Planner AI"
            >
                <Sparkles className="w-5 h-5" />
            </button>
        )}
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
    </div>
);
