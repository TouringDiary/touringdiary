import type React from 'react';
import type { Json } from '../../../types/supabase';
import { ArrayRenderer } from './ArrayRenderer';
import { BooleanToggle } from './inputs/BooleanToggle';
import { NumberInput } from './inputs/NumberInput';
import { StringInput } from './inputs/StringInput';
import { ObjectRenderer } from './ObjectRenderer';

interface Props {
  fieldKey: string;
  fieldValue: unknown;
  path: (string | number)[];
  onUpdate: (path: (string | number)[], value: Json) => void;
}

export const FieldRenderer: React.FC<Props> = ({ fieldKey, fieldValue, path, onUpdate }) => {
  if (fieldValue === null) {
    return null;
  }

  const type = typeof fieldValue;

  if (Array.isArray(fieldValue)) {
    return (
      <ArrayRenderer label={fieldKey} data={fieldValue as Json[]} path={path} onUpdate={onUpdate} />
    );
  }

  if (type === 'object' && fieldValue !== null) {
    return (
      <ObjectRenderer
        label={fieldKey}
        data={fieldValue as Record<string, unknown>}
        path={path}
        onUpdate={onUpdate}
      />
    );
  }

  // CORREZIONE: Controlla prima se è un numero o una stringa numerica
  if (type === 'number' || (type === 'string' && /^-?\d*\.?\d*$/.test(fieldValue as string))) {
    return (
      <NumberInput
        label={fieldKey}
        value={fieldValue as number | string}
        path={path}
        onUpdate={onUpdate}
      />
    );
  }

  if (type === 'string') {
    return (
      <StringInput label={fieldKey} value={fieldValue as string} path={path} onUpdate={onUpdate} />
    );
  }

  if (type === 'boolean') {
    return (
      <BooleanToggle
        label={fieldKey}
        value={fieldValue as boolean}
        path={path}
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <div className="text-xs text-slate-500 p-2">
      Campo "{fieldKey}" ha un tipo non supportato ({type}).
    </div>
  );
};
