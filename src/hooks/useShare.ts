
import { useState } from 'react';
import { useSystemMessage } from './useSystemMessage';
import { useModal } from '@/context/ModalContext';

interface ShareConfig {
    title: string;
    text: string;
    params: Record<string, string>;
}

export const useShare = () => {
    // Recuperiamo il template globale per la condivisione (se esiste)
    const { getText } = useSystemMessage('social_share_global');
    const { openModal } = useModal();
    const [isSharing, setIsSharing] = useState(false);

    const share = async ({ title, text, params }: ShareConfig) => {
        setIsSharing(true);
        try {
            // 1. Costruzione URL Pulito
            // Usa window.location.origin per essere agnostici rispetto all'ambiente (dev/prod)
            const baseUrl = window.location.origin;
            const urlObj = new URL(baseUrl);
            
            // Aggiungi i parametri specifici (es. ?city=napoli&poi=123)
            Object.entries(params).forEach(([key, value]) => {
                if (value) urlObj.searchParams.set(key, value);
            });
            
            // Aggiungi parametro tracking referral (opzionale, statico per ora)
            urlObj.searchParams.set('utm_source', 'share_button');
            
            const finalUrl = urlObj.toString();

            // 2. Costruzione Messaggio
            // Se il template DB è pronto usa quello, altrimenti fallback
            const msgTemplate = getText({ title, text, url: finalUrl });
            
            const shareTitle = msgTemplate.title || `Scopri ${title}`;
            const shareBody = msgTemplate.body || `${text}\n\nGuarda qui: ${finalUrl}`;

            const shareData = {
                title: shareTitle,
                text: shareBody,
                url: finalUrl
            };

            // 3. Esecuzione Share
            if (navigator.share && navigator.canShare(shareData)) {
                // Mobile Nativo (WhatsApp, Telegram, ecc.)
                await navigator.share(shareData);
            } else {
                // Desktop Fallback -> Apri Modale Condivisione
                openModal('share', { 
                    title: shareTitle, 
                    text: text, // Passiamo il testo pulito per i bottoni social
                    url: finalUrl 
                });
            }
        } catch (error: any) {
            // Ignora errore "AbortError" (utente ha annullato la condivisione)
            if (error.name !== 'AbortError') {
                console.error("Errore condivisione:", error);
            }
        } finally {
            setIsSharing(false);
        }
    };

    return { share, isSharing };
};
