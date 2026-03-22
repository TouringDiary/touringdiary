
// src/hooks/usePackingList.ts

import { useState, useEffect, useCallback } from 'react';
import {
  getPackingListByItinerary,
  createPackingList,
  addPackingListItem,
  updatePackingListItem,
  deletePackingListItem,
} from '../services/packingListService';
import { PackingListWithItems, PackingListItem } from '../types/packing';
import { useUser } from '@/context/UserContext';

export const usePackingList = (itineraryId: string | null) => {
  const { user } = useUser(); // CORREZIONE APPLICATA: usa useUser()
  const [list, setList] = useState<PackingListWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    // Non procedere se non abbiamo le informazioni necessarie
    if (!itineraryId || !user?.id) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Prova a caricare la lista esistente
      let packingList = await getPackingListByItinerary(itineraryId);
      
      // Se non esiste, creala al volo per l'utente corrente
      if (!packingList) {
        packingList = await createPackingList(itineraryId, user.id);
      }
      setList(packingList);
    } catch (e: any) {
      setError('Failed to load or create the packing list.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [itineraryId, user?.id]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleAddItem = async (itemData: Omit<PackingListItem, 'id' | 'list_id' | 'user_id' | 'created_at'>) => {
    if (!list || !user?.id) return;

    const fullItemData = { ...itemData, list_id: list.id, user_id: user.id };
    
    // Aggiornamento ottimistico: aggiungi un item temporaneo alla UI
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: PackingListItem = { 
        ...fullItemData, 
        id: tempId, 
        created_at: new Date().toISOString() 
    };
    setList(prev => prev ? { ...prev, packing_list_items: [...prev.packing_list_items, optimisticItem] } : null);

    try {
      const newItem = await addPackingListItem(fullItemData);
      // Sostituisci l'item temporaneo con quello reale appena il DB lo conferma
      setList(prev => prev ? { 
        ...prev, 
        packing_list_items: prev.packing_list_items.map(i => i.id === tempId ? newItem : i)
      } : null);
    } catch (e) {
      setError('Failed to add item. Please try again.');
      // Rollback in caso di fallimento
      setList(prev => prev ? { 
        ...prev, 
        packing_list_items: prev.packing_list_items.filter(i => i.id !== tempId) 
      } : null);
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<PackingListItem>) => {
    if (!list) return;

    const originalItems = list.packing_list_items;
    const optimisticItems = originalItems.map(i => i.id === itemId ? { ...i, ...updates } : i);
    setList({ ...list, packing_list_items: optimisticItems });

    try {
      await updatePackingListItem(itemId, updates);
    } catch (e) {
      setError('Failed to update item. Please try again.');
      setList({ ...list, packing_list_items: originalItems }); // Rollback
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!list) return;

    const originalItems = list.packing_list_items;
    const optimisticItems = originalItems.filter(i => i.id !== itemId);
    setList({ ...list, packing_list_items: optimisticItems });

    try {
      await deletePackingListItem(itemId);
    } catch (e) {
      setError('Failed to delete item. Please try again.');
      setList({ ...list, packing_list_items: originalItems }); // Rollback
    }
  };

  return {
    list,
    items: list?.packing_list_items || [],
    isLoading,
    error,
    addItem: handleAddItem,
    updateItem: handleUpdateItem,
    deleteItem: handleDeleteItem,
  };
};
