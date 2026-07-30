import { useState, useEffect, useMemo, type RefObject } from 'react';

interface UseVirtualWindowProps {
    containerRef: RefObject<HTMLElement | null>;
    totalItems: number;
    itemHeight: number;
    overscan?: number;
}

export const useVirtualWindow = ({
    containerRef,
    totalItems,
    itemHeight,
    overscan = 5,
}: UseVirtualWindowProps) => {
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        let scrollRafId = 0;

        const handleScroll = () => {
            cancelAnimationFrame(scrollRafId);
            scrollRafId = requestAnimationFrame(() => {
                setScrollTop(element.scrollTop);
            });
        };

        const updateHeight = () => {
            setContainerHeight(element.clientHeight);
        };

        updateHeight();
        setScrollTop(element.scrollTop);
        element.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', updateHeight);

        const resizeObserver = new ResizeObserver(() => {
            updateHeight();
        });
        resizeObserver.observe(element);

        return () => {
            cancelAnimationFrame(scrollRafId);
            element.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', updateHeight);
            resizeObserver.disconnect();
        };
        // totalItems: re-bind when the scroll container mounts/unmounts with virtualization
    }, [containerRef, totalItems]);

    const { startIndex, endIndex, totalListHeight, paddingTop, paddingBottom } = useMemo(() => {
        const height = totalItems * itemHeight;
        let start = Math.floor(scrollTop / itemHeight);
        let end = Math.ceil((scrollTop + containerHeight) / itemHeight);
        start = Math.max(0, start - overscan);
        end = Math.min(totalItems, end + overscan);
        return {
            startIndex: start,
            endIndex: end,
            totalListHeight: height,
            paddingTop: start * itemHeight,
            paddingBottom: Math.max(0, height - end * itemHeight),
        };
    }, [scrollTop, containerHeight, totalItems, itemHeight, overscan]);

    return { startIndex, endIndex, paddingTop, paddingBottom, totalListHeight };
};
