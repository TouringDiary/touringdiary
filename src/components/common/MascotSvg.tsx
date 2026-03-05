
import React from 'react';

interface MascotSvgProps {
    className?: string;
}

export const MascotSvg = ({ className = "w-full h-full" }: MascotSvgProps) => {
    return (
        <div className={`relative ${className}`}>
            <style>{`
                /* TIMING GLOBALE: 20s */
                
                /* MAPPAMONDO */
                @keyframes mapSmoothRide {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-415px); } 
                }

                /* AEREO */
                @keyframes planeFrontSoft {
                    0% { transform: translate(-60px, 50px) scale(0.6); opacity: 0; }
                    5% { opacity: 1; transform: translate(-50px, 40px) scale(0.7); } 
                    12% { transform: translate(0px, 0px) scale(1.05); } 
                    18% { transform: translate(50px, -40px) scale(0.7); opacity: 1; } 
                    18.1% { opacity: 0; } 
                    35% { transform: translate(-60px, 50px) scale(0.6); opacity: 0; }
                    35.1% { opacity: 1; } 
                    42% { transform: translate(0px, 0px) scale(1.05); }
                    49% { transform: translate(50px, -40px) scale(0.7); opacity: 1; }
                    49.1% { opacity: 0; } 
                    70% { transform: translate(-60px, 50px) scale(0.6); opacity: 0; }
                    70.1% { opacity: 1; } 
                    85% { transform: translate(-10px, 10px) scale(0.95); } 
                    100% { transform: translate(35px, -35px) scale(0.9); opacity: 1; } 
                }

                @keyframes planeBackSoft {
                    0% { opacity: 0; }
                    18.1% { opacity: 0; transform: translate(50px, -40px) scale(0.7); }
                    18.2% { opacity: 0.6; }
                    26% { transform: translate(0,0) scale(0.4); }
                    35% { transform: translate(-60px, 50px) scale(0.6); opacity: 0.6; }
                    35.1% { opacity: 0; }
                    49.1% { opacity: 0; transform: translate(50px, -40px) scale(0.7); }
                    49.2% { opacity: 0.6; }
                    60% { transform: translate(0,0) scale(0.4); }
                    70% { transform: translate(-60px, 50px) scale(0.6); opacity: 0.6; }
                    70.1% { opacity: 0; }
                    100% { opacity: 0; }
                }

                /* PULSAZIONE SCIA - ENGINE EFFECT */
                @keyframes enginePulse {
                    0%, 100% { stroke-opacity: 1; stroke-width: 4; }
                    50% { stroke-opacity: 0.7; stroke-width: 3.5; }
                }

                .animate-map-soft { 
                    animation: mapSmoothRide 20s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards; 
                }
                .animate-plane-front-soft { 
                    animation: planeFrontSoft 20s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards; 
                }
                .animate-plane-back-soft { 
                    animation: planeBackSoft 20s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards; 
                }
                .trail-glow {
                    animation: enginePulse 0.3s infinite; /* Pulsazione velocissima come un motore */
                    filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.8)); /* Glow Dorato */
                }
            `}</style>

            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
                <defs>
                    <radialGradient id="globeGrad" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="50%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#172554" />
                    </radialGradient>
                    
                    {/* GRADIENTE SCIA "COMETA" */}
                    <linearGradient id="cometTrail" x1="1" y1="0" x2="0" y2="0">
                         <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                         <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
                         <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                    </linearGradient>

                    <clipPath id="globeMaskCircle">
                        <circle cx="60" cy="60" r="42" />
                    </clipPath>

                    {/* ASSET AEREO + SCIA INTEGRATA */}
                    <g id="planeAsset">
                         <g transform="rotate(-35)">
                            <path 
                                className="trail-glow"
                                d="M -85 5 Q -50 0 -20 0" 
                                stroke="url(#cometTrail)" 
                                strokeWidth="4" 
                                strokeLinecap="round"
                                fill="none"
                            />
                            <path d="M22 0 C 22 -2, 17 -3, 12 -3 L -12 -2 L -14 -9 L -17 -9 L -15 -2 L -20 -1 L -22 -4 L -24 -4 L -21 0 L -24 4 L -22 4 L -20 1 L -15 2 L -17 9 L -14 9 L -12 2 L 12 2 C 17 3, 22 2, 22 0 Z" fill="white" stroke="#94a3b8" strokeWidth="0.8" />
                            <ellipse cx="-2" cy="5" rx="3" ry="1.5" fill="#64748b" />
                            <ellipse cx="-2" cy="-5" rx="3" ry="1.5" fill="#64748b" />
                         </g>
                    </g>

                    {/* MAPPA CONTINUA */}
                    <g id="continentsStrip">
                        <path d="M10 20 L25 25 L35 35 L25 55 L20 45 L10 30 Z" fill="#34d399" />
                        <path d="M30 60 L40 60 L45 75 L35 85 L25 70 Z" fill="#34d399" />
                        <path d="M70 20 L85 18 L90 25 L80 30 L70 25 Z" fill="#34d399" />
                        <path d="M70 35 L90 35 L95 60 L80 75 L65 55 Z" fill="#34d399" />
                        <path d="M100 15 L140 15 L150 40 L130 55 L110 45 L105 30 Z" fill="#34d399" />
                        <path d="M140 65 L160 65 L165 80 L145 80 Z" fill="#34d399" />
                    </g>
                </defs>

                {/* OMBRA ALLA BASE */}
                <ellipse cx="60" cy="108" rx="26" ry="4" fill="black" fillOpacity="0.5" filter="blur(3px)"/>

                {/* LAYER 1: Aereo Dietro */}
                <g transform="translate(60, 60)">
                     <g className="animate-plane-back-soft">
                        <use href="#planeAsset" fill="#64748b" opacity="0.6" />
                     </g>
                </g>

                {/* LAYER 2: Globo */}
                <circle cx="60" cy="60" r="42" fill="url(#globeGrad)" />
                
                {/* Continenti Animati */}
                <g clipPath="url(#globeMaskCircle)">
                    <g className="animate-map-soft">
                        <use href="#continentsStrip" opacity="0.85" />
                        <g transform="translate(200, 0)"><use href="#continentsStrip" opacity="0.85" /></g>
                        <g transform="translate(400, 0)"><use href="#continentsStrip" opacity="0.85" /></g>
                    </g>
                    <path d="M60 18 C 40 18, 40 102, 60 102 M60 18 C 80 18, 80 102, 60 102 M18 60 C 18 45, 102 45, 102 60 M18 60 C 18 75, 102 75, 102 60" stroke="white" strokeWidth="0.5" opacity="0.15" fill="none"/>
                    <circle cx="60" cy="60" r="42" fill="url(#globeGrad)" fillOpacity="0.3" style={{ mixBlendMode: 'multiply' }}/>
                </g>
                
                {/* Riflesso Lente */}
                <path d="M35 35 Q 60 20 85 35" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.15" fill="none" />
                <circle cx="60" cy="60" r="42" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.4" fill="none"/>

                {/* LAYER 3: Aereo Davanti */}
                <g transform="translate(60, 60)">
                     <g className="animate-plane-front-soft">
                        <use href="#planeAsset" />
                     </g>
                </g>
            </svg>
        </div>
    );
};
