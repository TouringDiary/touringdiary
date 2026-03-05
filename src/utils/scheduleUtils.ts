
import { PointOfInterest } from '../types/index';

export interface ScheduleAnalysis {
    matrix: boolean[]; // Array di 7 booleani (Lun-Dom)
    isSuspicious: boolean;
    suspicionReason?: string;
    description: string;
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

/**
 * Analizza gli orari di un POI e restituisce una matrice visuale e avvisi di qualità.
 */
export const analyzeSchedule = (poi: PointOfInterest): ScheduleAnalysis => {
    const matrix = [false, false, false, false, false, false, false];
    
    // 1. Parsing Giorni Attivi
    const daysStr = poi.openingHours?.days || [];
    const morning = poi.openingHours?.morning || '';
    const afternoon = poi.openingHours?.afternoon || '';
    const fullTimeStr = (morning + afternoon).toLowerCase();

    // Se "Chiuso permanentemente", tutto falso
    if (fullTimeStr.includes('chiuso permanentemente') || fullTimeStr.includes('temporaneamente chiuso')) {
        return { 
            matrix, 
            isSuspicious: false, 
            description: "Chiuso Permanentemente" 
        };
    }

    // Popola matrice
    WEEK_DAYS.forEach((day, index) => {
        // Logica semplice: se l'array giorni contiene la stringa del giorno (es "Lun"), è attivo
        if (daysStr.includes(day)) {
            matrix[index] = true;
        }
    });

    // Se l'array giorni è vuoto ma c'è un orario, assumiamo 7/7 (o analizziamo meglio in futuro)
    if (daysStr.length === 0 && (morning || afternoon)) {
        matrix.fill(true);
    }

    // 2. Analisi Euristiche (Suspicion Logic)
    let isSuspicious = false;
    let suspicionReason = '';

    // A. Controllo Sintassi Vuota
    if (!morning && !afternoon) {
        isSuspicious = true;
        suspicionReason = "Orari mancanti";
    }

    // B. Controllo "Museo di Lunedì"
    if (poi.category === 'monument' && matrix[0] === true) {
        // Molti musei sono chiusi il lunedì. È un warning soft.
        // Eccezione: Chiese spesso aperte.
        if (!poi.subCategory?.includes('church') && !poi.subCategory?.includes('square')) {
             isSuspicious = true;
             suspicionReason = "Museo aperto Lunedì? (Verificare)";
        }
    }

    // C. Controllo "Ristorante chiuso Weekend"
    if (poi.category === 'food' && (!matrix[5] || !matrix[6])) {
        isSuspicious = true;
        suspicionReason = "Chiuso nel weekend? (Insolito per Ristorazione)";
    }

    // D. Controllo "Sempre Aperto" (Sospetto per monumenti/musei)
    const openDaysCount = matrix.filter(Boolean).length;
    if (openDaysCount === 7 && poi.category === 'monument' && !poi.subCategory?.includes('square')) {
        isSuspicious = true;
        suspicionReason = "Aperto 7/7? (Spesso i monumenti hanno un giorno di chiusura)";
    }

    // E. Controllo AI Estimated
    if (poi.openingHours?.isEstimated) {
        isSuspicious = true;
        suspicionReason = "Dato stimato da AI (Non verificato)";
    }

    return {
        matrix,
        isSuspicious,
        suspicionReason,
        description: `${morning} ${afternoon ? '/ ' + afternoon : ''}`.trim() || 'Orari non definiti'
    };
};
