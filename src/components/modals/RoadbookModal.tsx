import FileSaver from 'file-saver';
import {
  AlertTriangle,
  Bus,
  Coins,
  Download,
  Euro,
  Footprints,
  Info,
  Landmark,
  Loader2,
  Music,
  PieChart,
  Receipt,
  Route,
  ShoppingBag,
  Sparkles,
  Sun,
  Ticket,
  Utensils,
  Wand2,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AiRuntimeBanner } from '@/components/ai/AiRuntimeBanner';
import { BaseFullscreenModalShell } from '@/components/modals/shell/BaseFullscreenModalShell';
import { useItinerary } from '@/context/ItineraryContext';
import { usePlatformControl } from '@/context/PlatformControlContext';
import { useUser } from '@/context/UserContext';
import { computeRoadbookSummary, formatRoadbookDuration } from '@/domain/diary/roadbookSummary';
import { aiErrorUserMessage, isAiEdgeError } from '@/services/ai/aiEdgeErrors';
import { generateRoadbook } from '@/services/ai/aiPlanner';
import { getAiRuntimeStatus } from '@/services/ai/aiRuntimeStatus';
import { useLogoRasterizer } from '../../hooks/useLogoRasterizer';
import { ensureNodePdfPolyfills } from '../../utils/ensureNodePdfPolyfills';
import { prepareItineraryForPdf } from '../../utils/pdfUtils';

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

  const summary = useMemo(
    () => computeRoadbookSummary(itinerary.roadbook, itinerary.items),
    [itinerary.roadbook, itinerary.items],
  );

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

      setItinerary((prev) => ({
        ...prev,
        roadbook: aiRoadbook,
      }));
    } catch (e: unknown) {
      console.error('AI Roadbook Error', e);
      if (isAiEdgeError(e)) {
        setError(e instanceof Error ? e.message : String(e));
      } else {
        setError(aiErrorUserMessage(e, 'Errore durante la generazione AI del roadbook.'));
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
        (p) => setProgress(p),
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
          summaryData={summary}
        />,
      ).toBlob();

      if (!blob) throw new Error('Errore durante la creazione del file binario PDF.');

      FileSaver.saveAs(blob, `Roadbook_${itinerary.name || 'Viaggio'}.pdf`);
    } catch (e: unknown) {
      console.error('Roadbook PDF Error', e);
      setError("Impossibile completare l'export PDF. Verifica la connessione e riprova.");
    } finally {
      setIsGeneratingPdf(false);
      setProgress(0);
    }
  };

  const header = (
    <div className="p-8 md:p-10 text-center border-b border-slate-800">
      <div className="inline-flex p-4 bg-amber-500/10 border-4 border-amber-500/20 rounded-[2rem] mb-6">
        <Sparkles className="w-12 h-12 text-amber-400" />
      </div>
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
        Roadbook Intelligence
      </h2>
      <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
        Trasforma il tuo itinerario in una guida professionale con logistica avanzata, consigli di
        viaggio e costi stimati.
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

        <div
          className={`p-6 rounded-[2rem] border transition-all ${hasRoadbook ? 'bg-slate-950/50 border-slate-800 opacity-60' : 'bg-indigo-950/20 border-indigo-500/30 shadow-xl shadow-indigo-500/5'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-2xl">
                <Wand2 className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-white uppercase tracking-widest">
                  Generazione AI
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                  Analisi logistica avanzata
                </p>
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
                  {activeModel === 'flash'
                    ? 'Veloce • Ideale per brevi viaggi'
                    : 'Analisi Profonda • Massima Qualità'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800">
              <Euro size={10} className="text-amber-500" />
              <span className="text-[10px] font-black text-amber-500">
                {activeModel === 'flash' ? '1' : '5'} CREDITI
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateAiRoadbook}
            disabled={isGeneratingAi || isGeneratingPdf || aiBlocked}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${hasRoadbook || aiBlocked ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white hover:bg-indigo-50 text-slate-950 shadow-xl active:scale-95'}`}
          >
            {isGeneratingAi ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            {aiBlocked
              ? aiRuntimeStatus.title || 'AI non disponibile'
              : hasRoadbook
                ? 'Roadbook già generato'
                : isGeneratingAi
                  ? 'Generazione in corso...'
                  : 'Genera Logistica AI'}
          </button>
        </div>

        {hasRoadbook && (
          <div className="bg-slate-950 border border-slate-800 rounded-[2rem] p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">
                Riepilogo Viaggio
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <PieChart className="w-4 h-4 text-amber-400" />
                  <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">
                    Esperienze
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    {
                      label: 'Cultura',
                      icon: Landmark,
                      color: 'text-purple-400',
                      count: summary.catCounts.monument,
                    },
                    {
                      label: 'Gusto',
                      icon: Utensils,
                      color: 'text-orange-400',
                      count: summary.catCounts.food,
                    },
                    {
                      label: 'Natura',
                      icon: Sun,
                      color: 'text-emerald-400',
                      count: summary.catCounts.nature,
                    },
                    {
                      label: 'Svago',
                      icon: Music,
                      color: 'text-cyan-400',
                      count: summary.catCounts.leisure,
                    },
                    {
                      label: 'Shopping',
                      icon: ShoppingBag,
                      color: 'text-rose-400',
                      count: summary.catCounts.shopping,
                    },
                  ].map((cat) => (
                    <div
                      key={cat.label}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col items-center gap-1"
                    >
                      <cat.icon className={`w-4 h-4 ${cat.color}`} />
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        {cat.label}
                      </span>
                      <span className="text-lg font-black text-white leading-none">
                        {cat.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Route className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                    Mobilità
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Footprints className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-300">A Piedi</span>
                    </div>
                    <span className="text-sm font-mono font-black text-white">
                      {formatRoadbookDuration(summary.totalWalkingMinutes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-slate-300">Mezzi / Auto</span>
                    </div>
                    <span className="text-sm font-mono font-black text-white">
                      {formatRoadbookDuration(summary.totalTransitMinutes)}
                    </span>
                  </div>
                </div>
                <p className="pt-3 mt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest">
                  Totale spostamenti: <span className="text-white">{summary.totalSegments}</span>
                </p>
              </div>

              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                    Budget Stimato
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Bus className="w-3 h-3 text-blue-400" /> Trasporti
                    </span>
                    <span className="font-mono font-bold text-white">
                      € {summary.totalTransportCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Ticket className="w-3 h-3 text-indigo-400" /> Ingressi
                    </span>
                    <span className="font-mono font-bold text-white">
                      € {summary.totalTicketCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Utensils className="w-3 h-3 text-amber-400" /> Cibo
                    </span>
                    <span className="font-mono font-bold text-white">
                      € {summary.totalFoodCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-3 flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                      Totale generale
                    </span>
                    <span className="text-2xl font-black text-emerald-400">
                      € {summary.totalBudget.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-[7px] text-slate-600 italic text-center mt-3 uppercase font-bold tracking-wider">
                  *Stima approssimativa basata su medie.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGeneratingPdf || isGeneratingAi || !hasRoadbook}
            className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${hasRoadbook ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xl shadow-amber-500/20 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
          >
            {isGeneratingPdf ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Download size={20} />
            )}
            {isGeneratingPdf ? `Export ${progress}%...` : 'Scarica Roadbook PDF'}
          </button>

          {isGeneratingPdf && (
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {!hasRoadbook && (
          <div className="flex items-center gap-2 justify-center text-slate-600">
            <Info size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              Genera prima la logistica AI per attivare il PDF
            </span>
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
