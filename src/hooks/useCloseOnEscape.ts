import { useEffect, useRef } from 'react';

/**
 * Registry statico condiviso tra tutte le istanze dell'hook.
 * Gestisce l'ordine di apertura dei modali (LIFO).
 */
const escapeStack: (() => void)[] = [];

/**
 * Hook per la gestione centralizzata della chiusura tramite tasto ESC.
 * Implementa logica di stacking (solo l'ultimo layer aperto risponde a ESC).
 */
export const useCloseOnEscape = (onClose: () => void, enabled: boolean = true) => {
    const onCloseRef = useRef(onClose);
    
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!enabled) return;

        // Registriamo la callback corrente nello stack globale
        const currentCallback = () => onCloseRef.current();
        escapeStack.push(currentCallback);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // Verifichiamo se questa istanza è quella in cima allo stack (l'ultima aperta)
                if (escapeStack[escapeStack.length - 1] !== currentCallback) {
                    return;
                }

                // Se l'evento è già stato prevenuto da logiche interne (es. input focus gestito dal browser)
                if (e.defaultPrevented) return;

                // Identifichiamo il target dell'evento per proteggere input/textarea
                const target = e.target as HTMLElement;
                const isInput = target.tagName === 'INPUT' || 
                               target.tagName === 'TEXTAREA' || 
                               target.isContentEditable;

                if (isInput) return;

                // Blocchiamo la propagazione verso layer sottostanti o altri listener
                e.preventDefault();
                e.stopPropagation();
                
                // Eseguiamo la chiusura
                currentCallback();
            }
        };

        // Usa capture: true per intercettare l'evento prima che lo facciano i listener standard del DOM
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            // Rimuoviamo la callback dallo stack quando il componente smonta o viene disabilitato
            const index = escapeStack.indexOf(currentCallback);
            if (index !== -1) {
                escapeStack.splice(index, 1);
            }
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [enabled]);
};
