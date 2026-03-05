
import React, { useState, useEffect, useMemo } from 'react';

interface UseVirtualWindowProps {
    containerRef: React.RefObject<HTMLElement>;
    totalItems: number;
    itemHeight: number;
    overscan?: number; // Numero di elementi buffer extra
}

export const useVirtualWindow = ({ containerRef, totalItems, itemHeight, overscan = 5 }: UseVirtualWindowProps) => {
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const handleScroll = () => {
            requestAnimationFrame(() => {
                setScrollTop(element.scrollTop);
            });
        };

        const handleResize = () => {
            setContainerHeight(element.clientHeight);
        };

        // Inizializzazione
        handleResize();

        element.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);

        return () => {
            element.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [containerRef]);

    const { startIndex, endIndex, totalListHeight, paddingTop, paddingBottom } = useMemo(() => {
        const totalListHeight = totalItems * itemHeight;

        // Calcolo indici visibili
        let start = Math.floor(scrollTop / itemHeight);
        let end = Math.ceil((scrollTop + containerHeight) / itemHeight);

        // Aggiunta Buffer (Overscan)
        start = Math.max(0, start - overscan);
        end = Math.min(totalItems, end + overscan);

        const paddingTop = start * itemHeight;
        const paddingBottom = Math.max(0, totalListHeight - (end * itemHeight));

        return {
            startIndex: start,
            endIndex: end,
            totalListHeight,
            paddingTop,
            paddingBottom
        };
    }, [scrollTop, containerHeight, totalItems, itemHeight, overscan]);

    return {
        startIndex,
        endIndex,
        paddingTop,
        paddingBottom,
        totalListHeight
    };
};
