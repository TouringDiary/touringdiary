
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { getOptimizedImageUrl, ImageSize } from '../../utils/imageOptimizer';
import { getCategoryPlaceholders } from '../../services/settingsService';
import { resolveCategoryPlaceholderUrl } from '@/domain/poi/resolvePoiDisplayImageUrl';

interface Props {
  src?: string;
  alt: string;
  className?: string;
  draggable?: boolean;
  size?: ImageSize;
  /** Eager load when true (LCP / above-the-fold). */
  priority?: boolean;
  /** HTML `sizes` hint for responsive src selection. */
  sizes?: string;
  /** Browser fetch priority (LCP heroes → high). */
  fetchPriority?: 'high' | 'low' | 'auto';
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
  sizes,
  fetchPriority,
  category = 'discovery',
  onClick,
}: Props) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const fallbackSrc = useMemo(
    () =>
      resolveCategoryPlaceholderUrl({
        category,
        categoryPlaceholders: getCategoryPlaceholders(),
      }) ?? '',
    [category],
  );

  const primarySrc = src ? getOptimizedImageUrl(src, size) : fallbackSrc;

  const sourceToUse = hasError ? fallbackSrc : primarySrc;

  // Atomic reset to initial state when the intended image changes.
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [primarySrc]);

  useEffect(() => {
    if (imgRef.current?.complete) {
        if (imgRef.current.naturalWidth > 0) {
            setIsLoaded(true);
        } else if (imgRef.current.naturalWidth === 0 && imgRef.current.src) {
            setHasError(true);
        }
    }
  }, [sourceToUse]);

  const showFinalError = (hasError && !fallbackSrc) || !sourceToUse;

  if (showFinalError) {
    return <ErrorBox className={className} />;
  }

  // Public API stays camelCase (`fetchPriority`). React 18.x does not recognize
  // camelCase on DOM nodes (React 19 does); Priority Hints go out as lowercase.
  const resolvedFetchPriority = fetchPriority ?? (priority ? 'high' : undefined);
  const fetchPriorityDomAttr = resolvedFetchPriority
    ? ({ fetchpriority: resolvedFetchPriority } as React.ImgHTMLAttributes<HTMLImageElement> & {
        fetchpriority: 'high' | 'low' | 'auto';
      })
    : undefined;

  // Priority / LCP: stay visible from first paint (opacity-0 delays LCP candidates).
  // Non-priority keeps the fade-in; spinner still covers the box until decode.
  const imageVisibilityClass = priority
    ? 'opacity-100'
    : `transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`;

  return (
    <div className={`relative overflow-hidden bg-slate-950 ${className}`} onClick={onClick}>
      {!isLoaded && <Spinner />}
      <img
        ref={imgRef}
        src={sourceToUse}
        alt={alt}
        className={`w-full h-full object-cover ${imageVisibilityClass}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        draggable={draggable}
        loading={priority ? 'eager' : 'lazy'}
        // Priority/LCP: omit attr → browser `auto`. Forced sync is not justified
        // (MDN: hard to perceive on static <img>; can delay other paints).
        decoding={priority ? undefined : 'async'}
        sizes={sizes}
        {...(fetchPriorityDomAttr ?? {})}
      />
    </div>
  );
};
