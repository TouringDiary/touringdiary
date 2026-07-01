import { supabase } from '../supabaseClient';
import {
  AdminOverrideTrigger,
  CanonicalAffiliateProductRelation,
  CanonicalAffiliateTriggerRelation,
  ResolvedAffiliateProduct,
  ResolvedAffiliateProductLink,
  RuntimeAffiliateProduct,
  SuggestionProduct,
} from '../../types/suitcase';
import { AffiliateProductLink } from '../../types/partners';
import { Row, Insert } from '../../types/domain/index';
import { normalizeItemName } from '../../utils/tagDerivation';
import { randomUUID } from '../../utils/runtimeId';

// =============================================================================
// SECTION 1 — INTERNAL BOUNDARY TYPES
// Raw Supabase relational shapes. NEVER exported.
// This is the ONLY place in the codebase that knows:
//   • The true Supabase raw relational shape (product: T | T[] union).
//   • Dual-alias leakage (links vs affiliate_product_links).
//   • Nullable/undefined ambiguity on joined collections.
// =============================================================================

/** Raw product slot as Supabase returns it. NEVER exported. */
type AffiliateTriggerRawProductSlot = Row<'affiliate_products'> & {
  links?: Row<'affiliate_product_links'>[] | null;
  affiliate_product_links?: Row<'affiliate_product_links'>[] | null;
};

/**
 * Raw trigger row with relational join as Supabase returns it.
 * `product` carries the Supabase T | T[] union. NEVER exported.
 */
type AffiliateTriggerRawRow = Row<'affiliate_triggers'> & {
  product?: AffiliateTriggerRawProductSlot | AffiliateTriggerRawProductSlot[] | null;
};

/** Used only by fetchAdminOverrideTriggersAsync. */
type WithProductNameJoin = Row<'affiliate_triggers'> & {
  product?: { id: string; name: string | null } | null;
};

// =============================================================================
// SECTION 2 — INTERNAL ADAPTERS
// Private normalisation functions. Never exported.
// =============================================================================

/**
 * Collapses the dual-alias link fields into a single canonical `links` array.
 * Input: raw Supabase product slot (links or affiliate_product_links or neither).
 * Output: CanonicalAffiliateProductRelation with links: [] guaranteed.
 */
function adaptAffiliateProductRelation(
  raw: AffiliateTriggerRawProductSlot
): CanonicalAffiliateProductRelation {
  const links = raw.links ?? raw.affiliate_product_links ?? [];
  return { ...raw, links };
}

/**
 * Collapses the product T | T[] union and delegates to adaptAffiliateProductRelation.
 * Input: AffiliateTriggerRawRow from any Supabase relational query.
 * Output: CanonicalAffiliateTriggerRelation — no union types, no alias leakage.
 */
function adaptAffiliateTriggerRelation(
  row: AffiliateTriggerRawRow
): CanonicalAffiliateTriggerRelation {
  const rawProduct = Array.isArray(row.product)
    ? (row.product[0] ?? null)
    : (row.product ?? null);
  const product = rawProduct ? adaptAffiliateProductRelation(rawProduct) : null;
  return { ...row, product };
}

function adaptAdminOverrideTriggerBoundary(row: WithProductNameJoin): AdminOverrideTrigger {
  return row;
}

/**
 * Normalises a raw DB product row into the SuggestionProduct runtime model.
 * Centralises null → default handling; consumers never see nullable arrays.
 */
function adaptDbProductToSuggestionProduct(
  row: Row<'affiliate_products'>
): SuggestionProduct {
  return {
    id: row.id,
    name: row.name,
    image_url: row.image_url,
    preferred_partners: row.preferred_partners ?? [],
    target_categories: row.target_categories ?? [],
    target_tags: row.target_tags ?? [],
    is_active: row.is_active ?? true
  };
}

