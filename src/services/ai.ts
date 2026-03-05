
// BARREL FILE PRINCIPALE SERVIZI AI
// Re-esporta i moduli core e i generatori tramite gli aggregatori.

export * from './ai/aiClient';
export * from './ai/aiUtils';
export * from './ai/aiVision';
export * from './ai/aiText';    // Ora include: cityContent, list, people, poi generators
export * from './ai/aiPlanner'; // Logica pianificazione itinerari

// RE-EXPORT SPECIFIC FROM SUB-MODULES IF NEEDED DIRECTLY
// Questo assicura che `generateZoneAnalysis` sia accessibile tramite `import { ... } from '../../services/ai'`
export { generateZoneAnalysis } from './ai/generators/cityContentGenerator';
