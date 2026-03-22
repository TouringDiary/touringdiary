
import React from 'react';
import { FieldRenderer } from './FieldRenderer';
import { X, Plus } from 'lucide-react';

interface Props {
    label: string;
    data: any[];
    path: (string | number)[];
    onUpdate: (path: (string | number)[], value: any) => void;
}

export const ArrayRenderer: React.FC<Props> = ({ label, data, path, onUpdate }) => {
    
    const handleRemoveItem = (index: number) => {
        const newArray = [...data];
        newArray.splice(index, 1);
        onUpdate(path, newArray);
    };

    const handleAddItem = () => {
        // Aggiunge un nuovo elemento basandosi sul tipo del primo elemento, se esiste
        let newItem: any = ''; // Default a stringa vuota
        if (data.length > 0) {
            const firstItemType = typeof data[0];
            if (firstItemType === 'number') newItem = 0;
            if (firstItemType === 'boolean') newItem = false;
            if (firstItemType === 'object' && data[0] !== null && !Array.isArray(data[0])) newItem = {};
            if (Array.isArray(data[0])) newItem = [];
        }
        const newArray = [...data, newItem];
        onUpdate(path, newArray);
    };

    return (
        <fieldset className="p-4 border border-slate-700 rounded-lg bg-slate-900/50 space-y-4">
            <legend className="font-medium text-lg text-slate-200 px-2">{label}</legend>
            
            <div className="space-y-4">
                {data.map((item, index) => {
                    const currentPath = [...path, index];
                    return (
                        <div key={currentPath.join('.')} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex-grow">
                                <FieldRenderer
                                    fieldKey={`Elemento ${index + 1}`}
                                    fieldValue={item}
                                    path={currentPath}
                                    onUpdate={onUpdate}
                                />
                            </div>
                            <button onClick={() => handleRemoveItem(index)} className="text-slate-500 hover:text-red-400">
                                <X size={18} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="pt-4 border-t border-slate-700">
                 <button onClick={handleAddItem} className="flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                    <Plus size={16} />
                    Aggiungi Elemento
                </button>
            </div>
        </fieldset>
    );
};
