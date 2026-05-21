/**
 * BARREL FILE - COMMUNITY SERVICE
 * Questo file mantiene la retrocompatibilità con gli import esistenti
 * riesportando le funzionalità dai moduli di dominio isolati.
 */

export * from './community/itineraryService';
export * from './community/postService';
export * from './community/interactionService';
export * from './community/suggestionService';
export * from './community/reviewService';
export * from './community/businessStatsService';

// Riesposizione utility UUID per compatibilità legacy interna
export { UUID_REGEX } from '../utils/uuid';