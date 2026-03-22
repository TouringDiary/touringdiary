
import React from 'react';

interface Props {
    label: string;
    value: string;
    path: (string | number)[];
    onUpdate: (path: (string | number)[], value: any) => void;
}

export const StringInput: React.FC<Props> = ({ label, value, path, onUpdate }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onUpdate(path, e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
    );
};
