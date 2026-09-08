import type {
  DatabaseShop,
  DatabaseShopInsert,
  DatabaseShopProduct,
  DatabaseShopProductInsert,
  Json,
} from '@/types/database';
import type { Review, ShopCategory, ShopPartner, ShopProduct } from '../types';
import { supabase } from './supabaseClient';

// --- READ OPERATIONS ---

export const getAllShops = async (): Promise<ShopPartner[]> => {
  try {
    const { data, error } = await supabase.from('shops').select(`*, shop_products (*)`);

    if (error) throw error;
    return mapDatabaseShopsToApp(data || []);
  } catch (e) {
    console.error('DB Error Shops:', e);
    return [];
  }
};

export const getShopByVat = async (vat: string): Promise<ShopPartner | undefined> => {
  const { data } = await supabase
    .from('shops')
    .select(`*, shop_products (*)`)
    .eq('vat_number', vat)
    .maybeSingle();

  if (data) return mapDatabaseShopsToApp([data])[0];
  return undefined;
};

export const getShopById = async (id: string): Promise<ShopPartner | undefined> => {
  const { data, error } = await supabase
    .from('shops')
    .select(`*, shop_products (*)`)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[ShopService] Error fetching shop by id:', error);
    return undefined;
  }

  if (data) return mapDatabaseShopsToApp([data])[0];
  return undefined;
};

export const getShopByOwner = async (ownerId: string): Promise<ShopPartner | undefined> => {
  // Contratto singolo: i consumer (`useUserDashboardData`, `PartnerDetailModal`) usano un solo shop.
  // Evitiamo maybeSingle() (PGRST116 se esistono più row); .limit(1) restituisce al più un record.
  const { data, error } = await supabase
    .from('shops')
    .select(`*, shop_products (*)`)
    .eq('owner_id', ownerId)
    .limit(1);

  if (error) {
    console.error('[ShopService] Error fetching shop by owner:', error);
    return undefined;
  }

  if (data && data.length > 0) {
    return mapDatabaseShopsToApp(data)[0];
  }
  return undefined;
};

export const getShopsByFilter = async (
  cityId: string,
  category?: ShopCategory,
): Promise<ShopPartner[]> => {
  let query = supabase.from('shops').select(`*, shop_products (*)`).eq('city_id', cityId);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Filter Shops Error:', error);
    return [];
  }

  let results = mapDatabaseShopsToApp(data || []);

  // VISIBILITY RULE: Bottega must have at least 1 visible product
  results = results.filter((shop) => shop.products && shop.products.length > 0);

  // SORTING
  return results.sort((a, b) => {
    if (a.badge === 'gold' && b.badge !== 'gold') return -1;
    if (a.badge !== 'gold' && b.badge === 'gold') return 1;
    if (a.level === 'premium' && b.level !== 'premium') return -1;
    if (a.level !== 'premium' && b.level === 'premium') return 1;
    return calculateShopRank(b) - calculateShopRank(a);
  });
};

/** Batch: negozi digitali per più città (Around Me). Stessa visibilità/ordinamento di getShopsByFilter. */
export const getShopsByCityIds = async (
  cityIds: string[],
  category?: ShopCategory,
): Promise<ShopPartner[]> => {
  if (cityIds.length === 0) return [];

  let query = supabase.from('shops').select(`*, shop_products (*)`).in('city_id', cityIds);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Filter Shops By City Ids Error:', error);
    return [];
  }

  let results = mapDatabaseShopsToApp(data || []);
  results = results.filter((shop) => shop.products && shop.products.length > 0);

  return results.sort((a, b) => {
    if (a.badge === 'gold' && b.badge !== 'gold') return -1;
    if (a.badge !== 'gold' && b.badge === 'gold') return 1;
    if (a.level === 'premium' && b.level !== 'premium') return -1;
    if (a.level !== 'premium' && b.level === 'premium') return 1;
    return calculateShopRank(b) - calculateShopRank(a);
  });
};

