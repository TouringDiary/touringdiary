import { supabase } from '../supabaseClient';
import { AdminOverrideTrigger, DbAffiliateProduct, JoinedAffiliateTrigger } from '../../types/suitcase';
import { Row, Insert } from '../../types/domain/index';

// --- RELATIONAL BOUNDARY TYPING (Step A) ---
// These functions localize the structural assignability boundary between
// Supabase's inferred relational query types and our domain interfaces.
//
// They are passthrough adapters: no runtime transformation, no normalization,
// no canonical mapping. TypeScript verifies structural compatibility at the
// function signature; the return is the same object passed in.
//
// Naming reflects this: "adapt" = shape declaration at the boundary,
// not a data transformation. Canonical relational normalization is deferred
// to Step B (JoinedAffiliateTrigger union narrowing).

type WithProductJoin = Row<'affiliate_triggers'> & {
  product?: (Row<'affiliate_products'> & {
    links?: Row<'affiliate_product_links'>[] | null;
    affiliate_product_links?: Row<'affiliate_product_links'>[] | null;
  }) | null;
};

type WithProductNameJoin = Row<'affiliate_triggers'> & {
  product?: { id: string; name: string | null } | null;
};

function adaptJoinedAffiliateTriggerBoundary(row: WithProductJoin): JoinedAffiliateTrigger {
  return row;
}

function adaptAdminOverrideTriggerBoundary(row: WithProductNameJoin): AdminOverrideTrigger {
  return row;
}

/**
 * Recupera i prodotti affiliati attivi filtrati per tag itinerario o item mancanti.
 */
export const fetchAffiliateGearAsync = async (itineraryTags: string[], missingItems: string[]): Promise<DbAffiliateProduct[]> => {
  let query = supabase.from('affiliate_products').select('*').eq('is_active', true);

  const orConditions = [];
  if (itineraryTags.length > 0) {
    orConditions.push(`target_tags.ov.{${itineraryTags.join(',')}}`);
  }
  if (missingItems.length > 0) {
    orConditions.push(`trigger_items.ov.{${missingItems.join(',')}}`);
  }

  if (orConditions.length > 0) {
    query = query.or(orConditions.join(','));
  }

  const { data, error } = await query.order('priority', { ascending: false }).limit(6);
  if (error) throw error;
  return data ?? [];
};

/**
 * Recupera i trigger di affiliazione relazionali.
 */
export const fetchAffiliateTriggersAsync = async (params: {
  uniqueTags?: string[];
  uniqueCategories?: string[];
  sourceTemplateId?: string | null;
}): Promise<JoinedAffiliateTrigger[]> => {
  const orConditions = [
    'trigger_type.eq.global'
  ];

  const keys: string[] = [];
  if (params.uniqueTags && params.uniqueTags.length > 0) {
    keys.push(...params.uniqueTags);
  }
  if (params.uniqueCategories && params.uniqueCategories.length > 0) {
    keys.push(...params.uniqueCategories);
  }

  if (keys.length > 0) {
    const keysEscaped = keys.map(k => `"${k}"`).join(',');
    orConditions.push(`trigger_key.in.(${keysEscaped})`);
  }

  if (params.sourceTemplateId) {
    orConditions.push(`trigger_key.ilike.override:${params.sourceTemplateId}:%`);
  }

  const { data, error } = await supabase
    .from('affiliate_triggers')
    .select('*, product:affiliate_products(*, links:affiliate_product_links(*))')
    .or(orConditions.join(','));

  if (error) throw error;
  return (data ?? []).map(adaptJoinedAffiliateTriggerBoundary);
};

/**
 * Recupera i trigger per la tab di override admin.
 */
