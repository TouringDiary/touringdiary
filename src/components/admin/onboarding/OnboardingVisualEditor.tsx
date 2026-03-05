
import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Move, Monitor, Smartphone, MousePointer2, ArrowUp, EyeOff, Grid, Target, Scan, Image as ImageIcon, Upload, Loader2, Link as LinkIcon, ChevronDown, CornerLeftUp, CornerRightUp, CornerLeftDown, CornerRightDown } from 'lucide-react';
import { SystemMessageTemplate, BubbleArrowDirection, UiConfig } from '../../../services/communicationService';
import { getBubbleArrowClass } from '../../../components/layout/OnboardingWizard';
import { uploadPublicMedia } from '../../../services/mediaService';
import { compressImage, dataURLtoFile } from '../../../utils/common';
import { useDynamicStyles } from '../../../hooks/useDynamicStyles'; 
import { CONFIG } from '../../../config/env';
import { MascotSvg } from '../../common/MascotSvg';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    template: SystemMessageTemplate;
    onSavePosition: (config: UiConfig) => void;
}

// Lista ID Comuni per facilitare l'Admin (AGGIORNATA PER MOBILE)
const COMMON_TARGET_IDS = [
    { id: 'tour-header-container', label: 'Header (Logo/Titolo)' },
    { id: 'tour-trigger-button', label: 'Menu/Aiuto (Top Right)' },
    { id: 'tour-search-section', label: 'Box Ricerca (Hero)' },
    
    // Desktop Specific
    { id: 'tour-sidebar', label: 'Sidebar (Desktop Only)' },
    { id: 'tour-toggle-sidebar', label: 'Tasto Diario (Desktop)' },
    
    // Mobile Specific
    { id: 'tour-mobile-nav', label: 'Navbar Basso (Mobile)' },
    { id: 'tour-mobile-diary-btn', label: 'Bottone Diario (Mobile Floating)' },
    { id: 'tour-mobile-diary-overlay', label: 'Diario Aperto (Mobile Overlay)' },
    
    // Content Areas
    { id: 'tour-featured-section', label: 'Sezione In Evidenza (Card)' },
    { id: 'tour-most-visited-section', label: 'Sezione Più Visitate (Card)' }, // NEW ID
    { id: 'tour-categories-section', label: 'Sezione Categorie' },
    { id: 'tour-ai-button', label: 'Box AI' },
    { id: 'tour-partners', label: 'Sezione Partner' }
];

