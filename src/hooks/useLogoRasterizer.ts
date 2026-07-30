import { createElement, useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    ExportLogo,
    EXPORT_LOGO_ICON_VIEWBOX_HEIGHT,
    EXPORT_LOGO_ICON_VIEWBOX_WIDTH,
    EXPORT_LOGO_VIEWBOX_HEIGHT,
    EXPORT_LOGO_VIEWBOX_WIDTH,
} from '@/components/export/ExportLogo';

/** Densità bitmap = 2× le dimensioni del viewBox logo completo (proporzioni invariate). */
const SCALE = 2;

/**
 * Rasterizza il logo ufficiale su canvas (mascotte SVG + testo con font Home)
 * e restituisce PNG base64 per export PDF/DOCX / anteprima.
 *
 * Causa storica del globo “schiacciato”: `iconOnly` veniva rasterizzato con
 * width/height del logo completo (400×56) su viewBox icona (58×52). Con
 * preserveAspectRatio=meet il globo risultava piccolo e centrato in un bitmap
 * largo; `drawImage` su destinazione quadrata lo comprimeva in una linea verticale.
 * Qui width/height dell’icona coincidono col viewBox, e il draw rispetta l’aspect ratio.
 */
export const useLogoRasterizer = () => {
    const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                if (typeof document !== 'undefined' && document.fonts?.ready) {
                    await document.fonts.ready;
                    await Promise.all([
                        document.fonts.load('900 31px "Playfair Display"'),
                        document.fonts.load('700 36px Caveat'),
                    ]);
                }

                const iconSvg = renderToStaticMarkup(
                    createElement(ExportLogo, {
                        iconOnly: true,
                        width: EXPORT_LOGO_ICON_VIEWBOX_WIDTH,
                        height: EXPORT_LOGO_ICON_VIEWBOX_HEIGHT,
                    }),
                );
                const img = new Image();
                img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSvg)}`;

                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () =>
                        reject(new Error('Impossibile caricare l\'icona SVG del logo per la rasterizzazione.'));
                });

                if (cancelled) return;

                const canvas = document.createElement('canvas');
                canvas.width = EXPORT_LOGO_VIEWBOX_WIDTH * SCALE;
                canvas.height = EXPORT_LOGO_VIEWBOX_HEIGHT * SCALE;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error(
                        'Errore: Impossibile ottenere il contesto 2D del canvas per la rasterizzazione del logo.',
                    );
                    return;
                }

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Icona: stesse proporzioni del viewBox (nessuno stretch).
                const iconNaturalW = img.naturalWidth || EXPORT_LOGO_ICON_VIEWBOX_WIDTH;
                const iconNaturalH = img.naturalHeight || EXPORT_LOGO_ICON_VIEWBOX_HEIGHT;
                const iconAspect = iconNaturalW / iconNaturalH;
                const iconDrawH = EXPORT_LOGO_ICON_VIEWBOX_HEIGHT * SCALE;
                const iconDrawW = iconDrawH * iconAspect;
                const iconX = 4 * SCALE;
                const iconY = ((EXPORT_LOGO_VIEWBOX_HEIGHT * SCALE) - iconDrawH) / 2;
                ctx.drawImage(img, iconX, iconY, iconDrawW, iconDrawH);

                // TOURING — Playfair Display (Home); baseline allineata al layout SVG (y≈40).
                const textX = iconX + iconDrawW + 8 * SCALE;
                const touringY = 40 * SCALE;
                ctx.fillStyle = '#0f172a';
                ctx.font = `900 ${31 * SCALE}px "Playfair Display", Georgia, serif`;
                ctx.textBaseline = 'alphabetic';
                ctx.fillText('TOURING', textX, touringY);

                const touringWidth = ctx.measureText('TOURING').width;
                const wordGap = 8 * SCALE;

                // Diary — Caveat corsivo arancione (baseline SVG y≈44).
                ctx.fillStyle = '#F59E0B';
                ctx.font = `italic 700 ${36 * SCALE}px Caveat, cursive`;
                ctx.fillText('Diary', textX + touringWidth + wordGap, 44 * SCALE);

                if (!cancelled) {
                    setLogoBase64(canvas.toDataURL('image/png'));
                }
            } catch (err) {
                console.error('Errore rasterizzazione logo export:', err);
                // Fallback: SVG completo (stesso viewBox del canvas → proporzioni corrette).
                try {
                    const svgString = renderToStaticMarkup(
                        createElement(ExportLogo, {
                            width: EXPORT_LOGO_VIEWBOX_WIDTH,
                            height: EXPORT_LOGO_VIEWBOX_HEIGHT,
                        }),
                    );
                    const img = new Image();
                    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
                    img.onload = () => {
                        if (cancelled) return;
                        const canvas = document.createElement('canvas');
                        canvas.width = EXPORT_LOGO_VIEWBOX_WIDTH * SCALE;
                        canvas.height = EXPORT_LOGO_VIEWBOX_HEIGHT * SCALE;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        setLogoBase64(canvas.toDataURL('image/png'));
                    };
                } catch {
                    /* ignore */
                }
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, []);

    return logoBase64;
};
