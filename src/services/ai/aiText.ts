// AI TEXT SERVICE (BARREL FILE)
// Aggregatore generatori di testo/contenuto + re-export chat per compatibilità Admin (`services/ai`).
// Il path Home importa `generateChatReply` da `aiChat` (senza questo barrel).

export { generateChatReply } from './aiChat';

export * from './generators/cityContentGenerator';
export * from './generators/listGenerator';
export * from './generators/peopleGenerator';
export * from './generators/poiGenerator';
