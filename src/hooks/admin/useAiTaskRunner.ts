
import { useState, useRef, useEffect, useCallback } from 'react';
import { getStorageItem, setStorageItem, removeStorageItem } from '../../services/storageService';

export interface StepReport {
    step: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    itemsCount: number;
    durationMs: number;
    details?: string;
}

const SESSION_KEY = 'touring_ai_runner_session';

export const useAiTaskRunner = () => {
    const [processLog, setProcessLog] = useState<string[]>([]);
    const [stepReports, setStepReports] = useState<StepReport[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRecovered, setIsRecovered] = useState(false); // NEW: Flag sessione recuperata
    
    // Refs per accesso sincrono immediato durante i cicli async
    const logsAccumulator = useRef<string[]>([]);
    
    // --- PERSISTENCE HELPERS ---
    const saveSession = (logs: string[], reports: StepReport[], processing: boolean) => {
        setStorageItem(SESSION_KEY, {
            logs,
            reports,
            processing,
            timestamp: Date.now()
        });
    };

    const clearSession = useCallback(() => {
        removeStorageItem(SESSION_KEY);
        setIsRecovered(false);
    }, []);

    // --- HYDRATION ON MOUNT ---
    useEffect(() => {
        const savedSession = getStorageItem<any>(SESSION_KEY, null);
        if (savedSession) {
            // Controllo validità temporale (es. scade dopo 24h)
            const isFresh = (Date.now() - savedSession.timestamp) < 24 * 60 * 60 * 1000;
            
            if (isFresh) {
                // 1. Ripristina Log
                const restoredLogs = savedSession.logs || [];
                setProcessLog(restoredLogs);
                logsAccumulator.current = restoredLogs;

                // 2. Ripristina Steps (Sanitizzando gli Zombie)
                const restoredReports: StepReport[] = (savedSession.reports || []).map((step: StepReport) => {
                    if (step.status === 'processing') {
                        return { 
                            ...step, 
                            status: 'error', 
                            details: 'Interrotto da riavvio pagina/sistema' 
                        };
                    }
                    return step;
                });
                setStepReports(restoredReports);

                // 3. Setta flag
                if (restoredLogs.length > 0) {
                    setIsRecovered(true);
                    // Aggiungi log di sistema visibile
                    setProcessLog(prev => [...prev, `[SYSTEM] ⚠️ Sessione precedente recuperata.`]);
                }
            } else {
                clearSession();
            }
        }
    }, [clearSession]);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        const fullMsg = `[${time}] ${msg}`;
        
        if (logsAccumulator.current.length > 100) {
            logsAccumulator.current = logsAccumulator.current.slice(-100);
        }
        logsAccumulator.current.push(fullMsg);
        
        setProcessLog(prev => {
            const next = [...prev, fullMsg];
            const trimmed = next.length > 100 ? next.slice(-100) : next;
            // Salva stato ad ogni log
            saveSession(trimmed, stepReports, isProcessing);
            return trimmed;
        });
    };
    
    const updateStepStatus = (stepName: string, status: StepReport['status'], count: number = 0, duration: number = 0, details: string = '') => {
        setStepReports(prev => {
            const newReports = prev.map(s => 
                s.step === stepName 
                ? { ...s, status, itemsCount: count, durationMs: duration, details }
                : s
            );
            // Salva stato ad ogni step update
            saveSession(logsAccumulator.current, newReports, isProcessing);
            return newReports;
        });
    };

    const performStep = async <T,>(
        stepName: string, 
        fn: () => Promise<T>, 
        countExtractor?: (res: T) => number,
        detailsExtractor?: (res: T) => string
    ): Promise<T> => {
        const startTime = performance.now();
        addLog(`⏳ Inizio: ${stepName}...`);
        
        updateStepStatus(stepName, 'processing');
        
        try {
            const result = await fn();
            const duration = performance.now() - startTime;
            const count = countExtractor ? countExtractor(result) : 1;
            const details = detailsExtractor ? detailsExtractor(result) : '';
            
            const seconds = (duration / 1000).toFixed(1);
            
            if (count === 0 && countExtractor) {
                addLog(`⚠️ ${stepName}: Nessun elemento (in ${seconds}s).`);
                updateStepStatus(stepName, 'success', 0, duration, details || 'Nessun risultato'); 
            } else {
                addLog(`✅ Fine: ${stepName} (${count}) in ${seconds}s`);
                updateStepStatus(stepName, 'success', count, duration, details);
            }
            
            return result;
        } catch (e: any) {
            const duration = performance.now() - startTime;
            const errorMessage = e.message || "Errore sconosciuto";
            
            addLog(`❌ Errore ${stepName}: ${errorMessage}`);
            updateStepStatus(stepName, 'error', 0, duration, errorMessage);
            throw e; 
        }
    };

    const resetRunner = (initialSteps: StepReport[]) => {
        setStepReports(initialSteps); 
        setProcessLog([]);
        logsAccumulator.current = [];
        setIsProcessing(true);
        setIsRecovered(false); // Reset recovery flag on new run
        saveSession([], initialSteps, true); // Init storage
    };

    const stopRunner = () => {
        setIsProcessing(false);
        // NON cancelliamo la sessione qui, lasciamo che l'utente la veda.
        // Aggiorniamo solo lo stato processing a false nel DB
        saveSession(logsAccumulator.current, stepReports, false);
    };
    
    const getAccumulatedLogs = () => logsAccumulator.current;

    return {
        processLog,
        stepReports,
        isProcessing,
        isRecovered, // EXPORTED
        addLog,
        performStep,
        resetRunner,
        stopRunner,
        clearSession, // EXPORTED
        getAccumulatedLogs
    };
};
