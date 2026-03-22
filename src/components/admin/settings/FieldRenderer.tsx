
import React from 'react';
import { StringInput } from './inputs/StringInput';
import { NumberInput } from './inputs/NumberInput';
import { BooleanToggle } from './inputs/BooleanToggle';
import { ObjectRenderer } from './ObjectRenderer';
import { ArrayRenderer } from './ArrayRenderer';

interface Props {
    fieldKey: string;
    fieldValue: any;
    path: (string | number)[];
    onUpdate: (path: (string | number)[], value: any) => void;
}

export const FieldRenderer: React.FC<Props> = ({ fieldKey, fieldValue, path, onUpdate }) => {

    if (fieldValue === null) {
        return null;
    }

    const type = typeof fieldValue;

    if (Array.isArray(fieldValue)) {
        return <ArrayRenderer label={fieldKey} data={fieldValue} path={path} onUpdate={onUpdate} />;
    }

    if (type === 'object') {
        return <ObjectRenderer label={fieldKey} data={fieldValue} path={path} onUpdate={onUpdate} />;
    }

    // CORREZIONE: Controlla prima se è un numero o una stringa numerica
    if (type === 'number' || (type === 'string' && /^-?\d*\.?\d*$/.test(fieldValue))) {
        return <NumberInput label={fieldKey} value={fieldValue} path={path} onUpdate={onUpdate} />;
    }

    if (type === 'string') {
        return <StringInput label={fieldKey} value={fieldValue} path={path} onUpdate={onUpdate} />;
    }
    
    if (type === 'boolean') {
        return <BooleanToggle label={fieldKey} value={fieldValue} path={path} onUpdate={onUpdate} />;
    }

    return (
        <div className="text-xs text-slate-500 p-2">
            Campo "{fieldKey}" ha un tipo non supportato ({type}).
        </div>
    );
};
