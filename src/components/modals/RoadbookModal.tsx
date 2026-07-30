import React, { useState, useMemo } from 'react';
import { Loader2, Download, AlertTriangle, Sparkles, Zap, Info, Wand2, Euro } from 'lucide-react';
import { useItinerary } from '@/context/ItineraryContext';
import { useUser } from '@/context/UserContext';
import FileSaver from 'file-saver';
import { prepareItineraryForPdf } from '../../utils/pdfUtils';
import { ensureNodePdfPolyfills } from '../../utils/ensureNodePdfPolyfills';
import { useLogoRasterizer } from '../../hooks/useLogoRasterizer';
import { BaseFullscreenModalShell } from '@/components/modals/shell/BaseFullscreenModalShell';
import { generateRoadbook } from '@/services/ai/aiPlanner';
import { aiErrorUserMessage, isAiEdgeError } from '@/services/ai/aiEdgeErrors';
import { getAiRuntimeStatus } from '@/services/ai/aiRuntimeStatus';
import { AiRuntimeBanner } from '@/components/ai/AiRuntimeBanner';
import { usePlatformControl } from '@/context/PlatformControlContext';

interface RoadbookModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RoadbookModal = ({ isOpen, onClose }: RoadbookModalProps) => {
    const { itinerary, setItinerary } = useItinerary();
    const { user } = useUser();
    // We subscribe to PlatformControlContext updates (schedule-bound `evaluationNowMs`)
    // to keep `getAiRuntimeStatus`-driven gating fresh, even when we don't use the value directly.
    usePlatformControl();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [forcedModel, setForcedModel] = useState<'flash' | 'pro' | null>(null);

    const logoBase64 = useLogoRasterizer();