export const fetchAdminOverrideTriggersAsync = async (): Promise<AdminOverrideTrigger[]> => {
  const { data, error } = await supabase
    .from('affiliate_triggers')
    .select('*, product:affiliate_products(id, name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(adaptAdminOverrideTriggerBoundary);
};

/**
 * Elimina un trigger editoriale per gli admin.
 */
export const deleteAffiliateTriggerAsync = async (triggerId: string): Promise<void> => {
  const { error } = await supabase
    .from('affiliate_triggers')
    .delete()
    .eq('id', triggerId);

  if (error) throw error;
};

/**
 * Inserisce un nuovo prodotto affiliato.
 */
export const insertAffiliateProductAsync = async (
  productPayload: Insert<'affiliate_products'>
): Promise<Row<'affiliate_products'>> => {
  const { data, error } = await supabase
    .from('affiliate_products')
    .insert(productPayload)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Inserisce o aggiorna (upsert) un prodotto affiliato.
 */
export const upsertAffiliateProductAsync = async (
  productPayload: Insert<'affiliate_products'>
): Promise<Row<'affiliate_products'>> => {
  const { data, error } = await supabase
    .from('affiliate_products')
    .upsert(productPayload)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Elimina definitivamente un prodotto affiliato dal DB.
 */
export const deleteAffiliateProductAsync = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from('affiliate_products')
    .delete()
    .eq('id', productId);

    if (error) {
      console.error(
        "Errore critico durante la rimozione del prodotto orfano in rollback:",
        error
      );
    
      throw error;
    }
  };

/**
 * Crea o aggiorna un trigger editoriale.
 */
export const upsertAffiliateTriggerAsync = async (
  triggerPayload: Insert<'affiliate_triggers'>
): Promise<Row<'affiliate_triggers'>> => {
  const { data, error } = await supabase
    .from('affiliate_triggers')
    .upsert(triggerPayload)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Crea o aggiorna un link di affiliazione per un partner.
 */
export const upsertAffiliateProductLinkAsync = async (
  linkPayload: Insert<'affiliate_product_links'>
): Promise<Row<'affiliate_product_links'>> => {
  const { data, error } = await supabase
    .from('affiliate_product_links')
    .upsert(linkPayload)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Elimina un link di affiliazione di un partner.
 */
export const deleteAffiliateProductLinkAsync = async (linkId: string): Promise<void> => {
  const { error } = await supabase
    .from('affiliate_product_links')
    .delete()
    .eq('id', linkId);

  if (error) throw error;
};

/**
 * Inserisce un trigger editoriale semplice.
 */
export const insertAffiliateTriggerAsync = async (
  triggerPayload: Insert<'affiliate_triggers'>
): Promise<Row<'affiliate_triggers'>> => {
  const { data, error } = await supabase
    .from('affiliate_triggers')
    .insert(triggerPayload)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Upsert massivo di link di affiliazione per prodotti partner.
 */
export const upsertAffiliateProductLinksBulkAsync = async (
  links: Insert<'affiliate_product_links'>[]
): Promise<Row<'affiliate_product_links'>[]> => {
  const { data, error } = await supabase
    .from('affiliate_product_links')
    .upsert(links)
    .select();

  if (error) throw error;
  return data ?? [];
};

/**
 * Recupera tutti i trigger commerciali globali (escludendo gli override).
 */
export const fetchGlobalTriggersAsync = async (): Promise<JoinedAffiliateTrigger[]> => {
  const { data, error } = await supabase
    .from('affiliate_triggers')
    .select('*, product:affiliate_products(*)')
    .not('trigger_key', 'ilike', 'override:%');

  if (error) throw error;
  return (data ?? []).map(adaptJoinedAffiliateTriggerBoundary);
};

/**
 * Recupera i trigger di override associati a un determinato master template.
 */
export const fetchTemplateOverridesAsync = async (templateId: string): Promise<JoinedAffiliateTrigger[]> => {
  const { data, error } = await supabase
    .from('affiliate_triggers')
    .select('*, product:affiliate_products(*)')
    .like('trigger_key', `override:${templateId}:%`);

  if (error) throw error;
  return (data ?? []).map(adaptJoinedAffiliateTriggerBoundary);
};

/**
 * Recupera tutti i link commerciali configurati per un singolo prodotto.
 */
export const fetchProductLinksForProductAsync = async (productId: string): Promise<Row<'affiliate_product_links'>[]> => {
  const { data, error } = await supabase
    .from('affiliate_product_links')
    .select('*')
    .eq('product_id', productId);

  if (error) throw error;
  return data ?? [];
};

/**
 * Recupera tutti i prodotti di affiliazione presenti a DB.
 */
export const fetchAllAffiliateProductsAsync = async (): Promise<Row<'affiliate_products'>[]> => {
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .order('name');

  if (error) throw error;
  return data ?? [];
};

/**
 * Recupera tutti i link partner a DB.
 */
export const fetchAllAffiliateProductLinksAsync = async (): Promise<Row<'affiliate_product_links'>[]> => {
  const { data, error } = await supabase
    .from('affiliate_product_links')
    .select('*');

  if (error) throw error;
  return data ?? [];
};

/**
 * Upsert di un singolo link di affiliazione gestendo il conflitto per product_id e partner_id.
 */
export const upsertAffiliateProductLinkWithConflictAsync = async (
  link: Insert<'affiliate_product_links'>
): Promise<Row<'affiliate_product_links'>> => {
  const { data, error } = await supabase
    .from('affiliate_product_links')
    .upsert(link, { onConflict: 'product_id, partner_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Crea un nuovo prodotto manuale e registra immediatamente il trigger di override associato.
 * Dispone di un meccanismo di rollback applicativo per prevenire la persistenza di prodotti orfani.
 */
export const createProductWithOverrideTriggerAsync = async (
  productPayload: Insert<'affiliate_products'>,
  triggerKey: string
): Promise<{
  product: Row<'affiliate_products'>;
  trigger: Row<'affiliate_triggers'>;
}> => {
  // 1. Inserimento del prodotto affiliato
  const product = await insertAffiliateProductAsync(productPayload);

  try {
    // 2. Inserimento del trigger di override collegato
    const trigger = await insertAffiliateTriggerAsync({
      trigger_key: triggerKey,
      trigger_type: 'item',
      product_id: product.id,
      priority: 100
    });

    return { product, trigger };
  } catch (error) {
    // 3. Rollback applicativo protetto in caso di fallimento del trigger
    console.warn("Fallimento durante la creazione del trigger. Esecuzione rollback del prodotto:", product.id);
    try {
      await deleteAffiliateProductAsync(product.id);
    } catch (cleanupErr) {
      console.error("Eccezione imprevista durante il rollback del prodotto orfano:", cleanupErr);
    }
    throw error;
  }
};
