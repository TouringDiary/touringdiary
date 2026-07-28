import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import {
  clearViaggioCover,
  uploadViaggioCover,
} from '@/services/viaggio/viaggioCoverService';
import type { Viaggio } from '@/types/models/Viaggio';
import { showGlobalAlert } from '@/services/ui/toastService';

interface Props {
  viaggio: Viaggio;
  userId: string;
  onUpdated: (v: Viaggio) => void;
  /** Compact strip for catalog row (horizontal preview). */
  className?: string;
}

/**
 * Preview cover catalogo + «+» → selettore immagini diretto (DOC 35 §6.1–6.2).
 */
export const MySpaceViaggioCoverPreview: React.FC<Props> = ({
  viaggio,
  userId,
  onUpdated,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const openPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    inputRef.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const updated = await uploadViaggioCover({
        userId,
        viaggioId: viaggio.id,
        file,
      });
      onUpdated(updated);
    } catch (err) {
      console.error('[MySpaceViaggioCoverPreview] upload failed', err);
      showGlobalAlert('Caricamento cover non riuscito. Riprova.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onClear = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy || !viaggio.coverImage) return;
    setBusy(true);
    try {
      const updated = await clearViaggioCover(viaggio.id);
      onUpdated(updated);
    } catch (err) {
      console.error('[MySpaceViaggioCoverPreview] clear failed', err);
      showGlobalAlert('Eliminazione cover non riuscita. Riprova.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 ${className}`}
      data-testid={`myspace-viaggio-cover-${viaggio.id}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {viaggio.coverImage ? (
        <>
          <button
            type="button"
            onClick={openPicker}
            disabled={busy}
            className="absolute inset-0 w-full h-full disabled:pointer-events-none"
            aria-label="Cambia cover del viaggio"
            title="Cambia cover"
          >
            <img
              src={viaggio.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="absolute top-1 right-1 p-1 rounded-md bg-slate-950/80 text-slate-300 hover:text-rose-300 disabled:opacity-50"
            aria-label="Elimina cover"
            title="Elimina cover"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={busy}
          className="w-full h-full min-h-[3.5rem] flex flex-col items-center justify-center gap-0.5 text-amber-300/90 hover:bg-amber-500/10 transition-colors"
          aria-label="Aggiungi cover del viaggio"
          title="Aggiungi cover"
        >
          {busy ? (
            <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
          ) : (
            <>
              <ImagePlus className="w-7 h-7" aria-hidden />
              <span className="text-2xl font-black leading-none">+</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