export const calculateShopRank = (shop: ShopPartner): number => {
  const rating = shop.rating || 0;
  const reviews = shop.reviewsCount || 0;
  const likes = shop.likes || 0;
  return likes + rating * reviews;
};

// --- WRITE OPERATIONS ---

export const saveShop = async (shop: ShopPartner): Promise<void> => {
  const dbShop: DatabaseShopInsert = {
    id: shop.id,
    city_id: shop.cityId,
    name: shop.name,
    category: shop.category,
    level: shop.level,
    badge: shop.badge,
    image_url: shop.imageUrl,
    gallery: shop.gallery,
    founded_year: shop.foundedYear,
    short_bio: shop.shortBio,
    description: shop.description,
    vat_number: shop.vatNumber,
    address: shop.address,
    coords_lat: shop.coords?.lat ?? null,
    coords_lng: shop.coords?.lng ?? null,
    phone: shop.phone,
    email: shop.email,
    website: shop.website,
    shipping_info: shop.shippingInfo,
    payment_info: shop.paymentInfo,
    ai_credits: shop.aiCredits,
    is_tipico: shop.isTipico || false,
    likes: shop.likes,
    rating: shop.rating,
    reviews_count: shop.reviewsCount,
    reviews: shop.reviews as unknown as Json, // Safe cast to recursive Json type
    owner_id: shop.ownerId, // NEW: Supporto owner_id tipizzato
    slug: shop.slug || null,
    updated_at: new Date().toISOString(),
  };
  const { error: upsertShopError } = await supabase.from('shops').upsert(dbShop);
  if (upsertShopError) {
    console.error('[ShopService] saveShop upsert failed:', upsertShopError.message);
    throw upsertShopError;
  }

  if (shop.id) {
    const { error: syncError } = await supabase.rpc('sync_sponsor_profile_from_shop', {
      p_shop_id: shop.id,
      p_refresh_subscription: false,
    });
    if (syncError) {
      console.error('[ShopService] sync_sponsor_profile_from_shop failed:', syncError.message);
      throw syncError;
    }
  }
};

export const deleteShop = async (shopId: string): Promise<void> => {
  const { error } = await supabase.from('shops').delete().eq('id', shopId);
  if (error) {
    console.error('[ShopService] deleteShop failed:', error.message);
    throw error;
  }
};

export const saveProduct = async (shopId: string, product: ShopProduct): Promise<void> => {
  assertShopProductInvariants(product);
  const dbProduct: DatabaseShopProductInsert = {
    id: product.id,
    shop_id: shopId,
    name: product.name.trim(),
    description: product.description.trim(),
    image_url: product.imageUrl.trim(),
    price: product.price,
    status: product.status,
    shipping_mode: product.shippingMode,
  };
  const { error: upsertProductError } = await supabase.from('shop_products').upsert(dbProduct);
  if (upsertProductError) {
    console.error('[ShopService] saveProduct upsert failed:', upsertProductError.message);
    throw upsertProductError;
  }

  const { data: sponsor, error: sponsorError } = await supabase
    .from('sponsors')
    .select('id, tier')
    .eq('shop_id', shopId)
    .maybeSingle();

  if (sponsorError) {
    console.error('[ShopService] sponsor lookup failed:', sponsorError.message);
    throw sponsorError;
  }

  if (sponsor) {
    const tier: 'standard' | 'premium' = sponsor.tier === 'gold' ? 'premium' : 'standard';
    const { error: syncError } = await supabase.rpc('sync_sponsor_profile_from_shop', {
      p_shop_id: shopId,
      p_refresh_subscription: true,
      p_subscription_tier: tier,
    });
    if (syncError) {
      console.error('[ShopService] sync_sponsor_profile_from_shop failed:', syncError.message);
      throw syncError;
    }
  }
};

