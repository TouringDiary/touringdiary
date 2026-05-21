import type { User } from '@/types/users';
import { ResolvedAffiliateProductLink, ResolvedAffiliateProduct, Suitcase } from '@/types/suitcase';
import React from 'react';
import {
  Backpack, Briefcase, Camera, Car, Coffee,
  Compass, Globe, Heart, Home, Map,
  Moon, Music, Package, Palmtree, Pill,
  Plane, Smartphone, Sparkles, Star, Sun,
  Umbrella, User as UserIcon, Watch, Zap,
  Shirt, Waves, Mountain, Wind,
  CloudRain, MapPin, Calculator, Book,
  ShoppingBag, Trash2, ArrowRight, Copy,
  Plus, Check, X, ChevronDown, ChevronUp,
  Search, Shield, AlertTriangle, Info,
  Save, LogIn, LogOut, CheckCircle2, Clock,
  Smile, Cloud, Zap as ZapIcon, Moon as MoonIcon, Sun as SunIcon,
  MapPin as MapPinIcon, Camera as CameraIcon, Laptop, Coffee as CoffeeIcon,
  Utensils, Beer, Wine, Music as MusicIcon, Ghost, Heart as HeartIcon,
  Tent, Anchor, Bike, Rocket, FlaskConical, Target,
  Eye, EyeOff
} from 'lucide-react';

export const STABLE_CATEGORY_ORDER = ['Abbigliamento', 'Igiene', 'Documenti', 'Elettronica', 'Extra'];

export const SYSTEM_CATEGORY_ID_MAP: Record<string, string> = {
  'Abbigliamento': 'clothing',
  'Igiene': 'hygiene',
  'Documenti': 'documents',
  'Elettronica': 'electronics',
  'Extra': 'extra'
};

export const getCategoryId = (categoryName: string, customCategories?: any[]) => {
  // 1. Cerca nelle categorie di sistema
  if (SYSTEM_CATEGORY_ID_MAP[categoryName]) {
    return SYSTEM_CATEGORY_ID_MAP[categoryName];
  }

  // 2. Cerca nelle categorie custom (per ID stabile)
  const custom = customCategories?.find(c => c.name === categoryName);
  if (custom?.id) return custom.id;

  // 3. Fallback (slug o lowercase se non trovato - utile per migrazione o dati sporchi)
  return categoryName.toLowerCase().replace(/\s+/g, '-');
};

export const CATEGORY_ICON_REGISTRY: Record<string, React.ReactElement> = {
  Shirt: <Shirt />,
  Heart: <Heart />,
  Book: <Book />,
  Smartphone: <Smartphone />,
  Package: <Package />,
  Backpack: <Backpack />,
  Briefcase: <Briefcase />,
  Camera: <Camera />,
  Car: <Car />,
  Coffee: <Coffee />,
  Compass: <Compass />,
  Globe: <Globe />,
  Home: <Home />,
  Map: <Map />,
  Moon: <Moon />,
  Music: <Music />,
  Palmtree: <Palmtree />,
  Pill: <Pill />,
  Plane: <Plane />,
  Sparkles: <Sparkles />,
  Star: <Star />,
  Sun: <Sun />,
  Umbrella: <Umbrella />,
  User: <UserIcon />,
  Watch: <Watch />,
  Zap: <Zap />,
  Waves: <Waves />,
  Mountain: <Mountain />,
  Wind: <Wind />,
  CloudRain: <CloudRain />,
  MapPin: <MapPin />,
  Calculator: <Calculator />,
  ShoppingBag: <ShoppingBag />,
  Smile: <Smile />,
  Laptop: <Laptop />,
  Utensils: <Utensils />,
  Beer: <Beer />,
  Wine: <Wine />,
  Ghost: <Ghost />,
  Tent: <Tent />,
  Anchor: <Anchor />,
  Bike: <Bike />,
  Rocket: <Rocket />,
  FlaskConical: <FlaskConical />,
  Target: <Target />,
};

export const getIconByName = (name: string, className?: string) => {
  const IconComponent = CATEGORY_ICON_REGISTRY[name] || CATEGORY_ICON_REGISTRY['Package'];
  return React.cloneElement(IconComponent as React.ReactElement<{ className?: string }>, { className });
};

