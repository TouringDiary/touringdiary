import {
  Contrast,
  Droplets,
  Loader2,
  MousePointer2,
  Redo2,
  RotateCw,
  Save,
  Sliders,
  Sun,
  Undo2,
} from 'lucide-react';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Z_ADMIN_MODAL } from '@/constants/zIndex';
import { computeObjectCoverCropRect } from '@/domain/patron/resolvePatronDisplayImageUrl';
import { uploadPublicMedia } from '../../services/mediaService';
import { dataURLtoFile } from '../../utils/common';

// --- INTERFACES ---
interface Props {
  imageUrl: string;
  initialData?: { locationName: string; user: string; description?: string };
  /** Contratto consumer: parent monta/smonta, ma se false non renderizza. */
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { image: string }) => void;
  mode?: 'hero' | 'card' | 'gallery' | 'moderation' | 'social';
  /**
   * Guida viewport fissa (opt-in): rettangoli centrati = stesso crop di
   * `object-cover` + `object-position: center` in UI pubblica.
   * Con guida attiva il salvataggio esporta il ritaglio **primary** (niente bande nere del canvas).
   */
  viewportGuide?: {
    primaryAspect: number;
    secondaryAspect?: number;
    primaryLabel: string;
    secondaryLabel?: string;
  };
}

interface HistoryState {
  scale: number;
  rotation: number;
  pan: { x: number; y: number };
  brightness: number;
  contrast: number;
  saturation: number;
  imageSrc: string;
}

type ActiveTool = 'move' | 'adjust';

/** Limite unico zoom (slider + rotella). */
const MAX_ZOOM = 3;

const computeFitScale = (
  img: HTMLImageElement,
  containerW: number,
  containerH: number,
): number | null => {
  if (containerW <= 0 || containerH <= 0) return null;
  if (img.naturalWidth <= 0 || img.naturalHeight <= 0) return null;
  const scaleW = containerW / img.naturalWidth;
  const scaleH = containerH / img.naturalHeight;
  let fitted = Math.min(scaleW, scaleH, 1) * 0.9;
  if (fitted < 0.1) fitted = 0.1;
  return fitted;
};

