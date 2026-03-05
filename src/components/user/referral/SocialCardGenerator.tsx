
import React, { useRef, useEffect, useState } from 'react';
import { Download, Loader2, Share2, Check, Smartphone, Monitor } from 'lucide-react';
import { SocialTemplate, User } from '../../../types/index';
import { dataURLtoFile } from '../../../utils/common';

interface Props {
    template: SocialTemplate;
    user: User;
}

export const SocialCardGenerator = ({ template, user }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    // Check feature detection and device type
    const [isMobile, setIsMobile] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);

    const RENDER_SCALE = 2;

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024); // Simple breakpoint check
        check();
        window.addEventListener('resize', check);
        
        // Verifica supporto share API per FILE
        if (navigator.share && navigator.canShare) {
            setCanNativeShare(true);
        }

        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = template.bgUrl;

        img.onload = () => {
            canvas.width = 400 * RENDER_SCALE;
            canvas.height = 533 * RENDER_SCALE;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            const drawText = (key: 'userName' | 'referralCode', text: string) => {
                const style = template.layoutConfig[key];
                if (!style) return;

                ctx.save();
                const scaledX = style.x * RENDER_SCALE;
                const scaledY = style.y * RENDER_SCALE;
                const scaledFontSize = style.fontSize * RENDER_SCALE;

                ctx.font = `bold ${scaledFontSize}px ${style.fontFamily === 'serif' ? 'Playfair Display' : 'sans-serif'}`;
                ctx.fillStyle = style.color;
                ctx.textAlign = style.textAlign;
                
                if (style.shadowColor) {
                    ctx.shadowColor = style.shadowColor;
                    ctx.shadowBlur = (style.shadowBlur || 0) * RENDER_SCALE;
                    ctx.shadowOffsetX = 2 * RENDER_SCALE;
                    ctx.shadowOffsetY = 2 * RENDER_SCALE;
                }

                ctx.fillText(text, scaledX, scaledY);
                ctx.restore();
            };

            drawText('userName', user.name);
            drawText('referralCode', user.referralCode || 'CODICE');

            setImageLoaded(true);
            setPreviewUrl(canvas.toDataURL('image/jpeg', 0.7));
        };
    }, [template, user]);

    // LOGICA DI AZIONE (SMART)
    const handleAction = async (forcedAction?: 'download' | 'share') => {
        if (!canvasRef.current) return;
        setIsSharing(true);

        try {
            const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
            
            // AZIONE DOWNLOAD (Default su Desktop o fallback)
            if (forcedAction === 'download' || (!isMobile)) {
                const link = document.createElement('a');
                link.download = `touring_invite_${user.referralCode}.jpg`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } 
            // AZIONE SHARE (Solo Mobile supportato)
            else if (canNativeShare) {
                const fileName = `invite_${user.referralCode}.jpg`;
                const file = dataURLtoFile(dataUrl, fileName);
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Il mio invito Touring Diary',
                        text: `Usa il mio codice ${user.referralCode} per ottenere crediti extra!`,
                    });
                } else {
                    throw new Error("File sharing not supported");
                }
            } else {
                // Fallback se share non supportato su mobile
                const link = document.createElement('a');
                link.download = `touring_invite_${user.referralCode}.jpg`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (e) {
            console.warn("Share failed, falling back to download", e);
            // Ultimo tentativo download
            try {
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
                const link = document.createElement('a');
                link.download = `touring_invite_${user.referralCode}.jpg`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch(err) {
                alert("Impossibile completare l'azione.");
            }
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="flex flex-col gap-3 group">
            <canvas ref={canvasRef} className="hidden" />

            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-700 bg-slate-900 transition-all hover:shadow-2xl hover:border-indigo-500/50 hover:-translate-y-1">
                {previewUrl ? (
                    <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-auto object-cover aspect-[3/4]"
                    />
                ) : (
                    <div className="aspect-[3/4] w-full flex items-center justify-center bg-slate-800">
                        <Loader2 className="w-6 h-6 text-slate-500 animate-spin"/>
                    </div>
                )}

                {/* Overlay Action */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                     
                     {/* TASTO PRINCIPALE (Share su mobile, Download su Desktop) */}
                     <button 
                        onClick={() => handleAction()}
                        disabled={!imageLoaded || isSharing}
                        className={`
                            ${isMobile && canNativeShare ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-white hover:bg-slate-200 text-slate-900'} 
                            text-white font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 transform active:scale-95 transition-all text-xs uppercase tracking-wide border border-white/20
                        `}
                    >
                        {isSharing ? <Loader2 className="w-4 h-4 animate-spin"/> : (isMobile && canNativeShare) ? <Share2 className="w-4 h-4"/> : <Download className="w-4 h-4"/>}
                        {(isMobile && canNativeShare) ? 'Condividi' : 'Scarica'}
                    </button>

                    {/* TASTO SECONDARIO (Forza download su mobile se share fallisce o utente preferisce) */}
                    {isMobile && canNativeShare && (
                        <button 
                             onClick={() => handleAction('download')}
                             className="bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 border border-white/20"
                        >
                            <Download className="w-3 h-3"/> Salva Foto
                        </button>
                    )}
                </div>
                
                {/* Indicatore Tipo Device */}
                <div className="absolute top-2 right-2">
                    <div className="bg-black/60 backdrop-blur p-1.5 rounded-full text-white shadow-sm">
                        {isMobile ? <Smartphone className="w-3 h-3"/> : <Monitor className="w-3 h-3"/>}
                    </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                     <p className="text-white text-xs font-bold truncate">{template.name}</p>
                </div>
            </div>
        </div>
    );
};
