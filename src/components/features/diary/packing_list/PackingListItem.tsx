
// src/components/features/diary/packing_list/PackingListItem.tsx

import React from 'react';
import { PackingListItem as PackingListItemType } from '@/types/packing';

interface Props {
  item: PackingListItemType;
  onUpdate: (id: string, updates: Partial<PackingListItemType>) => void;
  onDelete: (id: string) => void;
}

// Esempio di un semplice componente per l'item.
// Si può arricchire con icone, bottoni di modifica, etc.
export const PackingListItem: React.FC<Props> = ({ item, onUpdate, onDelete }) => {
  const handleCheck = () => {
    onUpdate(item.id, { is_checked: !item.is_checked });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
      <input
        type="checkbox"
        checked={item.is_checked}
        onChange={handleCheck}
        aria-label={`Mark ${item.name} as packed`}
      />
      <span style={{ flex: 1, textDecoration: item.is_checked ? 'line-through' : 'none' }}>
        {item.name} (x{item.quantity})
      </span>
      <button onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}>X</button>
    </div>
  );
};

