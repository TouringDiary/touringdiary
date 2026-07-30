import React, { useId } from 'react';
import type { Viaggio } from '@/types/models/Viaggio';
import type { ViaggioAssociationChoice } from '@/types/resourceAssociation';

interface Props {
  choice: ViaggioAssociationChoice;
  onChoiceChange: (c: ViaggioAssociationChoice) => void;
  existingViaggioId: string;
  onExistingViaggioIdChange: (id: string) => void;
  viaggi: Viaggio[];
  disabled?: boolean;
  hidden?: boolean;
  /** Caricamento elenco Viaggi (select disabilitata / placeholder). */
  loading?: boolean;
}

export const ViaggioAssociationFields: React.FC<Props> = ({
  choice,
  onChoiceChange,
  existingViaggioId,
  onExistingViaggioIdChange,
  viaggi,
  disabled,
  hidden,
  loading,
}) => {
  const groupId = useId();

  if (hidden) return null;

  return (
    <fieldset className="space-y-2 border-0 p-0 m-0" disabled={disabled}>
      <legend className="text-xs font-bold uppercase text-slate-500 mb-2">
        Associazione Viaggio
      </legend>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="radio"
          name={groupId}
          checked={choice === 'none'}
          onChange={() => onChoiceChange('none')}
          className="mt-1 accent-indigo-500"
        />
        <span className="text-sm text-slate-200">Nessun Viaggio (indipendente)</span>
      </label>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="radio"
          name={groupId}
          checked={choice === 'existing'}
          onChange={() => onChoiceChange('existing')}
          className="mt-1 accent-indigo-500"
        />
        <span className="text-sm text-slate-200">Associa a un Viaggio esistente</span>
      </label>
      {choice === 'existing' && (
        <div className="pl-6">
          <select
            value={existingViaggioId}
            onChange={(e) => onExistingViaggioIdChange(e.target.value)}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className="w-full bg-slate-950 border border-slate-700 text-sm text-slate-200 rounded-lg px-2 py-2 disabled:opacity-60"
          >
            <option value="">
              {loading ? 'Caricamento Viaggi…' : 'Seleziona un Viaggio…'}
            </option>
            {!loading &&
              viaggi.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title || 'Viaggio'}
                </option>
              ))}
          </select>
        </div>
      )}
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="radio"
          name={groupId}
          checked={choice === 'new'}
          onChange={() => onChoiceChange('new')}
          className="mt-1 accent-indigo-500"
        />
        <span className="text-sm text-slate-200">Crea un nuovo Viaggio</span>
      </label>
    </fieldset>
  );
};