export const TEMPLATE_COLOR_CONFIG = [
  { keywords: ['mare', 'spiaggia', 'sole', 'estate', 'beach', 'summer'], color: { bg: 'bg-orange-500/15', text: 'text-orange-400' } },
  { keywords: ['montagna', 'neve', 'trekking', 'mountain', 'snow', 'hike'], color: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' } },
  { keywords: ['business', 'lavoro', 'ufficio', 'office'], color: { bg: 'bg-blue-500/15', text: 'text-blue-400' } },
  { keywords: ['citta', 'city', 'urban', 'short'], color: { bg: 'bg-sky-500/15', text: 'text-sky-400' } },
  { keywords: ['volo', 'aereo', 'flight'], color: { bg: 'bg-purple-500/15', text: 'text-purple-400' } },
  { keywords: ['treno', 'train'], color: { bg: 'bg-rose-500/15', text: 'text-rose-400' } },
  { keywords: ['pioggia', 'rain'], color: { bg: 'bg-slate-500/15', text: 'text-slate-400' } },
  { keywords: ['freddo', 'cold', 'winter'], color: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' } },
];

export const DEFAULT_TEMPLATE_COLOR = { bg: 'bg-indigo-500/15', text: 'text-indigo-400' };

export const normalizeText = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const getTemplateColor = (title: string) => {
  const normalized = normalizeText(title);
  const match = TEMPLATE_COLOR_CONFIG.find(c => c.keywords.some(k => normalized.includes(k)));
  return match ? match.color : DEFAULT_TEMPLATE_COLOR;
};

export const ItemCategoryIcon: React.FC<{ category: string; iconKey?: string; className?: string }> = ({ category, iconKey, className }) => {
  if (iconKey) return getIconByName(iconKey, className);

  switch (category.toLowerCase()) {
    case 'abbigliamento': return <span className={`${className} flex items-center justify-center`}>👕</span>;
    case 'igiene': return <span className={`${className} flex items-center justify-center`}>🚿</span>;
    case 'documenti': return <span className={`${className} flex items-center justify-center`}>📄</span>;
    case 'elettronica': return <span className={`${className} flex items-center justify-center`}>📱</span>;
    case 'extra': return <span className={`${className} flex items-center justify-center`}>📦</span>;
    default: return <span className={`${className} flex items-center justify-center`}>📦</span>;
  }
};

export const TemplateCategoryIcon: React.FC<{ template: any; className?: string }> = ({ template, className }) => {
  if (template.icon && template.icon !== "🎒") {
    return (
      <span
        className={`${className} flex items-center justify-center text-[26px] leading-none`}
      >
        {template.icon}
      </span>
    );
  }
  const title = template.title.toLowerCase();

  // Weekend priority icon
  if (title.includes('week')) return <span className={`${className} flex items-center justify-center`}>❤️</span>;

  if (title.includes('mare') || title.includes('beach')) return <Waves className={className} />;
  if (title.includes('montagna') || title.includes('mountain')) return <Mountain className={className} />;
  if (title.includes('business') || title.includes('lavoro')) return <Briefcase className={className} />;
  if (title.includes('citta') || title.includes('city')) return <Globe className={className} />;
  if (title.includes('volo') || title.includes('aereo')) return <Plane className={className} />;
  if (title.includes('treno')) return <Car className={className} />;
  if (title.includes('pioggia') || title.includes('rain')) return <CloudRain className={className} />;
  if (title.includes('freddo') || title.includes('winter')) return <Wind className={className} />;
  return <Backpack className={className} />;
};

export const normalizeAllSuitcases = (
  allSuitcases: Suitcase[],
  tripSuitcases: Suitcase[]
): Suitcase[] => {
  const map = new globalThis.Map<string, Suitcase>();

  // 1. Template globali (priorità base)
  allSuitcases.forEach(s => {
    if (!s || !s.id) return;
    if (s.user_id === null || s.is_template) {
      map.set(s.id, s);
    }
  });

  // 2. Valigie del viaggio (priorità media)
  tripSuitcases.forEach(s => {
    if (!s || !s.id) return;
    map.set(s.id, s);
  });

  // 3. Valigie reali dell'utente (priorità massima)
  allSuitcases.forEach(s => {
    if (!s || !s.id) return;
    if (s.user_id !== null && !s.is_template) {
      map.set(s.id, s);
    }
  });

  return Array.from(map.values());
};

export interface ResolveImageParams {
  product: ResolvedAffiliateProduct | null | undefined;
  partnerId?: string | null;
  adminSuitcasePlaceholders?: Record<string, string> | null;
  failedImages?: Set<string> | null;
}

export const ensurePublicUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;

  // Se è già un URL completo, restituisci
  if (url.startsWith('http')) return url;

  // Recupero dinamico dall'ambiente o fallback al progetto demo standard
  const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL;
  if (!SUPABASE_PROJECT_URL) {
    console.warn('[SuitcaseUtils] Missing VITE_SUPABASE_URL');
    return undefined;
  }
  const BUCKET = 'public-media';

  // Normalizzazione path: rimuove slash iniziale se presente
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;

  return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${BUCKET}/${cleanPath}`;
};

const INVALID_IMAGE_PATTERNS = [
  'via.placeholder.com',
  'placeholder.com'
];

export const resolveAffiliateProductImage = ({
  product,
  partnerId,
  adminSuitcasePlaceholders = {},
  failedImages = new Set()
}: ResolveImageParams): string | null => {
  if (!product) return null;

  const isFailed = (url?: string | null) => {
    if (!url) return true;

    // Lookup O(1) con Set per la massima performance di rendering
    if (failedImages && failedImages.has(url)) return true;

    // Protezione centralizzata contro i fake placeholder esterni
    if (INVALID_IMAGE_PATTERNS.some(pattern => url.includes(pattern))) return true;

    return false;
  };

  const placeholders = adminSuitcasePlaceholders || {};

  const links = product.product_links || [];
  const partnerLink = partnerId ? links.find((l: ResolvedAffiliateProductLink) => l.partner_id === partnerId) : null;

  // LIVELLO 1 — Override Admin
  // - immagine custom caricata da admin
  // - override editoriale
  const overrideImg = ensurePublicUrl(partnerLink?.image_override);
  if (overrideImg && !isFailed(overrideImg)) {
    return overrideImg;
  }

  // LIVELLO 2 — Recupero live provider
  // - Amazon API, Ebay provider, altri provider compatibili
  const apiImg = ensurePublicUrl(partnerLink?.api_image || partnerLink?.api_image_url);
  if (apiImg && !isFailed(apiImg)) {
    return apiImg;
  }

  // Fallback sul catalogo del prodotto (se presente e non fallito)
  // Riconcilia sia image_url sia imageUrl
  const catalogImg = ensurePublicUrl(product.image_url || product.imageUrl);
  if (catalogImg && !isFailed(catalogImg)) {
    return catalogImg;
  }

  // LIVELLO 3 — Placeholder Categoria
  // - Recuperare placeholder da Asset Globali / Suitcase Placeholders
  const CATEGORY_MAP_TO_ADMIN: Record<string, string> = {
    'must have': 'Extra',
    'travel': 'Extra',
    'clothing': 'Abbigliamento',
    'abbigliamento': 'Abbigliamento',
    'hygiene': 'Igiene',
    'igiene': 'Igiene',
    'beauty': 'Igiene',
    'electronics': 'Elettronica',
    'elettronica': 'Elettronica',
    'documents': 'Documenti',
    'documenti': 'Documenti',
    'gear': 'Extra',
    'extra': 'Extra'
  };

  const getProductCategory = () => {
    if (product.category && product.category !== 'Travel') return product.category;
    if (product.target_categories && product.target_categories.length > 0) {
      return product.target_categories[0];
    }
    return product.category || 'Travel';
  };

  const categoryName = getProductCategory();
  const catLower = categoryName.toLowerCase();
  const adminKey = CATEGORY_MAP_TO_ADMIN[catLower] || categoryName;

  const adminCategoryPhRaw = placeholders[adminKey] ||
    placeholders[categoryName] ||
    placeholders[catLower] ||
    Object.entries(placeholders).find(
      ([key]) => key.toLowerCase() === adminKey.toLowerCase()
    )?.[1];

  const adminCategoryPh = ensurePublicUrl(adminCategoryPhRaw);
  if (adminCategoryPh && !isFailed(adminCategoryPh)) {
    return adminCategoryPh;
  }

  // LIVELLO 4 — Placeholder Globale
  // - Sempre dagli Asset Globali DB-driven
  const adminGlobalPh = ensurePublicUrl(placeholders['global']);
  if (adminGlobalPh && !isFailed(adminGlobalPh)) {
    return adminGlobalPh;
  }

  return null;
};
