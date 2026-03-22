import React from 'react';

interface ExportLogoProps {
    width?: number | string;
    height?: number | string;
}

/**
 * Logo SVG statico utilizzato negli export PDF/DOCX.
 * È progettato per essere rasterizzato senza problemi di layout e per
 * essere visivamente identico al logo del sito.
 */
export const ExportLogo: React.FC<ExportLogoProps> = ({ width = 360, height = 52 }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 360 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Definizioni SVG estratte da MascotSvg.tsx per fedeltà visiva */}
            <defs>
                <radialGradient id="globeGrad_export" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="50%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#172554" />
                </radialGradient>
                <linearGradient id="cometTrail_export" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                    <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
                <clipPath id="globeMaskCircle_export">
                    <circle cx="25" cy="25" r="21" />
                </clipPath>
            </defs>

            {/* Mascotte (Icona Globo) - SVG statico da MascotSvg.tsx */}
            <g transform="translate(4, 4)">
                <circle cx="25" cy="25" r="21" fill="url(#globeGrad_export)" />
                <g clipPath="url(#globeMaskCircle_export)">
                    <g opacity="0.85">
                        <path d="M-5 10 L10 15 L20 25 L10 45 L5 35 L-5 20 Z" fill="#34d399" />
                        <path d="M15 50 L25 50 L30 65 L20 75 L10 60 Z" fill="#34d399" />
                        <path d="M55 10 L70 8 L75 15 L65 20 L55 15 Z" fill="#34d399" />
                    </g>
                    <path d="M25 7 C 5 7, 5 91, 25 91 M25 7 C 45 7, 45 91, 25 91" stroke="white" strokeWidth="0.5" opacity="0.15" fill="none"/>
                    <circle cx="25" cy="25" r="21" fill="url(#globeGrad_export)" fillOpacity="0.3" style={{ mixBlendMode: 'multiply' }}/>
                </g>
                <g transform="translate(25, 25) scale(0.55) rotate(-10)">
                    <g transform="rotate(-35)">
                        <path d="M -85 5 Q -50 0 -20 0" stroke="url(#cometTrail_export)" strokeWidth="6" strokeLinecap="round" fill="none"/>
                        <path d="M22 0 C 22 -2, 17 -3, 12 -3 L -12 -2 L -14 -9 L -17 -9 L -15 -2 L -20 -1 L -22 -4 L -24 -4 L -21 0 L -24 4 L -22 4 L -20 1 L -15 2 L -17 9 L -14 9 L -12 2 L 12 2 C 17 3, 22 2, 22 0 Z" fill="white" stroke="#94a3b8" strokeWidth="1.2" />
                    </g>
                </g>
            </g>

            {/* TOURING */}
            <text
                x="65"
                y="38"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontSize="29"
                fontWeight="800"
                fill="#000000"
                letterSpacing="-1.2"
            >
                TOURING
            </text>

            {/* Diary - Stile corsivo applicato */}
            <text
                x="220"
                y="42"
                fontFamily="'Caveat', cursive"
                fontSize="34"
                fontWeight="700"
                fill="#F59E0B"
                fontStyle="italic"
            >
                Diary
            </text>
        </svg>
    );
};
