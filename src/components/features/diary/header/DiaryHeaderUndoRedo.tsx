import React from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import './diaryHeaderTabs.css';

interface DiaryHeaderUndoRedoProps {
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

const iconActionClass = 'diary-header-tab diary-header-tab--inactive diary-header-tab--icon-only';

export const DiaryHeaderUndoRedo: React.FC<DiaryHeaderUndoRedoProps> = ({
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}) => (
    <div className="flex items-center gap-1 shrink-0">
        <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={iconActionClass}
            title="Annulla (Ctrl+Z)"
            aria-label="Annulla"
        >
            <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={iconActionClass}
            title="Ripristina (Ctrl+Y)"
            aria-label="Ripristina"
        >
            <RotateCw className="w-3.5 h-3.5" />
        </button>
    </div>
);
