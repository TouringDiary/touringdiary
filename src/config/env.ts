
/**
 * ENVIRONMENT CONFIGURATION SERVICE
 * 
 * Centralizza l'accesso alle variabili d'ambiente.
 * Semplificato per garantire il caricamento della chiave se presente nel sistema.
 */

const getSafeEnv = (key: string): string => {
    try {
        // Accesso safe a process
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            const val = String(process.env[key]).trim();
            // Rimosso il controllo lunghezza aggressivo e il filtro caratteri
            // Ritorniamo il valore grezzo se esiste
            return val;
        }
        // Fallback per ambienti Vite/Browser moderni
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
            // @ts-ignore
            return String(import.meta.env[`VITE_${key}`]).trim();
        }
    } catch (e) {
        // Ignora errori ambiente
    }
    
    // --- AREA DI EMERGENZA ---
    // Se il sistema non trova la chiave nell'ambiente, puoi incollarla qui sotto tra le virgolette
    // Esempio: return "AIzaSy..."; 
    if (key === 'API_KEY') {
        return ""; // INCOLLA QUI LA TUA CHIAVE SE CONTINUA A NON FUNZIONARE
    }
    
    return '';
};

export const CONFIG = {
    APP_VERSION: '1.0.1',
    ENV: getSafeEnv('NODE_ENV') || 'development',
    API_KEY: getSafeEnv('API_KEY')
};