export const OnboardingVisualEditor = ({ isOpen, onClose, template, onSavePosition }: Props) => {
    const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop'); 
    const [hideUI, setHideUI] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    // Scale for responsive view
    const [viewScale, setViewScale] = useState(1);
    
    // CONNECT TO DESIGN SYSTEM (DYNAMIC STYLES)
    // Passiamo isMobile = true/false in base al viewport selezionato nell'editor
    const isMobileSimulated = viewport === 'mobile';
    const titleStyle = useDynamicStyles('onboarding_title', isMobileSimulated);
    const textStyle = useDynamicStyles('onboarding_text', isMobileSimulated);
    const btnStyle = useDynamicStyles('onboarding_btn', isMobileSimulated);

    // Initial Defaults - FIXED: Default active=true for better UX
    const [desktopConfig, setDesktopConfig] = useState({ 
        mascot: { x: 50, y: 50 }, 
        bubble: { x: 50, y: 30 }, 
        arrow: 'bottom' as BubbleArrowDirection,
        targetBox: { x: 50, y: 50, w: 100, h: 50, active: true },
        targetId: ''
    });
    const [mobileConfig, setMobileConfig] = useState({ 
        mascot: { x: 50, y: 50 }, 
        bubble: { x: 50, y: 30 }, 
        arrow: 'top' as BubbleArrowDirection,
        targetBox: { x: 50, y: 50, w: 100, h: 50, active: true },
        targetId: ''
    });
    
    // CUSTOM BACKGROUND STATE (SEPARATI PER DEVICE)
    const [desktopBg, setDesktopBg] = useState<string | null>(null);
    const [mobileBg, setMobileBg] = useState<string | null>(null);
    
    // Riferimenti temporanei
    const bgInputRef = useRef<HTMLInputElement>(null);
    const [draggingTarget, setDraggingTarget] = useState<'mascot' | 'bubble' | 'targetBox' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load Config
    useEffect(() => {
        if (isOpen && template.uiConfig) {
            const defaults = {
                mascot: { x: 50, y: 50 }, 
                bubble: { x: 50, y: 30 }, 
                arrowDirection: 'bottom' as BubbleArrowDirection,
                targetBox: { x: 50, y: 50, w: 100, h: 50, active: true },
                targetId: ''
            };

            const dConfig = template.uiConfig.desktop || template.uiConfig.mascot ? {
                mascot: template.uiConfig.desktop?.mascot || template.uiConfig.mascot || defaults.mascot,
                bubble: template.uiConfig.desktop?.bubble || template.uiConfig.bubble || defaults.bubble,
                arrow: template.uiConfig.desktop?.arrowDirection || template.uiConfig.arrowDirection || 'bottom',
                targetBox: template.uiConfig.desktop?.targetBox || defaults.targetBox,
                targetId: template.uiConfig.desktop?.targetId || ''
            } : null;

            const mConfig = template.uiConfig.mobile ? {
                mascot: template.uiConfig.mobile.mascot,
                bubble: template.uiConfig.mobile.bubble,
                arrow: template.uiConfig.mobile.arrowDirection || 'top',
                targetBox: template.uiConfig.mobile.targetBox || { ...defaults.targetBox, w: 80, h: 40 },
                targetId: template.uiConfig.mobile.targetId || ''
            } : null;

            if (dConfig) setDesktopConfig(dConfig);
            if (mConfig) setMobileConfig(mConfig);
            
            // CARICA SFONDI ESISTENTI SE PRESENTI NEL JSON
            const dBg = (template.uiConfig.desktop as any)?.bgImage || (template.uiConfig as any).bgImage;
            const mBg = (template.uiConfig.mobile as any)?.bgImage;
            
            if (dBg) setDesktopBg(dBg);
            if (mBg) setMobileBg(mBg);
        }
    }, [isOpen, template]);
    
    // Responsive Scaling Logic
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            
            if (viewport === 'mobile') {
                const idealWidth = 420; 
                if (width < idealWidth) {
                    setViewScale(width / idealWidth);
                } else {
                    setViewScale(1);
                }
            } else {
                setViewScale(1);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [viewport]);

    const activeConfig = viewport === 'desktop' ? desktopConfig : mobileConfig;
    const currentBg = viewport === 'desktop' ? desktopBg : mobileBg;
    
    const setActiveConfig = (updates: Partial<typeof desktopConfig>) => {
        if (viewport === 'desktop') setDesktopConfig(prev => ({ ...prev, ...updates }));
        else setMobileConfig(prev => ({ ...prev, ...updates }));
    };

    const handleTargetIdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newId = e.target.value;
        setActiveConfig({ 
            targetId: newId,
            // AUTO-ENABLE BOX IF ID IS SELECTED
            targetBox: { ...activeConfig.targetBox, active: !!newId } 
        });
    };

    const handleSave = async () => {
        const fullConfig: any = {
            desktop: { 
                mascot: desktopConfig.mascot, 
                bubble: desktopConfig.bubble, 
                arrowDirection: desktopConfig.arrow, 
                targetBox: desktopConfig.targetBox,
                targetId: desktopConfig.targetId,
                bgImage: desktopBg 
            },
            mobile: { 
                mascot: mobileConfig.mascot, 
                bubble: mobileConfig.bubble, 
                arrowDirection: mobileConfig.arrow, 
                targetBox: mobileConfig.targetBox,
                targetId: mobileConfig.targetId,
                bgImage: mobileBg 
            },
            mascot: desktopConfig.mascot, 
            bubble: desktopConfig.bubble, 
            arrowDirection: desktopConfig.arrow,
            bgImage: desktopBg
        };
        
        onSavePosition(fullConfig);
        onClose();
    };
    
    const handleMouseDown = (e: React.MouseEvent, target: 'mascot' | 'bubble' | 'targetBox') => {
        e.stopPropagation();
        setDraggingTarget(target);
    };

    const handleMouseUp = () => {
        setDraggingTarget(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingTarget || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        
        // Calcolo Percentuale (0-100%) - Adjusted for scaling
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));
        
        if (draggingTarget === 'mascot') setActiveConfig({ mascot: { x: clampedX, y: clampedY } });
        else if (draggingTarget === 'bubble') setActiveConfig({ bubble: { x: clampedX, y: clampedY } });
        else if (draggingTarget === 'targetBox') setActiveConfig({ targetBox: { ...activeConfig.targetBox, x: clampedX, y: clampedY } });
    };

    const handleTargetSizeChange = (dim: 'w' | 'h', val: number) => {
        setActiveConfig({ targetBox: { ...activeConfig.targetBox, [dim]: val } });
    };

    const toggleTargetActive = () => {
        setActiveConfig({ targetBox: { ...activeConfig.targetBox, active: !activeConfig.targetBox.active } });
    };

    const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const compressedBase64 = await compressImage(file);
            const fileToUpload = dataURLtoFile(compressedBase64, `bg_${viewport}_${Date.now()}.jpg`);
            const uploadedUrl = await uploadPublicMedia(fileToUpload, 'onboarding_assets');
            
            if (uploadedUrl) {
                if (viewport === 'desktop') setDesktopBg(uploadedUrl);
                else setMobileBg(uploadedUrl);
            } else {
                alert("Upload fallito.");
            }
        } catch (error: any) {
            alert(`Errore: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (bgInputRef.current) bgInputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    const ArrowBtn = ({ dir, rotate, icon: Icon = ArrowUp }: { dir: BubbleArrowDirection, rotate?: string, icon?: any }) => (
        <button 
            onClick={() => setActiveConfig({ arrow: dir })} 
            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${activeConfig.arrow === dir ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-indigo-300' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-white'}`}
            title={dir}
        >
            <Icon className={`w-3 h-3 ${rotate || ''}`}/> 
        </button>
    );

    const bubbleWidthClass = viewport === 'desktop' ? 'w-96' : 'w-[80%] max-w-[280px]';

    return (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col animate-in fade-in select-none">
            
            {/* CANVAS LAYER */}
            <div 
                className={`relative flex-1 overflow-hidden bg-[#0a0a0a] ${viewport === 'mobile' ? 'flex items-center justify-center' : ''}`}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: draggingTarget ? 'grabbing' : 'default' }}
            >
                {/* CONTAINER SIMULATO */}
                <div 
                    ref={containerRef}
                    className={`relative overflow-hidden shadow-2xl transition-all duration-300 bg-white ${
                        viewport === 'desktop' 
                        ? 'w-full h-full' 
                        : 'w-[375px] h-[812px] rounded-[3rem] border-[8px] border-slate-800 ring-4 ring-white/10' 
                    }`}
                    style={viewport === 'mobile' ? { transform: `scale(${viewScale})` } : {}}
                >
                    {/* BACKGROUND IMAGE (Viewport Specific) */}
                    <div className="absolute inset-0 pointer-events-none select-none z-0">
                         {currentBg ? (
                            <img 
                                src={currentBg} 
                                className="w-full h-full object-cover" 
                                alt={`${viewport} background`}
                            />
                         ) : (
                            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-600">
                                <ImageIcon className="w-16 h-16 mb-4 opacity-50"/>
                                <p className="text-sm font-bold uppercase">Nessuno sfondo {viewport}</p>
                                <p className="text-xs opacity-70">Usa "Carica Sfondo" in alto</p>
                            </div>
                         )}
                         <div className="absolute inset-0 bg-black/10"></div>
                    </div>

                    {/* TARGET BOX */}
                    {activeConfig.targetBox.active && (
                        <div 
                            className="absolute z-20 cursor-move border-4 border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.5)] animate-pulse rounded-xl group"
                            style={{ 
                                top: `${activeConfig.targetBox.y}%`, 
                                left: `${activeConfig.targetBox.x}%`, 
                                width: `${activeConfig.targetBox.w}px`, 
                                height: `${activeConfig.targetBox.h}px`, 
                                transform: 'translate(-50%, -50%)' 
                            }}
                            onMouseDown={(e) => handleMouseDown(e, 'targetBox')}
                        >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Target Area</div>
                        </div>
                    )}

                    {/* GUIDES & CONNECTOR */}
                    <div className="absolute inset-0 pointer-events-none opacity-10 z-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-50">
                        <line x1={`${activeConfig.mascot.x}%`} y1={`${activeConfig.mascot.y}%`} x2={`${activeConfig.bubble.x}%`} y2={`${activeConfig.bubble.y}%`} stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5"/>
                    </svg>

                    {/* MASCOTTE */}
                    <div 
                        className="absolute cursor-move flex flex-col items-center group z-30 hover:scale-110 transition-transform"
                        style={{ 
                            top: `${activeConfig.mascot.y}%`, 
                            left: `${activeConfig.mascot.x}%`, 
                            transform: 'translate(-50%, -50%)', 
                            width: viewport === 'mobile' ? '80px' : '120px', 
                            height: viewport === 'mobile' ? '80px' : '120px' 
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'mascot')}
                    >
                         <MascotSvg className="w-full h-full" />
                    </div>

                    {/* FUMETTO - USING DYNAMIC STYLES */}
                    <div 
                         className={`absolute bg-white text-slate-800 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-2xl z-40 border-2 md:border-4 border-white ring-2 md:ring-4 ring-indigo-500/10 cursor-move group ${bubbleWidthClass}`}
                         style={{ 
                             top: `${activeConfig.bubble.y}%`, 
                             left: `${activeConfig.bubble.x}%`, 
                             transform: 'translate(-50%, -50%)' 
                         }}
                         onMouseDown={(e) => handleMouseDown(e, 'bubble')}
                    >
                        <div className={`absolute w-4 h-4 md:w-6 md:h-6 bg-white border-l border-t border-slate-100 ${getBubbleArrowClass(activeConfig.arrow)}`}></div>
                        
                        {/* TITLE WITH DYNAMIC STYLE */}
                        <h3 className={titleStyle || 'font-display font-black text-indigo-600 text-2xl leading-none tracking-tight mb-2'}>
                            {template.titleTemplate || 'Titolo Step'}
                        </h3>
                        
                        {/* TEXT WITH DYNAMIC STYLE */}
                        <p className={`${textStyle || 'text-slate-600 leading-relaxed font-medium'} mb-4 whitespace-pre-line`}>
                            {template.bodyTemplate || 'Contenuto del messaggio.'}
                        </p>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <span className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Step 1/5</span>
                            
                            {/* BUTTON WITH DYNAMIC STYLE (Merged with structure) */}
                            <div className={`bg-indigo-600 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl shadow-lg uppercase tracking-wide flex items-center justify-center ${btnStyle || 'text-[10px] md:text-xs font-bold text-white'}`}>
                                AVANTI
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* HEADER TOOLS */}
            <div className={`absolute top-0 left-0 right-0 z-50 transition-transform duration-300 ${hideUI ? '-translate-y-full' : 'translate-y-0'}`}>
                <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-2 md:p-3 shadow-2xl flex flex-col gap-3 overflow-x-auto">
                    
                    <div className="flex w-full items-center justify-between gap-2 px-2 flex-wrap md:flex-nowrap">
                        <div className="flex items-center gap-3">
                            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                                <button onClick={() => setViewport('desktop')} className={`p-2 rounded ${viewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Monitor className="w-4 h-4"/></button>
                                <button onClick={() => setViewport('mobile')} className={`p-2 rounded ${viewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Smartphone className="w-4 h-4"/></button>
                            </div>

                            <button onClick={() => bgInputRef.current?.click()} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-[10px] font-bold uppercase tracking-wide ${currentBg ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'}`}>
                                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Upload className="w-3.5 h-3.5"/>} {currentBg ? 'Cambia' : 'Carica Sfondo'}
                            </button>
                            <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} disabled={isUploading} />
                        </div>

                         <div className="flex gap-2 ml-auto">
                            <button onClick={() => setHideUI(true)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-700 hidden md:block" title="Nascondi UI"><EyeOff className="w-4 h-4"/></button>
                            <button onClick={onClose} disabled={isUploading} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase hover:text-white transition-colors border border-slate-700">Annulla</button>
                            <button onClick={handleSave} disabled={isUploading} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg hover:bg-emerald-500 flex items-center gap-2 transition-all active:scale-95 border border-emerald-500 disabled:opacity-50">
                                <Save className="w-4 h-4"/> Salva
                            </button>
                        </div>
                    </div>
                    
                    <div className="w-full flex flex-col md:flex-row items-center gap-4 bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 flex-1 w-full">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2 hidden md:block">Target ID:</label>
                            <div className="relative group flex-1">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"/>
                                {/* UPDATED INPUT HANDLER */}
                                <input type="text" value={activeConfig.targetId || ''} onChange={handleTargetIdChange} placeholder="Inserisci ID HTML Elemento..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"/>
                                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                     {/* UPDATED SELECT HANDLER */}
                                     <select onChange={handleTargetIdChange} className="w-6 h-6 opacity-0 absolute inset-0 cursor-pointer" value="">
                                         <option value="">Seleziona ID...</option>
                                         {COMMON_TARGET_IDS.map(t => <option key={t.id} value={t.id}>{t.label} ({t.id})</option>)}
                                     </select>
                                     <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none"/>
                                </div>
                            </div>
                        </div>

                        <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

                        <div className="flex items-center gap-2 justify-between w-full md:w-auto">
                             <button onClick={toggleTargetActive} className={`p-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 ${activeConfig.targetBox.active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-700'}`}>
                                <Target className="w-3.5 h-3.5"/> Box
                            </button>
                            
                            {activeConfig.targetBox.active && (
                                <div className="flex items-center gap-1">
                                    <input type="number" value={activeConfig.targetBox.w} onChange={(e) => handleTargetSizeChange('w', parseInt(e.target.value))} className="w-10 bg-slate-900 border border-slate-700 rounded text-center text-white text-[10px] py-1" />
                                    <span className="text-slate-600 text-[10px]">x</span>
                                    <input type="number" value={activeConfig.targetBox.h} onChange={(e) => handleTargetSizeChange('h', parseInt(e.target.value))} className="w-10 bg-slate-900 border border-slate-700 rounded text-center text-white text-[10px] py-1" />
                                </div>
                            )}
                            
                            {/* GRIGLIA FRECCE (Tutte le direzioni) */}
                            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded border border-slate-800">
                                <ArrowBtn dir="top-start" icon={CornerLeftUp} />
                                <ArrowBtn dir="top" rotate="" />
                                <ArrowBtn dir="top-end" icon={CornerRightUp} />
                                
                                <ArrowBtn dir="left" rotate="-rotate-90" />
                                <div className="w-6 h-6 flex items-center justify-center"><Grid className="w-3 h-3 text-slate-700"/></div>
                                <ArrowBtn dir="right" rotate="rotate-90" />
                                
                                <ArrowBtn dir="bottom-start" icon={CornerLeftDown} />
                                <ArrowBtn dir="bottom" rotate="rotate-180" />
                                <ArrowBtn dir="bottom-end" icon={CornerRightDown} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {hideUI && (
                <button onClick={() => setHideUI(false)} className="absolute top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs uppercase animate-pulse border-2 border-white/20">
                    Mostra Strumenti
                </button>
            )}
        </div>
    );
};
