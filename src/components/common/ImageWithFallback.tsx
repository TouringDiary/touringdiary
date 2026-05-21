
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { getOptimizedImageUrl, ImageSize } from '../../utils/imageOptimizer';
import { getCachedSetting } from '../../services/settingsService';
import { SETTINGS_KEYS } from '../../services/settingsService';

interface Props {
  src?: string;
  alt: string;
  className?: string;
  draggable?: boolean;
  size?: ImageSize;
  priority?: boolean;
  category?: string;
  onClick?: () => void;
}

const ErrorBox = ({ className }: { className?: string }) => (
  <div className={`bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-600 ${className} overflow-hidden select-none`}>
    <div className="flex flex-col items-center gap-1 opacity-50 scale-75">
      <ImageIcon className="w-6 h-6" />
      <span className="text-[9px] font-bold uppercase tracking-wider">No Image</span>
    </div>
  </div>
);

const Spinner = () => (
  <div className="absolute inset-0 flex items-center justify-center z-floating-panel bg-slate-900/50 backdrop-blur-sm">
    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
  </div>
);

export const ImageWithFallback = ({
  src,
  alt,
  className,
  draggable,
  size = 'medium',
  priority = false,
  category = 'discovery',
  onClick,
}: Props) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // --- MODIFICA ARCHITETTURALE --- 
  const fallbackSrc = useMemo(() => {
    const placeholders = getCachedSetting<Record<string, string>>(SETTINGS_KEYS.CATEGORY_PLACEHOLDERS);
    if (!placeholders || typeof placeholders !== 'object') return '';
    return placeholders[category] || '';
  }, [category]);

  // Se non c'è una 'src', usa direttamente il fallback. Altrimenti, ottimizza la 'src'.
  const primarySrc = src ? getOptimizedImageUrl(src, size) : fallbackSrc;
  // --- FINE MODIFICA ---

  const sourceToUse = hasError ? fallbackSrc : primarySrc;

  // Quando viene passata una nuova immagine principale, resettiamo l'errore per riprovare
  useEffect(() => {
    setHasError(false);
  }, [primarySrc]);

  useEffect(() => {
    // Reset dello stato caricamento per l'URL effettivo
    setIsLoaded(false);

    // Controllo per cache del browser:
    // Se l'immagine è già stata caricata (es. da cache), img.complete è true.
    if (imgRef.current?.complete) {
        // Un'immagine rotta potrebbe avere complete=true ma naturalWidth=0
        if (imgRef.current.naturalWidth > 0) {
            setIsLoaded(true);
        } else if (imgRef.current.naturalWidth === 0 && imgRef.current.src) {
            // Se l'immagine è completa ma width è 0, potrebbe essere un errore di caricamento (es. 404 ritornato istantaneamente)
            setHasError(true);
        }
    }
  }, [sourceToUse]);

  // Mostra errore finale solo se TUTTE le sorgenti (src e fallback) hanno fallito o sono assenti
  const showFinalError = (hasError && !fallbackSrc) || !sourceToUse;

  if (showFinalError) {
    return <ErrorBox className={className} />;
  }

  return (
    <div className={`relative overflow-hidden bg-slate-950 ${className}`} onClick={onClick}>
      {!isLoaded && <Spinner />}
      <img
        ref={imgRef}
        src={sourceToUse}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        draggable={draggable}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
};
