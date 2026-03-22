
import { useState, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExportLogo } from '../components/export/ExportLogo';

/**
 * Hook che renderizza il componente `ExportLogo` in una stringa SVG,
 * lo disegna su un canvas e lo converte in un'immagine PNG Base64.
 * Questo assicura un logo consistente e di alta qualità per tutti gli export.
 */
export const useLogoRasterizer = () => {
    const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);

    useEffect(() => {
        // 1. Renderizza il componente React ExportLogo in una stringa SVG statica.
        // Questo assicura che usiamo sempre il componente corretto e aggiornato.
        const svgString = renderToStaticMarkup(
            ExportLogo({ width: 360, height: 52 })
        );

        // 2. Crea un'immagine dall'SVG per disegnarla sul canvas.
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

        // 3. Quando l'immagine SVG è caricata, la disegna sul canvas.
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Usiamo le dimensioni del logo, con un moltiplicatore 2x per una qualità superiore (retina).
            canvas.width = 360 * 2;
            canvas.height = 52 * 2;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // 4. Converte il contenuto del canvas in un'immagine PNG Base64.
                setLogoBase64(canvas.toDataURL('image/png'));
            }
        };

        // Gestione di eventuali errori nel caricamento dell'immagine SVG
        img.onerror = () => {
            console.error("Errore: Impossibile caricare l'immagine SVG del logo per la rasterizzazione.");
        };
    }, []);

    return logoBase64;
};