export const deleteShopProduct = async (productId: string): Promise<void> => {
  const { error } = await supabase.from('shop_products').delete().eq('id', productId);
  if (error) {
    console.error('[ShopService] deleteShopProduct failed:', error.message);
    throw error;
  }
};

// --- DOMAIN NORMALIZATION MAPPERS (Type-Safe Enums) ---

const normalizeShopCategory = (cat: string | null): ShopCategory | null => {
  const valid: ShopCategory[] = ['gusto', 'cantina', 'artigianato', 'moda'];
  if (!cat) return null;
  const matched = valid.find((v) => v === cat);
  if (matched) return matched;
  // Mapping legacy documentato
  if (cat.toLowerCase() === 'pasticceria') return 'gusto';
  return null;
};

const normalizeShopLevel = (level: string | null): ShopPartner['level'] | null => {
  return level === 'base' || level === 'premium' ? level : null;
};

const normalizeShopBadge = (badge: string | null): ShopPartner['badge'] | null => {
  return badge === 'registered' || badge === 'gold' ? badge : null;
};

const normalizeProductStatus = (status: string | null): ShopProduct['status'] | null => {
  return status === 'active' || status === 'inactive' ? status : null;
};

const normalizeShippingMode = (mode: string | null): ShopProduct['shippingMode'] | null => {
  const valid: ShopProduct['shippingMode'][] = ['pickup', 'ship', 'both'];
  return valid.find((v) => v === mode) ?? null;
};

/**
 * Invarianti Negozio Digitale (nome, descrizione, immagine, prezzo > 0).
 * Nessun backfill inventato: prodotti incompleti restano fuori dal dominio app.
 * Usa variabili locali ristrette (niente type-predicate) per restare corretto
 * anche quando strictNullChecks non è attivo nel tsconfig app.
 */
const assertShopProductInvariants = (product: ShopProduct): void => {
  if (!product.name?.trim()) {
    throw new Error('[ShopService] Product name is required.');
  }
  if (!product.description?.trim()) {
    throw new Error('[ShopService] Product description is required.');
  }
  if (!product.imageUrl?.trim()) {
    throw new Error('[ShopService] Product image is required.');
  }
  if (!(product.price > 0)) {
    throw new Error('[ShopService] Product price must be greater than 0.');
  }
};

const mapDatabaseProductToApp = (
  p: DatabaseShopProduct,
): { product: ShopProduct } | { skip: 'incomplete' | 'invalid_enums' } => {
  const name = typeof p.name === 'string' ? p.name.trim() : '';
  const description = typeof p.description === 'string' ? p.description.trim() : '';
  const imageUrl = typeof p.image_url === 'string' ? p.image_url.trim() : '';
  const price = p.price == null ? NaN : Number(p.price);

  if (!name || !description || !imageUrl || !(price > 0)) {
    return { skip: 'incomplete' };
  }

  const status = normalizeProductStatus(p.status);
  const shippingMode = normalizeShippingMode(p.shipping_mode);
  if (!status || !shippingMode) {
    return { skip: 'invalid_enums' };
  }

  return {
    product: {
      id: p.id,
      name,
      description,
      imageUrl,
      price,
      status,
      shippingMode,
    },
  };
};

const normalizeReviews = (data: Json): Review[] => {
  if (!Array.isArray(data)) return [];
  const reviews: Review[] = [];
  for (const item of data) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    if (
      typeof row.id !== 'string' ||
      typeof row.author !== 'string' ||
      typeof row.rating !== 'number' ||
      typeof row.date !== 'string' ||
      typeof row.text !== 'string'
    ) {
      continue;
    }
    const review: Review = {
      id: row.id,
      author: row.author,
      rating: row.rating,
      date: row.date,
      text: row.text,
    };
    if (typeof row.authorId === 'string') review.authorId = row.authorId;
    if (typeof row.updatedAt === 'string') review.updatedAt = row.updatedAt;
    if (typeof row.approvedAt === 'string') review.approvedAt = row.approvedAt;
    if (typeof row.itineraryId === 'string') review.itineraryId = row.itineraryId;
    if (typeof row.poiName === 'string') review.poiName = row.poiName;
    if (typeof row.poiId === 'string') review.poiId = row.poiId;
    if (typeof row.cityId === 'string') review.cityId = row.cityId;
    if (typeof row.cityName === 'string') review.cityName = row.cityName;
    if (row.status === 'pending' || row.status === 'approved' || row.status === 'rejected') {
      review.status = row.status;
    }
    reviews.push(review);
  }
  return reviews;
};

