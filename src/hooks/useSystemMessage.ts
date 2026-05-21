
import { useState, useEffect } from 'react';
import { getSystemMessagesAsync, SystemMessageTemplate } from '../services/communicationService';

// Cache in memoria per evitare chiamate continue al DB
let messagesCache: SystemMessageTemplate[] = [];

export const useSystemMessage = (key: string) => {
    const [template, setTemplate] = useState<SystemMessageTemplate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            console.log("[SystemMessages] called from: useSystemMessage.ts (key:", key, ")");
            if (messagesCache.length === 0) {
                messagesCache = await getSystemMessagesAsync();
            }
            const found = messagesCache.find(m => m.key === key);
            setTemplate(found || null);
            setLoading(false);
        };
        load();
    }, [key]);

    const formatMessage = (variables: Record<string, string | number>) => {
        if (!template) return { title: '', body: '', confirmLabel: undefined, cancelLabel: undefined };
        
        let title = template.titleTemplate || '';
        let body = template.bodyTemplate || '';

        // Parsing ui_config if it's a string (fallback for unparsed DB data)
        let uiConfig = template.uiConfig;
        if (typeof uiConfig === 'string') {
            try {
                uiConfig = JSON.parse(uiConfig);
            } catch (e) {
                uiConfig = {};
            }
        }

        let confirmLabel = uiConfig?.confirmLabel;
        let cancelLabel = uiConfig?.cancelLabel;

        Object.entries(variables).forEach(([varKey, varValue]) => {
            // Supporta sia {var} che {{var}}
            const regex = new RegExp(`{{?${varKey}}}?`, 'g'); 
            const valStr = varValue !== null && varValue !== undefined ? String(varValue) : '';
            title = title.replace(regex, valStr);
            body = body.replace(regex, valStr);
            if (confirmLabel) confirmLabel = confirmLabel.replace(regex, valStr);
            if (cancelLabel) cancelLabel = cancelLabel.replace(regex, valStr);
        });

        return { title, body, confirmLabel, cancelLabel };
    };

    return { 
        template, 
        loading, 
        // Helper per ottenere subito testo formattato
        getText: (variables: Record<string, string | number> = {}): { title: string, body: string, confirmLabel?: string, cancelLabel?: string } => formatMessage(variables) 
    };
};
