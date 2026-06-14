import { ItineraryItem } from '@/types';

export const normalizeItemName = (name: string, options?: { preserveCase?: boolean }): string => {
  if (!name) return '';
  const base = options?.preserveCase ? name.trim() : name.toLowerCase().trim();
  return base
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^\w\s-]/gi, '')
    .replace(/\s+/g, ' ');
};

export const deriveItineraryTags = (items: ItineraryItem[]): string[] => {
  const tags = new Set<string>();
  
  if (!items || !Array.isArray(items) || items.length === 0) return [];
  
  // Baseline based on length
  if (items.length <= 5) tags.add('weekend');
  else if (items.length >= 14) tags.add('lungo_raggio');

  items.forEach(item => {
    if (!item.poi) return;
    
    // 1. Categorical inference
    const cat = item.poi.category?.toLowerCase() || '';
    if (cat.includes('natura') || cat.includes('parco')) {
      tags.add('natura');
      tags.add('trekking');
    }
    if (cat.includes('muse') || cat.includes('arte') || cat.includes('architettura')) {
      tags.add('città');
      tags.add('cultura');
    }
    if (cat.includes('mare') || cat.includes('spiaggia') || cat.includes('lido')) {
      tags.add('mare');
      tags.add('estate');
    }
    if (cat.includes('montagna') || cat.includes('rifugio') || cat.includes('scii')) {
      tags.add('montagna');
      tags.add('inverno');
    }

    // 2. Exact string matching on names and tags
    const contextStr = `${item.poi.name} ${item.poi.description || ''} ${(item.poi.tags || []).join(' ')}`.toLowerCase();
    
    if (contextStr.includes('mare') || contextStr.includes('beach') || contextStr.includes('spiaggia')) tags.add('mare');
    if (contextStr.includes('montagna') || contextStr.includes('mountain') || contextStr.includes('alpi') || contextStr.includes('appennino')) tags.add('montagna');
    if (contextStr.includes('lago') || contextStr.includes('lake')) tags.add('lago');
    if (contextStr.includes('aeroporto') || contextStr.includes('volo') || contextStr.includes('airport')) tags.add('volo');
    if (contextStr.includes('business') || contextStr.includes('lavoro') || contextStr.includes('fiera')) tags.add('business');
    if (contextStr.includes('freddo') || contextStr.includes('neve') || contextStr.includes('ghiaccio')) tags.add('freddo');
    if (contextStr.includes('trekking') || contextStr.includes('cammino') || contextStr.includes('sentiero')) tags.add('trekking');
  });

  return Array.from(tags);
};
