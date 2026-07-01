
import { supabase } from './supabaseClient';
import { DatabaseCommunicationLog, DatabaseSystemMessage } from '../types/database';

export interface AdminMessageLog {
    id: string;
    date: string;
    sender: string; 
    targetGroup: string; 
    subject: string;
    body: string;
    status: 'sent' | 'scheduled' | 'failed';
    type: 'email' | 'notification' | 'system_alert';
}

export type BubbleArrowDirection = 
    | 'top' | 'top-start' | 'top-end'
    | 'bottom' | 'bottom-start' | 'bottom-end'
    | 'left' | 'left-start' | 'left-end'
    | 'right' | 'right-start' | 'right-end';

export interface PositionConfig {
    mascot: { x: number, y: number };
    bubble: { x: number, y: number };
    arrowDirection: BubbleArrowDirection;
    targetBox?: {
        x: number;
        y: number;
        w: number;
        h: number;
        active: boolean;
    };
    targetId?: string; // HTML ID for scrolling
}

// Interfaccia unificata per la configurazione UI
export interface UiConfig {
    desktop?: PositionConfig;
    mobile?: PositionConfig;
    confirmLabel?: string;
    cancelLabel?: string;
    // Legacy support (opzionale, mantenuto per compatibilità)
    mascot?: { x: number, y: number };
    bubble?: { x: number, y: number };
    arrowDirection?: BubbleArrowDirection;
}

export interface SystemMessageTemplate {
    key: string;
    type: 'internal' | 'external' | 'onboarding';
    label: string;
    titleTemplate?: string;
    bodyTemplate: string;
    variables?: string[];
    uiConfig?: UiConfig;
    deviceTarget?: 'all' | 'desktop' | 'mobile'; 
}

// --- LOGS ---

export const getCommunicationLogsAsync = async (): Promise<AdminMessageLog[]> => {
    try {
        const { data, error } = await supabase
            .from('communication_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data as DatabaseCommunicationLog[]).map(log => ({
            id: log.id,
            date: log.created_at,
            sender: log.sender,
            targetGroup: log.target_group,
            subject: log.subject,
            body: log.body,
            status: log.status as 'sent' | 'scheduled' | 'failed',
            type: log.type as 'email' | 'notification' | 'system_alert'
        }));
    } catch (e) {
        console.error("Fetch comms logs failed", e);
        return [];
    }
};

export const logCommunicationAsync = async (logData: Omit<AdminMessageLog, 'id' | 'date'>): Promise<void> => {
    try {
        const payload = {
            sender: logData.sender,
            target_group: logData.targetGroup,
            subject: logData.subject,
            body: logData.body,
            status: logData.status,
            type: logData.type,
            created_at: new Date().toISOString()
        };

        await supabase.from('communication_logs').insert(payload);
    } catch (e) {
        console.error("Log comms failed", e);
    }
};

// --- TEMPLATES ---

let systemMessagesCache: SystemMessageTemplate[] | null = null;
let pendingMessagesPromise: Promise<SystemMessageTemplate[]> | null = null;

/**
 * Evento globale emesso quando la cache dei system messages viene invalidata
 * (dopo un salvataggio o una cancellazione). I consumatori già montati
 * (es. useSystemMessage) lo ascoltano per ri-leggere i template aggiornati
 * senza attendere un refresh completo della pagina.
 */
export const SYSTEM_MESSAGES_UPDATED_EVENT = 'system-messages-updated';

const invalidateSystemMessagesCache = (): void => {
    systemMessagesCache = null;
    pendingMessagesPromise = null;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(SYSTEM_MESSAGES_UPDATED_EVENT));
    }
};

export const getSystemMessagesAsync = async (): Promise<SystemMessageTemplate[]> => {
    // 1. Se abbiamo il dato in cache, lo restituiamo subito
    if (systemMessagesCache) return systemMessagesCache;

    // 2. Se c'è già una richiesta in corso, attendiamo quella
    if (pendingMessagesPromise) return pendingMessagesPromise;

    // 3. Altrimenti creiamo una nuova promise (Singleton Promise Pattern)
    pendingMessagesPromise = (async () => {
        try {
            // Tenta tramite API locale
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bootstrap/messages`);
                if (response.ok) {
                    const apiRes = await response.json();
                    if (apiRes.success && apiRes.data) {
                        console.log("[CommunicationService] System messages caricati da API locale");
                        const result = (apiRes.data as any[]).map(msg => ({
                            key: msg.key,
                            type: msg.type as 'internal' | 'external' | 'onboarding',
                            label: msg.label,
                            titleTemplate: msg.title_template || undefined,
                            bodyTemplate: msg.body_template,
                            variables: msg.variables || undefined,
                            uiConfig: msg.ui_config as UiConfig || undefined,
                            deviceTarget: (msg.device_target as 'all'|'desktop'|'mobile') || 'all'
                        }));
                        systemMessagesCache = result;
                        return result;
                    }
                }
            } catch (apiError) {
                console.warn("[CommunicationService] API locale fallita, uso fallback Supabase", apiError);
            }

            // Fallback Supabase
            const { data, error } = await supabase
                .from('system_messages')
                .select('*')
                .order('label', { ascending: true });

            if (error) throw error;

            const result = (data as any[]).map(msg => ({
                key: msg.key,
                type: msg.type as 'internal' | 'external' | 'onboarding',
                label: msg.label,
                titleTemplate: msg.title_template || undefined,
                bodyTemplate: msg.body_template,
                variables: msg.variables || undefined,
                uiConfig: msg.ui_config as UiConfig || undefined,
                deviceTarget: (msg.device_target as 'all'|'desktop'|'mobile') || 'all'
            }));
            
            systemMessagesCache = result;
            return result;
        } catch (e: any) {
            if (e?.message === 'TypeError: Failed to fetch' || e?.message?.includes('fetch')) {
                console.warn("System Messages offline: Database non raggiungibile. Uso fallback.");
            } else {
                console.error("Fetch system messages failed", e);
            }
            return [];
        } finally {
            // Una volta finito (bene o male), puliamo il riferimento alla promise pendente
            pendingMessagesPromise = null;
        }
    })();

    return pendingMessagesPromise;
};

export const saveSystemMessageAsync = async (msg: SystemMessageTemplate): Promise<boolean> => {
    try {
        const payload: any = {
            key: msg.key,
            type: msg.type,
            label: msg.label,
            title_template: msg.titleTemplate || null,
            body_template: msg.bodyTemplate,
            variables: msg.variables || null,
            ui_config: (msg.uiConfig as any) || null,
            device_target: msg.deviceTarget || 'all',
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('system_messages').upsert(payload);
        if (error) throw error;
        
        // Invalidazione Cache + notifica ai consumatori montati
        invalidateSystemMessagesCache();
        
        return true;
    } catch (e) {
        console.error("Save system message failed", e);
        return false;
    }
};

export const deleteSystemMessageAsync = async (key: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from('system_messages').delete().eq('key', key);
        if (error) throw error;
        
        // Invalidazione Cache + notifica ai consumatori montati
        invalidateSystemMessagesCache();

        return true;
    } catch (e) {
        console.error("Delete system message failed", e);
        return false;
    }
};

export const getCommunicationLogs = (): AdminMessageLog[] => [];
export const logCommunication = (logData: Omit<AdminMessageLog, 'id' | 'date'>): void => { logCommunicationAsync(logData); };
