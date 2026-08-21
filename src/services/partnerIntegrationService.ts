import type { SupabaseClient } from '@supabase/supabase-js';
import type { PartnerCapability, PartnerIntegration, PartnerIntegrations } from '../types';
import type { Database, Json } from '../types/database';

/** Shape grezza partner da JSON settings (campi opzionali, non dominio). */
type RawPartnerIntegration = {
  label?: string;
  enabled?: boolean;
  capabilities?: unknown;
  group?: string;
  priority?: number;
  is_primary?: boolean;
  display_options?: {
    logo_url?: string;
    theme_color?: string;
  };
  ai_hints?: {
    prompt_trigger?: string | string[];
    preferred_for_capability?: unknown;
  };
  tracking?: PartnerIntegration['tracking'];
  affiliate?: PartnerIntegration['affiliate'];
  api_config?: PartnerIntegration['api_config'];
};

const asRawPartner = (raw: unknown): RawPartnerIntegration =>
  typeof raw === 'object' && raw !== null ? (raw as RawPartnerIntegration) : {};

const asSettingsObject = (value: Json | null): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/**
 * Helper esterno per la costruzione dei link di affiliazione universali.
 */
export const buildAffiliateLink = (
  partner: PartnerIntegration,
  params: {
    query?: string;
    checkin?: string;
    checkout?: string;
  },
): string => {
  if (!partner.affiliate?.base_url || !partner.affiliate.tracking_id) {
    return '';
  }

  const url = new URL(partner.affiliate.base_url);

  // Parametri di tracciamento universali (da config Supabase)
  const trackingParam = partner.affiliate.param_name || 'tag';
  url.searchParams.set(trackingParam, partner.affiliate.tracking_id);

  // Parametro di ricerca (da config Supabase)
  if (params.query && partner.affiliate.search_query_param) {
    url.searchParams.set(partner.affiliate.search_query_param, params.query);
  }

  // Supporto legacy per Booking (ancora parzialmente hardcoded per parametri date)
  if (partner.id === 'booking') {
    if (params.checkin) url.searchParams.set('checkin', params.checkin);
    if (params.checkout) url.searchParams.set('checkout', params.checkout);
  }

  return url.toString();
};

/**
 * Helper esterno per la costruzione dei link diretti ai prodotti (Deep Linking).
 */
export const buildProductAffiliateLink = (
  partner: PartnerIntegration,
  productId: string,
): string => {
  if (!partner || !partner.affiliate?.base_url || !partner.affiliate?.tracking_id || !productId) {
    return '';
  }

  // Amazon Direct ASIN
  if (partner.id === 'amazon') {
    let baseUrl = partner.affiliate.base_url;
    if (baseUrl.includes('/s')) {
      baseUrl = baseUrl.replace('/s', '');
    }
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    return `${baseUrl}/dp/${productId}?${partner.affiliate.param_name}=${partner.affiliate.tracking_id}`;
  }

  // Fallback generico per altri provider
  try {
    const url = new URL(partner.affiliate.base_url);
    url.searchParams.set(partner.affiliate.param_name, partner.affiliate.tracking_id);

    if (partner.id === 'decathlon' || partner.id === 'booking_gear') {
      url.searchParams.set('product_id', productId);
    }

    return url.toString();
  } catch (e) {
    return '';
  }
};

/**
 * Mappa e normalizza un oggetto grezzo dal DB nel modello PartnerIntegration.
 * Esportata per test e riuso.
 */
export const mapDbPartnerIntegration = (id: string, raw: unknown): PartnerIntegration => {
  const partner = asRawPartner(raw);
  return {
    id,
    label: partner.label || id,
    enabled: !!partner.enabled,
    capabilities: Array.isArray(partner.capabilities)
      ? (partner.capabilities as PartnerCapability[])
      : [],
    group: partner.group,
    priority: typeof partner.priority === 'number' ? partner.priority : 0,
    is_primary: !!partner.is_primary,
    display_options: {
      logo_url: partner.display_options?.logo_url,
      theme_color: partner.display_options?.theme_color,
    },
    ai_hints: {
      prompt_trigger: Array.isArray(partner.ai_hints?.prompt_trigger)
        ? partner.ai_hints.prompt_trigger
        : partner.ai_hints?.prompt_trigger
          ? [partner.ai_hints.prompt_trigger]
          : [],
      preferred_for_capability: Array.isArray(partner.ai_hints?.preferred_for_capability)
        ? (partner.ai_hints.preferred_for_capability as string[])
        : [],
    },
    tracking: partner.tracking,
    affiliate: partner.affiliate,
    api_config: partner.api_config,
  };
};

