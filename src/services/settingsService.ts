import { supabase } from './supabaseClient';
import type { GlobalSetting, StyleRule } from '../types';

// --- CHIAVI DELLE IMPOSTAZIONI ---
export const SETTINGS_KEYS = {
  // AI & Prompts
  AI_ENABLED: 'ai_enabled',
  PROMPT_CITY_AUDIT: 'prompt_city_audit',
  PROMPT_PEOPLE_SUGGEST: 'prompt_people_suggest',
  AI_TYPING_SUGGESTIONS: 'ai_typing_suggestions',

  // Marketing & Pricing
  MARKETING_PROMO_TYPES: 'marketing_promo_types',

  // Design & UI Assets
  HERO_IMAGE: 'hero_image',
  DEFAULT_PATRON_IMAGE: 'default_patron_image',
  AUTH_BACKGROUND_IMAGE: 'auth_background_image',
  SOCIAL_CANVAS_BG: 'social_canvas_bg',
  AI_CONSULTANT_BG: 'ai_consultant_bg',
  CATEGORY_PLACEHOLDERS: 'category_placeholders',
  SUITCASE_PLACEHOLDERS: 'suitcase_placeholders',

  // Taxonomy & Data Structure
  TAXONOMY_NORMALIZATION: 'taxonomy_normalization',
  TAXONOMY_MAP: 'taxonomy_map',
  EVENT_CANONICAL_LIST: 'event_canonical_list',
  EVENT_TAXONOMY_MAP: 'event_taxonomy_map',
  POI_STRUCTURE: 'poi_structure',
  POI_ADVANCED_STRUCTURE: 'poi_advanced_structure',
  POI_CATEGORIES_CONFIG: 'poi_categories_config',

  // App-wide Configurations
  TRAVEL_STYLES_CONFIG: 'travel_styles_config',
  SERVICES_CONFIG: 'services_config',
  SERVICES_TYPE_MAPPING: 'services_type_mapping',
  GEO_OPTIONS: 'geo_options',
  PARTNER_INTEGRATIONS: 'partner_integrations',

  // Onboarding & UX Flow
  ONBOARDING_CONFIG: 'onboarding_config',
};

// --- CACHE IN MEMORIA & LOCK ---
let settingsCache: Map<string, any> = new Map();
let designRulesCache: StyleRule[] | null = null;
let pendingLoadPromise: Promise<void> | null = null;

