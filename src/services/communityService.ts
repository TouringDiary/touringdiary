/**
 * BARREL FILE - COMMUNITY SERVICE
 * Questo file mantiene la retrocompatibilità con gli import esistenti
 * riesportando le funzionalità dai moduli di dominio isolati.
 */

// Riesposizione utility UUID per compatibilità legacy interna
export { UUID_REGEX } from '../utils/uuid';
export * from './community/businessStatsService';
export * from './community/interactionService';
export * from './community/itineraryService';
export * from './community/postService';
export * from './community/reviewService';
export * from './community/suggestionService';