/**
 * Servizio per la gestione delle integrazioni con i partner.
 * Fornisce metodi per recuperare, manipolare e utilizzare le configurazioni
 * dei partner (es. Booking, GetYourGuide).
 */
export const partnerIntegrationService = (supabase: SupabaseClient<Database>) => ({
  /**
   * Recupera le configurazioni di integrazione dei partner.
   *
   * @returns Un oggetto `PartnerIntegrations` con le configurazioni.
   */
  getPartnerIntegrations: async (): Promise<PartnerIntegrations> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partner-integrations`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching partner integrations via API:', error);

      const { data, error: sbError } = await supabase
        .from('global_settings')
        .select('value')
        .eq('key', 'partner_integrations')
        .single();

      if (sbError || !data) {
        return { partners: {} };
      }

      const rawValue = asSettingsObject(data.value);
      const result: PartnerIntegrations = { partners: {} };

      // Estrazione priorità categorie se presente
      const categoryPriority = rawValue.category_partner_priority;
      if (
        categoryPriority &&
        typeof categoryPriority === 'object' &&
        !Array.isArray(categoryPriority)
      ) {
        result.category_partner_priority = categoryPriority as Record<string, string[]>;
      }

      // Normalizzazione partner
      Object.entries(rawValue).forEach(([key, val]) => {
        if (key === 'category_partner_priority') return;
        if (typeof val === 'object' && val !== null) {
          result.partners[key] = mapDbPartnerIntegration(key, val);
        }
      });

      return result;
    }
  },

  buildAffiliateLink,
  buildProductAffiliateLink,
});

/**
 * Trova un partner specifico per ID dall'oggetto delle integrazioni.
 */
export const getPartnerById = (
  integrations: PartnerIntegrations,
  id: string,
): PartnerIntegration | undefined => {
  const p = integrations.partners?.[id];
  return p?.enabled ? p : undefined;
};

/**
 * Trova il partner di integrazione più adatto in base a un prompt utente.
 */
export const getPartnerByAiIntent = (
  userPrompt: string,
  integrations: PartnerIntegrations,
): PartnerIntegration | undefined => {
  if (!integrations?.partners || !userPrompt) {
    return undefined;
  }

  const lowerCasePrompt = userPrompt.toLowerCase();
  const enabledPartners = Object.values(integrations.partners).filter((p) => p.enabled);

  return enabledPartners.find((partner) => {
    const trigger = partner.ai_hints?.prompt_trigger;
    if (!trigger) return false;

    const triggers = Array.isArray(trigger) ? trigger : [trigger];
    return triggers.some((keyword) => lowerCasePrompt.includes(keyword.toLowerCase()));
  });
};

/**
 * Trova il primo partner abilitato che supporta una data capability.
 */
export const getPartnerByCapability = (
  integrations: PartnerIntegrations | null,
  capability: PartnerCapability,
): PartnerIntegration | undefined => {
  if (!integrations?.partners) {
    return undefined;
  }

  const enabledPartners = Object.values(integrations.partners).filter((p) => p.enabled);

  return enabledPartners.find((partner) => partner.capabilities.includes(capability));
};

/**
 * Risolve il miglior partner disponibile seguendo la priorità definita.
 */
export const resolveBestPartner = (
  integrations: PartnerIntegrations | null,
  options: {
    category?: string;
    capability?: PartnerCapability;
  },
): PartnerIntegration | undefined => {
  if (!integrations?.partners) return undefined;

  // 1. Category Priority mapping
  if (options.category && integrations.category_partner_priority) {
    const catKey = options.category.toLowerCase();
    const priorityList = integrations.category_partner_priority[catKey];
    if (priorityList && Array.isArray(priorityList)) {
      for (const partnerId of priorityList) {
        const p = getPartnerById(integrations, partnerId);
        if (p && p.enabled) return p;
      }
    }
  }

  // 2. Global Primary Partner
  const primary = Object.values(integrations.partners).find((p) => p.enabled && p.is_primary);
  if (primary) return primary;

  // 3. Capability Match
  if (options.capability) {
    const p = getPartnerByCapability(integrations, options.capability);
    if (p) return p;
  }

  // 4. Fallback Amazon
  return getPartnerById(integrations, 'amazon');
};
