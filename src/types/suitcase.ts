import { Row } from './domain/index';

// =============================================================================
// SECTION 1 — DB DTOs
// Raw Supabase row types generated from schema. Used only at the persistence
// boundary (service layer). Never consumed directly by UI components.
// =============================================================================

export type DbAffiliateProductLink = Row<'affiliate_product_links'>;
export type DbAffiliateProduct = Row<'affiliate_products'>;
export type DbAffiliateTrigger = Row<'affiliate_triggers'>;

// =============================================================================
// SECTION 2 — JOINED RELATIONAL DTOs
// Extended DB rows returned by Supabase relational queries.
// Shape is determined by the SELECT string used in service functions.
// NOTE: JoinedAffiliateTrigger.product union includes [] variant for
//       edge-case Supabase returns; narrowing deferred to Step B.
// =============================================================================

export interface JoinedAffiliateProduct extends DbAffiliateProduct {
  links?: DbAffiliateProductLink[] | null;
  affiliate_product_links?: DbAffiliateProductLink[] | null;
}

export interface JoinedAffiliateTrigger extends DbAffiliateTrigger {
  product?: JoinedAffiliateProduct | JoinedAffiliateProduct[] | null;
}

export interface AdminOverrideTrigger extends DbAffiliateTrigger {
  product?: { id: string; name: string | null } | null;
}

// =============================================================================
// SECTION 3 — AFFILIATE RUNTIME / DISPLAY MODELS
// All-optional runtime models used by UI components and hooks.
// DISTINCT from AffiliateProductLink in types/partners.ts (persistence DTO,
// required fields). ResolvedAffiliateProductLink adds api_image fields
// used exclusively for UI rendering.
// =============================================================================

export interface ResolvedAffiliateProductLink {
  id?: string;
  product_id?: string;
  partner_id?: string;
  query?: string;
  url_override?: string | null;
  image_override?: string | null;
  api_image?: string | null;
  api_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ResolvedAffiliateProduct {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  price?: string | number | null;
  category?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  target_categories?: string[] | null;
  product_links?: ResolvedAffiliateProductLink[] | null;
  provider?: string | null;
  product_id?: string | null;
  is_active?: boolean | null;
  preferred_partners?: string[] | null;
  url?: string | null;
}

// =============================================================================
// SECTION 4 — EDITORIAL / ADMIN UI TYPES
// Types owned by the editorial workflow layer. Used by admin tabs and
// override management components. Not tied to DB schema shape.
// =============================================================================

export interface SuggestionProduct {
  id: string;
  name: string;
  image_url?: string | null;
  preferred_partners?: string[];
  target_categories?: string[];
  target_tags?: string[];
  is_active?: boolean;
}

export interface ItemOverride {
  id?: string;
  trigger_key: string;
  product_id?: string;
  is_saving?: boolean;
  is_saved?: boolean;
}

// =============================================================================
// SECTION 5 — SUITCASE RUNTIME MODELS
// Pure UI models for suitcase entities. Decoupled from DB schema.
// These are the shapes used throughout UI components and hooks.
// =============================================================================

export interface SuitcaseCategory {
  id: string;
  name: string;
  icon_key?: string;
}

export interface SuitcaseUiState {
  hidden_category_ids: string[];
}

export interface SuitcaseItem {
  id: string;
  name: string;
  category: string;
  suitcase_id?: string;
  is_checked?: boolean | null;
  is_ai_suggestion?: boolean | null;
  quantity?: number | null;
  ai_suggestion_context?: string | null;
  suggested_at?: string | null;
  accepted_from_ai?: boolean;
  created_at?: string | null;
  affiliate_tags?: string[] | null;
  poi_triggers?: string[] | null;
  custom_categories?: SuitcaseCategory[];
}

export interface Suitcase {
  id: string;
  title: string;
  icon: string;
  user_id: string | null;
  created_at?: string;
  updated_at?: string;
  source_template_id?: string | null;
  custom_categories?: SuitcaseCategory[];
  ui_state?: SuitcaseUiState;
  suitcase_items?: SuitcaseItem[];
  itinerary_suitcases?: { itinerary_id: string }[];
  is_template?: boolean;
}