/**
 * Normalises a raw DB link row into the AffiliateProductLink runtime model.
 * Centralises string | null → string | undefined normalisation so callers
 * never receive raw DB nullability.
 */
function adaptDbLinkToAffiliateProductLink(
  row: Row<'affiliate_product_links'>
): AffiliateProductLink {
  return {
    id: row.id,
    product_id: row.product_id ?? '',
    partner_id: row.partner_id,
    query: row.query ?? '',
    url_override: row.url_override ?? undefined,
    image_override: row.image_override ?? undefined,
    tracking_override: row.tracking_override ?? undefined,
    priority: row.priority ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined
  };
}

/**
 * Normalises a raw DB product row into the ResolvedAffiliateProduct runtime model.
 * trigger_items and other persistence-only fields are not exposed.
 */
function adaptDbProductToResolvedAffiliateProduct(
  row: Row<'affiliate_products'>
): ResolvedAffiliateProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    image_url: row.image_url,
    provider: row.provider,
    is_active: row.is_active ?? true,
    preferred_partners: row.preferred_partners ?? [],
    target_categories: row.target_categories ?? [],
    price: row.estimated_price ?? null
  };
}

// =============================================================================
// SECTION 3 — INTERNAL WRITE HELPERS
// Private primitives. Only called by composite operations in this file.
// Never exported — callers outside this file use DTO-based APIs below.
// =============================================================================

