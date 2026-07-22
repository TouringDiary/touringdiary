import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RotateCw, ZoomIn, Sun, Droplets, Contrast, Wand2, Check, Eye, Sparkles } from 'lucide-react';
import { dataURLtoFile } from '../../utils/common';
import {
    PHOTO_FILTER_PRESETS,
    type PhotoFilterId,
    getPhotoFilterPreset,
} from '@/domain/photos/photoFilters';
import { Z_POPOVER, Z_MODAL_NESTED } from '@/constants/zIndex';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

/** Cap longest canvas edge — quality vs memory on mobile. */
const MAX_CANVAS_EDGE = 1600;

interface UserPhotoEditorProps {
    /** Session original — filters/edits always re-apply from this file (D-004). */
    file: File;
    onSave: (editedFile: File, previewUrl: string) => void;
    onCancel: () => void;
}

type EditorPanel = 'adjust' | 'filters';

function fitCanvasSize(naturalW: number, naturalH: number): { w: number; h: number } {
    const longest = Math.max(naturalW, naturalH) || 1;
    if (longest <= MAX_CANVAS_EDGE) {
        return { w: Math.max(1, Math.round(naturalW)), h: Math.max(1, Math.round(naturalH)) };
    }
    const scale = MAX_CANVAS_EDGE / longest;
    return {
        w: Math.max(1, Math.round(naturalW * scale)),
        h: Math.max(1, Math.round(naturalH * scale)),
    };
}

