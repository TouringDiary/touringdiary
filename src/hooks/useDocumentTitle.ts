
import { useEffect } from 'react';

/**
 * Hook per aggiornare dinamicamente il titolo della pagina nel browser.
 * Aggiunge automaticamente il brand " - Touring Diary" se non specificato diversamente.
 * 
 * @param title Il titolo principale della vista (es. "Napoli", "Home")
 * @param overrideFullTitle Se true, sostituisce completamente il titolo ignorando il brand
 */
export const useDocumentTitle = (title: string, overrideFullTitle: boolean = false) => {
    useEffect(() => {
        const prevTitle = document.title;
        const brandSuffix = ' - Touring Diary';
        
        // Costruisce il nuovo titolo
        const newTitle = overrideFullTitle 
            ? title 
            : `${title}${brandSuffix}`;

        document.title = newTitle;

        // Cleanup opzionale: potremmo ripristinare il titolo precedente all'unmount,
        // ma in una SPA è meglio lasciare l'ultimo titolo attivo finché la nuova pagina non lo sovrascrive
        // per evitare flickering "Touring Diary" -> "Napoli".
        
        // return () => { document.title = prevTitle; };
    }, [title, overrideFullTitle]);
};
