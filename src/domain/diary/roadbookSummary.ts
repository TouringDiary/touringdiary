/**
 * SoT — calcolo Riepilogo Viaggio del Roadbook (Budget / Mobilità / Esperienze).
 * Puro: nessun React, nessun side-effect. Usato da UI modal e PDF.
 */

import type { ItineraryItem, RoadbookDay } from '@/types';

export type RoadbookExperienceCounts = {
  monument: number;
  food: number;
  nature: number;
  leisure: number;
  shopping: number;
};

export type RoadbookSummary = {
  totalSegments: number;
  totalTransportCost: number;
  totalTicketCost: number;
  totalFoodCost: number;
  totalBudget: number;
  totalWalkingMinutes: number;
  totalTransitMinutes: number;
  catCounts: RoadbookExperienceCounts;
};

const parseCost = (str?: string): number => {
  if (!str) return 0;
  const match = str.match(/(\d+[.,]\d+)/);
  if (match?.[1]) return Number.parseFloat(match[1].replace(',', '.'));
  const matchInt = str.match(/(\d+)/);
  if (matchInt?.[1]) return Number.parseFloat(matchInt[1]);
  return 0;
};

const parseMinutes = (str: string): number => {
  if (!str) return 0;
  let total = 0;
  const hMatch = str.match(/(\d+)\s*h/i);
  const mMatch = str.match(/(\d+)\s*min/i);
  if (hMatch?.[1]) total += Number.parseInt(hMatch[1], 10) * 60;
  if (mMatch?.[1]) total += Number.parseInt(mMatch[1], 10);
  return total;
};

export const formatRoadbookDuration = (mins: number): string => {
  if (mins === 0) return '0 min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

export const computeRoadbookSummary = (
  roadbook: RoadbookDay[] | undefined | null,
  itineraryItems: ItineraryItem[],
): RoadbookSummary => {
  let totalSegments = 0;
  let totalTransportCost = 0;
  let totalTicketCost = 0;
  let totalFoodCost = 0;
  let totalWalkingMinutes = 0;
  let totalTransitMinutes = 0;

  const catCounts: RoadbookExperienceCounts = {
    monument: 0,
    food: 0,
    nature: 0,
    leisure: 0,
    shopping: 0,
  };

  for (const day of roadbook ?? []) {
    for (const seg of day.segments ?? []) {
      totalSegments++;
      totalTransportCost += parseCost(seg.transportCost);
      totalTicketCost += parseCost(seg.ticketCost);
      totalFoodCost += parseCost(seg.foodCost);

      const mins = parseMinutes(seg.duration);
      if (seg.transportMode === 'walk') totalWalkingMinutes += mins;
      else totalTransitMinutes += mins;
    }
  }

  // Mapping esperienze ↔ PoiCategory vigente (monument/food/nature/leisure/shop→shopping).
  // Riflette il dominio attuale: non estendere senza aggiornare il modello di dominio.
  for (const item of itineraryItems) {
    const cat = item.poi?.category;
    if (!cat) continue;
    if (cat === 'monument') catCounts.monument++;
    else if (cat === 'food') catCounts.food++;
    else if (cat === 'nature') catCounts.nature++;
    else if (cat === 'leisure') catCounts.leisure++;
    else if (cat === 'shop') catCounts.shopping++;
  }

  return {
    totalSegments,
    totalTransportCost,
    totalTicketCost,
    totalFoodCost,
    totalBudget: totalTransportCost + totalTicketCost + totalFoodCost,
    totalWalkingMinutes,
    totalTransitMinutes,
    catCounts,
  };
};
