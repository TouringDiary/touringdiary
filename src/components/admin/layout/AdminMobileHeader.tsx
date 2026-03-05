
import React from 'react';
import { Menu } from 'lucide-react';

interface AdminMobileHeaderProps {
    title: string;
    onMenuClick: () => void;
}

export const AdminMobileHeader = ({ title, onMenuClick }: AdminMobileHeaderProps) => {
    return (
        <div className="md:hidden sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
                <button onClick={onMenuClick} className="p-2 bg-slate-800 text-slate-300 rounded-lg">
                    <Menu className="w-6 h-6"/>
                </button>
                <span className="font-bold text-white text-sm uppercase tracking-wide truncate max-w-[200px]">
                    {title}
                </span>
            </div>
        </div>
    );
};
