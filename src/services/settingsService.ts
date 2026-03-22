import { supabase } from './supabaseClient';
import type { GlobalSetting, StyleRule } from '../types';

// --- CHIAVI DELLE IMPOSTAZIONI ---
export const SETTINGS_KEYS = {
  // AI & Prompts
  AI_ENABLED: 'ai_enabled',
  PROMPT_CITY_AUDIT: 'prompt_city_audit',
  PROMPT_PEOPLE_SUGGEST: 'prompt_people_suggest',

  // Marketing & Pricing
  MARKETING_PRICES_V2: 'marketing_prices_v2',
  MARKETING_PROMO_TYPES: 'marketing_promo_types',

  // Design & UI Assets
  HERO_IMAGE: 'hero_image',
  DEFAULT_PATRON_IMAGE: 'default_patron_image',
  AUTH_BACKGROUND_IMAGE: 'auth_background_image',
  SOCIAL_CANVAS_BG: 'social_canvas_bg',
  AI_CONSULTANT_BG: 'ai_consultant_bg',
  CATEGORY_PLACEHOLDERS: 'category_placeholders',

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
};

// --- CACHE IN MEMORIA ---
let settingsCache: Map<string, any> = new Map();

export const loadGlobalCache = async (): Promise<void> => {
  const { data, error } = await supabase.from('global_settings').select('key, value');
  if (error) {
    console.error("Failed to fetch global settings:", error);
    return;
  }
  settingsCache.clear();
  for (const setting of data) {
    settingsCache.set(setting.key, setting.value);
  }
  console.log("[Cache] Global settings cache loaded.", settingsCache);
};

export const getCachedSetting = <T>(key: string): T | null => {
  return settingsCache.get(key) as T | null;
};

export const getSettings = async (): Promise<GlobalSetting[]> => {
  const { data, error } = await supabase.from('global_settings').select('key, value');
  if (error) throw error;
  return data;
};

export const getSetting = async <T>(key: string): Promise<T | null> => {
  if (!key) {
    console.error("[SettingsService] getSetting called with invalid key:", key);
    console.trace("CALL STACK getSetting");
    return null;
  }
  const { data, error } = await supabase.from('global_settings').select('value').eq('key', key).single();
  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching setting ${key}:`, error);
    throw error;
  }
  return data ? (data.value as T) : null;
};

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
  console.log("[DesignSystem] Fetching rules from SOURCE OF TRUTH");
  const { data, error } = await supabase.from('design_system_rules').select('*').order('id', { ascending: true });
  if (error) {
    console.error("Error fetching design system rules:", error);
    throw error;
  }
  return data;
};


/**
 * Aggiorna una regola nella SOURCE OF TRUTH
 */
export const updateDesignSystemRule = async (rule: StyleRule): Promise<void> => {
  console.log(`[DesignSystem] Updating rule ${rule.component_key}`);

  // --- FIX: Costruisce un payload esplicito con solo i campi della tabella ---
  const payload = {
    component_key: rule.component_key,
    element_name: rule.element_name ?? '',
    section: rule.section ?? null,
    css_class: rule.css_class ?? null,
    font_family: rule.font_family ?? null,
    text_size: rule.text_size ?? null,
    font_weight: rule.font_weight ?? null,
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
};


export const rebuildDesignSystemCache = async (): Promise<any> => {
  console.log("[DesignSystem] Rebuilding public cache...");

  const baseConfig = (currentSiteDesign && typeof currentSiteDesign === 'object') ? currentSiteDesign : {};

  const rules = await getDesignSystemRules();
  const componentsMap = rules.reduce((acc, rule) => {
    acc[rule.component_key] = rule;
    return acc;
  }, {} as Record<string, StyleRule>);

  const finalCacheObject = {
    ...baseConfig,
    components: componentsMap,
    last_updated: new Date().toISOString(),
  };

  console.log("[DesignSystem] Public cache rebuild COMPLETE");
  return finalCacheObject;
};