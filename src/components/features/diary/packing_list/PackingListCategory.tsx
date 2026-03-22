
// src/components/features/diary/packing_list/PackingListCategory.tsx

import React from 'react';
import { PackingListItem as PackingListItemType } from '@/types/packing';
import { PackingListItem } from './PackingListItem';

interface Props {
  category: string;
  items: PackingListItemType[];
  onUpdate: (id: string, updates: Partial<PackingListItemType>) => void;
  onDelete: (id: string) => void;
}

export const PackingListCategory: React.FC<Props> = ({ category, items, onUpdate, onDelete }) => {
  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '8px' }}>
        {category}
      </h4>
      <div>
        {items.map(item => (
          <PackingListItem 
            key={item.id}
            item={item}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
