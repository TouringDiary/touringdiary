/**
 * Eccezione documentata (MACROFASE A → C):
 * `src/hooks/suitcase/aiSuggestions.ts` resta sorgente runtime AI fino a MACROFASE C.
 * Il catalogo DB (`packing_ai_catalog`) è popolato e gestibile da admin;
 * il motore AI verrà collegato in MACROFASE C.
 */

export * from './packingCategories';
export * from './categorySetup';
export * from './packingAiSeedSource';
