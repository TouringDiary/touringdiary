import { createElement, useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExportLogo } from '@/components/export/ExportLogo';

/**
 * Rasterizza `ExportLogo` su canvas e restituisce PNG base64 per export PDF/DOCX.
 */
export const useLogoRasterizer = () => {
    const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);

    useEffect(() => {
        const svgString = renderToStaticMarkup(createElement(ExportLogo));
        const img = new Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 360 * 2;
            canvas.height = 52 * 2;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error(
                    "Errore: Impossibile ottenere il contesto 2D del canvas per la rasterizzazione del logo.",
                );
                return;
            }
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setLogoBase64(canvas.toDataURL('image/png'));
        };

        img.onerror = () => {
            console.error(
                "Errore: Impossibile caricare l'immagine SVG del logo per la rasterizzazione.",
                { svgLength: svgString.length },
            );
        };
    }, []);

    return logoBase64;
};