export const loadGlobalCache = async (): Promise<void> => {
  if (pendingLoadPromise) return pendingLoadPromise;

  console.log("[Cache] Starting loadGlobalCache...");
  const startTime = Date.now();

  pendingLoadPromise = (async () => {
    try {
      // 1. TENTA IL CARICAMENTO TRAMITE API LOCALE (MOLTO PIÙ VELOCE IN IFRAME)
      try {
        const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/bootstrap/all`);
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (apiData.success) {
            settingsCache.clear();
            if (apiData.settings) {
              for (const setting of apiData.settings) {
                settingsCache.set(setting.key, setting.value);
              }
            }
            // Design rules are loaded exclusively via getDesignSystemRules() so
            // bootstrap snapshots cannot overwrite a fresher post-save Supabase fetch.
            console.log(
              `[Cache] Bootstrap loaded from API in ${Date.now() - startTime}ms.`,
              settingsCache.size, "settings"
            );
            return; // Successo via API -> Esci
          }
        }
      } catch (apiError) {
        console.warn("[Cache] Local API Bootstrap failed or timeout, falling back to Supabase.", apiError);
      }

      // 2. FALLBACK A SUPABASE (LOGICA ORIGINALE)
      console.log("[Cache] Using Supabase fallback for global settings...");
      
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: global_settings non risponde in 5s")), 5000)
      );

      const result: any = await Promise.race([
        supabase.from('global_settings').select('key, value'),
        timeoutPromise
      ]);

      const { data, error } = result;

      if (error) {
        console.error("[Cache] Failed to fetch global settings from Supabase:", error);
        return;
      }

      if (data) {
        settingsCache.clear();
        for (const setting of data) {
          settingsCache.set(setting.key, setting.value);
        }
        console.log(
          `[Cache] Global settings fallback loaded in ${Date.now() - startTime}ms.`,
          settingsCache.size, "keys"
        );
      }
    } catch (e: any) {
      console.error("[Cache] Error/Timeout during global cache load:", e.message);
    } finally {
      pendingLoadPromise = null;
    }
  })();

  return pendingLoadPromise;
};

export const getCachedSetting = <T>(key: string): T | null => {
  return settingsCache.get(key) as T | null;
};

/** Placeholder immagine per categoria POI (`global_settings.category_placeholders`). */
export const getCategoryPlaceholders = (): Record<string, string> | null =>
  getCachedSetting<Record<string, string>>(SETTINGS_KEYS.CATEGORY_PLACEHOLDERS);

export const getSettings = async (): Promise<GlobalSetting[]> => {
  const { data, error } = await supabase
    .from('global_settings')
    .select('key, value');

  if (error) throw error;
  return data ?? [];
};

export const getSetting = async <T>(key: string): Promise<T | null> => {
  if (!key) {
    console.error("[SettingsService] getSetting called with invalid key:", key);
    return null;
  }

  // 1. ATTENDE IL CARICAMENTO DEL BOOTSTRAP SE IN CORSO
  if (pendingLoadPromise) {
    await pendingLoadPromise;
  }

  // 2. TENTA IL RECUPERO DALLA CACHE (Popolata via API proxy in loadGlobalCache)
  const cached = settingsCache.get(key);
  if (cached !== undefined) {
    return cached as T;
  }

  // 3. FALLBACK A SUPABASE (Solo se non presente in cache)
  console.log(`[SettingsService] Setting ${key} not in cache, fetching from Supabase...`);
  
  const { data, error } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle(); // TASK 2: Use maybeSingle to prevent 406 Not Acceptable
  
  if (error) {
    console.error(`Error fetching setting ${key}:`, error);
    // Non rilanciamo l'errore per evitare crash, preferiamo il fallback
  }
  
  let value = data ? (data.value as T) : null;

  // Salva in cache per chiamate future
  if (value !== null) {
    settingsCache.set(key, value);
  }
  
  return value;
};

/** Versione async per flussi non-React/export: attende bootstrap o fallback Supabase. */
export const getCategoryPlaceholdersAsync = (): Promise<Record<string, string> | null> =>
  getSetting<Record<string, string>>(SETTINGS_KEYS.CATEGORY_PLACEHOLDERS);

export const saveSetting = async (key: string, value: any): Promise<any> => {
  const { data, error } = await supabase.from('global_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key).select().single();
  if (error) {
    if (error.code === 'PGRST116') {
      const { data: newData, error: newError } = await supabase.from('global_settings').insert({ key, value }).select().single();
      if (newError) throw newError;
      return newData;
    }
    throw error;
  }
  return data;
};

// ========================================================================
// DESIGN SYSTEM
// ========================================================================

export const getDesignSystemRules = async (): Promise<StyleRule[]> => {
  // Se abbiamo i dati in cache (caricati dal bootstrap API), usiamoli
  if (designRulesCache && designRulesCache.length > 0) {
    console.log("[DesignSystem] Using cached design rules (in-memory cache)");
    return designRulesCache;
  }

  console.log("[DesignSystem] Fetching rules from SOURCE OF TRUTH (Supabase)");
  const { data, error } = await supabase.from('design_system_rules').select('*').order('id', { ascending: true });
  if (error) {
    console.warn("[DesignSystem] Error fetching from Supabase, returning empty array");
    return [];
  }
  
  // Salviamo in cache per chiamate future
  designRulesCache = data;
  return data;
};


/**
 * Aggiorna una regola nella SOURCE OF TRUTH
 */
export const updateDesignSystemRule = async (rule: StyleRule): Promise<void> => {
  console.log(`[DesignSystem] Updating rule ${rule.component_key}`);

  const payload = {
    component_key: rule.component_key,
    element_name: rule.element_name ?? '',
    section: rule.section ?? null,
    css_class: rule.css_class ?? null,
    font_family: rule.font_family ?? null,
    text_size: rule.text_size ?? null,
    font_weight: rule.font_weight ?? null,
    line_height: rule.line_height ?? null,
    text_transform: rule.text_transform ?? null,
    tracking: rule.tracking ?? null,
    color_class: rule.color_class ?? null,
    effect_class: rule.effect_class ?? null,
    preview_text: rule.preview_text ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('design_system_rules')
    .upsert(payload, { onConflict: 'component_key' });

  if (error) {
    console.error("Error updating design system rule:", error);
    throw error;
  }

  // Invalida la cache in-memory: il prossimo getDesignSystemRules() andrà in Supabase.
  designRulesCache = null;
};


export const rebuildDesignSystemCache = async (): Promise<Record<string, StyleRule>> => {
  console.log("[DesignSystem] Rebuilding cache from Supabase...");

  // getDesignSystemRules() usa la cache in-memory se disponibile.
  // updateDesignSystemRule() la azzera dopo ogni save, quindi qui troviamo
  // sempre designRulesCache === null → fetch fresco da Supabase.
  const rules = await getDesignSystemRules();

  const componentsMap = rules.reduce((acc, rule) => {
    if (rule.component_key) acc[rule.component_key] = rule;
    return acc;
  }, {} as Record<string, StyleRule>);

  console.log(`[DesignSystem] Cache rebuilt: ${rules.length} rules`);
  return componentsMap;
};