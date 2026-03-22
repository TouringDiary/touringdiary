
import React from 'react';

interface Props {
    label: string;
    value: boolean;
    path: (string | number)[];
    onUpdate: (path: (string | number)[], value: any) => void;
}

export const BooleanToggle: React.FC<Props> = ({ label, value, path, onUpdate }) => {
    return (
        <div className="flex items-center justify-between">
            <label className="font-medium text-slate-300">{label}</label>
            <button 
                onClick={() => onUpdate(path, !value)}
                className={`w-12 h-6 rounded-full flex items-center transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <span className={`block w-4 h-4 rounded-full bg-white transform transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
        </div>
    );
};
