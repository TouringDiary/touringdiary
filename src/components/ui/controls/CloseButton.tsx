import React from 'react';
import { X } from 'lucide-react';
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape';

interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Azione di chiusura eseguita al click o alla pressione di ESC */
    onClose: () => void;
    /** Dimensione del pulsante (sm: 4, md: 5, lg: 6) */
    size?: 'sm' | 'md' | 'lg';
    /** 
     * Variante UI Ufficiale:
     * - primary: Cerchio rosso fisso (Standard Globale)
     * - minimal: Slate/Gray che vira al rosso in hover (Admin/Info)
     * - ghost: Solo icona, nessun background (Editor/Inline)
     */
    variant?: 'primary' | 'minimal' | 'ghost';
    /** Abilita il posizionamento standard 'absolute top-4 right-4' */
    position?: 'static' | 'absolute';
    /** Permette di disattivare l'intercettazione tasto ESC */
    withEscape?: boolean;
    /** Se true, inabilita la chiusura tramite ESC (es. form con modifiche pendenti) */
    disableIfDirty?: boolean;
    /** Override stilistici aggiuntivi */
    className?: string;
    /** Tooltip e Aria-label per accessibilità */
    title?: string;
}

/**
 * Componente standardizzato per la chiusura di interfacce (X-Button).
 * Gestisce nativamente accessibilità, scorciatoie ESC e posizionamento.
 *
 * Supporta tutti gli attributi standard di <button> (incluso `style`) tramite rest spread,
 * in conformità con il contratto dichiarato da `extends React.ButtonHTMLAttributes`.
 * Usare `style={{ zIndex: Z_XXX }}` con le costanti centralizzate da `@/constants/zIndex`.
 */
export const CloseButton: React.FC<CloseButtonProps> = ({
    onClose,
    size = 'md',
    variant = 'primary',
    position = 'static',
    withEscape = true,
    disableIfDirty = false,
    className = '',
    title = 'Chiudi (ESC)',
    onClick,
    ...rest
}) => {

    // Gestione centralizzata del tasto ESC
    const isEscapeEnabled = withEscape && !disableIfDirty;
    useCloseOnEscape(onClose, isEscapeEnabled);

    // Mappatura Icona Lucide
    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    // Mappatura Padding/Hitbox
    const paddingClasses = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3'
    };

    // Mappatura Stili (Primary è il cerchio rosso fisso)
    const variantStyles = {
        primary: 'bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg shadow-red-900/40 active:scale-95 transition-all duration-300',
        minimal: 'bg-slate-800 text-slate-400 rounded-full hover:bg-red-600 hover:text-white transition-all duration-300 border border-slate-700 active:scale-95',
        ghost: 'text-slate-500 hover:text-white rounded-full hover:bg-slate-800/80 transition-all duration-300 active:scale-95'
    };

    // Posizionamento top-right fissato a livello di progetto
    const positionStyle = position === 'absolute' ? 'absolute top-4 right-4' : '';

    return (
        <button
            {...rest}
            onClick={(e) => {
                e.stopPropagation();
                onClose();
                onClick?.(e);
            }}
            className={`
                flex items-center justify-center transition-all duration-300
                ${variantStyles[variant]}
                ${paddingClasses[size]}
                ${positionStyle}
                ${className}
            `}
            title={title}
            aria-label="Chiudi"
        >
            <X className={iconSizes[size]} />
        </button>
    );
};
