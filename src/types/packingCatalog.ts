/** Tipi per il catalogo packing DB-driven (standard, template specifici, AI) */

export type { CategorySetupEntry, CategorySetupMap } from '../domain/packing/categorySetupTypes';

export type PackingStandardItemTier = 'core' | 'additional' | 'additional_ai_only';

export interface PackingStandardItem {
  id: string;
  category: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  tier: PackingStandardItemTier;
  created_at?: string;
  updated_at?: string;
}

export interface PackingTemplateItem {
  id: string;
  template_id: string;
  category: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PackingAiCatalogItem {
  id: string;
  name: string;
  category: string;
  tags: string[];
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UpsertPackingStandardItemDto {
  id?: string;
  category: string;
  name: string;
  sort_order?: number;
  is_active?: boolean;
  tier?: PackingStandardItemTier;
}

export interface UpsertPackingTemplateItemDto {
  id?: string;
  template_id: string;
  category: string;
  name: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpsertPackingAiCatalogItemDto {
  id?: string;
  name: string;
  category: string;
  tags?: string[];
  sort_order?: number;
  is_active?: boolean;
}
