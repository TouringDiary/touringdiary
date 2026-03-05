
import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';

interface Props {
  children?: React.ReactNode;
  className?: string;
}

export interface DraggableSliderHandle {
    scroll: (direction: 'left' | 'right') => void;
}

export const DraggableSlider = forwardRef<DraggableSliderHandle, Props>(({ children, className = '' }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDown, setIsDown] = useState(false);
    
    // Refs for drag state
    const stateRef = useRef({ 
        isDown: false, 
        startX: 0, 
        startY: 0,
        scrollLeft: 0,
        isDragging: false
    });

    useImperativeHandle(ref, () => ({
        scroll: (direction: 'left' | 'right') => {
            if (scrollRef.current) {
                const scrollAmount = 400; 
                scrollRef.current.scrollBy({ 
                    left: direction === 'left' ? -scrollAmount : scrollAmount, 
                    behavior: 'smooth' 
                });
            }
        }
    }));

    // Cleanup listeners on unmount
    useEffect(() => {
        const handleUp = () => {
             if (stateRef.current.isDown) {
                 setIsDown(false);
                 stateRef.current.isDown = false;
             }
        };
        // Use window for mouseup to catch release outside component
        window.addEventListener('mouseup', handleUp);
        return () => window.removeEventListener('mouseup', handleUp);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDown(true);
        stateRef.current = {
            isDown: true,
            startX: e.pageX,
            startY: e.pageY,
            scrollLeft: scrollRef.current.scrollLeft,
            isDragging: false
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!stateRef.current.isDown || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX;
        const walk = (x - stateRef.current.startX) * 2; 
        scrollRef.current.scrollLeft = stateRef.current.scrollLeft - walk;
        stateRef.current.isDragging = true;
    };

    const handleMouseUp = () => {
        setIsDown(false);
        stateRef.current.isDown = false;
    };
    
    const handleMouseLeave = () => {
        if (stateRef.current.isDown) {
             setIsDown(false);
             stateRef.current.isDown = false;
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!scrollRef.current) return;
        const touch = e.touches[0];
        setIsDown(true);
        stateRef.current = {
            isDown: true,
            startX: touch.pageX,
            startY: touch.pageY,
            scrollLeft: scrollRef.current.scrollLeft,
            isDragging: false
        };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!scrollRef.current || !stateRef.current.isDown) return;
        
        const touch = e.touches[0];
        const x = touch.pageX;
        const y = touch.pageY;
        
        const walkX = x - stateRef.current.startX;
        const walkY = y - stateRef.current.startY;

        if (Math.abs(walkY) > Math.abs(walkX)) return;

        if (e.cancelable) e.preventDefault();
        
        scrollRef.current.scrollLeft = stateRef.current.scrollLeft - (walkX * 1.5);
        stateRef.current.isDragging = true;
    };

    const handleTouchEnd = () => {
        setIsDown(false);
        stateRef.current.isDown = false;
    };

    return (
        <>
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                
                className={`
                    flex gap-4 overflow-x-auto hide-scrollbar select-none 
                    ${isDown ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x snap-mandatory'} 
                    ${className}
                `}
                style={{ touchAction: 'pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
            >
                {children}
            </div>
        </>
    );
});
