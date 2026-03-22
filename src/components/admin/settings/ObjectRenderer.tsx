
import React from 'react';
import { FieldRenderer } from './FieldRenderer';

interface Props {
    label: string;
    data: Record<string, any>;
    path: (string | number)[];
    onUpdate: (path: (string | number)[], value: any) => void;
}

export const ObjectRenderer: React.FC<Props> = ({ label, data, path, onUpdate }) => {
    return (
        <details open className="p-4 border border-slate-700 rounded-lg bg-slate-900/50 space-y-4">
            <summary className="font-medium text-lg text-slate-200 cursor-pointer -m-4 p-4 hover:bg-slate-800/50 rounded-t-lg">{label}</summary>
            
            <div className="pt-4 border-t border-slate-700 space-y-4">
                {Object.entries(data).map(([key, value]) => {
                    const currentPath = [...path, key];
                    return (
                        <FieldRenderer
                            key={currentPath.join('.')}
                            fieldKey={key}
                            fieldValue={value}
                            path={currentPath}
                            onUpdate={onUpdate}
                        />
                    );
                })}
            </div>
        </details>
    );
};