async function insertAffiliateProductAsync(
  payload: Insert<'affiliate_products'>
): Promise<Row<'affiliate_products'>> {
  const { data, error } = await supabase
    .from('affiliate_products')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function insertAffiliateTriggerAsync(
  payload: Insert<'affiliate_triggers'>
): Promise<Row<'affiliate_triggers'>> {
  const { data, error } = await supabase
    .from('affiliate_triggers')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================================================
// SECTION 4 — READ APIs (public)
// All return canonical runtime types. No Insert<> / Row<> in signatures.
// =============================================================================

/**
 * Recupera prodotti affiliati gear già filtrati e normalizzati per la UI.
 * Centralizza query DB, partner eligibility, trigger overlap e mapping runtime.
 */
export const fetchAffiliateGearAsync = async (
  itineraryTags: string[],
  missingItems: string[],
  enabledPartnerIds: string[],
  suitcaseItemNames: string[]
): Promise<ResolvedAffiliateProduct[]> => {
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

  const enabledPartnerSet = new Set(enabledPartnerIds);
  const normalizedSuitcaseItemNames = suitcaseItemNames.map((name) => normalizeItemName(name));

  return (data ?? [])
    .filter(row => {
      if (!row.provider || !enabledPartnerSet.has(row.provider)) return false;

      const triggerItems = row.trigger_items ?? [];
      if (triggerItems.length > 0) {
        const hasOverlap = triggerItems.some(trigger =>
          normalizedSuitcaseItemNames.includes(normalizeItemName(trigger))
        );
        if (hasOverlap) return false;
      }

      return true;
    })
    .slice(0, 4)
    .map(adaptDbProductToResolvedAffiliateProduct);
};

/**
 * Recupera i trigger di affiliazione relazionali.
 */
export const fetchAffiliateTriggersAsync = async (params: {
  uniqueTags?: string[];
  uniqueCategories?: string[];
  sourceTemplateId?: string | null;
}): Promise<CanonicalAffiliateTriggerRelation[]> => {
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
  return (data as AffiliateTriggerRawRow[] ?? []).map(adaptAffiliateTriggerRelation);
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
 * Recupera tutti i trigger commerciali globali (escludendo gli override).
 */
export const fetchGlobalTriggersAsync = async (): Promise<CanonicalAffiliateTriggerRelation[]> => {
  const { data, error } = await supabase
    .from('affiliate_triggers')
    .select('*, product:affiliate_products(*)')
    .not('trigger_key', 'ilike', 'override:%');

  if (error) throw error;
  return (data as AffiliateTriggerRawRow[] ?? []).map(adaptAffiliateTriggerRelation);
};

/**
 * Recupera i trigger di override associati a un determinato master template.
 */
export const fetchTemplateOverridesAsync = async (templateId: string): Promise<CanonicalAffiliateTriggerRelation[]> => {
  const { data, error } = await supabase
    .from('affiliate_triggers')
    .select('*, product:affiliate_products(*)')
    .like('trigger_key', `override:${templateId}:%`);

  if (error) throw error;
  return (data as AffiliateTriggerRawRow[] ?? []).map(adaptAffiliateTriggerRelation);
};

/**
 * Maps a raw affiliate_product_links row to ResolvedAffiliateProductLink.
 * Converts DB-nullable fields to the optional (undefined) contract of the
 * runtime interface, eliminating null/undefined discrepancies at the boundary.
 * NEVER exported — used exclusively by adaptTriggerRelationToRuntime.
 */
function adaptDbLinkToResolvedProductLink(
  row: Row<'affiliate_product_links'>
): ResolvedAffiliateProductLink {
  return {
    id: row.id,
    product_id: row.product_id ?? undefined,
    partner_id: row.partner_id,
    query: row.query ?? undefined,
    url_override: row.url_override,
    image_override: row.image_override,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

/**
 * Projects a CanonicalAffiliateTriggerRelation into a RuntimeAffiliateProduct.
 * This is the single authoritative place that maps the relational affiliate
 * structure to the UI runtime shape. Callers receive a fully-typed product
 * with no DB-field knowledge required on their side.
 * Returns null when the trigger carries no associated product.
 */
export function adaptTriggerRelationToRuntime(
  trigger: CanonicalAffiliateTriggerRelation
): RuntimeAffiliateProduct | null {
  const p = trigger.product;
  if (!p) return null;
  return {
    id: p.id,
    name: p.name ?? undefined,
    title: p.name ?? undefined,
    description: p.description ?? undefined,
    price: p.estimated_price != null ? String(p.estimated_price) : null,
    category: p.target_categories && p.target_categories.length > 0
      ? p.target_categories[0]
      : null,
    image_url: p.image_url,
    imageUrl: p.image_url,
    target_categories: p.target_categories,
    provider: p.provider,
    product_id: p.product_id,
    is_active: p.is_active,
    preferred_partners: p.preferred_partners,
    url: null,
    trigger_priority: trigger.priority || 0,
    product_links: p.links.map(adaptDbLinkToResolvedProductLink),
  };
}

/**
 * Recupera tutti i link commerciali configurati per un singolo prodotto.
 * Ritorna AffiliateProductLink[] — runtime model normalizzato, null rimosso.
 */
export const fetchProductLinksForProductAsync = async (productId: string): Promise<AffiliateProductLink[]> => {
  const { data, error } = await supabase
    .from('affiliate_product_links')
    .select('*')
    .eq('product_id', productId);

  if (error) throw error;
  return (data ?? []).map(adaptDbLinkToAffiliateProductLink);
};

/**
 * Recupera tutti i prodotti di affiliazione presenti a DB.
 * Ritorna SuggestionProduct[] — runtime model normalizzato, array null rimossi.
 */
export const fetchAllAffiliateProductsAsync = async (): Promise<SuggestionProduct[]> => {
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data ?? []).map(adaptDbProductToSuggestionProduct);
};

/**
 * Recupera tutti i link partner a DB.
 * Ritorna AffiliateProductLink[] — runtime model normalizzato, null rimosso.
 */
export const fetchAllAffiliateProductLinksAsync = async (): Promise<AffiliateProductLink[]> => {
  const { data, error } = await supabase
    .from('affiliate_product_links')
    .select('*');

  if (error) throw error;
  return (data ?? []).map(adaptDbLinkToAffiliateProductLink);
};

// =============================================================================
// SECTION 5 — DELETE APIs (public, primitive parameters only)
// =============================================================================

/**
 * Elimina un trigger editoriale.
 */
export const deleteAffiliateTriggerAsync = async (triggerId: string): Promise<void> => {
  const { error } = await supabase
    .from('affiliate_triggers')
    .delete()
    .eq('id', triggerId);

  if (error) throw error;
};

/**
 * Elimina definitivamente un prodotto affiliato dal DB.
 * Chiamata anche dal rollback applicativo in createProductWithOverrideTriggerAsync.
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
 * Elimina un link di affiliazione di un partner.
 */
export const deleteAffiliateProductLinkAsync = async (linkId: string): Promise<void> => {
  const { error } = await supabase
    .from('affiliate_product_links')
    .delete()
    .eq('id', linkId);

  if (error) throw error;
};

// =============================================================================
// SECTION 6 — DTO-BASED WRITE APIs (public)
// The ONLY public write surface. All Insert<> construction is sealed here.
// Callers (UI, hooks, other services) use semantic camelCase DTOs only.
// =============================================================================

/**
 * DTO semantico per la creazione/aggiornamento di un prodotto affiliato.
 * La UI esprime intento business; il mapping verso Insert<'affiliate_products'>
 * avviene esclusivamente nel service.
 */
export interface UpsertAffiliateProductDto {
  id?: string;
  name: string;
  imageUrl?: string | null;
  preferredPartners?: string[];
  targetCategories?: string[];
  targetTags?: string[];
  isActive?: boolean;
}

/**
 * Upsert di un prodotto affiliato tramite DTO semantico.
 * Costruisce internamente il payload Insert<'affiliate_products'>.
 */
export const upsertAffiliateProductFromDtoAsync = async (
  dto: UpsertAffiliateProductDto
): Promise<Row<'affiliate_products'>> => {
  const payload: Insert<'affiliate_products'> = {
    id: dto.id,
    name: dto.name,
    image_url: dto.imageUrl ?? null,
    preferred_partners: dto.preferredPartners ?? [],
    target_categories: dto.targetCategories ?? [],
    target_tags: dto.targetTags ?? [],
    is_active: dto.isActive ?? true,
    provider: 'manual'
  };

  const { data, error } = await supabase
    .from('affiliate_products')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * DTO semantico per un singolo link nell'upsert bulk di link di affiliazione.
 * La UI esprime intento business; il mapping verso Insert<'affiliate_product_links'>
 * avviene esclusivamente nel service.
 *
 * Nota su created_at: non esposto nel DTO. Il DB non sovrascrive created_at
 * su upsert se il campo non è nel payload — preservazione automatica per record
 * esistenti, DEFAULT per nuovi record.
 */
export interface UpsertAffiliateLinkBulkItemDto {
  id?: string;
  productId: string;
  partnerId: string;
  searchQuery: string;
  urlOverride?: string | null;
  imageOverride?: string | null;
  trackingOverride?: string | null;
  priority?: number | null;
}

/**
 * Upsert massivo di link di affiliazione tramite DTO semantici.
 * Costruisce internamente il payload Insert<'affiliate_product_links'>[].
 */
export const upsertAffiliateProductLinksBulkFromDtosAsync = async (
  dtos: UpsertAffiliateLinkBulkItemDto[]
): Promise<Row<'affiliate_product_links'>[]> => {
  const now = new Date().toISOString();
  const links: Insert<'affiliate_product_links'>[] = dtos.map(dto => ({
    id: dto.id ?? randomUUID(),
    product_id: dto.productId,
    partner_id: dto.partnerId,
    query: dto.searchQuery,
    url_override: dto.urlOverride ?? null,
    image_override: dto.imageOverride ?? null,
    tracking_override: dto.trackingOverride ?? null,
    priority: dto.priority ?? null,
    updated_at: now
  }));

  const { data, error } = await supabase
    .from('affiliate_product_links')
    .upsert(links)
    .select();

  if (error) throw error;
  return data ?? [];
};

/**
 * DTO semantico per la creazione/aggiornamento di un link di affiliazione singolo.
 * La UI esprime intento business; il mapping verso Insert<'affiliate_product_links'>
 * avviene esclusivamente nel service.
 */
export interface UpsertAffiliateLinkDto {
  productId: string;
  partnerId: string;
  searchQuery: string;
  urlOverride: string;
  imageOverride?: string | null;
  existingLinkId?: string;
}

/**
 * Upsert di un singolo link di affiliazione gestendo il conflitto per product_id e partner_id.
 * Accetta UpsertAffiliateLinkDto; costruisce internamente il payload Insert<'affiliate_product_links'>.
 */
export const upsertAffiliateProductLinkWithConflictAsync = async (
  dto: UpsertAffiliateLinkDto
): Promise<Row<'affiliate_product_links'>> => {
  const insert: Insert<'affiliate_product_links'> = {
    id: dto.existingLinkId,
    product_id: dto.productId,
    partner_id: dto.partnerId,
    query: dto.searchQuery,
    url_override: dto.urlOverride,
    image_override: dto.imageOverride ?? null
  };

  const { data, error } = await supabase
    .from('affiliate_product_links')
    .upsert(insert, { onConflict: 'product_id, partner_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * DTO semantico per la creazione/aggiornamento di un trigger editoriale.
 * Il mapping verso Insert<'affiliate_triggers'> avviene esclusivamente nel service.
 */
export interface UpsertAffiliateTriggerDto {
  id?: string;
  triggerKey: string;
  triggerType: string;
  productId: string;
  priority?: number;
}

/**
 * Upsert di un trigger editoriale tramite DTO semantico.
 * Costruisce internamente il payload Insert<'affiliate_triggers'>.
 */
export const upsertAffiliateTriggerFromDtoAsync = async (
  dto: UpsertAffiliateTriggerDto
): Promise<Row<'affiliate_triggers'>> => {
  const payload: Insert<'affiliate_triggers'> = {
    id: dto.id,
    trigger_key: dto.triggerKey,
    trigger_type: dto.triggerType,
    product_id: dto.productId,
    priority: dto.priority ?? 100
  };

  const { data, error } = await supabase
    .from('affiliate_triggers')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Crea un nuovo prodotto manuale e registra immediatamente il trigger di override associato.
 * Dispone di un meccanismo di rollback applicativo per prevenire la persistenza di prodotti orfani.
 *
 * Accetta UpsertAffiliateProductDto; costruisce internamente tutti i payload Insert<>.
 */
export const createProductWithOverrideTriggerAsync = async (
  productDto: UpsertAffiliateProductDto,
  triggerKey: string
): Promise<{
  product: Row<'affiliate_products'>;
  trigger: Row<'affiliate_triggers'>;
}> => {
  const productPayload: Insert<'affiliate_products'> = {
    name: productDto.name,
    image_url: productDto.imageUrl ?? null,
    preferred_partners: productDto.preferredPartners ?? [],
    target_categories: productDto.targetCategories ?? [],
    target_tags: productDto.targetTags ?? [],
    is_active: productDto.isActive ?? true,
    provider: 'manual'
  };

  const product = await insertAffiliateProductAsync(productPayload);

  try {
    const trigger = await insertAffiliateTriggerAsync({
      trigger_key: triggerKey,
      trigger_type: 'item',
      product_id: product.id,
      priority: 100
    });

    return { product, trigger };
  } catch (error) {
    console.warn("Fallimento durante la creazione del trigger. Esecuzione rollback del prodotto:", product.id);
    try {
      await deleteAffiliateProductAsync(product.id);
    } catch (cleanupErr) {
      console.error("Eccezione imprevista durante il rollback del prodotto orfano:", cleanupErr);
    }
    throw error;
  }
};
