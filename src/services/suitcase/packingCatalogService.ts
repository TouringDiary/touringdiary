import { supabase } from '../supabaseClient';
import {
  DbPackingAiCatalogItem,
  DbPackingAiCatalogItemInsert,
  DbPackingStandardItem,
  DbPackingStandardItemInsert,
  DbPackingTemplateItem,
  DbPackingTemplateItemInsert,
} from '../../types/domain/index';
import {
  PackingAiCatalogItem,
  PackingStandardItem,
  PackingStandardItemTier,
  PackingTemplateItem,
  UpsertPackingAiCatalogItemDto,
  UpsertPackingStandardItemDto,
  UpsertPackingTemplateItemDto,
} from '@/types/packingCatalog';
import { normalizeCategoryName } from '@/domain/packing/packingCategories';

function parseStandardItemTier(value: string): PackingStandardItemTier {
  if (value === 'core' || value === 'additional' || value === 'additional_ai_only') {
    return value;
  }
  throw new Error(`[packingCatalogService] tier non valido: ${value}`);
}

const mapStandardRow = (row: DbPackingStandardItem): PackingStandardItem => ({
  id: row.id,
  category: normalizeCategoryName(row.category),
  name: row.name,
  sort_order: row.sort_order,
  is_active: row.is_active,
  tier: parseStandardItemTier(row.tier),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const mapTemplateRow = (row: DbPackingTemplateItem): PackingTemplateItem => ({
  id: row.id,
  template_id: row.template_id,
  category: normalizeCategoryName(row.category),
  name: row.name,
  sort_order: row.sort_order,
  is_active: row.is_active,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const mapAiRow = (row: DbPackingAiCatalogItem): PackingAiCatalogItem => ({
  id: row.id,
  name: row.name,
  category: normalizeCategoryName(row.category),
  tags: row.tags,
  sort_order: row.sort_order,
  is_active: row.is_active,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const toStandardInsert = (dto: UpsertPackingStandardItemDto): DbPackingStandardItemInsert => ({
  id: dto.id,
  category: normalizeCategoryName(dto.category),
  name: dto.name.trim(),
  sort_order: dto.sort_order ?? 0,
  is_active: dto.is_active ?? true,
  tier: dto.tier ?? 'core',
});

const toTemplateInsert = (dto: UpsertPackingTemplateItemDto): DbPackingTemplateItemInsert => ({
  id: dto.id,
  template_id: dto.template_id,
  category: normalizeCategoryName(dto.category),
  name: dto.name.trim(),
  sort_order: dto.sort_order ?? 0,
  is_active: dto.is_active ?? true,
});

const toAiInsert = (dto: UpsertPackingAiCatalogItemDto): DbPackingAiCatalogItemInsert => ({
  id: dto.id,
  name: dto.name.trim(),
  category: normalizeCategoryName(dto.category),
  tags: dto.tags ?? [],
  sort_order: dto.sort_order ?? 0,
  is_active: dto.is_active ?? true,
});

// ─── Standard items ─────────────────────────────────────────────────────────

export const fetchActiveStandardItemsAsync = async (): Promise<PackingStandardItem[]> => {
  const { data, error } = await supabase
    .from('packing_standard_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return (data ?? []).map(mapStandardRow);
};

export const fetchAllStandardItemsAsync = async (): Promise<PackingStandardItem[]> => {
  const { data, error } = await supabase
    .from('packing_standard_items')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return (data ?? []).map(mapStandardRow);
};

export const upsertStandardItemAsync = async (
  dto: UpsertPackingStandardItemDto
): Promise<PackingStandardItem> => {
  const { data, error } = await supabase
    .from('packing_standard_items')
    .upsert(toStandardInsert(dto))
    .select()
    .single();

  if (error) throw error;
  return mapStandardRow(data);
};

export const deleteStandardItemAsync = async (id: string): Promise<void> => {
  const { error } = await supabase.from('packing_standard_items').delete().eq('id', id);
  if (error) throw error;
};

// ─── Template specific items ──────────────────────────────────────────────────

export const fetchTemplateSpecificItemsAsync = async (
  templateId: string
): Promise<PackingTemplateItem[]> => {
  const { data, error } = await supabase
    .from('packing_template_items')
    .select('*')
    .eq('template_id', templateId)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return (data ?? []).map(mapTemplateRow);
};

export const fetchAllTemplateSpecificItemsAsync = async (
  templateId: string
): Promise<PackingTemplateItem[]> => {
  const { data, error } = await supabase
    .from('packing_template_items')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order');

  if (error) throw error;
  return (data ?? []).map(mapTemplateRow);
};

/** Batch fetch per evitare N+1 nella composizione di più template TD. */
export const fetchTemplateSpecificItemsForTemplatesAsync = async (
  templateIds: string[]
): Promise<Map<string, PackingTemplateItem[]>> => {
  const result = new Map<string, PackingTemplateItem[]>();
  if (templateIds.length === 0) return result;

  const { data, error } = await supabase
    .from('packing_template_items')
    .select('*')
    .in('template_id', templateIds)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  for (const row of data ?? []) {
    const mapped = mapTemplateRow(row);
    const list = result.get(mapped.template_id) ?? [];
    list.push(mapped);
    result.set(mapped.template_id, list);
  }

  return result;
};

export const upsertTemplateSpecificItemAsync = async (
  dto: UpsertPackingTemplateItemDto
): Promise<PackingTemplateItem> => {
  const { data, error } = await supabase
    .from('packing_template_items')
    .upsert(toTemplateInsert(dto))
    .select()
    .single();

  if (error) throw error;
  return mapTemplateRow(data);
};

export const deleteTemplateSpecificItemAsync = async (id: string): Promise<void> => {
  const { error } = await supabase.from('packing_template_items').delete().eq('id', id);
  if (error) throw error;
};

export const cloneTemplateSpecificItemsAsync = async (
  sourceTemplateId: string,
  targetTemplateId: string
): Promise<void> => {
  const sourceItems = await fetchAllTemplateSpecificItemsAsync(sourceTemplateId);
  if (sourceItems.length === 0) return;

  const rows: DbPackingTemplateItemInsert[] = sourceItems.map((item) => ({
    template_id: targetTemplateId,
    category: item.category,
    name: item.name,
    sort_order: item.sort_order,
    is_active: item.is_active,
  }));

  const { error } = await supabase.from('packing_template_items').insert(rows);
  if (error) throw error;
};

// ─── AI catalog ─────────────────────────────────────────────────────────────

export const fetchActiveAiCatalogAsync = async (): Promise<PackingAiCatalogItem[]> => {
  const { data, error } = await supabase
    .from('packing_ai_catalog')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return (data ?? []).map(mapAiRow);
};

export const fetchAllAiCatalogAsync = async (): Promise<PackingAiCatalogItem[]> => {
  const { data, error } = await supabase
    .from('packing_ai_catalog')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return (data ?? []).map(mapAiRow);
};

export const upsertAiCatalogItemAsync = async (
  dto: UpsertPackingAiCatalogItemDto
): Promise<PackingAiCatalogItem> => {
  const { data, error } = await supabase
    .from('packing_ai_catalog')
    .upsert(toAiInsert(dto))
    .select()
    .single();

  if (error) throw error;
  return mapAiRow(data);
};

export const deleteAiCatalogItemAsync = async (id: string): Promise<void> => {
  const { error } = await supabase.from('packing_ai_catalog').delete().eq('id', id);
  if (error) throw error;
};