export const UserPhotoEditor = ({ file, onSave, onCancel }: UserPhotoEditorProps) => {
    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const footerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooter);
    const footerActionsShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooterActions);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const headerIconBoxShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconBox);
    const headerIconGlyphShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconGlyph);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);
    const btnPrimaryShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnPrimary);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const objectUrlRef = useRef<string | null>(null);
    const dragPointerIdRef = useRef<number | null>(null);
    const lastPointerTypeRef = useRef<string>('mouse');
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [canvasSize, setCanvasSize] = useState({ w: 500, h: 625 });

    const [panel, setPanel] = useState<EditorPanel>('adjust');
    const [activeFilterId, setActiveFilterId] = useState<PhotoFilterId>('original');

    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [showPreviewMode, setShowPreviewMode] = useState(false);

    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useGlobalModalEscape(true, onCancel);

    useEffect(() => {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const url = URL.createObjectURL(file);
        objectUrlRef.current = url;
        const img = new Image();
        img.src = url;
        img.onload = () => {
            setCanvasSize(fitCanvasSize(img.naturalWidth || img.width, img.naturalHeight || img.height));
            setImage(img);
            setPos({ x: 0, y: 0 });
            setScale(1);
            setRotation(0);
            setActiveFilterId('original');
            setBrightness(100);
            setContrast(100);
            setSaturation(100);
            setPanel('adjust');
        };
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, [file]);

    // Canvas = editor viewport; the source image is drawn (fitted) inside this viewport.
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cw = canvas.width;
        const ch = canvas.height;

        ctx.clearRect(0, 0, cw, ch);
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(pos.x, pos.y);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.drawImage(image, -cw / 2, -ch / 2, cw, ch);
        ctx.restore();
    }, [image, scale, rotation, brightness, contrast, saturation, pos]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas, canvasSize]);

    const applyFilter = (id: PhotoFilterId) => {
        const preset = getPhotoFilterPreset(id);
        setActiveFilterId(id);
        setBrightness(preset.adjustments.brightness);
        setContrast(preset.adjustments.contrast);
        setSaturation(preset.adjustments.saturation);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (lastPointerTypeRef.current === 'touch') return;
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        setScale((prev) => Math.min(Math.max(0.5, prev + delta), 3));
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        lastPointerTypeRef.current = e.pointerType || 'mouse';
        dragPointerIdRef.current = e.pointerId;
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDragging || dragPointerIdRef.current !== e.pointerId) return;
        const dx = (e.clientX - dragStart.x) / scale;
        const dy = (e.clientY - dragStart.y) / scale;
        setPos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const endPointerDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (dragPointerIdRef.current !== e.pointerId) return;
        dragPointerIdRef.current = null;
        setIsDragging(false);
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            /* already released */
        }
    };

    const handleSave = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);
        const editedFile = dataURLtoFile(dataUrl, `edited_${file.name}`);
        onSave(editedFile, dataUrl);
    };

    const applyMagicFix = () => {
        // Today Magic Fix applies the shared "vivid" preset (same pipeline as Filtri).
        // Future extension point: swap this for an AI enhancement pipeline without changing the UI control.
        applyFilter('vivid');
    };

    if (typeof document === 'undefined') return null;

    const tabBtn = (id: EditorPanel, label: string, icon?: React.ReactNode) => (
        <button
            type="button"
            onClick={() => setPanel(id)}
            className={`flex-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                panel === id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell}`}
            style={{ zIndex: Z_POPOVER }}
            onClick={onCancel}
            role="presentation"
        >
            <div
                className={`${containerShell} w-full max-w-5xl outline-none min-h-0`}
                style={{ zIndex: Z_MODAL_NESTED }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-photo-editor-title"
            >
                <CloseButton
                    onClose={onCancel}
                    variant="primary"
                    position="absolute"
                    withEscape={false}
                    className={`${closeOffsetShell} z-local-overlay`}
                />

                <header className={`${headerShell} shrink-0 pr-12`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={headerIconBoxShell}>
                            <Sparkles className={headerIconGlyphShell} aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h3
                                id="user-photo-editor-title"
                                className={`${modalTitleShell} truncate`}
                            >
                                Modifica Scatto
                            </h3>
                            <p className={modalSubtitleShell}>Regola l’immagine, poi continua</p>
                        </div>
                    </div>
                </header>

                {/*
                  Body keeps a vertical stack (photo → panel → toolbar).
                  Do NOT put panel/toolbar in modalFooter: Foundation footer becomes
                  flex-row from sm up and would scatter controls horizontally.
                */}
                <div
                    className={`${bodyShell} !flex !flex-col !gap-3 !min-h-0 !overflow-hidden !p-3 sm:!p-4`}
                >
                    {/* 1. Photo viewport */}
                    <div className="flex-1 min-h-0 flex items-center justify-center bg-black/40 rounded-xl overflow-hidden">
                        <div
                            className={`relative max-h-full max-w-full flex items-center justify-center ${
                                showPreviewMode
                                    ? 'scale-90 shadow-2xl border-4 border-white/10 rounded-xl overflow-hidden'
                                    : ''
                            } transition-all duration-300`}
                        >
                            <canvas
                                ref={canvasRef}
                                width={canvasSize.w}
                                height={canvasSize.h}
                                className="max-h-full max-w-full w-auto h-auto object-contain cursor-move touch-none shadow-2xl bg-[#1a1a1a]"
                                onWheel={handleWheel}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={endPointerDrag}
                                onPointerCancel={endPointerDrag}
                            />
                            {/* Visual mock of a feed card chrome only — not the real Live Feed component. */}
                            {showPreviewMode && (
                                <div className="absolute inset-0 pointer-events-none border border-slate-800 rounded-xl z-local-overlay">
                                    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur px-2 py-1 rounded-full text-white text-[10px] font-normal tabular-nums inline-flex items-center gap-1">
                                        <span aria-hidden>❤️</span> 0
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent pt-12">
                                        <div className="h-2 w-24 bg-white/50 rounded mb-2" />
                                        <div className="h-2 w-16 bg-white/30 rounded" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Panel under photo: filter presets OR adjust controls */}
                    <div className="shrink-0 min-w-0">
                        {panel === 'filters' ? (
                            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2 min-w-0">
                                <div
                                    className="flex w-full gap-2 overflow-x-auto overscroll-x-contain custom-scrollbar touch-pan-x pb-1 px-0.5 snap-x snap-mandatory"
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                >
                                    {PHOTO_FILTER_PRESETS.map((preset) => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => applyFilter(preset.id)}
                                            className={`snap-start shrink-0 min-w-[4.75rem] min-h-[2.75rem] px-3 py-2.5 rounded-xl border text-center transition-all ${
                                                activeFilterId === preset.id
                                                    ? 'border-indigo-500 bg-indigo-600/20 text-white'
                                                    : 'border-slate-700/80 bg-slate-900/80 text-slate-400 hover:border-slate-500'
                                            }`}
                                        >
                                            <span className="block text-[10px] font-black uppercase tracking-wider">
                                                {preset.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-3">
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="flex flex-col items-center gap-1">
                                        <ZoomIn className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="3"
                                            step="0.1"
                                            value={scale}
                                            onChange={(e) => setScale(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Sun className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="range"
                                            min="50"
                                            max="150"
                                            value={brightness}
                                            onChange={(e) => {
                                                setActiveFilterId('original');
                                                setBrightness(parseFloat(e.target.value));
                                            }}
                                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Contrast className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="range"
                                            min="50"
                                            max="150"
                                            value={contrast}
                                            onChange={(e) => {
                                                setActiveFilterId('original');
                                                setContrast(parseFloat(e.target.value));
                                            }}
                                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Droplets className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="200"
                                            value={saturation}
                                            onChange={(e) => {
                                                setActiveFilterId('original');
                                                setSaturation(parseFloat(e.target.value));
                                            }}
                                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRotation((r) => r - 90)}
                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
                                        aria-label="Ruota a sinistra"
                                    >
                                        <RotateCw className="w-5 h-5 -scale-x-100" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRotation((r) => r + 90)}
                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
                                        aria-label="Ruota a destra"
                                    >
                                        <RotateCw className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Toolbar under panel */}
                    <div className="shrink-0 flex items-center gap-2 min-w-0">
                        <div className="flex-1 min-w-0 flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                            {tabBtn('adjust', 'Regola')}
                            {tabBtn('filters', 'Filtri', <Sparkles className="w-3 h-3" />)}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowPreviewMode(!showPreviewMode)}
                                className={`p-2.5 rounded-xl border transition-all ${
                                    showPreviewMode
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                                title="Anteprima Feed"
                                aria-label="Anteprima Feed"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={applyMagicFix}
                                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-amber-500 hover:text-amber-400 transition-colors"
                                title="Magic Fix"
                                aria-label="Magic Fix"
                            >
                                <Wand2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Footer: Avanti only (Foundation footer row is for actions) */}
                <div
                    className={`${footerShell} shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] sm:pb-6`}
                >
                    <div className={`${footerActionsShell} sm:justify-end`}>
                        <button
                            type="button"
                            onClick={handleSave}
                            className={`${btnPrimaryShell} min-w-[8.5rem] flex items-center justify-center gap-2 relative z-local-raised`}
                        >
                            <Check className="w-4 h-4" />
                            Avanti
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
