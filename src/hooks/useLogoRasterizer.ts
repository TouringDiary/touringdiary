import { useState, useEffect } from 'react';

export const useLogoRasterizer = () => {
    const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);

    useEffect(() => {
        // SVG OTTIMIZZATO CON CLIPPATH (Testo scuro per sfondo bianco)
        const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="150" viewBox="0 0 600 150">
            <defs>
                <linearGradient id="cometTrail" x1="1" y1="0" x2="0" y2="0">
                     <stop offset="0%" stop-color="#f59e0b" stop-opacity="0" />
                     <stop offset="50%" stop-color="#fbbf24" stop-opacity="0.8" />
                     <stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
                </linearGradient>
                <radialGradient id="globeGrad" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#60a5fa" />
                    <stop offset="50%" stop-color="#2563eb" />
                    <stop offset="100%" stop-color="#172554" />
                </radialGradient>
                <clipPath id="globeMask">
                    <circle cx="60" cy="60" r="42" />
                </clipPath>
            </defs>
            
            <!-- GRUPPO ICONA -->
            <g transform="translate(20, 10) scale(1.2)">
                <!-- Globo Sfondo -->
                <circle cx="60" cy="60" r="42" fill="url(#globeGrad)" />
                
                <!-- Continenti (Clippati) -->
                <g clip-path="url(#globeMask)">
                    <path d="M60 18 C 40 18, 40 102, 60 102 M60 18 C 80 18, 80 102, 60 102" stroke="white" stroke-width="0.5" opacity="0.3" fill="none"/>
                    <path d="M30 60 L40 60 L45 75 L35 85 L25 70 Z" fill="#34d399" opacity="0.9" />
                    <path d="M70 20 L85 18 L90 25 L80 30 L70 25 Z" fill="#34d399" opacity="0.9" />
                    <path d="M100 15 L140 15 L150 40 L130 55 L110 45 L105 30 Z" fill="#34d399" opacity="0.9" />
                    <path d="M10 40 L-10 60 L10 80 Z" fill="#34d399" opacity="0.9" />
                </g>
                
                <!-- Ombra Vetro -->
                <circle cx="60" cy="60" r="42" fill="url(#globeGrad)" fill-opacity="0.2" style="mix-blend-mode: multiply"/>

                <!-- Aereo + Scia -->
                <g transform="translate(60, 60) rotate(-35)">
                    <path d="M -85 5 Q -50 0 -20 0" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.8"/>
                    <path d="M22 0 C 22 -2, 17 -3, 12 -3 L -12 -2 L -14 -9 L -17 -9 L -15 -2 L -20 -1 L -22 -4 L -24 -4 L -21 0 L -24 4 L -22 4 L -20 1 L -15 2 L -17 9 L -14 9 L -12 2 L 12 2 C 17 3, 22 2, 22 0 Z" fill="white" stroke="#94a3b8" stroke-width="0.8" />
                </g>
            </g>

            <!-- TESTO -->
            <text x="170" y="90" font-size="70" font-family="Arial Black, Helvetica, sans-serif" font-weight="900" fill="#1e293b" letter-spacing="2">TOURING</text>
            <text x="500" y="90" font-size="70" font-family="Georgia, serif" font-weight="bold" fill="#d97706" font-style="italic">Diary</text>
        </svg>`;
        
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1200; 
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setLogoBase64(canvas.toDataURL('image/png'));
            }
        };
    }, []);

    return logoBase64;
};
