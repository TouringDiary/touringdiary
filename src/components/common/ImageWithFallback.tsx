
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getOptimizedImageUrl, ImageSize } from '../../utils/imageOptimizer';
import { getCachedPlaceholder } from '../../services/settingsService';

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

export const ImageWithFallback = ({ src, alt, className, draggable, size = 'medium', priority = false, category = 'discovery', onClick }: Props) => {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  
  // 1. Logica di caricamento nativa (Bypassa React img tag lifecycle)
  useEffect(() => {
      // Reset stato iniziale
      setStatus('loading');
      setCurrentSrc(null);

      const targetUrl = src ? getOptimizedImageUrl(src, size) : null;
      
      if (!targetUrl) {
          handleFallback();
          return;
      }

      // Preloader nativo JS
      const img = new Image();
      img.src = targetUrl;

      // Gestori eventi nativi (più affidabili di React onLoad in liste virtualizzate)
      img.onload = () => {
          setCurrentSrc(targetUrl);
          setStatus('loaded');
      };

      img.onerror = () => {
          // Silent fail: Non logghiamo in console per evitare spam, il fallback gestirà la UI
          handleFallback();
      };

      // Cleanup: se il componente viene smontato prima del caricamento
      return () => {
          img.onload = null;
          img.onerror = null;
      };
  }, [src, size]);

  const handleFallback = () => {
      // Tenta di caricare il placeholder di categoria
      const fallbackUrl = getCachedPlaceholder(category);
      if (fallbackUrl && fallbackUrl !== src) {
          // Se abbiamo un fallback, proviamo a caricarlo
          const fallbackImg = new Image();
          fallbackImg.src = fallbackUrl;
          fallbackImg.onload = () => {
              setCurrentSrc(fallbackUrl);
              setStatus('loaded'); // Consideriamo loaded anche se è un fallback
          };
          fallbackImg.onerror = () => {
              setStatus('error');
          };
      } else {
          setStatus('error');
      }
  };

  if (status === 'error') {
      return (
        <div 
            className={`bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-600 ${className} overflow-hidden select-none`}
            onClick={onClick}
        >
          <div className="flex flex-col items-center gap-1 opacity-50 scale-75">
             <ImageIcon className="w-6 h-6" />
             <span className="text-[9px] font-bold uppercase tracking-wider">No Image</span>
          </div>
        </div>
      );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-950 ${className}`} onClick={onClick}>
        {/* Spinner sempre visibile finché non è 'loaded' */}
        {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/50 backdrop-blur-sm">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
        )}
        
        {/* Immagine visibile solo quando pronta */}
        {currentSrc && (
            <img 
                src={currentSrc}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-500 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                draggable={draggable}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
            />
        )}
    </div>
  );
};
