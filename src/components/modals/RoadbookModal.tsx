import React, { useState, useEffect } from 'react';
import { X, Printer, Loader2, Download, AlertTriangle, Sparkles } from 'lucide-react';
import { useItinerary } from '@/context/ItineraryContext';
import { pdf } from '@react-pdf/renderer';
import FileSaver from 'file-saver';
import { RoadbookDocument } from '../pdf/RoadbookDocument';
import { prepareItineraryForPdf } from '../../utils/pdfUtils';
import { ExportLogo } from '../export/ExportLogo';
import { useLogoRasterizer } from '../../hooks/useLogoRasterizer';

interface RoadbookModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RoadbookModal = ({ isOpen, onClose }: RoadbookModalProps) => {
    const { itinerary } = useItinerary();
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const logoBase64 = useLogoRasterizer(ExportLogo, 300, 52);

    const handleDownload = async () => {
        if (!itinerary || !logoBase64) return;

        setIsGenerating(true);
        setError(null);

        try {
            const coverUrl = itinerary.items[0]?.poi?.imageUrl || '';
            
            const preparedDoc = await prepareItineraryForPdf(
                itinerary,
                coverUrl,
                { includePhotos: true, includeQr: true },
                () => {} // No progress update needed here
            );

            const blob = await pdf(
                <RoadbookDocument 
                    itinerary={preparedDoc}
                    logoBase64={logoBase64}
                />
            ).toBlob();

            FileSaver.saveAs(blob, `Roadbook_${itinerary.name || 'Viaggio'}.pdf`);

        } catch (e: any) {
            console.error("Roadbook Generation Error", e);
            setError("Si è verificato un errore durante la generazione del roadbook. Riprova.");
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 max-w-lg w-full rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden relative p-8 text-center items-center">
                
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors z-10">
                    <X className="w-5 h-5"/>
                </button>

                <div className="p-4 bg-amber-500/10 border-4 border-amber-500/20 rounded-full mb-6">
                     <Sparkles className="w-12 h-12 text-amber-400"/>
                </div>

                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wide mb-2">Roadbook AI</h2>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                    Genera una versione speciale del tuo diario, ottimizzata per la stampa e la consultazione offline, con mappe e informazioni essenziali.
                </p>

                {error && (
                    <div className="w-full bg-red-900/50 border border-red-700 rounded-lg p-3 text-sm text-red-300 font-medium flex items-center gap-3 mb-6">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <button 
                    onClick={handleDownload} 
                    disabled={isGenerating || !logoBase64} 
                    className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-black text-base uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    {isGenerating ? <Loader2 className="w-6 h-6 animate-spin"/> : <Download className="w-6 h-6"/>}
                    {isGenerating ? 'Creazione in corso...' : 'Scarica Roadbook PDF'}
                </button>
            </div>
        </div>
    );
};
