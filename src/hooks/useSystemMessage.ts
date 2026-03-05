
import { useState, useEffect } from 'react';
import { getSystemMessagesAsync, SystemMessageTemplate } from '../services/communicationService';

// Cache in memoria per evitare chiamate continue al DB
let messagesCache: SystemMessageTemplate[] = [];

export const useSystemMessage = (key: string) => {
    const [template, setTemplate] = useState<SystemMessageTemplate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
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
        if (!template) return { title: '', body: '' };
        
        let title = template.titleTemplate || '';
        let body = template.bodyTemplate || '';

        Object.entries(variables).forEach(([varKey, varValue]) => {
            const regex = new RegExp(`{${varKey}}`, 'g'); // Replace {name} globally
            title = title.replace(regex, String(varValue));
            body = body.replace(regex, String(varValue));
        });

        return { title, body };
    };

    return { 
        template, 
        loading, 
        // Helper per ottenere subito testo formattato
        getText: (variables: Record<string, string | number> = {}) => formatMessage(variables) 
    };
};
