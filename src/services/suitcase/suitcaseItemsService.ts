  import { supabase } from '../supabaseClient';
  import { SuitcaseItem } from '../../types/suitcase';
  import { mapDbSuitcaseItemRowToRuntime } from './suitcaseCoreService';
  import { normalizeCategoryName } from '../../domain/packing/packingCategories';
  import { isEphemeralItemId } from '../../utils/runtimeItemId';
  import { randomUUID } from '../../utils/runtimeId';

  // =============================================================================
  // WRITE DTOs — Suitcase Items
  // Contratti espliciti per le operazioni di scrittura sugli item valigia.
  // Sono le UNICHE forme accettate al write boundary del service.
  //
  // Invarianti:
  //   • Nessun Partial<SuitcaseItem> attraversa il boundary di scrittura.
  //   • Nessun any[] attraversa il boundary di scrittura.
  //   • Il mapping runtime → payload DB avviene esclusivamente qui.
  //   • Hook e UI non conoscono i nomi delle colonne DB.
  // =============================================================================

  /**
   * Metadati opzionali per la creazione di un singolo item.
   * Parametro aggiuntivo di addSuitcaseItemAsync. Sostituisce Partial<SuitcaseItem>.
   * Non espone campi runtime-only (imageUrl, custom_categories, ecc.).
   */
  export interface AddSuitcaseItemMetadata {
    id?: string;
    is_checked?: boolean | null;
    is_ai_suggestion?: boolean | null;
    quantity?: number | null;
    ai_suggestion_context?: string | null;
    suggested_at?: string | null;
    accepted_from_ai?: boolean | null;
  }

  /**
   * DTO per la creazione bulk di item valigia.
   * Usato da addSuitcaseItemsBulkAsync. Sostituisce any[].
   * Contiene tutti i campi scrivibili inclusi suitcase_id, name, category.
   */
  export interface AddSuitcaseItemDto {
    suitcase_id: string;
    name: string;
    category: string;
    id?: string;
    is_checked?: boolean | null;
    is_ai_suggestion?: boolean | null;
    quantity?: number | null;
    ai_suggestion_context?: string | null;
    suggested_at?: string | null;
    accepted_from_ai?: boolean | null;
    affiliate_tags?: string[] | null;
    poi_triggers?: string[] | null;
  }

  /**
   * DTO per l'aggiornamento parziale di un item valigia esistente.
   * Definisce i soli campi aggiornabili dal layer hook/UI.
   * Impedisce che campi runtime-only (id, suitcase_id, created_at, ecc.)
   * raggiungano il DB tramite Partial<SuitcaseItem>.
   */
  export interface UpdateSuitcaseItemDto {
    is_checked?: boolean | null;
    is_ai_suggestion?: boolean | null;
    quantity?: number | null;
    name?: string;
    category?: string;
    accepted_from_ai?: boolean | null;
    affiliate_tags?: string[] | null;
    poi_triggers?: string[] | null;
  }

  // =============================================================================
  // SERVICE FUNCTIONS
  // =============================================================================

  /** Include suggested_at in INSERT only when explicitly set (AI suggestions). */
  const suggestedAtInsertField = (value?: string | null): { suggested_at?: string } =>
    value != null ? { suggested_at: value } : {};

  /**
   * Aggiunge un singolo item a una valigia.
   * Restituisce il modello runtime SuitcaseItem mappato dal DB.
   */
  export const addSuitcaseItemAsync = async (
    suitcaseId: string,
    name: string,
    category: string,
    metadata: AddSuitcaseItemMetadata = {}
  ): Promise<SuitcaseItem> => {
    const { data, error } = await supabase
      .from('suitcase_items')
      .insert({
        id: metadata.id && !isEphemeralItemId(metadata.id) ? metadata.id : randomUUID(),
        suitcase_id: suitcaseId,
        name,
        category: normalizeCategoryName(category),
        is_checked: metadata.is_checked ?? false,
        is_ai_suggestion: metadata.is_ai_suggestion ?? false,
        quantity: metadata.quantity ?? 1,
        ai_suggestion_context: metadata.ai_suggestion_context ?? null,
        accepted_from_ai: metadata.accepted_from_ai ?? false,
        ...suggestedAtInsertField(metadata.suggested_at),
      })
      .select()
      .single();

    if (error) throw error;
    return mapDbSuitcaseItemRowToRuntime(data);
  };

  /**
   * Aggiunge più item in bulk a una valigia.
   * Accetta AddSuitcaseItemDto[]. Costruisce internamente il payload DB.
   * Restituisce SuitcaseItem[] mappati dal DB.
   */
  export const addSuitcaseItemsBulkAsync = async (
    dtos: AddSuitcaseItemDto[]
  ): Promise<SuitcaseItem[]> => {
    const rows = dtos.map(dto => ({
      id: dto.id && !isEphemeralItemId(dto.id) ? dto.id : randomUUID(),
      suitcase_id: dto.suitcase_id,
      name: dto.name,
      category: normalizeCategoryName(dto.category),
      is_checked: dto.is_checked ?? false,
      is_ai_suggestion: dto.is_ai_suggestion ?? false,
      quantity: dto.quantity ?? 1,
      ai_suggestion_context: dto.ai_suggestion_context ?? null,
      ...suggestedAtInsertField(dto.suggested_at),
      accepted_from_ai: dto.accepted_from_ai ?? false,
      affiliate_tags: dto.affiliate_tags ?? null,
      poi_triggers: dto.poi_triggers ?? null
    }));

    const { data, error } = await supabase
      .from('suitcase_items')
      .insert(rows)
      .select();

    if (error) throw error;
    return (data || []).map(mapDbSuitcaseItemRowToRuntime);
  };

  /**
   * Aggiorna le proprietà di un item esistente.
   * Accetta UpdateSuitcaseItemDto. Costruisce esplicitamente il payload DB
   * includendo solo i campi presenti nel DTO: nessun campo runtime-only raggiunge il DB.
   */
  export const updateSuitcaseItemAsync = async (
    itemId: string,
    dto: UpdateSuitcaseItemDto
  ): Promise<void> => {
    const payload: {
      is_checked?: boolean | null;
      is_ai_suggestion?: boolean | null;
      quantity?: number | null;
      name?: string;
      category?: string;
      accepted_from_ai?: boolean | null;
      affiliate_tags?: string[] | null;
      poi_triggers?: string[] | null;
    } = {};

    if (dto.is_checked !== undefined)    payload.is_checked = dto.is_checked;
    if (dto.is_ai_suggestion !== undefined) payload.is_ai_suggestion = dto.is_ai_suggestion;
    if (dto.quantity !== undefined)      payload.quantity = dto.quantity;
    if (dto.name !== undefined)          payload.name = dto.name;
    if (dto.category !== undefined)      payload.category = normalizeCategoryName(dto.category);
    if (dto.accepted_from_ai !== undefined) payload.accepted_from_ai = dto.accepted_from_ai;
    if (dto.affiliate_tags !== undefined)   payload.affiliate_tags = dto.affiliate_tags;
    if (dto.poi_triggers !== undefined)     payload.poi_triggers = dto.poi_triggers;

    const { error } = await supabase
      .from('suitcase_items')
      .update(payload)
      .eq('id', itemId);

    if (error) throw error;
  };

  /**
   * Persiste una lista di item runtime nel DB, nella valigia specificata.
   * Accetta SuitcaseItem[] (modello runtime): la proiezione verso AddSuitcaseItemDto[]
   * avviene esclusivamente qui.
   * Hook e utility non conoscono i nomi delle colonne DB.
   */
  export const persistSuitcaseItemsFromRuntimeAsync = async (
    suitcaseId: string,
    items: SuitcaseItem[]
  ): Promise<SuitcaseItem[]> => {
    const dtos: AddSuitcaseItemDto[] = items.map(item => ({
      suitcase_id: suitcaseId,
      name: item.name,
      category: normalizeCategoryName(item.category),
      is_checked: item.is_checked ?? false,
      is_ai_suggestion: item.is_ai_suggestion ?? false,
      quantity: item.quantity ?? 1,
      ai_suggestion_context: item.ai_suggestion_context ?? null,
      accepted_from_ai: item.accepted_from_ai ?? false,
      ...(item.suggested_at != null ? { suggested_at: item.suggested_at } : {}),
    }));
    return addSuitcaseItemsBulkAsync(dtos);
  };

  /**
   * Inserisce item suggeriti dall'AI in una valigia.
   * Accetta candidati semantici {name, category}: la proiezione verso AddSuitcaseItemDto[]
   * (is_ai_suggestion, is_checked, quantity, timestamp) avviene esclusivamente qui.
   * La utility aiSuggestions non conosce i nomi delle colonne DB.
   */
  export const addAiSuggestedItemsAsync = async (
    suitcaseId: string,
    candidates: { name: string; category: string }[],
    context?: string
  ): Promise<SuitcaseItem[]> => {
    const now = new Date().toISOString();
    const dtos: AddSuitcaseItemDto[] = candidates.map(c => ({
      suitcase_id: suitcaseId,
      name: c.name,
      category: c.category,
      is_checked: false,
      is_ai_suggestion: true,
      quantity: 1,
      ai_suggestion_context: context ?? null,
      suggested_at: now
    }));
    return addSuitcaseItemsBulkAsync(dtos);
  };

  /**
   * Elimina un item da una valigia.
   */
  export const deleteSuitcaseItemAsync = async (itemId: string): Promise<void> => {
    const { error } = await supabase
      .from('suitcase_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  };
