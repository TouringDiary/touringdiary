
import React, { useRef, useEffect, useState } from 'react';
import { SocialLayoutConfig } from '../../../types/models/Social';

interface Props {
    bgUrl: string;
    layout: SocialLayoutConfig;
    onLayoutChange: (newLayout: SocialLayoutConfig) => void;
    width?: number;
    height?: number;
}

export const SocialCanvas = ({ bgUrl, layout, onLayoutChange, width = 400, height = 533 }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [dragging, setDragging] = useState<'userName' | 'referralCode' | null>(null);
    const [fontsLoaded, setFontsLoaded] = useState(false);

    // Carica immagine
    useEffect(() => {
        const img = new Image();
        img.src = bgUrl;
        img.crossOrigin = "anonymous";
        img.onload = () => setImage(img);
    }, [bgUrl]);

    // Check Fonts Loading
    useEffect(() => {
        // Attende che i font web (Playfair, Lato, ecc.) siano pronti
        document.fonts.ready.then(() => {
            setFontsLoaded(true);
        });
    }, []);

    // Disegna Canvas
    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Reset completo del contesto
        ctx.clearRect(0, 0, width, height);
        
        // Draw Background
        if (image) {
            // Cover fit logic
            const scale = Math.max(width / image.width, height / image.height);
            const x = (width / 2) - (image.width / 2) * scale;
            const y = (height / 2) - (image.height / 2) * scale;
            ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
        } else {
            // Placeholder
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText('Caricamento...', width / 2, height / 2);
        }

        // Helper text drawer
        const drawTextObj = (key: 'userName' | 'referralCode', placeholder: string) => {
            const style = layout[key];
            
            ctx.save(); // Salva lo stato attuale (senza ombre/colori)
            
            ctx.font = `${style.fontSize}px ${style.fontFamily === 'serif' ? 'Playfair Display' : 'Lato'}`;
            ctx.textAlign = style.textAlign;
            
            // Applica Ombra
            if (style.shadowColor && style.shadowBlur && style.shadowBlur > 0) {
                ctx.shadowColor = style.shadowColor;
                ctx.shadowBlur = style.shadowBlur;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            } else {
                // Reset ombra esplicito
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }

            // Applica Colore
            ctx.fillStyle = style.color; 
            
            // Disegna il testo
            ctx.fillText(placeholder, style.x, style.y);
            
            // Restore per rimuovere ombra/colore prima di disegnare box selezione
            ctx.restore(); 

            // Draw selection box if dragging
            if (dragging === key) {
                ctx.save();
                const metrics = ctx.measureText(placeholder);
                const h = style.fontSize; 
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 2]);
                ctx.strokeRect(
                    style.x - (style.textAlign === 'center' ? metrics.width/2 : 0), 
                    style.y - h, 
                    metrics.width, 
                    h * 1.2
                );
                ctx.restore();
            }
        };

        // Disegna solo se i font sono pronti per evitare glitch
        if (fontsLoaded) {
            drawTextObj('userName', 'Mario Rossi');
            drawTextObj('referralCode', 'MARIO-X92');
        }
    };

    useEffect(() => {
        requestAnimationFrame(draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image, dragging, width, height, fontsLoaded, JSON.stringify(layout)]); 
    // JSON.stringify(layout) forza il re-render anche se il riferimento oggetto è ambiguo

    // Mouse Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const distUser = Math.hypot(mouseX - layout.userName.x, mouseY - layout.userName.y);
        const distCode = Math.hypot(mouseX - layout.referralCode.x, mouseY - layout.referralCode.y);
        
        // Threshold aumentata per facilitare la selezione
        if (distUser < 50) setDragging('userName');
        else if (distCode < 50) setDragging('referralCode');
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        onLayoutChange({
            ...layout,
            [dragging]: { ...layout[dragging], x, y }
        });
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    return (
        <canvas 
            ref={canvasRef} 
            width={width} 
            height={height}
            className="rounded-xl shadow-2xl border-4 border-slate-800 cursor-pointer touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
};
