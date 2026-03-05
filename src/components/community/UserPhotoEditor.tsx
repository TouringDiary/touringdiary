
import React, { useState, useRef, useEffect } from 'react';
import { Save, X, RotateCw, ZoomIn, Sun, Droplets, Contrast, Wand2, Check, Eye } from 'lucide-react';
import { dataURLtoFile } from '../../utils/common';

interface UserPhotoEditorProps {
    file: File;
    onSave: (editedFile: File, previewUrl: string) => void;
    onCancel: () => void;
}

export const UserPhotoEditor = ({ file, onSave, onCancel }: UserPhotoEditorProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    
    // Edit State
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [showPreviewMode, setShowPreviewMode] = useState(false);

    // Position State for Dragging
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            setImage(img);
            setPos({ x: 0, y: 0 });
        };
    }, [file]);

    useEffect(() => {
        renderCanvas();
    }, [image, scale, rotation, brightness, contrast, saturation, pos]);

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // FIXED: Reduced internal resolution slightly for better fit, 
        // will rely on CSS max-height for display
        const cw = canvas.width;
        const ch = canvas.height;

        ctx.clearRect(0, 0, cw, ch);
        ctx.save();
        
        // Center pivot
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(pos.x, pos.y); 
        
        // Filters
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        
        // Draw centered
        ctx.drawImage(image, -image.width / 2, -image.height / 2);
        
        ctx.restore();
    };

    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY * -0.001;
        setScale(prev => Math.min(Math.max(0.5, prev + delta), 3));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = (e.clientX - dragStart.x) / scale; 
        const dy = (e.clientY - dragStart.y) / scale;
        
        setPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleSave = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        const editedFile = dataURLtoFile(dataUrl, `edited_${file.name}`);
        onSave(editedFile, dataUrl);
    };

    const applyMagicFix = () => {
        setBrightness(110);
        setContrast(115);
        setSaturation(120);
    };

    return (
        <div className="fixed inset-0 z-[3000] bg-slate-950 flex flex-col animate-in fade-in">
            {/* HEADER */}
            <div className="flex justify-between items-center p-3 border-b border-slate-800 bg-[#020617] shrink-0">
                <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white"><X className="w-6 h-6"/></button>
                <h3 className="text-white font-bold uppercase tracking-widest text-xs md:text-sm">Modifica Scatto</h3>
                <button onClick={handleSave} className="text-emerald-500 font-bold uppercase text-xs flex items-center gap-1 bg-emerald-900/20 px-4 py-2 rounded-full border border-emerald-500/50">
                    <Check className="w-4 h-4"/> Fatto
                </button>
            </div>

            {/* CANVAS AREA - FLEXIBLE & CONTAINED */}
            <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center p-4">
                <div className={`relative ${showPreviewMode ? 'scale-90 shadow-2xl border-4 border-white/10 rounded-xl overflow-hidden' : ''} transition-all duration-300 max-h-full`}>
                    <canvas 
                        ref={canvasRef}
                        width={500} // Reduced base width
                        height={625} // Reduced base height (4:5 ratio preserved)
                        className="max-h-[60vh] md:max-h-[70vh] max-w-full object-contain cursor-move touch-none shadow-2xl bg-[#1a1a1a]"
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                    
                    {/* FEED CARD MOCKUP OVERLAY */}
                    {showPreviewMode && (
                        <div className="absolute inset-0 pointer-events-none border border-slate-800 rounded-xl z-20">
                            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur px-2 py-1 rounded-full text-white text-[10px] font-bold">❤️ 0</div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent pt-12">
                                <div className="h-2 w-24 bg-white/50 rounded mb-2"></div>
                                <div className="h-2 w-16 bg-white/30 rounded"></div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                     <button onClick={() => setShowPreviewMode(!showPreviewMode)} className={`p-3 rounded-full shadow-lg border transition-all ${showPreviewMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`} title="Anteprima Feed">
                        <Eye className="w-5 h-5"/>
                    </button>
                    <button onClick={applyMagicFix} className="p-3 bg-slate-800 border-slate-700 text-amber-500 rounded-full shadow-lg hover:text-white border hover:border-amber-500 transition-colors" title="Magic Fix">
                        <Wand2 className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* TOOLS PANEL - COMPACT */}
            <div className="bg-[#0f172a] border-t border-slate-800 p-4 pb-safe shrink-0">
                <div className="grid grid-cols-4 gap-4 mb-3">
                     <div className="flex flex-col items-center gap-1">
                        <ZoomIn className="w-4 h-4 text-slate-400"/>
                        <input type="range" min="0.5" max="3" step="0.1" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Sun className="w-4 h-4 text-slate-400"/>
                        <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"/>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Contrast className="w-4 h-4 text-slate-400"/>
                        <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"/>
                    </div>
                     <div className="flex flex-col items-center gap-1">
                        <Droplets className="w-4 h-4 text-slate-400"/>
                        <input type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                    </div>
                </div>
                
                <div className="flex justify-center gap-4">
                    <button onClick={() => setRotation(r => r - 90)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><RotateCw className="w-5 h-5 -scale-x-100"/></button>
                    <button onClick={() => setRotation(r => r + 90)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><RotateCw className="w-5 h-5"/></button>
                </div>
            </div>
        </div>
    );
};
