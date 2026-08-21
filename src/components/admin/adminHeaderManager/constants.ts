import { ADMIN_CATEGORY_OPTIONS } from '@/domain/packing/packingCategories';

export const GLOBAL_ASSET_DEFAULTS = {
  hero: 'https://images.unsplash.com/photo-1554797589-72413632cb75?w=1280&h=720&fit=crop',
  auth_bg: 'https://images.unsplash.com/photo-1560440317-ac278253a693?w=1920&h=1080&fit=crop',
  social_bg: 'https://images.unsplash.com/photo-1554189097-90d3b64ea373?w=1080&h=1920&fit=crop',
  ai_box: '',
};

export const SUITCASE_PLACEHOLDER_CATS = [
  { id: 'global', label: 'Default Globale (Backup)' },
  ...ADMIN_CATEGORY_OPTIONS.map((name) => ({ id: name, label: name })),
];
