
// src/services/packingListService.ts

import { supabase } from './supabaseClient'; // Assumendo che il client sia esportato da qui
import { PackingListWithItems, PackingListItem } from '../types/packing';

/**
 * Recupera una packing list e i suoi item dato l'ID dell'itinerario.
 * @param itineraryId L'ID dell'itinerario.
 * @returns Una PackingList con i suoi item, o null se non trovata.
 */
export const getPackingListByItinerary = async (itineraryId: string): Promise<PackingListWithItems | null> => {
  const { data, error } = await supabase
    .from('packing_lists')
    .select(`
      *,
      packing_list_items (*)
    `)
    .eq('itinerary_id', itineraryId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = "single row not found"
    console.error('Error fetching packing list:', error);
    throw error;
  }
  
  return data as PackingListWithItems | null;
};

/**
 * Crea una nuova packing list per un dato itinerario.
 * @param itineraryId L'ID dell'itinerario.
 * @param userId L'ID dell'utente.
 * @returns La nuova packing list creata.
 */
export const createPackingList = async (itineraryId: string, userId: string): Promise<PackingListWithItems> => {
  const { data, error } = await supabase
    .from('packing_lists')
    .insert({ itinerary_id: itineraryId, user_id: userId })
    .select()
    .single();

  if (error) {
    console.error('Error creating packing list:', error);
    throw error;
  }

  // Ritorna la lista con un array di item vuoto per coerenza
  return { ...data, packing_list_items: [] } as PackingListWithItems;
};

/**
 * Aggiunge un nuovo item a una packing list.
 * @param itemData Dati parziali del nuovo item.
 * @returns L'item completo creato.
 */
export const addPackingListItem = async (itemData: Partial<PackingListItem>): Promise<PackingListItem> => {
  const { data, error } = await supabase
    .from('packing_list_items')
    .insert(itemData)
    .select()
    .single();

  if (error) {
    console.error('Error adding packing list item:', error);
    throw error;
  }

  return data as PackingListItem;
};

/**
 * Aggiorna un item esistente nella packing list.
 * @param itemId L'ID dell'item da aggiornare.
 * @param updates Un oggetto con i campi da aggiornare.
 * @returns L'item aggiornato.
 */
export const updatePackingListItem = async (itemId: string, updates: Partial<PackingListItem>): Promise<PackingListItem> => {
  const { data, error } = await supabase
    .from('packing_list_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating packing list item:', error);
    throw error;
  }

  return data as PackingListItem;
};

/**
 * Rimuove un item dalla packing list.
 * @param itemId L'ID dell'item da rimuovere.
 */
export const deletePackingListItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from('packing_list_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting packing list item:', error);
    throw error;
  }
};
