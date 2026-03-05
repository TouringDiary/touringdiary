
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface CloseButtonProps {
    onClose: () => void;
    className?: string;
    variant?: 'circle' | 'square';
    size?: 'sm' | 'md' | 'lg';
    title?: string;
}

export const CloseButton = ({ 
    onClose, 
    className = '', 
    variant = 'circle', 
    size = 'md',
    title = 'Chiudi (ESC)' 
}: CloseButtonProps) => {
    
    // Pattern useRef per stabilizzare il listener
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    // Gestione automatica del tasto ESC (Single Binding)
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onCloseRef.current();
            }
        };
        
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []); // Empty deps = NO CHURN

    // Mappatura dimensioni
    const sizeClasses = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3'
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className={`
                flex items-center justify-center
                bg-red-600 hover:bg-red-700 text-white
                shadow-lg transition-transform active:scale-95
                ${variant === 'circle' ? 'rounded-full' : 'rounded-xl'}
                ${sizeClasses[size]}
                ${className}
            `}
            title={title}
            aria-label="Chiudi"
        >
            <X className={iconSizes[size]} />
        </button>
    );
};