    const daysCount = useMemo(() => {
        if (!itinerary.startDate || !itinerary.endDate) return 0;
        const start = new Date(itinerary.startDate);
        const end = new Date(itinerary.endDate);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, [itinerary.startDate, itinerary.endDate]);

    const suggestedModel = daysCount <= 2 ? 'flash' : 'pro';
    const activeModel = forcedModel || suggestedModel;
    const hasRoadbook = itinerary.roadbook && itinerary.roadbook.length > 0;
    const aiRuntimeStatus = getAiRuntimeStatus({
        userRole: user?.role ?? null,
        isAuthenticated: Boolean(user && user.role !== 'guest'),
    });
    const aiBlocked = !aiRuntimeStatus.available;

    const handleGenerateAiRoadbook = async () => {
        if (!itinerary.items || itinerary.items.length === 0) return;
        if (isGeneratingAi || aiBlocked) return;

        setIsGeneratingAi(true);
        setError(null);

        try {
            const cityName = itinerary.name.split(' a ')[1] || 'tua destinazione';
            const aiRoadbook = await generateRoadbook(itinerary.items, cityName, activeModel);
            
            if (!aiRoadbook || aiRoadbook.length === 0) {
                throw new Error("L'AI non ha prodotto segmenti validi per il roadbook.");
            }

            setItinerary(prev => ({
                ...prev,
                roadbook: aiRoadbook
            }));

        } catch (e: unknown) {
            console.error("AI Roadbook Error", e);
            if (isAiEdgeError(e)) {
                setError(e.message);
            } else {
                setError(aiErrorUserMessage(e, "Errore durante la generazione AI del roadbook."));
            }
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const handleDownload = async () => {
        if (!itinerary || isGeneratingPdf || isGeneratingAi) return;

        setIsGeneratingPdf(true);
        setError(null);
        setProgress(5);

        try {
            const preparedDoc = await prepareItineraryForPdf(
                itinerary,
                { includePhotos: true, includeQr: true },
                (p) => setProgress(p)
            );
            await ensureNodePdfPolyfills();
            const [{ pdf }, { RoadbookDocument }] = await Promise.all([
                import('@react-pdf/renderer'),
                import('../pdf/RoadbookDocument'),
            ]);

            const blob = await pdf(
                <RoadbookDocument 
                    itinerary={preparedDoc}
                    logoBase64={logoBase64 || ''} 
                    roadbook={itinerary.roadbook || []}
                    activeCityName={preparedDoc.formattedCityList || ''}
                    summaryData={preparedDoc.citiesInfo || []}
                />
            ).toBlob();

            if (!blob) throw new Error("Errore durante la creazione del file binario PDF.");

            FileSaver.saveAs(blob, `Roadbook_${itinerary.name || 'Viaggio'}.pdf`);

        } catch (e: any) {
            console.error("Roadbook PDF Error", e);
            setError("Impossibile completare l'export PDF. Verifica la connessione e riprova.");
        } finally {
            setIsGeneratingPdf(false);
            setProgress(0);
        }
    };

    const header = (
        <div className="p-8 md:p-10 text-center border-b border-slate-800">
            <div className="inline-flex p-4 bg-amber-500/10 border-4 border-amber-500/20 rounded-[2rem] mb-6">
                 <Sparkles className="w-12 h-12 text-amber-400"/>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Roadbook Intelligence</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                Trasforma il tuo itinerario in una guida professionale con logistica avanzata, consigli di viaggio e costi stimati.
            </p>
        </div>
    );

    return (
        <BaseFullscreenModalShell
            isOpen={isOpen}
            onClose={onClose}
            header={header}
            maxWidth="4xl"
            fullHeight={false}
            panelClassName="max-w-2xl md:max-h-[92vh]"
            padding="p-0 md:p-4"
        >
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar">
                {aiBlocked && <AiRuntimeBanner status={aiRuntimeStatus} className="mb-4" />}

                <div className={`p-6 rounded-[2rem] border transition-all ${hasRoadbook ? 'bg-slate-950/50 border-slate-800 opacity-60' : 'bg-indigo-950/20 border-indigo-500/30 shadow-xl shadow-indigo-500/5'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-2xl">
                                <Wand2 className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div className="text-left">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Generazione AI</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Analisi logistica avanzata</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => setForcedModel('flash')}
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${activeModel === 'flash' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            >
                                Flash
                            </button>
                            <button 
                                type="button"
                                onClick={() => setForcedModel('pro')}
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${activeModel === 'pro' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            >
                                Pro
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/50 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {activeModel === 'flash' ? (
                                <Zap className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                            )}
                            <div className="text-left">
                                <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                    {activeModel === 'flash' ? 'Gemini 2.0 Flash' : 'Gemini 2.0 Pro'}
                                </span>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">
                                    {activeModel === 'flash' ? 'Veloce • Ideale per brevi viaggi' : 'Analisi Profonda • Massima Qualità'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800">
                            <Euro size={10} className="text-amber-500" />
                            <span className="text-[10px] font-black text-amber-500">{activeModel === 'flash' ? '1' : '5'} CREDITI</span>
                        </div>
                    </div>

                    <button 
                        type="button"
                        onClick={handleGenerateAiRoadbook}
                        disabled={isGeneratingAi || isGeneratingPdf || aiBlocked}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${hasRoadbook || aiBlocked ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white hover:bg-indigo-50 text-slate-950 shadow-xl active:scale-95'}`}
                    >
                        {isGeneratingAi ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                        {aiBlocked ? (aiRuntimeStatus.title || 'AI non disponibile') : hasRoadbook ? 'Roadbook già generato' : isGeneratingAi ? 'Generazione in corso...' : 'Genera Logistica AI'}
                    </button>
                </div>

                <div className="relative">
                    <button 
                        type="button"
                        onClick={handleDownload} 
                        disabled={isGeneratingPdf || isGeneratingAi || !hasRoadbook} 
                        className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${hasRoadbook ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xl shadow-amber-500/20 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                    >
                        {isGeneratingPdf ? <Loader2 size={20} className="animate-spin"/> : <Download size={20}/>}
                        {isGeneratingPdf ? `Export ${progress}%...` : 'Scarica Roadbook PDF'}
                    </button>
                    
                    {isGeneratingPdf && (
                        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                    )}
                </div>

                {!hasRoadbook && (
                    <div className="flex items-center gap-2 justify-center text-slate-600">
                        <Info size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Genera prima la logistica AI per attivare il PDF</span>
                    </div>
                )}

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3 text-rose-500 text-[10px] font-bold uppercase">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}
            </div>
        </BaseFullscreenModalShell>
    );
};
