import React from 'react';
import { Camera } from 'lucide-react';

interface Props {
    photosEnabled: boolean;
    isUploading: boolean;
    onPublishPhoto: () => void;
}

export const LiveFeedToolbar: React.FC<Props> = ({
    photosEnabled,
    isUploading,
    onPublishPhoto,
}) => (
    <div className="sticky top-0 z-modal pb-4 bg-[#020617] flex justify-between items-center px-4 md:px-8 pt-1 border-b border-slate-800/50 mb-2">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h3 className="text-white font-bold uppercase tracking-widest text-sm">Live Feed</h3>
        </div>
        <button
            type="button"
            onClick={onPublishPhoto}
            disabled={isUploading || !photosEnabled}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/30 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-95"
        >
            <Camera className="w-4 h-4" /> Pubblica Foto
        </button>
    </div>
);