const mapCoordsFromDb = (
  lat: number | null,
  lng: number | null,
): { lat: number; lng: number } | undefined => {
  if (lat == null || lng == null) return undefined;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { lat, lng };
};

const mapDatabaseShopsToApp = (
  dbShops: (DatabaseShop & { shop_products: DatabaseShopProduct[] })[],
): ShopPartner[] => {
  const result: ShopPartner[] = [];
  let skippedInvalidCategory = 0;
  let skippedInvalidShopEnums = 0;
  let skippedIncompleteProducts = 0;
  let skippedInvalidProductEnums = 0;
  for (const db of dbShops) {
    const category = normalizeShopCategory(db.category);
    if (!category) {
      skippedInvalidCategory += 1;
      continue;
    }

    const level = normalizeShopLevel(db.level);
    const badge = normalizeShopBadge(db.badge);
    if (!level || !badge) {
      skippedInvalidShopEnums += 1;
      continue;
    }

    const coords = mapCoordsFromDb(db.coords_lat, db.coords_lng);
    const products: ShopProduct[] = [];
    for (const rawProduct of db.shop_products || []) {
      const mapped = mapDatabaseProductToApp(rawProduct);
      if ('product' in mapped) {
        products.push(mapped.product);
      } else if (mapped.skip === 'incomplete') {
        skippedIncompleteProducts += 1;
      } else {
        skippedInvalidProductEnums += 1;
      }
    }

    result.push({
      id: db.id,
      name: db.name || 'Senza Nome',
      cityId: db.city_id,
      category,
      level,
      badge,
      imageUrl: db.image_url || '',
      gallery: db.gallery || [],
      foundedYear: db.founded_year ?? undefined,
      shortBio: db.short_bio || '',
      description: db.description || '',
      products,
      likes: Number(db.likes) || 0,
      rating: Number(db.rating) || 0,
      reviewsCount: Number(db.reviews_count) || 0,
      reviews: normalizeReviews(db.reviews),
      vatNumber: db.vat_number ?? '',
      address: db.address || '',
      ...(coords ? { coords } : {}),
      phone: db.phone || '',
      email: db.email || '',
      website: db.website ?? undefined,
      shippingInfo: db.shipping_info ?? undefined,
      paymentInfo: db.payment_info ?? undefined,
      aiCredits: Number(db.ai_credits) || 0,
      isTipico: db.is_tipico ?? undefined,
      ownerId: db.owner_id ?? undefined,
      slug: db.slug || undefined,
    });
  }
  if (skippedInvalidCategory > 0) {
    console.warn(
      `[ShopService] Skipped ${skippedInvalidCategory} shop row(s) with unrecognized category (not mapped to ShopCategory).`,
    );
  }
  if (skippedInvalidShopEnums > 0) {
    console.warn(
      `[ShopService] Skipped ${skippedInvalidShopEnums} shop row(s) with unrecognized level/badge.`,
    );
  }
  if (skippedIncompleteProducts > 0) {
    console.warn(
      `[ShopService] Skipped ${skippedIncompleteProducts} incomplete shop_product row(s) (missing name/description/image/price).`,
    );
  }
  if (skippedInvalidProductEnums > 0) {
    console.warn(
      `[ShopService] Skipped ${skippedInvalidProductEnums} shop_product row(s) with unrecognized status/shippingMode.`,
    );
  }
  return result;
};