export const AdminPhotoInspector = ({
  imageUrl,
  initialData: _initialData,
  isOpen,
  onClose,
  onSave,
  mode = 'hero',
  viewportGuide,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isHistoryAction = useRef(false);
  /** Pan corrente durante/dopo il drag (evita snapshot stale a pointerup). */
  const panRef = useRef({ x: 0, y: 0 });
  /** Fit iniziale ancora da applicare quando il contenitore ottiene dimensioni reali. */
  const pendingInitialFitRef = useRef(false);
  /** Reset geometria in attesa di dimensioni container (solo scale/pan/rotation). */
  const pendingGeometryResetFitRef = useRef(false);
  /** L’utente ha già modificato geometria/filtri → non ricalcolare lo zoom iniziale. */
  const hasUserEditedRef = useRef(false);

  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<ActiveTool>('move');
  const [isSaving, setIsSaving] = useState(false);

  const markUserEdited = () => {
    hasUserEditedRef.current = true;
    pendingInitialFitRef.current = false;
    pendingGeometryResetFitRef.current = false;
  };

  const applyState = (state: HistoryState) => {
    setScale(state.scale);
    setRotation(state.rotation);
    panRef.current = state.pan;
    setPan(state.pan);
    setBrightness(state.brightness);
    setContrast(state.contrast);
    setSaturation(state.saturation);
  };

  const pushHistorySnapshot = useCallback(
    (snapshot: Omit<HistoryState, 'imageSrc'> & { imageSrc?: string }) => {
      if (isHistoryAction.current) {
        isHistoryAction.current = false;
        return;
      }
      if (isDraggingRef.current) return;
      if (!originalImage) return;

      const newState: HistoryState = {
        scale: snapshot.scale,
        rotation: snapshot.rotation,
        pan: { ...snapshot.pan },
        brightness: snapshot.brightness,
        contrast: snapshot.contrast,
        saturation: snapshot.saturation,
        imageSrc: snapshot.imageSrc ?? originalImage.src,
      };

      const trimmed = history.slice(0, historyIndex + 1);
      trimmed.push(newState);
      if (trimmed.length > 20) trimmed.shift();

      setHistory(trimmed);
      setHistoryIndex(trimmed.length - 1);
    },
    [originalImage, history, historyIndex],
  );

  const addToHistory = useCallback(() => {
    pushHistorySnapshot({
      scale,
      rotation,
      pan: { ...panRef.current },
      brightness,
      contrast,
      saturation,
    });
  }, [pushHistorySnapshot, scale, rotation, brightness, contrast, saturation]);

  // Snapshot debounce per slider / zoom rotella / rotazione (pan solo a fine drag).
  useEffect(() => {
    if (isDraggingRef.current) return;
    const timer = setTimeout(() => {
      addToHistory();
    }, 500);
    return () => clearTimeout(timer);
  }, [addToHistory]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      isHistoryAction.current = true;
      const prev = history[historyIndex - 1];
      applyState(prev);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isHistoryAction.current = true;
      const next = history[historyIndex + 1];
      applyState(next);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // --- LOAD IMAGE (invalida risposte obsolete su cambio imageUrl) ---
  useEffect(() => {
    if (!imageUrl) {
      setOriginalImage(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;

      const cw = containerRef.current?.clientWidth ?? 0;
      const ch = containerRef.current?.clientHeight ?? 0;
      const fitted = computeFitScale(img, cw, ch);
      const initialScale = fitted ?? 1;
      pendingInitialFitRef.current = fitted === null;
      pendingGeometryResetFitRef.current = false;
      hasUserEditedRef.current = false;

      const initialPan = { x: 0, y: 0 };
      const initial: HistoryState = {
        scale: initialScale,
        rotation: 0,
        pan: initialPan,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        imageSrc: imageUrl,
      };

      setOriginalImage(img);
      setScale(initialScale);
      setRotation(0);
      panRef.current = initialPan;
      setPan(initialPan);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setHistory([initial]);
      setHistoryIndex(0);
      isHistoryAction.current = true;
    };
    img.onerror = () => {
      if (cancelled) return;
      setOriginalImage(null);
    };
    img.src = imageUrl;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  // Canvas + viewport guide seguono le dimensioni reali del contenitore.
  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    };
    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);

  // Fit iniziale quando il contenitore ottiene dimensioni reali (layout responsive).
  useEffect(() => {
    if (!pendingInitialFitRef.current) return;
    if (hasUserEditedRef.current) {
      pendingInitialFitRef.current = false;
      return;
    }
    if (!originalImage) return;
    const fitted = computeFitScale(originalImage, containerSize.width, containerSize.height);
    if (fitted === null) return;

    pendingInitialFitRef.current = false;
    const initialPan = { x: 0, y: 0 };
    const initial: HistoryState = {
      scale: fitted,
      rotation: 0,
      pan: initialPan,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      imageSrc: originalImage.src,
    };

    setScale(fitted);
    setRotation(0);
    panRef.current = initialPan;
    setPan(initialPan);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setHistory([initial]);
    setHistoryIndex(0);
    isHistoryAction.current = true;
  }, [containerSize.width, containerSize.height, originalImage]);

  // Reset geometria differito: solo scale/pan/rotation (filtri colore invariati).
  useEffect(() => {
    if (!pendingGeometryResetFitRef.current) return;
    if (!originalImage) return;
    const fitted = computeFitScale(originalImage, containerSize.width, containerSize.height);
    if (fitted === null) return;

    pendingGeometryResetFitRef.current = false;
    const resetPan = { x: 0, y: 0 };
    setScale(fitted);
    setRotation(0);
    panRef.current = resetPan;
    setPan(resetPan);
    hasUserEditedRef.current = true;
    pendingInitialFitRef.current = false;
  }, [containerSize.width, containerSize.height, originalImage]);

  // --- RENDER CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = Math.max(1, Math.floor(containerSize.width));
    const height = Math.max(1, Math.floor(containerSize.height));
    if (containerSize.width <= 0 || containerSize.height <= 0) return;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
    ctx.filter = 'none';
    ctx.restore();
  }, [
    originalImage,
    scale,
    rotation,
    pan,
    brightness,
    contrast,
    saturation,
    containerSize.width,
    containerSize.height,
  ]);

  // --- POINTER HANDLERS (mouse / touch / pen) ---
  const endPanDrag = useCallback(
    (target: HTMLElement, pointerId: number) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }

      const finalPan = { ...panRef.current };
      setPan(finalPan);
      pushHistorySnapshot({
        scale,
        rotation,
        pan: finalPan,
        brightness,
        contrast,
        saturation,
      });
    },
    [pushHistorySnapshot, scale, rotation, brightness, contrast, saturation],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'move') return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    markUserEdited();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ ...panRef.current });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || activeTool !== 'move') return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const nextPan = { x: panStart.x + dx, y: panStart.y + dy };
    panRef.current = nextPan;
    setPan(nextPan);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    endPanDrag(e.currentTarget, e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    endPanDrag(e.currentTarget, e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (activeTool !== 'move') return;
    e.preventDefault();
    markUserEdited();
    const delta = e.deltaY * -0.001;
    setScale((prev) => Math.min(Math.max(0.1, prev + delta), MAX_ZOOM));
  };

  const handleSaveFinal = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);

    try {
      const source = canvasRef.current;
      let exportCanvas: HTMLCanvasElement = source;

      if (viewportGuide) {
        const crop = computeObjectCoverCropRect(
          source.width,
          source.height,
          viewportGuide.primaryAspect,
        );
        const out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(crop.width));
        out.height = Math.max(1, Math.round(crop.height));
        const outCtx = out.getContext('2d');
        if (!outCtx) {
          throw new Error('Canvas 2D non disponibile per il ritaglio viewport.');
        }
        outCtx.fillStyle = '#000000';
        outCtx.fillRect(0, 0, out.width, out.height);
        outCtx.drawImage(
          source,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          out.width,
          out.height,
        );
        exportCanvas = out;
      }

      const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.9);
      const file = dataURLtoFile(dataUrl, `edited_${Date.now()}.jpg`);
      const url = await uploadPublicMedia(file, 'edited_assets');

      if (url) {
        onSave({ image: url });
      } else {
        alert('Errore caricamento.');
      }
    } catch (e) {
      console.error(e);
      alert('Errore salvataggio.');
    } finally {
      setIsSaving(false);
    }
  };

  const primaryFrame = viewportGuide
    ? computeObjectCoverCropRect(
        containerSize.width,
        containerSize.height,
        viewportGuide.primaryAspect,
      )
    : null;
  const secondaryFrame =
    viewportGuide?.secondaryAspect != null && primaryFrame && primaryFrame.width > 0
      ? (() => {
          const nested = computeObjectCoverCropRect(
            primaryFrame.width,
            primaryFrame.height,
            viewportGuide.secondaryAspect,
          );
          return {
            x: primaryFrame.x + nested.x,
            y: primaryFrame.y + nested.y,
            width: nested.width,
            height: nested.height,
          };
        })()
      : null;

  if (!isOpen) return null;

  const toolBtnClass = (tool: ActiveTool) =>
    `min-h-11 min-w-11 p-3 rounded-xl transition-all flex items-center justify-center shrink-0 ${
      activeTool === tool
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
    }`;

  return createPortal(
    <div
      className="fixed inset-0 bg-[#020617] flex flex-col animate-in fade-in overflow-hidden select-none pointer-events-auto"
      style={{ zIndex: Z_ADMIN_MODAL }}
    >
      {/* TOP BAR */}
      <div className="min-h-14 md:h-16 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-2 shrink-0 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="min-h-11 min-w-11 p-2 hover:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-30 transition-colors inline-flex items-center justify-center"
            aria-label="Annulla"
            title="Annulla"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="min-h-11 min-w-11 p-2 hover:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-30 transition-colors inline-flex items-center justify-center"
            aria-label="Ripeti"
            title="Ripeti"
          >
            <Redo2 className="w-5 h-5" />
          </button>
          <div className="hidden sm:block h-6 w-px bg-slate-700 mx-2" />
          <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide truncate">
            Photo Studio Pro
          </h3>
        </div>

        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none min-h-11 px-4 sm:px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase border border-slate-700 transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => void handleSaveFinal()}
            disabled={isSaving}
            className="flex-1 sm:flex-none min-h-11 bg-emerald-600 hover:bg-emerald-500 text-white px-4 sm:px-8 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-900/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{' '}
            Salva Finale
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
        {/* TOOLS: barra orizzontale su mobile, colonna su desktop */}
        <div className="order-2 md:order-1 w-full md:w-20 shrink-0 bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 flex flex-row md:flex-col items-center justify-center md:justify-start px-2 py-2 md:py-6 gap-2 md:gap-4 z-floating-panel shadow-xl overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTool('move')}
            className={toolBtnClass('move')}
            title="Sposta e zoom"
            aria-label="Strumento sposta e zoom"
            aria-pressed={activeTool === 'move'}
          >
            <MousePointer2 className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('adjust')}
            className={toolBtnClass('adjust')}
            title="Regola colori"
            aria-label="Strumento regola colori"
            aria-pressed={activeTool === 'adjust'}
          >
            <Sliders className="w-6 h-6" />
          </button>
        </div>

        {/* CENTER CANVAS */}
        <div
          className="order-1 md:order-2 flex-1 min-h-0 min-w-0 bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center touch-none"
          style={{ cursor: activeTool === 'move' ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          ref={containerRef}
          role="application"
          aria-label="Area di editing foto: trascina per spostare, rotella per zoom"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <canvas ref={canvasRef} className="shadow-2xl max-w-full max-h-full" />

          {viewportGuide && primaryFrame && primaryFrame.width > 0 ? (
            <div className="absolute inset-0 pointer-events-none z-local-overlay">
              {secondaryFrame && secondaryFrame.width > 0 ? (
                <div
                  className="absolute border border-dashed border-white/50 rounded-sm"
                  style={{
                    left: secondaryFrame.x,
                    top: secondaryFrame.y,
                    width: secondaryFrame.width,
                    height: secondaryFrame.height,
                  }}
                  aria-hidden
                >
                  {viewportGuide.secondaryLabel ? (
                    <span className="absolute -top-6 left-0 text-[9px] font-bold uppercase tracking-wider text-white/70 bg-black/55 px-2 py-0.5 rounded">
                      {viewportGuide.secondaryLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div
                className="absolute border-2 border-dashed border-amber-400 rounded-sm shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                style={{
                  left: primaryFrame.x,
                  top: primaryFrame.y,
                  width: primaryFrame.width,
                  height: primaryFrame.height,
                }}
                role="img"
                aria-label={viewportGuide.primaryLabel}
              >
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-black/70 border border-amber-500/40 px-2 py-0.5 rounded max-w-[90vw] truncate">
                  {viewportGuide.primaryLabel}
                </span>
                <span
                  className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-amber-400/30"
                  aria-hidden
                />
                <span
                  className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-amber-400/30"
                  aria-hidden
                />
              </div>
            </div>
          ) : null}

          {viewportGuide ? (
            <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 pointer-events-none bg-black/65 backdrop-blur px-3 sm:px-4 py-2 rounded-full text-amber-100 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-amber-500/30 max-w-[92%] text-center">
              Area tratteggiata = porzione visibile in UI pubblica
            </div>
          ) : null}
        </div>

        {/* RIGHT / BOTTOM PANEL */}
        <div className="order-3 w-full md:w-72 shrink-0 max-h-[38vh] md:max-h-none bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 z-floating-panel shadow-xl overflow-y-auto custom-scrollbar min-h-0">
          {activeTool === 'move' && (
            <div className="space-y-4 animate-in fade-in">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
                Geometria
              </h4>
              {viewportGuide ? (
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Il ritaglio all&apos;export segue la guida viewport (area ambra). Sposta e zoomma
                  l&apos;immagine per inquadrare il soggetto.
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Sposta, zoomma e ruota l&apos;immagine. Non è disponibile un ritaglio libero
                  manuale in questo editor.
                </p>
              )}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="fld-admin-photo-rotation"
                    className="text-[10px] font-bold text-slate-400 uppercase mb-1 block"
                  >
                    Rotazione
                  </label>
                  <input
                    id="fld-admin-photo-rotation"
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={(e) => {
                      markUserEdited();
                      setRotation(parseInt(e.target.value, 10));
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="fld-admin-photo-zoom"
                    className="text-[10px] font-bold text-slate-400 uppercase mb-1 block"
                  >
                    Zoom
                  </label>
                  <input
                    id="fld-admin-photo-zoom"
                    type="range"
                    min="0.1"
                    max={MAX_ZOOM}
                    step="0.1"
                    value={scale}
                    onChange={(e) => {
                      markUserEdited();
                      setScale(parseFloat(e.target.value));
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      markUserEdited();
                      setRotation((r) => r - 90);
                    }}
                    className="min-h-11 min-w-11 p-2 bg-slate-800 rounded text-slate-300 hover:text-white inline-flex items-center justify-center"
                    aria-label="Ruota di 90 gradi antiorario"
                  >
                    <RotateCw className="w-4 h-4 -scale-x-100" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const resetPan = { x: 0, y: 0 };
                      setRotation(0);
                      panRef.current = resetPan;
                      setPan(resetPan);

                      const fitted =
                        originalImage != null
                          ? computeFitScale(
                              originalImage,
                              containerSize.width,
                              containerSize.height,
                            )
                          : null;

                      if (fitted != null) {
                        markUserEdited();
                        setScale(fitted);
                        return;
                      }

                      // Dimensioni non ancora valide: nessun scale inventato; solo fit geometrico differito.
                      pendingGeometryResetFitRef.current = true;
                      pendingInitialFitRef.current = false;
                    }}
                    className="flex-1 min-h-11 px-3 py-2 bg-slate-800 rounded text-[10px] font-bold uppercase text-slate-300 hover:text-white"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      markUserEdited();
                      setRotation((r) => r + 90);
                    }}
                    className="min-h-11 min-w-11 p-2 bg-slate-800 rounded text-slate-300 hover:text-white inline-flex items-center justify-center"
                    aria-label="Ruota di 90 gradi orario"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'adjust' && (
            <div className="space-y-4 animate-in fade-in">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
                Correzione Colore
              </h4>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="fld-admin-photo-brightness"
                    className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-2"
                  >
                    <Sun className="w-3 h-3" /> Luminosità
                  </label>
                  <input
                    id="fld-admin-photo-brightness"
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => {
                      markUserEdited();
                      setBrightness(parseInt(e.target.value, 10));
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="fld-admin-photo-contrast"
                    className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-2"
                  >
                    <Contrast className="w-3 h-3" /> Contrasto
                  </label>
                  <input
                    id="fld-admin-photo-contrast"
                    type="range"
                    min="0"
                    max="200"
                    value={contrast}
                    onChange={(e) => {
                      markUserEdited();
                      setContrast(parseInt(e.target.value, 10));
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
                  />
                </div>
                <div>
                  <label
                    htmlFor="fld-admin-photo-saturation"
                    className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-2"
                  >
                    <Droplets className="w-3 h-3" /> Saturazione
                  </label>
                  <input
                    id="fld-admin-photo-saturation"
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => {
                      markUserEdited();
                      setSaturation(parseInt(e.target.value, 10));
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    markUserEdited();
                    setBrightness(100);
                    setContrast(100);
                    setSaturation(100);
                  }}
                  className="w-full min-h-11 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold uppercase"
                >
                  Reset Colori
                </button>
              </div>
            </div>
          )}

          <div className="mt-auto bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <h5 className="text-[10px] font-black text-indigo-400 uppercase mb-1">
              Target: {mode.toUpperCase()}
            </h5>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {viewportGuide
                ? `${viewportGuide.primaryLabel}${
                    viewportGuide.secondaryLabel ? ` · ${viewportGuide.secondaryLabel}` : ''
                  }. Salvataggio = ritaglio dell’area ambra (export ${viewportGuide.primaryLabel}).${
                    viewportGuide.secondaryLabel
                      ? ` La guida secondaria (${viewportGuide.secondaryLabel}) è solo anteprima di inquadratura in UI pubblica, non l’export.`
                      : ''
                  }`
                : null}
              {!viewportGuide && mode === 'hero' && 'Ottimizzato per Header 16:9'}
              {!viewportGuide && mode === 'card' && 'Ottimizzato per Card 4:5 o 1:1'}
              {!viewportGuide && mode === 'gallery' && 'Ottimizzato per Galleria 1:1'}
              {!viewportGuide && mode === 'social' && 'Ottimizzato per Story 9:16'}
              {!viewportGuide && mode === 'moderation' && 'Moderazione community'}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
