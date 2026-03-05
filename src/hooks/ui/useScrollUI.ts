
import React, { useState, useRef } from 'react';

export const useScrollUI = () => {
    const [isUiVisible, setIsUiVisible] = useState(true);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentY = e.currentTarget.scrollTop;
        
        if (!ticking.current) {
            // Throttling aggressivo (100ms) per non intasare il main thread
            window.setTimeout(() => {
                window.requestAnimationFrame(() => {
                    updateUiVisibility(currentY);
                    ticking.current = false;
                });
            }, 100);
            ticking.current = true;
        }
    };

    const updateUiVisibility = (currentY: number) => {
        // Ignora scroll "elastico" negativo (iOS)
        if (currentY < 0) return;

        const SAFE_ZONE_TOP = 100;
        
        // Se siamo in cima, mostra sempre tutto
        if (currentY < SAFE_ZONE_TOP) {
            if (!isUiVisible) setIsUiVisible(true);
            lastScrollY.current = currentY;
            return;
        }

        const diff = currentY - lastScrollY.current;
        const DELTA_DOWN = 50; // Scroll down necessario per nascondere
        const DELTA_UP = 30;   // Scroll up necessario per mostrare

        if (diff > DELTA_DOWN) {
            if (isUiVisible) setIsUiVisible(false);
        } else if (diff < -DELTA_UP) {
            if (!isUiVisible) setIsUiVisible(true);
        }
        
        lastScrollY.current = currentY;
    };

    return {
        isUiVisible,
        setIsUiVisible, // Esposto per override manuali (es. click su FAB)
        handleMainScroll
    };
};
