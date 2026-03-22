
// src/components/features/diary/packing_list/PackingListModal.tsx

import React, { useState, useMemo } from 'react';
import { usePackingList } from '@/hooks/usePackingList';
import { PackingListItem as PackingListItemType } from '@/types/packing';
import { PackingListCategory } from './PackingListCategory';

interface Props {
  itineraryId: string;
  onClose: () => void;
}

// Definiamo le categorie predefinite in un ordine logico
const CATEGORIES = ['Documenti', 'Abbigliamento', 'Igiene', 'Tecnologia', 'Extra'];

export const PackingListModal: React.FC<Props> = ({ itineraryId, onClose }) => {
  const { items, isLoading, error, addItem, updateItem, deleteItem } = usePackingList(itineraryId);

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Extra');

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: PackingListItemType[] } = {};
    CATEGORIES.forEach(cat => groups[cat] = []);

    items.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      addItem({ name: newItemName.trim(), category: newItemCategory, quantity: 1, is_checked: false, notes: null, suggestion_partner_id: null });
      setNewItemName('');
    }
  };

  return (
    <div className="modal-content" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🧳 Valigia di Viaggio</h2>
        <button onClick={onClose} aria-label="Close packing list">Close</button>
      </div>
      <hr />

      {isLoading && <p>Caricamento...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && !error && (
        <div>
          {CATEGORIES.map(category => (
            <PackingListCategory
              key={category}
              category={category}
              items={groupedItems[category] || []}
              onUpdate={updateItem}
              onDelete={deleteItem}
            />
          ))}

          <form onSubmit={handleAddItem} style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
            <input 
              type="text"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder="Nuovo oggetto..."
              required
            />
            <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <button type="submit">Aggiungi</button>
          </form>
        </div>
      )}
    </div>
  );
};
