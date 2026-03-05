
import React from 'react';
import { useDynamicContent } from '../../hooks/useDynamicContent';
import { MascotSvg } from './MascotSvg';

interface BrandLogoProps {
    className?: string;
    showText?: boolean;
    variant?: 'light' | 'dark';
}

export const BrandLogo = ({ className = "h-12", showText = true, variant = 'light' }: BrandLogoProps) => {
    // --- RECUPERO CONFIGURAZIONE DAL DB (Admin -> Design System) ---
    const logoMainDesktop = useDynamicContent('header_logo');
    const logoAccentDesktop = useDynamicContent('header_logo_accent');
    const logoMainMobile = useDynamicContent('header_logo', true); 
    const logoAccentMobile = useDynamicContent('header_logo_accent', true);

    const subColor = variant === 'light' ? 'text-amber-500' : 'text-amber-600';

    return (
        <div className={`flex items-center gap-3 select-none ${className}`}>
            <MascotSvg className="h-full w-auto drop-shadow-2xl filter overflow-visible shrink-0" />

            {/* TESTO DINAMICO */}
            {showText && (
                <>
                    <div className="flex flex-col md:hidden leading-tight">
                        <span className={`${logoMainMobile.style} drop-shadow-md`}>
                            {logoMainMobile.text || 'TOURING'}
                        </span>
                        <span className={`${logoAccentMobile.style} ${subColor}`}>
                            {logoAccentMobile.text || 'DIARY'}
                        </span>
                    </div>
                    <div className="hidden md:flex md:flex-row md:items-baseline md:gap-1.5">
                        <span className={`${logoMainDesktop.style} drop-shadow-md`}>
                            {logoMainDesktop.text || 'TOURING'}
                        </span>
                        <span className={`${logoAccentDesktop.style} ${subColor} transform md:-translate-y-0.5`}>
                            {logoAccentDesktop.text || 'DIARY'}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};
