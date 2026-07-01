
import { useState, useEffect } from 'react';
import {
    getSystemMessagesAsync,
    SystemMessageTemplate,
    SYSTEM_MESSAGES_UPDATED_EVENT,
} from '../services/communicationService';

export const useSystemMessage = (key: string) => {
    const [template, setTemplate] = useState<SystemMessageTemplate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        // La cache in-memory (con invalidazione + singleton promise) vive in
        // communicationService: qui non manteniamo una copia locale, così dopo un
        // salvataggio nessun componente resta agganciato a un template obsoleto.
        const load = async () => {
            const messages = await getSystemMessagesAsync();
            if (cancelled) return;
            const found = messages.find(m => m.key === key);
            setTemplate(found || null);
            setLoading(false);
        };

        load();

        // Quando un template viene salvato/eliminato la cache del service viene
        // invalidata ed emette questo evento: ri-leggiamo i dati aggiornati.
        const handleUpdate = () => { load(); };
        window.addEventListener(SYSTEM_MESSAGES_UPDATED_EVENT, handleUpdate);

        return () => {
            cancelled = true;
            window.removeEventListener(SYSTEM_MESSAGES_UPDATED_EVENT, handleUpdate);
        };
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
