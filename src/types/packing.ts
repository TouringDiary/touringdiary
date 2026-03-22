
// src/types/packing.ts

/**
 * Rappresenta una singola packing list, legata a un itinerario.
 */
export interface PackingList {
  id: string; // UUID
  itinerary_id: string; // UUID
  user_id: string; // UUID
  created_at: string;
  updated_at: string;
}

/**
 * Rappresenta un singolo oggetto all'interno di una packing list.
 */
export interface PackingListItem {
  id: string; // UUID
  list_id: string; // UUID
  user_id: string; // UUID
  category: string;
  name: string;
  quantity: number;
  is_checked: boolean;
  notes: string | null;
  suggestion_partner_id: string | null;
  created_at: string;
}

/**
 * Estende la PackingList per includere i suoi item, 
 * come restituito dalle query Supabase.
 */
export interface PackingListWithItems extends PackingList {
  packing_list_items: PackingListItem[];
}
